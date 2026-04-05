/**
 * Email Sync Service - Syncs emails from Office 365/Outlook
 * Supports: Receiving emails, syncing to database, threading
 */

import { EmailService, EmailConfig } from "./email-service";
import * as db from "./db";

export interface EmailSyncOptions {
  emailAccountId: number;
  email: string;
  accessToken: string;
  refreshToken?: string;
}

export class EmailSyncService {
  private emailService: EmailService;

  constructor(emailConfig: EmailConfig) {
    this.emailService = new EmailService(emailConfig);
  }

  /**
   * Sync emails from Office 365 using Microsoft Graph API
   */
  async syncFromOffice365(options: EmailSyncOptions): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      console.log(`[EmailSync] Starting sync for ${options.email}...`);

      // Get emails from Microsoft Graph API
      const response = await fetch("https://graph.microsoft.com/v1.0/me/messages?$top=50&$orderby=receivedDateTime desc", {
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[EmailSync] Microsoft Graph error:", error);
        return {
          success: false,
          count: 0,
          error: `Microsoft Graph API error: ${JSON.stringify(error)}`,
        };
      }

      const data = await response.json();
      const messages = data.value || [];

      console.log(`[EmailSync] Found ${messages.length} messages to sync`);

      let syncedCount = 0;

      // Process each message
      for (const message of messages) {
        try {
          // Check if email already exists
          const existingEmail = await db.getEmailByMessageId(message.id);
          if (existingEmail) {
            console.log(`[EmailSync] Email ${message.id} already synced, skipping`);
            continue;
          }

          // Create email record in database
          await db.createEmail({
            emailAccountId: options.emailAccountId,
            messageId: message.id,
            threadId: message.conversationId,
            from: message.from?.emailAddress?.address || "unknown",
            to: message.toRecipients?.map((r: any) => r.emailAddress?.address).join(",") || "",
            cc: message.ccRecipients?.map((r: any) => r.emailAddress?.address).join(",") || "",
            subject: message.subject || "(no subject)",
            body: message.bodyPreview || "",
            htmlBody: message.body?.content || "",
            isRead: message.isRead || false,
            isSent: message.isDraft === false,
            isDraft: message.isDraft || false,
            receivedAt: new Date(message.receivedDateTime).getTime(),
            sentAt: message.sentDateTime ? new Date(message.sentDateTime).getTime() : undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

          syncedCount++;
          console.log(`[EmailSync] Synced email: ${message.subject}`);
        } catch (error) {
          console.error(`[EmailSync] Error syncing message ${message.id}:`, error);
        }
      }

      console.log(`[EmailSync] Sync completed: ${syncedCount} emails synced`);

      return {
        success: true,
        count: syncedCount,
      };
    } catch (error) {
      console.error("[EmailSync] Sync error:", error);
      return {
        success: false,
        count: 0,
        error: String(error),
      };
    }
  }

  /**
   * Send email through Office 365
   */
  async sendEmailOffice365(options: {
    accessToken: string;
    to: string;
    subject: string;
    body: string;
    htmlBody?: string;
    cc?: string[];
    bcc?: string[];
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            subject: options.subject,
            body: {
              contentType: "HTML",
              content: options.htmlBody || options.body,
            },
            toRecipients: [{ emailAddress: { address: options.to } }],
            ccRecipients: options.cc?.map((email) => ({ emailAddress: { address: email } })) || [],
            bccRecipients: options.bcc?.map((email) => ({ emailAddress: { address: email } })) || [],
          },
          saveToSentItems: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[EmailSync] Send error:", error);
        return {
          success: false,
          error: `Failed to send email: ${JSON.stringify(error)}`,
        };
      }

      console.log("[EmailSync] Email sent successfully");
      return {
        success: true,
        messageId: "sent-via-office365",
      };
    } catch (error) {
      console.error("[EmailSync] Send error:", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Test Office 365 connection
   */
  async testOffice365Connection(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        console.log("[EmailSync] Office 365 connection verified");
        return true;
      }

      console.error("[EmailSync] Office 365 connection failed:", response.status);
      return false;
    } catch (error) {
      console.error("[EmailSync] Connection test error:", error);
      return false;
    }
  }
}

/**
 * Create EmailSyncService instance
 */
export function createEmailSyncService(): EmailSyncService {
  const emailConfig = {
    provider: "smtp" as const,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    smtpUsername: process.env.SMTP_USERNAME,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpTls: process.env.SMTP_TLS !== "false",
  };

  return new EmailSyncService(emailConfig);
}
