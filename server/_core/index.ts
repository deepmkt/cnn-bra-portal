import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { fetchAndPublishGlobalNews } from "../globalNewsFetcher";

// ===== ADMIN SUBDOMAIN RESTRICTION =====
// In production, the admin panel (/admin) is only accessible from admin.cnnbra.com.br.
// Requests to /admin from any other host are redirected there automatically.
const ADMIN_SUBDOMAIN = "admin.cnnbra.com.br";
const PUBLIC_DOMAIN = "cnnbra.com.br";

/**
 * Returns true if the incoming request originates from the admin subdomain.
 * In development mode every host is allowed so local testing still works.
 */
function isAdminSubdomain(req: express.Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  // Respect reverse-proxy forwarded host header (Manus / Nginx)
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "";
  const hostname = host.split(":")[0].toLowerCase();
  return hostname === ADMIN_SUBDOMAIN;
}

/**
 * Returns true if the incoming request originates from the public portal domain
 * (cnnbra.com.br or www.cnnbra.com.br) — used to block admin routes there.
 */
function isPublicDomain(req: express.Request): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "";
  const hostname = host.split(":")[0].toLowerCase();
  return hostname === PUBLIC_DOMAIN || hostname === `www.${PUBLIC_DOMAIN}`;
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Cookie parser — MUST be registered before any route/middleware that reads req.cookies
  app.use(cookieParser());
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // ── Admin subdomain guard ──────────────────────────────────────────────────
  // When the admin subdomain is accessed at root (/), redirect to /admin.
  // This ensures admin.cnnbra.com.br goes straight to the admin panel.
  app.use("/", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (isAdminSubdomain(req) && req.path === "/") {
      return res.redirect(302, "/admin");
    }
    next();
  });

  // Redirect /admin requests to admin.cnnbra.com.br when accessed elsewhere.
  app.use("/admin", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!isAdminSubdomain(req)) {
      const targetPath = req.path === "/" ? "" : req.path;
      return res.redirect(301, `https://${ADMIN_SUBDOMAIN}/admin${targetPath}`);
    }
    next();
  });
  // Block admin tRPC procedures when called from the public domain.
  // The adminProcedure middleware already enforces auth, but this adds an
  // extra network-level layer so admin API endpoints are unreachable from
  // the public portal entirely.
  app.use("/api/trpc/admin", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (isPublicDomain(req)) {
      return res.status(403).json({ error: "Admin API not available on this domain." });
    }
    next();
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ===== SEO: robots.txt =====
  app.get("/robots.txt", (_req: express.Request, res: express.Response) => {
    res.type("text/plain");
    res.send(
`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /shorts

Sitemap: https://cnnbra.com.br/sitemap.xml
`
    );
  });

  // ===== SEO: sitemap.xml dinâmico =====
  app.get("/sitemap.xml", async (_req: express.Request, res: express.Response) => {
    try {
      const { getArticles } = await import("../db");
      const allArticles = await getArticles({ limit: 1000, status: "online" });
      const baseUrl = "https://cnnbra.com.br";
      const now = new Date().toISOString();

      const staticPages = [
        { url: "/", priority: "1.0", changefreq: "hourly" },
        { url: "/busca", priority: "0.5", changefreq: "weekly" },
        { url: "/ranking", priority: "0.5", changefreq: "daily" },
        { url: "/shorts", priority: "0.6", changefreq: "hourly" },
        { url: "/enviar-conteudo", priority: "0.4", changefreq: "monthly" },
        { url: "/sobre", priority: "0.7", changefreq: "monthly" },
        { url: "/contato", priority: "0.7", changefreq: "monthly" },
        { url: "/privacidade", priority: "0.3", changefreq: "yearly" },
      ];

      const staticUrls = staticPages.map(p =>
        `  <url>\n    <loc>${baseUrl}${p.url}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
      ).join("\n");

      const articleUrls = allArticles.map(a => {
        const lastmod = a.publishedAt ? new Date(a.publishedAt).toISOString() : now;
        return `  <url>\n    <loc>${baseUrl}/artigo/${a.id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
      }).join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${staticUrls}
${articleUrls}
</urlset>`;

      res.header("Content-Type", "application/xml");
      res.header("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (err) {
      console.error("[Sitemap] Error generating sitemap:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    if (process.env.NODE_ENV === "production") {
      console.log(`[Admin] Panel restricted to https://${ADMIN_SUBDOMAIN}/admin`);
    }
  });

  // ===== CRON: Auto-fetch global news every 1 hour =====
  const FETCH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour (24 posts/day)

  // Fix existing images with Google News logos (one-time)
  const { fixGlobalNewsImages } = await import("../globalNewsFetcher");
  setTimeout(async () => {
    console.log("[Cron] Fixing existing global news images...");
    try {
      const fixed = await fixGlobalNewsImages();
      console.log(`[Cron] Fixed ${fixed} article images`);
    } catch (err) {
      console.error("[Cron] Image fix error:", err);
    }
  }, 30_000);

  // Run first fetch after 60 seconds (let server stabilize + image fix)
  setTimeout(async () => {
    console.log("[Cron] Running initial global news fetch...");
    try {
      const result = await fetchAndPublishGlobalNews();
      console.log(`[Cron] Initial fetch: ${result.imported} imported, ${result.errors} errors`);
    } catch (err) {
      console.error("[Cron] Initial fetch error:", err);
    }

    // Then run every 1 hour
    setInterval(async () => {
      console.log("[Cron] Running scheduled global news fetch...");
      try {
        const result = await fetchAndPublishGlobalNews();
        console.log(`[Cron] Scheduled fetch: ${result.imported} imported, ${result.errors} errors`);
      } catch (err) {
        console.error("[Cron] Scheduled fetch error:", err);
      }
    }, FETCH_INTERVAL_MS);
  }, 60_000);

  // ===== CRON: Auto-generate CNN Shorts every 2 hours =====
  const SHORTS_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
  setTimeout(async () => {
    console.log("[Cron] Running initial shorts automation...");
    try {
      const { runShortsAutomation } = await import("../shortsAutomation");
      const result = await runShortsAutomation();
      console.log(`[Cron] Shorts: ${result.youtubeImported} YouTube, ${result.aiGenerated} AI generated`);
    } catch (err) {
      console.error("[Cron] Shorts automation error:", err);
    }
    setInterval(async () => {
      console.log("[Cron] Running scheduled shorts automation...");
      try {
        const { runShortsAutomation } = await import("../shortsAutomation");
        const result = await runShortsAutomation();
        console.log(`[Cron] Shorts: ${result.youtubeImported} YouTube, ${result.aiGenerated} AI generated`);
      } catch (err) {
        console.error("[Cron] Shorts automation error:", err);
      }
    }, SHORTS_INTERVAL_MS);
  }, 90_000); // 90s after server start

  // ===== CRON: Link unlinked shorts to articles every 30 minutes =====
  const LINK_SHORTS_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
  setTimeout(async () => {
    // Run once at startup (120s delay to let other crons stabilize)
    try {
      const { linkShortsToArticles } = await import("../linkShortsToArticles");
      const result = await linkShortsToArticles();
      if (result.linked > 0) {
        console.log(`[Cron] LinkShorts: ${result.linked} vinculados, ${result.skipped} sem correspondência, ${result.errors} erros`);
      }
    } catch (err) {
      console.error("[Cron] LinkShorts initial error:", err);
    }

    // Then run every 30 minutes
    setInterval(async () => {
      try {
        const { linkShortsToArticles } = await import("../linkShortsToArticles");
        const result = await linkShortsToArticles();
        if (result.linked > 0) {
          console.log(`[Cron] LinkShorts: ${result.linked} vinculados, ${result.skipped} sem correspondência, ${result.errors} erros`);
        }
      } catch (err) {
        console.error("[Cron] LinkShorts scheduled error:", err);
      }
    }, LINK_SHORTS_INTERVAL_MS);
  }, 120_000); // 120s after server start

  // ===== CRON: Fetch Google Trends BR every 2 hours =====
  const TRENDS_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
  setTimeout(async () => {
    try {
      const { fetchAndSaveTrending } = await import("../trendingFetcher");
      const result = await fetchAndSaveTrending(true);
      if (result.saved > 0) {
        console.log(`[Cron] Trends: ${result.saved} tópicos salvos, ${result.articlesPublished} artigos publicados`);
      }
    } catch (err) {
      console.error("[Cron] Trends initial error:", err);
    }

    setInterval(async () => {
      try {
        const { fetchAndSaveTrending } = await import("../trendingFetcher");
        const result = await fetchAndSaveTrending(true);
        if (result.saved > 0) {
          console.log(`[Cron] Trends: ${result.saved} tópicos salvos, ${result.articlesPublished} artigos publicados`);
        }
      } catch (err) {
        console.error("[Cron] Trends scheduled error:", err);
      }
    }, TRENDS_INTERVAL_MS);
  }, 60_000); // 60s after server start

  // ===== CRON: Deduplicate articles once per day =====
  const DEDUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
  // Run immediately at startup (after 30s delay) and then once per day
  setTimeout(async () => {
    try {
      const { deduplicateArticles } = await import("../deduplicateArticles");
      const result = await deduplicateArticles();
      if (result.removed > 0) {
        console.log(`[Cron] Dedup: ${result.removed} artigos removidos, ${result.shortsRedirected} shorts redirecionados (${result.groups} grupos)`);
      }
    } catch (err) {
      console.error("[Cron] Dedup initial error:", err);
    }

    setInterval(async () => {
      try {
        const { deduplicateArticles } = await import("../deduplicateArticles");
        const result = await deduplicateArticles();
        if (result.removed > 0) {
          console.log(`[Cron] Dedup: ${result.removed} artigos removidos, ${result.shortsRedirected} shorts redirecionados (${result.groups} grupos)`);
        }
      } catch (err) {
        console.error("[Cron] Dedup scheduled error:", err);
      }
    }, DEDUP_INTERVAL_MS);
  }, 30_000); // 30s after server start

  // ===== SCHEDULED ARTICLES PUBLISHER =====
  // Runs every 60 seconds to publish articles whose scheduledAt has passed.
  const SCHEDULER_INTERVAL_MS = 60_000; // 1 minute
  // Start after 10s so the DB connection is ready
  setTimeout(async () => {
    console.log("[Scheduler] Starting scheduled articles publisher (every 60s)...");
    // First run
    try {
      const { publishScheduledArticles } = await import("../publishScheduledArticles");
      const result = await publishScheduledArticles();
      if (result.published > 0) {
        console.log(`[Scheduler] Initial run: published ${result.published} article(s) — IDs: ${result.ids.join(", ")}`);
      }
    } catch (err) {
      console.error("[Scheduler] Initial run error:", err);
    }
    // Recurring runs
    setInterval(async () => {
      try {
        const { publishScheduledArticles } = await import("../publishScheduledArticles");
        const result = await publishScheduledArticles();
        if (result.published > 0) {
          console.log(`[Scheduler] Published ${result.published} scheduled article(s) — IDs: ${result.ids.join(", ")}`);
        }
      } catch (err) {
        console.error("[Scheduler] Recurring run error:", err);
      }
    }, SCHEDULER_INTERVAL_MS);
  }, 10_000); // 10s after server start
}

// ===== BACKFILL: Auto-detect state for existing articles (runs once at startup) =====
setTimeout(async () => {
  try {
    const { backfillArticleStates } = await import("../backfillStates");
    const result = await backfillArticleStates();
    if (result.updated > 0) {
      console.log(`[Backfill] Updated state for ${result.updated}/${result.total} articles`);
    } else {
      console.log(`[Backfill] No articles need state backfill (${result.total} checked)`);
    }
  } catch (err) {
    console.error("[Backfill] State backfill error:", err);
  }
}, 15_000); // 15s after server start

startServer().catch(console.error);
