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
    console.log("PRODUCTION DEPLOY TEST");
    console.log("LOGIN ROUTE HIT");
    try {
      const { username, password, rememberMe } = req.body;
      console.log("[AUTH-DEBUG] LOGIN INPUT:", { username, passwordLength: password?.length });
      
      if (!username || !password) {
        console.log("[AUTH-DEBUG] MISSING CREDENTIALS");
        res.status(400).json({ error: "Username and password are required" });
        return;
      }
      
      const user = await db.getUserByUsername(username);
      console.log("[AUTH-DEBUG] USER FROM DB:", { 
        found: !!user, 
        id: user?.id,
        username: user?.username,
        email: user?.email,
        hasPasswordHash: !!user?.passwordHash,
        isActive: user?.isActive,
        passwordHashLength: user?.passwordHash?.length
      });
      
      if (!user || !user.passwordHash) {
        console.log("[AUTH-DEBUG] USER NOT FOUND OR NO PASSWORD HASH");
        res.status(401).json({ error: "Invalid username or password" });
        return;
      }
      
      if (!user.isActive) {
        console.log("[AUTH-DEBUG] USER IS INACTIVE");
        res.status(403).json({ error: "Account is deactivated. Contact your administrator." });
        return;
      }
      
      console.log("[AUTH-DEBUG] ATTEMPTING BCRYPT COMPARE");
      const valid = await bcrypt.compare(password, user.passwordHash);
      console.log("[AUTH-DEBUG] PASSWORD VALID:", valid);
      
      if (!valid) {
        console.log("[AUTH-DEBUG] PASSWORD MISMATCH");
        res.status(401).json({ error: "Invalid username or password" });
        return;
      }
      
      console.log("[AUTH-DEBUG] CREATING SESSION TOKEN");
      // Session duration: 30 days if rememberMe, otherwise 1 day (session cookie)
      const sessionDurationMs = rememberMe ? THIRTY_DAYS_MS : ONE_YEAR_MS;
      // Create session token using the user's openId
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: sessionDurationMs,
      });
      console.log("[AUTH-DEBUG] SESSION TOKEN CREATED:", { tokenLength: sessionToken?.length });
      
      // Update last signed in
      console.log("[AUTH-DEBUG] UPDATING LAST SIGNED IN");
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      console.log("[AUTH-DEBUG] LAST SIGNED IN UPDATED");
      
      const cookieOptions = getSessionCookieOptions(req);
      // rememberMe: persistent 30-day cookie; otherwise: session cookie (no maxAge)
      const cookieMaxAge = rememberMe ? THIRTY_DAYS_MS : undefined;
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, ...(cookieMaxAge ? { maxAge: cookieMaxAge } : { expires: undefined }) });
      
      console.log("[AUTH-DEBUG] LOGIN SUCCESS");
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
    } catch (err) {
      console.error("LOGIN ERROR FULL:", err);
      console.error("ERROR STACK:", err?.stack);
      console.error("ERROR TYPE:", typeof err, Object.prototype.toString.call(err));
      return res.status(500).json({
        error: String(err),
        message: err?.message,
        stack: err?.stack,
        type: typeof err,
        _marker: "UNIQUE_MARKER_12345_TESTING_DEPLOYMENT"
      });
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

      // Redirect to dashboard after successful OAuth login (not "/" which shows marketing page)
      res.redirect(302, "/dashboard");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // ─── Google Calendar OAuth Callback ───
  app.get("/api/auth/google-calendar/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const oauthError = getQueryParam(req, "error");
    if (oauthError) {
      console.error("[GoogleCalendar] OAuth error:", oauthError);
      return res.redirect(302, "/meeting-scheduler?calendarError=" + encodeURIComponent(oauthError));
    }
    if (!code || !state) {
      return res.redirect(302, "/meeting-scheduler?calendarError=missing_params");
    }
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64url").toString());
      const { userId, tenantId, origin } = stateData;
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return res.redirect(302, "/meeting-scheduler?calendarError=not_configured");
      }
      const redirectUri = `${origin}/api/auth/google-calendar/callback`;
      // Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      });
      const tokenData = await tokenRes.json() as Record<string, unknown>;
      if (!tokenData.access_token) {
        console.error("[GoogleCalendar] Token exchange failed:", tokenData);
        return res.redirect(302, "/meeting-scheduler?calendarError=token_exchange_failed");
      }
      // Get the user's calendar email
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profileData = await profileRes.json() as Record<string, unknown>;
      const calendarEmail = (profileData.email as string) ?? null;
      // Store tokens in calendarConnections
      const { getDb } = await import("../db");
      const { calendarConnections } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const dbConn = await getDb();
      if (dbConn) {
        const now = Date.now();
        const existing = await dbConn.select({ id: calendarConnections.id })
          .from(calendarConnections)
          .where(and(eq(calendarConnections.userId, userId), eq(calendarConnections.provider, "google")))
          .limit(1);
        if (existing.length > 0) {
          await dbConn.update(calendarConnections).set({
            accessToken: tokenData.access_token as string,
            refreshToken: (tokenData.refresh_token as string) ?? undefined,
            calendarId: calendarEmail,
            syncEnabled: true,
            updatedAt: now,
          }).where(eq(calendarConnections.id, existing[0].id));
        } else {
          await dbConn.insert(calendarConnections).values({
            userId,
            tenantCompanyId: tenantId,
            provider: "google",
            accessToken: tokenData.access_token as string,
            refreshToken: (tokenData.refresh_token as string) ?? undefined,
            calendarId: calendarEmail,
            syncEnabled: true,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
      console.log(`[GoogleCalendar] Connected calendar for user ${userId}: ${calendarEmail}`);
      res.redirect(302, "/meeting-scheduler?calendarConnected=1");
    } catch (err) {
      console.error("[GoogleCalendar] Callback error:", err);
      res.redirect(302, "/meeting-scheduler?calendarError=server_error");
    }
  });
}
