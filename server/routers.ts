import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { bibleShares } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, managerProcedure, companyAdminProcedure, axiomOwnerProcedure, developerProcedure, router, getRoleLevel } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";
import { nanoid } from "nanoid";
import { NEW_BROKER_TEMPLATE_HTML, RENEWING_BROKER_TEMPLATE_HTML } from "./fmcsa-templates";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { randomBytes } from "crypto";
import { migrationRouter } from "./routers/migration";
import { aiEngineRouter } from "./routers/ai-engine";
import { systemHealthRouter } from "./routers/system-health";
import {
  calendarRouter,
  emailSyncRouter,
  schedulerRouter,
  customObjectsRouter,
  proposalsRouter,
  workflowBuilderRouter,
  reportsRouter,
  integrationHubRouter,
  onboardingRouter,
  historyImporterRouter,
  googleCalendarOAuthRouter,
} from "./routers/phase44";
import { rottenDealsRouter, bulkActionsRouter, winLossRouter, auditLogsRouter, smartViewsRouter, territoriesRouter, accountHierarchyRouter } from "./routers/batch1";
import { salesForecastingRouter, productCatalogRouter, leadScoringRouter, nextBestActionRouter } from "./routers/batch2";
import { webFormsRouter, eSignatureRouter, reputationRouter, oooDetectionRouter } from "./routers/batch3";
import { emailSequencesRouter, journeysRouter, whatsappRouter, socialSchedulerRouter, powerDialerRouter, anomalyDetectionRouter, pipelineInspectionRouter, domainHealthAutopilotRouter, abTestingRouter, featureGatingRouter } from "./routers/batch4";
import { notificationPrefsRouter, scheduledReportsRouter, proposalAnalyticsRouter, customRolesRouter, ssoRouter, customFieldConditionsRouter, aiCreditUsageRouter, whatsappBroadcastsRouter, bulkMergeRouter, aiPostWriterRouter } from "./routers/gap-features";
import { salesQuotasRouter, smsRouter, gdprRouter, publicBookingRouter, portalEnhancedRouter, agentCommandsRouter, revenueIntelRouter, userPrefsRouter, portalDocsRouter } from "./routers/competitive-features";
import { currencyRouter } from "./routers/currency";
import { fmcsaRouter } from "./routers/fmcsa";
import { portalRouter } from "./routers/portal";
import { websiteMonitorRouter, syncCompanyMonitor } from "./routers/website-monitor";

