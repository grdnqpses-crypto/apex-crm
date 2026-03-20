import { COOKIE_NAME, ONE_YEAR_MS, THIRTY_DAYS_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import bcrypt from "bcryptjs";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // ─── Credential-based Login ───
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password, rememberMe } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: "Username and password are required" });
        return;
      }
      const user = await db.getUserByUsername(username);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Invalid username or password" });
        return;
      }
      if (!user.isActive) {
        res.status(403).json({ error: "Account is deactivated. Contact your administrator." });
        return;
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid username or password" });
        return;
      }
      // Session duration: 30 days if rememberMe, otherwise 1 day (session cookie)
      const sessionDurationMs = rememberMe ? THIRTY_DAYS_MS : ONE_YEAR_MS;
      // Create session token using the user's openId
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: sessionDurationMs,
      });
      // Update last signed in
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      const cookieOptions = getSessionCookieOptions(req);
      // rememberMe: persistent 30-day cookie; otherwise: session cookie (no maxAge)
      const cookieMaxAge = rememberMe ? THIRTY_DAYS_MS : undefined;
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, ...(cookieMaxAge ? { maxAge: cookieMaxAge } : { expires: undefined }) });
      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          systemRole: user.systemRole,
          tenantCompanyId: user.tenantCompanyId,
        },
      });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // ─── Self-Service Company Registration ───
  app.post("/api/auth/register-company", async (req: Request, res: Response) => {
    try {
      const { companyName, slug, fullName, email, phone, username, password, subscriptionTier } = req.body;
      if (!companyName || !fullName || !username || !password) {
        res.status(400).json({ error: "Company name, full name, username, and password are required" });
        return;
      }
      if (password.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters" });
        return;
      }
      // Check if username already exists
      const existingUser = await db.getUserByUsername(username);
      if (existingUser) {
        res.status(409).json({ error: "Username already taken. Please choose another." });
        return;
      }
      // Check if company slug already exists
      const existingCompany = await db.getTenantCompanyBySlug(slug);
      if (existingCompany) {
        res.status(409).json({ error: "A company with a similar name already exists. Try a different name." });
        return;
      }
      // Determine tier settings
      const tierConfig: Record<string, { maxUsers: number }> = {
        starter: { maxUsers: 5 },
        professional: { maxUsers: 15 },
        enterprise: { maxUsers: 25 },
      };
      const tier = (subscriptionTier && tierConfig[subscriptionTier]) ? subscriptionTier : "trial";
      const config = tierConfig[tier] || { maxUsers: 5 };

      // Create the tenant company
      const now = Date.now();
      const companyId = await db.createTenantCompany({
        name: companyName,
        slug,
        contactEmail: email || null,
        phone: phone || null,
        subscriptionTier: tier,
        subscriptionStatus: "active",
        maxUsers: config.maxUsers,
        trialEndsAt: now + (60 * 24 * 60 * 60 * 1000), // 60 days trial
        createdAt: now,
        updatedAt: now,
      });

      // Create the admin user
      const passwordHash = await bcrypt.hash(password, 12);
      const userId = await db.createCredentialUser({
        username,
        passwordHash,
        name: fullName,
        email: email || undefined,
        phone: phone || undefined,
        systemRole: "company_admin",
        tenantCompanyId: companyId,
      });

      // Get the created user to create session
      const user = await db.getUserByUsername(username);
      if (!user) {
        res.status(500).json({ error: "Account created but login failed. Please sign in manually." });
        return;
      }

      // Create session and log them in
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: fullName,
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({
        success: true,
        companyId,
        userId,
        message: "Account created successfully! Welcome to AXIOM CRM.",
      });
    } catch (error) {
      console.error("[Auth] Registration failed", error);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
