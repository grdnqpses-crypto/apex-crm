import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  calendarConnections, emailConnections,
  meetingSchedulerProfiles, meetingTypes, meetingBookings,
  customObjectTypes, customObjectRecords,
  proposals, workflowDefinitions, workflowRuns,
  savedReports, integrationConnectors, onboardingProgress,
  activityHistory, contacts, companies, deals,
} from "../../drizzle/schema";
import { eq, and, desc, asc, or, like, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { nanoid } from "nanoid";

// ─── Calendar Sync ────────────────────────────────────────────────────────────
export const calendarRouter = router({
  getConnection: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [conn] = await db.select().from(calendarConnections)
      .where(and(
        eq(calendarConnections.userId, ctx.user.id),
        eq(calendarConnections.tenantCompanyId, ctx.user.tenantCompanyId!)
      ));
    return conn ?? null;
  }),

  // Alias: list all connections for the current user
  listConnections: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(calendarConnections)
      .where(and(
        eq(calendarConnections.userId, ctx.user.id),
        eq(calendarConnections.tenantCompanyId, ctx.user.tenantCompanyId!)
      ));
  }),

  connect: protectedProcedure.input(z.object({
    provider: z.enum(["google", "outlook", "apple", "caldav"]),
    calendarUrl: z.string().optional(),
    syncDirection: z.enum(["two_way", "apex_to_calendar", "calendar_to_apex"]).default("two_way"),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const existing = await db.select().from(calendarConnections)
      .where(and(
        eq(calendarConnections.userId, ctx.user.id),
        eq(calendarConnections.tenantCompanyId, ctx.user.tenantCompanyId!)
      ));
    if (existing.length > 0) {
      await db.update(calendarConnections)
        .set({ syncEnabled: true, updatedAt: now })
        .where(eq(calendarConnections.id, existing[0].id));
      return { success: true, id: existing[0].id };
    }
    const safeProvider = (input.provider === "google" || input.provider === "outlook") ? input.provider : "google";
    const [result] = await db.insert(calendarConnections).values({
      userId: ctx.user.id,
      tenantCompanyId: ctx.user.tenantCompanyId!,
      provider: safeProvider,
      syncEnabled: true,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, id: (result as any).insertId };
  }),

  disconnect: protectedProcedure.input(z.object({ id: z.number().optional() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    if (input.id) {
      await db.delete(calendarConnections).where(and(
        eq(calendarConnections.id, input.id),
        eq(calendarConnections.userId, ctx.user.id)
      ));
    } else {
      await db.delete(calendarConnections).where(and(
        eq(calendarConnections.userId, ctx.user.id),
        eq(calendarConnections.tenantCompanyId, ctx.user.tenantCompanyId!)
      ));
    }
    return { success: true };
  }),

  sync: protectedProcedure.input(z.object({ connectionId: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(calendarConnections)
      .set({ lastSyncAt: Date.now(), updatedAt: Date.now() })
      .where(and(
        eq(calendarConnections.id, input.connectionId),
        eq(calendarConnections.userId, ctx.user.id)
      ));
    return { success: true, synced: 0, message: "OAuth token required for live sync" };
  }),

  getUpcomingEvents: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const now = Date.now();
    return db.select().from(activityHistory)
      .where(and(
        eq(activityHistory.tenantCompanyId, ctx.user.tenantCompanyId!),
        eq(activityHistory.activityType, "meeting"),
        sql`${activityHistory.occurredAt} >= ${now - 7 * 24 * 60 * 60 * 1000}`
      ))
      .orderBy(asc(activityHistory.occurredAt))
      .limit(20);
  }),

  // Alias for listEvents used by CalendarSync page
  listEvents: protectedProcedure.input(z.object({ limit: z.number().default(20) })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(activityHistory)
      .where(and(
        eq(activityHistory.tenantCompanyId, ctx.user.tenantCompanyId!),
        eq(activityHistory.activityType, "meeting")
      ))
      .orderBy(desc(activityHistory.occurredAt))
      .limit(input.limit);
  }),
});

