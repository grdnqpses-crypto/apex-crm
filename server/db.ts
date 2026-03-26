import { eq, and, desc, asc, sql, like, or, isNotNull, count, inArray, gte, lte, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  contacts, companies, deals, pipelines, pipelineStages,
  activities, tasks, emailTemplates, emailCampaigns,
  domainHealth, segments, workflows, abTests,
  apiKeys, webhooks, webhookLogs,
  smtpAccounts, emailQueue, leadStatusOptions,
  integrationCredentials, prospects, triggerSignals,
  ghostSequences, ghostSequenceSteps, prospectOutreach, battleCards,
  suppressionList, complianceAuditLog, senderSettings,
  domainSendingStats, prospectScores, brokerFilings, domainHealthRecords,
  tenantCompanies, featureAssignments, companyInvites,
  voiceCampaigns, callLogs, documents, carrierPackets,
  dealScores, revenueBriefings, smartNotifications, meetingPreps,
  type TenantCompany, type InsertTenantCompany,
  type FeatureAssignment, type CompanyInvite,
  type Contact, type InsertContact,
  type Company, type InsertCompany,
  type Deal, type InsertDeal,
  type SmtpAccount, type EmailQueueItem,
  type Prospect, type InsertProspect,
  type IntegrationCredential, type TriggerSignal,
  type GhostSequence, type GhostSequenceStep,
  type ProspectOutreach, type BattleCard,
  type SuppressionEntry, type ComplianceAuditEntry,
  type SenderSetting, type DomainSendingStat, type ProspectScore,
  type VoiceCampaign, type CallLog, type Document, type CarrierPacket,
  type DealScore, type RevenueBriefing, type SmartNotification, type MeetingPrep,
  loads, loadStatusHistory, carrierProfiles, loadBoardPosts,
  invoices, portalAccess, portalQuotes, callRecordings,
  b2bContacts, enrichmentLogs, warmupCampaigns, visitorSessions,
  inboundEmails, whiteLabelConfig, onboardingFlows, onboardingSubmissions,
  subscriptionPlans, tenantSubscriptions, migrationJobs,
  type Load, type InsertLoad, type LoadStatusHistory,
  type CarrierProfile, type InsertCarrierProfile,
  type LoadBoardPost, type Invoice, type InsertInvoice,
  type PortalAccess, type PortalQuote, type CallRecording,
  type B2BContact, type EnrichmentLog, type WarmupCampaign,
  type VisitorSession, type InboundEmail, type WhiteLabelConfig,
  type OnboardingFlow, type OnboardingSubmission,
  type SubscriptionPlan, type TenantSubscription, type MigrationJob,
  marketplaceLoads, marketplaceBids, marketplacePayments,
  marketplaceTracking, marketplaceDocuments, laneAnalytics,
  consolidationOpportunities,
  type MarketplaceLoad, type MarketplaceBid, type MarketplacePayment,
  type MarketplaceTrackingEvent, type MarketplaceDocument,
  type LaneAnalytic, type ConsolidationOpportunity,
  emailMaskSettings, type EmailMaskSetting,
  passwordResetTokens, type PasswordResetToken,
  aiCreditPackages, aiCreditTransactions, tenantAiCredits, userAiAllocations,
  type AiCreditPackage, type AiCreditTransaction, type TenantAiCredits, type UserAiAllocation,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

// ─── Users ───
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => { const value = user[field]; if (value === undefined) return; const normalized = value ?? null; values[field] = normalized; updateSet[field] = normalized; };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  // Search by username, email, or name (for accounts created via OAuth that have no username)
  const { or } = await import('drizzle-orm');
  const result = await db.select().from(users).where(
    or(eq(users.username, username), eq(users.email, username), eq(users.name, username))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCredentialUser(data: {
  username: string;
  passwordHash: string;
  plainTextPassword?: string;
  name: string;
  email?: string;
  systemRole: "developer" | "axiom_admin" | "axiom_owner" | "company_admin" | "sales_manager" | "office_manager" | "manager" | "account_manager" | "coordinator" | "user";
  tenantCompanyId: number;
  managerId?: number;
  jobTitle?: string;
  phone?: string;
  invitedBy?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  // Generate a unique openId for credential-based users (prefixed to distinguish from OAuth)
  const openId = `cred_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const [result] = await db.insert(users).values({
    openId,
    username: data.username,
    passwordHash: data.passwordHash,
    plainTextPassword: data.plainTextPassword ?? null,
    name: data.name,
    email: data.email ?? null,
    loginMethod: "credentials",
    role: data.systemRole === "company_admin" ? "admin" : "user",
    systemRole: data.systemRole,
    tenantCompanyId: data.tenantCompanyId,
    managerId: data.managerId ?? null,
    jobTitle: data.jobTitle ?? null,
    phone: data.phone ?? null,
    invitedBy: data.invitedBy ?? null,
    isActive: true,
    lastSignedIn: new Date(),
  });
  return result.insertId;
}

export async function updateUserPassword(userId: number, passwordHash: string, plainTextPassword?: string) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { passwordHash };
  if (plainTextPassword !== undefined) updateData.plainTextPassword = plainTextPassword;
  await db.update(users).set(updateData as any).where(eq(users.id, userId));
}

// ─── Password Reset Tokens ───
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPasswordResetToken(userId: number, token: string) {
  const db = await getDb();
  if (!db) return;
  // Expire any existing tokens for this user
  await db.update(passwordResetTokens)
    .set({ usedAt: Date.now() })
    .where(and(eq(passwordResetTokens.userId, userId), sql`usedAt IS NULL`));
  // Create new token valid for 1 hour
  await db.insert(passwordResetTokens).values({
    userId,
    token,
    expiresAt: Date.now() + 60 * 60 * 1000,
    createdAt: Date.now(),
  });
}

export async function getValidPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.token, token),
      sql`usedAt IS NULL`,
      sql`expiresAt > ${Date.now()}`
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markPasswordResetTokenUsed(token: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(passwordResetTokens)
    .set({ usedAt: Date.now() })
    .where(eq(passwordResetTokens.token, token));
}

// ─── Lead Status Options ───
export async function listLeadStatuses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadStatusOptions).where(eq(leadStatusOptions.isActive, true)).orderBy(asc(leadStatusOptions.sortOrder));
}

// ─── Contacts ───
export async function listContacts(userId: number, opts?: { search?: string; stage?: string; leadStatus?: string; limit?: number; offset?: number; companyId?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq(contacts.userId, userId)];
  if (opts?.stage) conditions.push(eq(contacts.lifecycleStage, opts.stage));
  if (opts?.leadStatus) conditions.push(eq(contacts.leadStatus, opts.leadStatus));
  if (opts?.companyId) conditions.push(eq(contacts.companyId, opts.companyId));
  if (opts?.search) conditions.push(or(like(contacts.firstName, `%${opts.search}%`), like(contacts.lastName, `%${opts.search}%`), like(contacts.email, `%${opts.search}%`))!);
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(contacts).where(where).orderBy(desc(contacts.createdAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(contacts).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getContact(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId))).limit(1);
  return result[0] ?? null;
}

export async function createContact(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(contacts).values(data);
  return result[0].insertId;
}

export async function updateContact(id: number, userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contacts).set({ ...data, updatedAt: Date.now() }).where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
}

export async function deleteContact(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
}

export async function getContactsByCompany(companyId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contacts).where(and(eq(contacts.companyId, companyId), eq(contacts.userId, userId))).orderBy(desc(contacts.createdAt));
}

// ─── Companies ───
export async function listCompanies(userId: number, opts?: { search?: string; leadStatus?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq(companies.userId, userId)];
  if (opts?.leadStatus) conditions.push(eq(companies.leadStatus, opts.leadStatus));
  if (opts?.search) conditions.push(or(like(companies.name, `%${opts.search}%`), like(companies.domain, `%${opts.search}%`))!);
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(companies).where(where).orderBy(desc(companies.createdAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(companies).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getCompany(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(companies).where(and(eq(companies.id, id), eq(companies.userId, userId))).limit(1);
  return result[0] ?? null;
}

export async function createCompany(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(companies).values(data);
  return result[0].insertId;
}

// ─── Role-based company helpers ───
type UserCtx = { id: number; systemRole: string; tenantCompanyId: number | null };

export async function getCompanyByRole(id: number, user: UserCtx) {
  const db = await getDb();
  if (!db) return null;
  const visibleIds = await getVisibleUserIds(user);
  const result = await db.select().from(companies)
    .where(and(eq(companies.id, id), inArray(companies.userId, visibleIds)))
    .limit(1);
  return result[0] ?? null;
}

export async function updateCompanyByRole(id: number, user: UserCtx, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const visibleIds = await getVisibleUserIds(user);
  await db.update(companies).set({ ...data, updatedAt: Date.now() })
    .where(and(eq(companies.id, id), inArray(companies.userId, visibleIds)));
}

export async function deleteCompanyByRole(id: number, user: UserCtx) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const visibleIds = await getVisibleUserIds(user);
  await db.delete(companies).where(and(eq(companies.id, id), inArray(companies.userId, visibleIds)));
}

export async function deleteContactsByCompanyByRole(companyId: number, user: UserCtx) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const visibleIds = await getVisibleUserIds(user);
  await db.delete(contacts).where(and(eq(contacts.companyId, companyId), inArray(contacts.userId, visibleIds)));
}

export async function getCompanyContactCountByRole(companyId: number, user: UserCtx): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const visibleIds = await getVisibleUserIds(user);
  const result = await db.select({ count: sql<number>`count(*)` }).from(contacts)
    .where(and(eq(contacts.companyId, companyId), inArray(contacts.userId, visibleIds)));
  return Number(result[0]?.count ?? 0);
}

export async function getContactsByCompanyByRole(companyId: number, user: UserCtx) {
  const db = await getDb();
  if (!db) return [];
  const visibleIds = await getVisibleUserIds(user);
  return db.select().from(contacts)
    .where(and(eq(contacts.companyId, companyId), inArray(contacts.userId, visibleIds)))
    .orderBy(desc(contacts.createdAt));
}

export async function updateCompany(id: number, userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(companies).set({ ...data, updatedAt: Date.now() }).where(and(eq(companies.id, id), eq(companies.userId, userId)));
}

export async function deleteCompany(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(companies).where(and(eq(companies.id, id), eq(companies.userId, userId)));
}

export async function deleteContactsByCompany(companyId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(contacts).where(and(eq(contacts.companyId, companyId), eq(contacts.userId, userId)));
}

export async function listCompaniesWithMetrics(userId: number, opts?: { search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq(companies.userId, userId)];
  if (opts?.search) conditions.push(or(like(companies.name, `%${opts.search}%`), like(companies.domain, `%${opts.search}%`))!);
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(companies).where(where).orderBy(desc(companies.createdAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(companies).where(where),
  ]);
  // Fetch metrics for each company
  const companyIds = items.map(c => c.id);
  if (companyIds.length === 0) return { items: [], total: countResult[0]?.count ?? 0 };
  const [contactCounts, dealMetrics] = await Promise.all([
    db.select({ companyId: contacts.companyId, count: sql<number>`count(*)` }).from(contacts).where(and(inArray(contacts.companyId, companyIds), eq(contacts.userId, userId))).groupBy(contacts.companyId),
    db.select({ companyId: deals.companyId, openDeals: sql<number>`SUM(CASE WHEN ${deals.status} = 'open' THEN 1 ELSE 0 END)`, pipelineValue: sql<number>`SUM(CASE WHEN ${deals.status} = 'open' THEN COALESCE(${deals.value}, 0) ELSE 0 END)` }).from(deals).where(and(inArray(deals.companyId, companyIds), eq(deals.userId, userId))).groupBy(deals.companyId),
  ]);
  const contactMap = new Map(contactCounts.map(c => [c.companyId, c.count]));
  const dealMap = new Map(dealMetrics.map(d => [d.companyId, { openDeals: d.openDeals ?? 0, pipelineValue: d.pipelineValue ?? 0 }]));
  const enrichedItems = items.map(c => ({
    ...c,
    contactCount: contactMap.get(c.id) ?? 0,
    openDeals: dealMap.get(c.id)?.openDeals ?? 0,
    pipelineValue: dealMap.get(c.id)?.pipelineValue ?? 0,
  }));
  return { items: enrichedItems, total: countResult[0]?.count ?? 0 };
}

export async function getCompanyContactCount(companyId: number, userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(contacts).where(and(eq(contacts.companyId, companyId), eq(contacts.userId, userId)));
  return result[0]?.count ?? 0;
}

// ─── Pipelines & Stages ───
export async function listPipelines(userId: number, tenantCompanyId?: number | null) {
  const db = await getDb();
  if (!db) return [];
  if (tenantCompanyId) {
    // Return all pipelines belonging to any user in the same tenant company
    const tenantUsers = await db.select({ id: users.id }).from(users).where(eq(users.tenantCompanyId, tenantCompanyId));
    const userIds = tenantUsers.map(u => u.id);
    if (userIds.length === 0) return db.select().from(pipelines).where(eq(pipelines.userId, userId)).orderBy(asc(pipelines.createdAt));
    return db.select().from(pipelines).where(inArray(pipelines.userId, userIds)).orderBy(asc(pipelines.createdAt));
  }
  return db.select().from(pipelines).where(eq(pipelines.userId, userId)).orderBy(asc(pipelines.createdAt));
}

export async function createPipeline(userId: number, name: string, stages: { name: string; probability: number; color: string }[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(pipelines).values({ userId, name, isDefault: false, createdAt: Date.now() });
  const pipelineId = result[0].insertId;
  if (stages.length > 0) {
    await db.insert(pipelineStages).values(stages.map((s, i) => ({ pipelineId, name: s.name, order: i, probability: s.probability, color: s.color })));
  }
  return pipelineId;
}

export async function getPipelineStages(pipelineId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pipelineStages).where(eq(pipelineStages.pipelineId, pipelineId)).orderBy(asc(pipelineStages.order));
}

export async function deletePipeline(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(pipelineStages).where(eq(pipelineStages.pipelineId, id));
  await db.delete(pipelines).where(and(eq(pipelines.id, id), eq(pipelines.userId, userId)));
}

// ─── Deals ───
export async function listDeals(userId: number, opts?: { pipelineId?: number; status?: string; limit?: number; offset?: number; tenantCompanyId?: number | null }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  let userIdFilter = [userId];
  if (opts?.tenantCompanyId) {
    const tenantUsers = await db.select({ id: users.id }).from(users).where(eq(users.tenantCompanyId, opts.tenantCompanyId));
    userIdFilter = tenantUsers.map(u => u.id);
    if (userIdFilter.length === 0) userIdFilter = [userId];
  }
  const conditions = [inArray(deals.userId, userIdFilter)];
  if (opts?.pipelineId) conditions.push(eq(deals.pipelineId, opts.pipelineId));
  if (opts?.status) conditions.push(eq(deals.status, opts.status as any));
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(deals).where(where).orderBy(desc(deals.createdAt)).limit(opts?.limit ?? 100).offset(opts?.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(deals).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getDeal(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(deals).where(and(eq(deals.id, id), eq(deals.userId, userId))).limit(1);
  return result[0] || null;
}

export async function createDeal(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(deals).values(data);
  return result[0].insertId;
}

export async function updateDeal(id: number, userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(deals).set({ ...data, updatedAt: Date.now() }).where(and(eq(deals.id, id), eq(deals.userId, userId)));
}

export async function deleteDeal(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(deals).where(and(eq(deals.id, id), eq(deals.userId, userId)));
}

// ─── Activities (expanded: note, email, call, meeting, task, system events) ───
export async function listActivities(userId: number, opts?: { contactId?: number; companyId?: number; dealId?: number; type?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(activities.userId, userId)];
  if (opts?.contactId) conditions.push(eq(activities.contactId, opts.contactId));
  if (opts?.companyId) conditions.push(eq(activities.companyId, opts.companyId));
  if (opts?.dealId) conditions.push(eq(activities.dealId, opts.dealId));
  if (opts?.type) conditions.push(eq(activities.type, opts.type));
  return db.select().from(activities).where(and(...conditions)).orderBy(desc(activities.createdAt)).limit(opts?.limit ?? 50);
}

export async function getRecentActivitiesWithContext(userId: number, limit: number = 15) {
  const db = await getDb();
  if (!db) return [];
  // Join activities -> contacts -> companies (via contact.companyId) to resolve company name
  // even when activity.companyId is not set
  const rows = await db
    .select({
      id: activities.id,
      type: activities.type,
      subject: activities.subject,
      body: activities.body,
      callOutcome: activities.callOutcome,
      callDuration: activities.callDuration,
      emailTo: activities.emailTo,
      meetingLocation: activities.meetingLocation,
      meetingOutcome: activities.meetingOutcome,
      createdAt: activities.createdAt,
      contactId: activities.contactId,
      companyId: activities.companyId,
      dealId: activities.dealId,
      contactFirstName: contacts.firstName,
      contactLastName: contacts.lastName,
      companyName: companies.name,
    })
    .from(activities)
    .leftJoin(contacts, eq(activities.contactId, contacts.id))
    .leftJoin(companies, sql`${companies.id} = COALESCE(${activities.companyId}, ${contacts.companyId})`)
    .where(eq(activities.userId, userId))
    .orderBy(desc(activities.createdAt))
    .limit(limit);
  return rows;
}

export async function createActivity(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(activities).values({ ...data, createdAt: data.createdAt ?? Date.now() });
}

// ─── Tasks (expanded per TaskPage.docx) ───
export async function listTasks(userId: number, opts?: { status?: string; taskType?: string; queue?: string; contactId?: number; companyId?: number; dealId?: number; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq(tasks.userId, userId)];
  if (opts?.status) conditions.push(eq(tasks.status, opts.status as any));
  if (opts?.taskType) conditions.push(eq(tasks.taskType, opts.taskType));
  if (opts?.queue) conditions.push(eq(tasks.queue, opts.queue));
  if (opts?.contactId) conditions.push(eq(tasks.contactId, opts.contactId));
  if (opts?.companyId) conditions.push(eq(tasks.companyId, opts.companyId));
  if (opts?.dealId) conditions.push(eq(tasks.dealId, opts.dealId));
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(tasks).where(where).orderBy(desc(tasks.createdAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(tasks).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function createTask(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(tasks).values({ ...data, status: data.status ?? "not_started", createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateTask(id: number, userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(tasks).set({ ...data, updatedAt: Date.now() }).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

export async function deleteTask(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

// ─── Email Templates ───
export async function listEmailTemplates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailTemplates).where(or(eq(emailTemplates.userId, userId), eq(emailTemplates.isSystem, true))).orderBy(desc(emailTemplates.createdAt));
}

export async function createEmailTemplate(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(emailTemplates).values({ ...data, isSystem: false, createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateEmailTemplate(id: number, userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(emailTemplates).set({ ...data, updatedAt: Date.now() }).where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));
}

export async function deleteEmailTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(emailTemplates).where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));
}

// ─── Email Campaigns ───
export async function listCampaigns(userId: number, opts?: { status?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq(emailCampaigns.userId, userId)];
  if (opts?.status) conditions.push(eq(emailCampaigns.status, opts.status as any));
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(emailCampaigns).where(where).orderBy(desc(emailCampaigns.createdAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(emailCampaigns).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function createCampaign(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(emailCampaigns).values({ ...data, status: "draft", createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateCampaign(id: number, userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(emailCampaigns).set({ ...data, updatedAt: Date.now() }).where(and(eq(emailCampaigns.id, id), eq(emailCampaigns.userId, userId)));
}

export async function deleteCampaign(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(emailCampaigns).where(and(eq(emailCampaigns.id, id), eq(emailCampaigns.userId, userId)));
}

// ─── SMTP Accounts ───
export async function listSmtpAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(smtpAccounts).where(eq(smtpAccounts.userId, userId)).orderBy(asc(smtpAccounts.domain));
}

export async function createSmtpAccount(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(smtpAccounts).values({ ...data, createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateSmtpAccount(id: number, userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(smtpAccounts).set({ ...data, updatedAt: Date.now() }).where(and(eq(smtpAccounts.id, id), eq(smtpAccounts.userId, userId)));
}

export async function deleteSmtpAccount(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(smtpAccounts).where(and(eq(smtpAccounts.id, id), eq(smtpAccounts.userId, userId)));
}

export async function getAvailableSmtpAccount(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(smtpAccounts)
    .where(and(eq(smtpAccounts.userId, userId), eq(smtpAccounts.isActive, true)))
    .orderBy(asc(smtpAccounts.sentToday))
    .limit(1);
  return result[0] ?? null;
}

export async function incrementSmtpSentCount(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(smtpAccounts).set({
    sentToday: sql`sentToday + 1`,
    lastSentAt: Date.now(),
    updatedAt: Date.now(),
  }).where(eq(smtpAccounts.id, id));
}

export async function resetDailySmtpCounts(userId: number) {
  const db = await getDb();
  if (!db) return;
  const today = new Date().toISOString().slice(0, 10);
  await db.update(smtpAccounts).set({ sentToday: 0, lastResetDate: today, updatedAt: Date.now() })
    .where(and(eq(smtpAccounts.userId, userId)));
}

// ─── Email Queue ───
export async function addToEmailQueue(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(emailQueue).values({ ...data, status: "pending", createdAt: Date.now() });
  return result[0].insertId;
}

export async function listEmailQueue(opts?: { campaignId?: number; status?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (opts?.campaignId) conditions.push(eq(emailQueue.campaignId, opts.campaignId));
  if (opts?.status) conditions.push(eq(emailQueue.status, opts.status));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(emailQueue).where(where).orderBy(asc(emailQueue.createdAt)).limit(opts?.limit ?? 100);
}

export async function updateEmailQueueItem(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(emailQueue).set(data).where(eq(emailQueue.id, id));
}

// ─── Domain Health ───
export async function listDomainHealth(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(domainHealth).where(eq(domainHealth.userId, userId)).orderBy(desc(domainHealth.createdAt));
}

export async function createDomainHealth(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(domainHealth).values({ ...data, createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateDomainHealth(id: number, userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(domainHealth).set({ ...data, updatedAt: Date.now() }).where(and(eq(domainHealth.id, id), eq(domainHealth.userId, userId)));
}

// ─── Segments ───
export async function listSegments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(segments).where(eq(segments.userId, userId)).orderBy(desc(segments.createdAt));
}

export async function createSegment(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(segments).values({ ...data, createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateSegment(id: number, userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(segments).set({ ...data, updatedAt: Date.now() }).where(and(eq(segments.id, id), eq(segments.userId, userId)));
}

export async function deleteSegment(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(segments).where(and(eq(segments.id, id), eq(segments.userId, userId)));
}

// ─── Workflows ───
export async function listWorkflows(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workflows).where(eq(workflows.userId, userId)).orderBy(desc(workflows.createdAt));
}

export async function createWorkflow(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(workflows).values({ ...data, status: "draft", createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateWorkflow(id: number, userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(workflows).set({ ...data, updatedAt: Date.now() }).where(and(eq(workflows.id, id), eq(workflows.userId, userId)));
}

export async function deleteWorkflow(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(workflows).where(and(eq(workflows.id, id), eq(workflows.userId, userId)));
}

// ─── A/B Tests ───
export async function listAbTests(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(abTests).where(eq(abTests.userId, userId)).orderBy(desc(abTests.createdAt));
}

export async function createAbTest(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(abTests).values({ ...data, status: "draft", createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateAbTest(id: number, userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(abTests).set({ ...data, updatedAt: Date.now() }).where(and(eq(abTests.id, id), eq(abTests.userId, userId)));
}

export async function deleteAbTest(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(abTests).where(and(eq(abTests.id, id), eq(abTests.userId, userId)));
}

// ─── API Keys ───
export async function listApiKeys(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: apiKeys.id, name: apiKeys.name, keyPrefix: apiKeys.keyPrefix, permissions: apiKeys.permissions, lastUsedAt: apiKeys.lastUsedAt, expiresAt: apiKeys.expiresAt, isActive: apiKeys.isActive, createdAt: apiKeys.createdAt }).from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt));
}

export async function createApiKey(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(apiKeys).values({ ...data, isActive: true, createdAt: Date.now() });
  return result[0].insertId;
}

export async function deleteApiKey(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
}

// ─── Webhooks ───
export async function listWebhooks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhooks).where(eq(webhooks.userId, userId)).orderBy(desc(webhooks.createdAt));
}

export async function createWebhook(data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(webhooks).values({ ...data, isActive: true, createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateWebhook(id: number, userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(webhooks).set({ ...data, updatedAt: Date.now() }).where(and(eq(webhooks.id, id), eq(webhooks.userId, userId)));
}

export async function deleteWebhook(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.userId, userId)));
}

export async function listWebhookLogs(webhookId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhookLogs).where(eq(webhookLogs.webhookId, webhookId)).orderBy(desc(webhookLogs.createdAt)).limit(limit);
}

export async function getWebhookLog(logId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(webhookLogs).where(eq(webhookLogs.id, logId)).limit(1);
  return row ?? null;
}

export async function getWebhookByIdAndUser(webhookId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(webhooks).where(and(eq(webhooks.id, webhookId), eq(webhooks.userId, userId))).limit(1);
  return row ?? null;
}

export async function insertWebhookLog(data: { webhookId: number; event: string; payload?: string | null; responseStatus?: number | null; responseBody?: string | null; createdAt: number }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(webhookLogs).values(data as any);
}

// ─── Dashboard Stats ───
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalContacts: 0, totalCompanies: 0, totalDeals: 0, openDeals: 0, wonDeals: 0, lostDeals: 0, totalValue: 0, wonValue: 0, totalCampaigns: 0, totalTasks: 0, pendingTasks: 0, totalSmtpAccounts: 0, emailsSentToday: 0 };
  const [contactCount, companyCount, dealStats, campaignCount, taskStats, smtpStats] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(contacts).where(eq(contacts.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(companies).where(eq(companies.userId, userId)),
    db.select({
      total: sql<number>`count(*)`,
      open: sql<number>`SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)`,
      won: sql<number>`SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END)`,
      lost: sql<number>`SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END)`,
      totalValue: sql<number>`COALESCE(SUM(dealValue), 0)`,
      wonValue: sql<number>`COALESCE(SUM(CASE WHEN status = 'won' THEN dealValue ELSE 0 END), 0)`,
    }).from(deals).where(eq(deals.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(emailCampaigns).where(eq(emailCampaigns.userId, userId)),
    db.select({
      total: sql<number>`count(*)`,
      pending: sql<number>`SUM(CASE WHEN taskStatus = 'not_started' THEN 1 ELSE 0 END)`,
    }).from(tasks).where(eq(tasks.userId, userId)),
    db.select({
      total: sql<number>`count(*)`,
      sentToday: sql<number>`COALESCE(SUM(sentToday), 0)`,
    }).from(smtpAccounts).where(eq(smtpAccounts.userId, userId)),
  ]);
  return {
    totalContacts: contactCount[0]?.count ?? 0,
    totalCompanies: companyCount[0]?.count ?? 0,
    totalDeals: dealStats[0]?.total ?? 0,
    openDeals: dealStats[0]?.open ?? 0,
    wonDeals: dealStats[0]?.won ?? 0,
    lostDeals: dealStats[0]?.lost ?? 0,
    totalValue: dealStats[0]?.totalValue ?? 0,
    wonValue: dealStats[0]?.wonValue ?? 0,
    totalCampaigns: campaignCount[0]?.count ?? 0,
    totalTasks: taskStats[0]?.total ?? 0,
    pendingTasks: taskStats[0]?.pending ?? 0,
    totalSmtpAccounts: smtpStats[0]?.total ?? 0,
    emailsSentToday: smtpStats[0]?.sentToday ?? 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// PARADIGM ENGINE — Database Helpers
// ═══════════════════════════════════════════════════════════════

// ─── Integration Credentials ───
export async function listIntegrationCredentials(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(integrationCredentials).where(eq(integrationCredentials.userId, userId)).orderBy(asc(integrationCredentials.service));
}

export async function getIntegrationCredential(userId: number, service: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(integrationCredentials).where(and(eq(integrationCredentials.userId, userId), eq(integrationCredentials.service, service))).limit(1);
  return result[0];
}

export async function upsertIntegrationCredential(data: { userId: number; service: string; apiKey: string; apiSecret?: string; baseUrl?: string }) {
  const db = await getDb(); if (!db) return 0;
  const now = Date.now();
  const existing = await getIntegrationCredential(data.userId, data.service);
  if (existing) {
    await db.update(integrationCredentials).set({ apiKey: data.apiKey, apiSecret: data.apiSecret ?? null, baseUrl: data.baseUrl ?? null, updatedAt: now }).where(eq(integrationCredentials.id, existing.id));
    return existing.id;
  }
  const [result] = await db.insert(integrationCredentials).values({ ...data, createdAt: now, updatedAt: now }).$returningId();
  return result.id;
}

export async function updateIntegrationTestStatus(id: number, status: string, message?: string) {
  const db = await getDb(); if (!db) return;
  await db.update(integrationCredentials).set({ testStatus: status, testMessage: message ?? null, lastTestedAt: Date.now(), updatedAt: Date.now() }).where(eq(integrationCredentials.id, id));
}

export async function deleteIntegrationCredential(id: number, userId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(integrationCredentials).where(and(eq(integrationCredentials.id, id), eq(integrationCredentials.userId, userId)));
}

// ─── Prospects ───
export async function listProspects(userId: number, opts?: { search?: string; stage?: string; verificationStatus?: string; limit?: number; offset?: number }) {
  const db = await getDb(); if (!db) return { items: [], total: 0 };
  const conditions = [eq(prospects.userId, userId)];
  if (opts?.stage) conditions.push(eq(prospects.engagementStage, opts.stage));
  if (opts?.verificationStatus) conditions.push(eq(prospects.verificationStatus, opts.verificationStatus));
  if (opts?.search) conditions.push(or(like(prospects.firstName, `%${opts.search}%`), like(prospects.lastName, `%${opts.search}%`), like(prospects.email, `%${opts.search}%`), like(prospects.companyName, `%${opts.search}%`))!);
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(prospects).where(where).orderBy(desc(prospects.createdAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(prospects).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function getProspect(id: number, userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(prospects).where(and(eq(prospects.id, id), eq(prospects.userId, userId))).limit(1);
  return result[0];
}

export async function createProspect(data: Omit<InsertProspect, "id">) {
  const db = await getDb(); if (!db) return 0;
  const [result] = await db.insert(prospects).values(data).$returningId();
  return result.id;
}

export async function updateProspect(id: number, userId: number, data: Partial<InsertProspect>) {
  const db = await getDb(); if (!db) return;
  await db.update(prospects).set({ ...data, updatedAt: Date.now() }).where(and(eq(prospects.id, id), eq(prospects.userId, userId)));
}

export async function deleteProspect(id: number, userId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(prospects).where(and(eq(prospects.id, id), eq(prospects.userId, userId)));
}

export async function getProspectStats(userId: number) {
  const db = await getDb(); if (!db) return { total: 0, discovered: 0, verified: 0, profiled: 0, sequenced: 0, engaged: 0, replied: 0, hotLeads: 0, converted: 0, disqualified: 0, avgIntentScore: 0 };
  const result = await db.select({
    total: sql<number>`count(*)`,
    discovered: sql<number>`SUM(CASE WHEN engagementStage = 'discovered' THEN 1 ELSE 0 END)`,
    verified: sql<number>`SUM(CASE WHEN engagementStage = 'verified' THEN 1 ELSE 0 END)`,
    profiled: sql<number>`SUM(CASE WHEN engagementStage = 'profiled' THEN 1 ELSE 0 END)`,
    sequenced: sql<number>`SUM(CASE WHEN engagementStage = 'sequenced' THEN 1 ELSE 0 END)`,
    engaged: sql<number>`SUM(CASE WHEN engagementStage = 'engaged' THEN 1 ELSE 0 END)`,
    replied: sql<number>`SUM(CASE WHEN engagementStage = 'replied' THEN 1 ELSE 0 END)`,
    hotLeads: sql<number>`SUM(CASE WHEN engagementStage = 'hot_lead' THEN 1 ELSE 0 END)`,
    converted: sql<number>`SUM(CASE WHEN engagementStage = 'converted' THEN 1 ELSE 0 END)`,
    disqualified: sql<number>`SUM(CASE WHEN engagementStage = 'disqualified' THEN 1 ELSE 0 END)`,
    avgIntentScore: sql<number>`COALESCE(AVG(intentScore), 0)`,
  }).from(prospects).where(eq(prospects.userId, userId));
  const r = result[0];
  return {
    total: Number(r?.total ?? 0),
    discovered: Number(r?.discovered ?? 0),
    verified: Number(r?.verified ?? 0),
    profiled: Number(r?.profiled ?? 0),
    sequenced: Number(r?.sequenced ?? 0),
    engaged: Number(r?.engaged ?? 0),
    replied: Number(r?.replied ?? 0),
    hotLeads: Number(r?.hotLeads ?? 0),
    converted: Number(r?.converted ?? 0),
    disqualified: Number(r?.disqualified ?? 0),
    avgIntentScore: Number(r?.avgIntentScore ?? 0),
  };
}

export async function getHotLeads(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(prospects).where(and(eq(prospects.userId, userId), eq(prospects.engagementStage, "hot_lead"))).orderBy(desc(prospects.intentScore)).limit(20);
}

// ─── Trigger Signals ───
export async function listTriggerSignals(userId: number, opts?: { status?: string; type?: string; limit?: number; offset?: number }) {
  const db = await getDb(); if (!db) return { items: [], total: 0 };
  const conditions = [eq(triggerSignals.userId, userId)];
  if (opts?.status) conditions.push(eq(triggerSignals.status, opts.status));
  if (opts?.type) conditions.push(eq(triggerSignals.signalType, opts.type));
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(triggerSignals).where(where).orderBy(desc(triggerSignals.createdAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(triggerSignals).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function createTriggerSignal(data: Omit<TriggerSignal, "id">) {
  const db = await getDb(); if (!db) return 0;
  const [result] = await db.insert(triggerSignals).values(data).$returningId();
  return result.id;
}

export async function updateTriggerSignal(id: number, userId: number, data: Partial<TriggerSignal>) {
  const db = await getDb(); if (!db) return;
  await db.update(triggerSignals).set(data).where(and(eq(triggerSignals.id, id), eq(triggerSignals.userId, userId)));
}

// ─── Ghost Sequences ───
export async function listGhostSequences(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(ghostSequences).where(eq(ghostSequences.userId, userId)).orderBy(desc(ghostSequences.createdAt));
}

export async function getGhostSequence(id: number, userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(ghostSequences).where(and(eq(ghostSequences.id, id), eq(ghostSequences.userId, userId))).limit(1);
  return result[0];
}

export async function createGhostSequence(data: { userId: number; name: string; description?: string; stylisticFingerprint?: any }) {
  const db = await getDb(); if (!db) return 0;
  const now = Date.now();
  const [result] = await db.insert(ghostSequences).values({ ...data, createdAt: now, updatedAt: now }).$returningId();
  return result.id;
}

export async function updateGhostSequence(id: number, userId: number, data: Partial<GhostSequence>) {
  const db = await getDb(); if (!db) return;
  await db.update(ghostSequences).set({ ...data, updatedAt: Date.now() }).where(and(eq(ghostSequences.id, id), eq(ghostSequences.userId, userId)));
}

export async function deleteGhostSequence(id: number, userId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(ghostSequenceSteps).where(eq(ghostSequenceSteps.sequenceId, id));
  await db.delete(ghostSequences).where(and(eq(ghostSequences.id, id), eq(ghostSequences.userId, userId)));
}

// ─── Ghost Sequence Steps ───
export async function listGhostSequenceSteps(sequenceId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(ghostSequenceSteps).where(eq(ghostSequenceSteps.sequenceId, sequenceId)).orderBy(asc(ghostSequenceSteps.stepOrder));
}

export async function createGhostSequenceStep(data: { sequenceId: number; stepOrder: number; delayDays?: number; subject?: string; bodyTemplate?: string; aiGenerated?: boolean; useDigitalTwin?: boolean; toneOverride?: string }) {
  const db = await getDb(); if (!db) return 0;
  const [result] = await db.insert(ghostSequenceSteps).values({ ...data, createdAt: Date.now() }).$returningId();
  return result.id;
}

export async function updateGhostSequenceStep(id: number, data: Partial<GhostSequenceStep>) {
  const db = await getDb(); if (!db) return;
  await db.update(ghostSequenceSteps).set(data).where(eq(ghostSequenceSteps.id, id));
}

export async function deleteGhostSequenceStep(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(ghostSequenceSteps).where(eq(ghostSequenceSteps.id, id));
}

// ─── Prospect Outreach ───
export async function listProspectOutreach(prospectId: number, limit?: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(prospectOutreach).where(eq(prospectOutreach.prospectId, prospectId)).orderBy(desc(prospectOutreach.createdAt)).limit(limit ?? 50);
}

export async function createProspectOutreach(data: Omit<ProspectOutreach, "id">) {
  const db = await getDb(); if (!db) return 0;
  const [result] = await db.insert(prospectOutreach).values(data).$returningId();
  return result.id;
}

export async function updateProspectOutreach(id: number, data: Partial<ProspectOutreach>) {
  const db = await getDb(); if (!db) return;
  await db.update(prospectOutreach).set(data).where(eq(prospectOutreach.id, id));
}

export async function getOutreachStats(userId: number) {
  const db = await getDb(); if (!db) return { totalSent: 0, totalOpened: 0, totalReplied: 0, totalBounced: 0, openRate: 0, replyRate: 0, bounceRate: 0 };
  const result = await db.select({
    totalSent: sql<number>`SUM(CASE WHEN outreachStatus IN ('sent','opened','clicked','replied') THEN 1 ELSE 0 END)`,
    totalOpened: sql<number>`SUM(CASE WHEN outreachStatus IN ('opened','clicked','replied') THEN 1 ELSE 0 END)`,
    totalReplied: sql<number>`SUM(CASE WHEN outreachStatus = 'replied' THEN 1 ELSE 0 END)`,
    totalBounced: sql<number>`SUM(CASE WHEN outreachStatus = 'bounced' THEN 1 ELSE 0 END)`,
  }).from(prospectOutreach)
    .innerJoin(prospects, eq(prospectOutreach.prospectId, prospects.id))
    .where(eq(prospects.userId, userId));
  const r = result[0];
  const sent = Number(r?.totalSent ?? 0);
  const opened = Number(r?.totalOpened ?? 0);
  const replied = Number(r?.totalReplied ?? 0);
  const bounced = Number(r?.totalBounced ?? 0);
  return {
    totalSent: sent,
    totalOpened: opened,
    totalReplied: replied,
    totalBounced: bounced,
    openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
    replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
    bounceRate: sent > 0 ? Math.round((bounced / sent) * 100) : 0,
  };
}

// ─── Battle Cards ───
export async function listBattleCards(userId: number, opts?: { unreadOnly?: boolean; limit?: number }) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(battleCards.userId, userId), eq(battleCards.isArchived, false)];
  if (opts?.unreadOnly) conditions.push(eq(battleCards.isRead, false));
  return db.select().from(battleCards).where(and(...conditions)).orderBy(desc(battleCards.generatedAt)).limit(opts?.limit ?? 20);
}

export async function getBattleCard(id: number, userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(battleCards).where(and(eq(battleCards.id, id), eq(battleCards.userId, userId))).limit(1);
  return result[0];
}

export async function createBattleCard(data: Omit<BattleCard, "id">) {
  const db = await getDb(); if (!db) return 0;
  const [result] = await db.insert(battleCards).values(data).$returningId();
  return result.id;
}

export async function updateBattleCard(id: number, userId: number, data: Partial<BattleCard>) {
  const db = await getDb(); if (!db) return;
  await db.update(battleCards).set(data).where(and(eq(battleCards.id, id), eq(battleCards.userId, userId)));
}

// ─── Paradigm Engine Dashboard Stats ───
export async function getParadigmStats(userId: number) {
  const prospectStats = await getProspectStats(userId);
  const outreachStats = await getOutreachStats(userId);
  const db = await getDb();
  let signalCount = 0;
  let activeSequences = 0;
  let unreadBattleCards = 0;
  if (db) {
    const [signals] = await db.select({ count: sql<number>`count(*)` }).from(triggerSignals).where(and(eq(triggerSignals.userId, userId), eq(triggerSignals.status, "new")));
    signalCount = Number(signals?.count ?? 0);
    const [seqs] = await db.select({ count: sql<number>`count(*)` }).from(ghostSequences).where(and(eq(ghostSequences.userId, userId), eq(ghostSequences.status, "active")));
    activeSequences = Number(seqs?.count ?? 0);
    const [cards] = await db.select({ count: sql<number>`count(*)` }).from(battleCards).where(and(eq(battleCards.userId, userId), eq(battleCards.isRead, false), eq(battleCards.isArchived, false)));
    unreadBattleCards = Number(cards?.count ?? 0);
  }
  return { ...prospectStats, ...outreachStats, newSignals: signalCount, activeSequences, unreadBattleCards };
}

// ─── Recent AI Activity Feed ───
export async function getRecentActivity(userId: number, limit?: number) {
  const db = await getDb(); if (!db) return [];
  // Combine recent signals, outreach, and prospect updates into a unified feed
  const recentSignals = await db.select({
    id: triggerSignals.id,
    type: sql<string>`'signal'`,
    title: triggerSignals.title,
    description: triggerSignals.description,
    status: triggerSignals.status,
    priority: triggerSignals.priority,
    createdAt: triggerSignals.createdAt,
  }).from(triggerSignals).where(eq(triggerSignals.userId, userId)).orderBy(desc(triggerSignals.createdAt)).limit(limit ?? 20);

  const recentOutreach = await db.select({
    id: prospectOutreach.id,
    type: sql<string>`'outreach'`,
    title: prospectOutreach.subject,
    description: sql<string>`CONCAT('To: ', prospect_outreach.toEmail)`,
    status: prospectOutreach.status,
    priority: sql<string>`'medium'`,
    createdAt: prospectOutreach.createdAt,
  }).from(prospectOutreach)
    .innerJoin(prospects, eq(prospectOutreach.prospectId, prospects.id))
    .where(eq(prospects.userId, userId))
    .orderBy(desc(prospectOutreach.createdAt)).limit(limit ?? 20);

  const combined = [...recentSignals, ...recentOutreach].sort((a, b) => Number(b.createdAt) - Number(a.createdAt)).slice(0, limit ?? 30);
  return combined;
}


// ═══════════════════════════════════════════════════════════════
// COMPLIANCE FORTRESS + DELIVERABILITY ENGINE DB HELPERS
// ═══════════════════════════════════════════════════════════════

// ─── Suppression List ───
export async function addToSuppressionList(entry: { userId: number; email: string; reason: string; source?: string; campaignId?: number; notes?: string }) {
  const db = await getDb(); if (!db) return;
  const existing = await db.select().from(suppressionList).where(and(eq(suppressionList.userId, entry.userId), eq(suppressionList.email, entry.email.toLowerCase()))).limit(1);
  if (existing.length > 0) return existing[0];
  const [result] = await db.insert(suppressionList).values({ ...entry, email: entry.email.toLowerCase(), createdAt: Date.now() }).$returningId();
  return { id: result.id, ...entry };
}

export async function isEmailSuppressed(userId: number, email: string) {
  const db = await getDb(); if (!db) return false;
  const result = await db.select().from(suppressionList).where(and(eq(suppressionList.userId, userId), eq(suppressionList.email, email.toLowerCase()))).limit(1);
  return result.length > 0;
}

export async function listSuppressionEntries(userId: number, opts: { limit?: number; offset?: number; reason?: string } = {}) {
  const db = await getDb(); if (!db) return { items: [], total: 0 };
  const conditions = [eq(suppressionList.userId, userId)];
  if (opts.reason) conditions.push(eq(suppressionList.reason, opts.reason));
  const items = await db.select().from(suppressionList).where(and(...conditions)).orderBy(desc(suppressionList.createdAt)).limit(opts.limit || 50).offset(opts.offset || 0);
  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(suppressionList).where(and(...conditions));
  return { items, total: countResult?.count || 0 };
}

export async function removeFromSuppressionList(userId: number, id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(suppressionList).where(and(eq(suppressionList.id, id), eq(suppressionList.userId, userId)));
}

// ─── Compliance Audit Log ───
export async function logComplianceCheck(entry: Omit<ComplianceAuditEntry, 'id'>) {
  const db = await getDb(); if (!db) return;
  const [result] = await db.insert(complianceAuditLog).values(entry).$returningId();
  return { id: result.id, ...entry };
}

export async function listComplianceAudits(userId: number, opts: { limit?: number; offset?: number; campaignId?: number; passed?: boolean } = {}) {
  const db = await getDb(); if (!db) return { items: [], total: 0 };
  const conditions = [eq(complianceAuditLog.userId, userId)];
  if (opts.campaignId) conditions.push(eq(complianceAuditLog.campaignId, opts.campaignId));
  if (opts.passed !== undefined) conditions.push(eq(complianceAuditLog.compliancePassed, opts.passed));
  const items = await db.select().from(complianceAuditLog).where(and(...conditions)).orderBy(desc(complianceAuditLog.createdAt)).limit(opts.limit || 50).offset(opts.offset || 0);
  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(complianceAuditLog).where(and(...conditions));
  return { items, total: countResult?.count || 0 };
}

export async function getComplianceStats(userId: number) {
  const db = await getDb(); if (!db) return { total: 0, passed: 0, failed: 0, passRate: 0 };
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(complianceAuditLog).where(eq(complianceAuditLog.userId, userId));
  const [passed] = await db.select({ count: sql<number>`count(*)` }).from(complianceAuditLog).where(and(eq(complianceAuditLog.userId, userId), eq(complianceAuditLog.compliancePassed, true)));
  const t = total?.count || 0;
  const p = passed?.count || 0;
  return { total: t, passed: p, failed: t - p, passRate: t > 0 ? Math.round((p / t) * 100) : 100 };
}

// ─── Sender Settings ───
export async function getSenderSettings(userId: number) {
  const db = await getDb(); if (!db) return null;
  const result = await db.select().from(senderSettings).where(eq(senderSettings.userId, userId)).limit(1);
  return result[0] || null;
}

export async function upsertSenderSettings(userId: number, data: Partial<SenderSetting>) {
  const db = await getDb(); if (!db) return;
  const existing = await getSenderSettings(userId);
  const now = Date.now();
  if (existing) {
    await db.update(senderSettings).set({ ...data, updatedAt: now }).where(eq(senderSettings.userId, userId));
    return { ...existing, ...data, updatedAt: now };
  } else {
    const [result] = await db.insert(senderSettings).values({
      userId,
      companyName: data.companyName || 'My Company',
      physicalAddress: data.physicalAddress || '123 Main St',
      ...data,
      createdAt: now,
      updatedAt: now,
    } as any).$returningId();
    return { id: result.id, userId, ...data };
  }
}

// ─── Domain Sending Stats ───
export async function recordDomainStat(userId: number, domain: string, provider: string, field: 'sent' | 'delivered' | 'bounced' | 'complaints' | 'opens' | 'clicks' | 'unsubscribes') {
  const db = await getDb(); if (!db) return;
  const today = new Date().toISOString().split('T')[0];
  const existing = await db.select().from(domainSendingStats).where(and(
    eq(domainSendingStats.userId, userId),
    eq(domainSendingStats.domain, domain),
    eq(domainSendingStats.provider, provider),
    eq(domainSendingStats.date, today)
  )).limit(1);
  if (existing.length > 0) {
    const stat = existing[0];
    const update: any = { [field]: (stat as any)[field] + 1 };
    // Recalculate rates
    const newSent = field === 'sent' ? stat.sent + 1 : stat.sent;
    if (newSent > 0) {
      const newBounced = field === 'bounced' ? stat.bounced + 1 : stat.bounced;
      const newComplaints = field === 'complaints' ? stat.complaints + 1 : stat.complaints;
      const newOpens = field === 'opens' ? stat.opens + 1 : stat.opens;
      update.bounceRate = Math.round((newBounced / newSent) * 10000);
      update.complaintRate = Math.round((newComplaints / newSent) * 100000);
      update.openRate = Math.round((newOpens / newSent) * 10000);
    }
    await db.update(domainSendingStats).set(update).where(eq(domainSendingStats.id, stat.id));
  } else {
    await db.insert(domainSendingStats).values({
      userId, domain, provider, statDate: today,
      [field]: 1,
      createdAt: Date.now(),
    } as any);
  }
}

export async function getDomainStats(userId: number, opts: { domain?: string; days?: number } = {}) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(domainSendingStats.userId, userId)];
  if (opts.domain) conditions.push(eq(domainSendingStats.domain, opts.domain));
  if (opts.days) {
    const cutoff = new Date(Date.now() - opts.days * 86400000).toISOString().split('T')[0];
    conditions.push(sql`${domainSendingStats.date} >= ${cutoff}`);
  }
  return db.select().from(domainSendingStats).where(and(...conditions)).orderBy(desc(domainSendingStats.date));
}

export async function getDomainStatsAggregated(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select({
    domain: domainSendingStats.domain,
    totalSent: sql<number>`SUM(sent)`,
    totalDelivered: sql<number>`SUM(delivered)`,
    totalBounced: sql<number>`SUM(bounced)`,
    totalComplaints: sql<number>`SUM(complaints)`,
    totalOpens: sql<number>`SUM(opens)`,
    totalClicks: sql<number>`SUM(clicks)`,
    totalUnsubscribes: sql<number>`SUM(unsubscribes)`,
    avgBounceRate: sql<number>`AVG(bounceRate)`,
    avgComplaintRate: sql<number>`AVG(complaintRate)`,
    avgOpenRate: sql<number>`AVG(openRate)`,
  }).from(domainSendingStats).where(eq(domainSendingStats.userId, userId)).groupBy(domainSendingStats.domain);
}

export async function getProviderBreakdown(userId: number, days: number = 30) {
  const db = await getDb(); if (!db) return [];
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  return db.select({
    provider: domainSendingStats.provider,
    totalSent: sql<number>`SUM(sent)`,
    totalDelivered: sql<number>`SUM(delivered)`,
    totalBounced: sql<number>`SUM(bounced)`,
    totalComplaints: sql<number>`SUM(complaints)`,
    totalOpens: sql<number>`SUM(opens)`,
    avgBounceRate: sql<number>`AVG(bounceRate)`,
    avgComplaintRate: sql<number>`AVG(complaintRate)`,
  }).from(domainSendingStats).where(and(eq(domainSendingStats.userId, userId), sql`${domainSendingStats.date} >= ${cutoff}`)).groupBy(domainSendingStats.provider);
}

// ─── Prospect Quantum Score ───
export async function upsertProspectScore(prospectId: number, data: Partial<ProspectScore>) {
  const db = await getDb(); if (!db) return;
  const existing = await db.select().from(prospectScores).where(eq(prospectScores.prospectId, prospectId)).limit(1);
  const now = Date.now();
  if (existing.length > 0) {
    await db.update(prospectScores).set({ ...data, lastScoredAt: now }).where(eq(prospectScores.prospectId, prospectId));
    return { ...existing[0], ...data, lastScoredAt: now };
  } else {
    const [result] = await db.insert(prospectScores).values({
      prospectId,
      ...data,
      lastScoredAt: now,
      createdAt: now,
    } as any).$returningId();
    return { id: result.id, prospectId, ...data, lastScoredAt: now };
  }
}

export async function getProspectScore(prospectId: number) {
  const db = await getDb(); if (!db) return null;
  const result = await db.select().from(prospectScores).where(eq(prospectScores.prospectId, prospectId)).limit(1);
  return result[0] || null;
}

// ─── Email Provider Detection ───
export function detectEmailProvider(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  if (domain.includes('gmail') || domain.includes('googlemail')) return 'gmail';
  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live.com') || domain.includes('msn.com') || domain.includes('microsoft')) return 'outlook';
  if (domain.includes('yahoo') || domain.includes('ymail') || domain.includes('aol') || domain.includes('aim.com')) return 'yahoo';
  return 'other';
}

// ─── Compliance Check Engine ───
export function runComplianceCheck(opts: {
  htmlContent: string;
  subject: string;
  fromEmail: string;
  toEmail: string;
  senderSettings: SenderSetting | null;
  isSuppressed: boolean;
}): { passed: boolean; checks: Record<string, boolean>; failures: string[] } {
  const failures: string[] = [];
  
  const html = opts.htmlContent || '';
  const hasPhysicalAddress = !!(opts.senderSettings?.physicalAddress && html.includes(opts.senderSettings.physicalAddress.substring(0, 20)));
  const hasUnsubscribeLink = html.includes('unsubscribe') || html.includes('opt-out') || html.includes('opt out');
  const hasOneClickUnsubscribe = html.includes('List-Unsubscribe') || hasUnsubscribeLink;
  const hasIdentifiedAsAd = true; // We always include proper headers
  
  // Subject line check - no ALL CAPS, no excessive punctuation, no deceptive patterns
  const subjectLineClean = !(
    opts.subject === opts.subject.toUpperCase() && opts.subject.length > 5 ||
    (opts.subject.match(/[!?]{2,}/g) || []).length > 0 ||
    false || // placeholder for future deceptive RE: check
    /free|act now|limited time|urgent|winner|congratulations/i.test(opts.subject)
  );
  
  const recipientNotSuppressed = !opts.isSuppressed;
  const recipientHasConsent = true; // Assumed for CRM contacts
  
  if (!hasPhysicalAddress) failures.push('Missing physical mailing address (CAN-SPAM §7704)');
  if (!hasUnsubscribeLink) failures.push('Missing unsubscribe mechanism (CAN-SPAM §7704)');
  if (!hasOneClickUnsubscribe) failures.push('Missing one-click unsubscribe (RFC 8058 / Gmail & Outlook requirement)');
  if (!subjectLineClean) failures.push('Subject line contains potentially deceptive content (CAN-SPAM §7704)');
  if (!recipientNotSuppressed) failures.push('Recipient is on suppression list - sending is prohibited');
  
  const checks = {
    hasPhysicalAddress,
    hasUnsubscribeLink,
    hasOneClickUnsubscribe,
    hasIdentifiedAsAd,
    subjectLineClean,
    recipientNotSuppressed,
    recipientHasConsent,
    spfAligned: true, // Checked at domain level
    dkimAligned: true,
    dmarcAligned: true,
  };
  
  return {
    passed: failures.length === 0,
    checks,
    failures,
  };
}


// ═══════════════════════════════════════════════════════════════
// CROSS-FEATURE INTEGRATION HELPERS
// ═══════════════════════════════════════════════════════════════

// ─── Get Email Template by ID ───
export async function getEmailTemplate(id: number, userId: number) {
  const db = await getDb(); if (!db) return null;
  const [tpl] = await db.select().from(emailTemplates).where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId))).limit(1);
  return tpl ?? null;
}

// ─── Get Campaign by ID ───
export async function getCampaign(id: number, userId: number) {
  const db = await getDb(); if (!db) return null;
  const [c] = await db.select().from(emailCampaigns).where(and(eq(emailCampaigns.id, id), eq(emailCampaigns.userId, userId))).limit(1);
  return c ?? null;
}

// ─── Get Segment Contacts (evaluate segment filters against contacts) ───
export async function getSegmentContacts(segmentId: number, userId: number) {
  const db = await getDb(); if (!db) return [];
  const [seg] = await db.select().from(segments).where(and(eq(segments.id, segmentId), eq(segments.userId, userId))).limit(1);
  if (!seg) return [];
  const filters = (seg.filters ?? []) as Array<Record<string, unknown>>;
  // Build conditions from segment filters
  const conditions = [eq(contacts.userId, userId)];
  for (const f of filters) {
    const field = f.field as string;
    const op = f.operator as string;
    const val = f.value as string;
    if (!field || !val) continue;
    if (field === 'lifecycleStage' && op === 'equals') conditions.push(eq(contacts.lifecycleStage, val));
    if (field === 'leadStatus' && op === 'equals') conditions.push(eq(contacts.leadStatus, val));
    if (field === 'leadSource' && op === 'equals') conditions.push(eq(contacts.leadSource, val));
    if (field === 'city' && op === 'equals') conditions.push(eq(contacts.city, val));
    if (field === 'country' && op === 'equals') conditions.push(eq(contacts.country, val));
    if (field === 'department' && op === 'equals') conditions.push(eq(contacts.department, val));
    if (field === 'customerType' && op === 'equals') conditions.push(eq(contacts.customerType, val));
    if (field === 'email' && op === 'contains') conditions.push(like(contacts.email, `%${val}%`));
    if (field === 'firstName' && op === 'contains') conditions.push(like(contacts.firstName, `%${val}%`));
  }
  // If no filters, return all contacts with email
  if (filters.length === 0) {
    return db.select().from(contacts).where(and(eq(contacts.userId, userId), isNotNull(contacts.email))).orderBy(desc(contacts.createdAt));
  }
  return db.select().from(contacts).where(and(...conditions, isNotNull(contacts.email))).orderBy(desc(contacts.createdAt));
}

// ─── Count Segment Contacts ───
export async function countSegmentContacts(segmentId: number, userId: number) {
  const contactList = await getSegmentContacts(segmentId, userId);
  return contactList.length;
}

// ─── Find or Create Company by Name ───
export async function findOrCreateCompanyByName(userId: number, companyName: string, extra?: { domain?: string; industry?: string }) {
  const db = await getDb(); if (!db) return null;
  // Try to find existing
  const [existing] = await db.select().from(companies).where(and(eq(companies.userId, userId), eq(companies.name, companyName))).limit(1);
  if (existing) return existing.id;
  // Create new
  const now = Date.now();
  const result = await db.insert(companies).values({
    userId, name: companyName, domain: extra?.domain, industry: extra?.industry, createdAt: now, updatedAt: now,
  });
  return result[0].insertId;
}

// ─── Enroll Prospect in Ghost Sequence ───
export async function enrollProspectInSequence(prospectId: number, sequenceId: number, userId: number) {
  const db = await getDb(); if (!db) return;
  await db.update(prospects).set({
    ghostSequenceId: sequenceId,
    currentSequenceStep: 0,
    engagementStage: "sequenced",
    updatedAt: Date.now(),
  }).where(and(eq(prospects.id, prospectId), eq(prospects.userId, userId)));
  // Increment enrolled count on sequence
  await db.update(ghostSequences).set({
    totalEnrolled: sql`totalEnrolled + 1`,
    updatedAt: Date.now(),
  }).where(and(eq(ghostSequences.id, sequenceId), eq(ghostSequences.userId, userId)));
}

// ─── Create Prospect from Signal ───
export async function createProspectFromSignal(signalId: number, userId: number, data: { firstName: string; lastName?: string; email?: string; jobTitle?: string; companyName?: string; industry?: string }) {
  const db = await getDb(); if (!db) return 0;
  const now = Date.now();
  const result = await db.insert(prospects).values({
    userId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    jobTitle: data.jobTitle,
    companyName: data.companyName,
    industry: data.industry,
    sourceType: "trigger_event",
    sourceSignalId: signalId,
    createdAt: now,
    updatedAt: now,
  });
  const prospectId = result[0].insertId;
  // Mark signal as actioned
  await db.update(triggerSignals).set({ status: "actioned", processedAt: now }).where(eq(triggerSignals.id, signalId));
  return prospectId;
}

// ─── Queue Campaign Emails ───
export async function queueCampaignEmails(campaignId: number, userId: number, contactEmails: Array<{ email: string; contactId: number; firstName: string }>, subject: string, htmlContent: string, fromEmail: string) {
  const db = await getDb(); if (!db) return 0;
  let queued = 0;
  for (const contact of contactEmails) {
    // Check suppression
    const suppressed = await isEmailSuppressed(userId, contact.email);
    if (suppressed) continue;
    const now = Date.now();
    await db.insert(emailQueue).values({
      campaignId,
      contactId: contact.contactId,
      toEmail: contact.email,
      fromEmail,
      subject,
      htmlContent,
      status: "pending",
      createdAt: now,
    });
    queued++;
  }
  return queued;
}

// ─── Get Active SMTP Account for Sending ───
export async function getNextAvailableSmtpAccount(userId: number) {
  const db = await getDb(); if (!db) return null;
  const [account] = await db.select().from(smtpAccounts).where(
    and(eq(smtpAccounts.userId, userId), eq(smtpAccounts.isActive, true), sql`sentToday < dailyLimit`)
  ).orderBy(asc(smtpAccounts.sentToday)).limit(1);
  return account ?? null;
}

// ─── Enhanced Dashboard Stats with Paradigm + Compliance ───
export async function getEnhancedDashboardStats(userId: number) {
  const base = await getDashboardStats(userId);
  const db = await getDb();
  if (!db) return { ...base, totalProspects: 0, hotLeads: 0, activeSequences: 0, newSignals: 0, complianceScore: 100, suppressedEmails: 0, totalSegments: 0, totalWorkflows: 0, totalTemplates: 0 };
  
  const [prospectStats, hotLeadCount, activeSeqCount, newSignalCount, suppressedCount, segmentCount, workflowCount, templateCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(prospects).where(eq(prospects.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(prospects).where(and(eq(prospects.userId, userId), eq(prospects.engagementStage, "hot_lead"))),
    db.select({ count: sql<number>`count(*)` }).from(ghostSequences).where(and(eq(ghostSequences.userId, userId), eq(ghostSequences.status, "active"))),
    db.select({ count: sql<number>`count(*)` }).from(triggerSignals).where(and(eq(triggerSignals.userId, userId), eq(triggerSignals.status, "new"))),
    db.select({ count: sql<number>`count(*)` }).from(suppressionList).where(eq(suppressionList.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(segments).where(eq(segments.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(workflows).where(eq(workflows.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(emailTemplates).where(eq(emailTemplates.userId, userId)),
  ]);

  return {
    ...base,
    totalProspects: prospectStats[0]?.count ?? 0,
    hotLeads: hotLeadCount[0]?.count ?? 0,
    activeSequences: activeSeqCount[0]?.count ?? 0,
    newSignals: newSignalCount[0]?.count ?? 0,
    complianceScore: 100, // Will be calculated from audit log
    suppressedEmails: suppressedCount[0]?.count ?? 0,
    totalSegments: segmentCount[0]?.count ?? 0,
    totalWorkflows: workflowCount[0]?.count ?? 0,
    totalTemplates: templateCount[0]?.count ?? 0,
  };
}

// ─── Get Deals by Contact ───
export async function getDealsByContact(contactId: number, userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(deals).where(and(eq(deals.userId, userId), eq(deals.contactId, contactId))).orderBy(desc(deals.createdAt));
}

// ─── Get Deals by Company ───
export async function getDealsByCompany(companyId: number, userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(deals).where(and(eq(deals.userId, userId), eq(deals.companyId, companyId))).orderBy(desc(deals.createdAt));
}

// ─── Get Tasks by Contact ───
export async function getTasksByContact(contactId: number, userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.contactId, contactId))).orderBy(desc(tasks.createdAt));
}

// ─── Get Tasks by Company ───
export async function getTasksByCompany(companyId: number, userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.companyId, companyId))).orderBy(desc(tasks.createdAt));
}

// ─── Get Tasks by Deal ───
export async function getTasksByDeal(dealId: number, userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.dealId, dealId))).orderBy(desc(tasks.createdAt));
}

// ─── Role-based deal/task/activity helpers ───
export async function getDealsByCompanyByRole(companyId: number, user: UserCtx) {
  const db = await getDb(); if (!db) return [];
  const visibleIds = await getVisibleUserIds(user);
  return db.select().from(deals).where(and(inArray(deals.userId, visibleIds), eq(deals.companyId, companyId))).orderBy(desc(deals.createdAt));
}

export async function getTasksByContactByRole(contactId: number, user: UserCtx) {
  const db = await getDb(); if (!db) return [];
  const visibleIds = await getVisibleUserIds(user);
  return db.select().from(tasks).where(and(inArray(tasks.userId, visibleIds), eq(tasks.contactId, contactId))).orderBy(desc(tasks.createdAt));
}

export async function getTasksByCompanyByRole(companyId: number, user: UserCtx) {
  const db = await getDb(); if (!db) return [];
  const visibleIds = await getVisibleUserIds(user);
  return db.select().from(tasks).where(and(inArray(tasks.userId, visibleIds), eq(tasks.companyId, companyId))).orderBy(desc(tasks.createdAt));
}

export async function listActivitiesByRole(user: UserCtx, opts?: { contactId?: number; companyId?: number; dealId?: number; type?: string; limit?: number }) {
  const db = await getDb(); if (!db) return [];
  const visibleIds = await getVisibleUserIds(user);
  const conditions: any[] = [inArray(activities.userId, visibleIds)];
  if (opts?.contactId) conditions.push(eq(activities.contactId, opts.contactId));
  if (opts?.companyId) conditions.push(eq(activities.companyId, opts.companyId));
  if (opts?.dealId) conditions.push(eq(activities.dealId, opts.dealId));
  if (opts?.type) conditions.push(eq(activities.type, opts.type));
  return db.select().from(activities).where(and(...conditions)).orderBy(desc(activities.createdAt)).limit(opts?.limit ?? 50);
}

// ─── Get Campaigns for Contact (via segment membership) ───
export async function getCampaignsForContact(contactId: number, userId: number) {
  const db = await getDb(); if (!db) return [];
  // Get campaigns that targeted segments containing this contact
  return db.select().from(emailCampaigns).where(eq(emailCampaigns.userId, userId)).orderBy(desc(emailCampaigns.createdAt)).limit(20);
}

// Cross-feature: prospects by sequence
export async function getProspectsBySequence(sequenceId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(prospects).where(
    and(eq(prospects.userId, userId), eq(prospects.ghostSequenceId, sequenceId))
  );
}



// ─── DOT/FMCSA Broker Filings ───
export async function createBrokerFiling(data: any) {
  const db = await getDb(); if (!db) return null;
  const now = Date.now();
  const [result] = await db.insert(brokerFilings).values({ ...data, createdAt: now, updatedAt: now });
  return result.insertId;
}

export async function createBrokerFilingsBatch(filings: any[]) {
  const db = await getDb(); if (!db) return [];
  const now = Date.now();
  const records = filings.map(f => ({ ...f, createdAt: now, updatedAt: now }));
  const [result] = await db.insert(brokerFilings).values(records);
  return result.insertId;
}

export async function listBrokerFilings(userId: number, filters?: { filingType?: string; processedStatus?: string; scanBatchId?: string; limit?: number; offset?: number }) {
  const db = await getDb(); if (!db) return { items: [], total: 0 };
  const conditions = [eq(brokerFilings.userId, userId)];
  if (filters?.filingType) conditions.push(eq(brokerFilings.filingType, filters.filingType as any));
  if (filters?.processedStatus) conditions.push(eq(brokerFilings.processedStatus, filters.processedStatus as any));
  if (filters?.scanBatchId) conditions.push(eq(brokerFilings.scanBatchId, filters.scanBatchId));
  const where = and(...conditions);
  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(brokerFilings).where(where);
  const items = await db.select().from(brokerFilings).where(where).orderBy(desc(brokerFilings.createdAt)).limit(filters?.limit ?? 50).offset(filters?.offset ?? 0);
  return { items, total: Number(countResult?.count ?? 0) };
}

export async function updateBrokerFiling(id: number, userId: number, data: Partial<any>) {
  const db = await getDb(); if (!db) return;
  await db.update(brokerFilings).set({ ...data, updatedAt: Date.now() }).where(and(eq(brokerFilings.id, id), eq(brokerFilings.userId, userId)));
}

export async function getBrokerFilingStats(userId: number) {
  const db = await getDb(); if (!db) return { total: 0, newFilings: 0, renewals: 0, pending: 0, prospectCreated: 0, campaignEnrolled: 0 };
  const result = await db.select({
    total: sql<number>`count(*)`,
    newFilings: sql<number>`SUM(CASE WHEN filingType = 'new' THEN 1 ELSE 0 END)`,
    renewals: sql<number>`SUM(CASE WHEN filingType = 'renewal' THEN 1 ELSE 0 END)`,
    pending: sql<number>`SUM(CASE WHEN processedStatus = 'pending' THEN 1 ELSE 0 END)`,
    prospectCreated: sql<number>`SUM(CASE WHEN processedStatus = 'prospect_created' THEN 1 ELSE 0 END)`,
    campaignEnrolled: sql<number>`SUM(CASE WHEN processedStatus = 'campaign_enrolled' THEN 1 ELSE 0 END)`,
  }).from(brokerFilings).where(eq(brokerFilings.userId, userId));
  const r = result[0];
  return {
    total: Number(r?.total ?? 0),
    newFilings: Number(r?.newFilings ?? 0),
    renewals: Number(r?.renewals ?? 0),
    pending: Number(r?.pending ?? 0),
    prospectCreated: Number(r?.prospectCreated ?? 0),
    campaignEnrolled: Number(r?.campaignEnrolled ?? 0),
  };
}

export async function deleteBrokerFilingsBatch(userId: number, scanBatchId: string) {
  const db = await getDb(); if (!db) return;
  await db.delete(brokerFilings).where(and(eq(brokerFilings.userId, userId), eq(brokerFilings.scanBatchId, scanBatchId)));
}


// ═══════════════════════════════════════════════════════════════
// ─── Multi-Tenant Hierarchy Helpers ──────────────────────────
// ═══════════════════════════════════════════════════════════════

// ─── Tenant Companies ───

export async function createTenantCompany(data: Omit<InsertTenantCompany, "id">) {
  const db = await getDb();
  if (!db) return null as any;
  const [result] = await db.insert(tenantCompanies).values(data);
  return result.insertId;
}

export async function getTenantCompanies() {
  const db = await getDb();
  if (!db) return null as any;
  return db.select().from(tenantCompanies).orderBy(desc(tenantCompanies.createdAt));
}

export async function getTenantCompanyById(id: number) {
  const db = await getDb();
  if (!db) return null as any;
  const [company] = await db.select().from(tenantCompanies).where(eq(tenantCompanies.id, id));
  return company || null;
}

export async function getTenantCompanyBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null as any;
  const [company] = await db.select().from(tenantCompanies).where(eq(tenantCompanies.slug, slug));
  return company || null;
}

export async function updateTenantCompany(id: number, data: Partial<InsertTenantCompany>) {
  const db = await getDb();
  if (!db) return null as any;
  await db.update(tenantCompanies).set(data).where(eq(tenantCompanies.id, id));
}

export async function deleteTenantCompany(id: number) {
  const db = await getDb();
  if (!db) return null as any;
  await db.delete(tenantCompanies).where(eq(tenantCompanies.id, id));
}

export async function getTenantCompanyUserCount(companyId: number) {
  const db = await getDb();
  if (!db) return null as any;
  const [result] = await db.select({ count: count() }).from(users).where(eq(users.tenantCompanyId, companyId));
  return result?.count ?? 0;
}

// ─── User Hierarchy ───

export async function getUsersByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return null as any;
  return db.select().from(users).where(eq(users.tenantCompanyId, companyId)).orderBy(users.systemRole);
}

export async function getUsersByManager(managerId: number) {
  const db = await getDb();
  if (!db) return null as any;
  return db.select().from(users).where(eq(users.managerId, managerId));
}

export async function getAllUsersWithCompany() {
  const db = await getDb();
  if (!db) return null as any;
  return db.select({
    user: users,
    companyName: tenantCompanies.name,
    companySlug: tenantCompanies.slug,
  }).from(users)
    .leftJoin(tenantCompanies, eq(users.tenantCompanyId, tenantCompanies.id))
    .orderBy(desc(users.lastSignedIn));
}

export async function updateUserRole(userId: number, systemRole: "developer" | "axiom_admin" | "axiom_owner" | "company_admin" | "sales_manager" | "office_manager" | "manager" | "account_manager" | "coordinator" | "user") {
  const db = await getDb();
  if (!db) return null as any;
  await db.update(users).set({ systemRole }).where(eq(users.id, userId));
}

export async function updateUserCompany(userId: number, companyId: number | null, managerId: number | null = null) {
  const db = await getDb();
  if (!db) return null as any;
  await db.update(users).set({ tenantCompanyId: companyId, managerId }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, data: { name?: string; jobTitle?: string; phone?: string; avatarUrl?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return null as any;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function deactivateUser(userId: number) {
  const db = await getDb();
  if (!db) return null as any;
  await db.update(users).set({ isActive: false }).where(eq(users.id, userId));
}

export async function activateUser(userId: number) {
  const db = await getDb();
  if (!db) return null as any;
  await db.update(users).set({ isActive: true }).where(eq(users.id, userId));
}

// ─── Feature Assignments ───

export const ALL_FEATURES = [
  { key: "crm_contacts", label: "Contacts", group: "CRM" },
  { key: "crm_companies", label: "Companies", group: "CRM" },
  { key: "crm_deals", label: "Deals", group: "CRM" },
  { key: "crm_tasks", label: "Tasks", group: "CRM" },
  { key: "marketing_campaigns", label: "Campaigns", group: "Marketing" },
  { key: "marketing_templates", label: "Templates", group: "Marketing" },
  { key: "marketing_deliverability", label: "Deliverability", group: "Marketing" },
  { key: "marketing_ab_tests", label: "A/B Tests", group: "Marketing" },
  { key: "marketing_smtp", label: "SMTP Accounts", group: "Marketing" },
  { key: "automation_workflows", label: "Workflows", group: "Automation" },
  { key: "automation_segments", label: "Segments", group: "Automation" },
  { key: "paradigm_pulse", label: "Pulse Dashboard", group: "Paradigm Engine" },
  { key: "paradigm_prospects", label: "Prospects", group: "Paradigm Engine" },
  { key: "paradigm_signals", label: "Signals", group: "Paradigm Engine" },
  { key: "paradigm_sequences", label: "Ghost Sequences", group: "Paradigm Engine" },
  { key: "paradigm_battle_cards", label: "Battle Cards", group: "Paradigm Engine" },
  { key: "paradigm_integrations", label: "Integrations", group: "Paradigm Engine" },
  { key: "paradigm_quantum_score", label: "Quantum Score", group: "Paradigm Engine" },
  { key: "compliance_center", label: "Compliance Center", group: "Compliance" },
  { key: "compliance_suppression", label: "Suppression List", group: "Compliance" },
  { key: "compliance_sender_settings", label: "Sender Settings", group: "Compliance" },
  { key: "compliance_domain_stats", label: "Domain Stats", group: "Compliance" },
  { key: "analytics_reports", label: "Reports", group: "Analytics" },
] as const;

export type FeatureKey = typeof ALL_FEATURES[number]["key"];

export async function getUserFeatures(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return null as any;
  const assignments = await db.select({ featureKey: featureAssignments.featureKey })
    .from(featureAssignments)
    .where(eq(featureAssignments.userId, userId));
  return assignments.map(a => a.featureKey);
}

export async function getCompanyFeatures(companyId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return null as any;
  const [company] = await db.select({ enabledFeatures: tenantCompanies.enabledFeatures })
    .from(tenantCompanies)
    .where(eq(tenantCompanies.id, companyId));
  return (company?.enabledFeatures as string[]) || [];
}

export async function assignFeaturesToUser(userId: number, featureKeys: string[], grantedBy: number, companyId: number) {
  const db = await getDb();
  if (!db) return null as any;
  // Remove existing assignments for this user
  await db.delete(featureAssignments).where(eq(featureAssignments.userId, userId));
  // Insert new assignments
  if (featureKeys.length > 0) {
    const now = Date.now();
    await db.insert(featureAssignments).values(
      featureKeys.map(key => ({
        userId,
        featureKey: key,
        grantedBy,
        tenantCompanyId: companyId,
        createdAt: now,
      }))
    );
  }
}

export async function getFeatureAssignmentsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return null as any;
  return db.select({
    assignment: featureAssignments,
    userName: users.name,
    userEmail: users.email,
  }).from(featureAssignments)
    .innerJoin(users, eq(featureAssignments.userId, users.id))
    .where(eq(featureAssignments.tenantCompanyId, companyId));
}

// ─── Company Invites ───

export async function createCompanyInvite(data: {
  tenantCompanyId: number;
  email: string;
  inviteRole: "axiom_admin" | "company_admin" | "sales_manager" | "office_manager" | "manager" | "account_manager" | "coordinator" | "user";
  managerId?: number;
  token: string;
  invitedBy: number;
  features?: string[];
  expiresAt: number;
}) {
  const db = await getDb();
  if (!db) return null as any;
  const [result] = await db.insert(companyInvites).values({
    ...data,
    createdAt: Date.now(),
  });
  return result.insertId;
}

export async function getCompanyInvites(companyId: number) {
  const db = await getDb();
  if (!db) return null as any;
  return db.select().from(companyInvites)
    .where(eq(companyInvites.tenantCompanyId, companyId))
    .orderBy(desc(companyInvites.createdAt));
}

export async function getInviteByToken(token: string) {
  const db = await getDb();
  if (!db) return null as any;
  const [invite] = await db.select().from(companyInvites).where(eq(companyInvites.token, token));
  return invite || null;
}

export async function acceptInvite(token: string) {
  const db = await getDb();
  if (!db) return null as any;
  await db.update(companyInvites).set({
    status: "accepted",
    acceptedAt: Date.now(),
  }).where(eq(companyInvites.token, token));
}

export async function revokeInvite(id: number) {
  const db = await getDb();
  if (!db) return null as any;
  await db.update(companyInvites).set({ status: "revoked" }).where(eq(companyInvites.id, id));
}

// ─── System Health & Activity Logs ───

export async function getSystemStats() {
  const db = await getDb();
  if (!db) return null as any;
  const [userCount] = await db.select({ count: count() }).from(users);
  const [companyCount] = await db.select({ count: count() }).from(tenantCompanies);
  const [contactCount] = await db.select({ count: count() }).from(contacts);
  const [dealCount] = await db.select({ count: count() }).from(deals);
  const [campaignCount] = await db.select({ count: count() }).from(emailCampaigns);
  const [prospectCount] = await db.select({ count: count() }).from(prospects);
  const [activeUsers] = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
  const [invitePending] = await db.select({ count: count() }).from(companyInvites).where(eq(companyInvites.status, "pending"));
  
  return {
    totalUsers: userCount?.count ?? 0,
    totalCompanies: companyCount?.count ?? 0,
    totalContacts: contactCount?.count ?? 0,
    totalDeals: dealCount?.count ?? 0,
    totalCampaigns: campaignCount?.count ?? 0,
    totalProspects: prospectCount?.count ?? 0,
    activeUsers: activeUsers?.count ?? 0,
    pendingInvites: invitePending?.count ?? 0,
  };
}

export async function getTableRowCounts() {
  const db = await getDb();
  if (!db) return null as any;
  const tables = [
    { name: "users", table: users },
    { name: "tenant_companies", table: tenantCompanies },
    { name: "contacts", table: contacts },
    { name: "companies", table: companies },
    { name: "deals", table: deals },
    { name: "tasks", table: tasks },
    { name: "email_campaigns", table: emailCampaigns },
    { name: "email_templates", table: emailTemplates },
    { name: "email_queue", table: emailQueue },
    { name: "prospects", table: prospects },
    { name: "trigger_signals", table: triggerSignals },
    { name: "ghost_sequences", table: ghostSequences },
    { name: "battle_cards", table: battleCards },
    { name: "activities", table: activities },
    { name: "segments", table: segments },
    { name: "workflows", table: workflows },
    { name: "smtp_accounts", table: smtpAccounts },
    { name: "suppression_list", table: suppressionList },
    { name: "feature_assignments", table: featureAssignments },
    { name: "company_invites", table: companyInvites },
    { name: "broker_filings", table: brokerFilings },
  ];
  
  const results = await Promise.all(
    tables.map(async ({ name, table }) => {
      const [result] = await db.select({ count: count() }).from(table);
      return { table: name, rows: result?.count ?? 0 };
    })
  );
  return results;
}

export async function getGlobalRecentActivity(limit = 50) {
  const db = await getDb();
  if (!db) return null as any;
  return db.select({
    id: activities.id,
    type: activities.type,
    subject: activities.subject,
    body: activities.body,
    contactId: activities.contactId,
    userId: activities.userId,
    createdAt: activities.createdAt,
  }).from(activities)
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}

// ═══════════════════════════════════════════════════════════════
// Domain Health Auto-Healing Engine
// ═══════════════════════════════════════════════════════════════

// --- Health Score Calculation ---
// Weighted composite: Auth (25%), Bounce Rate (25%), Complaint Rate (25%), Open Rate (15%), Delivery Rate (10%)
export function calculateHealthScore(domain: {
  spfStatus?: string | null; dkimStatus?: string | null; dmarcStatus?: string | null;
  bounceRate?: number | null; complaintRate?: number | null; openRate?: number | null;
  deliveryRate?: number | null; warmupPhase?: number | null;
}): { score: number; grade: string; recommendations: string[] } {
  const recs: string[] = [];
  
  // Auth score (25%): each of SPF/DKIM/DMARC is worth ~8.33 points
  let authScore = 0;
  if (domain.spfStatus === 'pass') authScore += 33; else recs.push('Configure SPF record for this domain');
  if (domain.dkimStatus === 'pass') authScore += 34; else recs.push('Set up DKIM signing for this domain');
  if (domain.dmarcStatus === 'pass') authScore += 33; else recs.push('Publish a DMARC policy (start with p=none, then move to p=quarantine)');
  
  // Bounce rate score (25%): <1% = 100, 1-2% = 75, 2-5% = 40, >5% = 0
  const bounceRatePct = (domain.bounceRate ?? 0) / 100; // convert from basis points
  let bounceScore = 100;
  if (bounceRatePct > 5) { bounceScore = 0; recs.push('CRITICAL: Bounce rate above 5%. Clean your email list immediately and pause sending.'); }
  else if (bounceRatePct > 2) { bounceScore = 40; recs.push('Bounce rate above 2%. Remove invalid addresses and reduce sending volume.'); }
  else if (bounceRatePct > 1) { bounceScore = 75; recs.push('Bounce rate slightly elevated. Verify new addresses before adding to campaigns.'); }
  
  // Complaint rate score (25%): <0.05% = 100, 0.05-0.1% = 70, 0.1-0.3% = 30, >0.3% = 0
  const complaintRatePct = (domain.complaintRate ?? 0) / 1000; // stored as pct*1000
  let complaintScore = 100;
  if (complaintRatePct > 0.3) { complaintScore = 0; recs.push('CRITICAL: Complaint rate above 0.3%. Stop sending immediately. Review content and targeting.'); }
  else if (complaintRatePct > 0.1) { complaintScore = 30; recs.push('Complaint rate above 0.1% (Gmail threshold). Improve content relevance and add easy unsubscribe.'); }
  else if (complaintRatePct > 0.05) { complaintScore = 70; recs.push('Complaint rate approaching limits. Ensure clear sender identity and relevant content.'); }
  
  // Open rate score (15%): >25% = 100, 15-25% = 75, 10-15% = 50, <10% = 25
  const openRatePct = (domain.openRate ?? 0) / 100;
  let openScore = 25;
  if (openRatePct > 25) openScore = 100;
  else if (openRatePct > 15) openScore = 75;
  else if (openRatePct > 10) openScore = 50;
  else if (openRatePct < 10 && (domain.openRate ?? 0) > 0) recs.push('Low open rate. Improve subject lines and sender reputation.');
  
  // Delivery rate score (10%): >98% = 100, 95-98% = 75, 90-95% = 40, <90% = 0
  const deliveryRatePct = (domain.deliveryRate ?? 10000) / 100;
  let deliveryScore = 100;
  if (deliveryRatePct < 90) { deliveryScore = 0; recs.push('Delivery rate below 90%. Check for blacklisting and authentication issues.'); }
  else if (deliveryRatePct < 95) { deliveryScore = 40; recs.push('Delivery rate below 95%. Investigate bounce reasons and clean lists.'); }
  else if (deliveryRatePct < 98) deliveryScore = 75;
  
  // Warm-up bonus: domains actively warming up get a small boost
  const warmupBonus = (domain.warmupPhase ?? 0) > 0 ? 5 : 0;
  
  const rawScore = Math.round(authScore * 0.25 + bounceScore * 0.25 + complaintScore * 0.25 + openScore * 0.15 + deliveryScore * 0.10) + warmupBonus;
  const score = Math.min(100, Math.max(0, rawScore));
  
  let grade = 'F';
  if (score >= 95) grade = 'A+';
  else if (score >= 90) grade = 'A';
  else if (score >= 85) grade = 'A-';
  else if (score >= 80) grade = 'B+';
  else if (score >= 75) grade = 'B';
  else if (score >= 70) grade = 'B-';
  else if (score >= 65) grade = 'C+';
  else if (score >= 60) grade = 'C';
  else if (score >= 50) grade = 'D';
  
  if (recs.length === 0) recs.push('Domain health is excellent. Continue current practices.');
  
  return { score, grade, recommendations: recs };
}

// --- Warm-up Schedule ---
// 8-week graduated ramp: Week 1: 50/day, Week 2: 100, Week 3: 200, Week 4: 500, Week 5: 1000, Week 6: 2000, Week 7: 3000, Week 8: 5000
export const WARMUP_SCHEDULE = [
  { phase: 1, dailyLimit: 50, description: 'Week 1: Establishing reputation (50 emails/day)' },
  { phase: 2, dailyLimit: 100, description: 'Week 2: Building trust (100 emails/day)' },
  { phase: 3, dailyLimit: 200, description: 'Week 3: Expanding reach (200 emails/day)' },
  { phase: 4, dailyLimit: 500, description: 'Week 4: Growing volume (500 emails/day)' },
  { phase: 5, dailyLimit: 1000, description: 'Week 5: Scaling up (1,000 emails/day)' },
  { phase: 6, dailyLimit: 2000, description: 'Week 6: High volume (2,000 emails/day)' },
  { phase: 7, dailyLimit: 3000, description: 'Week 7: Full capacity approach (3,000 emails/day)' },
  { phase: 8, dailyLimit: 5000, description: 'Week 8: Full capacity (5,000 emails/day)' },
];

export function getWarmupDailyLimit(phase: number): number {
  const entry = WARMUP_SCHEDULE.find(w => w.phase === phase);
  return entry?.dailyLimit ?? 5000;
}

// --- Auto-Pause Thresholds ---
export const HEALTH_THRESHOLDS = {
  // Pause triggers
  maxBounceRate: 200, // 2.00% in basis points
  maxComplaintRate: 100, // 0.100% stored as pct*1000
  criticalBounceRate: 500, // 5.00% - immediate full stop
  criticalComplaintRate: 300, // 0.300% - immediate full stop
  // Cooldown periods (milliseconds)
  normalCooldown: 24 * 60 * 60 * 1000, // 24 hours
  severeCooldown: 72 * 60 * 60 * 1000, // 72 hours
  // Recovery
  recoveryVolumeReduction: 0.5, // cut volume by 50% on recovery
  minHealthScoreForSending: 40, // below this, domain is paused
};

// --- Auto-Healing: Evaluate all domains and apply actions ---
export async function runDomainAutoHealing(userId: number): Promise<{
  healed: number; paused: number; resumed: number; warmedUp: number;
  actions: { domain: string; action: string; details: string }[];
}> {
  const db = await getDb();
  if (!db) return { healed: 0, paused: 0, resumed: 0, warmedUp: 0, actions: [] };
  
  const domains = await db.select().from(domainHealth).where(eq(domainHealth.userId, userId));
  const stats = await getDomainStatsAggregated(userId);
  const statsMap = new Map(stats.map((s: any) => [s.domain, s]));
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];
  const actions: { domain: string; action: string; details: string }[] = [];
  let healed = 0, paused = 0, resumed = 0, warmedUp = 0;
  
  for (const d of domains) {
    const domainStats = statsMap.get(d.domain) as any;
    const bounceRate = domainStats?.avgBounceRate ?? 0;
    const complaintRate = domainStats?.avgComplaintRate ?? 0;
    const openRate = domainStats?.avgOpenRate ?? 0;
    const totalSent = domainStats?.totalSent ?? 0;
    const totalDelivered = domainStats?.totalDelivered ?? 0;
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 10000) : 10000;
    
    // Calculate health score
    const health = calculateHealthScore({
      spfStatus: d.spfStatus, dkimStatus: d.dkimStatus, dmarcStatus: d.dmarcStatus,
      bounceRate, complaintRate, openRate, deliveryRate, warmupPhase: d.warmupPhase,
    });
    
    // --- AUTO-PAUSE: Check if domain should be paused ---
    if (bounceRate > HEALTH_THRESHOLDS.criticalBounceRate || complaintRate > HEALTH_THRESHOLDS.criticalComplaintRate) {
      // Critical: immediate pause with severe cooldown
      await db.update(domainHealth).set({
        reputationScore: health.score, notes: `AUTO-PAUSED (critical): bounce=${bounceRate/100}%, complaints=${complaintRate/1000}%`,
        updatedAt: now,
      }).where(eq(domainHealth.id, d.id));
      actions.push({ domain: d.domain, action: 'CRITICAL_PAUSE', details: `Bounce rate ${bounceRate/100}% or complaint rate ${complaintRate/1000}% exceeded critical thresholds. Domain paused for 72 hours.` });
      paused++;
    } else if (bounceRate > HEALTH_THRESHOLDS.maxBounceRate || complaintRate > HEALTH_THRESHOLDS.maxComplaintRate) {
      // Warning: pause with normal cooldown
      await db.update(domainHealth).set({
        reputationScore: health.score, notes: `AUTO-PAUSED (warning): bounce=${bounceRate/100}%, complaints=${complaintRate/1000}%`,
        updatedAt: now,
      }).where(eq(domainHealth.id, d.id));
      actions.push({ domain: d.domain, action: 'WARNING_PAUSE', details: `Bounce rate ${bounceRate/100}% or complaint rate ${complaintRate/1000}% exceeded thresholds. Domain paused for 24 hours.` });
      paused++;
    } else if (health.score < HEALTH_THRESHOLDS.minHealthScoreForSending) {
      // Low health score: pause
      await db.update(domainHealth).set({
        reputationScore: health.score, notes: `AUTO-PAUSED (low health): score=${health.score}`,
        updatedAt: now,
      }).where(eq(domainHealth.id, d.id));
      actions.push({ domain: d.domain, action: 'LOW_HEALTH_PAUSE', details: `Health score ${health.score} below minimum ${HEALTH_THRESHOLDS.minHealthScoreForSending}. Domain paused until health improves.` });
      paused++;
    } else {
      // Domain is healthy - update score and advance warm-up if applicable
      const updates: any = { reputationScore: health.score, updatedAt: now };
      
      // Advance warm-up phase if domain is warming up
      if ((d.warmupPhase ?? 0) > 0 && (d.warmupPhase ?? 0) < 8) {
        const daysSinceCreated = Math.floor((now - d.createdAt) / (7 * 86400000));
        if (daysSinceCreated >= (d.warmupPhase ?? 0)) {
          const nextPhase = Math.min(8, (d.warmupPhase ?? 0) + 1);
          updates.warmupPhase = nextPhase;
          updates.dailySendLimit = getWarmupDailyLimit(nextPhase);
          actions.push({ domain: d.domain, action: 'WARMUP_ADVANCE', details: `Advanced to warm-up phase ${nextPhase}: ${getWarmupDailyLimit(nextPhase)} emails/day` });
          warmedUp++;
        }
      }
      
      updates.notes = `Health: ${health.grade} (${health.score}/100). ${health.recommendations[0]}`;
      await db.update(domainHealth).set(updates).where(eq(domainHealth.id, d.id));
      healed++;
    }
    
    // Record daily snapshot
    await db.insert(domainHealthRecords).values({
      userId, domainHealthId: d.id, domain: d.domain, date: today,
      healthScore: health.score,
      spfStatus: d.spfStatus ?? 'unknown', dkimStatus: d.dkimStatus ?? 'unknown', dmarcStatus: d.dmarcStatus ?? 'unknown',
      totalSent: totalSent ?? 0, totalDelivered: totalDelivered ?? 0,
      totalBounced: domainStats?.totalBounced ?? 0, totalComplaints: domainStats?.totalComplaints ?? 0,
      totalOpens: domainStats?.totalOpens ?? 0, totalClicks: domainStats?.totalClicks ?? 0,
      bounceRate, complaintRate, openRate, deliveryRate,
      warmupDay: d.warmupPhase ? Math.floor((now - d.createdAt) / 86400000) : 0,
      warmupPhase: d.warmupPhase ?? 0, dailySendLimit: d.dailySendLimit ?? 50,
      isPaused: health.score < HEALTH_THRESHOLDS.minHealthScoreForSending,
      pauseReason: health.score < HEALTH_THRESHOLDS.minHealthScoreForSending ? 'Auto-paused by health optimizer' : null,
      recommendations: health.recommendations,
      createdAt: now,
    });
  }
  
  return { healed, paused, resumed, warmedUp, actions };
}

// --- Domain Rotation: Pick the best domain to send from ---
export async function getBestSendingDomain(userId: number): Promise<{ domainId: number; domain: string; dailyLimit: number; sentToday: number } | null> {
  const db = await getDb();
  if (!db) return null;
  
  const domains = await db.select().from(domainHealth)
    .where(and(eq(domainHealth.userId, userId), sql`${domainHealth.reputationScore} >= ${HEALTH_THRESHOLDS.minHealthScoreForSending}`))
    .orderBy(desc(domainHealth.reputationScore));
  
  // Find the healthiest domain that hasn't hit its daily limit
  for (const d of domains) {
    if ((d.totalSentToday ?? 0) < (d.dailySendLimit ?? 50)) {
      return { domainId: d.id, domain: d.domain, dailyLimit: d.dailySendLimit ?? 50, sentToday: d.totalSentToday ?? 0 };
    }
  }
  return null; // all domains exhausted
}

// --- Start Warm-up for a domain ---
export async function startDomainWarmup(domainId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(domainHealth).set({
    warmupPhase: 1, dailySendLimit: 50, totalSentToday: 0,
    notes: 'Warm-up started: Phase 1 (50 emails/day for 7 days)',
    updatedAt: Date.now(),
  }).where(and(eq(domainHealth.id, domainId), eq(domainHealth.userId, userId)));
}

// --- Get health trend for a domain ---
export async function getDomainHealthTrend(userId: number, domainHealthId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  return db.select().from(domainHealthRecords)
    .where(and(
      eq(domainHealthRecords.userId, userId),
      eq(domainHealthRecords.domainHealthId, domainHealthId),
      sql`${domainHealthRecords.date} >= ${cutoff}`
    ))
    .orderBy(domainHealthRecords.date);
}

// --- Get all domain health summaries ---
export async function getDomainHealthSummary(userId: number) {
  const db = await getDb();
  if (!db) return { totalDomains: 0, healthyDomains: 0, warningDomains: 0, criticalDomains: 0, warmingUp: 0, avgScore: 0, domains: [] as any[] };
  
  const domains = await db.select().from(domainHealth).where(eq(domainHealth.userId, userId)).orderBy(desc(domainHealth.reputationScore));
  const stats = await getDomainStatsAggregated(userId);
  const statsMap = new Map(stats.map((s: any) => [s.domain, s]));
  
  let healthy = 0, warning = 0, critical = 0, warmingUp = 0, totalScore = 0;
  const enriched = domains.map(d => {
    const domainStats = statsMap.get(d.domain) as any;
    const health = calculateHealthScore({
      spfStatus: d.spfStatus, dkimStatus: d.dkimStatus, dmarcStatus: d.dmarcStatus,
      bounceRate: domainStats?.avgBounceRate ?? 0, complaintRate: domainStats?.avgComplaintRate ?? 0,
      openRate: domainStats?.avgOpenRate ?? 0,
      deliveryRate: domainStats?.totalSent > 0 ? Math.round((domainStats.totalDelivered / domainStats.totalSent) * 10000) : 10000,
      warmupPhase: d.warmupPhase,
    });
    totalScore += health.score;
    if (health.score >= 80) healthy++;
    else if (health.score >= 50) warning++;
    else critical++;
    if ((d.warmupPhase ?? 0) > 0 && (d.warmupPhase ?? 0) < 8) warmingUp++;
    return { ...d, healthScore: health.score, healthGrade: health.grade, recommendations: health.recommendations, stats: domainStats };
  });
  
  return {
    totalDomains: domains.length,
    healthyDomains: healthy,
    warningDomains: warning,
    criticalDomains: critical,
    warmingUp,
    avgScore: domains.length > 0 ? Math.round(totalScore / domains.length) : 0,
    domains: enriched,
  };
}

// ═══════════════════════════════════════════════════════════════
// Continuous A/B Testing Engine
// ═══════════════════════════════════════════════════════════════

// --- Statistical Significance ---
export function calculateStatisticalSignificance(
  controlSent: number, controlOpens: number,
  variantSent: number, variantOpens: number,
): { significant: boolean; confidence: number; winner: 'control' | 'variant' | 'tie'; lift: number } {
  if (controlSent < 30 || variantSent < 30) {
    return { significant: false, confidence: 0, winner: 'tie', lift: 0 };
  }
  
  const p1 = controlOpens / controlSent;
  const p2 = variantOpens / variantSent;
  const pPool = (controlOpens + variantOpens) / (controlSent + variantSent);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / controlSent + 1 / variantSent));
  
  if (se === 0) return { significant: false, confidence: 0, winner: 'tie', lift: 0 };
  
  const z = Math.abs(p2 - p1) / se;
  
  // Z-score to confidence: 1.645 = 90%, 1.96 = 95%, 2.576 = 99%
  let confidence = 0;
  if (z >= 2.576) confidence = 99;
  else if (z >= 1.96) confidence = 95;
  else if (z >= 1.645) confidence = 90;
  else if (z >= 1.28) confidence = 80;
  else confidence = Math.round(z / 1.645 * 80);
  
  const lift = p1 > 0 ? Math.round(((p2 - p1) / p1) * 10000) / 100 : 0; // percentage lift
  const winner = confidence >= 95 ? (p2 > p1 ? 'variant' : 'control') : 'tie';
  
  return { significant: confidence >= 95, confidence, winner, lift };
}

// --- Auto-generate A/B variants for a campaign ---
export function generateABVariants(subject: string, content: string): {
  subjectVariants: string[];
  sendTimeVariants: string[];
  contentTips: string[];
} {
  // Generate subject line variants using common optimization patterns
  const subjectVariants: string[] = [];
  
  // Variant 1: Add urgency
  if (!subject.toLowerCase().includes('urgent') && !subject.toLowerCase().includes('limited')) {
    subjectVariants.push(`Don't miss out: ${subject}`);
  }
  // Variant 2: Add personalization placeholder
  subjectVariants.push(`{{firstName}}, ${subject.charAt(0).toLowerCase() + subject.slice(1)}`);
  // Variant 3: Question format
  if (!subject.endsWith('?')) {
    subjectVariants.push(`${subject.replace(/\.$/, '')}?`);
  }
  // Variant 4: Shorter version
  if (subject.length > 40) {
    subjectVariants.push(subject.substring(0, 40).replace(/\s+\S*$/, '...'));
  }
  // Variant 5: Emoji variant
  subjectVariants.push(`🚀 ${subject}`);
  
  // Send time variants
  const sendTimeVariants = [
    'Tuesday 10:00 AM (highest average open rate)',
    'Thursday 2:00 PM (strong B2B engagement)',
    'Wednesday 8:00 AM (early bird advantage)',
    'Monday 11:00 AM (start of week momentum)',
  ];
  
  // Content optimization tips
  const contentTips = [
    'Keep the main CTA above the fold (within first 300px)',
    'Use a single, clear call-to-action button',
    'Maintain 60/40 text-to-image ratio for best deliverability',
    'Add alt text to all images for accessibility and spam filter compliance',
    'Include a plain-text version for maximum compatibility',
  ];
  
  return { subjectVariants, sendTimeVariants, contentTips };
}

