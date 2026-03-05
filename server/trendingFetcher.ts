/**
 * trendingFetcher.ts
 *
 * Serviço que busca os tópicos em alta do Google Trends Brasil via RSS,
 * salva na tabela trending_topics e opcionalmente publica artigos sobre eles.
 *
 * RSS: https://trends.google.com/trending/rss?geo=BR
 *
 * Campos extraídos por item:
 *   - title: tópico em alta (ex: "predio desaba em bh")
 *   - ht:approx_traffic: tráfego aproximado (ex: "200+", "50K+")
 *   - ht:picture: URL da imagem do tópico
 *   - ht:picture_source: fonte da imagem
 *   - ht:news_item: primeira notícia relacionada (título, URL, fonte)
 *   - pubDate: data/hora do trending
 */

import { getDb } from "./db";
import { trendingTopics, articles } from "../drizzle/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";

const TRENDS_RSS_URL = "https://trends.google.com/trending/rss?geo=BR";
const MAX_TOPICS_PER_FETCH = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTrafficValue(traffic: string): number {
  if (!traffic) return 0;
  const clean = traffic.replace(/[^0-9KMk+]/g, "").toUpperCase();
  if (clean.includes("M")) return parseInt(clean) * 1_000_000;
  if (clean.includes("K")) return parseInt(clean) * 1_000;
  return parseInt(clean) || 0;
}

function extractTagValue(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  return (m?.[1] || m?.[2] || "").trim();
}

function extractAllTagValues(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "gi");
  const results: string[] = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    const val = m[1].trim();
    if (val) results.push(val);
  }
  return results;
}

interface TrendItem {
  topic: string;
  approxTraffic: string;
  trafficValue: number;
  imageUrl: string;
  imageSource: string;
  relatedArticleTitle: string;
  relatedArticleUrl: string;
  relatedArticleSource: string;
  pubDate: Date | null;
}

async function fetchTrendsRSS(): Promise<TrendItem[]> {
  const resp = await fetch(TRENDS_RSS_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; CNNBRABot/1.0)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!resp.ok) throw new Error(`Trends RSS HTTP ${resp.status}`);
  const xml = await resp.text();

  // Split into <item> blocks
  const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];
  const items: TrendItem[] = [];

  for (const block of itemBlocks.slice(0, MAX_TOPICS_PER_FETCH)) {
    const topic = extractTagValue(block, "title");
    if (!topic) continue;

    const approxTraffic = extractTagValue(block, "ht:approx_traffic");
    const imageUrl = extractTagValue(block, "ht:picture");
    const imageSource = extractTagValue(block, "ht:picture_source");

    // Extract first news item
    const newsItemBlock = block.match(/<ht:news_item>([\s\S]*?)<\/ht:news_item>/i)?.[0] || "";
    const relatedArticleTitle = extractTagValue(newsItemBlock, "ht:news_item_title");
    const relatedArticleUrl = extractTagValue(newsItemBlock, "ht:news_item_url");
    const relatedArticleSource = extractTagValue(newsItemBlock, "ht:news_item_source");

    const pubDateStr = extractTagValue(block, "pubDate");
    const pubDate = pubDateStr ? new Date(pubDateStr) : null;

    items.push({
      topic,
      approxTraffic,
      trafficValue: parseTrafficValue(approxTraffic),
      imageUrl,
      imageSource,
      relatedArticleTitle,
      relatedArticleUrl,
      relatedArticleSource,
      pubDate,
    });
  }

  return items;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export interface TrendingFetchResult {
  saved: number;
  skipped: number;
  articlesPublished: number;
  errors: number;
}

export async function fetchAndSaveTrending(publishArticles = true): Promise<TrendingFetchResult> {
  const db = await getDb();
  if (!db) return { saved: 0, skipped: 0, articlesPublished: 0, errors: 0 };

  let saved = 0, skipped = 0, articlesPublished = 0, errors = 0;

  try {
    const items = await fetchTrendsRSS();
    if (items.length === 0) return { saved, skipped, articlesPublished, errors };

    // Load existing topics from last 24h to avoid duplicates
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await db
      .select({ topicNormalized: trendingTopics.topicNormalized })
      .from(trendingTopics)
      .where(gte(trendingTopics.fetchedAt, oneDayAgo));
    const existingSet = new Set(existing.map((e) => e.topicNormalized));

    for (const item of items) {
      const normalized = normalizeText(item.topic);
      if (existingSet.has(normalized)) {
        skipped++;
        continue;
      }

      try {
        // Insert trending topic
        const result = await db.insert(trendingTopics).values({
          topic: item.topic,
          topicNormalized: normalized,
          approxTraffic: item.approxTraffic,
          trafficValue: item.trafficValue,
          imageUrl: item.imageUrl || null,
          imageSource: item.imageSource || null,
          relatedArticleTitle: item.relatedArticleTitle || null,
          relatedArticleUrl: item.relatedArticleUrl || null,
          relatedArticleSource: item.relatedArticleSource || null,
          pubDate: item.pubDate,
          fetchedAt: new Date(),
        });

        const trendId = (result as any)[0]?.insertId;
        saved++;
        existingSet.add(normalized);

        // Optionally publish an article about this trending topic
        if (publishArticles && item.relatedArticleTitle && item.trafficValue >= 200) {
          const articleId = await publishTrendingArticle(item, trendId);
          if (articleId) {
            articlesPublished++;
            // Link the trending topic to the article
            await db
              .update(trendingTopics)
              .set({ linkedArticleId: articleId })
              .where(eq(trendingTopics.id, trendId));
          }
        }
      } catch (err) {
        console.error(`[Trends] Error saving topic "${item.topic}":`, err);
        errors++;
      }
    }

    if (saved > 0) {
      console.log(`[Trends] ${saved} tópicos salvos, ${skipped} ignorados, ${articlesPublished} artigos publicados`);
    }
  } catch (err) {
    console.error("[Trends] Fatal error:", err);
    errors++;
  }

  return { saved, skipped, articlesPublished, errors };
}

