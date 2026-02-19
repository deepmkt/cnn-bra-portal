import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  getArticles: vi.fn().mockResolvedValue([
    { id: 1, title: "Test Article", excerpt: "Test excerpt", content: "Content", category: "GERAL", imageUrl: null, status: "online", isHero: false, viewCount: 10, authorId: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: 2, title: "Hero Article", excerpt: "Hero excerpt", content: "Hero content", category: "POLÍTICA", imageUrl: "https://example.com/img.jpg", status: "online", isHero: true, viewCount: 50, authorId: 1, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getArticleById: vi.fn().mockImplementation(async (id: number) => {
    if (id === 1) return { id: 1, title: "Test Article", excerpt: "Test excerpt", content: "Content", category: "GERAL", imageUrl: null, status: "online", isHero: false, viewCount: 10, authorId: 1, createdAt: new Date(), updatedAt: new Date() };
    return undefined;
  }),
  createArticle: vi.fn().mockResolvedValue(3),
  updateArticle: vi.fn().mockResolvedValue(undefined),
  deleteArticle: vi.fn().mockResolvedValue(undefined),
  incrementViewCount: vi.fn().mockResolvedValue(undefined),
  getTickerItems: vi.fn().mockResolvedValue([
    { id: 1, text: "Breaking news ticker", isActive: true, createdAt: new Date() },
  ]),
  createTickerItem: vi.fn().mockResolvedValue(2),
  deleteTickerItem: vi.fn().mockResolvedValue(undefined),
  getAds: vi.fn().mockResolvedValue([]),
  createAd: vi.fn().mockResolvedValue(1),
  updateAd: vi.fn().mockResolvedValue(undefined),
  deleteAd: vi.fn().mockResolvedValue(undefined),
  getSetting: vi.fn().mockResolvedValue(undefined),
  getAllSettings: vi.fn().mockResolvedValue([]),
  upsertSetting: vi.fn().mockResolvedValue(undefined),
  getArticleCount: vi.fn().mockResolvedValue(5),
  getTotalViews: vi.fn().mockResolvedValue(100),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getDb: vi.fn(),
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

  it("creates article as admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.articles.create({
      title: "New Article",
      category: "ESPORTES",
      status: "online",
    });
    expect(result).toEqual({ id: 3 });
  });

  it("rejects article creation for non-admin", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.articles.create({
      title: "Unauthorized Article",
      category: "GERAL",
    })).rejects.toThrow();
  });

  it("rejects article creation for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.articles.create({
      title: "Unauthorized Article",
      category: "GERAL",
    })).rejects.toThrow();
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

describe("stats", () => {
  it("returns overview stats for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.stats.overview();
    expect(result.articleCount).toBe(5);
    expect(result.totalViews).toBe(100);
  });

  it("rejects stats for non-admin", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.stats.overview()).rejects.toThrow();
  });
});
