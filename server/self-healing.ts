/**
 * REALM CRM — Self-Healing Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Continuously monitors system health, auto-corrects known failure patterns,
 * predicts failures before they happen, and escalates when self-correction fails.
 *
 * Layers:
 *  1. Error Interception   — captures every server error with full context
 *  2. Auto-Correction      — applies known fixes silently
 *  3. Predictive Detection — AI trend analysis on error frequency
 *  4. Escalation           — notifies owner when auto-correction fails 3×
 */

import type { Express, Request, Response, NextFunction } from "express";
import { getDb } from "./db";
import { systemHealthLogs, systemHealthEvents } from "../drizzle/schema";
import { desc, gte, eq, and, sql } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HealthStatus = "healthy" | "degraded" | "critical" | "unknown";

export interface SubsystemHealth {
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
  lastChecked: number;
}

export interface HealthReport {
  overall: HealthStatus;
  score: number; // 0-100
  subsystems: SubsystemHealth[];
  checkedAt: number;
}

// ─── Auto-Correction Rules ────────────────────────────────────────────────────

interface CorrectionRule {
  pattern: RegExp | string;
  description: string;
  fix: (error: Error, context?: Record<string, unknown>) => Promise<boolean>;
  maxRetries: number;
}

const CORRECTION_RULES: CorrectionRule[] = [
  {
    pattern: /ECONNREFUSED|ETIMEDOUT|connection.*refused/i,
    description: "Database connection refused — attempting reconnect",
    fix: async () => {
      try {
        const db = await getDb();
        if (!db) return false;
        await db.execute(sql`SELECT 1`);
        return true;
      } catch {
        return false;
      }
    },
    maxRetries: 3,
  },
  {
    pattern: /too many connections|ER_CON_COUNT_ERROR/i,
    description: "Too many DB connections — waiting for pool to recover",
    fix: async () => {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const db = await getDb();
        if (!db) return false;
        await db.execute(sql`SELECT 1`);
        return true;
      } catch {
        return false;
      }
    },
    maxRetries: 2,
  },
  {
    pattern: /heap out of memory|JavaScript heap/i,
    description: "Memory pressure detected — clearing caches",
    fix: async () => {
      if (global.gc) global.gc();
      return true;
    },
    maxRetries: 1,
  },
];

// ─── Error Interception Middleware ────────────────────────────────────────────

export function registerErrorInterceptor(app: Express) {
  // Catch all unhandled errors
  app.use(async (err: Error, req: Request, res: Response, _next: NextFunction) => {
    const context = {
      method: req.method,
      path: req.path,
      userId: (req as any).user?.id,
      tenantId: (req as any).user?.tenantCompanyId,
      userAgent: req.headers["user-agent"],
    };

    // Log the error
    await logError(err, context).catch(() => {});

    // Attempt auto-correction
    await attemptAutoCorrection(err, context).catch(() => {});

    // Send response if not already sent
    if (!res.headersSent) {
      res.status(500).json({
        error: "An unexpected error occurred. Our system is self-correcting.",
        code: "INTERNAL_ERROR",
      });
    }
  });

  // Catch unhandled promise rejections
  process.on("unhandledRejection", async (reason: unknown) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    await logError(err, { source: "unhandledRejection" }).catch(() => {});
    await attemptAutoCorrection(err, { source: "unhandledRejection" }).catch(() => {});
  });

  // Catch uncaught exceptions (log but don't crash)
  process.on("uncaughtException", async (err: Error) => {
    console.error("[SelfHeal] Uncaught exception:", err.message);
    await logError(err, { source: "uncaughtException" }).catch(() => {});
    await attemptAutoCorrection(err, { source: "uncaughtException" }).catch(() => {});
  });
}

// ─── Error Logger ─────────────────────────────────────────────────────────────

async function logError(err: Error, context: Record<string, unknown> = {}) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(systemHealthEvents).values({
      eventType: "error",
      severity: "error",
      subsystem: detectSubsystem(err),
      message: err.message,
      details: JSON.stringify({
        stack: err.stack?.split("\n").slice(0, 8).join("\n"),
        context,
      }),
      autoCorrectAttempted: false,
      autoCorrectSuccess: null,
      createdAt: Date.now(),
    } as any);
  } catch {
    // Don't let the logger crash the app
  }
}

// ─── Auto-Correction Engine ───────────────────────────────────────────────────

const correctionAttempts = new Map<string, number>();

