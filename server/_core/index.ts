import "dotenv/config";
import express from "express";
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
}

startServer().catch(console.error);
