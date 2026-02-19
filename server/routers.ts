import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

// Editor/journalist procedure: admin, editor, or journalist roles
const editorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const allowed = ["admin", "editor", "journalist"];
  if (!allowed.includes(ctx.user.role)) {
    throw new Error("Insufficient permissions");
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== CMS HEADLESS: ARTICLES =====
  articles: router({
    list: publicProcedure
      .input(z.object({
        status: z.string().optional(),
        category: z.string().optional(),
        isHero: z.boolean().optional(),
        search: z.string().optional(),
        tag: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getArticles(input ?? undefined);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getArticleById(input.id);
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return db.getArticleBySlug(input.slug);
      }),

    incrementView: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementViewCount(input.id);
        return { success: true };
      }),

    incrementShare: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementShareCount(input.id);
        return { success: true };
      }),

    create: editorProcedure
      .input(z.object({
        title: z.string().min(1),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        category: z.string().default("GERAL"),
        tags: z.string().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        status: z.enum(["online", "draft", "review", "scheduled"]).default("draft"),
        isHero: z.boolean().default(false),
        isBreaking: z.boolean().default(false),
        scheduledAt: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const data: any = { ...input, authorId: ctx.user.id };
        if (input.scheduledAt) data.scheduledAt = new Date(input.scheduledAt);
        if (input.status === "online") data.publishedAt = new Date();
        const id = await db.createArticle(data);
        // Auto-create tags
        if (input.tags) {
          try {
            const tagList = JSON.parse(input.tags);
            for (const tag of tagList) { await db.upsertTag(tag); }
          } catch {}
        }
        // If breaking news, create global notification
        if (input.isBreaking) {
          await db.createNotification({
            type: "breaking",
            title: "URGENTE",
            message: input.title,
            articleId: id,
            isGlobal: true,
          });
        }
        return { id };
      }),

    update: editorProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional(),
        tags: z.string().optional(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        status: z.enum(["online", "draft", "review", "scheduled"]).optional(),
        isHero: z.boolean().optional(),
        isBreaking: z.boolean().optional(),
        scheduledAt: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, scheduledAt, ...data } = input;
        const updateData: any = { ...data };
        if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
        // Create revision before updating
        const current = await db.getArticleById(id);
        if (current) {
          await db.createRevision({
            articleId: id,
            title: current.title,
            content: current.content,
            editorId: ctx.user.id,
            note: `Updated by ${ctx.user.name || "editor"}`,
          });
        }
        await db.updateArticle(id, updateData);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteArticle(input.id);
        return { success: true };
      }),

    // Editorial workflow
    submitForReview: editorProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateArticle(input.id, { status: "review" });
        return { success: true };
      }),

    approveAndPublish: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.updateArticle(input.id, { status: "online", reviewerId: ctx.user.id } as any);
        const article = await db.getArticleById(input.id);
        if (article) {
          await db.createNotification({
            type: "new_article",
            title: "Nova Matéria",
            message: article.title,
            articleId: input.id,
            isGlobal: true,
          });
        }
        return { success: true };
      }),

    revisions: editorProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input }) => {
        return db.getRevisions(input.articleId);
      }),
  }),

  // ===== TAGS =====
  tags: router({
    list: publicProcedure.query(async () => {
      return db.getTags();
    }),
  }),

  // ===== SEARCH (Microservice) =====
  search: router({
    query: publicProcedure
      .input(z.object({ q: z.string().min(1), limit: z.number().default(20) }))
      .query(async ({ input }) => {
        return db.searchArticles(input.q, input.limit);
      }),
  }),

  // ===== COMMENTS (Microservice) =====
  comments: router({
    list: publicProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input }) => {
        return db.getComments(input.articleId, "approved");
      }),

    listAll: adminProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getAllComments(input?.status);
      }),

    create: publicProcedure
      .input(z.object({
        articleId: z.number(),
        content: z.string().min(1).max(2000),
        authorName: z.string().optional(),
        parentId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createComment({
          ...input,
          userId: ctx.user?.id,
          authorName: input.authorName || ctx.user?.name || "Anônimo",
        });
        return { id };
      }),

    moderate: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(["approved", "rejected"]) }))
      .mutation(async ({ input }) => {
        await db.updateCommentStatus(input.id, input.status);
        return { success: true };
      }),

    like: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.likeComment(input.id);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteComment(input.id);
        return { success: true };
      }),
  }),

  // ===== NOTIFICATIONS (Microservice) =====
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotifications(ctx.user.id);
    }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationCount(ctx.user.id);
    }),

    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationRead(input.id);
        return { success: true };
      }),

    create: adminProcedure
      .input(z.object({
        type: z.enum(["breaking", "new_article", "system"]).default("system"),
        title: z.string(),
        message: z.string().optional(),
        articleId: z.number().optional(),
        isGlobal: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createNotification(input);
        return { id };
      }),
  }),

  // ===== PERSONALIZATION (Microservice) =====
  personalization: router({
    recommendations: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ ctx, input }) => {
        return db.getPersonalizedRecommendations(ctx.user.id, input?.limit ?? 10);
      }),

    trackRead: protectedProcedure
      .input(z.object({
        articleId: z.number(),
        category: z.string().optional(),
        readDurationSeconds: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.addReadingHistory({
          userId: ctx.user.id,
          articleId: input.articleId,
          category: input.category,
          readDurationSeconds: input.readDurationSeconds,
        });
        return { success: true };
      }),

    history: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(async ({ ctx, input }) => {
        return db.getUserReadingHistory(ctx.user.id, input?.limit ?? 20);
      }),

    preferences: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPreferences(ctx.user.id);
    }),

    updatePreferences: protectedProcedure
      .input(z.object({
        favoriteCategories: z.string().optional(),
        notificationsEnabled: z.boolean().optional(),
        breakingNewsAlerts: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.upsertUserPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ===== MEDIA LIBRARY =====
  media: router({
    list: editorProcedure
      .input(z.object({ limit: z.number().default(50) }).optional())
      .query(async ({ input }) => {
        return db.getMediaItems(input?.limit ?? 50);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMediaItem(input.id);
        return { success: true };
      }),
  }),

  // ===== USER MANAGEMENT =====
  users: router({
    list: adminProcedure.query(async () => {
      return db.getUsers();
    }),

    updateRole: adminProcedure
      .input(z.object({ id: z.number(), role: z.enum(["user", "admin", "editor", "journalist"]) }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.id, input.role);
        return { success: true };
      }),
  }),

  // ===== ADS =====
  ads: router({
    list: publicProcedure
      .input(z.object({ placement: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getAds(input?.placement);
      }),

    create: adminProcedure
      .input(z.object({
        type: z.enum(["google", "custom"]).default("custom"),
        placement: z.enum(["horizontal", "lateral"]).default("horizontal"),
        imageUrl: z.string().optional(),
        link: z.string().optional(),
        sponsor: z.string().optional(),
        duration: z.number().default(5000),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createAd(input);
        return { id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(["google", "custom"]).optional(),
        placement: z.enum(["horizontal", "lateral"]).optional(),
        imageUrl: z.string().optional(),
        link: z.string().optional(),
        sponsor: z.string().optional(),
        duration: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateAd(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAd(input.id);
        return { success: true };
      }),
  }),

  // ===== TICKER =====
  ticker: router({
    list: publicProcedure.query(async () => {
      return db.getTickerItems();
    }),

    create: adminProcedure
      .input(z.object({ text: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const id = await db.createTickerItem({ text: input.text });
        return { id };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTickerItem(input.id);
        return { success: true };
      }),
  }),

  // ===== SETTINGS =====
  settings: router({
    get: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return db.getSetting(input.key);
      }),

    getAll: publicProcedure.query(async () => {
      return db.getAllSettings();
    }),

    set: adminProcedure
      .input(z.object({ key: z.string(), value: z.string() }))
      .mutation(async ({ input }) => {
        await db.upsertSetting(input.key, input.value);
        return { success: true };
      }),
  }),

  // ===== STATS =====
  stats: router({
    overview: adminProcedure.query(async () => {
      const [articleCount, totalViews, commentCount, userCount] = await Promise.all([
        db.getArticleCount(),
        db.getTotalViews(),
        db.getCommentCount(),
        db.getUserCount(),
      ]);
      return { articleCount, totalViews, commentCount, userCount };
    }),
  }),

  // ===== GAMIFICATION =====
  gamification: router({
    myPoints: protectedProcedure.query(async ({ ctx }) => {
      const points = await db.getUserPoints(ctx.user.id);
      const userBadges = await db.getUserBadges(ctx.user.id);
      return { points, badges: userBadges };
    }),

    leaderboard: publicProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(async ({ input }) => {
        return db.getLeaderboard(input?.limit ?? 20);
      }),

    allBadges: publicProcedure.query(async () => {
      return db.getAllBadges();
    }),

    myTransactions: protectedProcedure
      .input(z.object({ limit: z.number().default(30) }).optional())
      .query(async ({ ctx, input }) => {
        return db.getPointTransactions(ctx.user.id, input?.limit ?? 30);
      }),

    awardAction: protectedProcedure
      .input(z.object({ action: z.string(), referenceId: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.awardPoints(ctx.user.id, input.action, input.referenceId);
        // Audit log
        await db.createAuditLog({
          userId: ctx.user.id,
          userName: ctx.user.name || undefined,
          action: `gamification.${input.action}`,
          resource: "gamification",
          details: JSON.stringify(result),
          severity: "info",
        });
        return result;
      }),

    seedBadges: adminProcedure.mutation(async () => {
      await db.seedDefaultBadges();
      return { success: true };
    }),
  }),

  // ===== UGC (Conteúdo Gerado pelo Usuário) =====
  ugc: router({
    list: adminProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getUgcSubmissions(input?.status);
      }),

    mySubmissions: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserUgcSubmissions(ctx.user.id);
    }),

    submit: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(500),
        content: z.string().min(10).max(10000),
        category: z.string().default("GERAL"),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        location: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createUgcSubmission({
          ...input,
          userId: ctx.user.id,
        });
        // Award gamification points
        await db.awardPoints(ctx.user.id, "submit_ugc", id);
        // Audit log
        await db.createAuditLog({
          userId: ctx.user.id,
          userName: ctx.user.name || undefined,
          action: "ugc.submit",
          resource: "ugc",
          resourceId: id,
          details: JSON.stringify({ title: input.title }),
          severity: "info",
        });
        // Notify admins
        await db.createNotification({
          type: "system",
          title: "Novo conteúdo UGC",
          message: `${ctx.user.name || "Usuário"} enviou: ${input.title}`,
          isGlobal: false,
        });
        return { id };
      }),

    moderate: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["approved", "rejected", "published"]),
        reviewNote: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        let publishedArticleId: number | undefined;
        // If publishing, create an article from UGC
        if (input.status === "published") {
          const submission = await db.getUgcSubmissionById(input.id);
          if (submission) {
            publishedArticleId = await db.createArticle({
              title: submission.title,
              content: submission.content,
              category: submission.category || "GERAL",
              imageUrl: submission.imageUrl || undefined,
              videoUrl: submission.videoUrl || undefined,
              status: "online",
              authorId: submission.userId,
            });
            // Award bonus points for approval
            await db.awardPoints(submission.userId, "ugc_approved", input.id);
          }
        }
        await db.updateUgcStatus(input.id, input.status, ctx.user.id, input.reviewNote, publishedArticleId);
        // Audit log
        await db.createAuditLog({
          userId: ctx.user.id,
          userName: ctx.user.name || undefined,
          action: `ugc.moderate.${input.status}`,
          resource: "ugc",
          resourceId: input.id,
          details: JSON.stringify({ reviewNote: input.reviewNote }),
          severity: input.status === "rejected" ? "warning" : "info",
        });
        return { success: true, publishedArticleId };
      }),

    count: adminProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getUgcCount(input?.status);
      }),
  }),

  // ===== HYBRID RECOMMENDATION ENGINE =====
  recommendations: router({
    forUser: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ ctx, input }) => {
        return db.getHybridRecommendations(ctx.user.id, input?.limit ?? 10);
      }),

    similar: publicProcedure
      .input(z.object({ articleId: z.number(), limit: z.number().default(5) }))
      .query(async ({ input }) => {
        return db.getSimilarArticles(input.articleId, input.limit);
      }),

    trackInteraction: protectedProcedure
      .input(z.object({
        articleId: z.number(),
        type: z.enum(["view", "read_full", "comment", "share", "like"]),
        weight: z.number().default(1),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.trackInteraction(ctx.user.id, input.articleId, input.type, input.weight);
        return { success: true };
      }),
  }),

  // ===== AUDIT LOGS (Security) =====
  audit: router({
    list: adminProcedure
      .input(z.object({
        severity: z.string().optional(),
        action: z.string().optional(),
        userId: z.number().optional(),
        limit: z.number().default(100),
      }).optional())
      .query(async ({ input }) => {
        return db.getAuditLogs(input ?? undefined);
      }),

    count: adminProcedure.query(async () => {
      return db.getAuditLogCount();
    }),
  }),

  // ===== PUBLIC JSON API (CMS Headless) =====
  api: router({
    articles: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        limit: z.number().default(20),
        tag: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const articles = await db.getArticles({
          status: "online",
          category: input?.category,
          tag: input?.tag,
          limit: input?.limit ?? 20,
        });
        return articles.map(a => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          category: a.category,
          tags: a.tags ? JSON.parse(a.tags) : [],
          imageUrl: a.imageUrl,
          videoUrl: a.videoUrl,
          isHero: a.isHero,
          isBreaking: a.isBreaking,
          viewCount: a.viewCount,
          shareCount: a.shareCount,
          commentCount: a.commentCount,
          readTimeMinutes: a.readTimeMinutes,
          publishedAt: a.publishedAt,
          createdAt: a.createdAt,
        }));
      }),

    article: publicProcedure
      .input(z.object({ id: z.number().optional(), slug: z.string().optional() }))
      .query(async ({ input }) => {
        let article;
        if (input.id) article = await db.getArticleById(input.id);
        else if (input.slug) article = await db.getArticleBySlug(input.slug);
        if (!article || article.status !== "online") return null;
        return {
          ...article,
          tags: article.tags ? JSON.parse(article.tags) : [],
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
