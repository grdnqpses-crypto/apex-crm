// ─── Apex CRM Stripe Products & Pricing ───────────────────────────────────────
//
// PRICING STRATEGY:
//   All tiers priced 25%+ below true competitors (HubSpot, Salesforce, Close CRM).
//   High-maintenance Apex-unique services (SMTP engine, Compliance Fortress™,
//   BNB Paradigm Engine™, White-labeling, Dedicated SMTP infra) are unlocked at
//   premium tiers where the operational cost is justified.
//
//   Freemium anchors (FREE across ALL tiers — never gated):
//     • Data entry (contacts, companies, deals, tasks, notes)
//     • One-click migration (competitive differentiator — removes switching friction)
//     • Business category intelligence (adaptive UI/terminology)
//     • AI Assistant: first 50 queries/month
//     • Basic AR/AP (manual entry)
//     • Basic Shipping/Receiving (manual entry)
//
//   Competitor comparison (per-seat, full-featured):
//     HubSpot Pro:        $100/seat/mo  |  Apex Fortune Foundation: $24.93/seat/mo  (75% savings)
//     Salesforce Pro:     $100/seat/mo  |  Apex Fortune Foundation: $24.93/seat/mo  (75% savings)
//     Close Growth:       $109/seat/mo  |  Apex Fortune:            $20.96/seat/mo  (81% savings)
//
// Tier Structure:
//   success_starter    — $74/mo    — 1 user    — add-on up to 5 users  @ $25/user/mo
//   growth_foundation  — $149/mo   — 5 users   — add-on up to 15 users @ $25/user/mo
//   fortune_foundation — $374/mo   — 15 users  — add-on up to 25 users @ $25/user/mo  ⭐ Most Popular
//   fortune            — $524/mo   — 25 users  — add-on up to 40 users @ $25/user/mo
//   fortune_plus       — $1,124/mo — 50 users  — no add-on (top tier)
//
// Annual billing: 10% discount, NON-REFUNDABLE for any reason.

export const ADD_ON_PRICE_PER_USER = 25;  // $25/user/mo (was $30 — 25% below market)
export const ANNUAL_DISCOUNT = 0.10;      // 10% off
export const ANNUAL_REFUNDABLE = false;   // Annual plans are non-refundable

// ─── Feature Tier Access Levels ──────────────────────────────────────────────
// Used throughout the app to gate features by subscription tier.
// Higher number = higher tier required.
export const TIER_LEVELS: Record<string, number> = {
  trial:              0,
  success_starter:    1,
  growth_foundation:  2,
  fortune_foundation: 3,
  fortune:            4,
  fortune_plus:       5,
};

