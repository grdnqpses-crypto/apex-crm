import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-company-metrics",
    email: "metrics@apexcrm.com",
    name: "Metrics Test User",
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
        clearCookie: () => {},
      } as unknown as TrpcContext["res"],
    },
  };
}

describe("Companies List With Metrics", () => {
  it("returns enriched company data with contactCount, openDeals, pipelineValue", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a company
    const company = await caller.companies.create({
      name: "Metrics Test Corp",
      domain: "metricstest.com",
    });
    expect(company.id).toBeDefined();

    // Add contacts to the company
    await caller.contacts.create({ firstName: "Alice", companyId: company.id });
    await caller.contacts.create({ firstName: "Bob", companyId: company.id });

    // Fetch companies with metrics
    const result = await caller.companies.listWithMetrics({ search: "Metrics Test Corp" });
    expect(result.items.length).toBeGreaterThanOrEqual(1);

    const found = result.items.find((c: any) => c.id === company.id);
    expect(found).toBeDefined();
    expect(found!.contactCount).toBeGreaterThanOrEqual(2);
    // openDeals and pipelineValue should be numbers (0 if no deals)
    expect(typeof found!.openDeals).toBe("number");
    expect(typeof found!.pipelineValue).toBe("number");
  });

  it("returns zero metrics for a company with no contacts or deals", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a company with no contacts
    const company = await caller.companies.create({
      name: "Empty Metrics Corp",
      domain: "emptymetrics.com",
    });

    const result = await caller.companies.listWithMetrics({ search: "Empty Metrics Corp" });
    const found = result.items.find((c: any) => c.id === company.id);
    expect(found).toBeDefined();
    expect(found!.contactCount).toBe(0);
    expect(found!.openDeals).toBe(0);
    expect(found!.pipelineValue).toBe(0);
  });

  it("returns total count in the response", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.companies.listWithMetrics();
    expect(typeof result.total).toBe("number");
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.items)).toBe(true);
  });
});
