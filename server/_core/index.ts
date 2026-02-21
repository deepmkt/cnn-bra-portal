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

  // Run first fetch after 120 seconds (let server stabilize + image fix)
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
}

startServer().catch(console.error);
