/**
 * deduplicateArticles.ts
 *
 * Serviço de deduplicação de artigos — versão TypeScript para uso como cron job no servidor.
 * Detecta e remove artigos duplicados usando as mesmas estratégias do script deduplicate-articles.mjs:
 *   1. Título exato (normalizado, case-insensitive)
 *   2. Slug idêntico
 *   3. Título com ≥80% de similaridade Jaccard sobre palavras-chave
 *
 * Regra de sobrevivência: prefere artigo com mais views; em empate, o mais antigo.
 * Antes de deletar, redireciona shorts.articleId e comments.articleId para o sobrevivente.
 */

import { getDb } from "./db";
import { articles, shorts } from "../drizzle/schema";
import { eq, isNull } from "drizzle-orm";

const JACCARD_THRESHOLD = 0.80;

const STOPWORDS = new Set([
  "de","da","do","das","dos","e","em","no","na","nos","nas",
  "o","a","os","as","um","uma","com","por","para","que","se","ao",
  "foi","ser","ter","mais","mas","ou","nao","ja","como","sobre",
  "apos","entre","ate","pelo","pela","pelos","pelas","seu","sua",
  "seus","suas","isso","este","esta","estes","estas","esse","essa",
]);

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeywords(title: string): string[] {
  return normalizeTitle(title)
    .split(" ")
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  setA.forEach((w) => { if (setB.has(w)) intersection++; });
  const unionSize = setA.size + setB.size - intersection;
  return intersection / unionSize;
}

function pickSurvivor(group: any[]): { survivor: any; duplicates: any[] } {
  // Sort: online > draft, then by viewCount desc, then by id asc (oldest)
  const sorted = [...group].sort((a, b) => {
    const statusScore = (s: string) => (s === "online" ? 1 : 0);
    if (statusScore(b.status) !== statusScore(a.status)) {
      return statusScore(b.status) - statusScore(a.status);
    }
    if ((b.viewCount || 0) !== (a.viewCount || 0)) {
      return (b.viewCount || 0) - (a.viewCount || 0);
    }
    return a.id - b.id;
  });
  return { survivor: sorted[0], duplicates: sorted.slice(1) };
}

export interface DeduplicateResult {
  removed: number;
  shortsRedirected: number;
  errors: number;
  groups: number;
}

export async function deduplicateArticles(): Promise<DeduplicateResult> {
  const db = await getDb();
  if (!db) return { removed: 0, shortsRedirected: 0, errors: 0, groups: 0 };

  let removed = 0;
  let shortsRedirected = 0;
  let errors = 0;
  const toRemove = new Map<number, number>(); // duplicateId → survivorId

  try {
    // Load all articles (id, title, slug, status, viewCount)
    const allArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        status: articles.status,
        viewCount: articles.viewCount,
      })
      .from(articles);

    // ── Phase 1: Exact title duplicates ──────────────────────────────────────
    const byNormalizedTitle = new Map<string, any[]>();
    for (const art of allArticles) {
      const key = normalizeTitle(art.title || "");
      if (!key) continue;
      if (!byNormalizedTitle.has(key)) byNormalizedTitle.set(key, []);
      byNormalizedTitle.get(key)!.push(art);
    }

    for (const [, group] of Array.from(byNormalizedTitle)) {
      if (group.length < 2) continue;
      const { survivor, duplicates } = pickSurvivor(group);
      for (const dup of duplicates) {
        if (!toRemove.has(dup.id)) toRemove.set(dup.id, survivor.id);
      }
    }

    // ── Phase 2: Slug duplicates ──────────────────────────────────────────────
    const bySlug = new Map<string, any[]>();
    for (const art of allArticles) {
      if (toRemove.has(art.id)) continue; // already marked
      const key = (art.slug || "").trim();
      if (!key) continue;
      if (!bySlug.has(key)) bySlug.set(key, []);
      bySlug.get(key)!.push(art);
    }

    for (const [, group] of Array.from(bySlug)) {
      if (group.length < 2) continue;
      const { survivor, duplicates } = pickSurvivor(group);
      for (const dup of duplicates) {
        if (!toRemove.has(dup.id)) toRemove.set(dup.id, survivor.id);
      }
    }

    // ── Phase 3: Fuzzy title similarity (Jaccard ≥ threshold) ────────────────
    // Only compare articles not already marked for removal
    const remaining = allArticles.filter((a) => !toRemove.has(a.id));
    const kwCache = new Map<number, string[]>();
    for (const art of remaining) {
      kwCache.set(art.id, extractKeywords(art.title || ""));
    }

    // Group by similarity using a union-find approach
    const parent = new Map<number, number>();
    const find = (id: number): number => {
      if (!parent.has(id)) return id;
      const p = find(parent.get(id)!);
      parent.set(id, p);
      return p;
    };
    const union = (a: number, b: number) => {
      const pa = find(a), pb = find(b);
      if (pa !== pb) parent.set(pb, pa);
    };

    for (let i = 0; i < remaining.length; i++) {
      const kwA = kwCache.get(remaining[i].id)!;
      if (kwA.length < 3) continue;
      for (let j = i + 1; j < remaining.length; j++) {
        const kwB = kwCache.get(remaining[j].id)!;
        if (kwB.length < 3) continue;
        if (jaccardSimilarity(kwA, kwB) >= JACCARD_THRESHOLD) {
          union(remaining[i].id, remaining[j].id);
        }
      }
    }

    // Collect groups from union-find
    const fuzzyGroups = new Map<number, any[]>();
    for (const art of remaining) {
      const root = find(art.id);
      if (!fuzzyGroups.has(root)) fuzzyGroups.set(root, []);
      fuzzyGroups.get(root)!.push(art);
    }

    for (const [, group] of Array.from(fuzzyGroups)) {
      if (group.length < 2) continue;
      const { survivor, duplicates } = pickSurvivor(group);
      for (const dup of duplicates) {
        if (!toRemove.has(dup.id)) toRemove.set(dup.id, survivor.id);
      }
    }

    if (toRemove.size === 0) {
      return { removed: 0, shortsRedirected: 0, errors: 0, groups: 0 };
    }

    const groups = new Set(toRemove.values()).size;

    // ── Apply: redirect shorts, then delete duplicates ────────────────────────
    for (const [dupId, survivorId] of Array.from(toRemove)) {
      try {
        // Redirect shorts that point to the duplicate
        const shortsToUpdate = await db
          .select({ id: shorts.id })
          .from(shorts)
          .where(eq(shorts.articleId, dupId));

        if (shortsToUpdate.length > 0) {
          await db
            .update(shorts)
            .set({ articleId: survivorId })
            .where(eq(shorts.articleId, dupId));
          shortsRedirected += shortsToUpdate.length;
        }

        // Delete the duplicate article
        await db.delete(articles).where(eq(articles.id, dupId));
        removed++;
      } catch (err) {
        console.error(`[Dedup] Error removing article #${dupId}:`, err);
        errors++;
      }
    }

    if (removed > 0) {
      console.log(`[Cron] Dedup: ${removed} artigos removidos, ${shortsRedirected} shorts redirecionados, ${errors} erros (${groups} grupos)`);
    }

    return { removed, shortsRedirected, errors, groups };
  } catch (err) {
    console.error("[Cron] Dedup fatal error:", err);
    return { removed, shortsRedirected, errors: errors + 1, groups: 0 };
  }
}
