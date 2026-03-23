import { eq, desc, and, sql, like, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  articles, InsertArticle,
  ads, InsertAd,
  siteSettings, InsertSiteSetting,
  tickerItems, InsertTickerItem,
  comments, InsertComment,
  notifications, InsertNotification,
  readingHistory, InsertReadingHistoryEntry,
  userPreferences, InsertUserPreference,
  tags, InsertTag,
  mediaLibrary, InsertMediaItem,
  articleRevisions, InsertArticleRevision,
  imageCache, InsertImageCacheEntry,
  userPoints, InsertUserPointsEntry,
  pointTransactions, InsertPointTransaction,
  badges, InsertBadge,
  userBadges, InsertUserBadge,
  ugcSubmissions, InsertUgcSubmission,
  articleSimilarity, InsertArticleSimilarityEntry,
  userArticleInteractions, InsertUserArticleInteraction,
  auditLogs, InsertAuditLog,
  shorts, InsertShort,
  shortComments, InsertShortComment,
  shortLikes, InsertShortLike,
  newsletterSubscribers, InsertNewsletterSubscriber,
  globalNewsCache, InsertGlobalNewsItem,
  adminUsers, InsertAdminUser,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

// ===== USERS =====

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
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
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(id: number, role: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role: role as any }).where(eq(users.id, id));
}

// ===== ARTICLES (CMS Headless) =====

function generateSlug(title: string, id?: number): string {
  const base = title.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 150);
  // Use article ID as suffix for uniqueness; fallback to timestamp if ID not yet known
  return id ? `${base}-${id}` : `${base}-${Date.now().toString(36)}`;
}

function calculateReadTime(content: string | null | undefined): number {
  if (!content) return 1;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function getArticles(filters?: { status?: string; category?: string; isHero?: boolean; search?: string; tag?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(articles).orderBy(desc(articles.createdAt));
  let filtered = results;
  if (filters?.status) filtered = filtered.filter(a => a.status === filters.status);
  if (filters?.category) filtered = filtered.filter(a => a.category === filters.category);
  if (filters?.isHero !== undefined) filtered = filtered.filter(a => a.isHero === filters.isHero);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(a => a.title.toLowerCase().includes(q) || a.excerpt?.toLowerCase().includes(q) || a.tags?.toLowerCase().includes(q));
  }
  if (filters?.tag) {
    filtered = filtered.filter(a => {
      try { const t = JSON.parse(a.tags || "[]"); return t.includes(filters.tag); } catch { return false; }
    });
  }
  if (filters?.limit) filtered = filtered.slice(0, filters.limit);
  return filtered;
}

export async function getArticleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createArticle(article: InsertArticle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const tempSlug = generateSlug(article.title);
  const readTime = calculateReadTime(article.content);
  const result = await db.insert(articles).values({ ...article, slug: tempSlug, readTimeMinutes: readTime });
  const id = result[0].insertId;
  // Update slug with the actual ID for clean URLs
  const finalSlug = generateSlug(article.title, id);
  await db.update(articles).set({ slug: finalSlug }).where(eq(articles.id, id));
  return id;
}

export async function updateArticle(id: number, data: Partial<InsertArticle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.content) data.readTimeMinutes = calculateReadTime(data.content);
  if (data.title) data.slug = generateSlug(data.title, id);
  if (data.status === "online" && !(data as any).publishedAt) {
    (data as any).publishedAt = new Date();
  }
  await db.update(articles).set(data).where(eq(articles.id, id));
}

/**
 * Raw update: sets exactly the fields provided without auto-generating slug.
 * Used by the fixTitlesAndSlugs migration.
 */
export async function updateArticleRaw(id: number, data: Record<string, any>) {
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

export async function incrementShareCount(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(articles).set({ shareCount: sql`${articles.shareCount} + 1` }).where(eq(articles.id, id));
}

export async function getTrendingArticles(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select()
    .from(articles)
    .where(eq(articles.status, "online"))
    .orderBy(desc(articles.viewCount))
    .limit(limit);
  return result;
}

// ===== ARTICLE REVISIONS =====

export async function createRevision(revision: InsertArticleRevision) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(articleRevisions).values(revision);
  return result[0].insertId;
}

export async function getRevisions(articleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(articleRevisions).where(eq(articleRevisions.articleId, articleId)).orderBy(desc(articleRevisions.createdAt));
}

