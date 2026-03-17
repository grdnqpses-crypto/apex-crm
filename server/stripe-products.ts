// ─── Apex CRM Stripe Products & Pricing ───
// Centralized product/price definitions for consistency across checkout and UI

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface StripePlan {
  id: string;
  name: string;
  description: string;
  monthlyPriceId: string; // Stripe Price ID (monthly)
  annualPriceId: string;  // Stripe Price ID (annual)
  monthlyPrice: number;   // Display price in USD cents
  annualPrice: number;    // Display price in USD cents (per month, billed annually)
  maxUsers: number;
  features: PlanFeature[];
  popular?: boolean;
  tier: "trial" | "starter" | "professional" | "enterprise";
}

// NOTE: Replace price IDs with actual Stripe Price IDs from your dashboard.
// For testing, create products/prices in the Stripe test dashboard.
export const PLANS: StripePlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small sales teams getting started with CRM.",
    monthlyPriceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || "price_starter_monthly",
    annualPriceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || "price_starter_annual",
    monthlyPrice: 19700,  // $197/mo
    annualPrice: 14775,   // $147.75/mo billed annually (25% off)
    maxUsers: 5,
    tier: "starter",
    features: [
      { text: "Up to 5 users", included: true },
      { text: "10,000 contacts", included: true },
      { text: "Paradigm Engine™ (Basic)", included: true },
      { text: "Ghost Mode sequences", included: true },
      { text: "Deliverability suite", included: true },
      { text: "Standard support", included: true },
      { text: "260 SMTP rotation", included: false },
      { text: "Compliance Fortress™", included: false },
      { text: "Custom branding", included: false },
      { text: "White-label option", included: false },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing teams that need advanced automation and analytics.",
    monthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_pro_monthly",
    annualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || "price_pro_annual",
    monthlyPrice: 69700,  // $697/mo
    annualPrice: 52275,   // $522.75/mo billed annually (25% off)
    maxUsers: 25,
    tier: "professional",
    popular: true,
    features: [
      { text: "Up to 25 users", included: true },
      { text: "100,000 contacts", included: true },
      { text: "Paradigm Engine™ (Full)", included: true },
      { text: "Ghost Mode + Battle Cards", included: true },
      { text: "260 SMTP rotation", included: true },
      { text: "Compliance Fortress™", included: true },
      { text: "Priority support", included: true },
      { text: "Custom branding", included: true },
      { text: "White-label option", included: false },
      { text: "Dedicated account manager", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Unlimited scale with full SMTP engine and white-glove support.",
    monthlyPriceId: process.env.STRIPE_ENT_MONTHLY_PRICE_ID || "price_ent_monthly",
    annualPriceId: process.env.STRIPE_ENT_ANNUAL_PRICE_ID || "price_ent_annual",
    monthlyPrice: 149700, // $1,497/mo
    annualPrice: 112275,  // $1,122.75/mo billed annually (25% off)
    maxUsers: 9999,
    tier: "enterprise",
    features: [
      { text: "Unlimited users", included: true },
      { text: "Unlimited contacts", included: true },
      { text: "All Professional features", included: true },
      { text: "Dedicated SMTP infrastructure", included: true },
      { text: "Custom AI training", included: true },
      { text: "SLA guarantee", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "White-label option", included: true },
      { text: "Custom branding", included: true },
      { text: "Priority 24/7 support", included: true },
    ],
  },
];

export function getPlanById(id: string): StripePlan | undefined {
  return PLANS.find(p => p.id === id);
}

export function getPlanByTier(tier: string): StripePlan | undefined {
  return PLANS.find(p => p.tier === tier);
}
