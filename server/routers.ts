import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { articles, shorts, newsletterSubscribers } from "../drizzle/schema";

// Admin session cookie key
const ADMIN_SESSION_KEY = "cnn_admin_session";

// Bootstrap admin accounts (seeded on first login if not in DB)
// These are migrated to the admin_users table on first use
const BOOTSTRAP_ADMINS = [
  { name: "Agência DeepMkt", email: "agenciadeepmkt@gmail.com", password: "@Dp4156!", role: "admin" as const },
  { name: "Art Senna", email: "artsenna10@gmail.com", password: "Jose*1982", role: "admin" as const },
];

// Ensure bootstrap admins exist in DB
async function ensureBootstrapAdmins() {
  for (const acc of BOOTSTRAP_ADMINS) {
    const existing = await db.getAdminUserByEmail(acc.email);
    if (!existing) {
      const hash = await bcrypt.hash(acc.password, 10);
      await db.createAdminUser({ name: acc.name, email: acc.email, passwordHash: hash, role: acc.role, isActive: true });
    }
  }
};

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

    trending: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getTrendingArticles(input?.limit ?? 10);
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

    create: adminProcedure
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
        isFeatured: z.boolean().default(false),
        isBreaking: z.boolean().default(false),
        state: z.string().optional(),
        scheduledAt: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const data: any = { ...input, authorId: ctx.user?.id ?? 0 };
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

    update: adminProcedure
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
        isFeatured: z.boolean().optional(),
        isBreaking: z.boolean().optional(),
        state: z.string().optional(),
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
            editorId: ctx.user?.id ?? 0,
            note: `Updated by ${ctx.user?.name || "editor"}`,
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
        await db.updateArticle(input.id, { status: "online", reviewerId: ctx.user?.id } as any);
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

    // ── Hero/Carrossel management ─────────────────────────────────────────
    // Toggle isHero on an article. Max 5 hero articles allowed at once.
    setHero: adminProcedure
      .input(z.object({ id: z.number(), isHero: z.boolean() }))
      .mutation(async ({ input }) => {
        if (input.isHero) {
          const currentHeroes = await db.getArticles({ isHero: true });
          if (currentHeroes.length >= 5) {
            throw new Error("Limite de 5 matérias no carrossel atingido. Remova uma antes de adicionar outra.");
          }
        }
        await db.updateArticle(input.id, { isHero: input.isHero });
        return { success: true };
      }),

    // List all hero articles (admin management)
    listHero: adminProcedure
      .query(async () => {
        return db.getArticles({ isHero: true });
      }),
  }),

  // ===== TAGS =====
  tags: router({
    list: publicProcedure.query(async () => {
      return db.getTags();
    }),

    // AI-powered tag suggestion endpoint
    suggest: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const AVAILABLE_TAGS = [
          // Temas principais
          "pol\u00edtica", "economia", "sa\u00fade", "tecnologia", "esportes", "educa\u00e7\u00e3o",
          "meio-ambiente", "cultura", "internacional", "ci\u00eancia", "seguran\u00e7a",
          "justi\u00e7a", "transporte", "energia", "agroneg\u00f3cio", "turismo", "entretenimento",
          // Temas espec\u00edficos Brasil
          "governo-federal", "congresso", "stf", "elei\u00e7\u00f5es", "impostos", "infla\u00e7\u00e3o",
          "emprego", "bolsa-fam\u00edlia", "sus", "pandemia", "vacinas", "clima",
          "amaz\u00f4nia", "petr\u00f3leo", "pr\u00e9-sal", "futebol", "olimp\u00edadas", "copa",
          // Regi\u00f5es
          "nordeste", "sudeste", "sul", "norte", "centro-oeste",
          // Formatos
          "breaking-news", "exclusivo", "an\u00e1lise", "entrevista", "opini\u00e3o",
        ];

        const textSnippet = [
          input.title,
          input.excerpt || "",
          (input.content || "").replace(/<[^>]+>/g, "").slice(0, 800),
        ].filter(Boolean).join(" ");

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Voc\u00ea \u00e9 um especialista em taxonomia de conte\u00fado jornal\u00edstico brasileiro.\nAnalise o texto e retorne EXATAMENTE entre 3 e 7 tags relevantes da lista fornecida.\nRetorne APENAS um JSON v\u00e1lido com o campo "tags" contendo um array de strings.\nEscolha apenas tags da lista dispon\u00edvel. Priorize as mais espec\u00edficas e relevantes.`,
              },
              {
                role: "user",
                content: `Lista de tags dispon\u00edveis: ${AVAILABLE_TAGS.join(", ")}\n\nCategoria do artigo: ${input.category || "Geral"}\n\nTexto para an\u00e1lise:\n${textSnippet}\n\nRetorne JSON: {"tags": ["tag1", "tag2", "tag3"]}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "tag_suggestions",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    tags: {
                      type: "array",
                      items: { type: "string" },
                      description: "Array de tags sugeridas",
                    },
                  },
                  required: ["tags"],
                  additionalProperties: false,
                },
              },
            },
          });

          const rawContent = response?.choices?.[0]?.message?.content;
          const raw = typeof rawContent === "string" ? rawContent : null;
          if (!raw) return { tags: [] };
          const parsed = JSON.parse(raw) as { tags: string[] };
          const validTags = parsed.tags
            .map((t: string) => t.toLowerCase().trim())
            .filter((t: string) => AVAILABLE_TAGS.includes(t))
            .slice(0, 7);

          return { tags: validTags };
        } catch (err) {
          console.error("[AI Tags] Error suggesting tags:", err);
          return { tags: [] };
        }
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
        placement: z.enum(["home-top", "home-mid", "home-sidebar", "article-mid", "article-sidebar", "horizontal", "lateral", "middle"]).default("home-top"),
        imageUrl: z.string().optional(),
        adCode: z.string().optional(),
        link: z.string().optional(),
        sponsor: z.string().optional(),
        duration: z.number().default(5000),
        position: z.number().default(0),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createAd(input as any);
        return { id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(["google", "custom"]).optional(),
        placement: z.enum(["home-top", "home-mid", "home-sidebar", "article-mid", "article-sidebar", "horizontal", "lateral", "middle"]).optional(),
        imageUrl: z.string().optional(),
        adCode: z.string().optional(),
        link: z.string().optional(),
        sponsor: z.string().optional(),
        duration: z.number().optional(),
        position: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateAd(id, data as any);
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
      const [articleCount, totalViews, commentCount, userCount, shortCount, newsletterCount] = await Promise.all([
        db.getArticleCount(),
        db.getTotalViews(),
        db.getCommentCount(),
        db.getUserCount(),
        db.getShortCount(),
        db.getNewsletterCount(),
      ]);
      return { articleCount, totalViews, commentCount, userCount, shortCount, newsletterCount };
    }),

    rich: adminProcedure.query(async () => {
      const [articlesPerDay, topArticles, categoryDistribution, recentActivity] = await Promise.all([
        db.getArticlesPerDay(30),
        db.getTopArticles(10),
        db.getCategoryDistribution(),
        db.getRecentActivity(10),
      ]);
      return { articlesPerDay, topArticles, categoryDistribution, recentActivity };
    }),

    backup: adminProcedure.query(async () => {
      const { listBackups } = await import("./backupService");
      return listBackups();
    }),

    createBackup: adminProcedure.mutation(async () => {
      const { createBackup, listBackups } = await import("./backupService");
      const result = await createBackup();
      return result;
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
        await db.updateUgcStatus(input.id, input.status, ctx.user?.id ?? 0, input.reviewNote, publishedArticleId);
        // Audit log
        await db.createAuditLog({
          userId: ctx.user?.id,
          userName: ctx.user?.name || undefined,
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

  // ===== CNN SHORTS =====
  shorts: router({
    list: publicProcedure
      .input(z.object({
        status: z.string().optional(),
        category: z.string().optional(),
        limit: z.number().optional(),
        isHighlight: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getShorts(input ?? undefined);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getShortById(input.id);
      }),

    feed: publicProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(async ({ input }) => {
        return db.getShorts({ status: "online", limit: input?.limit ?? 20 });
      }),

    create: editorProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        videoUrl: z.string().min(1),
        thumbnailUrl: z.string().optional(),
        category: z.string().default("GERAL"),
        duration: z.number().default(0),
        status: z.enum(["online", "draft", "review"]).default("draft"),
        isHighlight: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createShort({
          ...input,
          authorId: ctx.user.id,
          authorName: ctx.user.name || "Editor",
        });
        return { id };
      }),

    update: editorProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        videoUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        category: z.string().optional(),
        duration: z.number().optional(),
        status: z.enum(["online", "draft", "review"]).optional(),
        isHighlight: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.status === "online") updateData.publishedAt = new Date();
        await db.updateShort(id, updateData);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteShort(input.id);
        return { success: true };
      }),

    incrementView: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementShortView(input.id);
        return { success: true };
      }),

    toggleLike: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.toggleShortLike(input.id, ctx.user.id);
        return result;
      }),

    share: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementShortShare(input.id);
        return { success: true };
      }),

    myLikes: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserShortLikes(ctx.user.id);
    }),

    // Comments on shorts
    comments: publicProcedure
      .input(z.object({ shortId: z.number() }))
      .query(async ({ input }) => {
        return db.getShortComments(input.shortId);
      }),

    addComment: publicProcedure
      .input(z.object({
        shortId: z.number(),
        content: z.string().min(1).max(500),
        authorName: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createShortComment({
          ...input,
          userId: ctx.user?.id,
          authorName: input.authorName || ctx.user?.name || "Anônimo",
        });
        return { id };
      }),

    deleteComment: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteShortComment(input.id);
        return { success: true };
      }),

    count: adminProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getShortCount(input?.status);
      }),

    // Auto-convert video articles to CNN Shorts
    autoConvert: adminProcedure.mutation(async () => {
      const allArticles = await db.getArticles({ status: "online" });
      const videoArticles = allArticles.filter((a: any) => a.videoUrl && a.videoUrl.length > 5);
      let converted = 0;
      for (const article of videoArticles) {
        // Check if a short with this video already exists
        const existingShorts = await db.getShorts({ limit: 100 });
        const alreadyExists = existingShorts.some((s: any) => s.videoUrl === article.videoUrl);
        if (alreadyExists) continue;
        
        try {
          await db.createShort({
            title: (article.title || "").length > 80 ? (article.title || "").substring(0, 77) + "..." : (article.title || ""),
            videoUrl: article.videoUrl || "",
            thumbnailUrl: article.imageUrl || "",
            category: article.category || "GERAL",
            duration: 60,
            status: "online",
            authorName: "CNN BRA",
          });
          converted++;
        } catch (err) {
          console.error("[Shorts] Auto-convert error:", err);
        }
      }
      return { converted, total: videoArticles.length };
    }),
    // Run shorts automation manually (admin)
    runAutomation: adminProcedure.mutation(async () => {
      const { runShortsAutomation } = await import("./shortsAutomation");
      const result = await runShortsAutomation();
      return result;
    }),
    // Infinite scroll feed with cursor pagination
    feedInfinite: publicProcedure
      .input(z.object({
        limit: z.number().default(10),
        cursor: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const limit = input?.limit ?? 10;
        const cursor = input?.cursor;
        const allShorts = await db.getShorts({ status: "online", limit: 200 });
        let filtered = allShorts;
        if (cursor) {
          const idx = allShorts.findIndex((s: any) => s.id === cursor);
          if (idx >= 0) filtered = allShorts.slice(idx + 1);
        }
        const page = filtered.slice(0, limit);
        const nextCursor = page.length === limit ? page[page.length - 1]?.id : undefined;
        return { items: page, nextCursor };
      }),
  }),

  // ===== NEWSLETTER =====
  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({
        name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        email: z.string().email("Email inválido"),
      }))
      .mutation(async ({ input }) => {
        // Save to local database
        const result = await db.subscribeNewsletter(input);
        
        // Sync to SendPulse in background (don't block the response)
        try {
          const { addSubscriber } = await import("./sendpulse");
          await addSubscriber(input.email, input.name);
          console.log(`[SendPulse] Subscriber synced: ${input.email}`);
        } catch (err: any) {
          console.warn(`[SendPulse] Failed to sync subscriber: ${err.message}`);
          // Don't fail the request - subscriber is saved locally
        }
        
        return result;
      }),

    unsubscribe: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        await db.unsubscribeNewsletter(input.email);
        return { success: true };
      }),

    list: adminProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return db.getNewsletterSubscribers(input?.status);
      }),

    count: adminProcedure.query(async () => {
      return db.getNewsletterCount();
    }),
  }),

  // ===== GLOBAL NEWS =====
  globalNews: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(async ({ input }) => {
        return db.getGlobalNews(input?.limit ?? 20);
      }),

    fetchAndRewrite: adminProcedure.mutation(async () => {
      // 1. Fetch top world news using Google News RSS
      const axios = (await import("axios")).default;
      let newsItems: any[] = [];
      try {
        const rssUrl = "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FuQjBHZ0pDVWlnQVAB?hl=pt-BR&gl=BR&ceid=BR:pt-419";
        const rssResponse = await axios.get(rssUrl, { timeout: 10000 });
        const rssText = rssResponse.data;
        // Parse RSS XML manually
        const items = rssText.match(/<item>[\s\S]*?<\/item>/g) || [];
        newsItems = items.slice(0, 10).map((item: string) => {
          const titleMatch = item.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/) || item.match(/<title>(.+?)<\/title>/);
          const linkMatch = item.match(/<link>(.+?)<\/link>/);
          const sourceMatch = item.match(/<source[^>]*>(.+?)<\/source>/);
          return {
            originalTitle: titleMatch?.[1] || "Untitled",
            originalSource: sourceMatch?.[1] || "Google News",
            originalUrl: linkMatch?.[1] || "#",
            imageUrl: null,
            category: "GLOBAL",
          };
        });
      } catch (e) {
        console.error("Failed to fetch Google News RSS:", e);
        return { fetched: 0, rewritten: 0 };
      }

      if (newsItems.length === 0) return { fetched: 0, rewritten: 0 };

      await db.saveGlobalNews(newsItems);

      // 3. Get unprocessed news for rewriting
      const toRewrite = await db.getGlobalNewsForRewrite(5);

      // 4. Rewrite each with LLM
      const { invokeLLM } = await import("./_core/llm");
      let rewrittenCount = 0;

      for (const item of toRewrite) {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "Você é um jornalista brasileiro experiente. Reescreva a notícia abaixo de forma autoral em português brasileiro, mantendo os fatos e mencionando a fonte original. Retorne um JSON com: title (título chamativo), excerpt (resumo de 1-2 frases), content (texto completo de 2-3 parágrafos)."
              },
              {
                role: "user",
                content: `Notícia original: \"${item.originalTitle}\"\nFonte: ${item.originalSource}\nURL: ${item.originalUrl}`
              }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "rewritten_news",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Título reescrito" },
                    excerpt: { type: "string", description: "Resumo curto" },
                    content: { type: "string", description: "Texto completo" }
                  },
                  required: ["title", "excerpt", "content"],
                  additionalProperties: false
                }
              }
            }
          });

          const rawContent = response.choices[0].message.content;
          const parsed = JSON.parse((typeof rawContent === "string" ? rawContent : "") || "{}");
          if (parsed.title) {
            await db.updateGlobalNewsRewrite(item.id, {
              rewrittenTitle: parsed.title,
              rewrittenExcerpt: parsed.excerpt || "",
              rewrittenContent: parsed.content || "",
            });
            rewrittenCount++;
          }
        } catch (e) {
          console.error("Failed to rewrite news:", item.id, e);
        }
      }

      return { fetched: newsItems.length, rewritten: rewrittenCount };
    }),

    adminList: adminProcedure.query(async () => {
      return db.getAllGlobalNews(50);
    }),

    fixImages: adminProcedure.mutation(async () => {
      const { fixGlobalNewsImages } = await import("./globalNewsFetcher");
      const fixed = await fixGlobalNewsImages();
      return { fixed };
    }),

    fixAllImages: adminProcedure.mutation(async () => {
      // Fix images for ALL articles (any category) with bad/missing images
      const { scrapeArticle, validateImageUrl } = await import("./globalNewsFetcher") as any;
      const { articles: articlesTable, globalNewsCache: cacheTable } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const { getDb } = await import("./db");
      const dbConn = await getDb();
      if (!dbConn) return { fixed: 0, total: 0, errors: 0 };

      const BAD_IMAGE_PATTERNS = [
        "gstatic.com",
        "googleusercontent.com",
        "news.google.com",
        "google.com/images",
        "global-news/ai-",
        "unsplash.com/photo-1585829365295",
      ];

      const allArticles = await dbConn.select().from(articlesTable);
      const badArticles = allArticles.filter((a: any) => {
        const img = a.imageUrl || "";
        return !img || BAD_IMAGE_PATTERNS.some((p: string) => img.includes(p));
      });

      let fixed = 0;
      let errors = 0;
      const total = badArticles.length;

      for (const article of badArticles) {
        try {
          // Try to find original URL from globalNewsCache by title match
          const cached = await dbConn.select()
            .from(cacheTable)
            .where(eq(cacheTable.originalTitle, article.title))
            .limit(1);

          let sourceUrl: string | null = null;
          if (cached.length > 0 && cached[0].originalUrl && !cached[0].originalUrl.includes("news.google.com")) {
            sourceUrl = cached[0].originalUrl;
          } else {
            // Try to extract source URL from article content (source link at bottom)
            const urlMatch = article.content?.match(/href="(https?:\/\/(?!news\.google)[^"]+)"[^>]*>[^<]*<\/a><\/p>/);
            if (urlMatch) sourceUrl = urlMatch[1];
          }

          if (!sourceUrl) { errors++; continue; }

          const scraped = await scrapeArticle(sourceUrl);
          if (!scraped?.imageUrl) { errors++; continue; }

          const validImg = await validateImageUrl(scraped.imageUrl);
          if (!validImg) { errors++; continue; }

          await dbConn.update(articlesTable)
            .set({ imageUrl: validImg })
            .where(eq(articlesTable.id, article.id));

          fixed++;
          await new Promise(r => setTimeout(r, 1500));
        } catch (e) {
          console.error(`[FixAllImages] Error on article ${article.id}:`, e);
          errors++;
        }
      }

      console.log(`[FixAllImages] Done: ${fixed} fixed, ${errors} errors out of ${total} bad images`);
      return { fixed, errors, total };
    }),

    fixSourceLinks: adminProcedure.mutation(async () => {
      const { fixAllSourceLinks } = await import("./fixSourceLinks");
      const fixed = await fixAllSourceLinks();
      return { fixed };
    }),
  }),

    // ===== ADMIN AUTH (DB-backed with bcrypt + role in session) =====
  adminAuth: router({
    login: publicProcedure
      .input(z.object({ email: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        // Ensure bootstrap admins exist
        await ensureBootstrapAdmins();
        const adminUser = await db.getAdminUserByEmail(input.email.trim());
        if (!adminUser || !adminUser.isActive) {
          throw new Error("Credenciais inválidas");
        }
        const passwordValid = await bcrypt.compare(input.password, adminUser.passwordHash);
        if (!passwordValid) {
          throw new Error("Credenciais inválidas");
        }
        // Store role + id in session cookie (JSON encoded)
        const sessionData = JSON.stringify({ id: adminUser.id, role: adminUser.role, name: adminUser.name });
        ctx.res.cookie(ADMIN_SESSION_KEY, sessionData, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          path: "/",
        });
        await db.updateAdminLastLogin(adminUser.id);
        return { success: true, role: adminUser.role, name: adminUser.name };
      }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      ctx.res.clearCookie(ADMIN_SESSION_KEY, { path: "/" });
      return { success: true };
    }),
    check: publicProcedure.query(async ({ ctx }) => {
      const session = ctx.req.cookies?.[ADMIN_SESSION_KEY];
      if (!session) return { authenticated: false, role: null, name: null };
      try {
        const data = JSON.parse(session);
        if (!data?.id || !data?.role) return { authenticated: false, role: null, name: null };
        return { authenticated: true, role: data.role as string, name: data.name as string, id: data.id as number };
      } catch {
        return { authenticated: false, role: null, name: null };
      }
    }),
    // ===== ADMIN USER MANAGEMENT (admin only) =====
    listUsers: publicProcedure.query(async ({ ctx }) => {
      const session = ctx.req.cookies?.[ADMIN_SESSION_KEY];
      if (!session) throw new Error("Não autorizado");
      try {
        const data = JSON.parse(session);
        if (data?.role !== "admin") throw new Error("Apenas administradores podem gerenciar usuários");
      } catch (e: any) { throw new Error(e.message || "Não autorizado"); }
      return db.listAdminUsers();
    }),
    createUser: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["admin", "editor", "contributor"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const session = ctx.req.cookies?.[ADMIN_SESSION_KEY];
        if (!session) throw new Error("Não autorizado");
        let creatorId: number;
        try {
          const data = JSON.parse(session);
          if (data?.role !== "admin") throw new Error("Apenas administradores podem criar usuários");
          creatorId = data.id;
        } catch (e: any) { throw new Error(e.message || "Não autorizado"); }
        const existing = await db.getAdminUserByEmail(input.email);
        if (existing) throw new Error("Já existe um usuário com este e-mail");
        const hash = await bcrypt.hash(input.password, 10);
        await db.createAdminUser({ name: input.name, email: input.email, passwordHash: hash, role: input.role, isActive: true, createdBy: creatorId });
        return { success: true };
      }),
    updateUser: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(2).optional(),
        role: z.enum(["admin", "editor", "contributor"]).optional(),
        isActive: z.boolean().optional(),
        password: z.string().min(6).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const session = ctx.req.cookies?.[ADMIN_SESSION_KEY];
        if (!session) throw new Error("Não autorizado");
        try {
          const data = JSON.parse(session);
          if (data?.role !== "admin") throw new Error("Apenas administradores podem editar usuários");
        } catch (e: any) { throw new Error(e.message || "Não autorizado"); }
        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.role) updates.role = input.role;
        if (input.isActive !== undefined) updates.isActive = input.isActive;
        if (input.password) updates.passwordHash = await bcrypt.hash(input.password, 10);
        await db.updateAdminUser(input.id, updates);
        return { success: true };
      }),
    deleteUser: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const session = ctx.req.cookies?.[ADMIN_SESSION_KEY];
        if (!session) throw new Error("Não autorizado");
        try {
          const data = JSON.parse(session);
          if (data?.role !== "admin") throw new Error("Apenas administradores podem remover usuários");
          if (data?.id === input.id) throw new Error("Você não pode remover sua própria conta");
        } catch (e: any) { throw new Error(e.message || "Não autorizado"); }
        await db.deleteAdminUser(input.id);
        return { success: true };
      }),
  }),

  // ===== MEDIA UPLOAD =====
  mediaUpload: router({
    upload: publicProcedure
      .input(z.object({
        filename: z.string(),
        mimeType: z.string(),
        dataBase64: z.string(), // base64 encoded file data
        alt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Check admin session via headers (passed from client)
        const buffer = Buffer.from(input.dataBase64, "base64");
        const suffix = Date.now().toString(36);
        const ext = input.filename.split(".").pop() || "bin";
        const key = `media/${suffix}-${input.filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        try {
          const { url } = await storagePut(key, buffer, input.mimeType);
          const mediaId = await db.createMediaItem({
            filename: input.filename,
            url,
            fileKey: key,
            mimeType: input.mimeType,
            sizeBytes: buffer.length,
            alt: input.alt || input.filename,
          });
          return { id: mediaId, url, key };
        } catch (err) {
          // Fallback: return a placeholder if S3 upload fails
          throw new Error(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }),

    list: publicProcedure
      .input(z.object({ limit: z.number().default(50) }).optional())
      .query(async ({ input }) => {
        return db.getMediaItems(input?.limit ?? 50);
      }),
  }),

  // ===== WORDPRESS IMPORT =====
  wordpressImport: router({
    importXml: publicProcedure
      .input(z.object({
        xmlContent: z.string(), // WordPress WXR XML content
      }))
      .mutation(async ({ input }) => {
        const { parseWPXml } = await import("./wpImporter");
        const result = await parseWPXml(input.xmlContent);
        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
