import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { COOKIE_NAME } from "../shared/const";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@apexcrm.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    ctx: {
      user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    },
    clearedCookies,
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("auth", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user?.openId).toBe("test-user-001");
  });

  it("returns null when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });

  it("logout clears session cookie", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("leadStatuses", () => {
  it("returns 25+ logistics-specific lead statuses", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const statuses = await caller.leadStatuses.list();
    expect(statuses.length).toBeGreaterThanOrEqual(25);
    // leadStatuses.list returns objects with label field
    const names = statuses.map((s: any) => s.label ?? s.name ?? s);
    expect(names).toContain("Qualified");
    expect(names).toContain("BOL Lead");
    expect(names).toContain("Under Contract");
    expect(names).toContain("Customer");
  });
});

describe("contacts CRUD", () => {
  it("rejects unauthenticated access", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.contacts.list({ limit: 10 })).rejects.toThrow();
  });

  it("creates a contact with expanded fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.contacts.create({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      jobTitle: "Logistics Manager",
      leadStatus: "Qualified",
      directPhone: "555-0100",
      city: "Atlanta",
      country: "USA",
      freightVolume: "50 loads/month",
      customerType: "Shipper",
      decisionMakerRole: "Primary DM",
    });
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
  });

  it("lists contacts with filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const list = await caller.contacts.list({ leadStatus: "Qualified", limit: 10 });
    expect(list).toHaveProperty("items");
    expect(list).toHaveProperty("total");
    expect(Array.isArray(list.items)).toBe(true);
  });

  it("gets and updates a contact", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.contacts.create({ firstName: "Update", lastName: "Test" });
    const contact = await caller.contacts.get({ id: created.id });
    expect(contact?.firstName).toBe("Update");
    await caller.contacts.update({ id: created.id, leadStatus: "Hot", city: "Dallas" });
    const updated = await caller.contacts.get({ id: created.id });
    expect(updated?.leadStatus).toBe("Hot");
    expect(updated?.city).toBe("Dallas");
  });

  it("deletes a contact", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.contacts.create({ firstName: "Delete", lastName: "Me" });
    const result = await caller.contacts.delete({ id: created.id });
    expect(result.success).toBe(true);
  });
});

describe("companies CRUD", () => {
  it("rejects unauthenticated access", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.companies.list({ limit: 10 })).rejects.toThrow();
  });

  it("creates a company with logistics fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.companies.create({
      name: "Acme Logistics",
      domain: "acmelogistics.com",
      companyType: "Manufacturer",
      industry: "Transportation",
      leadStatus: "Customer",
      creditTerms: "Net 30",
      paymentStatus: "Current",
    });
    expect(result.id).toBeDefined();
  });

  it("lists, updates, and deletes companies", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const list = await caller.companies.list({ limit: 10 });
    expect(Array.isArray(list.items)).toBe(true);
    const created = await caller.companies.create({ name: "Test Corp" });
    await caller.companies.update({ id: created.id, leadStatus: "Hot" });
    const result = await caller.companies.delete({ id: created.id });
    expect(result.success).toBe(true);
  });
});

describe("pipelines and deals", () => {
  it("creates pipeline with stages and deals", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const pipeline = await caller.pipelines.create({
      name: "Sales Pipeline",
      stages: [
        { name: "Prospecting", probability: 10, color: "#3B82F6" },
        { name: "Closed Won", probability: 100, color: "#22C55E" },
      ],
    });
    expect(pipeline.id).toBeDefined();
    const stages = await caller.pipelines.stages({ pipelineId: pipeline.id });
    expect(stages.length).toBe(2);
    const deal = await caller.deals.create({
      name: "Big Deal",
      pipelineId: pipeline.id,
      stageId: stages[0].id,
      value: 50000,
      priority: "high",
    });
    expect(deal.id).toBeDefined();
    const deals = await caller.deals.list({ pipelineId: pipeline.id });
    expect(deals.items.length).toBeGreaterThan(0);
  });
});

describe("activities", () => {
  it("creates note, call, email, and meeting activities", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const contact = await caller.contacts.create({ firstName: "Activity", lastName: "Test" });
    await caller.activities.create({ contactId: contact.id, type: "note", subject: "Test note", body: "Note body" });
    await caller.activities.create({ contactId: contact.id, type: "call", subject: "Outbound call", callOutcome: "Connected", callType: "Outbound", callDuration: 15 });
    await caller.activities.create({ contactId: contact.id, type: "email", subject: "Follow up", emailTo: "test@test.com" });
    await caller.activities.create({ contactId: contact.id, type: "meeting", subject: "Quarterly review", meetingLocation: "Zoom", meetingOutcome: "Completed" });
    const activities = await caller.activities.list({ contactId: contact.id });
    expect(activities.length).toBeGreaterThanOrEqual(4);
  });
});

