import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook } from "../stripe";
import { extensionImportRouter } from "../extension-import";
import { registerErrorInterceptor, startHealthMonitor } from "../self-healing";
import { startAIEngine } from "../ai-engine";
import { startAutoSyncRunner } from "../migration-autosync-runner";
import rateLimit from "express-rate-limit";

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
  // Register Stripe webhook BEFORE express.json() so raw body is available for signature verification
  registerStripeWebhook(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Rate limiting — protect API from abuse
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
    skip: (req) => process.env.NODE_ENV === "development" && req.ip === "127.0.0.1",
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // stricter limit for auth endpoints
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many authentication attempts, please try again later." },
  });
  const publicBookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // max 30 bookings per hour per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many booking attempts, please try again later." },
  });
  app.use("/api/trpc", apiLimiter);
  app.use("/api/trpc/auth.forgotPassword", authLimiter);
  app.use("/api/trpc/auth.resetPassword", authLimiter);
  app.use("/api/trpc/publicBooking.bookMeeting", publicBookingLimiter);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Extension import API (before tRPC)
  app.use(extensionImportRouter);
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

  // Self-healing error interceptor (must be last middleware)
  registerErrorInterceptor(app);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start health monitor daemon after server is up
    startHealthMonitor();
    // Start AI Autonomous Engine (developer-only background tasks)
    startAIEngine();
    // Start migration auto-sync runner (checks scheduled syncs every 15 min)
    startAutoSyncRunner();
  });
}

startServer().catch(console.error);
