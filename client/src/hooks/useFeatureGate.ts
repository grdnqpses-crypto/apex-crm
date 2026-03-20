/**
 * useFeatureGate — checks whether the current company's subscription tier
 * grants access to a specific feature key.
 *
 * Feature keys and required tier levels are defined in server/stripe-products.ts.
 * This client-side hook mirrors that logic using the tier returned by
 * trpc.billing.subscription.
 */

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// Mirror of TIER_LEVELS from server/stripe-products.ts
const TIER_LEVELS: Record<string, number> = {
  trial:              0,
  success_starter:    1,
  growth_foundation:  2,
  fortune_foundation: 3,
  fortune:            4,
  fortune_plus:       5,
};

// Mirror of FEATURE_GATES from server/stripe-products.ts
const FEATURE_GATES: Record<string, number> = {
  // Always free — level 0
  data_entry:                 0,
  one_click_migration:        0,
  business_category_intel:    0,
  ai_assistant_base:          0,
  ar_ap_basic:                0,
  shipping_receiving_basic:   0,
  bnb_engine_freemium:        0,

  // Solo — level 1
  core_crm:                   1,
  email_templates:            1,
  basic_campaigns:            1,
  domain_health_single:       1,

  // Starter — level 2
  marketing_automation:       2,
  lead_scoring:               2,
  bnb_engine_growth:          2,
  ghost_mode_limited:         2,
  deliverability_basic:       2,
  domain_health_multi:        2,
  compliance_can_spam:        2,
  ar_ap_automation:           2,
  shipping_receiving_full:    2,

  // Growth — level 3
  smtp_260_rotation:          3,
  compliance_full:            3,
  bnb_engine_full:            3,
  ghost_mode_unlimited:       3,
  battle_cards:               3,
  behavioral_dna:             3,
  predictive_send_time:       3,
  voice_agent_limited:        3,
  docscan_limited:            3,
  win_probability:            3,
  visitor_tracking_limited:   3,
  custom_branding:            3,

  // Fortune Foundation — level 4
  voice_agent_unlimited:      4,
  docscan_unlimited:          4,
  revenue_autopilot:          4,
  realm_autopilot:             4,
  custom_ai_training_basic:   4,
  visitor_tracking_unlimited: 4,
  white_labeling:             4,
  dedicated_account_manager:  4,
  sla_995:                    4,

  // Fortune Plus — level 5
  dedicated_smtp_infra:       5,
  custom_ai_training_full:    5,
  sla_999:                    5,
  priority_247_support:       5,
};

const TIER_NAMES: Record<number, string> = {
  0: "All Plans",
  1: "Solo",
  2: "Starter",
  3: "Growth",
  4: "Fortune",
  5: "Fortune Plus",
};

export interface FeatureGateResult {
  /** Whether the current tier has access */
  hasAccess: boolean;
  /** Current tier key (e.g. "growth_foundation") */
  currentTier: string;
  /** Current tier level number */
  currentLevel: number;
  /** Minimum tier name required for this feature */
  requiredPlan: string;
  /** Whether subscription data is still loading */
  isLoading: boolean;
}

/**
 * Check if the current company's subscription tier grants access to a feature.
 * @param featureKey - one of the keys in FEATURE_GATES above
 */
export function useFeatureGate(featureKey: string): FeatureGateResult {
  const { user } = useAuth();
  const { data: subscription, isLoading } = trpc.billing.subscription.useQuery(undefined, {
    enabled: !!user,
    staleTime: 60_000, // cache for 1 minute
  });

  const currentTier = subscription?.tier ?? "trial";
  const currentLevel = TIER_LEVELS[currentTier] ?? 0;
  const requiredLevel = FEATURE_GATES[featureKey] ?? 999;
  const hasAccess = currentLevel >= requiredLevel;
  const requiredPlan = TIER_NAMES[requiredLevel] ?? "Fortune Plus";

  return { hasAccess, currentTier, currentLevel, requiredPlan, isLoading };
}
