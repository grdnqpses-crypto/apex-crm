/**
 * Migration Monster Router
 * One-button AI-powered CRM migration procedures
 */

import { z } from "zod";
import { router, protectedProcedure, companyAdminProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { encryptCredentials } from "../credential-vault";
import {
  migrationJobs, skinPreferences, customFieldDefs, customFieldValues,
  activityHistory, contacts, companies, deals, users, migrationAutoSync,
  migrationRollbackLog,
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  COMPETITOR_PROFILES, AXIOM_FIELDS,
  aiMapFields, generateCheatSheet, parseCSV,
  isDuplicateContact, isDuplicateCompany,
  normalizeStage, updateMigrationProgress,
  type FieldMapping,
} from "../migration-engine";
import {
  fetchHubSpot, fetchSalesforce, fetchPipedrive,
  fetchZoho, fetchGoHighLevel, fetchClose,
  fetchApollo, fetchFreshsales, fetchActiveCampaign,
  fetchKeap, fetchCopper, fetchNutshell, fetchInsightly,
  fetchSugarCRM, fetchStreak, fetchNimble, fetchMonday, fetchConstantContact,
  type MigrationData, type NormalizedContact, type NormalizedCompany,
  type NormalizedDeal, type NormalizedActivity,
} from "../migration-fetchers";

export const migrationRouter = router({

  // ─── Get all competitor profiles (for the UI picker) ─────────────────────
  getCompetitors: protectedProcedure.query(() => {
    return Object.entries(COMPETITOR_PROFILES).map(([key, profile]) => ({
      key,
      name: profile.name,
      color: profile.color,
      logo: profile.logo,
      authMethod: profile.authMethod,
      apiKeyLabel: profile.apiKeyLabel,
      apiKeyHelp: profile.apiKeyHelp,
      apiKeyPlaceholder: profile.apiKeyPlaceholder,
    }));
  }),

  // ─── Get skin for a specific user's company (developer/axiom_owner QA use) ─────
  getClientSkin: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { skin: "axiom", migratedFrom: null };
      const [targetUser] = await db.select({ tenantCompanyId: users.tenantCompanyId })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      if (!targetUser?.tenantCompanyId) return { skin: "axiom", migratedFrom: null };
      const [pref] = await db.select()
        .from(skinPreferences)
        .where(eq(skinPreferences.tenantCompanyId, targetUser.tenantCompanyId))
        .limit(1);
      return pref || { skin: "axiom", migratedFrom: null };
    }),
  // ─── Get current skin preferencece ─────────────────────────────────────────
  getSkin: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user.tenantCompanyId) return { skin: "axiom", migratedFrom: null };
    const [pref] = await db.select()
      .from(skinPreferences)
      .where(eq(skinPreferences.tenantCompanyId, ctx.user.tenantCompanyId))
      .limit(1);
    return pref || { skin: "axiom", migratedFrom: null };
  }),

  // ─── Set skin preference ──────────────────────────────────────────────────
  setSkin: companyAdminProcedure
    .input(z.object({
      skin: z.enum([
        "axiom", "hubspot", "salesforce", "pipedrive", "zoho", "gohighlevel", "close",
        "apollo", "constantcontact", "monday", "freshsales", "activecampaign",
        "keap", "copper", "nutshell", "insightly", "sugarcrm", "streak", "nimble",
      ]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantCompanyId) return;
      const existing = await db.select({ id: skinPreferences.id })
        .from(skinPreferences)
        .where(eq(skinPreferences.tenantCompanyId, ctx.user.tenantCompanyId))
        .limit(1);
      if (existing.length > 0) {
        await db.update(skinPreferences)
          .set({ skin: input.skin, updatedAt: Date.now() })
          .where(eq(skinPreferences.tenantCompanyId, ctx.user.tenantCompanyId));
      } else {
        await db.insert(skinPreferences).values({
          tenantCompanyId: ctx.user.tenantCompanyId,
          skin: input.skin,
          graduatedToAxiom: false,
          updatedAt: Date.now(),
        });
      }
      return { success: true };
    }),

  // ─── Graduate to AXIOM native UI ───────────────────────────────────────────
  graduateToAxiom: companyAdminProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user.tenantCompanyId) return;
    await db.update(skinPreferences)
      .set({ skin: "axiom", graduatedToAxiom: true, graduatedAt: Date.now(), updatedAt: Date.now() })
      .where(eq(skinPreferences.tenantCompanyId, ctx.user.tenantCompanyId));
    return { success: true };
  }),

  // ─── List migration jobs ──────────────────────────────────────────────────
  listJobs: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user.tenantCompanyId) return [];
    return db.select()
      .from(migrationJobs)
      .where(eq(migrationJobs.companyId, ctx.user.tenantCompanyId))
      .orderBy(desc(migrationJobs.createdAt))
      .limit(10);
  }),

  // ─── Get single migration job ─────────────────────────────────────────────
  getJob: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantCompanyId) return null;
      const [job] = await db.select()
        .from(migrationJobs)
        .where(and(
          eq(migrationJobs.id, input.id),
          eq(migrationJobs.companyId, ctx.user.tenantCompanyId)
        ))
        .limit(1);
      return job || null;
    }),

  // ─── Get last synced timestamp for the dashboard widget ─────────────────────────
  getLastSyncedAt: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user.tenantCompanyId) return { lastSyncedAt: null, sourcePlatform: null };
    const [job] = await db.select({
      lastSyncedAt: migrationJobs.lastSyncedAt,
      completedAt: migrationJobs.completedAt,
      sourcePlatform: migrationJobs.sourcePlatform,
    })
      .from(migrationJobs)
      .where(and(
        eq(migrationJobs.companyId, ctx.user.tenantCompanyId),
        eq(migrationJobs.status, "completed"),
      ))
      .orderBy(desc(migrationJobs.createdAt))
      .limit(1);
    return {
      lastSyncedAt: job?.lastSyncedAt || job?.completedAt || null,
      sourcePlatform: job?.sourcePlatform || null,
    };
  }),

  // ─── ONE-BUTTON MIGRATION — The main event ─────────────────────────────────────────────────
  // This is the single procedure that does everything:
  // 1. Creates a job record
  // 2. Runs AI field mapping
  // 3. Imports all data
  // 4. Applies the matching skin
  // 5. Generates the cheat sheet
  // ADMIN ONLY — only company admins and above can trigger migrations
  startMigration: adminProcedure
    .input(z.object({
      sourceSystem: z.enum(["hubspot", "salesforce", "pipedrive", "zoho", "gohighlevel", "close",
        "apollo", "freshsales", "activecampaign", "keap", "copper", "nutshell", "insightly",
        "sugarcrm", "streak", "nimble", "monday", "constantcontact", "spreadsheet", "other"]),
      apiKey: z.string().optional(),       // API key / token
      instanceUrl: z.string().optional(),  // For Salesforce/Zoho
      csvData: z.string().optional(),      // For CSV uploads (base64 or raw text)
      csvType: z.enum(["contacts", "companies", "deals"]).optional(),
      sinceDate: z.number().optional(),    // UTC ms — incremental sync: only import records modified after this
      isIncrementalSync: z.boolean().optional(), // Flag to mark this as a re-sync
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantCompanyId) throw new Error("No tenant");

      const profile = COMPETITOR_PROFILES[input.sourceSystem];
      if (!profile) throw new Error("Unknown source system");

      // Create the migration job
      const [jobResult] = await db.insert(migrationJobs).values({
        userId: ctx.user.id,
        companyId: ctx.user.tenantCompanyId,
        sourcePlatform: input.sourceSystem,
        status: "validating",
        totalRecords: 0,
        importedRecords: 0,
        failedRecords: 0,
        skippedRecords: 0,
        entityTypes: ["contacts", "companies", "deals", "activities"],
        isIncrementalSync: input.isIncrementalSync ?? false,
        sinceDate: input.sinceDate ?? null,
        startedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any);

      const jobId = (jobResult as any).insertId as number;

      // Run migration asynchronously so the UI gets the job ID immediately
      runMigrationAsync(jobId, ctx.user.tenantCompanyId, ctx.user.id, input, profile).catch(err => {
        console.error(`[Migration] Job ${jobId} failed:`, err);
        updateMigrationProgress(jobId, { status: "failed", errors: [{ record: "system", error: String(err) }] });
      });

      return { jobId, status: "validating", message: "Migration started! We'll handle everything from here." };
    }),

  // ─── Get custom field definitions for a tenant ────────────────────────────
  getCustomFields: protectedProcedure
    .input(z.object({
      objectType: z.enum(["contact", "company", "deal", "lead", "activity", "custom_object"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantCompanyId) return [];
      const conditions = [eq(customFieldDefs.tenantCompanyId, ctx.user.tenantCompanyId)];
      if (input.objectType) conditions.push(eq(customFieldDefs.objectType, input.objectType));
      return db.select().from(customFieldDefs).where(and(...conditions)).orderBy(customFieldDefs.displayOrder);
    }),

  // ─── Get custom field values for a record ────────────────────────────────
  getCustomFieldValues: protectedProcedure
    .input(z.object({
      objectType: z.enum(["contact", "company", "deal", "lead", "activity", "custom_object"]),
      recordId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantCompanyId) return [];
      return db.select({
        id: customFieldValues.id,
        fieldDefId: customFieldValues.fieldDefId,
        valueText: customFieldValues.valueText,
        valueNumber: customFieldValues.valueNumber,
        valueBoolean: customFieldValues.valueBoolean,
        valueDate: customFieldValues.valueDate,
        valueJson: customFieldValues.valueJson,
        label: customFieldDefs.label,
        fieldKey: customFieldDefs.fieldKey,
        fieldType: customFieldDefs.fieldType,
        groupName: customFieldDefs.groupName,
      })
        .from(customFieldValues)
        .innerJoin(customFieldDefs, eq(customFieldValues.fieldDefId, customFieldDefs.id))
        .where(and(
          eq(customFieldValues.tenantCompanyId, ctx.user.tenantCompanyId),
          eq(customFieldValues.objectType, input.objectType),
          eq(customFieldValues.recordId, input.recordId),
        ))
        .orderBy(customFieldDefs.displayOrder);
    }),

  // ─── Get activity history for a record ────────────────────────────────────
  getActivityHistory: protectedProcedure
    .input(z.object({
      objectType: z.enum(["contact", "company", "deal", "lead", "custom_object"]),
      recordId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantCompanyId) return [];
      return db.select()
        .from(activityHistory)
        .where(and(
          eq(activityHistory.tenantCompanyId, ctx.user.tenantCompanyId),
          eq(activityHistory.objectType, input.objectType),
          eq(activityHistory.recordId, input.recordId),
        ))
        .orderBy(desc(activityHistory.occurredAt))
        .limit(100);
    }),

  // ─── OAuth: Get authorization URL for OAuth-based CRMs ─────────────────────
  // Supports: salesforce, zoho, keap, constantcontact
  // ADMIN ONLY — OAuth connect is part of the migration flow
  getOAuthUrl: adminProcedure
    .input(z.object({
      crm: z.enum(["salesforce", "zoho", "keap", "constantcontact"]),
      redirectUri: z.string().url(),
    }))
    .query(({ input }) => {
      const { crm, redirectUri } = input;
      let url = "";
      switch (crm) {
        case "salesforce":
          url = `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${process.env.SALESFORCE_CLIENT_ID || "YOUR_SF_CLIENT_ID"}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=api%20refresh_token%20offline_access&state=${crm}`;
          break;
        case "zoho":
          url = `https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=${process.env.ZOHO_CLIENT_ID || "YOUR_ZOHO_CLIENT_ID"}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL&access_type=offline&state=${crm}`;
          break;
        case "keap":
          url = `https://accounts.infusionsoft.com/app/oauth/authorize?response_type=code&client_id=${process.env.KEAP_CLIENT_ID || "YOUR_KEAP_CLIENT_ID"}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=full&state=${crm}`;
          break;
        case "constantcontact":
          url = `https://authz.constantcontact.com/oauth2/default/v1/authorize?response_type=code&client_id=${process.env.CONSTANTCONTACT_CLIENT_ID || "YOUR_CC_CLIENT_ID"}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=contact_data+campaign_data&state=${crm}`;
          break;
      }
      return { url };
    }),

  // ─── OAuth: Exchange authorization code for access token ─────────────────
  // ADMIN ONLY
  oauthCallback: adminProcedure
    .input(z.object({
      crm: z.enum(["salesforce", "zoho", "keap", "constantcontact"]),
      code: z.string(),
      redirectUri: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const { crm, code, redirectUri } = input;
      let tokenUrl = "";
      let body: Record<string, string> = {};
      let clientId = "";
      let clientSecret = "";

      switch (crm) {
        case "salesforce":
          tokenUrl = "https://login.salesforce.com/services/oauth2/token";
          clientId = process.env.SALESFORCE_CLIENT_ID || "";
          clientSecret = process.env.SALESFORCE_CLIENT_SECRET || "";
          body = { grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: clientId, client_secret: clientSecret };
          break;
        case "zoho":
          tokenUrl = "https://accounts.zoho.com/oauth/v2/token";
          clientId = process.env.ZOHO_CLIENT_ID || "";
          clientSecret = process.env.ZOHO_CLIENT_SECRET || "";
          body = { grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: clientId, client_secret: clientSecret };
          break;
        case "keap":
          tokenUrl = "https://api.infusionsoft.com/token";
          clientId = process.env.KEAP_CLIENT_ID || "";
          clientSecret = process.env.KEAP_CLIENT_SECRET || "";
          body = { grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: clientId, client_secret: clientSecret };
          break;
        case "constantcontact":
          tokenUrl = "https://authz.constantcontact.com/oauth2/default/v1/token";
          clientId = process.env.CONSTANTCONTACT_CLIENT_ID || "";
          clientSecret = process.env.CONSTANTCONTACT_CLIENT_SECRET || "";
          body = { grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: clientId, client_secret: clientSecret };
          break;
      }

      if (!tokenUrl) throw new Error(`OAuth not configured for ${crm}`);

      const resp = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
        body: new URLSearchParams(body).toString(),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`OAuth token exchange failed for ${crm}: ${errText}`);
      }

      const tokenData = await resp.json() as Record<string, string>;
      const accessToken = tokenData.access_token;
      const instanceUrl = tokenData.instance_url; // Salesforce-specific

      return {
        accessToken,
        instanceUrl: instanceUrl || null,
        crm,
        // Hint to the frontend: pass these as apiKey + instanceUrl to startMigration
        ready: true,
      };
    }),

  // ─── Set / update a custom field value for a record ───────────────────────
  setCustomFieldValue: protectedProcedure
    .input(z.object({
      objectType: z.enum(["contact", "company", "deal", "lead", "activity", "custom_object"]),
      recordId: z.number(),
      fieldDefId: z.number(),
      fieldType: z.string(),
      value: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantCompanyId) throw new Error("Unauthorized");
      const now = Date.now();
      // Parse value based on field type
      let valueText: string | null = null;
      let valueNumber: number | null = null;
      let valueBoolean: boolean | null = null;
      let valueDate: number | null = null;
      let valueJson: unknown = null;
      switch (input.fieldType) {
        case "number": case "currency":
          valueNumber = parseFloat(input.value) || null;
          break;
        case "boolean":
          valueBoolean = input.value === "true" || input.value === "Yes";
          break;
        case "date": case "datetime":
          valueDate = new Date(input.value).getTime() || null;
          break;
        case "multiselect":
          valueJson = input.value.split(",").map((s: string) => s.trim()).filter(Boolean);
          break;
        default:
          valueText = input.value || null;
      }
      // Upsert: check if value exists
      const existing = await db.select({ id: customFieldValues.id })
        .from(customFieldValues)
        .where(and(
          eq(customFieldValues.tenantCompanyId, ctx.user.tenantCompanyId),
          eq(customFieldValues.fieldDefId, input.fieldDefId),
          eq(customFieldValues.objectType, input.objectType),
          eq(customFieldValues.recordId, input.recordId),
        ))
        .limit(1);
      if (existing.length > 0) {
        await db.update(customFieldValues)
          .set({ valueText, valueNumber, valueBoolean, valueDate, valueJson: valueJson as any, updatedAt: now })
          .where(eq(customFieldValues.id, existing[0].id));
      } else {
        await db.insert(customFieldValues).values({
          tenantCompanyId: ctx.user.tenantCompanyId,
          fieldDefId: input.fieldDefId,
          objectType: input.objectType,
          recordId: input.recordId,
          valueText, valueNumber, valueBoolean, valueDate, valueJson: valueJson as any,
          createdAt: now, updatedAt: now,
        });
      }
      return { success: true };
    }),

  // ─── Auto-sync: get config for current company ────────────────────────────
  getAutoSync: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user.tenantCompanyId) return [];
    const rows = await db.select().from(migrationAutoSync)
      .where(eq(migrationAutoSync.companyId, ctx.user.tenantCompanyId));
    // Never expose encrypted credentials to the frontend — just a boolean flag
    return rows.map(r => ({
      ...r,
      encryptedCredentials: undefined,
      hasCredentials: !!r.encryptedCredentials,
    }));
  }),

  // ─── Auto-sync: upsert config for a source platform ──────────────────────
  setAutoSync: adminProcedure
    .input(z.object({
      sourcePlatform: z.string(),
      enabled: z.boolean(),
      frequency: z.enum(["hourly", "daily", "weekly"]),
      apiKey: z.string().optional(), // If provided, encrypt and store for fully-automatic syncs
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantCompanyId) throw new Error("No company context");
      const now = Date.now();
      // Compute nextRunAt based on frequency
      const frequencyMs = { hourly: 3600_000, daily: 86400_000, weekly: 604800_000 };
      const nextRunAt = input.enabled ? now + frequencyMs[input.frequency] : null;

      // Encrypt credentials if provided
      const encryptedCreds = input.apiKey
        ? encryptCredentials({ apiKey: input.apiKey, platform: input.sourcePlatform })
        : undefined;

      const [existing] = await db.select({ id: migrationAutoSync.id })
        .from(migrationAutoSync)
        .where(and(
          eq(migrationAutoSync.companyId, ctx.user.tenantCompanyId),
          eq(migrationAutoSync.sourcePlatform, input.sourcePlatform),
        ))
        .limit(1);

      if (existing) {
        await db.update(migrationAutoSync)
          .set({
            enabled: input.enabled,
            frequency: input.frequency,
            nextRunAt: nextRunAt ?? undefined,
            ...(encryptedCreds && { encryptedCredentials: encryptedCreds, credentialsUpdatedAt: now }),
            updatedAt: now,
          })
          .where(eq(migrationAutoSync.id, existing.id));
      } else {
        await db.insert(migrationAutoSync).values({
          companyId: ctx.user.tenantCompanyId,
          userId: ctx.user.id,
          sourcePlatform: input.sourcePlatform,
          enabled: input.enabled,
          frequency: input.frequency,
          nextRunAt: nextRunAt ?? undefined,
          ...(encryptedCreds && { encryptedCredentials: encryptedCreds, credentialsUpdatedAt: now }),
          createdAt: now,
          updatedAt: now,
        });
      }
      return { success: true, hasCredentials: !!encryptedCreds };
    }),

  // ─── Auto-sync: delete config ─────────────────────────────────────────────
  deleteAutoSync: adminProcedure
    .input(z.object({ sourcePlatform: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantCompanyId) throw new Error("No company context");
      await db.delete(migrationAutoSync)
        .where(and(
          eq(migrationAutoSync.companyId, ctx.user.tenantCompanyId),
          eq(migrationAutoSync.sourcePlatform, input.sourcePlatform),
        ));
      return { success: true };
    }),

  // ─── Migration Preview: count records + suggest field mapping ────────────
  preview: companyAdminProcedure
    .input(z.object({
      sourcePlatform: z.string(),
      csvData: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.user.tenantCompanyId!;
      let contactCount = 0;
      let fieldSample: Record<string, string[]> = {};
      let suggestedMapping: Record<string, string> = {};
      if (input.csvData) {
        const rows = parseCSV(input.csvData);
        contactCount = rows.length;
        if (rows.length > 0) {
          const headers = Object.keys(rows[0]);
          for (const h of headers) {
            fieldSample[h] = rows.slice(0, 3).map((r: Record<string, string>) => r[h] ?? "").filter(Boolean);
          }
          try { suggestedMapping = await aiMapFields(headers, input.sourcePlatform); } catch { /* fallback */ }
        }
      }
      return { tenantId, sourcePlatform: input.sourcePlatform, contactCount, fieldSample, suggestedMapping, canImport: contactCount > 0 };
    }),

  // ─── Get jobs eligible for rollback (completed within last 48 hours) ─────
  getRollbackEligibleJobs: companyAdminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user.tenantCompanyId) return [];
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    const jobs = await db.select().from(migrationJobs)
      .where(and(eq(migrationJobs.companyId, ctx.user.tenantCompanyId), eq(migrationJobs.status, "completed")))
      .orderBy(desc(migrationJobs.createdAt)).limit(20);
    return jobs
      .filter(j => (j.completedAt ?? 0) > cutoff)
      .map(j => ({
        id: j.id,
        sourcePlatform: j.sourcePlatform,
        completedAt: j.completedAt,
        contactsImported: j.contactsImported ?? 0,
        companiesImported: j.companiesImported ?? 0,
        dealsImported: j.dealsImported ?? 0,
        expiresAt: (j.completedAt ?? 0) + 48 * 60 * 60 * 1000,
      }));
  }),

  // ─── Rollback a completed migration (soft-delete all imported records) ────
  rollback: companyAdminProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantCompanyId) throw new Error("No company context");
      const tenantId = ctx.user.tenantCompanyId;
      const cutoff = Date.now() - 48 * 60 * 60 * 1000;
      const [job] = await db.select().from(migrationJobs)
        .where(and(eq(migrationJobs.id, input.jobId), eq(migrationJobs.companyId, tenantId)));
      if (!job) throw new Error("Job not found");
      if ((job.completedAt ?? 0) < cutoff) throw new Error("Rollback window expired (48 hours)");
      const logEntries = await db.select().from(migrationRollbackLog)
        .where(and(eq(migrationRollbackLog.jobId, input.jobId), eq(migrationRollbackLog.tenantId, tenantId)));
      let deletedContacts = 0, deletedCompanies = 0, deletedDeals = 0;
      for (const entry of logEntries) {
        try {
          if (entry.entityType === "contact") {
            await db.execute(sql`UPDATE contacts SET is_deleted=1, deleted_at=${Date.now()} WHERE id=${entry.entityId} AND tenantId=${tenantId}`);
            deletedContacts++;
          } else if (entry.entityType === "company") {
            await db.execute(sql`UPDATE companies SET is_deleted=1, deleted_at=${Date.now()} WHERE id=${entry.entityId} AND tenantId=${tenantId}`);
            deletedCompanies++;
          } else if (entry.entityType === "deal") {
            await db.execute(sql`DELETE FROM deals WHERE id=${entry.entityId} AND tenantId=${tenantId}`);
            deletedDeals++;
          }
        } catch { /* continue on error */ }
      }
      await db.update(migrationJobs).set({ status: "failed", updatedAt: Date.now() } as any).where(eq(migrationJobs.id, input.jobId));
      await db.delete(migrationRollbackLog).where(eq(migrationRollbackLog.jobId, input.jobId));
      return { success: true, deletedContacts, deletedCompanies, deletedDeals };
    }),

});

