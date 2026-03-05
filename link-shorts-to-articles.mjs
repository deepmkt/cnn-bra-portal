/**
 * link-shorts-to-articles.mjs
 *
 * Script de migração que vincula shorts existentes sem articleId
 * aos seus respectivos artigos no banco de dados.
 *
 * Estratégias de correspondência (em ordem de prioridade):
 *   1. Correspondência exata de título (short.title === article.title)
 *   2. Correspondência parcial de título (short.title contido no article.title ou vice-versa)
 *   3. Correspondência por URL de imagem (short.thumbnailUrl === article.imageUrl)
 *   4. Correspondência fuzzy por palavras-chave do título (≥ 60% das palavras em comum)
 *
 * Uso:
 *   node link-shorts-to-articles.mjs [--dry-run] [--verbose]
 *
 * Flags:
 *   --dry-run   Simula as atualizações sem gravar no banco
 *   --verbose   Exibe detalhes de cada correspondência encontrada
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Carregar variáveis de ambiente
try {
  require("dotenv").config();
} catch (e) {
  // dotenv pode não estar disponível, prosseguir com process.env
}

const isDryRun = process.argv.includes("--dry-run");
const isVerbose = process.argv.includes("--verbose");

// ─── Conexão com o banco ─────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL não encontrada. Abortando.");
  process.exit(1);
}

// Usar mysql2 diretamente para evitar dependências do TypeScript
const mysql = require("mysql2/promise");

const connection = await mysql.createConnection(DATABASE_URL);
console.log("✅  Conectado ao banco de dados.");

// ─── Funções auxiliares ───────────────────────────────────────────────────────

/**
 * Normaliza um título para comparação: minúsculas, sem pontuação, sem espaços extras.
 */
function normalizeTitle(title) {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^\w\sáàâãéèêíïóôõöúüçñ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrai palavras significativas de um título (remove stopwords comuns).
 */
const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas",
  "o", "a", "os", "as", "um", "uma", "uns", "umas", "com", "por", "para",
  "que", "se", "ao", "à", "é", "são", "foi", "ser", "ter", "mais", "mas",
  "ou", "não", "já", "como", "sobre", "após", "entre", "até", "pelo",
  "pela", "pelos", "pelas", "seu", "sua", "seus", "suas", "isso", "este",
  "esta", "estes", "estas", "esse", "essa", "esses", "essas",
]);

function extractKeywords(title) {
  return normalizeTitle(title)
    .split(" ")
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Calcula a similaridade de Jaccard entre dois conjuntos de palavras.
 * Retorna um valor entre 0 (nenhuma palavra em comum) e 1 (idênticos).
 */
function jaccardSimilarity(wordsA, wordsB) {
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Tenta encontrar o melhor artigo correspondente para um short.
 * Retorna { articleId, method, score } ou null se nenhuma correspondência for encontrada.
 */
function findBestMatch(short, articles) {
  const shortTitleNorm = normalizeTitle(short.title);
  const shortKeywords = extractKeywords(short.title);

  let bestMatch = null;
  let bestScore = 0;

  for (const article of articles) {
    const articleTitleNorm = normalizeTitle(article.title);
    const articleKeywords = extractKeywords(article.title);

    // Estratégia 1: Correspondência exata de título
    if (shortTitleNorm === articleTitleNorm) {
      return { articleId: article.id, method: "exact_title", score: 1.0 };
    }

    // Estratégia 2: Correspondência parcial (um contém o outro)
    if (
      shortTitleNorm.length > 10 &&
      articleTitleNorm.length > 10 &&
      (articleTitleNorm.includes(shortTitleNorm) ||
        shortTitleNorm.includes(articleTitleNorm))
    ) {
      const score = 0.9;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { articleId: article.id, method: "partial_title", score };
      }
      continue;
    }

    // Estratégia 3: Correspondência por URL de imagem
    if (
      short.thumbnailUrl &&
      article.imageUrl &&
      short.thumbnailUrl.length > 10 &&
      short.thumbnailUrl === article.imageUrl
    ) {
      const score = 0.85;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { articleId: article.id, method: "image_url", score };
      }
      continue;
    }

    // Estratégia 4: Similaridade fuzzy por palavras-chave (Jaccard ≥ 0.6)
    if (shortKeywords.length >= 3 && articleKeywords.length >= 3) {
      const similarity = jaccardSimilarity(shortKeywords, articleKeywords);
      if (similarity >= 0.6 && similarity > bestScore) {
        bestScore = similarity;
        bestMatch = {
          articleId: article.id,
          method: "fuzzy_keywords",
          score: similarity,
        };
      }
    }
  }

  return bestMatch;
}

// ─── Execução principal ───────────────────────────────────────────────────────

