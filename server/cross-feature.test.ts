import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-cross-feature",
    email: "test@example.com",
    name: "Test User",
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

describe("Cross-feature router", () => {
  it("has dealsByContact procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.crossFeature.dealsByContact).toBeDefined();
  });

  it("has dealsByCompany procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.crossFeature.dealsByCompany).toBeDefined();
  });

  it("has tasksByContact procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.crossFeature.tasksByContact).toBeDefined();
  });

  it("has tasksByCompany procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.crossFeature.tasksByCompany).toBeDefined();
  });

  it("has tasksByDeal procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.crossFeature.tasksByDeal).toBeDefined();
  });

  it("has segmentContacts procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.crossFeature.segmentContacts).toBeDefined();
  });

  it("has prospectsBySequence procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.crossFeature.prospectsBySequence).toBeDefined();
  });

  it("has contactsByCompany procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.crossFeature.contactsByCompany).toBeDefined();
  });
});

describe("Campaign pipeline procedures", () => {
  it("has campaigns.send procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.campaigns.send).toBeDefined();
  });

  it("has campaigns.loadTemplate procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.campaigns.loadTemplate).toBeDefined();
  });

  it("has campaigns.segmentPreview procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.campaigns.segmentPreview).toBeDefined();
  });

  it("has campaigns.analyzeSpam procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.campaigns.analyzeSpam).toBeDefined();
  });
});

describe("Paradigm Engine procedures", () => {
  it("has prospects.promoteToContact procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.prospects.promoteToContact).toBeDefined();
  });

  it("has prospects.enrollInSequence procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.prospects.enrollInSequence).toBeDefined();
  });

  it("has signals.createProspect procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.signals.createProspect).toBeDefined();
  });

  it("has paradigm.stats procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.paradigm.stats).toBeDefined();
  });
});

describe("Dashboard stats procedure", () => {
  it("has dashboard.stats procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.dashboard.stats).toBeDefined();
  });

  it("has dashboard.enhancedStats procedure", () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.dashboard.enhancedStats).toBeDefined();
  });
});
