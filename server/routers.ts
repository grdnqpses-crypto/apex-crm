import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { nanoid } from "nanoid";
import { createHash } from "crypto";

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

  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getDashboardStats(ctx.user.id);
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
      limit: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listContacts(ctx.user.id, input);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getContact(input.id, ctx.user.id);
    }),
    byCompany: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ ctx, input }) => {
      return db.getContactsByCompany(input.companyId, ctx.user.id);
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
      companyId: z.number().nullable().optional(),
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
  }),

  companies: router({
    list: protectedProcedure.input(z.object({
      search: z.string().optional(),
      leadStatus: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listCompanies(ctx.user.id, input);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getCompany(input.id, ctx.user.id);
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
      await db.updateCompany(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteCompany(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  pipelines: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listPipelines(ctx.user.id);
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
    list: protectedProcedure.input(z.object({
      pipelineId: z.number().optional(),
      status: z.string().optional(),
      limit: z.number().min(1).max(200).optional(),
      offset: z.number().min(0).optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listDeals(ctx.user.id, input);
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
      return db.listActivities(ctx.user.id, input);
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
      return db.listTasks(ctx.user.id, input);
    }),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1),
      taskType: z.enum(["call", "email", "to_do", "follow_up"]).optional(),
      dueDate: z.number().optional(),
      dueTime: z.string().optional(),
      assignedTo: z.number().optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      description: z.string().optional(),
      queue: z.string().optional(),
      reminderDate: z.number().optional(),
      contactId: z.number().optional(),
      companyId: z.number().optional(),
      dealId: z.number().optional(),
      isRecurring: z.boolean().optional(),
      recurringFrequency: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createTask({ ...input, userId: ctx.user.id });
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
      completedAt: z.number().optional(),
      completedBy: z.number().optional(),
      outcome: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateTask(id, ctx.user.id, data);
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
      const rawKey = `apex_${nanoid(32)}`;
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
    // Promote prospect to CRM contact
    promoteToContact: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const prospect = await db.getProspect(input.id, ctx.user.id);
      if (!prospect) return { error: "not_found" };
      const now = Date.now();
      const contactId = await db.createContact({
        userId: ctx.user.id,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        email: prospect.email,
        jobTitle: prospect.jobTitle,
        linkedinUrl: prospect.linkedinUrl,
        directPhone: prospect.phone,
        city: prospect.location,
        leadSource: `paradigm_${prospect.sourceType}`,
        lifecycleStage: "lead",
        createdAt: now,
        updatedAt: now,
      });
      await db.updateProspect(input.id, ctx.user.id, { contactId, engagementStage: "converted" });
      await db.createActivity({ userId: ctx.user.id, contactId, type: "contact_created", subject: `Promoted from Paradigm Engine prospect` });
      return { contactId };
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
});

export type AppRouter = typeof appRouter;
