import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-recent-activities",
    email: "recent@apexcrm.com",
    name: "Recent Test User",
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
        clearCookie: () => {},
      } as unknown as TrpcContext["res"],
    },
  };
}

describe("Dashboard Recent Activities", () => {
  it("returns an array of recent activities", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.recentActivities({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns activities with contact and company context", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a company and contact
    const company = await caller.companies.create({ name: "Activity Feed Corp" });
    const contact = await caller.contacts.create({
      firstName: "Feed",
      lastName: "Tester",
      companyId: company.id,
    });

    // Create an activity
    await caller.activities.create({
      contactId: contact.id,
      type: "note",
      subject: "Recent activity test note",
      body: "Testing the recent activity feed",
    });

    // Fetch recent activities
    const result = await caller.dashboard.recentActivities({ limit: 15 });
    expect(result.length).toBeGreaterThanOrEqual(1);

    // Find our activity
    const found = result.find((a: any) => a.subject === "Recent activity test note");
    expect(found).toBeDefined();
    expect(found!.type).toBe("note");
    expect(found!.contactFirstName).toBe("Feed");
    expect(found!.contactLastName).toBe("Tester");
    expect(found!.companyName).toBe("Activity Feed Corp");
    expect(typeof found!.createdAt).toBe("number");
  });

  it("respects the limit parameter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.recentActivities({ limit: 3 });
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("returns activities sorted by most recent first", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.dashboard.recentActivities({ limit: 10 });
    if (result.length >= 2) {
      // Verify descending order by createdAt
      for (let i = 0; i < result.length - 1; i++) {
        expect((result[i] as any).createdAt).toBeGreaterThanOrEqual((result[i + 1] as any).createdAt);
      }
    }
  });

  it("includes different activity types", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const company = await caller.companies.create({ name: "Multi Activity Corp" });
    const contact = await caller.contacts.create({
      firstName: "Multi",
      lastName: "Activity",
      companyId: company.id,
    });

    // Create different types of activities
    await caller.activities.create({
      contactId: contact.id,
      type: "call",
      subject: "Outbound call test",
      callOutcome: "Connected",
      callDuration: 10,
    });
    await caller.activities.create({
      contactId: contact.id,
      type: "email",
      subject: "Follow up email test",
      emailTo: "multi@test.com",
    });
    await caller.activities.create({
      contactId: contact.id,
      type: "meeting",
      subject: "Quarterly review test",
      meetingLocation: "Zoom",
    });

    const result = await caller.dashboard.recentActivities({ limit: 15 });
    const types = result.map((a: any) => a.type);
    expect(types).toContain("call");
    expect(types).toContain("email");
    expect(types).toContain("meeting");
  });
});
