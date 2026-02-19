import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module with all functions
vi.mock("./db", () => ({
  // Articles
  getArticles: vi.fn().mockResolvedValue([
    { id: 1, title: "Test Article", slug: "test-article", excerpt: "Test excerpt", content: "Content", category: "GERAL", tags: null, imageUrl: null, videoUrl: null, status: "online", isHero: false, isBreaking: false, viewCount: 10, shareCount: 2, commentCount: 1, readTimeMinutes: 3, authorId: 1, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
    { id: 2, title: "Hero Article", slug: "hero-article", excerpt: "Hero excerpt", content: "Hero content", category: "POLÍTICA", tags: '["política"]', imageUrl: "https://example.com/img.jpg", videoUrl: null, status: "online", isHero: true, isBreaking: false, viewCount: 50, shareCount: 5, commentCount: 3, readTimeMinutes: 5, authorId: 1, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
  ]),
  getArticleById: vi.fn().mockImplementation(async (id: number) => {
    if (id === 1) return { id: 1, title: "Test Article", slug: "test-article", excerpt: "Test excerpt", content: "Content", category: "GERAL", tags: null, imageUrl: null, videoUrl: null, status: "online", isHero: false, isBreaking: false, viewCount: 10, shareCount: 2, commentCount: 1, readTimeMinutes: 3, authorId: 1, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
    return undefined;
  }),
  getArticleBySlug: vi.fn().mockImplementation(async (slug: string) => {
    if (slug === "test-article") return { id: 1, title: "Test Article", slug: "test-article", excerpt: "Test excerpt", content: "Content", category: "GERAL", tags: null, imageUrl: null, videoUrl: null, status: "online", isHero: false, isBreaking: false, viewCount: 10, shareCount: 2, commentCount: 1, readTimeMinutes: 3, authorId: 1, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
    return undefined;
  }),
  createArticle: vi.fn().mockResolvedValue(3),
  updateArticle: vi.fn().mockResolvedValue(undefined),
  deleteArticle: vi.fn().mockResolvedValue(undefined),
  incrementViewCount: vi.fn().mockResolvedValue(undefined),
  incrementShareCount: vi.fn().mockResolvedValue(undefined),
  createRevision: vi.fn().mockResolvedValue(1),
  getRevisions: vi.fn().mockResolvedValue([]),
  upsertTag: vi.fn().mockResolvedValue(undefined),
  getTags: vi.fn().mockResolvedValue([{ id: 1, name: "política", slug: "politica", articleCount: 5 }]),

  // Ticker
  getTickerItems: vi.fn().mockResolvedValue([{ id: 1, text: "Breaking news ticker", isActive: true, createdAt: new Date() }]),
  createTickerItem: vi.fn().mockResolvedValue(2),
  deleteTickerItem: vi.fn().mockResolvedValue(undefined),

  // Ads
  getAds: vi.fn().mockResolvedValue([]),
  createAd: vi.fn().mockResolvedValue(1),
  updateAd: vi.fn().mockResolvedValue(undefined),
  deleteAd: vi.fn().mockResolvedValue(undefined),

  // Settings
  getSetting: vi.fn().mockResolvedValue(undefined),
  getAllSettings: vi.fn().mockResolvedValue([]),
  upsertSetting: vi.fn().mockResolvedValue(undefined),

  // Stats
  getArticleCount: vi.fn().mockResolvedValue(5),
  getTotalViews: vi.fn().mockResolvedValue(100),
  getCommentCount: vi.fn().mockResolvedValue(15),
  getUserCount: vi.fn().mockResolvedValue(42),

  // Comments
  getComments: vi.fn().mockResolvedValue([{ id: 1, articleId: 1, content: "Great article!", authorName: "Reader", status: "approved", likes: 3, createdAt: new Date() }]),
  getAllComments: vi.fn().mockResolvedValue([{ id: 1, articleId: 1, content: "Great article!", authorName: "Reader", status: "approved", likes: 3, createdAt: new Date() }]),
  createComment: vi.fn().mockResolvedValue(2),
  updateCommentStatus: vi.fn().mockResolvedValue(undefined),
  likeComment: vi.fn().mockResolvedValue(undefined),
  deleteComment: vi.fn().mockResolvedValue(undefined),

  // Notifications
  getNotifications: vi.fn().mockResolvedValue([]),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(0),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue(1),

  // Personalization
  getPersonalizedRecommendations: vi.fn().mockResolvedValue([]),
  addReadingHistory: vi.fn().mockResolvedValue(undefined),
  getUserReadingHistory: vi.fn().mockResolvedValue([]),
  getUserPreferences: vi.fn().mockResolvedValue(null),
  upsertUserPreferences: vi.fn().mockResolvedValue(undefined),

  // Search
  searchArticles: vi.fn().mockResolvedValue([{ id: 1, title: "Test Article", excerpt: "Test excerpt", category: "GERAL", imageUrl: null, createdAt: new Date() }]),

  // Media
  getMediaItems: vi.fn().mockResolvedValue([]),
  deleteMediaItem: vi.fn().mockResolvedValue(undefined),

  // Users
  getUsers: vi.fn().mockResolvedValue([{ id: 1, name: "Admin", email: "admin@test.com", role: "admin", createdAt: new Date() }]),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getDb: vi.fn(),

  // Gamification
  getUserPoints: vi.fn().mockResolvedValue({ totalPoints: 150, level: 2, articlesRead: 15, commentsCount: 5, sharesCount: 3 }),
  getUserBadges: vi.fn().mockResolvedValue([{ id: 1, name: "Leitor Iniciante", iconEmoji: "📖" }]),
  getLeaderboard: vi.fn().mockResolvedValue([{ userId: 1, name: "Top Reader", totalPoints: 500, level: 5, articlesRead: 50, rank: 1 }]),
  getAllBadges: vi.fn().mockResolvedValue([{ id: 1, name: "Leitor Iniciante", description: "Leu 5 artigos", iconEmoji: "📖", pointsReward: 50 }]),
  getPointTransactions: vi.fn().mockResolvedValue([]),
  awardPoints: vi.fn().mockResolvedValue({ pointsAwarded: 10, newTotal: 160 }),
  seedDefaultBadges: vi.fn().mockResolvedValue(undefined),

  // UGC
  getUgcSubmissions: vi.fn().mockResolvedValue([{ id: 1, title: "User Story", content: "My story content", category: "GERAL", userId: 2, status: "pending", createdAt: new Date() }]),
  getUserUgcSubmissions: vi.fn().mockResolvedValue([]),
  createUgcSubmission: vi.fn().mockResolvedValue(1),
  getUgcSubmissionById: vi.fn().mockResolvedValue({ id: 1, title: "User Story", content: "My story content", category: "GERAL", userId: 2, imageUrl: null, videoUrl: null }),
  updateUgcStatus: vi.fn().mockResolvedValue(undefined),
  getUgcCount: vi.fn().mockResolvedValue(3),

  // Recommendations
  getHybridRecommendations: vi.fn().mockResolvedValue([]),
  getSimilarArticles: vi.fn().mockResolvedValue([]),
  trackInteraction: vi.fn().mockResolvedValue(undefined),

  // Audit
  getAuditLogs: vi.fn().mockResolvedValue([{ id: 1, action: "login", severity: "info", userId: 1, userName: "Admin", createdAt: new Date() }]),
  getAuditLogCount: vi.fn().mockResolvedValue(10),
  createAuditLog: vi.fn().mockResolvedValue(1),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@cnnbra.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@cnnbra.com",
      name: "User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ===== ARTICLES =====
describe("articles", () => {
  it("lists articles publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.articles.list({});
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Test Article");
  });

  it("gets article by id publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.articles.getById({ id: 1 });
    expect(result).toBeDefined();
    expect(result?.title).toBe("Test Article");
  });

  it("gets article by slug publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.articles.getBySlug({ slug: "test-article" });
    expect(result).toBeDefined();
    expect(result?.title).toBe("Test Article");
  });

  it("returns undefined for non-existent article", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.articles.getById({ id: 999 });
    expect(result).toBeUndefined();
  });

  it("increments view count publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.articles.incrementView({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("increments share count publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.articles.incrementShare({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("creates article as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.articles.create({
      title: "New Article",
      category: "ESPORTES",
      status: "online",
    });
    expect(result).toEqual({ id: 3 });
  });

  it("rejects article creation for regular user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.articles.create({ title: "Unauthorized", category: "GERAL" })).rejects.toThrow();
  });

  it("rejects article creation for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.articles.create({ title: "Unauthorized", category: "GERAL" })).rejects.toThrow();
  });

  it("updates article as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.articles.update({ id: 1, title: "Updated Title" });
    expect(result).toEqual({ success: true });
  });

  it("deletes article as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.articles.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

// ===== TICKER =====
describe("ticker", () => {
  it("lists ticker items publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.ticker.list();
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Breaking news ticker");
  });

  it("creates ticker item as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.ticker.create({ text: "New ticker item" });
    expect(result).toEqual({ id: 2 });
  });

  it("rejects ticker creation for non-admin", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.ticker.create({ text: "Unauthorized" })).rejects.toThrow();
  });

  it("deletes ticker item as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.ticker.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

// ===== STATS =====
describe("stats", () => {
  it("returns overview stats for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.stats.overview();
    expect(result.articleCount).toBe(5);
    expect(result.totalViews).toBe(100);
    expect(result.commentCount).toBe(15);
    expect(result.userCount).toBe(42);
  });

  it("rejects stats for non-admin", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.stats.overview()).rejects.toThrow();
  });
});

