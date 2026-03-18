/**
 * publishScheduledArticles.ts
 *
 * Queries all articles with status = "scheduled" whose scheduledAt timestamp
 * is in the past (i.e., it is time to publish them) and flips their status to
 * "online", setting publishedAt to the current time.
 *
 * This function is called by the cron job in server/_core/index.ts every minute.
 */

import { getDb } from "./db";
import { articles } from "../drizzle/schema";
import { eq, and, lte, isNotNull } from "drizzle-orm";

export interface PublishResult {
  published: number;
  errors: number;
  ids: number[];
}

export async function publishScheduledArticles(): Promise<PublishResult> {
  const result: PublishResult = { published: 0, errors: 0, ids: [] };

  try {
    const db = await getDb();
    if (!db) {
      console.error("[Scheduler] Database not available, skipping.");
      return result;
    }

    const now = new Date();

    // Find all articles that are scheduled and whose scheduledAt has passed
    const due = await db
      .select({ id: articles.id, title: articles.title, scheduledAt: articles.scheduledAt })
      .from(articles)
      .where(
        and(
          eq(articles.status, "scheduled"),
          isNotNull(articles.scheduledAt),
          lte(articles.scheduledAt, now)
        )
      );

    if (due.length === 0) return result;

    for (const article of due) {
      try {
        await db
          .update(articles)
          .set({ status: "online", publishedAt: now })
          .where(eq(articles.id, article.id));

        result.published++;
        result.ids.push(article.id);
        console.log(
          `[Scheduler] Published article #${article.id}: "${article.title}" (was scheduled for ${article.scheduledAt?.toISOString()})`
        );
      } catch (err) {
        result.errors++;
        console.error(`[Scheduler] Failed to publish article #${article.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[Scheduler] Unexpected error in publishScheduledArticles:", err);
  }

  return result;
}