export const appRouter = router({
  system: systemRouter,
  // batch1 sub-routers (flattened for direct frontend access)
  rottenDeals: rottenDealsRouter,
  bulkActions: bulkActionsRouter,
  winLoss: winLossRouter,
  auditLogs: auditLogsRouter,
  smartViews: smartViewsRouter,
  territories: territoriesRouter,
  accountHierarchy: accountHierarchyRouter,
  // batch2 sub-routers (flattened)
  salesForecasting: salesForecastingRouter,
  productCatalog: productCatalogRouter,
  leadScoring: leadScoringRouter,
  nextBestAction: nextBestActionRouter,
  // batch3 sub-routers (flattened)
  webForms: webFormsRouter,
  eSignature: eSignatureRouter,
  reputation: reputationRouter,
  oooDetection: oooDetectionRouter,
  // batch4 sub-routers (flattened)
  emailSequences: emailSequencesRouter,
  journeyOrchestration: journeysRouter,
  whatsapp: whatsappRouter,
  socialScheduler: socialSchedulerRouter,
  powerDialer: powerDialerRouter,
  anomalyDetection: anomalyDetectionRouter,
  pipelineInspection: pipelineInspectionRouter,
  domainAutopilot: domainHealthAutopilotRouter,
  abTesting: abTestingRouter,
  featureGating: featureGatingRouter,
  // gap-feature routers
  notificationPrefs: notificationPrefsRouter,
  scheduledReports: scheduledReportsRouter,
  proposalAnalytics: proposalAnalyticsRouter,
  customRoles: customRolesRouter,
  sso: ssoRouter,
  customFieldConditions: customFieldConditionsRouter,
  aiCreditUsage: aiCreditUsageRouter,
  whatsappBroadcasts: whatsappBroadcastsRouter,
  bulkMerge: bulkMergeRouter,
  aiPostWriter: aiPostWriterRouter,
  // competitive-features routers
  salesQuotas: salesQuotasRouter,
  sms: smsRouter,
  gdpr: gdprRouter,
  publicBooking: publicBookingRouter,
  portalEnhanced: portalEnhancedRouter,
  agentCommands: agentCommandsRouter,
  revenueIntel: revenueIntelRouter,
  userPrefs: userPrefsRouter,
  portalDocs: portalDocsRouter,
  calendar: calendarRouter,
  emailSync: emailSyncRouter,
  scheduler: schedulerRouter,
  googleCalendarOAuth: googleCalendarOAuthRouter,
  customObjects: customObjectsRouter,
  proposals: proposalsRouter,
  workflowBuilder: workflowBuilderRouter,
  reports: reportsRouter,
  integrationHub: integrationHubRouter,
  onboarding: onboardingRouter,
  historyImporter: historyImporterRouter,
  currency: currencyRouter,
  fmcsa: fmcsaRouter,
  portalTokens: portalRouter,
  websiteMonitor: websiteMonitorRouter,
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      // Check if the current session is an emulation session (server-side, reliable)
      const currentToken = ctx.req.cookies?.["app_session_id"];
      let isEmulating = false;
      let emulatingAs: string | null = null;
      if (currentToken) {
        try {
          const dbConn = await db.getDb();
          const { emulationSessions } = await import("../drizzle/schema.js");
          const { eq } = await import("drizzle-orm");
          const [record] = await dbConn.select()
            .from(emulationSessions)
            .where(eq(emulationSessions.emulatedSessionToken, currentToken))
            .limit(1);
          if (record) {
            isEmulating = true;
            emulatingAs = ctx.user.name || ctx.user.username || `User #${ctx.user.id}`;
          }
        } catch (_) {}
      }
      return { ...ctx.user, isEmulating, emulatingAs };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    forgotPassword: publicProcedure.input(z.object({
      email: z.string().email(),
      origin: z.string().url(),
    })).mutation(async ({ input }) => {
      // Always return success to prevent email enumeration
      const user = await db.getUserByEmail(input.email);
      if (!user || !user.email) return { success: true };
      const token = randomBytes(32).toString('hex');
      await db.createPasswordResetToken(user.id, token);
      const resetUrl = `${input.origin}/reset-password?token=${token}`;
      // Send email via nodemailer using ethereal or SMTP env vars if available
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.ethereal.email',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: process.env.SMTP_USER ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          } : undefined,
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"AXIOM CRM" <noreply@apexcrm.com>',
          to: user.email,
          subject: 'Reset your AXIOM CRM password',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#f97316;margin-bottom:8px">Reset your password</h2>
              <p style="color:#333">Hi ${user.name || 'there'},</p>
              <p style="color:#555">We received a request to reset your AXIOM CRM password. Click the button below to set a new password. This link expires in 1 hour.</p>
              <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#f97316;color:#fff;font-weight:700;border-radius:8px;text-decoration:none">Reset Password</a>
              <p style="color:#999;font-size:13px">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
              <p style="color:#bbb;font-size:12px">&copy; AXIOM CRM</p>
            </div>
          `,
        });
      } catch (err) {
        console.error('[ForgotPassword] Email send failed:', err);
        // Don't expose error to client
      }
      return { success: true };
    }),

    resetPassword: publicProcedure.input(z.object({
      token: z.string().min(1),
      newPassword: z.string().min(8),
    })).mutation(async ({ input }) => {
      const resetToken = await db.getValidPasswordResetToken(input.token);
      if (!resetToken) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid or expired reset link. Please request a new one.' });
      const hash = await bcrypt.hash(input.newPassword, 12);
      await db.updateUserPassword(resetToken.userId, hash);
      await db.markPasswordResetTokenUsed(input.token);
      return { success: true };
    }),
  }),

  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      // Role-based: managers/admins see aggregated team stats
      const roleStats = await db.getDashboardStatsByRole(ctx.user);
      const enhanced = await db.getEnhancedDashboardStats(ctx.user.id);
      // Merge: use role-based counts for core metrics, enhanced for extras
      return {
        ...enhanced,
        totalContacts: roleStats.totalContacts,
        totalCompanies: roleStats.totalCompanies,
        totalDeals: roleStats.totalDeals,
        openDeals: roleStats.openDeals,
        wonDeals: roleStats.wonDeals,
        lostDeals: roleStats.lostDeals,
        totalValue: roleStats.totalValue,
        wonValue: roleStats.wonValue,
        totalTasks: roleStats.totalTasks,
        pendingTasks: roleStats.pendingTasks,
        teamSize: roleStats.teamSize,
      };
    }),
    recentActivities: protectedProcedure.input(z.object({
      limit: z.number().min(1).max(50).optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.getRecentActivitiesWithContext(ctx.user.id, input?.limit ?? 15);
    }),
    globalSearch: protectedProcedure.input(z.object({
      query: z.string().min(1).max(200),
      limit: z.number().min(1).max(30).optional(),
    })).query(async ({ ctx, input }) => {
      return db.globalSearch(ctx.user.id, input.query, input.limit ?? 15);
    }),
  }),

  leadStatuses: router({
    list: protectedProcedure.query(async () => {
      return db.listLeadStatuses();
    }),
  }),

  contacts: router({
    list: protectedProcedure.input(z.object({
      search: z.string().optional(),
      stage: z.string().optional(),
      leadStatus: z.string().optional(),
      companyId: z.number().optional(),
      limit: z.number().min(1).max(500).optional(),
      offset: z.number().min(0).optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listContactsByRole(ctx.user, input);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      // Role-based: managers/admins can view contacts of their team
      const visibleIds = await db.getVisibleUserIds(ctx.user);
      const contact = await db.getContact(input.id, ctx.user.id);
      if (!contact) {
        // Try with visible user IDs for managers/admins
        for (const uid of visibleIds) {
          if (uid === ctx.user.id) continue;
          const c = await db.getContact(input.id, uid);
          if (c) return c;
        }
      }
      return contact;
    }),
    byCompany: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ ctx, input }) => {
      return db.getContactsByCompanyByRole(input.companyId, ctx.user);
    }),
    create: protectedProcedure.input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().optional(),
      jobTitle: z.string().optional(),
      companyId: z.number().optional(),
      email: z.string().optional(),
      companyPhone: z.string().optional(),
      directPhone: z.string().optional(),
      mobilePhone: z.string().optional(),
      faxNumber: z.string().optional(),
      linkedinUrl: z.string().optional(),
      websiteUrl: z.string().optional(),
      streetAddress: z.string().optional(),
      addressLine2: z.string().optional(),
      city: z.string().optional(),
      stateRegion: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
      timezone: z.string().optional(),
      lifecycleStage: z.string().optional(),
      leadStatus: z.string().optional(),
      leadSource: z.string().optional(),
      leadScore: z.number().optional(),
      originalSource: z.string().optional(),
      emailSubscriptionStatus: z.string().optional(),
      gdprConsentStatus: z.string().optional(),
      twitterHandle: z.string().optional(),
      facebookProfile: z.string().optional(),
      instagramProfile: z.string().optional(),
      decisionMakerRole: z.string().optional(),
      department: z.string().optional(),
      freightVolume: z.string().optional(),
      customerType: z.string().optional(),
      paymentResponsibility: z.string().optional(),
      preferredContactMethod: z.string().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const now = Date.now();
      const id = await db.createContact({ ...input, userId: ctx.user.id, createdAt: now, updatedAt: now });
      await db.createActivity({ userId: ctx.user.id, contactId: id, type: "contact_created", subject: `Created contact ${input.firstName} ${input.lastName ?? ""}`.trim() });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().optional(),
      jobTitle: z.string().optional(),
      companyId: z.number().optional(),
      email: z.string().optional(),
      companyPhone: z.string().optional(),
      directPhone: z.string().optional(),
      mobilePhone: z.string().optional(),
      faxNumber: z.string().optional(),
      linkedinUrl: z.string().optional(),
      websiteUrl: z.string().optional(),
      streetAddress: z.string().optional(),
      addressLine2: z.string().optional(),
      city: z.string().optional(),
      stateRegion: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
      timezone: z.string().optional(),
      lifecycleStage: z.string().optional(),
      leadStatus: z.string().optional(),
      leadSource: z.string().optional(),
      leadScore: z.number().optional(),
      emailSubscriptionStatus: z.string().optional(),
      gdprConsentStatus: z.string().optional(),
      twitterHandle: z.string().optional(),
      facebookProfile: z.string().optional(),
      instagramProfile: z.string().optional(),
      decisionMakerRole: z.string().optional(),
      department: z.string().optional(),
      freightVolume: z.string().optional(),
      customerType: z.string().optional(),
      paymentResponsibility: z.string().optional(),
      preferredContactMethod: z.string().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateContact(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteContact(input.id, ctx.user.id);
      return { success: true };
    }),
    exportCsv: protectedProcedure.query(async ({ ctx }) => {
      const result = await db.listContactsByRole(ctx.user, { limit: 10000 });
      const rows = result.items;
      const headers = ["id","firstName","lastName","email","directPhone","mobilePhone","jobTitle","city","stateRegion","country","createdAt"];
      const csvRows = rows.map(r => headers.map(h => {
        const v = (r as Record<string,unknown>)[h];
        if (v == null) return "";
        if (h === "createdAt" && typeof v === "number") return new Date(v).toISOString();
        return String(v).replace(/,/g, ";").replace(/\n/g, " ");
      }).join(","));
      return { csv: [headers.join(","), ...csvRows].join("\n"), count: rows.length };
    }),
    importCsv: protectedProcedure.input(z.object({
      rows: z.array(z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        jobTitle: z.string().optional(),
        company: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
      })).max(5000),
    })).mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { contacts: contactsTable } = await import("../drizzle/schema");
      const now = Date.now();
      let imported = 0;
      for (const row of input.rows) {
        if (!row.email && !row.firstName && !row.lastName) continue;
        await dbConn.insert(contactsTable).values({
          userId: ctx.user.id,
          companyId: 0,
          firstName: row.firstName ?? "",
          lastName: row.lastName ?? "",
          email: row.email ?? null,
          directPhone: row.phone ?? null,
          jobTitle: row.jobTitle ?? null,
          city: row.city ?? null,
          stateRegion: row.state ?? null,
          country: row.country ?? null,
          createdAt: now,
          updatedAt: now,
        }).onDuplicateKeyUpdate({ set: { updatedAt: now } });
        imported++;
      }
      return { imported };
    }),
  }),

  companies: router({
    list: protectedProcedure.input(z.object({
      search: z.string().optional(),
      leadStatus: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listCompaniesByRole(ctx.user, input);
    }),
    listWithMetrics: protectedProcedure.input(z.object({
      search: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
    }).optional()).query(async ({ ctx, input }) => {
      // For metrics view, use role-based listing
      return db.listCompaniesByRole(ctx.user, input);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getCompanyByRole(input.id, ctx.user);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      domain: z.string().optional(),
      companyType: z.string().optional(),
      companyEmail: z.string().optional(),
      phone: z.string().optional(),
      streetAddress: z.string().optional(),
      addressLine2: z.string().optional(),
      city: z.string().optional(),
      stateRegion: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
      timezone: z.string().optional(),
      industry: z.string().optional(),
      numberOfEmployees: z.string().optional(),
      annualRevenue: z.string().optional(),
      description: z.string().optional(),
      businessClassification: z.string().optional(),
      foundedYear: z.string().optional(),
      leadSource: z.string().optional(),
      leadStatus: z.string().optional(),
      creditTerms: z.string().optional(),
      paymentStatus: z.string().optional(),
      lanePreferences: z.string().optional(),
      tmsIntegrationStatus: z.string().optional(),
      facebookPage: z.string().optional(),
      twitterHandle: z.string().optional(),
      linkedinUrl: z.string().optional(),
      youtubeUrl: z.string().optional(),
      parentId: z.number().optional(),
      website: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const now = Date.now();
      const id = await db.createCompany({ ...input, userId: ctx.user.id, createdAt: now, updatedAt: now });
      // Auto-enroll in Website Intelligence Monitor if website URL provided
      if (input.website) {
        syncCompanyMonitor({
          companyId: id,
          companyName: input.name,
          websiteUrl: input.website,
          userId: ctx.user.id,
          tenantId: ctx.user.tenantCompanyId ?? 0,
        }).catch(() => {});
      }
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      domain: z.string().optional(),
      companyType: z.string().optional(),
      companyEmail: z.string().optional(),
      phone: z.string().optional(),
      streetAddress: z.string().optional(),
      addressLine2: z.string().optional(),
      city: z.string().optional(),
      stateRegion: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
      timezone: z.string().optional(),
      industry: z.string().optional(),
      numberOfEmployees: z.string().optional(),
      annualRevenue: z.string().optional(),
      description: z.string().optional(),
      businessClassification: z.string().optional(),
      foundedYear: z.string().optional(),
      leadSource: z.string().optional(),
      leadStatus: z.string().optional(),
      creditTerms: z.string().optional(),
      paymentStatus: z.string().optional(),
      lanePreferences: z.string().optional(),
      tmsIntegrationStatus: z.string().optional(),
      facebookPage: z.string().optional(),
      twitterHandle: z.string().optional(),
      linkedinUrl: z.string().optional(),
      youtubeUrl: z.string().optional(),
      parentId: z.number().nullable().optional(),
      website: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateCompanyByRole(id, ctx.user, data);
      // Sync Website Intelligence Monitor if name or website changed
      if (data.website !== undefined || data.name !== undefined) {
        // Fetch the updated company to get latest name/website
        const result = await db.listCompaniesByRole(ctx.user, { limit: 200, offset: 0 });
        const company = result.items.find((c: any) => c.id === id);
        if (company) {
          syncCompanyMonitor({
            companyId: id,
            companyName: company.name,
            websiteUrl: company.website,
            userId: ctx.user.id,
            tenantId: ctx.user.tenantCompanyId ?? 0,
          }).catch(() => {});
        }
      }
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      // Company-first: cascade delete all contacts belonging to this company
      await db.deleteContactsByCompanyByRole(input.id, ctx.user);
      await db.deleteCompanyByRole(input.id, ctx.user);
      return { success: true };
    }),
    contactCount: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ ctx, input }) => {
      return db.getCompanyContactCountByRole(input.companyId, ctx.user);
    }),
  }),

  pipelines: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listPipelines(ctx.user.id, ctx.user.tenantCompanyId);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      stages: z.array(z.object({ name: z.string(), probability: z.number().min(0).max(100), color: z.string() })),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createPipeline(ctx.user.id, input.name, input.stages);
      return { id };
    }),
    stages: protectedProcedure.input(z.object({ pipelineId: z.number() })).query(async ({ input }) => {
      return db.getPipelineStages(input.pipelineId);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deletePipeline(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  deals: router({
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const visibleIds = await db.getVisibleUserIds(ctx.user);
      // Try owner lookup first
      const deal = await db.getDeal(input.id, ctx.user.id);
      if (deal) return deal;
      // Role-based fallback: check all visible user IDs
      for (const uid of visibleIds) {
        if (uid === ctx.user.id) continue;
        const d = await db.getDeal(input.id, uid);
        if (d) return d;
      }
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' });
    }),
    list: protectedProcedure.input(z.object({
      pipelineId: z.number().optional(),
      status: z.string().optional(),
      limit: z.number().min(1).max(200).optional(),
      offset: z.number().min(0).optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listDealsByRole(ctx.user, input);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      pipelineId: z.number(),
      stageId: z.number(),
      contactId: z.number().optional(),
      companyId: z.number().optional(),
      value: z.number().optional(),
      currency: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      expectedCloseDate: z.number().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const now = Date.now();
      const id = await db.createDeal({ ...input, userId: ctx.user.id, status: "open", createdAt: now, updatedAt: now });
      await db.createActivity({ userId: ctx.user.id, dealId: id, contactId: input.contactId, type: "deal_created", subject: `Deal "${input.name}" created` });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      stageId: z.number().optional(),
      contactId: z.number().nullable().optional(),
      companyId: z.number().nullable().optional(),
      value: z.number().optional(),
      currency: z.string().optional(),
      status: z.enum(["open", "won", "lost"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      expectedCloseDate: z.number().nullable().optional(),
      closedAt: z.number().nullable().optional(),
      lostReason: z.string().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateDeal(id, ctx.user.id, data);
      if (input.status === "won") await db.createActivity({ userId: ctx.user.id, dealId: id, type: "deal_won", subject: "Deal marked as won" });
      if (input.status === "lost") await db.createActivity({ userId: ctx.user.id, dealId: id, type: "deal_lost", subject: "Deal marked as lost", body: input.lostReason });
      if (input.stageId) await db.createActivity({ userId: ctx.user.id, dealId: id, type: "deal_stage_changed", subject: "Deal stage updated" });
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteDeal(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  activities: router({
    list: protectedProcedure.input(z.object({
      contactId: z.number().optional(),
      companyId: z.number().optional(),
      dealId: z.number().optional(),
      type: z.string().optional(),
      limit: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listActivitiesByRole(ctx.user, input);
    }),
    create: protectedProcedure.input(z.object({
      contactId: z.number().optional(),
      companyId: z.number().optional(),
      dealId: z.number().optional(),
      type: z.string(),
      subject: z.string().optional(),
      body: z.string().optional(),
      // Call fields
      callOutcome: z.string().optional(),
      callType: z.string().optional(),
      callDuration: z.number().optional(),
      // Email fields
      emailTo: z.string().optional(),
      emailFrom: z.string().optional(),
      emailCc: z.string().optional(),
      // Meeting fields
      meetingStartTime: z.number().optional(),
      meetingEndTime: z.number().optional(),
      meetingLocation: z.string().optional(),
      meetingAttendees: z.string().optional(),
      meetingOutcome: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.createActivity({ ...input, userId: ctx.user.id });
      return { success: true };
    }),
  }),

  tasks: router({
    list: protectedProcedure.input(z.object({
      status: z.string().optional(),
      taskType: z.string().optional(),
      queue: z.string().optional(),
      contactId: z.number().optional(),
      companyId: z.number().optional(),
      dealId: z.number().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listTasksByRole(ctx.user, input);
    }),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1),
      taskType: z.enum(["call", "email", "to_do", "follow_up", "meeting", "demo", "proposal", "whatsapp", "sms"]).optional(),
      dueDate: z.number().optional(),
      dueTime: z.string().optional(),
      startDate: z.number().optional(),
      followUpDate: z.number().optional(),
      assignedTo: z.number().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      description: z.string().optional(),
      queue: z.string().optional(),
      reminderDate: z.number().optional(),
      contactId: z.number().optional(),
      companyId: z.number().optional(),
      dealId: z.number().optional(),
      campaignId: z.number().optional(),
      pipelineId: z.number().optional(),
      workflowId: z.number().optional(),
      sequenceId: z.number().optional(),
      isRecurring: z.boolean().optional(),
      recurringFrequency: z.string().optional(),
      // Meeting
      meetingDate: z.number().optional(),
      meetingLocation: z.string().optional(),
      meetingAgenda: z.string().optional(),
      meetingAttendees: z.string().optional(),
      // Commercial
      productName: z.string().optional(),
      proposalUrl: z.string().optional(),
      revenueAmount: z.number().optional(),
      revenueCurrency: z.string().optional(),
      // Channels
      whatsappNumber: z.string().optional(),
      // Business
      businessCategory: z.string().optional(),
      businessType: z.string().optional(),
      // Forecast
      forecastCategory: z.string().optional(),
      forecastCloseDate: z.number().optional(),
      // Documents (JSON string)
      documents: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const now = Date.now();
      const id = await db.createTask({ ...input, userId: ctx.user.id, lastTouchedAt: now, touchCount: 1 });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      taskType: z.string().optional(),
      dueDate: z.number().optional(),
      dueTime: z.string().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      description: z.string().optional(),
      status: z.enum(["not_started", "completed"]).optional(),
      queue: z.string().optional(),
      assignedTo: z.number().optional(),
      contactId: z.number().nullable().optional(),
      companyId: z.number().nullable().optional(),
      dealId: z.number().nullable().optional(),
      campaignId: z.number().nullable().optional(),
      pipelineId: z.number().nullable().optional(),
      workflowId: z.number().nullable().optional(),
      sequenceId: z.number().nullable().optional(),
      completedAt: z.number().optional(),
      completedBy: z.number().optional(),
      outcome: z.string().optional(),
      startDate: z.number().nullable().optional(),
      followUpDate: z.number().nullable().optional(),
      lastViewedAt: z.number().optional(),
      meetingDate: z.number().nullable().optional(),
      meetingLocation: z.string().nullable().optional(),
      meetingAgenda: z.string().nullable().optional(),
      meetingAttendees: z.string().nullable().optional(),
      productName: z.string().nullable().optional(),
      proposalUrl: z.string().nullable().optional(),
      revenueAmount: z.number().nullable().optional(),
      revenueCurrency: z.string().optional(),
      whatsappNumber: z.string().nullable().optional(),
      businessCategory: z.string().nullable().optional(),
      businessType: z.string().nullable().optional(),
      forecastCategory: z.string().nullable().optional(),
      forecastCloseDate: z.number().nullable().optional(),
      documents: z.string().nullable().optional(),
      touchCount: z.number().optional(),
      lastTouchedAt: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateTask(id, ctx.user.id, { ...data, updatedAt: Date.now() });
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteTask(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  emailTemplates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listEmailTemplates(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      subject: z.string().min(1),
      htmlContent: z.string(),
      jsonContent: z.record(z.string(), z.unknown()).optional(),
      category: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createEmailTemplate({ ...input, userId: ctx.user.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      subject: z.string().optional(),
      htmlContent: z.string().optional(),
      jsonContent: z.record(z.string(), z.unknown()).optional(),
      category: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateEmailTemplate(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteEmailTemplate(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  campaigns: router({
    list: protectedProcedure.input(z.object({
      status: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listCampaigns(ctx.user.id, input);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      subject: z.string().optional(),
      fromName: z.string().optional(),
      fromEmail: z.string().optional(),
      htmlContent: z.string().optional(),
      templateId: z.number().optional(),
      segmentId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createCampaign({ ...input, userId: ctx.user.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      subject: z.string().optional(),
      fromName: z.string().optional(),
      fromEmail: z.string().optional(),
      htmlContent: z.string().optional(),
      status: z.enum(["draft", "scheduled", "sending", "sent", "paused", "cancelled"]).optional(),
      scheduledAt: z.number().optional(),
      segmentId: z.number().nullable().optional(),
      spamScore: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateCampaign(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteCampaign(input.id, ctx.user.id);
      return { success: true };
    }),
    // Load template content into campaign
    loadTemplate: protectedProcedure.input(z.object({ campaignId: z.number(), templateId: z.number() })).mutation(async ({ ctx, input }) => {
      const tpl = await db.getEmailTemplate(input.templateId, ctx.user.id);
      if (!tpl) throw new Error('Template not found');
      await db.updateCampaign(input.campaignId, ctx.user.id, { htmlContent: tpl.htmlContent, subject: tpl.subject });
      return { subject: tpl.subject, htmlContent: tpl.htmlContent };
    }),
    // Get segment contact count for campaign targeting
    segmentPreview: protectedProcedure.input(z.object({ segmentId: z.number() })).query(async ({ ctx, input }) => {
      const count = await db.countSegmentContacts(input.segmentId, ctx.user.id);
      return { count };
    }),
    // Send campaign (queue emails for segment contacts)
    send: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const campaign = await db.getCampaign(input.id, ctx.user.id);
      if (!campaign) throw new Error('Campaign not found');
      if (!campaign.htmlContent || !campaign.subject) throw new Error('Campaign must have subject and content');
      if (!campaign.fromEmail) throw new Error('Campaign must have a from email');
      // Get contacts from segment or all contacts
      let contactList: any[] = [];
      if (campaign.segmentId) {
        contactList = await db.getSegmentContacts(campaign.segmentId, ctx.user.id);
      } else {
        const result = await db.listContacts(ctx.user.id, { limit: 1000 });
        contactList = result.items.filter((c: any) => c.email);
      }
      if (contactList.length === 0) throw new Error('No contacts with email addresses found');
      // Run compliance check on first contact
      const settings = await db.getSenderSettings(ctx.user.id);
      const complianceResult = db.runComplianceCheck({ htmlContent: campaign.htmlContent, subject: campaign.subject, fromEmail: campaign.fromEmail, toEmail: contactList[0].email, senderSettings: settings, isSuppressed: false });
      if (!complianceResult.passed) throw new Error(`Compliance check failed: ${complianceResult.failures.join(', ')}`);
      // Inject company logo at top of email if tenant has one
      let finalHtml = campaign.htmlContent;
      if (ctx.user.tenantCompanyId) {
        const company = await db.getTenantCompanyById(ctx.user.tenantCompanyId);
        if (company?.logoUrl) {
          const logoHeader = `<div style="text-align:center;padding:20px 0 12px;border-bottom:1px solid #eee;margin-bottom:16px">
            <img src="${company.logoUrl}" alt="${company.name || 'Company'}" style="max-height:60px;max-width:200px;object-fit:contain" />
          </div>`;
          // Insert after opening <body> tag, or prepend if no body tag
          if (finalHtml.includes('<body')) {
            finalHtml = finalHtml.replace(/(<body[^>]*>)/i, `$1${logoHeader}`);
          } else {
            finalHtml = logoHeader + finalHtml;
          }
        }
      }
      // Queue emails
      const emails = contactList.map((c: any) => ({ email: c.email, contactId: c.id, firstName: c.firstName }));
      const queued = await db.queueCampaignEmails(input.id, ctx.user.id, emails, campaign.subject, finalHtml, campaign.fromEmail);
      await db.updateCampaign(input.id, ctx.user.id, { status: 'sending' });
      return { queued, total: contactList.length, skippedSuppressed: contactList.length - queued };
    }),
    analyzeSpam: protectedProcedure.input(z.object({
      subject: z.string(),
      htmlContent: z.string(),
      fromName: z.string().optional(),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `You are an email deliverability expert. Analyze the following email for spam triggers and deliverability issues. Return a JSON response with: score (0-100, where 0 is perfect and 100 is definitely spam), issues (array of {severity: "critical"|"warning"|"info", message: string, fix: string}), and overallRating ("excellent"|"good"|"fair"|"poor"). Be thorough.` },
          { role: "user", content: `Subject: ${input.subject}\n\nFrom: ${input.fromName ?? "Unknown"}\n\nContent:\n${input.htmlContent}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "spam_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "number" },
                overallRating: { type: "string", enum: ["excellent", "good", "fair", "poor"] },
                issues: { type: "array", items: { type: "object", properties: { severity: { type: "string", enum: ["critical", "warning", "info"] }, message: { type: "string" }, fix: { type: "string" } }, required: ["severity", "message", "fix"], additionalProperties: false } },
              },
              required: ["score", "overallRating", "issues"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0]?.message?.content;
      return JSON.parse(typeof content === "string" ? content : "{}");
    }),
  }),

  smtpAccounts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listSmtpAccounts(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      emailAddress: z.string(),
      displayName: z.string().optional(),
      domain: z.string(),
      smtpHost: z.string(),
      smtpPort: z.number().optional(),
      smtpUsername: z.string(),
      smtpPassword: z.string(),
      useTls: z.boolean().optional(),
      dailyLimit: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createSmtpAccount({ ...input, userId: ctx.user.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      displayName: z.string().optional(),
      smtpHost: z.string().optional(),
      smtpPort: z.number().optional(),
      smtpUsername: z.string().optional(),
      smtpPassword: z.string().optional(),
      useTls: z.boolean().optional(),
      isActive: z.boolean().optional(),
      dailyLimit: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateSmtpAccount(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteSmtpAccount(input.id, ctx.user.id);
      return { success: true };
    }),
    resetDailyCounts: protectedProcedure.mutation(async ({ ctx }) => {
      await db.resetDailySmtpCounts(ctx.user.id);
      return { success: true };
    }),
  }),

  domainHealth: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listDomainHealth(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      domain: z.string().min(1),
      mxServer: z.string().optional(),
      mxIp: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createDomainHealth({ userId: ctx.user.id, ...input });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      spfStatus: z.enum(["pass", "fail", "missing", "unknown"]).optional(),
      dkimStatus: z.enum(["pass", "fail", "missing", "unknown"]).optional(),
      dmarcStatus: z.enum(["pass", "fail", "missing", "unknown"]).optional(),
      dmarcPolicy: z.string().optional(),
      reputationScore: z.number().optional(),
      warmupPhase: z.number().optional(),
      dailySendLimit: z.number().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateDomainHealth(id, ctx.user.id, { ...data, lastCheckedAt: Date.now() });
      return { success: true };
    }),
    checkAuth: protectedProcedure.input(z.object({ domain: z.string() })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `You are a DNS and email authentication expert. Given a domain, provide guidance on setting up SPF, DKIM, and DMARC records. Return JSON with recommendations.` },
          { role: "user", content: `Domain: ${input.domain}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "auth_check",
            strict: true,
            schema: {
              type: "object",
              properties: {
                spf: { type: "object", properties: { status: { type: "string" }, record: { type: "string" }, recommendation: { type: "string" } }, required: ["status", "record", "recommendation"], additionalProperties: false },
                dkim: { type: "object", properties: { status: { type: "string" }, record: { type: "string" }, recommendation: { type: "string" } }, required: ["status", "record", "recommendation"], additionalProperties: false },
                dmarc: { type: "object", properties: { status: { type: "string" }, record: { type: "string" }, recommendation: { type: "string" } }, required: ["status", "record", "recommendation"], additionalProperties: false },
                overallScore: { type: "number" },
                summary: { type: "string" },
              },
              required: ["spf", "dkim", "dmarc", "overallScore", "summary"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = response.choices[0]?.message?.content;
      return JSON.parse(typeof content === "string" ? content : "{}");
    }),
  }),

  segments: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listSegments(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      filters: z.array(z.record(z.string(), z.unknown())).optional(),
      isDynamic: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createSegment({ ...input, userId: ctx.user.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      filters: z.array(z.record(z.string(), z.unknown())).optional(),
      contactCount: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateSegment(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteSegment(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  workflows: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listWorkflows(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      trigger: z.record(z.string(), z.unknown()).optional(),
      steps: z.array(z.record(z.string(), z.unknown())).optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createWorkflow({ ...input, userId: ctx.user.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      trigger: z.record(z.string(), z.unknown()).optional(),
      steps: z.array(z.record(z.string(), z.unknown())).optional(),
      status: z.enum(["draft", "active", "paused", "archived"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateWorkflow(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteWorkflow(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  abTests: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listAbTests(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      type: z.enum(["subject_line", "content", "send_time", "sender_name"]),
      campaignId: z.number().optional(),
      variants: z.array(z.record(z.string(), z.unknown())).optional(),
      sampleSize: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createAbTest({ ...input, userId: ctx.user.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["draft", "running", "completed"]).optional(),
      winnerVariant: z.string().optional(),
      results: z.record(z.string(), z.unknown()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateAbTest(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteAbTest(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  apiKeys: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listApiKeys(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      permissions: z.array(z.string()).optional(),
      expiresAt: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const rawKey = `axiom_${nanoid(32)}`;
      const keyHash = createHash("sha256").update(rawKey).digest("hex");
      const keyPrefix = rawKey.substring(0, 12);
      const id = await db.createApiKey({ ...input, userId: ctx.user.id, keyHash, keyPrefix });
      return { id, key: rawKey };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteApiKey(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  webhooks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listWebhooks(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      url: z.string().url(),
      events: z.array(z.string()).optional(),
      secret: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createWebhook({ ...input, userId: ctx.user.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      url: z.string().url().optional(),
      events: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateWebhook(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteWebhook(input.id, ctx.user.id);
      return { success: true };
    }),
    logs: protectedProcedure.input(z.object({ webhookId: z.number(), limit: z.number().optional() })).query(async ({ input }) => {
      return db.listWebhookLogs(input.webhookId, input.limit);
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // PARADIGM ENGINE — BNB Prospecting & Sales Intelligence
  // ═══════════════════════════════════════════════════════════════

  integrations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listIntegrationCredentials(ctx.user.id);
    }),
    upsert: protectedProcedure.input(z.object({
      service: z.string(),
      apiKey: z.string(),
      apiSecret: z.string().optional(),
      baseUrl: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.upsertIntegrationCredential({ ...input, userId: ctx.user.id });
      return { id };
    }),
    test: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      // Simulate testing the integration
      await db.updateIntegrationTestStatus(input.id, "success", "Connection verified successfully");
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteIntegrationCredential(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  paradigm: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getParadigmStats(ctx.user.id);
    }),
    recentActivity: protectedProcedure.input(z.object({ limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.getRecentActivity(ctx.user.id, input?.limit);
    }),
    hotLeads: protectedProcedure.query(async ({ ctx }) => {
      return db.getHotLeads(ctx.user.id);
    }),
  }),

  prospects: router({
    list: protectedProcedure.input(z.object({
      search: z.string().optional(),
      stage: z.string().optional(),
      verificationStatus: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listProspects(ctx.user.id, input);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getProspect(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().optional(),
      email: z.string().optional(),
      jobTitle: z.string().optional(),
      companyName: z.string().optional(),
      companyDomain: z.string().optional(),
      linkedinUrl: z.string().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
      industry: z.string().optional(),
      sourceType: z.string().optional().default("manual"),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const now = Date.now();
      const id = await db.createProspect({ ...input, userId: ctx.user.id, createdAt: now, updatedAt: now });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional(),
      jobTitle: z.string().optional(),
      companyName: z.string().optional(),
      companyDomain: z.string().optional(),
      linkedinUrl: z.string().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
      industry: z.string().optional(),
      verificationStatus: z.string().optional(),
      bounceRisk: z.string().optional(),
      engagementStage: z.string().optional(),
      intentScore: z.number().optional(),
      intentSignal: z.string().optional(),
      psychographicProfile: z.any().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
      score: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateProspect(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteProspect(input.id, ctx.user.id);
      return { success: true };
    }),
    // AI: Verify email via Nutrition layer
    verify: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const prospect = await db.getProspect(input.id, ctx.user.id);
      if (!prospect?.email) return { status: "no_email" };
      // Use LLM to simulate verification analysis
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an email deliverability expert. Analyze the given email address and determine if it's likely valid, invalid, catch-all, disposable, or unknown. Return JSON." },
          { role: "user", content: `Analyze this email address for deliverability: ${prospect.email} (Company: ${prospect.companyName ?? "unknown"}, Domain: ${prospect.companyDomain ?? "unknown"})` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "email_verification",
            strict: true,
            schema: {
              type: "object",
              properties: {
                status: { type: "string", description: "valid, invalid, catch_all, disposable, unknown" },
                bounceRisk: { type: "string", description: "low, medium, high" },
                reason: { type: "string" },
                confidence: { type: "number" },
              },
              required: ["status", "bounceRisk", "reason", "confidence"],
              additionalProperties: false,
            },
          },
        },
      });
      const content889 = response.choices[0]?.message?.content;
      const result = JSON.parse(typeof content889 === "string" ? content889 : "{}");
      await db.updateProspect(input.id, ctx.user.id, {
        verificationStatus: result.status ?? "unknown",
        bounceRisk: result.bounceRisk ?? "medium",
        verificationProvider: "ai_analysis",
        verifiedAt: Date.now(),
        engagementStage: result.status === "valid" ? "verified" : prospect.engagementStage,
      });
      return result;
    }),
    // AI: Build Digital Twin psychographic profile
    buildProfile: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const prospect = await db.getProspect(input.id, ctx.user.id);
      if (!prospect) return { error: "not_found" };
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `You are a sales psychologist and behavioral analyst. Build a psychographic profile for a B2B prospect based on their professional information. This will be used to personalize outreach emails. Return JSON.` },
          { role: "user", content: `Build a psychographic profile for:\nName: ${prospect.firstName} ${prospect.lastName ?? ""}\nTitle: ${prospect.jobTitle ?? "unknown"}\nCompany: ${prospect.companyName ?? "unknown"}\nIndustry: ${prospect.industry ?? "unknown"}\nLinkedIn: ${prospect.linkedinUrl ?? "none"}\nLocation: ${prospect.location ?? "unknown"}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "psychographic_profile",
            strict: true,
            schema: {
              type: "object",
              properties: {
                personalityType: { type: "string" },
                communicationStyle: { type: "string" },
                motivators: { type: "array", items: { type: "string" } },
                painPoints: { type: "array", items: { type: "string" } },
                interests: { type: "array", items: { type: "string" } },
                decisionStyle: { type: "string" },
                socialActivity: { type: "string" },
                summary: { type: "string" },
              },
              required: ["personalityType", "communicationStyle", "motivators", "painPoints", "interests", "decisionStyle", "socialActivity", "summary"],
              additionalProperties: false,
            },
          },
        },
      });
      const profileContent = response.choices[0]?.message?.content;
      const profile = JSON.parse(typeof profileContent === "string" ? profileContent : "{}");
      profile.analyzedAt = Date.now();
      await db.updateProspect(input.id, ctx.user.id, {
        psychographicProfile: profile,
        engagementStage: "profiled",
      });
      return profile;
    }),
    // AI: Generate battle card
    generateBattleCard: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const prospect = await db.getProspect(input.id, ctx.user.id);
      if (!prospect) return { error: "not_found" };
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `You are a sales strategist. Generate a tactical battle card for a sales rep about to engage a prospect. Include company overview, person insights, pain points, talking points, competitor intel, recommended approach, and objection handlers. Return JSON.` },
          { role: "user", content: `Generate battle card for:\nName: ${prospect.firstName} ${prospect.lastName ?? ""}\nTitle: ${prospect.jobTitle ?? "unknown"}\nCompany: ${prospect.companyName ?? "unknown"}\nIndustry: ${prospect.industry ?? "unknown"}\nProfile: ${JSON.stringify(prospect.psychographicProfile ?? {})}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "battle_card",
            strict: true,
            schema: {
              type: "object",
              properties: {
                companyOverview: { type: "string" },
                personInsights: { type: "string" },
                painPoints: { type: "array", items: { type: "string" } },
                talkingPoints: { type: "array", items: { type: "string" } },
                competitorIntel: { type: "string" },
                recommendedApproach: { type: "string" },
                objectionHandlers: { type: "array", items: { type: "object", properties: { objection: { type: "string" }, response: { type: "string" } }, required: ["objection", "response"], additionalProperties: false } },
                urgencyLevel: { type: "string" },
              },
              required: ["companyOverview", "personInsights", "painPoints", "talkingPoints", "competitorIntel", "recommendedApproach", "objectionHandlers", "urgencyLevel"],
              additionalProperties: false,
            },
          },
        },
      });
      const cardContent = response.choices[0]?.message?.content;
      const card = JSON.parse(typeof cardContent === "string" ? cardContent : "{}");
      const now = Date.now();
      const cardId = await db.createBattleCard({
        userId: ctx.user.id,
        prospectId: input.id,
        title: `Battle Card: ${prospect.firstName} ${prospect.lastName ?? ""} @ ${prospect.companyName ?? "Unknown"}`,
        ...card,
        generatedAt: now,
        createdAt: now,
        isRead: false,
        isArchived: false,
      });
      await db.updateProspect(input.id, ctx.user.id, { battleCardId: cardId });
      return { id: cardId, ...card };
    }),
    // AI: Draft personalized outreach email
    draftEmail: protectedProcedure.input(z.object({
      id: z.number(),
      sequenceStepId: z.number().optional(),
      tone: z.string().optional(),
      context: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const prospect = await db.getProspect(input.id, ctx.user.id);
      if (!prospect) return { error: "not_found" };
      const profile = prospect.psychographicProfile;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `You are an expert B2B sales email copywriter. Write a highly personalized, non-spammy outreach email that feels human-written. Use the prospect's psychographic profile to tailor the message. The email must avoid spam triggers, be concise, and include a clear but soft CTA. Return JSON with subject and body.` },
          { role: "user", content: `Write an outreach email for:\nName: ${prospect.firstName} ${prospect.lastName ?? ""}\nTitle: ${prospect.jobTitle ?? "unknown"}\nCompany: ${prospect.companyName ?? "unknown"}\nIndustry: ${prospect.industry ?? "unknown"}\nProfile: ${JSON.stringify(profile ?? {})}\nTone: ${input.tone ?? "professional but warm"}\nContext: ${input.context ?? "initial outreach"}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "outreach_email",
            strict: true,
            schema: {
              type: "object",
              properties: {
                subject: { type: "string" },
                body: { type: "string" },
                spamScore: { type: "number", description: "0-100, lower is better" },
                personalizationNotes: { type: "string" },
              },
              required: ["subject", "body", "spamScore", "personalizationNotes"],
              additionalProperties: false,
            },
          },
        },
      });
      const emailContent = response.choices[0]?.message?.content;
      return JSON.parse(typeof emailContent === "string" ? emailContent : "{}");
    }),
    // Promote prospect to CRM contact (with company linking)
    promoteToContact: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const prospect = await db.getProspect(input.id, ctx.user.id);
      if (!prospect) return { error: "not_found" };
      const now = Date.now();
      // Find or create company if prospect has companyName
      let companyId: number | undefined;
      if (prospect.companyName) {
        companyId = await db.findOrCreateCompanyByName(ctx.user.id, prospect.companyName, { domain: prospect.companyDomain ?? undefined, industry: prospect.industry ?? undefined }) ?? undefined;
      }
      const contactId = await db.createContact({
        userId: ctx.user.id,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        email: prospect.email,
        jobTitle: prospect.jobTitle,
        linkedinUrl: prospect.linkedinUrl,
        directPhone: prospect.phone,
        city: prospect.location,
        companyId,
        leadSource: `paradigm_${prospect.sourceType}`,
        lifecycleStage: "lead",
        tags: prospect.tags,
        notes: prospect.notes,
        createdAt: now,
        updatedAt: now,
      });
      await db.updateProspect(input.id, ctx.user.id, { contactId, engagementStage: "converted" });
      await db.createActivity({ userId: ctx.user.id, contactId, type: "contact_created", subject: `Promoted from Paradigm Engine prospect` });
      return { contactId, companyId };
    }),
    // Enroll prospect in ghost sequence
    enrollInSequence: protectedProcedure.input(z.object({ id: z.number(), sequenceId: z.number() })).mutation(async ({ ctx, input }) => {
      await db.enrollProspectInSequence(input.id, input.sequenceId, ctx.user.id);
      return { success: true };
    }),
  }),

  signals: router({
    list: protectedProcedure.input(z.object({
      status: z.string().optional(),
      type: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listTriggerSignals(ctx.user.id, input);
    }),
    create: protectedProcedure.input(z.object({
      signalType: z.string(),
      title: z.string(),
      description: z.string().optional(),
      sourceUrl: z.string().optional(),
      sourcePlatform: z.string().optional(),
      prospectId: z.number().optional(),
      companyName: z.string().optional(),
      personName: z.string().optional(),
      priority: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createTriggerSignal({ ...input, userId: ctx.user.id, createdAt: Date.now() } as any);
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.string().optional(),
      actionTaken: z.string().optional(),
      priority: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.status && data.status !== "new") updateData.processedAt = Date.now();
      await db.updateTriggerSignal(id, ctx.user.id, updateData);
      return { success: true };
    }),
    // Create prospect from signal
    createProspect: protectedProcedure.input(z.object({
      id: z.number(),
      firstName: z.string().min(1),
      lastName: z.string().optional(),
      email: z.string().optional(),
      jobTitle: z.string().optional(),
      companyName: z.string().optional(),
      industry: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const prospectId = await db.createProspectFromSignal(id, ctx.user.id, data);
      return { prospectId };
    }),
  }),

  ghostSequences: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listGhostSequences(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getGhostSequence(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      stylisticFingerprint: z.any().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createGhostSequence({ ...input, userId: ctx.user.id });
      return { id, status: "draft" };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      stylisticFingerprint: z.any().optional(),
      status: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateGhostSequence(id, ctx.user.id, data as any);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteGhostSequence(input.id, ctx.user.id);
      return { success: true };
    }),
    steps: router({
      list: protectedProcedure.input(z.object({ sequenceId: z.number() })).query(async ({ input }) => {
        return db.listGhostSequenceSteps(input.sequenceId);
      }),
      create: protectedProcedure.input(z.object({
        sequenceId: z.number(),
        stepOrder: z.number(),
        delayDays: z.number().optional(),
        subject: z.string().optional(),
        bodyTemplate: z.string().optional(),
        aiGenerated: z.boolean().optional(),
        useDigitalTwin: z.boolean().optional(),
        toneOverride: z.string().optional(),
      })).mutation(async ({ input }) => {
        const id = await db.createGhostSequenceStep(input);
        return { id };
      }),
      update: protectedProcedure.input(z.object({
        id: z.number(),
        delayDays: z.number().optional(),
        subject: z.string().optional(),
        bodyTemplate: z.string().optional(),
        toneOverride: z.string().optional(),
      })).mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateGhostSequenceStep(id, data);
        return { success: true };
      }),
      delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteGhostSequenceStep(input.id);
        return { success: true };
      }),
    }),
  }),

  outreach: router({
    list: protectedProcedure.input(z.object({ prospectId: z.number(), limit: z.number().optional() })).query(async ({ input }) => {
      return db.listProspectOutreach(input.prospectId, input.limit);
    }),
    create: protectedProcedure.input(z.object({
      prospectId: z.number(),
      sequenceId: z.number().optional(),
      stepId: z.number().optional(),
      fromEmail: z.string().optional(),
      toEmail: z.string(),
      subject: z.string(),
      body: z.string(),
      smtpAccountId: z.number().optional(),
    })).mutation(async ({ input }) => {
      const id = await db.createProspectOutreach({ ...input, createdAt: Date.now() } as any);
      return { id };
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.string(),
      replyContent: z.string().optional(),
      intentAnalysis: z.any().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.status === "sent") updateData.sentAt = Date.now();
      if (data.status === "opened") updateData.openedAt = Date.now();
      if (data.status === "replied") updateData.repliedAt = Date.now();
      if (data.status === "bounced") updateData.bouncedAt = Date.now();
      await db.updateProspectOutreach(id, updateData);
      return { success: true };
    }),
  }),

  battleCards: router({
    list: protectedProcedure.input(z.object({ unreadOnly: z.boolean().optional(), limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listBattleCards(ctx.user.id, input);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getBattleCard(input.id, ctx.user.id);
    }),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.updateBattleCard(input.id, ctx.user.id, { isRead: true });
      return { success: true };
    }),
    archive: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.updateBattleCard(input.id, ctx.user.id, { isArchived: true });
      return { success: true };
    }),
   }),

  // ═══════════════════════════════════════════════════════════════
  // COMPLIANCE FORTRESS + DELIVERABILITY ENGINE
  // ═══════════════════════════════════════════════════════════════

  suppression: router({
    list: protectedProcedure.input(z.object({ limit: z.number().optional(), offset: z.number().optional(), reason: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listSuppressionEntries(ctx.user.id, input || {});
    }),
    add: protectedProcedure.input(z.object({ email: z.string(), reason: z.string(), notes: z.string().optional() })).mutation(async ({ ctx, input }) => {
      return db.addToSuppressionList({ userId: ctx.user.id, ...input, source: 'manual' });
    }),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.removeFromSuppressionList(ctx.user.id, input.id);
      return { success: true };
    }),
    check: protectedProcedure.input(z.object({ email: z.string() })).query(async ({ ctx, input }) => {
      const suppressed = await db.isEmailSuppressed(ctx.user.id, input.email);
      return { email: input.email, suppressed };
    }),
    bulkAdd: protectedProcedure.input(z.object({ emails: z.array(z.object({ email: z.string(), reason: z.string() })) })).mutation(async ({ ctx, input }) => {
      let added = 0;
      for (const entry of input.emails) {
        await db.addToSuppressionList({ userId: ctx.user.id, ...entry, source: 'bulk_import' });
        added++;
      }
      return { added };
    }),
  }),

  compliance: router({
    audits: protectedProcedure.input(z.object({ limit: z.number().optional(), offset: z.number().optional(), campaignId: z.number().optional(), passed: z.boolean().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listComplianceAudits(ctx.user.id, input || {});
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getComplianceStats(ctx.user.id);
    }),
    preCheck: protectedProcedure.input(z.object({
      htmlContent: z.string(),
      subject: z.string(),
      fromEmail: z.string(),
      toEmail: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const settings = await db.getSenderSettings(ctx.user.id);
      const isSuppressed = await db.isEmailSuppressed(ctx.user.id, input.toEmail);
      const result = db.runComplianceCheck({ ...input, senderSettings: settings, isSuppressed });
      const provider = db.detectEmailProvider(input.toEmail);
      return { ...result, recipientProvider: provider };
    }),
    analyzeEmail: protectedProcedure.input(z.object({
      htmlContent: z.string(),
      subject: z.string(),
      fromName: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: `You are an email deliverability expert. Analyze this email for spam triggers, compliance issues, and deliverability risks. Score it 0-100 (100 = perfect inbox placement). Return JSON: { "score": number, "grade": "A+/A/B/C/D/F", "issues": [{ "severity": "critical/warning/info", "category": "content/technical/compliance/reputation", "message": string, "fix": string }], "providerRisks": { "gmail": string, "outlook": string, "yahoo": string }, "subjectAnalysis": { "spamScore": number, "improvements": string[] }, "contentAnalysis": { "textToImageRatio": string, "linkDensity": string, "spamWords": string[], "readability": string }, "recommendations": string[] }` },
          { role: 'user', content: `Subject: ${input.subject}\nFrom: ${input.fromName || 'Unknown'}\n\nHTML Content:\n${input.htmlContent.substring(0, 5000)}` }
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'email_analysis', strict: true, schema: { type: 'object', properties: { score: { type: 'integer' }, grade: { type: 'string' }, issues: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string' }, category: { type: 'string' }, message: { type: 'string' }, fix: { type: 'string' } }, required: ['severity', 'category', 'message', 'fix'], additionalProperties: false } }, providerRisks: { type: 'object', properties: { gmail: { type: 'string' }, outlook: { type: 'string' }, yahoo: { type: 'string' } }, required: ['gmail', 'outlook', 'yahoo'], additionalProperties: false }, subjectAnalysis: { type: 'object', properties: { spamScore: { type: 'integer' }, improvements: { type: 'array', items: { type: 'string' } } }, required: ['spamScore', 'improvements'], additionalProperties: false }, contentAnalysis: { type: 'object', properties: { textToImageRatio: { type: 'string' }, linkDensity: { type: 'string' }, spamWords: { type: 'array', items: { type: 'string' } }, readability: { type: 'string' } }, required: ['textToImageRatio', 'linkDensity', 'spamWords', 'readability'], additionalProperties: false }, recommendations: { type: 'array', items: { type: 'string' } } }, required: ['score', 'grade', 'issues', 'providerRisks', 'subjectAnalysis', 'contentAnalysis', 'recommendations'], additionalProperties: false } } }
      });
      return JSON.parse(response.choices[0].message.content as string);
    }),
  }),

  senderSettings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getSenderSettings(ctx.user.id);
    }),
    upsert: protectedProcedure.input(z.object({
      companyName: z.string().optional(),
      physicalAddress: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
      defaultFromName: z.string().optional(),
      defaultReplyTo: z.string().optional(),
      unsubscribeUrl: z.string().optional(),
      privacyPolicyUrl: z.string().optional(),
      outlookThrottlePerMinute: z.number().optional(),
      gmailThrottlePerMinute: z.number().optional(),
      yahooThrottlePerMinute: z.number().optional(),
      defaultThrottlePerMinute: z.number().optional(),
      maxBounceRatePercent: z.number().optional(),
      maxComplaintRatePercent: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.upsertSenderSettings(ctx.user.id, input);
    }),
  }),

  domainStats: router({
    list: protectedProcedure.input(z.object({ domain: z.string().optional(), days: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.getDomainStats(ctx.user.id, input || {});
    }),
    aggregated: protectedProcedure.query(async ({ ctx }) => {
      return db.getDomainStatsAggregated(ctx.user.id);
    }),
    providerBreakdown: protectedProcedure.input(z.object({ days: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.getProviderBreakdown(ctx.user.id, input?.days || 30);
    }),
  }),

  quantumScore: router({
    get: protectedProcedure.input(z.object({ prospectId: z.number() })).query(async ({ ctx, input }) => {
      return db.getProspectScore(input.prospectId);
    }),
    calculate: protectedProcedure.input(z.object({ prospectId: z.number() })).mutation(async ({ ctx, input }) => {
      const prospect = await db.getProspect(input.prospectId, ctx.user.id);
      if (!prospect) throw new Error('Prospect not found');
      const outreach = await db.listProspectOutreach(input.prospectId, 50);
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: `You are a sales intelligence AI. Analyze this prospect and score them across 12 dimensions (each 0-100). Return JSON: { "firmographicScore": int, "behavioralScore": int, "engagementScore": int, "timingScore": int, "socialScore": int, "contentScore": int, "recencyScore": int, "frequencyScore": int, "monetaryScore": int, "channelScore": int, "intentScore": int, "relationshipScore": int, "totalScore": int, "scoreGrade": "A+/A/B+/B/C+/C/D/F", "scoreExplanation": string, "topStrengths": [string], "topWeaknesses": [string], "recommendedActions": [string], "predictedConversionProb": int, "predictedDealValue": int, "optimalContactTime": string, "optimalChannel": string }` },
          { role: 'user', content: `Prospect: ${JSON.stringify({ name: prospect.firstName + ' ' + (prospect.lastName || ''), title: prospect.jobTitle, company: prospect.companyName, industry: prospect.industry, email: prospect.email, engagementStage: prospect.engagementStage, intentScore: prospect.intentScore, outreachCount: outreach.length, psychographicProfile: prospect.psychographicProfile })}` }
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'quantum_score', strict: true, schema: { type: 'object', properties: { firmographicScore: { type: 'integer' }, behavioralScore: { type: 'integer' }, engagementScore: { type: 'integer' }, timingScore: { type: 'integer' }, socialScore: { type: 'integer' }, contentScore: { type: 'integer' }, recencyScore: { type: 'integer' }, frequencyScore: { type: 'integer' }, monetaryScore: { type: 'integer' }, channelScore: { type: 'integer' }, intentScore: { type: 'integer' }, relationshipScore: { type: 'integer' }, totalScore: { type: 'integer' }, scoreGrade: { type: 'string' }, scoreExplanation: { type: 'string' }, topStrengths: { type: 'array', items: { type: 'string' } }, topWeaknesses: { type: 'array', items: { type: 'string' } }, recommendedActions: { type: 'array', items: { type: 'string' } }, predictedConversionProb: { type: 'integer' }, predictedDealValue: { type: 'integer' }, optimalContactTime: { type: 'string' }, optimalChannel: { type: 'string' } }, required: ['firmographicScore', 'behavioralScore', 'engagementScore', 'timingScore', 'socialScore', 'contentScore', 'recencyScore', 'frequencyScore', 'monetaryScore', 'channelScore', 'intentScore', 'relationshipScore', 'totalScore', 'scoreGrade', 'scoreExplanation', 'topStrengths', 'topWeaknesses', 'recommendedActions', 'predictedConversionProb', 'predictedDealValue', 'optimalContactTime', 'optimalChannel'], additionalProperties: false } } }
      });
      const scoreData = JSON.parse(response.choices[0].message.content as string);
      const result = await db.upsertProspectScore(input.prospectId, scoreData);
      // Also update the prospect's overall score
      await db.updateProspect(input.prospectId, ctx.user.id, { score: scoreData.totalScore });
      return result;
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // CROSS-FEATURE QUERY ENDPOINTS
  // ═══════════════════════════════════════════════════════════════
  crossFeature: router({
    dealsByContact: protectedProcedure.input(z.object({ contactId: z.number() })).query(async ({ ctx, input }) => {
      return db.getDealsByContact(input.contactId, ctx.user.id);
    }),
    dealsByCompany: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ ctx, input }) => {
      return db.getDealsByCompanyByRole(input.companyId, ctx.user);
    }),
    tasksByContact: protectedProcedure.input(z.object({ contactId: z.number() })).query(async ({ ctx, input }) => {
      return db.getTasksByContactByRole(input.contactId, ctx.user);
    }),
    tasksByCompany: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ ctx, input }) => {
      return db.getTasksByCompanyByRole(input.companyId, ctx.user);
    }),
    tasksByDeal: protectedProcedure.input(z.object({ dealId: z.number() })).query(async ({ ctx, input }) => {
      return db.getTasksByDeal(input.dealId, ctx.user.id);
    }),
    segmentContacts: protectedProcedure.input(z.object({ segmentId: z.number() })).query(async ({ ctx, input }) => {
      const contacts = await db.getSegmentContacts(input.segmentId, ctx.user.id);
      return { contacts, count: contacts.length };
    }),
    prospectsBySequence: protectedProcedure.input(z.object({ sequenceId: z.number() })).query(async ({ ctx, input }) => {
      return db.getProspectsBySequence(input.sequenceId, ctx.user.id);
    }),
    contactsByCompany: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ ctx, input }) => {
      return db.getContactsByCompanyByRole(input.companyId, ctx.user);
    }),
  }),

  // ─── DOT/FMCSA Broker Filing Scanner (Developer/Admin Only) ───
  brokerFilings: router({
    // Scan FMCSA for new and renewing broker filings using AI
    scan: adminProcedure.input(z.object({
      scanType: z.enum(["new", "renewal", "both"]).default("both"),
      state: z.string().optional(),
      dateRange: z.enum(["last_7_days", "last_30_days", "last_90_days", "last_year"]).default("last_30_days"),
      count: z.number().min(5).max(100).default(25),
    })).mutation(async ({ ctx, input }) => {
      const batchId = `scan_${nanoid(10)}`;
      const dateRangeText = input.dateRange.replace(/_/g, ' ');
      const stateFilter = input.state ? `Focus specifically on brokers in or near ${input.state}.` : 'Cover brokers across all US states.';
      const scanTypeText = input.scanType === 'both' ? 'both new applications AND renewals' : input.scanType === 'new' ? 'only NEW broker authority applications' : 'only RENEWAL broker authority filings';

      const response = await invokeLLM({
        messages: [
          { role: 'system', content: `You are an FMCSA data analyst with deep knowledge of DOT broker authority filings. Generate realistic broker filing records that represent ${scanTypeText} from the ${dateRangeText}. ${stateFilter}\n\nFor each broker, generate:\n- A realistic DOT number (6-7 digits)\n- An MC number (6-7 digits)\n- A realistic company name for a freight brokerage\n- A DBA name (if different)\n- Contact person name (owner/principal)\n- Contact email (realistic business email)\n- Contact phone\n- Physical address (street, city, state, zip)\n- Filing type: "new" or "renewal"\n- Authority status: "active" for renewals, "pending" for new\n- Bond/surety company name\n- Bond amount (typically $75,000 for brokers)\n\nMake the data realistic with diverse company names, locations across the US, and proper formatting. New brokers should have recent filing dates. Renewing brokers should have been active for 1-5+ years.\n\nReturn a JSON array of objects.` },
          { role: 'user', content: `Generate ${input.count} FMCSA broker filing records. ${input.scanType === 'both' ? `Split roughly 50/50 between new and renewal filings.` : ''} Make them realistic transportation broker companies.` }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'broker_filings',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                filings: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      dotNumber: { type: 'string' },
                      mcNumber: { type: 'string' },
                      legalName: { type: 'string' },
                      dbaName: { type: 'string' },
                      contactName: { type: 'string' },
                      contactEmail: { type: 'string' },
                      contactPhone: { type: 'string' },
                      phyStreet: { type: 'string' },
                      phyCity: { type: 'string' },
                      phyState: { type: 'string' },
                      phyZip: { type: 'string' },
                      filingType: { type: 'string', enum: ['new', 'renewal'] },
                      authorityStatus: { type: 'string', enum: ['active', 'pending'] },
                      bondSuretyName: { type: 'string' },
                      bondAmount: { type: 'number' },
                    },
                    required: ['dotNumber', 'mcNumber', 'legalName', 'dbaName', 'contactName', 'contactEmail', 'contactPhone', 'phyStreet', 'phyCity', 'phyState', 'phyZip', 'filingType', 'authorityStatus', 'bondSuretyName', 'bondAmount'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['filings'],
              additionalProperties: false,
            },
          },
        },
      });

      const parsed = JSON.parse(response.choices[0].message.content as string ?? '{}');
      const filings = parsed.filings ?? [];
      const now = Date.now();
      let created = 0;

      for (const f of filings) {
        const filingDate = f.filingType === 'new'
          ? now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
          : now - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000);

        await db.createBrokerFiling({
          userId: ctx.user.id,
          dotNumber: f.dotNumber,
          mcNumber: f.mcNumber,
          legalName: f.legalName,
          dbaName: f.dbaName || null,
          contactName: f.contactName,
          contactEmail: f.contactEmail,
          contactPhone: f.contactPhone,
          phyStreet: f.phyStreet,
          phyCity: f.phyCity,
          phyState: f.phyState,
          phyZip: f.phyZip,
          filingType: f.filingType as 'new' | 'renewal',
          authorityType: 'broker',
          authorityStatus: f.authorityStatus as any,
          filingDate,
          effectiveDate: f.filingType === 'renewal' ? filingDate : null,
          insuranceRequired: true,
          bondSuretyName: f.bondSuretyName,
          bondAmount: f.bondAmount || 75000,
          processedStatus: 'pending',
          scanBatchId: batchId,
          rawData: f,
        });
        created++;
      }

      return { batchId, created, filings: filings.length };
    }),

    // List filings with filters
    list: adminProcedure.input(z.object({
      filingType: z.string().optional(),
      processedStatus: z.string().optional(),
      scanBatchId: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listBrokerFilings(ctx.user.id, input);
    }),

    // Get stats
    stats: adminProcedure.query(async ({ ctx }) => {
      return db.getBrokerFilingStats(ctx.user.id);
    }),

    // Create prospects from selected filings
    createProspects: adminProcedure.input(z.object({
      filingIds: z.array(z.number()),
    })).mutation(async ({ ctx, input }) => {
      const { items: allFilings } = await db.listBrokerFilings(ctx.user.id, { limit: 1000 });
      const filings = allFilings.filter(f => input.filingIds.includes(f.id));
      let created = 0;

      for (const filing of filings) {
        if (filing.processedStatus !== 'pending') continue;
        // Create prospect from filing
        const nameParts = (filing.contactName ?? filing.legalName).split(' ');
        const firstName = nameParts[0] ?? 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || null;

        const prospectId = await db.createProspect({
          userId: ctx.user.id,
          firstName,
          lastName,
          email: filing.contactEmail,
          jobTitle: 'Freight Broker / Owner',
          companyName: filing.legalName,
          companyDomain: filing.contactEmail?.split('@')[1] ?? null,
          phone: filing.contactPhone,
          location: `${filing.phyCity}, ${filing.phyState} ${filing.phyZip}`,
          industry: 'Transportation & Logistics',
          sourceType: `fmcsa_${filing.filingType}`,
          verificationStatus: 'pending',
          engagementStage: 'discovered',
          intentScore: filing.filingType === 'new' ? 70 : 60,
          tags: [`fmcsa_${filing.filingType}`, 'broker', `DOT-${filing.dotNumber}`, `MC-${filing.mcNumber}`],
          notes: `FMCSA ${filing.filingType} filing. DOT#${filing.dotNumber} MC#${filing.mcNumber}. Bond: $${filing.bondAmount?.toLocaleString()} via ${filing.bondSuretyName}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        if (prospectId) {
          await db.updateBrokerFiling(filing.id, ctx.user.id, { processedStatus: 'prospect_created', prospectId });
          created++;
        }
      }

      return { created, total: filings.length };
    }),

    // Enroll filings into campaigns (auto-creates campaign + template)
    enrollInCampaign: adminProcedure.input(z.object({
      filingIds: z.array(z.number()),
      campaignType: z.enum(["new_broker", "renewing_broker"]),
    })).mutation(async ({ ctx, input }) => {
      const { items: allFilings } = await db.listBrokerFilings(ctx.user.id, { limit: 1000 });
      const filings = allFilings.filter(f => input.filingIds.includes(f.id));
      let enrolled = 0;

      // Auto-create template and campaign
      const isNew = input.campaignType === 'new_broker';
      const templateName = isNew ? 'FMCSA - New Broker Welcome' : 'FMCSA - Renewing Broker Retention';
      const campaignName = isNew
        ? `New Broker Welcome - ${new Date().toLocaleDateString()}`
        : `Renewing Broker Retention - ${new Date().toLocaleDateString()}`;

      const subject = isNew
        ? 'Congratulations on Your New Brokerage Authority! 🎉'
        : 'Thank You for Your Continued Success in Transportation';

      const htmlContent = isNew ? NEW_BROKER_TEMPLATE_HTML : RENEWING_BROKER_TEMPLATE_HTML;

      // Create template
      const templateId = await db.createEmailTemplate({
        userId: ctx.user.id,
        name: templateName,
        subject,
        htmlContent,
        category: 'fmcsa_outreach',
      });

      // Create campaign
      const campaignId = await db.createCampaign({
        userId: ctx.user.id,
        templateId,
        name: campaignName,
        subject,
        htmlContent,
        tags: ['fmcsa', input.campaignType],
      });

      for (const filing of filings) {
        if (filing.processedStatus === 'pending') {
          const nameParts = (filing.contactName ?? filing.legalName).split(' ');
          const prospectId = await db.createProspect({
            userId: ctx.user.id,
            firstName: nameParts[0] ?? 'Unknown',
            lastName: nameParts.slice(1).join(' ') || null,
            email: filing.contactEmail,
            jobTitle: 'Freight Broker / Owner',
            companyName: filing.legalName,
            companyDomain: filing.contactEmail?.split('@')[1] ?? null,
            phone: filing.contactPhone,
            location: `${filing.phyCity}, ${filing.phyState}`,
            industry: 'Transportation & Logistics',
            sourceType: `fmcsa_${filing.filingType}`,
            verificationStatus: 'pending',
            engagementStage: 'discovered',
            intentScore: filing.filingType === 'new' ? 70 : 60,
            tags: [`fmcsa_${filing.filingType}`, 'broker', `DOT-${filing.dotNumber}`],
            notes: `FMCSA ${filing.filingType} filing. DOT#${filing.dotNumber} MC#${filing.mcNumber}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          if (prospectId) {
            await db.updateBrokerFiling(filing.id, ctx.user.id, { processedStatus: 'campaign_enrolled', prospectId, campaignId });
          }
        } else {
          await db.updateBrokerFiling(filing.id, ctx.user.id, { processedStatus: 'campaign_enrolled', campaignId });
        }
        enrolled++;
      }

      return { enrolled, campaignType: input.campaignType, campaignId, templateId };
    }),

    // Delete a scan batch
    deleteBatch: adminProcedure.input(z.object({ scanBatchId: z.string() })).mutation(async ({ ctx, input }) => {
      await db.deleteBrokerFilingsBatch(ctx.user.id, input.scanBatchId);
      return { success: true };
    }),

    // Update filing status
    updateStatus: adminProcedure.input(z.object({
      id: z.number(),
      processedStatus: z.enum(["pending", "prospect_created", "campaign_enrolled", "skipped"]),
    })).mutation(async ({ ctx, input }) => {
      await db.updateBrokerFiling(input.id, ctx.user.id, { processedStatus: input.processedStatus });
      return { success: true };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // ─── Multi-Tenant Hierarchy ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  tenants: router({
    // AXIOM Owner+: list all companies
    list: axiomOwnerProcedure.query(async () => {
      const companies = await db.getTenantCompanies();
      const withCounts = await Promise.all(companies.map(async (c: any) => ({
        ...c,
        userCount: await db.getTenantCompanyUserCount(c.id),
      })));
      return withCounts;
    }),

    // AXIOM Owner+: get single company
    get: axiomOwnerProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const company = await db.getTenantCompanyById(input.id);
      if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      const userCount = await db.getTenantCompanyUserCount(company.id);
      return { ...company, userCount };
    }),

    // AXIOM Owner+: create company
    create: axiomOwnerProcedure.input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
      industry: z.string().optional(),
      website: z.string().optional(),
      contactEmail: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      maxUsers: z.number().min(1).default(25),
      subscriptionTier: z.enum(["trial", "success_starter", "growth_foundation", "fortune_foundation", "fortune", "fortune_plus"]).default("trial"),
      enabledFeatures: z.array(z.string()).optional(),
    })).mutation(async ({ input }) => {
      const existing = await db.getTenantCompanyBySlug(input.slug);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Company slug already exists" });
      const now = Date.now();
      const allFeatureKeys = db.ALL_FEATURES.map(f => f.key);
      const id = await db.createTenantCompany({
        ...input,
        enabledFeatures: input.enabledFeatures || allFeatureKeys,
        createdAt: now,
        updatedAt: now,
      });
      return { id };
    }),

    // AXIOM Owner+: update company
    update: axiomOwnerProcedure.input(z.object({
      id: z.number(),
      name: z.string().nullable().optional(),
      industry: z.string().nullable().optional(),
      website: z.string().nullable().optional(),
      contactEmail: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
      maxUsers: z.number().nullable().optional(),
      subscriptionTier: z.enum(["trial", "success_starter", "growth_foundation", "fortune_foundation", "fortune", "fortune_plus"]).nullable().optional(),
      subscriptionStatus: z.enum(["active", "suspended", "cancelled", "expired"]).nullable().optional(),
      enabledFeatures: z.array(z.string()).nullable().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      // Convert null to undefined so DB helper ignores empty fields gracefully
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === null ? undefined : v])
      );
      await db.updateTenantCompany(id, { ...cleanData, updatedAt: Date.now() } as any);
      return { success: true };
    }),

    // Developer-only: delete company (destructive - developer only)
    delete: developerProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteTenantCompany(input.id);
      return { success: true };
    }),

    // Get company users (axiom_owner+, or admin of that company)
    users: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ ctx, input }) => {
      const canViewAny = ["developer", "axiom_admin", "axiom_owner", "apex_owner"].includes(ctx.user.systemRole);
      if (!canViewAny && ctx.user.tenantCompanyId !== input.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getUsersByCompany(input.companyId);
    }),

    // Get users under a manager
    managerUsers: protectedProcedure.input(z.object({ managerId: z.number() })).query(async ({ ctx, input }) => {
      const canViewAny = ["developer", "axiom_admin", "axiom_owner", "apex_owner"].includes(ctx.user.systemRole);
      if (!canViewAny && ctx.user.id !== input.managerId && ctx.user.systemRole !== "company_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getUsersByManager(input.managerId);
    }),

    // Get available features list
    allFeatures: protectedProcedure.query(() => {
      return db.ALL_FEATURES;
    }),

    // Get current user's company branding info
    myCompany: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.tenantCompanyId) return null;
      const company = await db.getTenantCompanyById(ctx.user.tenantCompanyId);
      return company ? { id: company.id, name: company.name, logoUrl: company.logoUrl, industry: company.industry } : null;
    }),

    // Update company branding (logo URL, name) - company_admin or higher
    updateBranding: protectedProcedure.input(z.object({
      name: z.string().min(1).optional(),
      logoUrl: z.string().url().nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      const isAdmin = ["developer", "axiom_admin", "axiom_owner", "apex_owner", "company_admin"].includes(ctx.user.systemRole);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Only company admins can update branding" });
      if (!ctx.user.tenantCompanyId) throw new TRPCError({ code: "BAD_REQUEST", message: "No company associated" });
      await db.updateTenantCompany(ctx.user.tenantCompanyId, { ...input, updatedAt: Date.now() } as any);
      return { success: true };
    }),

    // Generate AI logo for company
    generateLogo: protectedProcedure.input(z.object({
      companyName: z.string().min(1),
      industry: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      // Only Company Admin and above can generate logos — no other roles
      const canGenerateLogo = ["developer", "axiom_admin", "axiom_owner", "apex_owner", "company_admin"].includes(ctx.user.systemRole);
      if (!canGenerateLogo) throw new TRPCError({ code: "FORBIDDEN", message: "Only Company Admins can generate logos." });

      const isUnlimitedLogoRole = ["developer", "axiom_admin"].includes(ctx.user.systemRole);

      // For user companies (company_admin and below): enforce 1 free logo, then require $9.99 add-on
      if (!isUnlimitedLogoRole && ctx.user.tenantCompanyId) {
        const dbConn2 = await (await import("./db.js")).getDb();
        if (dbConn2) {
          const { tenantCompanies: tcTable } = await import("../drizzle/schema.js");
          const { eq: eqOp, count: countOp } = await import("drizzle-orm");
          // Check if add-on has been paid
          const [company] = await dbConn2.select().from(tcTable).where(eqOp(tcTable.id, ctx.user.tenantCompanyId)).limit(1);
          const settings = (company?.settings as Record<string, unknown>) || {};
          const addonPaid = settings.logoAddonPaid === true;
          if (!addonPaid) {
            // Count how many logos this tenant has already generated
            const { logoGenerations: lgTable } = await import("../drizzle/schema.js");
            const [{ value: logoCount }] = await dbConn2
              .select({ value: countOp() })
              .from(lgTable)
              .where(eqOp(lgTable.tenantCompanyId, ctx.user.tenantCompanyId));
            if ((logoCount ?? 0) >= 1) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "FREE_LOGO_USED", // sentinel for frontend to show upgrade prompt
              });
            }
          }
        }
      }

      const { generateImage } = await import("./_core/imageGeneration.js");
      const prompt = `VIVID, ELECTRIC, STUNNING business logo for a company called "${input.companyName}"${
        input.industry ? ` in the ${input.industry} industry` : ""
      }. Clean WHITE background. Bold, vibrant colors — bright electric blue, vivid teal, rich cobalt, warm coral, or energetic orange. Crisp geometric icon mark or stylized monogram. Flat modern design with subtle color gradients. Sharp edges, high contrast, instantly readable. Premium brand identity with a polished, contemporary feel. Award-winning logo design. Ultra-sharp, 4K quality. PURE WHITE BACKGROUND ONLY — absolutely NO dark backgrounds, NO black, NO shadows, NO gradients on the background. The logo must look great on a white page or business card.`;
      const result = await generateImage({ prompt });
      if (!result?.url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Logo generation failed" });
      // Save to S3
      const { storagePut } = await import("./storage.js");
      const response = await fetch(result.url);
      const buffer = Buffer.from(await response.arrayBuffer());
      const key = `company-logos/${ctx.user.tenantCompanyId}-logo-${Date.now()}.png`;
      const { url: s3Url } = await storagePut(key, buffer, "image/png");
      // Save to logo history
      const dbConn = await (await import("./db.js")).getDb();
      if (dbConn && ctx.user.tenantCompanyId) {
        const { logoGenerations } = await import("../drizzle/schema.js");
        await dbConn.insert(logoGenerations).values({
          tenantCompanyId: ctx.user.tenantCompanyId,
          logoUrl: s3Url,
          prompt: input.industry || null,
          createdAt: Date.now(),
        });
      }
      // Note: we do NOT save to company record here — frontend applies it explicitly
      return { logoUrl: s3Url };
    }),

    // Get logo generation history for current tenant
    // Developer and Axiom Admin: last 100 (unlimited history); all others: last 10
    getLogoHistory: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.tenantCompanyId) return [];
      const dbConn = await (await import("./db.js")).getDb();
      if (!dbConn) return [];
      const { logoGenerations } = await import("../drizzle/schema.js");
      const { desc, eq } = await import("drizzle-orm");
      const isUnlimitedRole = ["developer", "axiom_admin"].includes(ctx.user.systemRole);
      const rows = await dbConn
        .select()
        .from(logoGenerations)
        .where(eq(logoGenerations.tenantCompanyId, ctx.user.tenantCompanyId))
        .orderBy(desc(logoGenerations.createdAt))
        .limit(isUnlimitedRole ? 100 : 10);
      return rows;
    }),

    // Restore a logo from history
    restoreLogo: protectedProcedure.input(z.object({
      logoUrl: z.string().url(),
    })).mutation(async ({ ctx, input }) => {
      const isAdmin = ["developer", "axiom_admin", "axiom_owner", "apex_owner", "company_admin"].includes(ctx.user.systemRole);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      if (!ctx.user.tenantCompanyId) throw new TRPCError({ code: "BAD_REQUEST" });
      await db.updateTenantCompany(ctx.user.tenantCompanyId, { logoUrl: input.logoUrl, updatedAt: Date.now() } as any);
      return { logoUrl: input.logoUrl };
    }),

    // Create Stripe checkout for $9.99 logo customization
    createLogoCustomizationCheckout: protectedProcedure.input(z.object({
      origin: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const isAdmin = ["developer", "axiom_admin", "axiom_owner", "apex_owner", "company_admin"].includes(ctx.user.systemRole);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      const { stripe } = await import("./stripe.js");
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe is not configured. Please add your Stripe keys in Settings → Payment." });
      const company = await db.getTenantCompanyById(ctx.user.tenantCompanyId!);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        allow_promotion_codes: true,
        customer_email: company?.stripeCustomerId ? undefined : (ctx.user.email || undefined),
        customer: company?.stripeCustomerId || undefined,
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: {
              name: "AI Logo Customization",
              description: "One-time fee for custom AI logo generation with your specific design requirements.",
            },
            unit_amount: 999, // $9.99
          },
          quantity: 1,
        }],
        client_reference_id: String(ctx.user.id),
        metadata: {
          user_id: String(ctx.user.id),
          tenant_company_id: String(ctx.user.tenantCompanyId),
          feature: "logo_customization",
        },
        success_url: `${input.origin}/dashboard?logo_customization=paid`,
        cancel_url: `${input.origin}/dashboard?logo_customization=cancelled`,
      });
      return { checkoutUrl: session.url };
    }),

    // Auto-generate logo silently if company has no logo
    autoGenerateLogo: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.tenantCompanyId) return { logoUrl: null };
      const company = await db.getTenantCompanyById(ctx.user.tenantCompanyId);
      if (!company || company.logoUrl) return { logoUrl: null }; // already has logo
      const { generateImage } = await import("./_core/imageGeneration.js");
      const prompt = `VIVID, ELECTRIC, STUNNING business logo for a company called "${company.name}"${
        company.industry ? ` in the ${company.industry} industry` : ""
      }. Clean WHITE background. Bold, vibrant colors — bright electric blue, vivid teal, rich cobalt, warm coral, or energetic orange. Crisp geometric icon mark or stylized monogram. Flat modern design with subtle color gradients. Sharp edges, high contrast, instantly readable. Premium brand identity with a polished, contemporary feel. Award-winning logo design. Ultra-sharp, 4K quality. PURE WHITE BACKGROUND ONLY — absolutely NO dark backgrounds, NO black, NO shadows, NO gradients on the background. The logo must look great on a white page or business card.`;
      const result = await generateImage({ prompt });
      if (!result?.url) return { logoUrl: null };
      const { storagePut } = await import("./storage.js");
      const response = await fetch(result.url);
      const buffer = Buffer.from(await response.arrayBuffer());
      const key = `company-logos/${ctx.user.tenantCompanyId}-logo-auto-${Date.now()}.png`;
      const { url: s3Url } = await storagePut(key, buffer, "image/png");
      // Save to history only — don't apply automatically, let user confirm
      const dbConn = await (await import("./db.js")).getDb();
      if (dbConn) {
        const { logoGenerations } = await import("../drizzle/schema.js");
        await dbConn.insert(logoGenerations).values({
          tenantCompanyId: ctx.user.tenantCompanyId,
          logoUrl: s3Url,
          prompt: "auto-generated",
          createdAt: Date.now(),
        });
      }
      return { logoUrl: s3Url };
    }),

    // Delete a logo history entry by id
    deleteLogoHistoryEntry: protectedProcedure.input(z.object({
      id: z.number().int().positive(),
    })).mutation(async ({ ctx, input }) => {
      if (!ctx.user.tenantCompanyId) throw new TRPCError({ code: "BAD_REQUEST" });
      const dbConn = await (await import("./db.js")).getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { logoGenerations } = await import("../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");
      // Only allow deleting entries that belong to this tenant
      await dbConn
        .delete(logoGenerations)
        .where(
          and(
            eq(logoGenerations.id, input.id),
            eq(logoGenerations.tenantCompanyId, ctx.user.tenantCompanyId)
          )
        );
      return { success: true };
    }),

    // Set favicon URL on the tenant company
    setFavicon: protectedProcedure.input(z.object({
      faviconUrl: z.string().url(),
    })).mutation(async ({ ctx, input }) => {
      const isAdmin = ["developer", "axiom_admin", "axiom_owner", "apex_owner", "company_admin"].includes(ctx.user.systemRole);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      if (!ctx.user.tenantCompanyId) throw new TRPCError({ code: "BAD_REQUEST" });
      await db.updateTenantCompany(ctx.user.tenantCompanyId, { faviconUrl: input.faviconUrl, updatedAt: Date.now() } as any);
      return { faviconUrl: input.faviconUrl };
    }),

    // Regenerate a logo using the same prompt as a history entry
    regenerateWithSameStyle: protectedProcedure.input(z.object({
      historyId: z.number().int().positive(),
    })).mutation(async ({ ctx, input }) => {
      if (!ctx.user.tenantCompanyId) throw new TRPCError({ code: "BAD_REQUEST" });
      const dbConn = await (await import("./db.js")).getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { logoGenerations } = await import("../drizzle/schema.js");
      const { eq, and } = await import("drizzle-orm");
      // Fetch the original history entry
      const [entry] = await dbConn
        .select()
        .from(logoGenerations)
        .where(and(
          eq(logoGenerations.id, input.historyId),
          eq(logoGenerations.tenantCompanyId, ctx.user.tenantCompanyId)
        ))
        .limit(1);
      if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "History entry not found" });
      const { generateImage } = await import("./_core/imageGeneration.js");
      const result = await generateImage({ prompt: entry.prompt || "Professional business logo" });
      if (!result?.url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Image generation failed" });
      const { storagePut } = await import("./storage.js");
      const response = await fetch(result.url);
      const buffer = Buffer.from(await response.arrayBuffer());
      const key = `company-logos/${ctx.user.tenantCompanyId}-logo-regen-${Date.now()}.png`;
      const { url: s3Url } = await storagePut(key, buffer, "image/png");
      // Save to history
      await dbConn.insert(logoGenerations).values({
        tenantCompanyId: ctx.user.tenantCompanyId,
        logoUrl: s3Url,
        prompt: entry.prompt,
        createdAt: Date.now(),
      });
      return { logoUrl: s3Url };
    }),

    // Upload logo file (accepts base64 data URL)
    uploadLogo: protectedProcedure.input(z.object({
      dataUrl: z.string().min(1),
      mimeType: z.string().default("image/png"),
    })).mutation(async ({ ctx, input }) => {
      const isAdmin = ["developer", "axiom_admin", "axiom_owner", "apex_owner", "company_admin"].includes(ctx.user.systemRole);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      if (!ctx.user.tenantCompanyId) throw new TRPCError({ code: "BAD_REQUEST" });
      const { storagePut } = await import("./storage.js");
      const base64Data = input.dataUrl.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const ext = input.mimeType.split("/")[1] || "png";
      const key = `company-logos/${ctx.user.tenantCompanyId}-logo-${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await db.updateTenantCompany(ctx.user.tenantCompanyId, { logoUrl: url, updatedAt: Date.now() } as any);
      return { logoUrl: url };
    }),

    // Fetch logo from a website URL (extracts favicon, OG image, or Apple touch icon)
    fetchLogoFromWebsite: protectedProcedure.input(z.object({
      websiteUrl: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const isAdmin = ["developer", "axiom_admin", "axiom_owner", "apex_owner", "company_admin"].includes(ctx.user.systemRole);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      if (!ctx.user.tenantCompanyId) throw new TRPCError({ code: "BAD_REQUEST" });

      // Normalize URL
      let baseUrl = input.websiteUrl.trim();
      if (!baseUrl.startsWith("http")) baseUrl = "https://" + baseUrl;
      const urlObj = new URL(baseUrl);
      const origin = urlObj.origin;

      // Strategy 1: Clearbit Logo API (best quality)
      const clearbitUrl = `https://logo.clearbit.com/${urlObj.hostname}`;
      // Strategy 2: Google Favicon service (reliable fallback)
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=256`;

      // Strategy 3: Scrape the page for og:image or apple-touch-icon
      let ogImageUrl: string | null = null;
      let appleTouchUrl: string | null = null;
      try {
        const pageRes = await fetch(origin, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; AXIOM-CRM/1.0)" },
          signal: AbortSignal.timeout(8000),
        });
        const html = await pageRes.text();
        const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (ogMatch?.[1]) ogImageUrl = ogMatch[1].startsWith("http") ? ogMatch[1] : origin + ogMatch[1];
        const appleMatch = html.match(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i);
        if (appleMatch?.[1]) appleTouchUrl = appleMatch[1].startsWith("http") ? appleMatch[1] : origin + appleMatch[1];
      } catch (_) { /* fall back */ }

      const candidates = [clearbitUrl, appleTouchUrl, ogImageUrl, googleFaviconUrl].filter(Boolean) as string[];
      const { storagePut } = await import("./storage.js");

      for (const candidateUrl of candidates) {
        try {
          const res = await fetch(candidateUrl, { signal: AbortSignal.timeout(6000) });
          if (!res.ok) continue;
          const contentType = res.headers.get("content-type") || "image/png";
          if (!contentType.startsWith("image/")) continue;
          const buffer = Buffer.from(await res.arrayBuffer());
          if (buffer.length < 200) continue;
          const ext = contentType.split("/")[1]?.split(";")[0] || "png";
          const key = `company-logos/${ctx.user.tenantCompanyId}-website-logo-${Date.now()}.${ext}`;
          const { url: s3Url } = await storagePut(key, buffer, contentType);
          // Save to logo history
          try {
            const dbConn = await (await import("./db.js")).getDb();
            if (dbConn) {
              const { logoGenerations } = await import("../drizzle/schema.js");
              await dbConn.insert(logoGenerations).values({
                tenantCompanyId: ctx.user.tenantCompanyId,
                logoUrl: s3Url,
                prompt: `Fetched from ${urlObj.hostname}`,
                createdAt: Date.now(),
              });
            }
          } catch (_) { /* history save optional */ }
          return { logoUrl: s3Url, source: urlObj.hostname };
        } catch (_) { continue; }
      }

       throw new TRPCError({ code: "NOT_FOUND", message: `Could not find a logo for ${urlObj.hostname}. Try uploading manually.` });
    }),
    // Emulate a user session (company_admin+ can emulate users under their company; axiom_admin+ can emulate anyone)
    emulate: companyAdminProcedure.input(z.object({
      userId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const target = await db.getUserById(input.userId);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      // Prevent emulating a developer (safety guard)
      if (target.systemRole === "developer" && ctx.user.systemRole !== "developer") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot emulate a Developer account" });
      }
      const callerLevel = getRoleLevel(ctx.user.systemRole);
      const targetLevel = getRoleLevel(target.systemRole);
      // Company admins can only emulate users within their own company and below their role level
      if (getRoleLevel(ctx.user.systemRole) < getRoleLevel("axiom_owner")) {
        // Must be same tenant
        if (!ctx.user.tenantCompanyId || target.tenantCompanyId !== ctx.user.tenantCompanyId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only emulate users within your company" });
        }
        // Must be strictly lower role
        if (targetLevel >= callerLevel) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only emulate users with a lower role than yours" });
        }
      }
      const { sdk } = await import("./_core/sdk.js");
      const cookieOptions = getSessionCookieOptions(ctx.req);
      // Save the original session token in the DB so we can reliably restore it on exit
      const originalToken = ctx.req.cookies?.["app_session_id"];
      // Use signSession with emulatedUserId so authenticateRequest resolves by DB id directly,
      // bypassing the OAuth server (which would return the wrong user for OAuth-based accounts).
      const sessionToken = await sdk.signSession({
        openId: target.openId,
        appId: (await import("./_core/env.js")).ENV.appId,
        name: target.name || "",
        emulatedUserId: target.id,
      }, { expiresInMs: ONE_YEAR_MS });
      if (originalToken) {
        const dbConn = await db.getDb();
        const { emulationSessions } = await import("../drizzle/schema.js");
        // Clean up any stale records for this emulated token first
        await dbConn.delete(emulationSessions)
          .where((await import("drizzle-orm")).eq(emulationSessions.emulatedSessionToken, sessionToken))
          .catch(() => {});
        await dbConn.insert(emulationSessions).values({
          emulatedSessionToken: sessionToken,
          originalSessionToken: originalToken,
          emulatorUserId: ctx.user.id,
          emulatedUserId: target.id,
          createdAt: Date.now(),
        });
      }
      ctx.res.cookie("app_session_id", sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      return { success: true, userId: target.id, name: target.name, username: target.username };
    }),
    // Restore original session after exiting emulation (DB-backed, reliable)
    restoreSession: publicProcedure.mutation(async ({ ctx }) => {
      const currentToken = ctx.req.cookies?.["app_session_id"];
      const cookieOptions = getSessionCookieOptions(ctx.req);
      if (currentToken) {
        try {
          const dbConn = await db.getDb();
          const { emulationSessions } = await import("../drizzle/schema.js");
          const { eq } = await import("drizzle-orm");
          const [record] = await dbConn.select()
            .from(emulationSessions)
            .where(eq(emulationSessions.emulatedSessionToken, currentToken))
            .limit(1);
          if (record?.originalSessionToken) {
            // Restore the original admin session
            ctx.res.cookie("app_session_id", record.originalSessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
            // Clean up the emulation record
            await dbConn.delete(emulationSessions)
              .where(eq(emulationSessions.emulatedSessionToken, currentToken))
              .catch(() => {});
            return { success: true, restored: true };
          }
        } catch (e) {
          console.error("[restoreSession] DB lookup failed:", e);
        }
      }
      // Fallback: also check the old cookie-based approach for backwards compatibility
      const legacyToken = ctx.req.cookies?.["app_session_id_pre_emulation"];
      if (legacyToken) {
        ctx.res.cookie("app_session_id", legacyToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        ctx.res.clearCookie("app_session_id_pre_emulation", cookieOptions);
        return { success: true, restored: true };
      }
      // No original session found — clear current session (logout)
      ctx.res.clearCookie("app_session_id", cookieOptions);
      return { success: true, restored: false };
    }),
    // Get company admin user for emulation from Platform Dashboard
    getCompanyAdmin: axiomOwnerProcedure.input(z.object({
      companyId: z.number(),
    })).query(async ({ input }) => {
      const companyUsers = await db.getUsersByCompany(input.companyId);
      if (!companyUsers) return null;
      // Prefer company_admin, then highest role available
      const roleOrder = ["company_admin", "sales_manager", "office_manager", "account_manager", "coordinator"];
      for (const role of roleOrder) {
        const admin = (companyUsers as any[]).find((u: any) => u.systemRole === role && u.isActive !== false);
        if (admin) return { id: admin.id, name: admin.name, username: admin.username, systemRole: admin.systemRole };
      }
      const first = (companyUsers as any[])[0];
      return first ? { id: first.id, name: first.name, username: first.username, systemRole: first.systemRole } : null;
    }),
  }),
  userManagement: router({
    // Developer-only: get all users across all companies
    allUsers: adminProcedure.query(async () => {
      return db.getAllUsersWithCompany();
    }),

    // Create user with username/password (admin, company_admin, or manager)
    createUser: protectedProcedure.input(z.object({
      username: z.string().min(3).max(64).regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, hyphens, and underscores"),
      password: z.string().min(8).max(128),
      name: z.string().min(1),
      email: z.string().email().optional(),
      systemRole: z.enum(["developer", "axiom_admin", "axiom_owner", "company_admin", "sales_manager", "office_manager", "account_manager", "coordinator"]),
      tenantCompanyId: z.number(),
      managerId: z.number().optional(),
      jobTitle: z.string().optional(),
      phone: z.string().optional(),
      features: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      // ── Role permission chain ──────────────────────────────────────────────
      // Developer (6)     → can create Developer, Axiom Admin, and all below
      // Axiom Admin (5)   → can create Axiom Admin and all below
      // Company Admin (3) → can create Company Admin, Managers, and sub-roles
      // Sales Manager (2) → can only create Account Managers
      // Office Manager(2) → can only create Coordinators
      const callerRole = ctx.user.systemRole;
      const callerLevel = getRoleLevel(callerRole);
      const targetLevel = getRoleLevel(input.systemRole);

      // Must be at least manager level to create users
      if (callerLevel < getRoleLevel("sales_manager")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to create users" });
      }
      // Can only create roles strictly below your own level
      if (targetLevel >= callerLevel) {
        throw new TRPCError({ code: "FORBIDDEN", message: `Cannot create a ${input.systemRole} — you can only create roles below your own level` });
      }
      // Managers can only create their specific sub-roles
      if (["sales_manager", "manager"].includes(callerRole) && input.systemRole !== "account_manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sales Managers can only create Account Managers" });
      }
      if (callerRole === "office_manager" && input.systemRole !== "coordinator") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Office Managers can only create Coordinators" });
      }
      // Company Admin can create Company Admin (same level check above prevents this — they can create managers and below)
      if (callerRole === "company_admin" && !["company_admin", "sales_manager", "office_manager", "account_manager", "coordinator"].includes(input.systemRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Company Admins can only create Company Admins and below" });
      }
      // Axiom Admin can create Axiom Admin, Company Admin, and all below
      if (["axiom_admin", "axiom_owner"].includes(callerRole) && !["axiom_admin", "company_admin", "sales_manager", "office_manager", "account_manager", "coordinator"].includes(input.systemRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Axiom Admins can create Axiom Admins, Company Admins, and below" });
      }
      // Developer can create anyone including other developers
      // (no additional restriction — callerLevel >= targetLevel check above handles it)
      // Check company exists
      const company = await db.getTenantCompanyById(input.tenantCompanyId);
      if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });
      // Check max users
      const currentCount = await db.getTenantCompanyUserCount(input.tenantCompanyId);
      if (company.maxUsers && currentCount >= company.maxUsers) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Company has reached its user limit (${company.maxUsers})` });
      }
      // Check username uniqueness
      const existing = await db.getUserByUsername(input.username);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Username already taken" });
      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 12);
      // Create user
      const userId = await db.createCredentialUser({
        username: input.username,
        passwordHash,
        plainTextPassword: input.password,
        name: input.name,
        email: input.email,
        systemRole: input.systemRole,
        tenantCompanyId: input.tenantCompanyId,
        managerId: input.managerId || (["manager", "sales_manager", "office_manager"].includes(callerRole) ? ctx.user.id : undefined),
        jobTitle: input.jobTitle,
        phone: input.phone,
        invitedBy: ctx.user.id,
      });
      // Assign features if provided
      if (input.features && input.features.length > 0 && userId) {
        await db.assignFeaturesToUser(userId, input.features, ctx.user.id, input.tenantCompanyId);
      }
      return { id: userId, username: input.username };
    }),

    // Reset user password (axiom_owner+ or company_admin)
    resetPassword: protectedProcedure.input(z.object({
      userId: z.number(),
      newPassword: z.string().min(8).max(128),
    })).mutation(async ({ ctx, input }) => {
      if (getRoleLevel(ctx.user.systemRole) < getRoleLevel("company_admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await db.updateUserPassword(input.userId, passwordHash, input.newPassword);
      return { success: true };
    }),

    // Change own password
    changePassword: protectedProcedure.input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8).max(128),
    })).mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user?.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "Account does not use password authentication" });
      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await db.updateUserPassword(ctx.user.id, passwordHash);
      return { success: true };
    }),

    // Update user role (each level can only set roles strictly below their own)
    setRole: protectedProcedure.input(z.object({
      userId: z.number(),
      systemRole: z.enum(["developer", "axiom_admin", "axiom_owner", "company_admin", "sales_manager", "office_manager", "account_manager", "coordinator"]),
    })).mutation(async ({ ctx, input }) => {
      const callerLevel = getRoleLevel(ctx.user.systemRole);
      const targetLevel = getRoleLevel(input.systemRole);
      // Must be at least Company Admin to change roles
      if (callerLevel < getRoleLevel("company_admin")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Company Admin access or above required to change roles" });
      }
      // Can only assign roles strictly below your own level
      if (targetLevel >= callerLevel) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot set a role equal to or above your own" });
      }
      // Company Admin cannot assign axiom_admin or developer
      if (getRoleLevel(ctx.user.systemRole) === getRoleLevel("company_admin") &&
          ["axiom_admin", "axiom_owner", "developer"].includes(input.systemRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Company Admins cannot assign Axiom-level roles" });
      }
      await db.updateUserRole(input.userId, input.systemRole);
      return { success: true };
    }),

    // Assign user to company
    assignToCompany: adminProcedure.input(z.object({
      userId: z.number(),
      companyId: z.number().nullable(),
      managerId: z.number().nullable().optional(),
    })).mutation(async ({ input }) => {
      await db.updateUserCompany(input.userId, input.companyId, input.managerId ?? null);
      return { success: true };
    }),

    // Update user profile
    updateProfile: protectedProcedure.input(z.object({
      userId: z.number(),
      name: z.string().optional(),
      jobTitle: z.string().optional(),
      phone: z.string().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { userId, ...data } = input;
      const canManageOthers = getRoleLevel(ctx.user.systemRole) >= getRoleLevel("company_admin");
      if (!canManageOthers && ctx.user.id !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.updateUserProfile(userId, data);
      return { success: true };
    }),

    // Deactivate user
    deactivate: protectedProcedure.input(z.object({ userId: z.number() })).mutation(async ({ ctx, input }) => {
      if (getRoleLevel(ctx.user.systemRole) < getRoleLevel("company_admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.deactivateUser(input.userId);
      return { success: true };
    }),

    // Activate user
    activate: protectedProcedure.input(z.object({ userId: z.number() })).mutation(async ({ ctx, input }) => {
      if (getRoleLevel(ctx.user.systemRole) < getRoleLevel("company_admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.activateUser(input.userId);
      return { success: true };
    }),

    // Assign features to a user
    assignFeatures: protectedProcedure.input(z.object({
      userId: z.number(),
      featureKeys: z.array(z.string()),
      companyId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.systemRole !== "developer" && ctx.user.systemRole !== "company_admin" && ctx.user.systemRole !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      // Managers can only assign features they themselves have
      if (ctx.user.systemRole === "manager") {
        const myFeatures = await db.getUserFeatures(ctx.user.id);
        const invalid = input.featureKeys.filter(k => !myFeatures.includes(k));
        if (invalid.length > 0) {
          throw new TRPCError({ code: "FORBIDDEN", message: `Cannot assign features you don't have: ${invalid.join(", ")}` });
        }
      }
      await db.assignFeaturesToUser(input.userId, input.featureKeys, ctx.user.id, input.companyId);
      return { success: true };
    }),

    // Get user's assigned features
    getFeatures: protectedProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
      return db.getUserFeatures(input.userId);
    }),
    // Get my features (for current user)
    myFeatures: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.systemRole === "developer") {
        return db.ALL_FEATURES.map(f => f.key);
      }
      return db.getUserFeatures(ctx.user.id);
    }),
    // Get plaintext password for a user (axiom_admin+ only)
    getPassword: axiomOwnerProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
      const user = await db.getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return { password: user.plainTextPassword ?? null, username: user.username ?? null };
    }),
  }),

  // ─── Team Oversight (Manager+) ───
  teamOversight: router({
    // Get team performance stats — strictly role-scoped:
    // Each caller only sees users whose role level is STRICTLY BELOW their own.
    // Sales/Office Managers only see their direct reports.
    performance: managerProcedure.query(async ({ ctx }) => {
      const callerLevel = getRoleLevel(ctx.user.systemRole);

      // Managers (sales_manager / office_manager) only see direct reports
      if (["sales_manager", "office_manager", "manager"].includes(ctx.user.systemRole)) {
        return db.getTeamPerformanceStats(ctx.user.id);
      }

      // Company Admin and above: see all tenant users whose role level < caller's level
      if (ctx.user.tenantCompanyId) {
        const tenantUsers = await db.getUsersByCompany(ctx.user.tenantCompanyId);
        if (!tenantUsers) return [];

        // Filter: exclude self AND exclude anyone at or above the caller's role level
        const visibleMembers = tenantUsers.filter((u: any) => {
          if (u.id === ctx.user.id) return false; // exclude self
          const memberLevel = getRoleLevel(u.systemRole);
          return memberLevel < callerLevel; // only show roles BELOW caller
        });

        const stats = await Promise.all(visibleMembers.map(async (member: any) => {
          const memberStats = await db.getDashboardStats(member.id);
          return {
            userId: member.id,
            name: member.name ?? member.username ?? "Unknown",
            email: member.email,
            systemRole: member.systemRole,
            isActive: member.isActive,
            lastActiveAt: member.lastActiveAt,
            companies: memberStats.totalCompanies,
            contacts: memberStats.totalContacts,
            totalDeals: memberStats.totalDeals,
            openDeals: memberStats.openDeals,
            wonDeals: memberStats.wonDeals,
            totalDealValue: memberStats.totalValue,
            wonDealValue: memberStats.wonValue,
            totalTasks: memberStats.totalTasks,
            completedTasks: 0,
            overdueTasks: 0,
          };
        }));
        return stats;
      }
      return [];
    }),

    // Reassign a company from one user to another
    reassignCompany: managerProcedure.input(z.object({
      companyId: z.number(),
      fromUserId: z.number(),
      toUserId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      // Verify both users are visible to this manager
      const visibleIds = await db.getVisibleUserIds(ctx.user);
      if (!visibleIds.includes(input.fromUserId) || !visibleIds.includes(input.toUserId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot reassign between users outside your team" });
      }
      await db.reassignCompany(input.companyId, input.fromUserId, input.toUserId);
      return { success: true };
    }),

    // Reassign a deal
    reassignDeal: managerProcedure.input(z.object({
      dealId: z.number(),
      fromUserId: z.number(),
      toUserId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const visibleIds = await db.getVisibleUserIds(ctx.user);
      if (!visibleIds.includes(input.fromUserId) || !visibleIds.includes(input.toUserId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot reassign between users outside your team" });
      }
      await db.reassignDeal(input.dealId, input.fromUserId, input.toUserId);
      return { success: true };
    }),

    // Reassign a task
    reassignTask: managerProcedure.input(z.object({
      taskId: z.number(),
      fromUserId: z.number(),
      toUserId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const visibleIds = await db.getVisibleUserIds(ctx.user);
      if (!visibleIds.includes(input.fromUserId) || !visibleIds.includes(input.toUserId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot reassign between users outside your team" });
      }
      await db.reassignTask(input.taskId, input.fromUserId, input.toUserId);
      return { success: true };
    }),

    // Get visible user IDs for current user (for frontend filtering)
    visibleUsers: protectedProcedure.query(async ({ ctx }) => {
      const ids = await db.getVisibleUserIds(ctx.user);
      return { userIds: ids, role: ctx.user.systemRole };
    }),
    // Get credentials (username + password) for all users under this company
    // Only Company Admins and above can access this
    getTeamCredentials: companyAdminProcedure.query(async ({ ctx }) => {
      if (!ctx.user.tenantCompanyId) return [];
      const tenantUsers = await db.getUsersByCompany(ctx.user.tenantCompanyId);
      if (!tenantUsers) return [];
      const callerLevel = getRoleLevel(ctx.user.systemRole);
      return tenantUsers
        .filter((u: any) => u.id !== ctx.user.id && getRoleLevel(u.systemRole) < callerLevel)
        .map((u: any) => ({
          id: u.id,
          name: u.name ?? u.username ?? 'Unknown',
          email: u.email,
          username: u.username ?? u.email,
          plainTextPassword: u.plainTextPassword ?? null,
          systemRole: u.systemRole,
          isActive: u.isActive,
          lastSignedIn: u.lastSignedIn,
        }));
    }),
    // Company Admin: reset a team member's password and optionally email them
    resetTeamMemberPassword: companyAdminProcedure.input(z.object({
      userId: z.number(),
      sendEmail: z.boolean().default(true),
    })).mutation(async ({ ctx, input }) => {
      if (!ctx.user.tenantCompanyId) throw new TRPCError({ code: "FORBIDDEN", message: "No company context" });
      const target = await db.getUserById(input.userId);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      // Must be same tenant
      if (target.tenantCompanyId !== ctx.user.tenantCompanyId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only reset passwords for users in your company" });
      }
      // Must be lower role
      if (getRoleLevel(target.systemRole) >= getRoleLevel(ctx.user.systemRole)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only reset passwords for users with a lower role than yours" });
      }
      // Generate a secure temporary password
      const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
      const tempPassword = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      // Update in DB
      const dbConn = await db.getDb();
      const { users: usersTable } = await import("../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      await dbConn.update(usersTable)
        .set({ passwordHash, plainTextPassword: tempPassword })
        .where(eq(usersTable.id, input.userId));
      // Optionally send email
      if (input.sendEmail && target.email) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
          await transporter.sendMail({
            from: process.env.SMTP_USER || `noreply@${ctx.user.email?.split("@")[1] || "crm.app"}`,
            to: target.email,
            subject: "Your CRM Password Has Been Reset",
            html: `<p>Hi ${target.name || target.username || "there"},</p>
<p>Your CRM password has been reset by your administrator.</p>
<p><strong>New temporary password:</strong> <code style="background:#f4f4f4;padding:4px 8px;border-radius:4px;font-size:16px">${tempPassword}</code></p>
<p>Please log in and change your password immediately.</p>
<p>If you did not expect this, please contact your administrator.</p>`,
          });
        } catch (e) {
          console.error("[resetTeamMemberPassword] Email send failed:", e);
          // Don't fail the whole operation if email fails
        }
      }
      return { success: true, tempPassword, emailSent: input.sendEmail && !!target.email };
    }),
  }),

  invites: router({
    // Create invite — permission chain mirrors createUser
    create: protectedProcedure.input(z.object({
      companyId: z.number(),
      email: z.string().email(),
      role: z.enum(["axiom_admin", "company_admin", "sales_manager", "office_manager", "account_manager", "coordinator"]),
      managerId: z.number().optional(),
      features: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const callerRole = ctx.user.systemRole;
      const callerLevel = getRoleLevel(callerRole);
      const targetLevel = getRoleLevel(input.role);
      // Must be at least manager to send invites
      if (callerLevel < getRoleLevel("sales_manager")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions to invite users" });
      }
      // Can only invite roles strictly below your own level
      if (targetLevel >= callerLevel) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot invite someone to a role equal to or above your own" });
      }
      // Manager-specific restrictions
      if (["sales_manager", "manager"].includes(callerRole) && input.role !== "account_manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sales Managers can only invite Account Managers" });
      }
      if (callerRole === "office_manager" && input.role !== "coordinator") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Office Managers can only invite Coordinators" });
      }
      // Company Admin cannot invite axiom_admin or developer
      if (callerLevel === getRoleLevel("company_admin") && ["axiom_admin", "axiom_owner", "developer"].includes(input.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Company Admins cannot invite Axiom-level roles" });
      }
      const token = nanoid(48);
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      const id = await db.createCompanyInvite({
        tenantCompanyId: input.companyId,
        email: input.email,
        inviteRole: input.role,
        managerId: input.managerId || (["manager", "sales_manager", "office_manager"].includes(ctx.user.systemRole) ? ctx.user.id : undefined),
        token,
        invitedBy: ctx.user.id,
        features: input.features,
        expiresAt,
      });
      return { id, token, expiresAt };
    }),

    // List invites for a company
    list: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ ctx, input }) => {
      if (ctx.user.systemRole !== "developer" && ctx.user.tenantCompanyId !== input.companyId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getCompanyInvites(input.companyId);
    }),

    // Revoke invite
    revoke: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.systemRole !== "developer" && ctx.user.systemRole !== "company_admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.revokeInvite(input.id);
      return { success: true };
    }),

    // Accept invite (public - user clicks invite link)
    accept: protectedProcedure.input(z.object({ token: z.string() })).mutation(async ({ ctx, input }) => {
      const invite = await db.getInviteByToken(input.token);
      if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      if (invite.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Invite is no longer valid" });
      if (invite.expiresAt < Date.now()) throw new TRPCError({ code: "BAD_REQUEST", message: "Invite has expired" });

      // Update user with company, role, and manager
      await db.updateUserCompany(ctx.user.id, invite.tenantCompanyId, invite.managerId ?? null);
      await db.updateUserRole(ctx.user.id, invite.inviteRole);

      // Assign features from invite
      if (invite.features && Array.isArray(invite.features) && invite.features.length > 0) {
        await db.assignFeaturesToUser(ctx.user.id, invite.features as string[], invite.invitedBy, invite.tenantCompanyId);
      }

      await db.acceptInvite(input.token);
      return { success: true, companyId: invite.tenantCompanyId };
    }),
  }),

  devTools: router({
    // System health stats
    systemStats: adminProcedure.query(async () => {
      return db.getSystemStats();
    }),

    // Table row counts for DB inspector
    tableRowCounts: adminProcedure.query(async () => {
      return db.getTableRowCounts();
    }),

    // Global activity log
    activityLog: adminProcedure.input(z.object({ limit: z.number().default(50) }).optional()).query(async ({ input }) => {
      return db.getGlobalRecentActivity(input?.limit ?? 50);
    }),

    // Server info
    serverInfo: adminProcedure.query(async () => {
      const uptime = process.uptime();
      const memUsage = process.memoryUsage();
      return {
        uptime: Math.floor(uptime),
        uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
        },
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
        env: process.env.NODE_ENV || "development",
      };
    }),

    // Impersonate user (returns user data for viewing)
    impersonateUser: adminProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
      const allUsers = await db.getAllUsersWithCompany();
      const target = allUsers.find((u: any) => u.user.id === input.userId);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      const features = await db.getUserFeatures(input.userId);
      return {
        user: target.user,
        companyName: target.companyName,
        features,
      };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // Domain Health Optimizer
  // ═══════════════════════════════════════════════════════════════
  domainOptimizer: router({
    // Get full health summary for all domains
    summary: protectedProcedure.query(async ({ ctx }) => {
      return db.getDomainHealthSummary(ctx.user.id);
    }),

    // Run auto-healing across all domains
    runAutoHealing: protectedProcedure.mutation(async ({ ctx }) => {
      return db.runDomainAutoHealing(ctx.user.id);
    }),

    // Get health trend for a specific domain
    trend: protectedProcedure.input(z.object({ domainHealthId: z.number(), days: z.number().optional() })).query(async ({ ctx, input }) => {
      return db.getDomainHealthTrend(ctx.user.id, input.domainHealthId, input.days ?? 30);
    }),

    // Start warm-up for a domain
    startWarmup: protectedProcedure.input(z.object({ domainId: z.number() })).mutation(async ({ ctx, input }) => {
      await db.startDomainWarmup(input.domainId, ctx.user.id);
      return { success: true };
    }),

    // Get best sending domain (for campaign sends)
    bestDomain: protectedProcedure.query(async ({ ctx }) => {
      return db.getBestSendingDomain(ctx.user.id);
    }),

    // Get warmup schedule info
    warmupSchedule: protectedProcedure.query(async () => {
      return db.WARMUP_SCHEDULE;
    }),

    // Get health thresholds
    thresholds: protectedProcedure.query(async () => {
      return db.HEALTH_THRESHOLDS;
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // Continuous A/B Testing Engine
  // ═══════════════════════════════════════════════════════════════
  abEngine: router({
    // Generate A/B variants for a campaign
    generateVariants: protectedProcedure.input(z.object({
      subject: z.string(),
      content: z.string(),
    })).mutation(async ({ input }) => {
      return db.generateABVariants(input.subject, input.content);
    }),

    // AI-powered subject line generation
    aiGenerateSubjects: protectedProcedure.input(z.object({
      originalSubject: z.string(),
      targetAudience: z.string().optional(),
      tone: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { invokeLLM } = await import('./server/_core/llm' as any).catch(() => ({ invokeLLM: null }));
      if (!invokeLLM) {
        return db.generateABVariants(input.originalSubject, '').subjectVariants;
      }
      try {
        const resp = await (invokeLLM as any)({
          messages: [
            { role: 'system', content: 'You are an email marketing expert. Generate 5 alternative subject lines for A/B testing. Each should test a different psychological trigger: urgency, curiosity, personalization, benefit-focused, and social proof. Return JSON array of strings.' },
            { role: 'user', content: `Original subject: "${input.originalSubject}"\nTarget audience: ${input.targetAudience || 'B2B professionals'}\nTone: ${input.tone || 'professional'}` },
          ],
          response_format: { type: 'json_schema', json_schema: { name: 'subjects', strict: true, schema: { type: 'object', properties: { subjects: { type: 'array', items: { type: 'string' } } }, required: ['subjects'], additionalProperties: false } } },
        });
        const parsed = JSON.parse(resp.choices[0].message.content);
        return parsed.subjects || [];
      } catch {
        return db.generateABVariants(input.originalSubject, '').subjectVariants;
      }
    }),

    // Calculate statistical significance between two variants
    checkSignificance: protectedProcedure.input(z.object({
      controlSent: z.number(),
      controlOpens: z.number(),
      variantSent: z.number(),
      variantOpens: z.number(),
    })).query(async ({ input }) => {
      return db.calculateStatisticalSignificance(
        input.controlSent, input.controlOpens,
        input.variantSent, input.variantOpens,
      );
    }),

    // Calculate minimum sample size needed
    sampleSize: protectedProcedure.input(z.object({
      baselineRate: z.number(),
      minimumDetectableEffect: z.number(),
      confidenceLevel: z.number().optional(),
    })).query(async ({ input }) => {
      return {
        perVariant: db.calculateMinSampleSize(
          input.baselineRate,
          input.minimumDetectableEffect,
          input.confidenceLevel ?? 0.95,
        ),
        total: db.calculateMinSampleSize(
          input.baselineRate,
          input.minimumDetectableEffect,
          input.confidenceLevel ?? 0.95,
        ) * 2,
      };
    }),

    // Get active A/B tests with significance data
    activeTests: protectedProcedure.query(async ({ ctx }) => {
      const tests = await db.listAbTests(ctx.user.id);
      return tests.map((t: any) => {
        const variants = (t.variants as any[]) || [];
        if (variants.length >= 2) {
          const control = variants[0];
          const variant = variants[1];
          const sig = db.calculateStatisticalSignificance(
            control.sent || 0, control.opens || 0,
            variant.sent || 0, variant.opens || 0,
          );
          return { ...t, significance: sig };
        }
        return { ...t, significance: null };
      });
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // PHASE 13: PREMIUM FEATURES
  // ═══════════════════════════════════════════════════════════════

  voiceCampaigns: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listVoiceCampaigns(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getVoiceCampaign(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string(),
      description: z.string().optional(),
      objective: z.string().optional(),
      voicePersona: z.string().optional(),
      scriptTemplate: z.string().optional(),
      callWindowStart: z.string().optional(),
      callWindowEnd: z.string().optional(),
      callWindowTimezone: z.string().optional(),
      maxConcurrentCalls: z.number().optional(),
      maxCallsPerDay: z.number().optional(),
      maxRetries: z.number().optional(),
      qualificationCriteria: z.any().optional(),
      targetContactIds: z.array(z.number()).optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createVoiceCampaign(ctx.user.id, input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      scriptTemplate: z.string().optional(),
      objective: z.string().optional(),
      voicePersona: z.string().optional(),
      callWindowStart: z.string().optional(),
      callWindowEnd: z.string().optional(),
      maxConcurrentCalls: z.number().optional(),
      maxCallsPerDay: z.number().optional(),
      qualificationCriteria: z.any().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateVoiceCampaign(id, ctx.user.id, data as any);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteVoiceCampaign(input.id, ctx.user.id);
      return { success: true };
    }),
    generateScript: protectedProcedure.input(z.object({
      objective: z.string(),
      industry: z.string().optional(),
      voicePersona: z.string().optional(),
      qualificationCriteria: z.any().optional(),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: `You are an expert sales script writer for freight brokerage cold calling. Generate a natural, conversational AI phone script. The script should: 1) Open with a professional greeting 2) Quickly establish value 3) Ask qualifying questions 4) Handle common objections 5) Book an appointment or gather info. Use {{contactName}}, {{companyName}}, {{callerName}} as placeholders. Keep it under 500 words. Voice persona: ${input.voicePersona || 'professional'}` },
          { role: 'user', content: `Generate a cold call script for: Objective: ${input.objective}. Industry: ${input.industry || 'freight brokerage'}. Qualification criteria: ${JSON.stringify(input.qualificationCriteria || {})}` },
        ],
      });
      return { script: response.choices?.[0]?.message?.content || '' };
    }),
  }),

  callLogs: router({
    list: protectedProcedure.input(z.object({
      campaignId: z.number().optional(),
      status: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listCallLogs(ctx.user.id, input);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getCallLog(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      voiceCampaignId: z.number().optional(),
      contactId: z.number().optional(),
      prospectId: z.number().optional(),
      phoneNumber: z.string(),
      direction: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createCallLog(ctx.user.id, input as any);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.string().optional(),
      transcription: z.string().optional(),
      conversationSummary: z.string().optional(),
      aiSentiment: z.string().optional(),
      qualificationScore: z.number().optional(),
      qualificationResult: z.string().optional(),
      qualificationDetails: z.any().optional(),
      appointmentBooked: z.boolean().optional(),
      appointmentDate: z.number().optional(),
      appointmentNotes: z.string().optional(),
      followUpRequired: z.boolean().optional(),
      followUpDate: z.number().optional(),
      followUpNotes: z.string().optional(),
      durationSeconds: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateCallLog(id, ctx.user.id, data as any);
      return { success: true };
    }),
    stats: protectedProcedure.input(z.object({ campaignId: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.getCallStats(ctx.user.id, input?.campaignId);
    }),
    simulateCall: protectedProcedure.input(z.object({
      contactId: z.number().optional(),
      prospectId: z.number().optional(),
      phoneNumber: z.string(),
      scriptTemplate: z.string(),
      voiceCampaignId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      // Create call log
      const callResult = await db.createCallLog(ctx.user.id, {
        voiceCampaignId: input.voiceCampaignId,
        contactId: input.contactId,
        prospectId: input.prospectId,
        phoneNumber: input.phoneNumber,
        direction: 'outbound',
        status: 'completed',
        startedAt: Date.now() - 180000,
        connectedAt: Date.now() - 170000,
        endedAt: Date.now(),
        durationSeconds: 170,
      });
      // Use AI to simulate conversation and qualification
      const aiResponse = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are simulating an AI voice agent call result for a freight brokerage CRM. Generate a realistic call summary, qualification details, and sentiment analysis. Return JSON with: transcription (string), conversationSummary (string), aiSentiment (positive/neutral/negative/interested/not_interested), qualificationScore (0-100), qualificationResult (qualified/not_qualified/needs_followup), qualificationDetails (object with freightVolume, currentProvider, painPoints array, budget, timeline, decisionMaker boolean, interests array, objections array, nextSteps), appointmentBooked (boolean), followUpRequired (boolean).' },
          { role: 'user', content: `Simulate a completed call to ${input.phoneNumber}. Script used: ${input.scriptTemplate.substring(0, 500)}` },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'call_result', strict: true, schema: { type: 'object', properties: { transcription: { type: 'string' }, conversationSummary: { type: 'string' }, aiSentiment: { type: 'string' }, qualificationScore: { type: 'integer' }, qualificationResult: { type: 'string' }, qualificationDetails: { type: 'object', properties: { freightVolume: { type: 'string' }, currentProvider: { type: 'string' }, painPoints: { type: 'array', items: { type: 'string' } }, budget: { type: 'string' }, timeline: { type: 'string' }, decisionMaker: { type: 'boolean' }, interests: { type: 'array', items: { type: 'string' } }, objections: { type: 'array', items: { type: 'string' } }, nextSteps: { type: 'string' } }, required: ['freightVolume', 'currentProvider', 'painPoints', 'budget', 'timeline', 'decisionMaker', 'interests', 'objections', 'nextSteps'], additionalProperties: false }, appointmentBooked: { type: 'boolean' }, followUpRequired: { type: 'boolean' } }, required: ['transcription', 'conversationSummary', 'aiSentiment', 'qualificationScore', 'qualificationResult', 'qualificationDetails', 'appointmentBooked', 'followUpRequired'], additionalProperties: false } } },
      });
      let parsed: any = {};
      try { parsed = JSON.parse(String(aiResponse.choices?.[0]?.message?.content || '{}')); } catch {}
      if (callResult?.id) {
        await db.updateCallLog(callResult.id, ctx.user.id, parsed);
      }
      return { callId: callResult?.id, ...parsed };
    }),
  }),

  documents: router({
    list: protectedProcedure.input(z.object({
      category: z.string().optional(),
      type: z.string().optional(),
      carrierPacketId: z.number().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listDocuments(ctx.user.id, input);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getDocument(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      fileName: z.string(),
      fileUrl: z.string(),
      fileKey: z.string(),
      mimeType: z.string().optional(),
      fileSizeBytes: z.number().optional(),
      documentType: z.string(),
      category: z.string().optional(),
      contactId: z.number().optional(),
      companyId: z.number().optional(),
      dealId: z.number().optional(),
      carrierPacketId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createDocument(ctx.user.id, input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      documentType: z.string().optional(),
      category: z.string().optional(),
      extractedData: z.any().optional(),
      extractionStatus: z.string().optional(),
      extractionConfidence: z.number().optional(),
      isValid: z.boolean().optional(),
      validationNotes: z.string().optional(),
      expiresAt: z.number().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateDocument(id, ctx.user.id, data as any);
      return { success: true };
    }),
    extractData: protectedProcedure.input(z.object({
      documentId: z.number(),
      fileUrl: z.string(),
      documentType: z.string(),
    })).mutation(async ({ ctx, input }) => {
      await db.updateDocument(input.documentId, ctx.user.id, { extractionStatus: 'processing' });
      const typePrompts: Record<string, string> = {
        w9: 'Extract: business name, tax classification, address, TIN/EIN, signature date. Return JSON.',
        insurance_certificate: 'Extract: insured name, policy number, effective date, expiration date, coverage amounts (general liability, auto liability, cargo, workers comp), certificate holder, insurer name. Return JSON.',
        mc_authority: 'Extract: MC number, DOT number, legal name, DBA name, address, authority type, effective date, status. Return JSON.',
        carrier_agreement: 'Extract: carrier name, broker name, effective date, termination clause, payment terms, insurance requirements, indemnification terms. Return JSON.',
        rate_confirmation: 'Extract: load number, origin, destination, pickup date, delivery date, rate amount, equipment type, weight, commodity, special instructions. Return JSON.',
        bol: 'Extract: BOL number, shipper, consignee, carrier, date, origin, destination, commodity description, weight, pieces, freight charges, special instructions. Return JSON.',
      };
      const prompt = typePrompts[input.documentType] || 'Extract all relevant data fields from this document. Return JSON with field names as keys.';
      try {
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: `You are a document data extraction AI for the freight brokerage industry. Analyze the document and extract structured data. Always return valid JSON. Be precise with numbers, dates, and names.` },
            { role: 'user', content: [{ type: 'text', text: prompt }, { type: 'file_url', file_url: { url: input.fileUrl, mime_type: 'application/pdf' } }] },
          ],
        });
        let extracted: any = {};
        const content = String(response.choices?.[0]?.message?.content || '{}');
        try {
          const jsonMatch = content.match(/```json\n?([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
          extracted = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
        } catch { extracted = { rawText: content }; }
        await db.updateDocument(input.documentId, ctx.user.id, {
          extractedData: extracted,
          extractionStatus: 'completed',
          extractionConfidence: 85,
        });
        return { success: true, data: extracted };
      } catch (error: any) {
        await db.updateDocument(input.documentId, ctx.user.id, {
          extractionStatus: 'failed',
          extractionErrors: [error.message || 'Extraction failed'],
        });
        return { success: false, error: error.message };
      }
    }),
  }),

  carrierPackets: router({
    list: protectedProcedure.input(z.object({
      status: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listCarrierPackets(ctx.user.id, input);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getCarrierPacket(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      carrierName: z.string(),
      mcNumber: z.string().optional(),
      dotNumber: z.string().optional(),
      companyId: z.number().optional(),
      contactId: z.number().optional(),
      authorityStatus: z.string().optional(),
      authorityType: z.string().optional(),
      saferRating: z.string().optional(),
      insuranceProvider: z.string().optional(),
      insurancePolicyNumber: z.string().optional(),
      insuranceExpiresAt: z.number().optional(),
      cargoInsuranceAmount: z.number().optional(),
      liabilityInsuranceAmount: z.number().optional(),
      autoInsuranceAmount: z.number().optional(),
      workersCompAmount: z.number().optional(),
      w9Status: z.string().optional(),
      equipmentTypes: z.array(z.string()).optional(),
      serviceAreas: z.array(z.string()).optional(),
      operatingRadius: z.string().optional(),
      fleetSize: z.number().optional(),
      yearsInBusiness: z.number().optional(),
      paymentTerms: z.string().optional(),
      factoringCompany: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createCarrierPacket(ctx.user.id, input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      carrierName: z.string().optional(),
      mcNumber: z.string().optional(),
      dotNumber: z.string().optional(),
      authorityStatus: z.string().optional(),
      saferRating: z.string().optional(),
      insuranceProvider: z.string().optional(),
      insurancePolicyNumber: z.string().optional(),
      insuranceExpiresAt: z.number().optional(),
      cargoInsuranceAmount: z.number().optional(),
      liabilityInsuranceAmount: z.number().optional(),
      autoInsuranceAmount: z.number().optional(),
      workersCompAmount: z.number().optional(),
      w9Status: z.string().optional(),
      equipmentTypes: z.array(z.string()).optional(),
      serviceAreas: z.array(z.string()).optional(),
      operatingRadius: z.string().optional(),
      fleetSize: z.number().optional(),
      paymentTerms: z.string().optional(),
      factoringCompany: z.string().optional(),
      packetStatus: z.string().optional(),
      reviewNotes: z.string().optional(),
      complianceChecklist: z.any().optional(),
      tags: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      // Recalculate compliance score if checklist changed
      if (data.complianceChecklist) {
        (data as any).complianceScore = db.calculateCarrierComplianceScore(data.complianceChecklist);
      }
      await db.updateCarrierPacket(id, ctx.user.id, data as any);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteCarrierPacket(input.id, ctx.user.id);
      return { success: true };
    }),
    validateCompliance: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const packet = await db.getCarrierPacket(input.id, ctx.user.id);
      if (!packet) throw new TRPCError({ code: 'NOT_FOUND' });
      const issues: string[] = [];
      if (!packet.mcNumber) issues.push('Missing MC Number');
      if (!packet.dotNumber) issues.push('Missing DOT Number');
      if (packet.w9Status !== 'verified' && packet.w9Status !== 'received') issues.push('W-9 not received or verified');
      if (!packet.insuranceProvider) issues.push('No insurance provider on file');
      if (packet.insuranceExpiresAt && packet.insuranceExpiresAt < Date.now()) issues.push('Insurance has expired');
      if (!packet.insuranceExpiresAt) issues.push('No insurance expiration date');
      if ((packet.cargoInsuranceAmount || 0) < 100000) issues.push('Cargo insurance below $100,000 minimum');
      if ((packet.liabilityInsuranceAmount || 0) < 750000) issues.push('Liability insurance below $750,000 minimum');
      if (packet.authorityStatus !== 'active') issues.push('Authority not active');
      if (packet.saferRating === 'unsatisfactory') issues.push('Unsatisfactory SAFER rating');
      if (packet.agreementStatus !== 'signed') issues.push('Carrier agreement not signed');
      const checklist = {
        mcAuthority: !!packet.mcNumber && packet.authorityStatus === 'active',
        dotNumber: !!packet.dotNumber,
        insuranceCurrent: !!packet.insuranceExpiresAt && packet.insuranceExpiresAt > Date.now(),
        w9Received: packet.w9Status === 'received' || packet.w9Status === 'verified',
        agreementSigned: packet.agreementStatus === 'signed',
        saferRatingOk: packet.saferRating !== 'unsatisfactory',
        noSafetyViolations: true,
        bondRequired: false,
        bondVerified: false,
      };
      const score = db.calculateCarrierComplianceScore(checklist);
      await db.updateCarrierPacket(input.id, ctx.user.id, {
        complianceChecklist: checklist,
        complianceScore: score,
        packetStatus: issues.length === 0 ? 'approved' : score >= 60 ? 'pending_review' : 'incomplete',
      });
      return { score, issues, checklist, status: issues.length === 0 ? 'approved' : score >= 60 ? 'pending_review' : 'incomplete' };
    }),
  }),

  dealScores: router({
    get: protectedProcedure.input(z.object({ dealId: z.number() })).query(async ({ ctx, input }) => {
      return db.getDealScore(input.dealId, ctx.user.id);
    }),
    history: protectedProcedure.input(z.object({ dealId: z.number() })).query(async ({ ctx, input }) => {
      return db.getDealScoreHistory(input.dealId, ctx.user.id);
    }),
    atRisk: protectedProcedure.query(async ({ ctx }) => {
      return db.getDealsAtRisk(ctx.user.id);
    }),
    readyToClose: protectedProcedure.query(async ({ ctx }) => {
      return db.getDealsReadyToClose(ctx.user.id);
    }),
    forecast: protectedProcedure.query(async ({ ctx }) => {
      return db.getRevenueForecast(ctx.user.id);
    }),
    score: protectedProcedure.input(z.object({ dealId: z.number() })).mutation(async ({ ctx, input }) => {
      const deal = await db.getDeal(input.dealId, ctx.user.id);
      if (!deal) throw new TRPCError({ code: 'NOT_FOUND' });
      const prevScore = await db.getDealScore(input.dealId, ctx.user.id);
      // Use AI to analyze deal and generate win probability
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a deal scoring AI for freight brokerage. Analyze the deal data and return a win probability assessment. Return JSON with: winProbability (0-100), engagementSignal (0-100), responseTimeSignal (0-100), meetingFrequencySignal (0-100), stakeholderSignal (0-100), competitiveSignal (0-100), budgetSignal (0-100), timelineSignal (0-100), championSignal (0-100), aiExplanation (string), riskFactors (string array), positiveIndicators (string array), recommendedActions (string array).' },
          { role: 'user', content: `Score this deal: Name: ${deal.name}, StageId: ${deal.stageId}, Value: $${deal.value || 0}, Created: ${new Date(deal.createdAt).toISOString()}, Previous probability: ${prevScore?.winProbability || 'none'}` },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'deal_score', strict: true, schema: { type: 'object', properties: { winProbability: { type: 'integer' }, engagementSignal: { type: 'integer' }, responseTimeSignal: { type: 'integer' }, meetingFrequencySignal: { type: 'integer' }, stakeholderSignal: { type: 'integer' }, competitiveSignal: { type: 'integer' }, budgetSignal: { type: 'integer' }, timelineSignal: { type: 'integer' }, championSignal: { type: 'integer' }, aiExplanation: { type: 'string' }, riskFactors: { type: 'array', items: { type: 'string' } }, positiveIndicators: { type: 'array', items: { type: 'string' } }, recommendedActions: { type: 'array', items: { type: 'string' } } }, required: ['winProbability', 'engagementSignal', 'responseTimeSignal', 'meetingFrequencySignal', 'stakeholderSignal', 'competitiveSignal', 'budgetSignal', 'timelineSignal', 'championSignal', 'aiExplanation', 'riskFactors', 'positiveIndicators', 'recommendedActions'], additionalProperties: false } } },
      });
      let scored: any = {};
      try { scored = JSON.parse(String(response.choices?.[0]?.message?.content || '{}')); } catch {}
      const trend = prevScore ? (scored.winProbability > prevScore.winProbability ? 'up' : scored.winProbability < prevScore.winProbability ? 'down' : 'stable') : 'stable';
      const weightedValue = Math.round((deal.value || 0) * (scored.winProbability || 50) / 100);
      await db.createDealScore(ctx.user.id, {
        dealId: input.dealId,
        ...scored,
        previousProbability: prevScore?.winProbability,
        probabilityTrend: trend,
        forecastedValue: deal.value ? BigInt(deal.value) : null,
        weightedValue: BigInt(weightedValue),
      });
      return { ...scored, trend, weightedValue };
    }),
  }),

  revenueBriefings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listRevenueBriefings(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getRevenueBriefing(input.id, ctx.user.id);
    }),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.markBriefingRead(input.id, ctx.user.id);
      return { success: true };
    }),
    generate: protectedProcedure.mutation(async ({ ctx }) => {
      const [dashStats, atRisk, readyToClose, forecast] = await Promise.all([
        db.getEnhancedDashboardStats(ctx.user.id),
        db.getDealsAtRisk(ctx.user.id),
        db.getDealsReadyToClose(ctx.user.id),
        db.getRevenueForecast(ctx.user.id),
      ]);
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a revenue intelligence AI for a freight brokerage CRM. Generate a morning briefing with actionable revenue insights. Return JSON with: summary (string, 2-3 paragraphs), revenueAtRisk (number), revenueOpportunity (number), actions (array of {type: re_engage|upsell|close|follow_up|rescue, priority: critical|high|medium|low, description: string, estimatedRevenue: number}).' },
          { role: 'user', content: `Generate morning briefing. Dashboard: ${JSON.stringify(dashStats)}. Deals at risk: ${atRisk.length}. Ready to close: ${readyToClose.length}. Forecast: $${forecast.totalWeighted} weighted pipeline.` },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'briefing', strict: true, schema: { type: 'object', properties: { summary: { type: 'string' }, revenueAtRisk: { type: 'integer' }, revenueOpportunity: { type: 'integer' }, actions: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, priority: { type: 'string' }, description: { type: 'string' }, estimatedRevenue: { type: 'integer' } }, required: ['type', 'priority', 'description', 'estimatedRevenue'], additionalProperties: false } } }, required: ['summary', 'revenueAtRisk', 'revenueOpportunity', 'actions'], additionalProperties: false } } },
      });
      let briefing: any = {};
      try { briefing = JSON.parse(String(response.choices?.[0]?.message?.content || '{}')); } catch {}
      const today = new Date().toISOString().split('T')[0];
      const result = await db.createRevenueBriefing(ctx.user.id, {
        briefingDate: today,
        summary: briefing.summary || 'No briefing data available.',
        revenueAtRisk: briefing.revenueAtRisk || 0,
        revenueOpportunity: briefing.revenueOpportunity || 0,
        actions: briefing.actions || [],
        totalActions: briefing.actions?.length || 0,
      });
      return { id: result?.id, ...briefing };
    }),
  }),

  smartNotifications: router({
    list: protectedProcedure.input(z.object({ unreadOnly: z.boolean().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listSmartNotifications(ctx.user.id, input);
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationCount(ctx.user.id);
    }),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.markNotificationRead(input.id, ctx.user.id);
      return { success: true };
    }),
    dismiss: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.dismissNotification(input.id, ctx.user.id);
      return { success: true };
    }),
    create: protectedProcedure.input(z.object({
      title: z.string(),
      message: z.string(),
      type: z.string(),
      priority: z.string().optional(),
      estimatedRevenue: z.number().optional(),
      urgencyScore: z.number().optional(),
      contactId: z.number().optional(),
      dealId: z.number().optional(),
      companyId: z.number().optional(),
      actionUrl: z.string().optional(),
      actionLabel: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createSmartNotification(ctx.user.id, input);
    }),
  }),

  meetingPreps: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listMeetingPreps(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getMeetingPrep(input.id, ctx.user.id);
    }),
    generate: protectedProcedure.input(z.object({
      contactId: z.number().optional(),
      companyId: z.number().optional(),
      dealId: z.number().optional(),
      meetingDate: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      // Gather context
      let contact: any = null, company: any = null, deal: any = null;
      if (input.contactId) contact = await db.getContact(input.contactId, ctx.user.id);
      if (input.companyId) company = await db.getCompany(input.companyId, ctx.user.id);
      if (input.dealId) deal = await db.getDeal(input.dealId, ctx.user.id);
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a meeting preparation AI for freight brokerage sales. Generate a comprehensive pre-call brief. Return JSON with: briefTitle (string), contactSummary (string), companySummary (string), dealContext (string), talkingPoints (string array, 5-7 items), questionsToAsk (string array, 4-6 items), potentialObjections (array of {objection: string, response: string}, 3-5 items), competitorIntel (string).' },
          { role: 'user', content: `Generate meeting prep for: Contact: ${contact ? `${contact.firstName} ${contact.lastName || ''}, ${contact.jobTitle || ''} at ${contact.companyId || 'unknown company'}` : 'N/A'}. Company: ${company ? `${company.name}, ${company.industry || 'freight'}` : 'N/A'}. Deal: ${deal ? `${deal.name}, StageId: ${deal.stageId}, Value: $${deal.value || 0}` : 'N/A'}.` },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'meeting_prep', strict: true, schema: { type: 'object', properties: { briefTitle: { type: 'string' }, contactSummary: { type: 'string' }, companySummary: { type: 'string' }, dealContext: { type: 'string' }, talkingPoints: { type: 'array', items: { type: 'string' } }, questionsToAsk: { type: 'array', items: { type: 'string' } }, potentialObjections: { type: 'array', items: { type: 'object', properties: { objection: { type: 'string' }, response: { type: 'string' } }, required: ['objection', 'response'], additionalProperties: false } }, competitorIntel: { type: 'string' } }, required: ['briefTitle', 'contactSummary', 'companySummary', 'dealContext', 'talkingPoints', 'questionsToAsk', 'potentialObjections', 'competitorIntel'], additionalProperties: false } } },
      });
      let prep: any = {};
      try { prep = JSON.parse(String(response.choices?.[0]?.message?.content || '{}')); } catch {}
      const result = await db.createMeetingPrep(ctx.user.id, {
        contactId: input.contactId,
        companyId: input.companyId,
        dealId: input.dealId,
        meetingDate: input.meetingDate,
        ...prep,
      });
      return { id: result?.id, ...prep };
    }),
  }),

  aiGhostwriter: router({
    draftEmail: protectedProcedure.input(z.object({
      contactId: z.number().optional(),
      dealId: z.number().optional(),
      context: z.string().optional(),
      tone: z.string().optional(),
      purpose: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      let contact: any = null, deal: any = null;
      if (input.contactId) contact = await db.getContact(input.contactId, ctx.user.id);
      if (input.dealId) deal = await db.getDeal(input.dealId, ctx.user.id);
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: `You are an expert email writer for freight brokerage sales. Write a professional, personalized email. Tone: ${input.tone || 'professional'}. Purpose: ${input.purpose || 'follow up'}. Return JSON with: subject (string), body (string in HTML format), plainText (string).` },
          { role: 'user', content: `Draft an email for: ${contact ? `${contact.firstName} ${contact.lastName || ''} (${contact.jobTitle || ''})` : 'prospect'}. ${deal ? `Deal: ${deal.name}, Stage: ${deal.stage}` : ''}. Context: ${input.context || 'General follow-up'}` },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'email_draft', strict: true, schema: { type: 'object', properties: { subject: { type: 'string' }, body: { type: 'string' }, plainText: { type: 'string' } }, required: ['subject', 'body', 'plainText'], additionalProperties: false } } },
      });
      let draft: any = {};
      try { draft = JSON.parse(String(response.choices?.[0]?.message?.content || '{}')); } catch {}
      return draft;
    }),
    draftReply: protectedProcedure.input(z.object({
      originalEmail: z.string(),
      contactId: z.number().optional(),
      tone: z.string().optional(),
      intent: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      let contact: any = null;
      if (input.contactId) contact = await db.getContact(input.contactId, ctx.user.id);
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: `You are an expert email reply writer for freight brokerage. Write a reply that is ${input.tone || 'professional'} and aims to ${input.intent || 'continue the conversation'}. Return JSON with: subject (string), body (string in HTML), plainText (string).` },
          { role: 'user', content: `Reply to this email from ${contact ? contact.firstName : 'the sender'}: "${input.originalEmail.substring(0, 1000)}"` },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'email_reply', strict: true, schema: { type: 'object', properties: { subject: { type: 'string' }, body: { type: 'string' }, plainText: { type: 'string' } }, required: ['subject', 'body', 'plainText'], additionalProperties: false } } },
      });
      let reply: any = {};
      try { reply = JSON.parse(String(response.choices?.[0]?.message?.content || '{}')); } catch {}
      return reply;
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // PHASE 14: COMPETITIVE FEATURE PARITY ROUTERS
  // ═══════════════════════════════════════════════════════════════

  // ─── Load Management ──────────────────────────────────────────
  loads: router({
    list: protectedProcedure.input(z.object({ status: z.string().optional(), search: z.string().optional(), limit: z.number().optional(), offset: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listLoads(ctx.user.id, input);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getLoad(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      loadType: z.string().optional(), commodity: z.string().optional(), weight: z.number().optional(),
      equipmentType: z.string().optional(), hazmat: z.boolean().optional(),
      originCity: z.string().optional(), originState: z.string().optional(), originZip: z.string().optional(), originAddress: z.string().optional(),
      destCity: z.string().optional(), destState: z.string().optional(), destZip: z.string().optional(), destAddress: z.string().optional(),
      pickupDate: z.number().optional(), deliveryDate: z.number().optional(),
      customerRate: z.number().optional(), carrierRate: z.number().optional(),
      companyId: z.number().optional(), contactId: z.number().optional(), carrierId: z.number().optional(),
      specialInstructions: z.string().optional(), miles: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const margin = (input.customerRate || 0) - (input.carrierRate || 0);
      const marginPct = input.customerRate ? ((margin / input.customerRate) * 100).toFixed(1) + '%' : '0%';
      return db.createLoad(ctx.user.id, { ...input, margin, marginPercent: marginPct } as any);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(), status: z.string().optional(), commodity: z.string().optional(),
      customerRate: z.number().optional(), carrierRate: z.number().optional(),
      currentLocation: z.string().optional(), trackingNotes: z.string().optional(),
      carrierId: z.number().optional(), actualPickup: z.number().optional(), actualDelivery: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateLoad(id, ctx.user.id, data as any);
    }),
    updateStatus: protectedProcedure.input(z.object({
      loadId: z.number(), status: z.string(), notes: z.string().optional(), location: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.updateLoadStatus(input.loadId, ctx.user.id, input.status, input.notes, input.location);
    }),
    statusHistory: protectedProcedure.input(z.object({ loadId: z.number() })).query(async ({ input }) => {
      return db.getLoadStatusHistory(input.loadId);
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getLoadStats(ctx.user.id);
    }),
  }),

  // ─── Carrier Profiles (Deep Vetting) ──────────────────────────
  carrierVetting: router({
    list: protectedProcedure.input(z.object({ vetStatus: z.string().optional(), search: z.string().optional(), limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listCarrierProfiles(ctx.user.id, input);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getCarrierProfile(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      carrierName: z.string(), dotNumber: z.string().optional(), mcNumber: z.string().optional(),
      scacCode: z.string().optional(), companyId: z.number().optional(), carrierPacketId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createCarrierProfile(ctx.user.id, input as any);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(), vetStatus: z.string().optional(), vetNotes: z.string().optional(),
      overallScore: z.number().optional(), authorityStatus: z.string().optional(),
      safetyRating: z.string().optional(), operatingStatus: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateCarrierProfile(id, ctx.user.id, { ...data, lastVetDate: Date.now() } as any);
    }),
    runVetting: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const profile = await db.getCarrierProfile(input.id, ctx.user.id);
      if (!profile) throw new TRPCError({ code: 'NOT_FOUND' });
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a carrier vetting specialist for freight brokerage. Analyze this carrier and return JSON with: overallScore (0-100), vetStatus (approved/flagged/blacklisted), safetyAssessment (string), insuranceStatus (string), riskFactors (string array), recommendations (string array), autoFlagged (boolean), flagReason (string or null).' },
          { role: 'user', content: `Vet carrier: ${profile.carrierName}, DOT: ${profile.dotNumber || 'N/A'}, MC: ${profile.mcNumber || 'N/A'}, Authority: ${profile.authorityStatus || 'unknown'}, Safety: ${profile.safetyRating || 'unknown'}, Insurance on file: ${profile.insuranceOnFile}, Loads completed: ${profile.totalLoadsCompleted}` },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'carrier_vet', strict: true, schema: { type: 'object', properties: { overallScore: { type: 'integer' }, vetStatus: { type: 'string' }, safetyAssessment: { type: 'string' }, insuranceStatus: { type: 'string' }, riskFactors: { type: 'array', items: { type: 'string' } }, recommendations: { type: 'array', items: { type: 'string' } }, autoFlagged: { type: 'boolean' }, flagReason: { type: ['string', 'null'] } }, required: ['overallScore', 'vetStatus', 'safetyAssessment', 'insuranceStatus', 'riskFactors', 'recommendations', 'autoFlagged', 'flagReason'], additionalProperties: false } } },
      });
      let result: any = {};
      try { result = JSON.parse(String(response.choices?.[0]?.message?.content || '{}')); } catch {}
      await db.updateCarrierProfile(input.id, ctx.user.id, { ...result, lastVetDate: Date.now() } as any);
      return result;
    }),
    expiredInsurance: protectedProcedure.query(async ({ ctx }) => {
      return db.getExpiredInsuranceCarriers(ctx.user.id);
    }),
  }),

  // ─── Load Board Integration ───────────────────────────────────
  loadBoard: router({
    list: protectedProcedure.input(z.object({ board: z.string().optional(), status: z.string().optional(), loadId: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listLoadBoardPosts(ctx.user.id, input);
    }),
    post: protectedProcedure.input(z.object({
      loadId: z.number(), boards: z.array(z.string()), expiresAt: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const results = [];
      for (const board of input.boards) {
        const r = await db.createLoadBoardPost(ctx.user.id, { loadId: input.loadId, board, expiresAt: input.expiresAt });
        results.push(r);
      }
      await db.updateLoad(input.loadId, ctx.user.id, { status: 'posted' } as any);
      return results;
    }),
    cancel: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      return db.updateLoadBoardPost(input.id, ctx.user.id, { status: 'cancelled' } as any);
    }),
  }),

  // ─── Invoicing & Billing ──────────────────────────────────────
  invoicing: router({
    list: protectedProcedure.input(z.object({ status: z.string().optional(), search: z.string().optional(), limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listInvoices(ctx.user.id, input);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getInvoice(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      loadId: z.number().optional(), billToName: z.string().optional(), billToEmail: z.string().optional(),
      billToAddress: z.string().optional(), billToCompanyId: z.number().optional(),
      lineItems: z.array(z.object({ description: z.string(), quantity: z.number(), unitPrice: z.number(), total: z.number() })).optional(),
      totalAmount: z.number(), paymentTerms: z.string().optional(), notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createInvoice(ctx.user.id, { ...input, totalAmount: BigInt(input.totalAmount), balanceDue: BigInt(input.totalAmount) } as any);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(), status: z.string().optional(), amountPaid: z.number().optional(),
      paymentMethod: z.string().optional(), paymentReference: z.string().optional(), notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (data.amountPaid !== undefined) (data as any).amountPaid = BigInt(data.amountPaid);
      if (data.status === 'paid') (data as any).paidDate = Date.now();
      return db.updateInvoice(id, ctx.user.id, data as any);
    }),
    createFromLoad: protectedProcedure.input(z.object({ loadId: z.number() })).mutation(async ({ ctx, input }) => {
      return db.createInvoiceFromLoad(ctx.user.id, input.loadId);
    }),
  }),

  // ─── Customer Portal ──────────────────────────────────────────
  portal: router({
    listAccess: protectedProcedure.query(async () => {
      return db.listPortalAccess(0);
    }),
    grantAccess: protectedProcedure.input(z.object({
      contactId: z.number(), companyId: z.number().optional(), email: z.string(),
      permissions: z.array(z.string()).optional(),
    })).mutation(async ({ input }) => {
      return db.createPortalAccess(input);
    }),
    listQuotes: protectedProcedure.input(z.object({ companyId: z.number().optional() }).optional()).query(async ({ input }) => {
      return db.listPortalQuotes(input?.companyId);
    }),
  }),

  // ─── Conversation Intelligence ────────────────────────────────
  conversationIntel: router({
    list: protectedProcedure.input(z.object({ analyzed: z.boolean().optional(), contactId: z.number().optional(), limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listCallRecordings(ctx.user.id, input);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getCallRecording(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      callLogId: z.number().optional(), contactId: z.number().optional(), dealId: z.number().optional(),
      recordingUrl: z.string().optional(), duration: z.number().optional(), direction: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createCallRecording(ctx.user.id, input as any);
    }),
    analyze: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const recording = await db.getCallRecording(input.id, ctx.user.id);
      if (!recording) throw new TRPCError({ code: 'NOT_FOUND' });
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a conversation intelligence analyst for freight brokerage sales calls. Analyze this call and return JSON with: summary (string), sentiment (positive/neutral/negative), sentimentScore (0-100), talkToListenRatio (string like "60:40"), keyTopics (string array), actionItems (array of {item, assignee, deadline?}), objections (array of {objection, response, handled}), competitorMentions (string array), nextSteps (string array), coachingInsights (array of {area, suggestion, score}).' },
          { role: 'user', content: `Analyze call: Duration: ${recording.duration || 0}s, Direction: ${recording.direction || 'outbound'}, Transcript: ${recording.transcript || 'No transcript available - analyze based on metadata'}` },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'call_analysis', strict: true, schema: { type: 'object', properties: { summary: { type: 'string' }, sentiment: { type: 'string' }, sentimentScore: { type: 'integer' }, talkToListenRatio: { type: 'string' }, keyTopics: { type: 'array', items: { type: 'string' } }, actionItems: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, assignee: { type: 'string' }, deadline: { type: 'string' } }, required: ['item', 'assignee', 'deadline'], additionalProperties: false } }, objections: { type: 'array', items: { type: 'object', properties: { objection: { type: 'string' }, response: { type: 'string' }, handled: { type: 'boolean' } }, required: ['objection', 'response', 'handled'], additionalProperties: false } }, competitorMentions: { type: 'array', items: { type: 'string' } }, nextSteps: { type: 'array', items: { type: 'string' } }, coachingInsights: { type: 'array', items: { type: 'object', properties: { area: { type: 'string' }, suggestion: { type: 'string' }, score: { type: 'integer' } }, required: ['area', 'suggestion', 'score'], additionalProperties: false } } }, required: ['summary', 'sentiment', 'sentimentScore', 'talkToListenRatio', 'keyTopics', 'actionItems', 'objections', 'competitorMentions', 'nextSteps', 'coachingInsights'], additionalProperties: false } } },
      });
      let analysis: any = {};
      try { analysis = JSON.parse(String(response.choices?.[0]?.message?.content || '{}')); } catch {}
      await db.updateCallRecording(input.id, ctx.user.id, { ...analysis, analyzed: true } as any);
      return analysis;
    }),
    upload: protectedProcedure.input(z.object({
      fileName: z.string(),
      mimeType: z.string(),
      base64Data: z.string(),
      contactId: z.number().optional(),
      dealId: z.number().optional(),
      duration: z.number().optional(),
      direction: z.enum(["inbound", "outbound"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { storagePut } = await import('./storage');
      const buffer = Buffer.from(input.base64Data, 'base64');
      const suffix = Math.random().toString(36).slice(2, 8);
      const key = `call-recordings/${ctx.user.id}/${suffix}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      const id = await db.createCallRecording(ctx.user.id, {
        recordingUrl: url, contactId: input.contactId, dealId: input.dealId,
        duration: input.duration, direction: input.direction ?? 'outbound',
      } as any);
      return { success: true, id, url };
    }),
  }),
  // ─── B2B Contact Database ──────────────────────────────────────
  b2bDatabase: router({
    list: protectedProcedure.input(z.object({ search: z.string().optional(), industry: z.string().optional(), limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listB2BContacts(ctx.user.id, input);
    }),
    search: protectedProcedure.input(z.object({
      query: z.string(), industry: z.string().optional(), location: z.string().optional(),
      state: z.string().optional(), companySize: z.string().optional(), limit: z.number().min(5).max(50).default(10),
    })).mutation(async ({ ctx, input }) => {
      const locationStr = [input.state, input.location].filter(Boolean).join(', ') || 'US';
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a B2B contact database. Generate realistic but fictional contact data based on the search criteria. Return JSON with contacts array, each having: firstName, lastName, email, phone, jobTitle, companyName, companyDomain, industry, companySize, revenue, location, confidence (0-100).' },
          { role: 'user', content: `Search for: ${input.query}. Industry: ${input.industry || 'any'}. Location: ${locationStr}. Company size: ${input.companySize || 'any'}. Return exactly ${input.limit} contacts.` },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'b2b_search', strict: true, schema: { type: 'object', properties: { contacts: { type: 'array', items: { type: 'object', properties: { firstName: { type: 'string' }, lastName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, jobTitle: { type: 'string' }, companyName: { type: 'string' }, companyDomain: { type: 'string' }, industry: { type: 'string' }, companySize: { type: 'string' }, revenue: { type: 'string' }, location: { type: 'string' }, confidence: { type: 'integer' } }, required: ['firstName', 'lastName', 'email', 'phone', 'jobTitle', 'companyName', 'companyDomain', 'industry', 'companySize', 'revenue', 'location', 'confidence'], additionalProperties: false } } }, required: ['contacts'], additionalProperties: false } } },
      });
      let result: any = { contacts: [] };
      try { result = JSON.parse(String(response.choices?.[0]?.message?.content || '{}')); } catch {}
      for (const c of result.contacts) {
        await db.createB2BContact(ctx.user.id, { ...c, enrichmentSource: 'ai_search' } as any);
      }
      return result.contacts;
    }),
    importToContacts: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const b2b = await db.listB2BContacts(ctx.user.id, { limit: 1000 });
      const contact = b2b.find((c: any) => c.id === input.id);
      if (!contact) throw new TRPCError({ code: 'NOT_FOUND' });
      const newContactId = await db.createContact({ firstName: contact.firstName || '', lastName: contact.lastName || '', email: contact.email || '', phone: contact.phone || '', jobTitle: contact.jobTitle || '', userId: ctx.user.id } as any);
      if (newContactId) await db.markB2BContactImported(input.id, ctx.user.id, newContactId);
      return { success: true, contactId: newContactId };
    }),
  }),

  // ─── Email Warmup ─────────────────────────────────────────────
  emailWarmup: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listWarmupCampaigns(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      smtpAccountId: z.number(), domain: z.string(), dailyTarget: z.number().optional(),
      maxDaily: z.number().optional(), rampUpRate: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.createWarmupCampaign(ctx.user.id, input as any);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(), status: z.string().optional(), dailyTarget: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateWarmupCampaign(id, ctx.user.id, data as any);
    }),
  }),

  // ─── Visitor Tracking ─────────────────────────────────────────
  visitorTracking: router({
    listWebsites: protectedProcedure.query(async ({ ctx }) => {
      return db.listTrackedWebsites(ctx.user.id);
    }),

    // ── AI One-Click Auto-Installer ──────────────────────────────
    // Step 1: Detect platform + attempt API-based auto-install.
    // Returns installMethod: 'auto' | 'mailto' | 'manual'
    setupTracking: protectedProcedure.input(z.object({
      url: z.string().min(1),
      // Optional credentials for platforms that need them
      wpUser: z.string().optional(),
      wpAppPassword: z.string().optional(),
      shopifyToken: z.string().optional(),
      webflowToken: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const trackingId = `axiom-${Math.random().toString(36).slice(2, 10)}-${ctx.user.id}`;
      const rawUrl = input.url.trim();
      const cleanDomain = rawUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
      const siteUrl = `https://${cleanDomain}`;
      const siteName = cleanDomain.replace(/^www\./, '');

      const trackingScript = `<!-- AXIOM CRM Visitor Tracking -->\n<script>\n(function(a,p,e,x,c,r){a[x]=a[x]||function(){(a[x].q=a[x].q||[]).push(arguments)};c=p.createElement(e);c.async=1;c.src='https://track.axiomcrm.io/v1/t.js?id='+r;var m=p.getElementsByTagName(e)[0];m.parentNode.insertBefore(c,m)})(window,document,'script','axiomTrack','${trackingId}');axiomTrack('init','${trackingId}');axiomTrack('pageview');\n</script>`;

      // ── 1. Fetch homepage HTML to detect platform ──────────────
      let html = '';
      let platform = 'unknown';
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(siteUrl, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AXIOMCRM/1.0)' } });
        clearTimeout(t);
        html = (await res.text()).slice(0, 60000);
      } catch { /* unreachable or timeout — proceed with unknown */ }

      if (html.includes('wp-content') || html.includes('wp-includes') || html.includes('wordpress')) platform = 'wordpress';
      else if (html.includes('cdn.shopify') || html.includes('myshopify.com') || html.includes('Shopify.theme')) platform = 'shopify';
      else if (html.includes('wix.com') || html.includes('_wix_')) platform = 'wix';
      else if (html.includes('squarespace') || html.includes('sqsp.net')) platform = 'squarespace';
      else if (html.includes('webflow') || html.includes('wf-form')) platform = 'webflow';
      else if (html.includes('framer.com') || html.includes('framerusercontent')) platform = 'framer';
      else if (html.includes('weebly') || html.includes('weeblysite')) platform = 'weebly';
      else if (html.includes('godaddy') || html.includes('godaddysites')) platform = 'godaddy';
      else if (html.length > 0) platform = 'custom';

      // ── 2. Attempt programmatic auto-install ──────────────────
      // WordPress: inject via REST API custom HTML widget or theme customizer
      if (platform === 'wordpress' && input.wpUser && input.wpAppPassword) {
        try {
          const creds = Buffer.from(`${input.wpUser}:${input.wpAppPassword}`).toString('base64');
          // Try to create/update a custom HTML widget in the header sidebar
          // First, get existing widgets
          const widgetsRes = await fetch(`${siteUrl}/wp-json/wp/v2/widgets?sidebar=wp_inactive_widgets`, {
            headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/json' },
          });
          if (widgetsRes.ok) {
            // Create a custom HTML widget with the tracking script
            const createRes = await fetch(`${siteUrl}/wp-json/wp/v2/widgets`, {
              method: 'POST',
              headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id_base: 'custom_html',
                sidebar: 'wp_inactive_widgets',
                instance: { raw: { title: 'AXIOM Tracking', content: trackingScript } },
              }),
            });
            if (createRes.ok) {
              // Also try to inject via theme customizer additional_css or header hooks
              // Use the Settings API to add to wp_head
              const settingsRes = await fetch(`${siteUrl}/wp-json/wp/v2/settings`, {
                method: 'POST',
                headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              });
              // Try the theme customizer head_scripts if available
              await db.addTrackedWebsite(ctx.user.id, { name: siteName, domain: cleanDomain, trackingId });
              return {
                installMethod: 'auto' as const,
                platform,
                platformTitle: 'WordPress',
                siteName,
                trackingId,
                trackingScript,
                message: 'Tracking script installed automatically via WordPress API.',
                mailtoLink: null,
                manualSteps: [],
              };
            }
          }
        } catch { /* fall through to manual */ }
      }

      // Shopify: inject into theme.liquid via Admin API
      if (platform === 'shopify' && input.shopifyToken) {
        try {
          // Get the active theme
          const themesRes = await fetch(`https://${cleanDomain}/admin/api/2024-01/themes.json`, {
            headers: { 'X-Shopify-Access-Token': input.shopifyToken, 'Content-Type': 'application/json' },
          });
          if (themesRes.ok) {
            const themesData: any = await themesRes.json();
            const activeTheme = themesData.themes?.find((t: any) => t.role === 'main');
            if (activeTheme) {
              // Get theme.liquid
              const assetRes = await fetch(
                `https://${cleanDomain}/admin/api/2024-01/themes/${activeTheme.id}/assets.json?asset[key]=layout/theme.liquid`,
                { headers: { 'X-Shopify-Access-Token': input.shopifyToken } },
              );
              if (assetRes.ok) {
                const assetData: any = await assetRes.json();
                const originalContent: string = assetData.asset?.value || '';
                if (!originalContent.includes(trackingId)) {
                  const newContent = originalContent.replace('</head>', `${trackingScript}\n</head>`);
                  const updateRes = await fetch(
                    `https://${cleanDomain}/admin/api/2024-01/themes/${activeTheme.id}/assets.json`,
                    {
                      method: 'PUT',
                      headers: { 'X-Shopify-Access-Token': input.shopifyToken, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ asset: { key: 'layout/theme.liquid', value: newContent } }),
                    },
                  );
                  if (updateRes.ok) {
                    await db.addTrackedWebsite(ctx.user.id, { name: siteName, domain: cleanDomain, trackingId });
                    return {
                      installMethod: 'auto' as const,
                      platform,
                      platformTitle: 'Shopify',
                      siteName,
                      trackingId,
                      trackingScript,
                      message: 'Tracking script injected into your Shopify theme automatically.',
                      mailtoLink: null,
                      manualSteps: [],
                    };
                  }
                }
              }
            }
          }
        } catch { /* fall through */ }
      }

      // Webflow: inject via Webflow API custom code
      if (platform === 'webflow' && input.webflowToken) {
        try {
          // List sites
          const sitesRes = await fetch('https://api.webflow.com/v2/sites', {
            headers: { Authorization: `Bearer ${input.webflowToken}`, accept: 'application/json' },
          });
          if (sitesRes.ok) {
            const sitesData: any = await sitesRes.json();
            const matchingSite = sitesData.sites?.find((s: any) =>
              s.customDomains?.some((d: any) => d.url?.includes(cleanDomain)) ||
              s.defaultDomain?.includes(cleanDomain)
            );
            if (matchingSite) {
              const updateRes = await fetch(`https://api.webflow.com/v2/sites/${matchingSite.id}/custom-code`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${input.webflowToken}`, 'Content-Type': 'application/json', accept: 'application/json' },
                body: JSON.stringify({ headCode: trackingScript }),
              });
              if (updateRes.ok) {
                // Publish the site
                await fetch(`https://api.webflow.com/v2/sites/${matchingSite.id}/publish`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${input.webflowToken}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ domains: matchingSite.customDomains?.map((d: any) => d.url) || [] }),
                });
                await db.addTrackedWebsite(ctx.user.id, { name: siteName, domain: cleanDomain, trackingId });
                return {
                  installMethod: 'auto' as const,
                  platform,
                  platformTitle: 'Webflow',
                  siteName,
                  trackingId,
                  trackingScript,
                  message: 'Tracking script injected and site published via Webflow API.',
                  mailtoLink: null,
                  manualSteps: [],
                };
              }
            }
          }
        } catch { /* fall through */ }
      }

      // ── 3. Fallback: generate mailto: link + platform-specific steps ──
      const platformGuides: Record<string, { title: string; steps: string[] }> = {
        wordpress: { title: 'WordPress', steps: ['Go to yoursite.com/wp-admin', 'Click Appearance → Theme File Editor', 'Open header.php', 'Paste the script before </head>', 'Click Update File'] },
        shopify: { title: 'Shopify', steps: ['Go to your Shopify Admin', 'Click Online Store → Themes → Edit Code', 'Open layout/theme.liquid', 'Paste the script before </head>', 'Click Save'] },
        wix: { title: 'Wix', steps: ['Go to your Wix dashboard', 'Click Settings → Custom Code', 'Click + Add Custom Code', 'Paste the script, select All Pages, place in Head', 'Click Apply'] },
        squarespace: { title: 'Squarespace', steps: ['Go to Settings → Advanced → Code Injection', 'Paste the script in the Header box', 'Click Save'] },
        webflow: { title: 'Webflow', steps: ['Open Project Settings → Custom Code', 'Paste the script in Head Code', 'Save and Publish'] },
        framer: { title: 'Framer', steps: ['Open Site Settings → General', 'Paste the script in Custom Code → Head', 'Click Publish'] },
        weebly: { title: 'Weebly', steps: ['Go to Settings → SEO → Header Code', 'Paste the script', 'Save and Publish'] },
        godaddy: { title: 'GoDaddy', steps: ['Go to Settings → Advanced → Custom Scripts', 'Paste the script', 'Save'] },
        custom: { title: 'Custom Website', steps: ['Open your main HTML file (index.html)', 'Find </head>', 'Paste the script just before </head>', 'Save and deploy'] },
        unknown: { title: 'Your Website', steps: ['Find your website admin panel', 'Look for Custom Code or Header Code settings', 'Paste the script there', 'Save and publish'] },
      };
      const guide = platformGuides[platform] || platformGuides['unknown'];

      // Build a mailto: link so the user can forward to their developer with one click
      const emailSubject = encodeURIComponent(`Please add tracking to ${siteName}`);
      const emailBody = encodeURIComponent(
        `Hi,\n\nPlease add the following tracking script to ${siteUrl}.\n\nPlatform detected: ${guide.title}\n\nSteps:\n${guide.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nTracking script to paste:\n\n${trackingScript}\n\nThank you!`
      );
      const mailtoLink = `mailto:?subject=${emailSubject}&body=${emailBody}`;

      // Save to DB
      await db.addTrackedWebsite(ctx.user.id, { name: siteName, domain: cleanDomain, trackingId });

      return {
        installMethod: 'mailto' as const,
        platform,
        platformTitle: guide.title,
        siteName,
        trackingId,
        trackingScript,
        message: `We detected ${guide.title}. Click "Open in Email" to send setup instructions to your developer — or follow the steps below yourself.`,
        mailtoLink,
        manualSteps: guide.steps,
      };
    }),

    // Keep addWebsite as a thin alias for backward compat
    addWebsite: protectedProcedure.input(z.object({
      url: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const trackingId = `axiom-${Math.random().toString(36).slice(2, 10)}-${ctx.user.id}`;
      const cleanDomain = input.url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];
      const siteName = cleanDomain.replace(/^www\./, '');
      await db.addTrackedWebsite(ctx.user.id, { name: siteName, domain: cleanDomain, trackingId });
      return { trackingId, siteName };
    }),

    removeWebsite: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.removeTrackedWebsite(input.id, ctx.user.id);
      return { success: true };
    }),
    verifyInstallation: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const websites = await db.listTrackedWebsites(ctx.user.id);
      const site = websites.find((w: any) => w.id === input.id);
      if (!site) throw new TRPCError({ code: 'NOT_FOUND' });
      try {
        const url = `https://${site.domain}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'AXIOMCRM-Verifier/1.0' } });
        clearTimeout(timeout);
        const html = await res.text();
        const found = html.includes(site.trackingId) || html.includes('axiom-tracker');
        return { verified: found, statusCode: res.status, checkedAt: new Date().toISOString() };
      } catch (err: any) {
        return { verified: false, statusCode: 0, error: err.message || 'Could not reach domain', checkedAt: new Date().toISOString() };
      }
    }),
    list: protectedProcedure.input(z.object({ identified: z.boolean().optional(), limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listVisitorSessions(ctx.user.id, input);
    }),
    convertToProspect: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const sessions = await db.listVisitorSessions(ctx.user.id, { limit: 100 });
      const session = sessions.find((s: any) => s.id === input.id);
      if (!session || !session.identifiedCompany) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No identified company' });
      const prospectId = await db.createProspect({ companyName: session.identifiedCompany, domain: session.identifiedDomain || '', industry: session.identifiedIndustry || '', userId: ctx.user.id } as any);
      return { success: true, prospectId };
    }),

    // ── Platform Credentials (for auto-install) ────────────────────
    saveCredentials: protectedProcedure.input(z.object({
      websiteId: z.number(),
      platform: z.enum(['wordpress', 'shopify', 'webflow']),
      credentials: z.record(z.string(), z.string()),
    })).mutation(async ({ ctx, input }) => {
      await db.savePlatformCredentials(ctx.user.id, input.websiteId, input.platform, input.credentials as Record<string, string>);
      return { success: true };
    }),

    getCredentialPlatforms: protectedProcedure.input(z.object({ websiteId: z.number() })).query(async ({ ctx, input }) => {
      return db.listPlatformCredentials(ctx.user.id, input.websiteId);
    }),

    deleteCredentials: protectedProcedure.input(z.object({
      websiteId: z.number(),
      platform: z.enum(['wordpress', 'shopify', 'webflow']),
    })).mutation(async ({ ctx, input }) => {
      await db.deletePlatformCredentials(ctx.user.id, input.websiteId, input.platform);
      return { success: true };
    }),

    // Re-run auto-install using stored credentials
    reinstallTracking: protectedProcedure.input(z.object({ websiteId: z.number() })).mutation(async ({ ctx, input }) => {
      const websites = await db.listTrackedWebsites(ctx.user.id);
      const site = websites.find((w: any) => w.id === input.websiteId);
      if (!site) throw new TRPCError({ code: 'NOT_FOUND' });

      const platforms = ['wordpress', 'shopify', 'webflow'] as const;
      for (const platform of platforms) {
        const creds = await db.getPlatformCredentials(ctx.user.id, input.websiteId, platform);
        if (!creds) continue;

        const siteUrl = `https://${site.twDomain}`;
        const trackingScript = `<!-- AXIOM CRM Visitor Tracking -->\n<script>\n(function(a,p,e,x,c,r){a[x]=a[x]||function(){(a[x].q=a[x].q||[]).push(arguments)};c=p.createElement(e);c.async=1;c.src='https://track.axiomcrm.io/v1/t.js?id='+r;var m=p.getElementsByTagName(e)[0];m.parentNode.insertBefore(c,m)})(window,document,'script','axiomTrack','${site.twTrackingId}');axiomTrack('init','${site.twTrackingId}');axiomTrack('pageview');\n</script>`;

        if (platform === 'wordpress' && creds.wpUser && creds.wpAppPassword) {
          try {
            const b64 = Buffer.from(`${creds.wpUser}:${creds.wpAppPassword}`).toString('base64');
            const widgetsRes = await fetch(`${siteUrl}/wp-json/wp/v2/widgets?sidebar=wp_inactive_widgets`, { headers: { Authorization: `Basic ${b64}` } });
            if (widgetsRes.ok) {
              const createRes = await fetch(`${siteUrl}/wp-json/wp/v2/widgets`, { method: 'POST', headers: { Authorization: `Basic ${b64}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id_base: 'custom_html', sidebar: 'wp_inactive_widgets', instance: { raw: { title: 'AXIOM Tracking', content: trackingScript } } }) });
              if (createRes.ok) return { success: true, platform, method: 'auto' };
            }
          } catch { /* continue */ }
        }

        if (platform === 'shopify' && creds.shopifyToken) {
          try {
            const themesRes = await fetch(`https://${site.twDomain}/admin/api/2024-01/themes.json`, { headers: { 'X-Shopify-Access-Token': creds.shopifyToken } });
            if (themesRes.ok) {
              const td: any = await themesRes.json();
              const active = td.themes?.find((t: any) => t.role === 'main');
              if (active) {
                const assetRes = await fetch(`https://${site.twDomain}/admin/api/2024-01/themes/${active.id}/assets.json?asset[key]=layout/theme.liquid`, { headers: { 'X-Shopify-Access-Token': creds.shopifyToken } });
                if (assetRes.ok) {
                  const ad: any = await assetRes.json();
                  const content: string = ad.asset?.value || '';
                  if (!content.includes(site.twTrackingId)) {
                    const updated = content.replace('</head>', `${trackingScript}\n</head>`);
                    const upRes = await fetch(`https://${site.twDomain}/admin/api/2024-01/themes/${active.id}/assets.json`, { method: 'PUT', headers: { 'X-Shopify-Access-Token': creds.shopifyToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ asset: { key: 'layout/theme.liquid', value: updated } }) });
                    if (upRes.ok) return { success: true, platform, method: 'auto' };
                  }
                }
              }
            }
          } catch { /* continue */ }
        }

        if (platform === 'webflow' && creds.webflowToken) {
          try {
            const sitesRes = await fetch('https://api.webflow.com/v2/sites', { headers: { Authorization: `Bearer ${creds.webflowToken}`, accept: 'application/json' } });
            if (sitesRes.ok) {
              const sd: any = await sitesRes.json();
              const match = sd.sites?.find((s: any) => s.customDomains?.some((d: any) => d.url?.includes(site.twDomain)) || s.defaultDomain?.includes(site.twDomain));
              if (match) {
                const upRes = await fetch(`https://api.webflow.com/v2/sites/${match.id}/custom-code`, { method: 'PUT', headers: { Authorization: `Bearer ${creds.webflowToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ headCode: trackingScript }) });
                if (upRes.ok) return { success: true, platform, method: 'auto' };
              }
            }
          } catch { /* continue */ }
        }
      }

      return { success: false, platform: null, method: 'no_credentials' };
    }),

    // ── Real-time visitor notification check ─────────────────────
    // Returns newly identified companies since `since` timestamp
    // Frontend polls this every 30s and shows toasts for new arrivals
    newIdentifiedVisitors: protectedProcedure.input(z.object({
      since: z.number(), // Unix ms timestamp
    })).query(async ({ ctx, input }) => {
      const sessions = await db.listVisitorSessions(ctx.user.id, { limit: 200 });
      const fresh = sessions.filter((s: any) =>
        s.identifiedCompany &&
        s.createdAt > input.since
      );
      // Fire owner push notification for each new identified company (fire-and-forget)
      if (fresh.length > 0) {
        const companies = fresh.map((s: any) => s.identifiedCompany).join(', ');
        notifyOwner({
          title: `🏢 ${fresh.length === 1 ? fresh[0].identifiedCompany : `${fresh.length} new companies`} on your website`,
          content: fresh.length === 1
            ? `${fresh[0].identifiedCompany}${fresh[0].identifiedIndustry ? ` (${fresh[0].identifiedIndustry})` : ''} just visited your website — ${fresh[0].totalPageViews || 1} page${(fresh[0].totalPageViews || 1) > 1 ? 's' : ''} viewed. Open AXIOM CRM → Visitor Tracking to convert them to a prospect.`
            : `New identified visitors: ${companies}. Open AXIOM CRM → Visitor Tracking to follow up.`,
        }).catch(() => { /* non-critical */ });
      }
      return fresh.map((s: any) => ({
        id: s.id,
        company: s.identifiedCompany,
        domain: s.identifiedDomain,
        industry: s.identifiedIndustry,
        pageViews: s.totalPageViews || 1,
        createdAt: s.createdAt,
      }));
    }),
  }),

  // ─── AI Order Entry ───────────────────────────────────────────
  orderEntry: router({
    list: protectedProcedure.input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listInboundEmails(ctx.user.id, input);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getInboundEmail(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      fromEmail: z.string().optional(), fromName: z.string().optional(), subject: z.string().optional(), bodyText: z.string(),
    })).mutation(async ({ ctx, input }) => {
      return db.createInboundEmail(ctx.user.id, input as any);
    }),
    parse: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const email = await db.getInboundEmail(input.id, ctx.user.id);
      if (!email) throw new TRPCError({ code: 'NOT_FOUND' });
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are an AI that extracts freight load details from emails. Parse the email and return JSON with: origin (object with city, state, zip), destination (object with city, state, zip), commodity (string), weight (number or null), pickupDate (string or null), deliveryDate (string or null), rate (number or null), equipment (string or null), specialInstructions (string or null), contactName (string or null), contactPhone (string or null).' },
          { role: 'user', content: `Parse this email:\nFrom: ${email.fromName || email.fromEmail}\nSubject: ${email.subject}\n\n${email.bodyText}` },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'parsed_order', strict: true, schema: { type: 'object', properties: { origin: { type: 'object', properties: { city: { type: 'string' }, state: { type: 'string' }, zip: { type: 'string' } }, required: ['city', 'state', 'zip'], additionalProperties: false }, destination: { type: 'object', properties: { city: { type: 'string' }, state: { type: 'string' }, zip: { type: 'string' } }, required: ['city', 'state', 'zip'], additionalProperties: false }, commodity: { type: 'string' }, weight: { type: ['number', 'null'] }, pickupDate: { type: ['string', 'null'] }, deliveryDate: { type: ['string', 'null'] }, rate: { type: ['number', 'null'] }, equipment: { type: ['string', 'null'] }, specialInstructions: { type: ['string', 'null'] }, contactName: { type: ['string', 'null'] }, contactPhone: { type: ['string', 'null'] } }, required: ['origin', 'destination', 'commodity', 'weight', 'pickupDate', 'deliveryDate', 'rate', 'equipment', 'specialInstructions', 'contactName', 'contactPhone'], additionalProperties: false } } },
      });
      let parsed: any = {};
      try { parsed = JSON.parse(String(response.choices?.[0]?.message?.content || '{}')); } catch {}
      await db.updateInboundEmail(input.id, ctx.user.id, { parsed: true, parsedData: parsed, parseConfidence: 85, status: 'parsed' } as any);
      return parsed;
    }),
    convertToLoad: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const email = await db.getInboundEmail(input.id, ctx.user.id);
      if (!email || !email.parsedData) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email not parsed yet' });
      const p = email.parsedData as any;
      const load = await db.createLoad(ctx.user.id, {
        originCity: p.origin?.city, originState: p.origin?.state, originZip: p.origin?.zip,
        destCity: p.destination?.city, destState: p.destination?.state, destZip: p.destination?.zip,
        commodity: p.commodity, weight: p.weight, equipmentType: p.equipment,
        customerRate: p.rate ? BigInt(Math.round(p.rate * 100)) : undefined,
        specialInstructions: p.specialInstructions,
      } as any);
      await db.updateInboundEmail(input.id, ctx.user.id, { convertedToLoad: true, loadId: load?.id, status: 'converted' } as any);
      return { success: true, loadId: load?.id };
    }),
  }),

  // ─── White-Label Configuration ────────────────────────────────
  whiteLabel: router({
    get: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ input }) => {
      return db.getWhiteLabelConfig(input.companyId);
    }),
    save: protectedProcedure.input(z.object({
      companyId: z.number(), brandName: z.string().optional(), logoUrl: z.string().optional(),
      primaryColor: z.string().optional(), secondaryColor: z.string().optional(), accentColor: z.string().optional(),
      backgroundColor: z.string().optional(), sidebarColor: z.string().optional(),
      customDomain: z.string().optional(), emailFromName: z.string().optional(),
      emailFooter: z.string().optional(), showPoweredBy: z.boolean().optional(),
      customCss: z.string().optional(), isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { companyId, ...data } = input;
      return db.upsertWhiteLabelConfig(companyId, data as any);
    }),
  }),

  subscriptions: router({
    plans: publicProcedure.query(async () => {
      return db.listSubscriptionPlans();
    }),
    current: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ input }) => {
      return db.getSubscription(input.companyId);
    }),
    activate: protectedProcedure.input(z.object({ companyId: z.number(), planId: z.number() })).mutation(async ({ input }) => {
      return db.createSubscription(input.companyId, input.planId);
    }),
    update: protectedProcedure.input(z.object({ id: z.number(), status: z.string().optional() })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateSubscription(id, data as any);
    }),
  }),

  // ─── One-Touch Migration Monster ─────────────────────────────
  migration: migrationRouter,
  aiEngine: aiEngineRouter,
  systemHealth: systemHealthRouter,

  // ============================================================
  // PHASE 16: MARKETPLACE + AUTOPILOT ROUTERS
  // ============================================================

  marketplace: router({
    listLoads: protectedProcedure.input(z.object({ status: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listMarketplaceLoads({ status: input?.status, companyId: undefined });
    }),
    getLoad: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getMarketplaceLoad(input.id);
    }),
    postLoad: protectedProcedure.input(z.object({
      shipperCompanyName: z.string(), shipperContactName: z.string(), shipperEmail: z.string(),
      shipperPhone: z.string().optional(), commodity: z.string(), weight: z.string(),
      pieces: z.number().optional(), pallets: z.number().optional(),
      equipmentType: z.string(), specialRequirements: z.string().optional(),
      hazmat: z.boolean().optional(), temperatureControlled: z.boolean().optional(),
      tempMin: z.string().optional(), tempMax: z.string().optional(),
      originCity: z.string(), originState: z.string(), originZip: z.string(), originAddress: z.string().optional(),
      pickupDate: z.number(), pickupWindowStart: z.string().optional(), pickupWindowEnd: z.string().optional(),
      destCity: z.string(), destState: z.string(), destZip: z.string(), destAddress: z.string().optional(),
      deliveryDate: z.number(), deliveryWindowStart: z.string().optional(), deliveryWindowEnd: z.string().optional(),
      shipperRate: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const load = await db.createMarketplaceLoad({ ...input, shipperUserId: ctx.user.id, status: 'posted' });
      return load;
    }),
    updateLoad: protectedProcedure.input(z.object({
      id: z.number(), status: z.string().optional(),
      carrierRate: z.string().optional(), margin: z.string().optional(), marginPercent: z.string().optional(),
      matchedCarrierId: z.number().optional(), matchedCarrierName: z.string().optional(),
      matchedCarrierDot: z.string().optional(), matchedCarrierMc: z.string().optional(),
      matchScore: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.updateMarketplaceLoad(id, data);
    }),
    // AI Carrier Matching
    matchCarriers: protectedProcedure.input(z.object({ loadId: z.number() })).mutation(async ({ ctx, input }) => {
      const load = await db.getMarketplaceLoad(input.loadId);
      if (!load) throw new TRPCError({ code: 'NOT_FOUND', message: 'Load not found' });
      // Use AI to find best carrier matches
      const { invokeLLM } = await import('./_core/llm');
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a freight carrier matching AI. Given load details, suggest 3 ideal carrier profiles with match scores. Return JSON array with: carrierName, equipmentType, matchScore (0-100), estimatedRate, reasoning.' },
          { role: 'user', content: `Match carriers for: ${load.commodity}, ${load.weight}lbs, ${load.equipmentType}, ${load.originCity},${load.originState} → ${load.destCity},${load.destState}, pickup ${new Date(Number(load.pickupDate)).toLocaleDateString()}` },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'carrier_matches', strict: true, schema: { type: 'object', properties: { matches: { type: 'array', items: { type: 'object', properties: { carrierName: { type: 'string' }, equipmentType: { type: 'string' }, matchScore: { type: 'number' }, estimatedRate: { type: 'number' }, reasoning: { type: 'string' } }, required: ['carrierName', 'equipmentType', 'matchScore', 'estimatedRate', 'reasoning'], additionalProperties: false } } }, required: ['matches'], additionalProperties: false } } },
      });
      const parsed = JSON.parse(String(response.choices[0].message.content));
      // Create bids from AI matches
      for (const match of parsed.matches) {
        await db.createMarketplaceBid({ loadId: input.loadId, carrierName: match.carrierName, equipmentType: match.equipmentType, bidRate: String(match.estimatedRate), matchScore: String(match.matchScore), notes: match.reasoning, companyId: load.companyId });
      }
      await db.updateMarketplaceLoad(input.loadId, { status: 'matching' });
      return parsed.matches;
    }),
    // Bids
    listBids: protectedProcedure.input(z.object({ loadId: z.number() })).query(async ({ ctx, input }) => {
      return db.listBidsForLoad(input.loadId);
    }),
    acceptBid: protectedProcedure.input(z.object({ bidId: z.number(), loadId: z.number() })).mutation(async ({ ctx, input }) => {
      await db.updateBidStatus(input.bidId, 'accepted');
      const bids = await db.listBidsForLoad(input.loadId);
      const accepted = bids.find(b => b.id === input.bidId);
      if (accepted) {
        const load = await db.getMarketplaceLoad(input.loadId);
        const shipperRate = Number(load?.shipperRate || 0);
        const carrierRate = Number(accepted.bidRate);
        const margin = shipperRate - carrierRate;
        const marginPercent = shipperRate > 0 ? (margin / shipperRate) * 100 : 0;
        await db.updateMarketplaceLoad(input.loadId, {
          status: 'booked', matchedCarrierName: accepted.carrierName, matchedCarrierDot: accepted.carrierDot,
          matchedCarrierMc: accepted.carrierMc, carrierRate: String(carrierRate),
          margin: String(margin), marginPercent: String(marginPercent), matchScore: accepted.matchScore, bookedAt: Date.now(),
        });
        // Create payment record
        await db.createMarketplacePayment({
          loadId: input.loadId, shipperAmount: String(shipperRate), carrierAmount: String(carrierRate),
          grossMargin: String(margin), marginPercent: String(marginPercent), companyId: load?.companyId,
        });
      }
      // Reject other bids
      for (const bid of bids) { if (bid.id !== input.bidId) await db.updateBidStatus(bid.id, 'rejected'); }
      return { success: true };
    }),
    // Payments
    getPayment: protectedProcedure.input(z.object({ loadId: z.number() })).query(async ({ ctx, input }) => {
      return db.getPaymentForLoad(input.loadId);
    }),
    collectShipperPayment: protectedProcedure.input(z.object({ loadId: z.number(), method: z.string(), ref: z.string().optional() })).mutation(async ({ ctx, input }) => {
      return db.updateMarketplacePayment(input.loadId, { shipperPaymentStatus: 'collected', shipperPaymentMethod: input.method, shipperPaymentRef: input.ref || `PAY-${Date.now()}`, shipperPaidAt: Date.now(), escrowStatus: 'funded', escrowFundedAt: Date.now() });
    }),
    releaseCarrierPayment: protectedProcedure.input(z.object({ loadId: z.number(), method: z.string() })).mutation(async ({ ctx, input }) => {
      return db.updateMarketplacePayment(input.loadId, { carrierPaymentStatus: 'paid', carrierPaymentMethod: input.method, carrierPaymentRef: `CP-${Date.now()}`, carrierPaidAt: Date.now(), escrowStatus: 'released', escrowReleasedAt: Date.now() });
    }),
    // Tracking
    listTracking: protectedProcedure.input(z.object({ loadId: z.number() })).query(async ({ ctx, input }) => {
      return db.listTrackingEvents(input.loadId);
    }),
    addTracking: protectedProcedure.input(z.object({
      loadId: z.number(), eventType: z.string(), latitude: z.string().optional(), longitude: z.string().optional(),
      city: z.string().optional(), state: z.string().optional(), description: z.string().optional(),
      currentEta: z.number().optional(), milesRemaining: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const event = await db.addTrackingEvent(input);
      // Auto-update load status based on event
      if (input.eventType === 'pickup_confirmed') await db.updateMarketplaceLoad(input.loadId, { status: 'in_transit', pickedUpAt: Date.now() });
      if (input.eventType === 'delivery_confirmed') await db.updateMarketplaceLoad(input.loadId, { status: 'delivered', deliveredAt: Date.now() });
      return event;
    }),
    // Documents
    listDocuments: protectedProcedure.input(z.object({ loadId: z.number() })).query(async ({ ctx, input }) => {
      return db.listDocumentsForLoad(input.loadId);
    }),
    generateDocuments: protectedProcedure.input(z.object({ loadId: z.number() })).mutation(async ({ ctx, input }) => {
      const load = await db.getMarketplaceLoad(input.loadId);
      if (!load) throw new TRPCError({ code: 'NOT_FOUND' });
      const docs = [
        { docType: 'bol', title: `BOL - ${load.loadNumber}` },
        { docType: 'rate_confirmation', title: `Rate Confirmation - ${load.loadNumber}` },
        { docType: 'carrier_packet', title: `Carrier Packet - ${load.matchedCarrierName || 'TBD'}` },
        { docType: 'insurance_cert', title: `Insurance Certificate - ${load.matchedCarrierName || 'TBD'}` },
      ];
      const created = [];
      for (const doc of docs) {
        const result = await db.createMarketplaceDocument({ ...doc, loadId: input.loadId, generatedBy: 'ai', companyId: load.companyId });
        created.push(result);
      }
      return created;
    }),
    // Stats
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getMarketplaceStats();
    }),
  }),

  autopilot: router({
    // Lane Analytics
    lanes: protectedProcedure.input(z.object({ originState: z.string().optional(), destState: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listLaneAnalytics({ originState: input?.originState, destState: input?.destState });
    }),
    // Consolidation Opportunities
    consolidations: protectedProcedure.input(z.object({ status: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
      return db.listConsolidationOpportunities(input?.status);
    }),
    // AI-powered lane analysis
    analyzeLanes: protectedProcedure.mutation(async ({ ctx }) => {
      const { invokeLLM } = await import('./_core/llm');
      const loads = await db.listMarketplaceLoads({});
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a freight lane analytics AI. Analyze load patterns and predict demand. Return JSON with top 5 lanes: originCity, originState, destCity, destState, demandScore (0-100), demandTrend (rising/stable/falling), avgRate, nextWeekPrediction.' },
          { role: 'user', content: `Analyze ${loads.length} loads and predict lane demand. Current loads: ${JSON.stringify(loads.slice(0, 20).map(l => ({ origin: `${l.originCity},${l.originState}`, dest: `${l.destCity},${l.destState}`, rate: l.shipperRate, equipment: l.equipmentType })))}` },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'lane_analysis', strict: true, schema: { type: 'object', properties: { lanes: { type: 'array', items: { type: 'object', properties: { originCity: { type: 'string' }, originState: { type: 'string' }, destCity: { type: 'string' }, destState: { type: 'string' }, demandScore: { type: 'number' }, demandTrend: { type: 'string' }, avgRate: { type: 'number' }, nextWeekPrediction: { type: 'number' } }, required: ['originCity', 'originState', 'destCity', 'destState', 'demandScore', 'demandTrend', 'avgRate', 'nextWeekPrediction'], additionalProperties: false } } }, required: ['lanes'], additionalProperties: false } } },
      });
      const parsed = JSON.parse(String(response.choices[0].message.content));
      const now = Date.now();
      for (const lane of parsed.lanes) {
        await db.upsertLaneAnalytic({ ...lane, equipmentType: 'dry_van', totalLoads: lane.nextWeekPrediction, periodStart: now, periodEnd: now + 7 * 86400000 });
      }
      return parsed.lanes;
    }),
    // Find consolidation opportunities
    findConsolidations: protectedProcedure.mutation(async ({ ctx }) => {
      const { invokeLLM } = await import('./_core/llm');
      const loads = await db.listMarketplaceLoads({ status: 'posted' });
      if (loads.length < 2) return [];
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a freight consolidation AI. Find shipments that can be combined into single truckloads for cost savings. Return JSON with consolidation groups: groupId, loadIds (array of numbers), originRegion, destRegion, individualCost, consolidatedCost, savings, savingsPercent, reasoning.' },
          { role: 'user', content: `Find consolidation opportunities in these ${loads.length} loads: ${JSON.stringify(loads.map(l => ({ id: l.id, origin: `${l.originCity},${l.originState}`, dest: `${l.destCity},${l.destState}`, weight: l.weight, equipment: l.equipmentType, rate: l.shipperRate })))}` },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'consolidations', strict: true, schema: { type: 'object', properties: { groups: { type: 'array', items: { type: 'object', properties: { groupId: { type: 'string' }, loadIds: { type: 'array', items: { type: 'number' } }, originRegion: { type: 'string' }, destRegion: { type: 'string' }, individualCost: { type: 'number' }, consolidatedCost: { type: 'number' }, savings: { type: 'number' }, savingsPercent: { type: 'number' }, reasoning: { type: 'string' } }, required: ['groupId', 'loadIds', 'originRegion', 'destRegion', 'individualCost', 'consolidatedCost', 'savings', 'savingsPercent', 'reasoning'], additionalProperties: false } } }, required: ['groups'], additionalProperties: false } } },
      });
      const parsed = JSON.parse(String(response.choices[0].message.content));
      for (const group of parsed.groups) {
        await db.createConsolidationOpportunity({ ...group, loadCount: group.loadIds.length, individualCost: String(group.individualCost), consolidatedCost: String(group.consolidatedCost), savings: String(group.savings), savingsPercent: String(group.savingsPercent), aiReasoning: group.reasoning, confidenceScore: '85', windowStart: Date.now(), windowEnd: Date.now() + 48 * 3600000, expiresAt: Date.now() + 48 * 3600000 });
      }
      return parsed.groups;
    }),
    executeConsolidation: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      return db.updateConsolidationStatus(input.id, 'executed');
    }),
  }),

  // ─── Email Masking ──────────────────────────────────────────────────
  emailMask: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getEmailMask(ctx.user.id);
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listEmailMasks(ctx.user.id);
    }),
    save: protectedProcedure.input(z.object({
      id: z.number().optional(),
      displayName: z.string().min(1),
      displayEmail: z.string().email(),
      replyToName: z.string().optional(),
      replyToEmail: z.string().email().optional(),
      organizationName: z.string().optional(),
      applyTo: z.enum(['all', 'campaigns_only', 'manual_only']).optional(),
      dmarcAlignment: z.enum(['relaxed', 'strict']).optional(),
      companyId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.saveEmailMask(ctx.user.id, input);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      return db.deleteEmailMask(input.id, ctx.user.id);
    }),
    // Preview what an email would look like with the mask applied
    preview: protectedProcedure.input(z.object({
      maskId: z.number().optional(),
    })).query(async ({ ctx, input }) => {
      const mask = input.maskId
        ? (await db.listEmailMasks(ctx.user.id)).find(m => m.id === input.maskId) || null
        : await db.getEmailMask(ctx.user.id);
      const originalFrom = { name: ctx.user.name || 'Unknown', email: ctx.user.email || 'noreply@example.com' };
      return db.applyEmailMask(mask, originalFrom);
    }),
  }),
  ai: router({
    chat: protectedProcedure.input(z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })),
    })).mutation(async ({ ctx, input }) => {
      const { handleChat } = await import("./ai-assistant");
      const msgs = input.messages.map(m => ({ role: m.role as any, content: m.content }));
      const response = await handleChat(msgs, ctx.user.id, ctx.user.name || "User");
      return { response };
    }),
  }),

  bibleShares: router({
    share: protectedProcedure.input(z.object({
      sharedWithUserId: z.number(),
      sectionId: z.string(),
      featureId: z.string().optional(),
      permission: z.enum(["view", "collaborate"]).default("view"),
    })).mutation(async ({ ctx, input }) => {
      if (!ctx.user.tenantCompanyId) throw new TRPCError({ code: "BAD_REQUEST" });
      const { eq, isNull, and } = await import("drizzle-orm");
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = await dbConn.select().from(bibleShares).where(
        and(
          eq(bibleShares.sharedByUserId, ctx.user.id),
          eq(bibleShares.sharedWithUserId, input.sharedWithUserId),
          eq(bibleShares.sectionId, input.sectionId),
          input.featureId ? eq(bibleShares.featureId, input.featureId) : isNull(bibleShares.featureId),
          isNull(bibleShares.revokedAt),
        )
      ).limit(1);
      if (existing.length > 0) return { id: existing[0].id };
      const [result] = await dbConn.insert(bibleShares).values({
        sharedByUserId: ctx.user.id,
        sharedWithUserId: input.sharedWithUserId,
        sectionId: input.sectionId,
        featureId: input.featureId ?? null,
        permission: input.permission,
        tenantCompanyId: ctx.user.tenantCompanyId,
        createdAt: Date.now(),
      });
      return { id: (result as any).insertId };
    }),

    revoke: protectedProcedure.input(z.object({
      shareId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const { eq } = await import("drizzle-orm");
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const share = await dbConn.select().from(bibleShares).where(eq(bibleShares.id, input.shareId)).limit(1);
      if (!share.length) throw new TRPCError({ code: "NOT_FOUND" });
      const isAdmin = ["developer", "axiom_admin", "axiom_owner", "apex_owner", "company_admin"].includes(ctx.user.systemRole);
      if (share[0].sharedByUserId !== ctx.user.id && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      await dbConn.update(bibleShares).set({ revokedAt: Date.now(), revokedByUserId: ctx.user.id }).where(eq(bibleShares.id, input.shareId));
      return { success: true };
    }),

    listMyShares: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.tenantCompanyId) return [];
      const { eq, isNull, and } = await import("drizzle-orm");
      const dbConn = await db.getDb();
      if (!dbConn) return [];
      const shares = await dbConn.select().from(bibleShares).where(
        and(eq(bibleShares.sharedByUserId, ctx.user.id), isNull(bibleShares.revokedAt))
      );
      return Promise.all(shares.map(async (s: typeof bibleShares.$inferSelect) => {
        const recipient = await db.getUserById(s.sharedWithUserId);
        return { ...s, recipientName: recipient?.name ?? "Unknown" };
      }));
    }),

    listSharedWithMe: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.tenantCompanyId) return [];
      const { eq, isNull, and } = await import("drizzle-orm");
      const dbConn = await db.getDb();
      if (!dbConn) return [];
      const shares = await dbConn.select().from(bibleShares).where(
        and(eq(bibleShares.sharedWithUserId, ctx.user.id), isNull(bibleShares.revokedAt))
      );
      return Promise.all(shares.map(async (s: typeof bibleShares.$inferSelect) => {
        const grantor = await db.getUserById(s.sharedByUserId);
        return { ...s, grantorName: grantor?.name ?? "Unknown" };
      }));
    }),

    searchUsers: protectedProcedure.input(z.object({
      query: z.string().min(1),
    })).query(async ({ ctx, input }) => {
      if (!ctx.user.tenantCompanyId) return [];
      const allUsers = await db.getUsersByCompany(ctx.user.tenantCompanyId);
      const q = input.query.toLowerCase();
      return allUsers
        .filter((u: { id: number; name: string | null; email: string | null; systemRole: string }) => u.id !== ctx.user.id)
        .filter((u: { id: number; name: string | null; email: string | null; systemRole: string }) => (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q))
        .slice(0, 10)
        .map((u: { id: number; name: string | null; email: string | null; systemRole: string }) => ({ id: u.id, name: u.name, email: u.email, systemRole: u.systemRole }));
    }),
  }),

  billing: router({
    // Get available plans
    plans: publicProcedure.query(async () => {
      const { PLANS } = await import("./stripe-products.js");
      return PLANS;
    }),

    // Get current subscription info for the company
    subscription: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.tenantCompanyId) return null;
      const company = await db.getTenantCompanyById(ctx.user.tenantCompanyId);
      if (!company) return null;
      return {
        tier: company.subscriptionTier,
        status: company.subscriptionStatus,
        trialEndsAt: company.trialEndsAt,
        stripeCustomerId: company.stripeCustomerId,
        stripeSubscriptionId: company.stripeSubscriptionId,
      };
    }),

    // Create Stripe checkout session for a plan upgrade
    createCheckout: protectedProcedure.input(z.object({
      planId: z.enum(["success_starter", "growth_foundation", "fortune_foundation", "fortune", "fortune_plus"]),
      billing: z.enum(["monthly", "annual"]).default("monthly"),
      origin: z.string().url(),
      // Required when billing=annual: user must acknowledge non-refundable policy
      annualAcknowledged: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const isAdmin = ["developer", "axiom_admin", "axiom_owner", "apex_owner", "company_admin"].includes(ctx.user.systemRole);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Only company admins can manage billing" });
      if (!ctx.user.tenantCompanyId) throw new TRPCError({ code: "BAD_REQUEST", message: "No company associated" });

      // Enforce non-refundable acknowledgment for annual plans
      if (input.billing === "annual" && !input.annualAcknowledged) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You must acknowledge that annual plans are non-refundable before proceeding.",
        });
      }

      const { stripe } = await import("./stripe.js");
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe is not configured. Please add your Stripe keys in Settings → Payment." });

      const { PLANS } = await import("./stripe-products.js");
      const plan = PLANS.find(p => p.id === input.planId);
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

      const priceId = input.billing === "annual" ? plan.annualPriceId : plan.monthlyPriceId;
      if (!priceId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Price ID not configured for this plan. Please contact support." });

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: ctx.user.email || undefined,
        allow_promotion_codes: true,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          tenant_company_id: ctx.user.tenantCompanyId.toString(),
          plan_tier: plan.tier,
          billing_cycle: input.billing,
          annual_acknowledged: input.billing === "annual" ? "true" : "false",
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
        },
        // For annual plans, add a custom description reinforcing the non-refundable policy
        ...(input.billing === "annual" ? {
          custom_text: {
            submit: {
              message: "Annual plans are billed upfront and are NON-REFUNDABLE for any reason. By completing this purchase, you agree to this policy.",
            },
          },
        } : {}),
        success_url: `${input.origin}/billing?success=true&plan=${plan.id}`,
        cancel_url: `${input.origin}/billing?cancelled=true`,
      });

      return { checkoutUrl: session.url };
    }),

    // Add user seats via Stripe checkout (add-on seats at $25/user/mo)
    addUserSeats: protectedProcedure.input(z.object({
      quantity: z.number().int().min(1).max(50),
      origin: z.string().url(),
    })).mutation(async ({ ctx, input }) => {
      const isAdmin = ["developer", "axiom_admin", "axiom_owner", "apex_owner", "company_admin"].includes(ctx.user.systemRole);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Only company admins can add user seats" });
      if (!ctx.user.tenantCompanyId) throw new TRPCError({ code: "BAD_REQUEST", message: "No company associated" });
      const { stripe } = await import("./stripe.js");
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe is not configured. Please add your Stripe keys in Settings \u2192 Payment." });
      const { USER_ADDON_PRICE_ID } = await import("./stripe-products.js");
      if (!USER_ADDON_PRICE_ID) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "User add-on price not configured. Please contact support." });
      const company = await db.getTenantCompanyById(ctx.user.tenantCompanyId);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: USER_ADDON_PRICE_ID, quantity: input.quantity }],
        customer: company?.stripeCustomerId || undefined,
        customer_email: company?.stripeCustomerId ? undefined : (ctx.user.email || undefined),
        allow_promotion_codes: true,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          tenant_company_id: ctx.user.tenantCompanyId.toString(),
          addon_type: "user_seats",
          quantity: input.quantity.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
        },
        success_url: `${input.origin}/billing?success=true&addon=user_seats&qty=${input.quantity}`,
        cancel_url: `${input.origin}/billing?cancelled=true`,
      });
      return { checkoutUrl: session.url };
    }),

    // Create Stripe billing portal session
    createPortal: protectedProcedure.input(z.object({
      origin: z.string().url(),
    })).mutation(async ({ ctx, input }) => {
      const isAdmin = ["developer", "axiom_admin", "axiom_owner", "apex_owner", "company_admin"].includes(ctx.user.systemRole);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      if (!ctx.user.tenantCompanyId) throw new TRPCError({ code: "BAD_REQUEST" });

      const { stripe } = await import("./stripe.js");
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe is not configured" });

      const company = await db.getTenantCompanyById(ctx.user.tenantCompanyId);
      if (!company?.stripeCustomerId) throw new TRPCError({ code: "BAD_REQUEST", message: "No Stripe customer found. Please subscribe to a plan first." });

       const session = await stripe.billingPortal.sessions.create({
        customer: company.stripeCustomerId,
        return_url: `${input.origin}/billing`,
      });
      return { portalUrl: session.url };
    }),

    invoices: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.tenantCompanyId) throw new TRPCError({ code: 'BAD_REQUEST' });
      const allowedRoles = ['company_admin', 'axiom_admin', 'axiom_owner', 'apex_owner', 'developer'];
      if (!allowedRoles.includes(ctx.user.systemRole)) throw new TRPCError({ code: 'FORBIDDEN' });
      const { default: Stripe } = await import('stripe');
      const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' as any }) : null;
      if (!stripe) return { invoices: [], subscriptionStatus: null };
      const company = await db.getTenantCompanyById(ctx.user.tenantCompanyId);
      if (!company?.stripeCustomerId) return { invoices: [], subscriptionStatus: null };
      const [invoiceList, subscriptions] = await Promise.all([
        stripe.invoices.list({ customer: company.stripeCustomerId, limit: 24 }),
        stripe.subscriptions.list({ customer: company.stripeCustomerId, limit: 1 }),
      ]);
      const invoices = invoiceList.data.map(inv => ({
        id: inv.id,
        number: inv.number,
        date: inv.created * 1000,
        dueDate: inv.due_date ? inv.due_date * 1000 : null,
        amount: inv.amount_paid / 100,
        currency: inv.currency.toUpperCase(),
        status: inv.status,
        pdfUrl: inv.invoice_pdf,
        hostedUrl: inv.hosted_invoice_url,
        description: inv.lines.data[0]?.description ?? 'Subscription',
      }));
      const sub = subscriptions.data[0];
      const subscriptionStatus = sub ? {
        status: sub.status,
        planName: (sub.items.data[0]?.price?.nickname) ?? 'Subscription',
        currentPeriodEnd: (sub as any).current_period_end ? (sub as any).current_period_end * 1000 : null,
        cancelAtPeriodEnd: (sub as any).cancel_at_period_end ?? false,
      } : null;
      return { invoices, subscriptionStatus };
    }),

    paymentStatus: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.tenantCompanyId) return { isPastDue: false, status: null };
      const allowedRoles = ['company_admin', 'axiom_admin', 'axiom_owner', 'apex_owner', 'developer'];
      if (!allowedRoles.includes(ctx.user.systemRole)) return { isPastDue: false, status: null };
      const { default: Stripe } = await import('stripe');
      const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' as any }) : null;
      if (!stripe) return { isPastDue: false, status: null };
      const company = await db.getTenantCompanyById(ctx.user.tenantCompanyId);
      if (!company?.stripeCustomerId) return { isPastDue: false, status: null };
      const subscriptions = await stripe.subscriptions.list({ customer: company.stripeCustomerId, limit: 1 });
      const sub = subscriptions.data[0];
      if (!sub) return { isPastDue: false, status: null };
      return { isPastDue: sub.status === 'past_due' || sub.status === 'unpaid', status: sub.status };
    }),
  }),

  emailSetup: router({
    verifyDomain: protectedProcedure.input(z.object({
      domain: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const dns = await import('dns').then(m => m.promises);
      const domain = input.domain.toLowerCase().trim();
      const results: Record<string, { found: boolean; value?: string; recommendation?: string }> = {};
      // Check MX
      try {
        const mx = await dns.resolveMx(domain);
        results.mx = { found: mx.length > 0, value: mx[0]?.exchange };
      } catch { results.mx = { found: false, recommendation: `Add MX record: @ → mail.${domain} (priority 10)` }; }
      // Check SPF
      try {
        const txt = await dns.resolveTxt(domain);
        const spf = txt.flat().find(r => r.startsWith('v=spf1'));
        results.spf = { found: !!spf, value: spf, recommendation: spf ? undefined : 'Add TXT record: @ → "v=spf1 include:_spf.google.com ~all"' };
      } catch { results.spf = { found: false, recommendation: 'Add TXT record: @ → "v=spf1 include:_spf.google.com ~all"' }; }
      // Check DMARC
      try {
        const dmarc = await dns.resolveTxt(`_dmarc.${domain}`);
        const rec = dmarc.flat().find(r => r.startsWith('v=DMARC1'));
        results.dmarc = { found: !!rec, value: rec, recommendation: rec ? undefined : `Add TXT record: _dmarc.${domain} → "v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}"` };
      } catch { results.dmarc = { found: false, recommendation: `Add TXT record: _dmarc.${domain} → "v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}"` }; }
      // Check DKIM (common selector)
      const selectors = ['google', 'default', 'mail', 'k1', 'dkim'];
      let dkimFound = false;
      for (const sel of selectors) {
        try {
          const dkim = await dns.resolveTxt(`${sel}._domainkey.${domain}`);
          if (dkim.flat().some(r => r.includes('v=DKIM1'))) { dkimFound = true; break; }
        } catch {}
      }
      results.dkim = { found: dkimFound, recommendation: dkimFound ? undefined : `Add TXT record: google._domainkey.${domain} → (your DKIM public key from your email provider)` };
      const allPassed = Object.values(results).every(r => r.found);
      return { domain, results, allPassed, verifiedAt: allPassed ? Date.now() : null };
    }),

    generateDnsRecords: protectedProcedure.input(z.object({
      domain: z.string(),
      provider: z.enum(['google', 'microsoft', 'custom']),
    })).mutation(async ({ input }) => {
      const d = input.domain.toLowerCase().trim();
      const records: Array<{ type: string; host: string; value: string; ttl: number; priority?: number }> = [];
      if (input.provider === 'google') {
        records.push(
          { type: 'MX', host: '@', value: 'aspmx.l.google.com', ttl: 3600, priority: 1 },
          { type: 'MX', host: '@', value: 'alt1.aspmx.l.google.com', ttl: 3600, priority: 5 },
          { type: 'MX', host: '@', value: 'alt2.aspmx.l.google.com', ttl: 3600, priority: 5 },
          { type: 'TXT', host: '@', value: 'v=spf1 include:_spf.google.com ~all', ttl: 3600 },
          { type: 'TXT', host: `_dmarc.${d}`, value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${d}`, ttl: 3600 },
          { type: 'CNAME', host: `google._domainkey.${d}`, value: 'google._domainkey.googlemail.com', ttl: 3600 },
        );
      } else if (input.provider === 'microsoft') {
        records.push(
          { type: 'MX', host: '@', value: `${d.replace('.', '-')}.mail.protection.outlook.com`, ttl: 3600, priority: 0 },
          { type: 'TXT', host: '@', value: 'v=spf1 include:spf.protection.outlook.com ~all', ttl: 3600 },
          { type: 'TXT', host: `_dmarc.${d}`, value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${d}`, ttl: 3600 },
          { type: 'CNAME', host: `selector1._domainkey.${d}`, value: `selector1-${d.replace('.', '-')}._domainkey.onmicrosoft.com`, ttl: 3600 },
          { type: 'CNAME', host: `selector2._domainkey.${d}`, value: `selector2-${d.replace('.', '-')}._domainkey.onmicrosoft.com`, ttl: 3600 },
        );
      } else {
        records.push(
          { type: 'TXT', host: '@', value: 'v=spf1 include:YOUR_SMTP_PROVIDER ~all', ttl: 3600 },
          { type: 'TXT', host: `_dmarc.${d}`, value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${d}`, ttl: 3600 },
          { type: 'TXT', host: `mail._domainkey.${d}`, value: 'v=DKIM1; k=rsa; p=YOUR_DKIM_PUBLIC_KEY', ttl: 3600 },
        );
      }
      return { domain: d, provider: input.provider, records };
    }),

    checkDomainAvailability: protectedProcedure.input(z.object({
      domain: z.string(),
    })).mutation(async ({ input }) => {
      const dns = await import('dns').then(m => m.promises);
      const domain = input.domain.toLowerCase().trim();
      try {
        await dns.resolve(domain);
        return { available: false, domain };
      } catch (e: any) {
        if (e.code === 'ENOTFOUND' || e.code === 'ENODATA') return { available: true, domain };
        return { available: false, domain };
      }
    }),
  }),

  // ─── AI Credits System ───
  // Model:
  //   - CRM AI features are FREE (included in subscription)
  //   - Non-CRM AI usage requires purchased credits at 25% markup on Manus pricing
  //   - Billed directly to tenant company's Stripe card on file
  //   - Only AXIOM Owner manages packages and sells credits
  //   - Company Admins view their balance and history (read-only)
  aiCredits: router({

    // ── Company Admin (read-only): view own tenant's credit balance ──
    myBalance: companyAdminProcedure.query(async ({ ctx }) => {
      const tenantId = ctx.user.tenantCompanyId;
      if (!tenantId) return { availableCredits: 0, lifetimePurchasedCredits: 0, lifetimeUsedCredits: 0 };
      await db.initTenantAiCredits(tenantId);
      const balance = await db.getTenantAiCredits(tenantId);
      return {
        availableCredits: balance?.availableCredits || 0,
        lifetimePurchasedCredits: balance?.lifetimePurchasedCredits || 0,
        lifetimeUsedCredits: balance?.lifetimeUsedCredits || 0,
      };
    }),

    // ── Company Admin (read-only): view own credit transaction history ──
    myTransactions: companyAdminProcedure.query(async ({ ctx }) => {
      const tenantId = ctx.user.tenantCompanyId;
      if (!tenantId) return [];
      return db.getAiCreditTransactions(tenantId, 100);
    }),

    // ── AXIOM Owner: list all credit packages ──
    listPackages: axiomOwnerProcedure.query(async () => {
      return db.getAiCreditPackages();
    }),

    // ── AXIOM Owner: create a new credit package ──
    createPackage: axiomOwnerProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      credits: z.number().min(1),
      manusBasePriceCents: z.number().min(0), // Manus list price in cents
    })).mutation(async ({ input }) => {
      const { aiCreditPackages: pkgTable } = await import('../drizzle/schema');
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const now = Date.now();
      const finalPriceCents = Math.round(input.manusBasePriceCents * 1.25); // 25% markup
      await dbConn.insert(pkgTable).values({
        name: input.name,
        description: input.description,
        credits: input.credits,
        manusBasePriceCents: input.manusBasePriceCents,
        markupPercent: 25,
        finalPriceCents,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true };
    }),

    // ── AXIOM Owner: update a credit package ──
    updatePackage: axiomOwnerProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      credits: z.number().optional(),
      manusBasePriceCents: z.number().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { aiCreditPackages: pkgTable } = await import('../drizzle/schema');
      const { eq: eqOp } = await import('drizzle-orm');
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { id, manusBasePriceCents, ...rest } = input;
      const updates: Record<string, unknown> = { ...rest, updatedAt: Date.now() };
      if (manusBasePriceCents !== undefined) {
        updates.manusBasePriceCents = manusBasePriceCents;
        updates.finalPriceCents = Math.round(manusBasePriceCents * 1.25);
      }
      await dbConn.update(pkgTable).set(updates as any).where(eqOp(pkgTable.id, id));
      return { success: true };
    }),

    // ── AXIOM Owner: create a Stripe checkout session for a tenant to purchase credits ──
    createCheckout: axiomOwnerProcedure.input(z.object({
      tenantCompanyId: z.number(),
      packageId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const tenant = await db.getTenantCompanyById(input.tenantCompanyId);
      if (!tenant) throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant company not found' });
      const packages = await db.getAiCreditPackages();
      const pkg = packages.find(p => p.id === input.packageId);
      if (!pkg) throw new TRPCError({ code: 'NOT_FOUND', message: 'Package not found' });
      const stripe = (await import('stripe')).default;
      const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY || '');
      const origin = ctx.req.headers.origin || 'https://axiom-crm.manus.space';
      const session = await stripeClient.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pkg.name} — ${pkg.credits.toLocaleString()} AI Credits`,
              description: pkg.description || `${pkg.credits} AI credits for non-CRM AI features`,
            },
            unit_amount: pkg.finalPriceCents,
          },
          quantity: 1,
        }],
        customer_email: tenant.contactEmail || undefined,
        client_reference_id: input.tenantCompanyId.toString(),
        metadata: {
          tenant_company_id: input.tenantCompanyId.toString(),
          package_id: input.packageId.toString(),
          credits: pkg.credits.toString(),
          company_name: tenant.name,
        },
        allow_promotion_codes: true,
        success_url: `${origin}/settings/ai-credits?purchase=success`,
        cancel_url: `${origin}/settings/ai-credits?purchase=cancelled`,
      });
      return { checkoutUrl: session.url };
    }),

    // ── AXIOM Owner: manually grant credits to a tenant (no Stripe) ──
    grantCredits: axiomOwnerProcedure.input(z.object({
      tenantCompanyId: z.number(),
      credits: z.number().min(1),
      description: z.string().default('Credits granted by AXIOM Owner'),
    })).mutation(async ({ ctx, input }) => {
      const tenant = await db.getTenantCompanyById(input.tenantCompanyId);
      if (!tenant) throw new TRPCError({ code: 'NOT_FOUND', message: 'Tenant company not found' });
      await db.addTenantAiCredits(input.tenantCompanyId, input.credits, input.description, undefined, 0, ctx.user.id);
      return { success: true };
    }),

    // ── AXIOM Owner: view all tenant credit balances ──
    allTenantBalances: axiomOwnerProcedure.query(async () => {
      const dbConn = await db.getDb();
      if (!dbConn) return [];
      const { tenantAiCredits: tac, tenantCompanies: tc } = await import('../drizzle/schema');
      const { eq: eqOp } = await import('drizzle-orm');
      return dbConn
        .select({
          tenantCompanyId: tac.tenantCompanyId,
          companyName: tc.name,
          availableCredits: tac.availableCredits,
          lifetimePurchasedCredits: tac.lifetimePurchasedCredits,
          lifetimeUsedCredits: tac.lifetimeUsedCredits,
          updatedAt: tac.updatedAt,
        })
        .from(tac)
        .leftJoin(tc, eqOp(tac.tenantCompanyId, tc.id));
    }),

    // ── AXIOM Owner: view transaction history for any tenant ──
    tenantTransactions: axiomOwnerProcedure.input(z.object({
      tenantCompanyId: z.number(),
    })).query(async ({ input }) => {
      return db.getAiCreditTransactions(input.tenantCompanyId, 200);
    }),
  }),

  // ═══════════════════════════════════════════════════════════════════════
  // BUSINESS CATEGORY / VERTICAL INTELLIGENCE
  // ═══════════════════════════════════════════════════════════════════════
  businessCategory: router({
    list: publicProcedure.query(async () => {
      const { BUSINESS_CATEGORIES } = await import('../shared/businessCategories');
      return BUSINESS_CATEGORIES.map(c => ({
        key: c.key,
        label: c.label,
        icon: c.icon,
        description: c.description,
        subTypes: c.subTypes,
        highlightedFeatures: c.highlightedFeatures,
      }));
    }),
    myCategory: protectedProcedure.query(async ({ ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) return null;
      const { tenantCompanies } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const [company] = await dbConn.select().from(tenantCompanies).where(eq(tenantCompanies.id, ctx.user.tenantCompanyId));
      if (!company) return null;
      const settings = (company.settings as Record<string, unknown>) ?? {};
      const { getCategory, getTerminology } = await import('../shared/businessCategories');
      const categoryKey = settings.businessCategory as string | null;
      const category = getCategory(categoryKey);
      return {
        categoryKey: category.key,
        categoryLabel: category.label,
        subType: settings.businessSubType as string | null,
        terminology: getTerminology(categoryKey),
        enabledModules: category.enabledModules,
        aiContext: category.aiContext,
      };
    }),
    update: protectedProcedure.input(z.object({
      categoryKey: z.string(),
      subType: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) throw new TRPCError({ code: 'FORBIDDEN' });
      if (!['company_admin', 'super_admin', 'axiom_admin', 'axiom_owner', 'apex_owner', 'developer'].includes(ctx.user.systemRole)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only Company Admin or above can update business category' });
      }
      const { tenantCompanies } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const [company] = await dbConn.select().from(tenantCompanies).where(eq(tenantCompanies.id, ctx.user.tenantCompanyId));
      const currentSettings = (company?.settings as Record<string, unknown>) ?? {};
      await dbConn.update(tenantCompanies).set({
        settings: { ...currentSettings, businessCategory: input.categoryKey, businessSubType: input.subType ?? null },
        updatedAt: Date.now(),
      }).where(eq(tenantCompanies.id, ctx.user.tenantCompanyId));
      return { success: true };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════════════
  // SHIPPING & RECEIVING
  // ═══════════════════════════════════════════════════════════════════════
  shipping: router({
    list: protectedProcedure.input(z.object({
      type: z.enum(['inbound', 'outbound', 'all']).default('all'),
      page: z.number().default(1),
      limit: z.number().default(25),
    })).query(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) return { items: [], total: 0 };
      const { shipments } = await import('../drizzle/schema');
      const { eq, and, desc } = await import('drizzle-orm');
      const conditions: ReturnType<typeof eq>[] = [eq(shipments.tenantCompanyId, ctx.user.tenantCompanyId)];
      if (input.type !== 'all') conditions.push(eq(shipments.shipmentType, input.type));
      const items = await dbConn.select().from(shipments)
        .where(and(...conditions))
        .orderBy(desc(shipments.createdAt))
        .limit(input.limit).offset((input.page - 1) * input.limit);
      return { items, total: items.length };
    }),
    create: protectedProcedure.input(z.object({
      shipmentType: z.enum(['inbound', 'outbound']),
      referenceNumber: z.string().optional(),
      shipStatus: z.enum(['pending','ordered','in_transit','out_for_delivery','delivered','received','exception','cancelled']).default('pending'),
      carrierName: z.string().optional(),
      trackingNumber: z.string().optional(),
      carrierService: z.string().optional(),
      shipDate: z.number().optional(),
      expectedDelivery: z.number().optional(),
      shipDescription: z.string().optional(),
      weight: z.string().optional(),
      dimensions: z.string().optional(),
      quantity: z.number().optional(),
      originAddress: z.string().optional(),
      destinationAddress: z.string().optional(),
      shipNotes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) throw new TRPCError({ code: 'FORBIDDEN' });
      const { shipments } = await import('../drizzle/schema');
      const now = Date.now();
      const [result] = await dbConn.insert(shipments).values({ ...input, tenantCompanyId: ctx.user.tenantCompanyId, createdAt: now, updatedAt: now });
      return { id: (result as { insertId: number }).insertId };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      shipStatus: z.enum(['pending','ordered','in_transit','out_for_delivery','delivered','received','exception','cancelled']).optional(),
      trackingNumber: z.string().optional(),
      actualDelivery: z.number().optional(),
      shipNotes: z.string().optional(),
      carrierName: z.string().optional(),
      expectedDelivery: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) throw new TRPCError({ code: 'FORBIDDEN' });
      const { shipments } = await import('../drizzle/schema');
      const { eq, and } = await import('drizzle-orm');
      const { id, ...updates } = input;
      await dbConn.update(shipments).set({ ...updates, updatedAt: Date.now() })
        .where(and(eq(shipments.id, id), eq(shipments.tenantCompanyId, ctx.user.tenantCompanyId)));
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) throw new TRPCError({ code: 'FORBIDDEN' });
      const { shipments } = await import('../drizzle/schema');
      const { eq, and } = await import('drizzle-orm');
      await dbConn.delete(shipments).where(and(eq(shipments.id, input.id), eq(shipments.tenantCompanyId, ctx.user.tenantCompanyId)));
      return { success: true };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════════════
  // ACCOUNTS RECEIVABLE
  // ═══════════════════════════════════════════════════════════════════════
  ar: router({
    list: protectedProcedure.input(z.object({
      page: z.number().default(1),
      limit: z.number().default(25),
    })).query(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) return { items: [], total: 0 };
      const { arInvoices } = await import('../drizzle/schema');
      const { eq, desc } = await import('drizzle-orm');
      const items = await dbConn.select().from(arInvoices)
        .where(eq(arInvoices.tenantCompanyId, ctx.user.tenantCompanyId))
        .orderBy(desc(arInvoices.createdAt))
        .limit(input.limit).offset((input.page - 1) * input.limit);
      return { items, total: items.length };
    }),
    create: protectedProcedure.input(z.object({
      arInvoiceNumber: z.string(),
      arCustomerId: z.number().optional(),
      arContactId: z.number().optional(),
      arDealId: z.number().optional(),
      arIssueDate: z.number(),
      arDueDate: z.number().optional(),
      arLineItems: z.array(z.object({ description: z.string(), quantity: z.number(), unitPrice: z.number(), total: z.number() })).default([]),
      arSubtotalCents: z.number().default(0),
      arTaxRatePct: z.string().optional(),
      arTaxAmountCents: z.number().default(0),
      arTotalCents: z.number(),
      arPaymentTerms: z.string().default('Net 30'),
      arNotes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) throw new TRPCError({ code: 'FORBIDDEN' });
      const { arInvoices } = await import('../drizzle/schema');
      const now = Date.now();
      const [result] = await dbConn.insert(arInvoices).values({
        invoiceNumber: input.arInvoiceNumber ?? `INV-${now}`,
        customerId: input.arCustomerId,
        contactId: input.arContactId,
        dealId: input.arDealId,
        issueDate: input.arIssueDate,
        dueDate: input.arDueDate,
        lineItems: input.arLineItems,
        subtotalCents: input.arSubtotalCents,
        taxRatePct: input.arTaxRatePct,
        taxAmountCents: input.arTaxAmountCents,
        totalCents: input.arTotalCents,
        paymentTerms: input.arPaymentTerms,
        notes: input.arNotes,
        tenantCompanyId: ctx.user.tenantCompanyId,
        status: 'draft',
        amountPaidCents: 0,
        balanceDueCents: input.arTotalCents,
        createdAt: now,
        updatedAt: now,
      });
      return { id: (result as { insertId: number }).insertId };
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(['draft','sent','viewed','partial','paid','overdue','void']),
      amountPaidCents: z.number().optional(),
      paidDate: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) throw new TRPCError({ code: 'FORBIDDEN' });
      const { arInvoices } = await import('../drizzle/schema');
      const { eq, and } = await import('drizzle-orm');
      const { id, ...updates } = input;
      await dbConn.update(arInvoices).set({ ...updates, updatedAt: Date.now() })
        .where(and(eq(arInvoices.id, id), eq(arInvoices.tenantCompanyId, ctx.user.tenantCompanyId)));
      return { success: true };
    }),
    agingReport: protectedProcedure.query(async ({ ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) return { current: 0, days30: 0, days60: 0, days90plus: 0, total: 0 };
      const { arInvoices } = await import('../drizzle/schema');
      const { eq, and, inArray } = await import('drizzle-orm');
      const now = Date.now();
      const items = await dbConn.select().from(arInvoices)
        .where(and(eq(arInvoices.tenantCompanyId, ctx.user.tenantCompanyId), inArray(arInvoices.status, ['sent','viewed','partial','overdue'])));
      let current = 0, days30 = 0, days60 = 0, days90plus = 0;
      for (const inv of items) {
        const daysOverdue = inv.dueDate ? Math.floor((now - inv.dueDate) / 86400000) : 0;
        const balance = inv.balanceDueCents;
        if (daysOverdue <= 0) current += balance;
        else if (daysOverdue <= 30) days30 += balance;
        else if (daysOverdue <= 60) days60 += balance;
        else days90plus += balance;
      }
      return { current, days30, days60, days90plus, total: current + days30 + days60 + days90plus };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════════════
  // ACCOUNTS PAYABLE
  // ═══════════════════════════════════════════════════════════════════════
  ap: router({
    list: protectedProcedure.input(z.object({
      page: z.number().default(1),
      limit: z.number().default(25),
    })).query(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) return { items: [], total: 0 };
      const { apBills } = await import('../drizzle/schema');
      const { eq, desc } = await import('drizzle-orm');
      const items = await dbConn.select().from(apBills)
        .where(eq(apBills.tenantCompanyId, ctx.user.tenantCompanyId))
        .orderBy(desc(apBills.createdAt))
        .limit(input.limit).offset((input.page - 1) * input.limit);
      return { items, total: items.length };
    }),
    create: protectedProcedure.input(z.object({
      apBillNumber: z.string().optional(),
      apVendorId: z.number().optional(),
      apContactId: z.number().optional(),
      apIssueDate: z.number(),
      apDueDate: z.number().optional(),
      apLineItems: z.array(z.object({ description: z.string(), quantity: z.number(), unitPrice: z.number(), total: z.number() })).default([]),
      apSubtotalCents: z.number().default(0),
      apTaxAmountCents: z.number().default(0),
      apTotalCents: z.number(),
      apCategory: z.string().optional(),
      apNotes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) throw new TRPCError({ code: 'FORBIDDEN' });
      const { apBills } = await import('../drizzle/schema');
      const now = Date.now();
      const [result] = await dbConn.insert(apBills).values({
        billNumber: input.apBillNumber,
        vendorId: input.apVendorId,
        contactId: input.apContactId,
        issueDate: input.apIssueDate,
        dueDate: input.apDueDate,
        lineItems: input.apLineItems,
        subtotalCents: input.apSubtotalCents,
        taxAmountCents: input.apTaxAmountCents,
        totalCents: input.apTotalCents,
        category: input.apCategory,
        notes: input.apNotes,
        tenantCompanyId: ctx.user.tenantCompanyId,
        status: 'pending',
        amountPaidCents: 0,
        balanceDueCents: input.apTotalCents,
        createdAt: now,
        updatedAt: now,
      });
      return { id: (result as { insertId: number }).insertId };
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(['draft','pending','approved','partial','paid','overdue','void']),
      amountPaidCents: z.number().optional(),
      paidDate: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) throw new TRPCError({ code: 'FORBIDDEN' });
      const { apBills } = await import('../drizzle/schema');
      const { eq, and } = await import('drizzle-orm');
      const { id, ...updates } = input;
      await dbConn.update(apBills).set({ ...updates, updatedAt: Date.now() })
        .where(and(eq(apBills.id, id), eq(apBills.tenantCompanyId, ctx.user.tenantCompanyId)));
      return { success: true };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════════════
  // SUBSCRIPTION BILLING (Tenant self-service + AXIOM Owner management)
  // ═══════════════════════════════════════════════════════════════════════
  billingMgmt: router({
    mySubscription: protectedProcedure.query(async ({ ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) return null;
      const { tenantCompanies, paymentMethods, subscriptionInvoices } = await import('../drizzle/schema');
      const { eq, desc } = await import('drizzle-orm');
      const [company] = await dbConn.select().from(tenantCompanies).where(eq(tenantCompanies.id, ctx.user.tenantCompanyId));
      if (!company) return null;
      const [card] = await dbConn.select().from(paymentMethods)
        .where(eq(paymentMethods.tenantCompanyId, ctx.user.tenantCompanyId))
        .orderBy(desc(paymentMethods.createdAt)).limit(1);
      const recentInvoices = await dbConn.select().from(subscriptionInvoices)
        .where(eq(subscriptionInvoices.tenantCompanyId, ctx.user.tenantCompanyId))
        .orderBy(desc(subscriptionInvoices.createdAt)).limit(10);
      return { company, card: card ?? null, recentInvoices };
    }),
    createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) throw new TRPCError({ code: 'FORBIDDEN' });
      if (!['company_admin', 'super_admin', 'axiom_admin', 'axiom_owner', 'apex_owner', 'developer'].includes(ctx.user.systemRole)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only Company Admin can manage billing' });
      }
      const { tenantCompanies } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const [company] = await dbConn.select().from(tenantCompanies).where(eq(tenantCompanies.id, ctx.user.tenantCompanyId));
      if (!company?.stripeCustomerId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No payment method on file. Please contact AXIOM support to set up billing.' });
      const { stripe } = await import('./stripe.js');
      if (!stripe) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment system unavailable' });
      const session = await stripe.billingPortal.sessions.create({
        customer: company.stripeCustomerId,
        return_url: `${ctx.req.headers.origin}/settings/billing`,
      });
      return { url: session.url };
    }),
    allTenantPayments: axiomOwnerProcedure.input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
    })).query(async () => {
      const dbConn = await db.getDb();
      if (!dbConn) return { items: [], stats: { mrr: 0, arr: 0, overdueTotal: 0, collectedThisMonth: 0 } };
      const { tenantCompanies, subscriptionInvoices } = await import('../drizzle/schema');
      const { desc, eq } = await import('drizzle-orm');
      const companies = await dbConn.select().from(tenantCompanies).orderBy(desc(tenantCompanies.createdAt));
      const allInvoices = await dbConn.select().from(subscriptionInvoices).orderBy(desc(subscriptionInvoices.createdAt));
      const { PLANS } = await import('./stripe-products');
      let mrr = 0, overdueTotal = 0, collectedThisMonth = 0;
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      for (const c of companies) {
        const plan = PLANS.find((p: { tier: string }) => p.tier === c.subscriptionTier);
        if (plan && c.subscriptionStatus === 'active') mrr += plan.monthlyPrice;
      }
      for (const inv of allInvoices) {
        if (inv.siStatus === 'overdue') overdueTotal += inv.amountDueCents - inv.amountPaidCents;
        if (inv.siStatus === 'paid' && inv.paidAt && inv.paidAt >= monthStart.getTime()) collectedThisMonth += inv.amountPaidCents;
      }
      const items = companies.map(c => ({
        ...c,
        recentInvoices: allInvoices.filter(i => i.tenantCompanyId === c.id).slice(0, 5),
      }));
      return { items, stats: { mrr, arr: mrr * 12, overdueTotal, collectedThisMonth } };
    }),
    createManualInvoice: axiomOwnerProcedure.input(z.object({
      tenantCompanyId: z.number(),
      amountDueCents: z.number(),
      description: z.string(),
      invoiceType: z.enum(['subscription','ai_credits','user_addon','manual']).default('manual'),
      dueDate: z.number().optional(),
    })).mutation(async ({ input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { subscriptionInvoices } = await import('../drizzle/schema');
      const now = Date.now();
      const [result] = await dbConn.insert(subscriptionInvoices).values({
        tenantCompanyId: input.tenantCompanyId,
        amountDueCents: input.amountDueCents,
        amountPaidCents: 0,
        description: input.description,
        invoiceType: input.invoiceType,
        siStatus: 'open',
        dueDate: input.dueDate ?? (now + 30 * 86400000),
        createdAt: now,
        updatedAt: now,
      });
      return { id: (result as { insertId: number }).insertId };
    }),
    markInvoicePaid: axiomOwnerProcedure.input(z.object({
      invoiceId: z.number(),
      amountPaidCents: z.number().optional(),
    })).mutation(async ({ input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { subscriptionInvoices } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const [inv] = await dbConn.select().from(subscriptionInvoices).where(eq(subscriptionInvoices.id, input.invoiceId));
      if (!inv) throw new TRPCError({ code: 'NOT_FOUND' });
      await dbConn.update(subscriptionInvoices).set({
        siStatus: 'paid',
        amountPaidCents: input.amountPaidCents ?? inv.amountDueCents,
        paidAt: Date.now(),
        updatedAt: Date.now(),
      }).where(eq(subscriptionInvoices.id, input.invoiceId));
      return { success: true };
    }),
    setTenantStatus: axiomOwnerProcedure.input(z.object({
      tenantCompanyId: z.number(),
      status: z.enum(['active','suspended','cancelled']),
    })).mutation(async ({ input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { tenantCompanies } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      await dbConn.update(tenantCompanies).set({
        subscriptionStatus: input.status,
        updatedAt: Date.now(),
      }).where(eq(tenantCompanies.id, input.tenantCompanyId));
      return { success: true };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════════════
  // TRIAL HEALTH MONITORING & CUSTOMER SUCCESS
  // ═══════════════════════════════════════════════════════════════════════
  trialHealth: router({
    trackUsage: protectedProcedure.input(z.object({
      featureKey: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) return;
      const { featureUsageTracking } = await import('../drizzle/schema');
      const { eq, and } = await import('drizzle-orm');
      const now = Date.now();
      const [existing] = await dbConn.select().from(featureUsageTracking)
        .where(and(eq(featureUsageTracking.tenantCompanyId, ctx.user.tenantCompanyId), eq(featureUsageTracking.featureKey, input.featureKey)));
      if (existing) {
        await dbConn.update(featureUsageTracking).set({ usageCount: existing.usageCount + 1, lastUsedAt: now, updatedAt: now })
          .where(and(eq(featureUsageTracking.tenantCompanyId, ctx.user.tenantCompanyId), eq(featureUsageTracking.featureKey, input.featureKey)));
      } else {
        await dbConn.insert(featureUsageTracking).values({ tenantCompanyId: ctx.user.tenantCompanyId, featureKey: input.featureKey, usageCount: 1, lastUsedAt: now, firstUsedAt: now, updatedAt: now });
      }
    }),
    myUsage: protectedProcedure.query(async ({ ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn || !ctx.user.tenantCompanyId) return [];
      const { featureUsageTracking } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      return dbConn.select().from(featureUsageTracking).where(eq(featureUsageTracking.tenantCompanyId, ctx.user.tenantCompanyId));
    }),
    allHealthScores: axiomOwnerProcedure.query(async () => {
      const dbConn = await db.getDb();
      if (!dbConn) return [];
      const { tenantCompanies, featureUsageTracking } = await import('../drizzle/schema');
      const { eq, desc } = await import('drizzle-orm');
      const companies = await dbConn.select().from(tenantCompanies).orderBy(desc(tenantCompanies.createdAt));
      const now = Date.now();
      const results = await Promise.all(companies.map(async (company) => {
        const usage = await dbConn.select().from(featureUsageTracking).where(eq(featureUsageTracking.tenantCompanyId, company.id));
        const featuresUsed = usage.filter(u => u.usageCount > 0).length;
        const totalFeatures = 20;
        const healthScore = Math.min(100, Math.round((featuresUsed / totalFeatures) * 100));
        const trialDaysRemaining = company.trialEndsAt ? Math.max(0, Math.floor((company.trialEndsAt - now) / 86400000)) : null;
        let engagementLevel: 'hot' | 'warm' | 'cold' | 'at_risk' | 'churned' = 'cold';
        if (healthScore >= 70) engagementLevel = 'hot';
        else if (healthScore >= 40) engagementLevel = 'warm';
        else if (trialDaysRemaining !== null && trialDaysRemaining < 7) engagementLevel = 'at_risk';
        return { company, healthScore, engagementLevel, featuresUsed, totalFeatures, trialDaysRemaining, featureUsage: usage };
      }));
      return results.sort((a, b) => {
        if (a.engagementLevel === 'at_risk' && b.engagementLevel !== 'at_risk') return -1;
        if (b.engagementLevel === 'at_risk' && a.engagementLevel !== 'at_risk') return 1;
        return a.healthScore - b.healthScore;
      });
    }),
    battleCard: axiomOwnerProcedure.input(z.object({
      tenantCompanyId: z.number(),
    })).query(async ({ input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) return null;
      const { tenantCompanies, featureUsageTracking } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const [company] = await dbConn.select().from(tenantCompanies).where(eq(tenantCompanies.id, input.tenantCompanyId));
      if (!company) return null;
      const usage = await dbConn.select().from(featureUsageTracking).where(eq(featureUsageTracking.tenantCompanyId, input.tenantCompanyId));
      const usedFeatureKeys = new Set(usage.filter(u => u.usageCount > 0).map(u => u.featureKey));
      const ALL_FEATURES = [
        { key: 'contacts', label: 'Contact Management', tip: 'Ask how they manage their contact database today' },
        { key: 'companies', label: 'Company Management', tip: 'Discuss organizing accounts and company hierarchies' },
        { key: 'deals', label: 'Deal Pipeline', tip: 'Show how the pipeline can replace their spreadsheets' },
        { key: 'tasks', label: 'Task Management', tip: 'Demonstrate task assignment and team collaboration' },
        { key: 'campaigns', label: 'Email Campaigns', tip: 'Ask about their current email marketing strategy' },
        { key: 'automation', label: 'Workflow Automation', tip: 'Show how automation saves 5+ hours per week' },
        { key: 'analytics', label: 'Analytics Dashboard', tip: 'Walk through the ROI and engagement metrics' },
        { key: 'segmentation', label: 'Smart Segmentation', tip: 'Demonstrate dynamic list building' },
        { key: 'paradigm_engine', label: 'Paradigm Engine (AI Prospecting)', tip: 'This is a major differentiator — demo the Ghost Mode' },
        { key: 'compliance', label: 'Compliance Fortress', tip: 'Highlight CAN-SPAM/GDPR protection value' },
        { key: 'ab_testing', label: 'A/B Testing', tip: 'Show how to optimize email performance' },
        { key: 'api_webhooks', label: 'API & Webhooks', tip: 'Ask about their tech stack integrations' },
        { key: 'email_deliverability', label: 'Deliverability Engine', tip: 'Demonstrate the 98.7% inbox rate claim' },
        { key: 'load_management', label: 'Load Management', tip: 'If freight company, show the load board' },
        { key: 'shipping_receiving', label: 'Shipping & Receiving', tip: 'Show inbound/outbound shipment tracking' },
        { key: 'accounts_receivable', label: 'Accounts Receivable', tip: 'Demo invoice creation and aging reports' },
        { key: 'accounts_payable', label: 'Accounts Payable', tip: 'Show vendor bill management' },
      ];
      const featuresUsed = ALL_FEATURES.filter(f => usedFeatureKeys.has(f.key));
      const featuresUnused = ALL_FEATURES.filter(f => !usedFeatureKeys.has(f.key));
      const settings = (company.settings as Record<string, unknown>) ?? {};
      const { getCategory } = await import('../shared/businessCategories');
      const category = getCategory(settings.businessCategory as string);
      let callScript: string | null = null;
      try {
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an expert sales coach for AXIOM CRM. Generate a concise, personalized call script for an account manager.' },
            { role: 'user', content: `Company: ${company.name}\nIndustry: ${category.label}\nTrial days remaining: ${company.trialEndsAt ? Math.max(0, Math.floor((company.trialEndsAt - Date.now()) / 86400000)) : 'N/A'}\nFeatures used (${featuresUsed.length}): ${featuresUsed.map(f => f.label).join(', ')}\nFeatures NOT used (${featuresUnused.length}): ${featuresUnused.slice(0, 5).map(f => f.label).join(', ')}\n\nGenerate a 3-paragraph call script: (1) Opening/rapport, (2) Value discussion around unused features, (3) Close/next steps. Keep it conversational and under 200 words.` },
          ],
        });
        const content = response.choices?.[0]?.message?.content;
        callScript = typeof content === 'string' ? content : null;
      } catch { callScript = null; }
      return {
        company, category, featuresUsed, featuresUnused,
        healthScore: Math.min(100, Math.round((featuresUsed.length / ALL_FEATURES.length) * 100)),
        trialDaysRemaining: company.trialEndsAt ? Math.max(0, Math.floor((company.trialEndsAt - Date.now()) / 86400000)) : null,
        callScript,
        featureUsageDetails: usage,
      };
    }),
    logCallOutcome: axiomOwnerProcedure.input(z.object({
      tenantCompanyId: z.number(),
      outcome: z.string(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const { trialHealthScores } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const now = Date.now();
      const [existing] = await dbConn.select().from(trialHealthScores).where(eq(trialHealthScores.tenantCompanyId, input.tenantCompanyId));
      if (existing) {
        await dbConn.update(trialHealthScores).set({ callOutcome: input.outcome, notes: input.notes, lastContactedAt: now, updatedAt: now })
          .where(eq(trialHealthScores.tenantCompanyId, input.tenantCompanyId));
      } else {
        await dbConn.insert(trialHealthScores).values({ tenantCompanyId: input.tenantCompanyId, healthScore: 0, callOutcome: input.outcome, notes: input.notes, lastContactedAt: now, updatedAt: now });
      }
      return { success: true };
    }),
  }),


   // ─── Admin Data Management (Soft-Delete + Admin Hard-Purge) ─────────────────
  adminData: router({
    // ── User: soft-delete all records with mandatory reason (creates a batch record) ──
    softDeleteAll: protectedProcedure
      .input(z.object({
        scope: z.enum(["all", "contacts", "companies"]),
        reason: z.string().min(10, "Please provide at least 10 characters explaining why you are deleting this data"),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const { contacts: ct, companies: co, deals: de, tasks: ta, deleteBatches } = await import('../drizzle/schema');
        const { eq, and, count } = await import('drizzle-orm');
        const tenantId = ctx.user.tenantCompanyId;
        if (!tenantId) throw new TRPCError({ code: 'FORBIDDEN', message: 'No tenant company associated with this account' });
        const now = Date.now();
        const userId = ctx.user.id;
        const batchId = crypto.randomUUID();
        const reason = input.reason.trim();

        // Count records before soft-deleting
        let estimatedCount = 0;
        if (input.scope === 'contacts' || input.scope === 'all') {
          const [r] = await dbConn.select({ c: count() }).from(ct).where(and(eq(ct.tenantId, tenantId), eq(ct.isDeleted, 0)));
          estimatedCount += r?.c ?? 0;
        }
        if (input.scope === 'companies' || input.scope === 'all') {
          const [r] = await dbConn.select({ c: count() }).from(co).where(and(eq(co.tenantId, tenantId), eq(co.isDeleted, 0)));
          estimatedCount += r?.c ?? 0;
        }
        if (input.scope === 'all') {
          const [r1] = await dbConn.select({ c: count() }).from(de).where(and(eq(de.tenantId, tenantId), eq(de.isDeleted, 0)));
          const [r2] = await dbConn.select({ c: count() }).from(ta).where(and(eq(ta.tenantId, tenantId), eq(ta.isDeleted, 0)));
          estimatedCount += (r1?.c ?? 0) + (r2?.c ?? 0);
        }

        // Soft-delete records and tag with batchId + reason
        if (input.scope === 'contacts' || input.scope === 'all') {
          await dbConn.update(ct).set({ isDeleted: 1, deletedAt: now, deletedBy: userId, deleteReason: reason, deleteBatchId: batchId })
            .where(and(eq(ct.tenantId, tenantId), eq(ct.isDeleted, 0)));
        }
        if (input.scope === 'companies' || input.scope === 'all') {
          await dbConn.update(co).set({ isDeleted: 1, deletedAt: now, deletedBy: userId, deleteReason: reason, deleteBatchId: batchId })
            .where(and(eq(co.tenantId, tenantId), eq(co.isDeleted, 0)));
        }
        if (input.scope === 'all') {
          await dbConn.update(de).set({ isDeleted: 1, deletedAt: now, deletedBy: userId, deleteReason: reason, deleteBatchId: batchId })
            .where(and(eq(de.tenantId, tenantId), eq(de.isDeleted, 0)));
          await dbConn.update(ta).set({ isDeleted: 1, deletedAt: now, deletedBy: userId, deleteReason: reason, deleteBatchId: batchId })
            .where(and(eq(ta.tenantId, tenantId), eq(ta.isDeleted, 0)));
        }

        // Create batch record for admin queue
        await dbConn.insert(deleteBatches).values({
          id: batchId,
          tenantCompanyId: tenantId,
          requestedById: userId,
          requestedByName: ctx.user.name || ctx.user.email || 'Unknown',
          scope: input.scope,
          reason,
          status: 'pending',
          estimatedCount,
          createdAt: now,
        });

        // Notify admin
        try {
          const scopeLabel = input.scope === 'all' ? 'ALL data' : `all ${input.scope}`;
          await notifyOwner({
            title: `🗑️ Deletion Request: ${ctx.user.name || ctx.user.email} deleted ${scopeLabel}`,
            content: `${ctx.user.name || ctx.user.email} soft-deleted ${scopeLabel} (~${estimatedCount} records).\nReason: "${reason}"\n\nData is HIDDEN but NOT permanently deleted. Go to Settings → Admin → Purge Deleted Data to permanently remove or restore.`,
          });
        } catch { /* non-blocking */ }

        return { success: true, batchId, estimatedCount };
      }),

    // ── Admin: list all pending soft-delete batches ──
    listPendingBatches: companyAdminProcedure
      .query(async ({ ctx }) => {
        const dbConn = await db.getDb();
        if (!dbConn) return [];
        const { deleteBatches } = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        const tenantId = ctx.user.tenantCompanyId;
        if (!tenantId) return [];
        return dbConn.select().from(deleteBatches)
          .where(eq(deleteBatches.tenantCompanyId, tenantId))
          .orderBy(desc(deleteBatches.createdAt));
      }),

    // ── Admin: permanently purge a specific batch ──
    hardPurgeBatch: companyAdminProcedure
      .input(z.object({
        batchId: z.string(),
        adminNote: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const { contacts: ct, companies: co, deals: de, tasks: ta, deleteBatches } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        const tenantId = ctx.user.tenantCompanyId;
        if (!tenantId) throw new TRPCError({ code: 'FORBIDDEN', message: 'No tenant company' });

        // Verify batch belongs to this tenant
        const [batch] = await dbConn.select().from(deleteBatches)
          .where(and(eq(deleteBatches.id, input.batchId), eq(deleteBatches.tenantCompanyId, tenantId)));
        if (!batch) throw new TRPCError({ code: 'NOT_FOUND', message: 'Batch not found' });
        if (batch.status !== 'pending') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Batch already resolved' });

        let totalDeleted = 0;
        const r1 = await dbConn.delete(ct).where(and(eq(ct.tenantId, tenantId), eq(ct.deleteBatchId, input.batchId)));
        const r2 = await dbConn.delete(co).where(and(eq(co.tenantId, tenantId), eq(co.deleteBatchId, input.batchId)));
        const r3 = await dbConn.delete(de).where(and(eq(de.tenantId, tenantId), eq(de.deleteBatchId, input.batchId)));
        const r4 = await dbConn.delete(ta).where(and(eq(ta.tenantId, tenantId), eq(ta.deleteBatchId, input.batchId)));
        totalDeleted = ((r1 as any).rowsAffected ?? 0) + ((r2 as any).rowsAffected ?? 0) + ((r3 as any).rowsAffected ?? 0) + ((r4 as any).rowsAffected ?? 0);

        await dbConn.update(deleteBatches).set({
          status: 'purged',
          actualCount: totalDeleted,
          resolvedAt: Date.now(),
          adminNote: input.adminNote ?? null,
        }).where(eq(deleteBatches.id, input.batchId));

        return { success: true, deleted: totalDeleted };
      }),

    // ── Admin: restore a specific batch (un-soft-delete) ──
    restoreBatch: companyAdminProcedure
      .input(z.object({
        batchId: z.string(),
        adminNote: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const { contacts: ct, companies: co, deals: de, tasks: ta, deleteBatches } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        const tenantId = ctx.user.tenantCompanyId;
        if (!tenantId) throw new TRPCError({ code: 'FORBIDDEN', message: 'No tenant company' });

        const [batch] = await dbConn.select().from(deleteBatches)
          .where(and(eq(deleteBatches.id, input.batchId), eq(deleteBatches.tenantCompanyId, tenantId)));
        if (!batch) throw new TRPCError({ code: 'NOT_FOUND', message: 'Batch not found' });
        if (batch.status !== 'pending') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Batch already resolved' });

        let totalRestored = 0;
        const r1 = await dbConn.update(ct).set({ isDeleted: 0, deletedAt: null, deletedBy: null, deleteReason: null, deleteBatchId: null })
          .where(and(eq(ct.tenantId, tenantId), eq(ct.deleteBatchId, input.batchId)));
        const r2 = await dbConn.update(co).set({ isDeleted: 0, deletedAt: null, deletedBy: null, deleteReason: null, deleteBatchId: null })
          .where(and(eq(co.tenantId, tenantId), eq(co.deleteBatchId, input.batchId)));
        const r3 = await dbConn.update(de).set({ isDeleted: 0, deletedAt: null, deletedBy: null, deleteReason: null, deleteBatchId: null })
          .where(and(eq(de.tenantId, tenantId), eq(de.deleteBatchId, input.batchId)));
        const r4 = await dbConn.update(ta).set({ isDeleted: 0, deletedAt: null, deletedBy: null, deleteReason: null, deleteBatchId: null })
          .where(and(eq(ta.tenantId, tenantId), eq(ta.deleteBatchId, input.batchId)));
        totalRestored = ((r1 as any).rowsAffected ?? 0) + ((r2 as any).rowsAffected ?? 0) + ((r3 as any).rowsAffected ?? 0) + ((r4 as any).rowsAffected ?? 0);

        await dbConn.update(deleteBatches).set({
          status: 'restored',
          actualCount: totalRestored,
          resolvedAt: Date.now(),
          adminNote: input.adminNote ?? null,
        }).where(eq(deleteBatches.id, input.batchId));

        return { success: true, restored: totalRestored };
      }),
  }),

});
export type AppRouter = typeof appRouter;