// ─── Email Inbox Sync ─────────────────────────────────────────────────────────
export const emailSyncRouter = router({
  getConnection: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [conn] = await db.select().from(emailConnections)
      .where(and(
        eq(emailConnections.userId, ctx.user.id),
        eq(emailConnections.tenantCompanyId, ctx.user.tenantCompanyId!)
      ));
    return conn ?? null;
  }),

  connect: protectedProcedure.input(z.object({
    provider: z.enum(["gmail", "outlook"]),
    emailAddress: z.string().email(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const bccAddress = `crm+${ctx.user.tenantCompanyId}-${ctx.user.id}@apex-crm.app`;
    const existing = await db.select().from(emailConnections)
      .where(and(
        eq(emailConnections.userId, ctx.user.id),
        eq(emailConnections.tenantCompanyId, ctx.user.tenantCompanyId!)
      ));
    if (existing.length > 0) {
      await db.update(emailConnections)
        .set({ provider: input.provider, emailAddress: input.emailAddress, bccAddress, syncEnabled: true, updatedAt: now })
        .where(eq(emailConnections.id, existing[0].id));
      return { success: true, bccAddress };
    }
    await db.insert(emailConnections).values({
      userId: ctx.user.id,
      tenantCompanyId: ctx.user.tenantCompanyId!,
      provider: input.provider,
      emailAddress: input.emailAddress,
      bccAddress,
      syncEnabled: true,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, bccAddress };
  }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(emailConnections).where(and(
      eq(emailConnections.userId, ctx.user.id),
      eq(emailConnections.tenantCompanyId, ctx.user.tenantCompanyId!)
    ));
    return { success: true };
  }),

  getRecentEmails: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(activityHistory)
      .where(and(
        eq(activityHistory.tenantCompanyId, ctx.user.tenantCompanyId!),
        or(
          eq(activityHistory.activityType, "email_sent"),
          eq(activityHistory.activityType, "email_received")
        )
      ))
      .orderBy(desc(activityHistory.occurredAt))
      .limit(50);
  }),
});

