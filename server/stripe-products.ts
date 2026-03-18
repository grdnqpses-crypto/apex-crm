// ─── Apex CRM Stripe Products & Pricing ───
// Centralized product/price definitions for consistency across checkout and UI
//
// Tier Structure:
//   success_starter    — $99/mo    — 1 user   — add-on up to 5 users
//   growth_foundation  — $197/mo   — 5 users  — add-on up to 15 users
//   fortune_foundation — $497/mo   — 15 users — add-on up to 25 users
//   fortune            — $697/mo   — 25 users — add-on up to 40 users
//   fortune_plus       — $1,497/mo — 50 users — no add-on (top tier)
//
// Annual billing: 10% discount, NON-REFUNDABLE for any reason.
// Add-on: $30/user/mo, up to the next tier's base user count.

export const ADD_ON_PRICE_PER_USER = 30; // $30/user/mo
export const ANNUAL_DISCOUNT = 0.10;     // 10% off
export const ANNUAL_REFUNDABLE = false;  // Annual plans are non-refundable

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface StripePlan {
  id: string;
  name: string;
  description: string;
  monthlyPriceId: string;      // Stripe Price ID (monthly, refundable)
  annualPriceId: string;       // Stripe Price ID (annual, 10% off, NON-REFUNDABLE)
  monthlyPrice: number;        // USD cents per month
  annualPricePerMonth: number; // USD cents per month when billed annually (display)
  annualPriceTotal: number;    // USD cents billed upfront annually
  baseUsers: number;
  maxUsers: number;
  addOnMaxUsers: number | null;
  features: PlanFeature[];
  popular?: boolean;
  tier: "trial" | "success_starter" | "growth_foundation" | "fortune_foundation" | "fortune" | "fortune_plus";
}

