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

// ─── Contacts (per ContactInstructions.docx) ───
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // 1. Core Identity
  firstName: varchar("firstName", { length: 128 }).notNull(),
  lastName: varchar("lastName", { length: 128 }),
  jobTitle: varchar("jobTitle", { length: 256 }),
  companyId: int("companyId"),
  contactOwnerId: int("contactOwnerId"),
  // 2. Communication
  email: varchar("email", { length: 320 }),
  companyPhone: varchar("companyPhone", { length: 64 }),
  directPhone: varchar("directPhone", { length: 64 }),
  mobilePhone: varchar("mobilePhone", { length: 64 }),
  faxNumber: varchar("faxNumber", { length: 64 }),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  // 3. Address & Location
  streetAddress: varchar("streetAddress", { length: 512 }),
  addressLine2: varchar("addressLine2", { length: 256 }),
  city: varchar("city", { length: 128 }),
  stateRegion: varchar("stateRegion", { length: 128 }),
  postalCode: varchar("postalCode", { length: 32 }),
  country: varchar("country", { length: 128 }),
  timezone: varchar("timezone", { length: 64 }),
  // 4. Lifecycle & Status
  lifecycleStage: varchar("lifecycleStage", { length: 64 }).default("lead"),
  leadStatus: varchar("leadStatus", { length: 128 }).default("Cold"),
  leadSource: varchar("leadSource", { length: 128 }).default("CRM"),
  leadScore: int("leadScore").default(0),
  // 5. Marketing Attribution
  originalSource: varchar("originalSource", { length: 256 }),
  originalSourceDrill1: varchar("originalSourceDrill1", { length: 256 }),
  originalSourceDrill2: varchar("originalSourceDrill2", { length: 256 }),
  latestSource: varchar("latestSource", { length: 256 }),
  latestSourceDrill1: varchar("latestSourceDrill1", { length: 256 }),
  latestSourceDrill2: varchar("latestSourceDrill2", { length: 256 }),
  // 6. Engagement & Activity Tracking
  lastActivityDate: bigint("lastActivityDate", { mode: "number" }),
  lastContactedDate: bigint("lastContactedDate", { mode: "number" }),
  nextActivityDate: bigint("nextActivityDate", { mode: "number" }),
  timesContacted: int("timesContacted").default(0),
  recentEmailOpenedDate: bigint("recentEmailOpenedDate", { mode: "number" }),
  recentEmailClickedDate: bigint("recentEmailClickedDate", { mode: "number" }),
  // 7. Email Subscription
  emailSubscriptionStatus: varchar("emailSubscriptionStatus", { length: 32 }).default("subscribed"),
  unsubscribeDate: bigint("unsubscribeDate", { mode: "number" }),
  gdprConsentStatus: varchar("gdprConsentStatus", { length: 32 }),
  communicationPreferences: json("communicationPreferences").$type<string[]>(),
  // 8. Website Behavior
  firstPageSeen: varchar("firstPageSeen", { length: 512 }),
  lastPageSeen: varchar("lastPageSeen", { length: 512 }),
  websiteSessions: int("websiteSessions").default(0),
  pageViewCount: int("pageViewCount").default(0),
  lastSeenAt: bigint("lastSeenAt", { mode: "number" }),
  // 9. Form & Conversion
  firstConversion: varchar("firstConversion", { length: 256 }),
  firstConversionDate: bigint("firstConversionDate", { mode: "number" }),
  mostRecentConversion: varchar("mostRecentConversion", { length: 256 }),
  mostRecentConversionDate: bigint("mostRecentConversionDate", { mode: "number" }),
  // 10. System & Record Management
  recordSource: varchar("recordSource", { length: 128 }),
  recordSourceDetail1: varchar("recordSourceDetail1", { length: 256 }),
  recordSourceDetail2: varchar("recordSourceDetail2", { length: 256 }),
  isImported: boolean("isImported").default(false),
  // 11. Social Media
  twitterHandle: varchar("twitterHandle", { length: 128 }),
  facebookProfile: varchar("facebookProfile", { length: 512 }),
  instagramProfile: varchar("instagramProfile", { length: 512 }),
  // 12. Custom Logistics Fields
  decisionMakerRole: varchar("decisionMakerRole", { length: 128 }),
  department: varchar("department", { length: 128 }),
  freightVolume: varchar("freightVolume", { length: 128 }),
  customerType: varchar("customerType", { length: 64 }),
  paymentResponsibility: varchar("paymentResponsibility", { length: 128 }),
  preferredContactMethod: varchar("preferredContactMethod", { length: 64 }),
  // General
  tags: json("tags").$type<string[]>(),
  avatarUrl: varchar("avatarUrl", { length: 512 }),
  notes: text("notes"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// ─── Companies (per CompanyInstructions.docx) ───
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // 1. Basic Identity
  name: varchar("name", { length: 256 }).notNull(),
  domain: varchar("domain", { length: 256 }),
  companyOwnerId: int("companyOwnerId"),
  companyType: varchar("companyType", { length: 128 }),
  companyEmail: varchar("companyEmail", { length: 320 }),
  // 2. Contact & Location
  phone: varchar("phone", { length: 64 }),
  streetAddress: varchar("streetAddress", { length: 512 }),
  addressLine2: varchar("addressLine2", { length: 256 }),
  city: varchar("city", { length: 128 }),
  stateRegion: varchar("stateRegion", { length: 128 }),
  postalCode: varchar("postalCode", { length: 32 }),
  country: varchar("country", { length: 128 }),
  timezone: varchar("timezone", { length: 64 }),
  // 3. Firmographic Details
  industry: varchar("industry", { length: 128 }),
  numberOfEmployees: varchar("numberOfEmployees", { length: 64 }),
  annualRevenue: varchar("annualRevenue", { length: 128 }),
  description: text("description"),
  businessClassification: varchar("businessClassification", { length: 64 }),
  foundedYear: varchar("foundedYear", { length: 8 }),
  // 4. Lifecycle & CRM Status
  leadSource: varchar("leadSource", { length: 128 }).default("CRM"),
  leadStatus: varchar("leadStatus", { length: 128 }).default("Cold"),
  // 5. Marketing & Engagement
  lastEmailOpened: bigint("lastEmailOpened", { mode: "number" }),
  lastEmailClicked: bigint("lastEmailClicked", { mode: "number" }),
  // 6. Activity Tracking
  lastContactedDate: bigint("lastContactedDate", { mode: "number" }),
  lastActivityDate: bigint("lastActivityDate", { mode: "number" }),
  nextActivityDate: bigint("nextActivityDate", { mode: "number" }),
  timesContacted: int("timesContacted").default(0),
  lastMeetingBooked: bigint("lastMeetingBooked", { mode: "number" }),
  // 7. Custom Logistics/Freight
  creditTerms: varchar("creditTerms", { length: 128 }),
  paymentStatus: varchar("paymentStatus", { length: 64 }),
  lanePreferences: text("lanePreferences"),
  tmsIntegrationStatus: varchar("tmsIntegrationStatus", { length: 64 }),
  // 8. System Properties
  recordSource: varchar("recordSource", { length: 128 }),
  importSource: varchar("importSource", { length: 128 }),
  // 9. Social Media
  facebookPage: varchar("facebookPage", { length: 512 }),
  facebookBusinessUrl: varchar("facebookBusinessUrl", { length: 512 }),
  twitterHandle: varchar("twitterHandle", { length: 128 }),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  youtubeUrl: varchar("youtubeUrl", { length: 512 }),
  // General
  parentId: int("parentId"),
  website: varchar("website", { length: 512 }),
  tags: json("tags").$type<string[]>(),
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
  tags: json("tags").$type<string[]>(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

// ─── Activities / Timeline (expanded per instructions) ───
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("contactId"),
  companyId: int("companyId"),
  dealId: int("dealId"),
  type: varchar("activityType", { length: 64 }).notNull(),
  // Common fields
  subject: varchar("subject", { length: 512 }),
  body: text("body"),
  // Call-specific
  callOutcome: varchar("callOutcome", { length: 64 }),
  callType: varchar("callType", { length: 32 }),
  callDuration: int("callDuration"),
  // Email-specific
  emailTo: varchar("emailTo", { length: 320 }),
  emailFrom: varchar("emailFrom", { length: 320 }),
  emailCc: text("emailCc"),
  emailOpened: boolean("emailOpened").default(false),
  emailClicked: boolean("emailClicked").default(false),
  // Meeting-specific
  meetingStartTime: bigint("meetingStartTime", { mode: "number" }),
  meetingEndTime: bigint("meetingEndTime", { mode: "number" }),
  meetingLocation: varchar("meetingLocation", { length: 512 }),
  meetingAttendees: text("meetingAttendees"),
  meetingOutcome: varchar("meetingOutcome", { length: 256 }),
  // Metadata
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type Activity = typeof activities.$inferSelect;

// ─── Tasks (per TaskPage.docx) ───
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Core fields
  title: varchar("title", { length: 512 }).notNull(),
  taskType: varchar("taskType", { length: 64 }).default("to_do"),
  dueDate: bigint("dueDate", { mode: "number" }),
  dueTime: varchar("dueTime", { length: 16 }),
  assignedTo: int("assignedTo"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  description: text("description"),
  status: mysqlEnum("taskStatus", ["not_started", "completed"]).default("not_started").notNull(),
  queue: varchar("queue", { length: 128 }),
  // Reminder
  reminderDate: bigint("reminderDate", { mode: "number" }),
  reminderSent: boolean("reminderSent").default(false),
  // Associations
  contactId: int("contactId"),
  companyId: int("companyId"),
  dealId: int("dealId"),
  // Completion
  completedAt: bigint("completedAt", { mode: "number" }),
  completedBy: int("completedBy"),
  outcome: text("outcome"),
  // Recurring
  isRecurring: boolean("isRecurring").default(false),
  recurringFrequency: varchar("recurringFrequency", { length: 32 }),
  // System
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
  status: mysqlEnum("campaignStatus", ["draft", "scheduled", "sending", "sent", "paused", "cancelled"]).default("draft").notNull(),
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
  tags: json("tags").$type<string[]>(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;

// ─── SMTP Sending Accounts (for 52 domains / 260 addresses) ───
export const smtpAccounts = mysqlTable("smtp_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  emailAddress: varchar("emailAddress", { length: 320 }).notNull(),
  displayName: varchar("displayName", { length: 256 }),
  domain: varchar("domain", { length: 256 }).notNull(),
  smtpHost: varchar("smtpHost", { length: 256 }).notNull(),
  smtpPort: int("smtpPort").default(587).notNull(),
  smtpUsername: varchar("smtpUsername", { length: 320 }).notNull(),
  smtpPassword: varchar("smtpPassword", { length: 512 }).notNull(),
  useTls: boolean("useTls").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  dailyLimit: int("dailyLimit").default(385).notNull(),
  sentToday: int("sentToday").default(0).notNull(),
  lastSentAt: bigint("lastSentAt", { mode: "number" }),
  lastResetDate: varchar("lastResetDate", { length: 16 }),
  healthStatus: varchar("healthStatus", { length: 32 }).default("healthy"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type SmtpAccount = typeof smtpAccounts.$inferSelect;

// ─── Email Send Queue ───
export const emailQueue = mysqlTable("email_queue", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId"),
  smtpAccountId: int("smtpAccountId"),
  contactId: int("contactId").notNull(),
  toEmail: varchar("toEmail", { length: 320 }).notNull(),
  fromEmail: varchar("fromEmail", { length: 320 }),
  fromName: varchar("fromName", { length: 256 }),
  subject: varchar("subject", { length: 512 }),
  htmlContent: text("htmlContent"),
  status: varchar("queueStatus", { length: 32 }).default("pending").notNull(),
  attempts: int("attempts").default(0).notNull(),
  lastError: text("lastError"),
  sentAt: bigint("sentAt", { mode: "number" }),
  openedAt: bigint("openedAt", { mode: "number" }),
  clickedAt: bigint("clickedAt", { mode: "number" }),
  bouncedAt: bigint("bouncedAt", { mode: "number" }),
  bounceType: varchar("bounceType", { length: 32 }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type EmailQueueItem = typeof emailQueue.$inferSelect;

// ─── Domain Health ───
export const domainHealth = mysqlTable("domain_health", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  domain: varchar("domain", { length: 256 }).notNull(),
  spfStatus: mysqlEnum("spfStatus", ["pass", "fail", "missing", "unknown"]).default("unknown").notNull(),
  dkimStatus: mysqlEnum("dkimStatus", ["pass", "fail", "missing", "unknown"]).default("unknown").notNull(),
  dmarcStatus: mysqlEnum("dmarcStatus", ["pass", "fail", "missing", "unknown"]).default("unknown").notNull(),
  dmarcPolicy: varchar("dmarcPolicy", { length: 32 }),
  mxServer: varchar("mxServer", { length: 256 }),
  mxIp: varchar("mxIp", { length: 64 }),
  reputationScore: int("reputationScore").default(50),
  warmupPhase: int("warmupPhase").default(0),
  dailySendLimit: int("dailySendLimit").default(50),
  totalSentToday: int("totalSentToday").default(0),
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
  filters: json("filters").$type<Record<string, unknown>[]>(),
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
  trigger: json("triggerConfig").$type<Record<string, unknown>>(),
  steps: json("steps").$type<Record<string, unknown>[]>(),
  status: mysqlEnum("wfStatus", ["draft", "active", "paused", "archived"]).default("draft").notNull(),
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
  type: mysqlEnum("abType", ["subject_line", "content", "send_time", "sender_name"]).notNull(),
  status: mysqlEnum("abStatus", ["draft", "running", "completed"]).default("draft").notNull(),
  variants: json("variants").$type<Record<string, unknown>[]>(),
  winnerVariant: varchar("winnerVariant", { length: 8 }),
  winnerMetric: mysqlEnum("winnerMetric", ["open_rate", "click_rate", "conversion"]).default("open_rate"),
  sampleSize: int("sampleSize").default(20),
  results: json("results").$type<Record<string, unknown>>(),
  startedAt: bigint("startedAt", { mode: "number" }),
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
  permissions: json("permissions").$type<string[]>(),
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
  events: json("events").$type<string[]>(),
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
  payload: json("payload").$type<Record<string, unknown>>(),
  responseStatus: int("responseStatus"),
  responseBody: text("responseBody"),
  success: boolean("success").default(false).notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type WebhookLog = typeof webhookLogs.$inferSelect;

// ─── Lead Status Options (configurable) ───
export const leadStatusOptions = mysqlTable("lead_status_options", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 128 }).notNull(),
  color: varchar("color", { length: 32 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type LeadStatusOption = typeof leadStatusOptions.$inferSelect;
