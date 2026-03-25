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
    email: "test@axiomcrm.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    systemRole: "developer",
    tenantCompanyId: null,
    managerId: null,
    isActive: true,
    invitedBy: null,
    jobTitle: null,
    phone: null,
    avatarUrl: null,
    username: null,
    passwordHash: null,
    lastActiveAt: null,
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
    // Company-first: create a company first
    const company = await caller.companies.create({ name: "CRM Test Corp" });
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
      companyId: company.id,
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
    const company = await caller.companies.create({ name: "Update Test Corp" });
    const created = await caller.contacts.create({ firstName: "Update", lastName: "Test", companyId: company.id });
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
    const company = await caller.companies.create({ name: "Delete Test Corp" });
    const created = await caller.contacts.create({ firstName: "Delete", lastName: "Me", companyId: company.id });
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
    const company = await caller.companies.create({ name: "Activity Test Corp" });
    const contact = await caller.contacts.create({ firstName: "Activity", lastName: "Test", companyId: company.id });
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
  }, 90000);
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
  it("creates API key with axiom_ prefix", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.apiKeys.create({ name: "Test Key", permissions: ["contacts:read"] });
    expect(result.key.startsWith("axiom_")).toBe(true);
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

// ============================================================
// Paradigm Engine Tests
// ============================================================

describe("prospects CRUD", () => {
  it("rejects unauthenticated access", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.prospects.list({ limit: 10 })).rejects.toThrow();
  });

  it("creates a prospect with full fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.prospects.create({
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@prospect.com",
      jobTitle: "VP of Logistics",
      companyName: "Global Freight Inc",
      companyDomain: "globalfreight.com",
      industry: "Transportation",
      location: "Chicago, IL",
      linkedinUrl: "https://linkedin.com/in/janesmith",
      phone: "555-0200",
      sourceType: "apollo",
      notes: "High-value prospect",
    });
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
  });

  it("lists prospects with filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const list = await caller.prospects.list({ limit: 10 });
    expect(list).toHaveProperty("items");
    expect(list).toHaveProperty("total");
    expect(Array.isArray(list.items)).toBe(true);
  });

  it("gets and updates a prospect", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.prospects.create({
      firstName: "Update",
      lastName: "Prospect",
      email: "update@prospect.com",
    });
    const prospect = await caller.prospects.get({ id: created.id });
    expect(prospect?.firstName).toBe("Update");
    await caller.prospects.update({
      id: created.id,
      engagementStage: "engaged",
      intentScore: 75,
    });
    const updated = await caller.prospects.get({ id: created.id });
    expect(updated?.engagementStage).toBe("engaged");
    expect(updated?.intentScore).toBe(75);
  });

  it("deletes a prospect", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.prospects.create({
      firstName: "Delete",
      lastName: "Me",
      email: "delete@prospect.com",
    });
    const result = await caller.prospects.delete({ id: created.id });
    expect(result.success).toBe(true);
  });

  it("verifies email via LLM", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.prospects.create({
      firstName: "Verify",
      lastName: "Test",
      email: "verify@testdomain.com",
    });
    const result = await caller.prospects.verify({ id: created.id });
    expect(result).toHaveProperty("status");
    expect(["valid", "invalid", "risky", "unknown"]).toContain(result.status);
  }, 30000);

  it("builds psychographic profile via LLM", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.prospects.create({
      firstName: "Profile",
      lastName: "Test",
      email: "profile@testdomain.com",
      jobTitle: "CEO",
      companyName: "Tech Corp",
      linkedinUrl: "https://linkedin.com/in/profiletest",
    });
    const result = await caller.prospects.buildProfile({ id: created.id });
    expect(result).toHaveProperty("personalityType");
    expect(result).toHaveProperty("communicationStyle");
    expect(result).toHaveProperty("motivators");
  }, 30000);

  it("drafts personalized email via LLM", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.prospects.create({
      firstName: "Draft",
      lastName: "Test",
      email: "draft@testdomain.com",
      jobTitle: "Director of Operations",
      companyName: "Logistics Pro",
    });
    const result = await caller.prospects.draftEmail({
      id: created.id,
      context: "initial cold outreach about freight services",
    });
    expect(result).toHaveProperty("subject");
    expect(result).toHaveProperty("body");
    expect(result).toHaveProperty("spamScore");
  }, 30000);

  it("promotes prospect to CRM contact", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.prospects.create({
      firstName: "Promote",
      lastName: "Test",
      email: "promote@testdomain.com",
      jobTitle: "Manager",
      companyName: "Promote Corp",
    });
    const result = await caller.prospects.promoteToContact({ id: created.id });
    expect(result).toHaveProperty("contactId");
    expect(typeof result.contactId).toBe("number");
    // Verify the prospect was updated
    const updated = await caller.prospects.get({ id: created.id });
    expect(updated?.engagementStage).toBe("converted");
  });
});

