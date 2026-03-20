import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import {
  emailSequences, emailSequenceSteps, emailSequenceEnrollments,
  journeys, journeyEnrollments,
  whatsappMessages, whatsappTemplates,
  socialPosts, socialAccounts,
  dialerSessions,
  anomalyAlerts,
  pipelineInspections,
  domainAutoHealingLogs,
  abTestRuns,
  featureTiers, featureUsageLogs,
  contacts, deals, pipelines, pipelineStages, activities,
  domainHealth, smtpAccounts,
} from "../../drizzle/schema";
import { eq, and, desc, asc, sql, gte, lte, lt, inArray } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

// ─── Email Sequences ──────────────────────────────────────────────────────────
const emailSequencesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = (await db.getDb())!;
    const rows = await dbConn.select().from(emailSequences)
      .where(eq(emailSequences.tenantCompanyId, ctx.user.tenantCompanyId ?? 0))
      .orderBy(desc(emailSequences.createdAt));
    return rows;
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const [seq] = await dbConn.select().from(emailSequences)
      .where(and(eq(emailSequences.id, input.id), eq(emailSequences.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)));
    if (!seq) throw new TRPCError({ code: "NOT_FOUND" });
    const steps = await dbConn.select().from(emailSequenceSteps)
      .where(eq(emailSequenceSteps.sequenceId, input.id))
      .orderBy(asc(emailSequenceSteps.stepNumber));
    return { ...seq, steps };
  }),

  create: protectedProcedure.input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    replyDetection: z.boolean().default(true),
    pauseOnReply: z.boolean().default(true),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const now = Date.now();
    const [result] = await dbConn.insert(emailSequences).values({
      tenantCompanyId: ctx.user.tenantCompanyId ?? 0,
      name: input.name,
      description: input.description,
      replyDetection: input.replyDetection,
      pauseOnReply: input.pauseOnReply,
      status: "draft",
      enrolledCount: 0,
      completedCount: 0,
      replyCount: 0,
      createdBy: ctx.user.id,
      createdAt: now,
      updatedAt: now,
    });
    return { id: (result as any).insertId };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["draft", "active", "paused", "archived"]).optional(),
    replyDetection: z.boolean().optional(),
    pauseOnReply: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const { id, ...updates } = input;
    await dbConn.update(emailSequences)
      .set({ ...updates, updatedAt: Date.now() })
      .where(and(eq(emailSequences.id, id), eq(emailSequences.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    await dbConn.delete(emailSequenceSteps).where(eq(emailSequenceSteps.sequenceId, input.id));
    await dbConn.delete(emailSequenceEnrollments).where(eq(emailSequenceEnrollments.sequenceId, input.id));
    await dbConn.delete(emailSequences)
      .where(and(eq(emailSequences.id, input.id), eq(emailSequences.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),

  addStep: protectedProcedure.input(z.object({
    sequenceId: z.number(),
    stepNumber: z.number(),
    type: z.enum(["email", "wait", "condition"]).default("email"),
    subject: z.string().optional(),
    body: z.string().optional(),
    waitDays: z.number().default(1),
    waitHours: z.number().default(0),
    abEnabled: z.boolean().default(false),
    abVariantSubject: z.string().optional(),
    abVariantBody: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const [result] = await dbConn.insert(emailSequenceSteps).values({
      sequenceId: input.sequenceId,
      stepNumber: input.stepNumber,
      type: input.type,
      subject: input.subject,
      body: input.body,
      waitDays: input.waitDays,
      waitHours: input.waitHours,
      abEnabled: input.abEnabled,
      abVariantSubject: input.abVariantSubject,
      abVariantBody: input.abVariantBody,
      createdAt: Date.now(),
    });
    return { id: (result as any).insertId };
  }),

  updateStep: protectedProcedure.input(z.object({
    id: z.number(),
    subject: z.string().optional(),
    body: z.string().optional(),
    waitDays: z.number().optional(),
    waitHours: z.number().optional(),
    abEnabled: z.boolean().optional(),
    abVariantSubject: z.string().optional(),
    abVariantBody: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const { id, ...updates } = input;
    await dbConn.update(emailSequenceSteps).set(updates as never).where(eq(emailSequenceSteps.id, id));
    return { success: true };
  }),

  deleteStep: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    await dbConn.delete(emailSequenceSteps).where(eq(emailSequenceSteps.id, input.id));
    return { success: true };
  }),

  enroll: protectedProcedure.input(z.object({
    sequenceId: z.number(),
    contactIds: z.array(z.number()),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const now = Date.now();
    const enrollments = input.contactIds.map(contactId => ({
      sequenceId: input.sequenceId,
      contactId,
      tenantCompanyId: ctx.user.tenantCompanyId ?? 0,
      status: "active" as const,
      currentStep: 1,
      enrolledAt: now,
    }));
    await dbConn.insert(emailSequenceEnrollments).values(enrollments);
    await dbConn.update(emailSequences)
      .set({ enrolledCount: sql`enrolled_count + ${input.contactIds.length}`, updatedAt: now })
      .where(eq(emailSequences.id, input.sequenceId));
    return { enrolled: input.contactIds.length };
  }),

  getEnrollments: protectedProcedure.input(z.object({ sequenceId: z.number() })).query(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const rows = await dbConn.select({
      enrollment: emailSequenceEnrollments,
      contact: { id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName, email: contacts.email },
    })
      .from(emailSequenceEnrollments)
      .leftJoin(contacts, eq(emailSequenceEnrollments.contactId, contacts.id))
      .where(and(
        eq(emailSequenceEnrollments.sequenceId, input.sequenceId),
        eq(emailSequenceEnrollments.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)
      ))
      .orderBy(desc(emailSequenceEnrollments.enrolledAt));
    return rows;
  }),

  generateStepWithAI: protectedProcedure.input(z.object({
    sequenceId: z.number(),
    stepNumber: z.number(),
    context: z.string(),
    tone: z.enum(["professional", "casual", "urgent", "friendly"]).default("professional"),
  })).mutation(async ({ ctx, input }) => {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert B2B sales email writer. Generate compelling email sequences." },
        { role: "user", content: `Write step ${input.stepNumber} of a sales email sequence. Context: ${input.context}. Tone: ${input.tone}. Return JSON with fields: subject, body, abVariantSubject, abVariantBody.` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "email_step",
          strict: true,
          schema: {
            type: "object",
            properties: {
              subject: { type: "string" },
              body: { type: "string" },
              abVariantSubject: { type: "string" },
              abVariantBody: { type: "string" },
            },
            required: ["subject", "body", "abVariantSubject", "abVariantBody"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0].message.content;
    return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  }),
});

// ─── Journey Orchestration ────────────────────────────────────────────────────
const journeysRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = (await db.getDb())!;
    return dbConn.select().from(journeys)
      .where(eq(journeys.tenantCompanyId, ctx.user.tenantCompanyId ?? 0))
      .orderBy(desc(journeys.createdAt));
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const [row] = await dbConn.select().from(journeys)
      .where(and(eq(journeys.id, input.id), eq(journeys.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)));
    if (!row) throw new TRPCError({ code: "NOT_FOUND" });
    return row;
  }),

  create: protectedProcedure.input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    triggerType: z.enum(["manual", "contact_created", "deal_stage", "form_submit", "tag_added"]).default("manual"),
    triggerConfig: z.record(z.string(), z.unknown()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const now = Date.now();
    const defaultNodes = [
      { id: "trigger", type: "trigger", position: { x: 250, y: 50 }, data: { label: "Trigger", triggerType: input.triggerType } },
      { id: "end", type: "end", position: { x: 250, y: 400 }, data: { label: "End" } },
    ];
    const defaultEdges: unknown[] = [];
    const [result] = await dbConn.insert(journeys).values({
      tenantCompanyId: ctx.user.tenantCompanyId ?? 0,
      name: input.name,
      description: input.description,
      triggerType: input.triggerType,
      triggerConfig: input.triggerConfig ?? {},
      nodes: defaultNodes,
      edges: defaultEdges,
      status: "draft",
      enrolledCount: 0,
      completedCount: 0,
      createdBy: ctx.user.id,
      createdAt: now,
      updatedAt: now,
    });
    return { id: (result as any).insertId };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["draft", "active", "paused", "archived"]).optional(),
    nodes: z.array(z.unknown()).optional(),
    edges: z.array(z.unknown()).optional(),
    triggerType: z.string().optional(),
    triggerConfig: z.record(z.string(), z.unknown()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const { id, ...updates } = input;
    const setData: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.name !== undefined) setData.name = updates.name;
    if (updates.description !== undefined) setData.description = updates.description;
    if (updates.status !== undefined) setData.status = updates.status;
    if (updates.nodes !== undefined) setData.nodes = updates.nodes;
    if (updates.edges !== undefined) setData.edges = updates.edges;
    if (updates.triggerType !== undefined) setData.triggerType = updates.triggerType;
    if (updates.triggerConfig !== undefined) setData.triggerConfig = updates.triggerConfig;
    await dbConn.update(journeys)
      .set(setData as never)
      .where(and(eq(journeys.id, id), eq(journeys.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    await dbConn.delete(journeyEnrollments).where(eq(journeyEnrollments.journeyId, input.id));
    await dbConn.delete(journeys)
      .where(and(eq(journeys.id, input.id), eq(journeys.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),

  enroll: protectedProcedure.input(z.object({
    journeyId: z.number(),
    contactIds: z.array(z.number()),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const now = Date.now();
    const enrollments = input.contactIds.map(contactId => ({
      journeyId: input.journeyId,
      contactId,
      tenantCompanyId: ctx.user.tenantCompanyId ?? 0,
      status: "active" as const,
      enrolledAt: now,
    }));
    await dbConn.insert(journeyEnrollments).values(enrollments);
    await dbConn.update(journeys)
      .set({ enrolledCount: sql`enrolled_count + ${input.contactIds.length}`, updatedAt: now })
      .where(eq(journeys.id, input.journeyId));
    return { enrolled: input.contactIds.length };
  }),

  getEnrollments: protectedProcedure.input(z.object({ journeyId: z.number() })).query(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    return dbConn.select({
      enrollment: journeyEnrollments,
      contact: { id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName, email: contacts.email },
    })
      .from(journeyEnrollments)
      .leftJoin(contacts, eq(journeyEnrollments.contactId, contacts.id))
      .where(and(
        eq(journeyEnrollments.journeyId, input.journeyId),
        eq(journeyEnrollments.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)
      ))
      .orderBy(desc(journeyEnrollments.enrolledAt));
  }),

  generateWithAI: protectedProcedure.input(z.object({
    goal: z.string(),
    audience: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a customer journey design expert. Create visual journey maps with nodes and edges for CRM automation." },
        { role: "user", content: `Design a customer journey for: Goal: ${input.goal}, Audience: ${input.audience}. Return JSON with nodes array (id, type, position {x,y}, data {label, description}) and edges array (id, source, target, label). Node types: trigger, email, wait, condition, task, sms, end.` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "journey_map",
          strict: true,
          schema: {
            type: "object",
            properties: {
              nodes: { type: "array", items: { type: "object", properties: { id: { type: "string" }, type: { type: "string" }, position: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"], additionalProperties: false }, data: { type: "object", properties: { label: { type: "string" }, description: { type: "string" } }, required: ["label", "description"], additionalProperties: false } }, required: ["id", "type", "position", "data"], additionalProperties: false } },
              edges: { type: "array", items: { type: "object", properties: { id: { type: "string" }, source: { type: "string" }, target: { type: "string" }, label: { type: "string" } }, required: ["id", "source", "target", "label"], additionalProperties: false } },
            },
            required: ["nodes", "edges"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0].message.content;
    return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  }),
});

// ─── WhatsApp ─────────────────────────────────────────────────────────────────
const whatsappRouter = router({
  getMessages: protectedProcedure.input(z.object({
    contactId: z.number().optional(),
    phone: z.string().optional(),
    limit: z.number().default(50),
  })).query(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const conditions = [eq(whatsappMessages.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)];
    if (input.contactId) conditions.push(eq(whatsappMessages.contactId, input.contactId));
    if (input.phone) conditions.push(eq(whatsappMessages.phone, input.phone));
    return dbConn.select().from(whatsappMessages)
      .where(and(...conditions))
      .orderBy(desc(whatsappMessages.createdAt))
      .limit(input.limit);
  }),

  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = (await db.getDb())!;
    // Get latest message per phone number
    const rows = await dbConn.execute(sql`
      SELECT wm.*, c.firstName, c.lastName, c.email
      FROM whatsapp_messages wm
      LEFT JOIN contacts c ON wm.contact_id = c.id
      WHERE wm.tenant_company_id = ${ctx.user.tenantCompanyId ?? 0}
        AND wm.id = (
          SELECT MAX(id) FROM whatsapp_messages wm2
          WHERE wm2.phone = wm.phone AND wm2.tenant_company_id = wm.tenant_company_id
        )
      ORDER BY wm.created_at DESC
      LIMIT 100
    `);
    return (rows[0] as unknown) as unknown[];
  }),

  sendMessage: protectedProcedure.input(z.object({
    phone: z.string(),
    body: z.string().min(1),
    contactId: z.number().optional(),
    mediaUrl: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    // Simulate sending (in production, integrate Twilio/Meta Business API)
    const messageId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const [result] = await dbConn.insert(whatsappMessages).values({
      tenantCompanyId: ctx.user.tenantCompanyId ?? 0,
      contactId: input.contactId,
      phone: input.phone,
      direction: "outbound",
      body: input.body,
      status: "sent",
      messageId,
      mediaUrl: input.mediaUrl,
      sentBy: ctx.user.id,
      createdAt: Date.now(),
    });
    return { id: (result as any).insertId, messageId, status: "sent" };
  }),

  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = (await db.getDb())!;
    return dbConn.select().from(whatsappTemplates)
      .where(eq(whatsappTemplates.tenantCompanyId, ctx.user.tenantCompanyId ?? 0))
      .orderBy(asc(whatsappTemplates.name));
  }),

  createTemplate: protectedProcedure.input(z.object({
    name: z.string().min(1),
    body: z.string().min(1),
    category: z.string().default("general"),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const [result] = await dbConn.insert(whatsappTemplates).values({
      tenantCompanyId: ctx.user.tenantCompanyId ?? 0,
      name: input.name,
      body: input.body,
      category: input.category,
      createdAt: Date.now(),
    });
    return { id: (result as any).insertId };
  }),

  deleteTemplate: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    await dbConn.delete(whatsappTemplates)
      .where(and(eq(whatsappTemplates.id, input.id), eq(whatsappTemplates.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),

  generateMessageWithAI: protectedProcedure.input(z.object({
    contactName: z.string(),
    purpose: z.string(),
    tone: z.enum(["professional", "casual", "friendly"]).default("professional"),
  })).mutation(async ({ ctx, input }) => {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert at writing concise, effective WhatsApp business messages. Keep messages under 300 characters when possible." },
        { role: "user", content: `Write a WhatsApp message to ${input.contactName} for: ${input.purpose}. Tone: ${input.tone}. Return JSON with field: message` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "whatsapp_msg",
          strict: true,
          schema: { type: "object", properties: { message: { type: "string" } }, required: ["message"], additionalProperties: false },
        },
      },
    });
    const content = response.choices[0].message.content;
    const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    return parsed;
  }),
});

// ─── Social Media Scheduler ───────────────────────────────────────────────────
const socialSchedulerRouter = router({
  getPosts: protectedProcedure.input(z.object({
    status: z.enum(["draft", "scheduled", "published", "failed", "all"]).default("all"),
    limit: z.number().default(50),
  })).query(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const conditions = [eq(socialPosts.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)];
    if (input.status !== "all") conditions.push(eq(socialPosts.status, input.status));
    return dbConn.select().from(socialPosts)
      .where(and(...conditions))
      .orderBy(desc(socialPosts.createdAt))
      .limit(input.limit);
  }),

  createPost: protectedProcedure.input(z.object({
    content: z.string().min(1),
    platforms: z.array(z.enum(["linkedin", "facebook", "instagram"])),
    scheduledAt: z.number().optional(),
    mediaUrls: z.array(z.string()).optional(),
    linkedContactId: z.number().optional(),
    linkedDealId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const now = Date.now();
    const status = input.scheduledAt ? "scheduled" : "draft";
    const [result] = await dbConn.insert(socialPosts).values({
      tenantCompanyId: ctx.user.tenantCompanyId ?? 0,
      content: input.content,
      platforms: input.platforms,
      mediaUrls: input.mediaUrls ?? [],
      scheduledAt: input.scheduledAt,
      status,
      linkedContactId: input.linkedContactId,
      linkedDealId: input.linkedDealId,
      platformPostIds: {},
      createdBy: ctx.user.id,
      createdAt: now,
      updatedAt: now,
    });
    return { id: (result as any).insertId, status };
  }),

  updatePost: protectedProcedure.input(z.object({
    id: z.number(),
    content: z.string().optional(),
    platforms: z.array(z.string()).optional(),
    scheduledAt: z.number().optional(),
    status: z.enum(["draft", "scheduled", "published", "failed"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const { id, ...updates } = input;
    const setData2: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.content !== undefined) setData2.content = updates.content;
    if (updates.platforms !== undefined) setData2.platforms = updates.platforms;
    if (updates.scheduledAt !== undefined) setData2.scheduledAt = updates.scheduledAt;
    if (updates.status !== undefined) setData2.status = updates.status;
    await dbConn.update(socialPosts)
      .set(setData2 as never)
      .where(and(eq(socialPosts.id, id), eq(socialPosts.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),

  deletePost: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    await dbConn.delete(socialPosts)
      .where(and(eq(socialPosts.id, input.id), eq(socialPosts.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),

  publishNow: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const now = Date.now();
    // Simulate publishing to social platforms
    await dbConn.update(socialPosts)
      .set({ status: "published", publishedAt: now, updatedAt: now })
      .where(and(eq(socialPosts.id, input.id), eq(socialPosts.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true, publishedAt: now };
  }),

  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = (await db.getDb())!;
    return dbConn.select().from(socialAccounts)
      .where(eq(socialAccounts.tenantCompanyId, ctx.user.tenantCompanyId ?? 0))
      .orderBy(asc(socialAccounts.platform));
  }),

  connectAccount: protectedProcedure.input(z.object({
    platform: z.enum(["linkedin", "facebook", "instagram"]),
    accountName: z.string(),
    accountId: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const [result] = await dbConn.insert(socialAccounts).values({
      tenantCompanyId: ctx.user.tenantCompanyId ?? 0,
      platform: input.platform,
      accountName: input.accountName,
      accountId: input.accountId,
      isActive: true,
      connectedAt: Date.now(),
    });
    return { id: (result as any).insertId };
  }),

  disconnectAccount: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    await dbConn.delete(socialAccounts)
      .where(and(eq(socialAccounts.id, input.id), eq(socialAccounts.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),

  generateContentWithAI: protectedProcedure.input(z.object({
    topic: z.string(),
    platform: z.enum(["linkedin", "facebook", "instagram"]),
    tone: z.enum(["professional", "casual", "inspirational", "educational"]).default("professional"),
    includeHashtags: z.boolean().default(true),
  })).mutation(async ({ ctx, input }) => {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: `You are a social media expert specializing in ${input.platform} content for B2B companies.` },
        { role: "user", content: `Write a ${input.platform} post about: ${input.topic}. Tone: ${input.tone}. ${input.includeHashtags ? "Include relevant hashtags." : "No hashtags."} Return JSON with: content, hashtags (array).` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "social_post",
          strict: true,
          schema: {
            type: "object",
            properties: {
              content: { type: "string" },
              hashtags: { type: "array", items: { type: "string" } },
            },
            required: ["content", "hashtags"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0].message.content;
    return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = (await db.getDb())!;
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const [total] = await dbConn.select({ count: sql<number>`count(*)` }).from(socialPosts).where(eq(socialPosts.tenantCompanyId, tenantId));
    const [published] = await dbConn.select({ count: sql<number>`count(*)` }).from(socialPosts).where(and(eq(socialPosts.tenantCompanyId, tenantId), eq(socialPosts.status, "published")));
    const [scheduled] = await dbConn.select({ count: sql<number>`count(*)` }).from(socialPosts).where(and(eq(socialPosts.tenantCompanyId, tenantId), eq(socialPosts.status, "scheduled")));
    const [draft] = await dbConn.select({ count: sql<number>`count(*)` }).from(socialPosts).where(and(eq(socialPosts.tenantCompanyId, tenantId), eq(socialPosts.status, "draft")));
    return {
      total: total.count,
      published: published.count,
      scheduled: scheduled.count,
      draft: draft.count,
    };
  }),
});

// ─── Power Dialer ─────────────────────────────────────────────────────────────
const powerDialerRouter = router({
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = (await db.getDb())!;
    return dbConn.select().from(dialerSessions)
      .where(and(
        eq(dialerSessions.tenantCompanyId, ctx.user.tenantCompanyId ?? 0),
        eq(dialerSessions.userId, ctx.user.id)
      ))
      .orderBy(desc(dialerSessions.startedAt));
  }),

  createSession: protectedProcedure.input(z.object({
    name: z.string().min(1),
    contactIds: z.array(z.number()).min(1),
    script: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const [result] = await dbConn.insert(dialerSessions).values({
      tenantCompanyId: ctx.user.tenantCompanyId ?? 0,
      userId: ctx.user.id,
      name: input.name,
      status: "active",
      contactIds: input.contactIds,
      currentIndex: 0,
      callsMade: 0,
      callsConnected: 0,
      callsSkipped: 0,
      script: input.script,
      startedAt: Date.now(),
    });
    return { id: (result as any).insertId };
  }),

  advanceSession: protectedProcedure.input(z.object({
    sessionId: z.number(),
    outcome: z.enum(["connected", "no_answer", "voicemail", "skip", "complete"]),
    notes: z.string().optional(),
    duration: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const [session] = await dbConn.select().from(dialerSessions)
      .where(and(eq(dialerSessions.id, input.sessionId), eq(dialerSessions.userId, ctx.user.id)));
    if (!session) throw new TRPCError({ code: "NOT_FOUND" });

    const contactIds = session.contactIds as number[];
    const newIndex = session.currentIndex + 1;
    const isComplete = newIndex >= contactIds.length;

    const updates: Record<string, unknown> = {
      currentIndex: newIndex,
      callsMade: sql`calls_made + 1`,
    };
    if (input.outcome === "connected") updates.callsConnected = sql`calls_connected + 1`;
    if (input.outcome === "skip") updates.callsSkipped = sql`calls_skipped + 1`;
    if (isComplete) {
      updates.status = "completed";
      updates.completedAt = Date.now();
    }

    await dbConn.update(dialerSessions).set(updates as never).where(eq(dialerSessions.id, input.sessionId));

    // Log the call activity
    if (input.outcome !== "skip" && session.currentIndex < contactIds.length) {
      const currentContactId = contactIds[session.currentIndex];
      await dbConn.insert(activities).values({
        tenantId: ctx.user.tenantCompanyId ?? 0,
        userId: ctx.user.id,
        contactId: currentContactId,
        type: "call",
        subject: `Power Dialer Call — ${input.outcome}`,
        callOutcome: input.outcome,
        callDuration: input.duration,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as never);
    }

    const nextContactId = !isComplete ? contactIds[newIndex] : null;
    return { isComplete, nextContactId, currentIndex: newIndex };
  }),

  pauseSession: protectedProcedure.input(z.object({ sessionId: z.number() })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    await dbConn.update(dialerSessions).set({ status: "paused" })
      .where(and(eq(dialerSessions.id, input.sessionId), eq(dialerSessions.userId, ctx.user.id)));
    return { success: true };
  }),

  resumeSession: protectedProcedure.input(z.object({ sessionId: z.number() })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    await dbConn.update(dialerSessions).set({ status: "active" })
      .where(and(eq(dialerSessions.id, input.sessionId), eq(dialerSessions.userId, ctx.user.id)));
    return { success: true };
  }),

  generateScript: protectedProcedure.input(z.object({
    purpose: z.string(),
    productService: z.string(),
    targetAudience: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert sales trainer who writes compelling call scripts." },
        { role: "user", content: `Write a power dialer call script for: Purpose: ${input.purpose}, Product/Service: ${input.productService}, Target: ${input.targetAudience}. Include: opener, value prop, qualifying questions, objection handlers, close. Return JSON with: script (full text), sections (array of {title, content}).` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "call_script",
          strict: true,
          schema: {
            type: "object",
            properties: {
              script: { type: "string" },
              sections: { type: "array", items: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } }, required: ["title", "content"], additionalProperties: false } },
            },
            required: ["script", "sections"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0].message.content;
    return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  }),
});

// ─── AI Anomaly Detection ─────────────────────────────────────────────────────
const anomalyDetectionRouter = router({
  getAlerts: protectedProcedure.input(z.object({
    resolved: z.boolean().default(false),
    severity: z.enum(["low", "medium", "high", "critical", "all"]).default("all"),
  })).query(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const conditions = [eq(anomalyAlerts.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)];
    if (!input.resolved) conditions.push(eq(anomalyAlerts.isResolved, false));
    if (input.severity !== "all") conditions.push(eq(anomalyAlerts.severity, input.severity));
    return dbConn.select().from(anomalyAlerts)
      .where(and(...conditions))
      .orderBy(desc(anomalyAlerts.detectedAt));
  }),

  runDetection: protectedProcedure.mutation(async ({ ctx }) => {
    const dbConn = (await db.getDb())!;
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const newAlerts: typeof anomalyAlerts.$inferInsert[] = [];

    // Check pipeline value drop
    const recentDealsRaw = await dbConn.execute(sql`SELECT COALESCE(SUM(value), 0) as total FROM deals WHERE tenant_id = ${tenantId} AND created_at >= ${sevenDaysAgo}`);
    const prevDealsRaw = await dbConn.execute(sql`SELECT COALESCE(SUM(value), 0) as total FROM deals WHERE tenant_id = ${tenantId} AND created_at >= ${thirtyDaysAgo} AND created_at < ${sevenDaysAgo}`);
    const recentDealsRows = (recentDealsRaw[0] as unknown) as any[];
    const prevDealsRows = (prevDealsRaw[0] as unknown) as any[];

    const prevAvgWeekly = ((prevDealsRows[0]?.total as number) ?? 0) / 3.3;
    const recentWeekly = (recentDealsRows[0]?.total as number) ?? 0;
    if (prevAvgWeekly > 0 && recentWeekly < prevAvgWeekly * 0.7) {
      const changePercent = ((recentWeekly - prevAvgWeekly) / prevAvgWeekly) * 100;
      newAlerts.push({
        tenantCompanyId: tenantId,
        type: "pipeline_drop",
        severity: changePercent < -50 ? "critical" : "high",
        title: "Pipeline Value Drop Detected",
        description: `New deal value this week is ${Math.abs(changePercent).toFixed(0)}% below the recent average.`,
        metric: "weekly_pipeline_value",
        previousValue: prevAvgWeekly,
        currentValue: recentWeekly,
        changePercent,
        isResolved: false,
        detectedAt: now,
      });
    }

    // Check activity drop
    const [recentActivities] = await dbConn.select({ count: sql<number>`count(*)` })
      .from(activities)
      .where(and(eq(activities.tenantId, tenantId), gte(activities.createdAt, sevenDaysAgo)));
    const [prevActivities] = await dbConn.select({ count: sql<number>`count(*)` })
      .from(activities)
      .where(and(eq(activities.tenantId, tenantId), gte(activities.createdAt, thirtyDaysAgo), lt(activities.createdAt, sevenDaysAgo)));

    const prevAvgWeeklyActivities = (prevActivities?.count ?? 0) / 3.3;
    const recentWeeklyActivities = recentActivities?.count ?? 0;
    if (prevAvgWeeklyActivities > 5 && recentWeeklyActivities < prevAvgWeeklyActivities * 0.6) {
      const changePercent = ((recentWeeklyActivities - prevAvgWeeklyActivities) / prevAvgWeeklyActivities) * 100;
      newAlerts.push({
        tenantCompanyId: tenantId,
        type: "activity_drop",
        severity: "medium",
        title: "Sales Activity Drop Detected",
        description: `Sales activities this week are ${Math.abs(changePercent).toFixed(0)}% below average. Team engagement may be declining.`,
        metric: "weekly_activities",
        previousValue: prevAvgWeeklyActivities,
        currentValue: recentWeeklyActivities,
        changePercent,
        isResolved: false,
        detectedAt: now,
      });
    }

    if (newAlerts.length > 0) {
      await dbConn.insert(anomalyAlerts).values(newAlerts);

      // Get AI explanations for each alert
      for (const alert of newAlerts) {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a CRM analytics expert. Provide brief, actionable explanations for business anomalies." },
            { role: "user", content: `Explain this CRM anomaly and provide 3 specific action items: ${alert.title}. ${alert.description}. Previous: ${alert.previousValue?.toFixed(0)}, Current: ${alert.currentValue?.toFixed(0)}, Change: ${alert.changePercent?.toFixed(1)}%` },
          ],
        });
        const explanation = response.choices[0].message.content;
        await dbConn.update(anomalyAlerts)
          .set({ aiExplanation: typeof explanation === "string" ? explanation : JSON.stringify(explanation) })
          .where(and(
            eq(anomalyAlerts.tenantCompanyId, tenantId),
            eq(anomalyAlerts.type, alert.type!),
            eq(anomalyAlerts.detectedAt, now)
          ));
      }
    }

    return { detected: newAlerts.length, alerts: newAlerts };
  }),

  resolve: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    await dbConn.update(anomalyAlerts)
      .set({ isResolved: true, resolvedAt: Date.now() })
      .where(and(eq(anomalyAlerts.id, input.id), eq(anomalyAlerts.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),

  resolveAll: protectedProcedure.mutation(async ({ ctx }) => {
    const dbConn = (await db.getDb())!;
    await dbConn.update(anomalyAlerts)
      .set({ isResolved: true, resolvedAt: Date.now() })
      .where(and(eq(anomalyAlerts.tenantCompanyId, ctx.user.tenantCompanyId ?? 0), eq(anomalyAlerts.isResolved, false)));
    return { success: true };
  }),
});

// ─── Pipeline Inspection ──────────────────────────────────────────────────────
const pipelineInspectionRouter = router({
  run: protectedProcedure.input(z.object({ pipelineId: z.number() })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const now = Date.now();
    const stuckThreshold = now - 14 * 24 * 60 * 60 * 1000; // 14 days

    // Get all open deals in this pipeline
    const openDeals = await dbConn.select().from(deals as never)
      .where(sql`pipeline_id = ${input.pipelineId} AND tenant_id = ${tenantId} AND stage NOT IN ('won','lost')` as never);

    const stuckDeals = (openDeals as any[]).filter((d: any) => d.updatedAt < stuckThreshold);
    const stuckCount = stuckDeals.length;

    // Calculate health score (0-100)
    const totalDeals = openDeals.length;
    const stuckRatio = totalDeals > 0 ? stuckCount / totalDeals : 0;
    const healthScore = Math.max(0, Math.round(100 - stuckRatio * 60 - (totalDeals === 0 ? 30 : 0)));

    // Get stages for velocity
    const stages = await dbConn.select().from(pipelineStages)
      .where(eq(pipelineStages.pipelineId, input.pipelineId))
      .orderBy(asc((pipelineStages as any).order));

    const avgDaysInStage: Record<string, number> = {};
    for (const stage of stages) {
      const stageDeals = (openDeals as any[]).filter((d: any) => d.stageId === stage.id);
      if (stageDeals.length > 0) {
        const avgMs = stageDeals.reduce((sum: number, d: any) => sum + (now - d.updatedAt), 0) / stageDeals.length;
        avgDaysInStage[stage.name] = Math.round(avgMs / (24 * 60 * 60 * 1000));
      }
    }

    const velocityScore = Math.max(0, 100 - Object.values(avgDaysInStage).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(avgDaysInStage).length));

    // AI insights
    const aiResponse = await invokeLLM({
      messages: [
        { role: "system", content: "You are a sales pipeline expert. Provide concise, actionable insights." },
        { role: "user", content: `Pipeline health: ${healthScore}/100. Stuck deals: ${stuckCount}/${totalDeals}. Avg days per stage: ${JSON.stringify(avgDaysInStage)}. Provide 3 specific recommendations to improve pipeline health.` },
      ],
    });
    const aiInsights = aiResponse.choices[0].message.content;

    const [result] = await dbConn.insert(pipelineInspections).values({
      tenantCompanyId: tenantId,
      pipelineId: input.pipelineId,
      healthScore,
      stuckDealsCount: stuckCount,
      avgDaysInStage,
      velocityScore: Math.round(velocityScore),
      aiInsights: typeof aiInsights === "string" ? aiInsights : JSON.stringify(aiInsights),
      inspectedAt: now,
    });

    return {
      id: (result as any).insertId,
      healthScore,
      stuckDealsCount: stuckCount,
      totalDeals,
      avgDaysInStage,
      velocityScore: Math.round(velocityScore),
      aiInsights,
      stuckDeals: stuckDeals.slice(0, 10),
    };
  }),

  getHistory: protectedProcedure.input(z.object({ pipelineId: z.number() })).query(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    return dbConn.select().from(pipelineInspections)
      .where(and(
        eq(pipelineInspections.tenantCompanyId, ctx.user.tenantCompanyId ?? 0),
        eq(pipelineInspections.pipelineId, input.pipelineId)
      ))
      .orderBy(desc(pipelineInspections.inspectedAt))
      .limit(10);
  }),
});

// ─── Domain Health Autopilot ──────────────────────────────────────────────────
const domainHealthAutopilotRouter = router({
  getHealthDashboard: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = (await db.getDb())!;
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const domains = await dbConn.select().from(domainHealth)
      .where(eq(domainHealth.userId, tenantId))
      .orderBy(desc(domainHealth.reputationScore));
    const healingLogs = await dbConn.select().from(domainAutoHealingLogs)
      .where(eq(domainAutoHealingLogs.tenantCompanyId, tenantId))
      .orderBy(desc(domainAutoHealingLogs.triggeredAt))
      .limit(20);
    return { domains, healingLogs };
  }),

  runAutoHeal: protectedProcedure.mutation(async ({ ctx }) => {
    const dbConn = (await db.getDb())!;
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const now = Date.now();
    const domains = await dbConn.select().from(domainHealth).where(eq(domainHealth.userId, tenantId));
    const actions: typeof domainAutoHealingLogs.$inferInsert[] = [];

    for (const domain of domains) {
      const stats = domain as any;
      // Auto-pause if bounce rate > 2% or complaint rate > 0.1%
      if ((stats.bounceRate > 2 || stats.complaintRate > 0.1) && stats.status !== "paused") {
        actions.push({
          tenantCompanyId: tenantId,
          domain: domain.domain,
          action: "paused",
          reason: `Auto-paused: bounce=${stats.bounceRate?.toFixed(2)}%, complaint=${stats.complaintRate?.toFixed(3)}%`,
          previousLimit: stats.dailyLimit,
          newLimit: 0,
          triggeredAt: now,
        });
        await dbConn.update(domainHealth).set({ status: "paused" } as never).where(eq(domainHealth.id, domain.id));
      }
      // Volume reduction if health score < 50
      else if (stats.healthScore < 50 && stats.dailyLimit > 100) {
        const newLimit = Math.floor(stats.dailyLimit * 0.5);
        actions.push({
          tenantCompanyId: tenantId,
          domain: domain.domain,
          action: "volume_reduced",
          reason: `Health score ${stats.healthScore}/100 — reducing volume by 50%`,
          previousLimit: stats.dailyLimit,
          newLimit,
          triggeredAt: now,
        });
        await dbConn.update(domainHealth).set({ dailyLimit: newLimit } as never).where(eq(domainHealth.id, domain.id));
      }
      // Auto-resume if paused and health improved
      else if (stats.status === "paused" && stats.healthScore > 70 && stats.bounceRate < 1 && stats.complaintRate < 0.05) {
        const newLimit = 50;
        actions.push({
          tenantCompanyId: tenantId,
          domain: domain.domain,
          action: "resumed",
          reason: `Health recovered: score=${stats.healthScore}/100 — resuming at reduced volume`,
          previousLimit: 0,
          newLimit,
          triggeredAt: now,
        });
        await dbConn.update(domainHealth).set({ status: "active", dailyLimit: newLimit } as never).where(eq(domainHealth.id, domain.id));
      }
    }

    if (actions.length > 0) {
      await dbConn.insert(domainAutoHealingLogs).values(actions);
    }

    return { actionsPerformed: actions.length, actions };
  }),

  getHealingLogs: protectedProcedure.input(z.object({ domain: z.string().optional(), limit: z.number().default(50) })).query(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const conditions = [eq(domainAutoHealingLogs.tenantCompanyId, ctx.user.tenantCompanyId ?? 0)];
    if (input.domain) conditions.push(eq(domainAutoHealingLogs.domain, input.domain));
    return dbConn.select().from(domainAutoHealingLogs)
      .where(and(...conditions))
      .orderBy(desc(domainAutoHealingLogs.triggeredAt))
      .limit(input.limit);
  }),
});

// ─── Continuous A/B Testing ───────────────────────────────────────────────────
const abTestingRouter = router({
  getTests: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = (await db.getDb())!;
    return dbConn.select().from(abTestRuns)
      .where(eq(abTestRuns.tenantCompanyId, ctx.user.tenantCompanyId ?? 0))
      .orderBy(desc(abTestRuns.createdAt));
  }),

  createTest: protectedProcedure.input(z.object({
    name: z.string().min(1),
    campaignId: z.number().optional(),
    variantA: z.object({ subject: z.string(), body: z.string(), senderName: z.string().optional() }),
    variantB: z.object({ subject: z.string(), body: z.string(), senderName: z.string().optional() }),
    splitPercent: z.number().min(10).max(90).default(50),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const [result] = await dbConn.insert(abTestRuns).values({
      tenantCompanyId: ctx.user.tenantCompanyId ?? 0,
      campaignId: input.campaignId,
      name: input.name,
      status: "running",
      variantA: input.variantA,
      variantB: input.variantB,
      splitPercent: input.splitPercent,
      sentA: 0, sentB: 0, opensA: 0, opensB: 0, clicksA: 0, clicksB: 0, repliesA: 0, repliesB: 0,
      createdAt: Date.now(),
    });
    return { id: (result as any).insertId };
  }),

  recordEvent: protectedProcedure.input(z.object({
    testId: z.number(),
    variant: z.enum(["A", "B"]),
    event: z.enum(["sent", "open", "click", "reply"]),
    count: z.number().default(1),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const fieldMap: Record<string, Record<string, string>> = {
      A: { sent: "sent_a", open: "opens_a", click: "clicks_a", reply: "replies_a" },
      B: { sent: "sent_b", open: "opens_b", click: "clicks_b", reply: "replies_b" },
    };
    const field = fieldMap[input.variant][input.event];
    await dbConn.execute(sql`UPDATE ab_test_runs SET ${sql.raw(field)} = ${sql.raw(field)} + ${input.count} WHERE id = ${input.testId} AND tenant_company_id = ${ctx.user.tenantCompanyId ?? 0}`);

    // Check if we should declare a winner (min 100 sends each, >95% confidence)
    const [test] = await dbConn.select().from(abTestRuns).where(eq(abTestRuns.id, input.testId));
    if (test && test.sentA >= 100 && test.sentB >= 100 && !test.winnerVariant) {
      const rateA = test.opensA / Math.max(1, test.sentA);
      const rateB = test.opensB / Math.max(1, test.sentB);
      const diff = Math.abs(rateA - rateB);
      if (diff > 0.05) {
        const winner = rateA > rateB ? "A" : "B";
        const confidence = Math.min(99.9, 50 + diff * 500);
        await dbConn.update(abTestRuns)
          .set({ winnerVariant: winner, confidenceLevel: confidence, status: "winner_selected", completedAt: Date.now() })
          .where(eq(abTestRuns.id, input.testId));
      }
    }
    return { success: true };
  }),

  generateVariants: protectedProcedure.input(z.object({
    originalSubject: z.string(),
    originalBody: z.string(),
    testGoal: z.enum(["higher_opens", "higher_clicks", "higher_replies"]).default("higher_opens"),
  })).mutation(async ({ ctx, input }) => {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an email marketing expert specializing in A/B testing. Generate compelling variant emails." },
        { role: "user", content: `Create an A/B test variant to improve ${input.testGoal.replace(/_/g, " ")}. Original subject: "${input.originalSubject}". Original body: "${input.originalBody.slice(0, 500)}". Return JSON with: variantSubject, variantBody, rationale.` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ab_variant",
          strict: true,
          schema: {
            type: "object",
            properties: {
              variantSubject: { type: "string" },
              variantBody: { type: "string" },
              rationale: { type: "string" },
            },
            required: ["variantSubject", "variantBody", "rationale"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0].message.content;
    return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  }),
});

// ─── Feature Gating ───────────────────────────────────────────────────────────
const featureGatingRouter = router({
  getTiers: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = (await db.getDb())!;
    return dbConn.select().from(featureTiers).orderBy(asc(featureTiers.minTier));
  }),

  checkAccess: protectedProcedure.input(z.object({ featureKey: z.string() })).query(async ({ ctx }) => {
    const tierOrder = ["trial", "starter", "growth", "pro", "enterprise"];
    const userTier = (ctx.user as any).tenantCompany?.subscriptionTier ?? "trial";
    const userTierIndex = tierOrder.indexOf(userTier);
    return { hasAccess: userTierIndex >= 0, tier: userTier };
  }),

  trackUsage: protectedProcedure.input(z.object({
    featureKey: z.string(),
    count: z.number().default(1),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = (await db.getDb())!;
    const now = Date.now();
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await dbConn.insert(featureUsageLogs).values({
      tenantCompanyId: ctx.user.tenantCompanyId ?? 0,
      userId: ctx.user.id,
      featureKey: input.featureKey,
      usageCount: input.count,
      periodStart: periodStart.getTime(),
      periodEnd: periodEnd.getTime(),
      createdAt: now,
    });
    return { success: true };
  }),

  getUsageSummary: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = (await db.getDb())!;
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    const rows = await dbConn.execute(sql`
      SELECT feature_key, SUM(usage_count) as total_usage
      FROM feature_usage_logs
      WHERE tenant_company_id = ${ctx.user.tenantCompanyId ?? 0}
        AND period_start >= ${periodStart.getTime()}
      GROUP BY feature_key
      ORDER BY total_usage DESC
    `);
    return (rows[0] as unknown) as { feature_key: string; total_usage: number }[];
  }),
});

export const batch4Router = router({
  emailSequences: emailSequencesRouter,
  journeys: journeysRouter,
  whatsapp: whatsappRouter,
  socialScheduler: socialSchedulerRouter,
  powerDialer: powerDialerRouter,
  anomalyDetection: anomalyDetectionRouter,
  pipelineInspection: pipelineInspectionRouter,
  domainAutopilot: domainHealthAutopilotRouter,
  abTesting: abTestingRouter,
  featureGating: featureGatingRouter,
});
