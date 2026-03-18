import { describe, it, expect } from "vitest";
import {
  PLANS,
  getPlanById,
  getPlanByTier,
  calculateAddOnCost,
  getTierLabel,
  ANNUAL_DISCOUNT,
  ANNUAL_REFUNDABLE,
  ANNUAL_POLICY_NOTICE,
  ADD_ON_PRICE_PER_USER,
} from "./stripe-products.js";

describe("Subscription Tier Structure", () => {
  it("should have exactly 5 plans", () => {
    expect(PLANS).toHaveLength(5);
  });

  it("should have the correct tier names in order", () => {
    const names = PLANS.map(p => p.name);
    expect(names).toEqual([
      "Success Starter",
      "Growth Foundation",
      "Fortune Foundation",
      "Fortune",
      "Fortune Plus",
    ]);
  });

  it("should have the correct monthly prices", () => {
    const prices = PLANS.map(p => p.monthlyPrice);
    expect(prices).toEqual([9900, 19700, 49700, 69700, 149700]);
  });

  it("should have the correct base user counts", () => {
    const baseUsers = PLANS.map(p => p.baseUsers);
    expect(baseUsers).toEqual([1, 5, 15, 25, 50]);
  });

  it("should have the correct max user caps", () => {
    const maxUsers = PLANS.map(p => p.maxUsers);
    expect(maxUsers).toEqual([5, 15, 25, 40, 50]);
  });

  it("Fortune Plus should have no add-on users (top tier)", () => {
    const fortunePlus = getPlanById("fortune_plus");
    expect(fortunePlus?.addOnMaxUsers).toBeNull();
  });

  it("Success Starter should be the entry-level tier at $99/mo", () => {
    const starter = getPlanById("success_starter");
    expect(starter?.monthlyPrice).toBe(9900);
    expect(starter?.baseUsers).toBe(1);
    expect(starter?.maxUsers).toBe(5);
  });
});

describe("Annual Billing Policy", () => {
  it("annual discount should be 10% (not 25%)", () => {
    expect(ANNUAL_DISCOUNT).toBe(0.10);
  });

  it("annual plans should be non-refundable", () => {
    expect(ANNUAL_REFUNDABLE).toBe(false);
  });

  it("annual policy notice should mention non-refundable", () => {
    expect(ANNUAL_POLICY_NOTICE.toLowerCase()).toContain("non-refundable");
  });

  it("annual prices should be approximately 10% off monthly * 12", () => {
    for (const plan of PLANS) {
      const expectedAnnual = Math.round(plan.monthlyPrice * 12 * 0.90 / 100) * 100;
      // Allow ±100 cents rounding tolerance
      expect(Math.abs(plan.annualPriceTotal - expectedAnnual)).toBeLessThanOrEqual(100);
    }
  });

  it("annualPricePerMonth should be less than monthlyPrice for all plans", () => {
    for (const plan of PLANS) {
      expect(plan.annualPricePerMonth).toBeLessThan(plan.monthlyPrice);
    }
  });
});

describe("User Add-On Pricing", () => {
  it("add-on price should be $30/user/mo", () => {
    expect(ADD_ON_PRICE_PER_USER).toBe(30);
  });

  it("should calculate add-on cost correctly for Success Starter (1 base, max 5)", () => {
    const plan = getPlanById("success_starter")!;
    // 2 extra users = $60/mo = 6000 cents
    expect(calculateAddOnCost(plan, 2)).toBe(6000);
    // 4 extra users = $120/mo = 12000 cents
    expect(calculateAddOnCost(plan, 4)).toBe(12000);
    // 5 extra users — capped at 4 (maxUsers 5 - baseUsers 1)
    expect(calculateAddOnCost(plan, 5)).toBe(12000);
  });

  it("should calculate add-on cost correctly for Growth Foundation (5 base, max 15)", () => {
    const plan = getPlanById("growth_foundation")!;
    // 10 extra users = $300/mo = 30000 cents
    expect(calculateAddOnCost(plan, 10)).toBe(30000);
    // 12 extra — capped at 10
    expect(calculateAddOnCost(plan, 12)).toBe(30000);
  });

  it("Fortune Plus should have zero add-on cost (no add-ons)", () => {
    const plan = getPlanById("fortune_plus")!;
    expect(calculateAddOnCost(plan, 5)).toBe(0);
  });
});

describe("Plan Lookup Helpers", () => {
  it("getPlanById should return the correct plan", () => {
    expect(getPlanById("fortune")?.name).toBe("Fortune");
    expect(getPlanById("fortune_plus")?.name).toBe("Fortune Plus");
    expect(getPlanById("nonexistent")).toBeUndefined();
  });

  it("getPlanByTier should return the correct plan", () => {
    expect(getPlanByTier("fortune_foundation")?.name).toBe("Fortune Foundation");
  });

  it("getTierLabel should return human-readable labels", () => {
    expect(getTierLabel("success_starter")).toBe("Success Starter");
    expect(getTierLabel("growth_foundation")).toBe("Growth Foundation");
    expect(getTierLabel("fortune_foundation")).toBe("Fortune Foundation");
    expect(getTierLabel("fortune")).toBe("Fortune");
    expect(getTierLabel("fortune_plus")).toBe("Fortune Plus");
    expect(getTierLabel("trial")).toBe("Free Trial");
  });
});