// ===== COMMENTS =====
describe("comments", () => {
  it("lists approved comments publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.comments.list({ articleId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("Great article!");
  });

  it("creates comment publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.comments.create({ articleId: 1, content: "Nice article!" });
    expect(result).toEqual({ id: 2 });
  });

  it("likes comment publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.comments.like({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("moderates comment as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.comments.moderate({ id: 1, status: "approved" });
    expect(result).toEqual({ success: true });
  });

  it("deletes comment as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.comments.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("lists all comments as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.comments.listAll({});
    expect(result).toHaveLength(1);
  });
});

// ===== SEARCH =====
describe("search", () => {
  it("searches articles publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.search.query({ q: "Test" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test Article");
  });
});

// ===== TAGS =====
describe("tags", () => {
  it("lists tags publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.tags.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("política");
  });
});

// ===== GAMIFICATION =====
describe("gamification", () => {
  it("gets user points when authenticated", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.gamification.myPoints();
    expect(result.points.totalPoints).toBe(150);
    expect(result.points.level).toBe(2);
    expect(result.badges).toHaveLength(1);
  });

  it("rejects myPoints for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.gamification.myPoints()).rejects.toThrow();
  });

  it("gets leaderboard publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.gamification.leaderboard({});
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Top Reader");
    expect(result[0].rank).toBe(1);
  });

  it("gets all badges publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.gamification.allBadges();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Leitor Iniciante");
  });

  it("awards action points when authenticated", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.gamification.awardAction({ action: "read_article", referenceId: 1 });
    expect(result.pointsAwarded).toBe(10);
    expect(result.newTotal).toBe(160);
  });

  it("seeds badges as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.gamification.seedBadges();
    expect(result).toEqual({ success: true });
  });

  it("rejects seedBadges for non-admin", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.gamification.seedBadges()).rejects.toThrow();
  });
});

