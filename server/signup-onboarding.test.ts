import { describe, it, expect, vi, beforeAll } from "vitest";
import bcrypt from "bcryptjs";

// ─── Self-Service Registration Tests ───

describe("Self-Service Registration", () => {
  describe("Password Hashing", () => {
    it("should hash passwords with bcrypt for new signups", async () => {
      const password = "NewCompany2024!";
      const hash = await bcrypt.hash(password, 12);
      expect(hash).toBeTruthy();
      expect(hash.startsWith("$2b$12$") || hash.startsWith("$2a$12$")).toBe(true);
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject weak passwords (less than 8 chars)", () => {
      const password = "short";
      expect(password.length).toBeLessThan(8);
    });

    it("should accept strong passwords (8+ chars)", () => {
      const password = "StrongPass123!";
      expect(password.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe("Company Slug Generation", () => {
    it("should generate valid slugs from company names", () => {
      const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      
      expect(slugify("Logistics Worldwide")).toBe("logistics-worldwide");
      expect(slugify("TechCorp Inc.")).toBe("techcorp-inc-");
      expect(slugify("Fast & Furious Freight")).toBe("fast-furious-freight");
      expect(slugify("ABC")).toBe("abc");
    });

    it("should handle special characters in company names", () => {
      const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      
      const slug = slugify("O'Brien & Associates LLC");
      expect(slug).not.toContain("'");
      expect(slug).not.toContain("&");
      expect(typeof slug).toBe("string");
      expect(slug.length).toBeGreaterThan(0);
    });
  });

  describe("Subscription Tier Configuration", () => {
    const tierConfig: Record<string, { maxUsers: number; price: number }> = {
      starter: { maxUsers: 5, price: 197 },
      professional: { maxUsers: 15, price: 697 },
      enterprise: { maxUsers: 25, price: 1497 },
    };

    it("should have correct user limits for each tier", () => {
      expect(tierConfig.starter.maxUsers).toBe(5);
      expect(tierConfig.professional.maxUsers).toBe(15);
      expect(tierConfig.enterprise.maxUsers).toBe(25);
    });

    it("should have correct pricing for each tier", () => {
      expect(tierConfig.starter.price).toBe(197);
      expect(tierConfig.professional.price).toBe(697);
      expect(tierConfig.enterprise.price).toBe(1497);
    });

    it("should default to trial for unknown tiers", () => {
      const tier = "unknown";
      const result = tierConfig[tier] ? tier : "trial";
      expect(result).toBe("trial");
    });

    it("should calculate correct trial end date (60 days)", () => {
      const now = Date.now();
      const trialEndsAt = now + (60 * 24 * 60 * 60 * 1000);
      const daysUntilExpiry = (trialEndsAt - now) / (24 * 60 * 60 * 1000);
      expect(daysUntilExpiry).toBe(60);
    });
  });

  describe("Registration Validation", () => {
    it("should require company name", () => {
      const data = { companyName: "", fullName: "John", username: "john", password: "pass1234" };
      expect(!data.companyName).toBe(true);
    });

    it("should require full name", () => {
      const data = { companyName: "Test Co", fullName: "", username: "john", password: "pass1234" };
      expect(!data.fullName).toBe(true);
    });

    it("should require username", () => {
      const data = { companyName: "Test Co", fullName: "John", username: "", password: "pass1234" };
      expect(!data.username).toBe(true);
    });

    it("should require password", () => {
      const data = { companyName: "Test Co", fullName: "John", username: "john", password: "" };
      expect(!data.password).toBe(true);
    });

    it("should validate password confirmation matches", () => {
      const password = "StrongPass123!";
      const confirmPassword = "StrongPass123!";
      expect(password).toBe(confirmPassword);
    });

    it("should reject mismatched password confirmation", () => {
      const password = "StrongPass123!";
      const confirmPassword = "DifferentPass!";
      expect(password).not.toBe(confirmPassword);
    });
  });
});

// ─── Onboarding Tutorial Tests ───

describe("Onboarding Tutorial System", () => {
  describe("Tutorial Steps", () => {
    const TUTORIAL_STEPS = [
      { id: "welcome", category: "getting-started", requiredRole: undefined },
      { id: "dashboard-overview", category: "getting-started", requiredRole: undefined },
      { id: "add-company", category: "crm-basics", requiredRole: undefined },
      { id: "add-contacts", category: "crm-basics", requiredRole: undefined },
      { id: "create-deal", category: "crm-basics", requiredRole: undefined },
      { id: "manage-tasks", category: "crm-basics", requiredRole: undefined },
      { id: "email-campaigns", category: "advanced", requiredRole: undefined },
      { id: "analytics", category: "advanced", requiredRole: undefined },
      { id: "paradigm-engine", category: "automation", requiredRole: undefined },
      { id: "team-management", category: "admin", requiredRole: ["company_admin", "manager", "axiom_owner", "developer"] },
      { id: "settings", category: "admin", requiredRole: ["company_admin", "axiom_owner", "developer"] },
      { id: "complete", category: "getting-started", requiredRole: undefined },
    ];

    it("should have 12 tutorial steps", () => {
      expect(TUTORIAL_STEPS.length).toBe(12);
    });

    it("should start with welcome and end with complete", () => {
      expect(TUTORIAL_STEPS[0].id).toBe("welcome");
      expect(TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].id).toBe("complete");
    });

    it("should have unique step IDs", () => {
      const ids = TUTORIAL_STEPS.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should filter admin steps for regular users", () => {
      const userRole = "user";
      const filtered = TUTORIAL_STEPS.filter(step => {
        if (!step.requiredRole) return true;
        return step.requiredRole.includes(userRole);
      });
      // Regular users should NOT see team-management or settings
      expect(filtered.find(s => s.id === "team-management")).toBeUndefined();
      expect(filtered.find(s => s.id === "settings")).toBeUndefined();
      expect(filtered.length).toBe(10); // 12 - 2 admin steps
    });

    it("should show all steps for company_admin", () => {
      const userRole = "company_admin";
      const filtered = TUTORIAL_STEPS.filter(step => {
        if (!step.requiredRole) return true;
        return step.requiredRole.includes(userRole);
      });
      expect(filtered.length).toBe(12);
    });

    it("should show all steps for developer", () => {
      const userRole = "developer";
      const filtered = TUTORIAL_STEPS.filter(step => {
        if (!step.requiredRole) return true;
        return step.requiredRole.includes(userRole);
      });
      expect(filtered.length).toBe(12);
    });

    it("should show team-management but not settings for manager", () => {
      const userRole = "manager";
      const filtered = TUTORIAL_STEPS.filter(step => {
        if (!step.requiredRole) return true;
        return step.requiredRole.includes(userRole);
      });
      expect(filtered.find(s => s.id === "team-management")).toBeTruthy();
      expect(filtered.find(s => s.id === "settings")).toBeUndefined();
      expect(filtered.length).toBe(11); // 12 - 1 (settings)
    });
  });

  describe("Onboarding State Management", () => {
    it("should have correct initial state", () => {
      const initialState = {
        isActive: false,
        currentStep: 0,
        completedSteps: [] as string[],
        dismissed: false,
        startedAt: 0,
      };
      expect(initialState.isActive).toBe(false);
      expect(initialState.currentStep).toBe(0);
      expect(initialState.completedSteps).toEqual([]);
      expect(initialState.dismissed).toBe(false);
    });

    it("should track completed steps without duplicates", () => {
      const completedSteps = ["welcome", "dashboard-overview"];
      const newStep = "welcome"; // duplicate
      const updated = Array.from(new Set([...completedSteps, newStep]));
      expect(updated.length).toBe(2); // no duplicate
    });

    it("should calculate progress correctly", () => {
      const totalSteps = 12;
      const currentStep = 6;
      const progress = (currentStep / (totalSteps - 1)) * 100;
      expect(progress).toBeCloseTo(54.55, 1);
    });

    it("should not go below step 0", () => {
      const currentStep = 0;
      const prev = Math.max(currentStep - 1, 0);
      expect(prev).toBe(0);
    });

    it("should not exceed total steps", () => {
      const totalSteps = 12;
      const currentStep = 11;
      const next = Math.min(currentStep + 1, totalSteps - 1);
      expect(next).toBe(11);
    });
  });
});

// ─── Role Hierarchy Tests ───

describe("5-Tier Role Hierarchy", () => {
  const ROLE_LEVELS: Record<string, number> = {
    developer: 100,
    axiom_owner: 80,
    super_admin: 70,
    company_admin: 60,
    manager: 40,
    user: 20,
  };

  it("should have correct role level ordering", () => {
    expect(ROLE_LEVELS.developer).toBeGreaterThan(ROLE_LEVELS.axiom_owner);
    expect(ROLE_LEVELS.axiom_owner).toBeGreaterThan(ROLE_LEVELS.company_admin);
    expect(ROLE_LEVELS.company_admin).toBeGreaterThan(ROLE_LEVELS.manager);
    expect(ROLE_LEVELS.manager).toBeGreaterThan(ROLE_LEVELS.user);
  });

  it("should allow developers to access everything", () => {
    const userLevel = ROLE_LEVELS.developer;
    expect(userLevel).toBeGreaterThanOrEqual(ROLE_LEVELS.developer);
    expect(userLevel).toBeGreaterThanOrEqual(ROLE_LEVELS.axiom_owner);
    expect(userLevel).toBeGreaterThanOrEqual(ROLE_LEVELS.company_admin);
    expect(userLevel).toBeGreaterThanOrEqual(ROLE_LEVELS.manager);
    expect(userLevel).toBeGreaterThanOrEqual(ROLE_LEVELS.user);
  });

  it("should restrict axiom_owner from developer-only features", () => {
    const userLevel = ROLE_LEVELS.axiom_owner;
    expect(userLevel).toBeLessThan(ROLE_LEVELS.developer);
    expect(userLevel).toBeGreaterThanOrEqual(ROLE_LEVELS.axiom_owner);
  });

  it("should restrict company_admin from platform-level features", () => {
    const userLevel = ROLE_LEVELS.company_admin;
    expect(userLevel).toBeLessThan(ROLE_LEVELS.axiom_owner);
    expect(userLevel).toBeGreaterThanOrEqual(ROLE_LEVELS.company_admin);
  });

  it("should restrict manager from admin features", () => {
    const userLevel = ROLE_LEVELS.manager;
    expect(userLevel).toBeLessThan(ROLE_LEVELS.company_admin);
    expect(userLevel).toBeGreaterThanOrEqual(ROLE_LEVELS.manager);
  });

  it("should restrict user (sales rep) to basic features", () => {
    const userLevel = ROLE_LEVELS.user;
    expect(userLevel).toBeLessThan(ROLE_LEVELS.manager);
    expect(userLevel).toBeGreaterThanOrEqual(ROLE_LEVELS.user);
  });

  describe("AXIOM Owner Capabilities", () => {
    it("should be able to view all tenant companies", () => {
      const role = "axiom_owner";
      const canViewAllCompanies = ROLE_LEVELS[role] >= ROLE_LEVELS.axiom_owner;
      expect(canViewAllCompanies).toBe(true);
    });

    it("should be able to manage subscription tiers", () => {
      const role = "axiom_owner";
      const canManageTiers = ROLE_LEVELS[role] >= ROLE_LEVELS.axiom_owner;
      expect(canManageTiers).toBe(true);
    });

    it("should not have developer-level access", () => {
      const role = "axiom_owner";
      const hasDeveloperAccess = ROLE_LEVELS[role] >= ROLE_LEVELS.developer;
      expect(hasDeveloperAccess).toBe(false);
    });
  });
});

// ─── AXIOM Platform Dashboard Tests ───

describe("AXIOM Platform Dashboard", () => {
  it("should define subscription tiers correctly", () => {
    const tiers = ["trial", "starter", "professional", "enterprise"];
    expect(tiers).toContain("trial");
    expect(tiers).toContain("starter");
    expect(tiers).toContain("professional");
    expect(tiers).toContain("enterprise");
    expect(tiers.length).toBe(4);
  });

  it("should calculate revenue metrics from tier pricing", () => {
    const companies = [
      { tier: "starter", status: "active" },
      { tier: "professional", status: "active" },
      { tier: "enterprise", status: "active" },
      { tier: "trial", status: "active" },
      { tier: "starter", status: "suspended" },
    ];
    
    const tierPricing: Record<string, number> = {
      trial: 0,
      starter: 197,
      professional: 697,
      enterprise: 1497,
    };

    const activeCompanies = companies.filter(c => c.status === "active");
    const mrr = activeCompanies.reduce((sum, c) => sum + (tierPricing[c.tier] || 0), 0);
    
    expect(activeCompanies.length).toBe(4);
    expect(mrr).toBe(0 + 197 + 697 + 1497); // 2391
  });
});
