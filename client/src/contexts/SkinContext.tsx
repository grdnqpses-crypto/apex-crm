/**
 * SkinContext — Adaptive Competitor Skin System
 *
 * Allows Apex CRM to mirror the look, feel, terminology, and navigation
 * of any competitor CRM so migrating users feel instantly at home.
 *
 * Supported skins: apex (native), hubspot, salesforce, pipedrive, zoho, gohighlevel, close
 */
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

export type SkinId = "apex" | "hubspot" | "salesforce" | "pipedrive" | "zoho" | "gohighlevel" | "close";

export interface NavItem {
  label: string;
  icon: string;
  path: string;
}

export interface SkinConfig {
  id: SkinId;
  name: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
  logo: string; // emoji or short text used as logo placeholder
  // Terminology overrides
  terms: {
    contacts: string;
    companies: string;
    deals: string;
    pipeline: string;
    activities: string;
    tasks: string;
    notes: string;
    leads: string;
    accounts: string;
    opportunities: string;
    dashboard: string;
    reports: string;
    settings: string;
    inbox: string;
    campaigns: string;
    automation: string;
    ai: string;
  };
  // Navigation items in competitor order
  navItems: NavItem[];
}

const SKINS: Record<SkinId, SkinConfig> = {
  apex: {
    id: "apex",
    name: "Apex CRM",
    tagline: "See the Light",
    primaryColor: "#f97316",
    accentColor: "#fb923c",
    bgColor: "#fffbf5",
    textColor: "#1a1a1a",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.75rem",
    logo: "⚡",
    terms: {
      contacts: "Contacts", companies: "Companies", deals: "Deals",
      pipeline: "Pipeline", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Leads", accounts: "Accounts",
      opportunities: "Opportunities", dashboard: "Dashboard",
      reports: "Reports", settings: "Settings", inbox: "Inbox",
      campaigns: "Campaigns", automation: "Automation", ai: "AI Assistant",
    },
    navItems: [
      { label: "Dashboard", icon: "LayoutDashboard", path: "/dashboard" },
      { label: "Contacts", icon: "Users", path: "/contacts" },
      { label: "Companies", icon: "Building2", path: "/companies" },
      { label: "Deals", icon: "TrendingUp", path: "/deals" },
      { label: "Activities", icon: "Activity", path: "/activities" },
      { label: "AI Assistant", icon: "Brain", path: "/ai" },
      { label: "Campaigns", icon: "Mail", path: "/campaigns" },
      { label: "Reports", icon: "BarChart3", path: "/reports" },
      { label: "Migration", icon: "ArrowRightLeft", path: "/migration" },
      { label: "Settings", icon: "Settings", path: "/settings" },
    ],
  },

  hubspot: {
    id: "hubspot",
    name: "HubSpot Mode",
    tagline: "Familiar HubSpot layout — powered by Apex",
    primaryColor: "#ff7a59",
    accentColor: "#ff8f73",
    bgColor: "#f5f8fa",
    textColor: "#33475b",
    fontFamily: "Lexend Deca, sans-serif",
    borderRadius: "0.375rem",
    logo: "🟠",
    terms: {
      contacts: "Contacts", companies: "Companies", deals: "Deals",
      pipeline: "Deal Pipeline", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Leads", accounts: "Companies",
      opportunities: "Deals", dashboard: "Home",
      reports: "Reports & Dashboards", settings: "Settings",
      inbox: "Conversations", campaigns: "Marketing",
      automation: "Workflows", ai: "AI Tools",
    },
    navItems: [
      { label: "Home", icon: "Home", path: "/dashboard" },
      { label: "Contacts", icon: "Users", path: "/contacts" },
      { label: "Companies", icon: "Building2", path: "/companies" },
      { label: "Deals", icon: "DollarSign", path: "/deals" },
      { label: "Activities", icon: "Calendar", path: "/activities" },
      { label: "Marketing", icon: "Megaphone", path: "/campaigns" },
      { label: "Conversations", icon: "MessageSquare", path: "/inbox" },
      { label: "Workflows", icon: "GitBranch", path: "/automation" },
      { label: "Reports", icon: "BarChart2", path: "/reports" },
      { label: "AI Tools", icon: "Sparkles", path: "/ai" },
      { label: "Settings", icon: "Settings", path: "/settings" },
    ],
  },

  salesforce: {
    id: "salesforce",
    name: "Salesforce Mode",
    tagline: "Familiar Salesforce layout — powered by Apex",
    primaryColor: "#0070d2",
    accentColor: "#1589ee",
    bgColor: "#f3f3f3",
    textColor: "#16325c",
    fontFamily: "Salesforce Sans, Arial, sans-serif",
    borderRadius: "0.25rem",
    logo: "☁️",
    terms: {
      contacts: "Contacts", companies: "Accounts", deals: "Opportunities",
      pipeline: "Forecast", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Leads", accounts: "Accounts",
      opportunities: "Opportunities", dashboard: "Home",
      reports: "Reports", settings: "Setup",
      inbox: "Chatter", campaigns: "Campaigns",
      automation: "Process Builder", ai: "Einstein AI",
    },
    navItems: [
      { label: "Home", icon: "Home", path: "/dashboard" },
      { label: "Leads", icon: "UserPlus", path: "/leads" },
      { label: "Contacts", icon: "Users", path: "/contacts" },
      { label: "Accounts", icon: "Building2", path: "/companies" },
      { label: "Opportunities", icon: "TrendingUp", path: "/deals" },
      { label: "Activities", icon: "Calendar", path: "/activities" },
      { label: "Campaigns", icon: "Megaphone", path: "/campaigns" },
      { label: "Einstein AI", icon: "Brain", path: "/ai" },
      { label: "Reports", icon: "BarChart3", path: "/reports" },
      { label: "Chatter", icon: "MessageSquare", path: "/inbox" },
      { label: "Setup", icon: "Settings", path: "/settings" },
    ],
  },

  pipedrive: {
    id: "pipedrive",
    name: "Pipedrive Mode",
    tagline: "Familiar Pipedrive layout — powered by Apex",
    primaryColor: "#217a4b",
    accentColor: "#2da65e",
    bgColor: "#f5f5f5",
    textColor: "#2c2c2c",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
    logo: "🟢",
    terms: {
      contacts: "People", companies: "Organizations", deals: "Deals",
      pipeline: "Pipeline", activities: "Activities", tasks: "Activities",
      notes: "Notes", leads: "Leads", accounts: "Organizations",
      opportunities: "Deals", dashboard: "Dashboard",
      reports: "Insights", settings: "Settings",
      inbox: "Mail", campaigns: "Campaigns",
      automation: "Automations", ai: "AI Sales Assistant",
    },
    navItems: [
      { label: "Dashboard", icon: "LayoutDashboard", path: "/dashboard" },
      { label: "Deals", icon: "DollarSign", path: "/deals" },
      { label: "Leads", icon: "UserPlus", path: "/leads" },
      { label: "People", icon: "Users", path: "/contacts" },
      { label: "Organizations", icon: "Building2", path: "/companies" },
      { label: "Activities", icon: "Calendar", path: "/activities" },
      { label: "Mail", icon: "Mail", path: "/inbox" },
      { label: "Campaigns", icon: "Megaphone", path: "/campaigns" },
      { label: "Automations", icon: "GitBranch", path: "/automation" },
      { label: "Insights", icon: "BarChart2", path: "/reports" },
      { label: "Settings", icon: "Settings", path: "/settings" },
    ],
  },

  zoho: {
    id: "zoho",
    name: "Zoho Mode",
    tagline: "Familiar Zoho CRM layout — powered by Apex",
    primaryColor: "#e42527",
    accentColor: "#f04e50",
    bgColor: "#f8f8f8",
    textColor: "#1a1a1a",
    fontFamily: "Lato, sans-serif",
    borderRadius: "0.375rem",
    logo: "🔴",
    terms: {
      contacts: "Contacts", companies: "Accounts", deals: "Deals",
      pipeline: "Pipeline", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Leads", accounts: "Accounts",
      opportunities: "Deals", dashboard: "Home",
      reports: "Reports", settings: "Setup",
      inbox: "SalesInbox", campaigns: "Campaigns",
      automation: "Workflow Rules", ai: "Zia AI",
    },
    navItems: [
      { label: "Home", icon: "Home", path: "/dashboard" },
      { label: "Leads", icon: "UserPlus", path: "/leads" },
      { label: "Contacts", icon: "Users", path: "/contacts" },
      { label: "Accounts", icon: "Building2", path: "/companies" },
      { label: "Deals", icon: "TrendingUp", path: "/deals" },
      { label: "Activities", icon: "Calendar", path: "/activities" },
      { label: "SalesInbox", icon: "Inbox", path: "/inbox" },
      { label: "Campaigns", icon: "Megaphone", path: "/campaigns" },
      { label: "Zia AI", icon: "Brain", path: "/ai" },
      { label: "Reports", icon: "BarChart3", path: "/reports" },
      { label: "Setup", icon: "Settings", path: "/settings" },
    ],
  },

  gohighlevel: {
    id: "gohighlevel",
    name: "GoHighLevel Mode",
    tagline: "Familiar GHL layout — powered by Apex",
    primaryColor: "#2563eb",
    accentColor: "#3b82f6",
    bgColor: "#0f172a",
    textColor: "#f8fafc",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
    logo: "🔵",
    terms: {
      contacts: "Contacts", companies: "Businesses", deals: "Opportunities",
      pipeline: "Pipeline", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Contacts", accounts: "Sub-Accounts",
      opportunities: "Opportunities", dashboard: "Dashboard",
      reports: "Reporting", settings: "Settings",
      inbox: "Conversations", campaigns: "Campaigns",
      automation: "Automations", ai: "AI Content",
    },
    navItems: [
      { label: "Dashboard", icon: "LayoutDashboard", path: "/dashboard" },
      { label: "Conversations", icon: "MessageSquare", path: "/inbox" },
      { label: "Contacts", icon: "Users", path: "/contacts" },
      { label: "Opportunities", icon: "TrendingUp", path: "/deals" },
      { label: "Calendars", icon: "Calendar", path: "/activities" },
      { label: "Campaigns", icon: "Megaphone", path: "/campaigns" },
      { label: "Automations", icon: "GitBranch", path: "/automation" },
      { label: "AI Content", icon: "Sparkles", path: "/ai" },
      { label: "Reporting", icon: "BarChart3", path: "/reports" },
      { label: "Settings", icon: "Settings", path: "/settings" },
    ],
  },

  close: {
    id: "close",
    name: "Close Mode",
    tagline: "Familiar Close CRM layout — powered by Apex",
    primaryColor: "#4c5fd5",
    accentColor: "#6475e0",
    bgColor: "#ffffff",
    textColor: "#1a1a2e",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
    logo: "🟣",
    terms: {
      contacts: "Contacts", companies: "Organizations", deals: "Opportunities",
      pipeline: "Pipeline", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Leads", accounts: "Organizations",
      opportunities: "Opportunities", dashboard: "Inbox",
      reports: "Reporting", settings: "Settings",
      inbox: "Inbox", campaigns: "Sequences",
      automation: "Workflows", ai: "AI Insights",
    },
    navItems: [
      { label: "Inbox", icon: "Inbox", path: "/dashboard" },
      { label: "Leads", icon: "UserPlus", path: "/leads" },
      { label: "Contacts", icon: "Users", path: "/contacts" },
      { label: "Organizations", icon: "Building2", path: "/companies" },
      { label: "Opportunities", icon: "TrendingUp", path: "/deals" },
      { label: "Activities", icon: "Calendar", path: "/activities" },
      { label: "Sequences", icon: "Mail", path: "/campaigns" },
      { label: "Workflows", icon: "GitBranch", path: "/automation" },
      { label: "AI Insights", icon: "Brain", path: "/ai" },
      { label: "Reporting", icon: "BarChart3", path: "/reports" },
      { label: "Settings", icon: "Settings", path: "/settings" },
    ],
  },
};

