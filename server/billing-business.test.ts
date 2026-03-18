import { describe, it, expect } from "vitest";
import { BUSINESS_CATEGORIES, getCategory, getCategoryFeatures } from "../shared/businessCategories";

describe("Business Categories", () => {
  it("should have 10 business categories defined", () => {
    expect(Object.keys(BUSINESS_CATEGORIES).length).toBeGreaterThanOrEqual(10);
  });

  it("should include Freight & Logistics category", () => {
    const freight = BUSINESS_CATEGORIES["freight_logistics"];
    expect(freight).toBeDefined();
    expect(freight.label).toContain("Freight");
    expect(freight.features).toContain("load_management");
  });

  it("should include Manufacturing category with shipping feature", () => {
    const mfg = BUSINESS_CATEGORIES["manufacturing"];
    expect(mfg).toBeDefined();
    expect(mfg.features).toContain("shipping_receiving");
  });

  it("should include Professional Services category", () => {
    const ps = BUSINESS_CATEGORIES["professional_services"];
    expect(ps).toBeDefined();
    expect(ps.features).toContain("accounts_receivable");
  });

  it("getCategory should return the correct category object", () => {
    const cat = getCategory("freight_logistics");
    expect(cat).toBeDefined();
    expect(cat?.key).toBe("freight_logistics");
  });

  it("getCategory should return null for unknown category", () => {
    const cat = getCategory("unknown_category");
    expect(cat).toBeNull();
  });

  it("getCategoryFeatures should return feature list for valid category", () => {
    const features = getCategoryFeatures("retail_ecommerce");
    expect(Array.isArray(features)).toBe(true);
    expect(features.length).toBeGreaterThan(0);
  });

  it("getCategoryFeatures should return empty array for unknown category", () => {
    const features = getCategoryFeatures("nonexistent");
    expect(features).toEqual([]);
  });

  it("all categories should have required fields", () => {
    for (const [key, cat] of Object.entries(BUSINESS_CATEGORIES)) {
      expect(cat.key).toBe(key);
      expect(cat.label).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(Array.isArray(cat.features)).toBe(true);
      expect(Array.isArray(cat.subTypes)).toBe(true);
    }
  });

  it("all categories should have at least one feature", () => {
    for (const cat of Object.values(BUSINESS_CATEGORIES)) {
      expect(cat.features.length).toBeGreaterThan(0);
    }
  });
});

describe("Billing Management Logic", () => {
  it("should calculate correct 10% annual discount", () => {
    const monthlyPrice = 697; // Fortune plan
    const annualDiscount = 0.10;
    const annualPricePerMonth = Math.round(monthlyPrice * (1 - annualDiscount));
    const annualTotal = annualPricePerMonth * 12;
    expect(annualPricePerMonth).toBe(627);
    expect(annualTotal).toBe(7524);
  });

  it("should calculate correct savings for each tier", () => {
    const tiers = [
      { name: "Success Starter", monthly: 99 },
      { name: "Growth Foundation", monthly: 197 },
      { name: "Fortune Foundation", monthly: 497 },
      { name: "Fortune", monthly: 697 },
      { name: "Fortune Plus", monthly: 1497 },
    ];
    for (const tier of tiers) {
      const annualPerMonth = Math.round(tier.monthly * 0.9);
      const savings = (tier.monthly - annualPerMonth) * 12;
      expect(savings).toBeGreaterThan(0);
      expect(annualPerMonth).toBeLessThan(tier.monthly);
    }
  });

  it("should enforce non-refundable policy for annual plans", () => {
    // Simulate the server-side check
    const checkAnnualAcknowledgment = (billing: string, acknowledged?: boolean) => {
      if (billing === "annual" && !acknowledged) {
        throw new Error("You must acknowledge that annual plans are non-refundable");
      }
      return true;
    };
    expect(() => checkAnnualAcknowledgment("annual", false)).toThrow("non-refundable");
    expect(() => checkAnnualAcknowledgment("annual", undefined)).toThrow("non-refundable");
    expect(checkAnnualAcknowledgment("annual", true)).toBe(true);
    expect(checkAnnualAcknowledgment("monthly")).toBe(true);
  });
});

describe("AR/AP Invoice Logic", () => {
  it("should calculate balance due correctly", () => {
    const totalCents = 150000; // $1,500.00
    const amountPaidCents = 50000; // $500.00
    const balanceDue = totalCents - amountPaidCents;
    expect(balanceDue).toBe(100000); // $1,000.00
  });

  it("should detect overdue invoices correctly", () => {
    const now = Date.now();
    const pastDue = now - 5 * 86400000; // 5 days ago
    const futureDue = now + 30 * 86400000; // 30 days from now
    const isOverdue = (dueDate: number, status: string) =>
      dueDate < now && !["paid", "void"].includes(status);
    expect(isOverdue(pastDue, "open")).toBe(true);
    expect(isOverdue(pastDue, "paid")).toBe(false);
    expect(isOverdue(futureDue, "open")).toBe(false);
  });

  it("should format currency correctly", () => {
    const fmt = (cents: number) =>
      `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    expect(fmt(150000)).toBe("$1,500.00");
    expect(fmt(9900)).toBe("$99.00");
    expect(fmt(0)).toBe("$0.00");
  });

  it("should calculate aging buckets correctly", () => {
    const now = Date.now();
    const getAgingBucket = (dueDate: number) => {
      const daysOverdue = Math.floor((now - dueDate) / 86400000);
      if (daysOverdue <= 0) return "current";
      if (daysOverdue <= 30) return "1-30";
      if (daysOverdue <= 60) return "31-60";
      return "90+";
    };
    expect(getAgingBucket(now + 86400000)).toBe("current");
    expect(getAgingBucket(now - 15 * 86400000)).toBe("1-30");
    expect(getAgingBucket(now - 45 * 86400000)).toBe("31-60");
    expect(getAgingBucket(now - 100 * 86400000)).toBe("90+");
  });
});

describe("Subscription Invoice Management", () => {
  it("should correctly identify overdue tenants", () => {
    const invoices = [
      { siStatus: "paid", amountDueCents: 69700, amountPaidCents: 69700 },
      { siStatus: "overdue", amountDueCents: 49700, amountPaidCents: 0 },
      { siStatus: "open", amountDueCents: 19700, amountPaidCents: 0 },
    ];
    const overdueInvoices = invoices.filter(inv => inv.siStatus === "overdue");
    const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + (inv.amountDueCents - inv.amountPaidCents), 0);
    expect(overdueInvoices.length).toBe(1);
    expect(overdueTotal).toBe(49700);
  });

  it("should calculate MRR from active subscriptions", () => {
    const plans = [
      { tier: "success_starter", monthlyPrice: 99 },
      { tier: "growth_foundation", monthlyPrice: 197 },
      { tier: "fortune_foundation", monthlyPrice: 497 },
      { tier: "fortune", monthlyPrice: 697 },
      { tier: "fortune_plus", monthlyPrice: 1497 },
    ];
    const companies = [
      { subscriptionTier: "fortune", subscriptionStatus: "active" },
      { subscriptionTier: "growth_foundation", subscriptionStatus: "active" },
      { subscriptionTier: "success_starter", subscriptionStatus: "trial" }, // not counted
    ];
    let mrr = 0;
    for (const c of companies) {
      const plan = plans.find(p => p.tier === c.subscriptionTier);
      if (plan && c.subscriptionStatus === "active") mrr += plan.monthlyPrice;
    }
    expect(mrr).toBe(697 + 197); // 894
  });
});
