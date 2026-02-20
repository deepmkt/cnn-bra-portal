/**
 * Global News Auto-Fetcher
 * Fetches top international news from Google News RSS,
 * scrapes full content + images, rewrites via LLM,
 * and publishes automatically to the GLOBAL category.
 */
import RSSParser from "rss-parser";
import * as cheerio from "cheerio";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { articles, globalNewsCache } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const parser = new RSSParser();

// Google News RSS feeds for international news in Portuguese
const RSS_FEEDS = [
  "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FuQjBHZ0pDVWlnQVAB?hl=pt-BR&gl=BR&ceid=BR:pt-419",  // Top stories
  "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FuQjBHZ0pDVWlnQVAB?hl=pt-BR&gl=BR&ceid=BR:pt-419",  // World
  "https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419",  // General top news
];

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

interface ScrapedArticle {
  title: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  source: string;
  sourceUrl: string;
  publishedAt: Date;
}

/**
 * Fetch and follow Google News redirect to get the real article URL
 */
async function resolveGoogleNewsUrl(googleUrl: string): Promise<string> {
  try {
    const response = await fetch(googleUrl, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    return response.url || googleUrl;
  } catch {
    return googleUrl;
  }
}

/**
 * Scrape article content, images, and videos from a URL
 */
async function scrapeArticle(url: string): Promise<{ content: string; imageUrl: string | null; videoUrl: string | null }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return { content: "", imageUrl: null, videoUrl: null };

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $("script, style, nav, footer, header, aside, .ads, .advertisement, .social-share, .comments, iframe[src*='ads']").remove();

    // Extract main image
    let imageUrl: string | null = null;
    const ogImage = $('meta[property="og:image"]').attr("content");
    const twitterImage = $('meta[name="twitter:image"]').attr("content");
    const firstArticleImg = $("article img, .article-body img, .post-content img, main img").first().attr("src");
    imageUrl = ogImage || twitterImage || firstArticleImg || null;

    // Make relative URLs absolute
    if (imageUrl && !imageUrl.startsWith("http")) {
      try {
        imageUrl = new URL(imageUrl, url).href;
      } catch { imageUrl = null; }
    }

    // Extract video
    let videoUrl: string | null = null;
    const ogVideo = $('meta[property="og:video"]').attr("content");
    const videoSrc = $("video source").first().attr("src") || $("video").first().attr("src");
    videoUrl = ogVideo || videoSrc || null;
    if (videoUrl && !videoUrl.startsWith("http")) {
      try {
        videoUrl = new URL(videoUrl, url).href;
      } catch { videoUrl = null; }
    }

    // Extract article content
    const selectors = [
      "article .article-body", "article .post-content", "article .entry-content",
      ".article-body", ".post-content", ".entry-content", ".story-body",
      "[itemprop='articleBody']", ".materia-conteudo", ".content-text",
      "article p", "main p",
    ];

    let content = "";
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        content = elements.map((_, el) => $(el).text().trim()).get().join("\n\n");
        if (content.length > 200) break;
      }
    }

    // Fallback: get all paragraphs
    if (content.length < 200) {
      content = $("p").map((_, el) => $(el).text().trim()).get()
        .filter(t => t.length > 40)
        .slice(0, 15)
        .join("\n\n");
    }

    return { content: content.slice(0, 5000), imageUrl, videoUrl };
  } catch (err) {
    console.error(`[GlobalNews] Scrape error for ${url}:`, err);
    return { content: "", imageUrl: null, videoUrl: null };
  }
}

/**
 * Download an image and upload to S3
 */
async function uploadImageToS3(imageUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(imageUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const key = `global-news/${nanoid(12)}.${ext}`;

    const { url } = await storagePut(key, buffer, contentType);
    return url;
  } catch (err) {
    console.error(`[GlobalNews] Image upload error:`, err);
    return null;
  }
}

/**
 * Rewrite article content using LLM
 */
async function rewriteWithAI(title: string, content: string, source: string, sourceUrl: string): Promise<{ title: string; excerpt: string; content: string } | null> {
  try {
    const prompt = `Você é um jornalista do portal CNN BRA. Reescreva a seguinte notícia de forma autoral, profissional e em português brasileiro. 
Mantenha a fidelidade aos fatos, mas use suas próprias palavras. O texto deve ser informativo, claro e envolvente.

REGRAS:
1. Reescreva o título de forma atraente e jornalística
2. Crie um excerpt/resumo de 1-2 frases
3. Reescreva o conteúdo completo em 3-6 parágrafos
4. NO FINAL do conteúdo, SEMPRE adicione: "Fonte: [nome da fonte](URL da fonte)"
5. NÃO copie o texto original, reescreva com suas palavras
6. Use linguagem jornalística profissional brasileira
7. Mantenha os fatos e dados precisos

NOTÍCIA ORIGINAL:
Título: ${title}
Fonte: ${source} (${sourceUrl})
Conteúdo: ${content}

Responda APENAS em JSON com este formato exato:
{
  "title": "título reescrito",
  "excerpt": "resumo de 1-2 frases",
  "content": "conteúdo reescrito completo em HTML com <p> tags, incluindo fonte no final"
}`;

    const result = await invokeLLM({
      messages: [
        { role: "system", content: "Você é um jornalista profissional do portal CNN BRA. Responda apenas em JSON válido." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "rewritten_article",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Título reescrito" },
              excerpt: { type: "string", description: "Resumo de 1-2 frases" },
              content: { type: "string", description: "Conteúdo reescrito em HTML" },
            },
            required: ["title", "excerpt", "content"],
            additionalProperties: false,
          },
        },
      },
    });

    const text = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : "";
    
    if (!text) return null;
    
    const parsed = JSON.parse(text);
    
    // Ensure source is cited
    if (!parsed.content.includes("Fonte:")) {
      parsed.content += `\n<p class="text-sm text-gray-500 mt-4 border-t pt-4"><strong>Fonte:</strong> <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${source}</a></p>`;
    }
    
    return parsed;
  } catch (err) {
    console.error(`[GlobalNews] AI rewrite error:`, err);
    return null;
  }
}

