import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, bigint } from "drizzle-orm/mysql-core";

// ─── Users ───
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Contacts ───
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId"),
  firstName: varchar("firstName", { length: 128 }).notNull(),
  lastName: varchar("lastName", { length: 128 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 64 }),
  title: varchar("title", { length: 256 }),
  lifecycleStage: mysqlEnum("lifecycleStage", ["subscriber", "lead", "mql", "sql", "opportunity", "customer", "evangelist"]).default("lead").notNull(),
  leadScore: int("leadScore").default(0).notNull(),
  source: varchar("source", { length: 128 }),
  tags: json("tags").$type<string[]>().default([]),
  customFields: json("customFields").$type<Record<string, string>>().default({}),
  avatarUrl: varchar("avatarUrl", { length: 512 }),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 128 }),
  country: varchar("country", { length: 128 }),
  lastContactedAt: bigint("lastContactedAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// ─── Companies ───
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  parentId: int("parentId"),
  name: varchar("name", { length: 256 }).notNull(),
  domain: varchar("domain", { length: 256 }),
  industry: varchar("industry", { length: 128 }),
  size: varchar("size", { length: 64 }),
  revenue: varchar("revenue", { length: 64 }),
  phone: varchar("phone", { length: 64 }),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 128 }),
  country: varchar("country", { length: 128 }),
  website: varchar("website", { length: 512 }),
  description: text("description"),
  tags: json("tags").$type<string[]>().default([]),
  customFields: json("customFields").$type<Record<string, string>>().default({}),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// ─── Deal Pipelines ───
