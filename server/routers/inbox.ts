/**
 * Inbox Router - Minimal Implementation
 * Handles email inbox operations
 */

import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const inboxRouter = router({
  /**
   * Get inbox emails for the current user
   * Returns: id, subject, from, to, body, createdAt
   */
  getEmails: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Get emails for the current user
        const emails = await db.query.emailSyncMessages.findMany({
          where: (table, { eq }) => eq(table.userId, ctx.user.id),
          limit: input.limit,
          offset: input.offset,
          orderBy: (table, { desc }) => [desc(table.sentAt)],
        });

        return {
          emails: emails.map(email => ({
            id: email.id,
            subject: email.subject,
            from: email.fromAddress,
            to: email.toAddresses,
            body: email.bodyText,
            createdAt: email.sentAt,
          })),
          total: emails.length,
        };
      } catch (error) {
        console.error("[Inbox] Error fetching emails:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch emails",
        });
      }
    }),

  /**
   * Test endpoint: Get emails for a specific user (for verification)
   * Input: userId
   * Returns: emails for that user
   */
  getEmailsForUser: publicProcedure
    .input(z.object({
      userId: z.number(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      try {
        console.log(`[Inbox] Fetching emails for user ${input.userId}...`);
        const emails = await db.query.emailSyncMessages.findMany({
          where: (table, { eq }) => eq(table.userId, input.userId),
          limit: input.limit,
          offset: input.offset,
          orderBy: (table, { desc }) => [desc(table.sentAt)],
        });

        console.log(`[Inbox] Found ${emails.length} emails for user ${input.userId}`);
        return {
          emails: emails.map(email => ({
            id: email.id,
            subject: email.subject,
            from: email.fromAddress,
            to: email.toAddresses,
            body: email.bodyText,
            createdAt: email.sentAt,
            userId: email.userId,
            direction: email.direction,
          })),
          total: emails.length,
        };
      } catch (error) {
        console.error("[Inbox] Error fetching emails for user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch emails",
        });
      }
    }),
});
