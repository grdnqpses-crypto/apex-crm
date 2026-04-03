/*
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
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .footer { font-size: 12px; color: #999; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
                .success { color: #10b981; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ Test Email Successful</h1>
                </div>
                <div class="content">
                  <p>Hello,</p>
                  <p>This is a <span class="success">test email from AXIOM CRM</span>.</p>
                  <p>If you received this email, your email configuration is working correctly and you're ready to start sending campaigns!</p>
                  <p style="margin-top: 30px; padding: 15px; background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px;">
                    <strong>✓ Email delivery verified</strong><br/>
                    Your domain and email provider are properly configured.
                  </p>
                  <div class="footer">
                    <p>
                      <strong>Email Details:</strong><br/>
                      Sent from: ${input.senderEmail}<br/>
                      Domain: ${input.domain || 'default'}<br/>
                      Provider: ${input.provider}<br/>
                      Time: ${new Date().toISOString()}
                    </p>
                  </div>
                </div>
              </div>
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
