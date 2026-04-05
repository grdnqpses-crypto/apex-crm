/**
 * Email Provider Setup Router
 * Handles email configuration and test email sending
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { EmailService } from "../email-service";

export const emailProviderRouter = router({
  /**
   * Get available email providers
   */
  getProviders: protectedProcedure.query(async () => {
    return [
      {
        provider: "smtp",
        name: "Custom SMTP",
        icon: "📧",
        description: "Use your own SMTP server",
        authMethod: "credentials",
        setupSteps: ["Enter SMTP host, port, username, password"],
      },
      {
        provider: "resend",
        name: "Resend",
        icon: "🚀",
        description: "Transactional email API",
        authMethod: "api_key",
        setupSteps: ["Get API key from resend.com", "Enter API key"],
      },
      {
        provider: "sendgrid",
        name: "SendGrid",
        icon: "📬",
        description: "SendGrid email service",
        authMethod: "api_key",
        setupSteps: ["Get API key from sendgrid.com", "Enter API key"],
      },
    ];
  }),

  /**
   * Send an email using user's configured email provider
   */
  sendEmail: protectedProcedure
    .input(z.object({
      to: z.string().email(),
      cc: z.array(z.string().email()).optional(),
      bcc: z.array(z.string().email()).optional(),
      subject: z.string(),
      body: z.string(),
      from: z.string().email().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Get email provider config for user
        const emailConfig = await db.getEmailProviderConfig(ctx.user.id);
        if (!emailConfig) {
          throw new Error("No email provider configured. Please set up your email provider in Email Marketing → Settings");
        }

        // Create email service with user's config
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

        // Use user's configured sender email if not provided
        const senderEmail = input.from || emailConfig.smtpUsername || "noreply@axiomcrm.com";

        // Send the email
        const result = await emailService.send({
          to: input.to,
          cc: input.cc,
          bcc: input.bcc,
          from: senderEmail,
          subject: input.subject,
          html: input.body,
          replyTo: senderEmail,
        });

        console.log("[Email Provider] Email sent successfully:", result);

        return {
          success: true,
          message: `Email sent successfully to ${input.to}`,
          messageId: result.id,
        };
      } catch (error) {
        console.error("[Email Provider] Send email error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send email: ${String(error)}`,
        });
      }
    }),

  /**
   * Send a test email to verify configuration
   */
  sendTestEmail: protectedProcedure
    .input(z.object({
      recipientEmail: z.string().email(),
      senderEmail: z.string().email(),
      domain: z.string().optional(),
      provider: z.enum(["smtp", "resend", "sendgrid"]),
      smtpHost: z.string().optional(),
      smtpPort: z.number().optional(),
      smtpUsername: z.string().optional(),
      smtpPassword: z.string().optional(),
      smtpTls: z.boolean().optional(),
      resendApiKey: z.string().optional(),
      sendgridApiKey: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const testSubject = "Test Email from AXIOM CRM";
        const testBody = `
          <html>
            <body>
              <p>This is a test email from AXIOM CRM.</p>
              <p>If you received this email, your email configuration is working correctly!</p>
            </body>
          </html>
        `;

        // Create email service with provided credentials
        const emailService = new EmailService({
          provider: input.provider,
          smtpHost: input.smtpHost,
          smtpPort: input.smtpPort,
          smtpUsername: input.smtpUsername,
          smtpPassword: input.smtpPassword,
          smtpTls: input.smtpTls,
          resendApiKey: input.resendApiKey,
          sendgridApiKey: input.sendgridApiKey,
        });

        // Send test email
        const result = await emailService.send({
          to: input.recipientEmail,
          from: input.senderEmail,
          subject: testSubject,
          html: testBody,
          replyTo: input.senderEmail,
        });

        console.log("[Email Provider] Test email sent successfully:", result);

        return {
          success: true,
          message: `Test email sent successfully to ${input.recipientEmail}`,
          messageId: result.id,
        };
      } catch (error) {
        console.error("[Email Provider] Test email error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send test email: ${String(error)}`,
        });
      }
    }),

  /**
   * Test email provider connection
   */
  testConnection: protectedProcedure
    .input(z.object({
      provider: z.enum(["smtp", "resend", "sendgrid"]),
      smtpHost: z.string().optional(),
      smtpPort: z.number().optional(),
      smtpUsername: z.string().optional(),
      smtpPassword: z.string().optional(),
      smtpTls: z.boolean().optional(),
      resendApiKey: z.string().optional(),
      sendgridApiKey: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const emailService = new EmailService({
          provider: input.provider,
          smtpHost: input.smtpHost,
          smtpPort: input.smtpPort,
          smtpUsername: input.smtpUsername,
          smtpPassword: input.smtpPassword,
          smtpTls: input.smtpTls,
          resendApiKey: input.resendApiKey,
          sendgridApiKey: input.sendgridApiKey,
        });

        const isConnected = await emailService.testConnection();

        if (!isConnected) {
          throw new Error("Connection test failed");
        }

        return {
          success: true,
          message: "Email provider connection verified",
        };
      } catch (error) {
        console.error("[Email Provider] Connection test error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Connection test failed: ${String(error)}`,
        });
      }
    }),
});
