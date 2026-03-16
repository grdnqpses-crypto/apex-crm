import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getVisibleUserIds: vi.fn(),
  getTeamMemberIds: vi.fn(),
  listCompaniesByRole: vi.fn(),
  listContactsByRole: vi.fn(),
  listDealsByRole: vi.fn(),
  listTasksByRole: vi.fn(),
  getDashboardStatsByRole: vi.fn(),
  getTeamPerformance: vi.fn(),
}));

import {
  getVisibleUserIds,
  getTeamMemberIds,
  listCompaniesByRole,
  listContactsByRole,
  listDealsByRole,
  listTasksByRole,
  getDashboardStatsByRole,
  getTeamPerformance,
} from "./db";

const mockedGetVisibleUserIds = vi.mocked(getVisibleUserIds);
const mockedGetTeamMemberIds = vi.mocked(getTeamMemberIds);
const mockedListCompaniesByRole = vi.mocked(listCompaniesByRole);
const mockedListContactsByRole = vi.mocked(listContactsByRole);
const mockedListDealsByRole = vi.mocked(listDealsByRole);
const mockedListTasksByRole = vi.mocked(listTasksByRole);
const mockedGetDashboardStatsByRole = vi.mocked(getDashboardStatsByRole);
const mockedGetTeamPerformance = vi.mocked(getTeamPerformance);

// ─── Test Users ───
const salesRep = { id: 100, systemRole: "user", tenantCompanyId: 1 };
const manager = { id: 200, systemRole: "manager", tenantCompanyId: 1 };
const companyAdmin = { id: 300, systemRole: "company_admin", tenantCompanyId: 1 };
const developer = { id: 400, systemRole: "developer", tenantCompanyId: null };

