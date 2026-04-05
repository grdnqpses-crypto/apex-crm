/**
 * Email Setup Schema - Stores email provider configuration
 */

import { sqliteTable, text, integer, boolean, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { users } from "./schema";

export const emailSetup = sqliteTable(
  "email_setup",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(), // e.g., "gareversal.com"
    email: text("email").notNull(), // e.g., "crypto@gareversal.com"
    emailProvider: text("email_provider").notNull(), // "office365", "gmail", "custom"
    
    // SMTP Configuration (encrypted in production)
    smtpHost: text("smtp_host"),
    smtpPort: integer("smtp_port"),
    smtpUsername: text("smtp_username"),
    smtpPassword: text("smtp_password"), // Should be encrypted
    smtpTls: boolean("smtp_tls").default(true),
    
    // Office365 / Gmail specific
    refreshToken: text("refresh_token"), // For OAuth providers
    accessToken: text("access_token"),
    tokenExpiresAt: integer("token_expires_at"),
    
    // Setup status
    isConfigured: boolean("is_configured").default(false),
    isVerified: boolean("is_verified").default(false),
    verifiedAt: integer("verified_at"),
    
    // DNS records
    dnsRecords: text("dns_records"), // JSON array of DNS records
    
    // Timestamps
    createdAt: integer("created_at").default(() => Date.now()),
    updatedAt: integer("updated_at").default(() => Date.now()),
  },
  (table) => [
    index("email_setup_user_id_idx").on(table.userId),
    index("email_setup_domain_idx").on(table.domain),
  ]
);

export const emailSetupRelations = relations(emailSetup, ({ one }) => ({
  user: one(users, {
    fields: [emailSetup.userId],
    references: [users.id],
  }),
}));
