/**
 * Inbox Router
 * Handles email inbox operations: fetch emails, mark as read, etc.
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const inboxRouter = router({
  /**
   * Get inbox emails for the current user
   */
  getEmails: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
      direction: z.enum(["inbound", "outbound", "all"]).default("all"),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Get emails for the current user
        const emails = await db.query.emailSyncMessages.findMany({
          where: (table, { eq, and }) => {
            const conditions = [eq(table.userId, ctx.user.id)];
            if (input.direction !== "all") {
              conditions.push(eq(table.direction, input.direction));
            }
            return and(...conditions);
          },
          limit: input.limit,
          offset: input.offset,
          orderBy: (table, { desc }) => [desc(table.sentAt)],
        });

        return {
          emails: emails.map(email => ({
            id: email.id,
            messageId: email.messageId,
            threadId: email.threadId,
            subject: email.subject,
            from: email.fromAddress,
            to: email.toAddresses,
            cc: email.ccAddresses,
            bodyText: email.bodyText,
            bodyHtml: email.bodyHtml,
            direction: email.direction,
            sentAt: email.sentAt,
            isRead: email.isRead === 1,
            hasAttachments: email.hasAttachments === 1,
            labels: email.labels,
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
   * Mark email as read
   */
  markAsRead: protectedProcedure
    .input(z.object({
      emailId: z.number(),
      isRead: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify email belongs to user
        const email = await db.query.emailSyncMessages.findFirst({
          where: (table, { eq, and }) =>
            and(eq(table.id, input.emailId), eq(table.userId, ctx.user.id)),
        });

        if (!email) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Email not found",
          });
        }

        // Update read status
        await db.emailSyncMessages.update({
          set: { isRead: input.isRead ? 1 : 0 },
          where: { id: input.emailId },
        });

        return { success: true };
      } catch (error) {
        console.error("[Inbox] Error marking email as read:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update email status",
        });
      }
    }),

  /**
   * Get email accounts connected to the user
   */
  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    try {
      const accounts = await db.query.emailSyncAccounts.findMany({
        where: (table, { eq }) => eq(table.userId, ctx.user.id),
      });

      return accounts.map(account => ({
        id: account.id,
        email: account.email,
        provider: account.provider,
        syncEnabled: account.syncEnabled === 1,
        lastSyncedAt: account.lastSyncedAt,
        syncStatus: account.syncStatus,
        errorMessage: account.errorMessage,
      }));
    } catch (error) {
      console.error("[Inbox] Error fetching accounts:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch email accounts",
      });
    }
  }),

  /**
   * Get email statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Count unread emails
      const unreadEmails = await db.query.emailSyncMessages.findMany({
        where: (table, { eq, and }) =>
          and(eq(table.userId, ctx.user.id), eq(table.isRead, 0)),
      });

      // Count total emails
      const totalEmails = await db.query.emailSyncMessages.findMany({
        where: (table, { eq }) => eq(table.userId, ctx.user.id),
      });

      // Count inbound emails
      const inboundEmails = await db.query.emailSyncMessages.findMany({
        where: (table, { eq, and }) =>
          and(eq(table.userId, ctx.user.id), eq(table.direction, "inbound")),
      });

      return {
        unreadCount: unreadEmails.length,
        totalCount: totalEmails.length,
        inboundCount: inboundEmails.length,
      };
    } catch (error) {
      console.error("[Inbox] Error fetching stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch email statistics",
      });
    }
  }),
});
