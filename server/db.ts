import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, articles, InsertArticle, ads, InsertAd, siteSettings, InsertSiteSetting, tickerItems, InsertTickerItem } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== ARTICLES =====

export async function getArticles(filters?: { status?: string; category?: string; isHero?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(articles).orderBy(desc(articles.createdAt));
  // We'll filter in application layer for simplicity
  const results = await query;
  let filtered = results;
  if (filters?.status) filtered = filtered.filter(a => a.status === filters.status);
  if (filters?.category) filtered = filtered.filter(a => a.category === filters.category);
  if (filters?.isHero !== undefined) filtered = filtered.filter(a => a.isHero === filters.isHero);
  return filtered;
}

export async function getArticleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createArticle(article: InsertArticle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(articles).values(article);
  return result[0].insertId;
}

export async function updateArticle(id: number, data: Partial<InsertArticle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(articles).set(data).where(eq(articles.id, id));
}

export async function deleteArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(articles).where(eq(articles.id, id));
}

export async function incrementViewCount(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(articles).set({ viewCount: sql`${articles.viewCount} + 1` }).where(eq(articles.id, id));
}

// ===== ADS =====

export async function getAds(placement?: string) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(ads).orderBy(desc(ads.createdAt));
  if (placement) return results.filter(a => a.placement === placement);
  return results;
}

export async function createAd(ad: InsertAd) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ads).values(ad);
  return result[0].insertId;
}

export async function updateAd(id: number, data: Partial<InsertAd>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(ads).set(data).where(eq(ads.id, id));
}

export async function deleteAd(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(ads).where(eq(ads.id, id));
}

// ===== TICKER ITEMS =====

export async function getTickerItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tickerItems).where(eq(tickerItems.isActive, true)).orderBy(desc(tickerItems.createdAt));
}

export async function createTickerItem(item: InsertTickerItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tickerItems).values(item);
  return result[0].insertId;
}

export async function deleteTickerItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tickerItems).where(eq(tickerItems.id, id));
}

// ===== SITE SETTINGS =====

export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  return result.length > 0 ? result[0].settingValue : undefined;
}

export async function upsertSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(siteSettings).values({ settingKey: key, settingValue: value }).onDuplicateKeyUpdate({ set: { settingValue: value } });
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteSettings);
}

// ===== STATS =====

export async function getArticleCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(articles);
  return result[0]?.count ?? 0;
}

export async function getTotalViews() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ total: sql<number>`COALESCE(SUM(${articles.viewCount}), 0)` }).from(articles);
  return result[0]?.total ?? 0;
}
