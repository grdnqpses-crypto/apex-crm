/**
 * Email System Database Schema
 * Supports: Email accounts, emails, attachments, sync logs
 */

import { sqliteTable, text, integer, real, index, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Email Accounts Table - stores connected email accounts
export const emailAccounts = sqliteTable(
  "email_accounts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull(),
    email: text("email").notNull().unique(),
    provider: text("provider").notNull(), // "office365", "gmail", "imap"
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: integer("expires_at"),
    imapHost: text("imap_host"),
    imapPort: integer("imap_port"),
    smtpHost: text("smtp_host"),
    smtpPort: integer("smtp_port"),
    smtpUsername: text("smtp_username"),
    smtpPassword: text("smtp_password"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    lastSyncAt: integer("last_sync_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    userIdx: index("email_accounts_user_id_idx").on(table.userId),
    emailIdx: index("email_accounts_email_idx").on(table.email),
  })
);

// Emails Table - stores all emails
export const emails = sqliteTable(
  "emails",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    emailAccountId: integer("email_account_id").notNull(),
    messageId: text("message_id").unique(),
    threadId: text("thread_id"),
    from: text("from").notNull(),
    to: text("to").notNull(), // JSON array
    cc: text("cc"), // JSON array
    bcc: text("bcc"), // JSON array
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    htmlBody: text("html_body"),
    isRead: integer("is_read", { mode: "boolean" }).default(false),
    isStarred: integer("is_starred", { mode: "boolean" }).default(false),
    isSent: integer("is_sent", { mode: "boolean" }).default(false),
    isDraft: integer("is_draft", { mode: "boolean" }).default(false),
    isTrash: integer("is_trash", { mode: "boolean" }).default(false),
    isSpam: integer("is_spam", { mode: "boolean" }).default(false),
    inReplyTo: text("in_reply_to"),
    references: text("references"), // JSON array of message IDs
    labels: text("labels"), // JSON array
    contactId: integer("contact_id"), // Link to CRM contact
    companyId: integer("company_id"), // Link to CRM company
    dealId: integer("deal_id"), // Link to CRM deal
    receivedAt: integer("received_at").notNull(),
    sentAt: integer("sent_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    accountIdx: index("emails_account_id_idx").on(table.emailAccountId),
    threadIdx: index("emails_thread_id_idx").on(table.threadId),
    contactIdx: index("emails_contact_id_idx").on(table.contactId),
    companyIdx: index("emails_company_id_idx").on(table.companyId),
    dealIdx: index("emails_deal_id_idx").on(table.dealId),
  })
);

// Email Attachments Table
export const emailAttachments = sqliteTable(
  "email_attachments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    emailId: integer("email_id").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    url: text("url").notNull(), // S3 URL
    createdAt: integer("created_at").notNull(),
  },
  (table) => ({
    emailIdx: index("email_attachments_email_id_idx").on(table.emailId),
  })
);

// Email Sync Logs Table - for debugging and monitoring
export const emailSyncLogs = sqliteTable(
  "email_sync_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    emailAccountId: integer("email_account_id").notNull(),
    status: text("status").notNull(), // "success", "error", "partial"
    emailsReceived: integer("emails_received").default(0),
    emailsSent: integer("emails_sent").default(0),
    error: text("error"),
    startedAt: integer("started_at").notNull(),
    completedAt: integer("completed_at"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => ({
    accountIdx: index("email_sync_logs_account_id_idx").on(table.emailAccountId),
  })
);

// Email Templates Table - for email signatures and templates
export const emailTemplates = sqliteTable(
  "email_templates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull(),
    name: text("name").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    htmlBody: text("html_body"),
    isDefault: integer("is_default", { mode: "boolean" }).default(false),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    userIdx: index("email_templates_user_id_idx").on(table.userId),
  })
);

export type EmailAccount = typeof emailAccounts.$inferSelect;
export type Email = typeof emails.$inferSelect;
export type EmailAttachment = typeof emailAttachments.$inferSelect;
export type EmailSyncLog = typeof emailSyncLogs.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
