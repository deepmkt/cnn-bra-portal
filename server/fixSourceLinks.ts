/**
 * Fix source links in existing articles.
 * Removes Google News URLs from content (since they can't be reliably resolved).
 * Future articles will use real URLs from the improved scraper.
 */
import { getDb } from "./db";
import { articles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export async function fixAllSourceLinks(): Promise<number> {
  console.log("[FixSourceLinks] Removing Google News URLs from existing articles...");
  
  const db = await getDb();
  if (!db) {
    console.error("[FixSourceLinks] Database not available");
    return 0;
  }
  
  try {
    // Get all GLOBAL articles
    const globalArticles = await db.select()
      .from(articles)
      .where(eq(articles.category, "GLOBAL"));
    
    console.log(`[FixSourceLinks] Found ${globalArticles.length} global articles`);
    
    let fixed = 0;
    for (const article of globalArticles) {
      const content = article.content || "";
      
      // Check if content has Google News URL
      if (!content.includes("news.google.com")) {
        continue;
      }
      
      console.log(`[FixSourceLinks] Fixing article: ${article.title}`);
      
      // Remove the entire source paragraph with Google News link
      // Replace with a simple non-linked source attribution
      const newContent = content.replace(
        /<p class="text-sm text-gray-500 mt-6 pt-4 border-t border-gray-200"><strong>Fonte:<\/strong>.*?news\.google\.com.*?<\/p>/,
        '<p class="text-sm text-gray-500 mt-6 pt-4 border-t border-gray-200"><strong>Fonte:</strong> Agência Internacional</p>'
      );
      
      // Update article
      await db.update(articles)
        .set({ content: newContent })
        .where(eq(articles.id, article.id));
      
      fixed++;
      console.log(`[FixSourceLinks] Fixed: ${article.title}`);
    }
    
    console.log(`[FixSourceLinks] Complete: ${fixed} articles fixed`);
    return fixed;
  } catch (err) {
    console.error(`[FixSourceLinks] Error:`, err);
    return 0;
  }
}
