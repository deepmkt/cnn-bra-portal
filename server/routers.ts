import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

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

  articles: router({
    list: publicProcedure
      .input(z.object({
        status: z.string().optional(),
        category: z.string().optional(),
        isHero: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getArticles(input ?? undefined);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getArticleById(input.id);
      }),

    incrementView: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementViewCount(input.id);
        return { success: true };
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        category: z.string().default("GERAL"),
        imageUrl: z.string().optional(),
        status: z.enum(["online", "draft"]).default("draft"),
        isHero: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createArticle({
          ...input,
          authorId: ctx.user.id,
        });
        return { id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional(),
        imageUrl: z.string().optional(),
        status: z.enum(["online", "draft"]).optional(),
        isHero: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateArticle(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteArticle(input.id);
        return { success: true };
      }),
  }),

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

  stats: router({
    overview: adminProcedure.query(async () => {
      const [articleCount, totalViews] = await Promise.all([
        db.getArticleCount(),
        db.getTotalViews(),
      ]);
      return { articleCount, totalViews };
    }),
  }),
});

export type AppRouter = typeof appRouter;