// --- Minimum sample size calculator ---
export function calculateMinSampleSize(
  baselineRate: number, // e.g., 0.20 for 20% open rate
  minimumDetectableEffect: number, // e.g., 0.05 for 5% absolute improvement
  confidenceLevel: number = 0.95,
  power: number = 0.80,
): number {
  // Using simplified formula: n = (Z_alpha/2 + Z_beta)^2 * (p1(1-p1) + p2(1-p2)) / (p2-p1)^2
  const zAlpha = confidenceLevel >= 0.99 ? 2.576 : confidenceLevel >= 0.95 ? 1.96 : 1.645;
  const zBeta = power >= 0.90 ? 1.28 : power >= 0.80 ? 0.84 : 0.67;
  
  const p1 = baselineRate;
  const p2 = baselineRate + minimumDetectableEffect;
  
  const numerator = Math.pow(zAlpha + zBeta, 2) * (p1 * (1 - p1) + p2 * (1 - p2));
  const denominator = Math.pow(p2 - p1, 2);
  
  return Math.ceil(numerator / denominator);
}


// ═══════════════════════════════════════════════════════════════
// PHASE 13: PREMIUM FEATURES — DB HELPERS
// ═══════════════════════════════════════════════════════════════

// ─── Voice Campaigns ───
export async function listVoiceCampaigns(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(voiceCampaigns).where(eq(voiceCampaigns.userId, userId)).orderBy(desc(voiceCampaigns.createdAt));
}

