import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";

// ===== USERS =====
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "editor", "journalist"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ===== ARTICLES (CMS Headless) =====
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  subtitle: varchar("subtitle", { length: 500 }),
  slug: varchar("slug", { length: 600 }).unique(),
  excerpt: text("excerpt"),
  content: text("content"),
  category: varchar("category", { length: 100 }).notNull().default("GERAL"),
  tags: text("tags"), // JSON array of tags
  imageUrl: text("imageUrl"),
  imageCredit: varchar("imageCredit", { length: 300 }),
  videoUrl: text("videoUrl"),
  status: mysqlEnum("status", ["online", "draft", "review", "scheduled"]).default("draft").notNull(),
  isHero: boolean("isHero").default(false).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isBreaking: boolean("isBreaking").default(false).notNull(),
  state: varchar("state", { length: 2 }), // Brazilian state code (AL, SP, RJ, etc.)
  authorId: int("authorId"),
  reviewerId: int("reviewerId"),
  viewCount: int("viewCount").default(0).notNull(),
  shareCount: int("shareCount").default(0).notNull(),
  commentCount: int("commentCount").default(0).notNull(),
  readTimeMinutes: int("readTimeMinutes").default(1).notNull(),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

// ===== ARTICLE REVISIONS (Editorial Workflow) =====
export const articleRevisions = mysqlTable("article_revisions", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content"),
  editorId: int("editorId").notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArticleRevision = typeof articleRevisions.$inferSelect;
export type InsertArticleRevision = typeof articleRevisions.$inferInsert;

// ===== TAGS =====
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  articleCount: int("articleCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

// ===== MEDIA LIBRARY =====
export const mediaLibrary = mysqlTable("media_library", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 500 }).notNull(),
  url: text("url").notNull(),
  fileKey: text("fileKey").notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  sizeBytes: bigint("sizeBytes", { mode: "number" }),
  width: int("width"),
  height: int("height"),
  alt: text("alt"),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MediaItem = typeof mediaLibrary.$inferSelect;
export type InsertMediaItem = typeof mediaLibrary.$inferInsert;

// ===== COMMENTS (Microservice) =====
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  userId: int("userId"),
  authorName: varchar("authorName", { length: 200 }),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  parentId: int("parentId"),
  likesCount: int("likesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// ===== NOTIFICATIONS =====
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["breaking", "new_article", "comment_reply", "system"]).default("system").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  message: text("message"),
  articleId: int("articleId"),
  isGlobal: boolean("isGlobal").default(false).notNull(),
  targetUserId: int("targetUserId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ===== READING HISTORY (Personalization) =====
export const readingHistory = mysqlTable("reading_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  articleId: int("articleId").notNull(),
  category: varchar("category", { length: 100 }),
  readDurationSeconds: int("readDurationSeconds").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReadingHistoryEntry = typeof readingHistory.$inferSelect;
export type InsertReadingHistoryEntry = typeof readingHistory.$inferInsert;

// ===== USER PREFERENCES =====
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  favoriteCategories: text("favoriteCategories"), // JSON array
  notificationsEnabled: boolean("notificationsEnabled").default(true).notNull(),
  breakingNewsAlerts: boolean("breakingNewsAlerts").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

// ===== ADS =====
export const ads = mysqlTable("ads", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["google", "custom"]).default("custom").notNull(),
  placement: mysqlEnum("placement", ["home-top", "home-mid", "home-sidebar", "article-mid", "article-sidebar", "horizontal", "lateral", "middle"]).default("home-top").notNull(),
  imageUrl: text("imageUrl"),
  adCode: text("adCode"), // Google AdSense or custom HTML/JS code
  link: text("link"),
  sponsor: varchar("sponsor", { length: 255 }),
  duration: int("duration").default(5000).notNull(),
  position: int("position").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ad = typeof ads.$inferSelect;
export type InsertAd = typeof ads.$inferInsert;

// ===== SITE SETTINGS =====
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

// ===== TICKER =====
export const tickerItems = mysqlTable("ticker_items", {
  id: int("id").autoincrement().primaryKey(),
  text: text("text").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TickerItem = typeof tickerItems.$inferSelect;
export type InsertTickerItem = typeof tickerItems.$inferInsert;

// ===== IMAGE CACHE (CDN/Edge) =====
export const imageCache = mysqlTable("image_cache", {
  id: int("id").autoincrement().primaryKey(),
  originalUrl: text("originalUrl").notNull(),
  optimizedUrl: text("optimizedUrl").notNull(),
  width: int("width"),
  height: int("height"),
  format: varchar("format", { length: 20 }),
  quality: int("quality"),
  sizeBytes: bigint("sizeBytes", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ImageCacheEntry = typeof imageCache.$inferSelect;
export type InsertImageCacheEntry = typeof imageCache.$inferInsert;

// ===== GAMIFICATION: USER POINTS =====
export const userPoints = mysqlTable("user_points", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalPoints: int("totalPoints").default(0).notNull(),
  articlesRead: int("articlesRead").default(0).notNull(),
  commentsPosted: int("commentsPosted").default(0).notNull(),
  sharesCount: int("sharesCount").default(0).notNull(),
  ugcSubmissions: int("ugcSubmissions").default(0).notNull(),
  streak: int("streak").default(0).notNull(), // consecutive days active
  lastActiveDate: varchar("lastActiveDate", { length: 10 }), // YYYY-MM-DD
  level: int("level").default(1).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPointsEntry = typeof userPoints.$inferSelect;
export type InsertUserPointsEntry = typeof userPoints.$inferInsert;

// ===== GAMIFICATION: POINT TRANSACTIONS =====
export const pointTransactions = mysqlTable("point_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: mysqlEnum("action", ["read_article", "post_comment", "share_article", "submit_ugc", "ugc_approved", "daily_login", "streak_bonus", "quiz_complete"]).notNull(),
  points: int("points").notNull(),
  referenceId: int("referenceId"), // articleId, commentId, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type InsertPointTransaction = typeof pointTransactions.$inferInsert;

// ===== GAMIFICATION: BADGES =====
export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  iconEmoji: varchar("iconEmoji", { length: 10 }).notNull().default("🏆"),
  requirement: varchar("requirement", { length: 100 }).notNull(), // e.g. "articles_read_10"
  requiredValue: int("requiredValue").default(1).notNull(),
  pointsReward: int("pointsReward").default(50).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

// ===== GAMIFICATION: USER BADGES =====
export const userBadges = mysqlTable("user_badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeId: int("badgeId").notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

// ===== UGC: USER SUBMISSIONS =====
export const ugcSubmissions = mysqlTable("ugc_submissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }).default("GERAL"),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  location: varchar("location", { length: 300 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "published"]).default("pending").notNull(),
  reviewNote: text("reviewNote"),
  reviewedBy: int("reviewedBy"),
  publishedArticleId: int("publishedArticleId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UgcSubmission = typeof ugcSubmissions.$inferSelect;
export type InsertUgcSubmission = typeof ugcSubmissions.$inferInsert;

// ===== RECOMMENDATION: ARTICLE SIMILARITY =====
export const articleSimilarity = mysqlTable("article_similarity", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  similarArticleId: int("similarArticleId").notNull(),
  score: int("score").default(0).notNull(), // 0-100 similarity score
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArticleSimilarityEntry = typeof articleSimilarity.$inferSelect;
export type InsertArticleSimilarityEntry = typeof articleSimilarity.$inferInsert;

// ===== RECOMMENDATION: USER-ARTICLE INTERACTIONS =====
export const userArticleInteractions = mysqlTable("user_article_interactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  articleId: int("articleId").notNull(),
  interactionType: mysqlEnum("interactionType", ["view", "read_full", "comment", "share", "like"]).notNull(),
  weight: int("weight").default(1).notNull(), // interaction strength
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserArticleInteraction = typeof userArticleInteractions.$inferSelect;
export type InsertUserArticleInteraction = typeof userArticleInteractions.$inferInsert;

// ===== AUDIT LOGS (Security Monitoring) =====
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  userName: varchar("userName", { length: 200 }),
  action: varchar("action", { length: 100 }).notNull(), // e.g. "login", "article.create", "comment.moderate"
  resource: varchar("resource", { length: 100 }), // e.g. "article", "comment", "ugc"
  resourceId: int("resourceId"),
  details: text("details"), // JSON with additional context
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ===== CNN SHORTS (Vídeos Curtos) =====
export const shorts = mysqlTable("shorts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  category: varchar("category", { length: 100 }).default("GERAL").notNull(),
  duration: int("duration").default(0).notNull(), // seconds
  authorId: int("authorId"),
  authorName: varchar("authorName", { length: 200 }),
  status: mysqlEnum("status", ["online", "draft", "review"]).default("draft").notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  shareCount: int("shareCount").default(0).notNull(),
  commentCount: int("commentCount").default(0).notNull(),
  isHighlight: boolean("isHighlight").default(false).notNull(),
  articleId: int("articleId"), // linked article (if from article)
  youtubeId: varchar("youtubeId", { length: 50 }), // YouTube video ID
  sourceType: mysqlEnum("sourceType", ["manual", "article", "youtube", "ai"]).default("manual").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Short = typeof shorts.$inferSelect;
export type InsertShort = typeof shorts.$inferInsert;

// ===== SHORTS COMMENTS =====
export const shortComments = mysqlTable("short_comments", {
  id: int("id").autoincrement().primaryKey(),
  shortId: int("shortId").notNull(),
  userId: int("userId"),
  authorName: varchar("authorName", { length: 200 }),
  content: text("content").notNull(),
  likesCount: int("likesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShortComment = typeof shortComments.$inferSelect;
export type InsertShortComment = typeof shortComments.$inferInsert;

// ===== SHORTS LIKES (prevent duplicate likes) =====
export const shortLikes = mysqlTable("short_likes", {
  id: int("id").autoincrement().primaryKey(),
  shortId: int("shortId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShortLike = typeof shortLikes.$inferSelect;
export type InsertShortLike = typeof shortLikes.$inferInsert;

// ===== NEWSLETTER SUBSCRIBERS =====
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  status: mysqlEnum("status", ["active", "unsubscribed"]).default("active").notNull(),
  source: varchar("source", { length: 100 }).default("website"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

// ===== GLOBAL NEWS CACHE (auto-fetched & rewritten) =====
export const globalNewsCache = mysqlTable("global_news_cache", {
  id: int("id").autoincrement().primaryKey(),
  originalTitle: varchar("originalTitle", { length: 500 }).notNull(),
  originalSource: varchar("originalSource", { length: 300 }).notNull(),
  originalUrl: text("originalUrl").notNull(),
  rewrittenTitle: varchar("rewrittenTitle", { length: 500 }),
  rewrittenExcerpt: text("rewrittenExcerpt"),
  rewrittenContent: text("rewrittenContent"),
  imageUrl: text("imageUrl"),
  category: varchar("category", { length: 100 }).default("GLOBAL").notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GlobalNewsItem = typeof globalNewsCache.$inferSelect;
export type InsertGlobalNewsItem = typeof globalNewsCache.$inferInsert;

// ===== ADMIN USERS (CMS access with role-based permissions) =====
export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(), // bcrypt hash
  role: mysqlEnum("role", ["admin", "editor", "contributor"]).default("contributor").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy"), // id of admin who created this account
  lastLogin: timestamp("lastLogin"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

// ===== TRENDING TOPICS (Google Trends BR) =====
export const trendingTopics = mysqlTable("trending_topics", {
  id: int("id").autoincrement().primaryKey(),
  topic: varchar("topic", { length: 300 }).notNull(),           // ex: "predio desaba em bh"
  topicNormalized: varchar("topicNormalized", { length: 300 }), // lowercase, sem acentos
  approxTraffic: varchar("approxTraffic", { length: 50 }),      // ex: "200+", "50K+"
  trafficValue: int("trafficValue").default(0),                  // parsed numeric value for sorting
  imageUrl: text("imageUrl"),                                    // thumbnail do Google
  imageSource: varchar("imageSource", { length: 200 }),         // fonte da imagem
  relatedArticleTitle: varchar("relatedArticleTitle", { length: 500 }), // primeira notícia relacionada
  relatedArticleUrl: text("relatedArticleUrl"),
  relatedArticleSource: varchar("relatedArticleSource", { length: 200 }),
  linkedArticleId: int("linkedArticleId"),                      // artigo publicado no CNN BRA
  pubDate: timestamp("pubDate"),                                 // data de trending no Google
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TrendingTopic = typeof trendingTopics.$inferSelect;
export type InsertTrendingTopic = typeof trendingTopics.$inferInsert;
