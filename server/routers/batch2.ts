/**
 * Batch 2 — Competitive Audit Medium-Effort Features
 * Features: Sales Forecasting, Product Catalog, Lead Scoring Rule Builder,
 *           AI Next Best Action per Deal
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { and, eq, gte, lte, desc, sql, inArray } from "drizzle-orm";
import {
  deals, contacts, companies, products, leadScoringRules,
} from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

// ─── Sales Forecasting ────────────────────────────────────────────────────────
const salesForecastingRouter = router({
  // Get forecast summary: expected revenue by stage and probability-weighted total
  getSummary: protectedProcedure.input(z.object({
    pipelineId: z.number().optional(),
    startDate: z.number().optional(), // unix ms
    endDate: z.number().optional(),   // unix ms
  })).query(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const tenantId = ctx.user.tenantCompanyId ?? 0;

    let query = dbConn.select({
      stageId: deals.stageId,
      status: deals.status,
      totalValue: sql<number>`COALESCE(SUM(${deals.value}), 0)`,
      count: sql<number>`COUNT(*)`,
      avgProbability: sql<number>`50`,
    }).from(deals).where(
      and(
        eq(deals.tenantId, tenantId),
        input.startDate ? gte(deals.expectedCloseDate, input.startDate) : undefined,
        input.endDate ? lte(deals.expectedCloseDate, input.endDate) : undefined,
        input.pipelineId ? eq(deals.pipelineId, input.pipelineId) : undefined,
      )
    ).groupBy(deals.stageId, deals.status);

    const rows = await query;

    // Compute weighted forecast
    const weightedTotal = rows.reduce((sum, r) => {
      const prob = (r.avgProbability ?? 50) / 100;
      return sum + (r.totalValue ?? 0) * prob;
    }, 0);

    // Monthly trend: last 6 months of closed-won
    const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;
    const trend = await dbConn.select({
      month: sql<string>`DATE_FORMAT(FROM_UNIXTIME(${deals.closedAt} / 1000), '%Y-%m')`,
      revenue: sql<number>`COALESCE(SUM(${deals.value}), 0)`,
      count: sql<number>`COUNT(*)`,
    }).from(deals).where(
      and(
        eq(deals.tenantId, tenantId),
        eq(deals.status, "won"),
        gte(deals.closedAt, sixMonthsAgo),
      )
    ).groupBy(sql`DATE_FORMAT(FROM_UNIXTIME(${deals.closedAt} / 1000), '%Y-%m')`);

    return { byStage: rows, weightedTotal, trend };
  }),

  // Get deals closing this month
  getClosingThisMonth: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
    return dbConn.select().from(deals).where(
      and(
        eq(deals.tenantId, ctx.user.tenantCompanyId ?? 0),
        gte(deals.expectedCloseDate, startOfMonth),
        lte(deals.expectedCloseDate, endOfMonth),
        sql`${deals.status} NOT IN ('won', 'lost')`,
      )
    ).orderBy(desc(deals.value)).limit(50);
  }),
});

// ─── Product Catalog ──────────────────────────────────────────────────────────
const productCatalogRouter = router({
  list: protectedProcedure.input(z.object({
    limit: z.number().min(1).max(200).default(50),
    offset: z.number().min(0).default(0),
    search: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const rows = await dbConn.select().from(products).where(
      and(
        eq(products.tenantId, tenantId),
        input.search ? sql`${products.name} LIKE ${`%${input.search}%`}` : undefined,
      )
    ).orderBy(desc(products.createdAt)).limit(input.limit).offset(input.offset);
    const [{ total }] = await dbConn.select({ total: sql<number>`COUNT(*)` }).from(products)
      .where(eq(products.tenantId, tenantId));
    return { items: rows, total };
  }),

  create: protectedProcedure.input(z.object({
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    price: z.number().min(0),
    currency: z.string().default("USD"),
    unit: z.string().optional(),
    sku: z.string().optional(),
    category: z.string().optional(),
    isActive: z.boolean().default(true),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const [result] = await dbConn.insert(products).values({
      tenantId: ctx.user.tenantCompanyId ?? 0,
      userId: ctx.user.id,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      currency: input.currency,
      unit: input.unit ?? null,
      sku: input.sku ?? null,
      category: input.category ?? null,
      isActive: input.isActive ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    } as never);
    return { id: (result as { insertId: number }).insertId };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    currency: z.string().optional(),
    unit: z.string().optional(),
    sku: z.string().optional(),
    category: z.string().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { id, ...updates } = input;
    const updateData: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.sku !== undefined) updateData.sku = updates.sku;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive ? 1 : 0;
    await dbConn.update(products).set(updateData as never)
      .where(and(eq(products.id, id), eq(products.tenantId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await dbConn.delete(products)
      .where(and(eq(products.id, input.id), eq(products.tenantId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),
});

// ─── Lead Scoring Rule Builder ────────────────────────────────────────────────
const leadScoringRouter = router({
  getRules: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return dbConn.select().from(leadScoringRules)
      .where(eq(leadScoringRules.tenantId, ctx.user.tenantCompanyId ?? 0))
      .orderBy(desc(leadScoringRules.points));
  }),

  createRule: protectedProcedure.input(z.object({
    name: z.string().min(1).max(200),
    field: z.string().min(1),
    operator: z.enum(["equals", "contains", "greater_than", "less_than", "is_set", "is_not_set"]),
    value: z.string().optional(),
    points: z.number().int().min(-100).max(100),
    entityType: z.enum(["contact", "company", "deal"]).default("contact"),
  })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = Date.now();
    const [result] = await dbConn.insert(leadScoringRules).values({
      tenantId: ctx.user.tenantCompanyId ?? 0,
      userId: ctx.user.id,
      name: input.name,
      field: input.field,
      operator: input.operator,
      value: input.value ?? null,
      points: input.points,
      entityType: input.entityType,
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    } as never);
    return { id: (result as { insertId: number }).insertId };
  }),

  deleteRule: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await dbConn.delete(leadScoringRules)
      .where(and(eq(leadScoringRules.id, input.id), eq(leadScoringRules.tenantId, ctx.user.tenantCompanyId ?? 0)));
    return { success: true };
  }),

  // Compute score for a contact based on active rules
  computeScore: protectedProcedure.input(z.object({ contactId: z.number() })).query(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    const [contact] = await dbConn.select().from(contacts)
      .where(and(eq(contacts.id, input.contactId), eq(contacts.tenantId, tenantId)));
    if (!contact) throw new TRPCError({ code: "NOT_FOUND" });
    const rules = await dbConn.select().from(leadScoringRules)
      .where(and(eq(leadScoringRules.tenantId, tenantId), eq(leadScoringRules.isActive, 1)));

    let score = 0;
    const breakdown: { rule: string; points: number; matched: boolean }[] = [];
    for (const rule of rules) {
      if (rule.entityType !== "contact") continue;
      const fieldValue = (contact as Record<string, unknown>)[rule.field];
      let matched = false;
      switch (rule.operator) {
        case "equals": matched = String(fieldValue) === rule.value; break;
        case "contains": matched = String(fieldValue ?? "").toLowerCase().includes((rule.value ?? "").toLowerCase()); break;
        case "greater_than": matched = Number(fieldValue) > Number(rule.value); break;
        case "less_than": matched = Number(fieldValue) < Number(rule.value); break;
        case "is_set": matched = fieldValue !== null && fieldValue !== undefined && fieldValue !== ""; break;
        case "is_not_set": matched = fieldValue === null || fieldValue === undefined || fieldValue === ""; break;
      }
      if (matched) score += rule.points;
      breakdown.push({ rule: rule.name, points: rule.points, matched });
    }
    return { score, breakdown, grade: score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : score >= 20 ? "D" : "F" };
  }),
});

// ─── AI Next Best Action ──────────────────────────────────────────────────────
const nextBestActionRouter = router({
  getForDeal: protectedProcedure.input(z.object({ dealId: z.number() })).query(async ({ ctx, input }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const tenantId = ctx.user.tenantCompanyId ?? 0;

    const [deal] = await dbConn.select().from(deals)
      .where(and(eq(deals.id, input.dealId), eq(deals.tenantId, tenantId)));
    if (!deal) throw new TRPCError({ code: "NOT_FOUND" });

    let contactInfo = "";
    if (deal.contactId) {
      const [contact] = await dbConn.select({
        firstName: contacts.firstName, lastName: contacts.lastName,
        jobTitle: contacts.jobTitle, email: contacts.email,
      }).from(contacts).where(eq(contacts.id, deal.contactId));
      if (contact) {
        contactInfo = `Contact: ${contact.firstName} ${contact.lastName ?? ""} (${contact.jobTitle ?? "unknown role"}, ${contact.email ?? "no email"})`;
      }
    }

    let companyInfo = "";
    if (deal.companyId) {
      const [company] = await dbConn.select({
        name: companies.name, industry: companies.industry, numberOfEmployees: companies.numberOfEmployees,
      }).from(companies).where(eq(companies.id, deal.companyId));
      if (company) {
        companyInfo = `Company: ${company.name} (${company.industry ?? "unknown industry"}, ${company.numberOfEmployees ?? "unknown"} employees)`;
      }
    }

    const daysSinceUpdate = Math.floor((Date.now() - deal.updatedAt) / (1000 * 60 * 60 * 24));
    const daysUntilClose = deal.expectedCloseDate ? Math.floor((deal.expectedCloseDate - Date.now()) / (1000 * 60 * 60 * 24)) : null;

    const prompt = `You are a sales coach AI. Analyze this deal and provide 3 specific, actionable next steps to advance it.

Deal: "${deal.name}"
Value: $${(deal.value ?? 0).toLocaleString()}
Stage: ${deal.stageId}
Status: ${deal.status}
Probability: 50%
Days since last update: ${daysSinceUpdate}
Days until close date: ${daysUntilClose !== null ? daysUntilClose : "not set"}
${contactInfo}
${companyInfo}
Lost reason (if any): ${deal.lostReason ?? "N/A"}

Respond with exactly 3 next best actions in JSON format:
{
  "actions": [
    { "priority": 1, "action": "...", "reason": "...", "channel": "email|call|meeting|task", "urgency": "high|medium|low" },
    { "priority": 2, "action": "...", "reason": "...", "channel": "email|call|meeting|task", "urgency": "high|medium|low" },
    { "priority": 3, "action": "...", "reason": "...", "channel": "email|call|meeting|task", "urgency": "high|medium|low" }
  ],
  "dealHealthScore": 0-100,
  "riskFlags": ["..."]
}`;

    const response = await invokeLLM({
      messages: [
        { role: "system" as const, content: "You are an expert sales coach. Always respond with valid JSON only." },
        { role: "user" as const, content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "next_best_actions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              actions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    priority: { type: "integer" },
                    action: { type: "string" },
                    reason: { type: "string" },
                    channel: { type: "string" },
                    urgency: { type: "string" },
                  },
                  required: ["priority", "action", "reason", "channel", "urgency"],
                  additionalProperties: false,
                },
              },
              dealHealthScore: { type: "integer" },
              riskFlags: { type: "array", items: { type: "string" } },
            },
            required: ["actions", "dealHealthScore", "riskFlags"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI returned no response" });
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    try {
      return JSON.parse(contentStr) as {
        actions: { priority: number; action: string; reason: string; channel: string; urgency: string }[];
        dealHealthScore: number;
        riskFlags: string[];
      };
    } catch {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI response was not valid JSON" });
    }
  }),
});

// ─── Export all batch2 routers ────────────────────────────────────────────────
export const batch2Router = router({
  salesForecasting: salesForecastingRouter,
  productCatalog: productCatalogRouter,
  leadScoring: leadScoringRouter,
  nextBestAction: nextBestActionRouter,
});
