import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
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

  contacts: router({
    list: protectedProcedure.input(z.object({
      search: z.string().optional(),
      stage: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listContacts(ctx.user.id, input);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getContact(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      title: z.string().optional(),
      companyId: z.number().optional(),
      lifecycleStage: z.enum(["subscriber", "lead", "mql", "sql", "opportunity", "customer", "evangelist"]).optional(),
      source: z.string().optional(),
      tags: z.array(z.string()).optional(),
      customFields: z.record(z.string(), z.string()).optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const now = Date.now();
      const contactData = { ...input, userId: ctx.user.id, createdAt: now, updatedAt: now };
      const id = await db.createContact(contactData as any);
      await db.createActivity({ userId: ctx.user.id, contactId: id, type: "contact_created", subject: `Created contact ${input.firstName} ${input.lastName ?? ""}`.trim() });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      title: z.string().optional(),
      companyId: z.number().nullable().optional(),
      lifecycleStage: z.enum(["subscriber", "lead", "mql", "sql", "opportunity", "customer", "evangelist"]).optional(),
      leadScore: z.number().optional(),
      source: z.string().optional(),
      tags: z.array(z.string()).optional(),
      customFields: z.record(z.string(), z.string()).optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateContact(id, ctx.user.id, data as any);
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
      industry: z.string().optional(),
      size: z.string().optional(),
      revenue: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      website: z.string().optional(),
      description: z.string().optional(),
      parentId: z.number().optional(),
      tags: z.array(z.string()).optional(),
      customFields: z.record(z.string(), z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const now = Date.now();
      const id = await db.createCompany({ ...input, userId: ctx.user.id, createdAt: now, updatedAt: now } as any);
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      domain: z.string().optional(),
      industry: z.string().optional(),
      size: z.string().optional(),
      revenue: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      website: z.string().optional(),
      description: z.string().optional(),
      parentId: z.number().nullable().optional(),
      tags: z.array(z.string()).optional(),
            customFields: z.record(z.string(), z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateCompany(id, ctx.user.id, data as any);
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
      limit: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listActivities(ctx.user.id, input);
    }),
    create: protectedProcedure.input(z.object({
      contactId: z.number().optional(),
      companyId: z.number().optional(),
      dealId: z.number().optional(),
      type: z.enum(["note", "email", "call", "meeting", "task"]),
      subject: z.string().optional(),
      body: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.createActivity({ ...input, userId: ctx.user.id });
      return { success: true };
    }),
  }),

  tasks: router({
    list: protectedProcedure.input(z.object({
      status: z.string().optional(),
      contactId: z.number().optional(),
      dealId: z.number().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listTasks(ctx.user.id, input);
    }),
    create: protectedProcedure.input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      contactId: z.number().optional(),
      dealId: z.number().optional(),
      assignedTo: z.number().optional(),
      dueDate: z.number().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createTask({ ...input, userId: ctx.user.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      dueDate: z.number().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      status: z.enum(["todo", "in_progress", "done", "cancelled"]).optional(),
      assignedTo: z.number().optional(),
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
      const id = await db.createEmailTemplate({ ...input, userId: ctx.user.id } as any);
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
      await db.updateEmailTemplate(id, ctx.user.id, data as any);
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
          { role: "system", content: `You are an email deliverability expert. Analyze the following email for spam triggers and deliverability issues. Return a JSON response with: score (0-100, where 0 is perfect and 100 is definitely spam), issues (array of {severity: "critical"|"warning"|"info", message: string, fix: string}), and overallRating ("excellent"|"good"|"fair"|"poor"). Be thorough and check for: spam trigger words, excessive caps, too many links, missing unsubscribe, image-to-text ratio, deceptive subject lines, and other common spam triggers.` },
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
                score: { type: "number", description: "Spam score 0-100" },
                overallRating: { type: "string", enum: ["excellent", "good", "fair", "poor"] },
                issues: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      severity: { type: "string", enum: ["critical", "warning", "info"] },
                      message: { type: "string" },
                      fix: { type: "string" },
                    },
                    required: ["severity", "message", "fix"],
                    additionalProperties: false,
                  },
                },
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

  domainHealth: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listDomainHealth(ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      domain: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createDomainHealth({ userId: ctx.user.id, domain: input.domain });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      spfStatus: z.enum(["pass", "fail", "missing", "unknown"]).optional(),
      dkimStatus: z.enum(["pass", "fail", "missing", "unknown"]).optional(),
      dmarcStatus: z.enum(["pass", "fail", "missing", "unknown"]).optional(),
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
          { role: "system", content: `You are a DNS and email authentication expert. Given a domain, provide guidance on setting up SPF, DKIM, and DMARC records. Return JSON with recommendations for each protocol, including the recommended DNS records to add. Be specific and actionable.` },
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
      const id = await db.createWorkflow({ ...input, userId: ctx.user.id } as any);
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
      await db.updateWorkflow(id, ctx.user.id, data as any);
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
      const id = await db.createAbTest({ ...input, userId: ctx.user.id } as any);
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["draft", "running", "completed"]).optional(),
      winnerVariant: z.string().optional(),
      results: z.record(z.string(), z.unknown()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateAbTest(id, ctx.user.id, data as any);
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
});

export type AppRouter = typeof appRouter;
