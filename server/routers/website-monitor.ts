import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { websiteMonitors, websiteCrawlResults, triggerSignals } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { createHash } from "crypto";
import nodemailer from "nodemailer";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DetectedSignal {
  type: string;
  title: string;
  summary: string;
  confidence: number;
  sourceText: string;
  autoEmailSent: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fetch the text content of a webpage using a simple HTTP GET */
async function fetchPageText(url: string): Promise<{ text: string; finalUrl: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AxiomCRM-Monitor/1.0; +https://axiom.manus.space)",
        "Accept": "text/html,application/xhtml+xml,*/*",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    // Strip HTML tags to get plain text
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12000); // limit to 12k chars for AI
    return { text, finalUrl: res.url };
  } catch (e: any) {
    clearTimeout(timeout);
    throw new Error(`Fetch failed: ${e.message}`);
  }
}

/** Use AI to detect positive signals in page text */
async function detectSignalsWithAI(
  companyName: string,
  websiteUrl: string,
  pageText: string
): Promise<DetectedSignal[]> {
  const prompt = `You are a business intelligence analyst. Analyze the following text scraped from ${companyName}'s website (${websiteUrl}) and identify any POSITIVE business signals or announcements.

Look for:
- Awards or recognitions received
- Business expansions (new offices, new markets, new routes)
- New partnerships or contracts signed
- Funding rounds or investment news
- New product or service launches
- Milestone achievements (anniversaries, revenue records, fleet growth)
- New executive hires or promotions
- Industry certifications obtained
- Charitable or community initiatives
- Any other genuinely positive news

IMPORTANT: Only report POSITIVE signals. Ignore negative news, complaints, or neutral content.

Website text:
"""
${pageText}
"""

Return a JSON array of detected signals. Each signal must have:
- type: one of "award", "expansion", "funding", "new_hire", "partnership", "product_launch", "milestone", "certification", "community", "other_positive"
- title: short headline (max 80 chars)
- summary: 1-2 sentence description of the signal
- confidence: number 0-1 (how confident you are this is a real positive signal)
- sourceText: the exact excerpt from the page that supports this signal (max 200 chars)

If no positive signals are found, return an empty array [].
Only return signals with confidence >= 0.6.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a business intelligence analyst that extracts positive signals from company websites. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "signals",
          strict: true,
          schema: {
            type: "object",
            properties: {
              signals: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    title: { type: "string" },
                    summary: { type: "string" },
                    confidence: { type: "number" },
                    sourceText: { type: "string" },
                  },
                  required: ["type", "title", "summary", "confidence", "sourceText"],
                  additionalProperties: false,
                },
              },
            },
            required: ["signals"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) return [];
    const parsed = JSON.parse(content);
    return (parsed.signals || []).map((s: any) => ({ ...s, autoEmailSent: false }));
  } catch {
    return [];
  }
}

/** Generate a congratulations email body using AI */
async function generateCongratsEmail(
  companyName: string,
  signal: DetectedSignal,
  fromName: string
): Promise<{ subject: string; html: string; text: string }> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a professional business relationship manager writing warm, genuine congratulations emails. Keep emails concise (3-4 short paragraphs), professional, and sincere. No fluff or excessive praise.",
      },
      {
        role: "user",
        content: `Write a congratulations email to ${companyName} about this positive news:

Signal type: ${signal.type}
Headline: ${signal.title}
Details: ${signal.summary}

The email is from ${fromName}. 
- Subject line should be warm and specific to the news
- Opening: acknowledge the specific achievement
- Middle: brief genuine congratulations and why it matters
- Closing: express interest in continuing the relationship
- Sign off as ${fromName}

Return JSON with: subject (string), html (string with basic HTML), text (plain text version)`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "email",
        strict: true,
        schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            html: { type: "string" },
            text: { type: "string" },
          },
          required: ["subject", "html", "text"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error("Failed to generate email");
  return JSON.parse(content);
}

/** Send a congratulations email via nodemailer */
async function sendCongratsEmail(
  toEmail: string,
  toName: string,
  fromName: string,
  fromAddress: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: `"${toName}" <${toEmail}>`,
      subject,
      html,
      text,
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Main crawl function (exported for AI Engine) ─────────────────────────────
export async function crawlMonitor(monitor: {
  id: number;
  userId: number;
  tenantId: number;
  companyName: string;
  websiteUrl: string;
  autoEmailEnabled: number;
  autoEmailFromName: string | null;
  autoEmailFromAddress: string | null;
  signalFilters: string[] | null;
}): Promise<{ signalsFound: number; crawlResultId: number }> {
  const now = Date.now();
  let pageText = "";
  let crawlStatus = "success";
  let errorMessage: string | null = null;
  let finalUrl = monitor.websiteUrl;

  try {
    const result = await fetchPageText(monitor.websiteUrl);
    pageText = result.text;
    finalUrl = result.finalUrl;
  } catch (e: any) {
    crawlStatus = "failed";
    errorMessage = e.message;
  }

  // Compute content hash to detect changes
  const rawContentHash = createHash("sha256").update(pageText).digest("hex").slice(0, 64);

  // Detect signals with AI (only if fetch succeeded)
  let detectedSignals: DetectedSignal[] = [];
  if (crawlStatus === "success" && pageText.length > 100) {
    detectedSignals = await detectSignalsWithAI(monitor.companyName, monitor.websiteUrl, pageText);
  }

  // Apply signal type filters if configured
  if (monitor.signalFilters && monitor.signalFilters.length > 0) {
    detectedSignals = detectedSignals.filter(s => monitor.signalFilters!.includes(s.type));
  }

  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Auto-send congratulations emails if enabled
  if (monitor.autoEmailEnabled && monitor.autoEmailFromName && monitor.autoEmailFromAddress && detectedSignals.length > 0) {
    // Get contact email for auto-email
    try {
      const [contactRow] = await db.execute(
        sql`SELECT c.email, c.firstName, c.lastName FROM contacts c 
            WHERE c.id = (SELECT autoEmailToContactId FROM website_monitors WHERE id = ${monitor.id})
            LIMIT 1`
      ) as any[];
      if (contactRow?.email) {
        for (const signal of detectedSignals) {
          try {
            const email = await generateCongratsEmail(monitor.companyName, signal, monitor.autoEmailFromName!);
            const sent = await sendCongratsEmail(
              contactRow.email,
              `${contactRow.firstName || ""} ${contactRow.lastName || ""}`.trim() || contactRow.email,
              monitor.autoEmailFromName!,
              monitor.autoEmailFromAddress!,
              email.subject,
              email.html,
              email.text
            );
            signal.autoEmailSent = sent;
          } catch {
            // Continue even if one email fails
          }
        }
      }
    } catch {
      // Contact lookup failed, continue
    }
  }

  // Save crawl result
  const [crawlResult] = await db.insert(websiteCrawlResults).values({
    monitorId: monitor.id,
    userId: monitor.userId,
    tenantId: monitor.tenantId,
    crawledAt: now,
    pageUrl: finalUrl,
    crawlStatus,
    errorMessage,
    signalsDetected: detectedSignals.length,
    rawContentHash,
    detectedSignals,
    createdAt: now,
  });

  // Update monitor stats
  await db.update(websiteMonitors)
    .set({
      lastCrawledAt: now,
      totalSignalsFound: sql`totalSignalsFound + ${detectedSignals.length}`,
      updatedAt: now,
    })
    .where(eq(websiteMonitors.id, monitor.id));

  // Also create trigger_signals entries for each detected signal so they appear in the main Signals feed
  for (const signal of detectedSignals) {
    await db.insert(triggerSignals).values({
      userId: monitor.userId,
      signalType: mapSignalType(signal.type),
      title: `[${monitor.companyName}] ${signal.title}`,
      description: signal.summary + (signal.autoEmailSent ? "\n\n✅ Congratulations email sent automatically." : ""),
      sourceUrl: finalUrl,
      sourcePlatform: "website_monitor",
      companyName: monitor.companyName,
      status: "new",
      priority: signal.confidence >= 0.85 ? "high" : "medium",
      metadata: {
        signalType: signal.type,
        confidence: signal.confidence,
        sourceText: signal.sourceText,
        autoEmailSent: signal.autoEmailSent,
        monitorId: monitor.id,
        crawlResultId: (crawlResult as any).insertId ?? 0,
      },
      createdAt: now,
    });
  }

  return {
    signalsFound: detectedSignals.length,
    crawlResultId: (crawlResult as any).insertId ?? 0,
  };
}

function mapSignalType(type: string): string {
  const map: Record<string, string> = {
    award: "news_mention",
    expansion: "expansion",
    funding: "funding_round",
    new_hire: "job_change",
    partnership: "news_mention",
    product_launch: "news_mention",
    milestone: "news_mention",
    certification: "news_mention",
    community: "news_mention",
    other_positive: "news_mention",
  };
  return map[type] || "news_mention";
}

// ─── tRPC Router ──────────────────────────────────────────────────────────────
async function getDbOrThrow() {
  const db = await getDb();
  return db;
}

export const websiteMonitorRouter = router({
  // List all monitors for current tenant
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDbOrThrow();
    const monitors = await db.select().from(websiteMonitors)
      .where(eq(websiteMonitors.tenantId, ctx.user.tenantCompanyId ?? 0))
      .orderBy(desc(websiteMonitors.createdAt));
    return monitors;
  }),

  // Get a single monitor with recent crawl results
  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDbOrThrow();
    const [monitor] = await db.select().from(websiteMonitors)
      .where(and(
        eq(websiteMonitors.id, input.id),
        eq(websiteMonitors.tenantId, ctx.user.tenantCompanyId ?? 0)
      ));
    if (!monitor) throw new TRPCError({ code: "NOT_FOUND" });

    const crawlHistory = await db.select().from(websiteCrawlResults)
      .where(eq(websiteCrawlResults.monitorId, input.id))
      .orderBy(desc(websiteCrawlResults.crawledAt))
      .limit(20);

    return { monitor, crawlHistory };
  }),

  // Create a new website monitor
  create: protectedProcedure.input(z.object({
    companyId: z.number().optional(),
    companyName: z.string().min(1),
    websiteUrl: z.string().url(),
    checkFrequency: z.enum(["daily", "weekly"]).default("daily"),
    autoEmailEnabled: z.boolean().default(false),
    autoEmailToContactId: z.number().optional(),
    autoEmailFromName: z.string().optional(),
    autoEmailFromAddress: z.string().email().optional(),
    signalFilters: z.array(z.string()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDbOrThrow();
    const now = Date.now();
    const [result] = await db.insert(websiteMonitors).values({
      userId: ctx.user.id,
      tenantId: ctx.user.tenantCompanyId ?? 0,
      companyId: input.companyId,
      companyName: input.companyName,
      websiteUrl: input.websiteUrl,
      isActive: 1,
      checkFrequency: input.checkFrequency,
      autoEmailEnabled: input.autoEmailEnabled ? 1 : 0,
      autoEmailToContactId: input.autoEmailToContactId,
      autoEmailFromName: input.autoEmailFromName,
      autoEmailFromAddress: input.autoEmailFromAddress,
      signalFilters: input.signalFilters ?? [],
      totalSignalsFound: 0,
      createdAt: now,
      updatedAt: now,
    });
    return { id: (result as any).insertId, success: true };
  }),

  // Update monitor settings
  update: protectedProcedure.input(z.object({
    id: z.number(),
    isActive: z.boolean().optional(),
    checkFrequency: z.enum(["daily", "weekly"]).optional(),
    autoEmailEnabled: z.boolean().optional(),
    autoEmailToContactId: z.number().optional().nullable(),
    autoEmailFromName: z.string().optional(),
    autoEmailFromAddress: z.string().email().optional(),
    signalFilters: z.array(z.string()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDbOrThrow();
    const { id, ...updates } = input;
    const setData: Record<string, any> = { updatedAt: Date.now() };
    if (updates.isActive !== undefined) setData.isActive = updates.isActive ? 1 : 0;
    if (updates.checkFrequency !== undefined) setData.checkFrequency = updates.checkFrequency;
    if (updates.autoEmailEnabled !== undefined) setData.autoEmailEnabled = updates.autoEmailEnabled ? 1 : 0;
    if (updates.autoEmailToContactId !== undefined) setData.autoEmailToContactId = updates.autoEmailToContactId;
    if (updates.autoEmailFromName !== undefined) setData.autoEmailFromName = updates.autoEmailFromName;
    if (updates.autoEmailFromAddress !== undefined) setData.autoEmailFromAddress = updates.autoEmailFromAddress;
    if (updates.signalFilters !== undefined) setData.signalFilters = updates.signalFilters;

    await db.update(websiteMonitors)
      .set(setData)
      .where(and(
        eq(websiteMonitors.id, id),
        eq(websiteMonitors.tenantId, ctx.user.tenantCompanyId ?? 0)
      ));
    return { success: true };
  }),

  // Delete a monitor
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDbOrThrow();
    await db.delete(websiteMonitors)
      .where(and(
        eq(websiteMonitors.id, input.id),
        eq(websiteMonitors.tenantId, ctx.user.tenantCompanyId ?? 0)
      ));
    return { success: true };
  }),

  // Manually trigger a crawl for a specific monitor
  triggerCrawl: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDbOrThrow();
    const [monitor] = await db.select().from(websiteMonitors)
      .where(and(
        eq(websiteMonitors.id, input.id),
        eq(websiteMonitors.tenantId, ctx.user.tenantCompanyId ?? 0)
      ));
    if (!monitor) throw new TRPCError({ code: "NOT_FOUND" });

    const result = await crawlMonitor({
      id: monitor.id,
      userId: monitor.userId,
      tenantId: monitor.tenantId,
      companyName: monitor.companyName,
      websiteUrl: monitor.websiteUrl,
      autoEmailEnabled: monitor.autoEmailEnabled,
      autoEmailFromName: monitor.autoEmailFromName,
      autoEmailFromAddress: monitor.autoEmailFromAddress,
      signalFilters: monitor.signalFilters as string[] | null,
    });

    return result;
  }),

  // Get crawl history for a monitor
  crawlHistory: protectedProcedure.input(z.object({
    monitorId: z.number(),
    limit: z.number().default(20),
  })).query(async ({ ctx, input }) => {
    const db = await getDbOrThrow();
    // Verify ownership
    const [monitor] = await db.select({ id: websiteMonitors.id }).from(websiteMonitors)
      .where(and(
        eq(websiteMonitors.id, input.monitorId),
        eq(websiteMonitors.tenantId, ctx.user.tenantCompanyId ?? 0)
      ));
    if (!monitor) throw new TRPCError({ code: "NOT_FOUND" });

    return db.select().from(websiteCrawlResults)
      .where(eq(websiteCrawlResults.monitorId, input.monitorId))
      .orderBy(desc(websiteCrawlResults.crawledAt))
      .limit(input.limit);
  }),

  // Get summary stats for the current tenant
  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDbOrThrow();
    const monitors = await db.select().from(websiteMonitors)
      .where(eq(websiteMonitors.tenantId, ctx.user.tenantCompanyId ?? 0));

    const totalMonitors = monitors.length;
    const activeMonitors = monitors.filter(m => m.isActive).length;
    const totalSignals = monitors.reduce((sum, m) => sum + (m.totalSignalsFound ?? 0), 0);
    const autoEmailMonitors = monitors.filter(m => m.autoEmailEnabled).length;

    return { totalMonitors, activeMonitors, totalSignals, autoEmailMonitors };
  }),

  // Run daily crawl for all active monitors in a tenant (called by AI Engine)
  runDailyCrawl: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDbOrThrow();
    const activeMonitors = await db.select().from(websiteMonitors)
      .where(and(
        eq(websiteMonitors.tenantId, ctx.user.tenantCompanyId ?? 0),
        eq(websiteMonitors.isActive, 1)
      ));

    const results = [];
    for (const monitor of activeMonitors) {
      try {
        const result = await crawlMonitor({
          id: monitor.id,
          userId: monitor.userId,
          tenantId: monitor.tenantId,
          companyName: monitor.companyName,
          websiteUrl: monitor.websiteUrl,
          autoEmailEnabled: monitor.autoEmailEnabled,
          autoEmailFromName: monitor.autoEmailFromName,
          autoEmailFromAddress: monitor.autoEmailFromAddress,
          signalFilters: monitor.signalFilters as string[] | null,
        });
        results.push({ monitorId: monitor.id, ...result, success: true });
      } catch (e: any) {
        results.push({ monitorId: monitor.id, success: false, error: e.message });
      }
    }

    return { crawled: results.length, results };
  }),
});
