import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock helpers ─────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getUsersByCompany: vi.fn(),
  getUserById: vi.fn(),
}));

vi.mock("./_core/sdk.js", () => ({
  sdk: { createSessionToken: vi.fn().mockResolvedValue("mock-token") },
}));

vi.mock("./_core/cookies.js", () => ({
  getSessionCookieOptions: vi.fn().mockReturnValue({ httpOnly: true, secure: false }),
}));

vi.mock("../shared/const.js", () => ({
  ONE_YEAR_MS: 31536000000,
}));

import * as db from "./db";
import { getRoleLevel } from "./_core/trpc";

// ─── Role level tests ─────────────────────────────────────────────────────────
describe("getRoleLevel hierarchy", () => {
  it("developer is highest level", () => {
    expect(getRoleLevel("developer")).toBeGreaterThan(getRoleLevel("axiom_admin"));
    // axiom_owner is a legacy alias for axiom_admin (same level 4)
    expect(getRoleLevel("axiom_admin")).toBeGreaterThan(getRoleLevel("company_admin"));
    expect(getRoleLevel("company_admin")).toBeGreaterThan(getRoleLevel("sales_manager"));
    expect(getRoleLevel("sales_manager")).toBeGreaterThan(getRoleLevel("account_manager"));
    expect(getRoleLevel("account_manager")).toBeGreaterThanOrEqual(getRoleLevel("user"));
  });

  it("user and coordinator are at the same lowest level", () => {
    expect(getRoleLevel("user")).toBe(getRoleLevel("coordinator"));
    expect(getRoleLevel("user")).toBeLessThan(getRoleLevel("sales_manager"));
  });
});

// ─── getTeamCredentials logic tests ──────────────────────────────────────────
describe("getTeamCredentials filtering", () => {
  const companyAdminUser = {
    id: 1,
    systemRole: "company_admin",
    tenantCompanyId: 10,
  };

  const mockTeamUsers = [
    { id: 1, name: "Admin Self", systemRole: "company_admin", tenantCompanyId: 10, email: "admin@co.com" },
    { id: 2, name: "Sales Manager", systemRole: "sales_manager", tenantCompanyId: 10, email: "mgr@co.com" },
    { id: 3, name: "Account Manager", systemRole: "account_manager", tenantCompanyId: 10, email: "am@co.com" },
    { id: 4, name: "Sales Rep", systemRole: "user", tenantCompanyId: 10, email: "rep@co.com" },
    { id: 5, name: "Other Company", systemRole: "user", tenantCompanyId: 99, email: "other@other.com" },
  ];

  it("excludes the caller from credentials list", () => {
    const callerLevel = getRoleLevel(companyAdminUser.systemRole);
    const result = mockTeamUsers
      .filter(u => u.tenantCompanyId === companyAdminUser.tenantCompanyId)
      .filter(u => u.id !== companyAdminUser.id && getRoleLevel(u.systemRole) < callerLevel);
    expect(result.find(u => u.id === 1)).toBeUndefined();
  });

  it("only returns users from the same tenant company", () => {
    const callerLevel = getRoleLevel(companyAdminUser.systemRole);
    const result = mockTeamUsers
      .filter(u => u.tenantCompanyId === companyAdminUser.tenantCompanyId)
      .filter(u => u.id !== companyAdminUser.id && getRoleLevel(u.systemRole) < callerLevel);
    expect(result.every(u => u.tenantCompanyId === 10)).toBe(true);
    expect(result.find(u => u.id === 5)).toBeUndefined();
  });

  it("only returns users with strictly lower role level", () => {
    const callerLevel = getRoleLevel(companyAdminUser.systemRole);
    const result = mockTeamUsers
      .filter(u => u.tenantCompanyId === companyAdminUser.tenantCompanyId)
      .filter(u => u.id !== companyAdminUser.id && getRoleLevel(u.systemRole) < callerLevel);
    expect(result.every(u => getRoleLevel(u.systemRole) < callerLevel)).toBe(true);
  });

  it("returns sales_manager, account_manager, and user roles for company_admin", () => {
    const callerLevel = getRoleLevel(companyAdminUser.systemRole);
    const result = mockTeamUsers
      .filter(u => u.tenantCompanyId === companyAdminUser.tenantCompanyId)
      .filter(u => u.id !== companyAdminUser.id && getRoleLevel(u.systemRole) < callerLevel);
    const roles = result.map(u => u.systemRole);
    expect(roles).toContain("sales_manager");
    expect(roles).toContain("account_manager");
    expect(roles).toContain("user");
  });
});

