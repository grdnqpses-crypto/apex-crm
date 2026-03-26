import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { portalTokens, portalComments, portalDocuments, contacts, deals } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { storagePut } from "../storage";

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export const portalRouter = router({
  // ─── Owner-side: manage portal tokens ───────────────────────────────────────

  // List all portal tokens created by this user
  listTokens: protectedProcedure.query(async ({ ctx }) => {
    const drizzle = await getDb();
    if (!drizzle) return [];
    return drizzle.select().from(portalTokens)
      .where(eq(portalTokens.userId, ctx.user.id))
      .orderBy(desc(portalTokens.createdAt));
  }),

  // Create a new portal token for a contact/deal
  createToken: protectedProcedure
    .input(z.object({
      contactId: z.number().optional(),
      dealId: z.number().optional(),
      label: z.string().optional(),
      expiresInDays: z.number().min(1).max(365).default(30),
    }))
    .mutation(async ({ ctx, input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const token = generateToken();
      const expiresAt = Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000;
      const [result] = await drizzle.insert(portalTokens).values({
        userId: ctx.user.id,
        token,
        contactId: input.contactId,
        dealId: input.dealId,
        label: input.label,
        expiresAt,
        isActive: 1,
        createdAt: Date.now(),
      });
      return { token, expiresAt, id: (result as any).insertId };
    }),

  // Deactivate a portal token
  revokeToken: protectedProcedure
    .input(z.object({ tokenId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await drizzle.update(portalTokens)
        .set({ isActive: 0 })
        .where(and(
          eq(portalTokens.id, input.tokenId),
          eq(portalTokens.userId, ctx.user.id)
        ));
      return { success: true };
    }),

  // Get documents uploaded to a portal token
  listDocuments: protectedProcedure
    .input(z.object({ tokenId: z.number() }))
    .query(async ({ ctx, input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [token] = await drizzle.select().from(portalTokens)
        .where(and(eq(portalTokens.id, input.tokenId), eq(portalTokens.userId, ctx.user.id)))
        .limit(1);
      if (!token) throw new TRPCError({ code: "NOT_FOUND" });
      return drizzle.select().from(portalDocuments)
        .where(eq(portalDocuments.portalTokenId!, input.tokenId))
        .orderBy(desc(portalDocuments.createdAt));
    }),

  // Get comments on a portal token
  listComments: protectedProcedure
    .input(z.object({ tokenId: z.number() }))
    .query(async ({ ctx, input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [token] = await drizzle.select().from(portalTokens)
        .where(and(eq(portalTokens.id, input.tokenId), eq(portalTokens.userId, ctx.user.id)))
        .limit(1);
      if (!token) throw new TRPCError({ code: "NOT_FOUND" });
      return drizzle.select().from(portalComments)
        .where(eq(portalComments.portalTokenId!, input.tokenId))
        .orderBy(desc(portalComments.createdAt));
    }),

  // Owner replies to a comment
  addOwnerComment: protectedProcedure
    .input(z.object({ tokenId: z.number(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [token] = await drizzle.select().from(portalTokens)
        .where(and(eq(portalTokens.id, input.tokenId), eq(portalTokens.userId, ctx.user.id)))
        .limit(1);
      if (!token) throw new TRPCError({ code: "NOT_FOUND" });
      await drizzle.insert(portalComments).values({
        tenantId: ctx.user.id,
        portalAccessId: 0,
        portalTokenId: input.tokenId,
        body: input.content,
        authorType: "rep",
        authorName: ctx.user.name,
        createdAt: Date.now(),
      });
      return { success: true };
    }),

  // ─── Public: contact accesses their portal via token ────────────────────────

  // Get portal data by token (public — no auth required)
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [portalToken] = await drizzle.select().from(portalTokens)
        .where(eq(portalTokens.token, input.token))
        .limit(1);

      if (!portalToken) throw new TRPCError({ code: "NOT_FOUND", message: "Portal link not found." });
      if (!portalToken.isActive) throw new TRPCError({ code: "FORBIDDEN", message: "This portal link has been deactivated." });
      if (portalToken.expiresAt && portalToken.expiresAt < Date.now()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This portal link has expired." });
      }

      // Update access count and last accessed
      await drizzle.update(portalTokens)
        .set({ lastAccessedAt: Date.now(), accessCount: (portalToken.accessCount || 0) + 1 })
        .where(eq(portalTokens.id, portalToken.id));

      // Fetch related data
      let contact = null;
      let deal = null;

      if (portalToken.contactId) {
        const [c] = await drizzle.select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          email: contacts.email,
          jobTitle: contacts.jobTitle,
        }).from(contacts).where(eq(contacts.id, portalToken.contactId)).limit(1);
        contact = c || null;
      }

      if (portalToken.dealId) {
        const [d] = await drizzle.select({
          id: deals.id,
          name: deals.name,
          value: deals.value,
          status: deals.status,
          priority: deals.priority,
          expectedCloseDate: deals.expectedCloseDate,
          notes: deals.notes,
        }).from(deals).where(eq(deals.id, portalToken.dealId)).limit(1);
        deal = d || null;
      }

      // Fetch documents and comments
      const docs = await drizzle.select().from(portalDocuments)
        .where(eq(portalDocuments.portalTokenId!, portalToken.id))
        .orderBy(desc(portalDocuments.createdAt));

      const comments = await drizzle.select().from(portalComments)
        .where(eq(portalComments.portalTokenId!, portalToken.id))
        .orderBy(desc(portalComments.createdAt));

      return {
        tokenId: portalToken.id,
        label: portalToken.label,
        contact,
        deal,
        documents: docs,
        comments,
      };
    }),

  // Contact uploads a document via token
  uploadDocument: publicProcedure
    .input(z.object({
      token: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
      base64Data: z.string(),
      fileSize: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [portalToken] = await drizzle.select().from(portalTokens)
        .where(eq(portalTokens.token, input.token))
        .limit(1);
      if (!portalToken || !portalToken.isActive) throw new TRPCError({ code: "FORBIDDEN" });
      if (portalToken.expiresAt && portalToken.expiresAt < Date.now()) throw new TRPCError({ code: "FORBIDDEN" });

      const buffer = Buffer.from(input.base64Data, "base64");
      const suffix = randomBytes(4).toString("hex");
      const key = `portal-docs/${portalToken.userId}/${portalToken.id}/${suffix}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.mimeType);

      await drizzle.insert(portalDocuments).values({
        tenantId: portalToken.userId,
        portalAccessId: 0,
        portalTokenId: portalToken.id,
        fileName: input.fileName,
        fileUrl: url,
        fileKey: key,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        uploadedBy: "customer",
        createdAt: Date.now(),
      });

      return { success: true, url };
    }),

  // Contact posts a comment via token
  addContactComment: publicProcedure
    .input(z.object({
      token: z.string(),
      content: z.string().min(1).max(2000),
      authorName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [portalToken] = await drizzle.select().from(portalTokens)
        .where(eq(portalTokens.token, input.token))
        .limit(1);
      if (!portalToken || !portalToken.isActive) throw new TRPCError({ code: "FORBIDDEN" });
      if (portalToken.expiresAt && portalToken.expiresAt < Date.now()) throw new TRPCError({ code: "FORBIDDEN" });

      await drizzle.insert(portalComments).values({
        tenantId: portalToken.userId,
        portalAccessId: 0,
        portalTokenId: portalToken.id,
        body: input.content,
        authorType: "customer",
        authorName: input.authorName || "Guest",
        createdAt: Date.now(),
      });

      return { success: true };
    }),
});
