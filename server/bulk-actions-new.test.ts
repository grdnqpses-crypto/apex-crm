import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { contacts, companies } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function createAuthContext(overrides = {}) {
  return {
    user: {
      id: 1,
      openId: "test-open-id",
      name: "Test User",
      email: "test@example.com",
      role: "admin" as const,
      systemRole: "developer" as const,
      tenantCompanyId: 1,
      ...overrides,
    },
    req: { headers: { origin: "http://localhost:3000" } } as any,
    res: {} as any,
  };
}

describe("Bulk Actions - Fill Smart Properties", () => {
  let contactId: number;
  let companyId: number;

  beforeAll(async () => {
    const ctx = await createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const contact = await caller.contacts.create({
      firstName: "Bulk",
      lastName: "Test",
      email: "bulk-test@example.com",
    });
    contactId = contact.id;
    const company = await caller.companies.create({ name: "Bulk Test Co" });
    companyId = company.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (db) {
      if (contactId) await db.delete(contacts).where(eq(contacts.id, contactId));
      if (companyId) await db.delete(companies).where(eq(companies.id, companyId));
    }
  });

  it("should fill smart properties for contacts", async () => {
    const ctx = await createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bulkActions.fillSmartProperties({
      entityType: "contacts",
      ids: [contactId],
    });
    expect(result).toBeDefined();
    expect(result.processed).toBeGreaterThanOrEqual(0);
  });

  it("should fill smart properties for companies", async () => {
    const ctx = await createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bulkActions.fillSmartProperties({
      entityType: "companies",
      ids: [companyId],
    });
    expect(result).toBeDefined();
    expect(result.processed).toBeGreaterThanOrEqual(0);
  });
});

describe("Bulk Actions - Create Tasks", () => {
  let contactId: number;

  beforeAll(async () => {
    const ctx = await createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const contact = await caller.contacts.create({
      firstName: "Task",
      lastName: "Target",
      email: "task-target@example.com",
    });
    contactId = contact.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (db && contactId) {
      await db.delete(contacts).where(eq(contacts.id, contactId));
    }
  });

  it("should create tasks for selected contacts", async () => {
    const ctx = await createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bulkActions.createBulkTasks({
      entityType: "contacts",
      ids: [contactId],
      title: "Follow up with contact",
      taskType: "follow_up",
      priority: "medium",
    });
    expect(result).toBeDefined();
    expect(result.created).toBeGreaterThanOrEqual(1);
  });
});

describe("Bulk Actions - Track Activity", () => {
  let contactId: number;

  beforeAll(async () => {
    const ctx = await createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const contact = await caller.contacts.create({
      firstName: "Activity",
      lastName: "Track",
      email: "activity-track@example.com",
    });
    contactId = contact.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (db && contactId) {
      await db.delete(contacts).where(eq(contacts.id, contactId));
    }
  });

  it("should log activity for selected contacts", async () => {
    const ctx = await createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bulkActions.trackBulkActivity({
      entityType: "contacts",
      ids: [contactId],
      activityType: "note",
      subject: "Bulk activity tracked",
    });
    expect(result).toBeDefined();
    expect(result.logged).toBeGreaterThanOrEqual(1);
  });
});