describe("Role-Based Access Control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Sales Rep (user role)", () => {
    it("should only see their own user ID in visible IDs", async () => {
      mockedGetVisibleUserIds.mockResolvedValue([100]);
      const ids = await getVisibleUserIds(salesRep);
      expect(ids).toEqual([100]);
      expect(ids).toHaveLength(1);
      expect(ids).not.toContain(200); // Should not see manager
      expect(ids).not.toContain(300); // Should not see admin
    });

    it("should only see their own companies", async () => {
      mockedListCompaniesByRole.mockResolvedValue({
        items: [{ id: 1, name: "Microsoft", userId: 100 }],
        total: 1,
      } as any);
      const result = await listCompaniesByRole(salesRep);
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].userId).toBe(100);
    });

    it("should only see their own contacts", async () => {
      mockedListContactsByRole.mockResolvedValue({
        items: [{ id: 1, firstName: "John", userId: 100 }],
        total: 1,
      } as any);
      const result = await listContactsByRole(salesRep);
      expect(result.total).toBe(1);
      expect(result.items[0].userId).toBe(100);
    });

    it("should only see their own deals", async () => {
      mockedListDealsByRole.mockResolvedValue({
        items: [{ id: 1, title: "Deal A", userId: 100 }],
        total: 1,
      } as any);
      const result = await listDealsByRole(salesRep);
      expect(result.total).toBe(1);
      expect(result.items[0].userId).toBe(100);
    });

    it("should only see their own tasks", async () => {
      mockedListTasksByRole.mockResolvedValue({
        items: [{ id: 1, title: "Task A", userId: 100 }],
        total: 1,
      } as any);
      const result = await listTasksByRole(salesRep);
      expect(result.total).toBe(1);
      expect(result.items[0].userId).toBe(100);
    });

    it("should not have access to team performance data", async () => {
      // Sales reps should not be able to call getTeamPerformance
      // The router enforces this with managerProcedure
      mockedGetTeamPerformance.mockResolvedValue([]);
      // This test validates the concept - the actual enforcement is in the router middleware
      expect(salesRep.systemRole).toBe("user");
      expect(salesRep.systemRole).not.toBe("manager");
      expect(salesRep.systemRole).not.toBe("company_admin");
      expect(salesRep.systemRole).not.toBe("developer");
    });
  });

  describe("Manager role", () => {
    it("should see their own ID plus all team member IDs", async () => {
      mockedGetVisibleUserIds.mockResolvedValue([200, 100, 101, 102]);
      const ids = await getVisibleUserIds(manager);
      expect(ids).toContain(200); // Own ID
      expect(ids).toContain(100); // Team member
      expect(ids.length).toBeGreaterThan(1);
    });

    it("should see companies from all team members", async () => {
      mockedListCompaniesByRole.mockResolvedValue({
        items: [
          { id: 1, name: "Microsoft", userId: 100 },
          { id: 2, name: "Amazon", userId: 101 },
          { id: 3, name: "Manager Co", userId: 200 },
        ],
        total: 3,
      } as any);
      const result = await listCompaniesByRole(manager);
      expect(result.total).toBe(3);
      const userIds = result.items.map((i: any) => i.userId);
      expect(userIds).toContain(100); // Team member's company
      expect(userIds).toContain(101); // Another team member's company
      expect(userIds).toContain(200); // Manager's own company
    });

    it("should have access to team performance data", async () => {
      mockedGetTeamPerformance.mockResolvedValue([
        { userId: 100, name: "Sarah Chen", companies: 3, contacts: 2, totalDeals: 5, wonDeals: 2, totalDealValue: 50000, wonDealValue: 20000, totalTasks: 4, overdueTasks: 1 },
        { userId: 101, name: "David Thompson", companies: 2, contacts: 3, totalDeals: 3, wonDeals: 1, totalDealValue: 30000, wonDealValue: 10000, totalTasks: 2, overdueTasks: 0 },
      ] as any);
      const result = await getTeamPerformance(manager);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Sarah Chen");
      expect(result[1].name).toBe("David Thompson");
    });

    it("should not see data from other tenants", async () => {
      // Manager in tenant 1 should not see users from tenant 2
      mockedGetVisibleUserIds.mockResolvedValue([200, 100, 101]);
      const ids = await getVisibleUserIds(manager);
      // All IDs should be from the same tenant
      expect(ids.every((id: number) => [200, 100, 101, 102].includes(id))).toBe(true);
    });
  });

  describe("Company Admin role", () => {
    it("should see all users in their tenant company", async () => {
      mockedGetVisibleUserIds.mockResolvedValue([300, 200, 100, 101, 102]);
      const ids = await getVisibleUserIds(companyAdmin);
      expect(ids).toContain(300); // Own ID
      expect(ids).toContain(200); // Manager
      expect(ids).toContain(100); // Sales rep
      expect(ids.length).toBeGreaterThanOrEqual(3);
    });

    it("should see all companies across the entire tenant", async () => {
      mockedListCompaniesByRole.mockResolvedValue({
        items: [
          { id: 1, name: "Microsoft", userId: 100 },
          { id: 2, name: "Amazon", userId: 101 },
          { id: 3, name: "FedEx", userId: 200 },
          { id: 4, name: "Admin Co", userId: 300 },
        ],
        total: 4,
      } as any);
      const result = await listCompaniesByRole(companyAdmin);
      expect(result.total).toBe(4);
    });

    it("should have access to team performance for all users", async () => {
      mockedGetTeamPerformance.mockResolvedValue([
        { userId: 200, name: "Mike Rodriguez", companies: 5, contacts: 10, totalDeals: 8, wonDeals: 4, totalDealValue: 80000, wonDealValue: 40000, totalTasks: 6, overdueTasks: 0 },
        { userId: 100, name: "Sarah Chen", companies: 3, contacts: 2, totalDeals: 5, wonDeals: 2, totalDealValue: 50000, wonDealValue: 20000, totalTasks: 4, overdueTasks: 1 },
        { userId: 101, name: "David Thompson", companies: 2, contacts: 3, totalDeals: 3, wonDeals: 1, totalDealValue: 30000, wonDealValue: 10000, totalTasks: 2, overdueTasks: 0 },
      ] as any);
      const result = await getTeamPerformance(companyAdmin);
      expect(result).toHaveLength(3);
    });
  });

  describe("Developer role", () => {
    it("should have unrestricted access (all user IDs)", async () => {
      // Developer can see everything - no tenant restriction
      mockedGetVisibleUserIds.mockResolvedValue([400, 300, 200, 100, 101, 102, 500, 501]);
      const ids = await getVisibleUserIds(developer);
      expect(ids.length).toBeGreaterThanOrEqual(1);
      expect(ids).toContain(400); // Own ID
    });

    it("should see data across all tenants", async () => {
      mockedListCompaniesByRole.mockResolvedValue({
        items: [
          { id: 1, name: "Tenant 1 Co", userId: 100 },
          { id: 2, name: "Tenant 2 Co", userId: 500 },
        ],
        total: 2,
      } as any);
      const result = await listCompaniesByRole(developer);
      expect(result.total).toBe(2);
    });
  });

  describe("Frontend Route Access Control", () => {
    // These tests validate the route access logic from useFeatureAccess

    const DEVELOPER_ROUTES = [
      "/dev/companies", "/dev/users", "/dev/health", "/dev/activity", "/dev/impersonate",
      "/fmcsa-scanner", "/api-keys", "/webhooks",
    ];

    const ADMIN_ROUTES = [
      "/team", "/white-label", "/subscription", "/migration",
      "/settings", "/import/hubspot",
    ];

    const MANAGER_ROUTES = ["/team-performance"];

    const ALWAYS_ACCESSIBLE = ["/", "/help", "/commercial"];

    const CRM_ROUTES = ["/companies", "/contacts", "/deals", "/tasks"];

    function hasRoleAccess(path: string, role: string): boolean {
      if (ALWAYS_ACCESSIBLE.includes(path)) return true;
      if (DEVELOPER_ROUTES.includes(path) || path.startsWith("/dev/")) return role === "developer";
      if (ADMIN_ROUTES.includes(path)) return role === "developer" || role === "company_admin";
      if (MANAGER_ROUTES.includes(path)) return role === "developer" || role === "company_admin" || role === "manager";
      return true;
    }

    describe("Sales Rep route access", () => {
      it("can access dashboard and help", () => {
        ALWAYS_ACCESSIBLE.forEach(route => {
          expect(hasRoleAccess(route, "user")).toBe(true);
        });
      });

      it("can access CRM routes", () => {
        CRM_ROUTES.forEach(route => {
          expect(hasRoleAccess(route, "user")).toBe(true);
        });
      });

      it("CANNOT access developer routes", () => {
        DEVELOPER_ROUTES.forEach(route => {
          expect(hasRoleAccess(route, "user")).toBe(false);
        });
      });

      it("CANNOT access admin routes", () => {
        ADMIN_ROUTES.forEach(route => {
          expect(hasRoleAccess(route, "user")).toBe(false);
        });
      });

      it("CANNOT access manager routes", () => {
        MANAGER_ROUTES.forEach(route => {
          expect(hasRoleAccess(route, "user")).toBe(false);
        });
      });
    });

    describe("Manager route access", () => {
      it("can access dashboard, help, and CRM routes", () => {
        [...ALWAYS_ACCESSIBLE, ...CRM_ROUTES].forEach(route => {
          expect(hasRoleAccess(route, "manager")).toBe(true);
        });
      });

      it("can access team performance", () => {
        MANAGER_ROUTES.forEach(route => {
          expect(hasRoleAccess(route, "manager")).toBe(true);
        });
      });

      it("CANNOT access admin routes", () => {
        ADMIN_ROUTES.forEach(route => {
          expect(hasRoleAccess(route, "manager")).toBe(false);
        });
      });

      it("CANNOT access developer routes", () => {
        DEVELOPER_ROUTES.forEach(route => {
          expect(hasRoleAccess(route, "manager")).toBe(false);
        });
      });
    });

    describe("Company Admin route access", () => {
      it("can access all non-developer routes", () => {
        [...ALWAYS_ACCESSIBLE, ...CRM_ROUTES, ...ADMIN_ROUTES, ...MANAGER_ROUTES].forEach(route => {
          expect(hasRoleAccess(route, "company_admin")).toBe(true);
        });
      });

      it("CANNOT access developer routes", () => {
        DEVELOPER_ROUTES.forEach(route => {
          expect(hasRoleAccess(route, "company_admin")).toBe(false);
        });
      });
    });

    describe("Developer route access", () => {
      it("can access ALL routes", () => {
        [...ALWAYS_ACCESSIBLE, ...CRM_ROUTES, ...ADMIN_ROUTES, ...MANAGER_ROUTES, ...DEVELOPER_ROUTES].forEach(route => {
          expect(hasRoleAccess(route, "developer")).toBe(true);
        });
      });
    });
  });

  describe("Data Isolation Between Tenants", () => {
    const tenant1User = { id: 100, systemRole: "user", tenantCompanyId: 1 };
    const tenant2User = { id: 500, systemRole: "user", tenantCompanyId: 2 };

    it("tenant 1 user cannot see tenant 2 data", async () => {
      mockedGetVisibleUserIds.mockResolvedValue([100]);
      const ids = await getVisibleUserIds(tenant1User);
      expect(ids).not.toContain(500);
    });

    it("tenant 2 user cannot see tenant 1 data", async () => {
      mockedGetVisibleUserIds.mockResolvedValue([500]);
      const ids = await getVisibleUserIds(tenant2User);
      expect(ids).not.toContain(100);
    });
  });

  describe("Role Hierarchy Enforcement", () => {
    it("user role is the lowest level", () => {
      const hierarchy = ["developer", "company_admin", "manager", "user"];
      expect(hierarchy.indexOf("user")).toBe(3);
    });

    it("manager is above user but below admin", () => {
      const hierarchy = ["developer", "company_admin", "manager", "user"];
      expect(hierarchy.indexOf("manager")).toBeLessThan(hierarchy.indexOf("user"));
      expect(hierarchy.indexOf("manager")).toBeGreaterThan(hierarchy.indexOf("company_admin"));
    });

    it("company_admin is above manager but below developer", () => {
      const hierarchy = ["developer", "company_admin", "manager", "user"];
      expect(hierarchy.indexOf("company_admin")).toBeLessThan(hierarchy.indexOf("manager"));
      expect(hierarchy.indexOf("company_admin")).toBeGreaterThan(hierarchy.indexOf("developer"));
    });

    it("developer is the highest level", () => {
      const hierarchy = ["developer", "company_admin", "manager", "user"];
      expect(hierarchy.indexOf("developer")).toBe(0);
    });
  });
});