/**
 * Check if article already exists (deduplication)
 */
async function isAlreadyImported(sourceUrl: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return true;
  
  try {
    const existing = await db.select()
      .from(globalNewsCache)
      .where(eq(globalNewsCache.originalUrl, sourceUrl))
      .limit(1);
    return existing.length > 0;
  } catch {
    return false;
  }
}

/**
 * Cache the imported article URL
 */
async function cacheImportedUrl(sourceUrl: string, title: string, source: string) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(globalNewsCache).values({
      originalUrl: sourceUrl,
      originalTitle: title,
      originalSource: source,
      isPublished: true,
      fetchedAt: new Date(),
      publishedAt: new Date(),
    });
  } catch (err) {
    console.error(`[GlobalNews] Cache error:`, err);
  }
}

/**
 * Create a slug from title
 */
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

/**
 * Main function: Fetch, scrape, rewrite, and publish global news
 */
export async function fetchAndPublishGlobalNews(): Promise<{ imported: number; errors: number }> {
  console.log("[GlobalNews] Starting auto-fetch cycle...");
  
  const db = await getDb();
  if (!db) {
    console.error("[GlobalNews] Database not available");
    return { imported: 0, errors: 0 };
  }

  let imported = 0;
  let errors = 0;
  const maxPerCycle = 5; // Max articles per cycle to avoid overload

  for (const feedUrl of RSS_FEEDS) {
    if (imported >= maxPerCycle) break;

    try {
      const feed = await parser.parseURL(feedUrl);
      console.log(`[GlobalNews] Feed: ${feed.title} — ${feed.items.length} items`);

      for (const item of feed.items.slice(0, 8)) {
        if (imported >= maxPerCycle) break;

        const googleUrl = item.link || "";
        if (!googleUrl) continue;

        // Resolve real URL
        const realUrl = await resolveGoogleNewsUrl(googleUrl);

        // Deduplication check
        if (await isAlreadyImported(realUrl) || await isAlreadyImported(googleUrl)) {
          continue;
        }

        console.log(`[GlobalNews] Processing: ${item.title}`);

        // Scrape article
        const scraped = await scrapeArticle(realUrl);
        
        // Extract source name from URL
        let sourceName = "Fonte Internacional";
        try {
          sourceName = new URL(realUrl).hostname.replace("www.", "").replace(".com.br", "").replace(".com", "");
        } catch {}

        // If no content scraped, use RSS title/description
        const contentForAI = scraped.content.length > 100 
          ? scraped.content 
          : `${item.title}. ${item.contentSnippet || item.content || ""}`;

        if (contentForAI.length < 50) {
          console.log(`[GlobalNews] Skipping (too short): ${item.title}`);
          continue;
        }

        // Rewrite with AI
        const rewritten = await rewriteWithAI(
          item.title || "",
          contentForAI,
          sourceName,
          realUrl
        );

        if (!rewritten) {
          errors++;
          continue;
        }

        // Upload image to S3
        let finalImageUrl: string | null = null;
        if (scraped.imageUrl) {
          finalImageUrl = await uploadImageToS3(scraped.imageUrl);
        }

        // Create slug
        const slug = createSlug(rewritten.title) + "-" + nanoid(6);

        // Insert article
        try {
          // Add source info to the content
          const contentWithSource = rewritten.content + 
            `\n<p class="text-sm text-gray-500 mt-6 pt-4 border-t border-gray-200"><strong>Fonte original:</strong> <a href="${realUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${sourceName}</a></p>`;

          const result = await db.insert(articles).values({
            title: rewritten.title,
            slug,
            excerpt: rewritten.excerpt,
            content: contentWithSource,
            category: "GLOBAL",
            imageUrl: finalImageUrl || scraped.imageUrl || "",
            videoUrl: scraped.videoUrl || "",
            status: "online",
            isHero: false,
            tags: "global,internacional",
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          });

          const insertId = (result as any)[0]?.insertId;

          // Cache the URL
          await cacheImportedUrl(realUrl, rewritten.title, sourceName);
          if (googleUrl !== realUrl) {
            await cacheImportedUrl(googleUrl, rewritten.title, sourceName);
          }

          imported++;
          console.log(`[GlobalNews] Published: ${rewritten.title}`);
        } catch (err) {
          console.error(`[GlobalNews] Insert error:`, err);
          errors++;
        }

        // Small delay between articles to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.error(`[GlobalNews] Feed error:`, err);
      errors++;
    }
  }

  console.log(`[GlobalNews] Cycle complete: ${imported} imported, ${errors} errors`);
  return { imported, errors };
}
