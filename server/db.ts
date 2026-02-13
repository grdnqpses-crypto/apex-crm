import { eq, and, desc, asc, sql, like, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  contacts, companies, deals, pipelines, pipelineStages,
  activities, tasks, emailTemplates, emailCampaigns,
  domainHealth, segments, workflows, abTests,
  apiKeys, webhooks, webhookLogs,
  type Contact, type InsertContact,
  type Company, type InsertCompany,
  type Deal, type InsertDeal,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
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
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Contacts ───
export async function listContacts(userId: number, opts?: { search?: string; stage?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq(contacts.userId, userId)];
  if (opts?.stage) conditions.push(eq(contacts.lifecycleStage, opts.stage as any));
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

export async function createContact(data: Omit<InsertContact, 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(contacts).values(data);
  return result[0].insertId;
}

export async function updateContact(id: number, userId: number, data: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contacts).set({ ...data, updatedAt: Date.now() }).where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
}

export async function deleteContact(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
}

// ─── Companies ───
export async function listCompanies(userId: number, opts?: { search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq(companies.userId, userId)];
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

export async function createCompany(data: Omit<InsertCompany, 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(companies).values(data);
  return result[0].insertId;
}

export async function updateCompany(id: number, userId: number, data: Partial<InsertCompany>) {
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

export async function createDeal(data: Omit<InsertDeal, 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(deals).values(data);
  return result[0].insertId;
}

export async function updateDeal(id: number, userId: number, data: Partial<InsertDeal>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(deals).set({ ...data, updatedAt: Date.now() }).where(and(eq(deals.id, id), eq(deals.userId, userId)));
}

export async function deleteDeal(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(deals).where(and(eq(deals.id, id), eq(deals.userId, userId)));
}

// ─── Activities ───
export async function listActivities(userId: number, opts?: { contactId?: number; companyId?: number; dealId?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(activities.userId, userId)];
  if (opts?.contactId) conditions.push(eq(activities.contactId, opts.contactId));
  if (opts?.companyId) conditions.push(eq(activities.companyId, opts.companyId));
  if (opts?.dealId) conditions.push(eq(activities.dealId, opts.dealId));
  return db.select().from(activities).where(and(...conditions)).orderBy(desc(activities.createdAt)).limit(opts?.limit ?? 50);
}

export async function createActivity(data: { userId: number; contactId?: number; companyId?: number; dealId?: number; type: any; subject?: string; body?: string; metadata?: Record<string, unknown> }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(activities).values({ ...data, createdAt: Date.now() });
}

// ─── Tasks ───
export async function listTasks(userId: number, opts?: { status?: string; contactId?: number; dealId?: number; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [eq(tasks.userId, userId)];
  if (opts?.status) conditions.push(eq(tasks.status, opts.status as any));
  if (opts?.contactId) conditions.push(eq(tasks.contactId, opts.contactId));
  if (opts?.dealId) conditions.push(eq(tasks.dealId, opts.dealId));
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(tasks).where(where).orderBy(desc(tasks.createdAt)).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0),
    db.select({ count: sql<number>`count(*)` }).from(tasks).where(where),
  ]);
  return { items, total: countResult[0]?.count ?? 0 };
}

export async function createTask(data: { userId: number; assignedTo?: number; contactId?: number; dealId?: number; title: string; description?: string; dueDate?: number; priority?: any }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(tasks).values({ ...data, status: "todo", createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateTask(id: number, userId: number, data: Partial<{ title: string; description: string; dueDate: number; priority: any; status: any; assignedTo: number }>) {
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

export async function createEmailTemplate(data: { userId: number; name: string; subject: string; htmlContent: string; jsonContent?: Record<string, unknown>; category?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(emailTemplates).values({ ...data, isSystem: false, createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateEmailTemplate(id: number, userId: number, data: Partial<{ name: string; subject: string; htmlContent: string; jsonContent: Record<string, unknown>; category: string }>) {
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

export async function createCampaign(data: { userId: number; name: string; subject?: string; fromName?: string; fromEmail?: string; htmlContent?: string; templateId?: number; segmentId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(emailCampaigns).values({ ...data, status: "draft", createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateCampaign(id: number, userId: number, data: Partial<Record<string, unknown>>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(emailCampaigns).set({ ...data as any, updatedAt: Date.now() }).where(and(eq(emailCampaigns.id, id), eq(emailCampaigns.userId, userId)));
}

export async function deleteCampaign(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(emailCampaigns).where(and(eq(emailCampaigns.id, id), eq(emailCampaigns.userId, userId)));
}

// ─── Domain Health ───
export async function listDomainHealth(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(domainHealth).where(eq(domainHealth.userId, userId)).orderBy(desc(domainHealth.createdAt));
}

export async function createDomainHealth(data: { userId: number; domain: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(domainHealth).values({ ...data, createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateDomainHealth(id: number, userId: number, data: Partial<Record<string, unknown>>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(domainHealth).set({ ...data as any, updatedAt: Date.now() }).where(and(eq(domainHealth.id, id), eq(domainHealth.userId, userId)));
}

// ─── Segments ───
export async function listSegments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(segments).where(eq(segments.userId, userId)).orderBy(desc(segments.createdAt));
}

export async function createSegment(data: { userId: number; name: string; description?: string; filters?: Record<string, unknown>[]; isDynamic?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(segments).values({ ...data, createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateSegment(id: number, userId: number, data: Partial<Record<string, unknown>>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(segments).set({ ...data as any, updatedAt: Date.now() }).where(and(eq(segments.id, id), eq(segments.userId, userId)));
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

export async function createWorkflow(data: { userId: number; name: string; description?: string; trigger?: Record<string, unknown>; steps?: Record<string, unknown>[] }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(workflows).values({ ...data, status: "draft", createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateWorkflow(id: number, userId: number, data: Partial<Record<string, unknown>>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(workflows).set({ ...data as any, updatedAt: Date.now() }).where(and(eq(workflows.id, id), eq(workflows.userId, userId)));
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

export async function createAbTest(data: { userId: number; name: string; type: any; campaignId?: number; variants?: Record<string, unknown>[]; sampleSize?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(abTests).values({ ...data, status: "draft", createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateAbTest(id: number, userId: number, data: Partial<Record<string, unknown>>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(abTests).set({ ...data as any, updatedAt: Date.now() }).where(and(eq(abTests.id, id), eq(abTests.userId, userId)));
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

export async function createApiKey(data: { userId: number; name: string; keyHash: string; keyPrefix: string; permissions?: string[]; expiresAt?: number }) {
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

export async function createWebhook(data: { userId: number; name: string; url: string; events?: string[]; secret?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = Date.now();
  const result = await db.insert(webhooks).values({ ...data, isActive: true, createdAt: now, updatedAt: now });
  return result[0].insertId;
}

export async function updateWebhook(id: number, userId: number, data: Partial<{ name: string; url: string; events: string[]; isActive: boolean }>) {
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
  if (!db) return { totalContacts: 0, totalCompanies: 0, totalDeals: 0, openDeals: 0, wonDeals: 0, lostDeals: 0, totalValue: 0, wonValue: 0, totalCampaigns: 0, totalTasks: 0, pendingTasks: 0 };
  const [contactCount, companyCount, dealStats, campaignCount, taskStats] = await Promise.all([
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
      pending: sql<number>`SUM(CASE WHEN status IN ('todo', 'in_progress') THEN 1 ELSE 0 END)`,
    }).from(tasks).where(eq(tasks.userId, userId)),
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
  };
}
