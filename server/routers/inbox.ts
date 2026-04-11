/**
 * Inbox Router - Minimal Implementation
 * Handles email inbox operations
 */

import { router, protectedProcedure } from "../_core/trpc";
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
    }).optional())
    .query(async ({ ctx, input }) => {
      try {
        // Handle optional input
        const limit = input?.limit ?? 50;
        const offset = input?.offset ?? 0;
        
        // Get emails for the current user
        const emails = await db.query.emailSyncMessages.findMany({
          where: (table, { eq }) => eq(table.userId, ctx.user.id),
          limit: limit,
          offset: offset,
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
});