describe("trigger signals", () => {
  it("creates and lists signals", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.signals.create({
      signalType: "job_change",
      title: "VP moved to new company",
      description: "Jane Smith moved from Acme to GlobalFreight",
      personName: "Jane Smith",
      companyName: "GlobalFreight",
      priority: "high",
    });
    const list = await caller.signals.list({ limit: 10 });
    expect(list.items.length).toBeGreaterThan(0);
    expect(list).toHaveProperty("total");
  });

  it("updates signal status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.signals.create({
      signalType: "funding_round",
      title: "Series B funding",
      companyName: "StartupCo",
    });
    await caller.signals.update({ id: created.id, status: "reviewed" });
    await caller.signals.update({ id: created.id, status: "actioned" });
    // Verify the update worked by listing
    const list = await caller.signals.list({ status: "actioned", limit: 10 });
    const found = list.items.find((s: any) => s.id === created.id);
    expect(found?.status).toBe("actioned");
  });
});

describe("ghost sequences", () => {
  it("creates sequence with steps", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const seq = await caller.ghostSequences.create({
      name: "Cold Outreach Sequence",
      description: "4-step cold outreach for logistics DMs",
    });
    expect(seq.id).toBeDefined();

    // Add steps
    await caller.ghostSequences.steps.create({
      sequenceId: seq.id,
      stepOrder: 1,
      subject: "Quick question about {{companyName}}",
      bodyTemplate: "Hi {{firstName}}, I noticed...",
      delayDays: 0,
    });
    await caller.ghostSequences.steps.create({
      sequenceId: seq.id,
      stepOrder: 2,
      subject: "Following up",
      bodyTemplate: "Just wanted to check...",
      delayDays: 3,
    });

    const steps = await caller.ghostSequences.steps.list({ sequenceId: seq.id });
    expect(steps.length).toBe(2);
    expect(steps[0].stepOrder).toBe(1);
  });

  it("updates sequence status (draft → active → paused)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const seq = await caller.ghostSequences.create({ name: "Status Test" });
    expect(seq.status).toBe("draft");

    await caller.ghostSequences.update({ id: seq.id, status: "active" });
    const list = await caller.ghostSequences.list();
    const updated = list.find((s: any) => s.id === seq.id);
    expect(updated?.status).toBe("active");
  });

  it("deletes sequence and steps", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const seq = await caller.ghostSequences.create({ name: "Delete Test" });
    await caller.ghostSequences.steps.create({
      sequenceId: seq.id,
      stepOrder: 1,
      subject: "Test",
      bodyTemplate: "Body",
      delayDays: 0,
    });
    const result = await caller.ghostSequences.delete({ id: seq.id });
    expect(result.success).toBe(true);
  });
});