// ===== TAGS =====

export async function getTags() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tags).orderBy(desc(tags.articleCount));
}

export async function upsertTag(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  await db.insert(tags).values({ name, slug }).onDuplicateKeyUpdate({ set: { articleCount: sql`${tags.articleCount} + 1` } });
}

// ===== MEDIA LIBRARY =====

export async function getMediaItems(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mediaLibrary).orderBy(desc(mediaLibrary.createdAt)).limit(limit);
}

export async function createMediaItem(item: InsertMediaItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(mediaLibrary).values(item);
  return result[0].insertId;
}

export async function deleteMediaItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(mediaLibrary).where(eq(mediaLibrary.id, id));
}

// ===== COMMENTS (Microservice) =====

export async function getComments(articleId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(comments).where(eq(comments.articleId, articleId)).orderBy(desc(comments.createdAt));
  if (status) return results.filter(c => c.status === status);
  return results;
}

export async function getAllComments(status?: string) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(comments).orderBy(desc(comments.createdAt));
  if (status) return results.filter(c => c.status === status);
  return results;
}

export async function createComment(comment: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(comments).values(comment);
  // Update article comment count
  await db.update(articles).set({ commentCount: sql`${articles.commentCount} + 1` }).where(eq(articles.id, comment.articleId));
  return result[0].insertId;
}

export async function updateCommentStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(comments).set({ status: status as any }).where(eq(comments.id, id));
}

export async function deleteComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(comments).where(eq(comments.id, id));
}

export async function likeComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(comments).set({ likesCount: sql`${comments.likesCount} + 1` }).where(eq(comments.id, id));
}

// ===== NOTIFICATIONS =====

export async function getNotifications(userId?: number) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(50);
  if (userId) return results.filter(n => n.isGlobal || n.targetUserId === userId);
  return results.filter(n => n.isGlobal);
}

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(notification);
  return result[0].insertId;
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const results = await db.select().from(notifications)
    .where(and(eq(notifications.isRead, false), or(eq(notifications.isGlobal, true), eq(notifications.targetUserId, userId))));
  return results.length;
}

// ===== READING HISTORY & PERSONALIZATION =====

export async function addReadingHistory(entry: InsertReadingHistoryEntry) {
  const db = await getDb();
  if (!db) return;
  await db.insert(readingHistory).values(entry);
}

export async function getUserReadingHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(readingHistory).where(eq(readingHistory.userId, userId)).orderBy(desc(readingHistory.createdAt)).limit(limit);
}

export async function getPersonalizedRecommendations(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  // Get user's most read categories
  const history = await db.select({ category: readingHistory.category, count: sql<number>`count(*)` })
    .from(readingHistory)
    .where(eq(readingHistory.userId, userId))
    .groupBy(readingHistory.category)
    .orderBy(desc(sql`count(*)`))
    .limit(3);
  
  if (history.length === 0) {
    // No history, return latest articles
    return db.select().from(articles).where(eq(articles.status, "online")).orderBy(desc(articles.createdAt)).limit(limit);
  }

  const topCategories = history.map(h => h.category).filter(Boolean) as string[];
  // Get recent articles from top categories
  const allOnline = await db.select().from(articles).where(eq(articles.status, "online")).orderBy(desc(articles.createdAt)).limit(100);
  const recommended = allOnline.filter(a => topCategories.includes(a.category));
  const others = allOnline.filter(a => !topCategories.includes(a.category));
  // Mix: 70% from preferred categories, 30% discovery
  const prefCount = Math.ceil(limit * 0.7);
  const discCount = limit - prefCount;
  return [...recommended.slice(0, prefCount), ...others.slice(0, discCount)];
}

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserPreferences(userId: number, prefs: Partial<InsertUserPreference>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(userPreferences).values({ userId, ...prefs } as InsertUserPreference).onDuplicateKeyUpdate({ set: prefs });
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

export async function getCommentCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(comments);
  return result[0]?.count ?? 0;
}

export async function getUserCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  return result[0]?.count ?? 0;
}

// ===== IMAGE CACHE (CDN/Edge) =====

export async function getCachedImage(originalUrl: string, width?: number, format?: string) {
  const db = await getDb();
  if (!db) return undefined;
  const results = await db.select().from(imageCache).where(eq(imageCache.originalUrl, originalUrl));
  return results.find(r => (!width || r.width === width) && (!format || r.format === format));
}

