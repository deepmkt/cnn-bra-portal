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
import { articles, globalNewsCache, shorts } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { capitalizeTitle } from "../shared/titleUtils";
import { decodeGoogleNewsUrl as decodeUrl } from "./decodeGoogleNewsUrl";

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

// ===== Well-known Brazilian news source names =====
const SOURCE_NAME_MAP: Record<string, string> = {
  "folha": "Folha de S.Paulo",
  "uol": "UOL",
  "g1": "G1",
  "globo": "O Globo",
  "oglobo": "O Globo",
  "estadao": "Estadão",
  "terra": "Terra",
  "r7": "R7",
  "band": "Band",
  "cnn": "CNN",
  "bbc": "BBC",
  "reuters": "Reuters",
  "bloomberg": "Bloomberg",
  "nytimes": "The New York Times",
  "washingtonpost": "The Washington Post",
  "theguardian": "The Guardian",
  "elpais": "El País",
  "infomoney": "InfoMoney",
  "valor": "Valor Econômico",
  "exame": "Exame",
  "veja": "Veja",
  "cartacapital": "Carta Capital",
  "correio": "Correio Braziliense",
  "gazetadopovo": "Gazeta do Povo",
  "metropoles": "Metrópoles",
  "poder360": "Poder360",
  "cnnbrasil": "CNN Brasil",
  "sbt": "SBT",
  "record": "Record",
  "jovempan": "Jovem Pan",
  "revistaoeste": "Revista Oeste",
};

/**
 * Get a friendly source name from a URL hostname
 */
function getSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "").toLowerCase();
    // Try known sources first
    for (const [key, name] of Object.entries(SOURCE_NAME_MAP)) {
      if (hostname.includes(key)) return name;
    }
    // Fallback: capitalize the domain name
    const domain = hostname.split(".")[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return "Fonte Internacional";
  }
}

/**
 * OLD decode function - replaced with simpler redirect-following version
 * Now imported from ./decodeGoogleNewsUrl.ts as decodeUrl
 */
/*
async function decodeGoogleNewsUrl_OLD(sourceUrl: string): Promise<string> {
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
*/

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
 * Scrape article content, images, and videos from a URL.
 * Uses the original image from the article (og:image, twitter:image, etc.)
 * Does NOT generate AI images — uses original source images only.
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

    // Extract main image - try multiple strategies (use ORIGINAL image from article)
    let imageUrl: string | null = null;
    
    // Strategy 1: og:image (most reliable for news sites)
    const ogImage = $('meta[property="og:image"]').attr("content");
    // Strategy 2: twitter:image
    const twitterImage = $('meta[name="twitter:image"]').attr("content") || $('meta[name="twitter:image:src"]').attr("content");
    // Strategy 3: First large image in article body
    const articleImages: string[] = [];
    $("article img, .article-body img, .post-content img, .entry-content img, main img, .materia img, .content img, .c-image img, figure img").each((_, el) => {
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
      if (absoluteUrl.includes("news.google.com")) continue;
      if (absoluteUrl.includes("gstatic.com")) continue;
      if (absoluteUrl.includes("google.com/images/branding")) continue;
      if (absoluteUrl.includes("play-lh.googleusercontent.com")) continue;
      
      // Accept the first valid-looking image URL (no HEAD request needed for og:image)
      imageUrl = absoluteUrl;
      break;
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
 * Validate image URL format and accessibility
 * Returns the original URL if valid, null otherwise
 */
async function validateImageUrl(imageUrl: string): Promise<string | null> {
  try {
    // Check if URL is valid and has acceptable image extension
    const url = new URL(imageUrl);
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
    const hasValidExt = validExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext));
    
    // Also accept URLs with image query params (e.g., ?format=jpg)
    const hasImageParam = url.searchParams.has("format") || url.searchParams.has("auto");
    
    if (!hasValidExt && !hasImageParam) {
      console.log(`[GlobalNews] Image URL has invalid extension: ${imageUrl}`);
      return null;
    }
    
    // Quick HEAD request to verify image is accessible (with short timeout)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(imageUrl, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.log(`[GlobalNews] Image URL not accessible (${response.status}): ${imageUrl}`);
      return null;
    }
    
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      console.log(`[GlobalNews] URL is not an image (${contentType}): ${imageUrl}`);
      return null;
    }
    
    console.log(`[GlobalNews] Image validated: ${imageUrl}`);
    return imageUrl;
  } catch (err) {
    console.error(`[GlobalNews] Image validation error:`, err);
    return null;
  }
}

