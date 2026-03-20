import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, bigint, decimal, double, tinyint } from "drizzle-orm/mysql-core";

// ─── Tenant Companies ───
export const logoGenerations = mysqlTable("logo_generations", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  logoUrl: text("logo_url").notNull(),
  prompt: text("prompt"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export type LogoGeneration = typeof logoGenerations.$inferSelect;

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
  subscriptionTier: mysqlEnum("subscriptionTier", ["trial", "success_starter", "growth_foundation", "fortune_foundation", "fortune", "fortune_plus"]).default("trial").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "suspended", "cancelled", "expired"]).default("active").notNull(),
  trialEndsAt: bigint("trialEndsAt", { mode: "number" }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
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
  username: varchar("username", { length: 128 }).unique(),
  passwordHash: varchar("passwordHash", { length: 512 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Multi-tenant hierarchy fields
  systemRole: mysqlEnum("systemRole", ["developer", "axiom_owner", "super_admin", "company_admin", "sales_manager", "office_manager", "manager", "account_manager", "coordinator", "sales_rep", "user"]).default("sales_rep").notNull(),
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
  inviteRole: mysqlEnum("inviteRole", ["company_admin", "sales_manager", "office_manager", "manager", "account_manager", "coordinator", "sales_rep", "user"]).default("sales_rep").notNull(),
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
  tenantId: int("tenantId"),
  // 1. Core Identity
  firstName: varchar("firstName", { length: 128 }).notNull(),
  lastName: varchar("lastName", { length: 128 }),
  jobTitle: varchar("jobTitle", { length: 256 }),
  companyId: int("companyId").notNull(),
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
  // 13. HubSpot Freight-Specific Fields
  freightDetails: varchar("freightDetails", { length: 128 }), // LTL, Truckload, Flatbed, Refrigerated, Intermodal, International Air, Domestic Air
  shipmentLength: decimal("shipmentLength", { precision: 10, scale: 2 }), // inches
  shipmentWidth: decimal("shipmentWidth", { precision: 10, scale: 2 }), // inches
  shipmentHeight: decimal("shipmentHeight", { precision: 10, scale: 2 }), // inches
  shipmentWeight: decimal("shipmentWeight", { precision: 10, scale: 2 }), // pounds
  destinationZipCode: varchar("destinationZipCode", { length: 16 }),
  shippingOrigination: varchar("shippingOrigination", { length: 256 }),
  destination: varchar("destination", { length: 256 }),
  additionalInformation: text("additionalInformation"),
  contactOwnerMeetingLink: varchar("contactOwnerMeetingLink", { length: 512 }),
  personHasMoved: varchar("personHasMoved", { length: 64 }),
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
  tenantId: int("tenantId"),
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
  // 7b. HubSpot Freight-Specific Fields
  annualFreightSpend: decimal("annualFreightSpend", { precision: 14, scale: 2 }),
  commodity: varchar("commodity", { length: 256 }),
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
  tenantId: int("tenantId"),
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
  tenantId: int("tenantId"),
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

// ─── Audit Logs ───
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId"),
  userId: int("userId").notNull(),
  userEmail: varchar("userEmail", { length: 320 }),
  userName: varchar("userName", { length: 256 }),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: int("entityId"),
  entityName: varchar("entityName", { length: 512 }),
  changes: json("changes"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type AuditLog = typeof auditLogs.$inferSelect;

// ─── Smart Views (Saved Filters) ───
export const smartViews = mysqlTable("smart_views", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId"),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  filters: json("filters").notNull(),
  isShared: tinyint("isShared").default(0),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type SmartView = typeof smartViews.$inferSelect;

// ─── Territories ───
export const territories = mysqlTable("territories", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId"),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  assignedUserIds: json("assignedUserIds").$type<number[]>(),
  rules: json("rules"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type Territory = typeof territories.$inferSelect;

// ─── Activities / Timeline (expanded per instructions) ───
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tenantId: int("tenantId"),
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
  tenantId: int("tenantId"),
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

// ─── Domain Health Records (Daily Snapshots for Trend Tracking) ───
export const domainHealthRecords = mysqlTable("domain_health_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  domainHealthId: int("domainHealthId").notNull(), // FK to domain_health
  domain: varchar("domain", { length: 256 }).notNull(),
  date: varchar("recordDate", { length: 16 }).notNull(), // YYYY-MM-DD
  // Health metrics snapshot
  healthScore: int("healthScore").default(50).notNull(), // 0-100 composite score
  // Authentication status
  spfStatus: varchar("spfStatus", { length: 16 }).default("unknown"),
  dkimStatus: varchar("dkimStatus", { length: 16 }).default("unknown"),
  dmarcStatus: varchar("dmarcStatus", { length: 16 }).default("unknown"),
  // Sending metrics
  totalSent: int("totalSent").default(0).notNull(),
  totalDelivered: int("totalDelivered").default(0).notNull(),
  totalBounced: int("totalBounced").default(0).notNull(),
  totalComplaints: int("totalComplaints").default(0).notNull(),
  totalOpens: int("totalOpens").default(0).notNull(),
  totalClicks: int("totalClicks").default(0).notNull(),
  // Calculated rates (stored as basis points: 150 = 1.50%)
  bounceRate: int("bounceRate").default(0),
  complaintRate: int("complaintRate").default(0),
  openRate: int("openRate").default(0),
  clickRate: int("clickRate").default(0),
  deliveryRate: int("deliveryRate").default(10000), // 100.00% = 10000
  // Warm-up tracking
  warmupDay: int("warmupDay").default(0), // day N of warm-up (0 = not warming up)
  warmupPhase: int("warmupPhase").default(0), // 0=none, 1-8 = week of warm-up
  dailySendLimit: int("dailySendLimit").default(50),
  // Provider breakdown (JSON for flexibility)
  providerBreakdown: json("providerBreakdown").$type<{
    gmail?: { sent: number; bounced: number; complaints: number; opens: number };
    outlook?: { sent: number; bounced: number; complaints: number; opens: number };
    yahoo?: { sent: number; bounced: number; complaints: number; opens: number };
    other?: { sent: number; bounced: number; complaints: number; opens: number };
  }>(),
  // Status
  isPaused: boolean("isPaused").default(false).notNull(),
  pauseReason: varchar("pauseReason", { length: 256 }),
  // Recommendations generated by optimizer
  recommendations: json("recommendations").$type<string[]>(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type DomainHealthRecord = typeof domainHealthRecords.$inferSelect;

// ═══════════════════════════════════════════════════════════════
// PHASE 13: PREMIUM FEATURES
// ═══════════════════════════════════════════════════════════════

// ─── AI Voice Agent ("AXIOM Caller") ───
export const voiceCampaigns = mysqlTable("voice_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  // Script configuration
  scriptTemplate: text("scriptTemplate"), // AI conversation script
  objective: varchar("objective", { length: 128 }).default("qualify_lead").notNull(), // qualify_lead, book_appointment, gather_info, follow_up
  voicePersona: varchar("voicePersona", { length: 64 }).default("professional"), // professional, friendly, authoritative, consultative
  industry: varchar("industry", { length: 128 }).default("freight_brokerage"),
  // Targeting
  targetSegmentId: int("targetSegmentId"),
  targetContactIds: json("targetContactIds").$type<number[]>(),
  // Schedule
  callWindowStart: varchar("callWindowStart", { length: 8 }).default("09:00"), // HH:MM
  callWindowEnd: varchar("callWindowEnd", { length: 8 }).default("17:00"),
  callWindowTimezone: varchar("callWindowTimezone", { length: 64 }).default("America/New_York"),
  maxConcurrentCalls: int("maxConcurrentCalls").default(10),
  maxCallsPerDay: int("maxCallsPerDay").default(500),
  maxRetries: int("maxRetries").default(3),
  retryDelayMinutes: int("retryDelayMinutes").default(60),
  // Qualification criteria
  qualificationCriteria: json("qualificationCriteria").$type<{
    minFreightVolume?: string;
    requiredServices?: string[];
    budgetRange?: string;
    decisionTimeline?: string;
    customQuestions?: { question: string; expectedAnswer?: string }[];
  }>(),
  // Stats
  totalCalls: int("totalCalls").default(0),
  totalConnected: int("totalConnected").default(0),
  totalQualified: int("totalQualified").default(0),
  totalAppointments: int("totalAppointments").default(0),
  avgCallDuration: int("avgCallDuration").default(0), // seconds
  // Status
  status: mysqlEnum("vcStatus", ["draft", "active", "paused", "completed", "archived"]).default("draft").notNull(),
  startedAt: bigint("startedAt", { mode: "number" }),
  completedAt: bigint("completedAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type VoiceCampaign = typeof voiceCampaigns.$inferSelect;

export const callLogs = mysqlTable("call_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  voiceCampaignId: int("voiceCampaignId"),
  contactId: int("contactId"),
  prospectId: int("prospectId"),
  // Call details
  phoneNumber: varchar("phoneNumber", { length: 64 }).notNull(),
  direction: mysqlEnum("callDirection", ["outbound", "inbound"]).default("outbound").notNull(),
  status: mysqlEnum("callStatus", ["queued", "ringing", "in_progress", "completed", "no_answer", "busy", "failed", "voicemail"]).default("queued").notNull(),
  // Timing
  startedAt: bigint("callStartedAt", { mode: "number" }),
  connectedAt: bigint("connectedAt", { mode: "number" }),
  endedAt: bigint("callEndedAt", { mode: "number" }),
  durationSeconds: int("durationSeconds").default(0),
  // AI conversation
  transcription: text("transcription"),
  conversationSummary: text("conversationSummary"),
  aiSentiment: varchar("aiSentiment", { length: 32 }), // positive, neutral, negative, interested, not_interested
  // Qualification
  qualificationScore: int("qualificationScore").default(0), // 0-100
  qualificationResult: mysqlEnum("qualResult", ["qualified", "not_qualified", "needs_followup", "not_reached", "pending"]).default("pending").notNull(),
  qualificationDetails: json("qualificationDetails").$type<{
    freightVolume?: string;
    currentProvider?: string;
    painPoints?: string[];
    budget?: string;
    timeline?: string;
    decisionMaker?: boolean;
    interests?: string[];
    objections?: string[];
    nextSteps?: string;
  }>(),
  // Appointment booking
  appointmentBooked: boolean("appointmentBooked").default(false),
  appointmentDate: bigint("appointmentDate", { mode: "number" }),
  appointmentNotes: text("appointmentNotes"),
  // Follow-up
  followUpRequired: boolean("followUpRequired").default(false),
  followUpDate: bigint("followUpDate", { mode: "number" }),
  followUpNotes: text("followUpNotes"),
  // Recording
  recordingUrl: varchar("recordingUrl", { length: 1024 }),
  // Retry tracking
  attemptNumber: int("attemptNumber").default(1),
  previousCallId: int("previousCallId"),
  // Auto-created task
  taskId: int("taskId"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type CallLog = typeof callLogs.$inferSelect;

// ─── Document Intelligence ("DocScan") ───
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // File info
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  fileSizeBytes: int("fileSizeBytes"),
  // Classification
  documentType: varchar("documentType", { length: 64 }).notNull(), // w9, insurance_certificate, mc_authority, carrier_agreement, rate_confirmation, bol, pod, lumper_receipt, invoice, other
  category: varchar("docCategory", { length: 64 }).default("general"), // carrier_packet, shipping, billing, compliance, general
  // AI extraction
  extractedData: json("extractedData").$type<Record<string, unknown>>(),
  extractionStatus: mysqlEnum("extractionStatus", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  extractionConfidence: int("extractionConfidence").default(0), // 0-100
  extractionErrors: json("extractionErrors").$type<string[]>(),
  // Associations
  contactId: int("contactId"),
  companyId: int("companyId"),
  dealId: int("dealId"),
  carrierPacketId: int("carrierPacketId"),
  // Validation
  isValid: boolean("isValid"),
  validationNotes: text("validationNotes"),
  expiresAt: bigint("docExpiresAt", { mode: "number" }),
  // Metadata
  tags: json("docTags").$type<string[]>(),
  notes: text("docNotes"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type Document = typeof documents.$inferSelect;

export const carrierPackets = mysqlTable("carrier_packets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Carrier identity
  carrierName: varchar("carrierName", { length: 256 }).notNull(),
  mcNumber: varchar("mcNumber", { length: 32 }),
  dotNumber: varchar("dotNumber", { length: 32 }),
  companyId: int("companyId"),
  contactId: int("contactId"),
  // Authority & compliance
  authorityStatus: varchar("cpAuthorityStatus", { length: 32 }).default("pending"), // active, pending, revoked, suspended
  authorityType: varchar("cpAuthorityType", { length: 64 }), // common, contract, broker
  saferRating: varchar("saferRating", { length: 32 }), // satisfactory, conditional, unsatisfactory, none
  // Insurance
  insuranceProvider: varchar("insuranceProvider", { length: 256 }),
  insurancePolicyNumber: varchar("insurancePolicyNumber", { length: 128 }),
  insuranceExpiresAt: bigint("insuranceExpiresAt", { mode: "number" }),
  cargoInsuranceAmount: int("cargoInsuranceAmount"), // in dollars
  liabilityInsuranceAmount: int("liabilityInsuranceAmount"),
  autoInsuranceAmount: int("autoInsuranceAmount"),
  workersCompAmount: int("workersCompAmount"),
  // W9 / Tax
  w9Status: varchar("w9Status", { length: 32 }).default("missing"), // received, verified, missing, expired
  w9FileId: int("w9FileId"),
  taxId: varchar("taxId", { length: 32 }),
  // Operating info
  equipmentTypes: json("equipmentTypes").$type<string[]>(), // dry_van, flatbed, reefer, step_deck, etc.
  serviceAreas: json("serviceAreas").$type<string[]>(), // states/regions
  operatingRadius: varchar("operatingRadius", { length: 64 }), // local, regional, national, international
  fleetSize: int("fleetSize"),
  yearsInBusiness: int("yearsInBusiness"),
  // Carrier agreement
  agreementStatus: varchar("agreementStatus", { length: 32 }).default("pending"), // pending, signed, expired, terminated
  agreementSignedAt: bigint("agreementSignedAt", { mode: "number" }),
  agreementExpiresAt: bigint("agreementExpiresAt", { mode: "number" }),
  agreementFileId: int("agreementFileId"),
  // Payment
  paymentTerms: varchar("paymentTerms", { length: 64 }), // net_30, net_15, quick_pay, factoring
  factoringCompany: varchar("factoringCompany", { length: 256 }),
  // Compliance checklist
  complianceScore: int("complianceScore").default(0), // 0-100
  complianceChecklist: json("complianceChecklist").$type<{
    mcAuthority: boolean;
    dotNumber: boolean;
    insuranceCurrent: boolean;
    w9Received: boolean;
    agreementSigned: boolean;
    saferRatingOk: boolean;
    noSafetyViolations: boolean;
    bondRequired: boolean;
    bondVerified: boolean;
  }>(),
  // Overall status
  packetStatus: mysqlEnum("packetStatus", ["incomplete", "pending_review", "approved", "rejected", "expired"]).default("incomplete").notNull(),
  reviewNotes: text("reviewNotes"),
  approvedBy: int("approvedBy"),
  approvedAt: bigint("approvedAt", { mode: "number" }),
  // Metadata
  tags: json("cpTags").$type<string[]>(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type CarrierPacket = typeof carrierPackets.$inferSelect;

// ─── Win Probability Engine ───
export const dealScores = mysqlTable("deal_scores", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  userId: int("userId").notNull(),
  // Probability
  winProbability: int("winProbability").default(50).notNull(), // 0-100
  previousProbability: int("previousProbability"),
  probabilityTrend: varchar("probabilityTrend", { length: 16 }), // up, down, stable
  // Signal breakdown
  engagementSignal: int("engagementSignal").default(50), // 0-100: email opens, clicks, replies
  responseTimeSignal: int("responseTimeSignal").default(50), // 0-100: how fast they respond
  meetingFrequencySignal: int("meetingFrequencySignal").default(50), // 0-100: meeting cadence
  stakeholderSignal: int("stakeholderSignal").default(50), // 0-100: multi-threading
  competitiveSignal: int("competitiveSignal").default(50), // 0-100: competitive landscape
  budgetSignal: int("budgetSignal").default(50), // 0-100: budget confirmation
  timelineSignal: int("timelineSignal").default(50), // 0-100: urgency
  championSignal: int("championSignal").default(50), // 0-100: internal champion strength
  // AI analysis
  aiExplanation: text("aiExplanation"),
  riskFactors: json("riskFactors").$type<string[]>(),
  positiveIndicators: json("positiveIndicators").$type<string[]>(),
  recommendedActions: json("dsRecommendedActions").$type<string[]>(),
  // Revenue forecast
  forecastedValue: bigint("forecastedValue", { mode: "number" }),
  weightedValue: bigint("weightedValue", { mode: "number" }),
  expectedCloseDate: bigint("expectedCloseDate", { mode: "number" }),
  // Metadata
  scoredAt: bigint("scoredAt", { mode: "number" }).notNull(),
  scoringVersion: int("dsScoringVersion").default(1),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type DealScore = typeof dealScores.$inferSelect;

// ─── Revenue Autopilot ───
export const revenueBriefings = mysqlTable("revenue_briefings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  briefingDate: varchar("briefingDate", { length: 16 }).notNull(), // YYYY-MM-DD
  // Morning briefing content
  summary: text("summary").notNull(),
  revenueAtRisk: bigint("revenueAtRisk", { mode: "number" }),
  revenueOpportunity: bigint("revenueOpportunity", { mode: "number" }),
  // Action items
  actions: json("actions").$type<{
    type: string; // re_engage, upsell, close, follow_up, rescue
    priority: string; // critical, high, medium, low
    contactId?: number;
    dealId?: number;
    description: string;
    estimatedRevenue?: number;
  }[]>(),
  // Weekly scorecard
  weeklyMetrics: json("weeklyMetrics").$type<{
    callsMade?: number;
    emailsSent?: number;
    meetingsBooked?: number;
    dealsWon?: number;
    revenueClosed?: number;
    pipelineAdded?: number;
    aiCommentary?: string;
  }>(),
  // Status
  isRead: boolean("isRead").default(false).notNull(),
  actionsCompleted: int("actionsCompleted").default(0),
  totalActions: int("totalActions").default(0),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type RevenueBriefing = typeof revenueBriefings.$inferSelect;

// ─── Smart Notifications ───
export const smartNotifications = mysqlTable("smart_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Notification content
  title: varchar("notifTitle", { length: 256 }).notNull(),
  message: text("notifMessage").notNull(),
  type: varchar("notifType", { length: 64 }).notNull(), // call_now, deal_at_risk, hot_lead, appointment_reminder, document_expiring, revenue_opportunity, system
  priority: varchar("notifPriority", { length: 16 }).default("medium").notNull(), // critical, high, medium, low
  // Revenue impact
  estimatedRevenue: bigint("estimatedRevenue", { mode: "number" }),
  urgencyScore: int("urgencyScore").default(50), // 0-100
  // Associations
  contactId: int("notifContactId"),
  dealId: int("notifDealId"),
  companyId: int("notifCompanyId"),
  // Action
  actionUrl: varchar("actionUrl", { length: 512 }),
  actionLabel: varchar("actionLabel", { length: 128 }),
  // Status
  isRead: boolean("notifIsRead").default(false).notNull(),
  isDismissed: boolean("isDismissed").default(false).notNull(),
  readAt: bigint("readAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type SmartNotification = typeof smartNotifications.$inferSelect;

// ─── AI Meeting Prep ───
export const meetingPreps = mysqlTable("meeting_preps", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("mpContactId"),
  companyId: int("mpCompanyId"),
  dealId: int("mpDealId"),
  // Brief content
  briefTitle: varchar("briefTitle", { length: 256 }).notNull(),
  contactSummary: text("contactSummary"),
  companySummary: text("companySummary"),
  dealContext: text("dealContext"),
  recentActivity: json("recentActivity").$type<{ date: string; type: string; summary: string }[]>(),
  talkingPoints: json("talkingPoints").$type<string[]>(),
  questionsToAsk: json("questionsToAsk").$type<string[]>(),
  potentialObjections: json("potentialObjections").$type<{ objection: string; response: string }[]>(),
  competitorIntel: text("mpCompetitorIntel"),
  // Metadata
  meetingDate: bigint("meetingDate", { mode: "number" }),
  generatedAt: bigint("mpGeneratedAt", { mode: "number" }).notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type MeetingPrep = typeof meetingPreps.$inferSelect;


// ═══════════════════════════════════════════════════════════════════
// PHASE 14: COMPETITIVE FEATURE PARITY
// ═══════════════════════════════════════════════════════════════════

// ─── Load Management ────────────────────────────────────────────────
export const loads = mysqlTable("loads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("loadCompanyId"),
  contactId: int("loadContactId"),
  carrierId: int("loadCarrierId"),
  // Load Details
  referenceNumber: varchar("referenceNumber", { length: 64 }).notNull(),
  status: varchar("loadStatus", { length: 32 }).notNull().default("draft"), // draft, posted, dispatched, in_transit, delivered, closed, cancelled
  loadType: varchar("loadType", { length: 32 }).default("FTL"), // FTL, LTL, partial, intermodal
  commodity: varchar("commodity", { length: 256 }),
  weight: int("weight"),
  weightUnit: varchar("weightUnit", { length: 16 }).default("lbs"),
  pieces: int("pieces"),
  pallets: int("pallets"),
  dimensions: varchar("dimensions", { length: 128 }),
  equipmentType: varchar("equipmentType", { length: 64 }), // dry_van, reefer, flatbed, step_deck, etc.
  temperatureMin: int("temperatureMin"),
  temperatureMax: int("temperatureMax"),
  hazmat: boolean("hazmat").default(false),
  // Origin
  originCity: varchar("originCity", { length: 128 }),
  originState: varchar("originState", { length: 64 }),
  originZip: varchar("originZip", { length: 16 }),
  originAddress: text("originAddress"),
  originLat: varchar("originLat", { length: 32 }),
  originLng: varchar("originLng", { length: 32 }),
  // Destination
  destCity: varchar("destCity", { length: 128 }),
  destState: varchar("destState", { length: 64 }),
  destZip: varchar("destZip", { length: 16 }),
  destAddress: text("destAddress"),
  destLat: varchar("destLat", { length: 32 }),
  destLng: varchar("destLng", { length: 32 }),
  // Dates
  pickupDate: bigint("pickupDate", { mode: "number" }),
  pickupWindowStart: bigint("pickupWindowStart", { mode: "number" }),
  pickupWindowEnd: bigint("pickupWindowEnd", { mode: "number" }),
  deliveryDate: bigint("deliveryDate", { mode: "number" }),
  deliveryWindowStart: bigint("deliveryWindowStart", { mode: "number" }),
  deliveryWindowEnd: bigint("deliveryWindowEnd", { mode: "number" }),
  actualPickup: bigint("actualPickup", { mode: "number" }),
  actualDelivery: bigint("actualDelivery", { mode: "number" }),
  // Financials
  customerRate: bigint("customerRate", { mode: "number" }),
  carrierRate: bigint("carrierRate", { mode: "number" }),
  margin: bigint("margin", { mode: "number" }),
  marginPercent: varchar("marginPercent", { length: 16 }),
  // Tracking
  currentLocation: varchar("currentLocation", { length: 256 }),
  lastCheckIn: bigint("lastCheckIn", { mode: "number" }),
  estimatedArrival: bigint("estimatedArrival", { mode: "number" }),
  trackingNotes: text("trackingNotes"),
  // References
  bolNumber: varchar("bolNumber", { length: 64 }),
  proNumber: varchar("proNumber", { length: 64 }),
  poNumber: varchar("poNumber", { length: 64 }),
  dealId: int("loadDealId"),
  invoiceId: int("loadInvoiceId"),
  // Metadata
  specialInstructions: text("specialInstructions"),
  internalNotes: text("internalNotes"),
  miles: int("miles"),
  ratePerMile: varchar("ratePerMile", { length: 16 }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type Load = typeof loads.$inferSelect;
export type InsertLoad = typeof loads.$inferInsert;

// ─── Load Status History ────────────────────────────────────────────
export const loadStatusHistory = mysqlTable("load_status_history", {
  id: int("id").autoincrement().primaryKey(),
  loadId: int("loadId").notNull(),
  userId: int("lshUserId").notNull(),
  fromStatus: varchar("fromStatus", { length: 32 }),
  toStatus: varchar("toStatus", { length: 32 }).notNull(),
  notes: text("lshNotes"),
  location: varchar("lshLocation", { length: 256 }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type LoadStatusHistory = typeof loadStatusHistory.$inferSelect;

// ─── Carrier Profiles (Deep Vetting) ────────────────────────────────
export const carrierProfiles = mysqlTable("carrier_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("cpUserId").notNull(),
  companyId: int("cpCompanyId"),
  carrierPacketId: int("cpCarrierPacketId"),
  // Identity
  carrierName: varchar("cpCarrierName", { length: 256 }).notNull(),
  dotNumber: varchar("cpDotNumber", { length: 32 }),
  mcNumber: varchar("cpMcNumber", { length: 32 }),
  scacCode: varchar("scacCode", { length: 16 }),
  // FMCSA Data
  authorityStatus: varchar("authorityStatus", { length: 32 }), // active, inactive, revoked
  authorityGrantDate: bigint("authorityGrantDate", { mode: "number" }),
  safetyRating: varchar("safetyRating", { length: 32 }), // satisfactory, conditional, unsatisfactory
  safetyRatingDate: bigint("safetyRatingDate", { mode: "number" }),
  operatingStatus: varchar("operatingStatus", { length: 32 }), // authorized, not_authorized, out_of_service
  outOfServiceDate: bigint("outOfServiceDate", { mode: "number" }),
  // Insurance
  insuranceOnFile: boolean("insuranceOnFile").default(false),
  insuranceExpiry: bigint("insuranceExpiry", { mode: "number" }),
  liabilityAmount: bigint("liabilityAmount", { mode: "number" }),
  cargoInsurance: bigint("cargoInsurance", { mode: "number" }),
  bondSurety: varchar("bondSurety", { length: 256 }),
  // Fleet Info
  totalDrivers: int("totalDrivers"),
  totalPowerUnits: int("totalPowerUnits"),
  totalTrailers: int("totalTrailers"),
  // Performance Metrics
  onTimePickupRate: int("onTimePickupRate"),
  onTimeDeliveryRate: int("onTimeDeliveryRate"),
  claimsRatio: varchar("claimsRatio", { length: 16 }),
  avgResponseTime: int("avgResponseTime"), // minutes
  totalLoadsCompleted: int("totalLoadsCompleted").default(0),
  totalLoadsDeclined: int("totalLoadsDeclined").default(0),
  overallScore: int("overallScore"), // 0-100
  // Preferences
  preferredLanes: json("preferredLanes").$type<{ origin: string; dest: string; rate?: number }[]>(),
  equipmentTypes: json("cpEquipmentTypes").$type<string[]>(),
  serviceAreas: json("serviceAreas").$type<string[]>(),
  // Status
  vetStatus: varchar("vetStatus", { length: 32 }).default("pending"), // pending, approved, flagged, blacklisted
  vetNotes: text("vetNotes"),
  lastVetDate: bigint("lastVetDate", { mode: "number" }),
  autoFlagged: boolean("autoFlagged").default(false),
  flagReason: text("flagReason"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type CarrierProfile = typeof carrierProfiles.$inferSelect;
export type InsertCarrierProfile = typeof carrierProfiles.$inferInsert;

// ─── Load Board Posts ───────────────────────────────────────────────
export const loadBoardPosts = mysqlTable("load_board_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("lbpUserId").notNull(),
  loadId: int("lbpLoadId").notNull(),
  board: varchar("board", { length: 32 }).notNull(), // dat, truckstop, 123loadboard
  externalPostId: varchar("externalPostId", { length: 128 }),
  status: varchar("lbpStatus", { length: 32 }).default("active"), // active, expired, filled, cancelled
  postedAt: bigint("postedAt", { mode: "number" }).notNull(),
  expiresAt: bigint("expiresAt", { mode: "number" }),
  views: int("views").default(0),
  responses: int("responses").default(0),
  responseData: json("responseData").$type<{ carrierName: string; rate: number; mc: string; timestamp: number }[]>(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type LoadBoardPost = typeof loadBoardPosts.$inferSelect;

// ─── Invoices ───────────────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("invUserId").notNull(),
  loadId: int("invLoadId"),
  // Parties
  billToCompanyId: int("billToCompanyId"),
  billToContactId: int("billToContactId"),
  billToName: varchar("billToName", { length: 256 }),
  billToAddress: text("billToAddress"),
  billToEmail: varchar("billToEmail", { length: 256 }),
  payToName: varchar("payToName", { length: 256 }),
  payToAddress: text("payToAddress"),
  // Invoice Details
  invoiceNumber: varchar("invoiceNumber", { length: 64 }).notNull(),
  status: varchar("invStatus", { length: 32 }).default("draft"), // draft, sent, viewed, paid, overdue, void
  issueDate: bigint("issueDate", { mode: "number" }).notNull(),
  dueDate: bigint("dueDate", { mode: "number" }),
  paidDate: bigint("paidDate", { mode: "number" }),
  // Line Items
  lineItems: json("lineItems").$type<{ description: string; quantity: number; unitPrice: number; total: number }[]>(),
  subtotal: bigint("subtotal", { mode: "number" }),
  taxRate: varchar("taxRate", { length: 16 }),
  taxAmount: bigint("taxAmount", { mode: "number" }),
  totalAmount: bigint("totalAmount", { mode: "number" }).notNull(),
  amountPaid: bigint("amountPaid", { mode: "number" }).default(0),
  balanceDue: bigint("balanceDue", { mode: "number" }),
  // Payment
  paymentTerms: varchar("paymentTerms", { length: 64 }).default("Net 30"),
  paymentMethod: varchar("paymentMethod", { length: 32 }),
  paymentReference: varchar("paymentReference", { length: 128 }),
  // Metadata
  notes: text("invNotes"),
  internalMemo: text("invInternalMemo"),
  pdfUrl: text("pdfUrl"),
  sentAt: bigint("sentAt", { mode: "number" }),
  viewedAt: bigint("viewedAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ─── Customer Portal ────────────────────────────────────────────────
export const portalAccess = mysqlTable("portal_access", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("paContactId").notNull(),
  companyId: int("paCompanyId"),
  email: varchar("paEmail", { length: 256 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 512 }),
  accessToken: varchar("paAccessToken", { length: 512 }),
  isActive: boolean("paIsActive").default(true),
  lastLogin: bigint("paLastLogin", { mode: "number" }),
  permissions: json("paPermissions").$type<string[]>(), // quote, track, invoice, documents
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type PortalAccess = typeof portalAccess.$inferSelect;

export const portalQuotes = mysqlTable("portal_quotes", {
  id: int("id").autoincrement().primaryKey(),
  portalUserId: int("portalUserId").notNull(),
  companyId: int("pqCompanyId"),
  // Quote Details
  originCity: varchar("pqOriginCity", { length: 128 }),
  originState: varchar("pqOriginState", { length: 64 }),
  originZip: varchar("pqOriginZip", { length: 16 }),
  destCity: varchar("pqDestCity", { length: 128 }),
  destState: varchar("pqDestState", { length: 64 }),
  destZip: varchar("pqDestZip", { length: 16 }),
  commodity: varchar("pqCommodity", { length: 256 }),
  weight: int("pqWeight"),
  equipmentType: varchar("pqEquipmentType", { length: 64 }),
  pickupDate: bigint("pqPickupDate", { mode: "number" }),
  deliveryDate: bigint("pqDeliveryDate", { mode: "number" }),
  specialInstructions: text("pqSpecialInstructions"),
  // Response
  status: varchar("pqStatus", { length: 32 }).default("pending"), // pending, quoted, accepted, declined, expired
  quotedRate: bigint("quotedRate", { mode: "number" }),
  quotedBy: int("quotedBy"),
  quotedAt: bigint("quotedAt", { mode: "number" }),
  respondedAt: bigint("respondedAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type PortalQuote = typeof portalQuotes.$inferSelect;

// ─── Conversation Intelligence ──────────────────────────────────────
export const callRecordings = mysqlTable("call_recordings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("crUserId").notNull(),
  callLogId: int("crCallLogId"),
  contactId: int("crContactId"),
  dealId: int("crDealId"),
  // Recording
  recordingUrl: text("recordingUrl"),
  duration: int("crDuration"), // seconds
  direction: varchar("crDirection", { length: 16 }), // inbound, outbound
  // AI Analysis
  analyzed: boolean("analyzed").default(false),
  transcript: text("crTranscript"),
  summary: text("crSummary"),
  sentiment: varchar("sentiment", { length: 16 }), // positive, neutral, negative
  sentimentScore: int("sentimentScore"), // 0-100
  talkToListenRatio: varchar("talkToListenRatio", { length: 16 }),
  keyTopics: json("keyTopics").$type<string[]>(),
  actionItems: json("crActionItems").$type<{ item: string; assignee: string; deadline?: string }[]>(),
  objections: json("crObjections").$type<{ objection: string; response: string; handled: boolean }[]>(),
  competitorMentions: json("competitorMentions").$type<string[]>(),
  nextSteps: json("crNextSteps").$type<string[]>(),
  coachingInsights: json("coachingInsights").$type<{ area: string; suggestion: string; score: number }[]>(),
  // Metadata
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type CallRecording = typeof callRecordings.$inferSelect;

// ─── B2B Contact Database ───────────────────────────────────────────
export const b2bContacts = mysqlTable("b2b_contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("b2bUserId").notNull(),
  // Person
  firstName: varchar("b2bFirstName", { length: 128 }),
  lastName: varchar("b2bLastName", { length: 128 }),
  email: varchar("b2bEmail", { length: 256 }),
  phone: varchar("b2bPhone", { length: 64 }),
  jobTitle: varchar("b2bJobTitle", { length: 256 }),
  linkedinUrl: varchar("b2bLinkedinUrl", { length: 512 }),
  // Company
  companyName: varchar("b2bCompanyName", { length: 256 }),
  companyDomain: varchar("b2bCompanyDomain", { length: 256 }),
  industry: varchar("b2bIndustry", { length: 128 }),
  companySize: varchar("b2bCompanySize", { length: 64 }),
  revenue: varchar("b2bRevenue", { length: 64 }),
  location: varchar("b2bLocation", { length: 256 }),
  // Enrichment
  enrichmentSource: varchar("enrichmentSource", { length: 64 }),
  enrichedAt: bigint("enrichedAt", { mode: "number" }),
  confidence: int("b2bConfidence"), // 0-100
  // Import Status
  imported: boolean("b2bImported").default(false),
  importedContactId: int("importedContactId"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type B2BContact = typeof b2bContacts.$inferSelect;

export const enrichmentLogs = mysqlTable("enrichment_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("elUserId").notNull(),
  entityType: varchar("entityType", { length: 32 }), // contact, company, prospect
  entityId: int("entityId"),
  source: varchar("elSource", { length: 64 }),
  fieldsEnriched: json("fieldsEnriched").$type<string[]>(),
  previousData: json("previousData").$type<Record<string, any>>(),
  newData: json("newData").$type<Record<string, any>>(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type EnrichmentLog = typeof enrichmentLogs.$inferSelect;

// ─── Email Warmup ───────────────────────────────────────────────────
export const warmupCampaigns = mysqlTable("warmup_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("wuUserId").notNull(),
  smtpAccountId: int("wuSmtpAccountId").notNull(),
  // Config
  domain: varchar("wuDomain", { length: 256 }).notNull(),
  dailyTarget: int("dailyTarget").default(5),
  currentDaily: int("currentDaily").default(1),
  rampUpRate: int("rampUpRate").default(2), // increase per day
  maxDaily: int("maxDaily").default(50),
  // Status
  status: varchar("wuStatus", { length: 32 }).default("active"), // active, paused, completed, failed
  startDate: bigint("wuStartDate", { mode: "number" }).notNull(),
  endDate: bigint("wuEndDate", { mode: "number" }),
  currentDay: int("currentDay").default(1),
  totalSent: int("wuTotalSent").default(0),
  totalReceived: int("wuTotalReceived").default(0),
  totalReplied: int("wuTotalReplied").default(0),
  // Deliverability Metrics
  inboxRate: int("inboxRate"), // percentage
  spamRate: int("spamRate"),
  bounceRate: int("wuBounceRate"),
  reputationScore: int("reputationScore"), // 0-100
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("createdAt2", { mode: "number" }).notNull(),
});
export type WarmupCampaign = typeof warmupCampaigns.$inferSelect;

// ─── Anonymous Visitor Tracking ─────────────────────────────────────
export const visitorSessions = mysqlTable("visitor_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("vsUserId").notNull(), // tenant owner
  // Visitor Info
  visitorId: varchar("visitorId", { length: 128 }).notNull(), // anonymous cookie ID
  ipAddress: varchar("vsIpAddress", { length: 64 }),
  userAgent: text("vsUserAgent"),
  referrer: text("vsReferrer"),
  // Identified Company
  identifiedCompany: varchar("identifiedCompany", { length: 256 }),
  identifiedDomain: varchar("identifiedDomain", { length: 256 }),
  identifiedIndustry: varchar("identifiedIndustry", { length: 128 }),
  identifiedSize: varchar("identifiedSize", { length: 64 }),
  identificationConfidence: int("identificationConfidence"), // 0-100
  // Behavior
  pagesViewed: json("pagesViewed").$type<{ url: string; title: string; duration: number; timestamp: number }[]>(),
  totalPageViews: int("totalPageViews").default(1),
  totalDuration: int("totalDuration").default(0), // seconds
  firstVisit: bigint("firstVisit", { mode: "number" }).notNull(),
  lastVisit: bigint("lastVisit", { mode: "number" }).notNull(),
  visitCount: int("visitCount").default(1),
  // Conversion
  convertedToProspect: boolean("convertedToProspect").default(false),
  prospectId: int("vsProspectId"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type VisitorSession = typeof visitorSessions.$inferSelect;

export const trackedWebsites = mysqlTable("tracked_websites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("twUserId").notNull(),
  name: varchar("twName", { length: 256 }).notNull(),
  domain: varchar("twDomain", { length: 256 }).notNull(),
  trackingId: varchar("twTrackingId", { length: 64 }).notNull(),
  isActive: boolean("twIsActive").default(true),
  createdAt: bigint("twCreatedAt", { mode: "number" }).notNull(),
});
export type TrackedWebsite = typeof trackedWebsites.$inferSelect;

// ─── Website Platform Credentials (for AI auto-install) ─────────────
export const websitePlatformCredentials = mysqlTable("website_platform_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("wpcUserId").notNull(),
  websiteId: int("wpcWebsiteId").notNull(),
  platform: varchar("wpcPlatform", { length: 64 }).notNull(), // 'wordpress' | 'shopify' | 'webflow'
  // Credentials stored as JSON — never expose raw values to frontend
  credentialsJson: text("wpcCredentialsJson").notNull(), // JSON string: { wpUser, wpAppPassword } | { shopifyToken } | { webflowToken }
  createdAt: bigint("wpcCreatedAt", { mode: "number" }).notNull(),
  updatedAt: bigint("wpcUpdatedAt", { mode: "number" }).notNull(),
});
export type WebsitePlatformCredential = typeof websitePlatformCredentials.$inferSelect;

// ─── AI Order Entry (Email-to-Load) ─────────────────────────────────
export const inboundEmails = mysqlTable("inbound_emails", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("ieUserId").notNull(),
  // Email Details
  fromEmail: varchar("ieFromEmail", { length: 256 }),
  fromName: varchar("ieFromName", { length: 256 }),
  subject: varchar("ieSubject", { length: 512 }),
  bodyText: text("ieBodyText"),
  bodyHtml: text("ieBodyHtml"),
  receivedAt: bigint("ieReceivedAt", { mode: "number" }).notNull(),
  // AI Parsing
  parsed: boolean("ieParsed").default(false),
  parsedData: json("parsedData").$type<{
    origin?: { city: string; state: string; zip: string };
    destination?: { city: string; state: string; zip: string };
    commodity?: string;
    weight?: number;
    pickupDate?: string;
    deliveryDate?: string;
    rate?: number;
    equipment?: string;
    specialInstructions?: string;
    contactName?: string;
    contactPhone?: string;
  }>(),
  parseConfidence: int("parseConfidence"), // 0-100
  // Conversion
  convertedToLoad: boolean("convertedToLoad").default(false),
  loadId: int("ieLoadId"),
  contactId: int("ieContactId"),
  // Status
  status: varchar("ieStatus", { length: 32 }).default("new"), // new, parsed, converted, ignored
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type InboundEmail = typeof inboundEmails.$inferSelect;

// ─── White-Label Configuration ──────────────────────────────────────
export const whiteLabelConfig = mysqlTable("white_label_config", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("wlCompanyId").notNull(),
  // Branding
  brandName: varchar("brandName", { length: 256 }).notNull(),
  logoUrl: text("wlLogoUrl"),
  faviconUrl: text("faviconUrl"),
  // Colors
  primaryColor: varchar("primaryColor", { length: 16 }),
  secondaryColor: varchar("secondaryColor", { length: 16 }),
  accentColor: varchar("accentColor", { length: 16 }),
  backgroundColor: varchar("wlBackgroundColor", { length: 16 }),
  sidebarColor: varchar("sidebarColor", { length: 16 }),
  // Domain
  customDomain: varchar("customDomain", { length: 256 }),
  customDomainVerified: boolean("customDomainVerified").default(false),
  // Email Branding
  emailFromName: varchar("wlEmailFromName", { length: 128 }),
  emailFooter: text("wlEmailFooter"),
  // Portal Branding
  portalWelcomeMessage: text("portalWelcomeMessage"),
  portalHelpText: text("portalHelpText"),
  // Feature Toggles
  showPoweredBy: boolean("showPoweredBy").default(true),
  customCss: text("customCss"),
  isActive: boolean("wlIsActive").default(false),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("createdAt2", { mode: "number" }).notNull(),
});
export type WhiteLabelConfig = typeof whiteLabelConfig.$inferSelect;

// ─── Digital Onboarding ─────────────────────────────────────────────
export const onboardingFlows = mysqlTable("onboarding_flows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("ofUserId").notNull(),
  companyId: int("ofCompanyId"),
  // Flow Config
  flowName: varchar("flowName", { length: 256 }).notNull(),
  flowType: varchar("flowType", { length: 32 }).default("shipper"), // shipper, carrier, broker
  isActive: boolean("ofIsActive").default(true),
  // Steps
  steps: json("ofSteps").$type<{
    id: string;
    title: string;
    type: "form" | "document" | "signature" | "verification" | "review";
    fields?: { name: string; label: string; type: string; required: boolean }[];
    documentUrl?: string;
    description?: string;
  }[]>(),
  // Settings
  requireSignature: boolean("requireSignature").default(true),
  autoCreateContact: boolean("autoCreateContact").default(true),
  autoCreateCompany: boolean("autoCreateCompany").default(true),
  notifyOnComplete: boolean("notifyOnComplete").default(true),
  welcomeMessage: text("ofWelcomeMessage"),
  completionMessage: text("completionMessage"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("createdAt2", { mode: "number" }).notNull(),
});
export type OnboardingFlow = typeof onboardingFlows.$inferSelect;

export const onboardingSubmissions = mysqlTable("onboarding_submissions", {
  id: int("id").autoincrement().primaryKey(),
  flowId: int("osFlowId").notNull(),
  userId: int("osUserId"),
  // Submitter Info
  submitterName: varchar("submitterName", { length: 256 }),
  submitterEmail: varchar("submitterEmail", { length: 256 }),
  submitterPhone: varchar("submitterPhone", { length: 64 }),
  submitterCompany: varchar("submitterCompany", { length: 256 }),
  // Progress
  currentStep: int("currentStep").default(0),
  totalSteps: int("totalSteps"),
  status: varchar("osStatus", { length: 32 }).default("in_progress"), // in_progress, pending_review, approved, rejected
  formData: json("formData").$type<Record<string, any>>(),
  // Signature
  signatureUrl: text("signatureUrl"),
  signedAt: bigint("signedAt", { mode: "number" }),
  signedIp: varchar("signedIp", { length: 64 }),
  // Result
  createdContactId: int("createdContactId"),
  createdCompanyId: int("createdCompanyId"),
  reviewedBy: int("reviewedBy"),
  reviewNotes: text("osReviewNotes"),
  completedAt: bigint("osCompletedAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type OnboardingSubmission = typeof onboardingSubmissions.$inferSelect;

// ─── Subscription Plans & Trials ────────────────────────────────────
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("spName", { length: 128 }).notNull(),
  tier: varchar("tier", { length: 32 }).notNull(), // starter, professional, enterprise, white_label
  pricePerUser: int("pricePerUser").notNull(), // cents per month
  maxUsers: int("maxUsers"),
  // Feature Flags
  features: json("spFeatures").$type<string[]>(),
  description: text("spDescription"),
  isActive: boolean("spIsActive").default(true),
  trialDays: int("trialDays").default(60), // 2 months free
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

export const tenantSubscriptions = mysqlTable("tenant_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("tsCompanyId").notNull(),
  planId: int("tsPlanId").notNull(),
  // Status
  status: varchar("tsStatus", { length: 32 }).default("trial"), // trial, active, past_due, cancelled, expired
  // Trial
  trialStart: bigint("trialStart", { mode: "number" }),
  trialEnd: bigint("trialEnd", { mode: "number" }),
  // Billing
  billingStart: bigint("billingStart", { mode: "number" }),
  currentPeriodStart: bigint("currentPeriodStart", { mode: "number" }),
  currentPeriodEnd: bigint("currentPeriodEnd", { mode: "number" }),
  cancelledAt: bigint("cancelledAt", { mode: "number" }),
  // Payment
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  // Usage
  currentUsers: int("currentUsers").default(1),
  monthlyAmount: int("monthlyAmount"), // cents
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("tsUpdatedAt", { mode: "number" }).notNull(),
});
export type TenantSubscription = typeof tenantSubscriptions.$inferSelect;

// ─── Migration Jobs (One-Touch Integration) ─────────────────────────
export const migrationJobs = mysqlTable("migration_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("mjUserId").notNull(),
  companyId: int("mjCompanyId"),
  // Source
  sourcePlatform: varchar("sourcePlatform", { length: 64 }).notNull(), // hubspot, salesforce, dat, tai, zoho, csv
  sourceCredentials: text("sourceCredentials"), // encrypted
  // Progress
  status: varchar("mjStatus", { length: 32 }).default("pending"), // pending, validating, importing, mapping, completed, failed
  totalRecords: int("totalRecords").default(0),
  importedRecords: int("importedRecords").default(0),
  failedRecords: int("failedRecords").default(0),
  skippedRecords: int("skippedRecords").default(0),
  // Details
  entityTypes: json("entityTypes").$type<string[]>(), // contacts, companies, deals, loads, carriers
  fieldMapping: json("fieldMapping").$type<Record<string, string>>(),
  importLog: json("importLog").$type<{ timestamp: number; message: string; level: string }[]>(),
  errorDetails: json("errorDetails").$type<{ record: string; error: string }[]>(),
  // Timing
  startedAt: bigint("mjStartedAt", { mode: "number" }),
  completedAt: bigint("mjCompletedAt", { mode: "number" }),
  estimatedTimeRemaining: int("estimatedTimeRemaining"), // seconds
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type MigrationJob = typeof migrationJobs.$inferSelect;
export type InsertMigrationJob = typeof migrationJobs.$inferInsert;
// ============================================================
// PHASE 16:6: AUTONOMOUS DIGITAL FREIGHT MARKETPLACE + AXIOM Autopilot
// ============================================================

// Marketplace Loads — shippers post loads for free
export const marketplaceLoads = mysqlTable("marketplace_loads", {
  id: int("id").primaryKey().autoincrement(),
  // Shipper info
  shipperUserId: varchar("shipperUserId", { length: 255 }),
  shipperCompanyName: varchar("shipperCompanyName", { length: 255 }).notNull(),
  shipperContactName: varchar("shipperContactName", { length: 255 }).notNull(),
  shipperEmail: varchar("shipperEmail", { length: 255 }).notNull(),
  shipperPhone: varchar("shipperPhone", { length: 50 }),
  // Load details
  loadNumber: varchar("loadNumber", { length: 50 }).notNull(),
  commodity: varchar("commodity", { length: 255 }).notNull(),
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(),
  pieces: int("pieces"),
  pallets: int("pallets"),
  lengthInches: decimal("lengthInches", { precision: 10, scale: 2 }),
  widthInches: decimal("widthInches", { precision: 10, scale: 2 }),
  heightInches: decimal("heightInches", { precision: 10, scale: 2 }),
  equipmentType: varchar("equipmentType", { length: 50 }).notNull(), // dry_van, flatbed, reefer, etc.
  specialRequirements: text("specialRequirements"),
  hazmat: boolean("hazmat").default(false),
  temperatureControlled: boolean("temperatureControlled").default(false),
  tempMin: decimal("tempMin", { precision: 5, scale: 1 }),
  tempMax: decimal("tempMax", { precision: 5, scale: 1 }),
  // Origin
  originCity: varchar("originCity", { length: 100 }).notNull(),
  originState: varchar("originState", { length: 50 }).notNull(),
  originZip: varchar("originZip", { length: 20 }).notNull(),
  originAddress: text("originAddress"),
  pickupDate: bigint("pickupDate", { mode: "number" }).notNull(),
  pickupWindowStart: varchar("pickupWindowStart", { length: 10 }),
  pickupWindowEnd: varchar("pickupWindowEnd", { length: 10 }),
  // Destination
  destCity: varchar("destCity", { length: 100 }).notNull(),
  destState: varchar("destState", { length: 50 }).notNull(),
  destZip: varchar("destZip", { length: 20 }).notNull(),
  destAddress: text("destAddress"),
  deliveryDate: bigint("deliveryDate", { mode: "number" }).notNull(),
  deliveryWindowStart: varchar("deliveryWindowStart", { length: 10 }),
  deliveryWindowEnd: varchar("deliveryWindowEnd", { length: 10 }),
  // Pricing
  shipperRate: decimal("shipperRate", { precision: 12, scale: 2 }), // what shipper pays us
  carrierRate: decimal("carrierRate", { precision: 12, scale: 2 }), // what we pay carrier
  margin: decimal("margin", { precision: 12, scale: 2 }), // our profit
  marginPercent: decimal("marginPercent", { precision: 5, scale: 2 }),
  // Status
  status: varchar("status", { length: 30 }).notNull().default("posted"), // posted, matching, matched, booked, dispatched, in_transit, delivered, completed, cancelled
  // Matched carrier
  matchedCarrierId: int("matchedCarrierId"),
  matchedCarrierName: varchar("matchedCarrierName", { length: 255 }),
  matchedCarrierDot: varchar("matchedCarrierDot", { length: 20 }),
  matchedCarrierMc: varchar("matchedCarrierMc", { length: 20 }),
  matchScore: decimal("matchScore", { precision: 5, scale: 2 }), // AI match quality 0-100
  // Distance & route
  distanceMiles: decimal("distanceMiles", { precision: 10, scale: 2 }),
  estimatedTransitHours: decimal("estimatedTransitHours", { precision: 6, scale: 1 }),
  // Consolidation
  isConsolidated: boolean("isConsolidated").default(false),
  consolidationGroupId: int("consolidationGroupId"),
  // Timestamps
  bookedAt: bigint("bookedAt", { mode: "number" }),
  dispatchedAt: bigint("dispatchedAt", { mode: "number" }),
  pickedUpAt: bigint("pickedUpAt", { mode: "number" }),
  deliveredAt: bigint("deliveredAt", { mode: "number" }),
  completedAt: bigint("completedAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
  companyId: int("companyId"),
});
export type MarketplaceLoad = typeof marketplaceLoads.$inferSelect;
export type InsertMarketplaceLoad = typeof marketplaceLoads.$inferInsert;

// Marketplace Bids — carriers bid on loads
export const marketplaceBids = mysqlTable("marketplace_bids", {
  id: int("id").primaryKey().autoincrement(),
  loadId: int("loadId").notNull(),
  carrierId: int("carrierId"),
  carrierName: varchar("carrierName", { length: 255 }).notNull(),
  carrierDot: varchar("carrierDot", { length: 20 }),
  carrierMc: varchar("carrierMc", { length: 20 }),
  carrierEmail: varchar("carrierEmail", { length: 255 }),
  carrierPhone: varchar("carrierPhone", { length: 50 }),
  bidRate: decimal("bidRate", { precision: 12, scale: 2 }).notNull(),
  estimatedPickup: bigint("estimatedPickup", { mode: "number" }),
  estimatedDelivery: bigint("estimatedDelivery", { mode: "number" }),
  equipmentType: varchar("equipmentType", { length: 50 }),
  driverName: varchar("driverName", { length: 255 }),
  driverPhone: varchar("driverPhone", { length: 50 }),
  truckNumber: varchar("truckNumber", { length: 50 }),
  trailerNumber: varchar("trailerNumber", { length: 50 }),
  insuranceVerified: boolean("insuranceVerified").default(false),
  safetyRating: varchar("safetyRating", { length: 20 }),
  matchScore: decimal("matchScore", { precision: 5, scale: 2 }), // AI-calculated fit score
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, rejected, expired
  notes: text("notes"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  companyId: int("companyId"),
});
export type MarketplaceBid = typeof marketplaceBids.$inferSelect;

// Marketplace Payments — escrow: shipper pays us, we pay carrier after delivery
export const marketplacePayments = mysqlTable("marketplace_payments", {
  id: int("id").primaryKey().autoincrement(),
  loadId: int("loadId").notNull(),
  // Shipper payment (inbound)
  shipperPaymentStatus: varchar("shipperPaymentStatus", { length: 20 }).notNull().default("pending"), // pending, collected, refunded
  shipperAmount: decimal("shipperAmount", { precision: 12, scale: 2 }).notNull(),
  shipperPaymentMethod: varchar("shipperPaymentMethod", { length: 30 }), // credit_card, ach, wire, check
  shipperPaymentRef: varchar("shipperPaymentRef", { length: 100 }),
  shipperPaidAt: bigint("shipperPaidAt", { mode: "number" }),
  // Carrier payment (outbound)
  carrierPaymentStatus: varchar("carrierPaymentStatus", { length: 20 }).notNull().default("pending"), // pending, processing, paid, disputed
  carrierAmount: decimal("carrierAmount", { precision: 12, scale: 2 }).notNull(),
  carrierPaymentMethod: varchar("carrierPaymentMethod", { length: 30 }), // ach, check, quickpay
  carrierPaymentRef: varchar("carrierPaymentRef", { length: 100 }),
  carrierPaidAt: bigint("carrierPaidAt", { mode: "number" }),
  // Margin
  grossMargin: decimal("grossMargin", { precision: 12, scale: 2 }),
  marginPercent: decimal("marginPercent", { precision: 5, scale: 2 }),
  // Escrow
  escrowStatus: varchar("escrowStatus", { length: 20 }).notNull().default("unfunded"), // unfunded, funded, released, disputed
  escrowFundedAt: bigint("escrowFundedAt", { mode: "number" }),
  escrowReleasedAt: bigint("escrowReleasedAt", { mode: "number" }),
  // Invoice
  invoiceNumber: varchar("invoiceNumber", { length: 50 }),
  invoiceGeneratedAt: bigint("invoiceGeneratedAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  companyId: int("companyId"),
});
export type MarketplacePayment = typeof marketplacePayments.$inferSelect;

// Marketplace Tracking — real-time GPS tracking events
export const marketplaceTracking = mysqlTable("marketplace_tracking", {
  id: int("id").primaryKey().autoincrement(),
  loadId: int("loadId").notNull(),
  eventType: varchar("eventType", { length: 30 }).notNull(), // gps_update, status_change, checkpoint, delay, eta_update, pickup_confirmed, delivery_confirmed
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  description: text("description"),
  currentEta: bigint("currentEta", { mode: "number" }),
  milesRemaining: decimal("milesRemaining", { precision: 10, scale: 2 }),
  speedMph: decimal("speedMph", { precision: 5, scale: 1 }),
  heading: varchar("heading", { length: 10 }), // N, NE, E, SE, S, SW, W, NW
  temperature: decimal("temperature", { precision: 5, scale: 1 }), // for reefer loads
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  companyId: int("companyId"),
});
export type MarketplaceTrackingEvent = typeof marketplaceTracking.$inferSelect;

// Marketplace Documents — auto-generated paperwork
export const marketplaceDocuments = mysqlTable("marketplace_documents", {
  id: int("id").primaryKey().autoincrement(),
  loadId: int("loadId").notNull(),
  docType: varchar("docType", { length: 30 }).notNull(), // bol, rate_confirmation, carrier_packet, insurance_cert, delivery_receipt, invoice, pod
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("generated"), // generated, signed, verified, expired
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 255 }),
  generatedBy: varchar("generatedBy", { length: 20 }).notNull().default("ai"), // ai, manual, upload
  signedBy: varchar("signedBy", { length: 255 }),
  signedAt: bigint("signedAt", { mode: "number" }),
  expiresAt: bigint("expiresAt", { mode: "number" }),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  companyId: int("companyId"),
});
export type MarketplaceDocument = typeof marketplaceDocuments.$inferSelect;

// Lane Analytics — historical lane data for demand prediction
export const laneAnalytics = mysqlTable("lane_analytics", {
  id: int("id").primaryKey().autoincrement(),
  originCity: varchar("originCity", { length: 100 }).notNull(),
  originState: varchar("originState", { length: 50 }).notNull(),
  destCity: varchar("destCity", { length: 100 }).notNull(),
  destState: varchar("destState", { length: 50 }).notNull(),
  equipmentType: varchar("equipmentType", { length: 50 }).notNull(),
  // Volume metrics
  totalLoads: int("totalLoads").notNull().default(0),
  avgRate: decimal("avgRate", { precision: 12, scale: 2 }),
  minRate: decimal("minRate", { precision: 12, scale: 2 }),
  maxRate: decimal("maxRate", { precision: 12, scale: 2 }),
  avgMargin: decimal("avgMargin", { precision: 5, scale: 2 }),
  // Demand prediction
  demandScore: decimal("demandScore", { precision: 5, scale: 2 }), // 0-100 predicted demand
  demandTrend: varchar("demandTrend", { length: 20 }), // rising, stable, falling
  seasonalFactor: decimal("seasonalFactor", { precision: 4, scale: 2 }), // multiplier
  nextWeekPrediction: int("nextWeekPrediction"), // predicted loads next week
  // Carrier availability
  availableCarriers: int("availableCarriers").default(0),
  avgTransitHours: decimal("avgTransitHours", { precision: 6, scale: 1 }),
  distanceMiles: decimal("distanceMiles", { precision: 10, scale: 2 }),
  // Timestamps
  periodStart: bigint("periodStart", { mode: "number" }).notNull(),
  periodEnd: bigint("periodEnd", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
  companyId: int("companyId"),
});
export type LaneAnalytic = typeof laneAnalytics.$inferSelect;

// Consolidation Opportunities — AI-identified shipment combinations
export const consolidationOpportunities = mysqlTable("consolidation_opportunities", {
  id: int("id").primaryKey().autoincrement(),
  groupId: varchar("groupId", { length: 50 }).notNull(), // unique group identifier
  status: varchar("status", { length: 20 }).notNull().default("identified"), // identified, proposed, accepted, executed, expired
  // Route
  originRegion: varchar("originRegion", { length: 100 }).notNull(),
  destRegion: varchar("destRegion", { length: 100 }).notNull(),
  // Loads in this consolidation
  loadIds: json("loadIds").$type<number[]>().notNull(),
  loadCount: int("loadCount").notNull(),
  // Savings
  individualCost: decimal("individualCost", { precision: 12, scale: 2 }).notNull(), // cost if shipped separately
  consolidatedCost: decimal("consolidatedCost", { precision: 12, scale: 2 }).notNull(), // cost if consolidated
  savings: decimal("savings", { precision: 12, scale: 2 }).notNull(),
  savingsPercent: decimal("savingsPercent", { precision: 5, scale: 2 }),
  // Capacity
  totalWeight: decimal("totalWeight", { precision: 12, scale: 2 }),
  capacityUtilization: decimal("capacityUtilization", { precision: 5, scale: 2 }), // % of truck capacity used
  equipmentType: varchar("equipmentType", { length: 50 }),
  // AI reasoning
  aiReasoning: text("aiReasoning"),
  confidenceScore: decimal("confidenceScore", { precision: 5, scale: 2 }), // 0-100
  // Timing
  windowStart: bigint("windowStart", { mode: "number" }),
  windowEnd: bigint("windowEnd", { mode: "number" }),
  expiresAt: bigint("expiresAt", { mode: "number" }),
  executedAt: bigint("executedAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  companyId: int("companyId"),
});
export type ConsolidationOpportunity = typeof consolidationOpportunities.$inferSelect;


// ─── Email Masking ──────────────────────────────────────────────────
export const emailMaskSettings = mysqlTable("email_mask_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId"),
  // Display "From" — what recipients see
  displayName: varchar("displayName", { length: 128 }).notNull(), // e.g. "J. Lavallee"
  displayEmail: varchar("displayEmail", { length: 256 }).notNull(), // e.g. "jlavallee@shiplw.com"
  // Reply-To — where replies go (can differ from display)
  replyToName: varchar("replyToName", { length: 128 }),
  replyToEmail: varchar("replyToEmail", { length: 256 }),
  // Organization branding in email headers
  organizationName: varchar("organizationName", { length: 256 }),
  // Whether this mask is active
  isActive: boolean("isActive").default(true),
  // Whether to apply to ALL outbound emails or only campaigns
  applyTo: varchar("applyTo", { length: 32 }).default("all"), // all, campaigns_only, manual_only
  // DMARC alignment notes (informational)
  dmarcAlignment: varchar("dmarcAlignment", { length: 16 }).default("relaxed"), // relaxed, strict
  // Metadata
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type EmailMaskSetting = typeof emailMaskSettings.$inferSelect;

// ─── Password Reset Tokens ───
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: bigint("expiresAt", { mode: "number" }).notNull(),
  usedAt: bigint("usedAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// ─── CRM Bible Shares ───
// Tracks shared access to CRM Bible sections/features beyond the user's default role access
export const bibleShares = mysqlTable("bible_shares", {
  id: int("id").autoincrement().primaryKey(),
  // Who granted the share
  sharedByUserId: int("sharedByUserId").notNull(),
  // Who received the share
  sharedWithUserId: int("sharedWithUserId").notNull(),
  // What was shared — sectionId (e.g. "marketing") and optional featureId (e.g. "campaigns")
  sectionId: varchar("sectionId", { length: 64 }).notNull(),
  featureId: varchar("featureId", { length: 64 }), // null = entire section
  // Permission level
  permission: mysqlEnum("permission", ["view", "collaborate"]).default("view").notNull(),
  // Tenant scoping
  tenantCompanyId: int("tenantCompanyId").notNull(),
  // Soft-revoke: null = active, set = revoked
  revokedAt: bigint("revokedAt", { mode: "number" }),
  revokedByUserId: int("revokedByUserId"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type BibleShare = typeof bibleShares.$inferSelect;
export type InsertBibleShare = typeof bibleShares.$inferInsert;


// ═══════════════════════════════════════════════════════════════
// AI CREDIT SYSTEM
// Model:
//   - CRM-related AI features are FREE (included in subscription)
//   - Non-CRM AI usage requires purchased credits
//   - Credits sold by AXIOM Owner at 25% markup on Manus pricing
//   - Billed directly to tenant company's Stripe card on file
// ═══════════════════════════════════════════════════════════════

// ─── AI Credit Packages (defined by AXIOM Owner, priced at Manus cost + 25%) ───
export const aiCreditPackages = mysqlTable("ai_credit_packages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(), // e.g. "Starter", "Growth", "Enterprise"
  description: text("description"),
  credits: int("credits").notNull(), // number of AI credits
  manusBasePriceCents: int("manusBasePriceCents").notNull(), // Manus list price in cents
  markupPercent: int("markupPercent").default(25).notNull(), // always 25% markup
  finalPriceCents: int("finalPriceCents").notNull(), // manusBasePriceCents * 1.25 (what tenant pays)
  isActive: boolean("isActive").default(true).notNull(),
  stripePriceId: varchar("stripePriceId", { length: 128 }), // Stripe price ID for checkout
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type AiCreditPackage = typeof aiCreditPackages.$inferSelect;

// ─── Tenant AI Credit Balances ───
export const tenantAiCredits = mysqlTable("tenant_ai_credits", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull().unique(),
  availableCredits: int("availableCredits").default(0).notNull(), // credits available to spend
  lifetimePurchasedCredits: int("lifetimePurchasedCredits").default(0).notNull(), // total ever bought
  lifetimeUsedCredits: int("lifetimeUsedCredits").default(0).notNull(), // total ever consumed
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }), // tenant's Stripe customer ID for billing
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type TenantAiCredits = typeof tenantAiCredits.$inferSelect;

// ─── AI Credit Transactions (full audit log) ───
export const aiCreditTransactions = mysqlTable("ai_credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  userId: int("userId"), // which user triggered the action
  type: mysqlEnum("type", [
    "purchase",    // Tenant bought credits via Stripe
    "crm_free",    // CRM AI feature used — no credits deducted (logged for analytics)
    "paid_usage",  // Non-CRM AI feature — credits deducted
    "refund",      // Credits returned
    "adjustment",  // Manual correction by AXIOM Owner
  ]).notNull(),
  credits: int("credits").notNull(), // positive = added, negative = deducted (0 for crm_free)
  balanceBefore: int("balanceBefore").notNull(),
  balanceAfter: int("balanceAfter").notNull(),
  description: varchar("description", { length: 512 }),
  featureKey: varchar("featureKey", { length: 128 }), // e.g. "ai_ghostwriter", "ai_general_chat"
  isCrmFree: boolean("isCrmFree").default(false).notNull(), // true = CRM feature, no charge
  packageId: int("packageId"), // FK to ai_credit_packages if purchase
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }),
  pricePaidCents: int("pricePaidCents"), // what tenant paid (with 25% markup)
  performedBy: int("performedBy"), // userId or null for system
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type AiCreditTransaction = typeof aiCreditTransactions.$inferSelect;

// ─── User AI Credit Allocations (per-user monthly limits set by Company Admin) ───
export const userAiAllocations = mysqlTable("user_ai_allocations", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  userId: int("userId").notNull(),
  monthlyLimit: int("monthlyLimit").notNull(), // paid credits per month (0 = no paid AI access)
  currentMonthUsed: int("currentMonthUsed").default(0).notNull(),
  resetDate: bigint("resetDate", { mode: "number" }).notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});

export type UserAiAllocation = typeof userAiAllocations.$inferSelect;

// ─── Subscription Invoices (Stripe-synced billing records for SaaS subscriptions) ─
export const subscriptionInvoices = mysqlTable("subscription_invoices", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 128 }).unique(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }),
  // Invoice details
  amountDueCents: int("amountDueCents").notNull(),
  amountPaidCents: int("amountPaidCents").default(0).notNull(),
  currency: varchar("currency", { length: 8 }).default("usd").notNull(),
  description: text("siDescription"),
  invoiceType: mysqlEnum("siInvoiceType", ["subscription", "ai_credits", "user_addon", "manual"]).default("subscription").notNull(),
  // Status tracking
  siStatus: mysqlEnum("siStatus", ["draft", "open", "paid", "void", "uncollectible", "overdue"]).default("open").notNull(),
  // Dates (UTC ms)
  periodStart: bigint("siPeriodStart", { mode: "number" }),
  periodEnd: bigint("siPeriodEnd", { mode: "number" }),
  dueDate: bigint("siDueDate", { mode: "number" }),
  paidAt: bigint("siPaidAt", { mode: "number" }),
  voidedAt: bigint("siVoidedAt", { mode: "number" }),
  // PDF
  invoicePdfUrl: varchar("invoicePdfUrl", { length: 512 }),
  hostedInvoiceUrl: varchar("hostedInvoiceUrl", { length: 512 }),
  // Notes
  notes: text("siNotes"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type SubscriptionInvoice = typeof subscriptionInvoices.$inferSelect;
export type InsertSubscriptionInvoice = typeof subscriptionInvoices.$inferInsert;

// ─── Payment Methods (cached Stripe card info per tenant) ────────────────────
export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  stripePaymentMethodId: varchar("stripePaymentMethodId", { length: 128 }).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }).notNull(),
  brand: varchar("brand", { length: 32 }), // visa, mastercard, amex, etc.
  last4: varchar("last4", { length: 4 }),
  expMonth: int("expMonth"),
  expYear: int("expYear"),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type PaymentMethod = typeof paymentMethods.$inferSelect;

// ─── Business Category & Vertical Intelligence ───────────────────────────────
// businessCategory stored on tenantCompanies.settings JSON for now (no migration needed)
// Feature usage tracking for trial health scoring
export const featureUsageTracking = mysqlTable("feature_usage_tracking", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  featureKey: varchar("featureKey", { length: 128 }).notNull(), // e.g. "contacts", "deals", "campaigns"
  usageCount: int("usageCount").default(0).notNull(),
  lastUsedAt: bigint("lastUsedAt", { mode: "number" }),
  firstUsedAt: bigint("firstUsedAt", { mode: "number" }),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type FeatureUsageTracking = typeof featureUsageTracking.$inferSelect;

// ─── Trial Health Scores ─────────────────────────────────────────────────────
export const trialHealthScores = mysqlTable("trial_health_scores", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull().unique(),
  healthScore: int("healthScore").default(0).notNull(), // 0-100
  engagementLevel: mysqlEnum("engagementLevel", ["hot", "warm", "cold", "at_risk", "churned"]).default("cold").notNull(),
  featuresUsedCount: int("featuresUsedCount").default(0).notNull(),
  totalFeatures: int("totalFeatures").default(20).notNull(),
  lastLoginAt: bigint("lastLoginAt", { mode: "number" }),
  daysSinceLastLogin: int("daysSinceLastLogin").default(0),
  trialDaysRemaining: int("trialDaysRemaining"),
  assignedAccountManagerId: int("assignedAccountManagerId"), // userId of AXIOM account manager
  lastContactedAt: bigint("lastContactedAt", { mode: "number" }),
  callOutcome: varchar("callOutcome", { length: 256 }),
  notes: text("thsNotes"),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type TrialHealthScore = typeof trialHealthScores.$inferSelect;

// ─── Trial Email Campaign Log ─────────────────────────────────────────────────
export const trialEmailLog = mysqlTable("trial_email_log", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  campaignType: varchar("campaignType", { length: 64 }).notNull(), // "day1_welcome", "day3_tips", "day7_weekly", etc.
  sentAt: bigint("sentAt", { mode: "number" }).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 512 }),
  opened: boolean("opened").default(false),
  clicked: boolean("clicked").default(false),
});
export type TrialEmailLog = typeof trialEmailLog.$inferSelect;

// ─── Shipments (Shipping & Receiving module) ─────────────────────────────────
export const shipments = mysqlTable("shipments", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  shipmentType: mysqlEnum("shipmentType", ["inbound", "outbound"]).notNull(),
  referenceNumber: varchar("referenceNumber", { length: 128 }),
  status: mysqlEnum("shipStatus", ["pending", "ordered", "in_transit", "out_for_delivery", "delivered", "received", "exception", "cancelled"]).default("pending").notNull(),
  // Parties
  supplierId: int("supplierId"), // companyId
  customerId: int("customerId"), // companyId
  contactId: int("contactId"),
  dealId: int("dealId"),
  // Carrier
  carrierName: varchar("carrierName", { length: 256 }),
  trackingNumber: varchar("trackingNumber", { length: 256 }),
  carrierService: varchar("carrierService", { length: 128 }),
  // Dates
  shipDate: bigint("shipDate", { mode: "number" }),
  expectedDelivery: bigint("expectedDelivery", { mode: "number" }),
  actualDelivery: bigint("actualDelivery", { mode: "number" }),
  // Items
  description: text("shipDescription"),
  weight: varchar("weight", { length: 64 }),
  dimensions: varchar("dimensions", { length: 128 }),
  quantity: int("quantity"),
  // Addresses
  originAddress: text("originAddress"),
  destinationAddress: text("destinationAddress"),
  // Documents
  bolUrl: varchar("bolUrl", { length: 512 }),
  packingListUrl: varchar("packingListUrl", { length: 512 }),
  notes: text("shipNotes"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = typeof shipments.$inferInsert;

// ─── Accounts Receivable — Customer Invoices ───────────────────────────────
export const arInvoices = mysqlTable("ar_invoices", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  invoiceNumber: varchar("arInvoiceNumber", { length: 64 }).notNull(),
  customerId: int("arCustomerId"), // companyId
  contactId: int("arContactId"),
  dealId: int("arDealId"),
  status: mysqlEnum("arStatus", ["draft", "sent", "viewed", "partial", "paid", "overdue", "void"]).default("draft").notNull(),
  issueDate: bigint("arIssueDate", { mode: "number" }).notNull(),
  dueDate: bigint("arDueDate", { mode: "number" }),
  paidDate: bigint("arPaidDate", { mode: "number" }),
  lineItems: json("arLineItems").$type<{ description: string; quantity: number; unitPrice: number; total: number }[]>(),
  subtotalCents: int("arSubtotalCents").default(0).notNull(),
  taxRatePct: varchar("arTaxRatePct", { length: 16 }),
  taxAmountCents: int("arTaxAmountCents").default(0),
  totalCents: int("arTotalCents").notNull(),
  amountPaidCents: int("arAmountPaidCents").default(0).notNull(),
  balanceDueCents: int("arBalanceDueCents").notNull(),
  paymentTerms: varchar("arPaymentTerms", { length: 64 }).default("Net 30"),
  notes: text("arNotes"),
  pdfUrl: varchar("arPdfUrl", { length: 512 }),
  sentAt: bigint("arSentAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type ArInvoice = typeof arInvoices.$inferSelect;
export type InsertArInvoice = typeof arInvoices.$inferInsert;

// ─── Accounts Payable — Vendor Bills ────────────────────────────────────
export const apBills = mysqlTable("ap_bills", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  billNumber: varchar("apBillNumber", { length: 64 }),
  vendorId: int("apVendorId"), // companyId
  contactId: int("apContactId"),
  status: mysqlEnum("apStatus", ["draft", "pending", "approved", "partial", "paid", "overdue", "void"]).default("pending").notNull(),
  issueDate: bigint("apIssueDate", { mode: "number" }).notNull(),
  dueDate: bigint("apDueDate", { mode: "number" }),
  paidDate: bigint("apPaidDate", { mode: "number" }),
  lineItems: json("apLineItems").$type<{ description: string; quantity: number; unitPrice: number; total: number }[]>(),
  subtotalCents: int("apSubtotalCents").default(0).notNull(),
  taxAmountCents: int("apTaxAmountCents").default(0),
  totalCents: int("apTotalCents").notNull(),
  amountPaidCents: int("apAmountPaidCents").default(0).notNull(),
  balanceDueCents: int("apBalanceDueCents").notNull(),
  category: varchar("apCategory", { length: 128 }), // e.g. "Supplies", "Rent", "Utilities"
  notes: text("apNotes"),
  attachmentUrl: varchar("apAttachmentUrl", { length: 512 }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type ApBill = typeof apBills.$inferSelect;
export type InsertApBill = typeof apBills.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATION MONSTER — Custom Fields, Activity History, Skins, Migration Jobs
// ═══════════════════════════════════════════════════════════════════════════

// ─── Skin / UI Mode Preferences ─────────────────────────────────────────────
export const skinPreferences = mysqlTable("skin_preferences", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  skin: mysqlEnum("skin", ["axiom", "hubspot", "salesforce", "pipedrive", "zoho", "gohighlevel", "close"]).default("axiom").notNull(),
  migratedFrom: mysqlEnum("migratedFrom", ["hubspot", "salesforce", "pipedrive", "zoho", "gohighlevel", "close", "spreadsheet", "other"]),
  graduatedToAxiom: boolean("graduatedToAxiom").default(false).notNull(),
  graduatedAt: bigint("graduatedAt", { mode: "number" }),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type SkinPreference = typeof skinPreferences.$inferSelect;
export type InsertSkinPreference = typeof skinPreferences.$inferInsert;

// ─── Custom Field Definitions ────────────────────────────────────────────────
// Stores tenant-defined custom fields for any record type
export const customFieldDefs = mysqlTable("custom_field_defs", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  objectType: mysqlEnum("objectType", ["contact", "company", "deal", "lead", "activity", "custom_object"]).notNull(),
  fieldKey: varchar("fieldKey", { length: 128 }).notNull(),   // internal key e.g. "annual_revenue"
  label: varchar("label", { length: 256 }).notNull(),          // display label e.g. "Annual Revenue"
  fieldType: mysqlEnum("fieldType", ["text", "number", "currency", "date", "datetime", "boolean", "select", "multiselect", "url", "email", "phone", "textarea", "user", "company", "contact"]).notNull(),
  options: json("options").$type<string[]>(),                  // for select/multiselect
  isRequired: boolean("isRequired").default(false).notNull(),
  isSearchable: boolean("isSearchable").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  groupName: varchar("groupName", { length: 128 }),            // field group/section label
  sourceSystem: varchar("sourceSystem", { length: 64 }),       // "hubspot", "salesforce", etc.
  sourceFieldId: varchar("sourceFieldId", { length: 256 }),    // original field ID in source CRM
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type CustomFieldDef = typeof customFieldDefs.$inferSelect;
export type InsertCustomFieldDef = typeof customFieldDefs.$inferInsert;

// ─── Custom Field Values ─────────────────────────────────────────────────────
// Stores the actual values for custom fields on any record
export const customFieldValues = mysqlTable("custom_field_values", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  fieldDefId: int("fieldDefId").notNull(),
  objectType: mysqlEnum("objectType", ["contact", "company", "deal", "lead", "activity", "custom_object"]).notNull(),
  recordId: int("recordId").notNull(),   // ID of the contact/company/deal/etc.
  valueText: text("valueText"),
  valueNumber: double("valueNumber"),
  valueBoolean: boolean("valueBoolean"),
  valueDate: bigint("valueDate", { mode: "number" }),
  valueJson: json("valueJson"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type CustomFieldValue = typeof customFieldValues.$inferSelect;
export type InsertCustomFieldValue = typeof customFieldValues.$inferInsert;

// ─── Custom Object Definitions ───────────────────────────────────────────────
// Allows tenants to define entirely new record types (e.g. "Properties", "Vehicles", "Tickets")
export const customObjectDefs = mysqlTable("custom_object_defs", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),           // e.g. "Property"
  namePlural: varchar("namePlural", { length: 128 }).notNull(), // e.g. "Properties"
  icon: varchar("icon", { length: 64 }),                      // lucide icon name
  color: varchar("color", { length: 32 }),
  sourceSystem: varchar("sourceSystem", { length: 64 }),
  sourceObjectId: varchar("sourceObjectId", { length: 256 }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type CustomObjectDef = typeof customObjectDefs.$inferSelect;

// ─── Custom Object Records ───────────────────────────────────────────────────
export const customObjectRecords = mysqlTable("custom_object_records", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  objectDefId: int("objectDefId").notNull(),
  name: varchar("name", { length: 512 }),
  ownerId: int("ownerId"),
  sourceRecordId: varchar("sourceRecordId", { length: 256 }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type CustomObjectRecord = typeof customObjectRecords.$inferSelect;

// ─── Activity History ────────────────────────────────────────────────────────
// Universal activity timeline for any record — emails, calls, notes, meetings, stage changes
export const activityHistory = mysqlTable("activity_history", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  activityType: mysqlEnum("activityType", ["email_sent", "email_received", "call", "meeting", "note", "task", "stage_change", "field_change", "deal_created", "contact_created", "file_upload", "sms", "linkedin", "import"]).notNull(),
  objectType: mysqlEnum("objectType", ["contact", "company", "deal", "lead", "custom_object"]).notNull(),
  recordId: int("recordId").notNull(),
  userId: int("userId"),                    // who performed the action (null = system/import)
  subject: varchar("subject", { length: 512 }),
  body: text("body"),
  direction: mysqlEnum("direction", ["inbound", "outbound"]),
  durationSeconds: int("durationSeconds"),  // for calls/meetings
  outcome: varchar("outcome", { length: 128 }), // "connected", "voicemail", "no_answer", etc.
  fromEmail: varchar("fromEmail", { length: 320 }),
  toEmail: varchar("toEmail", { length: 320 }),
  fromField: varchar("fromField", { length: 256 }),  // for field_change
  toField: varchar("toField", { length: 256 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  occurredAt: bigint("occurredAt", { mode: "number" }).notNull(), // when it actually happened
  sourceSystem: varchar("sourceSystem", { length: 64 }),          // "hubspot", "salesforce", "axiom"
  sourceActivityId: varchar("sourceActivityId", { length: 256 }), // original ID in source CRM
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type ActivityHistory = typeof activityHistory.$inferSelect;
export type InsertActivityHistory = typeof activityHistory.$inferInsert;

// ─── Migration Jobs ──────────────────────────────────────────────────────────
// ─── Field Mapping Templates ─────────────────────────────────────────────────
// Saved field mapping configs so a company can re-run imports without remapping
export const fieldMappingTemplates = mysqlTable("field_mapping_templates", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  sourceSystem: varchar("sourceSystem", { length: 64 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  mapping: json("mapping").$type<Record<string, string>>().notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type FieldMappingTemplate = typeof fieldMappingTemplates.$inferSelect;

// ─── Self-Healing System Health Tables ───────────────────────────────────────

// Individual error/correction events
export const systemHealthEvents = mysqlTable("system_health_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: mysqlEnum("eventType", ["error", "auto_correction", "warning", "info"]).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "error", "critical"]).notNull(),
  subsystem: varchar("subsystem", { length: 64 }).notNull().default("server"),
  message: text("message").notNull(),
  details: json("details").$type<Record<string, unknown>>(),
  autoCorrectAttempted: boolean("autoCorrectAttempted").notNull().default(false),
  autoCorrectSuccess: boolean("autoCorrectSuccess"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type SystemHealthEvent = typeof systemHealthEvents.$inferSelect;
export type InsertSystemHealthEvent = typeof systemHealthEvents.$inferInsert;

// Periodic health check snapshots (every 5 min)
export const systemHealthLogs = mysqlTable("system_health_logs", {
  id: int("id").autoincrement().primaryKey(),
  overallStatus: mysqlEnum("overallStatus", ["healthy", "degraded", "critical", "unknown"]).notNull(),
  healthScore: int("healthScore").notNull().default(100),
  subsystemData: json("subsystemData").$type<Record<string, unknown>[]>(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type SystemHealthLog = typeof systemHealthLogs.$inferSelect;

// ─── Phase 44: Calendar Sync ─────────────────────────────────────────────────
export const calendarConnections = mysqlTable("calendar_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  provider: mysqlEnum("calConnProvider", ["google", "outlook"]).notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: bigint("tokenExpiresAt", { mode: "number" }),
  calendarId: varchar("calendarId", { length: 512 }),
  syncEnabled: boolean("syncEnabled").notNull().default(true),
  lastSyncAt: bigint("lastSyncAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type CalendarConnection = typeof calendarConnections.$inferSelect;

// ─── Phase 44: Email Inbox Sync ──────────────────────────────────────────────
export const emailConnections = mysqlTable("email_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  provider: mysqlEnum("emailConnProvider", ["gmail", "outlook"]).notNull(),
  emailAddress: varchar("emailAddress", { length: 320 }).notNull(),
  bccAddress: varchar("bccAddress", { length: 320 }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: bigint("tokenExpiresAt", { mode: "number" }),
  syncEnabled: boolean("syncEnabled").notNull().default(true),
  lastSyncAt: bigint("lastSyncAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type EmailConnection = typeof emailConnections.$inferSelect;

// ─── Phase 44: Meeting Scheduler ─────────────────────────────────────────────
export const meetingSchedulerProfiles = mysqlTable("meeting_scheduler_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  slug: varchar("slug", { length: 128 }).notNull(),
  displayName: varchar("displayName", { length: 256 }).notNull(),
  bio: text("bio"),
  avatarUrl: varchar("avatarUrl", { length: 512 }),
  timezone: varchar("timezone", { length: 64 }).notNull().default("America/New_York"),
  availabilityJson: json("availabilityJson").$type<Record<string, unknown>>(),
  bufferMinutes: int("bufferMinutes").notNull().default(15),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type MeetingSchedulerProfile = typeof meetingSchedulerProfiles.$inferSelect;

export const meetingTypes = mysqlTable("meeting_types", {
  id: int("id").autoincrement().primaryKey(),
  schedulerProfileId: int("schedulerProfileId").notNull(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  durationMinutes: int("durationMinutes").notNull().default(30),
  description: text("description"),
  location: varchar("location", { length: 512 }),
  color: varchar("color", { length: 32 }).default("#f97316"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type MeetingType = typeof meetingTypes.$inferSelect;

export const meetingBookings = mysqlTable("meeting_bookings", {
  id: int("id").autoincrement().primaryKey(),
  meetingTypeId: int("meetingTypeId").notNull(),
  schedulerProfileId: int("schedulerProfileId").notNull(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  guestName: varchar("guestName", { length: 256 }).notNull(),
  guestEmail: varchar("guestEmail", { length: 320 }).notNull(),
  guestPhone: varchar("guestPhone", { length: 64 }),
  guestNotes: text("guestNotes"),
  startTime: bigint("startTime", { mode: "number" }).notNull(),
  endTime: bigint("endTime", { mode: "number" }).notNull(),
  timezone: varchar("timezone", { length: 64 }).notNull(),
  status: mysqlEnum("bookingStatus", ["confirmed", "cancelled", "completed", "no_show"]).notNull().default("confirmed"),
  contactId: int("contactId"),
  calendarEventId: varchar("calendarEventId", { length: 512 }),
  cancelToken: varchar("cancelToken", { length: 128 }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type MeetingBooking = typeof meetingBookings.$inferSelect;

// ─── Phase 44: Custom Object Builder ─────────────────────────────────────────
export const customObjectTypes = mysqlTable("custom_object_types", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  pluralName: varchar("pluralName", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull(),
  icon: varchar("icon", { length: 64 }).default("box"),
  color: varchar("color", { length: 32 }).default("#f97316"),
  description: text("description"),
  showInNav: tinyint("showInNav").default(1),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type CustomObjectType = typeof customObjectTypes.$inferSelect;
// ─── Phase 44: Proposal / E-Signature Builder ────────────────────────────────
export const proposals = mysqlTable("proposals", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  dealId: int("dealId"),
  contactId: int("contactId"),
  companyId: int("companyId"),
  createdByUserId: int("createdByUserId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  status: mysqlEnum("proposalStatus", ["draft", "sent", "viewed", "signed", "declined", "expired"]).notNull().default("draft"),
  templateJson: json("templateJson").$type<Record<string, unknown>>(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("USD"),
  validUntil: bigint("validUntil", { mode: "number" }),
  signatureToken: varchar("signatureToken", { length: 128 }),
  signedAt: bigint("signedAt", { mode: "number" }),
  signedByName: varchar("signedByName", { length: 256 }),
  signedByEmail: varchar("signedByEmail", { length: 320 }),
  signatureImageUrl: varchar("signatureImageUrl", { length: 512 }),
  viewedAt: bigint("viewedAt", { mode: "number" }),
  sentAt: bigint("sentAt", { mode: "number" }),
  pdfUrl: varchar("pdfUrl", { length: 512 }),
  notes: text("notes"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type Proposal = typeof proposals.$inferSelect;

// ─── Phase 44: Workflow Definitions (Visual Builder) ─────────────────────────
export const workflowDefinitions = mysqlTable("workflow_definitions", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  status: mysqlEnum("workflowStatus", ["draft", "active", "paused", "archived"]).notNull().default("draft"),
  triggerType: varchar("triggerType", { length: 64 }).notNull(),
  triggerConfig: json("triggerConfig").$type<Record<string, unknown>>(),
  nodesJson: json("nodesJson").$type<unknown[]>(),
  edgesJson: json("edgesJson").$type<unknown[]>(),
  runCount: int("runCount").notNull().default(0),
  lastRunAt: bigint("lastRunAt", { mode: "number" }),
  createdByUserId: int("createdByUserId"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type WorkflowDefinition = typeof workflowDefinitions.$inferSelect;

export const workflowRuns = mysqlTable("workflow_runs", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  triggerRecordId: int("triggerRecordId"),
  triggerRecordType: varchar("triggerRecordType", { length: 64 }),
  status: mysqlEnum("workflowRunStatus", ["running", "completed", "failed", "skipped"]).notNull().default("running"),
  stepsCompleted: int("stepsCompleted").notNull().default(0),
  errorMessage: text("errorMessage"),
  startedAt: bigint("startedAt", { mode: "number" }).notNull(),
  completedAt: bigint("completedAt", { mode: "number" }),
});
export type WorkflowRun = typeof workflowRuns.$inferSelect;

// ─── Phase 44: Saved Reports ─────────────────────────────────────────────────
export const savedReports = mysqlTable("saved_reports", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  reportType: varchar("reportType", { length: 64 }).notNull(),
  filtersJson: json("filtersJson").$type<Record<string, unknown>>(),
  columnsJson: json("columnsJson").$type<string[]>(),
  groupBy: varchar("groupBy", { length: 64 }),
  sortBy: varchar("sortBy", { length: 64 }),
  sortDir: mysqlEnum("reportSortDir", ["asc", "desc"]).default("desc"),
  isShared: boolean("isShared").notNull().default(false),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type SavedReport = typeof savedReports.$inferSelect;

// ─── Phase 44: Integration Marketplace ───────────────────────────────────────
export const integrationConnectors = mysqlTable("integration_connectors", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  connectorKey: varchar("connectorKey", { length: 64 }).notNull(),
  displayName: varchar("displayName", { length: 128 }).notNull(),
  status: mysqlEnum("connectorStatus", ["connected", "disconnected", "error"]).notNull().default("disconnected"),
  webhookUrl: varchar("webhookUrl", { length: 1024 }),
  apiKey: text("apiKey"),
  configJson: json("configJson").$type<Record<string, unknown>>(),
  lastTestedAt: bigint("lastTestedAt", { mode: "number" }),
  connectedAt: bigint("connectedAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type IntegrationConnector = typeof integrationConnectors.$inferSelect;

// ─── Phase 44: Onboarding Concierge ──────────────────────────────────────────
export const onboardingProgress = mysqlTable("onboarding_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tenantCompanyId: int("tenantCompanyId").notNull(),
  completedSteps: json("completedSteps").$type<string[]>().notNull().default([]),
  currentStep: varchar("currentStep", { length: 64 }),
  isCompleted: boolean("isCompleted").notNull().default(false),
  completedAt: bigint("completedAt", { mode: "number" }),
  dismissedAt: bigint("dismissedAt", { mode: "number" }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;

// ─── Phase 57 Batch 2: Product Catalog ───────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id"),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  unit: varchar("unit", { length: 50 }),
  sku: varchar("sku", { length: 100 }),
  category: varchar("category", { length: 100 }),
  isActive: tinyint("is_active").notNull().default(1),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
export type Product = typeof products.$inferSelect;

// ─── Phase 57 Batch 2: Lead Scoring Rules ────────────────────────────────────
export const leadScoringRules = mysqlTable("lead_scoring_rules", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id"),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  field: varchar("field", { length: 100 }).notNull(),
  operator: varchar("operator", { length: 50 }).notNull(),
  value: varchar("value", { length: 500 }),
  points: int("points").notNull().default(0),
  entityType: varchar("entity_type", { length: 20 }).notNull().default("contact"),
  isActive: tinyint("is_active").notNull().default(1),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
export type LeadScoringRule = typeof leadScoringRules.$inferSelect;

// ─── Batch 3: Web Forms Builder ───────────────────────────────────────────────
export const webForms = mysqlTable("web_forms", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  fields: json("fields").$type<Record<string, unknown>[]>().notNull().default([]),
  settings: json("settings").$type<Record<string, unknown>>().notNull().default({}),
  embedCode: text("embed_code"),
  isActive: boolean("is_active").notNull().default(true),
  submissionCount: int("submission_count").notNull().default(0),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
export type WebForm = typeof webForms.$inferSelect;

export const formSubmissions = mysqlTable("form_submissions", {
  id: int("id").autoincrement().primaryKey(),
  formId: int("form_id").notNull(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  data: json("data").$type<Record<string, unknown>>().notNull().default({}),
  contactId: int("contact_id"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
export type FormSubmission = typeof formSubmissions.$inferSelect;

// ─── Batch 3: E-Signature ─────────────────────────────────────────────────────
export const esignatureDocuments = mysqlTable("esignature_documents", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "completed", "voided", "expired"]).notNull().default("draft"),
  dealId: int("deal_id"),
  contactId: int("contact_id"),
  createdBy: int("created_by").notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }),
  completedAt: bigint("completed_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
export type EsignatureDocument = typeof esignatureDocuments.$inferSelect;

export const esignatureSigners = mysqlTable("esignature_signers", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("document_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 300 }).notNull(),
  token: varchar("token", { length: 100 }).notNull(),
  status: mysqlEnum("signer_status", ["pending", "viewed", "signed", "declined"]).notNull().default("pending"),
  signedAt: bigint("signed_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
export type EsignatureSigner = typeof esignatureSigners.$inferSelect;

// ─── Batch 3: Reputation Management ──────────────────────────────────────────
export const reputationReviews = mysqlTable("reputation_reviews", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  platform: varchar("platform", { length: 100 }).notNull(),
  reviewerName: varchar("reviewer_name", { length: 200 }),
  rating: tinyint("rating"),
  reviewText: text("review_text"),
  reviewUrl: varchar("review_url", { length: 1024 }),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]).default("neutral"),
  responded: boolean("responded").notNull().default(false),
  responseText: text("response_text"),
  reviewDate: bigint("review_date", { mode: "number" }).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
export type ReputationReview = typeof reputationReviews.$inferSelect;

// ─── Batch 3: OOO Detection ───────────────────────────────────────────────────
export const oooDetections = mysqlTable("ooo_detections", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  contactId: int("contact_id"),
  email: varchar("email", { length: 300 }).notNull(),
  detectedAt: bigint("detected_at", { mode: "number" }).notNull(),
  returnDate: bigint("return_date", { mode: "number" }),
  oooMessage: text("ooo_message"),
  followUpScheduled: boolean("follow_up_scheduled").notNull().default(false),
  followUpDate: bigint("follow_up_date", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
export type OooDetection = typeof oooDetections.$inferSelect;

// ─── Email Sequences / Cadences ───────────────────────────────────────────────
export const emailSequences = mysqlTable("email_sequences", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  replyDetection: boolean("reply_detection").notNull().default(true),
  pauseOnReply: boolean("pause_on_reply").notNull().default(true),
  enrolledCount: int("enrolled_count").notNull().default(0),
  completedCount: int("completed_count").notNull().default(0),
  replyCount: int("reply_count").notNull().default(0),
  createdBy: int("created_by"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
export type EmailSequence = typeof emailSequences.$inferSelect;

export const emailSequenceSteps = mysqlTable("email_sequence_steps", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequence_id").notNull(),
  stepNumber: int("step_number").notNull(),
  type: varchar("type", { length: 32 }).notNull().default("email"),
  subject: varchar("subject", { length: 500 }),
  body: text("body"),
  waitDays: int("wait_days").notNull().default(1),
  waitHours: int("wait_hours").notNull().default(0),
  abVariantSubject: varchar("ab_variant_subject", { length: 500 }),
  abVariantBody: text("ab_variant_body"),
  abEnabled: boolean("ab_enabled").notNull().default(false),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
export type EmailSequenceStep = typeof emailSequenceSteps.$inferSelect;

export const emailSequenceEnrollments = mysqlTable("email_sequence_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequence_id").notNull(),
  contactId: int("contact_id").notNull(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  currentStep: int("current_step").notNull().default(1),
  nextSendAt: bigint("next_send_at", { mode: "number" }),
  enrolledAt: bigint("enrolled_at", { mode: "number" }).notNull(),
  completedAt: bigint("completed_at", { mode: "number" }),
  repliedAt: bigint("replied_at", { mode: "number" }),
});
export type EmailSequenceEnrollment = typeof emailSequenceEnrollments.$inferSelect;

// ─── Journey Orchestration ────────────────────────────────────────────────────
export const journeys = mysqlTable("journeys", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  triggerType: varchar("trigger_type", { length: 64 }).notNull().default("manual"),
  triggerConfig: json("trigger_config"),
  nodes: json("nodes"),
  edges: json("edges"),
  enrolledCount: int("enrolled_count").notNull().default(0),
  completedCount: int("completed_count").notNull().default(0),
  createdBy: int("created_by"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
export type Journey = typeof journeys.$inferSelect;

export const journeyEnrollments = mysqlTable("journey_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  journeyId: int("journey_id").notNull(),
  contactId: int("contact_id").notNull(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  currentNodeId: varchar("current_node_id", { length: 64 }),
  enrolledAt: bigint("enrolled_at", { mode: "number" }).notNull(),
  completedAt: bigint("completed_at", { mode: "number" }),
});
export type JourneyEnrollment = typeof journeyEnrollments.$inferSelect;

// ─── WhatsApp Integration ─────────────────────────────────────────────────────
export const whatsappMessages = mysqlTable("whatsapp_messages", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  contactId: int("contact_id"),
  phone: varchar("phone", { length: 32 }).notNull(),
  direction: varchar("direction", { length: 8 }).notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("sent"),
  messageId: varchar("message_id", { length: 128 }),
  mediaUrl: varchar("media_url", { length: 1024 }),
  sentBy: int("sent_by"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;

export const whatsappTemplates = mysqlTable("whatsapp_templates", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 64 }).notNull().default("general"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;

// ─── Social Media Scheduler ───────────────────────────────────────────────────
export const socialPosts = mysqlTable("social_posts", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  content: text("content").notNull(),
  platforms: json("platforms").notNull(),
  mediaUrls: json("media_urls"),
  scheduledAt: bigint("scheduled_at", { mode: "number" }),
  publishedAt: bigint("published_at", { mode: "number" }),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  linkedContactId: int("linked_contact_id"),
  linkedDealId: int("linked_deal_id"),
  platformPostIds: json("platform_post_ids"),
  createdBy: int("created_by"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
export type SocialPost = typeof socialPosts.$inferSelect;

export const socialAccounts = mysqlTable("social_accounts", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  platform: varchar("platform", { length: 32 }).notNull(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  accountId: varchar("account_id", { length: 128 }),
  accessToken: text("access_token"),
  tokenExpiresAt: bigint("token_expires_at", { mode: "number" }),
  isActive: boolean("is_active").notNull().default(true),
  connectedAt: bigint("connected_at", { mode: "number" }).notNull(),
});
export type SocialAccount = typeof socialAccounts.$inferSelect;

// ─── Power Dialer ─────────────────────────────────────────────────────────────
export const dialerSessions = mysqlTable("dialer_sessions", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  contactIds: json("contact_ids").notNull(),
  currentIndex: int("current_index").notNull().default(0),
  callsMade: int("calls_made").notNull().default(0),
  callsConnected: int("calls_connected").notNull().default(0),
  callsSkipped: int("calls_skipped").notNull().default(0),
  script: text("script"),
  startedAt: bigint("started_at", { mode: "number" }).notNull(),
  completedAt: bigint("completed_at", { mode: "number" }),
});
export type DialerSession = typeof dialerSessions.$inferSelect;

// ─── AI Anomaly Detection ─────────────────────────────────────────────────────
export const anomalyAlerts = mysqlTable("anomaly_alerts", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  severity: varchar("severity", { length: 16 }).notNull().default("medium"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  aiExplanation: text("ai_explanation"),
  metric: varchar("metric", { length: 128 }),
  previousValue: double("previous_value"),
  currentValue: double("current_value"),
  changePercent: double("change_percent"),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: bigint("resolved_at", { mode: "number" }),
  detectedAt: bigint("detected_at", { mode: "number" }).notNull(),
});
export type AnomalyAlert = typeof anomalyAlerts.$inferSelect;

// ─── Pipeline Inspection ──────────────────────────────────────────────────────
export const pipelineInspections = mysqlTable("pipeline_inspections", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  pipelineId: int("pipeline_id").notNull(),
  healthScore: int("health_score").notNull().default(0),
  stuckDealsCount: int("stuck_deals_count").notNull().default(0),
  avgDaysInStage: json("avg_days_in_stage"),
  velocityScore: int("velocity_score").notNull().default(0),
  aiInsights: text("ai_insights"),
  inspectedAt: bigint("inspected_at", { mode: "number" }).notNull(),
});
export type PipelineInspection = typeof pipelineInspections.$inferSelect;

// ─── Domain Auto-Healing Logs ─────────────────────────────────────────────────
export const domainAutoHealingLogs = mysqlTable("domain_auto_healing_logs", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  domain: varchar("domain", { length: 255 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  reason: text("reason"),
  previousLimit: int("previous_limit"),
  newLimit: int("new_limit"),
  triggeredAt: bigint("triggered_at", { mode: "number" }).notNull(),
});
export type DomainAutoHealingLog = typeof domainAutoHealingLogs.$inferSelect;

// ─── Continuous A/B Test Runs ─────────────────────────────────────────────────
export const abTestRuns = mysqlTable("ab_test_runs", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  campaignId: int("campaign_id"),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("running"),
  variantA: json("variant_a").notNull(),
  variantB: json("variant_b").notNull(),
  splitPercent: int("split_percent").notNull().default(50),
  winnerVariant: varchar("winner_variant", { length: 4 }),
  confidenceLevel: double("confidence_level"),
  sentA: int("sent_a").notNull().default(0),
  sentB: int("sent_b").notNull().default(0),
  opensA: int("opens_a").notNull().default(0),
  opensB: int("opens_b").notNull().default(0),
  clicksA: int("clicks_a").notNull().default(0),
  clicksB: int("clicks_b").notNull().default(0),
  repliesA: int("replies_a").notNull().default(0),
  repliesB: int("replies_b").notNull().default(0),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  completedAt: bigint("completed_at", { mode: "number" }),
});
export type AbTestRun = typeof abTestRuns.$inferSelect;

// ─── Feature Tiers ────────────────────────────────────────────────────────────
export const featureTiers = mysqlTable("feature_tiers", {
  id: int("id").autoincrement().primaryKey(),
  featureKey: varchar("feature_key", { length: 128 }).notNull(),
  featureName: varchar("feature_name", { length: 255 }).notNull(),
  minTier: varchar("min_tier", { length: 32 }).notNull().default("starter"),
  description: text("description"),
  usageLimit: int("usage_limit"),
  usageUnit: varchar("usage_unit", { length: 64 }),
});
export type FeatureTier = typeof featureTiers.$inferSelect;

// ─── Feature Usage Metering ───────────────────────────────────────────────────
export const featureUsageLogs = mysqlTable("feature_usage_logs", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  userId: int("user_id"),
  featureKey: varchar("feature_key", { length: 128 }).notNull(),
  usageCount: int("usage_count").notNull().default(1),
  periodStart: bigint("period_start", { mode: "number" }).notNull(),
  periodEnd: bigint("period_end", { mode: "number" }).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
export type FeatureUsageLog = typeof featureUsageLogs.$inferSelect;

// ─── Notification Digest Preferences ─────────────────────────────────────────
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  digestEnabled: boolean("digest_enabled").notNull().default(false),
  digestFrequency: mysqlEnum("digest_frequency", ["daily", "weekly"]).notNull().default("daily"),
  digestTime: varchar("digest_time", { length: 8 }).notNull().default("08:00"),
  digestDayOfWeek: int("digest_day_of_week").default(1),
  notifyDealAtRisk: boolean("notify_deal_at_risk").notNull().default(true),
  notifyFollowUpDue: boolean("notify_follow_up_due").notNull().default(true),
  notifyNewLead: boolean("notify_new_lead").notNull().default(true),
  notifyTaskOverdue: boolean("notify_task_overdue").notNull().default(true),
  notifyDealWon: boolean("notify_deal_won").notNull().default(true),
  notifyMeetingReminder: boolean("notify_meeting_reminder").notNull().default(true),
  notifyRevenueAlert: boolean("notify_revenue_alert").notNull().default(false),
  pushEnabled: boolean("push_enabled").notNull().default(false),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  inAppEnabled: boolean("in_app_enabled").notNull().default(true),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
export type NotificationPreference = typeof notificationPreferences.$inferSelect;

// ─── Scheduled Report Delivery ────────────────────────────────────────────────
export const scheduledReports = mysqlTable("scheduled_reports", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  userId: int("user_id").notNull(),
  savedReportId: int("saved_report_id"),
  reportName: varchar("report_name", { length: 255 }).notNull(),
  reportConfig: json("report_config").$type<Record<string, any>>().notNull(),
  frequency: mysqlEnum("sr_frequency", ["daily", "weekly", "monthly"]).notNull().default("weekly"),
  dayOfWeek: int("day_of_week").default(1),
  dayOfMonth: int("day_of_month").default(1),
  deliveryTime: varchar("delivery_time", { length: 8 }).notNull().default("08:00"),
  recipients: json("recipients").$type<string[]>().notNull(),
  format: mysqlEnum("sr_format", ["pdf", "csv", "both"]).notNull().default("pdf"),
  isActive: boolean("is_active").notNull().default(true),
  lastSentAt: bigint("last_sent_at", { mode: "number" }),
  nextSendAt: bigint("next_send_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
export type ScheduledReport = typeof scheduledReports.$inferSelect;

// ─── Proposal Analytics ───────────────────────────────────────────────────────
export const proposalViews = mysqlTable("proposal_views", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposal_id").notNull(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  viewerEmail: varchar("viewer_email", { length: 255 }),
  viewerIp: varchar("viewer_ip", { length: 64 }),
  sessionId: varchar("session_id", { length: 128 }).notNull(),
  totalTimeSeconds: int("total_time_seconds").notNull().default(0),
  sectionsViewed: json("sections_viewed").$type<string[]>().notNull(),
  scrollDepthPct: int("scroll_depth_pct").notNull().default(0),
  viewedAt: bigint("viewed_at", { mode: "number" }).notNull(),
  lastActiveAt: bigint("last_active_at", { mode: "number" }).notNull(),
  completed: boolean("completed").notNull().default(false),
});
export type ProposalView = typeof proposalViews.$inferSelect;

// ─── Custom Role Builder ──────────────────────────────────────────────────────
export const customRoles = mysqlTable("custom_roles", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  baseRole: mysqlEnum("base_role", ["user", "admin"]).notNull().default("user"),
  permissions: json("permissions").$type<string[]>().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: int("created_by").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
export type CustomRole = typeof customRoles.$inferSelect;

// ─── SSO Configuration ────────────────────────────────────────────────────────
export const ssoConfigs = mysqlTable("sso_configs", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull().unique(),
  provider: mysqlEnum("sso_provider", ["saml", "oidc", "google", "microsoft", "okta"]).notNull(),
  isEnabled: boolean("is_enabled").notNull().default(false),
  entityId: varchar("entity_id", { length: 512 }),
  ssoUrl: varchar("sso_url", { length: 512 }),
  certificate: text("certificate"),
  attributeMapping: json("attribute_mapping").$type<Record<string, string>>(),
  autoProvision: boolean("auto_provision").notNull().default(true),
  defaultRole: mysqlEnum("sso_default_role", ["user", "admin"]).notNull().default("user"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
export type SsoConfig = typeof ssoConfigs.$inferSelect;

// ─── Conditional Custom Field Rules ──────────────────────────────────────────
export const customFieldConditions = mysqlTable("custom_field_conditions", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  fieldId: int("field_id").notNull(),
  conditionFieldId: int("condition_field_id").notNull(),
  operator: mysqlEnum("cfc_operator", ["equals", "not_equals", "contains", "not_contains", "greater_than", "less_than", "is_empty", "is_not_empty"]).notNull(),
  conditionValue: varchar("condition_value", { length: 512 }),
  action: mysqlEnum("cfc_action", ["show", "hide", "require"]).notNull().default("show"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
export type CustomFieldCondition = typeof customFieldConditions.$inferSelect;

// ─── AI Credit Usage by Feature ──────────────────────────────────────────────
export const aiCreditUsageByFeature = mysqlTable("ai_credit_usage_by_feature", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  userId: int("user_id"),
  featureKey: varchar("feature_key", { length: 128 }).notNull(),
  featureName: varchar("feature_name", { length: 255 }).notNull(),
  creditsUsed: int("credits_used").notNull().default(0),
  queryCount: int("query_count").notNull().default(0),
  periodStart: bigint("period_start", { mode: "number" }).notNull(),
  periodEnd: bigint("period_end", { mode: "number" }).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
export type AiCreditUsageByFeature = typeof aiCreditUsageByFeature.$inferSelect;

// ─── WhatsApp Broadcast Campaigns ────────────────────────────────────────────
export const whatsappBroadcasts = mysqlTable("whatsapp_broadcasts", {
  id: int("id").autoincrement().primaryKey(),
  tenantCompanyId: int("tenant_company_id").notNull(),
  createdBy: int("created_by").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  templateId: int("template_id"),
  message: text("message").notNull(),
  mediaUrl: varchar("media_url", { length: 512 }),
  recipientFilter: json("recipient_filter").$type<Record<string, any>>(),
  recipientCount: int("recipient_count").notNull().default(0),
  sentCount: int("sent_count").notNull().default(0),
  deliveredCount: int("delivered_count").notNull().default(0),
  readCount: int("read_count").notNull().default(0),
  failedCount: int("failed_count").notNull().default(0),
  status: mysqlEnum("wb_status", ["draft", "scheduled", "sending", "sent", "failed"]).notNull().default("draft"),
  scheduledAt: bigint("scheduled_at", { mode: "number" }),
  sentAt: bigint("sent_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
export type WhatsappBroadcast = typeof whatsappBroadcasts.$inferSelect;
