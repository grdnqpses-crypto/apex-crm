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

  it("should have the correct display names in order", () => {
    const names = PLANS.map(p => p.name);
    expect(names).toEqual([
      "Solo",
      "Starter",
      "Growth",
      "Fortune Foundation",
      "Fortune Plus",
    ]);
  });

  it("should have the correct monthly prices", () => {
    const prices = PLANS.map(p => p.monthlyPrice);
    expect(prices).toEqual([4900, 9700, 29700, 49700, 149700]);
  });

  it("should have the correct base user counts", () => {
    const baseUsers = PLANS.map(p => p.baseUsers);
    expect(baseUsers).toEqual([1, 3, 10, 20, 100]);
  });

  it("Solo should be the entry-level tier at $49/mo", () => {
    const starter = getPlanById("success_starter");
    expect(starter?.monthlyPrice).toBe(4900);
    expect(starter?.baseUsers).toBe(1);
    expect(starter?.name).toBe("Solo");
  });

  it("Fortune Plus should be the top tier at $1,497/mo", () => {
    const fp = getPlanById("fortune_plus");
    expect(fp?.monthlyPrice).toBe(149700);
    expect(fp?.baseUsers).toBe(100);
    expect(fp?.name).toBe("Fortune Plus");
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
  it("standard add-on price should be $35/user/mo", () => {
    expect(ADD_ON_PRICE_PER_USER).toBe(35);
  });

  it("Fortune Plus should have $30/user/mo add-on", () => {
    const fp = getPlanById("fortune_plus");
    expect(fp?.addOnPricePerUser).toBe(3000);
  });

  it("Solo should have no add-on cost (0 add-on price)", () => {
    const plan = getPlanById("success_starter")!;
    expect(calculateAddOnCost(plan, 5)).toBe(0);
  });

  it("Starter should calculate add-on cost at $35/user/mo", () => {
    const plan = getPlanById("growth_foundation")!;
    // 2 extra users = $70/mo = 7000 cents
    expect(calculateAddOnCost(plan, 2)).toBe(7000);
    // 5 extra users = $175/mo = 17500 cents
    expect(calculateAddOnCost(plan, 5)).toBe(17500);
  });

  it("Fortune Plus add-on should be $30/user/mo", () => {
    const plan = getPlanById("fortune_plus")!;
    // 10 extra users = $300/mo = 30000 cents
    expect(calculateAddOnCost(plan, 10)).toBe(30000);
  });
});

describe("Plan Lookup Helpers", () => {
  it("getPlanById should return the correct plan", () => {
    expect(getPlanById("fortune")?.name).toBe("Fortune Foundation");
    expect(getPlanById("fortune_plus")?.name).toBe("Fortune Plus");
    expect(getPlanById("success_starter")?.name).toBe("Solo");
    expect(getPlanById("nonexistent")).toBeUndefined();
  });

  it("getPlanByTier should return the correct plan", () => {
    expect(getPlanByTier("fortune_foundation")?.name).toBe("Growth");
    expect(getPlanByTier("growth_foundation")?.name).toBe("Starter");
  });

  it("getTierLabel should return human-readable labels", () => {
    expect(getTierLabel("success_starter")).toBe("Solo");
    expect(getTierLabel("growth_foundation")).toBe("Starter");
    expect(getTierLabel("fortune_foundation")).toBe("Growth");
    expect(getTierLabel("fortune")).toBe("Fortune Foundation");
    expect(getTierLabel("fortune_plus")).toBe("Fortune Plus");
    expect(getTierLabel("trial")).toBe("Trial");
  });
});
