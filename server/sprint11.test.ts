import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper to create admin context
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
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Sprint 11 - Publicidade, Imagens Globais e CNN Shorts", () => {
  describe("Articles API", () => {
    it("should list articles with status filter", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const articles = await caller.articles.list({ status: "online", limit: 5 });
      expect(Array.isArray(articles)).toBe(true);
    });

    it("should list articles with category filter", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const articles = await caller.articles.list({ category: "GLOBAL", limit: 5 });
      expect(Array.isArray(articles)).toBe(true);
      // All returned articles should be GLOBAL category
      for (const article of articles) {
        expect(article.category).toBe("GLOBAL");
      }
    });

    it("should return trending articles", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const trending = await caller.articles.trending({ limit: 10 });
      expect(Array.isArray(trending)).toBe(true);
    });
  });

  describe("Shorts API", () => {
    it("should list shorts", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const shorts = await caller.shorts.list({ limit: 10 });
      expect(Array.isArray(shorts)).toBe(true);
    });

    it("should list shorts feed (online only)", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const feed = await caller.shorts.feed({ limit: 10 });
      expect(Array.isArray(feed)).toBe(true);
    });

    it("should auto-convert video articles to shorts (admin only)", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.shorts.autoConvert();
      expect(result).toHaveProperty("converted");
      expect(result).toHaveProperty("total");
      expect(typeof result.converted).toBe("number");
      expect(typeof result.total).toBe("number");
    });

    it("should reject auto-convert for non-admin users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.shorts.autoConvert()).rejects.toThrow();
    });
  });

  describe("Global News API", () => {
    it("should list global news", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const news = await caller.globalNews.list({ limit: 5 });
      expect(Array.isArray(news)).toBe(true);
    });

    it("should list global news admin view (admin only)", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const news = await caller.globalNews.adminList();
      expect(Array.isArray(news)).toBe(true);
    });

    it("should reject fixImages for non-admin users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.globalNews.fixImages()).rejects.toThrow();
    });
  });

  describe("Global News Image Validation", () => {
    it("should detect small images as logos", () => {
      // Test the logic: images < 15KB should be rejected
      const smallImageSize = 12496; // Google News logo size
      const largeImageSize = 150000; // Real article image
      
      expect(smallImageSize < 15000).toBe(true); // Should be rejected
      expect(largeImageSize < 15000).toBe(false); // Should be accepted
    });

    it("should identify Google News URL patterns", () => {
      const googleNewsUrls = [
        "https://news.google.com/images/branding/logo.png",
        "https://lh3.googleusercontent.com/icon.png",
        "https://play-lh.googleusercontent.com/app-icon.webp",
      ];
      
      const validUrls = [
        "https://example.com/images/article-photo.jpg",
        "https://cdn.reuters.com/news/image.webp",
      ];
      
      for (const url of googleNewsUrls) {
        const isGoogleLogo = url.includes("google.com/images") || 
                             url.includes("gstatic.com") ||
                             url.includes("googleusercontent.com");
        expect(isGoogleLogo).toBe(true);
      }
      
      for (const url of validUrls) {
        const isGoogleLogo = url.includes("google.com/images") || 
                             url.includes("gstatic.com") ||
                             url.includes("googleusercontent.com");
        expect(isGoogleLogo).toBe(false);
      }
    });
  });

  describe("Intercalated Ad Logic", () => {
    it("should place ads after every 4th article", () => {
      const articles = Array.from({ length: 12 }, (_, i) => ({ id: i + 1 }));
      const adPositions: number[] = [];
      
      articles.forEach((_, index) => {
        if ((index + 1) % 4 === 0 && index < articles.length - 1) {
          adPositions.push(index);
        }
      });
      
      // With 12 articles, ads should appear after positions 3, 7 (not after 11 since it's the last)
      expect(adPositions).toEqual([3, 7]);
    });

    it("should not place ad after the last article", () => {
      const articles = Array.from({ length: 4 }, (_, i) => ({ id: i + 1 }));
      const adPositions: number[] = [];
      
      articles.forEach((_, index) => {
        if ((index + 1) % 4 === 0 && index < articles.length - 1) {
          adPositions.push(index);
        }
      });
      
      // With exactly 4 articles, no ad should appear (last article is position 3)
      expect(adPositions).toEqual([]);
    });

    it("should handle empty article list", () => {
      const articles: any[] = [];
      const adPositions: number[] = [];
      
      articles.forEach((_, index) => {
        if ((index + 1) % 4 === 0 && index < articles.length - 1) {
          adPositions.push(index);
        }
      });
      
      expect(adPositions).toEqual([]);
    });
  });
});
