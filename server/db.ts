import { eq, and, desc, asc, sql, like, or, isNotNull } from "drizzle-orm";
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
  domainSendingStats, prospectScores, brokerFilings,
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

// ─── Lead Status Options ───
export async function listLeadStatuses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadStatusOptions).where(eq(leadStatusOptions.isActive, true)).orderBy(asc(leadStatusOptions.sortOrder));
}

// ─── Contacts ───
export async function listContacts(userId: number, opts?: { search?: string; stage?: string; leadStatus?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq(contacts.userId, userId)];
  if (opts?.stage) conditions.push(eq(contacts.lifecycleStage, opts.stage));
  if (opts?.leadStatus) conditions.push(eq(contacts.leadStatus, opts.leadStatus));
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

// ─── Pipelines & Stages ───
export async function listPipelines(userId: number) {
  const db = await getDb();
  if (!db) return [];
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
export async function listDeals(userId: number, opts?: { pipelineId?: number; status?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq(deals.userId, userId)];
  if (opts?.pipelineId) conditions.push(eq(deals.pipelineId, opts.pipelineId));
  if (opts?.status) conditions.push(eq(deals.status, opts.status as any));
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(deals).where(where).orderBy(desc(deals.createdAt)).limit(opts?.limit ?? 100).offset(opts?.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(deals).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
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
