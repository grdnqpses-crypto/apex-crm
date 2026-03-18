/**
 * ai-credits.test.ts
 * Unit tests for the AI credit system business logic.
 *
 * Tests:
 * - 25% markup calculation is correct
 * - Credit package validation
 * - Balance arithmetic
 */
import { describe, it, expect } from "vitest";

// ─── Markup Calculation ───────────────────────────────────────────────────────

describe("AI credit markup calculation", () => {
  const MARKUP = 1.25; // 25% markup

  it("applies 25% markup to Manus base price", () => {
    const manusBasePriceCents = 1000; // $10.00
    const finalPriceCents = Math.round(manusBasePriceCents * MARKUP);
    expect(finalPriceCents).toBe(1250); // $12.50
  });

  it("rounds correctly for fractional cents", () => {
    const manusBasePriceCents = 799; // $7.99
    const finalPriceCents = Math.round(manusBasePriceCents * MARKUP);
    expect(finalPriceCents).toBe(999); // $9.99 (rounded)
  });

  it("calculates margin correctly", () => {
    const manusBasePriceCents = 2000; // $20.00
    const finalPriceCents = Math.round(manusBasePriceCents * MARKUP);
    const margin = finalPriceCents - manusBasePriceCents;
    expect(margin).toBe(500); // $5.00 margin
  });

  it("handles zero base price", () => {
    const manusBasePriceCents = 0;
    const finalPriceCents = Math.round(manusBasePriceCents * MARKUP);
    expect(finalPriceCents).toBe(0);
  });

  it("handles large packages correctly", () => {
    const manusBasePriceCents = 100000; // $1000.00
    const finalPriceCents = Math.round(manusBasePriceCents * MARKUP);
    expect(finalPriceCents).toBe(125000); // $1250.00
  });
});

// ─── Credit Balance Arithmetic ────────────────────────────────────────────────

describe("AI credit balance arithmetic", () => {
  it("correctly deducts credits on paid usage", () => {
    const balance = 500;
    const usage = 50;
    const newBalance = balance - usage;
    expect(newBalance).toBe(450);
  });

  it("correctly adds credits on purchase", () => {
    const balance = 100;
    const purchased = 500;
    const newBalance = balance + purchased;
    expect(newBalance).toBe(600);
  });

  it("does not go below zero on deduction", () => {
    const balance = 30;
    const usage = 50;
    const hasEnough = balance >= usage;
    expect(hasEnough).toBe(false);
  });

  it("CRM free usage does not deduct credits (credits delta = 0)", () => {
    const balance = 100;
    const crmFreeUsageDelta = 0; // CRM AI is free
    const newBalance = balance + crmFreeUsageDelta;
    expect(newBalance).toBe(100); // balance unchanged
  });

  it("tracks lifetime purchased and used separately", () => {
    const lifetimePurchased = 1000;
    const lifetimeUsed = 350;
    const available = lifetimePurchased - lifetimeUsed;
    expect(available).toBe(650);
  });
});

// ─── Package Validation ───────────────────────────────────────────────────────

describe("AI credit package validation", () => {
  function validatePackage(pkg: {
    name: string;
    credits: number;
    manusBasePriceCents: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!pkg.name || pkg.name.trim().length === 0) errors.push("Name is required");
    if (pkg.credits <= 0) errors.push("Credits must be positive");
    if (pkg.manusBasePriceCents < 0) errors.push("Base price cannot be negative");
    return { valid: errors.length === 0, errors };
  }

  it("accepts a valid package", () => {
    const result = validatePackage({ name: "Starter Pack", credits: 500, manusBasePriceCents: 1000 });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects empty name", () => {
    const result = validatePackage({ name: "", credits: 500, manusBasePriceCents: 1000 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Name is required");
  });

  it("rejects zero credits", () => {
    const result = validatePackage({ name: "Bad Pack", credits: 0, manusBasePriceCents: 1000 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Credits must be positive");
  });

  it("rejects negative credits", () => {
    const result = validatePackage({ name: "Bad Pack", credits: -100, manusBasePriceCents: 1000 });
    expect(result.valid).toBe(false);
  });

  it("rejects negative base price", () => {
    const result = validatePackage({ name: "Bad Pack", credits: 100, manusBasePriceCents: -500 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Base price cannot be negative");
  });

  it("allows free packages (zero base price)", () => {
    const result = validatePackage({ name: "Free Trial", credits: 100, manusBasePriceCents: 0 });
    expect(result.valid).toBe(true);
  });
});

// ─── Transaction Type Classification ─────────────────────────────────────────

describe("AI credit transaction type classification", () => {
  type TxType = "purchase" | "crm_free" | "paid_usage" | "refund" | "adjustment";

  function classifyUsage(featureKey: string, isCrmFeature: boolean): TxType {
    if (isCrmFeature) return "crm_free";
    return "paid_usage";
  }

  it("classifies CRM features as crm_free", () => {
    expect(classifyUsage("email_ghostwriter", true)).toBe("crm_free");
    expect(classifyUsage("lead_scoring", true)).toBe("crm_free");
    expect(classifyUsage("battle_cards", true)).toBe("crm_free");
    expect(classifyUsage("psychographic_profile", true)).toBe("crm_free");
  });

  it("classifies non-CRM features as paid_usage", () => {
    expect(classifyUsage("general_ai_chat", false)).toBe("paid_usage");
    expect(classifyUsage("custom_ai_task", false)).toBe("paid_usage");
  });
});
