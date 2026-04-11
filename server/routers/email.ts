/**
 * Email Router - SMTP Email Sending
 * Sends real emails using configured SMTP provider
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { EmailService } from "../email-service";

export const emailRouter = router({
  /**
   * Send test email via SMTP
   * Input: to, subject, body
   * Returns: messageId and success status
   */
  sendTestEmail: protectedProcedure
    .input(z.object({
      to: z.string().email(),
      subject: z.string().min(1),
      body: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      try {
        // Get SMTP configuration from environment variables
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        const smtpFrom = process.env.SMTP_FROM || smtpUser;

        if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "SMTP configuration incomplete",
          });
        }

        // Initialize EmailService with SMTP config
        const emailService = new EmailService({
          provider: "smtp",
          smtpHost,
          smtpPort,
          smtpUsername: smtpUser,
          smtpPassword: smtpPass,
          smtpTls: true,
        });

        // Send email
        const result = await emailService.send({
          to: input.to,
          from: smtpFrom,
          subject: input.subject,
          html: input.body,
          text: input.body,
        });

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
          message: error instanceof Error ? error.message : "Failed to send email",
        });
      }
    }),
});
