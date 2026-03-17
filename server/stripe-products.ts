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
    monthlyPrice: 4900,   // $49/mo
    annualPrice: 3900,    // $39/mo billed annually
    maxUsers: 5,
    tier: "starter",
    features: [
      { text: "Up to 5 users", included: true },
      { text: "Contacts & Companies", included: true },
      { text: "Deal pipelines", included: true },
      { text: "Task management", included: true },
      { text: "Email campaigns", included: true },
      { text: "Basic analytics", included: true },
      { text: "Marketing automation", included: false },
      { text: "A/B testing", included: false },
      { text: "AI assistant", included: false },
      { text: "SMTP sending engine", included: false },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing teams that need advanced automation and analytics.",
    monthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_pro_monthly",
    annualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || "price_pro_annual",
    monthlyPrice: 9900,   // $99/mo
    annualPrice: 7900,    // $79/mo billed annually
    maxUsers: 25,
    tier: "professional",
    popular: true,
    features: [
      { text: "Up to 25 users", included: true },
      { text: "Contacts & Companies", included: true },
      { text: "Deal pipelines", included: true },
      { text: "Task management", included: true },
      { text: "Email campaigns", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Marketing automation", included: true },
      { text: "A/B testing", included: true },
      { text: "AI assistant", included: true },
      { text: "SMTP sending engine", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Unlimited scale with full SMTP engine and white-glove support.",
    monthlyPriceId: process.env.STRIPE_ENT_MONTHLY_PRICE_ID || "price_ent_monthly",
    annualPriceId: process.env.STRIPE_ENT_ANNUAL_PRICE_ID || "price_ent_annual",
    monthlyPrice: 24900,  // $249/mo
    annualPrice: 19900,   // $199/mo billed annually
    maxUsers: 9999,
    tier: "enterprise",
    features: [
      { text: "Unlimited users", included: true },
      { text: "Contacts & Companies", included: true },
      { text: "Deal pipelines", included: true },
      { text: "Task management", included: true },
      { text: "Email campaigns", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Marketing automation", included: true },
      { text: "A/B testing", included: true },
      { text: "AI assistant", included: true },
      { text: "SMTP sending engine (260 addresses)", included: true },
    ],
  },
];

export function getPlanById(id: string): StripePlan | undefined {
  return PLANS.find(p => p.id === id);
}

export function getPlanByTier(tier: string): StripePlan | undefined {
  return PLANS.find(p => p.tier === tier);
}
