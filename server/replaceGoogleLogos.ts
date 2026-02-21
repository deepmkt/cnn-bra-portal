/**
 * Replace Google News logos with themed Unsplash placeholders
 */

import { getDb } from "./db";
import { articles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80", // News
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80", // Business
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80", // Tech
  "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80", // World
  "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?auto=format&fit=crop&w=1200&q=80", // Politics
];

/**
 * Replace all Google News logos with themed placeholders
 */
export async function replaceGoogleLogosWithPlaceholders(): Promise<number> {
  console.log("[ReplaceLogos] Starting to replace Google News logos...");
  
  const db = await getDb();
  if (!db) return 0;
  
  try {
    // Get all global articles
    const globalArticles = await db.select()
      .from(articles)
      .where(eq(articles.category, "GLOBAL"));
    
    console.log(`[ReplaceLogos] Found ${globalArticles.length} global articles`);
    
    let replaced = 0;
    for (const article of globalArticles) {
      const imgUrl = article.imageUrl || "";
      
      // Check if image is a Google News logo
      const isGoogleLogo = imgUrl.includes("gstatic.com") || 
                           imgUrl.includes("googleusercontent.com") ||
                           imgUrl.includes("google.com/images");
      
      if (!isGoogleLogo) {
        continue;
      }
      
      // Pick a random placeholder
      const placeholder = PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)];
      
      // Update the article
      await db.update(articles)
        .set({ imageUrl: placeholder })
        .where(eq(articles.id, article.id));
      
      replaced++;
      console.log(`[ReplaceLogos] Replaced: ${article.title.substring(0, 60)}... -> ${placeholder.substring(0, 60)}...`);
    }
    
    console.log(`[ReplaceLogos] Completed: ${replaced} articles updated`);
    return replaced;
  } catch (err) {
    console.error("[ReplaceLogos] Error:", err);
    return 0;
  }
}
