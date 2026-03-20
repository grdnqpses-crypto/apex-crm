/**
 * System Health Router — tRPC procedures for the Self-Healing Dashboard
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { runHealthCheck, runPredictiveAnalysis, getRecentHealthEvents, getHealthHistory } from "../self-healing";
import { getDb } from "../db";
import { systemHealthEvents } from "../../drizzle/schema";
import { desc, gte, eq, and, sql } from "drizzle-orm";

// Only realm_owner and developer can access the health dashboard
const adminHealthProcedure = protectedProcedure.use(({ ctx, next }) => {
  const allowed = ["developer", "realm_owner"];
  if (!allowed.includes(ctx.user.systemRole)) {
    throw new Error("FORBIDDEN: Health dashboard is restricted to platform administrators");
  }
  return next({ ctx });
});

export const systemHealthRouter = router({
  // Run a full health check right now
  runCheck: adminHealthProcedure.mutation(async () => {
    return await runHealthCheck();
  }),

  // Get the latest health report (most recent snapshot)
  getLatest: adminHealthProcedure.query(async () => {
    return await runHealthCheck();
  }),

  // Get health history for the last N hours
  getHistory: adminHealthProcedure
    .input(z.object({ hours: z.number().min(1).max(168).default(24) }))
    .query(async ({ input }) => {
      return await getHealthHistory(input.hours);
    }),

  // Get recent error/correction events
  getEvents: adminHealthProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }))
    .query(async ({ input }) => {
      return await getRecentHealthEvents(input.limit);
    }),

  // Get AI predictive analysis
  getPrediction: adminHealthProcedure.query(async () => {
    return await runPredictiveAnalysis();
  }),

  // Get error frequency breakdown by subsystem
  getErrorStats: adminHealthProcedure
    .input(z.object({ hours: z.number().min(1).max(168).default(24) }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return [];
        const since = Date.now() - input.hours * 60 * 60 * 1000;
        const rows = await db
          .select({
            subsystem: systemHealthEvents.subsystem,
            count: sql<number>`COUNT(*)`,
            autoFixed: sql<number>`SUM(CASE WHEN autoCorrectSuccess = 1 THEN 1 ELSE 0 END)`,
          })
          .from(systemHealthEvents)
          .where(and(
            eq(systemHealthEvents.eventType, "error"),
            gte(systemHealthEvents.createdAt, since)
          ))
          .groupBy(systemHealthEvents.subsystem)
          .orderBy(desc(sql`COUNT(*)`));
        return rows;
      } catch {
        return [];
      }
    }),

  // Dismiss/acknowledge an event
  acknowledgeEvent: adminHealthProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return false;
        await db
          .update(systemHealthEvents)
          .set({ details: sql`JSON_SET(COALESCE(details, '{}'), '$.acknowledged', true)` } as any)
          .where(eq(systemHealthEvents.id, input.id));
        return true;
      } catch {
        return false;
      }
    }),
});