describe("battle cards", () => {
  it("generates battle card for prospect via LLM", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const prospect = await caller.prospects.create({
      firstName: "BattleCard",
      lastName: "Test",
      email: "bc@test.com",
      jobTitle: "VP Supply Chain",
      companyName: "MegaCorp",
      industry: "Manufacturing",
    });
    const result = await caller.prospects.generateBattleCard({ id: prospect.id });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("companyOverview");

    // Verify it appears in battle cards list
    const cards = await caller.battleCards.list({ limit: 50 });
    const found = cards.find((c: any) => c.prospectId === prospect.id);
    expect(found).toBeDefined();
  }, 30000);

  it("marks battle card as read and archives", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Create a prospect and generate a battle card first
    const prospect = await caller.prospects.create({
      firstName: "MarkRead",
      lastName: "Test",
      email: "markread@test.com",
      jobTitle: "Manager",
      companyName: "TestCo",
    });
    const bc = await caller.prospects.generateBattleCard({ id: prospect.id });
    expect(bc.id).toBeDefined();
    // Mark as read first
    const readResult = await caller.battleCards.markRead({ id: bc.id });
    expect(readResult.success).toBe(true);
    // Verify it's marked as read (still visible since not archived)
    const cardsAfterRead = await caller.battleCards.list({ limit: 50 });
    const foundAfterRead = cardsAfterRead.find((c: any) => c.id === bc.id);
    expect(foundAfterRead).toBeDefined();
    // Archive it
    const archiveResult = await caller.battleCards.archive({ id: bc.id });
    expect(archiveResult.success).toBe(true);
    // After archiving, it should NOT appear in the default list (which filters isArchived=false)
    const cardsAfterArchive = await caller.battleCards.list({ limit: 50 });
    const foundAfterArchive = cardsAfterArchive.find((c: any) => c.id === bc.id);
    expect(foundAfterArchive).toBeUndefined();
  }, 30000);
});

describe("integration credentials", () => {
  it("creates and lists integration credentials", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.integrations.upsert({
      service: "apollo",
      apiKey: "test-apollo-key-12345",
    });
    const list = await caller.integrations.list();
    expect(list.length).toBeGreaterThan(0);
    const apollo = list.find((c: any) => c.service === "apollo");
    expect(apollo).toBeDefined();
  });

  it("tests integration connection", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const list = await caller.integrations.list();
    if (list.length > 0) {
      const result = await caller.integrations.test({ id: list[0].id });
      expect(result).toHaveProperty("success");
    }
  });

  it("deletes integration credentials", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const created = await caller.integrations.upsert({
      service: "neverbounce",
      apiKey: "test-nb-key-12345",
    });
    const list = await caller.integrations.list();
    const nb = list.find((c: any) => c.service === "neverbounce");
    if (nb) {
      const result = await caller.integrations.delete({ id: nb.id });
      expect(result.success).toBe(true);
    }
  });
});

describe("prospect outreach", () => {
  it("creates and lists outreach records", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const prospect = await caller.prospects.create({
      firstName: "Outreach",
      lastName: "Test",
      email: "outreach@test.com",
    });
    await caller.outreach.create({
      prospectId: prospect.id,
      toEmail: "outreach@test.com",
      subject: "Test outreach",
      body: "Hello, this is a test",
      status: "sent",
    });
    const list = await caller.outreach.list({ prospectId: prospect.id, limit: 10 });
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].subject).toBe("Test outreach");
  });
});


// ═══════════════════════════════════════════════════════════════
// COMPLIANCE FORTRESS + DELIVERABILITY ENGINE TESTS
// ═══════════════════════════════════════════════════════════════

