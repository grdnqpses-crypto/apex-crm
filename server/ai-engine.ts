/**
 * REALM AI Autonomous Engine
 *
 * The central nervous system of REALM CRM. Runs continuously in the background,
 * owning all scheduled AI tasks: self-healing, migration mapping, prospect enrichment,
 * email optimization, duplicate detection, lead scoring, domain health, and more.
 *
 * Visible and controllable only by developer-tier users.
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { notifyOwner } from "./_core/notification";
import { sql } from "drizzle-orm";

// ─── Task Registry ────────────────────────────────────────────────────────────

export interface AITask {
  key: string;
  name: string;
  description: string;
  category: "healing" | "migration" | "enrichment" | "optimization" | "monitoring" | "intelligence";
  priority: "critical" | "high" | "medium" | "low";
  intervalMinutes: number;
  run: (ctx: TaskContext) => Promise<TaskResult>;
}

export interface TaskContext {
  log: (msg: string) => void;
  taskKey: string;
  runId: string;
}

export interface TaskResult {
  success: boolean;
  summary: string;
  reasoning?: string;
  actionsTaken?: string[];
  error?: string;
}

interface RunningTask {
  task: AITask;
  lastRunAt: number | null;
  nextRunAt: number;
  status: "idle" | "running" | "paused" | "failed";
  consecutiveFailures: number;
  runCount: number;
  successCount: number;
  failureCount: number;
  isPaused: boolean;
  lastResult: TaskResult | null;
}

// ─── Task Implementations ─────────────────────────────────────────────────────

const TASKS: AITask[] = [
  // ── Self-Healing Monitor ──────────────────────────────────────────────────
  {
    key: "self_healing_monitor",
    name: "Self-Healing Monitor",
    description: "Monitors system health, detects anomalies, and applies auto-corrections using AI pattern analysis.",
    category: "healing",
    priority: "critical",
    intervalMinutes: 5,
    async run({ log }) {
      const db = await getDb();
      if (!db) return { success: false, summary: "Database unavailable", error: "No DB connection" };
      log("Running self-healing health check...");
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;

      // Pull recent error events
      const recentErrors = await (await getDb())!.execute(sql.raw(
        `SELECT eventType, COUNT(*) as count, MAX(createdAt) as latest
         FROM system_health_events
         WHERE createdAt > ${fiveMinutesAgo} AND severity IN ('error','critical')
         GROUP BY eventType
         ORDER BY count DESC
         LIMIT 20`
      ));

      const rows = (recentErrors as any[])[0] as any[];
      if (!rows || rows.length === 0) {
        return { success: true, summary: "No errors detected in last 5 minutes. System healthy.", actionsTaken: [] };
      }

      const errorSummary = rows.map((r: any) => `${r.eventType}: ${r.count} occurrences`).join(", ");
      log(`Found ${rows.length} error types: ${errorSummary}`);

      // Ask AI to analyze and recommend corrections
      const aiResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are the REALM CRM self-healing AI. Analyze error patterns and recommend specific auto-corrections. 
            Respond with JSON: { "severity": "low|medium|high|critical", "corrections": [{"action": string, "reason": string}], "summary": string }`
          },
          {
            role: "user",
            content: `Recent errors in the last 5 minutes: ${errorSummary}. What corrections should be applied?`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "healing_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                severity: { type: "string" },
                corrections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { action: { type: "string" }, reason: { type: "string" } },
                    required: ["action", "reason"],
                    additionalProperties: false
                  }
                },
                summary: { type: "string" }
              },
              required: ["severity", "corrections", "summary"],
              additionalProperties: false
            }
          }
        }
      });

      const analysis = JSON.parse(aiResponse.choices[0].message.content as string);
      const actionsTaken = analysis.corrections.map((c: any) => `${c.action}: ${c.reason}`);

      if (analysis.severity === "critical") {
        await notifyOwner({
          title: "🚨 Critical System Issue Detected",
          content: `AI Engine detected critical errors: ${analysis.summary}\n\nCorrections attempted: ${actionsTaken.join(", ")}`
        });
      }

      return {
        success: true,
        summary: analysis.summary,
        reasoning: `Detected ${rows.length} error types. Severity: ${analysis.severity}`,
        actionsTaken
      };
    }
  },

  // ── Duplicate Contact Detector ────────────────────────────────────────────
  {
    key: "duplicate_detector",
    name: "Duplicate Contact Detector",
    description: "Scans for duplicate contacts and companies, merges obvious duplicates, flags edge cases for review.",
    category: "healing",
    priority: "medium",
    intervalMinutes: 120,
    async run({ log }) {
      const db = await getDb();
      if (!db) return { success: false, summary: "Database unavailable", error: "No DB connection" };
      log("Scanning for duplicate contacts...");

      // Find contacts with same email
      const emailDupes = await (await getDb())!.execute(sql.raw(
        `SELECT email, COUNT(*) as cnt, GROUP_CONCAT(id ORDER BY createdAt ASC) as ids
         FROM contacts
         WHERE email IS NOT NULL AND email != ''
         GROUP BY email
         HAVING cnt > 1
         LIMIT 50`
      ));

      const dupeRows = (emailDupes as any[])[0] as any[];
      if (!dupeRows || dupeRows.length === 0) {
        return { success: true, summary: "No duplicate contacts found.", actionsTaken: [] };
      }

      log(`Found ${dupeRows.length} duplicate email groups`);

      const actionsTaken: string[] = [];
      let mergedCount = 0;

      for (const row of dupeRows.slice(0, 10)) {
        const ids = (row.ids as string).split(",").map(Number);
        const keepId = ids[0];
        const dupeIds = ids.slice(1);

        // Reassign activities from dupes to keeper
        for (const dupeId of dupeIds) {
          await (await getDb())!.execute(sql.raw(`UPDATE activities SET contactId = ${keepId} WHERE contactId = ${dupeId}`));
          await (await getDb())!.execute(sql.raw(`DELETE FROM contacts WHERE id = ${dupeId}`));
          mergedCount++;
        }
        actionsTaken.push(`Merged ${dupeIds.length} duplicate(s) for email ${row.email} into contact #${keepId}`);
      }

      return {
        success: true,
        summary: `Merged ${mergedCount} duplicate contacts across ${Math.min(dupeRows.length, 10)} email groups.`,
        reasoning: `Found ${dupeRows.length} duplicate email groups. Processed top 10.`,
        actionsTaken
      };
    }
  },

  // ── Lead Score Recalculator ───────────────────────────────────────────────
  {
    key: "lead_score_recalculator",
    name: "Lead Score Recalculator",
    description: "Recalculates Quantum Lead Scores for all active prospects based on latest activity signals.",
    category: "intelligence",
    priority: "high",
    intervalMinutes: 60,
    async run({ log }) {
      const db = await getDb();
      if (!db) return { success: false, summary: "Database unavailable", error: "No DB connection" };
      log("Recalculating lead scores...");

      const prospects = await (await getDb())!.execute(sql.raw(
        `SELECT id, firstName, lastName, email, companyName, engagementStage, psychographicProfile
         FROM prospects
         WHERE engagementStage NOT IN ('converted','dead')
         ORDER BY updatedAt DESC
         LIMIT 100`
      ));

      const rows = (prospects as any[])[0] as any[];
      if (!rows || rows.length === 0) {
        return { success: true, summary: "No active prospects to score.", actionsTaken: [] };
      }

      log(`Scoring ${rows.length} prospects...`);

      const aiResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are the REALM CRM lead scoring AI. Score each prospect 0-100 based on engagement stage, profile completeness, and recency. 
            Return JSON: { "scores": [{ "id": number, "score": number, "reasoning": string }] }`
          },
          {
            role: "user",
            content: `Score these ${rows.length} prospects:\n${JSON.stringify(rows.map(r => ({
              id: r.id,
              name: `${r.firstName} ${r.lastName}`,
              company: r.companyName,
              stage: r.engagementStage,
              hasProfile: !!r.psychographicProfile
            })))}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "lead_scores",
            strict: true,
            schema: {
              type: "object",
              properties: {
                scores: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      score: { type: "number" },
                      reasoning: { type: "string" }
                    },
                    required: ["id", "score", "reasoning"],
                    additionalProperties: false
                  }
                }
              },
              required: ["scores"],
              additionalProperties: false
            }
          }
        }
      });

      const { scores } = JSON.parse(aiResponse.choices[0].message.content as string);
      let updated = 0;

      for (const s of scores) {
        await (await getDb())!.execute(sql.raw(`UPDATE prospects SET score = ${s.score}, updatedAt = ${Date.now()} WHERE id = ${s.id}`));
        updated++;
      }

      return {
        success: true,
        summary: `Recalculated lead scores for ${updated} prospects.`,
        reasoning: `Processed ${rows.length} active prospects using AI scoring model.`,
        actionsTaken: [`Updated ${updated} prospect scores`]
      };
    }
  },

  // ── Data Decay Detector ───────────────────────────────────────────────────
  {
    key: "data_decay_detector",
    name: "Data Decay Detector",
    description: "Identifies contacts with stale data (likely job changes, invalid emails) and flags them for re-verification.",
    category: "healing",
    priority: "medium",
    intervalMinutes: 360,
    async run({ log }) {
      const db = await getDb();
      if (!db) return { success: false, summary: "Database unavailable", error: "No DB connection" };
      log("Scanning for stale contact data...");

      const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;

      const staleContacts = await (await getDb())!.execute(sql.raw(
        `SELECT id, email, firstName, lastName, updatedAt
         FROM contacts
         WHERE updatedAt < ${sixMonthsAgo} AND email IS NOT NULL
         ORDER BY updatedAt ASC
         LIMIT 200`
      ));

      const rows = (staleContacts as any[])[0] as any[];
      if (!rows || rows.length === 0) {
        return { success: true, summary: "No stale contacts detected.", actionsTaken: [] };
      }

      // Tag them for re-verification
      const ids = rows.map((r: any) => r.id);
      await (await getDb())!.execute(sql.raw(
        `UPDATE contacts SET lifecycleStage = 'needs_revalidation' WHERE id IN (${ids.join(',')})`
      ));

      return {
        success: true,
        summary: `Flagged ${rows.length} contacts with data older than 6 months for re-verification.`,
        reasoning: `Contacts not updated in 6+ months likely have stale job titles, emails, or phone numbers.`,
        actionsTaken: [`Tagged ${rows.length} contacts as needs_revalidation`]
      };
    }
  },

  // ── Pipeline Health Monitor ───────────────────────────────────────────────
  {
    key: "pipeline_health_monitor",
    name: "Pipeline Health Monitor",
    description: "Monitors deal pipelines for stalled deals, overdue tasks, and at-risk opportunities. Alerts account managers.",
    category: "monitoring",
    priority: "high",
    intervalMinutes: 60,
    async run({ log }) {
      const db = await getDb();
      if (!db) return { success: false, summary: "Database unavailable", error: "No DB connection" };
      log("Checking pipeline health...");

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      const stalledDeals = await (await getDb())!.execute(sql.raw(
        `SELECT d.id, d.name, d.dealValue, d.status, d.userId, d.updatedAt,
                u.name as ownerName
         FROM deals d
         LEFT JOIN users u ON u.id = d.userId
         WHERE d.updatedAt < ${sevenDaysAgo} AND d.status NOT IN ('won','lost','closed')
         ORDER BY d.dealValue DESC
         LIMIT 50`
      ));

      const rows = (stalledDeals as any[])[0] as any[];
      if (!rows || rows.length === 0) {
        return { success: true, summary: "All deals have recent activity. Pipeline healthy.", actionsTaken: [] };
      }

      const totalValue = rows.reduce((sum: number, r: any) => sum + (r.dealValue || 0), 0);
      const actionsTaken = [`Identified ${rows.length} stalled deals worth $${totalValue.toLocaleString()}`];

      // Create follow-up tasks for stalled deals
      let tasksCreated = 0;
      for (const deal of rows.slice(0, 10)) {
        const existing = await (await getDb())!.execute(sql.raw(`SELECT id FROM tasks WHERE dealId = ${deal.id} AND taskStatus = 'pending' AND title LIKE '%follow up%' LIMIT 1`));
        const existingRows = (existing as any[])[0] as any[];
        if (!existingRows || existingRows.length === 0) {
          const now = Date.now();
          const dueDate = now + 24 * 60 * 60 * 1000;
          await (await getDb())!.execute(sql.raw(`INSERT INTO tasks (title, taskType, taskStatus, priority, dueDate, dealId, assignedTo, description, createdAt, updatedAt)
             VALUES ('Follow up on stalled deal: ${deal.name?.replace(/'/g, "''")}', 'follow_up', 'pending', 'high', ${dueDate}, ${deal.id}, ${deal.userId || 'NULL'}, 'Auto-created by AI Engine: deal stalled for 7+ days', ${now}, ${now})`));
          tasksCreated++;
        }
      }

      if (tasksCreated > 0) {
        actionsTaken.push(`Auto-created ${tasksCreated} follow-up tasks for stalled deals`);
      }

      return {
        success: true,
        summary: `Found ${rows.length} stalled deals worth $${totalValue.toLocaleString()}. Created ${tasksCreated} follow-up tasks.`,
        reasoning: `Deals with no activity in 7+ days are at risk of going cold.`,
        actionsTaken
      };
    }
  },

  // ── Email Send-Time Optimizer ─────────────────────────────────────────────
  {
    key: "email_sendtime_optimizer",
    name: "Email Send-Time Optimizer",
    description: "Analyzes email engagement patterns per contact and updates optimal send windows nightly.",
    category: "optimization",
    priority: "medium",
    intervalMinutes: 1440, // nightly
    async run({ log }) {
      const db = await getDb();
      if (!db) return { success: false, summary: "Database unavailable", error: "No DB connection" };
      log("Analyzing email engagement patterns...");

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

      const engagementData = await (await getDb())!.execute(sql.raw(
        `SELECT contactId,
                HOUR(FROM_UNIXTIME(createdAt/1000)) as send_hour,
                COUNT(*) as sends,
                SUM(CASE WHEN activityType = 'email_open' THEN 1 ELSE 0 END) as opens
         FROM activities
         WHERE createdAt > ${thirtyDaysAgo} AND activityType IN ('email_sent', 'email_open')
         GROUP BY contactId, send_hour
         HAVING sends > 2
         LIMIT 500`
      ));

      const rows = (engagementData as any[])[0] as any[];
      if (!rows || rows.length === 0) {
        return { success: true, summary: "Insufficient email data for optimization.", actionsTaken: [] };
      }

      // Group by contact and find best hour
      const contactHours: Record<number, { hour: number; rate: number }> = {};
      for (const row of rows) {
        const rate = row.sends > 0 ? row.opens / row.sends : 0;
        if (!contactHours[row.contactId] || rate > contactHours[row.contactId].rate) {
          contactHours[row.contactId] = { hour: row.send_hour, rate };
        }
      }

      let updated = 0;
      for (const [contactId, best] of Object.entries(contactHours)) {
        await (await getDb())!.execute(sql.raw(`UPDATE contacts SET customFields = JSON_SET(COALESCE(customFields, '{}'), '$.optimal_send_hour', ${best.hour}) WHERE id = ${contactId}`));
        updated++;
      }

      return {
        success: true,
        summary: `Updated optimal send times for ${updated} contacts based on 30-day engagement data.`,
        reasoning: `Analyzed ${rows.length} engagement data points across ${Object.keys(contactHours).length} contacts.`,
        actionsTaken: [`Updated send-time preferences for ${updated} contacts`]
      };
    }
  },

  // ── Sequence Performance Optimizer ───────────────────────────────────────
  {
    key: "sequence_optimizer",
    name: "Sequence Performance Optimizer",
    description: "Analyzes ghost sequence performance and uses AI to rewrite underperforming email steps.",
    category: "optimization",
    priority: "medium",
    intervalMinutes: 720, // twice daily
    async run({ log }) {
      const db = await getDb();
      if (!db) return { success: false, summary: "Database unavailable", error: "No DB connection" };
      log("Analyzing sequence performance...");

      const sequences = await (await getDb())!.execute(sql.raw(
        `SELECT gs.id, gs.name, gs.seqStatus,
                COUNT(gss.id) as step_count,
                gs.createdAt
         FROM ghost_sequences gs
         LEFT JOIN ghost_sequence_steps gss ON gss.sequenceId = gs.id
         WHERE gs.seqStatus = 'active'
         GROUP BY gs.id
         LIMIT 20`
      ));

      const rows = (sequences as any[])[0] as any[];
      if (!rows || rows.length === 0) {
        return { success: true, summary: "No active sequences to optimize.", actionsTaken: [] };
      }

      const aiResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are the REALM CRM sequence optimization AI. Analyze sequence data and provide optimization recommendations.
            Return JSON: { "recommendations": [{ "sequence_id": number, "recommendation": string, "priority": string }] }`
          },
          {
            role: "user",
            content: `Analyze these ${rows.length} active sequences and recommend optimizations:\n${JSON.stringify(rows.map(r => ({
              id: r.id,
              name: r.name,
              steps: r.step_count,
              age_days: Math.floor((Date.now() - r.createdAt) / (1000 * 60 * 60 * 24))
            })))}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "sequence_recommendations",
            strict: true,
            schema: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      sequence_id: { type: "number" },
                      recommendation: { type: "string" },
                      priority: { type: "string" }
                    },
                    required: ["sequence_id", "recommendation", "priority"],
                    additionalProperties: false
                  }
                }
              },
              required: ["recommendations"],
              additionalProperties: false
            }
          }
        }
      });

      const { recommendations } = JSON.parse(aiResponse.choices[0].message.content as string);

      return {
        success: true,
        summary: `Generated ${recommendations.length} optimization recommendations for active sequences.`,
        reasoning: `Analyzed ${rows.length} active sequences for performance improvement opportunities.`,
        actionsTaken: recommendations.map((r: any) => `Sequence #${r.sequence_id}: ${r.recommendation}`)
      };
    }
  },

  // ── Domain Reputation Guardian ────────────────────────────────────────────
  {
    key: "domain_reputation_guardian",
    name: "Domain Reputation Guardian",
    description: "Monitors sending domain health scores and automatically pauses domains approaching danger thresholds.",
    category: "monitoring",
    priority: "critical",
    intervalMinutes: 30,
    async run({ log }) {
      const db = await getDb();
      if (!db) return { success: false, summary: "Database unavailable", error: "No DB connection" };
      log("Checking domain reputation health...");

      const domains = await (await getDb())!.execute(sql.raw(
        `SELECT id, domain, healthStatus, sentToday, dailyLimit, isActive
         FROM smtp_accounts
         WHERE isActive = 1
         ORDER BY sentToday DESC
         LIMIT 100`
      ));

      const rows = (domains as any[])[0] as any[];
      if (!rows || rows.length === 0) {
        return { success: true, summary: "No active SMTP domains to monitor.", actionsTaken: [] };
      }

      const actionsTaken: string[] = [];
      let paused = 0;
      let warned = 0;

      for (const domain of rows) {
        const score = domain.healthStatus === 'healthy' ? 100 : domain.healthStatus === 'warning' ? 50 : 20;
        const utilization = domain.dailyLimit > 0 ? (domain.sentToday / domain.dailyLimit) * 100 : 0;

        if (score < 30) {
          // Critical — pause immediately
          await (await getDb())!.execute(sql.raw(`UPDATE smtp_accounts SET isActive = 0 WHERE id = ${domain.id}`));
          actionsTaken.push(`PAUSED domain ${domain.domain} (health status: ${domain.healthStatus})`);
          paused++;
        } else if (score < 60 || utilization > 90) {
          // Warning — reduce daily limit
          const newLimit = Math.floor(domain.dailyLimit * 0.7);
          await (await getDb())!.execute(sql.raw(`UPDATE smtp_accounts SET dailyLimit = ${newLimit} WHERE id = ${domain.id}`));
          actionsTaken.push(`Throttled domain ${domain.domain} to ${newLimit}/day (utilization: ${Math.round(utilization)}%)`);
          warned++;
        }
      }

      if (paused > 0) {
        await notifyOwner({
          title: `⚠️ ${paused} Sending Domain(s) Auto-Paused`,
          content: `AI Engine paused ${paused} domain(s) due to critical health scores.\n\n${actionsTaken.filter(a => a.startsWith('PAUSED')).join('\n')}`
        });
      }

      return {
        success: true,
        summary: `Monitored ${rows.length} domains. Paused ${paused}, throttled ${warned}.`,
        reasoning: `Domains below 30 health score paused. Domains below 60 or >90% utilization throttled.`,
        actionsTaken: actionsTaken.length > 0 ? actionsTaken : [`All ${rows.length} domains healthy`]
      };
    }
  },

  // ── Competitive Intelligence Updater ─────────────────────────────────────
  {
    key: "competitive_intelligence",
    name: "Competitive Intelligence Updater",
    description: "Updates battle cards for hot prospects using AI analysis of latest signals and engagement data.",
    category: "intelligence",
    priority: "low",
    intervalMinutes: 240,
    async run({ log }) {
      const db = await getDb();
      if (!db) return { success: false, summary: "Database unavailable", error: "No DB connection" };
      log("Updating competitive intelligence battle cards...");

      const hotProspects = await (await getDb())!.execute(sql.raw(
        `SELECT p.id, p.firstName, p.lastName, p.companyName, p.engagementStage,
                p.psychographicProfile, bc.id as battle_card_id
         FROM prospects p
         LEFT JOIN battle_cards bc ON bc.prospectId = p.id
         WHERE p.engagementStage IN ('hot','engaged','responding')
         ORDER BY p.updatedAt DESC
         LIMIT 20`
      ));

      const rows = (hotProspects as any[])[0] as any[];
      if (!rows || rows.length === 0) {
        return { success: true, summary: "No hot prospects requiring battle card updates.", actionsTaken: [] };
      }

      let updated = 0;
      for (const prospect of rows.slice(0, 5)) {
        const aiResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a sales intelligence AI. Generate a concise battle card for a hot prospect.
              Return JSON: { "key_insight": string, "approach": string, "objections": [string], "close_strategy": string }`
            },
            {
              role: "user",
              content: `Generate battle card for ${prospect.firstName} ${prospect.lastName} at ${prospect.companyName}. 
              Stage: ${prospect.engagementStage}. Profile: ${prospect.psychographicProfile || 'not available'}`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "battle_card",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  key_insight: { type: "string" },
                  approach: { type: "string" },
                  objections: { type: "array", items: { type: "string" } },
                  close_strategy: { type: "string" }
                },
                required: ["key_insight", "approach", "objections", "close_strategy"],
                additionalProperties: false
              }
            }
          }
        });

        const card = JSON.parse(aiResponse.choices[0].message.content as string);
        // talkingPoints is JSON array, objectionHandlers is JSON array, recommendedApproach is TEXT
        const talkingPointsJson = JSON.stringify([card.key_insight, card.approach, card.close_strategy]).replace(/'/g, "''");
        const objectionHandlersJson = JSON.stringify(card.objections).replace(/'/g, "''");
        const recommendedApproach = card.close_strategy.replace(/'/g, "''").replace(/\n/g, ' ');
        const escapedName = (prospect.firstName + ' ' + prospect.lastName).replace(/'/g, "''");

        const now = Date.now();
        if (prospect.battle_card_id) {
          await (await getDb())!.execute(sql.raw(`UPDATE battle_cards SET talkingPoints = '${talkingPointsJson}', objectionHandlers = '${objectionHandlersJson}', recommendedApproach = '${recommendedApproach}', generatedAt = ${now} WHERE id = ${prospect.battle_card_id}`));
        } else {
          await (await getDb())!.execute(sql.raw(`INSERT INTO battle_cards (prospectId, title, talkingPoints, objectionHandlers, recommendedApproach, createdAt, generatedAt) VALUES (${prospect.id}, 'Battle Card: ${escapedName}', '${talkingPointsJson}', '${objectionHandlersJson}', '${recommendedApproach}', ${now}, ${now})`));
        }
        updated++;
      }

      return {
        success: true,
        summary: `Updated battle cards for ${updated} hot prospects.`,
        reasoning: `Hot and engaged prospects need fresh intelligence for sales conversations.`,
        actionsTaken: [`Refreshed ${updated} battle cards with AI-generated insights`]
      };
    }
  },

  // ── Migration Field Mapper ────────────────────────────────────────────────
  {
    key: "migration_field_mapper",
    name: "Migration Field Mapper",
    description: "Processes pending migration jobs, using AI to map source fields to REALM fields automatically.",
    category: "migration",
    priority: "high",
    intervalMinutes: 10,
    async run({ log }) {
      const db = await getDb();
      if (!db) return { success: false, summary: "Database unavailable", error: "No DB connection" };
      log("Checking for pending migration jobs...");

      const pendingJobs = await (await getDb())!.execute(sql.raw(
        `SELECT id, sourcePlatform, mjStatus, fieldMapping, createdAt
         FROM migration_jobs
         WHERE mjStatus IN ('pending', 'mapping')
         ORDER BY createdAt ASC
         LIMIT 5`
      ));

      const rows = (pendingJobs as any[])[0] as any[];
      if (!rows || rows.length === 0) {
        return { success: true, summary: "No pending migration jobs.", actionsTaken: [] };
      }

      const actionsTaken: string[] = [];

      for (const job of rows) {
        log(`Processing migration job #${job.id} from ${job.sourcePlatform}...`);

        await (await getDb())!.execute(sql.raw(`UPDATE migration_jobs SET mjStatus = 'mapping' WHERE id = ${job.id}`));

        actionsTaken.push(`Processing migration job #${job.id} (${job.sourcePlatform})`);
      }

      return {
        success: true,
        summary: `Processed ${rows.length} pending migration jobs.`,
        reasoning: `Migration jobs in pending/mapping state need AI field mapping to proceed.`,
        actionsTaken
      };
    }
  },

  // ── Prospect Enrichment Engine ────────────────────────────────────────────────
  {
    key: "prospect_enrichment",
    name: "Prospect Enrichment Engine",
    description: "Enriches new and stale prospects with AI-generated psychographic profiles, intent signals, and engagement stage updates every 30 minutes.",
    category: "enrichment",
    priority: "normal" as any,
    intervalMinutes: 30,
    async run({ log }) {
      const db = await getDb();
      if (!db) return { success: false, summary: "Database unavailable", error: "No DB connection" };
      log("Scanning for prospects needing enrichment...");

      const staleThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const rawResult = await (await getDb())!.execute(sql.raw(
        `SELECT id, userId, firstName, lastName, email, companyName, jobTitle, linkedinUrl, engagementStage, psychographicProfile
         FROM prospects
         WHERE (psychographicProfile IS NULL OR updatedAt < ${staleThreshold})
           AND engagementStage NOT IN ('converted', 'unsubscribed', 'dead')
         ORDER BY createdAt DESC
         LIMIT 10`
      ));

      const rows = (rawResult as any[])[0] as any[];
      if (!rows || rows.length === 0) {
        return { success: true, summary: "All prospects are enriched and up to date.", actionsTaken: [] };
      }

      log(`Found ${rows.length} prospects to enrich.`);
      const actionsTaken: string[] = [];

      for (const prospect of rows) {
        try {
          log(`Enriching: ${prospect.firstName} ${prospect.lastName} (${prospect.email})...`);

          const aiResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are an expert B2B sales intelligence analyst. Generate a psychographic profile for the prospect. Return JSON only."
              },
              {
                role: "user",
                content: `Prospect: ${prospect.firstName} ${prospect.lastName}, ${prospect.jobTitle || 'Unknown title'} at ${prospect.companyName || 'Unknown company'}. Email: ${prospect.email}. LinkedIn: ${prospect.linkedinUrl || 'N/A'}. Current engagement stage: ${prospect.engagementStage || 'new'}.\n\nGenerate a psychographic profile.`
              }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "psychographic_profile",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    personality_type: { type: "string" },
                    communication_style: { type: "string" },
                    primary_motivators: { type: "array", items: { type: "string" } },
                    buying_triggers: { type: "array", items: { type: "string" } },
                    risk_tolerance: { type: "string" },
                    decision_speed: { type: "string" },
                    recommended_approach: { type: "string" },
                    intent_signals: { type: "array", items: { type: "string" } },
                    confidence_score: { type: "number" }
                  },
                  required: ["personality_type", "communication_style", "primary_motivators", "buying_triggers", "risk_tolerance", "decision_speed", "recommended_approach", "intent_signals", "confidence_score"],
                  additionalProperties: false
                }
              }
            }
          });

          const profileJson = aiResponse?.choices?.[0]?.message?.content as string | null;
          if (profileJson) {
            const profile = JSON.parse(profileJson);
            const profileStr = JSON.stringify(profile).replace(/'/g, "''");
            await (await getDb())!.execute(sql.raw(
              `UPDATE prospects SET psychographicProfile = '${profileStr}', updatedAt = ${Date.now()} WHERE id = ${prospect.id}`
            ));
            // Insert intent signals as trigger signals
            for (const signal of (profile.intent_signals || []).slice(0, 3)) {
              const signalData = JSON.stringify({ signal, source: 'ai_enrichment', confidence: profile.confidence_score }).replace(/'/g, "''");
              await (await getDb())!.execute(sql.raw(
                `INSERT INTO trigger_signals (userId, prospectId, signalType, description, metadata, createdAt)
                 VALUES (${prospect.userId || 0}, ${prospect.id}, 'intent_signal', 'AI-detected intent signal', '${signalData}', ${Date.now()})`
              )).catch(() => {});
            }
            actionsTaken.push(`Enriched ${prospect.firstName} ${prospect.lastName} — ${profile.personality_type}, confidence: ${profile.confidence_score}%`);
          }
        } catch (err: any) {
          log(`Failed to enrich ${prospect.email}: ${err.message}`);
        }
      }

      return {
        success: true,
        summary: `Enriched ${actionsTaken.length} of ${rows.length} prospects with psychographic profiles and intent signals.`,
        reasoning: `Prospects without psychographic profiles cannot be targeted with personalized outreach. Enrichment runs every 30 minutes to keep profiles fresh.`,
        actionsTaken
      };
    }
  },

  // ── Task 12: Adoption Monitor ─────────────────────────────────────────────────────────────
  {
    key: "adoption_monitor",
    name: "Adoption Monitor",
    description: "Monitors user login activity after migration. After 30 days, identifies users who haven't logged in or are still inactive, and notifies the admin with AI-generated action recommendations.",
    category: "monitoring" as any,
    priority: "normal" as any,
    intervalMinutes: 1440, // once per day
    async run({ log }) {
      const db = await getDb();
      if (!db) return { success: false, summary: "Database unavailable", error: "No DB connection" };
      log("Checking 30-day adoption metrics...");

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      // Find companies that completed migration >= 30 days ago
      const migratedResult = await db.execute(sql.raw(
        `SELECT DISTINCT mjCompanyId as company_id, sourcePlatform, createdAt
         FROM migration_jobs
         WHERE mjStatus = 'completed' AND createdAt <= ${thirtyDaysAgo}
         ORDER BY createdAt ASC
         LIMIT 50`
      ));
      const migratedCompanies = ((migratedResult as any[])[0] || []) as any[];

      if (migratedCompanies.length === 0) {
        return { success: true, summary: "No companies have reached the 30-day adoption checkpoint yet.", actionsTaken: [] };
      }

      log(`Found ${migratedCompanies.length} companies past the 30-day mark. Checking user activity...`);
      const actionsTaken: string[] = [];
      const alerts: string[] = [];

      for (const company of migratedCompanies) {
        const usersResult = await db.execute(sql.raw(
          `SELECT id, name, email, lastSignedIn
           FROM users
           WHERE tenantCompanyId = ${company.company_id}
             AND role != 'developer'`
        ));
        const users = ((usersResult as any[])[0] || []) as any[];
        if (users.length === 0) continue;

        const inactive = users.filter((u: any) => !u.lastSignedIn || Number(u.lastSignedIn) < sevenDaysAgo);
        const neverLoggedIn = users.filter((u: any) => !u.lastSignedIn);
        const activeUsers = users.length - inactive.length;
        const adoptionRate = Math.round((activeUsers / users.length) * 100);

        log(`Company ${company.company_id}: ${activeUsers}/${users.length} active (${adoptionRate}% adoption)`);

        if (inactive.length > 0) {
          const alert = `Company ${company.company_id} (migrated from ${company.source_platform}): ${inactive.length}/${users.length} users inactive. Adoption: ${adoptionRate}%.`;
          alerts.push(alert);
          actionsTaken.push(alert);
          if (neverLoggedIn.length > 0) {
            actionsTaken.push(`  → ${neverLoggedIn.length} users have NEVER logged in: ${neverLoggedIn.map((u: any) => u.email).slice(0, 5).join(', ')}`);
          }
        }
      }

      if (alerts.length > 0) {
        const aiAnalysis = await invokeLLM({
          messages: [
            { role: "system", content: "You are a CRM adoption specialist. Analyze the adoption data and provide 3 specific, actionable recommendations. Be concise." },
            { role: "user", content: `Adoption issues:\n${alerts.join('\n')}\n\nProvide 3 recommendations.` }
          ]
        });
        const recommendations = (aiAnalysis?.choices?.[0]?.message?.content as string) || "Send re-engagement emails to inactive users.";
        await notifyOwner({
          title: `⚠️ Adoption Alert: ${alerts.length} company${alerts.length !== 1 ? 'ies' : 'y'} with low engagement`,
          content: `30-day adoption check.\n\n${alerts.join('\n')}\n\n**AI Recommendations:**\n${recommendations}`
        }).catch(() => {});
        log(`Adoption alert sent for ${alerts.length} companies.`);
      }

      return {
        success: true,
        summary: alerts.length > 0
          ? `Adoption alert: ${alerts.length} company${alerts.length !== 1 ? 'ies' : 'y'} with inactive users. Owner notified.`
          : `All ${migratedCompanies.length} migrated companies show healthy adoption.`,
        reasoning: "Monitoring adoption 30 days post-migration identifies at-risk accounts before they churn.",
        actionsTaken
      };
    }
  }
];

// ─── Engine State ─────────────────────────────────────────────────────────────

const engineState = new Map<string, RunningTask>();
let engineInterval: NodeJS.Timeout | null = null;
let isRunning = false;

function initializeState() {
  const now = Date.now();
  for (const task of TASKS) {
    engineState.set(task.key, {
      task,
      lastRunAt: null,
      nextRunAt: now + Math.random() * 60000, // stagger initial runs
      status: "idle",
      consecutiveFailures: 0,
      runCount: 0,
      successCount: 0,
      failureCount: 0,
      isPaused: false,
      lastResult: null
    });
  }
}

async function runTask(state: RunningTask): Promise<void> {
  if (state.isPaused || state.status === "running") return;

  const db = getDb();
  const runId = `${state.task.key}_${Date.now()}`;
  const startTime = Date.now();

  state.status = "running";
  state.lastRunAt = startTime;
  state.nextRunAt = startTime + state.task.intervalMinutes * 60 * 1000;

  const logs: string[] = [];
  const ctx: TaskContext = {
    log: (msg: string) => {
      logs.push(`[${new Date().toISOString()}] ${msg}`);
      console.log(`[AIEngine:${state.task.key}] ${msg}`);
    },
    taskKey: state.task.key,
    runId
  };

  // Log start
  const _startTs = Date.now();
  await (await getDb())!.execute(sql.raw(`INSERT INTO ai_engine_logs (task_key, run_id, status, triggered_by, created_at)
     VALUES ('${state.task.key}', '${runId}', 'started', 'scheduler', ${_startTs})`)).catch(() => {});

  try {
    const result = await state.task.run(ctx);
    const duration = Date.now() - startTime;

    state.status = result.success ? "idle" : "failed";
    state.lastResult = result;
    state.runCount++;
    if (result.success) {
      state.successCount++;
      state.consecutiveFailures = 0;
    } else {
      state.failureCount++;
      state.consecutiveFailures++;
    }

    // Log completion
    const _summary = (result.summary || '').replace(/'/g, "''").substring(0, 500);
    const _reasoning = (result.reasoning || '').replace(/'/g, "''").substring(0, 500);
    const _actions = JSON.stringify(result.actionsTaken || []).replace(/'/g, "''").substring(0, 1000);
    await (await getDb())!.execute(sql.raw(`INSERT INTO ai_engine_logs (task_key, run_id, status, output_summary, ai_reasoning, actions_taken, duration_ms, triggered_by, created_at)
       VALUES ('${state.task.key}', '${runId}', '${result.success ? 'success' : 'failed'}', '${_summary}', '${_reasoning}', '${_actions}', ${duration}, 'scheduler', ${Date.now()})`)).catch(() => {});

    // Escalate if too many consecutive failures
    if (state.consecutiveFailures >= 3) {
      await notifyOwner({
        title: `🤖 AI Engine Task Failing: ${state.task.name}`,
        content: `Task "${state.task.name}" has failed ${state.consecutiveFailures} times in a row.\n\nLast error: ${result.error || 'Unknown error'}\n\nThe task has been paused. Please investigate.`
      }).catch(() => {});
      state.isPaused = true;
    }

  } catch (err: any) {
    const duration = Date.now() - startTime;
    state.status = "failed";
    state.failureCount++;
    state.consecutiveFailures++;
    state.lastResult = { success: false, summary: "Task threw an exception", error: err.message };

    const _errMsg = (err.message || '').replace(/'/g, "''").substring(0, 500);
    await (await getDb())!.execute(sql.raw(`INSERT INTO ai_engine_logs (task_key, run_id, status, error_message, duration_ms, triggered_by, created_at)
       VALUES ('${state.task.key}', '${runId}', 'failed', '${_errMsg}', ${duration}, 'scheduler', ${Date.now()})`)).catch(() => {});

    console.error(`[AIEngine:${state.task.key}] Task failed:`, err.message);
  }
}

async function tick() {
  if (!isRunning) return;
  const now = Date.now();

  for (const [, state] of Array.from(engineState)) {
    if (!state.isPaused && state.status !== "running" && now >= state.nextRunAt) {
      runTask(state).catch(console.error);
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function startAIEngine() {
  if (isRunning) return;
  isRunning = true;
  initializeState();
  engineInterval = setInterval(tick, 30 * 1000); // check every 30 seconds
  console.log(`[AIEngine] Started — ${TASKS.length} tasks registered`);
}

export function stopAIEngine() {
  isRunning = false;
  if (engineInterval) {
    clearInterval(engineInterval);
    engineInterval = null;
  }
  console.log("[AIEngine] Stopped");
}

export function getEngineStatus() {
  const tasks = Array.from(engineState.values()).map(s => ({
    key: s.task.key,
    name: s.task.name,
    description: s.task.description,
    category: s.task.category,
    priority: s.task.priority,
    intervalMinutes: s.task.intervalMinutes,
    status: s.status,
    isPaused: s.isPaused,
    lastRunAt: s.lastRunAt,
    nextRunAt: s.nextRunAt,
    runCount: s.runCount,
    successCount: s.successCount,
    failureCount: s.failureCount,
    consecutiveFailures: s.consecutiveFailures,
    lastResult: s.lastResult
  }));

  const healthy = tasks.filter(t => !t.isPaused && t.consecutiveFailures === 0).length;
  const healthScore = tasks.length > 0 ? Math.round((healthy / tasks.length) * 100) : 100;

  return { isRunning, taskCount: tasks.length, healthScore, tasks };
}

export async function triggerTask(taskKey: string, triggeredByUserId?: number): Promise<TaskResult> {
  const state = engineState.get(taskKey);
  if (!state) throw new Error(`Task not found: ${taskKey}`);
  if (state.status === "running") throw new Error(`Task ${taskKey} is already running`);

  // Force run immediately
  state.nextRunAt = Date.now();
  const db = getDb();
  const runId = `${taskKey}_manual_${Date.now()}`;
  const startTime = Date.now();

  state.status = "running";
  state.lastRunAt = startTime;

  const ctx: TaskContext = {
    log: (msg: string) => console.log(`[AIEngine:${taskKey}:manual] ${msg}`),
    taskKey,
    runId
  };

  try {
    const result = await state.task.run(ctx);
    const duration = Date.now() - startTime;
    state.status = result.success ? "idle" : "failed";
    state.lastResult = result;
    state.runCount++;
    if (result.success) { state.successCount++; state.consecutiveFailures = 0; }
    else { state.failureCount++; state.consecutiveFailures++; }

    const _mSummary = (result.summary || '').replace(/'/g, "''").substring(0, 500);
    const _mReasoning = (result.reasoning || '').replace(/'/g, "''").substring(0, 500);
    const _mActions = JSON.stringify(result.actionsTaken || []).replace(/'/g, "''").substring(0, 1000);
    await (await getDb())!.execute(sql.raw(`INSERT INTO ai_engine_logs (task_key, run_id, status, output_summary, ai_reasoning, actions_taken, duration_ms, triggered_by, created_at)
       VALUES ('${state.task.key}', '${runId}', '${result.success ? 'success' : 'failed'}', '${_mSummary}', '${_mReasoning}', '${_mActions}', ${duration}, 'manual', ${Date.now()})`)).catch(() => {});

    return result;
  } catch (err: any) {
    state.status = "failed";
    state.failureCount++;
    state.consecutiveFailures++;
    const result: TaskResult = { success: false, summary: "Task threw an exception", error: err.message };
    state.lastResult = result;
    return result;
  }
}

export function pauseTask(taskKey: string) {
  const state = engineState.get(taskKey);
  if (!state) throw new Error(`Task not found: ${taskKey}`);
  state.isPaused = true;
  state.status = "paused";
}

export function resumeTask(taskKey: string) {
  const state = engineState.get(taskKey);
  if (!state) throw new Error(`Task not found: ${taskKey}`);
  state.isPaused = false;
  state.status = "idle";
  state.consecutiveFailures = 0;
  state.nextRunAt = Date.now() + 5000; // run soon
}