export async function cacheImage(entry: InsertImageCacheEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(imageCache).values(entry);
  return result[0].insertId;
}

// ===== FULL-TEXT SEARCH =====

export async function searchArticles(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const q = `%${query}%`;
  const results = await db.select().from(articles)
    .where(and(
      eq(articles.status, "online"),
      or(
        like(articles.title, q),
        like(articles.excerpt, q),
        like(articles.content, q),
        like(articles.tags, q),
      )
    ))
    .orderBy(desc(articles.createdAt))
    .limit(limit);
  return results;
}

// ===== GAMIFICATION: POINTS =====

const POINT_VALUES = {
  read_article: 10,
  post_comment: 20,
  share_article: 15,
  submit_ugc: 30,
  ugc_approved: 100,
  daily_login: 5,
  streak_bonus: 25,
  quiz_complete: 50,
};

const LEVELS = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];

function calculateLevel(points: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i]) return i + 1;
  }
  return 1;
}

export async function getUserPoints(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function awardPoints(userId: number, action: string, referenceId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const points = POINT_VALUES[action as keyof typeof POINT_VALUES] || 0;
  if (points === 0) return { points: 0, newBadges: [] };

  // Record transaction
  await db.insert(pointTransactions).values({
    userId,
    action: action as any,
    points,
    referenceId,
  });

  // Upsert user points
  const existing = await getUserPoints(userId);
  const today = new Date().toISOString().split("T")[0];

  if (existing) {
    const isNewDay = existing.lastActiveDate !== today;
    const isConsecutive = isNewDay && existing.lastActiveDate === new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const newStreak = isConsecutive ? existing.streak + 1 : (isNewDay ? 1 : existing.streak);
    const newTotal = existing.totalPoints + points + (isNewDay ? POINT_VALUES.daily_login : 0) + (newStreak > 0 && newStreak % 7 === 0 ? POINT_VALUES.streak_bonus : 0);

    const updateData: Record<string, any> = {
      totalPoints: newTotal,
      level: calculateLevel(newTotal),
      lastActiveDate: today,
      streak: newStreak,
    };

    if (action === "read_article") updateData.articlesRead = sql`${userPoints.articlesRead} + 1`;
    if (action === "post_comment") updateData.commentsPosted = sql`${userPoints.commentsPosted} + 1`;
    if (action === "share_article") updateData.sharesCount = sql`${userPoints.sharesCount} + 1`;
    if (action === "submit_ugc") updateData.ugcSubmissions = sql`${userPoints.ugcSubmissions} + 1`;

    await db.update(userPoints).set(updateData).where(eq(userPoints.userId, userId));
  } else {
    const initData: any = {
      userId,
      totalPoints: points + POINT_VALUES.daily_login,
      lastActiveDate: today,
      streak: 1,
      level: 1,
    };
    if (action === "read_article") initData.articlesRead = 1;
    if (action === "post_comment") initData.commentsPosted = 1;
    if (action === "share_article") initData.sharesCount = 1;
    if (action === "submit_ugc") initData.ugcSubmissions = 1;
    await db.insert(userPoints).values(initData);
  }

  // Check for new badges
  const newBadges = await checkAndAwardBadges(userId);
  return { points, newBadges };
}

export async function getLeaderboard(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select({
    userId: userPoints.userId,
    totalPoints: userPoints.totalPoints,
    level: userPoints.level,
    articlesRead: userPoints.articlesRead,
    streak: userPoints.streak,
  }).from(userPoints).orderBy(desc(userPoints.totalPoints)).limit(limit);

  // Enrich with user names
  const userIds = results.map(r => r.userId);
  if (userIds.length === 0) return [];
  const usersData = await db.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl }).from(users).where(inArray(users.id, userIds));
  const userMap = new Map(usersData.map(u => [u.id, u]));

  return results.map((r, i) => ({
    rank: i + 1,
    ...r,
    name: userMap.get(r.userId)?.name || "Anônimo",
    avatarUrl: userMap.get(r.userId)?.avatarUrl,
  }));
}

export async function getPointTransactions(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pointTransactions).where(eq(pointTransactions.userId, userId)).orderBy(desc(pointTransactions.createdAt)).limit(limit);
}