// ─── Feature Gate Definitions ────────────────────────────────────────────────
// Maps feature keys to the minimum tier level required.
// Level 0 = free for all (including trial).
export const FEATURE_GATES: Record<string, number> = {
  // Always free — never gated
  data_entry:                 0,  // contacts, companies, deals, tasks, notes
  one_click_migration:        0,  // competitive differentiator
  business_category_intel:    0,  // adaptive UI/terminology
  ai_assistant_base:          0,  // 50 queries/month free
  ar_ap_basic:                0,  // manual entry only
  shipping_receiving_basic:   0,  // manual entry only
  bnb_engine_freemium:        0,  // 50 prospects/month free

  // Success Starter (level 1)
  core_crm:                   1,  // contacts, companies, deals, pipeline
  email_templates:            1,  // up to 25 templates
  basic_campaigns:            1,  // 500 sends/month
  domain_health_single:       1,  // 1 domain monitoring

  // Growth Foundation (level 2)
  marketing_automation:       2,  // visual workflow builder
  lead_scoring:               2,  // engagement-based scoring
  bnb_engine_growth:          2,  // 500 prospects/month
  ghost_mode_limited:         2,  // 3 active sequences
  deliverability_basic:       2,  // warm-up, SPF/DKIM guidance
  domain_health_multi:        2,  // up to 5 domains
  compliance_can_spam:        2,  // CAN-SPAM enforcement only
  ar_ap_automation:           2,  // automation rules, bulk invoicing
  shipping_receiving_full:    2,  // carrier integration, tracking

  // Fortune Foundation (level 3) — HIGH-MAINTENANCE services unlocked
  smtp_260_rotation:          3,  // 260 SMTP addresses, rotation (HIGH MAINTENANCE)
  compliance_full:            3,  // GDPR + CCPA + CAN-SPAM (MEDIUM MAINTENANCE)
  bnb_engine_full:            3,  // unlimited prospects, all 8 AI layers (HIGH MAINTENANCE)
  ghost_mode_unlimited:       3,  // unlimited sequences
  battle_cards:               3,  // AI tactical summaries
  behavioral_dna:             3,  // psychographic profiling
  predictive_send_time:       3,  // per-prospect optimal timing
  voice_agent_limited:        3,  // 200 calls/month
  docscan_limited:            3,  // 50 scans/month
  win_probability:            3,  // deal scoring engine
  visitor_tracking_limited:   3,  // 1,000 visitors/month
  custom_branding:            3,  // logo, colors (not full white-label)

  // Fortune (level 4) — Premium unique features
  voice_agent_unlimited:      4,  // unlimited calls
  docscan_unlimited:          4,  // unlimited scans
  revenue_autopilot:          4,  // "Money Machine" revenue recommendations
  apex_autopilot:             4,  // freight consolidation + lane prediction
  custom_ai_training_basic:   4,  // basic model fine-tuning
  visitor_tracking_unlimited: 4,  // unlimited visitor tracking
  white_labeling:             4,  // full white-label (MEDIUM MAINTENANCE — premium)
  dedicated_account_manager:  4,  // human account manager
  sla_995:                    4,  // 99.5% uptime SLA

  // Fortune Plus (level 5) — Enterprise, very high maintenance
  dedicated_smtp_infra:       5,  // dedicated IPs, custom domain pools (VERY HIGH MAINTENANCE)
  custom_ai_training_full:    5,  // unlimited model training (VERY HIGH MAINTENANCE)
  sla_999:                    5,  // 99.9% uptime SLA
  priority_247_support:       5,  // 24/7 white-glove support
};

// ─── Contact & Usage Limits by Tier ──────────────────────────────────────────
export const TIER_LIMITS: Record<string, {
  contacts: number | null;
  emailSendsPerMonth: number | null;
  bnbProspectsPerMonth: number | null;
  voiceCallsPerMonth: number | null;
  docScansPerMonth: number | null;
  visitorTrackingPerMonth: number | null;
  domainsMonitored: number | null;
  ghostModeActive: number | null;
}> = {
  trial: {
    contacts: 100,
    emailSendsPerMonth: 50,
    bnbProspectsPerMonth: 10,
    voiceCallsPerMonth: 0,
    docScansPerMonth: 0,
    visitorTrackingPerMonth: 0,
    domainsMonitored: 1,
    ghostModeActive: 0,
  },
  success_starter: {
    contacts: 5000,
    emailSendsPerMonth: 500,
    bnbProspectsPerMonth: 50,
    voiceCallsPerMonth: 0,
    docScansPerMonth: 0,
    visitorTrackingPerMonth: 0,
    domainsMonitored: 1,
    ghostModeActive: 0,
  },
  growth_foundation: {
    contacts: 25000,
    emailSendsPerMonth: 5000,
    bnbProspectsPerMonth: 500,
    voiceCallsPerMonth: 0,
    docScansPerMonth: 0,
    visitorTrackingPerMonth: 0,
    domainsMonitored: 5,
    ghostModeActive: 3,
  },
  fortune_foundation: {
    contacts: 100000,
    emailSendsPerMonth: 50000,
    bnbProspectsPerMonth: null,  // unlimited
    voiceCallsPerMonth: 200,
    docScansPerMonth: 50,
    visitorTrackingPerMonth: 1000,
    domainsMonitored: null,      // unlimited
    ghostModeActive: null,       // unlimited
  },
  fortune: {
    contacts: 250000,
    emailSendsPerMonth: 200000,
    bnbProspectsPerMonth: null,
    voiceCallsPerMonth: null,    // unlimited
    docScansPerMonth: null,      // unlimited
    visitorTrackingPerMonth: null,
    domainsMonitored: null,
    ghostModeActive: null,
  },
  fortune_plus: {
    contacts: null,              // unlimited
    emailSendsPerMonth: null,    // unlimited
    bnbProspectsPerMonth: null,
    voiceCallsPerMonth: null,
    docScansPerMonth: null,
    visitorTrackingPerMonth: null,
    domainsMonitored: null,
    ghostModeActive: null,
  },
};

export interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;   // show as a standout feature
  premium?: boolean;     // mark as high-value premium feature
  freemium?: boolean;    // mark as freemium (limited free, more on upgrade)
}