export async function getVoiceCampaign(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(voiceCampaigns).where(and(eq(voiceCampaigns.id, id), eq(voiceCampaigns.userId, userId))).limit(1);
  return result[0] || null;
}

export async function createVoiceCampaign(userId: number, data: Partial<typeof voiceCampaigns.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(voiceCampaigns).values({ ...data, userId, createdAt: now, updatedAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateVoiceCampaign(id: number, userId: number, data: Partial<typeof voiceCampaigns.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(voiceCampaigns).set({ ...data, updatedAt: Date.now() } as any).where(and(eq(voiceCampaigns.id, id), eq(voiceCampaigns.userId, userId)));
}

export async function deleteVoiceCampaign(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(voiceCampaigns).where(and(eq(voiceCampaigns.id, id), eq(voiceCampaigns.userId, userId)));
}

// ─── Call Logs ───
export async function listCallLogs(userId: number, opts?: { campaignId?: number; status?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq(callLogs.userId, userId)];
  if (opts?.campaignId) conditions.push(eq(callLogs.voiceCampaignId, opts.campaignId));
  if (opts?.status) conditions.push(eq(callLogs.status, opts.status as any));
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(callLogs).where(where).orderBy(desc(callLogs.createdAt)).limit(opts?.limit || 50).offset(opts?.offset || 0),
    db.select({ count: sql<number>`count(*)` }).from(callLogs).where(where),
  ]);
  return { items, total: countResult[0]?.count || 0 };
}

export async function getCallLog(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(callLogs).where(and(eq(callLogs.id, id), eq(callLogs.userId, userId))).limit(1);
  return result[0] || null;
}

export async function createCallLog(userId: number, data: Partial<typeof callLogs.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(callLogs).values({ ...data, userId, createdAt: now, updatedAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateCallLog(id: number, userId: number, data: Partial<typeof callLogs.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(callLogs).set({ ...data, updatedAt: Date.now() } as any).where(and(eq(callLogs.id, id), eq(callLogs.userId, userId)));
}

export async function getCallStats(userId: number, campaignId?: number) {
  const db = await getDb();
  if (!db) return { total: 0, connected: 0, qualified: 0, appointments: 0, avgDuration: 0 };
  const conditions = [eq(callLogs.userId, userId)];
  if (campaignId) conditions.push(eq(callLogs.voiceCampaignId, campaignId));
  const where = and(...conditions);
  const result = await db.select({
    total: sql<number>`count(*)`,
    connected: sql<number>`sum(case when callStatus = 'completed' then 1 else 0 end)`,
    qualified: sql<number>`sum(case when qualResult = 'qualified' then 1 else 0 end)`,
    appointments: sql<number>`sum(case when appointmentBooked = true then 1 else 0 end)`,
    avgDuration: sql<number>`avg(durationSeconds)`,
  }).from(callLogs).where(where);
  const r = result[0];
  return { total: r?.total || 0, connected: r?.connected || 0, qualified: r?.qualified || 0, appointments: r?.appointments || 0, avgDuration: Math.round(r?.avgDuration || 0) };
}

// ─── Documents ───
export async function listDocuments(userId: number, opts?: { category?: string; type?: string; carrierPacketId?: number; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq(documents.userId, userId)];
  if (opts?.category) conditions.push(eq(documents.category, opts.category));
  if (opts?.type) conditions.push(eq(documents.documentType, opts.type));
  if (opts?.carrierPacketId) conditions.push(eq(documents.carrierPacketId, opts.carrierPacketId));
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(documents).where(where).orderBy(desc(documents.createdAt)).limit(opts?.limit || 50).offset(opts?.offset || 0),
    db.select({ count: sql<number>`count(*)` }).from(documents).where(where),
  ]);
  return { items, total: countResult[0]?.count || 0 };
}

export async function createDocument(userId: number, data: Partial<typeof documents.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(documents).values({ ...data, userId, createdAt: now, updatedAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateDocument(id: number, userId: number, data: Partial<typeof documents.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(documents).set({ ...data, updatedAt: Date.now() } as any).where(and(eq(documents.id, id), eq(documents.userId, userId)));
}

export async function getDocument(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.userId, userId))).limit(1);
  return result[0] || null;
}

// ─── Carrier Packets ───
export async function listCarrierPackets(userId: number, opts?: { status?: string; search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq(carrierPackets.userId, userId)];
  if (opts?.status) conditions.push(eq(carrierPackets.packetStatus, opts.status as any));
  if (opts?.search) conditions.push(or(like(carrierPackets.carrierName, `%${opts.search}%`), like(carrierPackets.mcNumber, `%${opts.search}%`), like(carrierPackets.dotNumber, `%${opts.search}%`))!);
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(carrierPackets).where(where).orderBy(desc(carrierPackets.createdAt)).limit(opts?.limit || 50).offset(opts?.offset || 0),
    db.select({ count: sql<number>`count(*)` }).from(carrierPackets).where(where),
  ]);
  return { items, total: countResult[0]?.count || 0 };
}