// ===== GAMIFICATION: BADGES =====

export async function getAllBadges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(badges).orderBy(badges.requiredValue);
}

export async function getUserBadges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const ubs = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  if (ubs.length === 0) return [];
  const badgeIds = ubs.map(ub => ub.badgeId);
  const badgesData = await db.select().from(badges).where(inArray(badges.id, badgeIds));
  return badgesData.map(b => ({
    ...b,
    earnedAt: ubs.find(ub => ub.badgeId === b.id)?.earnedAt,
  }));
}

export async function checkAndAwardBadges(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const up = await getUserPoints(userId);
  if (!up) return [];
  const allBadgesData = await getAllBadges();
  const existingBadges = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  const existingIds = new Set(existingBadges.map(ub => ub.badgeId));
  const newBadges: string[] = [];

  for (const badge of allBadgesData) {
    if (existingIds.has(badge.id)) continue;
    let earned = false;
    if (badge.requirement === "articles_read" && up.articlesRead >= badge.requiredValue) earned = true;
    if (badge.requirement === "comments_posted" && up.commentsPosted >= badge.requiredValue) earned = true;
    if (badge.requirement === "shares_count" && up.sharesCount >= badge.requiredValue) earned = true;
    if (badge.requirement === "total_points" && up.totalPoints >= badge.requiredValue) earned = true;
    if (badge.requirement === "streak" && up.streak >= badge.requiredValue) earned = true;
    if (badge.requirement === "ugc_submissions" && up.ugcSubmissions >= badge.requiredValue) earned = true;
    if (badge.requirement === "level" && up.level >= badge.requiredValue) earned = true;

    if (earned) {
      await db.insert(userBadges).values({ userId, badgeId: badge.id });
      newBadges.push(badge.name);
      // Award bonus points for badge
      await db.update(userPoints).set({
        totalPoints: sql`${userPoints.totalPoints} + ${badge.pointsReward}`,
      }).where(eq(userPoints.userId, userId));
    }
  }
  return newBadges;
}

export async function seedDefaultBadges() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(badges).limit(1);
  if (existing.length > 0) return; // already seeded

  const defaultBadges = [
    { slug: "first-read", name: "Primeiro Passo", description: "Leu seu primeiro artigo", iconEmoji: "📖", requirement: "articles_read", requiredValue: 1, pointsReward: 20 },
    { slug: "avid-reader", name: "Leitor Ávido", description: "Leu 10 artigos", iconEmoji: "📚", requirement: "articles_read", requiredValue: 10, pointsReward: 50 },
    { slug: "bookworm", name: "Devorador de Notícias", description: "Leu 50 artigos", iconEmoji: "🐛", requirement: "articles_read", requiredValue: 50, pointsReward: 200 },
    { slug: "first-comment", name: "Voz Ativa", description: "Fez seu primeiro comentário", iconEmoji: "💬", requirement: "comments_posted", requiredValue: 1, pointsReward: 20 },
    { slug: "commentator", name: "Comentarista", description: "Fez 10 comentários", iconEmoji: "🎙️", requirement: "comments_posted", requiredValue: 10, pointsReward: 50 },
    { slug: "sharer", name: "Influenciador", description: "Compartilhou 5 artigos", iconEmoji: "📢", requirement: "shares_count", requiredValue: 5, pointsReward: 50 },
    { slug: "streak-7", name: "Constância", description: "7 dias seguidos ativo", iconEmoji: "🔥", requirement: "streak", requiredValue: 7, pointsReward: 100 },
    { slug: "streak-30", name: "Dedicação Total", description: "30 dias seguidos ativo", iconEmoji: "⭐", requirement: "streak", requiredValue: 30, pointsReward: 500 },
    { slug: "citizen-journalist", name: "Jornalista Cidadão", description: "Enviou seu primeiro conteúdo", iconEmoji: "📝", requirement: "ugc_submissions", requiredValue: 1, pointsReward: 50 },
    { slug: "level-5", name: "Veterano", description: "Alcançou nível 5", iconEmoji: "🏆", requirement: "level", requiredValue: 5, pointsReward: 200 },
    { slug: "level-10", name: "Lenda", description: "Alcançou nível 10", iconEmoji: "👑", requirement: "level", requiredValue: 10, pointsReward: 1000 },
    { slug: "points-1000", name: "Milhar", description: "Acumulou 1000 pontos", iconEmoji: "💎", requirement: "total_points", requiredValue: 1000, pointsReward: 100 },
  ];

  for (const badge of defaultBadges) {
    await db.insert(badges).values(badge);
  }
}

