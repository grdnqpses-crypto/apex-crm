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

// ─── Role-Based Access Control ───
// Role hierarchy: developer > realm_owner > company_admin > manager > user

// Developer-only routes
const DEVELOPER_ROUTES = [
  "/dev/companies", "/dev/users", "/dev/health", "/dev/activity", "/dev/impersonate",
  "/fmcsa-scanner", "/api-keys", "/webhooks",
];

// REALM Owner+ routes (realm_owner, developer)
const REALM_OWNER_ROUTES = [
  "/realm",
];

// Manager+ routes (manager, company_admin, realm_owner, developer)
const MANAGER_ROUTES = [
  "/team-performance",
];

// Admin+ routes (company_admin, realm_owner, developer)
const ADMIN_ROUTES = [
  "/team", "/white-label", "/subscription", "/migration",
  "/settings", "/import/hubspot",
];

// Routes accessible to all authenticated users
const ALWAYS_ACCESSIBLE = ["/", "/help", "/commercial"];

export function useFeatureAccess() {
  const { user } = useAuth();
  const role = user?.systemRole;
  const isDeveloper = role === "developer";
  const isRealmOwner = role === "realm_owner";
  const isAdmin = role === "company_admin";
  const isManager = ["manager", "sales_manager", "office_manager"].includes(role || "");
  const isUser = ["user", "account_manager", "coordinator"].includes(role || "");
  
  // Developers, realm owners, and company admins get full feature access
  const shouldFetchFeatures = !!user && !isDeveloper && !isRealmOwner && !isAdmin;
  
  const { data: features } = trpc.userManagement.myFeatures.useQuery(
    undefined,
    { enabled: shouldFetchFeatures }
  );

  const hasFeature = (featureKey: string): boolean => {
    // Developers, realm owners, and admins have all features
    if (isDeveloper || isRealmOwner || isAdmin) return true;
    // If features haven't loaded yet, show everything to avoid flash
    if (!features) return true;
    return features.includes(featureKey);
  };

  const hasRoleAccess = (path: string): boolean => {
    // Always accessible
    if (ALWAYS_ACCESSIBLE.includes(path)) return true;
    
    // Developer-only routes
    if (DEVELOPER_ROUTES.includes(path) || path.startsWith("/dev/")) {
      return isDeveloper;
    }
    
    // REALM Owner+ routes
    if (REALM_OWNER_ROUTES.includes(path)) {
      return isDeveloper || isRealmOwner;
    }
    
    // Admin+ routes
    if (ADMIN_ROUTES.includes(path)) {
      return isDeveloper || isRealmOwner || isAdmin;
    }
    
    // Manager+ routes
    if (MANAGER_ROUTES.includes(path)) {
      return isDeveloper || isRealmOwner || isAdmin || isManager;
    }
    
    // All other routes: accessible to all roles (feature-gated separately)
    return true;
  };

  const canAccessRoute = (path: string): boolean => {
    // Check role first
    if (!hasRoleAccess(path)) return false;
    
    // Then check feature access
    const featureKey = ROUTE_FEATURE_MAP[path];
    if (!featureKey) return true; // Unknown routes are accessible
    return hasFeature(featureKey);
  };

  const canAccessSidebarItem = (path: string): boolean => {
    // Check role access first
    if (!hasRoleAccess(path)) return false;
    
    // Then check feature access
    const featureKey = SIDEBAR_FEATURE_MAP[path];
    if (!featureKey) return true; // Items without feature mapping are always visible
    return hasFeature(featureKey);
  };

  return {
    hasFeature,
    hasRoleAccess,
    canAccessRoute,
    canAccessSidebarItem,
    isDeveloper,
    isRealmOwner,
    isAdmin,
    isManager,
    isUser,
    role,
    features: isDeveloper || isRealmOwner || isAdmin ? null : features,
    loading: shouldFetchFeatures && !features,
  };
}