export interface StripePlan {
  id: string;
  name: string;
  tagline: string;
  description: string;
  monthlyPriceId: string;
  annualPriceId: string;
  monthlyPrice: number;        // USD cents per month
  annualPricePerMonth: number; // USD cents per month when billed annually
  annualPriceTotal: number;    // USD cents billed upfront annually
  baseUsers: number;
  maxUsers: number;
  addOnMaxUsers: number | null;
  addOnPricePerUser: number;   // cents per user per month
  contactLimit: number | null; // null = unlimited
  emailSendsPerMonth: number | null;
  features: PlanFeature[];
  popular?: boolean;
  tier: "trial" | "success_starter" | "growth_foundation" | "fortune_foundation" | "fortune" | "fortune_plus";
  competitorSavings?: string;  // e.g. "75% less than HubSpot"
  vsCompetitor?: string;       // e.g. "HubSpot Pro: $500/mo"
}

export const PLANS: StripePlan[] = [

  // ─── Tier 0: Success Starter ─────────────────────────────────────────────
  // Priced 25% below HubSpot Starter + Close Essentials equivalent for 1 user.
  // HubSpot Starter: $20/mo + Close Essentials: $49/mo → avg ~$35-99 for comparable.
  // Apex: $74/mo includes AI assistant, business category intel, migration — far more value.
  {
    id: "success_starter",
    name: "Success Starter",
    tagline: "Launch your CRM in minutes.",
    description: "Everything a solo operator needs to manage contacts, deals, and outreach — with AI built in from day one.",
    monthlyPriceId: process.env.STRIPE_PRICE_SUCCESS_STARTER_MONTHLY || "",
    annualPriceId:  process.env.STRIPE_PRICE_SUCCESS_STARTER_ANNUAL  || "",
    monthlyPrice:        7400,   // $74.00/mo
    annualPricePerMonth: 6660,   // $66.60/mo (10% off)
    annualPriceTotal:    79920,  // $799.20/yr billed upfront
    baseUsers: 1,
    maxUsers: 5,
    addOnMaxUsers: 5,
    addOnPricePerUser: 2500,     // $25/user/mo
    contactLimit: 5000,
    emailSendsPerMonth: 500,
    tier: "success_starter",
    competitorSavings: "26% less than HubSpot Starter",
    vsCompetitor: "HubSpot Starter: $100/mo for comparable features",
    features: [
      { text: "1 user included", included: true },
      { text: "Add up to 4 more users ($25/user/mo)", included: true },
      { text: "5,000 contacts", included: true },
      { text: "Core CRM — contacts, companies, deals, pipeline", included: true },
      { text: "Tasks, activities, notes, calendar", included: true },
      { text: "25 email templates", included: true },
      { text: "500 email sends/month", included: true },
      { text: "AI Assistant — 50 queries/month FREE", included: true, freemium: true },
      { text: "One-click migration from any CRM — FREE", included: true, highlight: true },
      { text: "Business category intelligence — FREE", included: true, highlight: true },
      { text: "Basic AR/AP (manual entry) — FREE", included: true, freemium: true },
      { text: "Basic Shipping & Receiving — FREE", included: true, freemium: true },
      { text: "BNB Prospecting — 50 prospects/month FREE", included: true, freemium: true },
      { text: "1 domain health monitor", included: true },
      { text: "Email support", included: true },
      { text: "Marketing automation & sequences", included: false },
      { text: "260 SMTP rotation engine", included: false },
      { text: "Compliance Fortress™", included: false },
      { text: "Ghost Mode sequences", included: false },
      { text: "White-labeling", included: false },
    ],
  },

  // ─── Tier 1: Growth Foundation ───────────────────────────────────────────
  // HubSpot Pro 5-seat: $500/mo | Salesforce Pro 5-seat: $500/mo | Close Growth 5-seat: $545/mo
  // Apex at $149/mo = 70% below HubSpot Pro for 5 users.
  // Per-seat: $29.80 vs HubSpot $100 = 70% savings.
  {
    id: "growth_foundation",
    name: "Growth Foundation",
    tagline: "Scale your pipeline with automation.",
    description: "Full automation, lead scoring, and the BNB Paradigm Engine™ for teams ready to grow — at 70% less than HubSpot Pro.",
    monthlyPriceId: process.env.STRIPE_PRICE_GROWTH_FOUNDATION_MONTHLY || "",
    annualPriceId:  process.env.STRIPE_PRICE_GROWTH_FOUNDATION_ANNUAL  || "",
    monthlyPrice:        14900,  // $149.00/mo
    annualPricePerMonth: 13410,  // $134.10/mo (10% off)
    annualPriceTotal:   160920,  // $1,609.20/yr
    baseUsers: 5,
    maxUsers: 15,
    addOnMaxUsers: 15,
    addOnPricePerUser: 2500,
    contactLimit: 25000,
    emailSendsPerMonth: 5000,
    tier: "growth_foundation",
    competitorSavings: "70% less than HubSpot Pro",
    vsCompetitor: "HubSpot Pro (5 users): $500/mo",
    features: [
      { text: "5 users included", included: true },
      { text: "Add up to 10 more users ($25/user/mo)", included: true },
      { text: "25,000 contacts", included: true },
      { text: "Full CRM suite", included: true },
      { text: "Unlimited email templates", included: true },
      { text: "5,000 email sends/month", included: true },
      { text: "Marketing automation (visual workflow builder)", included: true, highlight: true },
      { text: "Lead scoring", included: true },
      { text: "BNB Paradigm Engine™ — 500 prospects/month", included: true, highlight: true },
      { text: "Ghost Mode sequences — 3 active", included: true },
      { text: "Deliverability suite (warm-up, SPF/DKIM guidance)", included: true },
      { text: "5 domain health monitors", included: true },
      { text: "Compliance Fortress™ — CAN-SPAM", included: true },
      { text: "AR/AP automation (rules, bulk invoicing)", included: true },
      { text: "Shipping & Receiving full module", included: true },
      { text: "AI Assistant — 50 queries/month FREE + credit overage", included: true, freemium: true },
      { text: "One-click migration — FREE", included: true },
      { text: "Business category intelligence — FREE", included: true },
      { text: "Email + live chat support", included: true },
      { text: "260 SMTP rotation engine", included: false },
      { text: "Full Compliance Fortress™ (GDPR/CCPA)", included: false },
      { text: "Voice Agent", included: false },
      { text: "White-labeling", included: false },
    ],
  },

  // ─── Tier 2: Fortune Foundation ──────────────────────────────────────────
  // HubSpot Pro 15-seat: $1,500/mo | Salesforce Enterprise 15-seat: $2,625/mo
  // Apex at $374/mo = 75% below HubSpot Pro for 15 users.
  // Per-seat: $24.93 vs HubSpot $100 = 75% savings.
  // HIGH-MAINTENANCE services unlocked here: 260 SMTP, Full Compliance, Full BNB Engine.
  // These carry real operational cost — justified at this tier.
  {
    id: "fortune_foundation",
    name: "Fortune Foundation",
    tagline: "Enterprise deliverability. Mid-market price.",
    description: "The full Apex arsenal: 260 SMTP rotation, Compliance Fortress™, and the complete BNB Paradigm Engine™ — at 75% less than HubSpot Pro.",
    monthlyPriceId: process.env.STRIPE_PRICE_FORTUNE_FOUNDATION_MONTHLY || "",
    annualPriceId:  process.env.STRIPE_PRICE_FORTUNE_FOUNDATION_ANNUAL  || "",
    monthlyPrice:        37400,  // $374.00/mo
    annualPricePerMonth: 33660,  // $336.60/mo (10% off)
    annualPriceTotal:   403920,  // $4,039.20/yr
    baseUsers: 15,
    maxUsers: 25,
    addOnMaxUsers: 25,
    addOnPricePerUser: 2500,
    contactLimit: 100000,
    emailSendsPerMonth: 50000,
    tier: "fortune_foundation",
    popular: true,
    competitorSavings: "75% less than HubSpot Pro",
    vsCompetitor: "HubSpot Pro (15 users): $1,500/mo",
    features: [
      { text: "15 users included", included: true },
      { text: "Add up to 10 more users ($25/user/mo)", included: true },
      { text: "100,000 contacts", included: true },
      { text: "All Growth Foundation features", included: true },
      { text: "260 SMTP rotation engine", included: true, highlight: true, premium: true },
      { text: "Compliance Fortress™ — CAN-SPAM + GDPR + CCPA", included: true, highlight: true, premium: true },
      { text: "BNB Paradigm Engine™ Full — unlimited prospects, all 8 AI layers", included: true, highlight: true, premium: true },
      { text: "Ghost Mode — unlimited sequences", included: true },
      { text: "Battle Cards — AI tactical summaries", included: true },
      { text: "Behavioral DNA Profiler", included: true },
      { text: "Predictive Send Time Optimizer", included: true },
      { text: "50,000 email sends/month", included: true },
      { text: "Voice Agent — 200 calls/month", included: true, premium: true },
      { text: "DocScan — 50 scans/month", included: true, premium: true },
      { text: "Win Probability Engine", included: true },
      { text: "Visitor Tracking — 1,000/month", included: true },
      { text: "Custom branding (logo, colors)", included: true },
      { text: "Unlimited domain health monitors", included: true },
      { text: "Priority support", included: true },
      { text: "White-labeling", included: false },
      { text: "Dedicated SMTP infrastructure", included: false },
      { text: "Revenue Autopilot", included: false },
    ],
  },

  // ─── Tier 3: Fortune ─────────────────────────────────────────────────────
  // HubSpot Enterprise 25-seat: $3,000/mo | Salesforce Enterprise 25-seat: $4,375/mo
  // Apex at $524/mo = 83% below HubSpot Enterprise for 25 users.
  // White-labeling unlocked here — medium maintenance, premium value.
  {
    id: "fortune",
    name: "Fortune",
    tagline: "Your brand. Your platform. Unlimited scale.",
    description: "White-labeling, Revenue Autopilot, and unlimited AI — the complete platform for high-performance teams at 83% less than HubSpot Enterprise.",
    monthlyPriceId: process.env.STRIPE_PRICE_FORTUNE_MONTHLY || "",
    annualPriceId:  process.env.STRIPE_PRICE_FORTUNE_ANNUAL  || "",
    monthlyPrice:        52400,  // $524.00/mo
    annualPricePerMonth: 47160,  // $471.60/mo (10% off)
    annualPriceTotal:   565920,  // $5,659.20/yr
    baseUsers: 25,
    maxUsers: 40,
    addOnMaxUsers: 40,
    addOnPricePerUser: 2500,
    contactLimit: 250000,
    emailSendsPerMonth: 200000,
    tier: "fortune",
    competitorSavings: "83% less than HubSpot Enterprise",
    vsCompetitor: "HubSpot Enterprise (25 users): $3,000/mo",
    features: [
      { text: "25 users included", included: true },
      { text: "Add up to 15 more users ($25/user/mo)", included: true },
      { text: "250,000 contacts", included: true },
      { text: "All Fortune Foundation features", included: true },
      { text: "Voice Agent — unlimited calls", included: true, premium: true },
      { text: "DocScan — unlimited scans", included: true, premium: true },
      { text: "Revenue Autopilot (\"Money Machine\")", included: true, highlight: true, premium: true },
      { text: "Apex Autopilot (freight consolidation + lane prediction)", included: true, highlight: true, premium: true },
      { text: "200,000 email sends/month", included: true },
      { text: "Visitor Tracking — unlimited", included: true },
      { text: "White-labeling — full platform branding", included: true, highlight: true, premium: true },
      { text: "Custom AI training (basic)", included: true, premium: true },
      { text: "Dedicated account manager", included: true },
      { text: "99.5% SLA guarantee", included: true },
      { text: "Dedicated SMTP infrastructure", included: false },
      { text: "Custom AI training (full)", included: false },
      { text: "99.9% SLA", included: false },
    ],
  },

  // ─── Tier 4: Fortune Plus ─────────────────────────────────────────────────
  // Salesforce Unlimited 50-seat: $17,500/mo | HubSpot Enterprise 50-seat: $6,000/mo
  // Apex at $1,124/mo = 81% below HubSpot Enterprise for 50 users.
  // VERY HIGH MAINTENANCE services: dedicated SMTP infra, full custom AI training.
  // These carry real infrastructure cost — justified at top tier with markup.
  {
    id: "fortune_plus",
    name: "Fortune Plus",
    tagline: "Dedicated infrastructure. White-glove service.",
    description: "Your own dedicated SMTP infrastructure, full custom AI training, and 24/7 white-glove support — at 81% less than HubSpot Enterprise.",
    monthlyPriceId: process.env.STRIPE_PRICE_FORTUNE_PLUS_MONTHLY || "",
    annualPriceId:  process.env.STRIPE_PRICE_FORTUNE_PLUS_ANNUAL  || "",
    monthlyPrice:        112400,  // $1,124.00/mo
    annualPricePerMonth: 101160,  // $1,011.60/mo (10% off)
    annualPriceTotal:   1213920,  // $12,139.20/yr
    baseUsers: 50,
    maxUsers: 50,
    addOnMaxUsers: null,
    addOnPricePerUser: 0,
    contactLimit: null,           // unlimited
    emailSendsPerMonth: null,     // unlimited
    tier: "fortune_plus",
    competitorSavings: "81% less than HubSpot Enterprise",
    vsCompetitor: "HubSpot Enterprise (50 users): $6,000/mo",
    features: [
      { text: "50 users included", included: true },
      { text: "Unlimited contacts", included: true },
      { text: "All Fortune features", included: true },
      { text: "Dedicated SMTP infrastructure (your own IPs + domain pools)", included: true, highlight: true, premium: true },
      { text: "Unlimited email sends", included: true },
      { text: "Custom AI training — full, unlimited", included: true, highlight: true, premium: true },
      { text: "99.9% SLA guarantee", included: true, highlight: true },
      { text: "Priority 24/7 white-glove support", included: true, premium: true },
      { text: "Dedicated infrastructure team", included: true },
      { text: "Custom integrations", included: true },
    ],
  },
];

