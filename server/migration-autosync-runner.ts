/**
 * Migration Auto-Sync Runner
 * Checks migration_auto_sync configs every 15 minutes and triggers incremental syncs
 * when nextRunAt has passed and the config is enabled.
 */

import { getDb } from "./db";
import { migrationAutoSync, migrationJobs } from "../drizzle/schema";
import { eq, and, lte, desc } from "drizzle-orm";

let runnerInterval: ReturnType<typeof setInterval> | null = null;

const FREQUENCY_MS: Record<string, number> = {
  hourly: 3_600_000,
  daily: 86_400_000,
  weekly: 604_800_000,
};

export async function runAutoSyncCheck() {
  const db = await getDb();
  if (!db) return;

  const now = Date.now();

  // Find all enabled configs whose nextRunAt is in the past
  const due = await db.select().from(migrationAutoSync)
    .where(and(
      eq(migrationAutoSync.enabled, true),
      lte(migrationAutoSync.nextRunAt, now),
    ));

  for (const cfg of due) {
    try {
      // Find the most recent completed job for this company + platform to get lastSyncedAt
      const [lastJob] = await db.select({
        lastSyncedAt: migrationJobs.lastSyncedAt,
        completedAt: migrationJobs.completedAt,
      })
        .from(migrationJobs)
        .where(and(
          eq(migrationJobs.companyId, cfg.companyId),
          eq(migrationJobs.sourcePlatform, cfg.sourcePlatform),
          eq(migrationJobs.status, "completed"),
        ))
        .orderBy(desc(migrationJobs.createdAt))
        .limit(1);

      const sinceDate = lastJob?.lastSyncedAt || lastJob?.completedAt || null;

      // Create a new migration job for the incremental sync
      // Note: we don't have the API key stored (by design — security). We create a "scheduled"
      // job that will be picked up by the admin the next time they visit the Migration page.
      // The job is created in "pending_credentials" status so the admin knows to re-enter their key.
      await db.insert(migrationJobs).values({
        userId: cfg.userId,
        companyId: cfg.companyId,
        sourcePlatform: cfg.sourcePlatform,
        status: "pending_credentials",
        isIncrementalSync: true,
        sinceDate: sinceDate ?? undefined,
        totalRecords: 0,
        importedRecords: 0,
        failedRecords: 0,
        skippedRecords: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Update nextRunAt for this config
      const freq = cfg.frequency || "daily";
      const nextRunAt = now + (FREQUENCY_MS[freq] || FREQUENCY_MS.daily);
      await db.update(migrationAutoSync)
        .set({ lastRunAt: now, nextRunAt, updatedAt: now })
        .where(eq(migrationAutoSync.id, cfg.id));

      console.log(`[AutoSync] Scheduled incremental sync for company ${cfg.companyId} / ${cfg.sourcePlatform} (${freq})`);
    } catch (err: any) {
      console.error(`[AutoSync] Failed to schedule sync for config ${cfg.id}:`, err.message);
    }
  }
}

export function startAutoSyncRunner() {
  if (runnerInterval) return;
  // Check every 15 minutes
  runnerInterval = setInterval(runAutoSyncCheck, 15 * 60 * 1000);
  // Also run once on startup (after a short delay)
  setTimeout(runAutoSyncCheck, 30_000);
  console.log("[AutoSync] Runner started — checking every 15 minutes");
}

export function stopAutoSyncRunner() {
  if (runnerInterval) {
    clearInterval(runnerInterval);
    runnerInterval = null;
  }
}