// ─── Meeting Scheduler ────────────────────────────────────────────────────────
export const schedulerRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [profile] = await db.select().from(meetingSchedulerProfiles)
      .where(and(
        eq(meetingSchedulerProfiles.userId, ctx.user.id),
        eq(meetingSchedulerProfiles.tenantCompanyId, ctx.user.tenantCompanyId!)
      ));
    if (!profile) return null;
    const types = await db.select().from(meetingTypes)
      .where(eq(meetingTypes.schedulerProfileId, profile.id))
      .orderBy(asc(meetingTypes.id));
    return { ...profile, meetingTypes: types };
  }),

  createProfile: protectedProcedure.input(z.object({
    displayName: z.string().min(1),
    bio: z.string().optional(),
    timezone: z.string().default("America/New_York"),
    bufferMinutes: z.number().default(15),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const slug = `${(ctx.user.name ?? "user").toLowerCase().replace(/\s+/g, "-")}-${nanoid(6)}`;
    const [result] = await db.insert(meetingSchedulerProfiles).values({
      userId: ctx.user.id,
      tenantCompanyId: ctx.user.tenantCompanyId!,
      slug,
      displayName: input.displayName,
      bio: input.bio,
      timezone: input.timezone,
      bufferMinutes: input.bufferMinutes,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    const profileId = (result as any).insertId;
    await db.insert(meetingTypes).values([
      { schedulerProfileId: profileId, tenantCompanyId: ctx.user.tenantCompanyId!, name: "15-Minute Quick Call", durationMinutes: 15, color: "#f97316", isActive: true, createdAt: now },
      { schedulerProfileId: profileId, tenantCompanyId: ctx.user.tenantCompanyId!, name: "30-Minute Discovery", durationMinutes: 30, color: "#3b82f6", isActive: true, createdAt: now },
      { schedulerProfileId: profileId, tenantCompanyId: ctx.user.tenantCompanyId!, name: "60-Minute Deep Dive", durationMinutes: 60, color: "#8b5cf6", isActive: true, createdAt: now },
    ]);
    return { success: true, slug };
  }),

  updateProfile: protectedProcedure.input(z.object({
    displayName: z.string().min(1).optional(),
    bio: z.string().optional(),
    timezone: z.string().optional(),
    bufferMinutes: z.number().optional(),
    availabilityJson: z.record(z.string(), z.unknown()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [profile] = await db.select().from(meetingSchedulerProfiles)
      .where(eq(meetingSchedulerProfiles.userId, ctx.user.id));
    if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
    await db.update(meetingSchedulerProfiles)
      .set({ ...input, updatedAt: Date.now() })
      .where(eq(meetingSchedulerProfiles.id, profile.id));
    return { success: true };
  }),

  addMeetingType: protectedProcedure.input(z.object({
    name: z.string().min(1),
    durationMinutes: z.number(),
    description: z.string().optional(),
    location: z.string().optional(),
    color: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [profile] = await db.select().from(meetingSchedulerProfiles)
      .where(eq(meetingSchedulerProfiles.userId, ctx.user.id));
    if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
    await db.insert(meetingTypes).values({
      schedulerProfileId: profile.id,
      tenantCompanyId: ctx.user.tenantCompanyId!,
      name: input.name,
      durationMinutes: input.durationMinutes,
      description: input.description,
      location: input.location,
      color: input.color ?? "#f97316",
      isActive: true,
      createdAt: Date.now(),
    });
    return { success: true };
  }),

  getBookings: protectedProcedure.input(z.object({
    status: z.enum(["confirmed", "cancelled", "completed", "no_show"]).optional(),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const [profile] = await db.select().from(meetingSchedulerProfiles)
      .where(eq(meetingSchedulerProfiles.userId, ctx.user.id));
    if (!profile) return [];
    const conditions: Parameters<typeof and>[0][] = [eq(meetingBookings.schedulerProfileId, profile.id)];
    if (input.status) conditions.push(eq(meetingBookings.status, input.status));
    return db.select().from(meetingBookings)
      .where(and(...conditions))
      .orderBy(desc(meetingBookings.startTime))
      .limit(50);
  }),

  bookMeeting: protectedProcedure.input(z.object({
    meetingTypeId: z.number(),
    guestName: z.string().min(1),
    guestEmail: z.string().email(),
    guestPhone: z.string().optional(),
    guestNotes: z.string().optional(),
    startTime: z.number(),
    timezone: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [type] = await db.select().from(meetingTypes).where(eq(meetingTypes.id, input.meetingTypeId));
    if (!type) throw new TRPCError({ code: "NOT_FOUND" });
    const endTime = input.startTime + type.durationMinutes * 60 * 1000;
    const cancelToken = nanoid(32);
    await db.insert(meetingBookings).values({
      meetingTypeId: input.meetingTypeId,
      schedulerProfileId: type.schedulerProfileId,
      tenantCompanyId: type.tenantCompanyId,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      guestNotes: input.guestNotes,
      startTime: input.startTime,
      endTime,
      timezone: input.timezone,
      status: "confirmed",
      cancelToken,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { success: true, cancelToken };
  }),
});

// ─── Custom Object Builder ────────────────────────────────────────────────────
export const customObjectsRouter = router({
  listTypes: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(customObjectTypes)
      .where(eq(customObjectTypes.tenantCompanyId, ctx.user.tenantCompanyId!))
      .orderBy(asc(customObjectTypes.name));
  }),

  createType: protectedProcedure.input(z.object({
    name: z.string().min(1),
    pluralName: z.string().min(1),
    icon: z.string().optional(),
    color: z.string().optional(),
    description: z.string().optional(),
    showInNav: z.boolean().default(true),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const slug = input.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    await db.insert(customObjectTypes).values({
      tenantCompanyId: ctx.user.tenantCompanyId!,
      name: input.name,
      pluralName: input.pluralName,
      icon: input.icon ?? "box",
      color: input.color ?? "#f97316",
      slug,
      description: input.description,
      showInNav: input.showInNav ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true };
  }),

  updateType: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    pluralName: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    description: z.string().optional(),
    showInNav: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { id, showInNav, ...rest } = input;
    const updates: Record<string, unknown> = { ...rest, updatedAt: Date.now() };
    if (showInNav !== undefined) updates.showInNav = showInNav ? 1 : 0;
    await db.update(customObjectTypes)
      .set(updates)
      .where(and(eq(customObjectTypes.id, id), eq(customObjectTypes.tenantCompanyId, ctx.user.tenantCompanyId!)));
    return { success: true };
  }),

  deleteType: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(customObjectTypes)
      .where(and(eq(customObjectTypes.id, input.id), eq(customObjectTypes.tenantCompanyId, ctx.user.tenantCompanyId!)));
    return { success: true };
  }),

  listFields: protectedProcedure.input(z.object({ typeId: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [type] = await db.select().from(customObjectTypes)
      .where(and(eq(customObjectTypes.id, input.typeId), eq(customObjectTypes.tenantCompanyId, ctx.user.tenantCompanyId!)));
    if (!type) throw new TRPCError({ code: "NOT_FOUND" });
    try { return JSON.parse(type.description ?? "[]") as Array<{ id: string; name: string; fieldType: string; required: boolean }>; }
    catch { return []; }
  }),
  addField: protectedProcedure.input(z.object({
    typeId: z.number(),
    name: z.string().min(1),
    fieldType: z.enum(["text", "number", "date", "boolean", "select", "url", "email"]),
    required: z.boolean().default(false),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [type] = await db.select().from(customObjectTypes)
      .where(and(eq(customObjectTypes.id, input.typeId), eq(customObjectTypes.tenantCompanyId, ctx.user.tenantCompanyId!)));
    if (!type) throw new TRPCError({ code: "NOT_FOUND" });
    let fields: Array<{ id: string; name: string; fieldType: string; required: boolean }> = [];
    try { fields = JSON.parse(type.description ?? "[]"); } catch { fields = []; }
    if (!Array.isArray(fields)) fields = [];
    const newField = { id: `f_${Date.now()}`, name: input.name, fieldType: input.fieldType, required: input.required };
    fields.push(newField);
    await db.update(customObjectTypes).set({ description: JSON.stringify(fields), updatedAt: Date.now() })
      .where(eq(customObjectTypes.id, input.typeId));
    return newField;
  }),
  deleteField: protectedProcedure.input(z.object({ typeId: z.number(), fieldId: z.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [type] = await db.select().from(customObjectTypes)
      .where(and(eq(customObjectTypes.id, input.typeId), eq(customObjectTypes.tenantCompanyId, ctx.user.tenantCompanyId!)));
    if (!type) throw new TRPCError({ code: "NOT_FOUND" });
    let fields: Array<{ id: string; name: string; fieldType: string; required: boolean }> = [];
    try { fields = JSON.parse(type.description ?? "[]"); } catch { fields = []; }
    if (!Array.isArray(fields)) fields = [];
    fields = fields.filter((f: { id: string }) => f.id !== input.fieldId);
    await db.update(customObjectTypes).set({ description: JSON.stringify(fields), updatedAt: Date.now() })
      .where(eq(customObjectTypes.id, input.typeId));
    return { success: true };
  }),
  listRecords: protectedProcedure.input(z.object({
    objectTypeId: z.number(),
    search: z.string().optional(),
    limit: z.number().default(50),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: Parameters<typeof and>[0][] = [
      eq(customObjectRecords.tenantCompanyId, ctx.user.tenantCompanyId!),
      eq(customObjectRecords.objectDefId, input.objectTypeId),
    ];
    if (input.search) conditions.push(like(customObjectRecords.name!, `%${input.search}%`));
    return db.select().from(customObjectRecords)
      .where(and(...conditions))
      .orderBy(desc(customObjectRecords.createdAt))
      .limit(input.limit);
  }),

  createRecord: protectedProcedure.input(z.object({
    objectDefId: z.number(),
    name: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    await db.insert(customObjectRecords).values({
      tenantCompanyId: ctx.user.tenantCompanyId!,
      objectDefId: input.objectDefId,
      name: input.name,
      ownerId: ctx.user.id,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true };
  }),
});

// ─── Proposals / E-Signature ──────────────────────────────────────────────────
export const proposalsRouter = router({
  list: protectedProcedure.input(z.object({
    status: z.enum(["draft", "sent", "viewed", "signed", "declined", "expired"]).optional(),
    dealId: z.number().optional(),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: Parameters<typeof and>[0][] = [eq(proposals.tenantCompanyId, ctx.user.tenantCompanyId!)];
    if (input.status) conditions.push(eq(proposals.status, input.status));
    if (input.dealId) conditions.push(eq(proposals.dealId, input.dealId));
    return db.select().from(proposals)
      .where(and(...conditions))
      .orderBy(desc(proposals.createdAt))
      .limit(50);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [proposal] = await db.select().from(proposals)
      .where(and(eq(proposals.id, input.id), eq(proposals.tenantCompanyId, ctx.user.tenantCompanyId!)));
    if (!proposal) throw new TRPCError({ code: "NOT_FOUND" });
    return proposal;
  }),

  create: protectedProcedure.input(z.object({
    title: z.string().min(1),
    dealId: z.number().optional(),
    contactId: z.number().optional(),
    companyId: z.number().optional(),
    totalAmount: z.string().optional(),
    currency: z.string().default("USD"),
    validUntil: z.number().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const signatureToken = nanoid(32);
    const [result] = await db.insert(proposals).values({
      tenantCompanyId: ctx.user.tenantCompanyId!,
      dealId: input.dealId,
      contactId: input.contactId,
      companyId: input.companyId,
      createdByUserId: ctx.user.id,
      title: input.title,
      status: "draft",
      totalAmount: input.totalAmount,
      currency: input.currency,
      validUntil: input.validUntil,
      signatureToken,
      notes: input.notes,
      templateJson: {
        sections: [
          { type: "header", content: input.title },
          { type: "intro", content: "Thank you for considering our services." },
          { type: "scope", content: "Scope of Work", items: ["Item 1", "Item 2", "Item 3"] },
          { type: "pricing", content: "Investment", amount: input.totalAmount ?? "0", currency: input.currency },
          { type: "terms", content: "Terms & Conditions", text: "This proposal is valid for 30 days from the date of issue." },
          { type: "signature", content: "Acceptance" },
        ]
      },
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, id: (result as any).insertId, signatureToken };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    notes: z.string().optional(),
    totalAmount: z.string().optional(),
    validUntil: z.number().optional(),
    templateJson: z.record(z.string(), z.unknown()).optional(),
    status: z.enum(["draft", "sent", "viewed", "signed", "declined", "expired"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { id, ...updates } = input;
    await db.update(proposals)
      .set({ ...updates, updatedAt: Date.now() })
      .where(and(eq(proposals.id, id), eq(proposals.tenantCompanyId, ctx.user.tenantCompanyId!)));
    return { success: true };
  }),

  send: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(proposals)
      .set({ status: "sent", sentAt: Date.now(), updatedAt: Date.now() })
      .where(and(eq(proposals.id, input.id), eq(proposals.tenantCompanyId, ctx.user.tenantCompanyId!)));
    return { success: true };
  }),

  sign: protectedProcedure.input(z.object({
    token: z.string(),
    signerName: z.string(),
    signerEmail: z.string().email(),
    signatureImageUrl: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [proposal] = await db.select().from(proposals)
      .where(eq(proposals.signatureToken, input.token));
    if (!proposal) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid signature link" });
    if (proposal.status === "signed") throw new TRPCError({ code: "BAD_REQUEST", message: "Already signed" });
    await db.update(proposals)
      .set({
        status: "signed",
        signedAt: Date.now(),
        signedByName: input.signerName,
        signedByEmail: input.signerEmail,
        signatureImageUrl: input.signatureImageUrl,
        updatedAt: Date.now(),
      })
      .where(eq(proposals.id, proposal.id));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(proposals)
      .where(and(eq(proposals.id, input.id), eq(proposals.tenantCompanyId, ctx.user.tenantCompanyId!)));
    return { success: true };
  }),

  generateWithAI: protectedProcedure.input(z.object({
    contactName: z.string().optional(),
    companyName: z.string().optional(),
    serviceDescription: z.string(),
    amount: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a professional proposal writer. Generate a compelling, structured business proposal in JSON format." },
        { role: "user", content: `Create a proposal for ${input.contactName ?? "the client"} at ${input.companyName ?? "their company"} for: ${input.serviceDescription}. Amount: ${input.amount ?? "TBD"}.` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "proposal",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              intro: { type: "string" },
              scopeItems: { type: "array", items: { type: "string" } },
              valueProposition: { type: "string" },
              termsText: { type: "string" },
            },
            required: ["title", "intro", "scopeItems", "valueProposition", "termsText"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices[0].message.content as string;
    const parsed = JSON.parse(content);
    return { generated: parsed };
  }),
});

// ─── Visual Workflow Builder ──────────────────────────────────────────────────
export const workflowBuilderRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(workflowDefinitions)
      .where(eq(workflowDefinitions.tenantCompanyId, ctx.user.tenantCompanyId!))
      .orderBy(desc(workflowDefinitions.updatedAt))
      .limit(50);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [wf] = await db.select().from(workflowDefinitions)
      .where(and(eq(workflowDefinitions.id, input.id), eq(workflowDefinitions.tenantCompanyId, ctx.user.tenantCompanyId!)));
    if (!wf) throw new TRPCError({ code: "NOT_FOUND" });
    return wf;
  }),

  create: protectedProcedure.input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    triggerType: z.string(),
    triggerConfig: z.record(z.string(), z.unknown()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const defaultNodes = [
      { id: "trigger-1", type: "trigger", position: { x: 250, y: 50 }, data: { label: "Trigger", triggerType: input.triggerType, config: input.triggerConfig ?? {} } },
    ];
    const [result] = await db.insert(workflowDefinitions).values({
      tenantCompanyId: ctx.user.tenantCompanyId!,
      name: input.name,
      description: input.description,
      status: "draft",
      triggerType: input.triggerType,
      triggerConfig: input.triggerConfig ?? {},
      nodesJson: defaultNodes,
      edgesJson: [],
      createdByUserId: ctx.user.id,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, id: (result as any).insertId };
  }),

  save: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    nodesJson: z.array(z.unknown()),
    edgesJson: z.array(z.unknown()),
    triggerType: z.string().optional(),
    triggerConfig: z.record(z.string(), z.unknown()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { id, ...updates } = input;
    await db.update(workflowDefinitions)
      .set({ ...updates, updatedAt: Date.now() })
      .where(and(eq(workflowDefinitions.id, id), eq(workflowDefinitions.tenantCompanyId, ctx.user.tenantCompanyId!)));
    return { success: true };
  }),

  setStatus: protectedProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["draft", "active", "paused", "archived"]),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(workflowDefinitions)
      .set({ status: input.status, updatedAt: Date.now() })
      .where(and(eq(workflowDefinitions.id, input.id), eq(workflowDefinitions.tenantCompanyId, ctx.user.tenantCompanyId!)));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(workflowDefinitions)
      .where(and(eq(workflowDefinitions.id, input.id), eq(workflowDefinitions.tenantCompanyId, ctx.user.tenantCompanyId!)));
    return { success: true };
  }),

  getRuns: protectedProcedure.input(z.object({ workflowId: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(workflowRuns)
      .where(and(
        eq(workflowRuns.workflowId, input.workflowId),
        eq(workflowRuns.tenantCompanyId, ctx.user.tenantCompanyId!)
      ))
      .orderBy(desc(workflowRuns.startedAt))
      .limit(20);
  }),
});

// ─── Custom Report Builder ────────────────────────────────────────────────────
export const reportsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(savedReports)
      .where(and(
        eq(savedReports.tenantCompanyId, ctx.user.tenantCompanyId!),
        or(
          eq(savedReports.createdByUserId, ctx.user.id),
          eq(savedReports.isShared, true)
        )
      ))
      .orderBy(desc(savedReports.updatedAt))
      .limit(50);
  }),

  create: protectedProcedure.input(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    reportType: z.enum(["contacts", "companies", "deals", "activities", "campaigns", "revenue"]),
    filtersJson: z.record(z.string(), z.unknown()).optional(),
    columnsJson: z.array(z.string()).optional(),
    groupBy: z.string().optional(),
    sortBy: z.string().optional(),
    sortDir: z.enum(["asc", "desc"]).optional(),
    isShared: z.boolean().default(false),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const [result] = await db.insert(savedReports).values({
      tenantCompanyId: ctx.user.tenantCompanyId!,
      createdByUserId: ctx.user.id,
      name: input.name,
      description: input.description,
      reportType: input.reportType,
      filtersJson: input.filtersJson ?? {},
      columnsJson: input.columnsJson ?? [],
      groupBy: input.groupBy,
      sortBy: input.sortBy,
      sortDir: input.sortDir ?? "desc",
      isShared: input.isShared,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, id: (result as any).insertId };
  }),

  runReport: protectedProcedure.input(z.object({
    id: z.number(),
    limit: z.number().default(500),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const tid = ctx.user.tenantCompanyId!;
    const [report] = await db.select().from(savedReports)
      .where(and(eq(savedReports.id, input.id), eq(savedReports.tenantCompanyId, tid)));
    if (!report) throw new TRPCError({ code: "NOT_FOUND" });
    const reportType = report.reportType;
    let rows: any[] = [];
    if (reportType === "contacts") {
      rows = await db.select().from(contacts).where(eq(contacts.tenantId, tid)).orderBy(desc(contacts.createdAt)).limit(input.limit);
    } else if (reportType === "companies") {
      rows = await db.select().from(companies).where(eq(companies.tenantId, tid)).orderBy(desc(companies.createdAt)).limit(input.limit);
    } else if (reportType === "deals") {
      rows = await db.select().from(deals).where(eq(deals.tenantId, tid)).orderBy(desc(deals.createdAt)).limit(input.limit);
    } else if (reportType === "activities") {
      rows = await db.select().from(activityHistory).where(eq(activityHistory.tenantCompanyId, tid)).orderBy(desc(activityHistory.occurredAt)).limit(input.limit);
    }
    return { reportId: input.id, reportType, rows, totalRows: rows.length };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(savedReports)
      .where(and(eq(savedReports.id, input.id), eq(savedReports.tenantCompanyId, ctx.user.tenantCompanyId!)));
    return { success: true };
  }),
});

// ─── Integration Hub ──────────────────────────────────────────────────────────
export const integrationHubRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const existing = await db.select().from(integrationConnectors)
      .where(eq(integrationConnectors.tenantCompanyId, ctx.user.tenantCompanyId!));
    const catalog = [
      { key: "slack", name: "Slack", category: "communication", logo: "💬", description: "Send deal alerts and activity notifications to Slack channels" },
      { key: "teams", name: "Microsoft Teams", category: "communication", logo: "🟦", description: "Push CRM updates to Teams channels" },
      { key: "zapier", name: "Zapier", category: "automation", logo: "⚡", description: "Connect Apex CRM to 5,000+ apps via Zapier" },
      { key: "make", name: "Make (Integromat)", category: "automation", logo: "🔄", description: "Build complex automation scenarios with Make" },
      { key: "quickbooks", name: "QuickBooks", category: "finance", logo: "💰", description: "Sync invoices and payments with QuickBooks" },
      { key: "stripe", name: "Stripe", category: "finance", logo: "💳", description: "Track payments and subscriptions from Stripe" },
      { key: "zoom", name: "Zoom", category: "meetings", logo: "📹", description: "Auto-create Zoom links for scheduled meetings" },
      { key: "google_meet", name: "Google Meet", category: "meetings", logo: "🎥", description: "Auto-create Google Meet links" },
      { key: "shopify", name: "Shopify", category: "ecommerce", logo: "🛍️", description: "Sync orders and customers from Shopify" },
      { key: "typeform", name: "Typeform", category: "forms", logo: "📋", description: "Create contacts from Typeform submissions" },
      { key: "calendly", name: "Calendly", category: "scheduling", logo: "📅", description: "Sync Calendly bookings to CRM activities" },
      { key: "linkedin", name: "LinkedIn Sales Navigator", category: "prospecting", logo: "💼", description: "Import LinkedIn prospects directly" },
      { key: "twilio", name: "Twilio", category: "telephony", logo: "📞", description: "Enable click-to-call and SMS from within Apex" },
      { key: "sendgrid", name: "SendGrid", category: "email", logo: "📧", description: "Route transactional emails through SendGrid" },
      { key: "hubspot", name: "HubSpot", category: "migration", logo: "🟠", description: "Import data from HubSpot" },
      { key: "salesforce", name: "Salesforce", category: "migration", logo: "☁️", description: "Import data from Salesforce" },
    ];
    return catalog.map(c => ({
      ...c,
      connection: existing.find(e => e.connectorKey === c.key) ?? null,
    }));
  }),

  connect: protectedProcedure.input(z.object({
    connectorKey: z.string(),
    displayName: z.string(),
    webhookUrl: z.string().optional(),
    apiKey: z.string().optional(),
    configJson: z.record(z.string(), z.unknown()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const existing = await db.select().from(integrationConnectors)
      .where(and(
        eq(integrationConnectors.tenantCompanyId, ctx.user.tenantCompanyId!),
        eq(integrationConnectors.connectorKey, input.connectorKey)
      ));
    if (existing.length > 0) {
      await db.update(integrationConnectors)
        .set({
          webhookUrl: input.webhookUrl,
          apiKey: input.apiKey,
          configJson: input.configJson ?? {},
          status: "connected",
          connectedAt: now,
          updatedAt: now,
        })
        .where(eq(integrationConnectors.id, existing[0].id));
    } else {
      await db.insert(integrationConnectors).values({
        tenantCompanyId: ctx.user.tenantCompanyId!,
        connectorKey: input.connectorKey,
        displayName: input.displayName,
        status: "connected",
        webhookUrl: input.webhookUrl,
        apiKey: input.apiKey,
        configJson: input.configJson ?? {},
        connectedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { success: true };
  }),

  disconnect: protectedProcedure.input(z.object({ connectorKey: z.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(integrationConnectors)
      .set({ status: "disconnected", updatedAt: Date.now() })
      .where(and(
        eq(integrationConnectors.tenantCompanyId, ctx.user.tenantCompanyId!),
        eq(integrationConnectors.connectorKey, input.connectorKey)
      ));
    return { success: true };
  }),

  test: protectedProcedure.input(z.object({ connectorKey: z.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [conn] = await db.select().from(integrationConnectors)
      .where(and(
        eq(integrationConnectors.tenantCompanyId, ctx.user.tenantCompanyId!),
        eq(integrationConnectors.connectorKey, input.connectorKey)
      ));
    if (!conn) throw new TRPCError({ code: "NOT_FOUND" });
    let success = false;
    if (conn.webhookUrl) {
      try {
        const resp = await fetch(conn.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "ping", source: "apex-crm", timestamp: Date.now() }),
        });
        success = resp.ok;
      } catch { success = false; }
    } else {
      success = !!conn.apiKey;
    }
    await db.update(integrationConnectors)
      .set({
        status: success ? "connected" : "error",
        lastTestedAt: Date.now(),
        updatedAt: Date.now(),
      })
      .where(eq(integrationConnectors.id, conn.id));
    return { success, status: success ? "connected" : "error" };
  }),
});

// ─── Onboarding Concierge ─────────────────────────────────────────────────────
export const onboardingRouter = router({
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [progress] = await db.select().from(onboardingProgress)
      .where(and(
        eq(onboardingProgress.userId, ctx.user.id),
        eq(onboardingProgress.tenantCompanyId, ctx.user.tenantCompanyId!)
      ));
    return progress ?? null;
  }),

  initProgress: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const existing = await db.select().from(onboardingProgress)
      .where(and(
        eq(onboardingProgress.userId, ctx.user.id),
        eq(onboardingProgress.tenantCompanyId, ctx.user.tenantCompanyId!)
      ));
    if (existing.length > 0) return existing[0];
    await db.insert(onboardingProgress).values({
      userId: ctx.user.id,
      tenantCompanyId: ctx.user.tenantCompanyId!,
      completedSteps: [],
      currentStep: "import_contacts",
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    });
    return { currentStep: "import_contacts", completedSteps: [] as string[] };
  }),

  completeStep: protectedProcedure.input(z.object({
    stepId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [progress] = await db.select().from(onboardingProgress)
      .where(and(
        eq(onboardingProgress.userId, ctx.user.id),
        eq(onboardingProgress.tenantCompanyId, ctx.user.tenantCompanyId!)
      ));
    if (!progress) throw new TRPCError({ code: "NOT_FOUND" });
    const steps = (progress.completedSteps as string[]) ?? [];
    if (!steps.includes(input.stepId)) steps.push(input.stepId);
    const allSteps = ["import_contacts", "add_team", "connect_email", "create_deal", "send_campaign", "setup_workflow", "connect_calendar"];
    const isCompleted = allSteps.every(s => steps.includes(s));
    const currentIdx = allSteps.indexOf(input.stepId);
    const nextStep = allSteps[currentIdx + 1] ?? null;
    await db.update(onboardingProgress)
      .set({
        completedSteps: steps,
        currentStep: nextStep,
        isCompleted,
        completedAt: isCompleted ? Date.now() : undefined,
        updatedAt: Date.now(),
      })
      .where(eq(onboardingProgress.id, progress.id));
    return { success: true, isCompleted, nextStep };
  }),

  dismiss: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(onboardingProgress)
      .set({ dismissedAt: Date.now(), updatedAt: Date.now() })
      .where(and(
        eq(onboardingProgress.userId, ctx.user.id),
        eq(onboardingProgress.tenantCompanyId, ctx.user.tenantCompanyId!)
      ));
    return { success: true };
  }),

  getAIHelp: protectedProcedure.input(z.object({
    question: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are the Apex CRM onboarding assistant. Answer questions about how to use Apex CRM concisely and helpfully. Focus on actionable steps. Keep answers under 150 words." },
        { role: "user", content: input.question },
      ],
    });
    return { answer: response.choices[0].message.content as string };
  }),
});

