/*
 * Campaign Email Router
 * Handles sending emails to campaign recipients with tracking
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { EmailService } from "../email-service";

export const campaignEmailRouter = router({
  /**
   * Send campaign email to a single recipient
   */
  sendCampaignEmail: protectedProcedure
    .input(z.object({
      campaignId: z.string(),
      recipientEmail: z.string().email(),
      recipientName: z.string().optional(),
      subject: z.string(),
      htmlBody: z.string(),
      textBody: z.string().optional(),
      senderEmail: z.string().email(),
      senderName: z.string().optional(),
      unsubscribeUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Get email provider config for user
        const emailConfig = await db.getEmailProviderConfig(ctx.user.id);
        if (!emailConfig) {
          throw new Error("No email provider configured");
        }

        // Create email service
        const emailService = new EmailService({
          provider: emailConfig.provider,
          smtpHost: emailConfig.smtpHost,
          smtpPort: emailConfig.smtpPort,
          smtpUsername: emailConfig.smtpUsername,
          smtpPassword: emailConfig.smtpPassword,
          smtpTls: emailConfig.smtpTls,
          resendApiKey: emailConfig.resendApiKey,
          sendgridApiKey: emailConfig.sendgridApiKey,
        });

        // Add unsubscribe link to email body
        let htmlBodyWithUnsubscribe = input.htmlBody;
        if (input.unsubscribeUrl) {
          htmlBodyWithUnsubscribe += `
            <hr style="margin-top: 40px; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
              <a href="${input.unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
            </p>
          `;
        }

        // Send email
        const result = await emailService.send({
          to: input.recipientEmail,
          from: input.senderEmail,
          subject: input.subject,
          html: htmlBodyWithUnsubscribe,
          text: input.textBody,
        });

        // Log email send
        await db.logEmailSend({
          campaignId: input.campaignId,
          recipientEmail: input.recipientEmail,
          messageId: result.id,
          status: "sent",
          sentAt: new Date(),
          userId: ctx.user.id,
        });

        return {
          success: true,
          messageId: result.id,
        };
      } catch (error) {
        console.error("[Campaign Email] Send error:", error);

        // Log failed send
        await db.logEmailSend({
          campaignId: input.campaignId,
          recipientEmail: input.recipientEmail,
          messageId: "unknown",
          status: "failed",
          sentAt: new Date(),
          userId: ctx.user.id,
          error: String(error),
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send campaign email: ${String(error)}`,
        });
      }
    }),

  /**
   * Send campaign to all recipients
   */
  sendCampaignToAll: protectedProcedure
    .input(z.object({
      campaignId: z.string(),
      subject: z.string(),
      htmlBody: z.string(),
      textBody: z.string().optional(),
      senderEmail: z.string().email(),
      senderName: z.string().optional(),
      recipientSegmentId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Get campaign recipients
        const recipients = await db.getCampaignRecipients(input.campaignId, input.recipientSegmentId);

        if (recipients.length === 0) {
          throw new Error("No recipients found for campaign");
        }

        // Get email provider config
        const emailConfig = await db.getEmailProviderConfig(ctx.user.id);
        if (!emailConfig) {
          throw new Error("No email provider configured");
        }

        // Create email service
        const emailService = new EmailService({
          provider: emailConfig.provider,
          smtpHost: emailConfig.smtpHost,
          smtpPort: emailConfig.smtpPort,
          smtpUsername: emailConfig.smtpUsername,
          smtpPassword: emailConfig.smtpPassword,
          smtpTls: emailConfig.smtpTls,
          resendApiKey: emailConfig.resendApiKey,
          sendgridApiKey: emailConfig.sendgridApiKey,
        });

        let sentCount = 0;
        let failedCount = 0;

        // Send to each recipient
        for (const recipient of recipients) {
          try {
            // Personalize email
            let personalizedHtml = input.htmlBody
              .replace(/\{\{firstName\}\}/g, recipient.firstName || "")
              .replace(/\{\{lastName\}\}/g, recipient.lastName || "")
              .replace(/\{\{email\}\}/g, recipient.email)
              .replace(/\{\{companyName\}\}/g, recipient.companyName || "");

            // Add unsubscribe link
            const unsubscribeUrl = `${process.env.VITE_APP_URL}/unsubscribe?token=${recipient.unsubscribeToken}`;
            personalizedHtml += `
              <hr style="margin-top: 40px; border: none; border-top: 1px solid #ddd;">
              <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
                <a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
              </p>
            `;

            // Send email
            const result = await emailService.send({
              to: recipient.email,
              from: input.senderEmail,
              subject: input.subject,
              html: personalizedHtml,
              text: input.textBody,
            });

            // Log send
            await db.logEmailSend({
              campaignId: input.campaignId,
              recipientEmail: recipient.email,
              messageId: result.id,
              status: "sent",
              sentAt: new Date(),
              userId: ctx.user.id,
            });

            sentCount++;
          } catch (error) {
            console.error(`[Campaign Email] Failed to send to ${recipient.email}:`, error);
            failedCount++;

            // Log failed send
            await db.logEmailSend({
              campaignId: input.campaignId,
              recipientEmail: recipient.email,
              messageId: "unknown",
              status: "failed",
              sentAt: new Date(),
              userId: ctx.user.id,
              error: String(error),
            });
          }

          // Rate limiting - add small delay between sends
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Update campaign status
        await db.updateCampaignStatus(input.campaignId, "sent", {
          sentCount,
          failedCount,
          totalRecipients: recipients.length,
        });

        return {
          success: true,
          sentCount,
          failedCount,
          totalRecipients: recipients.length,
        };
      } catch (error) {
        console.error("[Campaign Email] Batch send error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send campaign: ${String(error)}`,
        });
      }
    }),

  /**
   * Get campaign email statistics
   */
  getCampaignStats: protectedProcedure
    .input(z.object({
      campaignId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const stats = await db.getCampaignEmailStats(input.campaignId, ctx.user.id);

        return {
          totalSent: stats.sent,
          totalFailed: stats.failed,
          totalOpened: stats.opened,
          totalClicked: stats.clicked,
          totalBounced: stats.bounced,
          totalUnsubscribed: stats.unsubscribed,
          openRate: stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(2) : "0",
          clickRate: stats.sent > 0 ? ((stats.clicked / stats.sent) * 100).toFixed(2) : "0",
          bounceRate: stats.sent > 0 ? ((stats.bounced / stats.sent) * 100).toFixed(2) : "0",
        };
      } catch (error) {
        console.error("[Campaign Email] Stats error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get campaign stats: ${String(error)}`,
        });
      }
    }),

  /**
   * Track email open
   */
  trackEmailOpen: protectedProcedure
    .input(z.object({
      messageId: z.string(),
      campaignId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await db.logEmailEvent({
          messageId: input.messageId,
          campaignId: input.campaignId,
          event: "opened",
          timestamp: new Date(),
        });

        return { success: true };
      } catch (error) {
        console.error("[Campaign Email] Track open error:", error);
        // Don't throw error for tracking - fail silently
        return { success: false };
      }
    }),

  /**
   * Track email click
   */
  trackEmailClick: protectedProcedure
    .input(z.object({
      messageId: z.string(),
      campaignId: z.string(),
      linkUrl: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await db.logEmailEvent({
          messageId: input.messageId,
          campaignId: input.campaignId,
          event: "clicked",
          timestamp: new Date(),
          metadata: { linkUrl: input.linkUrl },
        });

        return { success: true };
      } catch (error) {
        console.error("[Campaign Email] Track click error:", error);
        // Don't throw error for tracking - fail silently
        return { success: false };
      }
    }),
});
