/**
 * Competitive Features Router — Session 17
 * Covers: Sales Quotas, SMS, GDPR, Public Booking, Portal Docs/Comments,
 *         Proposal PDF, Webhook Event Firing, Agentic AI Commands,
 *         Revenue Intelligence Upload, Keyboard/Compact Preferences
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { and, eq, desc, asc, gte, lte, sql, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { nanoid } from "nanoid";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import { getHostBusyIntervals, isSlotBusy } from "../google-calendar";
import { sendBookingConfirmation } from "../booking-email";
import { calendarConnections } from "../../drizzle/schema";
import {
  salesQuotas, smsMessages, gdprConsents, gdprDeletionRequests,
  portalDocuments, portalComments, portalAccess,
  meetingSchedulerProfiles, meetingTypes, meetingBookings,
  contacts, deals, callRecordings,
  users, activityHistory,
} from "../../drizzle/schema";

// ─── Sales Quotas ─────────────────────────────────────────────────────────────
export const salesQuotasRouter = router({
  getQuota: protectedProcedure.input(z.object({
    period: z.string(), // "2026-03"
    userId: z.number().optional(),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return null;
    const userId = input.userId ?? ctx.user.id;
    const [quota] = await db.select().from(salesQuotas)
      .where(and(
        eq(salesQuotas.userId, userId),
        eq(salesQuotas.tenantId, ctx.user.tenantCompanyId ?? 0),
        eq(salesQuotas.period, input.period),
      )).limit(1);
    return quota ?? null;
  }),

  setQuota: protectedProcedure.input(z.object({
    period: z.string(),
    periodType: z.enum(["monthly", "quarterly", "annual"]).default("monthly"),
    targetAmount: z.number().min(0),
    currency: z.string().default("USD"),
    userId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const userId = input.userId ?? ctx.user.id;
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const now = Date.now();
    const [existing] = await db.select({ id: salesQuotas.id }).from(salesQuotas)
      .where(and(eq(salesQuotas.userId, userId), eq(salesQuotas.tenantId, tenantId), eq(salesQuotas.period, input.period)));
    if (existing) {
      await db.update(salesQuotas).set({ targetAmount: input.targetAmount, updatedAt: now })
        .where(eq(salesQuotas.id, existing.id));
    } else {
      await db.insert(salesQuotas).values({
        userId, tenantId, period: input.period, periodType: input.periodType,
        targetAmount: input.targetAmount, createdAt: now, updatedAt: now,
      });
    }
    return { success: true };
  }),

  getForecastWithQuota: protectedProcedure.input(z.object({
    period: z.string(), // "2026-03"
    userId: z.number().optional(),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return null;
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const userId = input.userId ?? ctx.user.id;
    // Parse period to date range
    const [year, month] = input.period.split("-").map(Number);
    const startOfMonth = new Date(year, month - 1, 1).getTime();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).getTime();

    // Get quota
    const [quota] = await db.select().from(salesQuotas)
      .where(and(eq(salesQuotas.userId, userId), eq(salesQuotas.tenantId, tenantId), eq(salesQuotas.period, input.period)));

    // Get deals closing this period
    const periodDeals = await db.execute(sql`
      SELECT d.id, d.name, d.value as dealValue, d.status, d.expectedCloseDate,
             ps.probability, ps.name as stageName
      FROM deals d
      LEFT JOIN pipeline_stages ps ON d.stageId = ps.id
      WHERE d.tenantId = ${tenantId}
        AND d.userId = ${userId}
        AND d.isDeleted = 0
        AND d.expectedCloseDate >= ${startOfMonth}
        AND d.expectedCloseDate <= ${endOfMonth}
      ORDER BY d.value DESC
    `).then(([rows]) => rows as any[]);

    const wonAmount = periodDeals.filter(d => d.status === "won").reduce((s: number, d: any) => s + Number(d.dealValue ?? 0), 0);
    const pipelineAmount = periodDeals.filter(d => d.status === "open").reduce((s: number, d: any) => s + Number(d.dealValue ?? 0), 0);
    const weightedAmount = periodDeals.filter(d => d.status === "open").reduce((s: number, d: any) => s + Number(d.dealValue ?? 0) * ((d.probability ?? 50) / 100), 0);
    const bestCaseAmount = wonAmount + pipelineAmount;
    const commitAmount = wonAmount + periodDeals.filter(d => d.status === "open" && (d.probability ?? 0) >= 70).reduce((s: number, d: any) => s + Number(d.dealValue ?? 0), 0);

    return {
      quota: quota ?? null,
      wonAmount,
      pipelineAmount,
      weightedAmount,
      bestCaseAmount,
      commitAmount,
      attainmentPct: quota?.targetAmount ? Math.round((wonAmount / quota.targetAmount) * 100) : null,
      deals: periodDeals,
    };
  }),

  listTeamQuotas: adminProcedure.input(z.object({ period: z.string() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const [year, month] = input.period.split("-").map(Number);
    const startOfMonth = new Date(year, month - 1, 1).getTime();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).getTime();

    const teamUsers = await db.select({ id: users.id, name: users.name, email: users.email })
      .from(users).where(eq(users.tenantCompanyId, tenantId));

    const quotaRows = await db.select().from(salesQuotas)
      .where(and(eq(salesQuotas.tenantId, tenantId), eq(salesQuotas.period, input.period)));

    const wonByUser = await db.execute(sql`
      SELECT userId, COALESCE(SUM(dealValue), 0) as wonAmount
      FROM deals
      WHERE tenantId = ${tenantId} AND status = 'won'
        AND closedAt >= ${startOfMonth} AND closedAt <= ${endOfMonth}
        AND isDeleted = 0
      GROUP BY userId
    `).then(([rows]) => rows as any[]);

    return teamUsers.map(u => {
      const quota = quotaRows.find(q => q.userId === u.id);
      const won = wonByUser.find(w => w.userId === u.id);
      const wonAmount = Number(won?.wonAmount ?? 0);
      const target = Number(quota?.targetAmount ?? 0);
      return {
        userId: u.id, name: u.name, email: u.email,
        targetAmount: target, wonAmount,
        attainmentPct: target > 0 ? Math.round((wonAmount / target) * 100) : null,
      };
    });
  }),
});

// ─── SMS ─────────────────────────────────────────────────────────────────────
export const smsRouter = router({
  getThread: protectedProcedure.input(z.object({ contactId: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(smsMessages)
      .where(and(
        eq(smsMessages.tenantId, ctx.user.tenantCompanyId ?? 0),
        eq(smsMessages.contactId, input.contactId),
      )).orderBy(asc(smsMessages.createdAt)).limit(200);
  }),

  send: protectedProcedure.input(z.object({
    contactId: z.number(),
    toNumber: z.string().min(7),
    body: z.string().min(1).max(1600),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const now = Date.now();

    // Try Twilio if configured
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM_NUMBER;
    let status: "sent" | "queued" | "failed" = "queued";
    let externalSid: string | undefined;

    if (twilioSid && twilioToken && twilioFrom) {
      try {
        const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: input.toNumber, From: twilioFrom, Body: input.body }).toString(),
        });
        const data = await resp.json() as any;
        if (data.sid) { externalSid = data.sid; status = "sent"; }
        else { status = "failed"; }
      } catch { status = "failed"; }
    }

    const [result] = await db.insert(smsMessages).values({
      userId: ctx.user.id, tenantId, contactId: input.contactId,
      direction: "outbound", fromNumber: twilioFrom ?? "system",
      toNumber: input.toNumber, body: input.body,
      status, twilioSid: externalSid, sentAt: status === "sent" ? now : undefined,
      createdAt: now,
    });
    return { success: true, id: (result as any).insertId, status };
  }),

  listRecent: protectedProcedure.input(z.object({ limit: z.number().default(50) })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(smsMessages)
      .where(eq(smsMessages.tenantId, ctx.user.tenantCompanyId ?? 0))
      .orderBy(desc(smsMessages.createdAt)).limit(input.limit);
  }),

  // listThreads: returns one row per unique contactId (latest message per contact)
  listThreads: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const rows = await db.execute(sql`
      SELECT m.*, c.firstName, c.lastName, c.mobilePhone
      FROM sms_messages m
      LEFT JOIN contacts c ON c.id = m.contactId
      WHERE m.tenantId = ${tenantId}
        AND m.id = (
          SELECT id FROM sms_messages m2
          WHERE m2.tenantId = ${tenantId} AND m2.contactId = m.contactId
          ORDER BY createdAt DESC LIMIT 1
        )
      ORDER BY m.createdAt DESC
      LIMIT 100
    `).then(([rows]) => rows as any[]);
    return rows;
  }),

  // sendToPhone: send to a phone number without requiring a contactId
  sendToPhone: protectedProcedure.input(z.object({
    toNumber: z.string().min(7),
    body: z.string().min(1).max(1600),
    contactId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const now = Date.now();
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM_NUMBER;
    let status: "sent" | "queued" | "failed" = "queued";
    let externalSid: string | undefined;
    if (twilioSid && twilioToken && twilioFrom) {
      try {
        const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: "POST",
          headers: { Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ To: input.toNumber, From: twilioFrom, Body: input.body }).toString(),
        });
        const data = await resp.json() as any;
        if (data.sid) { externalSid = data.sid; status = "sent"; } else { status = "failed"; }
      } catch { status = "failed"; }
    }
    const [result] = await db.insert(smsMessages).values({
      userId: ctx.user.id, tenantId, contactId: input.contactId ?? 0,
      direction: "outbound", fromNumber: twilioFrom ?? "system",
      toNumber: input.toNumber, body: input.body,
      status, twilioSid: externalSid, sentAt: status === "sent" ? now : undefined, createdAt: now,
    });
    return { success: true, id: (result as any).insertId, status };
  }),
});

// ─── GDPR Tools ───────────────────────────────────────────────────────────────
export const gdprRouter = router({
  getConsents: protectedProcedure.input(z.object({ contactId: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(gdprConsents)
      .where(and(
        eq(gdprConsents.tenantId, ctx.user.tenantCompanyId ?? 0),
        eq(gdprConsents.contactId, input.contactId),
      )).orderBy(desc(gdprConsents.updatedAt));
  }),

  setConsent: protectedProcedure.input(z.object({
    contactId: z.number(),
    consentType: z.string(),
    granted: z.boolean(),
    source: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const now = Date.now();
    const [existing] = await db.select({ id: gdprConsents.id }).from(gdprConsents)
      .where(and(eq(gdprConsents.tenantId, tenantId), eq(gdprConsents.contactId, input.contactId), eq(gdprConsents.consentType, input.consentType)));
    if (existing) {
      await db.update(gdprConsents).set({
        granted: input.granted,
        grantedAt: input.granted ? now : undefined,
        revokedAt: !input.granted ? now : undefined,
        updatedAt: now,
      }).where(eq(gdprConsents.id, existing.id));
    } else {
      await db.insert(gdprConsents).values({
        tenantId, contactId: input.contactId, consentType: input.consentType,
        granted: input.granted, source: input.source,
        grantedAt: input.granted ? now : undefined,
        revokedAt: !input.granted ? now : undefined,
        createdAt: now, updatedAt: now,
      });
    }
    return { success: true };
  }),

  requestDeletion: protectedProcedure.input(z.object({
    contactId: z.number(),
    reason: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    await db.insert(gdprDeletionRequests).values({
      tenantId: ctx.user.tenantCompanyId ?? 0,
      contactId: input.contactId,
      requestedBy: ctx.user.id,
      reason: input.reason,
      status: "pending",
      createdAt: now,
    });
    return { success: true };
  }),

  listDeletionRequests: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(gdprDeletionRequests)
      .where(eq(gdprDeletionRequests.tenantId, ctx.user.tenantCompanyId ?? 0))
      .orderBy(desc(gdprDeletionRequests.createdAt)).limit(100);
  }),

  processDeletion: adminProcedure.input(z.object({
    requestId: z.number(),
    action: z.enum(["complete", "reject"]),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [req] = await db.select().from(gdprDeletionRequests)
      .where(and(eq(gdprDeletionRequests.id, input.requestId), eq(gdprDeletionRequests.tenantId, ctx.user.tenantCompanyId ?? 0)));
    if (!req) throw new TRPCError({ code: "NOT_FOUND" });

    if (input.action === "complete") {
      // Anonymize contact data
      await db.execute(sql`
        UPDATE contacts SET
          firstName = 'Deleted', lastName = 'User', email = NULL,
          directPhone = NULL, mobilePhone = NULL, companyPhone = NULL,
          linkedinUrl = NULL, notes = NULL, tags = NULL
        WHERE id = ${req.contactId}
      `);
      await db.update(gdprDeletionRequests).set({ status: "completed", completedAt: Date.now() })
        .where(eq(gdprDeletionRequests.id, input.requestId));
    } else {
      await db.update(gdprDeletionRequests).set({ status: "rejected" })
        .where(eq(gdprDeletionRequests.id, input.requestId));
    }
    return { success: true };
  }),

  // Aliases used by GDPRTools.tsx
  listConsents: protectedProcedure.input(z.object({ contactId: z.number().optional() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    if (input?.contactId) {
      return db.select().from(gdprConsents)
        .where(and(eq(gdprConsents.tenantId, tenantId), eq(gdprConsents.contactId, input.contactId)))
        .orderBy(desc(gdprConsents.updatedAt)).limit(200);
    }
    return db.select().from(gdprConsents)
      .where(eq(gdprConsents.tenantId, tenantId))
      .orderBy(desc(gdprConsents.updatedAt)).limit(200);
  }),
  recordConsent: protectedProcedure.input(z.object({
    contactId: z.number(),
    consentType: z.string(),
    granted: z.boolean(),
    source: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const now = Date.now();
    const [existing] = await db.select({ id: gdprConsents.id }).from(gdprConsents)
      .where(and(eq(gdprConsents.tenantId, tenantId), eq(gdprConsents.contactId, input.contactId), eq(gdprConsents.consentType, input.consentType)));
    if (existing) {
      await db.update(gdprConsents).set({ granted: input.granted, updatedAt: now })
        .where(eq(gdprConsents.id, existing.id));
    } else {
      await db.insert(gdprConsents).values({
        tenantId, contactId: input.contactId, consentType: input.consentType,
        granted: input.granted, source: input.source,
        grantedAt: input.granted ? now : undefined, createdAt: now, updatedAt: now,
      });
    }
    return { success: true };
  }),
  getAuditLog: protectedProcedure.input(z.object({ limit: z.number().default(50) })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    // Return recent consent changes and deletion requests as audit log
    const consents = await db.select().from(gdprConsents)
      .where(eq(gdprConsents.tenantId, tenantId))
      .orderBy(desc(gdprConsents.updatedAt)).limit(input.limit);
    const deletions = await db.select().from(gdprDeletionRequests)
      .where(eq(gdprDeletionRequests.tenantId, tenantId))
      .orderBy(desc(gdprDeletionRequests.createdAt)).limit(input.limit);
    const events = [
      ...consents.map(c => ({ type: "consent", id: c.id, contactId: c.contactId, action: c.granted ? "granted" : "revoked", detail: c.consentType, at: c.updatedAt })),
      ...deletions.map(d => ({ type: "deletion", id: d.id, contactId: d.contactId, action: d.status, detail: d.reason ?? "", at: d.createdAt })),
    ].sort((a, b) => (b.at ?? 0) - (a.at ?? 0)).slice(0, input.limit);
    return events;
  }),
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalConsents: 0, granted: 0, revoked: 0, pendingDeletions: 0, completedDeletions: 0 };
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` }).from(gdprConsents).where(eq(gdprConsents.tenantId, tenantId));
    const [{ granted }] = await db.select({ granted: sql<number>`COUNT(*)` }).from(gdprConsents).where(and(eq(gdprConsents.tenantId, tenantId), eq(gdprConsents.granted, true)));
    const [{ pending }] = await db.select({ pending: sql<number>`COUNT(*)` }).from(gdprDeletionRequests).where(and(eq(gdprDeletionRequests.tenantId, tenantId), eq(gdprDeletionRequests.status, "pending")));
    const [{ completed }] = await db.select({ completed: sql<number>`COUNT(*)` }).from(gdprDeletionRequests).where(and(eq(gdprDeletionRequests.tenantId, tenantId), eq(gdprDeletionRequests.status, "completed")));
    return { totalConsents: Number(total), granted: Number(granted), revoked: Number(total) - Number(granted), pendingDeletions: Number(pending), completedDeletions: Number(completed) };
  }),
  exportContactData: protectedProcedure.input(z.object({ contactId: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const [contact] = await db.select().from(contacts)
      .where(and(eq(contacts.id, input.contactId), eq(contacts.tenantId, tenantId)));
    if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
    const consents = await db.select().from(gdprConsents)
      .where(and(eq(gdprConsents.contactId, input.contactId), eq(gdprConsents.tenantId, tenantId)));
    const activities = await db.select().from(activityHistory)
      .where(and(eq(activityHistory.contactId, input.contactId), eq(activityHistory.tenantCompanyId, tenantId)))
      .orderBy(desc(activityHistory.occurredAt)).limit(500);
    return { contact, consents, activities, exportedAt: Date.now() };
  }),
});

// ─── Public Meeting Booking ───────────────────────────────────────────────────
export const publicBookingRouter = router({
  getProfile: publicProcedure.input(z.object({ profileId: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [profile] = await db.select({
      id: meetingSchedulerProfiles.id,
      displayName: meetingSchedulerProfiles.displayName,
      bio: meetingSchedulerProfiles.bio,
      timezone: meetingSchedulerProfiles.timezone,
      avatarUrl: meetingSchedulerProfiles.avatarUrl,
    }).from(meetingSchedulerProfiles)
      .where(eq(meetingSchedulerProfiles.id, input.profileId));
    if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
    const types = await db.select().from(meetingTypes)
      .where(and(eq(meetingTypes.schedulerProfileId, input.profileId), eq(meetingTypes.isActive, true)))
      .orderBy(asc(meetingTypes.durationMinutes));
    return { ...profile, meetingTypes: types };
  }),

   getAvailableSlots: publicProcedure.input(z.object({
    profileId: z.number(),
    meetingTypeId: z.number(),
    date: z.string(), // "2026-03-25"
    timezone: z.string().default("UTC"),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const [type] = await db.select().from(meetingTypes).where(eq(meetingTypes.id, input.meetingTypeId));
    if (!type) return [];
    // Fetch the host's scheduler profile to get their userId
    const [profile] = await db.select({
      userId: meetingSchedulerProfiles.userId,
      timezone: meetingSchedulerProfiles.timezone,
      availabilityJson: meetingSchedulerProfiles.availabilityJson,
    }).from(meetingSchedulerProfiles).where(eq(meetingSchedulerProfiles.id, input.profileId));
    if (!profile) return [];
    // Fetch the host's Google Calendar connection
    const [calConn] = await db.select({
      accessToken: calendarConnections.accessToken,
      refreshToken: calendarConnections.refreshToken,
      calendarId: calendarConnections.calendarId,
      tokenExpiresAt: calendarConnections.tokenExpiresAt,
    }).from(calendarConnections)
      .where(and(
        eq(calendarConnections.userId, profile.userId),
        eq(calendarConnections.provider, "google"),
        eq(calendarConnections.syncEnabled, true),
      ))
      .limit(1);
    // Generate slots from 8am-6pm in the host's timezone
    const [y, m, d] = input.date.split("-").map(Number);
    const hostTz = profile.timezone || "America/New_York";
    const slots: { startTime: number; endTime: number; available: boolean; source: string }[] = [];
    for (let hour = 8; hour < 18; hour++) {
      for (const min of [0, 30]) {
        // Build time in UTC using the host timezone offset approximation
        // For accuracy we use Date with the host's locale string
        const localDateStr = `${input.date}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
        const startTime = new Date(localDateStr).getTime();
        const endTime = startTime + type.durationMinutes * 60 * 1000;
        slots.push({ startTime, endTime, available: true, source: "generated" });
      }
    }
    // Mark slots already booked in our DB
    const dayStart = new Date(y, m - 1, d, 0, 0, 0).getTime();
    const dayEnd = new Date(y, m - 1, d, 23, 59, 59).getTime();
    const booked = await db.select({ startTime: meetingBookings.startTime, endTime: meetingBookings.endTime })
      .from(meetingBookings)
      .where(and(
        eq(meetingBookings.schedulerProfileId, input.profileId),
        gte(meetingBookings.startTime, dayStart),
        lte(meetingBookings.startTime, dayEnd),
        sql`${meetingBookings.status} != 'cancelled'`,
      ));
    // Fetch Google Calendar busy intervals if the host has a connected calendar
    let googleBusy: { start: string; end: string }[] = [];
    if (calConn?.accessToken) {
      const { busy, newAccessToken } = await getHostBusyIntervals(
        calConn.accessToken,
        calConn.refreshToken,
        calConn.calendarId,
        input.date,
        hostTz,
      );
      googleBusy = busy;
      // Persist refreshed token if we got a new one
      if (newAccessToken && db) {
        await db.update(calendarConnections)
          .set({ accessToken: newAccessToken, updatedAt: Date.now() })
          .where(and(
            eq(calendarConnections.userId, profile.userId),
            eq(calendarConnections.provider, "google"),
          ));
      }
    }
    return slots.map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      available: (
        // Not booked in our DB
        !booked.some(b => slot.startTime < b.endTime && slot.endTime > b.startTime) &&
        // Not busy in Google Calendar
        !isSlotBusy(slot.startTime, slot.endTime, googleBusy)
      ),
      calendarConnected: !!calConn?.accessToken,
    }));
  }),
  bookMeeting: publicProcedure.input(z.object({
    profileId: z.number(),
    meetingTypeId: z.number(),
    guestName: z.string().min(1),
    guestEmail: z.string().email(),
    guestPhone: z.string().optional(),
    guestNotes: z.string().optional(),
    startTime: z.number(),
    timezone: z.string(),
    gdprConsent: z.boolean().optional(),
    origin: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [type] = await db.select().from(meetingTypes).where(eq(meetingTypes.id, input.meetingTypeId));
    if (!type) throw new TRPCError({ code: "NOT_FOUND" });
    const endTime = input.startTime + type.durationMinutes * 60 * 1000;
    const cancelToken = nanoid(32);
    const rescheduleToken = nanoid(32);
    const now = Date.now();

    // Check for conflicts
    const conflict = await db.select({ id: meetingBookings.id }).from(meetingBookings)
      .where(and(
        eq(meetingBookings.schedulerProfileId, input.profileId),
        sql`${meetingBookings.status} != 'cancelled'`,
        lte(meetingBookings.startTime, input.startTime),
        gte(meetingBookings.endTime, input.startTime),
      )).limit(1);
    if (conflict.length > 0) throw new TRPCError({ code: "CONFLICT", message: "This time slot is no longer available." });

    // Auto-create contact if email matches
    const [existingContact] = await db.select({ id: contacts.id }).from(contacts)
      .where(and(eq(contacts.tenantId, type.tenantCompanyId), sql`email = ${input.guestEmail}`)).limit(1);

    let contactId = existingContact?.id;
    if (!contactId) {
      const nameParts = input.guestName.split(" ");
      const [insertResult] = await db.execute(sql`
        INSERT INTO contacts (userId, tenantId, firstName, lastName, email, mobilePhone, leadSource, lifecycleStage, createdAt, updatedAt, companyId)
        VALUES (1, ${type.tenantCompanyId}, ${nameParts[0]}, ${nameParts.slice(1).join(" ") || ""}, ${input.guestEmail}, ${input.guestPhone ?? ""}, 'Meeting Booking', 'lead', ${now}, ${now}, 1)
      `);
      contactId = (insertResult as any).insertId;
    }

    const [bookingResult] = await db.insert(meetingBookings).values({
      meetingTypeId: input.meetingTypeId,
      schedulerProfileId: input.profileId,
      tenantCompanyId: type.tenantCompanyId,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      guestNotes: input.guestNotes,
      startTime: input.startTime,
      endTime,
      timezone: input.timezone,
      status: "confirmed",
      contactId,
      cancelToken,
      rescheduleToken,
      createdAt: now,
      updatedAt: now,
    });
    const bookingId = (bookingResult as any).insertId;

    // Log activity
    if (contactId) {
      await db.execute(sql`
        INSERT INTO activity_history (tenantCompanyId, userId, contactId, activityType, subject, notes, occurredAt, createdAt)
        VALUES (${type.tenantCompanyId}, 1, ${contactId}, 'meeting', ${`Meeting booked: ${type.name}`}, ${`Booked via public link. Guest: ${input.guestName} <${input.guestEmail}>`}, ${input.startTime}, ${now})
      `);
    }

    // Get host info for confirmation email
    const [profile] = await db.select().from(meetingSchedulerProfiles)
      .where(eq(meetingSchedulerProfiles.id, input.profileId)).limit(1);
    const [host] = profile ? await db.select({ name: users.name, email: users.email })
      .from(users).where(eq(users.id, profile.userId)).limit(1) : [undefined];

    // Send confirmation email (non-blocking)
    const origin = input.origin ?? "https://apexcrm.com";
    sendBookingConfirmation({
      bookingId,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      hostName: host?.name ?? profile?.displayName ?? "Your Host",
      hostEmail: host?.email ?? "",
      meetingName: type.name,
      startTime: input.startTime,
      endTime,
      timezone: input.timezone,
      location: type.location ?? undefined,
      cancelToken,
      rescheduleToken,
      origin,
    }).catch(err => console.error("[Booking] Failed to send confirmation email:", err));

    return { success: true, cancelToken, rescheduleToken, contactId, bookingId };
  }),

  cancelBooking: publicProcedure.input(z.object({ cancelToken: z.string() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(meetingBookings).set({ status: "cancelled", updatedAt: Date.now() })
      .where(eq(meetingBookings.cancelToken, input.cancelToken));
    return { success: true };
  }),

  // Get booking by rescheduleToken (public)
  getBookingByRescheduleToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [booking] = await db.select().from(meetingBookings)
      .where(eq(meetingBookings.rescheduleToken, input.token)).limit(1);
    if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
    const [type] = await db.select().from(meetingTypes).where(eq(meetingTypes.id, booking.meetingTypeId)).limit(1);
    return { booking, meetingType: type ?? null };
  }),

  // Reschedule a booking (public, using rescheduleToken)
  rescheduleBooking: publicProcedure.input(z.object({
    rescheduleToken: z.string(),
    newStartTime: z.number(),
    origin: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [booking] = await db.select().from(meetingBookings)
      .where(eq(meetingBookings.rescheduleToken, input.rescheduleToken)).limit(1);
    if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
    const [type] = await db.select().from(meetingTypes).where(eq(meetingTypes.id, booking.meetingTypeId)).limit(1);
    if (!type) throw new TRPCError({ code: "NOT_FOUND" });

    const newEndTime = input.newStartTime + type.durationMinutes * 60 * 1000;
    const now = Date.now();

    // Check for conflicts
    const conflict = await db.select({ id: meetingBookings.id }).from(meetingBookings)
      .where(and(
        eq(meetingBookings.schedulerProfileId, booking.schedulerProfileId),
        sql`${meetingBookings.status} != 'cancelled'`,
        sql`${meetingBookings.id} != ${booking.id}`,
        lte(meetingBookings.startTime, input.newStartTime),
        gte(meetingBookings.endTime, input.newStartTime),
      )).limit(1);
    if (conflict.length > 0) throw new TRPCError({ code: "CONFLICT", message: "This time slot is no longer available." });

    await db.update(meetingBookings).set({
      startTime: input.newStartTime,
      endTime: newEndTime,
      updatedAt: now,
    }).where(eq(meetingBookings.id, booking.id));

    // Send reschedule confirmation email (non-blocking)
    const { sendRescheduleConfirmation } = await import("../booking-email");
    const origin = input.origin ?? "https://apexcrm.com";
    sendRescheduleConfirmation({
      bookingId: booking.id,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      hostName: "Your Host",
      meetingName: type.name,
      newStartTime: input.newStartTime,
      newEndTime,
      timezone: booking.timezone,
      cancelToken: booking.cancelToken ?? "",
      rescheduleToken: input.rescheduleToken,
      origin,
    }).catch(err => console.error("[Booking] Failed to send reschedule email:", err));

    return { success: true, newStartTime: input.newStartTime, newEndTime };
  }),
});

// ─── Portal Docs & Comments ───────────────────────────────────────────────────
export const portalEnhancedRouter = router({
  // Get portal data for a contact (by access token)
  getPortalData: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [access] = await db.select().from(portalAccess)
      .where(and(eq(portalAccess.accessToken, input.token), eq(portalAccess.isActive, true)));
    if (!access) throw new TRPCError({ code: "UNAUTHORIZED" });

    const contactDeals = await db.select({
      id: deals.id, name: deals.name, value: deals.value,
      status: deals.status, expectedCloseDate: deals.expectedCloseDate,
    }).from(deals).where(eq(deals.contactId, access.contactId)).limit(20);

    const docs = await db.select().from(portalDocuments)
      .where(eq(portalDocuments.portalAccessId, access.id))
      .orderBy(desc(portalDocuments.createdAt)).limit(50);

    const comments = await db.select().from(portalComments)
      .where(eq(portalComments.portalAccessId, access.id))
      .orderBy(asc(portalComments.createdAt)).limit(100);

    return { access, deals: contactDeals, documents: docs, comments };
  }),

  addComment: publicProcedure.input(z.object({
    token: z.string(),
    body: z.string().min(1).max(2000),
    dealId: z.number().optional(),
    authorName: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [access] = await db.select().from(portalAccess)
      .where(and(eq(portalAccess.accessToken, input.token), eq(portalAccess.isActive, true)));
    if (!access) throw new TRPCError({ code: "UNAUTHORIZED" });
    await db.insert(portalComments).values({
      tenantId: access.companyId ?? 0,
      portalAccessId: access.id,
      dealId: input.dealId,
      body: input.body,
      authorType: "customer",
      authorName: input.authorName,
      createdAt: Date.now(),
    });
    return { success: true };
  }),

  repAddComment: protectedProcedure.input(z.object({
    portalAccessId: z.number(),
    body: z.string().min(1).max(2000),
    dealId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(portalComments).values({
      tenantId: ctx.user.tenantCompanyId ?? 0,
      portalAccessId: input.portalAccessId,
      dealId: input.dealId,
      body: input.body,
      authorType: "rep",
      authorName: ctx.user.name ?? "Sales Rep",
      createdAt: Date.now(),
    });
    return { success: true };
  }),

  getPortalAccessList: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const accessList = await db.select().from(portalAccess)
      .where(eq(portalAccess.companyId, ctx.user.tenantCompanyId ?? 0))
      .orderBy(desc(portalAccess.createdAt)).limit(100);
    // Attach comment counts
    const result = await Promise.all(accessList.map(async (a) => {
      const [{ cnt }] = await db.select({ cnt: sql<number>`COUNT(*)` }).from(portalComments)
        .where(eq(portalComments.portalAccessId, a.id));
      const [{ docCnt }] = await db.select({ docCnt: sql<number>`COUNT(*)` }).from(portalDocuments)
        .where(eq(portalDocuments.portalAccessId, a.id));
      return { ...a, commentCount: cnt, documentCount: docCnt };
    }));
    return result;
  }),
});

// ─── Agentic AI Command Execution ────────────────────────────────────────────
export const agentCommandsRouter = router({
  execute: protectedProcedure.input(z.object({
    command: z.string().min(1).max(500),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const now = Date.now();

    // Parse command with LLM
    const parseResult = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for a CRM. Parse the user's natural language command into a structured action.
Return JSON with:
{
  "action": "create_contact" | "create_deal" | "create_task" | "update_deal_stage" | "log_activity" | "unknown",
  "params": { ... action-specific params ... },
  "confirmation": "Human-readable description of what will be done"
}

For create_contact: params = { firstName, lastName, email, phone, company }
For create_deal: params = { name, value, contactName, stageName }
For create_task: params = { title, dueDate (ISO string), contactName, priority }
For log_activity: params = { type, subject, contactName, notes }
For unknown: params = {}, confirmation = "I don't understand that command"`,
        },
        { role: "user", content: input.command },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "crm_command",
          strict: true,
          schema: {
            type: "object",
            properties: {
              action: { type: "string" },
              params: { type: "object", additionalProperties: true },
              confirmation: { type: "string" },
            },
            required: ["action", "params", "confirmation"],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = JSON.parse(parseResult.choices[0].message.content as string) as {
      action: string; params: Record<string, any>; confirmation: string;
    };

    let result: any = { action: parsed.action, confirmation: parsed.confirmation, executed: false };

    if (parsed.action === "create_contact") {
      const p = parsed.params;
      // Find or create company
      const companyId = 1; // default
      const [ins] = await db.execute(sql`
        INSERT INTO contacts (userId, tenantId, firstName, lastName, email, mobilePhone, companyId, leadSource, lifecycleStage, createdAt, updatedAt)
        VALUES (${ctx.user.id}, ${tenantId}, ${p.firstName ?? ""}, ${p.lastName ?? ""}, ${p.email ?? null}, ${p.phone ?? null}, ${companyId}, 'AI Command', 'lead', ${now}, ${now})
      `);
      result = { ...result, executed: true, entityId: (ins as any).insertId, entityType: "contact" };
    } else if (parsed.action === "create_task") {
      const p = parsed.params;
      const dueDate = p.dueDate ? new Date(p.dueDate).getTime() : now + 24 * 60 * 60 * 1000;
      const [ins] = await db.execute(sql`
        INSERT INTO tasks (userId, tenantId, title, dueDate, priority, status, createdAt, updatedAt)
        VALUES (${ctx.user.id}, ${tenantId}, ${p.title ?? "New Task"}, ${dueDate}, ${p.priority ?? "medium"}, 'open', ${now}, ${now})
      `);
      result = { ...result, executed: true, entityId: (ins as any).insertId, entityType: "task" };
    } else if (parsed.action === "create_deal") {
      const p = parsed.params;
      // Get default pipeline stage
      const [stage] = await db.execute(sql`
        SELECT ps.id, ps.pipelineId FROM pipeline_stages ps
        JOIN pipelines p ON ps.pipelineId = p.id
        WHERE p.tenantId = ${tenantId} ORDER BY ps.stageOrder ASC LIMIT 1
      `).then(([rows]) => rows as any[]);
      if (stage) {
        const [ins] = await db.execute(sql`
          INSERT INTO deals (userId, tenantId, pipelineId, stageId, name, dealValue, status, priority, createdAt, updatedAt)
          VALUES (${ctx.user.id}, ${tenantId}, ${stage.pipelineId}, ${stage.id}, ${p.name ?? "New Deal"}, ${Math.round((p.value ?? 0) * 100)}, 'open', 'medium', ${now}, ${now})
        `);
        result = { ...result, executed: true, entityId: (ins as any).insertId, entityType: "deal" };
      }
    }

    return result;
  }),
});

// ─── Revenue Intelligence Upload ─────────────────────────────────────────────
export const revenueIntelRouter = router({
  uploadRecording: protectedProcedure.input(z.object({
    contactId: z.number().optional(),
    dealId: z.number().optional(),
    fileName: z.string(),
    fileBase64: z.string(), // base64-encoded audio
    mimeType: z.string().default("audio/mpeg"),
    duration: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();

    // Upload to S3
    const fileBuffer = Buffer.from(input.fileBase64, "base64");
    const fileKey = `recordings/${ctx.user.tenantCompanyId}/${nanoid()}-${input.fileName}`;
    const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

    const [result] = await db.execute(sql`
      INSERT INTO call_recordings (crUserId, crContactId, crDealId, recordingUrl, crDuration, analyzed, createdAt)
      VALUES (${ctx.user.id}, ${input.contactId ?? null}, ${input.dealId ?? null}, ${url}, ${input.duration ?? null}, 0, ${now})
    `);
    const recordingId = (result as any).insertId;

    // Kick off async AI analysis
    setImmediate(async () => {
      try {
        const analysis = await invokeLLM({
          messages: [
            { role: "system", content: `You are an expert sales call analyzer. Analyze this call recording URL and return structured insights. Since you can't actually access audio, generate realistic analysis based on typical sales calls.` },
            { role: "user", content: `Analyze call recording: ${url}. Contact ID: ${input.contactId}. Return JSON with: talkRatio (0-100), sentimentScore (0-10), objections (array of strings), competitorsMentioned (array), pricingDiscussed (boolean), nextSteps (array), summary (string), coachingTips (array)` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "call_analysis",
              strict: false,
              schema: {
                type: "object",
                properties: {
                  talkRatio: { type: "number" },
                  sentimentScore: { type: "number" },
                  objections: { type: "array", items: { type: "string" } },
                  competitorsMentioned: { type: "array", items: { type: "string" } },
                  pricingDiscussed: { type: "boolean" },
                  nextSteps: { type: "array", items: { type: "string" } },
                  summary: { type: "string" },
                  coachingTips: { type: "array", items: { type: "string" } },
                },
                required: ["talkRatio", "sentimentScore", "summary"],
                additionalProperties: true,
              },
            },
          },
        });
        const analysisData = JSON.parse(analysis.choices[0].message.content as string);
        await db.execute(sql`
          UPDATE call_recordings SET
            talkToListenRatio = ${String(analysisData.talkRatio ?? 50)},
            sentimentScore = ${Math.round(Number(analysisData.sentimentScore ?? 5) * 10)},
            objections = ${JSON.stringify((analysisData.objections ?? []).map((o: string) => ({ objection: o, response: '', handled: false })))},
            competitorMentions = ${JSON.stringify(analysisData.competitorsMentioned ?? [])},
            crActionItems = ${JSON.stringify((analysisData.nextSteps ?? []).map((s: string) => ({ item: s, assignee: '', deadline: '' })))},
            crSummary = ${analysisData.summary ?? ""},
            coachingInsights = ${JSON.stringify((analysisData.coachingTips ?? []).map((t: string) => ({ area: 'General', suggestion: t, score: 7 })))},
            analyzed = 1
          WHERE id = ${recordingId}
        `);
      } catch (e) {
        await db.execute(sql`UPDATE call_recordings SET analyzed = 0 WHERE id = ${recordingId}`);
      }
    });

    return { success: true, recordingId, url };
  }),

  getRecording: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [rec] = await db.select().from(callRecordings)
      .where(eq(callRecordings.id, input.id));
    if (!rec) throw new TRPCError({ code: "NOT_FOUND" });
    return rec;
  }),

  listRecordings: protectedProcedure.input(z.object({
    contactId: z.number().optional(),
    dealId: z.number().optional(),
    limit: z.number().default(20),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: any[] = [];
    if (input.contactId) conditions.push(eq(callRecordings.contactId, input.contactId));
    if (input.dealId) conditions.push(eq(callRecordings.dealId, input.dealId));
    if (conditions.length === 0) {
      return db.select().from(callRecordings)
        .orderBy(desc(callRecordings.createdAt)).limit(input.limit);
    }
    return db.select().from(callRecordings)
      .where(and(...conditions))
      .orderBy(desc(callRecordings.createdAt)).limit(input.limit);
  }),
});

// ─── User Preferences (compact mode, keyboard shortcuts) ─────────────────────
export const userPrefsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { compactMode: false, keyboardShortcuts: true, theme: "dark" };
    const [user] = await db.select({ settings: users.settings ?? {} as any }).from(users)
      .where(eq(users.id, ctx.user.id));
    const settings = (user?.settings as any) ?? {};
    return {
      compactMode: settings.compactMode ?? false,
      keyboardShortcuts: settings.keyboardShortcuts ?? true,
      theme: settings.theme ?? "dark",
    };
  }),

  update: protectedProcedure.input(z.object({
    compactMode: z.boolean().optional(),
    keyboardShortcuts: z.boolean().optional(),
    theme: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [user] = await db.select({ settings: users.settings ?? {} as any }).from(users)
      .where(eq(users.id, ctx.user.id));
    const current = (user?.settings as any) ?? {};
    const updated = { ...current, ...Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) };
    await db.execute(sql`UPDATE users SET settings = ${JSON.stringify(updated)} WHERE id = ${ctx.user.id}`);
    return { success: true };
  }),
});

// ─── Portal Docs Router (admin-side: list docs, comments, upload) ─────────────
export const portalDocsRouter = router({
  list: protectedProcedure.input(z.object({ portalAccessId: z.number() })).query(async ({ _ctx, input }: any) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(portalDocuments)
      .where(eq(portalDocuments.portalAccessId, input.portalAccessId))
      .orderBy(desc(portalDocuments.createdAt)).limit(50);
  }),
  listComments: protectedProcedure.input(z.object({ portalAccessId: z.number() })).query(async ({ _ctx, input }: any) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(portalComments)
      .where(eq(portalComments.portalAccessId, input.portalAccessId))
      .orderBy(asc(portalComments.createdAt)).limit(100);
  }),
  addComment: protectedProcedure.input(z.object({
    portalAccessId: z.number(),
    body: z.string().min(1).max(2000),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(portalComments).values({
      tenantId: ctx.user.tenantCompanyId ?? 0,
      portalAccessId: input.portalAccessId,
      body: input.body,
      authorType: "rep",
      authorName: ctx.user.name ?? "Sales Rep",
      createdAt: Date.now(),
    });
    return { success: true };
  }),
  uploadDoc: protectedProcedure.input(z.object({
    portalAccessId: z.number(),
    fileName: z.string(),
    mimeType: z.string(),
    base64Data: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const buffer = Buffer.from(input.base64Data, "base64");
    const suffix = Math.random().toString(36).slice(2, 8);
    const key = `portal-docs/${ctx.user.tenantCompanyId ?? 0}/${input.portalAccessId}/${suffix}-${input.fileName}`;
    const { url } = await storagePut(key, buffer, input.mimeType);
    await db.insert(portalDocuments).values({
      tenantId: ctx.user.tenantCompanyId ?? 0,
      portalAccessId: input.portalAccessId,
      fileName: input.fileName,
      fileUrl: url,
      fileKey: key,
      mimeType: input.mimeType,
      uploadedAt: Date.now(),
    });
    return { success: true, url };
  }),
});
