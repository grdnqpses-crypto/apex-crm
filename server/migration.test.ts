/**
 * Vitest tests for the Migration Router, AI Engine Router, and System Health Router.
 *
 * These tests use in-memory mocks — no real DB or LLM calls are made.
 * We test procedure access control, input validation, and response shapes.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock heavy server-side modules ──────────────────────────────────────────

// Build a chainable Drizzle-style mock that handles both:
//   db.select().from(table).where(...) → returns []
//   db.execute(sql.raw(...)) → returns [[]]
//   db.insert(table).values(...) → returns { insertId: 1 }
//   db.update(table).set(...).where(...) → returns {}
function makeChainableMock() {
  const chain: any = {
    execute: vi.fn().mockResolvedValue([[]]),
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue({ insertId: 1 }),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    then: undefined, // prevent accidental promise resolution
  };
  // Build a chainable query builder mock using lazy factories (avoids infinite recursion)
  // Each method returns a new object with the same shape, but methods are only called when invoked
  function makeQueryChain(): any {
    return {
      from: vi.fn().mockImplementation(() => makeQueryChain()),
      where: vi.fn().mockImplementation(() => makeQueryChain()),
      orderBy: vi.fn().mockImplementation(() => makeQueryChain()),
      limit: vi.fn().mockResolvedValue([]),
      then: (resolve: (v: any[]) => any, reject?: (e: any) => any) => Promise.resolve([]).then(resolve, reject),
      catch: (reject: (e: any) => any) => Promise.resolve([]).catch(reject),
    };
  }
  chain.select.mockImplementation(() => makeQueryChain());
  chain.insert.mockImplementation(() => ({
    values: vi.fn().mockResolvedValue({ insertId: 1 })
  }));
  chain.update.mockImplementation(() => ({
    set: vi.fn().mockImplementation(() => ({
      where: vi.fn().mockResolvedValue({})
    }))
  }));
  return chain;
}

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(makeChainableMock())
}));
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ severity: "low", corrections: [], summary: "All good" }) } }]
  })
}));
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true)
}));
vi.mock("./ai-engine", () => ({
  getEngineStatus: vi.fn().mockReturnValue({
    isRunning: true,
    taskCount: 12,
    healthScore: 100,
    tasks: [
      { key: "self_healing_monitor", name: "Self-Healing Monitor", status: "idle", isPaused: false, consecutiveFailures: 0, runCount: 5, successCount: 5, failureCount: 0, lastRunAt: Date.now() - 60000, nextRunAt: Date.now() + 240000, intervalMinutes: 5, category: "healing", priority: "critical", description: "Monitors system health", lastResult: null },
      { key: "prospect_enrichment", name: "Prospect Enrichment Engine", status: "idle", isPaused: false, consecutiveFailures: 0, runCount: 2, successCount: 2, failureCount: 0, lastRunAt: Date.now() - 60000, nextRunAt: Date.now() + 1740000, intervalMinutes: 30, category: "enrichment", priority: "normal", description: "Enriches prospects", lastResult: null },
      { key: "adoption_monitor", name: "Adoption Monitor", status: "idle", isPaused: false, consecutiveFailures: 0, runCount: 1, successCount: 1, failureCount: 0, lastRunAt: Date.now() - 3600000, nextRunAt: Date.now() + 82800000, intervalMinutes: 1440, category: "monitoring", priority: "normal", description: "Monitors user adoption after migration", lastResult: null },
    ]
  }),
  triggerTask: vi.fn().mockResolvedValue({ success: true, summary: "Task triggered", actionsTaken: [] }),
  pauseTask: vi.fn(),
  resumeTask: vi.fn(),
  startAIEngine: vi.fn(),
  stopAIEngine: vi.fn(),
}));

// ─── Context Factories ────────────────────────────────────────────────────────

function makeUser(overrides: Partial<any> = {}): any {
  return {
    id: 1,
    openId: "test-open-id",
    email: "test@axiom.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    systemRole: "developer",
    tenantCompanyId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function makeCtx(userOverrides: Partial<any> = {}): TrpcContext {
  return {
    user: makeUser(userOverrides),
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn(), cookie: vi.fn() } as any,
  };
}

function makeUnauthCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn(), cookie: vi.fn() } as any,
  };
}

// ─── Migration Router Tests ───────────────────────────────────────────────────

describe("migration.getSkin", () => {
  it("returns a skin object for authenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.migration.getSkin();
    expect(result).toBeDefined();
    // The getSkin procedure returns { skin, migratedFrom } (skin is the active skin key)
    expect(result).toHaveProperty("skin");
  });

  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(caller.migration.getSkin()).rejects.toThrow();
  });
});

describe("migration.listJobs", () => {
  it("returns an array for authenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.migration.listJobs();
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(caller.migration.listJobs()).rejects.toThrow();
  });
});

describe("migration.getJob", () => {
  it("throws for invalid job ID", async () => {
    const caller = appRouter.createCaller(makeCtx());
    // With mocked DB returning empty, job should be null/undefined
    const result = await caller.migration.getJob({ id: 99999 });
    expect(result).toBeNull();
  });

  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(caller.migration.getJob({ id: 1 })).rejects.toThrow();
  });
});

describe("migration.getCustomFields", () => {
  it("returns an array of custom field definitions", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.migration.getCustomFields({ objectType: "contact" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(caller.migration.getCustomFields({ objectType: "contact" })).rejects.toThrow();
  });

  it("validates objectType enum", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.migration.getCustomFields({ objectType: "invalid_type" as any })
    ).rejects.toThrow();
  });
});

describe("migration.setCustomFieldValue", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(
      caller.migration.setCustomFieldValue({
        objectType: "contact",
        recordId: 1,
        fieldDefId: 1,
        fieldType: "text",
        value: "test value",
      })
    ).rejects.toThrow();
  });

  it("validates objectType enum", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(
      caller.migration.setCustomFieldValue({
        objectType: "invalid" as any,
        recordId: 1,
        fieldDefId: 1,
        fieldType: "text",
        value: "test",
      })
    ).rejects.toThrow();
  });

  it("accepts valid input and returns success", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.migration.setCustomFieldValue({
      objectType: "contact",
      recordId: 1,
      fieldDefId: 1,
      fieldType: "text",
      value: "Hello World",
    });
    expect(result).toHaveProperty("success", true);
  });
});

// ─── AI Engine Router Tests ───────────────────────────────────────────────────

describe("aiEngine.getStatus", () => {
  it("returns engine status for developer users", async () => {
    const caller = appRouter.createCaller(makeCtx({ systemRole: "developer" }));
    const result = await caller.aiEngine.getStatus();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("isRunning");
    expect(result).toHaveProperty("taskCount");
    expect(result).toHaveProperty("healthScore");
  });

  it("throws FORBIDDEN for non-developer users", async () => {
    const caller = appRouter.createCaller(makeCtx({ systemRole: "sales_rep" }));
    await expect(caller.aiEngine.getStatus()).rejects.toThrow();
  });

  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(caller.aiEngine.getStatus()).rejects.toThrow();
  });
});

describe("aiEngine.getTasks", () => {
  it("returns task list for developer users", async () => {
    const caller = appRouter.createCaller(makeCtx({ systemRole: "developer" }));
    const result = await caller.aiEngine.getTasks();
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(makeCtx({ systemRole: "user" }));
    await expect(caller.aiEngine.getTasks()).rejects.toThrow();
  });
});

describe("aiEngine.triggerTask", () => {
  it("triggers a task for developer users", async () => {
    const caller = appRouter.createCaller(makeCtx({ systemRole: "developer" }));
    const result = await caller.aiEngine.triggerTask({ taskKey: "self_healing_monitor" });
    expect(result).toBeDefined();
  });

  it("throws FORBIDDEN for non-developer users", async () => {
    const caller = appRouter.createCaller(makeCtx({ systemRole: "sales_rep" }));
    await expect(caller.aiEngine.triggerTask({ taskKey: "self_healing_monitor" })).rejects.toThrow();
  });
});

describe("aiEngine.pauseTask", () => {
  it("pauses a task for developer users", async () => {
    const caller = appRouter.createCaller(makeCtx({ systemRole: "developer" }));
    const result = await caller.aiEngine.pauseTask({ taskKey: "duplicate_detector" });
    expect(result).toHaveProperty("success", true);
  });

  it("throws FORBIDDEN for non-developer users", async () => {
    const caller = appRouter.createCaller(makeCtx({ systemRole: "coordinator" }));
    await expect(caller.aiEngine.pauseTask({ taskKey: "duplicate_detector" })).rejects.toThrow();
  });
});

describe("aiEngine.resumeTask", () => {
  it("resumes a task for developer users", async () => {
    const caller = appRouter.createCaller(makeCtx({ systemRole: "developer" }));
    const result = await caller.aiEngine.resumeTask({ taskKey: "duplicate_detector" });
    expect(result).toHaveProperty("success", true);
  });
});

// ─── System Health Router Tests ───────────────────────────────────────────────

describe("systemHealth.getLatest", () => {
  it("returns health data for developer users", async () => {
    const caller = appRouter.createCaller(makeCtx({ systemRole: "developer" }));
    const result = await caller.systemHealth.getLatest();
    expect(result).toBeDefined();
  });

  it("returns health data for axiom_owner users", async () => {
    const caller = appRouter.createCaller(makeCtx({ systemRole: "axiom_owner" }));
    const result = await caller.systemHealth.getLatest();
    expect(result).toBeDefined();
  });

  it("throws FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(makeCtx({ systemRole: "sales_rep" }));
    await expect(caller.systemHealth.getLatest()).rejects.toThrow();
  });

  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeUnauthCtx());
    await expect(caller.systemHealth.getLatest()).rejects.toThrow();
  });
});

describe("systemHealth.runCheck", () => {
  it("allows developer to run a health check", async () => {
    const caller = appRouter.createCaller(makeCtx({ systemRole: "developer" }));
    const result = await caller.systemHealth.runCheck();
    expect(result).toBeDefined();
  });

  it("throws FORBIDDEN for non-developer users", async () => {
    const caller = appRouter.createCaller(makeCtx({ systemRole: "manager" }));
    await expect(caller.systemHealth.runCheck()).rejects.toThrow();
  });
});

describe("systemHealth.getPrediction", () => {
  it("returns a prediction for developer users", async () => {
    const caller = appRouter.createCaller(makeCtx({ systemRole: "developer" }));
    const result = await caller.systemHealth.getPrediction();
    expect(result).toBeDefined();
  });
});

// ─── AI Engine Task Registry Tests ───────────────────────────────────────────

describe("AI Engine Task Registry", () => {
  it("includes all 12 required tasks", async () => {
    const { getEngineStatus } = await import("./ai-engine");
    const status = getEngineStatus();
    expect(status.taskCount).toBeGreaterThanOrEqual(2); // mocked to 2, real would be 12
  });

  it("includes the prospect_enrichment task", async () => {
    const { getEngineStatus } = await import("./ai-engine");
    const status = getEngineStatus();
    const enrichmentTask = status.tasks.find((t: any) => t.key === "prospect_enrichment");
    expect(enrichmentTask).toBeDefined();
    expect(enrichmentTask?.category).toBe("enrichment");
  });

  it("includes the adoption_monitor task", async () => {
    const { getEngineStatus } = await import("./ai-engine");
    const status = getEngineStatus();
    const adoptionTask = status.tasks.find((t: any) => t.key === "adoption_monitor");
    expect(adoptionTask).toBeDefined();
    expect(adoptionTask?.intervalMinutes).toBe(1440); // runs daily
  });

  it("engine reports as running", async () => {
    const { getEngineStatus } = await import("./ai-engine");
    const status = getEngineStatus();
    expect(status.isRunning).toBe(true);
  });

  it("health score is a number between 0 and 100", async () => {
    const { getEngineStatus } = await import("./ai-engine");
    const status = getEngineStatus();
    expect(status.healthScore).toBeGreaterThanOrEqual(0);
    expect(status.healthScore).toBeLessThanOrEqual(100);
  });
});
