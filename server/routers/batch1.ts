/**
 * Batch 1 — Competitive Audit Quick Wins
 * Features: Rotten Deals, Bulk Actions, Win/Loss Analysis,
 *           Audit Logs, Smart Views, Territory Management, Account Hierarchy
 */
import { z } from "zod";
import { router, protectedProcedure, companyAdminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { and, eq, lt, ne, inArray, desc, asc, sql, isNull } from "drizzle-orm";
import {
  deals, contacts, companies, auditLogs, smartViews, territories, tasks, activityHistory,
} from "../../drizzle/schema";

// ─── Helper: write an audit log entry ───────────────────────────────────────
export async function writeAuditLog(opts: {
  tenantId: number | null | undefined;
  userId: number;
  userEmail?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: number;
  entityName?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
}) {
  const dbConn = await db.getDb();
  if (!dbConn) return;
  await dbConn.insert(auditLogs).values({
    tenantId: opts.tenantId ?? null,
    userId: opts.userId,
    userEmail: opts.userEmail,
    userName: opts.userName,
    action: opts.action,
    entityType: opts.entityType,
    entityId: opts.entityId,
    entityName: opts.entityName,
    changes: opts.changes ?? null,
    ipAddress: opts.ipAddress,
    createdAt: Date.now(),
  });
}

// ─── Rotten Deals ────────────────────────────────────────────────────────────
const rottenDealsRouter = router({
  // Get all open deals that haven't been updated in > rottenDays
  list: protectedProcedure.input(z.object({
    pipelineId: z.number().optional(),
    thresholdDays: z.number().min(1).max(365).default(14),
  })).query(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const cutoff = Date.now() - input.thresholdDays * 86400000;
    const conditions = [
      eq(deals.tenantId, ctx.user.tenantCompanyId ?? 0),
      eq(deals.status, "open"),
      lt(deals.updatedAt, cutoff),
    ];
    if (input.pipelineId) conditions.push(eq(deals.pipelineId, input.pipelineId));
    const rows = await dbConn.select().from(deals).where(and(...conditions)).orderBy(asc(deals.updatedAt)).limit(200);
    return rows.map(d => ({
      ...d,
      daysSinceUpdate: Math.floor((Date.now() - d.updatedAt) / 86400000),
      isRotten: true,
    }));
  }),

  // Update rotten threshold for a pipeline
  setThreshold: companyAdminProcedure.input(z.object({
    pipelineId: z.number(),
    rottenDays: z.number().min(1).max(365),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { pipelines } = await import("../../drizzle/schema");
    await dbConn.update(pipelines).set({ rottenDays: input.rottenDays } as never)
      .where(and(eq(pipelines.id, input.pipelineId), eq(pipelines.tenantId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),
});

// ─── Bulk Actions ─────────────────────────────────────────────────────────────
const bulkActionsRouter = router({
  // Bulk update contacts
  updateContacts: protectedProcedure.input(z.object({
    ids: z.array(z.number()).min(1).max(500),
    updates: z.object({
      ownerId: z.number().optional(),
      leadStatus: z.string().optional(),
      tags: z.array(z.string()).optional(),
      territoryId: z.number().nullable().optional(),
    }),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const updates: Record<string, unknown> = { updatedAt: now };
    if (input.updates.ownerId !== undefined) updates.ownerId = input.updates.ownerId;
    if (input.updates.leadStatus !== undefined) updates.leadStatus = input.updates.leadStatus;
    if (input.updates.tags !== undefined) updates.tags = input.updates.tags;
    if (input.updates.territoryId !== undefined) updates.territoryId = input.updates.territoryId;
    await dbConn.update(contacts).set(updates as never)
      .where(and(inArray(contacts.id, input.ids), eq(contacts.tenantId, ctx.user.tenantCompanyId ?? 0)));
    await writeAuditLog({ tenantId: ctx.user.tenantCompanyId, userId: ctx.user.id, userEmail: ctx.user.email ?? undefined, userName: ctx.user.name ?? undefined, action: "bulk_update", entityType: "contacts", changes: { count: input.ids.length, updates: input.updates } });
    return { success: true, updated: input.ids.length };
  }),

  // Bulk delete contacts
  deleteContacts: protectedProcedure.input(z.object({
    ids: z.array(z.number()).min(1).max(500),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await dbConn.delete(contacts)
      .where(and(inArray(contacts.id, input.ids), eq(contacts.tenantId, ctx.user.tenantCompanyId ?? 0)));
    await writeAuditLog({ tenantId: ctx.user.tenantCompanyId, userId: ctx.user.id, userEmail: ctx.user.email ?? undefined, userName: ctx.user.name ?? undefined, action: "bulk_delete", entityType: "contacts", changes: { count: input.ids.length } });
    return { success: true, deleted: input.ids.length };
  }),

  // Bulk update deals
  updateDeals: protectedProcedure.input(z.object({
    ids: z.array(z.number()).min(1).max(500),
    updates: z.object({
      ownerId: z.number().optional(),
      stageId: z.number().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      tags: z.array(z.string()).optional(),
    }),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const updates: Record<string, unknown> = { updatedAt: now };
    if (input.updates.stageId !== undefined) updates.stageId = input.updates.stageId;
    if (input.updates.priority !== undefined) updates.priority = input.updates.priority;
    if (input.updates.tags !== undefined) updates.tags = input.updates.tags;
    await dbConn.update(deals).set(updates as never)
      .where(and(inArray(deals.id, input.ids), eq(deals.tenantId, ctx.user.tenantCompanyId ?? 0)));
    await writeAuditLog({ tenantId: ctx.user.tenantCompanyId, userId: ctx.user.id, userEmail: ctx.user.email ?? undefined, userName: ctx.user.name ?? undefined, action: "bulk_update", entityType: "deals", changes: { count: input.ids.length, updates: input.updates } });
    return { updated: input.ids.length };
  }),

  // Bulk delete deals
  deleteDeals: protectedProcedure.input(z.object({
    ids: z.array(z.number()).min(1).max(500),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await dbConn.delete(deals)
      .where(and(inArray(deals.id, input.ids), eq(deals.tenantId, ctx.user.tenantCompanyId ?? 0)));
    await writeAuditLog({ tenantId: ctx.user.tenantCompanyId, userId: ctx.user.id, userEmail: ctx.user.email ?? undefined, userName: ctx.user.name ?? undefined, action: "bulk_delete", entityType: "deals", changes: { count: input.ids.length } });
    return { deleted: input.ids.length };
  }),

  // Bulk update companies
  updateCompanies: protectedProcedure.input(z.object({
    ids: z.array(z.number()).min(1).max(500),
    updates: z.object({
      ownerId: z.number().optional(),
      leadStatus: z.string().optional(),
      tags: z.array(z.string()).optional(),
      territoryId: z.number().nullable().optional(),
    }),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const updates: Record<string, unknown> = { updatedAt: now };
    if (input.updates.ownerId !== undefined) updates.userId = input.updates.ownerId;
    if (input.updates.leadStatus !== undefined) updates.leadStatus = input.updates.leadStatus;
    if (input.updates.tags !== undefined) updates.tags = input.updates.tags;
    if (input.updates.territoryId !== undefined) updates.territoryId = input.updates.territoryId;
    await dbConn.update(companies).set(updates as never)
      .where(and(inArray(companies.id, input.ids), eq(companies.tenantId, ctx.user.tenantCompanyId ?? 0)));
    await writeAuditLog({ tenantId: ctx.user.tenantCompanyId, userId: ctx.user.id, userEmail: ctx.user.email ?? undefined, userName: ctx.user.name ?? undefined, action: "bulk_update", entityType: "companies", changes: { count: input.ids.length, updates: input.updates } });
    return { updated: input.ids.length };
  }),

  // Bulk delete companies
  deleteCompanies: protectedProcedure.input(z.object({
    ids: z.array(z.number()).min(1).max(500),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await dbConn.delete(companies)
      .where(and(inArray(companies.id, input.ids), eq(companies.tenantId, ctx.user.tenantCompanyId ?? 0)));
    await writeAuditLog({ tenantId: ctx.user.tenantCompanyId, userId: ctx.user.id, userEmail: ctx.user.email ?? undefined, userName: ctx.user.name ?? undefined, action: "bulk_delete", entityType: "companies", changes: { count: input.ids.length } });
    return { success: true, deleted: input.ids.length };
  }),

  // Bulk delete tasks
  deleteTasks: protectedProcedure.input(z.object({
    ids: z.array(z.number()).min(1).max(500),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await dbConn.delete(tasks)
      .where(and(inArray(tasks.id, input.ids), eq(tasks.tenantId, ctx.user.tenantCompanyId ?? 0)));
    await writeAuditLog({ tenantId: ctx.user.tenantCompanyId, userId: ctx.user.id, userEmail: ctx.user.email ?? undefined, userName: ctx.user.name ?? undefined, action: "bulk_delete", entityType: "tasks", changes: { count: input.ids.length } });
    return { success: true, deleted: input.ids.length };
  }),

  // Bulk update task status (mark as completed or not_started)
  updateTasksStatus: protectedProcedure.input(z.object({
    ids: z.array(z.number()).min(1).max(500),
    status: z.enum(["not_started", "completed"]),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const updates: Record<string, unknown> = { status: input.status, updatedAt: now };
    if (input.status === "completed") {
      updates.completedAt = now;
      updates.completedBy = ctx.user.name ?? ctx.user.username ?? undefined;
    } else {
      updates.completedAt = null;
      updates.completedBy = null;
    }
    await dbConn.update(tasks).set(updates as never)
      .where(and(inArray(tasks.id, input.ids), eq(tasks.tenantId, ctx.user.tenantCompanyId ?? 0)));
    await writeAuditLog({ tenantId: ctx.user.tenantCompanyId, userId: ctx.user.id, userEmail: ctx.user.email ?? undefined, userName: ctx.user.name ?? undefined, action: "bulk_update", entityType: "tasks", changes: { count: input.ids.length, status: input.status } });
    return { success: true, updated: input.ids.length };
  }),

  // ── Fill Smart Properties (AI-infer missing fields) ──────────────────────
  fillSmartProperties: protectedProcedure.input(z.object({
    ids: z.array(z.number()).min(1).max(200),
    entityType: z.enum(["contacts", "companies"]),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    let filled = 0;
    const hotStatuses = ["Hot", "Qualified", "Customer", "Under Contract", "Paperwork Received"];
    const warmStatuses = ["Warm", "Attempted Contact", "DM Reached/Awaiting Quote", "Currently Quoting/Awaiting Business"];
    if (input.entityType === "contacts") {
      const rows = await dbConn.select().from(contacts)
        .where(and(inArray(contacts.id, input.ids), eq(contacts.tenantId, tenantId)));
      for (const row of rows) {
        const updates: Record<string, unknown> = { updatedAt: now, lastModifiedDate: now };
        if (!(row as any).lifecycleStage && row.leadStatus) {
          if (hotStatuses.includes(row.leadStatus)) updates.lifecycleStage = "opportunity";
          else if (warmStatuses.includes(row.leadStatus)) updates.lifecycleStage = "lead";
          else updates.lifecycleStage = "subscriber";
          filled++;
        }
        await dbConn.update(contacts).set(updates as never)
          .where(and(eq(contacts.id, row.id), eq(contacts.tenantId, tenantId)));
      }
    } else {
      const rows = await dbConn.select().from(companies)
        .where(and(inArray(companies.id, input.ids), eq(companies.tenantId, tenantId)));
      for (const row of rows) {
        const updates: Record<string, unknown> = { updatedAt: now, lastModifiedDate: now };
        if (!(row as any).lifecycleStage && row.leadStatus) {
          if (hotStatuses.includes(row.leadStatus)) updates.lifecycleStage = "customer";
          else if (warmStatuses.includes(row.leadStatus)) updates.lifecycleStage = "lead";
          else updates.lifecycleStage = "prospect";
          filled++;
        }
        await dbConn.update(companies).set(updates as never)
          .where(and(eq(companies.id, row.id), eq(companies.tenantId, tenantId)));
      }
    }
    await writeAuditLog({ tenantId, userId: ctx.user.id, userEmail: ctx.user.email ?? undefined, userName: ctx.user.name ?? undefined, action: "bulk_fill_smart_properties", entityType: input.entityType, changes: { count: input.ids.length, filled } });
    return { processed: input.ids.length, filled };
  }),

  // ── Create Bulk Tasks ────────────────────────────────────────────────────
  createBulkTasks: protectedProcedure.input(z.object({
    ids: z.array(z.number()).min(1).max(200),
    entityType: z.enum(["contacts", "companies"]),
    title: z.string().min(1).max(512),
    taskType: z.enum(["call", "email", "to_do", "follow_up"]).default("follow_up"),
    dueDate: z.number().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const taskRows = input.ids.map(id => ({
      userId: ctx.user.id,
      tenantId,
      title: input.title,
      taskType: input.taskType,
      dueDate: input.dueDate ?? (now + 86400000),
      priority: input.priority,
      description: input.notes ?? null,
      status: "not_started" as const,
      contactId: input.entityType === "contacts" ? id : null,
      companyId: input.entityType === "companies" ? id : null,
      createdAt: now,
      updatedAt: now,
    }));
    await dbConn.insert(tasks).values(taskRows as never);
    await writeAuditLog({ tenantId, userId: ctx.user.id, userEmail: ctx.user.email ?? undefined, userName: ctx.user.name ?? undefined, action: "bulk_create_tasks", entityType: input.entityType, changes: { count: input.ids.length, taskTitle: input.title } });
    return { created: input.ids.length };
  }),

  // ── Track Bulk Activity ──────────────────────────────────────────────────
  trackBulkActivity: protectedProcedure.input(z.object({
    ids: z.array(z.number()).min(1).max(200),
    entityType: z.enum(["contacts", "companies"]),
    activityType: z.enum(["note", "call", "email_sent", "meeting"]).default("note"),
    subject: z.string().min(1).max(512),
    body: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const activityRows = input.ids.map(id => ({
      tenantCompanyId: tenantId,
      activityType: input.activityType,
      objectType: (input.entityType === "contacts" ? "contact" : "company") as "contact" | "company",
      recordId: id,
      userId: ctx.user.id,
      subject: input.subject,
      body: input.body ?? null,
      occurredAt: now,
      createdAt: now,
    }));
    await dbConn.insert(activityHistory).values(activityRows as never);
    if (input.entityType === "contacts") {
      await dbConn.update(contacts).set({ lastActivityDate: now, updatedAt: now } as never)
        .where(and(inArray(contacts.id, input.ids), eq(contacts.tenantId, tenantId)));
    } else {
      await dbConn.update(companies).set({ lastActivityDate: now, updatedAt: now } as never)
        .where(and(inArray(companies.id, input.ids), eq(companies.tenantId, tenantId)));
    }
    await writeAuditLog({ tenantId, userId: ctx.user.id, userEmail: ctx.user.email ?? undefined, userName: ctx.user.name ?? undefined, action: "bulk_track_activity", entityType: input.entityType, changes: { count: input.ids.length, activityType: input.activityType } });
    return { logged: input.ids.length };
  }),
});

// ─── Win/Loss Analysis ────────────────────────────────────────────────────────
const winLossRouter = router({
  // Get win/loss stats
  stats: protectedProcedure.input(z.object({
    startDate: z.number().optional(),
    endDate: z.number().optional(),
    pipelineId: z.number().optional(),
  })).query(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    // Use visible user IDs so axiom_admin / developer see all deals
    const visibleIds = await db.getVisibleUserIds(ctx.user);
    const conditions = [
      inArray(deals.userId, visibleIds),
      ne(deals.status, "open"),
    ];
    if (input.startDate) conditions.push(sql`${deals.closedAt} >= ${input.startDate}` as never);
    if (input.endDate) conditions.push(sql`${deals.closedAt} <= ${input.endDate}` as never);
    if (input.pipelineId) conditions.push(eq(deals.pipelineId, input.pipelineId));
    const rows = await dbConn.select().from(deals).where(and(...conditions)).orderBy(desc(deals.closedAt)).limit(1000);
    const won = rows.filter(d => d.status === "won");
    const lost = rows.filter(d => d.status === "lost");
    const wonValue = won.reduce((s, d) => s + (d.value ?? 0), 0);
    const lostValue = lost.reduce((s, d) => s + (d.value ?? 0), 0);
    // Reason breakdown
    const lostReasons: Record<string, number> = {};
    const wonReasons: Record<string, number> = {};
    for (const d of lost) {
      const r = d.lostReason || "No reason given";
      lostReasons[r] = (lostReasons[r] ?? 0) + 1;
    }
    for (const d of won) {
      const r = (d as never as { wonReason?: string }).wonReason || "No reason given";
      wonReasons[r] = (wonReasons[r] ?? 0) + 1;
    }
    return {
      totalWon: won.length,
      totalLost: lost.length,
      winRate: rows.length > 0 ? Math.round((won.length / rows.length) * 100) : 0,
      wonValue,
      lostValue,
      avgDealSize: won.length > 0 ? Math.round(wonValue / won.length) : 0,
      lostReasons: Object.entries(lostReasons).sort((a, b) => b[1] - a[1]).slice(0, 10),
      wonReasons: Object.entries(wonReasons).sort((a, b) => b[1] - a[1]).slice(0, 10),
      recentDeals: rows.slice(0, 20),
    };
  }),

  // Update deal close reason
  updateCloseReason: protectedProcedure.input(z.object({
    dealId: z.number(),
    status: z.enum(["won", "lost"]),
    reason: z.string().max(512),
    closeNote: z.string().max(2048).optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const updates: Record<string, unknown> = {
      status: input.status,
      closedAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (input.status === "lost") updates.lostReason = input.reason;
    else updates.wonReason = input.reason;
    if (input.closeNote) updates.closeNote = input.closeNote;
    await dbConn.update(deals).set(updates as never)
      .where(and(eq(deals.id, input.dealId), eq(deals.tenantId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────
const auditLogsRouter = router({
  list: companyAdminProcedure.input(z.object({
    entityType: z.string().optional(),
    action: z.string().optional(),
    userId: z.number().optional(),
    startDate: z.number().optional(),
    endDate: z.number().optional(),
    limit: z.number().min(1).max(500).default(100),
    offset: z.number().default(0),
  })).query(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const conditions = [eq(auditLogs.tenantId, ctx.user.tenantCompanyId ?? 0)];
    if (input.entityType) conditions.push(eq(auditLogs.entityType, input.entityType));
    if (input.action) conditions.push(eq(auditLogs.action, input.action));
    if (input.userId) conditions.push(eq(auditLogs.userId, input.userId));
    if (input.startDate) conditions.push(sql`${auditLogs.createdAt} >= ${input.startDate}` as never);
    if (input.endDate) conditions.push(sql`${auditLogs.createdAt} <= ${input.endDate}` as never);
    const rows = await dbConn.select().from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(input.limit)
      .offset(input.offset);
const countResult = await dbConn.select({ count: sql<number>`count(*)` }).from(auditLogs).where(and(...conditions));
    const total = Number(countResult[0]?.count ?? 0);
    return { logs: rows, total };}),
});

// ─── Smart Views ──────────────────────────────────────────────────────────────
const smartViewsRouter = router({
  list: protectedProcedure.input(z.object({
    entityType: z.string(),
  })).query(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await dbConn.select().from(smartViews)
      .where(and(
        eq(smartViews.tenantId, ctx.user.tenantCompanyId ?? 0),
        eq(smartViews.entityType, input.entityType),
      ))
      .orderBy(asc(smartViews.name));
    return rows;
  }),

  create: protectedProcedure.input(z.object({
    name: z.string().min(1).max(256),
    entityType: z.string(),
    filters: z.record(z.string(), z.unknown()),
    isShared: z.boolean().default(false),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const [result] = await dbConn.insert(smartViews).values({
      tenantId: ctx.user.tenantCompanyId ?? null,
      userId: ctx.user.id,
      name: input.name,
      entityType: input.entityType,
      filters: input.filters,
      isShared: input.isShared ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    });
    return { id: (result as { insertId: number }).insertId, ...input };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).max(256).optional(),
    filters: z.record(z.string(), z.unknown()).optional(),
    isShared: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (input.name !== undefined) updates.name = input.name;
    if (input.filters !== undefined) updates.filters = input.filters;
    if (input.isShared !== undefined) updates.isShared = input.isShared ? 1 : 0;
    await dbConn.update(smartViews).set(updates as never)
      .where(and(eq(smartViews.id, input.id), eq(smartViews.userId, ctx.user.id)));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await dbConn.delete(smartViews)
      .where(and(eq(smartViews.id, input.id), eq(smartViews.userId, ctx.user.id)));
    return { success: true };
  }),
});

// ─── Territory Management ─────────────────────────────────────────────────────
const territoriesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return dbConn.select().from(territories)
      .where(eq(territories.tenantId, ctx.user.tenantCompanyId ?? 0))
      .orderBy(asc(territories.name));
  }),

  create: companyAdminProcedure.input(z.object({
    name: z.string().min(1).max(256),
    description: z.string().optional(),
    assignedUserIds: z.array(z.number()).default([]),
    rules: z.record(z.string(), z.unknown()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const [result] = await dbConn.insert(territories).values({
      tenantId: ctx.user.tenantCompanyId ?? null,
      name: input.name,
      description: input.description,
      assignedUserIds: input.assignedUserIds,
      rules: input.rules ?? null,
      createdAt: now,
      updatedAt: now,
    });
    return { id: (result as { insertId: number }).insertId };
  }),

  update: companyAdminProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).max(256).optional(),
    description: z.string().optional(),
    assignedUserIds: z.array(z.number()).optional(),
    rules: z.record(z.string(), z.unknown()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.assignedUserIds !== undefined) updates.assignedUserIds = input.assignedUserIds;
    if (input.rules !== undefined) updates.rules = input.rules;
    await dbConn.update(territories).set(updates as never)
      .where(and(eq(territories.id, input.id), eq(territories.tenantId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),

  delete: companyAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await dbConn.delete(territories)
      .where(and(eq(territories.id, input.id), eq(territories.tenantId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),
});

// ─── Account Hierarchy ────────────────────────────────────────────────────────
const accountHierarchyRouter = router({
  // Get root companies (no parent)
  getRoots: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return dbConn.select().from(companies)
      .where(and(isNull(companies.parentId), eq(companies.tenantId, ctx.user.tenantCompanyId ?? 0))).limit(200);
  }),

  // Get child companies of a parent
  getChildren: protectedProcedure.input(z.object({ parentId: z.number() })).query(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return dbConn.select().from(companies)
      .where(and(eq(companies.parentId, input.parentId), eq(companies.tenantId, ctx.user.tenantCompanyId ?? 0))).limit(500);
  }),

  // Set parent company
  setParent: protectedProcedure.input(z.object({
    companyId: z.number(),
    parentId: z.number().nullable(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    // Prevent circular references
    if (input.parentId === input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "A company cannot be its own parent" });
    await dbConn.update(companies).set({ parentId: input.parentId, updatedAt: Date.now() } as never)
      .where(and(eq(companies.id, input.companyId), eq(companies.tenantId, ctx.user.tenantCompanyId ?? 0)));
    await writeAuditLog({ tenantId: ctx.user.tenantCompanyId, userId: ctx.user.id, userEmail: ctx.user.email ?? undefined, userName: ctx.user.name ?? undefined, action: "set_parent", entityType: "company", entityId: input.companyId, changes: { parentId: input.parentId } });
    return { success: true };
  }),

  // Get full hierarchy tree for a company
  getTree: protectedProcedure.input(z.object({ companyId: z.number() })).query(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    // Get all companies for this tenant and build tree client-side
    const allCompanies = await dbConn.select({ id: companies.id, name: companies.name, parentId: companies.parentId })
      .from(companies).where(eq(companies.tenantId, ctx.user.tenantCompanyId ?? 0));
    return allCompanies;
  }),
});

// ─── Export all batch1 routers ────────────────────────────────────────────────
export const batch1Router = router({
  rottenDeals: rottenDealsRouter,
  bulkActions: bulkActionsRouter,
  winLoss: winLossRouter,
  auditLogs: auditLogsRouter,
  smartViews: smartViewsRouter,
  territories: territoriesRouter,
  accountHierarchy: accountHierarchyRouter,
});

// Export individual sub-routers for flat registration in appRouter
export { rottenDealsRouter, bulkActionsRouter, winLossRouter, auditLogsRouter, smartViewsRouter, territoriesRouter, accountHierarchyRouter };
