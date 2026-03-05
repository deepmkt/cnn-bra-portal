/**
 * deduplicate-articles.mjs
 *
 * Script de deduplicação de artigos do banco de dados CNN BRA.
 *
 * Detecta duplicatas por:
 *   1. Título exato (normalizado, case-insensitive)
 *   2. Slug idêntico
 *   3. Título com 80%+ de similaridade (Jaccard sobre palavras-chave)
 *   4. Artigos com título "Rascunho automático" ou similares
 *
 * Regra de sobrevivência (qual manter):
 *   - Prefere o artigo com mais viewCount
 *   - Em empate, prefere o mais antigo (menor id)
 *   - Artigos com status "online" têm prioridade sobre "draft"
 *
 * Antes de deletar, redireciona referências:
 *   - shorts.articleId → aponta para o artigo sobrevivente
 *   - comments.articleId → aponta para o artigo sobrevivente
 *
 * Uso:
 *   node deduplicate-articles.mjs [--dry-run] [--verbose] [--threshold=0.8]
 *
 * Flags:
 *   --dry-run          Simula sem gravar no banco
 *   --verbose          Exibe cada grupo de duplicatas encontrado
 *   --threshold=0.X    Limiar de similaridade Jaccard (padrão: 0.80)
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
try { require("dotenv").config(); } catch (e) {}

const isDryRun = process.argv.includes("--dry-run");
const isVerbose = process.argv.includes("--verbose");
const thresholdArg = process.argv.find((a) => a.startsWith("--threshold="));
const JACCARD_THRESHOLD = thresholdArg ? parseFloat(thresholdArg.split("=")[1]) : 0.80;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL não encontrada. Abortando.");
  process.exit(1);
}

const mysql = require("mysql2/promise");
const conn = await mysql.createConnection(DATABASE_URL);
console.log("✅  Conectado ao banco de dados.");
console.log(isDryRun ? "🔍  MODO DRY-RUN (nenhuma alteração será gravada)\n" : "🚀  Iniciando deduplicação de artigos...\n");

// ─── Funções auxiliares ───────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "de","da","do","das","dos","e","em","no","na","nos","nas","o","a","os","as",
  "um","uma","uns","umas","com","por","para","que","se","ao","à","é","são",
  "foi","ser","ter","mais","mas","ou","não","já","como","sobre","após","entre",
  "até","pelo","pela","pelos","pelas","seu","sua","seus","suas","isso","este",
  "esta","estes","estas","esse","essa","esses","essas","após","desde","durante",
]);

function normalizeTitle(title) {
  return (title || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeywords(title) {
  return normalizeTitle(title)
    .split(" ")
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function jaccardSimilarity(wordsA, wordsB) {
  if (!wordsA.length || !wordsB.length) return 0;
  const setB = new Set(wordsB);
  const intersection = wordsA.filter((w) => setB.has(w)).length;
  const unionSet = new Set(wordsA);
  wordsB.forEach((w) => unionSet.add(w));
  return intersection / unionSet.size;
}

/** Escolhe qual artigo manter dentro de um grupo de duplicatas */
function pickSurvivor(group) {
  return group.sort((a, b) => {
    // 1. Prefere status "online"
    const aOnline = a.status === "online" ? 1 : 0;
    const bOnline = b.status === "online" ? 1 : 0;
    if (bOnline !== aOnline) return bOnline - aOnline;
    // 2. Prefere mais views
    if ((b.viewCount || 0) !== (a.viewCount || 0)) return (b.viewCount || 0) - (a.viewCount || 0);
    // 3. Prefere mais antigo (menor id)
    return a.id - b.id;
  })[0];
}

// ─── Buscar todos os artigos ──────────────────────────────────────────────────

console.log("📥  Carregando artigos do banco...");
const [rows] = await conn.execute(
  "SELECT id, title, slug, status, viewCount, createdAt FROM articles ORDER BY id ASC"
);
console.log(`📊  Total de artigos: ${rows.length}\n`);

// ─── Fase 1: Duplicatas por título exato ─────────────────────────────────────

const titleMap = new Map(); // normalizedTitle → [articles]
for (const row of rows) {
  const key = normalizeTitle(row.title);
  if (!titleMap.has(key)) titleMap.set(key, []);
  titleMap.get(key).push(row);
}

const exactGroups = [...titleMap.values()].filter((g) => g.length > 1);
console.log(`🔍  Fase 1 — Títulos exatos duplicados: ${exactGroups.length} grupos`);

// ─── Fase 2: Duplicatas por slug ─────────────────────────────────────────────

