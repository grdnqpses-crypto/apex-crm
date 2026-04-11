/**
 * Email Router - Resend API Email Sending with Database Storage
 * Sends real emails and stores them in the database
 */

import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { EmailService } from "../email-service";
import { getDb } from "../db";
import { emailSyncMessages } from "../../drizzle/schema";

export const emailRouter = router({
  /**
   * Send test email via Resend and store in database
   * Input: to, subject, body
   * Returns: messageId and success status
   */
  sendTestEmail: publicProcedure
    .input(z.object({
      to: z.string().email(),
      subject: z.string().min(1),
      body: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      try {
        // Get Resend API key from environment
        const resendApiKey = process.env.RESEND_API_KEY;
        const smtpFrom = process.env.SMTP_FROM || "noreply@example.com";

        if (!resendApiKey) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Resend API key not configured",
          });
        }

        // Initialize EmailService with Resend config
        const emailService = new EmailService({
          provider: "resend",
          resendApiKey,
        });

        // Send email via Resend
        const result = await emailService.send({
          to: input.to,
          from: smtpFrom,
          subject: input.subject,
          html: input.body,
          text: input.body,
        });

        // Store email in database
        try {
          const db = await getDb();
          const now = Date.now();
          await db.insert(emailSyncMessages).values({
            accountId: 1,
            userId: 0,
            contactId: null,
            companyId: null,
            messageId: result.id,
            threadId: result.id,
            subject: input.subject,
            fromAddress: smtpFrom,
            toAddresses: [input.to],
            ccAddresses: [],
            bodyText: input.body,
            bodyHtml: input.body,
            direction: "outbound",
            sentAt: now,
            isRead: 1,
            hasAttachments: 0,
            labels: ["sent"],
            syncedAt: now,
          });
        } catch (storageError) {
          console.error("[Email Router] Warning: Failed to store email in database:", storageError);
        }

        return {
          success: true,
          messageId: result.id,
          to: input.to,
          subject: input.subject,
        };
      } catch (error) {
        console.error("[Email Router] Error sending test email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Email send failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),
});
