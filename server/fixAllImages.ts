/**
 * Fix all existing articles: re-scrape images from original sources
 */

import { getDb } from "./db";
import { articles, globalNewsCache } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as cheerio from "cheerio";
import { decodeGoogleNewsUrl } from "./decodeGoogleNewsUrl";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Scrape image from a URL (simplified version)
 */
async function scrapeImageFromUrl(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract image - try multiple strategies
    const ogImage = $('meta[property="og:image"]').attr("content");
    const twitterImage = $('meta[name="twitter:image"]').attr("content") || $('meta[name="twitter:image:src"]').attr("content");
    
    const imageCandidates = [ogImage, twitterImage].filter(Boolean) as string[];
    
    for (const candidate of imageCandidates) {
      let absoluteUrl = candidate;
      if (!absoluteUrl.startsWith("http")) {
        try {
          absoluteUrl = new URL(absoluteUrl, url).href;
        } catch { continue; }
      }
      
      // Skip Google News logos
      if (absoluteUrl.includes("news.google.com")) continue;
      if (absoluteUrl.includes("gstatic.com")) continue;
      if (absoluteUrl.includes("googleusercontent.com")) continue;
      
      return absoluteUrl;
    }

    return null;
  } catch (err) {
    console.error(`[FixImages] Scrape error for ${url}:`, err);
    return null;
  }
}

/**
 * Fix all articles with Google News logos
 */
export async function fixAllArticleImages(): Promise<number> {
  console.log("[FixImages] Starting to fix all article images...");
  
  const db = await getDb();
  if (!db) return 0;
  
  try {
    // Get all global articles
    const globalArticles = await db.select()
      .from(articles)
      .where(eq(articles.category, "GLOBAL"));
    
    console.log(`[FixImages] Found ${globalArticles.length} global articles`);
    
    let fixed = 0;
    for (const article of globalArticles) {
      const imgUrl = article.imageUrl || "";
      
      // Check if image is a Google News logo or missing
      const needsFix = !imgUrl || 
                       imgUrl.includes("gstatic.com") || 
                       imgUrl.includes("googleusercontent.com") ||
                       imgUrl.includes("unsplash.com");
      
      if (!needsFix) {
        continue;
      }
      
      // Extract source URL from article content (from the "Fonte:" link)
      const content = article.content || "";
      const sourceUrlMatch = content.match(/<a href="([^"]+)"[^>]*>([^<]+)<\/a><\/p>/);
      
      if (!sourceUrlMatch || !sourceUrlMatch[1]) {
        console.log(`[FixImages] No source URL found in content for: ${article.title}`);
        continue;
      }
      
      let sourceUrl = sourceUrlMatch[1];
      
      // Decode Google News URL to get the real article URL
      if (sourceUrl.includes("news.google.com")) {
        console.log(`[FixImages] Decoding Google News URL for: ${article.title.substring(0, 60)}...`);
        sourceUrl = await decodeGoogleNewsUrl(sourceUrl);
      }
      
      console.log(`[FixImages] Re-scraping: ${article.title.substring(0, 60)}... from ${sourceUrl.substring(0, 80)}...`);
      
      // Re-scrape the image
      const newImageUrl = await scrapeImageFromUrl(sourceUrl);
      
      if (newImageUrl && newImageUrl !== imgUrl) {
        // Update the article
        await db.update(articles)
          .set({ imageUrl: newImageUrl })
          .where(eq(articles.id, article.id));
        
        fixed++;
        console.log(`[FixImages] Fixed: ${article.title.substring(0, 60)}... -> ${newImageUrl.substring(0, 80)}`);
      } else {
        console.log(`[FixImages] No better image found for: ${article.title.substring(0, 60)}...`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`[FixImages] Completed: ${fixed} articles fixed`);
    return fixed;
  } catch (err) {
    console.error("[FixImages] Error:", err);
    return 0;
  }
}