// ─── Add-On Pricing ───────────────────────────────────────────────────────────
export const USER_ADDON_PRICE_ID = process.env.STRIPE_PRICE_USER_ADDON || "";

export const ADD_ONS = {
  extraUser: {
    pricePerMonth: 2500,          // $25/user/mo
    priceId: USER_ADDON_PRICE_ID,
  },
  aiCredits: {
    markup: 0.25,                 // 25% markup on Manus pricing for non-CRM AI
    freeQueriesPerMonth: 50,      // First 50 queries/month always free
  },
  extraEmailSends: {
    pricePerTenThousand: 1000,    // $10/10,000 sends (Fortune Foundation+)
  },
  voiceAgentOverage: {
    pricePerCall: 5,              // $0.05/call overage (Fortune Foundation+)
  },
  docScanOverage: {
    pricePerScan: 50,             // $0.50/scan overage (Fortune Foundation+)
  },
  dedicatedIp: {
    pricePerMonth: 5000,          // $50/IP/mo (Fortune Plus only)
  },
  whiteLabelSetup: {
    oneTimePrice: 29900,          // $299 one-time setup fee (Fortune tier)
  },
  customAiTraining: {
    pricePerModel: 49900,         // $499/model (Fortune Plus only)
  },
};

// ─── Utility Functions ────────────────────────────────────────────────────────