// ===== UGC: USER SUBMISSIONS =====

export async function getUgcSubmissions(status?: string) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(ugcSubmissions).orderBy(desc(ugcSubmissions.createdAt));
  if (status) return results.filter(s => s.status === status);
  return results;
}

export async function getUgcSubmissionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(ugcSubmissions).where(eq(ugcSubmissions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserUgcSubmissions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ugcSubmissions).where(eq(ugcSubmissions.userId, userId)).orderBy(desc(ugcSubmissions.createdAt));
}

export async function createUgcSubmission(submission: InsertUgcSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ugcSubmissions).values(submission);
  return result[0].insertId;
}

export async function updateUgcStatus(id: number, status: string, reviewedBy: number, reviewNote?: string, publishedArticleId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, any> = { status: status as any, reviewedBy };
  if (reviewNote) updateData.reviewNote = reviewNote;
  if (publishedArticleId) updateData.publishedArticleId = publishedArticleId;
  await db.update(ugcSubmissions).set(updateData).where(eq(ugcSubmissions.id, id));
}

export async function getUgcCount(status?: string) {
  const db = await getDb();
  if (!db) return 0;
  if (status) {
    const result = await db.select({ count: sql<number>`count(*)` }).from(ugcSubmissions).where(eq(ugcSubmissions.status, status as any));
    return result[0]?.count ?? 0;
  }
  const result = await db.select({ count: sql<number>`count(*)` }).from(ugcSubmissions);
  return result[0]?.count ?? 0;
}

// ===== HYBRID RECOMMENDATION ENGINE =====

export async function trackInteraction(userId: number, articleId: number, type: string, weight = 1) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userArticleInteractions).values({
    userId,
    articleId,
    interactionType: type as any,
    weight,
  });
}