async function attemptAutoCorrection(err: Error, context: Record<string, unknown> = {}) {
  const rule = CORRECTION_RULES.find(r => {
    if (r.pattern instanceof RegExp) return r.pattern.test(err.message);
    return err.message.includes(r.pattern);
  });

  if (!rule) return;

  const key = `${rule.description}:${err.message.slice(0, 50)}`;
  const attempts = correctionAttempts.get(key) || 0;

  if (attempts >= rule.maxRetries) {
    // Escalate to owner
    await escalateToOwner(err, rule.description, attempts);
    return;
  }

  correctionAttempts.set(key, attempts + 1);

  console.log(`[SelfHeal] Attempting auto-correction: ${rule.description} (attempt ${attempts + 1}/${rule.maxRetries})`);

  const success = await rule.fix(err, context).catch(() => false);

  // Log the correction attempt
  try {
    const db = await getDb();
    if (db) {
      await db.insert(systemHealthEvents).values({
        eventType: "auto_correction",
        severity: success ? "info" : "warning",
        subsystem: detectSubsystem(err),
        message: rule.description,
        details: JSON.stringify({ success, attempts: attempts + 1, errorMessage: err.message }),
        autoCorrectAttempted: true,
        autoCorrectSuccess: success,
        createdAt: Date.now(),
      } as any);
    }
  } catch {}

  if (success) {
    console.log(`[SelfHeal] ✅ Auto-correction succeeded: ${rule.description}`);
    correctionAttempts.delete(key);
  } else {
    console.warn(`[SelfHeal] ⚠️ Auto-correction failed: ${rule.description}`);
  }
}

async function escalateToOwner(err: Error, ruleDescription: string, attempts: number) {
  console.error(`[SelfHeal] 🚨 Escalating to owner after ${attempts} failed corrections: ${ruleDescription}`);
  try {
    await notifyOwner({
      title: `🚨 REALM CRM Self-Healing Alert`,
      content: `**Auto-correction failed after ${attempts} attempts.**\n\n**Issue:** ${ruleDescription}\n**Error:** ${err.message}\n\n**Action required:** Please review the System Health Dashboard at /dev/system-health for details.`,
    });
  } catch {}
}

// ─── Health Monitor Daemon ────────────────────────────────────────────────────

let healthMonitorInterval: ReturnType<typeof setInterval> | null = null;

export function startHealthMonitor() {
  if (healthMonitorInterval) return;

  // Run immediately on startup, then every 5 minutes
  runHealthCheck().catch(() => {});
  healthMonitorInterval = setInterval(() => {
    runHealthCheck().catch(() => {});
  }, 5 * 60 * 1000);

  console.log("[SelfHeal] Health monitor started — checking every 5 minutes");
}

export function stopHealthMonitor() {
  if (healthMonitorInterval) {
    clearInterval(healthMonitorInterval);
    healthMonitorInterval = null;
  }
}

export async function runHealthCheck(): Promise<HealthReport> {
  const checks: Promise<SubsystemHealth>[] = [
    checkDatabase(),
    checkMemory(),
    checkDiskSpace(),
  ];

  const subsystems = await Promise.allSettled(checks).then(results =>
    results.map(r => r.status === "fulfilled" ? r.value : {
      name: "unknown",
      status: "unknown" as HealthStatus,
      message: "Check failed",
      lastChecked: Date.now(),
    })
  );

  // Calculate overall score
  const scores: Record<HealthStatus, number> = { healthy: 100, degraded: 50, critical: 0, unknown: 30 };
  const score = Math.round(subsystems.reduce((sum, s) => sum + scores[s.status], 0) / subsystems.length);
  const overall: HealthStatus = score >= 80 ? "healthy" : score >= 40 ? "degraded" : "critical";

  const report: HealthReport = {
    overall,
    score,
    subsystems,
    checkedAt: Date.now(),
  };

  // Log to DB
  try {
    const db = await getDb();
    if (db) {
      await db.insert(systemHealthLogs).values({
        overallStatus: overall,
        healthScore: score,
        subsystemData: JSON.stringify(subsystems),
        createdAt: Date.now(),
      } as any);
    }
  } catch {}

  // Alert if critical
  if (overall === "critical") {
    const criticalSystems = subsystems.filter(s => s.status === "critical").map(s => s.name).join(", ");
    await notifyOwner({
      title: "🚨 REALM CRM Critical Health Alert",
      content: `System health is CRITICAL (score: ${score}/100).\n\nAffected subsystems: ${criticalSystems}\n\nCheck /dev/system-health for details.`,
    }).catch(() => {});
  }

  return report;
}

