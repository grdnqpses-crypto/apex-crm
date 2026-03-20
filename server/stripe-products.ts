/**
 * AXIOM CRM — Final Approved Pricing Model (March 2026)
 *
 * Display Names & Prices (DB internal keys kept stable):
 *   Solo              $49/mo   (1 user)    — DB key: success_starter
 *   Starter           $97/mo   (3 users)   — DB key: growth_foundation
 *   Growth            $297/mo  (10 users)  — DB key: fortune_foundation
 *   Fortune Foundation $497/mo (20 users)  — DB key: fortune
 *   Fortune Plus      $1,497/mo (100 users)— DB key: fortune_plus
 *
 * Rules:
 *   - 2 months free trial on ALL plans (60 days, no credit card required)
 *   - All overages = $10 flat rate per unit block, regardless of tier
 *   - ALL service fees ELIMINATED: onboarding, setup, integration, data export, migration = FREE
 *   - Fortune Plus: 100 users, $30/user add-on
 *   - All other tiers: $35/user add-on
 *   - Annual billing: 10% off, non-refundable
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
export const TRIAL_DAYS = 60;
export const ANNUAL_DISCOUNT = 0.10;
export const ANNUAL_REFUNDABLE = false;
export const ADD_ON_PRICE_PER_USER = 35;          // $35/user/mo
export const ADD_ON_PRICE_FORTUNE_PLUS = 30;      // $30/user/mo (Fortune Plus)

// ─────────────────────────────────────────────────────────────────────────────
// OVERAGE RATES — FLAT $10, SAME FOR EVERYONE
// ─────────────────────────────────────────────────────────────────────────────
export const OVERAGE_RATES = {
  aiCredits:    { priceCents: 1000, unitSize: 500,   label: '$10 per 500 AI credits' },
  voiceMinutes: { priceCents: 1000, unitSize: 100,   label: '$10 per 100 voice minutes' },
  bnbProspects: { priceCents: 1000, unitSize: 500,   label: '$10 per 500 BNB prospects' },
  emailSends:   { priceCents: 1000, unitSize: 10000, label: '$10 per 10,000 emails' },
  docScans:     { priceCents: 1000, unitSize: 100,   label: '$10 per 100 DocScans' },
};

// ─────────────────────────────────────────────────────────────────────────────
// TIER TYPES & LEVELS
// ─────────────────────────────────────────────────────────────────────────────
export type TierKey = 'trial' | 'success_starter' | 'growth_foundation' | 'fortune_foundation' | 'fortune' | 'fortune_plus';

export const TIER_LEVELS: Record<TierKey, number> = {
  trial:              0,
  success_starter:    1,   // Solo ($49)
  growth_foundation:  2,   // Starter ($97)
  fortune_foundation: 3,   // Growth ($297)
  fortune:            4,   // Fortune Foundation ($497)
  fortune_plus:       5,   // Fortune Plus ($1,497)
};

// User-facing display names
export const TIER_DISPLAY_NAMES: Record<TierKey, string> = {
  trial:              'Trial',
  success_starter:    'Solo',
  growth_foundation:  'Starter',
  fortune_foundation: 'Growth',
  fortune:            'Fortune Foundation',
  fortune_plus:       'Fortune Plus',
};

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE GATES — minimum tier level required
// ─────────────────────────────────────────────────────────────────────────────
export const FEATURE_GATES: Record<string, number> = {
  // Always free (trial+)
  data_entry:               0,
  one_click_migration:      0,
  business_category_intel:  0,
  basic_ar_ap:              0,
  basic_shipping:           0,

  // Solo / success_starter (level 1)
  core_crm:                 1,
  email_campaigns:          1,
  ai_assistant:             1,
  ai_email_writing:         1,
  ai_call_summaries:        1,
  bnb_engine:               1,
  ghost_mode:               1,
  doc_scan:                 1,

  // Starter / growth_foundation (level 2)
  win_probability:          2,
  full_ar_ap:               2,
  full_shipping:            2,
  email_warmup:             2,

  // Growth / fortune_foundation (level 3)
  behavioral_dna:           3,
  predictive_send_time:     3,
  battle_cards:             3,
  voice_agent:              3,
  blacklist_monitoring:     3,
  smtp_high_priority:       3,

  // Fortune Foundation / fortune (level 4) — HIGH MAINTENANCE unlocked
  smtp_260_rotation:        4,
  compliance_fortress:      4,
  bnb_engine_unlimited:     4,

  // Fortune Plus (level 5)
  revenue_autopilot:        5,
  axiom_autopilot:           5,
  white_labeling:           5,
  dedicated_smtp_infra:     5,
  custom_ai_training:       5,
  saas_mode:                5,
  sla_999:                  5,
  white_glove_support:      5,
};

// ─────────────────────────────────────────────────────────────────────────────
// USAGE LIMITS BY TIER
// ─────────────────────────────────────────────────────────────────────────────
export const TIER_LIMITS: Record<TierKey, {
  contacts: number | null;
  deals: number | null;
  pipelines: number | null;
  aiCredits: number;
  emailSendsPerMonth: number | null;
  emailAccounts: number | null;
  bnbProspectsPerMonth: number | null;
  ghostSequences: number | null;
  voiceMinutes: number | null;
  docScansPerMonth: number | null;
  emailWarmupAccounts: number | null;
}> = {
  trial: {
    contacts: 50, deals: 10, pipelines: 1,
    aiCredits: 100, emailSendsPerMonth: 100, emailAccounts: 1,
    bnbProspectsPerMonth: 25, ghostSequences: 0, voiceMinutes: 0,
    docScansPerMonth: 5, emailWarmupAccounts: 0,
  },
  success_starter: {   // Solo — $49/mo
    contacts: 2500, deals: null, pipelines: 2,
    aiCredits: 500, emailSendsPerMonth: 1000, emailAccounts: 2,
    bnbProspectsPerMonth: 100, ghostSequences: 1, voiceMinutes: 0,
    docScansPerMonth: 20, emailWarmupAccounts: 0,
  },
  growth_foundation: {  // Starter — $97/mo
    contacts: 10000, deals: null, pipelines: 5,
    aiCredits: 2000, emailSendsPerMonth: 10000, emailAccounts: 5,
    bnbProspectsPerMonth: 500, ghostSequences: 5, voiceMinutes: 0,
    docScansPerMonth: 100, emailWarmupAccounts: 2,
  },
  fortune_foundation: {  // Growth — $297/mo
    contacts: 100000, deals: null, pipelines: null,
    aiCredits: 10000, emailSendsPerMonth: 100000, emailAccounts: 25,
    bnbProspectsPerMonth: 5000, ghostSequences: 25, voiceMinutes: 200,
    docScansPerMonth: 500, emailWarmupAccounts: 10,
  },
  fortune: {  // Fortune Foundation — $497/mo
    contacts: null, deals: null, pipelines: null,
    aiCredits: 30000, emailSendsPerMonth: 500000, emailAccounts: 100,
    bnbProspectsPerMonth: 25000, ghostSequences: null, voiceMinutes: 1000,
    docScansPerMonth: 2000, emailWarmupAccounts: 50,
  },
  fortune_plus: {  // Fortune Plus — $1,497/mo
    contacts: null, deals: null, pipelines: null,
    aiCredits: 200000, emailSendsPerMonth: null, emailAccounts: null,
    bnbProspectsPerMonth: null, ghostSequences: null, voiceMinutes: null,
    docScansPerMonth: null, emailWarmupAccounts: null,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PLAN DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
export interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
  premium?: boolean;
  freemium?: boolean;
  axiomOnly?: boolean;
}

export interface StripePlan {
  id: TierKey;
  name: string;
  tagline: string;
  description: string;
  monthlyPriceId: string;
  annualPriceId: string;
  monthlyPrice: number;
  annualPricePerMonth: number;
  annualPriceTotal: number;
  trialDays: number;
  usersIncluded: number;
  addOnPricePerUser: number;
  maxUserAddons: number | null;
  features: PlanFeature[];
  popular?: boolean;
  badge?: string;
  competitorSavings: string;
  vsCompetitor: string;
  tier: TierKey;
  // Legacy compat
  baseUsers?: number;
  maxUsers?: number;
  contactLimit?: number | null;
  emailSendsPerMonth?: number | null;
  addOnMaxUsers?: number | null;
  addOnPricePerUser_legacy?: number;
  monthlyPrice_legacy?: number;
  annualPricePerMonth_legacy?: number;
  annualPriceTotal_legacy?: number;
}

export const PLANS: StripePlan[] = [

  // ─── Solo — $49/mo ────────────────────────────────────────────────────────
  {
    id: 'success_starter',
    name: 'Solo',
    tagline: "For the serious solo seller. Everything you need, nothing you don't.",
    description: 'Everything a solo operator needs to manage contacts, deals, and outreach — with AI built in from day one.',
    monthlyPriceId: process.env.STRIPE_PRICE_SUCCESS_STARTER_MONTHLY || '',
    annualPriceId:  process.env.STRIPE_PRICE_SUCCESS_STARTER_ANNUAL  || '',
    monthlyPrice:        4900,
    annualPricePerMonth: 4410,
    annualPriceTotal:    52920,
    trialDays: 60,
    usersIncluded: 1,
    baseUsers: 1,
    maxUsers: 1,
    addOnPricePerUser: 0,
    addOnMaxUsers: 0,
    maxUserAddons: 0,
    contactLimit: 2500,
    emailSendsPerMonth: 1000,
    tier: 'success_starter',
    competitorSavings: '50% less than GoHighLevel Starter',
    vsCompetitor: 'GoHighLevel Starter: $97/mo | HubSpot Starter: $100/mo',
    features: [
      { text: '1 user included', included: true },
      { text: '2,500 contacts', included: true },
      { text: 'Core CRM — contacts, companies, deals, pipeline', included: true },
      { text: 'Tasks, activities, notes, calendar', included: true },
      { text: '500 AI credits/month', included: true, freemium: true },
      { text: 'AI Assistant — write emails, answer questions, take action', included: true, highlight: true, axiomOnly: true },
      { text: '1,000 email sends/month', included: true },
      { text: '100 BNB prospects/month', included: true },
      { text: '1 Ghost Mode sequence', included: true },
      { text: '20 DocScans/month', included: true },
      { text: 'One-click migration from any CRM', included: true, highlight: true, axiomOnly: true },
      { text: 'Business category intelligence', included: true, axiomOnly: true },
      { text: 'Basic AR/AP (manual entry)', included: true },
      { text: 'Basic Shipping & Receiving', included: true },
      { text: 'Free onboarding & setup', included: true, highlight: true },
      { text: 'Email support', included: true },
      { text: 'Voice Agent', included: false },
      { text: '260 SMTP Rotation Engine', included: false },
      { text: 'Compliance Fortress™', included: false },
    ],
  },

  // ─── Starter — $97/mo ─────────────────────────────────────────────────────
  {
    id: 'growth_foundation',
    name: 'Starter',
    tagline: 'For small teams ready to scale their outreach.',
    description: 'For small teams who need more contacts, more sends, and smarter AI to grow their pipeline.',
    monthlyPriceId: process.env.STRIPE_PRICE_GROWTH_FOUNDATION_MONTHLY || '',
    annualPriceId:  process.env.STRIPE_PRICE_GROWTH_FOUNDATION_ANNUAL  || '',
    monthlyPrice:        9700,
    annualPricePerMonth: 8730,
    annualPriceTotal:    104760,
    trialDays: 60,
    usersIncluded: 3,
    baseUsers: 3,
    maxUsers: 15,
    addOnPricePerUser: 3500,
    addOnMaxUsers: null,
    maxUserAddons: null,
    contactLimit: 10000,
    emailSendsPerMonth: 10000,
    tier: 'growth_foundation',
    competitorSavings: '68% less than HubSpot for 3 users',
    vsCompetitor: 'HubSpot Starter for 3 users: $300/mo',
    features: [
      { text: '3 users included (+$35/user/mo)', included: true },
      { text: '10,000 contacts', included: true },
      { text: 'Everything in Solo', included: true },
      { text: '2,000 AI credits/month', included: true, freemium: true },
      { text: 'AI email personalization', included: true, highlight: true },
      { text: 'AI call summaries', included: true },
      { text: 'Win probability scoring', included: true, axiomOnly: true },
      { text: '10,000 email sends/month', included: true },
      { text: '500 BNB prospects/month', included: true },
      { text: '5 Ghost Mode sequences', included: true },
      { text: '100 DocScans/month', included: true },
      { text: 'Full AR/AP automation', included: true, axiomOnly: true },
      { text: 'Full Shipping & Receiving', included: true, axiomOnly: true },
      { text: 'Email warmup (2 accounts)', included: true },
      { text: 'Email support', included: true },
      { text: 'Voice Agent', included: false },
      { text: '260 SMTP Rotation Engine', included: false },
    ],
  },

  // ─── Growth — $297/mo ─────────────────────────────────────────────────────
  {
    id: 'fortune_foundation',
    name: 'Growth',
    tagline: 'For growing teams who need real prospecting power and voice.',
    description: 'For scaling teams who need behavioral AI, voice calling, and serious email volume.',
    monthlyPriceId: process.env.STRIPE_PRICE_FORTUNE_FOUNDATION_MONTHLY || '',
    annualPriceId:  process.env.STRIPE_PRICE_FORTUNE_FOUNDATION_ANNUAL  || '',
    monthlyPrice:        29700,
    annualPricePerMonth: 26730,
    annualPriceTotal:    320760,
    trialDays: 60,
    usersIncluded: 10,
    baseUsers: 10,
    maxUsers: 25,
    addOnPricePerUser: 3500,
    addOnMaxUsers: null,
    maxUserAddons: null,
    contactLimit: 100000,
    emailSendsPerMonth: 100000,
    tier: 'fortune_foundation',
    competitorSavings: '55% less than GHL + Instantly combined',
    vsCompetitor: 'GHL Unlimited ($297) + Instantly ($358) = $655/mo',
    features: [
      { text: '10 users included (+$35/user/mo)', included: true },
      { text: '100,000 contacts', included: true },
      { text: 'Everything in Starter', included: true },
      { text: '10,000 AI credits/month', included: true, freemium: true },
      { text: 'Behavioral DNA Profiling', included: true, highlight: true, axiomOnly: true },
      { text: 'Predictive Send Time Optimizer', included: true, axiomOnly: true },
      { text: 'Battle Cards (AI tactical summaries)', included: true, axiomOnly: true },
      { text: '100,000 email sends/month', included: true },
      { text: '5,000 BNB prospects/month', included: true },
      { text: '25 Ghost Mode sequences', included: true },
      { text: '200 voice minutes/month', included: true, highlight: true },
      { text: '500 DocScans/month', included: true },
      { text: 'Blacklist monitoring', included: true },
      { text: 'High-priority SMTP routing', included: true },
      { text: 'Email warmup (10 accounts)', included: true },
      { text: 'Chat support', included: true },
      { text: '260 SMTP Rotation Engine', included: false },
      { text: 'Compliance Fortress™', included: false },
    ],
  },

  // ─── Fortune Foundation — $497/mo ─────────────────────────────────────────
  {
    id: 'fortune',
    name: 'Fortune Foundation',
    tagline: 'Elite deliverability. Full compliance. The agency standard.',
    description: 'Unlock the 260 SMTP Rotation Engine and Compliance Fortress — the deliverability and compliance stack no competitor can match.',
    monthlyPriceId: process.env.STRIPE_PRICE_FORTUNE_MONTHLY || '',
    annualPriceId:  process.env.STRIPE_PRICE_FORTUNE_ANNUAL  || '',
    monthlyPrice:        49700,
    annualPricePerMonth: 44730,
    annualPriceTotal:    536760,
    trialDays: 60,
    usersIncluded: 20,
    baseUsers: 20,
    maxUsers: 40,
    addOnPricePerUser: 3500,
    addOnMaxUsers: null,
    maxUserAddons: null,
    contactLimit: null,
    emailSendsPerMonth: 500000,
    popular: true,
    badge: 'Most Popular',
    tier: 'fortune',
    competitorSavings: '57% less than GHL + Instantly + OneTrust',
    vsCompetitor: 'GHL Pro ($497) + Instantly ($358) + compliance ($300) = $1,155/mo',
    features: [
      { text: '20 users included (+$35/user/mo)', included: true },
      { text: 'Unlimited contacts', included: true },
      { text: 'Everything in Growth', included: true },
      { text: '30,000 AI credits/month', included: true, freemium: true },
      { text: '260 SMTP Rotation Engine™', included: true, highlight: true, premium: true, axiomOnly: true },
      { text: 'Compliance Fortress™ (GDPR + CCPA + CAN-SPAM auto)', included: true, highlight: true, premium: true, axiomOnly: true },
      { text: 'Unlimited BNB prospects', included: true, highlight: true },
      { text: 'Unlimited Ghost Mode sequences', included: true },
      { text: '500,000 email sends/month', included: true },
      { text: '1,000 voice minutes/month', included: true },
      { text: '2,000 DocScans/month', included: true },
      { text: 'Email warmup (50 accounts)', included: true },
      { text: 'Priority support', included: true },
      { text: 'Revenue Autopilot™', included: false },
      { text: 'AXIOM Autopilot™', included: false },
      { text: 'White-labeling', included: false },
    ],
  },

  // ─── Fortune Plus — $1,497/mo ─────────────────────────────────────────────
  {
    id: 'fortune_plus',
    name: 'Fortune Plus',
    tagline: 'Dedicated infrastructure. Custom AI. Resell AXIOM as your own.',
    description: 'Enterprise-grade dedicated infrastructure, unlimited everything, Revenue Autopilot, and the ability to resell AXIOM as your own SaaS product.',
    monthlyPriceId: process.env.STRIPE_PRICE_FORTUNE_PLUS_MONTHLY || '',
    annualPriceId:  process.env.STRIPE_PRICE_FORTUNE_PLUS_ANNUAL  || '',
    monthlyPrice:        149700,
    annualPricePerMonth: 134730,
    annualPriceTotal:    1616760,
    trialDays: 60,
    usersIncluded: 100,
    baseUsers: 100,
    maxUsers: 999,
    addOnPricePerUser: 3000,
    addOnMaxUsers: null,
    maxUserAddons: null,
    contactLimit: null,
    emailSendsPerMonth: null,
    tier: 'fortune_plus',
    competitorSavings: '85% less than HubSpot Enterprise for 100 users',
    vsCompetitor: 'HubSpot Enterprise for 100 users: $10,000+/mo',
    features: [
      { text: '100 users included (+$30/user/mo)', included: true },
      { text: 'Unlimited everything', included: true },
      { text: 'Everything in Fortune Foundation', included: true },
      { text: '200,000 AI credits/month', included: true, freemium: true },
      { text: 'Revenue Autopilot™', included: true, highlight: true, premium: true, axiomOnly: true },
      { text: 'AXIOM Autopilot™ (fully autonomous sales)', included: true, highlight: true, premium: true, axiomOnly: true },
      { text: 'White-labeling (your brand, FREE setup)', included: true, highlight: true, axiomOnly: true },
      { text: 'Dedicated SMTP infrastructure (your own IP blocks)', included: true, premium: true, axiomOnly: true },
      { text: 'SaaS Mode — resell AXIOM as your own product', included: true, premium: true, axiomOnly: true },
      { text: 'Custom AI model training (unlimited)', included: true, premium: true, axiomOnly: true },
      { text: '99.9% uptime SLA', included: true },
      { text: '24/7 white-glove support', included: true },
      { text: 'Custom contract & invoicing', included: true },
      { text: 'Dedicated infrastructure team', included: true },
      { text: 'Priority feature requests', included: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FREE SERVICES
// ─────────────────────────────────────────────────────────────────────────────
export const FREE_SERVICES = [
  { name: 'White-Label Setup', competitorPrice: '$299', description: 'Your brand, your domain — set up at no charge' },
  { name: 'Priority Onboarding', competitorPrice: '$199', description: 'Live expert onboarding session — free for all plans' },
  { name: 'Custom Integration', competitorPrice: '$499', description: 'Connect any outside tool — no integration fees' },
  { name: 'Data Export', competitorPrice: '$49', description: 'Export all your data anytime, any format — free' },
  { name: 'One-Click Migration', competitorPrice: '$500+', description: 'Move from any CRM in under 30 minutes — always free' },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPETITOR COMPARISON
// ─────────────────────────────────────────────────────────────────────────────
export const COMPETITOR_FEATURES = [
  { name: 'Full CRM (contacts, deals, pipeline)',          axiom: true,  hubspot: true,      ghl: true,      salesforce: true,  outreach: false,    instantly: false },
  { name: 'AI Assistant (action-capable)',                 axiom: true,  hubspot: false,     ghl: false,     salesforce: false, outreach: false,    instantly: false },
  { name: 'One-Click CRM Migration (free)',                axiom: true,  hubspot: false,     ghl: false,     salesforce: false, outreach: false,    instantly: false },
  { name: '260 SMTP Rotation Engine',                      axiom: true,  hubspot: false,     ghl: false,     salesforce: false, outreach: false,    instantly: 'partial' },
  { name: 'BNB Paradigm Engine™',                         axiom: true,  hubspot: false,     ghl: false,     salesforce: false, outreach: false,    instantly: false },
  { name: 'Ghost Mode™ (AI sequences)',                    axiom: true,  hubspot: false,     ghl: 'partial', salesforce: false, outreach: true,     instantly: true },
  { name: 'Compliance Fortress™ (GDPR/CCPA auto)',         axiom: true,  hubspot: false,     ghl: false,     salesforce: false, outreach: false,    instantly: false },
  { name: 'Voice Agent (AI calling)',                      axiom: true,  hubspot: false,     ghl: 'partial', salesforce: false, outreach: false,    instantly: false },
  { name: 'Revenue Autopilot™',                           axiom: true,  hubspot: false,     ghl: false,     salesforce: false, outreach: false,    instantly: false },
  { name: 'AXIOM Autopilot™ (fully autonomous)',            axiom: true,  hubspot: false,     ghl: false,     salesforce: false, outreach: false,    instantly: false },
  { name: 'AR/AP Automation',                             axiom: true,  hubspot: false,     ghl: false,     salesforce: false, outreach: false,    instantly: false },
  { name: 'Shipping & Receiving Module',                   axiom: true,  hubspot: false,     ghl: false,     salesforce: false, outreach: false,    instantly: false },
  { name: 'DocScan AI',                                   axiom: true,  hubspot: false,     ghl: false,     salesforce: false, outreach: false,    instantly: false },
  { name: 'Business Category Intelligence',                axiom: true,  hubspot: false,     ghl: false,     salesforce: false, outreach: false,    instantly: false },
  { name: 'White-Labeling / SaaS Mode',                   axiom: true,  hubspot: false,     ghl: true,      salesforce: false, outreach: false,    instantly: false },
  { name: 'Behavioral DNA Profiling',                     axiom: true,  hubspot: false,     ghl: false,     salesforce: false, outreach: false,    instantly: false },
  { name: 'Dedicated SMTP Infrastructure',                axiom: true,  hubspot: false,     ghl: false,     salesforce: false, outreach: false,    instantly: 'partial' },
  { name: 'Free Onboarding & Setup',                      axiom: true,  hubspot: false,     ghl: false,     salesforce: false, outreach: false,    instantly: false },
  { name: 'Free Migration from Any CRM',                  axiom: true,  hubspot: false,     ghl: false,     salesforce: false, outreach: false,    instantly: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function getPlan(id: TierKey): StripePlan | undefined {
  return PLANS.find(p => p.id === id);
}

/** @deprecated Use getPlan() */
export function getPlanById(id: string): StripePlan | undefined {
  return PLANS.find(p => p.id === id);
}