// ─── Publish article about trending topic ────────────────────────────────────

async function publishTrendingArticle(item: TrendItem, trendId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Check if we already have an article about this topic (last 48h)
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const existing = await db
      .select({ id: articles.id })
      .from(articles)
      .where(
        and(
          gte(articles.createdAt, twoDaysAgo),
          eq(articles.tags, `trending,${normalizeText(item.topic).replace(/\s+/g, "-")}`)
        )
      )
      .limit(1);
    if (existing.length > 0) return null;

    // Generate article with AI
    const prompt = `Você é um jornalista brasileiro. Escreva uma notícia completa sobre o assunto em alta no Google Trends Brasil: "${item.topic}".

Contexto: ${item.relatedArticleTitle || "Assunto em alta no Brasil"}
Fonte de referência: ${item.relatedArticleSource || "Google Trends"}

Escreva em português brasileiro, tom jornalístico, objetivo e informativo.
Retorne JSON com:
{
  "title": "Título da notícia (máx 100 chars, sentence case)",
  "excerpt": "Resumo em 2 frases (máx 200 chars)",
  "content": "Corpo completo da notícia em HTML com parágrafos <p>. Mínimo 4 parágrafos.",
  "category": "Uma de: POLÍTICA, ECONOMIA, ESPORTES, TECNOLOGIA, SAÚDE, ENTRETENIMENTO, MUNDO, BRASIL",
  "tags": "trending,tag1,tag2,tag3"
}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Você é um jornalista brasileiro experiente. Retorne apenas JSON válido." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "trending_article",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              excerpt: { type: "string" },
              content: { type: "string" },
              category: { type: "string" },
              tags: { type: "string" },
            },
            required: ["title", "excerpt", "content", "category", "tags"],
            additionalProperties: false,
          },
        },
      },
    });

    const raw = response?.choices?.[0]?.message?.content;
    if (!raw) return null;

    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!data.title || !data.content) return null;

    // Create slug
    const slug = data.title
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 80) + "-" + nanoid(6);

    // Use trending image if available and valid
    let finalImageUrl: string | null = null;
    if (item.imageUrl) {
      try {
        const imgResp = await fetch(item.imageUrl, { method: "HEAD", signal: AbortSignal.timeout(5_000) });
        if (imgResp.ok) finalImageUrl = item.imageUrl;
      } catch {}
    }

    // Skip if no image (policy: no article without image)
    if (!finalImageUrl) return null;

    const sourceTag = item.relatedArticleSource
      ? `\n<p class="text-sm text-gray-500 mt-6 pt-4 border-t border-gray-200"><strong>Fonte:</strong> <a href="${item.relatedArticleUrl || "#"}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${item.relatedArticleSource}</a> · Google Trends Brasil</p>`
      : "";

    const result = await db.insert(articles).values({
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content + sourceTag,
      category: data.category || "BRASIL",
      tags: `trending,${normalizeText(item.topic).replace(/\s+/g, "-")},${data.tags || ""}`,
      imageUrl: finalImageUrl,
      status: "online",
      isHero: false,
      isFeatured: false,
      isBreaking: false,
      publishedAt: new Date(),
    });

    const insertId = (result as any)[0]?.insertId;
    console.log(`[Trends] Artigo publicado: "${data.title}" (id: ${insertId})`);
    return insertId || null;
  } catch (err) {
    console.error(`[Trends] Error publishing article for "${item.topic}":`, err);
    return null;
  }
}

// ─── Query helpers ────────────────────────────────────────────────────────────

export async function getLatestTrending(limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return db
    .select()
    .from(trendingTopics)
    .where(gte(trendingTopics.fetchedAt, oneDayAgo))
    .orderBy(desc(trendingTopics.trafficValue), desc(trendingTopics.fetchedAt))
    .limit(limit);
}