export async function getHybridRecommendations(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  // 1. Content-based: articles similar to what user has read
  const userHistory = await db.select({ articleId: readingHistory.articleId, category: readingHistory.category })
    .from(readingHistory)
    .where(eq(readingHistory.userId, userId))
    .orderBy(desc(readingHistory.createdAt))
    .limit(20);

  const readArticleIds = new Set(userHistory.map(h => h.articleId));

  // Get user's category preferences (weighted by frequency)
  const categoryWeights: Record<string, number> = {};
  userHistory.forEach(h => {
    if (h.category) categoryWeights[h.category] = (categoryWeights[h.category] || 0) + 1;
  });

  // 2. Collaborative: find users who read similar articles, get what they also read
  const collaborativeIds = new Set<number>();
  if (readArticleIds.size > 0) {
    const readIds = Array.from(readArticleIds);
    // Find other users who read the same articles
    const similarUsers = await db.select({ userId: readingHistory.userId })
      .from(readingHistory)
      .where(and(
        inArray(readingHistory.articleId, readIds),
        sql`${readingHistory.userId} != ${userId}`
      ))
      .groupBy(readingHistory.userId)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    if (similarUsers.length > 0) {
      const simUserIds = similarUsers.map(u => u.userId);
      const theirReads = await db.select({ articleId: readingHistory.articleId })
        .from(readingHistory)
        .where(inArray(readingHistory.userId, simUserIds))
        .orderBy(desc(readingHistory.createdAt))
        .limit(50);
      theirReads.forEach(r => {
        if (!readArticleIds.has(r.articleId)) collaborativeIds.add(r.articleId);
      });
    }
  }

  // 3. Get all online articles
  const allArticles = await db.select().from(articles)
    .where(eq(articles.status, "online"))
    .orderBy(desc(articles.createdAt))
    .limit(200);

  // 4. Score each article
  const scored = allArticles
    .filter(a => !readArticleIds.has(a.id))
    .map(a => {
      let score = 0;
      // Content-based score: category match
      if (categoryWeights[a.category]) score += categoryWeights[a.category] * 10;
      // Tag overlap
      if (a.tags) {
        try {
          const articleTags = JSON.parse(a.tags);
          // Simple tag matching with user history
          score += articleTags.length * 2;
        } catch {}
      }
      // Collaborative score: recommended by similar users
      if (collaborativeIds.has(a.id)) score += 30;
      // Popularity boost (diminishing returns)
      score += Math.log2(a.viewCount + 1) * 2;
      // Recency boost
      const ageHours = (Date.now() - new Date(a.createdAt).getTime()) / 3600000;
      score += Math.max(0, 20 - ageHours * 0.5);
      // Breaking/hero boost
      if (a.isBreaking) score += 15;
      if (a.isHero) score += 10;
      return { ...a, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export async function computeArticleSimilarity(articleId: number) {
  const db = await getDb();
  if (!db) return;
  const article = await getArticleById(articleId);
  if (!article) return;

  const allOnline = await db.select().from(articles)
    .where(and(eq(articles.status, "online"), sql`${articles.id} != ${articleId}`))
    .limit(100);

  const articleTags = article.tags ? JSON.parse(article.tags) : [];

  for (const other of allOnline) {
    let score = 0;
    // Category match
    if (other.category === article.category) score += 40;
    // Tag overlap
    const otherTags = other.tags ? JSON.parse(other.tags) : [];
    const overlap = articleTags.filter((t: string) => otherTags.includes(t)).length;
    score += overlap * 20;
    // Title word overlap
    const titleWords = new Set(article.title.toLowerCase().split(/\s+/));
    const otherTitleWords = other.title.toLowerCase().split(/\s+/);
    const titleOverlap = otherTitleWords.filter(w => titleWords.has(w) && w.length > 3).length;
    score += titleOverlap * 5;

    if (score > 10) {
      await db.insert(articleSimilarity).values({
        articleId,
        similarArticleId: other.id,
        score: Math.min(100, score),
      });
    }
  }
}

export async function getSimilarArticles(articleId: number, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  const sims = await db.select().from(articleSimilarity)
    .where(eq(articleSimilarity.articleId, articleId))
    .orderBy(desc(articleSimilarity.score))
    .limit(limit);

  if (sims.length === 0) return [];
  const simIds = sims.map(s => s.similarArticleId);
  return db.select().from(articles).where(inArray(articles.id, simIds));
}

// ===== AUDIT LOGS (Security Monitoring) =====

export async function createAuditLog(log: Omit<InsertAuditLog, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values(log);
  } catch (e) {
    console.error("[Audit] Failed to write log:", e);
  }
}

export async function getAuditLogs(filters?: { severity?: string; action?: string; userId?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const limit = filters?.limit ?? 100;
  const conditions = [];
  if (filters?.severity) conditions.push(eq(auditLogs.severity, filters.severity as any));
  if (filters?.action) conditions.push(like(auditLogs.action, `%${filters.action}%`));
  if (filters?.userId) conditions.push(eq(auditLogs.userId, filters.userId));

  if (conditions.length > 0) {
    return db.select().from(auditLogs).where(and(...conditions)).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function getAuditLogCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
  return result[0]?.count ?? 0;
}

// ===== CNN SHORTS =====

export async function getShorts(filters?: { status?: string; category?: string; limit?: number; isHighlight?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(shorts);
  const conditions: any[] = [];
  if (filters?.status) conditions.push(eq(shorts.status, filters.status as any));
  if (filters?.category) conditions.push(eq(shorts.category, filters.category));
  if (filters?.isHighlight !== undefined) conditions.push(eq(shorts.isHighlight, filters.isHighlight));
  if (conditions.length > 0) query = query.where(and(...conditions)) as any;
  return query.orderBy(desc(shorts.createdAt)).limit(filters?.limit ?? 50);
}

export async function getShortById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(shorts).where(eq(shorts.id, id)).limit(1);
  return result[0];
}

export async function createShort(data: Partial<InsertShort> & { title: string; videoUrl: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(shorts).values({
    title: data.title,
    description: data.description,
    videoUrl: data.videoUrl,
    thumbnailUrl: data.thumbnailUrl,
    category: data.category || "GERAL",
    duration: data.duration || 0,
    authorId: data.authorId,
    authorName: data.authorName,
    status: data.status || "draft",
    isHighlight: data.isHighlight || false,
    publishedAt: data.status === "online" ? new Date() : undefined,
  });
  return result[0].insertId;
}

export async function updateShort(id: number, data: Partial<InsertShort>) {
  const db = await getDb();
  if (!db) return;
  await db.update(shorts).set(data).where(eq(shorts.id, id));
}

export async function deleteShort(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(shortComments).where(eq(shortComments.shortId, id));
  await db.delete(shortLikes).where(eq(shortLikes.shortId, id));
  await db.delete(shorts).where(eq(shorts.id, id));
}

export async function incrementShortView(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(shorts).set({ viewCount: sql`${shorts.viewCount} + 1` }).where(eq(shorts.id, id));
}

export async function toggleShortLike(shortId: number, userId: number) {
  const db = await getDb();
  if (!db) return { liked: false };
  // Check if already liked
  const existing = await db.select().from(shortLikes)
    .where(and(eq(shortLikes.shortId, shortId), eq(shortLikes.userId, userId)))
    .limit(1);
  if (existing.length > 0) {
    // Unlike
    await db.delete(shortLikes).where(and(eq(shortLikes.shortId, shortId), eq(shortLikes.userId, userId)));
    await db.update(shorts).set({ likeCount: sql`GREATEST(${shorts.likeCount} - 1, 0)` }).where(eq(shorts.id, shortId));
    return { liked: false };
  } else {
    // Like
    await db.insert(shortLikes).values({ shortId, userId });
    await db.update(shorts).set({ likeCount: sql`${shorts.likeCount} + 1` }).where(eq(shorts.id, shortId));
    return { liked: true };
  }
}

export async function incrementShortShare(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(shorts).set({ shareCount: sql`${shorts.shareCount} + 1` }).where(eq(shorts.id, id));
}

export async function getUserShortLikes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({ shortId: shortLikes.shortId }).from(shortLikes).where(eq(shortLikes.userId, userId));
  return result.map(r => r.shortId);
}

// ===== SHORT COMMENTS =====

export async function getShortComments(shortId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shortComments).where(eq(shortComments.shortId, shortId)).orderBy(desc(shortComments.createdAt)).limit(100);
}

export async function createShortComment(data: { shortId: number; userId?: number; authorName?: string; content: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(shortComments).values({
    shortId: data.shortId,
    userId: data.userId,
    authorName: data.authorName || "Anônimo",
    content: data.content,
  });
  // Increment comment count
  await db.update(shorts).set({ commentCount: sql`${shorts.commentCount} + 1` }).where(eq(shorts.id, data.shortId));
  return result[0].insertId;
}

export async function deleteShortComment(id: number) {
  const db = await getDb();
  if (!db) return;
  const comment = await db.select().from(shortComments).where(eq(shortComments.id, id)).limit(1);
  if (comment[0]) {
    await db.update(shorts).set({ commentCount: sql`GREATEST(${shorts.commentCount} - 1, 0)` }).where(eq(shorts.id, comment[0].shortId));
  }
  await db.delete(shortComments).where(eq(shortComments.id, id));
}

export async function getShortCount(status?: string) {
  const db = await getDb();
  if (!db) return 0;
  let query = db.select({ count: sql<number>`count(*)` }).from(shorts);
  if (status) query = query.where(eq(shorts.status, status as any)) as any;
  const result = await query;
  return result[0]?.count ?? 0;
}

// ===== NEWSLETTER SUBSCRIBERS =====

export async function subscribeNewsletter(data: { name: string; email: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if already exists
  const existing = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, data.email)).limit(1);
  if (existing.length > 0) {
    // Reactivate if unsubscribed
    if (existing[0].status === "unsubscribed") {
      await db.update(newsletterSubscribers).set({ status: "active", name: data.name }).where(eq(newsletterSubscribers.id, existing[0].id));
      return { id: existing[0].id, reactivated: true };
    }
    return { id: existing[0].id, alreadySubscribed: true };
  }
  const result = await db.insert(newsletterSubscribers).values({ name: data.name, email: data.email });
  return { id: result[0].insertId, new: true };
}

export async function getNewsletterSubscribers(status?: string) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(newsletterSubscribers);
  if (status) query = query.where(eq(newsletterSubscribers.status, status as any)) as any;
  return query.orderBy(desc(newsletterSubscribers.createdAt));
}

export async function getNewsletterCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "active"));
  return result[0]?.count ?? 0;
}