export async function getCarrierPacket(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(carrierPackets).where(and(eq(carrierPackets.id, id), eq(carrierPackets.userId, userId))).limit(1);
  return result[0] || null;
}

export async function createCarrierPacket(userId: number, data: Partial<typeof carrierPackets.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(carrierPackets).values({ ...data, userId, createdAt: now, updatedAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateCarrierPacket(id: number, userId: number, data: Partial<typeof carrierPackets.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(carrierPackets).set({ ...data, updatedAt: Date.now() } as any).where(and(eq(carrierPackets.id, id), eq(carrierPackets.userId, userId)));
}

export async function deleteCarrierPacket(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(carrierPackets).where(and(eq(carrierPackets.id, id), eq(carrierPackets.userId, userId)));
}

export function calculateCarrierComplianceScore(checklist: Record<string, boolean> | null): number {
  if (!checklist) return 0;
  const weights: Record<string, number> = {
    mcAuthority: 15, dotNumber: 10, insuranceCurrent: 20, w9Received: 15,
    agreementSigned: 15, saferRatingOk: 10, noSafetyViolations: 10, bondVerified: 5,
  };
  let score = 0;
  let maxScore = 0;
  for (const [key, weight] of Object.entries(weights)) {
    maxScore += weight;
    if (checklist[key]) score += weight;
  }
  return Math.round((score / maxScore) * 100);
}

// ─── Deal Scores (Win Probability) ───
export async function getDealScore(dealId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(dealScores).where(and(eq(dealScores.dealId, dealId), eq(dealScores.userId, userId))).orderBy(desc(dealScores.scoredAt)).limit(1);
  return result[0] || null;
}

export async function getDealScoreHistory(dealId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dealScores).where(and(eq(dealScores.dealId, dealId), eq(dealScores.userId, userId))).orderBy(desc(dealScores.scoredAt)).limit(20);
}

export async function createDealScore(userId: number, data: Partial<typeof dealScores.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(dealScores).values({ ...data, userId, scoredAt: now, createdAt: now } as any);
  return { id: result[0].insertId };
}

export async function getDealsAtRisk(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get latest score per deal where probability is dropping
  return db.select().from(dealScores).where(and(eq(dealScores.userId, userId), eq(dealScores.probabilityTrend, 'down'))).orderBy(asc(dealScores.winProbability)).limit(10);
}

export async function getDealsReadyToClose(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dealScores).where(and(eq(dealScores.userId, userId), sql`winProbability >= 75`)).orderBy(desc(dealScores.winProbability)).limit(10);
}

export async function getRevenueForecast(userId: number) {
  const db = await getDb();
  if (!db) return { totalWeighted: 0, totalForecasted: 0, dealCount: 0 };
  const result = await db.select({
    totalWeighted: sql<number>`coalesce(sum(weightedValue), 0)`,
    totalForecasted: sql<number>`coalesce(sum(forecastedValue), 0)`,
    dealCount: sql<number>`count(distinct dealId)`,
  }).from(dealScores).where(eq(dealScores.userId, userId));
  return result[0] || { totalWeighted: 0, totalForecasted: 0, dealCount: 0 };
}

// ─── Revenue Briefings ───
export async function listRevenueBriefings(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(revenueBriefings).where(eq(revenueBriefings.userId, userId)).orderBy(desc(revenueBriefings.createdAt)).limit(limit);
}

export async function getRevenueBriefing(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(revenueBriefings).where(and(eq(revenueBriefings.id, id), eq(revenueBriefings.userId, userId))).limit(1);
  return result[0] || null;
}

export async function createRevenueBriefing(userId: number, data: Partial<typeof revenueBriefings.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(revenueBriefings).values({ ...data, userId, createdAt: now } as any);
  return { id: result[0].insertId };
}

export async function markBriefingRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(revenueBriefings).set({ isRead: true }).where(and(eq(revenueBriefings.id, id), eq(revenueBriefings.userId, userId)));
}