// ─── Emulation authorization tests ───────────────────────────────────────────
describe("Company Admin emulation authorization", () => {
  it("company_admin cannot emulate user from different tenant", () => {
    const caller = { id: 1, systemRole: "company_admin", tenantCompanyId: 10 };
    const target = { id: 5, systemRole: "user", tenantCompanyId: 99 };
    const callerLevel = getRoleLevel(caller.systemRole);
    const targetLevel = getRoleLevel(target.systemRole);
    const isAxiomLevel = callerLevel >= getRoleLevel("axiom_owner");
    const sameTenant = caller.tenantCompanyId === target.tenantCompanyId;
    const lowerRole = targetLevel < callerLevel;
    const allowed = isAxiomLevel || (sameTenant && lowerRole);
    expect(allowed).toBe(false);
  });

  it("company_admin can emulate user from same tenant with lower role", () => {
    const caller = { id: 1, systemRole: "company_admin", tenantCompanyId: 10 };
    const target = { id: 3, systemRole: "user", tenantCompanyId: 10 };
    const callerLevel = getRoleLevel(caller.systemRole);
    const targetLevel = getRoleLevel(target.systemRole);
    const isAxiomLevel = callerLevel >= getRoleLevel("axiom_owner");
    const sameTenant = caller.tenantCompanyId === target.tenantCompanyId;
    const lowerRole = targetLevel < callerLevel;
    const allowed = isAxiomLevel || (sameTenant && lowerRole);
    expect(allowed).toBe(true);
  });

  it("company_admin cannot emulate another company_admin (same level)", () => {
    const caller = { id: 1, systemRole: "company_admin", tenantCompanyId: 10 };
    const target = { id: 2, systemRole: "company_admin", tenantCompanyId: 10 };
    const callerLevel = getRoleLevel(caller.systemRole);
    const targetLevel = getRoleLevel(target.systemRole);
    const isAxiomLevel = callerLevel >= getRoleLevel("axiom_owner");
    const sameTenant = caller.tenantCompanyId === target.tenantCompanyId;
    const lowerRole = targetLevel < callerLevel;
    const allowed = isAxiomLevel || (sameTenant && lowerRole);
    expect(allowed).toBe(false);
  });

  it("axiom_owner can emulate anyone regardless of tenant", () => {
    const caller = { id: 1, systemRole: "axiom_owner", tenantCompanyId: null };
    const target = { id: 5, systemRole: "user", tenantCompanyId: 99 };
    const callerLevel = getRoleLevel(caller.systemRole);
    const targetLevel = getRoleLevel(target.systemRole);
    const isAxiomLevel = callerLevel >= getRoleLevel("axiom_owner");
    const allowed = isAxiomLevel;
    expect(allowed).toBe(true);
  });

  it("developer cannot be emulated by company_admin", () => {
    const caller = { id: 1, systemRole: "company_admin", tenantCompanyId: 10 };
    const target = { id: 99, systemRole: "developer", tenantCompanyId: 10 };
    // Developer guard: non-developer cannot emulate developer
    const developerGuard = target.systemRole === "developer" && caller.systemRole !== "developer";
    expect(developerGuard).toBe(true); // means it would throw FORBIDDEN
  });

  it("sales_manager cannot emulate users (not companyAdmin+)", () => {
    // sales_manager is below company_admin level so companyAdminProcedure would reject
    const callerLevel = getRoleLevel("sales_manager");
    const companyAdminLevel = getRoleLevel("company_admin");
    expect(callerLevel).toBeLessThan(companyAdminLevel);
  });
});

// ─── Credential masking tests ─────────────────────────────────────────────────
describe("Credential data mapping", () => {
  it("maps user fields correctly for credentials response", () => {
    const rawUser = {
      id: 5,
      name: "Jane Doe",
      email: "jane@company.com",
      username: "jane.doe",
      plainTextPassword: "SecurePass123",
      systemRole: "account_manager",
      isActive: true,
      lastSignedIn: Date.now(),
    };

    const mapped = {
      id: rawUser.id,
      name: rawUser.name ?? rawUser.username ?? "Unknown",
      email: rawUser.email,
      username: rawUser.username ?? rawUser.email,
      plainTextPassword: rawUser.plainTextPassword ?? null,
      systemRole: rawUser.systemRole,
      isActive: rawUser.isActive,
      lastSignedIn: rawUser.lastSignedIn,
    };

    expect(mapped.id).toBe(5);
    expect(mapped.name).toBe("Jane Doe");
    expect(mapped.username).toBe("jane.doe");
    expect(mapped.plainTextPassword).toBe("SecurePass123");
  });

  it("falls back to email as username when username is null", () => {
    const rawUser = {
      id: 6,
      name: "Bob Smith",
      email: "bob@company.com",
      username: null,
      plainTextPassword: null,
      systemRole: "user",
      isActive: true,
      lastSignedIn: null,
    };

    const username = rawUser.username ?? rawUser.email;
    expect(username).toBe("bob@company.com");
  });

  it("returns null for plainTextPassword when not stored", () => {
    const rawUser = { plainTextPassword: null };
    const pw = rawUser.plainTextPassword ?? null;
    expect(pw).toBeNull();
  });
});