// ===== UGC =====
describe("ugc", () => {
  it("lists UGC submissions as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.ugc.list({});
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("User Story");
  });

  it("rejects UGC list for non-admin", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.ugc.list({})).rejects.toThrow();
  });

  it("submits UGC when authenticated", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.ugc.submit({
      title: "My News Story",
      content: "This is a detailed story about something important.",
      category: "GERAL",
    });
    expect(result).toEqual({ id: 1 });
  });

  it("rejects UGC submission for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.ugc.submit({
      title: "Unauthorized Story",
      content: "This should not be allowed without login.",
    })).rejects.toThrow();
  });

  it("moderates UGC as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.ugc.moderate({ id: 1, status: "published", reviewNote: "Approved for publication" });
    expect(result.success).toBe(true);
  });

  it("gets UGC count as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.ugc.count({});
    expect(result).toBe(3);
  });

  it("gets my submissions when authenticated", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.ugc.mySubmissions();
    expect(result).toEqual([]);
  });
});

// ===== RECOMMENDATIONS =====
describe("recommendations", () => {
  it("gets similar articles publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.recommendations.similar({ articleId: 1, limit: 5 });
    expect(result).toEqual([]);
  });

  it("gets hybrid recommendations when authenticated", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.recommendations.forUser({});
    expect(result).toEqual([]);
  });

  it("tracks interaction when authenticated", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.recommendations.trackInteraction({ articleId: 1, type: "view" });
    expect(result).toEqual({ success: true });
  });

  it("rejects recommendations for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.recommendations.forUser({})).rejects.toThrow();
  });
});

// ===== AUDIT LOGS =====
describe("audit", () => {
  it("lists audit logs as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.audit.list({});
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe("login");
  });

  it("gets audit log count as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.audit.count();
    expect(result).toBe(10);
  });

  it("rejects audit logs for non-admin", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.audit.list({})).rejects.toThrow();
  });
});

// ===== NOTIFICATIONS =====
describe("notifications", () => {
  it("lists notifications when authenticated", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.notifications.list();
    expect(result).toEqual([]);
  });

  it("gets unread count when authenticated", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.notifications.unreadCount();
    expect(result).toBe(0);
  });

  it("marks notification as read when authenticated", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.notifications.markRead({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("creates notification as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.notifications.create({ title: "Test Notification", message: "Hello" });
    expect(result).toEqual({ id: 1 });
  });

  it("rejects notification list for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.notifications.list()).rejects.toThrow();
  });
});

// ===== USERS =====
describe("users", () => {
  it("lists users as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.users.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Admin");
  });

  it("updates user role as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.users.updateRole({ id: 2, role: "editor" });
    expect(result).toEqual({ success: true });
  });

  it("rejects user list for non-admin", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.users.list()).rejects.toThrow();
  });
});

// ===== SETTINGS =====
describe("settings", () => {
  it("gets setting publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.settings.get({ key: "site_name" });
    expect(result).toBeUndefined();
  });

  it("sets setting as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.settings.set({ key: "site_name", value: "CNN BRA" });
    expect(result).toEqual({ success: true });
  });
});

// ===== ADS =====
describe("ads", () => {
  it("lists ads publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.ads.list({});
    expect(result).toEqual([]);
  });

  it("creates ad as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.ads.create({ imageUrl: "https://example.com/ad.jpg", sponsor: "Test Sponsor" });
    expect(result).toEqual({ id: 1 });
  });

  it("deletes ad as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.ads.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

// ===== PUBLIC API (CMS Headless) =====
describe("public api", () => {
  it("returns formatted articles via public API", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.api.articles({});
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("title");
    expect(result[0]).toHaveProperty("slug");
  });
});