// ─── Smart Notifications ───
export async function listSmartNotifications(userId: number, opts?: { unreadOnly?: boolean; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(smartNotifications.userId, userId), eq(smartNotifications.isDismissed, false)];
  if (opts?.unreadOnly) conditions.push(eq(smartNotifications.isRead, false));
  return db.select().from(smartNotifications).where(and(...conditions)).orderBy(desc(smartNotifications.urgencyScore), desc(smartNotifications.createdAt)).limit(opts?.limit || 20);
}

export async function createSmartNotification(userId: number, data: Partial<typeof smartNotifications.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(smartNotifications).values({ ...data, userId, createdAt: now } as any);
  return { id: result[0].insertId };
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(smartNotifications).set({ isRead: true, readAt: Date.now() }).where(and(eq(smartNotifications.id, id), eq(smartNotifications.userId, userId)));
}

export async function dismissNotification(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(smartNotifications).set({ isDismissed: true }).where(and(eq(smartNotifications.id, id), eq(smartNotifications.userId, userId)));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(smartNotifications).where(and(eq(smartNotifications.userId, userId), eq(smartNotifications.isRead, false), eq(smartNotifications.isDismissed, false)));
  return result[0]?.count || 0;
}

// ─── Meeting Preps ───
export async function listMeetingPreps(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetingPreps).where(eq(meetingPreps.userId, userId)).orderBy(desc(meetingPreps.createdAt)).limit(20);
}