// ─── Individual Health Checks ─────────────────────────────────────────────────

async function checkDatabase(): Promise<SubsystemHealth> {
  const start = Date.now();
  try {
    const db = await getDb();
    if (!db) throw new Error('DB not available');
    await db.execute(sql`SELECT 1`);
    const latencyMs = Date.now() - start;
    return {
      name: "Database",
      status: latencyMs > 2000 ? "degraded" : "healthy",
      latencyMs,
      message: latencyMs > 2000 ? `Slow query: ${latencyMs}ms` : "Connected",
      lastChecked: Date.now(),
    };
  } catch (err: any) {
    return {
      name: "Database",
      status: "critical",
      message: err.message,
      lastChecked: Date.now(),
    };
  }
}

async function checkMemory(): Promise<SubsystemHealth> {
  const mem = process.memoryUsage();
  const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
  const usagePercent = Math.round((mem.heapUsed / mem.heapTotal) * 100);

  return {
    name: "Memory",
    status: usagePercent > 90 ? "critical" : usagePercent > 75 ? "degraded" : "healthy",
    message: `${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent}%)`,
    lastChecked: Date.now(),
  };
}

async function checkDiskSpace(): Promise<SubsystemHealth> {
  // Simple check — if we can write a temp file, disk is accessible
  try {
    const { execSync } = await import("child_process");
    const output = execSync("df -h / 2>/dev/null | tail -1 | awk '{print $5}'").toString().trim();
    const usagePercent = parseInt(output.replace("%", ""), 10);
    return {
      name: "Disk",
      status: usagePercent > 90 ? "critical" : usagePercent > 75 ? "degraded" : "healthy",
      message: `${usagePercent}% used`,
      lastChecked: Date.now(),
    };
  } catch {
    return { name: "Disk", status: "unknown", message: "Could not check", lastChecked: Date.now() };
  }
}

// ─── Predictive Analysis ──────────────────────────────────────────────────────

export async function runPredictiveAnalysis(): Promise<string | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentErrors = await db
      .select()
      .from(systemHealthEvents)
      .where(and(
        eq(systemHealthEvents.eventType, "error"),
        gte(systemHealthEvents.createdAt, oneHourAgo)
      ))
      .orderBy(desc(systemHealthEvents.createdAt))
      .limit(50);

    if (recentErrors.length < 5) return null;

    const errorSummary = recentErrors
      .map(e => `[${e.subsystem}] ${e.message}`)
      .join("\n");

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a system reliability engineer. Analyze error patterns and predict potential failures. Be concise — max 3 sentences.",
        },
        {
          role: "user",
          content: `Recent errors in the last hour (${recentErrors.length} total):\n${errorSummary}\n\nWhat failure is likely coming and what should be done?`,
        },
      ],
    });

    return (response.choices?.[0]?.message?.content as string) || null;
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectSubsystem(err: Error): string {
  const msg = err.message.toLowerCase();
  if (msg.includes("database") || msg.includes("mysql") || msg.includes("sql") || msg.includes("connection")) return "database";
  if (msg.includes("smtp") || msg.includes("email") || msg.includes("mail")) return "email";
  if (msg.includes("s3") || msg.includes("storage") || msg.includes("upload")) return "storage";
  if (msg.includes("stripe") || msg.includes("payment")) return "payments";
  if (msg.includes("llm") || msg.includes("openai") || msg.includes("ai")) return "ai";
  if (msg.includes("memory") || msg.includes("heap")) return "memory";
  return "server";
}

// ─── Get recent health events for the dashboard ───────────────────────────────

export async function getRecentHealthEvents(limit = 50) {
  try {
    const db = await getDb();
    if (!db) return [];
    return await db
      .select()
      .from(systemHealthEvents)
      .orderBy(desc(systemHealthEvents.createdAt))
      .limit(limit);
  } catch {
    return [];
  }
}

export async function getHealthHistory(hours = 24) {
  try {
    const db = await getDb();
    if (!db) return [];
    const since = Date.now() - hours * 60 * 60 * 1000;
    return await db
      .select()
      .from(systemHealthLogs)
      .where(gte(systemHealthLogs.createdAt, since))
      .orderBy(desc(systemHealthLogs.createdAt))
      .limit(288); // 5-min intervals × 24h
  } catch {
    return [];
  }
}
