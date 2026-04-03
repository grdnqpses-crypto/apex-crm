/**
 * Email Provider Setup Router
 * Handles OAuth flows and SMTP configuration for email providers
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import {
  EmailProviderConfig,
  validateEmailConfig,
  testEmailProviderConnection,
  maskSensitiveData,
  EMAIL_PROVIDERS,
} from "../email-provider-config";

export const emailProviderRouter = router({
  /**
   * Get available email providers
   */
  getProviders: protectedProcedure.query(async () => {
    return EMAIL_PROVIDERS.map(p => ({
      provider: p.provider,
      name: p.name,
      icon: p.icon,
      description: p.description,
      authMethod: p.authMethod,
      setupSteps: p.setupSteps,
    }));
  }),

  /**
   * Get current user's email configuration
   */
  getEmailConfig: protectedProcedure.query(async ({ ctx }) => {
    try {
      const config = await db.getEmailProviderConfig(ctx.user.id);
      if (!config) return null;
      return maskSensitiveData(config);
    } catch (error) {
      console.error("Failed to get email config:", error);
      return null;
    }
  }),

  /**
   * Start Gmail OAuth flow
   */
  startGmailOAuth: protectedProcedure
    .input(z.object({
      redirectUri: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const clientId = process.env.GMAIL_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gmail OAuth credentials not configured",
          });
        }

        // Generate OAuth URL
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: input.redirectUri,
          response_type: "code",
          scope: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly",
          access_type: "offline",
          prompt: "consent",
        });

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

        return { authUrl };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to start Gmail OAuth: ${String(error)}`,
        });
      }
    }),

  /**
   * Complete Gmail OAuth flow
   */
  completeGmailOAuth: protectedProcedure
    .input(z.object({
      code: z.string(),
      redirectUri: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const clientId = process.env.GMAIL_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gmail OAuth credentials not configured",
          });
        }

        // Exchange code for tokens
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code: input.code,
            redirect_uri: input.redirectUri,
            grant_type: "authorization_code",
          }).toString(),
        });

        if (!response.ok) {
          throw new Error(`OAuth token exchange failed: ${response.statusText}`);
        }

        const tokens = await response.json();

        // Decode ID token to get email
        const idTokenParts = tokens.id_token.split(".");
        const payload = JSON.parse(Buffer.from(idTokenParts[1], "base64").toString());
        const email = payload.email;

        // Save configuration
        const config: EmailProviderConfig = {
          provider: "gmail",
          email,
          displayName: payload.name,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
          configuredAt: Date.now(),
          verifiedAt: Date.now(),
          isVerified: true,
        };

        // Validate before saving
        const validation = validateEmailConfig(config);
        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid configuration: ${validation.errors.join(", ")}`,
          });
        }

        // Save to database
        await db.saveEmailProviderConfig(ctx.user.id, config);

        return {
          success: true,
          provider: "gmail",
          email,
          message: `Successfully connected Gmail account: ${email}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to complete Gmail OAuth: ${String(error)}`,
        });
      }
    }),

  /**
   * Start Office 365 OAuth flow
   */
  startOffice365OAuth: protectedProcedure
    .input(z.object({
      redirectUri: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      try {
        const clientId = process.env.OFFICE365_CLIENT_ID;

        if (!clientId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Office 365 OAuth credentials not configured",
          });
        }

        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: input.redirectUri,
          response_type: "code",
          scope: "Mail.Send Mail.Read offline_access",
          response_mode: "query",
        });

        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

        return { authUrl };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to start Office 365 OAuth: ${String(error)}`,
        });
      }
    }),

  /**
   * Complete Office 365 OAuth flow
   */
  completeOffice365OAuth: protectedProcedure
    .input(z.object({
      code: z.string(),
      redirectUri: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const clientId = process.env.OFFICE365_CLIENT_ID;
        const clientSecret = process.env.OFFICE365_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Office 365 OAuth credentials not configured",
          });
        }

        // Exchange code for tokens
        const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code: input.code,
            redirect_uri: input.redirectUri,
            grant_type: "authorization_code",
            scope: "Mail.Send Mail.Read offline_access",
          }).toString(),
        });

        if (!response.ok) {
          throw new Error(`OAuth token exchange failed: ${response.statusText}`);
        }

        const tokens = await response.json();

        // Get user info
        const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userResponse.ok) {
          throw new Error("Failed to get user info");
        }

        const userInfo = await userResponse.json();

        // Save configuration
        const config: EmailProviderConfig = {
          provider: "office365",
          email: userInfo.mail || userInfo.userPrincipalName,
          displayName: userInfo.displayName,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
          configuredAt: Date.now(),
          verifiedAt: Date.now(),
          isVerified: true,
        };

        // Validate before saving
        const validation = validateEmailConfig(config);
        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid configuration: ${validation.errors.join(", ")}`,
          });
        }

        // Save to database
        await db.saveEmailProviderConfig(ctx.user.id, config);

        return {
          success: true,
          provider: "office365",
          email: config.email,
          message: `Successfully connected Office 365 account: ${config.email}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to complete Office 365 OAuth: ${String(error)}`,
        });
      }
    }),

  /**
   * Configure custom SMTP
   */
  configureCustomSMTP: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      displayName: z.string().optional(),
      smtpHost: z.string(),
      smtpPort: z.number().int().min(1).max(65535),
      smtpUsername: z.string(),
      smtpPassword: z.string(),
      smtpTls: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const config: EmailProviderConfig = {
          provider: "custom_smtp",
          email: input.email,
          displayName: input.displayName,
          smtpHost: input.smtpHost,
          smtpPort: input.smtpPort,
          smtpUsername: input.smtpUsername,
          smtpPassword: input.smtpPassword,
          smtpTls: input.smtpTls,
          configuredAt: Date.now(),
          isVerified: false,
        };

        // Validate configuration
        const validation = validateEmailConfig(config);
        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid configuration: ${validation.errors.join(", ")}`,
          });
        }

        // Test connection
        const connectionOk = await testEmailProviderConnection(config);
        if (!connectionOk) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Failed to connect to SMTP server. Please check your credentials and settings.",
          });
        }

        // Mark as verified
        config.verifiedAt = Date.now();
        config.isVerified = true;

        // Save to database
        await db.saveEmailProviderConfig(ctx.user.id, config);

        return {
          success: true,
          provider: "custom_smtp",
          email: input.email,
          message: `Successfully configured SMTP: ${input.smtpHost}:${input.smtpPort}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to configure SMTP: ${String(error)}`,
        });
      }
    }),

  /**
   * Test email provider connection
   */
  testConnection: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const config = await db.getEmailProviderConfig(ctx.user.id);
      if (!config) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No email provider configured",
        });
      }

      const connectionOk = await testEmailProviderConnection(config);
      if (!connectionOk) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email provider connection failed",
        });
      }

      return {
        success: true,
        message: "Email provider connection verified",
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to test connection: ${String(error)}`,
      });
    }
  }),

  /**
   * Remove email provider configuration
   */
  removeEmailConfig: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await db.removeEmailProviderConfig(ctx.user.id);
      return {
        success: true,
        message: "Email provider configuration removed",
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to remove email config: ${String(error)}`,
      });
    }
  }),

  /**
   * Send a test email to verify configuration
   */
  sendTestEmail: protectedProcedure
    .input(z.object({
      recipientEmail: z.string().email(),
      senderEmail: z.string().email().optional(),
      domain: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const config = await db.getEmailProviderConfig(ctx.user.id);
        if (!config) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No email provider configured",
          });
        }

        const testSubject = "Test Email from AXIOM CRM";
        const testBody = `
          <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
              <h2>Test Email Verification</h2>
              <p>This is a test email from <strong>AXIOM CRM</strong>.</p>
              <p>If you received this email, your email configuration is working correctly!</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999;">
                Sent from: ${config.email}<br/>
                Domain: ${input.domain || 'default'}<br/>
                Time: ${new Date().toISOString()}
              </p>
            </body>
          </html>
        `;

        if (config.provider === "gmail" && config.accessToken) {
          const message = {
            raw: Buffer.from(
              `From: ${config.email}\r\n` +
              `To: ${input.recipientEmail}\r\n` +
              `Subject: ${testSubject}\r\n` +
              `Content-Type: text/html; charset="UTF-8"\r\n\r\n` +
              testBody
            ).toString("base64"),
          };

          const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
          });

          if (!response.ok) {
            throw new Error(`Gmail API error: ${response.statusText}`);
          }
        } else if (config.provider === "office365" && config.accessToken) {
          const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                subject: testSubject,
                body: {
                  contentType: "HTML",
                  content: testBody,
                },
                toRecipients: [
                  {
                    emailAddress: {
                      address: input.recipientEmail,
                    },
                  },
                ],
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`Office 365 API error: ${response.statusText}`);
          }
        } else if (config.provider === "custom_smtp" && config.smtpHost) {
          const nodemailer = require("nodemailer");
          const transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: config.smtpPort || 587,
            secure: config.smtpTls !== false,
            auth: {
              user: config.smtpUsername,
              pass: config.smtpPassword,
            },
          });

          await transporter.sendMail({
            from: config.email,
            to: input.recipientEmail,
            subject: testSubject,
            html: testBody,
          });
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email provider not properly configured",
          });
        }

        return {
          success: true,
          message: `Test email sent successfully to ${input.recipientEmail}`,
        };
      } catch (error) {
        console.error("Test email error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send test email: ${String(error)}`,
        });
      }
    }),
});
