import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// Feature key to route path mapping
export const FEATURE_ROUTE_MAP: Record<string, string[]> = {
  crm_contacts: ["/contacts"],
  crm_companies: ["/companies"],
  crm_deals: ["/deals"],
  crm_tasks: ["/tasks"],
  marketing_campaigns: ["/campaigns"],
  marketing_templates: ["/templates"],
  marketing_deliverability: ["/deliverability"],
  marketing_ab_tests: ["/ab-tests"],
  marketing_smtp: ["/smtp-accounts"],
  marketing_deliverability_optimizer: ["/domain-optimizer"],
  marketing_ab_engine: ["/ab-engine"],
  automation_workflows: ["/workflows"],
  automation_segments: ["/segments"],
  paradigm_pulse: ["/paradigm"],
  paradigm_prospects: ["/paradigm/prospects"],
  paradigm_signals: ["/paradigm/signals"],
  paradigm_sequences: ["/paradigm/sequences"],
  paradigm_battle_cards: ["/paradigm/battle-cards"],
  paradigm_integrations: ["/paradigm/integrations"],
  paradigm_quantum_score: ["/paradigm/quantum-score"],
  compliance_center: ["/compliance"],
  compliance_suppression: ["/suppression"],
  compliance_sender_settings: ["/sender-settings"],
  compliance_domain_stats: ["/domain-stats"],
  analytics_reports: ["/analytics"],
};

// Route path to feature key mapping (reverse)
export const ROUTE_FEATURE_MAP: Record<string, string> = {};
Object.entries(FEATURE_ROUTE_MAP).forEach(([key, paths]) => {
  paths.forEach(path => { ROUTE_FEATURE_MAP[path] = key; });
});

// Sidebar path to feature key mapping
export const SIDEBAR_FEATURE_MAP: Record<string, string> = {
  "/contacts": "crm_contacts",
  "/companies": "crm_companies",
  "/deals": "crm_deals",
  "/tasks": "crm_tasks",
  "/campaigns": "marketing_campaigns",
  "/templates": "marketing_templates",
  "/deliverability": "marketing_deliverability",
  "/ab-tests": "marketing_ab_tests",
  "/smtp-accounts": "marketing_smtp",
  "/domain-optimizer": "marketing_deliverability",
  "/ab-engine": "marketing_ab_tests",
  "/workflows": "automation_workflows",
  "/segments": "automation_segments",
  "/paradigm": "paradigm_pulse",
  "/paradigm/prospects": "paradigm_prospects",
  "/paradigm/signals": "paradigm_signals",
  "/paradigm/sequences": "paradigm_sequences",
  "/paradigm/battle-cards": "paradigm_battle_cards",
  "/paradigm/integrations": "paradigm_integrations",
  "/paradigm/quantum-score": "paradigm_quantum_score",
  "/compliance": "compliance_center",
  "/suppression": "compliance_suppression",
  "/sender-settings": "compliance_sender_settings",
  "/domain-stats": "compliance_domain_stats",
  "/analytics": "analytics_reports",
};

export function useFeatureAccess() {
  const { user } = useAuth();
  const isDeveloper = user?.systemRole === "developer";
  const isAdmin = user?.systemRole === "company_admin";
  
  // Developers and admins get full access
  const shouldFetchFeatures = !!user && !isDeveloper && !isAdmin;
  
  const { data: features } = trpc.userManagement.myFeatures.useQuery(
    undefined,
    { enabled: shouldFetchFeatures }
  );

  const hasFeature = (featureKey: string): boolean => {
    // Developers and admins have all features
    if (isDeveloper || isAdmin) return true;
    // If features haven't loaded yet, show everything to avoid flash
    if (!features) return true;
    return features.includes(featureKey);
  };

  const canAccessRoute = (path: string): boolean => {
    // Always accessible routes
    if (path === "/" || path === "/help" || path === "/team") return true;
    // Developer routes
    if (path.startsWith("/dev/") || path === "/fmcsa-scanner" || path === "/api-keys" || path === "/webhooks") {
      return isDeveloper;
    }
    // Feature-gated routes
    const featureKey = ROUTE_FEATURE_MAP[path];
    if (!featureKey) return true; // Unknown routes are accessible
    return hasFeature(featureKey);
  };

  const canAccessSidebarItem = (path: string): boolean => {
    const featureKey = SIDEBAR_FEATURE_MAP[path];
    if (!featureKey) return true; // Items without feature mapping are always visible
    return hasFeature(featureKey);
  };

  return {
    hasFeature,
    canAccessRoute,
    canAccessSidebarItem,
    isDeveloper,
    isAdmin,
    isManager: user?.systemRole === "manager",
    features: isDeveloper || isAdmin ? null : features,
    loading: shouldFetchFeatures && !features,
  };
}