export function getAllPlans(): StripePlan[] {
  return PLANS;
}

export function getTierLevel(tier: TierKey): number {
  return TIER_LEVELS[tier] ?? 0;
}

export function getTierLabel(tier: TierKey): string {
  return TIER_DISPLAY_NAMES[tier] ?? tier;
}

export function hasFeatureAccess(userTier: TierKey, featureKey: string): boolean {
  const userLevel = TIER_LEVELS[userTier] ?? 0;
  const required = FEATURE_GATES[featureKey] ?? 999;
  return userLevel >= required;
}

export function tierMeetsRequirement(userTier: TierKey, requiredTier: TierKey): boolean {
  return getTierLevel(userTier) >= getTierLevel(requiredTier);
}

export function getNextTier(currentTier: TierKey): StripePlan | null {
  const order: TierKey[] = ['success_starter', 'growth_foundation', 'fortune_foundation', 'fortune', 'fortune_plus'];
  const idx = order.indexOf(currentTier);
  if (idx === -1 || idx === order.length - 1) return null;
  return getPlan(order[idx + 1]) || null;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatLimit(value: number | null): string {
  if (value === null) return 'Unlimited';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toLocaleString();
}

export function calculateOverage(
  type: keyof typeof OVERAGE_RATES,
  used: number,
  included: number
): number {
  if (used <= included) return 0;
  const overage = used - included;
  const rate = OVERAGE_RATES[type];
  return Math.ceil(overage / rate.unitSize) * rate.priceCents;
}

export function getTierFromPriceId(priceId: string): TierKey | null {
  for (const plan of PLANS) {
    if (plan.monthlyPriceId === priceId || plan.annualPriceId === priceId) {
      return plan.id;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY / COMPAT EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

/** Annual policy notice string */
export const ANNUAL_POLICY_NOTICE = 'Annual plans are non-refundable for any reason. By selecting annual billing, you acknowledge and agree to this policy.';

/** User add-on Stripe price ID */
export const USER_ADDON_PRICE_ID = process.env.STRIPE_PRICE_USER_ADDON || '';

/** @deprecated Use getTierLabel() */
export function getPlanByTier(tier: TierKey): StripePlan | undefined {
  return PLANS.find(p => p.id === tier);
}

/** Calculate add-on cost in cents for a given number of extra users */
export function calculateAddOnCost(plan: StripePlan, extraUsers: number): number {
  if (!plan.addOnPricePerUser || plan.addOnPricePerUser === 0) return 0;
  const maxExtra = plan.maxUsers !== undefined && plan.baseUsers !== undefined
    ? (plan.maxUsers || 999) - (plan.baseUsers || 1)
    : null;
  const capped = maxExtra !== null ? Math.min(extraUsers, maxExtra) : extraUsers;
  return capped * plan.addOnPricePerUser;
}