export const pipelines = mysqlTable("pipelines", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export const pipelineStages = mysqlTable("pipeline_stages", {
  id: int("id").autoincrement().primaryKey(),
  pipelineId: int("pipelineId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  order: int("stageOrder").notNull(),
  probability: int("probability").default(0).notNull(),
  color: varchar("color", { length: 32 }).default("#6366f1"),
});

export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  pipelineId: int("pipelineId").notNull(),
  stageId: int("stageId").notNull(),
  contactId: int("contactId"),
  companyId: int("companyId"),
  name: varchar("name", { length: 256 }).notNull(),
  value: bigint("dealValue", { mode: "number" }).default(0),
  currency: varchar("currency", { length: 8 }).default("USD"),
  status: mysqlEnum("status", ["open", "won", "lost"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  expectedCloseDate: bigint("expectedCloseDate", { mode: "number" }),
  closedAt: bigint("closedAt", { mode: "number" }),
  lostReason: text("lostReason"),
  notes: text("notes"),
  tags: json("tags").$type<string[]>().default([]),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

// ─── Activities / Timeline ───
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("contactId"),
  companyId: int("companyId"),
  dealId: int("dealId"),
  type: mysqlEnum("type", ["note", "email", "call", "meeting", "task", "deal_created", "deal_stage_changed", "deal_won", "deal_lost", "contact_created", "lifecycle_changed"]).notNull(),
  subject: varchar("subject", { length: 512 }),
  body: text("body"),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type Activity = typeof activities.$inferSelect;

// ─── Tasks ───
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assignedTo: int("assignedTo"),
  contactId: int("contactId"),
  dealId: int("dealId"),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  dueDate: bigint("dueDate", { mode: "number" }),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["todo", "in_progress", "done", "cancelled"]).default("todo").notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Task = typeof tasks.$inferSelect;

// ─── Email Templates ───
export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  subject: varchar("subject", { length: 512 }).notNull(),
  htmlContent: text("htmlContent").notNull(),
  jsonContent: json("jsonContent").$type<Record<string, unknown>>(),
  category: varchar("category", { length: 128 }),
  thumbnail: varchar("thumbnail", { length: 512 }),
  isSystem: boolean("isSystem").default(false).notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;

// ─── Email Campaigns ───
export const emailCampaigns = mysqlTable("email_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  templateId: int("templateId"),
  name: varchar("name", { length: 256 }).notNull(),
  subject: varchar("subject", { length: 512 }),
  fromName: varchar("fromName", { length: 256 }),
  fromEmail: varchar("fromEmail", { length: 320 }),
  htmlContent: text("htmlContent"),
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "sent", "paused", "cancelled"]).default("draft").notNull(),
  segmentId: int("segmentId"),
  scheduledAt: bigint("scheduledAt", { mode: "number" }),
  sentAt: bigint("sentAt", { mode: "number" }),
  totalRecipients: int("totalRecipients").default(0),
  delivered: int("delivered").default(0),
  opened: int("opened").default(0),
  clicked: int("clicked").default(0),
  bounced: int("bounced").default(0),
  unsubscribed: int("unsubscribed").default(0),
  spamReports: int("spamReports").default(0),
  spamScore: int("spamScore"),
  abTestId: int("abTestId"),
  abVariant: varchar("abVariant", { length: 8 }),
  tags: json("tags").$type<string[]>().default([]),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;

// ─── Email Deliverability ───
export const domainHealth = mysqlTable("domain_health", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  domain: varchar("domain", { length: 256 }).notNull(),
  spfStatus: mysqlEnum("spfStatus", ["pass", "fail", "missing", "unknown"]).default("unknown").notNull(),
  dkimStatus: mysqlEnum("dkimStatus", ["pass", "fail", "missing", "unknown"]).default("unknown").notNull(),
  dmarcStatus: mysqlEnum("dmarcStatus", ["pass", "fail", "missing", "unknown"]).default("unknown").notNull(),
  reputationScore: int("reputationScore").default(50),
  warmupPhase: int("warmupPhase").default(0),
  dailySendLimit: int("dailySendLimit").default(50),
  lastCheckedAt: bigint("lastCheckedAt", { mode: "number" }),
  notes: text("notes"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type DomainHealth = typeof domainHealth.$inferSelect;

// ─── Segments ───
export const segments = mysqlTable("segments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  filters: json("filters").$type<Record<string, unknown>[]>().default([]),
  contactCount: int("contactCount").default(0),
  isDynamic: boolean("isDynamic").default(true).notNull(),
  lastRefreshedAt: bigint("lastRefreshedAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Segment = typeof segments.$inferSelect;

// ─── Automation Workflows ───
export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  trigger: json("triggerConfig").$type<Record<string, unknown>>().default({}),
  steps: json("steps").$type<Record<string, unknown>[]>().default([]),
  status: mysqlEnum("status", ["draft", "active", "paused", "archived"]).default("draft").notNull(),
  enrolledCount: int("enrolledCount").default(0),
  completedCount: int("completedCount").default(0),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Workflow = typeof workflows.$inferSelect;

// ─── A/B Tests ───
export const abTests = mysqlTable("ab_tests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  campaignId: int("campaignId"),
  name: varchar("name", { length: 256 }).notNull(),
  type: mysqlEnum("type", ["subject_line", "content", "send_time", "sender_name"]).notNull(),
  status: mysqlEnum("status", ["draft", "running", "completed"]).default("draft").notNull(),
  variants: json("variants").$type<Record<string, unknown>[]>().default([]),
  winnerVariant: varchar("winnerVariant", { length: 8 }),
  winnerMetric: mysqlEnum("winnerMetric", ["open_rate", "click_rate", "conversion"]).default("open_rate"),
  sampleSize: int("sampleSize").default(20),
  results: json("results").$type<Record<string, unknown>>().default({}),
  startedAt: bigint("startedAt", { mode: "number" }),
  completedAt: bigint("completedAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type ABTest = typeof abTests.$inferSelect;

// ─── API Keys ───
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  keyHash: varchar("keyHash", { length: 128 }).notNull(),
  keyPrefix: varchar("keyPrefix", { length: 16 }).notNull(),
  permissions: json("permissions").$type<string[]>().default([]),
  lastUsedAt: bigint("lastUsedAt", { mode: "number" }),
  expiresAt: bigint("expiresAt", { mode: "number" }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;

// ─── Webhooks ───
export const webhooks = mysqlTable("webhooks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  events: json("events").$type<string[]>().default([]),
  secret: varchar("secret", { length: 256 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastTriggeredAt: bigint("lastTriggeredAt", { mode: "number" }),
  failureCount: int("failureCount").default(0),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Webhook = typeof webhooks.$inferSelect;

// ─── Webhook Logs ───
export const webhookLogs = mysqlTable("webhook_logs", {
  id: int("id").autoincrement().primaryKey(),
  webhookId: int("webhookId").notNull(),
  event: varchar("event", { length: 128 }).notNull(),
  payload: json("payload").$type<Record<string, unknown>>().default({}),
  responseStatus: int("responseStatus"),
  responseBody: text("responseBody"),
  success: boolean("success").default(false).notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type WebhookLog = typeof webhookLogs.$inferSelect;
