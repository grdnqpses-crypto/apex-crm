import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, bigint } from "drizzle-orm/mysql-core";

// ─── Tenant Companies ───
export const tenantCompanies = mysqlTable("tenant_companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  industry: varchar("industry", { length: 256 }),
  website: varchar("website", { length: 512 }),
  logoUrl: varchar("logoUrl", { length: 512 }),
  address: text("address"),
  phone: varchar("phone", { length: 64 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  maxUsers: int("maxUsers").default(25),
  subscriptionTier: mysqlEnum("subscriptionTier", ["trial", "starter", "professional", "enterprise"]).default("trial").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "suspended", "cancelled", "expired"]).default("active").notNull(),
  trialEndsAt: bigint("trialEndsAt", { mode: "number" }),
  enabledFeatures: json("enabledFeatures").$type<string[]>(),
  settings: json("settings").$type<Record<string, unknown>>(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type TenantCompany = typeof tenantCompanies.$inferSelect;
export type InsertTenantCompany = typeof tenantCompanies.$inferInsert;

// ─── Users ───
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Multi-tenant hierarchy fields
  systemRole: mysqlEnum("systemRole", ["developer", "company_admin", "manager", "user"]).default("user").notNull(),
  tenantCompanyId: int("tenantCompanyId"),
  managerId: int("managerId"),
  isActive: boolean("isActive").default(true).notNull(),
  invitedBy: int("invitedBy"),
  jobTitle: varchar("jobTitle", { length: 256 }),
  phone: varchar("phone", { length: 64 }),
  avatarUrl: varchar("avatarUrl", { length: 512 }),
  lastActiveAt: bigint("lastActiveAt", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Feature Assignments ───
export const featureAssignments = mysqlTable("feature_assignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  featureKey: varchar("featureKey", { length: 128 }).notNull(),
  grantedBy: int("grantedBy").notNull(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type FeatureAssignment = typeof featureAssignments.$inferSelect;

// ─── Company Invites ───
export const companyInvites = mysqlTable("company_invites", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  inviteRole: mysqlEnum("inviteRole", ["company_admin", "manager", "user"]).default("user").notNull(),
  managerId: int("managerId"),
  token: varchar("token", { length: 128 }).notNull().unique(),
  invitedBy: int("invitedBy").notNull(),
  status: mysqlEnum("inviteStatus", ["pending", "accepted", "expired", "revoked"]).default("pending").notNull(),
  features: json("features").$type<string[]>(),
  expiresAt: bigint("expiresAt", { mode: "number" }).notNull(),
  acceptedAt: bigint("acceptedAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type CompanyInvite = typeof companyInvites.$inferSelect;

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

// ═══════════════════════════════════════════════════════════════
// PARADIGM ENGINE — BNB Prospecting & Sales Intelligence Module
// ═══════════════════════════════════════════════════════════════

// ─── Integration Credentials (Apollo, NeverBounce, Google AI, SendGrid, PhantomBuster) ───
export const integrationCredentials = mysqlTable("integration_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  service: varchar("service", { length: 64 }).notNull(), // apollo, neverbounce, google_ai, sendgrid, phantombuster
  apiKey: text("apiKey").notNull(),
  apiSecret: text("apiSecret"),
  baseUrl: varchar("baseUrl", { length: 512 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastTestedAt: bigint("lastTestedAt", { mode: "number" }),
  testStatus: varchar("testStatus", { length: 32 }).default("untested"), // untested, success, failed
  testMessage: text("testMessage"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type IntegrationCredential = typeof integrationCredentials.$inferSelect;

// ─── Prospects (AI-discovered leads via Sentinel) ───
export const prospects = mysqlTable("prospects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("contactId"), // linked CRM contact once promoted
  // Identity
  firstName: varchar("firstName", { length: 128 }).notNull(),
  lastName: varchar("lastName", { length: 128 }),
  email: varchar("email", { length: 320 }),
  jobTitle: varchar("jobTitle", { length: 256 }),
  companyName: varchar("companyName", { length: 256 }),
  companyDomain: varchar("companyDomain", { length: 256 }),
  linkedinUrl: varchar("linkedinUrl", { length: 512 }),
  phone: varchar("phone", { length: 64 }),
  location: varchar("location", { length: 256 }),
  industry: varchar("industry", { length: 128 }),
  // Discovery
  sourceType: varchar("sourceType", { length: 64 }).notNull(), // apollo, linkedin, trigger_event, manual
  sourceSignalId: int("sourceSignalId"), // FK to trigger_signals
  apolloId: varchar("apolloId", { length: 128 }),
  // Verification (Nutrition Layer)
  verificationStatus: varchar("verificationStatus", { length: 32 }).default("pending").notNull(), // pending, valid, invalid, catch_all, unknown, disposable
  verificationProvider: varchar("verificationProvider", { length: 32 }), // neverbounce
  verifiedAt: bigint("verifiedAt", { mode: "number" }),
  bounceRisk: varchar("bounceRisk", { length: 16 }), // low, medium, high
  // Digital Twin (Psychographic Profile)
  psychographicProfile: json("psychographicProfile").$type<{
    personalityType?: string;
    communicationStyle?: string;
    motivators?: string[];
    painPoints?: string[];
    interests?: string[];
    decisionStyle?: string;
    socialActivity?: string;
    summary?: string;
    analyzedAt?: number;
  }>(),
  socialPosts: json("socialPosts").$type<{ platform: string; content: string; date: string }[]>(),
  // Engagement (Ghost Mode)
  engagementStage: varchar("engagementStage", { length: 32 }).default("discovered").notNull(), // discovered, verified, profiled, sequenced, engaged, replied, hot_lead, converted, disqualified
  ghostSequenceId: int("ghostSequenceId"),
  currentSequenceStep: int("currentSequenceStep").default(0),
  lastOutreachAt: bigint("lastOutreachAt", { mode: "number" }),
  repliedAt: bigint("repliedAt", { mode: "number" }),
  replyContent: text("replyContent"),
  intentScore: int("intentScore").default(0), // 0-100 positive intent
  intentSignal: varchar("intentSignal", { length: 64 }), // positive, neutral, negative, unsubscribe
  // Self-Healing
  lastLinkedinCheckAt: bigint("lastLinkedinCheckAt", { mode: "number" }),
  previousCompany: varchar("previousCompany", { length: 256 }),
  previousJobTitle: varchar("previousJobTitle", { length: 256 }),
  jobChangeDetectedAt: bigint("jobChangeDetectedAt", { mode: "number" }),
  selfHealingAttempts: int("selfHealingAttempts").default(0),
  // Battle Card
  battleCardId: int("battleCardId"),
  // Metadata
  tags: json("tags").$type<string[]>(),
  notes: text("notes"),
  score: int("score").default(0), // overall prospect score
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = typeof prospects.$inferInsert;

// ─── Trigger Signals (Sentinel Layer events) ───
export const triggerSignals = mysqlTable("trigger_signals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Signal info
  signalType: varchar("signalType", { length: 64 }).notNull(), // job_change, new_patent, social_complaint, funding_round, expansion, hiring_surge, leadership_change
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  // Source
  sourceUrl: varchar("sourceUrl", { length: 1024 }),
  sourcePlatform: varchar("sourcePlatform", { length: 64 }), // linkedin, crunchbase, google_patents, twitter, news
  // Linked entities
  prospectId: int("prospectId"),
  companyName: varchar("companyName", { length: 256 }),
  personName: varchar("personName", { length: 256 }),
  // Processing
  status: varchar("signalStatus", { length: 32 }).default("new").notNull(), // new, processing, actioned, dismissed, expired
  priority: varchar("priority", { length: 16 }).default("medium"), // low, medium, high, critical
  actionTaken: text("actionTaken"),
  processedAt: bigint("processedAt", { mode: "number" }),
  expiresAt: bigint("expiresAt", { mode: "number" }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type TriggerSignal = typeof triggerSignals.$inferSelect;

// ─── Ghost Sequences (4-stage automated follow-up) ───
export const ghostSequences = mysqlTable("ghost_sequences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  // Stylistic fingerprint for AI drafting
  stylisticFingerprint: json("stylisticFingerprint").$type<{
    tone?: string;
    formality?: string;
    signOff?: string;
    sampleEmails?: string[];
    avoidPhrases?: string[];
    preferredPhrases?: string[];
  }>(),
  status: varchar("seqStatus", { length: 32 }).default("draft").notNull(), // draft, active, paused, archived
  totalEnrolled: int("totalEnrolled").default(0),
  totalReplied: int("totalReplied").default(0),
  totalConverted: int("totalConverted").default(0),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type GhostSequence = typeof ghostSequences.$inferSelect;

// ─── Ghost Sequence Steps ───
export const ghostSequenceSteps = mysqlTable("ghost_sequence_steps", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull(),
  stepOrder: int("stepOrder").notNull(),
  // Step config
  delayDays: int("delayDays").default(1).notNull(), // days to wait before sending
  subject: varchar("subject", { length: 512 }),
  bodyTemplate: text("bodyTemplate"), // template with {{tokens}}
  aiGenerated: boolean("aiGenerated").default(true).notNull(),
  // Personalization
  useDigitalTwin: boolean("useDigitalTwin").default(true).notNull(),
  toneOverride: varchar("toneOverride", { length: 64 }),
  // Stats
  totalSent: int("totalSent").default(0),
  totalOpened: int("totalOpened").default(0),
  totalReplied: int("totalReplied").default(0),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type GhostSequenceStep = typeof ghostSequenceSteps.$inferSelect;

// ─── Prospect Outreach Log (Ghost Mode activity) ───
export const prospectOutreach = mysqlTable("prospect_outreach", {
  id: int("id").autoincrement().primaryKey(),
  prospectId: int("prospectId").notNull(),
  sequenceId: int("sequenceId"),
  stepId: int("stepId"),
  // Email details
  fromEmail: varchar("fromEmail", { length: 320 }),
  toEmail: varchar("toEmail", { length: 320 }),
  subject: varchar("subject", { length: 512 }),
  body: text("body"),
  // Status
  status: varchar("outreachStatus", { length: 32 }).default("draft").notNull(), // draft, scheduled, sent, opened, clicked, replied, bounced, failed
  sentAt: bigint("sentAt", { mode: "number" }),
  openedAt: bigint("openedAt", { mode: "number" }),
  clickedAt: bigint("clickedAt", { mode: "number" }),
  repliedAt: bigint("repliedAt", { mode: "number" }),
  bouncedAt: bigint("bouncedAt", { mode: "number" }),
  // AI analysis of reply
  replyContent: text("replyContent"),
  intentAnalysis: json("intentAnalysis").$type<{
    intent: string; // positive, neutral, negative, unsubscribe
    confidence: number;
    summary: string;
    suggestedAction: string;
  }>(),
  // Metadata
  smtpAccountId: int("smtpAccountId"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type ProspectOutreach = typeof prospectOutreach.$inferSelect;

// ─── Battle Cards (AI-generated tactical summaries) ───
export const battleCards = mysqlTable("battle_cards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  prospectId: int("prospectId").notNull(),
  // Card content
  title: varchar("title", { length: 512 }).notNull(),
  companyOverview: text("companyOverview"),
  personInsights: text("personInsights"),
  painPoints: json("painPoints").$type<string[]>(),
  talkingPoints: json("talkingPoints").$type<string[]>(),
  competitorIntel: text("competitorIntel"),
  recommendedApproach: text("recommendedApproach"),
  objectionHandlers: json("objectionHandlers").$type<{ objection: string; response: string }[]>(),
  triggerContext: text("triggerContext"), // what triggered this lead becoming hot
  urgencyLevel: varchar("urgencyLevel", { length: 500 }).default("medium"), // low, medium, high, critical
  // Status
  isRead: boolean("isRead").default(false).notNull(),
  isArchived: boolean("isArchived").default(false).notNull(),
  generatedAt: bigint("generatedAt", { mode: "number" }).notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type BattleCard = typeof battleCards.$inferSelect;


// ═══════════════════════════════════════════════════════════════
// COMPLIANCE FORTRESS + DELIVERABILITY ENGINE
// ═══════════════════════════════════════════════════════════════

// ─── Email Suppression List (bounces, unsubscribes, complaints — NEVER send again) ───
export const suppressionList = mysqlTable("suppression_list", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  reason: varchar("reason", { length: 64 }).notNull(), // hard_bounce, soft_bounce, unsubscribe, complaint, manual, invalid, role_address
  source: varchar("source", { length: 64 }), // campaign, system, manual, feedback_loop
  campaignId: int("campaignId"),
  notes: text("notes"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type SuppressionEntry = typeof suppressionList.$inferSelect;

// ─── Compliance Audit Log (every email sent is logged for legal compliance) ───
export const complianceAuditLog = mysqlTable("compliance_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  emailQueueId: int("emailQueueId"),
  campaignId: int("campaignId"),
  toEmail: varchar("toEmail", { length: 320 }).notNull(),
  fromEmail: varchar("fromEmail", { length: 320 }).notNull(),
  // Compliance checks performed
  hasPhysicalAddress: boolean("hasPhysicalAddress").notNull(),
  hasUnsubscribeLink: boolean("hasUnsubscribeLink").notNull(),
  hasOneClickUnsubscribe: boolean("hasOneClickUnsubscribe").notNull(), // RFC 8058
  hasIdentifiedAsAd: boolean("hasIdentifiedAsAd").notNull(),
  subjectLineClean: boolean("subjectLineClean").notNull(), // no deceptive content
  recipientNotSuppressed: boolean("recipientNotSuppressed").notNull(),
  recipientHasConsent: boolean("recipientHasConsent").notNull(),
  spfAligned: boolean("spfAligned").notNull(),
  dkimAligned: boolean("dkimAligned").notNull(),
  dmarcAligned: boolean("dmarcAligned").notNull(),
  // Overall
  compliancePassed: boolean("compliancePassed").notNull(),
  failureReasons: json("failureReasons").$type<string[]>(),
  // Provider detection
  recipientProvider: varchar("recipientProvider", { length: 32 }), // gmail, outlook, yahoo, aol, other
  // Result
  wasSent: boolean("wasSent").default(false).notNull(),
  sentAt: bigint("sentAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type ComplianceAuditEntry = typeof complianceAuditLog.$inferSelect;

// ─── Sender Settings (physical address, company info for CAN-SPAM) ───
export const senderSettings = mysqlTable("sender_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyName: varchar("companyName", { length: 256 }).notNull(),
  physicalAddress: text("physicalAddress").notNull(), // required by CAN-SPAM
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 64 }),
  zipCode: varchar("zipCode", { length: 16 }),
  country: varchar("country", { length: 64 }),
  defaultFromName: varchar("defaultFromName", { length: 256 }),
  defaultReplyTo: varchar("defaultReplyTo", { length: 320 }),
  unsubscribeUrl: varchar("unsubscribeUrl", { length: 1024 }),
  privacyPolicyUrl: varchar("privacyPolicyUrl", { length: 1024 }),
  // Provider-specific settings
  outlookThrottlePerMinute: int("outlookThrottlePerMinute").default(10),
  gmailThrottlePerMinute: int("gmailThrottlePerMinute").default(20),
  yahooThrottlePerMinute: int("yahooThrottlePerMinute").default(15),
  defaultThrottlePerMinute: int("defaultThrottlePerMinute").default(30),
  maxBounceRatePercent: int("maxBounceRatePercent").default(2), // auto-pause above this
  maxComplaintRatePercent: int("maxComplaintRatePercent").default(1), // 0.1% = 1 (stored as 10x)
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type SenderSetting = typeof senderSettings.$inferSelect;

// ─── Domain Sending Stats (per-domain, per-provider daily stats) ───
export const domainSendingStats = mysqlTable("domain_sending_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  domain: varchar("domain", { length: 256 }).notNull(),
  provider: varchar("provider", { length: 32 }).notNull(), // gmail, outlook, yahoo, aol, other
  date: varchar("statDate", { length: 16 }).notNull(), // YYYY-MM-DD
  sent: int("sent").default(0).notNull(),
  delivered: int("delivered").default(0).notNull(),
  bounced: int("bounced").default(0).notNull(),
  complaints: int("complaints").default(0).notNull(),
  opens: int("opens").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  unsubscribes: int("unsubscribes").default(0).notNull(),
  // Calculated rates
  bounceRate: int("bounceRate").default(0), // stored as percentage * 100 (e.g., 150 = 1.50%)
  complaintRate: int("complaintRate").default(0), // stored as percentage * 1000 (e.g., 100 = 0.100%)
  openRate: int("openRate").default(0), // stored as percentage * 100
  // Auto-pause
  isPaused: boolean("isPaused").default(false).notNull(),
  pauseReason: varchar("pauseReason", { length: 256 }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type DomainSendingStat = typeof domainSendingStats.$inferSelect;

// ─── Prospect Quantum Score (12-dimension scoring breakdown) ───
export const prospectScores = mysqlTable("prospect_scores", {
  id: int("id").autoincrement().primaryKey(),
  prospectId: int("prospectId").notNull(),
  // 12 Scoring Dimensions (each 0-100)
  firmographicScore: int("firmographicScore").default(0), // company size, industry match, revenue
  behavioralScore: int("behavioralScore").default(0), // email opens, clicks, website visits
  engagementScore: int("engagementScore").default(0), // reply rate, response time, interaction depth
  timingScore: int("timingScore").default(0), // recency of engagement, buying cycle stage
  socialScore: int("socialScore").default(0), // social activity, influence, network size
  contentScore: int("contentScore").default(0), // content consumption patterns
  recencyScore: int("recencyScore").default(0), // how recently they engaged
  frequencyScore: int("frequencyScore").default(0), // how often they engage
  monetaryScore: int("monetaryScore").default(0), // estimated deal value potential
  channelScore: int("channelScore").default(0), // multi-channel engagement
  intentScore: int("intentScore").default(0), // buying intent signals
  relationshipScore: int("relationshipScore").default(0), // warmth of relationship
  // Composite
  totalScore: int("totalScore").default(0), // weighted composite 0-100
  scoreGrade: varchar("scoreGrade", { length: 4 }), // A+, A, B+, B, C+, C, D, F
  // AI reasoning
  scoreExplanation: text("scoreExplanation"),
  topStrengths: json("topStrengths").$type<string[]>(),
  topWeaknesses: json("topWeaknesses").$type<string[]>(),
  recommendedActions: json("recommendedActions").$type<string[]>(),
  // Predictive
  predictedConversionProb: int("predictedConversionProb").default(0), // 0-100%
  predictedDealValue: bigint("predictedDealValue", { mode: "number" }),
  optimalContactTime: varchar("optimalContactTime", { length: 256 }), // e.g., "Tuesday 10am EST"
  optimalChannel: varchar("optimalChannel", { length: 256 }), // email, phone, linkedin, in_person
  // Metadata
  lastScoredAt: bigint("lastScoredAt", { mode: "number" }).notNull(),
  scoringVersion: int("scoringVersion").default(1),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type ProspectScore = typeof prospectScores.$inferSelect;


// ─── DOT/FMCSA Broker Filings ───
export const brokerFilings = mysqlTable("broker_filings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // FMCSA identifiers
  dotNumber: varchar("dotNumber", { length: 32 }),
  mcNumber: varchar("mcNumber", { length: 32 }),
  // Company info
  legalName: varchar("legalName", { length: 512 }).notNull(),
  dbaName: varchar("dbaName", { length: 512 }),
  // Contact info
  contactName: varchar("contactName", { length: 256 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 64 }),
  // Address
  phyStreet: varchar("phyStreet", { length: 512 }),
  phyCity: varchar("phyCity", { length: 128 }),
  phyState: varchar("phyState", { length: 64 }),
  phyZip: varchar("phyZip", { length: 16 }),
  // Filing details
  filingType: mysqlEnum("filingType", ["new", "renewal", "reinstatement"]).notNull(),
  authorityType: mysqlEnum("authorityType", ["broker", "carrier", "freight_forwarder", "broker_carrier"]).default("broker"),
  authorityStatus: mysqlEnum("authorityStatus", ["active", "pending", "revoked", "inactive", "not_authorized"]).default("pending"),
  filingDate: bigint("filingDate", { mode: "number" }),
  effectiveDate: bigint("effectiveDate", { mode: "number" }),
  // Insurance/Bond
  insuranceRequired: boolean("insuranceRequired").default(true),
  bondSuretyName: varchar("bondSuretyName", { length: 256 }),
  bondAmount: int("bondAmount"),
  // Processing
  processedStatus: mysqlEnum("processedStatus", ["pending", "prospect_created", "campaign_enrolled", "skipped"]).default("pending"),
  prospectId: int("prospectId"),
  campaignId: int("campaignId"),
  // Metadata
  scanBatchId: varchar("scanBatchId", { length: 64 }),
  rawData: json("rawData"),
  notes: text("notes"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type BrokerFiling = typeof brokerFilings.$inferSelect;
export type InsertBrokerFiling = typeof brokerFilings.$inferInsert;