// ─── Async Migration Runner ───────────────────────────────────────────────────
// Runs in the background after the job is created. The client polls getJob.

async function runMigrationAsync(
  jobId: number,
  tenantCompanyId: number,
  userId: number,
  input: {
    sourceSystem: string;
    apiKey?: string;
    instanceUrl?: string;
    csvData?: string;
    csvType?: string;
    sinceDate?: number;      // UTC ms — incremental sync filter
    isIncrementalSync?: boolean;
  },
  profile: typeof COMPETITOR_PROFILES[string]
) {
  const db = await getDb();
  if (!db) return;

  await updateMigrationProgress(jobId, { status: "analyzing" });

  // ── Step 1: Determine source fields ──────────────────────────────────────
  let sourceFields = { ...profile.standardFields };
  let csvRows: Record<string, string>[] = [];

  if (input.sourceSystem === "spreadsheet" && input.csvData) {
    const parsed = parseCSV(input.csvData);
    csvRows = parsed.rows;
    const csvType = (input.csvType || "contacts") as "contacts" | "companies" | "deals";
    sourceFields = { contacts: [], companies: [], deals: [] };
    sourceFields[csvType] = parsed.headers;
  }

  // ── Step 2: AI field mapping ──────────────────────────────────────────────
  await updateMigrationProgress(jobId, { status: "mapping" });

  const fieldMapping = await aiMapFields(input.sourceSystem, sourceFields, tenantCompanyId);

  // Save field mapping to job
  await db.update(migrationJobs)
    .set({ fieldMapping: fieldMapping.mapped, updatedAt: Date.now() } as any)
    .where(eq(migrationJobs.id, jobId));

  // ── Step 3: Create custom field definitions for unmapped fields ───────────
  let customFieldsCreated = 0;
  for (const cf of fieldMapping.customFields) {
    await db.insert(customFieldDefs).values({
      tenantCompanyId,
      objectType: cf.objectType,
      fieldKey: cf.sourceField.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      label: cf.suggestedLabel,
      fieldType: cf.suggestedType,
      sourceSystem: input.sourceSystem,
      sourceFieldId: cf.sourceField,
      displayOrder: customFieldsCreated,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    customFieldsCreated++;
  }

  await updateMigrationProgress(jobId, {
    status: "importing",
    customFieldsCreated,
  });

  // ── Step 4: Import data ───────────────────────────────────────────────────
  let contactsImported = 0;
  let companiesImported = 0;
  let dealsImported = 0;
  let activitiesImported = 0;
  let duplicatesMerged = 0;
  const errors: { record: string; error: string }[] = [];

  if (input.sourceSystem === "spreadsheet" && csvRows.length > 0) {
    // CSV import
    const csvType = input.csvType || "contacts";
    await updateMigrationProgress(jobId, { totalRecords: csvRows.length });

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      try {
        if (csvType === "contacts") {
          const mapped = applyMapping(row, fieldMapping.mapped);
          await importContact(db, tenantCompanyId, userId, mapped, input.sourceSystem, String(i));
          contactsImported++;
        } else if (csvType === "companies") {
          const mapped = applyMapping(row, fieldMapping.mapped);
          await importCompany(db, tenantCompanyId, userId, mapped, input.sourceSystem, String(i));
          companiesImported++;
        } else if (csvType === "deals") {
          const mapped = applyMapping(row, fieldMapping.mapped);
          await importDeal(db, tenantCompanyId, userId, mapped, input.sourceSystem, String(i));
          dealsImported++;
        }
        if (i % 50 === 0) {
          await updateMigrationProgress(jobId, {
            importedRecords: contactsImported + companiesImported + dealsImported,
            contactsImported, companiesImported, dealsImported,
          });
        }
      } catch (err) {
        errors.push({ record: `row_${i}`, error: String(err) });
      }
    }
  } else {
    // ── Live API import ────────────────────────────────────────────────────
    await updateMigrationProgress(jobId, { status: "fetching" });

    let liveData: MigrationData = { contacts: [], companies: [], deals: [], activities: [] };

    const progressCb = async (fetched: { contacts?: number; companies?: number; deals?: number; activities?: number }) => {
      const total = (fetched.contacts || 0) + (fetched.companies || 0) + (fetched.deals || 0) + (fetched.activities || 0);
      await updateMigrationProgress(jobId, {
        totalRecords: total,
        importedRecords: contactsImported + companiesImported + dealsImported + activitiesImported,
      });
    };

    try {
      // sinceDate: if set, fetchers should only return records modified after this timestamp
      const sinceDate = input.sinceDate ? new Date(input.sinceDate) : undefined;

      switch (input.sourceSystem) {
        case "hubspot":
          if (!input.apiKey) throw new Error("HubSpot API key is required");
          liveData = await fetchHubSpot(input.apiKey, progressCb, sinceDate);
          break;
        case "salesforce":
          if (!input.apiKey || !input.instanceUrl) throw new Error("Salesforce access token and instance URL are required");
          liveData = await fetchSalesforce(input.apiKey, input.instanceUrl, progressCb, sinceDate);
          break;
        case "pipedrive":
          if (!input.apiKey) throw new Error("Pipedrive API key is required");
          liveData = await fetchPipedrive(input.apiKey, progressCb, sinceDate);
          break;
        case "zoho":
          if (!input.apiKey) throw new Error("Zoho access token is required");
          liveData = await fetchZoho(input.apiKey, progressCb, sinceDate);
          break;
        case "gohighlevel":
          if (!input.apiKey) throw new Error("GoHighLevel API key is required");
          liveData = await fetchGoHighLevel(input.apiKey, progressCb, sinceDate);
          break;
        case "close":
          if (!input.apiKey) throw new Error("Close CRM API key is required");
          liveData = await fetchClose(input.apiKey, progressCb, sinceDate);
          break;
        case "apollo":
          if (!input.apiKey) throw new Error("Apollo.io API key is required");
          liveData = await fetchApollo(input.apiKey, progressCb, sinceDate);
          break;
        case "freshsales":
          if (!input.apiKey) throw new Error("Freshsales API key and subdomain are required");
          liveData = await fetchFreshsales(input.apiKey, progressCb, sinceDate);
          break;
        case "activecampaign":
          if (!input.apiKey) throw new Error("ActiveCampaign API key and URL are required");
          liveData = await fetchActiveCampaign(input.apiKey, progressCb, sinceDate);
          break;
        case "keap":
          if (!input.apiKey) throw new Error("Keap API key is required");
          liveData = await fetchKeap(input.apiKey, progressCb, sinceDate);
          break;
        case "copper":
          if (!input.apiKey) throw new Error("Copper API key and email are required");
          liveData = await fetchCopper(input.apiKey, progressCb, sinceDate);
          break;
        case "nutshell":
          if (!input.apiKey) throw new Error("Nutshell email and API key are required");
          liveData = await fetchNutshell(input.apiKey, progressCb, sinceDate);
          break;
        case "insightly":
          if (!input.apiKey) throw new Error("Insightly API key is required");
          liveData = await fetchInsightly(input.apiKey, progressCb, sinceDate);
          break;
        case "sugarcrm":
          if (!input.apiKey) throw new Error("SugarCRM credentials are required");
          liveData = await fetchSugarCRM(input.apiKey, progressCb, sinceDate);
          break;
        case "streak":
          if (!input.apiKey) throw new Error("Streak API key is required");
          liveData = await fetchStreak(input.apiKey, progressCb, sinceDate);
          break;
        case "nimble":
          if (!input.apiKey) throw new Error("Nimble API token is required");
          liveData = await fetchNimble(input.apiKey, progressCb, sinceDate);
          break;
        case "monday":
          if (!input.apiKey) throw new Error("Monday.com API token is required");
          liveData = await fetchMonday(input.apiKey, progressCb, sinceDate);
          break;
        case "constantcontact":
          if (!input.apiKey) throw new Error("Constant Contact access token is required");
          liveData = await fetchConstantContact(input.apiKey, progressCb, sinceDate);
          break;
        default:
          throw new Error(`Live API migration not supported for: ${input.sourceSystem}`);
      }
    } catch (fetchErr) {
      errors.push({ record: "api_fetch", error: String(fetchErr) });
      await updateMigrationProgress(jobId, { status: "failed", errors });
      return;
    }

    const totalRecords = liveData.contacts.length + liveData.companies.length + liveData.deals.length + liveData.activities.length;
    await updateMigrationProgress(jobId, { status: "importing", totalRecords });

    // Import companies first (contacts/deals may reference them)
    for (const co of liveData.companies) {
      try {
        await importNormalizedCompany(db, tenantCompanyId, userId, co);
        companiesImported++;
        if (companiesImported % 50 === 0) {
          await updateMigrationProgress(jobId, {
            importedRecords: contactsImported + companiesImported + dealsImported + activitiesImported,
            companiesImported,
          });
        }
      } catch (err) {
        errors.push({ record: `company_${co.sourceId}`, error: String(err) });
      }
    }

    // Import contacts
    for (const ct of liveData.contacts) {
      try {
        await importNormalizedContact(db, tenantCompanyId, userId, ct);
        contactsImported++;
        if (contactsImported % 50 === 0) {
          await updateMigrationProgress(jobId, {
            importedRecords: contactsImported + companiesImported + dealsImported + activitiesImported,
            contactsImported,
          });
        }
      } catch (err) {
        errors.push({ record: `contact_${ct.sourceId}`, error: String(err) });
      }
    }

    // Import deals
    for (const dl of liveData.deals) {
      try {
        await importNormalizedDeal(db, tenantCompanyId, userId, dl, input.sourceSystem);
        dealsImported++;
        if (dealsImported % 50 === 0) {
          await updateMigrationProgress(jobId, {
            importedRecords: contactsImported + companiesImported + dealsImported + activitiesImported,
            dealsImported,
          });
        }
      } catch (err) {
        errors.push({ record: `deal_${dl.sourceId}`, error: String(err) });
      }
    }

    // Import activities
    for (const act of liveData.activities) {
      try {
        await importNormalizedActivity(db, tenantCompanyId, userId, act);
        activitiesImported++;
      } catch (err) {
        errors.push({ record: `activity_${act.sourceId}`, error: String(err) });
      }
    }
  }

  // ── Step 5: Apply the matching skin ──────────────────────────────────────
  const skinKey = profile.skinKey as "axiom"|"hubspot"|"salesforce"|"pipedrive"|"zoho"|"gohighlevel"|"close"|"apollo"|"freshsales"|"activecampaign"|"keap"|"copper"|"nutshell"|"insightly"|"sugarcrm"|"streak"|"nimble"|"monday"|"constantcontact";
  const existingSkin = await db.select({ id: skinPreferences.id })
    .from(skinPreferences)
    .where(eq(skinPreferences.tenantCompanyId, tenantCompanyId))
    .limit(1);

  if (existingSkin.length > 0) {
    await db.update(skinPreferences)
      .set({ skin: skinKey, migratedFrom: input.sourceSystem as any, updatedAt: Date.now() })
      .where(eq(skinPreferences.tenantCompanyId, tenantCompanyId));
  } else {
    await db.insert(skinPreferences).values({
      tenantCompanyId,
      skin: skinKey,
      migratedFrom: input.sourceSystem as any,
      graduatedToAxiom: false,
      updatedAt: Date.now(),
    });
  }

  // ── Step 6: Generate cheat sheet ─────────────────────────────────────────
  const cheatSheet = await generateCheatSheet(
    input.sourceSystem,
    fieldMapping,
    { contacts: contactsImported, companies: companiesImported, deals: dealsImported, activities: activitiesImported }
  );

   // ── Step 7: Mark complete ───────────────────────────────────────────────
  const completedAt = Date.now();
  await db.update(migrationJobs).set({
    status: "completed",
    importedRecords: contactsImported + companiesImported + dealsImported + activitiesImported,
    totalRecords: contactsImported + companiesImported + dealsImported + activitiesImported,
    contactsImported,
    companiesImported,
    dealsImported,
    activitiesImported,
    customFieldsCreated,
    duplicatesMerged,
    completedAt,
    lastSyncedAt: completedAt,  // Track when we last synced for incremental sync
    updatedAt: completedAt,
    importLog: [{ timestamp: completedAt, message: cheatSheet, level: "info" }] as any,
    errorDetails: errors as any,
  } as any).where(eq(migrationJobs.id, jobId));;
}

// ─── Helpers: Import normalized records from live API fetchers ───────────────

async function importNormalizedContact(
  db: any, tenantCompanyId: number, userId: number, ct: NormalizedContact
) {
  await db.insert(contacts).values({
    tenantCompanyId,
    firstName: ct.firstName || "Unknown",
    lastName: ct.lastName || "",
    email: ct.email || null,
    phone: ct.phone || null,
    jobTitle: ct.jobTitle || null,
    address: ct.address || null,
    city: ct.city || null,
    state: ct.state || null,
    zip: ct.zip || null,
    country: ct.country || null,
    website: ct.website || null,
    notes: ct.notes || null,
    linkedinUrl: ct.linkedinUrl || null,
    ownerId: userId,
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as any);
}

async function importNormalizedCompany(
  db: any, tenantCompanyId: number, userId: number, co: NormalizedCompany
) {
  await db.insert(companies).values({
    tenantCompanyId,
    name: co.name || "Unknown Company",
    domain: co.domain || null,
    phone: co.phone || null,
    industry: co.industry || null,
    address: co.address || null,
    city: co.city || null,
    state: co.state || null,
    zip: co.zip || null,
    country: co.country || null,
    website: co.website || null,
    description: co.description || null,
    ownerId: userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as any);
}

async function importNormalizedDeal(
  db: any, tenantCompanyId: number, userId: number, dl: NormalizedDeal, sourceSystem: string
) {
  await db.insert(deals).values({
    tenantCompanyId,
    title: dl.title || "Imported Deal",
    value: dl.value || null,
    stage: normalizeStage(sourceSystem, dl.stage || ""),
    ownerId: userId,
    description: dl.description || null,
    closeDate: dl.closeDate || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as any);
}

async function importNormalizedActivity(
  db: any, tenantCompanyId: number, userId: number, act: NormalizedActivity
) {
  await db.insert(activityHistory).values({
    tenantCompanyId,
    userId,
    objectType: "contact",
    recordId: 0,
    activityType: act.type || "note",
    subject: act.subject || null,
    body: act.body || null,
    occurredAt: act.occurredAt || Date.now(),
    createdAt: Date.now(),
  } as any);
}

// ─── Helper: Apply field mapping to a row ────────────────────────────────────
function applyMapping(row: Record<string, string>, mapping: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [sourceField, value] of Object.entries(row)) {
    const axiomField = mapping[sourceField];
    if (axiomField) result[axiomField] = value;
    else result[`_custom_${sourceField}`] = value;
  }
  return result;
}

// ─── Helper: Import a contact ─────────────────────────────────────────────────
// ─── Helper: parse a date string or timestamp to epoch ms ────────────────────
function parseDateToMs(val: string | undefined | null): number | null {
  if (!val || val.trim() === "") return null;
  // Already a number (epoch ms or seconds)
  const num = Number(val);
  if (!isNaN(num) && num > 0) {
    // If it looks like epoch seconds (< year 3000 in seconds), convert to ms
    return num < 9999999999 ? num * 1000 : num;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.getTime();
}

async function importContact(
  db: any, tenantCompanyId: number, userId: number,
  data: Record<string, string>, sourceSystem: string, sourceId: string
) {
  await db.insert(contacts).values({
    tenantCompanyId,
    firstName: data.firstName || data.name?.split(" ")[0] || "Unknown",
    lastName: data.lastName || data.name?.split(" ").slice(1).join(" ") || "",
    email: data.email || null,
    directPhone: data.directPhone || data.phone || null,
    mobilePhone: data.mobilePhone || null,
    jobTitle: data.jobTitle || null,
    streetAddress: data.streetAddress || data.address || null,
    city: data.city || null,
    stateRegion: data.stateRegion || data.state || null,
    postalCode: data.postalCode || data.zip || null,
    country: data.country || null,
    websiteUrl: data.websiteUrl || data.website || null,
    linkedinUrl: data.linkedinUrl || null,
    twitterHandle: data.twitterHandle || null,
    notes: data.notes || null,
    lifecycleStage: data.lifecycleStage || null,
    leadStatus: data.leadStatus || null,
    leadSource: data.leadSource || null,
    leadScore: data.leadScore ? parseInt(data.leadScore) || null : null,
    companyName: data.companyName || data.company || null,
    ownerId: userId,
    status: "active",
    // ── Activity & Date Fields ──────────────────────────────────────────────
    lastLoggedOutgoingEmailDate: parseDateToMs(data.lastLoggedOutgoingEmailDate),
    lastModifiedDate: parseDateToMs(data.lastModifiedDate),
    closeDate: parseDateToMs(data.closeDate),
    firstContactCreateDate: parseDateToMs(data.firstContactCreateDate),
    firstDealCreatedDate: parseDateToMs(data.firstDealCreatedDate),
    lastActivityDate: parseDateToMs(data.lastActivityDate),
    lastBookedMeetingDate: parseDateToMs(data.lastBookedMeetingDate),
    nextActivityDate: parseDateToMs(data.nextActivityDate),
    ownerAssignedDate: parseDateToMs(data.ownerAssignedDate),
    firstConversionDate: parseDateToMs(data.firstConversionDate),
    recentConversionDate: parseDateToMs(data.recentConversionDate),
    dateOfLastLeadStatusChange: parseDateToMs(data.dateOfLastLeadStatusChange),
    createdAt: parseDateToMs(data.firstContactCreateDate) || Date.now(),
    updatedAt: Date.now(),
  } as any);
}

// ─── Helper: Import a company ─────────────────────────────────────────────────
async function importCompany(
  db: any, tenantCompanyId: number, userId: number,
  data: Record<string, string>, sourceSystem: string, sourceId: string
) {
  await db.insert(companies).values({
    tenantCompanyId,
    name: data.name || data.companyName || "Unknown Company",
    domain: data.domain || data.website || null,
    phone: data.phone || null,
    industry: data.industry || null,
    streetAddress: data.streetAddress || data.address || null,
    city: data.city || null,
    stateRegion: data.stateRegion || data.state || null,
    postalCode: data.postalCode || data.zip || null,
    country: data.country || null,
    website: data.website || null,
    description: data.description || null,
    numberOfEmployees: data.numberOfEmployees ? parseInt(data.numberOfEmployees) || null : null,
    annualRevenue: data.annualRevenue ? parseFloat(data.annualRevenue.replace(/[^0-9.]/g, "")) || null : null,
    linkedinUrl: data.linkedinUrl || null,
    twitterHandle: data.twitterHandle || null,
    facebookPage: data.facebookPage || null,
    ownerId: userId,
    // ── Activity & Date Fields ──────────────────────────────────────────────
    lastModifiedDate: parseDateToMs(data.lastModifiedDate),
    firstContactCreateDate: parseDateToMs(data.firstContactCreateDate),
    lastActivityDate: parseDateToMs(data.lastActivityDate),
    lastBookedMeetingDate: parseDateToMs(data.lastBookedMeetingDate),
    nextActivityDate: parseDateToMs(data.nextActivityDate),
    ownerAssignedDate: parseDateToMs(data.ownerAssignedDate),
    dateOfLastLeadStatusChange: parseDateToMs(data.dateOfLastLeadStatusChange),
    createdAt: parseDateToMs(data.firstContactCreateDate) || Date.now(),
    updatedAt: Date.now(),
  } as any);
}

// ─── Helper: Import a deal ────────────────────────────────────────────────────
async function importDeal(
  db: any, tenantCompanyId: number, userId: number,
  data: Record<string, string>, sourceSystem: string, sourceId: string
) {
  await db.insert(deals).values({
    tenantCompanyId,
    title: data.title || data.dealname || "Imported Deal",
    value: data.value ? parseFloat(data.value.replace(/[^0-9.]/g, "")) : null,
    stage: normalizeStage(sourceSystem, data.stage || ""),
    ownerId: userId,
    description: data.description || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as any);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