export const PLANS: StripePlan[] = [
  // ─── Tier 0: Success Starter ─────────────────────────────────────────────
  {
    id: "success_starter",
    name: "Success Starter",
    description: "The perfect launchpad for solo brokers and independent agents.",
    monthlyPriceId: process.env.STRIPE_PRICE_SUCCESS_STARTER_MONTHLY || "",
    annualPriceId:  process.env.STRIPE_PRICE_SUCCESS_STARTER_ANNUAL  || "",
    monthlyPrice:       9900,   // $99.00/mo
    annualPricePerMonth: 8910,  // $89.10/mo (10% off)
    annualPriceTotal:  106900,  // $1,069.00/yr billed upfront
    baseUsers: 1,
    maxUsers: 5,
    addOnMaxUsers: 5,
    tier: "success_starter",
    features: [
      { text: "1 user included", included: true },
      { text: "Add up to 4 more users ($30/user/mo)", included: true },
      { text: "2,500 contacts", included: true },
      { text: "Core CRM (contacts, companies, deals)", included: true },
      { text: "Email campaigns", included: true },
      { text: "Load management", included: true },
      { text: "AI Assistant (CRM features)", included: true },
      { text: "Standard support", included: true },
      { text: "Paradigm Engine™", included: false },
      { text: "260 SMTP rotation", included: false },
      { text: "Compliance Fortress™", included: false },
      { text: "White-label option", included: false },
    ],
  },

  // ─── Tier 1: Growth Foundation ───────────────────────────────────────────
  {
    id: "growth_foundation",
    name: "Growth Foundation",
    description: "Built for small brokerages ready to scale their pipeline.",
    monthlyPriceId: process.env.STRIPE_PRICE_GROWTH_FOUNDATION_MONTHLY || "",
    annualPriceId:  process.env.STRIPE_PRICE_GROWTH_FOUNDATION_ANNUAL  || "",
    monthlyPrice:       19700,
    annualPricePerMonth: 17730,  // $177.30/mo
    annualPriceTotal:   212800,  // $2,128.00/yr
    baseUsers: 5,
    maxUsers: 15,
    addOnMaxUsers: 15,
    tier: "growth_foundation",
    features: [
      { text: "5 users included", included: true },
      { text: "Add up to 10 more users ($30/user/mo)", included: true },
      { text: "10,000 contacts", included: true },
      { text: "Full CRM suite", included: true },
      { text: "Paradigm Engine™ (Basic)", included: true },
      { text: "Ghost Mode sequences", included: true },
      { text: "Deliverability suite", included: true },
      { text: "AI Assistant (CRM features)", included: true },
      { text: "Standard support", included: true },
      { text: "260 SMTP rotation", included: false },
      { text: "Compliance Fortress™", included: false },
      { text: "White-label option", included: false },
    ],
  },

  // ─── Tier 2: Fortune Foundation ──────────────────────────────────────────
  {
    id: "fortune_foundation",
    name: "Fortune Foundation",
    description: "Advanced automation and AI for mid-size freight operations.",
    monthlyPriceId: process.env.STRIPE_PRICE_FORTUNE_FOUNDATION_MONTHLY || "",
    annualPriceId:  process.env.STRIPE_PRICE_FORTUNE_FOUNDATION_ANNUAL  || "",
    monthlyPrice:       49700,
    annualPricePerMonth: 44730,  // $447.30/mo
    annualPriceTotal:   536800,  // $5,368.00/yr
    baseUsers: 15,
    maxUsers: 25,
    addOnMaxUsers: 25,
    tier: "fortune_foundation",
    popular: true,
    features: [
      { text: "15 users included", included: true },
      { text: "Add up to 10 more users ($30/user/mo)", included: true },
      { text: "50,000 contacts", included: true },
      { text: "Paradigm Engine™ (Full)", included: true },
      { text: "Ghost Mode + Battle Cards", included: true },
      { text: "260 SMTP rotation", included: true },
      { text: "Compliance Fortress™", included: true },
      { text: "Voice Agent (500 calls/mo)", included: true },
      { text: "DocScan + Win Probability", included: true },
      { text: "Priority support", included: true },
      { text: "Custom branding", included: true },
      { text: "White-label option", included: false },
    ],
  },

  // ─── Tier 3: Fortune ─────────────────────────────────────────────────────
  {
    id: "fortune",
    name: "Fortune",
    description: "The complete platform for high-performance brokerage teams.",
    monthlyPriceId: process.env.STRIPE_PRICE_FORTUNE_MONTHLY || "",
    annualPriceId:  process.env.STRIPE_PRICE_FORTUNE_ANNUAL  || "",
    monthlyPrice:       69700,
    annualPricePerMonth: 62730,  // $627.30/mo
    annualPriceTotal:   752800,  // $7,528.00/yr
    baseUsers: 25,
    maxUsers: 40,
    addOnMaxUsers: 40,
    tier: "fortune",
    features: [
      { text: "25 users included", included: true },
      { text: "Add up to 15 more users ($30/user/mo)", included: true },
      { text: "100,000 contacts", included: true },
      { text: "All Fortune Foundation features", included: true },
      { text: "Voice Agent (unlimited calls)", included: true },
      { text: "Revenue Autopilot", included: true },
      { text: "Apex Autopilot", included: true },
      { text: "Custom AI training", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "White-label option", included: true },
      { text: "SLA guarantee", included: false },
    ],
  },

  // ─── Tier 4: Fortune Plus ─────────────────────────────────────────────────
  {
    id: "fortune_plus",
    name: "Fortune Plus",
    description: "Enterprise-grade scale with white-glove support and full infrastructure.",
    monthlyPriceId: process.env.STRIPE_PRICE_FORTUNE_PLUS_MONTHLY || "",
    annualPriceId:  process.env.STRIPE_PRICE_FORTUNE_PLUS_ANNUAL  || "",
    monthlyPrice:        149700,
    annualPricePerMonth: 134730,  // $1,347.30/mo
    annualPriceTotal:   1616800,  // $16,168.00/yr
    baseUsers: 50,
    maxUsers: 50,
    addOnMaxUsers: null,
    tier: "fortune_plus",
    features: [
      { text: "50 users included", included: true },
      { text: "Unlimited contacts", included: true },
      { text: "All Fortune features", included: true },
      { text: "Dedicated SMTP infrastructure", included: true },
      { text: "Custom AI training", included: true },
      { text: "99.9% SLA guarantee", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "White-label option", included: true },
      { text: "Custom branding", included: true },
      { text: "Priority 24/7 support", included: true },
    ],
  },
];

export const USER_ADDON_PRICE_ID = process.env.STRIPE_PRICE_USER_ADDON || "";

export function getPlanById(id: string): StripePlan | undefined {
  return PLANS.find(p => p.id === id);
}

export function getPlanByTier(tier: string): StripePlan | undefined {
  return PLANS.find(p => p.tier === tier);
}

/** Calculate the add-on cost for extra users on a given plan (in cents) */
export function calculateAddOnCost(plan: StripePlan, extraUsers: number): number {
  if (!plan.addOnMaxUsers || extraUsers <= 0) return 0;
  const maxExtra = plan.addOnMaxUsers - plan.baseUsers;
  const billableExtra = Math.min(extraUsers, maxExtra);
  return billableExtra * ADD_ON_PRICE_PER_USER * 100;
}

/** Get the tier display label for UI */
export function getTierLabel(tierId: string): string {
  const labels: Record<string, string> = {
    trial: "Free Trial",
    success_starter: "Success Starter",
    growth_foundation: "Growth Foundation",
    fortune_foundation: "Fortune Foundation",
    fortune: "Fortune",
    fortune_plus: "Fortune Plus",
  };
  return labels[tierId] ?? tierId;
}

/** Annual billing policy notice — must be shown and acknowledged before annual checkout */
export const ANNUAL_POLICY_NOTICE =
  "Annual plans are billed upfront and are NON-REFUNDABLE for any reason. " +
  "By proceeding, you acknowledge and agree that no refunds will be issued for annual subscriptions, " +
  "including partial-year cancellations.";
