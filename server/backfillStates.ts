/**
 * Backfill the `state` column for existing articles that don't have it set.
 * Detects the state from title + tags + excerpt using keyword matching.
 */
import { getDb } from "./db";
import { articles } from "../drizzle/schema";
import { isNull, eq } from "drizzle-orm";
import { detectState } from "@shared/brazilStates";

export async function backfillArticleStates(): Promise<{ updated: number; total: number }> {
  const db = await getDb();
  if (!db) return { updated: 0, total: 0 };

  // Get all articles without a state
  const rows = await db.select({
    id: articles.id,
    title: articles.title,
    tags: articles.tags,
    excerpt: articles.excerpt,
  }).from(articles).where(isNull(articles.state));

  let updated = 0;

  for (const row of rows) {
    const text = `${row.title} ${row.excerpt || ""} ${row.tags || ""}`;
    const detected = detectState(text);

    if (detected) {
      await db.update(articles)
        .set({ state: detected })
        .where(eq(articles.id, row.id));
      updated++;
    }
  }

  return { updated, total: rows.length };
}