/**
 * Rewrite article content using LLM.
 * The sourceUrl passed here MUST be the real article URL (not Google News).
 */
async function rewriteWithAI(title: string, content: string, source: string, sourceUrl: string): Promise<{ title: string; excerpt: string; content: string; tags: string } | null> {
  try {
    const prompt = `Você é um jornalista do portal CNN BRA. Reescreva a seguinte notícia de forma autoral, profissional e em português brasileiro. 
Mantenha a fidelidade aos fatos, mas use suas próprias palavras. O texto deve ser informativo, claro e envolvente.

REGRAS:
1. Reescreva o título de forma atraente e jornalística. Use capitalização correta: primeira letra maiúscula, restante em minúsculas, exceto nomes próprios e siglas.
2. Crie um excerpt/resumo de 1-2 frases
3. Reescreva o conteúdo completo em 3-6 parágrafos
4. Identifique até 3 tags/tópicos principais da notícia (escolha entre: economia, saúde, tecnologia, política, esportes, educação, meio-ambiente, cultura, internacional, ciência, segurança, justiça, transporte, energia, agronegócio, turismo, entretenimento)
5. NÃO inclua a fonte no conteúdo (será adicionada automaticamente pelo sistema)
6. NÃO copie o texto original, reescreva com suas palavras
7. Use linguagem jornalística profissional brasileira
8. Mantenha os fatos e dados precisos
9. NÃO use títulos em CAIXA ALTA. Use capitalização normal.

NOTÍCIA ORIGINAL:
Título: ${title}
Fonte: ${source}
Conteúdo: ${content}

Responda APENAS em JSON com este formato exato:
{
  "title": "título reescrito",
  "excerpt": "resumo de 1-2 frases",
  "content": "conteúdo reescrito completo em HTML com <p> tags, SEM incluir fonte",
  "tags": "tag1,tag2,tag3" (separadas por vírgula, minúsculas)
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
              tags: { type: "string", description: "Tags separadas por vírgula" },
            },
            required: ["title", "excerpt", "content", "tags"],
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
    
    // Apply proper capitalization to the title
    parsed.title = capitalizeTitle(parsed.title);
    
    // Remove any source the LLM might have added (we add it ourselves)
    parsed.content = parsed.content.replace(/<p[^>]*>.*?Fonte:.*?<\/p>/gi, "");
    
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
  const maxPerCycle = 3; // Max articles per cycle (focus on quality over quantity)

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
        const realUrl = await decodeUrl(googleUrl);

        // Deduplication check
        if (await isAlreadyImported(realUrl) || await isAlreadyImported(googleUrl)) {
          continue;
        }

        console.log(`[GlobalNews] Processing: ${item.title}`);
        console.log(`[GlobalNews] Resolved URL: ${realUrl}`);

        // Scrape article from the REAL URL (not Google News)
        const scraped = await scrapeArticle(realUrl);
        
        // Get proper source name
        const sourceName = getSourceName(realUrl);

        // If no content scraped, use RSS title/description
        const contentForAI = scraped.content.length > 100 
          ? scraped.content 
          : `${item.title}. ${item.contentSnippet || item.content || ""}`;

        if (contentForAI.length < 50) {
          console.log(`[GlobalNews] Skipping (too short): ${item.title}`);
          continue;
        }

        // Rewrite with AI (pass real URL, not Google News URL)
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

        // Validate and use original image URL directly (no S3 upload)
        let finalImageUrl: string | null = null;
        if (scraped.imageUrl) {
          finalImageUrl = await validateImageUrl(scraped.imageUrl);
          
          // If validation fails, try using the URL anyway as fallback
          if (!finalImageUrl) {
            console.log(`[GlobalNews] Image validation failed, using original URL anyway`);
            finalImageUrl = scraped.imageUrl;
          }
        }
        
        // If no image at all, use a generic news placeholder from Unsplash
        if (!finalImageUrl) {
          console.log(`[GlobalNews] No image found for article, using placeholder`);
          finalImageUrl = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80";
        }

        // Create slug
        const slug = createSlug(rewritten.title) + "-" + nanoid(6);

        // Insert article with proper source link
        try {
          // Build the source tag — clickable link to the REAL article URL
          const sourceTag = `<p class="text-sm text-gray-500 mt-6 pt-4 border-t border-gray-200"><strong>Fonte:</strong> <a href="${realUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${sourceName}</a></p>`;
          const contentWithSource = rewritten.content + "\n" + sourceTag;

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
            tags: `global,internacional,${rewritten.tags}`,
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
 * Fix existing articles: re-scrape original images and fix source links.
 * Replaces AI-generated images with original article images.
 * Fixes source links to point to real URLs instead of Google News.
 */
export async function fixGlobalNewsImages(): Promise<number> {
  console.log("[GlobalNews] Fixing existing article images and source links...");
  
  const db = await getDb();
  if (!db) return 0;
  
  try {
    const globalArticles = await db.select()
      .from(articles)
      .where(eq(articles.category, "GLOBAL"));
    
    let fixed = 0;
    for (const article of globalArticles) {
      const imgUrl = article.imageUrl || "";
      const content = article.content || "";
      let needsUpdate = false;
      const updates: { imageUrl?: string; content?: string } = {};
      
      // Fix 1: Check if image is an AI-generated one or Google News logo
      if (imgUrl.includes("global-news/ai-") || !imgUrl || imgUrl.includes("gstatic.com")) {
        // Try to find the original URL from the cache
        const cached = await db.select()
          .from(globalNewsCache)
          .where(eq(globalNewsCache.originalTitle, article.title))
          .limit(1);
        
        if (cached.length > 0) {
          const originalUrl = cached[0].originalUrl;
          if (originalUrl && !originalUrl.includes("news.google.com")) {
            // Re-scrape to get the original image
            const scraped = await scrapeArticle(originalUrl);
            if (scraped.imageUrl) {
              const newImg = await validateImageUrl(scraped.imageUrl);
              if (newImg) {
                updates.imageUrl = newImg;
                needsUpdate = true;
                console.log(`[GlobalNews] Fixed image for article ${article.id}: original image from ${originalUrl}`);
              } else {
                // Use the original URL directly
                updates.imageUrl = scraped.imageUrl;
                needsUpdate = true;
              }
            }
          }
        }
      }
      
      // Fix 2: Check if source link points to Google News instead of real URL
      if (content.includes("news.google.com")) {
        const cached = await db.select()
          .from(globalNewsCache)
          .where(eq(globalNewsCache.originalTitle, article.title))
          .limit(1);
        
        if (cached.length > 0) {
          const originalUrl = cached[0].originalUrl;
          const sourceName = getSourceName(originalUrl);
          
          // Replace Google News URLs in source links with real URLs
          let fixedContent = content.replace(
            /href="https?:\/\/news\.google\.com[^"]*"/g,
            `href="${originalUrl}"`
          );
          
          // Also fix the source name if it's generic
          const sourceTag = `<p class="text-sm text-gray-500 mt-6 pt-4 border-t border-gray-200"><strong>Fonte:</strong> <a href="${originalUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${sourceName}</a></p>`;
          
          // Remove old source tags and add new one
          fixedContent = fixedContent.replace(/<p[^>]*>.*?<strong>Fonte[^<]*<\/strong>.*?<\/p>/gi, "");
          fixedContent = fixedContent + "\n" + sourceTag;
          
          updates.content = fixedContent;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await db.update(articles)
          .set(updates)
          .where(eq(articles.id, article.id));
        fixed++;
        
        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`[GlobalNews] Fixed ${fixed} articles`);
    return fixed;
  } catch (err) {
    console.error(`[GlobalNews] Fix error:`, err);
    return 0;
  }
}