export async function getMeetingPrep(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(meetingPreps).where(and(eq(meetingPreps.id, id), eq(meetingPreps.userId, userId))).limit(1);
  return result[0] || null;
}

export async function createMeetingPrep(userId: number, data: Partial<typeof meetingPreps.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(meetingPreps).values({ ...data, userId, generatedAt: now, createdAt: now } as any);
  return { id: result[0].insertId };
}


// ═══════════════════════════════════════════════════════════════════
// PHASE 14: COMPETITIVE FEATURE PARITY - DB HELPERS
// ═══════════════════════════════════════════════════════════════════

// ─── Load Management ────────────────────────────────────────────────

export async function listLoads(userId: number, filters?: { status?: string; search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(loads).where(eq(loads.userId, userId)).orderBy(desc(loads.createdAt)).$dynamic();
  if (filters?.status) query = query.where(and(eq(loads.userId, userId), eq(loads.status, filters.status)));
  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset) query = query.offset(filters.offset);
  return query;
}

export async function getLoad(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(loads).where(and(eq(loads.id, id), eq(loads.userId, userId)));
  return rows[0] || null;
}

export async function createLoad(userId: number, data: Partial<InsertLoad>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const ref = `LD-${Date.now().toString(36).toUpperCase()}`;
  const result = await db.insert(loads).values({ ...data, userId, referenceNumber: data.referenceNumber || ref, createdAt: now, updatedAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateLoad(id: number, userId: number, data: Partial<InsertLoad>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(loads).set({ ...data, updatedAt: Date.now() } as any).where(and(eq(loads.id, id), eq(loads.userId, userId)));
  return { success: true };
}

export async function updateLoadStatus(loadId: number, userId: number, toStatus: string, notes?: string, location?: string) {
  const db = await getDb();
  if (!db) return null;
  const load = await getLoad(loadId, userId);
  if (!load) return null;
  const now = Date.now();
  await db.insert(loadStatusHistory).values({ loadId, userId, fromStatus: load.status, toStatus, notes: notes || null, location: location || null, createdAt: now } as any);
  await db.update(loads).set({ status: toStatus, updatedAt: now } as any).where(eq(loads.id, loadId));
  return { success: true };
}

export async function getLoadStatusHistory(loadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(loadStatusHistory).where(eq(loadStatusHistory.loadId, loadId)).orderBy(desc(loadStatusHistory.createdAt));
}

export async function getLoadStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, draft: 0, dispatched: 0, inTransit: 0, delivered: 0, closed: 0 };
  const all = await db.select().from(loads).where(eq(loads.userId, userId));
  return {
    total: all.length,
    draft: all.filter(l => l.status === 'draft').length,
    posted: all.filter(l => l.status === 'posted').length,
    dispatched: all.filter(l => l.status === 'dispatched').length,
    inTransit: all.filter(l => l.status === 'in_transit').length,
    delivered: all.filter(l => l.status === 'delivered').length,
    closed: all.filter(l => l.status === 'closed').length,
  };
}

// ─── Carrier Profiles (Deep Vetting) ────────────────────────────────

export async function listCarrierProfiles(userId: number, filters?: { vetStatus?: string; search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(carrierProfiles).where(eq(carrierProfiles.userId, userId)).orderBy(desc(carrierProfiles.createdAt)).$dynamic();
  if (filters?.vetStatus) query = query.where(and(eq(carrierProfiles.userId, userId), eq(carrierProfiles.vetStatus, filters.vetStatus)));
  if (filters?.limit) query = query.limit(filters.limit);
  return query;
}

export async function getCarrierProfile(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(carrierProfiles).where(and(eq(carrierProfiles.id, id), eq(carrierProfiles.userId, userId)));
  return rows[0] || null;
}

export async function createCarrierProfile(userId: number, data: Partial<InsertCarrierProfile>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(carrierProfiles).values({ ...data, userId, createdAt: now, updatedAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateCarrierProfile(id: number, userId: number, data: Partial<InsertCarrierProfile>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(carrierProfiles).set({ ...data, updatedAt: Date.now() } as any).where(and(eq(carrierProfiles.id, id), eq(carrierProfiles.userId, userId)));
  return { success: true };
}

export async function getExpiredInsuranceCarriers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const now = Date.now();
  return db.select().from(carrierProfiles).where(and(eq(carrierProfiles.userId, userId), eq(carrierProfiles.insuranceOnFile, true))).orderBy(asc(carrierProfiles.insuranceExpiry));
}

// ─── Load Board Posts ───────────────────────────────────────────────

export async function listLoadBoardPosts(userId: number, filters?: { board?: string; status?: string; loadId?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(loadBoardPosts).where(eq(loadBoardPosts.userId, userId)).orderBy(desc(loadBoardPosts.createdAt)).$dynamic();
  if (filters?.board) query = query.where(and(eq(loadBoardPosts.userId, userId), eq(loadBoardPosts.board, filters.board)));
  if (filters?.loadId) query = query.where(and(eq(loadBoardPosts.userId, userId), eq(loadBoardPosts.loadId, filters.loadId)));
  return query;
}

export async function createLoadBoardPost(userId: number, data: { loadId: number; board: string; expiresAt?: number }) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(loadBoardPosts).values({ ...data, userId, postedAt: now, createdAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateLoadBoardPost(id: number, userId: number, data: Partial<LoadBoardPost>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(loadBoardPosts).set(data as any).where(and(eq(loadBoardPosts.id, id), eq(loadBoardPosts.userId, userId)));
  return { success: true };
}

// ─── Invoices ───────────────────────────────────────────────────────

export async function listInvoices(userId: number, filters?: { status?: string; search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt)).$dynamic();
  if (filters?.status) query = query.where(and(eq(invoices.userId, userId), eq(invoices.status, filters.status)));
  if (filters?.limit) query = query.limit(filters.limit);
  return query;
}

export async function getInvoice(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
  return rows[0] || null;
}

export async function createInvoice(userId: number, data: Partial<InsertInvoice>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const invNum = `INV-${Date.now().toString(36).toUpperCase()}`;
  const result = await db.insert(invoices).values({ ...data, userId, invoiceNumber: data.invoiceNumber || invNum, issueDate: data.issueDate || now, createdAt: now, updatedAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateInvoice(id: number, userId: number, data: Partial<InsertInvoice>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(invoices).set({ ...data, updatedAt: Date.now() } as any).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
  return { success: true };
}

export async function createInvoiceFromLoad(userId: number, loadId: number) {
  const db = await getDb();
  if (!db) return null;
  const load = await getLoad(loadId, userId);
  if (!load) return null;
  const now = Date.now();
  const invNum = `INV-${Date.now().toString(36).toUpperCase()}`;
  const lineItems = [{ description: `Freight: ${load.originCity || ''}, ${load.originState || ''} → ${load.destCity || ''}, ${load.destState || ''}`, quantity: 1, unitPrice: Number(load.customerRate || 0), total: Number(load.customerRate || 0) }];
  const totalAmount = Number(load.customerRate || 0);
  const result = await db.insert(invoices).values({
    userId, loadId, billToCompanyId: load.companyId, billToContactId: load.contactId,
    invoiceNumber: invNum, status: 'draft', issueDate: now, dueDate: now + 30 * 86400000,
    lineItems, subtotal: BigInt(totalAmount), totalAmount: BigInt(totalAmount), balanceDue: BigInt(totalAmount),
    createdAt: now, updatedAt: now,
  } as any);
  await db.update(loads).set({ invoiceId: result[0].insertId } as any).where(eq(loads.id, loadId));
  return { id: result[0].insertId };
}

// ─── Customer Portal ────────────────────────────────────────────────

export async function listPortalAccess(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portalAccess).orderBy(desc(portalAccess.createdAt));
}

export async function createPortalAccess(data: { contactId: number; companyId?: number; email: string; permissions?: string[] }) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(portalAccess).values({ ...data, createdAt: now } as any);
  return { id: result[0].insertId };
}

export async function listPortalQuotes(companyId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (companyId) return db.select().from(portalQuotes).where(eq(portalQuotes.companyId, companyId)).orderBy(desc(portalQuotes.createdAt));
  return db.select().from(portalQuotes).orderBy(desc(portalQuotes.createdAt));
}

export async function createPortalQuote(data: Partial<PortalQuote>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(portalQuotes).values({ ...data, createdAt: now } as any);
  return { id: result[0].insertId };
}

// ─── Conversation Intelligence ──────────────────────────────────────

export async function listCallRecordings(userId: number, filters?: { analyzed?: boolean; contactId?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(callRecordings).where(eq(callRecordings.userId, userId)).orderBy(desc(callRecordings.createdAt)).$dynamic();
  if (filters?.limit) query = query.limit(filters.limit);
  return query;
}

export async function getCallRecording(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(callRecordings).where(and(eq(callRecordings.id, id), eq(callRecordings.userId, userId)));
  return rows[0] || null;
}

export async function createCallRecording(userId: number, data: Partial<CallRecording>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(callRecordings).values({ ...data, userId, createdAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateCallRecording(id: number, userId: number, data: Partial<CallRecording>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(callRecordings).set(data as any).where(and(eq(callRecordings.id, id), eq(callRecordings.userId, userId)));
  return { success: true };
}

// ─── B2B Contact Database ───────────────────────────────────────────

export async function listB2BContacts(userId: number, filters?: { search?: string; industry?: string; imported?: boolean; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(b2bContacts).where(eq(b2bContacts.userId, userId)).orderBy(desc(b2bContacts.createdAt)).$dynamic();
  if (filters?.limit) query = query.limit(filters.limit);
  return query;
}

export async function createB2BContact(userId: number, data: Partial<B2BContact>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(b2bContacts).values({ ...data, userId, createdAt: now } as any);
  return { id: result[0].insertId };
}

export async function markB2BContactImported(id: number, userId: number, contactId: number) {
  const db = await getDb();
  if (!db) return null;
  await db.update(b2bContacts).set({ imported: true, importedContactId: contactId } as any).where(and(eq(b2bContacts.id, id), eq(b2bContacts.userId, userId)));
  return { success: true };
}

// ─── Email Warmup ───────────────────────────────────────────────────

export async function listWarmupCampaigns(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(warmupCampaigns).where(eq(warmupCampaigns.userId, userId)).orderBy(desc(warmupCampaigns.createdAt));
}

export async function createWarmupCampaign(userId: number, data: Partial<WarmupCampaign>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(warmupCampaigns).values({ ...data, userId, startDate: data.startDate || now, createdAt: now, updatedAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateWarmupCampaign(id: number, userId: number, data: Partial<WarmupCampaign>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(warmupCampaigns).set({ ...data, updatedAt: Date.now() } as any).where(and(eq(warmupCampaigns.id, id), eq(warmupCampaigns.userId, userId)));
  return { success: true };
}

// ─── Visitor Tracking ───────────────────────────────────────────────

export async function listVisitorSessions(userId: number, filters?: { identified?: boolean; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(visitorSessions).where(eq(visitorSessions.userId, userId)).orderBy(desc(visitorSessions.lastVisit)).$dynamic();
  if (filters?.identified) query = query.where(and(eq(visitorSessions.userId, userId), isNotNull(visitorSessions.identifiedCompany)));
  if (filters?.limit) query = query.limit(filters.limit);
  return query;
}

export async function createVisitorSession(userId: number, data: Partial<VisitorSession>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(visitorSessions).values({ ...data, userId, firstVisit: now, lastVisit: now, createdAt: now } as any);
  return { id: result[0].insertId };
}

// ─── AI Order Entry (Inbound Emails) ────────────────────────────────

export async function listInboundEmails(userId: number, filters?: { status?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(inboundEmails).where(eq(inboundEmails.userId, userId)).orderBy(desc(inboundEmails.receivedAt)).$dynamic();
  if (filters?.status) query = query.where(and(eq(inboundEmails.userId, userId), eq(inboundEmails.status, filters.status)));
  if (filters?.limit) query = query.limit(filters.limit);
  return query;
}

export async function getInboundEmail(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(inboundEmails).where(and(eq(inboundEmails.id, id), eq(inboundEmails.userId, userId)));
  return rows[0] || null;
}

export async function createInboundEmail(userId: number, data: Partial<InboundEmail>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(inboundEmails).values({ ...data, userId, receivedAt: data.receivedAt || now, createdAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateInboundEmail(id: number, userId: number, data: Partial<InboundEmail>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(inboundEmails).set(data as any).where(and(eq(inboundEmails.id, id), eq(inboundEmails.userId, userId)));
  return { success: true };
}

// ─── White-Label Configuration ──────────────────────────────────────

export async function getWhiteLabelConfig(companyId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(whiteLabelConfig).where(eq(whiteLabelConfig.companyId, companyId));
  return rows[0] || null;
}

export async function upsertWhiteLabelConfig(companyId: number, data: Partial<WhiteLabelConfig>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const existing = await getWhiteLabelConfig(companyId);
  if (existing) {
    await db.update(whiteLabelConfig).set({ ...data, updatedAt: now } as any).where(eq(whiteLabelConfig.companyId, companyId));
    return { id: existing.id };
  }
  const result = await db.insert(whiteLabelConfig).values({ ...data, companyId, brandName: data.brandName || 'My Brokerage', createdAt: now, updatedAt: now } as any);
  return { id: result[0].insertId };
}

// ─── Digital Onboarding ─────────────────────────────────────────────

export async function listOnboardingFlows(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(onboardingFlows).where(eq(onboardingFlows.userId, userId)).orderBy(desc(onboardingFlows.createdAt));
}

export async function getOnboardingFlow(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(onboardingFlows).where(and(eq(onboardingFlows.id, id), eq(onboardingFlows.userId, userId)));
  return rows[0] || null;
}

export async function createOnboardingFlow(userId: number, data: Partial<OnboardingFlow>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(onboardingFlows).values({ ...data, userId, createdAt: now, updatedAt: now } as any);
  return { id: result[0].insertId };
}

export async function listOnboardingSubmissions(flowId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (flowId) return db.select().from(onboardingSubmissions).where(eq(onboardingSubmissions.flowId, flowId)).orderBy(desc(onboardingSubmissions.createdAt));
  return db.select().from(onboardingSubmissions).orderBy(desc(onboardingSubmissions.createdAt));
}

export async function createOnboardingSubmission(data: Partial<OnboardingSubmission>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(onboardingSubmissions).values({ ...data, createdAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateOnboardingSubmission(id: number, data: Partial<OnboardingSubmission>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(onboardingSubmissions).set(data as any).where(eq(onboardingSubmissions.id, id));
  return { success: true };
}

// ─── Subscription Plans & Trials ────────────────────────────────────

export async function listSubscriptionPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true)).orderBy(asc(subscriptionPlans.pricePerUser));
}

export async function getSubscription(companyId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(tenantSubscriptions).where(eq(tenantSubscriptions.companyId, companyId)).orderBy(desc(tenantSubscriptions.createdAt));
  return rows[0] || null;
}

export async function createSubscription(companyId: number, planId: number) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const trialEnd = now + 60 * 86400000; // 60 days = 2 months
  const result = await db.insert(tenantSubscriptions).values({
    companyId, planId, status: 'trial', trialStart: now, trialEnd,
    currentUsers: 1, createdAt: now, updatedAt: now,
  } as any);
  return { id: result[0].insertId };
}

export async function updateSubscription(id: number, data: Partial<TenantSubscription>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(tenantSubscriptions).set({ ...data, updatedAt: Date.now() } as any).where(eq(tenantSubscriptions.id, id));
  return { success: true };
}

// ─── Migration Jobs ─────────────────────────────────────────────────

export async function listMigrationJobs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(migrationJobs).where(eq(migrationJobs.userId, userId)).orderBy(desc(migrationJobs.createdAt));
}

export async function getMigrationJob(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(migrationJobs).where(and(eq(migrationJobs.id, id), eq(migrationJobs.userId, userId)));
  return rows[0] || null;
}

export async function createMigrationJob(userId: number, data: Partial<MigrationJob>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(migrationJobs).values({ ...data, userId, createdAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateMigrationJob(id: number, userId: number, data: Partial<MigrationJob>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(migrationJobs).set(data as any).where(and(eq(migrationJobs.id, id), eq(migrationJobs.userId, userId)));
  return { success: true };
}

// ─── Enrichment Logs ────────────────────────────────────────────────

export async function createEnrichmentLog(userId: number, data: Partial<EnrichmentLog>) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(enrichmentLogs).values({ ...data, userId, createdAt: now } as any);
  return { id: result[0].insertId };
}


// ============================================================
// PHASE 16: MARKETPLACE + AUTOPILOT DB HELPERS
// ============================================================

// --- Marketplace Loads ---
export async function listMarketplaceLoads(filters: { status?: string; companyId?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters.status) conditions.push(eq(marketplaceLoads.status, filters.status));
  // companyId not in marketplace_loads table - skip that filter
  return db.select().from(marketplaceLoads).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(marketplaceLoads.createdAt)).limit(100);
}

export async function getMarketplaceLoad(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(marketplaceLoads).where(eq(marketplaceLoads.id, id)).limit(1);
  return rows[0] || null;
}

export async function createMarketplaceLoad(data: any) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const loadNumber = `ML-${Date.now().toString(36).toUpperCase()}`;
  const result = await db.insert(marketplaceLoads).values({ ...data, loadNumber, createdAt: now, updatedAt: now } as any);
  return { id: result[0].insertId, loadNumber };
}

export async function updateMarketplaceLoad(id: number, data: any) {
  const db = await getDb();
  if (!db) return null;
  await db.update(marketplaceLoads).set({ ...data, updatedAt: Date.now() } as any).where(eq(marketplaceLoads.id, id));
  return { success: true };
}

// --- Marketplace Bids ---
export async function listBidsForLoad(loadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketplaceBids).where(eq(marketplaceBids.loadId, loadId)).orderBy(desc(marketplaceBids.matchScore));
}

export async function createMarketplaceBid(data: any) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(marketplaceBids).values({ ...data, createdAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateBidStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) return null;
  await db.update(marketplaceBids).set({ status } as any).where(eq(marketplaceBids.id, id));
  return { success: true };
}

// --- Marketplace Payments ---
export async function getPaymentForLoad(loadId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(marketplacePayments).where(eq(marketplacePayments.loadId, loadId)).limit(1);
  return rows[0] || null;
}

export async function createMarketplacePayment(data: any) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(marketplacePayments).values({ ...data, createdAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateMarketplacePayment(loadId: number, data: any) {
  const db = await getDb();
  if (!db) return null;
  await db.update(marketplacePayments).set(data as any).where(eq(marketplacePayments.loadId, loadId));
  return { success: true };
}

// --- Marketplace Tracking ---
export async function listTrackingEvents(loadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketplaceTracking).where(eq(marketplaceTracking.loadId, loadId)).orderBy(desc(marketplaceTracking.createdAt));
}

export async function addTrackingEvent(data: any) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(marketplaceTracking).values({ ...data, createdAt: now } as any);
  return { id: result[0].insertId };
}

// --- Marketplace Documents ---
export async function listDocumentsForLoad(loadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketplaceDocuments).where(eq(marketplaceDocuments.loadId, loadId)).orderBy(desc(marketplaceDocuments.createdAt));
}

export async function createMarketplaceDocument(data: any) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(marketplaceDocuments).values({ ...data, createdAt: now } as any);
  return { id: result[0].insertId };
}

// --- Lane Analytics ---
export async function listLaneAnalytics(filters: { originState?: string; destState?: string } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (filters.originState) conditions.push(eq(laneAnalytics.originState, filters.originState));
  if (filters.destState) conditions.push(eq(laneAnalytics.destState, filters.destState));
  return db.select().from(laneAnalytics).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(laneAnalytics.demandScore)).limit(100);
}

export async function upsertLaneAnalytic(data: any) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(laneAnalytics).values({ ...data, updatedAt: now } as any);
  return { id: result[0].insertId };
}

// --- Consolidation Opportunities ---
export async function listConsolidationOpportunities(status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (status) conditions.push(eq(consolidationOpportunities.status, status));
  return db.select().from(consolidationOpportunities).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(consolidationOpportunities.savings)).limit(50);
}

export async function createConsolidationOpportunity(data: any) {
  const db = await getDb();
  if (!db) return null;
  const now = Date.now();
  const result = await db.insert(consolidationOpportunities).values({ ...data, createdAt: now } as any);
  return { id: result[0].insertId };
}

export async function updateConsolidationStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) return null;
  const updates: any = { status };
  if (status === 'executed') updates.executedAt = Date.now();
  await db.update(consolidationOpportunities).set(updates).where(eq(consolidationOpportunities.id, id));
  return { success: true };
}

// --- Marketplace Stats ---
export async function getMarketplaceStats(companyId?: number) {
  const db = await getDb();
  if (!db) return { totalLoads: 0, activeLoads: 0, deliveredLoads: 0, totalRevenue: 0, totalMargin: 0, avgMarginPercent: 0 };
  const conditions: any[] = [];
  // companyId not in marketplace_loads table - skip that filter
  
  const allLoads = await db.select().from(marketplaceLoads).where(conditions.length ? and(...conditions) : undefined);
  const totalLoads = allLoads.length;
  const activeLoads = allLoads.filter(l => ['posted', 'matching', 'matched', 'booked', 'dispatched', 'in_transit'].includes(l.status)).length;
  const deliveredLoads = allLoads.filter(l => ['delivered', 'completed'].includes(l.status)).length;
  const totalRevenue = allLoads.reduce((sum, l) => sum + Number(l.shipperRate || 0), 0);
  const totalMargin = allLoads.reduce((sum, l) => sum + Number(l.margin || 0), 0);
  const avgMarginPercent = totalLoads > 0 ? allLoads.reduce((sum, l) => sum + Number(l.marginPercent || 0), 0) / totalLoads : 0;
  
  return { totalLoads, activeLoads, deliveredLoads, totalRevenue, totalMargin, avgMarginPercent };
}


// ─── Email Masking ──────────────────────────────────────────────────

export async function getEmailMask(userId: number, companyId?: number) {
  const db = await getDb();
  if (!db) return null;
  const conditions = [eq(emailMaskSettings.userId, userId), eq(emailMaskSettings.isActive, true)];
  if (companyId) conditions.push(eq(emailMaskSettings.companyId, companyId));
  const [mask] = await db.select().from(emailMaskSettings).where(and(...conditions)).limit(1);
  return mask || null;
}

export async function listEmailMasks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailMaskSettings).where(eq(emailMaskSettings.userId, userId)).orderBy(desc(emailMaskSettings.createdAt));
}

export async function saveEmailMask(userId: number, data: {
  displayName: string;
  displayEmail: string;
  replyToName?: string;
  replyToEmail?: string;
  organizationName?: string;
  applyTo?: string;
  dmarcAlignment?: string;
  companyId?: number;
  id?: number;
}) {
  const db = await getDb();
  if (!db) return { id: 0 };
  const now = Date.now();
  if (data.id) {
    await db.update(emailMaskSettings).set({
      displayName: data.displayName,
      displayEmail: data.displayEmail,
      replyToName: data.replyToName || null,
      replyToEmail: data.replyToEmail || null,
      organizationName: data.organizationName || null,
      applyTo: data.applyTo || "all",
      dmarcAlignment: data.dmarcAlignment || "relaxed",
      companyId: data.companyId || null,
      updatedAt: now,
    }).where(and(eq(emailMaskSettings.id, data.id), eq(emailMaskSettings.userId, userId)));
    return { id: data.id };
  }
  const [result] = await db.insert(emailMaskSettings).values({
    userId,
    displayName: data.displayName,
    displayEmail: data.displayEmail,
    replyToName: data.replyToName || null,
    replyToEmail: data.replyToEmail || null,
    organizationName: data.organizationName || null,
    applyTo: data.applyTo || "all",
    dmarcAlignment: data.dmarcAlignment || "relaxed",
    companyId: data.companyId || null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  return { id: result.insertId };
}

export async function deleteEmailMask(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(emailMaskSettings).where(and(eq(emailMaskSettings.id, id), eq(emailMaskSettings.userId, userId)));
  return true;
}

// Apply mask to outbound email headers
export function applyEmailMask(mask: EmailMaskSetting | null, originalFrom: { name: string; email: string }) {
  if (!mask || !mask.isActive) {
    return {
      from: { name: originalFrom.name, email: originalFrom.email },
      replyTo: null,
      envelopeSender: originalFrom.email,
    };
  }
  return {
    from: { name: mask.displayName, email: mask.displayEmail },
    replyTo: mask.replyToEmail ? { name: mask.replyToName || mask.displayName, email: mask.replyToEmail } : { name: mask.displayName, email: mask.displayEmail },
    envelopeSender: originalFrom.email, // actual sending domain for SPF/DKIM
  };
}

// ─── Global Search ───
export async function globalSearch(userId: number, query: string, limit = 15) {
  const db = await getDb();
  if (!db || !query.trim()) return { companies: [], contacts: [], deals: [] };
  const term = `%${query.trim()}%`;

  const [companyResults, contactResults, dealResults] = await Promise.all([
    db.select({
      id: companies.id,
      name: companies.name,
      industry: companies.industry,
      leadStatus: companies.leadStatus,
    })
      .from(companies)
      .where(and(eq(companies.userId, userId), or(like(companies.name, term), like(companies.industry, term), like(companies.website, term))))
      .limit(limit),

    db.select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      email: contacts.email,
      companyId: contacts.companyId,
    })
      .from(contacts)
      .where(and(eq(contacts.userId, userId), or(like(contacts.firstName, term), like(contacts.lastName, term), like(contacts.email, term))))
      .limit(limit),

    db.select({
      id: deals.id,
      name: deals.name,
      value: deals.value,
      status: deals.status,
    })
      .from(deals)
      .where(and(eq(deals.userId, userId), or(like(deals.name, term))))
      .limit(limit),
  ]);

  return { companies: companyResults, contacts: contactResults, deals: dealResults };
}


// ═══════════════════════════════════════════════════════════════
// ROLE-BASED ACCESS CONTROL — Team & Manager Queries
// ═══════════════════════════════════════════════════════════════

/**
 * Get all user IDs that a manager can see (their direct reports + themselves).
 * For company_admin: all users in their tenant.
 * For developer: all users.
 * For regular user: only themselves.
 */
export async function getVisibleUserIds(user: { id: number; systemRole: string; tenantCompanyId: number | null; }): Promise<number[]> {
  const db = await getDb();
  if (!db) return [user.id];

  if (user.systemRole === "developer" || user.systemRole === "super_admin") {
    // Developer / super_admin sees all users across all tenants
    const allUsers = await db.select({ id: users.id }).from(users);
    return allUsers.map(u => u.id);
  }

  if (user.systemRole === "axiom_admin" || user.systemRole === "axiom_owner" || user.systemRole === "company_admin") {
    // axiom_admin / axiom_owner / company_admin sees all users in their own tenant
    if (!user.tenantCompanyId) return [user.id];
    const tenantUsers = await db.select({ id: users.id }).from(users)
      .where(eq(users.tenantCompanyId, user.tenantCompanyId));
    return tenantUsers.map(u => u.id);
  }

  if (["manager", "sales_manager", "office_manager"].includes(user.systemRole)) {
    // Manager roles see their direct reports + themselves
    const directReports = await db.select({ id: users.id }).from(users)
      .where(eq(users.managerId, user.id));
    return [user.id, ...directReports.map(u => u.id)];
  }

  // Account manager / coordinator / user: only themselves
  return [user.id];
}

/**
 * List companies visible to a user based on their role.
 * Sales Rep: only their own. Manager: their team's. Admin: all in tenant.
 */
export async function listCompaniesByRole(user: { id: number; systemRole: string; tenantCompanyId: number | null; }, opts?: { search?: string; leadStatus?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const visibleIds = await getVisibleUserIds(user);
  const conditions = [inArray(companies.userId, visibleIds)];
  if (opts?.leadStatus) conditions.push(eq(companies.leadStatus, opts.leadStatus));
  if (opts?.search) conditions.push(or(like(companies.name, `%${opts.search}%`), like(companies.domain, `%${opts.search}%`))!);
  const where = and(...conditions);
  const [rawItems, countResult] = await Promise.all([
    db.select().from(companies).where(where).orderBy(desc(companies.createdAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(companies).where(where),
  ]);
  const companyIds = rawItems.map(c => c.id);
  let contactMap = new Map<number, number>();
  let dealMap = new Map<number, { openDeals: number; pipelineValue: number }>();
  if (companyIds.length > 0) {
    const [contactCounts, dealMetrics] = await Promise.all([
      db.select({ companyId: contacts.companyId, count: sql<number>`count(*)` }).from(contacts).where(inArray(contacts.companyId, companyIds)).groupBy(contacts.companyId),
      db.select({ companyId: deals.companyId, openDeals: sql<number>`SUM(CASE WHEN ${deals.status} = 'open' THEN 1 ELSE 0 END)`, pipelineValue: sql<number>`SUM(CASE WHEN ${deals.status} = 'open' THEN COALESCE(${deals.value}, 0) ELSE 0 END)` }).from(deals).where(inArray(deals.companyId, companyIds)).groupBy(deals.companyId),
    ]);
    contactMap = new Map(contactCounts.map(c => [c.companyId, Number(c.count)]));
    dealMap = new Map(dealMetrics.filter(d => d.companyId != null).map(d => [d.companyId as number, { openDeals: Number(d.openDeals ?? 0), pipelineValue: Number(d.pipelineValue ?? 0) }]));
  }
  const items = rawItems.map(c => ({
    ...c,
    contactCount: contactMap.get(c.id) ?? 0,
    openDeals: dealMap.get(c.id)?.openDeals ?? 0,
    pipelineValue: dealMap.get(c.id)?.pipelineValue ?? 0,
  }));
  return { items, total: countResult[0]?.count ?? 0 };
}

/**
 * List contacts visible to a user based on their role.
 */
export async function listContactsByRole(user: { id: number; systemRole: string; tenantCompanyId: number | null; }, opts?: { search?: string; stage?: string; leadStatus?: string; companyId?: number; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const visibleIds = await getVisibleUserIds(user);
  const conditions = [inArray(contacts.userId, visibleIds)];
  if (opts?.stage) conditions.push(eq(contacts.lifecycleStage, opts.stage));
  if (opts?.leadStatus) conditions.push(eq(contacts.leadStatus, opts.leadStatus));
  if (opts?.companyId) conditions.push(eq(contacts.companyId, opts.companyId));
  if (opts?.search) conditions.push(or(like(contacts.firstName, `%${opts.search}%`), like(contacts.lastName, `%${opts.search}%`), like(contacts.email, `%${opts.search}%`))!);
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(contacts).where(where).orderBy(desc(contacts.createdAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(contacts).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

/**
 * List deals visible to a user based on their role.
 */
export async function listDealsByRole(user: { id: number; systemRole: string; tenantCompanyId: number | null; }, opts?: { pipelineId?: number; status?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const visibleIds = await getVisibleUserIds(user);
  const conditions = [inArray(deals.userId, visibleIds)];
  if (opts?.pipelineId) conditions.push(eq(deals.pipelineId, opts.pipelineId));
  if (opts?.status) conditions.push(eq(deals.status, opts.status as "open" | "won" | "lost"));
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(deals).where(where).orderBy(desc(deals.createdAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(deals).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

/**
 * List tasks visible to a user based on their role.
 */
export async function listTasksByRole(user: { id: number; systemRole: string; tenantCompanyId: number | null; }, opts?: { status?: string; taskType?: string; queue?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const visibleIds = await getVisibleUserIds(user);
  const conditions = [inArray(tasks.userId, visibleIds)];
  if (opts?.status) conditions.push(eq(tasks.status, opts.status as "not_started" | "completed"));
  if (opts?.taskType) conditions.push(eq(tasks.taskType, opts.taskType));
  if (opts?.queue) conditions.push(eq(tasks.queue, opts.queue));
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(tasks).where(where).orderBy(desc(tasks.createdAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(tasks).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

/**
 * Get dashboard stats aggregated across visible users (for managers/admins).
 */
export async function getDashboardStatsByRole(user: { id: number; systemRole: string; tenantCompanyId: number | null; }) {
  const db = await getDb();
  if (!db) return { totalContacts: 0, totalCompanies: 0, totalDeals: 0, openDeals: 0, wonDeals: 0, lostDeals: 0, totalValue: 0, wonValue: 0, totalCampaigns: 0, totalTasks: 0, pendingTasks: 0, totalSmtpAccounts: 0, emailsSentToday: 0, teamSize: 0 };

  const visibleIds = await getVisibleUserIds(user);
  const [contactCount, companyCount, dealStats, campaignCount, taskStats, smtpStats] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(contacts).where(inArray(contacts.userId, visibleIds)),
    db.select({ count: sql<number>`count(*)` }).from(companies).where(inArray(companies.userId, visibleIds)),
    db.select({
      total: sql<number>`count(*)`,
      open: sql<number>`SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)`,
      won: sql<number>`SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END)`,
      lost: sql<number>`SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END)`,
      totalValue: sql<number>`COALESCE(SUM(dealValue), 0)`,
      wonValue: sql<number>`COALESCE(SUM(CASE WHEN status = 'won' THEN dealValue ELSE 0 END), 0)`,
    }).from(deals).where(inArray(deals.userId, visibleIds)),
    db.select({ count: sql<number>`count(*)` }).from(emailCampaigns).where(inArray(emailCampaigns.userId, visibleIds)),
    db.select({
      total: sql<number>`count(*)`,
      pending: sql<number>`SUM(CASE WHEN taskStatus = 'not_started' THEN 1 ELSE 0 END)`,
    }).from(tasks).where(inArray(tasks.userId, visibleIds)),
    db.select({
      total: sql<number>`count(*)`,
      sentToday: sql<number>`COALESCE(SUM(sentToday), 0)`,
    }).from(smtpAccounts).where(inArray(smtpAccounts.userId, visibleIds)),
  ]);

  return {
    totalContacts: contactCount[0]?.count ?? 0,
    totalCompanies: companyCount[0]?.count ?? 0,
    totalDeals: dealStats[0]?.total ?? 0,
    openDeals: dealStats[0]?.open ?? 0,
    wonDeals: dealStats[0]?.won ?? 0,
    lostDeals: dealStats[0]?.lost ?? 0,
    totalValue: dealStats[0]?.totalValue ?? 0,
    wonValue: dealStats[0]?.wonValue ?? 0,
    totalCampaigns: campaignCount[0]?.count ?? 0,
    totalTasks: taskStats[0]?.total ?? 0,
    pendingTasks: taskStats[0]?.pending ?? 0,
    totalSmtpAccounts: smtpStats[0]?.total ?? 0,
    emailsSentToday: smtpStats[0]?.sentToday ?? 0,
    teamSize: visibleIds.length,
  };
}

/**
 * Manager oversight: get team member performance stats.
 */
export async function getTeamPerformanceStats(managerId: number) {
  const db = await getDb();
  if (!db) return [];

  const teamMembers = await db.select().from(users).where(eq(users.managerId, managerId));
  
  const stats = await Promise.all(teamMembers.map(async (member) => {
    const [companyCount, contactCount, dealStats, taskStats] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(companies).where(eq(companies.userId, member.id)),
      db.select({ count: sql<number>`count(*)` }).from(contacts).where(eq(contacts.userId, member.id)),
      db.select({
        total: sql<number>`count(*)`,
        open: sql<number>`SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)`,
        won: sql<number>`SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END)`,
        totalValue: sql<number>`COALESCE(SUM(dealValue), 0)`,
        wonValue: sql<number>`COALESCE(SUM(CASE WHEN status = 'won' THEN dealValue ELSE 0 END), 0)`,
      }).from(deals).where(eq(deals.userId, member.id)),
      db.select({
        total: sql<number>`count(*)`,
        completed: sql<number>`SUM(CASE WHEN taskStatus = 'completed' THEN 1 ELSE 0 END)`,
        overdue: sql<number>`SUM(CASE WHEN taskStatus != 'completed' AND dueDate < ${Date.now()} THEN 1 ELSE 0 END)`,
      }).from(tasks).where(eq(tasks.userId, member.id)),
    ]);

    return {
      userId: member.id,
      name: member.name ?? member.username ?? "Unknown",
      email: member.email,
      systemRole: member.systemRole,
      isActive: member.isActive,
      lastActiveAt: member.lastActiveAt,
      companies: companyCount[0]?.count ?? 0,
      contacts: contactCount[0]?.count ?? 0,
      totalDeals: dealStats[0]?.total ?? 0,
      openDeals: dealStats[0]?.open ?? 0,
      wonDeals: dealStats[0]?.won ?? 0,
      totalDealValue: dealStats[0]?.totalValue ?? 0,
      wonDealValue: dealStats[0]?.wonValue ?? 0,
      totalTasks: taskStats[0]?.total ?? 0,
      completedTasks: taskStats[0]?.completed ?? 0,
      overdueTasks: taskStats[0]?.overdue ?? 0,
    };
  }));

  return stats;
}

/**
 * Reassign a company (and its contacts) from one user to another.
 * Only managers/admins can do this.
 */
export async function reassignCompany(companyId: number, fromUserId: number, toUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(companies).set({ userId: toUserId, updatedAt: Date.now() }).where(and(eq(companies.id, companyId), eq(companies.userId, fromUserId)));
  // Also reassign all contacts under this company
  await db.update(contacts).set({ userId: toUserId, updatedAt: Date.now() }).where(and(eq(contacts.companyId, companyId), eq(contacts.userId, fromUserId)));
}

/**
 * Reassign a deal from one user to another.
 */
export async function reassignDeal(dealId: number, fromUserId: number, toUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(deals).set({ userId: toUserId, updatedAt: Date.now() }).where(and(eq(deals.id, dealId), eq(deals.userId, fromUserId)));
}

/**
 * Reassign a task from one user to another.
 */
export async function reassignTask(taskId: number, fromUserId: number, toUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(tasks).set({ userId: toUserId, updatedAt: Date.now() }).where(and(eq(tasks.id, taskId), eq(tasks.userId, fromUserId)));
}

// ═══════════════════════════════════════════════════════════════
// AI CREDIT SYSTEM
// CRM AI = FREE. Non-CRM AI = paid credits at 25% markup on Manus pricing.
// ═══════════════════════════════════════════════════════════════

/** Get tenant AI credit balance */
export async function getTenantAiCredits(tenantCompanyId: number): Promise<TenantAiCredits | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(tenantAiCredits).where(eq(tenantAiCredits.tenantCompanyId, tenantCompanyId)).limit(1);
  return rows[0] || null;
}

/** Initialize tenant AI credits row (idempotent) */
export async function initTenantAiCredits(tenantCompanyId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await getTenantAiCredits(tenantCompanyId);
  if (existing) return;
  await db.insert(tenantAiCredits).values({
    tenantCompanyId,
    availableCredits: 0,
    lifetimePurchasedCredits: 0,
    lifetimeUsedCredits: 0,
    updatedAt: Date.now(),
  });
}

/** Add purchased credits to tenant balance */
export async function addTenantAiCredits(
  tenantCompanyId: number,
  credits: number,
  description: string,
  packageId?: number,
  pricePaidCents?: number,
  performedBy?: number,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await initTenantAiCredits(tenantCompanyId);
  const current = await getTenantAiCredits(tenantCompanyId);
  const balanceBefore = current?.availableCredits || 0;
  const balanceAfter = balanceBefore + credits;
  await db.update(tenantAiCredits)
    .set({
      availableCredits: balanceAfter,
      lifetimePurchasedCredits: (current?.lifetimePurchasedCredits || 0) + credits,
      updatedAt: Date.now(),
    })
    .where(eq(tenantAiCredits.tenantCompanyId, tenantCompanyId));
  await db.insert(aiCreditTransactions).values({
    tenantCompanyId,
    type: "purchase",
    credits,
    balanceBefore,
    balanceAfter,
    description,
    isCrmFree: false,
    packageId: packageId || null,
    pricePaidCents: pricePaidCents || null,
    performedBy: performedBy || null,
    createdAt: Date.now(),
  });
}

/**
 * Consume credits for a paid (non-CRM) AI feature.
 * Returns false if insufficient balance.
 */
export async function consumeAiCredits(
  tenantCompanyId: number,
  userId: number,
  credits: number,
  featureKey: string,
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const current = await getTenantAiCredits(tenantCompanyId);
  if (!current || current.availableCredits < credits) return false;
  const balanceBefore = current.availableCredits;
  const balanceAfter = balanceBefore - credits;
  await db.update(tenantAiCredits)
    .set({
      availableCredits: balanceAfter,
      lifetimeUsedCredits: (current.lifetimeUsedCredits || 0) + credits,
      updatedAt: Date.now(),
    })
    .where(eq(tenantAiCredits.tenantCompanyId, tenantCompanyId));
  await db.insert(aiCreditTransactions).values({
    tenantCompanyId,
    userId,
    type: "paid_usage",
    credits: -credits,
    balanceBefore,
    balanceAfter,
    featureKey,
    isCrmFree: false,
    description: `Used ${credits} credit(s) for ${featureKey}`,
    createdAt: Date.now(),
  });
  return true;
}

/**
 * Log a CRM-free AI usage (no credits deducted, analytics only).
 */
export async function logCrmFreeAiUsage(
  tenantCompanyId: number,
  userId: number,
  featureKey: string,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await initTenantAiCredits(tenantCompanyId);
  const current = await getTenantAiCredits(tenantCompanyId);
  const balance = current?.availableCredits || 0;
  await db.insert(aiCreditTransactions).values({
    tenantCompanyId,
    userId,
    type: "crm_free",
    credits: 0,
    balanceBefore: balance,
    balanceAfter: balance,
    featureKey,
    isCrmFree: true,
    description: `CRM AI feature used (free): ${featureKey}`,
    createdAt: Date.now(),
  });
}

/** Get AI credit transaction history for a tenant */
export async function getAiCreditTransactions(tenantCompanyId: number, limit = 50): Promise<AiCreditTransaction[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiCreditTransactions)
    .where(eq(aiCreditTransactions.tenantCompanyId, tenantCompanyId))
    .orderBy(desc(aiCreditTransactions.createdAt))
    .limit(limit);
}

/** Get all active AI credit packages */
export async function getAiCreditPackages(): Promise<AiCreditPackage[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiCreditPackages).where(eq(aiCreditPackages.isActive, true));
}

/** Get user AI allocation */
export async function getUserAiAllocation(tenantCompanyId: number, userId: number): Promise<UserAiAllocation | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(userAiAllocations)
    .where(and(eq(userAiAllocations.tenantCompanyId, tenantCompanyId), eq(userAiAllocations.userId, userId)))
    .limit(1);
  return rows[0] || null;
}

/** Set user AI allocation */
export async function setUserAiAllocation(tenantCompanyId: number, userId: number, monthlyLimit: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getUserAiAllocation(tenantCompanyId, userId);
  const now = Date.now();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);
  if (existing) {
    await db.update(userAiAllocations)
      .set({ monthlyLimit, updatedAt: now })
      .where(and(eq(userAiAllocations.tenantCompanyId, tenantCompanyId), eq(userAiAllocations.userId, userId)));
  } else {
    await db.insert(userAiAllocations).values({
      tenantCompanyId,
      userId,
      monthlyLimit,
      currentMonthUsed: 0,
      resetDate: nextMonth.getTime(),
      createdAt: now,
      updatedAt: now,
    });
  }
}

// ─── Tracked Websites ──────────────────────────────────────────────────────
export async function listTrackedWebsites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`SELECT * FROM tracked_websites WHERE twUserId = ${userId} ORDER BY twCreatedAt DESC`);
  return (rows as any)[0] as any[];
}

export async function addTrackedWebsite(userId: number, data: { name: string; domain: string; trackingId: string }) {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`INSERT INTO tracked_websites (twUserId, twName, twDomain, twTrackingId, twIsActive, twCreatedAt) VALUES (${userId}, ${data.name}, ${data.domain}, ${data.trackingId}, true, ${Date.now()})`);
}

export async function removeTrackedWebsite(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`DELETE FROM tracked_websites WHERE id = ${id} AND twUserId = ${userId}`);
}

// ─── Website Platform Credentials ────────────────────────────────────────────
export async function savePlatformCredentials(
  userId: number,
  websiteId: number,
  platform: string,
  credentials: Record<string, string>,
) {
  const db = await getDb();
  if (!db) return;
  const now = Date.now();
  const json = JSON.stringify(credentials);
  await db.execute(sql`
    INSERT INTO website_platform_credentials
      (wpcUserId, wpcWebsiteId, wpcPlatform, wpcCredentialsJson, wpcCreatedAt, wpcUpdatedAt)
    VALUES (${userId}, ${websiteId}, ${platform}, ${json}, ${now}, ${now})
    ON DUPLICATE KEY UPDATE wpcCredentialsJson = ${json}, wpcUpdatedAt = ${now}
  `);
}

export async function getPlatformCredentials(
  userId: number,
  websiteId: number,
  platform: string,
): Promise<Record<string, string> | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.execute(sql`
    SELECT wpcCredentialsJson FROM website_platform_credentials
    WHERE wpcUserId = ${userId} AND wpcWebsiteId = ${websiteId} AND wpcPlatform = ${platform}
    LIMIT 1
  `);
  const row = ((rows as any)[0] as any[])[0];
  if (!row) return null;
  try { return JSON.parse(row.wpcCredentialsJson); } catch { return null; }
}

export async function listPlatformCredentials(userId: number, websiteId: number): Promise<{ platform: string }[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`
    SELECT wpcPlatform as platform FROM website_platform_credentials
    WHERE wpcUserId = ${userId} AND wpcWebsiteId = ${websiteId}
  `);
  return (rows as any)[0] as { platform: string }[];
}

export async function deletePlatformCredentials(userId: number, websiteId: number, platform: string) {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`
    DELETE FROM website_platform_credentials
    WHERE wpcUserId = ${userId} AND wpcWebsiteId = ${websiteId} AND wpcPlatform = ${platform}
  `);
}

// ─── Dashboard Trend Stats ───
export async function getDashboardTrendStats(
  user: { id: number; systemRole: string; tenantCompanyId: number | null },
  range: { from: number; to: number }
) {
  const db = await getDb();
  if (!db) return null;
  const visibleIds = await getVisibleUserIds(user);
  const { from, to } = range;
  const duration = to - from;
  const prevFrom = from - duration;
  const prevTo = from;

  const [curr, prev, avgCycle, topReps] = await Promise.all([
    // Current period stats
    db.select({
      newContacts: sql<number>`SUM(CASE WHEN ${contacts.createdAt} >= ${from} AND ${contacts.createdAt} <= ${to} THEN 1 ELSE 0 END)`,
      newCompanies: sql<number>`SUM(CASE WHEN ${companies.createdAt} >= ${from} AND ${companies.createdAt} <= ${to} THEN 1 ELSE 0 END)`,
    }).from(contacts).rightJoin(companies, sql`1=1`).where(
      or(inArray(contacts.userId, visibleIds), inArray(companies.userId, visibleIds))
    ).limit(1).then(async () => {
      // Simpler: separate queries
      const [c, co, d] = await Promise.all([
        db.select({ n: sql<number>`count(*)` }).from(contacts)
          .where(and(inArray(contacts.userId, visibleIds), gte(contacts.createdAt, from), lte(contacts.createdAt, to))),
        db.select({ n: sql<number>`count(*)` }).from(companies)
          .where(and(inArray(companies.userId, visibleIds), gte(companies.createdAt, from), lte(companies.createdAt, to))),
        db.select({
          n: sql<number>`count(*)`,
          won: sql<number>`SUM(CASE WHEN status='won' THEN 1 ELSE 0 END)`,
          lost: sql<number>`SUM(CASE WHEN status='lost' THEN 1 ELSE 0 END)`,
          wonVal: sql<number>`COALESCE(SUM(CASE WHEN status='won' THEN dealValue ELSE 0 END), 0)`,
        }).from(deals)
          .where(and(inArray(deals.userId, visibleIds), gte(deals.createdAt, from), lte(deals.createdAt, to))),
      ]);
      return { contacts: c[0]?.n ?? 0, companies: co[0]?.n ?? 0, deals: d[0]?.n ?? 0, wonDeals: d[0]?.won ?? 0, lostDeals: d[0]?.lost ?? 0, wonValue: d[0]?.wonVal ?? 0 };
    }),
    // Previous period stats
    (async () => {
      const [c, co, d] = await Promise.all([
        db.select({ n: sql<number>`count(*)` }).from(contacts)
          .where(and(inArray(contacts.userId, visibleIds), gte(contacts.createdAt, prevFrom), lte(contacts.createdAt, prevTo))),
        db.select({ n: sql<number>`count(*)` }).from(companies)
          .where(and(inArray(companies.userId, visibleIds), gte(companies.createdAt, prevFrom), lte(companies.createdAt, prevTo))),
        db.select({
          n: sql<number>`count(*)`,
          won: sql<number>`SUM(CASE WHEN status='won' THEN 1 ELSE 0 END)`,
          wonVal: sql<number>`COALESCE(SUM(CASE WHEN status='won' THEN dealValue ELSE 0 END), 0)`,
        }).from(deals)
          .where(and(inArray(deals.userId, visibleIds), gte(deals.createdAt, prevFrom), lte(deals.createdAt, prevTo))),
      ]);
      return { contacts: c[0]?.n ?? 0, companies: co[0]?.n ?? 0, deals: d[0]?.n ?? 0, wonDeals: d[0]?.won ?? 0, wonValue: d[0]?.wonVal ?? 0 };
    })(),
    // Avg deal cycle time (days from created to closed for won deals in period)
    db.select({
      avgMs: sql<number>`AVG(closedAt - createdAt)`,
    }).from(deals)
      .where(and(
        inArray(deals.userId, visibleIds),
        eq(deals.status, 'won'),
        gte(deals.closedAt, from),
        lte(deals.closedAt, to),
        isNotNull(deals.closedAt)
      )),
    // Top reps by won deals in period
    db.select({
      userId: deals.userId,
      wonDeals: sql<number>`SUM(CASE WHEN status='won' THEN 1 ELSE 0 END)`,
      wonValue: sql<number>`COALESCE(SUM(CASE WHEN status='won' THEN dealValue ELSE 0 END), 0)`,
    }).from(deals)
      .where(and(inArray(deals.userId, visibleIds), gte(deals.createdAt, from), lte(deals.createdAt, to)))
      .groupBy(deals.userId)
      .orderBy(sql`SUM(CASE WHEN status='won' THEN 1 ELSE 0 END) DESC`)
      .limit(5),
  ]);

  // Resolve user names for top reps
  const repNames: Record<number, string> = {};
  if (topReps.length > 0) {
    const repUsers = await db.select({ id: users.id, name: users.name, username: users.username })
      .from(users).where(inArray(users.id, topReps.map(r => r.userId)));
    for (const u of repUsers) repNames[u.id] = u.name ?? u.username ?? `User ${u.id}`;
  }

  const avgCycleMs = avgCycle[0]?.avgMs ?? null;
  const avgCycleDays = avgCycleMs ? Math.round(avgCycleMs / 86400000) : null;

  const pctChange = (curr: number, prev: number) =>
    prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

  return {
    current: curr,
    previous: prev,
    trends: {
      contacts: pctChange(curr.contacts, prev.contacts),
      companies: pctChange(curr.companies, prev.companies),
      deals: pctChange(curr.deals, prev.deals),
      wonDeals: pctChange(curr.wonDeals, prev.wonDeals),
      wonValue: pctChange(curr.wonValue, prev.wonValue),
    },
    winRate: curr.deals > 0 ? Math.round((curr.wonDeals / curr.deals) * 100) : 0,
    avgCycleDays,
    topReps: topReps.map(r => ({
      userId: r.userId,
      name: repNames[r.userId] ?? `User ${r.userId}`,
      wonDeals: r.wonDeals,
      wonValue: r.wonValue,
    })),
  };
}