describe("tasks CRUD", () => {
  it("creates task with expanded fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tasks.create({
      title: "Follow up with shipper",
      taskType: "call",
      priority: "high",
      queue: "Prospecting Calls",
      dueDate: Date.now() + 86400000,
      dueTime: "14:00",
      isRecurring: true,
      recurringFrequency: "weekly",
    });
    expect(result.id).toBeDefined();
  });

  it("filters tasks by type and queue", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const list = await caller.tasks.list({ taskType: "call", limit: 10 });
    expect(Array.isArray(list.items)).toBe(true);
  });

  it("completes and deletes tasks", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const task = await caller.tasks.create({ title: "Complete me", taskType: "to_do" });
    await caller.tasks.update({ id: task.id, status: "completed", completedAt: Date.now() });
    const result = await caller.tasks.delete({ id: task.id });
    expect(result.success).toBe(true);
  });
});

describe("email templates", () => {
  it("creates and lists templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.emailTemplates.create({ name: "Welcome", subject: "Welcome {{name}}", htmlContent: "<h1>Welcome</h1>", category: "Onboarding" });
    const list = await caller.emailTemplates.list();
    expect(list.length).toBeGreaterThan(0);
  });
});

describe("campaigns", () => {
  it("creates and lists campaigns", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.campaigns.create({ name: "Q1 Outreach", subject: "New Rates", fromName: "Sales", fromEmail: "sales@acme.com" });
    const list = await caller.campaigns.list({ limit: 10 });
    expect(list.items.length).toBeGreaterThan(0);
  });

  it("analyzes spam score via LLM", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campaigns.analyzeSpam({
      subject: "Important shipping update",
      htmlContent: "<p>Dear customer, here are your updated rates.</p>",
      fromName: "John",
    });
    expect(typeof result.score).toBe("number");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.issues)).toBe(true);
  }, 30000);
});

describe("SMTP accounts", () => {
  it("creates, updates, and manages SMTP accounts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.smtpAccounts.create({
      emailAddress: "sales@testdomain.com",
      displayName: "Sales",
      domain: "testdomain.com",
      smtpHost: "mail.testdomain.com",
      smtpPort: 587,
      smtpUsername: "sales@testdomain.com",
      smtpPassword: "test-pass",
      useTls: true,
      dailyLimit: 400,
    });
    expect(created.id).toBeDefined();
    await caller.smtpAccounts.update({ id: created.id, isActive: false });
    await caller.smtpAccounts.resetDailyCounts();
    const list = await caller.smtpAccounts.list();
    expect(list.length).toBeGreaterThan(0);
  });
});

describe("domain health", () => {
  it("creates and updates domain health", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.domainHealth.create({ domain: "test-health.com", mxServer: "mail.test.com" });
    await caller.domainHealth.update({ id: created.id, spfStatus: "pass", dkimStatus: "pass", dmarcStatus: "pass", reputationScore: 95 });
    const list = await caller.domainHealth.list();
    expect(list.length).toBeGreaterThan(0);
  });

  it("checks domain authentication via LLM", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.domainHealth.checkAuth({ domain: "example.com" });
    expect(result).toHaveProperty("spf");
    expect(result).toHaveProperty("dkim");
    expect(result).toHaveProperty("dmarc");
    expect(typeof result.overallScore).toBe("number");
  }, 30000);
});

describe("segments", () => {
  it("creates and lists segments", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.segments.create({ name: "High-value", isDynamic: true, filters: [{ field: "freightVolume", op: "gt", value: "50" }] });
    const list = await caller.segments.list();
    expect(list.length).toBeGreaterThan(0);
  });
});

describe("workflows", () => {
  it("creates and lists workflows", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.workflows.create({ name: "Lead Nurture", trigger: { event: "contact_created" }, steps: [{ type: "send_email" }] });
    const list = await caller.workflows.list();
    expect(list.length).toBeGreaterThan(0);
  });
});

describe("A/B tests", () => {
  it("creates and lists A/B tests", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.abTests.create({ name: "Subject Test", type: "subject_line", variants: [{ name: "A" }, { name: "B" }], sampleSize: 500 });
    const list = await caller.abTests.list();
    expect(list.length).toBeGreaterThan(0);
  });
});

describe("API keys", () => {
  it("creates API key with apex_ prefix", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.apiKeys.create({ name: "Test Key", permissions: ["contacts:read"] });
    expect(result.key.startsWith("apex_")).toBe(true);
    const list = await caller.apiKeys.list();
    expect(list.length).toBeGreaterThan(0);
  });
});

describe("webhooks", () => {
  it("creates and lists webhooks", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.webhooks.create({ name: "Contact Hook", url: "https://example.com/hook", events: ["contact.created"] });
    const list = await caller.webhooks.list();
    expect(list.length).toBeGreaterThan(0);
  });
});

describe("dashboard", () => {
  it("returns all expected stats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.stats();
    // Verify the stats object has expected properties
    expect(stats).toBeDefined();
    expect(typeof stats).toBe("object");
    const keys = Object.keys(stats as any);
    expect(keys.length).toBeGreaterThan(5);
    // Key fields should exist
    expect(stats).toHaveProperty("totalContacts");
    expect(stats).toHaveProperty("totalCompanies");
    expect(stats).toHaveProperty("totalDeals");
  });
});
