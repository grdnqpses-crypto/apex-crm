/**
 * Migration Auto-Sync Runner
 * Checks migration_auto_sync configs every 15 minutes and triggers incremental syncs
 * when nextRunAt has passed and the config is enabled.
 */

import { getDb, createSmartNotification } from "./db";
import { migrationAutoSync, migrationJobs } from "../drizzle/schema";
import { eq, and, lte, desc } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { decryptCredentials } from "./credential-vault";

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

      // Decrypt stored credentials if available
      const storedCreds = cfg.encryptedCredentials
        ? decryptCredentials(cfg.encryptedCredentials)
        : null;
      const hasStoredCreds = !!storedCreds?.apiKey;

      // If we have stored credentials, run the sync automatically (status: pending → will be picked up by migration engine)
      // If not, create a job in pending_credentials status so the admin knows to re-enter their key
      const jobStatus = hasStoredCreds ? "pending" : "pending_credentials";

      await db.insert(migrationJobs).values({
        userId: cfg.userId,
        companyId: cfg.companyId,
        sourcePlatform: cfg.sourcePlatform,
        // Store encrypted credentials in the job so the engine can use them
        sourceCredentials: hasStoredCreds ? cfg.encryptedCredentials : null,
        status: jobStatus,
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

      // Notify the admin who set up the sync
      const nextRunFormatted = new Date(nextRunAt).toLocaleString();
      const platformLabel = cfg.sourcePlatform.charAt(0).toUpperCase() + cfg.sourcePlatform.slice(1);

      // In-app smart notification
      await createSmartNotification(cfg.userId, {
        type: "migration_sync_queued",
        title: `${platformLabel} Sync Ready`,
        message: `An incremental sync from ${platformLabel} has been queued. Open the Migration Wizard to complete it by entering your API credentials.`,
        urgencyScore: 60,
        actionUrl: `/migration/wizard?sync=${cfg.sourcePlatform}&sinceDate=${sinceDate || ""}`,
        actionLabel: "Open Wizard",
        isRead: false,
        isDismissed: false,
      }).catch(() => {});

      // Owner push notification
      await notifyOwner({
        title: `[Auto-Sync Queued] ${platformLabel}`,
        content: `A scheduled incremental sync from ${platformLabel} is ready for company #${cfg.companyId}. The admin needs to open the Migration Wizard to enter credentials and complete the sync.\n\nNext scheduled run: ${nextRunFormatted}`,
      }).catch(() => {}); // Non-blocking
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
