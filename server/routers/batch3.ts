/**
 * Batch 3 — Competitive Audit Features
 * Features: Web Forms Builder, E-Signature, Reputation Management,
 *           AI Out-of-Office Detection
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  webForms, formSubmissions,
  esignatureDocuments, esignatureSigners,
  reputationReviews,
  oooDetections,
  contacts,
} from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";

const now = () => Date.now();

// Web Forms Builder

const webFormsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const dbConn = await db.getDb();
    if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const tenantId = ctx.user.tenantCompanyId ?? 0;
    return dbConn.select().from(webForms)
      .where(eq(webForms.tenantCompanyId, tenantId))
      .orderBy(desc(webForms.createdAt));
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      fields: z.array(z.object({
        id: z.string(),
        type: z.enum(["text", "email", "phone", "textarea", "select", "checkbox", "date", "number"]),
        label: z.string(),
        placeholder: z.string().optional(),
        required: z.boolean().default(false),
        options: z.array(z.string()).optional(),
      })),
      settings: z.object({
        submitButtonText: z.string().default("Submit"),
        successMessage: z.string().default("Thank you for your submission!"),
        redirectUrl: z.string().optional(),
        notifyEmail: z.string().optional(),
        createContact: z.boolean().default(true),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      const ts = now();
      const [result] = await dbConn.insert(webForms).values({
        tenantCompanyId: tenantId,
        name: input.name,
        description: input.description ?? null,
        fields: input.fields as Record<string, unknown>[],
        settings: (input.settings ?? {}) as Record<string, unknown>,
        embedCode: "",
        isActive: true,
        submissionCount: 0,
        createdAt: ts,
        updatedAt: ts,
      });
      const insertId = (result as unknown as { insertId: number }).insertId;
      const embedCode = `<script src="https://app.axiomcrm.com/forms/embed.js" data-form-id="${insertId}"></script>`;
      await dbConn.update(webForms).set({ embedCode }).where(eq(webForms.id, insertId));
      return { id: insertId, embedCode };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      fields: z.array(z.any()).optional(),
      settings: z.record(z.string(), z.unknown()).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      const { id, ...updates } = input;
      const updateData: Record<string, unknown> = { updatedAt: now() };
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.fields !== undefined) updateData.fields = updates.fields;
      if (updates.settings !== undefined) updateData.settings = updates.settings;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      await dbConn.update(webForms).set(updateData as never)
        .where(and(eq(webForms.id, id), eq(webForms.tenantCompanyId, tenantId)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      await dbConn.delete(webForms)
        .where(and(eq(webForms.id, input.id), eq(webForms.tenantCompanyId, tenantId)));
      return { success: true };
    }),

  getSubmissions: protectedProcedure
    .input(z.object({ formId: z.number(), limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      const items = await dbConn.select().from(formSubmissions)
        .where(and(eq(formSubmissions.formId, input.formId), eq(formSubmissions.tenantCompanyId, tenantId)))
        .orderBy(desc(formSubmissions.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      const [{ total }] = await dbConn.select({ total: sql<number>`COUNT(*)` }).from(formSubmissions)
        .where(and(eq(formSubmissions.formId, input.formId), eq(formSubmissions.tenantCompanyId, tenantId)));
      return { items, total };
    }),
});

// E-Signature

const eSignatureRouter = router({
  listDocuments: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      const conditions = [eq(esignatureDocuments.tenantCompanyId, tenantId)];
      if (input.status) {
        conditions.push(eq(esignatureDocuments.status, input.status as "draft" | "sent" | "completed" | "voided" | "expired"));
      }
      const items = await dbConn.select().from(esignatureDocuments)
        .where(and(...conditions))
        .orderBy(desc(esignatureDocuments.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      const [{ total }] = await dbConn.select({ total: sql<number>`COUNT(*)` }).from(esignatureDocuments)
        .where(and(...conditions));
      return { items, total };
    }),

  createDocument: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      signers: z.array(z.object({ name: z.string(), email: z.string().email() })),
      dealId: z.number().optional(),
      contactId: z.number().optional(),
      expiresInDays: z.number().default(30),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      const ts = now();
      const expiresAt = ts + input.expiresInDays * 24 * 60 * 60 * 1000;
      const [docResult] = await dbConn.insert(esignatureDocuments).values({
        tenantCompanyId: tenantId,
        title: input.title,
        content: input.content,
        status: "draft",
        dealId: input.dealId ?? null,
        contactId: input.contactId ?? null,
        createdBy: ctx.user.id,
        expiresAt,
        createdAt: ts,
        updatedAt: ts,
      });
      const docId = (docResult as unknown as { insertId: number }).insertId;
      for (const signer of input.signers) {
        const token = `sig_${Math.random().toString(36).slice(2)}_${Date.now()}`;
        await dbConn.insert(esignatureSigners).values({
          documentId: docId,
          name: signer.name,
          email: signer.email,
          token,
          status: "pending",
          createdAt: ts,
        });
      }
      return { id: docId };
    }),

  sendDocument: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      await dbConn.update(esignatureDocuments)
        .set({ status: "sent", updatedAt: now() })
        .where(and(eq(esignatureDocuments.id, input.id), eq(esignatureDocuments.tenantCompanyId, tenantId)));
      return { success: true };
    }),

  voidDocument: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      await dbConn.update(esignatureDocuments)
        .set({ status: "voided", updatedAt: now() })
        .where(and(eq(esignatureDocuments.id, input.id), eq(esignatureDocuments.tenantCompanyId, tenantId)));
      return { success: true };
    }),

  getSigners: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return dbConn.select().from(esignatureSigners)
        .where(eq(esignatureSigners.documentId, input.documentId));
    }),

  aiDraftDocument: protectedProcedure
    .input(z.object({
      type: z.enum(["nda", "proposal", "contract", "sow", "msa"]),
      companyName: z.string(),
      contactName: z.string(),
      dealValue: z.number().optional(),
      customInstructions: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const typeLabels: Record<string, string> = {
        nda: "Non-Disclosure Agreement",
        proposal: "Business Proposal",
        contract: "Service Contract",
        sow: "Statement of Work",
        msa: "Master Service Agreement",
      };
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a professional legal document drafter. Generate clean, professional documents in HTML format suitable for e-signature. Use placeholders like [SIGNATURE] and [DATE] where signatures are needed." },
          { role: "user", content: `Draft a ${typeLabels[input.type]} for ${input.companyName}, attention ${input.contactName}${input.dealValue ? `, deal value $${input.dealValue.toLocaleString()}` : ""}. ${input.customInstructions ?? ""}. Return only the HTML document body content, no markdown wrappers.` },
        ],
      });
      const content = (response as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]?.message?.content ?? "";
      return { content: typeof content === "string" ? content : JSON.stringify(content) };
    }),
});

// Reputation Management

const reputationRouter = router({
  list: protectedProcedure
    .input(z.object({
      platform: z.string().optional(),
      sentiment: z.string().optional(),
      responded: z.boolean().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      const conditions = [eq(reputationReviews.tenantCompanyId, tenantId)];
      if (input.platform) conditions.push(eq(reputationReviews.platform, input.platform));
      if (input.sentiment) conditions.push(eq(reputationReviews.sentiment, input.sentiment as "positive" | "neutral" | "negative"));
      if (input.responded !== undefined) conditions.push(eq(reputationReviews.responded, input.responded));
      const items = await dbConn.select().from(reputationReviews)
        .where(and(...conditions))
        .orderBy(desc(reputationReviews.reviewDate))
        .limit(input.limit)
        .offset(input.offset);
      const [stats] = await dbConn.select({
        total: sql<number>`COUNT(*)`,
        avgRating: sql<number>`AVG(rating)`,
        positiveCount: sql<number>`SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END)`,
        neutralCount: sql<number>`SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END)`,
        negativeCount: sql<number>`SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END)`,
      }).from(reputationReviews).where(eq(reputationReviews.tenantCompanyId, tenantId));
      return {
        items,
        total: Number(stats?.total ?? 0),
        avgRating: Number(stats?.avgRating ?? 0),
        positiveCount: Number(stats?.positiveCount ?? 0),
        neutralCount: Number(stats?.neutralCount ?? 0),
        negativeCount: Number(stats?.negativeCount ?? 0),
      };
    }),

  addReview: protectedProcedure
    .input(z.object({
      platform: z.string(),
      reviewerName: z.string().optional(),
      rating: z.number().min(1).max(5).optional(),
      reviewText: z.string().optional(),
      reviewUrl: z.string().optional(),
      reviewDate: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      const ts = now();
      let sentiment: "positive" | "neutral" | "negative" = "neutral";
      if (input.reviewText) {
        try {
          const res = await invokeLLM({
            messages: [
              { role: "system", content: "Classify the sentiment of this review as exactly one word: positive, neutral, or negative." },
              { role: "user", content: input.reviewText },
            ],
          });
          const raw = ((res as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ?? "").toLowerCase().trim();
          if (raw.includes("positive")) sentiment = "positive";
          else if (raw.includes("negative")) sentiment = "negative";
          else sentiment = "neutral";
        } catch { /* fallback */ }
      } else if (input.rating) {
        sentiment = input.rating >= 4 ? "positive" : input.rating <= 2 ? "negative" : "neutral";
      }
      const [result] = await dbConn.insert(reputationReviews).values({
        tenantCompanyId: tenantId,
        platform: input.platform,
        reviewerName: input.reviewerName ?? null,
        rating: input.rating ?? null,
        reviewText: input.reviewText ?? null,
        reviewUrl: input.reviewUrl ?? null,
        sentiment,
        responded: false,
        reviewDate: input.reviewDate ?? ts,
        createdAt: ts,
      });
      if (sentiment === "negative") {
        await notifyOwner({
          title: `New Negative Review on ${input.platform}`,
          content: `${input.reviewerName ?? "Anonymous"} left a ${input.rating ?? "?"}-star review: "${(input.reviewText ?? "").slice(0, 200)}"`,
        }).catch(() => {});
      }
      return { id: (result as unknown as { insertId: number }).insertId, sentiment };
    }),

  aiGenerateResponse: protectedProcedure
    .input(z.object({
      reviewId: z.number(),
      tone: z.enum(["professional", "friendly", "apologetic", "grateful"]).default("professional"),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      const [review] = await dbConn.select().from(reputationReviews)
        .where(and(eq(reputationReviews.id, input.reviewId), eq(reputationReviews.tenantCompanyId, tenantId)));
      if (!review) throw new TRPCError({ code: "NOT_FOUND" });
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `You are a professional customer service representative. Write a ${input.tone} response to this ${review.platform} review. Keep it concise (2-3 sentences), genuine, and avoid generic phrases.` },
          { role: "user", content: `Review (${review.rating ?? "?"} stars): "${review.reviewText ?? "No text provided"}"` },
        ],
      });
      const responseText = (response as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ?? "";
      return { responseText: typeof responseText === "string" ? responseText : JSON.stringify(responseText) };
    }),

  respondToReview: protectedProcedure
    .input(z.object({ id: z.number(), responseText: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      await dbConn.update(reputationReviews)
        .set({ responded: true, responseText: input.responseText })
        .where(and(eq(reputationReviews.id, input.id), eq(reputationReviews.tenantCompanyId, tenantId)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      await dbConn.delete(reputationReviews)
        .where(and(eq(reputationReviews.id, input.id), eq(reputationReviews.tenantCompanyId, tenantId)));
      return { success: true };
    }),
});

// AI Out-of-Office Detection

const oooDetectionRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      const items = await dbConn.select({
        id: oooDetections.id,
        tenantCompanyId: oooDetections.tenantCompanyId,
        contactId: oooDetections.contactId,
        email: oooDetections.email,
        detectedAt: oooDetections.detectedAt,
        returnDate: oooDetections.returnDate,
        oooMessage: oooDetections.oooMessage,
        followUpScheduled: oooDetections.followUpScheduled,
        followUpDate: oooDetections.followUpDate,
        createdAt: oooDetections.createdAt,
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
      }).from(oooDetections)
        .leftJoin(contacts, eq(contacts.id, oooDetections.contactId))
        .where(eq(oooDetections.tenantCompanyId, tenantId))
        .orderBy(desc(oooDetections.detectedAt))
        .limit(input.limit)
        .offset(input.offset);
      const [{ total }] = await dbConn.select({ total: sql<number>`COUNT(*)` }).from(oooDetections)
        .where(eq(oooDetections.tenantCompanyId, tenantId));
      return { items, total };
    }),

  detectFromEmail: protectedProcedure
    .input(z.object({
      emailBody: z.string(),
      senderEmail: z.string(),
      contactId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      const response = await invokeLLM({
        messages: [
          { role: "system", content: 'Analyze this email and determine if it is an out-of-office auto-reply. Respond with JSON: {"isOOO": boolean, "returnDate": "YYYY-MM-DD or null", "summary": "brief summary"}' },
          { role: "user", content: input.emailBody },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ooo_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                isOOO: { type: "boolean" },
                returnDate: { type: "string" },
                summary: { type: "string" },
              },
              required: ["isOOO", "returnDate", "summary"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = (response as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content)) as { isOOO: boolean; returnDate: string; summary: string };
      if (parsed.isOOO) {
        const ts = now();
        const returnDate = parsed.returnDate && parsed.returnDate !== "null"
          ? new Date(parsed.returnDate).getTime()
          : null;
        await dbConn.insert(oooDetections).values({
          tenantCompanyId: tenantId,
          contactId: input.contactId ?? null,
          email: input.senderEmail,
          detectedAt: ts,
          returnDate,
          oooMessage: parsed.summary,
          followUpScheduled: false,
          createdAt: ts,
        });
        await notifyOwner({
          title: `Out-of-Office Detected: ${input.senderEmail}`,
          content: `${input.senderEmail} is out of office${parsed.returnDate && parsed.returnDate !== "null" ? `, returning ${parsed.returnDate}` : ""}. ${parsed.summary}`,
        }).catch(() => {});
      }
      return parsed;
    }),

  scheduleFollowUp: protectedProcedure
    .input(z.object({ id: z.number(), followUpDate: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      await dbConn.update(oooDetections)
        .set({ followUpScheduled: true, followUpDate: input.followUpDate })
        .where(and(eq(oooDetections.id, input.id), eq(oooDetections.tenantCompanyId, tenantId)));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tenantId = ctx.user.tenantCompanyId ?? 0;
      await dbConn.delete(oooDetections)
        .where(and(eq(oooDetections.id, input.id), eq(oooDetections.tenantCompanyId, tenantId)));
      return { success: true };
    }),
});

// Batch 3 Router

export const batch3Router = router({
  webForms: webFormsRouter,
  eSignature: eSignatureRouter,
  reputation: reputationRouter,
  oooDetection: oooDetectionRouter,
});

// Export individual sub-routers for flat registration in appRouter
export { webFormsRouter, eSignatureRouter, reputationRouter, oooDetectionRouter };
