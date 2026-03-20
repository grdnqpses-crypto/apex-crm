import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

function createUnauthContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

// ─── Voice Campaigns ───────────────────────────────────────────────

describe("voiceCampaigns router", () => {
  it("requires authentication for list", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.voiceCampaigns.list()).rejects.toThrow();
  });

  it("requires authentication for create", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.voiceCampaigns.create({
        name: "Test Campaign",
        script: "Hello, this is a test call.",
        voiceType: "professional",
        targetType: "contacts",
      })
    ).rejects.toThrow();
  });

  it("creates a voice campaign when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.voiceCampaigns.create({
      name: "Outbound Carrier Check",
      script: "Hi, I'm calling from REALM Logistics to verify your carrier status.",
      voiceType: "professional",
      targetType: "carriers",
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("lists voice campaigns for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const campaigns = await caller.voiceCampaigns.list();
    expect(Array.isArray(campaigns)).toBe(true);
  });
});

// ─── Call Logs ──────────────────────────────────────────────────────

describe("callLogs router", () => {
  it("requires authentication for list", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.callLogs.list({})).rejects.toThrow();
  });

  it("lists call logs for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const logs = await caller.callLogs.list({});
    expect(logs).toBeDefined();
    expect(Array.isArray(logs.items)).toBe(true);
  });
});

// ─── Carrier Packets ────────────────────────────────────────────────

describe("carrierPackets router", () => {
  it("requires authentication for list", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.carrierPackets.list()).rejects.toThrow();
  });

  it("requires authentication for create", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.carrierPackets.create({
        carrierName: "Test Carrier LLC",
        mcNumber: "MC-123456",
        dotNumber: "DOT-789012",
      })
    ).rejects.toThrow();
  });

  it("creates a carrier packet when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.carrierPackets.create({
      carrierName: "Swift Transport Inc",
      mcNumber: "MC-555555",
      dotNumber: "DOT-111111",
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("lists carrier packets for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.carrierPackets.list({});
    expect(result).toBeDefined();
  });
});

// ─── Documents (DocScan) ────────────────────────────────────────────

describe("documents router", () => {
  it("requires authentication for list", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.documents.list({})).rejects.toThrow();
  });

  it("requires authentication for create", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.documents.create({
        fileName: "test.pdf",
        fileUrl: "https://example.com/test.pdf",
        fileKey: "docs/test.pdf",
        documentType: "insurance",
        category: "insurance",
      })
    ).rejects.toThrow();
  });

  it("creates a document when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.documents.create({
      fileName: "carrier_insurance.pdf",
      fileUrl: "https://example.com/insurance.pdf",
      fileKey: "docs/carrier_insurance.pdf",
      documentType: "insurance",
      category: "insurance",
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("lists documents for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.documents.list({});
    expect(result).toBeDefined();
  });
});

// ─── Deal Scores (Win Probability) ─────────────────────────────────

describe("dealScores router", () => {
  it("requires authentication for atRisk", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dealScores.atRisk()).rejects.toThrow();
  });

  it("lists at-risk deals for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const scores = await caller.dealScores.atRisk();
    expect(Array.isArray(scores)).toBe(true);
  });

  it("requires authentication for readyToClose", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.dealScores.readyToClose()).rejects.toThrow();
  });

  it("lists ready-to-close deals for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const deals = await caller.dealScores.readyToClose();
    expect(Array.isArray(deals)).toBe(true);
  });
});

// ─── Revenue Briefings ──────────────────────────────────────────────

describe("revenueBriefings router", () => {
  it("requires authentication for list", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.revenueBriefings.list()).rejects.toThrow();
  });

  it("lists revenue briefings for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const briefings = await caller.revenueBriefings.list();
    expect(Array.isArray(briefings)).toBe(true);
  });
});

// ─── Smart Notifications ────────────────────────────────────────────

describe("smartNotifications router", () => {
  it("requires authentication for list", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.smartNotifications.list({ unreadOnly: false })).rejects.toThrow();
  });

  it("lists smart notifications for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const notifications = await caller.smartNotifications.list({ unreadOnly: false });
    expect(Array.isArray(notifications)).toBe(true);
  });
});

// ─── Meeting Preps ──────────────────────────────────────────────────

describe("meetingPreps router", () => {
  it("requires authentication for list", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.meetingPreps.list()).rejects.toThrow();
  });

  it("lists meeting preps for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const preps = await caller.meetingPreps.list();
    expect(Array.isArray(preps)).toBe(true);
  });
});

// ─── AI Ghostwriter ─────────────────────────────────────────────────

describe("aiGhostwriter router", () => {
  it("requires authentication for draftEmail", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.aiGhostwriter.draftEmail({
        contactId: undefined,
        dealId: undefined,
        context: "Follow up on a freight quote",
        tone: "professional",
        purpose: "follow up",
      })
    ).rejects.toThrow();
  });
});

// ─── Cross-feature integration tests ────────────────────────────────

describe("cross-feature integration", () => {
  it("all Phase 13 routers exist on appRouter", () => {
    const caller = appRouter.createCaller(createAuthContext().ctx);
    expect(caller.voiceCampaigns).toBeDefined();
    expect(caller.callLogs).toBeDefined();
    expect(caller.carrierPackets).toBeDefined();
    expect(caller.documents).toBeDefined();
    expect(caller.dealScores).toBeDefined();
    expect(caller.revenueBriefings).toBeDefined();
    expect(caller.smartNotifications).toBeDefined();
    expect(caller.meetingPreps).toBeDefined();
    expect(caller.aiGhostwriter).toBeDefined();
  });

  it("unauthenticated users cannot access any Phase 13 protected endpoints", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    const protectedCalls = [
      () => caller.voiceCampaigns.list(),
      () => caller.callLogs.list({}),
      () => caller.carrierPackets.list(),
      () => caller.documents.list({}),
      () => caller.dealScores.atRisk(),
      () => caller.revenueBriefings.list(),
      () => caller.smartNotifications.list({ unreadOnly: false }),
      () => caller.meetingPreps.list(),
    ];

    for (const call of protectedCalls) {
      await expect(call()).rejects.toThrow();
    }
  });
});