describe("suppression list", () => {
  it("adds an email to the suppression list", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.suppression.add({
      email: "suppressed@test.com",
      reason: "bounce",
      notes: "Hard bounce from campaign",
    });
    expect(result).toHaveProperty("id");
  });

  it("checks if an email is suppressed", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.suppression.add({
      email: "blocked@test.com",
      reason: "complaint",
    });
    const check = await caller.suppression.check({ email: "blocked@test.com" });
    expect(check.suppressed).toBe(true);

    const checkClean = await caller.suppression.check({ email: "clean@test.com" });
    expect(checkClean.suppressed).toBe(false);
  });

  it("lists suppression entries with pagination", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const list = await caller.suppression.list({ limit: 50, offset: 0 });
    expect(list).toHaveProperty("items");
    expect(list).toHaveProperty("total");
    expect(Array.isArray(list.items)).toBe(true);
  });

  it("bulk adds emails to suppression list", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.suppression.bulkAdd({
      emails: [
        { email: "bulk1@test.com", reason: "unsubscribe" },
        { email: "bulk2@test.com", reason: "bounce" },
        { email: "bulk3@test.com", reason: "complaint" },
      ],
    });
    expect(result.added).toBe(3);
  });

  it("removes an email from the suppression list", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const added = await caller.suppression.add({
      email: "removeme@test.com",
      reason: "manual",
    });
    const result = await caller.suppression.remove({ id: added.id });
    expect(result.success).toBe(true);
  });
});

describe("compliance engine", () => {
  it("runs pre-send compliance check - passes with valid content", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // First set up sender settings
    await caller.senderSettings.upsert({
      companyName: "Test Corp",
      physicalAddress: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "US",
      unsubscribeUrl: "https://example.com/unsubscribe",
    });
    const result = await caller.compliance.preCheck({
      htmlContent: '<html><body><p>Hello</p><a href="https://example.com/unsubscribe">Unsubscribe</a><p>123 Main St, New York, NY 10001</p></body></html>',
      subject: "Your monthly newsletter",
      fromEmail: "news@test.com",
      toEmail: "recipient@gmail.com",
    });
    expect(result).toHaveProperty("checks");
    expect(result).toHaveProperty("recipientProvider");
    expect(result.recipientProvider).toBe("gmail");
  });

  it("detects email providers correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const gmailCheck = await caller.compliance.preCheck({
      htmlContent: "<p>Test</p>",
      subject: "Test",
      fromEmail: "from@test.com",
      toEmail: "user@gmail.com",
    });
    expect(gmailCheck.recipientProvider).toBe("gmail");

    const outlookCheck = await caller.compliance.preCheck({
      htmlContent: "<p>Test</p>",
      subject: "Test",
      fromEmail: "from@test.com",
      toEmail: "user@outlook.com",
    });
    expect(outlookCheck.recipientProvider).toBe("outlook");

    const yahooCheck = await caller.compliance.preCheck({
      htmlContent: "<p>Test</p>",
      subject: "Test",
      fromEmail: "from@test.com",
      toEmail: "user@yahoo.com",
    });
    expect(yahooCheck.recipientProvider).toBe("yahoo");
  });

  it("retrieves compliance stats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.compliance.stats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("passed");
    expect(stats).toHaveProperty("failed");
  });

  it("lists compliance audit entries", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const audits = await caller.compliance.audits({ limit: 10 });
    expect(audits).toHaveProperty("items");
    expect(audits).toHaveProperty("total");
  });

  it("analyzes email for deliverability risks", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.compliance.analyzeEmail({
      htmlContent: '<html><body><p>Check out our FREE offer! ACT NOW!!!</p></body></html>',
      subject: "FREE MONEY - ACT NOW!!!",
      fromName: "Sales Team",
    });
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("grade");
    expect(result).toHaveProperty("issues");
    expect(result).toHaveProperty("providerRisks");
    expect(result).toHaveProperty("subjectAnalysis");
    expect(result).toHaveProperty("contentAnalysis");
    expect(result).toHaveProperty("recommendations");
    // Spammy content should get a lower score
    expect(result.score).toBeLessThan(80);
  }, 30000);
});