interface SkinContextValue {
  skin: SkinConfig;
  skinId: SkinId;
  setSkin: (id: SkinId) => void;
  graduateToApex: () => void;
  allSkins: SkinConfig[];
  t: (key: keyof SkinConfig["terms"]) => string;
  migratedFrom: string | null;
}

const SkinContext = createContext<SkinContextValue | null>(null);

export function SkinProvider({ children }: { children: ReactNode }) {
  // Start with apex skin, will be overridden by DB preference on load
  const [skinId, setSkinId] = useState<SkinId>("apex");
  const [migratedFrom, setMigratedFrom] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load skin preference from DB (authoritative source)
  const { data: prefData, isError: prefError } = trpc.migration.getSkin.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    if (prefData) {
      if (prefData.skin && SKINS[prefData.skin as SkinId]) {
        setSkinId(prefData.skin as SkinId);
        setMigratedFrom(prefData.migratedFrom ?? null);
      }
      setLoaded(true);
    }
  }, [prefData]);

  useEffect(() => {
    if (prefError) setLoaded(true);
  }, [prefError]);

  const setSkinMutation = trpc.migration.setSkin.useMutation();
  const graduateMutation = trpc.migration.graduateToApex.useMutation();

  const skin = SKINS[skinId];

  const setSkin = (id: SkinId) => {
    setSkinId(id);
    setSkinMutation.mutate({ skin: id });
  };

  const graduateToApex = () => {
    setSkinId("apex");
    setMigratedFrom(null);
    graduateMutation.mutate();
  };

  // Apply CSS variables — bridge skin config to Tailwind 4 tokens so every
  // bg-primary, text-foreground, bg-background, font-sans, rounded-* class
  // in the entire app instantly reflects the active competitor skin.
  useEffect(() => {
    const root = document.documentElement;

    // ── Legacy skin-* aliases (kept for backward compat) ──────────────────
    root.style.setProperty("--skin-primary", skin.primaryColor);
    root.style.setProperty("--skin-accent", skin.accentColor);
    root.style.setProperty("--skin-bg", skin.bgColor);
    root.style.setProperty("--skin-text", skin.textColor);
    root.style.setProperty("--skin-radius", skin.borderRadius);
    root.style.setProperty("--skin-font", skin.fontFamily);

    // ── Bridge to Tailwind 4 CSS tokens ───────────────────────────────────
    // Convert hex color to oklch approximation for Tailwind 4 compatibility
    // We use a simplified approach: set the raw hex on the token directly
    // (Tailwind 4 accepts raw color values in CSS vars when used with `color-mix`)
    root.style.setProperty("--primary", skin.primaryColor);
    root.style.setProperty("--primary-foreground", skin.id === "gohighlevel" ? "#ffffff" : "#ffffff");
    root.style.setProperty("--background", skin.bgColor);
    root.style.setProperty("--foreground", skin.textColor);
    root.style.setProperty("--card", skin.bgColor);
    root.style.setProperty("--card-foreground", skin.textColor);
    root.style.setProperty("--popover", skin.bgColor);
    root.style.setProperty("--popover-foreground", skin.textColor);
    root.style.setProperty("--accent", skin.accentColor);
    root.style.setProperty("--accent-foreground", "#ffffff");
    root.style.setProperty("--muted", skin.id === "gohighlevel" ? "#1e293b" : "#f1f5f9");
    root.style.setProperty("--muted-foreground", skin.id === "gohighlevel" ? "#94a3b8" : "#64748b");
    root.style.setProperty("--border", skin.id === "gohighlevel" ? "#334155" : "#e2e8f0");
    root.style.setProperty("--input", skin.id === "gohighlevel" ? "#334155" : "#e2e8f0");
    root.style.setProperty("--ring", skin.primaryColor);
    root.style.setProperty("--radius", skin.borderRadius);
    // Sidebar tokens
    root.style.setProperty("--sidebar", skin.bgColor);
    root.style.setProperty("--sidebar-foreground", skin.textColor);
    root.style.setProperty("--sidebar-primary", skin.primaryColor);
    root.style.setProperty("--sidebar-primary-foreground", "#ffffff");
    root.style.setProperty("--sidebar-accent", skin.accentColor);
    root.style.setProperty("--sidebar-accent-foreground", "#ffffff");
    root.style.setProperty("--sidebar-border", skin.id === "gohighlevel" ? "#334155" : "#e2e8f0");
    root.style.setProperty("--sidebar-ring", skin.primaryColor);
    // Font
    root.style.setProperty("--font-sans", skin.fontFamily);
    // Apply font-family directly to body as well (belt-and-suspenders)
    document.body.style.fontFamily = skin.fontFamily;
  }, [skin]);

  const t = (key: keyof SkinConfig["terms"]) => skin.terms[key];

  return (
    <SkinContext.Provider value={{ skin, skinId, setSkin, graduateToApex, allSkins: Object.values(SKINS), t, migratedFrom }}>
      {children}
    </SkinContext.Provider>
  );
}

export function useSkin() {
  const ctx = useContext(SkinContext);
  if (!ctx) throw new Error("useSkin must be used within SkinProvider");
  return ctx;
}

export { SKINS };