console.log(isDryRun ? "\n🔍  MODO DRY-RUN (nenhuma alteração será gravada)\n" : "\n🚀  Iniciando vinculação de shorts a artigos...\n");

// Buscar todos os shorts sem articleId
const [shortsRows] = await connection.execute(
  "SELECT id, title, thumbnailUrl, videoUrl, sourceType FROM shorts WHERE articleId IS NULL ORDER BY createdAt DESC"
);

// Buscar todos os artigos publicados
const [articlesRows] = await connection.execute(
  "SELECT id, title, imageUrl, status FROM articles WHERE status IN ('published', 'online') ORDER BY createdAt DESC"
);

console.log(`📊  Shorts sem vínculo: ${shortsRows.length}`);
console.log(`📰  Artigos disponíveis: ${articlesRows.length}\n`);

if (shortsRows.length === 0) {
  console.log("✅  Todos os shorts já estão vinculados a artigos!");
  await connection.end();
  process.exit(0);
}

// Processar cada short
const results = {
  exact_title: [],
  partial_title: [],
  image_url: [],
  fuzzy_keywords: [],
  no_match: [],
};

for (const short of shortsRows) {
  const match = findBestMatch(short, articlesRows);

  if (match) {
    results[match.method].push({ short, match });

    if (isVerbose) {
      console.log(
        `  ✓ [${match.method.toUpperCase()}] (score: ${match.score.toFixed(2)})`
      );
      console.log(`    Short #${short.id}: "${short.title.substring(0, 60)}..."`);
      const article = articlesRows.find((a) => a.id === match.articleId);
      console.log(
        `    Artigo #${match.articleId}: "${article?.title?.substring(0, 60)}..."\n`
      );
    }
  } else {
    results.no_match.push(short);
    if (isVerbose) {
      console.log(`  ✗ [SEM CORRESPONDÊNCIA] Short #${short.id}: "${short.title.substring(0, 70)}"`);
    }
  }
}

// Resumo antes de aplicar
const totalMatched =
  results.exact_title.length +
  results.partial_title.length +
  results.image_url.length +
  results.fuzzy_keywords.length;

console.log("─".repeat(60));
console.log("📋  RESUMO DE CORRESPONDÊNCIAS:");
console.log(`   Título exato:      ${results.exact_title.length} shorts`);
console.log(`   Título parcial:    ${results.partial_title.length} shorts`);
console.log(`   URL de imagem:     ${results.image_url.length} shorts`);
console.log(`   Palavras-chave:    ${results.fuzzy_keywords.length} shorts`);
console.log(`   Sem correspondência: ${results.no_match.length} shorts`);
console.log(`   ─────────────────────────────`);
console.log(`   Total a vincular:  ${totalMatched} de ${shortsRows.length} shorts`);
console.log("─".repeat(60));

if (totalMatched === 0) {
  console.log("\n⚠️  Nenhuma correspondência encontrada. Verifique os dados.");
  await connection.end();
  process.exit(0);
}

if (!isDryRun) {
  console.log("\n💾  Aplicando atualizações no banco de dados...");

  let updated = 0;
  let errors = 0;

  const allMatches = [
    ...results.exact_title,
    ...results.partial_title,
    ...results.image_url,
    ...results.fuzzy_keywords,
  ];

  for (const { short, match } of allMatches) {
    try {
      await connection.execute(
        "UPDATE shorts SET articleId = ?, sourceType = CASE WHEN sourceType = 'manual' THEN 'article' ELSE sourceType END WHERE id = ? AND articleId IS NULL",
        [match.articleId, short.id]
      );
      updated++;
    } catch (err) {
      console.error(`  ❌ Erro ao atualizar short #${short.id}:`, err.message);
      errors++;
    }
  }

  console.log(`\n✅  Atualizações concluídas: ${updated} shorts vinculados, ${errors} erros.`);

  // Verificação final
  const [afterRows] = await connection.execute(
    "SELECT COUNT(*) as remaining FROM shorts WHERE articleId IS NULL"
  );
  console.log(`📊  Shorts ainda sem vínculo: ${afterRows[0].remaining}`);
} else {
  console.log("\n⚠️  Dry-run: nenhuma alteração foi gravada.");
  console.log("    Execute sem --dry-run para aplicar as mudanças.");
}

// Listar shorts sem correspondência para revisão manual
if (results.no_match.length > 0) {
  console.log(`\n📝  Shorts sem correspondência (revisão manual necessária):`);
  for (const short of results.no_match) {
    console.log(`   #${short.id} [${short.sourceType}]: "${short.title.substring(0, 80)}"`);
  }
}

await connection.end();
console.log("\n✅  Script finalizado.");