// ─── Historical Activity Importer ─────────────────────────────────────────────
export const historyImporterRouter = router({
  importActivities: protectedProcedure.input(z.object({
    activities: z.array(z.object({
      activityType: z.enum(["email_sent", "email_received", "call", "meeting", "note", "task", "stage_change", "field_change", "deal_created", "contact_created", "file_upload", "sms", "linkedin", "import"]),
      objectType: z.enum(["contact", "company", "deal", "lead", "custom_object"]),
      recordId: z.number(),
      subject: z.string().optional(),
      body: z.string().optional(),
      direction: z.enum(["inbound", "outbound"]).optional(),
      durationSeconds: z.number().optional(),
      outcome: z.string().optional(),
      fromEmail: z.string().optional(),
      toEmail: z.string().optional(),
      occurredAt: z.number(),
      sourceSystem: z.string().optional(),
      sourceActivityId: z.string().optional(),
    })),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const rows = input.activities.map(a => ({
      ...a,
      tenantCompanyId: ctx.user.tenantCompanyId!,
      userId: ctx.user.id,
      metadata: {} as Record<string, unknown>,
      createdAt: now,
    }));
    for (let i = 0; i < rows.length; i += 100) {
      await db.insert(activityHistory).values(rows.slice(i, i + 100));
    }
    return { success: true, imported: rows.length };
  }),

  getTimeline: protectedProcedure.input(z.object({
    objectType: z.enum(["contact", "company", "deal", "lead", "custom_object"]),
    recordId: z.number(),
    limit: z.number().default(50),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(activityHistory)
      .where(and(
        eq(activityHistory.tenantCompanyId, ctx.user.tenantCompanyId!),
        eq(activityHistory.objectType, input.objectType),
        eq(activityHistory.recordId, input.recordId)
      ))
      .orderBy(desc(activityHistory.occurredAt))
      .limit(input.limit);
  }),
});