const slugMap = new Map();
for (const row of rows) {
  if (!row.slug) continue;
  if (!slugMap.has(row.slug)) slugMap.set(row.slug, []);
  slugMap.get(row.slug).push(row);
}
const slugGroups = [...slugMap.values()].filter((g) => g.length > 1);
console.log(`🔍  Fase 2 — Slugs duplicados: ${slugGroups.length} grupos`);

// ─── Fase 3: Duplicatas por similaridade fuzzy ───────────────────────────────

// Construir índice de palavras-chave
const keywordsIndex = rows.map((r) => ({
  ...r,
  keywords: extractKeywords(r.title),
}));

// Agrupar por similaridade (O(n²) mas com early exit)
const visited = new Set();
const fuzzyGroups = [];

for (let i = 0; i < keywordsIndex.length; i++) {
  if (visited.has(keywordsIndex[i].id)) continue;
  const group = [keywordsIndex[i]];
  for (let j = i + 1; j < keywordsIndex.length; j++) {
    if (visited.has(keywordsIndex[j].id)) continue;
    if (keywordsIndex[i].keywords.length < 3 || keywordsIndex[j].keywords.length < 3) continue;
    const sim = jaccardSimilarity(keywordsIndex[i].keywords, keywordsIndex[j].keywords);
    if (sim >= JACCARD_THRESHOLD) {
      group.push(keywordsIndex[j]);
      visited.add(keywordsIndex[j].id);
    }
  }
  if (group.length > 1) {
    visited.add(keywordsIndex[i].id);
    fuzzyGroups.push(group);
  }
}
console.log(`🔍  Fase 3 — Similaridade fuzzy (≥${JACCARD_THRESHOLD * 100}%): ${fuzzyGroups.length} grupos`);

// ─── Fase 4: Artigos lixo (título genérico/vazio) ────────────────────────────

const JUNK_TITLES = ["rascunho automatico", "rascunho", "sem titulo", "untitled", "draft", "novo artigo", "test", "teste"];
const junkArticles = rows.filter((r) => {
  const norm = normalizeTitle(r.title);
  return JUNK_TITLES.some((j) => norm === j || norm.startsWith(j + " "));
});
console.log(`🔍  Fase 4 — Artigos com título genérico/lixo: ${junkArticles.length}`);

// ─── Consolidar todos os grupos ───────────────────────────────────────────────

// Unificar grupos que compartilham artigos (union-find simplificado)
const idToGroup = new Map();
const allGroups = [...exactGroups, ...slugGroups, ...fuzzyGroups];

for (const group of allGroups) {
  // Verificar se algum membro já pertence a um grupo existente
  let existingGroupId = null;
  for (const article of group) {
    if (idToGroup.has(article.id)) {
      existingGroupId = idToGroup.get(article.id);
      break;
    }
  }
  if (existingGroupId !== null) {
    // Mesclar com grupo existente
    const existing = allGroups[existingGroupId] || group;
    const merged = [...new Map([...existing, ...group].map((a) => [a.id, a])).values()];
    for (const a of merged) idToGroup.set(a.id, existingGroupId);
  } else {
    const gid = allGroups.indexOf(group);
    for (const a of group) idToGroup.set(a.id, gid);
  }
}

// Reconstruir grupos únicos
const groupsMap = new Map();
for (const [id, gid] of idToGroup.entries()) {
  if (!groupsMap.has(gid)) groupsMap.set(gid, []);
  const article = rows.find((r) => r.id === id);
  if (article && !groupsMap.get(gid).find((a) => a.id === id)) {
    groupsMap.get(gid).push(article);
  }
}
const consolidatedGroups = [...groupsMap.values()].filter((g) => g.length > 1);

// ─── Calcular o que será removido ────────────────────────────────────────────

const toDelete = []; // { id, survivorId, reason }
const toDeleteJunk = junkArticles.map((a) => ({ id: a.id, survivorId: null, reason: "junk_title" }));

for (const group of consolidatedGroups) {
  const survivor = pickSurvivor([...group]);
  const duplicates = group.filter((a) => a.id !== survivor.id);
  for (const dup of duplicates) {
    toDelete.push({ id: dup.id, survivorId: survivor.id, reason: "duplicate" });
  }
  if (isVerbose) {
    console.log(`\n  📋 Grupo (${group.length} artigos) → manter #${survivor.id}:`);
    for (const a of group) {
      const marker = a.id === survivor.id ? "✅ MANTER" : "❌ REMOVER";
      console.log(`     ${marker} #${a.id} [${a.status}] views:${a.viewCount || 0} "${(a.title || "").substring(0, 70)}"`);
    }
  }
}

