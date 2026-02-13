import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.openId).toBe("test-user-001");
    expect(result?.email).toBe("test@example.com");
  });

  it("returns null when not authenticated", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("contacts router", () => {
  it("rejects unauthenticated access to contacts.list", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.contacts.list({ limit: 10 })).rejects.toThrow();
  });

  it("contacts.list returns data structure with items and total", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.contacts.list({ limit: 10 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("contacts.create creates a contact and returns id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.contacts.create({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "+1234567890",
      lifecycleStage: "lead",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});

describe("companies router", () => {
  it("rejects unauthenticated access to companies.list", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.companies.list({ limit: 10 })).rejects.toThrow();
  });

  it("companies.list returns data structure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.companies.list({ limit: 10 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("companies.create creates a company", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.companies.create({
      name: "Acme Corp",
      domain: "acme.com",
      industry: "Technology",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});

describe("deals router", () => {
  it("rejects unauthenticated access", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.deals.list({ limit: 10 })).rejects.toThrow();
  });

  it("deals.list returns data structure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.deals.list({ limit: 10 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
  });
});

describe("pipelines router", () => {
  it("pipelines.list returns array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.pipelines.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("pipelines.create creates a pipeline with stages", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.pipelines.create({
      name: "Test Pipeline",
      stages: [
        { name: "Stage 1", probability: 25, color: "#6366f1" },
        { name: "Stage 2", probability: 75, color: "#22c55e" },
      ],
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});

describe("tasks router", () => {
  it("tasks.list returns data structure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tasks.list({ limit: 10 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });

  it("tasks.create creates a task", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tasks.create({
      title: "Follow up with client",
      priority: "high",
    });
    expect(result).toHaveProperty("id");
  });
});

describe("campaigns router", () => {
  it("campaigns.list returns data structure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campaigns.list({ limit: 10 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });

  it("campaigns.create creates a campaign", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campaigns.create({
      name: "Test Campaign",
      subject: "Hello World",
      fromName: "Test Sender",
      fromEmail: "test@example.com",
    });
    expect(result).toHaveProperty("id");
  });

  it("campaigns.analyzeSpam returns spam analysis", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campaigns.analyzeSpam({
      subject: "Buy now! Limited offer!!!",
      htmlContent: "<p>Click here to win a free prize</p>",
      fromName: "Test",
    });
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("issues");
    expect(result).toHaveProperty("overallRating");
    expect(typeof result.score).toBe("number");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.issues)).toBe(true);
  }, 30000);
});

describe("emailTemplates router", () => {
  it("emailTemplates.list returns array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.emailTemplates.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("emailTemplates.create creates a template", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.emailTemplates.create({
      name: "Welcome Email",
      subject: "Welcome {{first_name}}!",
      htmlContent: "<h1>Welcome</h1>",
      category: "Welcome",
    });
    expect(result).toHaveProperty("id");
  });
});

describe("workflows router", () => {
  it("workflows.list returns array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.workflows.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("workflows.create creates a workflow", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.workflows.create({
      name: "Lead Nurture",
      trigger: { type: "contact_created" },
      steps: [{ type: "send_email", config: {} }],
    });
    expect(result).toHaveProperty("id");
  });
});

describe("segments router", () => {
  it("segments.list returns array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.segments.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("segments.create creates a segment", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.segments.create({
      name: "High Value Leads",
      isDynamic: true,
      filters: [{ field: "leadScore", operator: "greater_than", value: "50" }],
    });
    expect(result).toHaveProperty("id");
  });
});

describe("abTests router", () => {
  it("abTests.list returns array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.abTests.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("abTests.create creates a test", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.abTests.create({
      name: "Subject Line Test",
      type: "subject_line",
      variants: [{ name: "A", value: "Hello" }, { name: "B", value: "Hi there" }],
      sampleSize: 500,
    });
    expect(result).toHaveProperty("id");
  });
});

describe("apiKeys router", () => {
  it("apiKeys.list returns array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.apiKeys.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("apiKeys.create creates a key and returns it", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.apiKeys.create({
      name: "Test Key",
      permissions: ["read"],
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("key");
    expect(typeof result.key).toBe("string");
    expect(result.key.length).toBeGreaterThan(10);
  });
});

describe("webhooks router", () => {
  it("webhooks.list returns array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.webhooks.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("webhooks.create creates a webhook", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.webhooks.create({
      name: "Test Webhook",
      url: "https://example.com/webhook",
      events: ["contact.created"],
    });
    expect(result).toHaveProperty("id");
  });
});

describe("domainHealth router", () => {
  it("domainHealth.list returns array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.domainHealth.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("domainHealth.create adds a domain", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.domainHealth.create({
      domain: "example.com",
    });
    expect(result).toHaveProperty("id");
  });

  it("domainHealth.checkAuth returns auth analysis", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.domainHealth.checkAuth({
      domain: "example.com",
    });
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("spf");
    expect(result).toHaveProperty("dkim");
    expect(result).toHaveProperty("dmarc");
    expect(typeof result.overallScore).toBe("number");
  }, 30000);
});

describe("dashboard router", () => {
  it("dashboard.stats returns all expected fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.stats();
    expect(result).toHaveProperty("totalContacts");
    expect(result).toHaveProperty("totalCompanies");
    expect(result).toHaveProperty("totalDeals");
    expect(result).toHaveProperty("openDeals");
    expect(result).toHaveProperty("wonDeals");
    expect(result).toHaveProperty("lostDeals");
    expect(result).toHaveProperty("totalValue");
    expect(result).toHaveProperty("wonValue");
    expect(result).toHaveProperty("totalCampaigns");
    expect(result).toHaveProperty("totalTasks");
    expect(result).toHaveProperty("pendingTasks");
    expect(typeof result.totalContacts).toBe("number");
  });
});

describe("activities router", () => {
  it("activities.list returns array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.activities.list({ contactId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});