export async function unsubscribeNewsletter(email: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(newsletterSubscribers).set({ status: "unsubscribed" }).where(eq(newsletterSubscribers.email, email));
}

// ===== GLOBAL NEWS CACHE =====

export async function saveGlobalNews(items: Partial<InsertGlobalNewsItem>[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (const item of items) {
    // Check if already exists by originalUrl
    const existing = await db.select().from(globalNewsCache).where(eq(globalNewsCache.originalUrl, item.originalUrl!)).limit(1);
    if (existing.length === 0) {
      await db.insert(globalNewsCache).values(item as InsertGlobalNewsItem);
    }
  }
}

export async function getGlobalNews(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(globalNewsCache)
    .where(eq(globalNewsCache.isPublished, true))
    .orderBy(desc(globalNewsCache.fetchedAt))
    .limit(limit);
}

export async function getGlobalNewsForRewrite(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(globalNewsCache)
    .where(and(
      eq(globalNewsCache.isPublished, false),
      sql`${globalNewsCache.rewrittenTitle} IS NULL`
    ))
    .orderBy(desc(globalNewsCache.fetchedAt))
    .limit(limit);
}

export async function updateGlobalNewsRewrite(id: number, data: { rewrittenTitle: string; rewrittenExcerpt: string; rewrittenContent: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(globalNewsCache).set({ ...data, isPublished: true, publishedAt: new Date() }).where(eq(globalNewsCache.id, id));
}

export async function getAllGlobalNews(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(globalNewsCache).orderBy(desc(globalNewsCache.fetchedAt)).limit(limit);
}

// ===== ADMIN USERS =====
export async function getAdminUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(adminUsers)
    .where(eq(adminUsers.email, email.toLowerCase().trim()))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAdminUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createAdminUser(data: Omit<InsertAdminUser, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) return null;
  // Normalize email to lowercase
  const normalized = { ...data, email: data.email.toLowerCase().trim() };
  await db.insert(adminUsers).values(normalized);
  return getAdminUserByEmail(normalized.email);
}

export async function listAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: adminUsers.id,
    name: adminUsers.name,
    email: adminUsers.email,
    role: adminUsers.role,
    isActive: adminUsers.isActive,
    lastLogin: adminUsers.lastLogin,
    createdAt: adminUsers.createdAt,
    createdBy: adminUsers.createdBy,
  }).from(adminUsers).orderBy(adminUsers.createdAt);
}

