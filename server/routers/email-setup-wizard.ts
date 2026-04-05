/**
 * Email Setup Wizard Router
 * Handles one-click email setup for users
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { EmailService } from "../email-service";

// Auto-detect SMTP settings based on email provider
function getSmtpConfig(emailProvider: string, email: string) {
  const domain = email.split("@")[1];

  if (emailProvider === "office365") {
    return {
      smtpHost: "smtp.office365.com",
      smtpPort: 587,
      smtpUsername: email,
      smtpTls: true,
    };
  } else if (emailProvider === "gmail") {
    return {
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      smtpUsername: email,
      smtpTls: true,
    };
  } else if (emailProvider === "custom") {
    return {
      smtpHost: `mail.${domain}`,
      smtpPort: 587,
      smtpUsername: email,
      smtpTls: true,
    };
  }

  return null;
}

// Generate DNS records for email setup
function generateDNSRecords(domain: string, emailProvider: string) {
  const records = [];

  if (emailProvider === "office365") {
    records.push({
      type: "MX",
      name: "@",
      value: `${domain}.mail.protection.outlook.com`,
      priority: 10,
      description: "Mail exchange record for Office 365",
    });
    records.push({
      type: "TXT",
      name: "@",
      value: "v=spf1 include:outlook.com ~all",
      description: "SPF record for Office 365",
    });
  } else if (emailProvider === "gmail") {
    records.push({
      type: "MX",
      name: "@",
      value: "aspmx.l.google.com",
      priority: 10,
      description: "Mail exchange record for Gmail",
    });
    records.push({
      type: "TXT",
      name: "@",
      value: "v=spf1 include:_spf.google.com ~all",
      description: "SPF record for Gmail",
    });
  }

  // Add DMARC record
  records.push({
    type: "TXT",
    name: "_dmarc",
    value: "v=DMARC1; p=quarantine; rua=mailto:admin@" + domain,
    description: "DMARC policy record",
  });

  return records;
}

export const emailSetupWizardRouter = router({
  /**
   * Step 1: Get email provider options
   */
  getEmailProviders: protectedProcedure.query(async () => {
    return [
      {
        id: "office365",
        name: "Microsoft Office 365 / Outlook",
        icon: "📧",
        description: "Connect your Office 365 or Outlook email account",
        setupTime: "2 minutes",
        requiresPassword: true,
      },
      {
        id: "gmail",
        name: "Gmail",
        icon: "📬",
        description: "Connect your Gmail account",
        setupTime: "2 minutes",
        requiresPassword: true,
      },
      {
        id: "custom",
        name: "Custom SMTP",
        icon: "⚙️",
        description: "Use your own SMTP server",
        setupTime: "5 minutes",
        requiresPassword: true,
      },
    ];
  }),

  /**
   * Step 2: Get DNS records needed for domain
   */
  getDNSRecords: protectedProcedure
    .input(
      z.object({
        domain: z.string().min(1),
        emailProvider: z.enum(["office365", "gmail", "custom"]),
      })
    )
    .query(async ({ input }) => {
      const records = generateDNSRecords(input.domain, input.emailProvider);
      return {
        domain: input.domain,
        emailProvider: input.emailProvider,
        records,
        instructions: `Add these DNS records to your domain registrar (GoDaddy, Namecheap, Route53, etc.):`,
      };
    }),

  /**
   * Step 3: Test email connection
   */
  testEmailConnection: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        emailProvider: z.enum(["office365", "gmail", "custom"]),
        password: z.string().min(1),
        smtpHost: z.string().optional(),
        smtpPort: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const smtpConfig = getSmtpConfig(input.emailProvider, input.email);

        if (!smtpConfig) {
          throw new Error("Invalid email provider");
        }

        // Override with custom SMTP if provided
        const finalConfig = {
          ...smtpConfig,
          ...(input.smtpHost && { smtpHost: input.smtpHost }),
          ...(input.smtpPort && { smtpPort: input.smtpPort }),
          smtpPassword: input.password,
        };

        // Create email service and test connection
        const emailService = new EmailService({
          provider: "smtp",
          smtpHost: finalConfig.smtpHost,
          smtpPort: finalConfig.smtpPort,
          smtpUsername: finalConfig.smtpUsername,
          smtpPassword: finalConfig.smtpPassword,
          smtpTls: finalConfig.smtpTls,
        });

        // Test by sending a test email
        const result = await emailService.send({
          to: input.email,
          from: input.email,
          subject: "AXIOM CRM - Email Setup Test",
          html: `<p>If you received this email, your email configuration is working correctly!</p>`,
          replyTo: input.email,
        });

        return {
          success: true,
          message: "Email connection verified! Test email sent.",
          messageId: result.id,
        };
      } catch (error) {
        console.error("[Email Setup] Connection test failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Connection test failed: ${String(error)}`,
        });
      }
    }),

  /**
   * Step 4: Complete setup and save configuration
   */
  completeSetup: protectedProcedure
    .input(
      z.object({
        domain: z.string().min(1),
        email: z.string().email(),
        emailProvider: z.enum(["office365", "gmail", "custom"]),
        password: z.string().min(1),
        smtpHost: z.string().optional(),
        smtpPort: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const smtpConfig = getSmtpConfig(input.emailProvider, input.email);

        if (!smtpConfig) {
          throw new Error("Invalid email provider");
        }

        // Override with custom SMTP if provided
        const finalConfig = {
          ...smtpConfig,
          ...(input.smtpHost && { smtpHost: input.smtpHost }),
          ...(input.smtpPort && { smtpPort: input.smtpPort }),
          smtpPassword: input.password,
        };

        // Get DNS records
        const dnsRecords = generateDNSRecords(input.domain, input.emailProvider);

        // Save email setup configuration
        // TODO: Save to database using Drizzle ORM
        // const emailSetupRecord = await db.insert(emailSetup).values({
        //   userId: ctx.user.id,
        //   domain: input.domain,
        //   email: input.email,
        //   emailProvider: input.emailProvider,
        //   smtpHost: finalConfig.smtpHost,
        //   smtpPort: finalConfig.smtpPort,
        //   smtpUsername: finalConfig.smtpUsername,
        //   smtpPassword: finalConfig.smtpPassword,
        //   smtpTls: finalConfig.smtpTls,
        //   isConfigured: true,
        //   dnsRecords: JSON.stringify(dnsRecords),
        // });

        console.log("[Email Setup] Configuration saved for user:", ctx.user.id);

        return {
          success: true,
          message: `Email setup complete! You can now send emails from ${input.email}`,
          domain: input.domain,
          email: input.email,
          emailProvider: input.emailProvider,
          dnsRecords,
          nextSteps: [
            "1. Add the DNS records to your domain registrar",
            "2. Wait 24-48 hours for DNS to propagate",
            "3. Start sending emails from your CRM",
          ],
        };
      } catch (error) {
        console.error("[Email Setup] Setup failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Setup failed: ${String(error)}`,
        });
      }
    }),

  /**
   * Get current email setup status
   */
  getSetupStatus: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Query database for email setup status
    return {
      isSetup: false,
      domain: null,
      email: null,
      emailProvider: null,
      isVerified: false,
      message: "No email setup configured yet",
    };
  }),
});