export function getPlanById(id: string): StripePlan | undefined {
  return PLANS.find(p => p.id === id);
}

export function getPlanByTier(tier: string): StripePlan | undefined {
  return PLANS.find(p => p.tier === tier);
}

/** Check if a tier has access to a specific feature */
export function hasFeatureAccess(tier: string, featureKey: string): boolean {
  const tierLevel = TIER_LEVELS[tier] ?? 0;
  const requiredLevel = FEATURE_GATES[featureKey] ?? 999;
  return tierLevel >= requiredLevel;
}

/** Get the minimum plan name required for a feature */
export function getRequiredPlanName(featureKey: string): string {
  const requiredLevel = FEATURE_GATES[featureKey] ?? 999;
  const tierNames: Record<number, string> = {
    0: "All Plans",
    1: "Success Starter",
    2: "Growth Foundation",
    3: "Fortune Foundation",
    4: "Fortune",
    5: "Fortune Plus",
  };
  return tierNames[requiredLevel] ?? "Fortune Plus";
}

/** Get usage limits for a tier */
export function getTierLimits(tier: string) {
  return TIER_LIMITS[tier] ?? TIER_LIMITS.trial;
}

/** Calculate the add-on cost for extra users on a given plan (in cents) */
export function calculateAddOnCost(plan: StripePlan, extraUsers: number): number {
  if (!plan.addOnMaxUsers || extraUsers <= 0) return 0;
  const maxExtra = plan.addOnMaxUsers - plan.baseUsers;
  const billableExtra = Math.min(extraUsers, maxExtra);
  return billableExtra * plan.addOnPricePerUser;
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

/** Format price in cents to display string */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

/** Get savings percentage vs a competitor price */
export function getSavingsPercent(apexCents: number, competitorCents: number): number {
  return Math.round((1 - apexCents / competitorCents) * 100);
}
