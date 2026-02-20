/**
 * Global News Auto-Fetcher
 * Fetches top international news from Google News RSS,
 * scrapes full content + images, rewrites via LLM,
 * and publishes automatically to the GLOBAL category.
 */
import RSSParser from "rss-parser";
import * as cheerio from "cheerio";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { articles, globalNewsCache, shorts } from "../drizzle/schema";
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
 * Decode Google News encoded URL using batchexecute API
 */
async function decodeGoogleNewsUrl(sourceUrl: string): Promise<string> {
  try {
    const url = new URL(sourceUrl);
    const path = url.pathname.split("/");
    
    if (url.hostname === "news.google.com" && path.length > 1 && path[path.length - 2] === "articles") {
      const base64 = path[path.length - 1];
      
      // Try offline decoding first
      try {
        const str = Buffer.from(base64, "base64").toString("binary");
        const prefix = Buffer.from([0x08, 0x13, 0x22]).toString("binary");
        let decoded = str;
        if (decoded.startsWith(prefix)) {
          decoded = decoded.substring(prefix.length);
        }
        const suffix = Buffer.from([0xd2, 0x01, 0x00]).toString("binary");
        if (decoded.endsWith(suffix)) {
          decoded = decoded.substring(0, decoded.length - suffix.length);
        }
        const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
        const len = bytes.at(0)!;
        let result: string;
        if (len >= 0x80) {
          result = decoded.substring(2, len + 2);
        } else {
          result = decoded.substring(1, len + 1);
        }
        
        // If it starts with http, we have a valid URL
        if (result.startsWith("http")) {
          return result;
        }
      } catch {}
      
      // Fallback: use batchexecute API
      try {
        const s = '[[["Fbv4je","[\\"garturlreq\\",[\[\\"en-US\\",\\"US\\",[\\"FINANCE_TOP_INDICES\\",\\"WEB_TEST_1_0_0\\"],null,null,1,1,\\"US:en\\",null,180,null,null,null,null,null,0,null,null,[1608992183,723341000]],\\"en-US\\",\\"US\\",1,[2,3,4,8],1,0,\\"655000234\\",0,0,null,0],\\"' + base64 + '\\"]",null,"generic"]]]';
        
        const response = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je", {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
            "Referer": "https://news.google.com/",
            "User-Agent": USER_AGENT,
          },
          body: "f.req=" + encodeURIComponent(s),
          method: "POST",
        });
        
        const text = await response.text();
        const header = '[\\"garturlres\\",\\"';
        const footer = '\\",';
        if (text.includes(header)) {
          const start = text.substring(text.indexOf(header) + header.length);
          if (start.includes(footer)) {
            const decodedUrl = start.substring(0, start.indexOf(footer));
            if (decodedUrl.startsWith("http")) {
              return decodedUrl;
            }
          }
        }
      } catch {}
    }
    
    // Fallback: follow redirects
    return await resolveGoogleNewsUrl(sourceUrl);
  } catch {
    return sourceUrl;
  }
}

/**
 * Fetch and follow Google News redirect to get the real article URL
 */
async function resolveGoogleNewsUrl(googleUrl: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(googleUrl, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.url || googleUrl;
  } catch {
    return googleUrl;
  }
}

/**
 * Validate if an image URL is a real article image (not a logo/icon)
 */
