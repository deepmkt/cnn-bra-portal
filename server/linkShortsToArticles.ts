/**
 * linkShortsToArticles.ts
 *
 * Serviço que vincula automaticamente shorts sem articleId aos seus
 * respectivos artigos no banco de dados.
 *
 * Estratégias de correspondência (em ordem de prioridade):
 *   1. Título exato (normalizado)
 *   2. Título parcial (um contém o outro)
 *   3. URL de imagem idêntica
 *   4. Similaridade fuzzy por palavras-chave (Jaccard ≥ 0.6)
 */

import { eq, isNull, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { shorts, articles } from "../drizzle/schema";

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface ShortRow {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  sourceType: string;
}

interface ArticleRow {
  id: number;
  title: string;
  imageUrl: string | null;
}

interface MatchResult {
  articleId: number;
  method: "exact_title" | "partial_title" | "image_url" | "fuzzy_keywords";
  score: number;
}

export interface LinkShortsResult {
  linked: number;
  skipped: number;
  errors: number;
  details: Array<{
    shortId: number;
    articleId: number;
    method: string;
    score: number;
  }>;
}

// ─── Funções auxiliares ───────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas",
  "o", "a", "os", "as", "um", "uma", "uns", "umas", "com", "por", "para",
  "que", "se", "ao", "à", "é", "são", "foi", "ser", "ter", "mais", "mas",
  "ou", "não", "já", "como", "sobre", "após", "entre", "até", "pelo",
  "pela", "pelos", "pelas", "seu", "sua", "seus", "suas", "isso", "este",
  "esta", "estes", "estas", "esse", "essa", "esses", "essas",
]);

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\sáàâãéèêíïóôõöúüçñ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeywords(title: string): string[] {
  return normalizeTitle(title)
    .split(" ")
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function jaccardSimilarity(wordsA: string[], wordsB: string[]): number {
  if (wordsA.length === 0 || wordsB.length === 0) return 0;
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  const intersection = wordsA.filter((w) => setB.has(w)).length;
  const unionSet = new Set(wordsA);
  wordsB.forEach((w) => unionSet.add(w));
  const union = unionSet.size;
  return union === 0 ? 0 : intersection / union;
}

function findBestMatch(
  short: ShortRow,
  articles: ArticleRow[]
): MatchResult | null {
  const shortTitleNorm = normalizeTitle(short.title);
  const shortKeywords = extractKeywords(short.title);

  let bestMatch: MatchResult | null = null;
  let bestScore = 0;

  for (const article of articles) {
    const articleTitleNorm = normalizeTitle(article.title);
    const articleKeywords = extractKeywords(article.title);

    // Estratégia 1: Título exato
    if (shortTitleNorm === articleTitleNorm) {
      return { articleId: article.id, method: "exact_title", score: 1.0 };
    }

    // Estratégia 2: Título parcial
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

    // Estratégia 3: URL de imagem idêntica
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

    // Estratégia 4: Similaridade fuzzy por palavras-chave
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

// ─── Função principal exportada ───────────────────────────────────────────────

export async function linkShortsToArticles(): Promise<LinkShortsResult> {
  const result: LinkShortsResult = {
    linked: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  try {
    const db = await getDb();
    if (!db) {
      console.warn("[LinkShorts] Banco de dados não disponível, pulando.");
      return result;
    }

    // Buscar shorts sem articleId
    const unlinkedShorts = await db
      .select({
        id: shorts.id,
        title: shorts.title,
        thumbnailUrl: shorts.thumbnailUrl,
        sourceType: shorts.sourceType,
      })
      .from(shorts)
      .where(isNull(shorts.articleId));

    if (unlinkedShorts.length === 0) {
      return result; // Nada a fazer
    }

    // Buscar artigos publicados (apenas os campos necessários)
    const publishedArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        imageUrl: articles.imageUrl,
      })
      .from(articles)
      .where(inArray(articles.status, ["online"]));

    if (publishedArticles.length === 0) {
      result.skipped = unlinkedShorts.length;
      return result;
    }

    // Processar cada short
    for (const short of unlinkedShorts) {
      try {
        const match = findBestMatch(short as ShortRow, publishedArticles as ArticleRow[]);

        if (!match) {
          result.skipped++;
          continue;
        }

        // Atualizar o short com o articleId encontrado
        await db
          .update(shorts)
          .set({ articleId: match.articleId })
          .where(eq(shorts.id, short.id));

        result.linked++;
        result.details.push({
          shortId: short.id,
          articleId: match.articleId,
          method: match.method,
          score: Math.round(match.score * 100) / 100,
        });
      } catch (err) {
        console.error(`[LinkShorts] Erro ao vincular short #${short.id}:`, err);
        result.errors++;
      }
    }
  } catch (err) {
    console.error("[LinkShorts] Erro geral:", err);
    result.errors++;
  }

  return result;
}