export async function updateAdminUser(id: number, data: Partial<Pick<InsertAdminUser, 'name' | 'role' | 'isActive' | 'passwordHash'>>) {
  const db = await getDb();
  if (!db) return;
  await db.update(adminUsers).set({ ...data, updatedAt: new Date() }).where(eq(adminUsers.id, id));
}

export async function deleteAdminUser(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
}

export async function updateAdminLastLogin(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(adminUsers).set({ lastLogin: new Date() }).where(eq(adminUsers.id, id));
}

// ===== RICH STATS =====

export async function getArticlesPerDay(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);
  const result = await db.select({
    date: sql<string>`DATE(${articles.publishedAt})`,
    count: sql<number>`count(*)`,
  })
    .from(articles)
    .where(and(
      eq(articles.status, "online"),
      sql`${articles.publishedAt} >= ${since}`
    ))
    .groupBy(sql`DATE(${articles.publishedAt})`)
    .orderBy(sql`DATE(${articles.publishedAt}) ASC`);
  return result;
}

export async function getTopArticles(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: articles.id,
    title: articles.title,
    slug: articles.slug,
    category: articles.category,
    viewCount: articles.viewCount,
    publishedAt: articles.publishedAt,
  })
    .from(articles)
    .where(eq(articles.status, "online"))
    .orderBy(desc(articles.viewCount))
    .limit(limit);
}

export async function getCategoryDistribution() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    category: articles.category,
    count: sql<number>`count(*)`,
  })
    .from(articles)
    .where(eq(articles.status, "online"))
    .groupBy(articles.category)
    .orderBy(sql`count(*) DESC`);
}

export async function getRecentActivity(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: articles.id,
    title: articles.title,
    slug: articles.slug,
    category: articles.category,
    status: articles.status,
    publishedAt: articles.publishedAt,
    createdAt: articles.createdAt,
  })
    .from(articles)
    .orderBy(desc(articles.createdAt))
    .limit(limit);
}