async function isValidArticleImage(imageUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(imageUrl, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (!response.ok) return false;
    
    const contentLength = parseInt(response.headers.get("content-length") || "0");
    const contentType = response.headers.get("content-type") || "";
    
    // Reject images that are too small (likely logos/icons)
    if (contentLength > 0 && contentLength < 15000) return false;
    
    // Reject non-image content types
    if (!contentType.startsWith("image/")) return false;
    
    // Reject known logo/icon patterns
    const lowerUrl = imageUrl.toLowerCase();
    if (lowerUrl.includes("logo") || lowerUrl.includes("favicon") || lowerUrl.includes("icon")) return false;
    if (lowerUrl.includes("google.com/images") || lowerUrl.includes("gstatic.com")) return false;
    
    return true;
  } catch {
    return false;
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

    // Extract main image - try multiple strategies
    let imageUrl: string | null = null;
    
    // Strategy 1: og:image (most reliable for news sites)
    const ogImage = $('meta[property="og:image"]').attr("content");
    // Strategy 2: twitter:image
    const twitterImage = $('meta[name="twitter:image"]').attr("content");
    // Strategy 3: First large image in article body
    const articleImages: string[] = [];
    $("article img, .article-body img, .post-content img, .entry-content img, main img, .materia img, .content img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src");
      if (src) articleImages.push(src);
    });
    // Strategy 4: Any large image on the page
    const allImages: string[] = [];
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      const width = parseInt($(el).attr("width") || "0");
      const height = parseInt($(el).attr("height") || "0");
      if (src && (width > 300 || height > 200 || (!width && !height))) {
        allImages.push(src);
      }
    });
    
    // Try candidates in order of preference
    const imageCandidates = [ogImage, twitterImage, ...articleImages, ...allImages].filter(Boolean) as string[];
    
    for (const candidate of imageCandidates) {
      let absoluteUrl = candidate;
      if (!absoluteUrl.startsWith("http")) {
        try {
          absoluteUrl = new URL(absoluteUrl, url).href;
        } catch { continue; }
      }
      
      // Skip Google News logos and other known bad patterns
      if (absoluteUrl.includes("news.google.com") || absoluteUrl.includes("gstatic.com")) continue;
      if (absoluteUrl.includes("google.com/images/branding")) continue;
      if (absoluteUrl.includes("play-lh.googleusercontent.com")) continue;
      
      // Validate the image
      if (await isValidArticleImage(absoluteUrl)) {
        imageUrl = absoluteUrl;
        break;
      }
    }

    // Extract video
    let videoUrl: string | null = null;
    const ogVideo = $('meta[property="og:video"]').attr("content");
    const ogVideoSecure = $('meta[property="og:video:secure_url"]').attr("content");
    const videoSrc = $("video source").first().attr("src") || $("video").first().attr("src");
    const iframeVideo = $("iframe[src*='youtube'], iframe[src*='vimeo'], iframe[src*='dailymotion']").first().attr("src");
    videoUrl = ogVideo || ogVideoSecure || videoSrc || iframeVideo || null;
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
      ".article__content", ".text-body", ".article-text",
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
    
    // Validate: reject images smaller than 15KB (likely logos/icons)
    if (buffer.length < 15000) {
      console.log(`[GlobalNews] Image too small (${buffer.length} bytes), likely a logo. Skipping.`);
      return null;
    }
    
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
 * Generate an AI image for an article when no real image is available
 */