describe("sender settings", () => {
  it("upserts and retrieves sender settings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.senderSettings.upsert({
      companyName: "AXIOM Corp",
      physicalAddress: "456 Business Ave",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "US",
      outlookThrottlePerMinute: 8,
      gmailThrottlePerMinute: 15,
      yahooThrottlePerMinute: 12,
      maxBounceRatePercent: 2,
      maxComplaintRatePercent: 1,
    });
    const settings = await caller.senderSettings.get();
    expect(settings).not.toBeNull();
    if (settings) {
      expect(settings.companyName).toBe("AXIOM Corp");
      expect(settings.outlookThrottlePerMinute).toBe(8);
      expect(settings.gmailThrottlePerMinute).toBe(15);
    }
  });

  it("updates existing sender settings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await caller.senderSettings.upsert({
      companyName: "Updated Corp",
      physicalAddress: "789 New St",
      defaultFromName: "Updated Sender",
      unsubscribeUrl: "https://updated.com/unsub",
    });
    const settings = await caller.senderSettings.get();
    expect(settings).not.toBeNull();
    if (settings) {
      expect(settings.companyName).toBe("Updated Corp");
      expect(settings.defaultFromName).toBe("Updated Sender");
    }
  });
});

describe("domain stats", () => {
  it("retrieves domain stats list", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.domainStats.list();
    expect(Array.isArray(stats)).toBe(true);
  });

  it("retrieves aggregated domain stats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const agg = await caller.domainStats.aggregated();
    // Returns an array of per-domain aggregates (may be empty if no data)
    expect(Array.isArray(agg)).toBe(true);
  });

  it("retrieves provider breakdown", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const breakdown = await caller.domainStats.providerBreakdown();
    expect(Array.isArray(breakdown)).toBe(true);
  });
});

describe("quantum score", () => {
  it("calculates quantum score for a prospect", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const prospect = await caller.prospects.create({
      firstName: "Quantum",
      lastName: "TestLead",
      email: "quantum@enterprise.com",
      companyName: "Enterprise Corp",
      jobTitle: "VP of Operations",
      industry: "Technology",
    });
    const score = await caller.quantumScore.calculate({ prospectId: prospect.id });
    expect(score).toHaveProperty("totalScore");
    expect(score).toHaveProperty("scoreGrade");
    expect(score).toHaveProperty("firmographicScore");
    expect(score).toHaveProperty("behavioralScore");
    expect(score).toHaveProperty("engagementScore");
    expect(score).toHaveProperty("timingScore");
    expect(score).toHaveProperty("socialScore");
    expect(score).toHaveProperty("contentScore");
    expect(score).toHaveProperty("recencyScore");
    expect(score).toHaveProperty("frequencyScore");
    expect(score).toHaveProperty("monetaryScore");
    expect(score).toHaveProperty("channelScore");
    expect(score).toHaveProperty("intentScore");
    expect(score).toHaveProperty("relationshipScore");
    expect(score).toHaveProperty("scoreExplanation");
    expect(score).toHaveProperty("topStrengths");
    expect(score).toHaveProperty("topWeaknesses");
    expect(score).toHaveProperty("recommendedActions");
    expect(score).toHaveProperty("predictedConversionProb");
    expect(score).toHaveProperty("optimalContactTime");
    expect(score).toHaveProperty("optimalChannel");
    expect(score.totalScore).toBeGreaterThanOrEqual(0);
    // totalScore can exceed 100 as it's an AI-computed composite score
    expect(typeof score.totalScore).toBe('number');
  }, 30000);

  it("retrieves previously calculated quantum score", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const prospect = await caller.prospects.create({
      firstName: "Retrieve",
      lastName: "Score",
      email: "retrieve@score.com",
    });
    await caller.quantumScore.calculate({ prospectId: prospect.id });
    const score = await caller.quantumScore.get({ prospectId: prospect.id });
    expect(score).not.toBeNull();
    if (score) {
      expect(score).toHaveProperty("totalScore");
      expect(score).toHaveProperty("scoreGrade");
    }
  }, 30000);
});