// Remover junk apenas se não estiver no grupo de sobreviventes
const survivorIds = new Set(consolidatedGroups.map((g) => pickSurvivor([...g]).id));
const junkToDelete = toDeleteJunk.filter((j) => !survivorIds.has(j.id) && !toDelete.find((d) => d.id === j.id));

const allToDelete = [...toDelete, ...junkToDelete];
const uniqueToDelete = [...new Map(allToDelete.map((d) => [d.id, d])).values()];

// ─── Resumo ───────────────────────────────────────────────────────────────────

console.log("\n" + "─".repeat(60));
console.log("📋  RESUMO:");
console.log(`   Artigos totais:          ${rows.length}`);
console.log(`   Grupos de duplicatas:    ${consolidatedGroups.length}`);
console.log(`   Artigos lixo (título):   ${junkToDelete.length}`);
console.log(`   Total a remover:         ${uniqueToDelete.length}`);
console.log(`   Artigos após limpeza:    ${rows.length - uniqueToDelete.length}`);
console.log("─".repeat(60));

if (uniqueToDelete.length === 0) {
  console.log("\n✅  Nenhuma duplicata encontrada! Base de dados limpa.");
  await conn.end();
  process.exit(0);
}

// ─── Aplicar remoção ─────────────────────────────────────────────────────────

if (!isDryRun) {
  console.log("\n💾  Aplicando remoção no banco de dados...");

  let deleted = 0;
  let redirected = 0;
  let errors = 0;

  for (const item of uniqueToDelete) {
    try {
      // Redirecionar shorts que apontam para o artigo duplicado
      if (item.survivorId) {
        const [shortRes] = await conn.execute(
          "UPDATE shorts SET articleId = ? WHERE articleId = ?",
          [item.survivorId, item.id]
        );
        redirected += shortRes.affectedRows || 0;

        // Redirecionar comentários
        await conn.execute(
          "UPDATE comments SET articleId = ? WHERE articleId = ?",
          [item.survivorId, item.id]
        );
      }

      // Deletar referências dependentes sem survivorId
      await conn.execute("DELETE FROM shorts WHERE articleId = ? AND ? IS NULL", [item.id, item.survivorId]);
      await conn.execute("DELETE FROM comments WHERE articleId = ? AND ? IS NULL", [item.id, item.survivorId]);
      await conn.execute("DELETE FROM article_revisions WHERE articleId = ? LIMIT 50", [item.id]).catch(() => {});
      await conn.execute("DELETE FROM reading_history WHERE articleId = ? LIMIT 200", [item.id]).catch(() => {});
      await conn.execute("DELETE FROM user_article_interactions WHERE articleId = ? LIMIT 200", [item.id]).catch(() => {});
      await conn.execute("DELETE FROM article_similarity WHERE articleId = ? OR similarArticleId = ?", [item.id, item.id]).catch(() => {});

      // Deletar o artigo duplicado
      await conn.execute("DELETE FROM articles WHERE id = ?", [item.id]);
      deleted++;

      if (isVerbose) {
        console.log(`  ✓ Removido #${item.id} [${item.reason}]${item.survivorId ? ` → sobrevivente #${item.survivorId}` : ""}`);
      }
    } catch (err) {
      console.error(`  ❌ Erro ao remover artigo #${item.id}:`, err.message);
      errors++;
    }
  }

  console.log(`\n✅  Remoção concluída:`);
  console.log(`   Artigos removidos:  ${deleted}`);
  console.log(`   Shorts redirecionados: ${redirected}`);
  console.log(`   Erros:              ${errors}`);

  // Verificação final
  const [afterRows] = await conn.execute("SELECT COUNT(*) as total FROM articles");
  console.log(`📊  Artigos restantes no banco: ${afterRows[0].total}`);
} else {
  console.log("\n⚠️  Dry-run: nenhuma alteração foi gravada.");
  console.log("    Execute sem --dry-run para aplicar as mudanças.");

  if (uniqueToDelete.length > 0 && !isVerbose) {
    console.log("\n📝  Primeiros 20 artigos a remover:");
    for (const item of uniqueToDelete.slice(0, 20)) {
      const article = rows.find((r) => r.id === item.id);
      console.log(`   #${item.id} [${item.reason}]: "${(article?.title || "").substring(0, 70)}"`);
    }
    if (uniqueToDelete.length > 20) {
      console.log(`   ... e mais ${uniqueToDelete.length - 20} artigos. Use --verbose para ver todos.`);
    }
  }
}

await conn.end();
console.log("\n✅  Script finalizado.");