async function generateArticleImage(title: string, category: string): Promise<string | null> {
  try {
    const prompt = `Professional news photograph for article titled: "${title}". Category: ${category}. Photojournalistic style, realistic, high quality, editorial photo, no text overlays, no watermarks.`;
    
    const result = await generateImage({ prompt });
    if (result?.url) {
      // Download and re-upload to our S3
      const response = await fetch(result.url);
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        const key = `global-news/ai-${nanoid(12)}.jpg`;
        const { url } = await storagePut(key, buffer, "image/jpeg");
        return url;
      }
    }
    return null;
  } catch (err) {
    console.error(`[GlobalNews] AI image generation error:`, err);
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
 * Create a CNN Short from a video article
 */
async function createShortFromArticle(articleId: number, title: string, videoUrl: string, thumbnailUrl: string | null, category: string) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(shorts).values({
      title: title.length > 80 ? title.substring(0, 77) + "..." : title,
      videoUrl,
      thumbnailUrl: thumbnailUrl || "",
      category,
      duration: 60,
      likeCount: 0,
      viewCount: 0,
      status: "online",
      publishedAt: new Date(),
    });
    console.log(`[GlobalNews] Created CNN Short from article: ${title}`);
  } catch (err) {
    console.error(`[GlobalNews] Short creation error:`, err);
  }
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

        // Resolve real URL using decoder
        const realUrl = await decodeGoogleNewsUrl(googleUrl);

        // Deduplication check
        if (await isAlreadyImported(realUrl) || await isAlreadyImported(googleUrl)) {
          continue;
        }

        console.log(`[GlobalNews] Processing: ${item.title}`);
        console.log(`[GlobalNews] Resolved URL: ${realUrl}`);

        // Scrape article
        const scraped = await scrapeArticle(realUrl);
        
        // Extract source name from URL
        let sourceName = "Fonte Internacional";
        try {
          sourceName = new URL(realUrl).hostname.replace("www.", "").split(".")[0];
          sourceName = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);
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

        // Upload image to S3 (with validation)
        let finalImageUrl: string | null = null;
        if (scraped.imageUrl) {
          finalImageUrl = await uploadImageToS3(scraped.imageUrl);
        }
        
        // If no valid image, generate one with AI
        if (!finalImageUrl) {
          console.log(`[GlobalNews] No valid image found, generating with AI...`);
          finalImageUrl = await generateArticleImage(rewritten.title, "GLOBAL");
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
            imageUrl: finalImageUrl || "",
            videoUrl: scraped.videoUrl || "",
            status: "online",
            isHero: false,
            tags: "global,internacional",
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          });

          const insertId = (result as any)[0]?.insertId;

          // If article has video, create a CNN Short
          if (scraped.videoUrl) {
            await createShortFromArticle(
              insertId,
              rewritten.title,
              scraped.videoUrl,
              finalImageUrl,
              "GLOBAL"
            );
          }

          // Cache the URL
          await cacheImportedUrl(realUrl, rewritten.title, sourceName);
          if (googleUrl !== realUrl) {
            await cacheImportedUrl(googleUrl, rewritten.title, sourceName);
          }

          imported++;
          console.log(`[GlobalNews] Published: ${rewritten.title} (image: ${finalImageUrl ? "YES" : "NO"})`);
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

/**
 * Fix existing articles that have Google News logo as image
 * Run once to update articles with AI-generated images
 */
export async function fixGlobalNewsImages(): Promise<number> {
  console.log("[GlobalNews] Fixing existing article images...");
  
  const db = await getDb();
  if (!db) return 0;
  
  try {
    // Find articles with the Google News logo (all have same 12496 byte size)
    const globalArticles = await db.select()
      .from(articles)
      .where(eq(articles.category, "GLOBAL"));
    
    let fixed = 0;
    for (const article of globalArticles) {
      const imgUrl = article.imageUrl || "";
      if (!imgUrl || imgUrl.includes("global-news/")) {
        // Check if this is a Google News logo by checking file size
        try {
          if (!imgUrl) continue;
          const response = await fetch(imgUrl, { method: "HEAD" });
          const size = parseInt(response.headers.get("content-length") || "0");
          
          if (size > 0 && size < 15000) {
            // This is likely a logo, generate a new image
            console.log(`[GlobalNews] Fixing image for article ${article.id}: ${article.title}`);
            const newImage = await generateArticleImage(article.title, "GLOBAL");
            
            if (newImage) {
              await db.update(articles)
                .set({ imageUrl: newImage })
                .where(eq(articles.id, article.id));
              fixed++;
              console.log(`[GlobalNews] Fixed image for article ${article.id}`);
            }
            
            // Delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } catch {}
      }
    }
    
    console.log(`[GlobalNews] Fixed ${fixed} article images`);
    return fixed;
  } catch (err) {
    console.error(`[GlobalNews] Fix images error:`, err);
    return 0;
  }
}
