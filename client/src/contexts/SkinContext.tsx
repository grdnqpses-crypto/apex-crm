/**
 * SkinContext — Adaptive Competitor Skin System
 *
 * Allows AXIOM CRM to mirror the look, feel, terminology, and navigation
 * of any competitor CRM so migrating users feel instantly at home.
 *
 * Supported skins (19 total):
 *   axiom, hubspot, salesforce, pipedrive, zoho, gohighlevel, close,
 *   apollo, constantcontact, monday, freshsales, activecampaign,
 *   keap, copper, nutshell, insightly, sugarcrm, streak, nimble
 */
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export type SkinId =
  | "axiom"
  | "hubspot"
  | "salesforce"
  | "pipedrive"
  | "zoho"
  | "gohighlevel"
  | "close"
  | "apollo"
  | "constantcontact"
  | "monday"
  | "freshsales"
  | "activecampaign"
  | "keap"
  | "copper"
  | "nutshell"
  | "insightly"
  | "sugarcrm"
  | "streak"
  | "nimble";

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
  isDark?: boolean; // true for dark-background skins (e.g. GoHighLevel)
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

// Google Fonts URL for each skin (null = use system font, no load needed)
const SKIN_FONTS: Record<SkinId, string | null> = {
  axiom:           "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  hubspot:         "https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@400;500;600;700;800&display=swap",
  salesforce:      null, // Salesforce Sans is proprietary; Arial fallback
  pipedrive:       "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  zoho:            "https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap",
  gohighlevel:     "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  close:           "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  apollo:          "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  constantcontact: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap",
  monday:          "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap",
  freshsales:      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  activecampaign:  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  keap:            "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap",
  copper:          "https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap",
  nutshell:        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  insightly:       "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
  sugarcrm:        "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap",
  streak:          "https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap",
  nimble:          "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap",
};

const SKINS: Record<SkinId, SkinConfig> = {
  // ─── AXIOM (native) ────────────────────────────────────────────────────────
  axiom: {
    id: "axiom",
    name: "AXIOM CRM",
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
      { label: "Dashboard",   icon: "LayoutDashboard", path: "/dashboard" },
      { label: "Contacts",    icon: "Users",           path: "/contacts" },
      { label: "Companies",   icon: "Building2",       path: "/companies" },
      { label: "Deals",       icon: "TrendingUp",      path: "/deals" },
      { label: "Activities",  icon: "Activity",        path: "/activities" },
      { label: "AI Assistant",icon: "Brain",           path: "/ai" },
      { label: "Campaigns",   icon: "Mail",            path: "/campaigns" },
      { label: "Reports",     icon: "BarChart3",       path: "/reports" },
      { label: "Migration",   icon: "ArrowRightLeft",  path: "/migration" },
      { label: "Settings",    icon: "Settings",        path: "/settings" },
    ],
  },

  // ─── HUBSPOT ───────────────────────────────────────────────────────────────
  hubspot: {
    id: "hubspot",
    name: "HubSpot Mode",
    tagline: "Familiar HubSpot layout — powered by AXIOM",
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
      { label: "Home",          icon: "Home",          path: "/dashboard" },
      { label: "Contacts",      icon: "Users",         path: "/contacts" },
      { label: "Companies",     icon: "Building2",     path: "/companies" },
      { label: "Deals",         icon: "DollarSign",    path: "/deals" },
      { label: "Activities",    icon: "Calendar",      path: "/activities" },
      { label: "Marketing",     icon: "Megaphone",     path: "/campaigns" },
      { label: "Conversations", icon: "MessageSquare", path: "/inbox" },
      { label: "Workflows",     icon: "GitBranch",     path: "/automation" },
      { label: "Reports",       icon: "BarChart2",     path: "/reports" },
      { label: "AI Tools",      icon: "Sparkles",      path: "/ai" },
      { label: "Settings",      icon: "Settings",      path: "/settings" },
    ],
  },

  // ─── SALESFORCE ────────────────────────────────────────────────────────────
  salesforce: {
    id: "salesforce",
    name: "Salesforce Mode",
    tagline: "Familiar Salesforce layout — powered by AXIOM",
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
      { label: "Home",          icon: "Home",       path: "/dashboard" },
      { label: "Leads",         icon: "UserPlus",   path: "/leads" },
      { label: "Contacts",      icon: "Users",      path: "/contacts" },
      { label: "Accounts",      icon: "Building2",  path: "/companies" },
      { label: "Opportunities", icon: "TrendingUp", path: "/deals" },
      { label: "Activities",    icon: "Calendar",   path: "/activities" },
      { label: "Campaigns",     icon: "Megaphone",  path: "/campaigns" },
      { label: "Einstein AI",   icon: "Brain",      path: "/ai" },
      { label: "Reports",       icon: "BarChart3",  path: "/reports" },
      { label: "Chatter",       icon: "MessageSquare", path: "/inbox" },
      { label: "Setup",         icon: "Settings",   path: "/settings" },
    ],
  },

  // ─── PIPEDRIVE ─────────────────────────────────────────────────────────────
  pipedrive: {
    id: "pipedrive",
    name: "Pipedrive Mode",
    tagline: "Familiar Pipedrive layout — powered by AXIOM",
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
      { label: "Dashboard",     icon: "LayoutDashboard", path: "/dashboard" },
      { label: "Deals",         icon: "DollarSign",      path: "/deals" },
      { label: "Leads",         icon: "UserPlus",        path: "/leads" },
      { label: "People",        icon: "Users",           path: "/contacts" },
      { label: "Organizations", icon: "Building2",       path: "/companies" },
      { label: "Activities",    icon: "Calendar",        path: "/activities" },
      { label: "Mail",          icon: "Mail",            path: "/inbox" },
      { label: "Campaigns",     icon: "Megaphone",       path: "/campaigns" },
      { label: "Automations",   icon: "GitBranch",       path: "/automation" },
      { label: "Insights",      icon: "BarChart2",       path: "/reports" },
      { label: "Settings",      icon: "Settings",        path: "/settings" },
    ],
  },

  // ─── ZOHO CRM ──────────────────────────────────────────────────────────────
  zoho: {
    id: "zoho",
    name: "Zoho Mode",
    tagline: "Familiar Zoho CRM layout — powered by AXIOM",
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
      { label: "Home",       icon: "Home",          path: "/dashboard" },
      { label: "Leads",      icon: "UserPlus",      path: "/leads" },
      { label: "Contacts",   icon: "Users",         path: "/contacts" },
      { label: "Accounts",   icon: "Building2",     path: "/companies" },
      { label: "Deals",      icon: "TrendingUp",    path: "/deals" },
      { label: "Activities", icon: "Calendar",      path: "/activities" },
      { label: "SalesInbox", icon: "Inbox",         path: "/inbox" },
      { label: "Campaigns",  icon: "Megaphone",     path: "/campaigns" },
      { label: "Zia AI",     icon: "Brain",         path: "/ai" },
      { label: "Reports",    icon: "BarChart3",     path: "/reports" },
      { label: "Setup",      icon: "Settings",      path: "/settings" },
    ],
  },

  // ─── GOHIGHLEVEL ───────────────────────────────────────────────────────────
  gohighlevel: {
    id: "gohighlevel",
    name: "GoHighLevel Mode",
    tagline: "Familiar GHL layout — powered by AXIOM",
    primaryColor: "#2563eb",
    accentColor: "#3b82f6",
    bgColor: "#0f172a",
    textColor: "#f8fafc",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
    logo: "🔵",
    isDark: true,
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
      { label: "Dashboard",     icon: "LayoutDashboard", path: "/dashboard" },
      { label: "Conversations", icon: "MessageSquare",   path: "/inbox" },
      { label: "Contacts",      icon: "Users",           path: "/contacts" },
      { label: "Opportunities", icon: "TrendingUp",      path: "/deals" },
      { label: "Calendars",     icon: "Calendar",        path: "/activities" },
      { label: "Campaigns",     icon: "Megaphone",       path: "/campaigns" },
      { label: "Automations",   icon: "GitBranch",       path: "/automation" },
      { label: "AI Content",    icon: "Sparkles",        path: "/ai" },
      { label: "Reporting",     icon: "BarChart3",       path: "/reports" },
      { label: "Settings",      icon: "Settings",        path: "/settings" },
    ],
  },

  // ─── CLOSE CRM ─────────────────────────────────────────────────────────────
  close: {
    id: "close",
    name: "Close Mode",
    tagline: "Familiar Close CRM layout — powered by AXIOM",
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
      { label: "Inbox",         icon: "Inbox",      path: "/dashboard" },
      { label: "Leads",         icon: "UserPlus",   path: "/leads" },
      { label: "Contacts",      icon: "Users",      path: "/contacts" },
      { label: "Organizations", icon: "Building2",  path: "/companies" },
      { label: "Opportunities", icon: "TrendingUp", path: "/deals" },
      { label: "Activities",    icon: "Calendar",   path: "/activities" },
      { label: "Sequences",     icon: "Mail",       path: "/campaigns" },
      { label: "Workflows",     icon: "GitBranch",  path: "/automation" },
      { label: "AI Insights",   icon: "Brain",      path: "/ai" },
      { label: "Reporting",     icon: "BarChart3",  path: "/reports" },
      { label: "Settings",      icon: "Settings",   path: "/settings" },
    ],
  },

  // ─── APOLLO.IO ─────────────────────────────────────────────────────────────
  // Primary: #4285F4 (Cornflower Blue), accent: #5B9BF5, bg: #ffffff
  // Dark sidebar: #1a1f2e; typography: Inter; border-radius: 0.5rem
  apollo: {
    id: "apollo",
    name: "Apollo Mode",
    tagline: "Familiar Apollo.io layout — powered by AXIOM",
    primaryColor: "#4285f4",
    accentColor: "#5b9bf5",
    bgColor: "#ffffff",
    textColor: "#1a1f2e",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
    logo: "🚀",
    terms: {
      contacts: "People", companies: "Companies", deals: "Opportunities",
      pipeline: "Pipeline", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Prospects", accounts: "Companies",
      opportunities: "Opportunities", dashboard: "Home",
      reports: "Analytics", settings: "Settings",
      inbox: "Sequences", campaigns: "Campaigns",
      automation: "Sequences", ai: "AI Recommendations",
    },
    navItems: [
      { label: "Home",               icon: "Home",          path: "/dashboard" },
      { label: "Prospects",          icon: "UserPlus",      path: "/leads" },
      { label: "People",             icon: "Users",         path: "/contacts" },
      { label: "Companies",          icon: "Building2",     path: "/companies" },
      { label: "Opportunities",      icon: "TrendingUp",    path: "/deals" },
      { label: "Sequences",          icon: "Mail",          path: "/campaigns" },
      { label: "Activities",         icon: "Calendar",      path: "/activities" },
      { label: "AI Recommendations", icon: "Sparkles",      path: "/ai" },
      { label: "Analytics",          icon: "BarChart2",     path: "/reports" },
      { label: "Settings",           icon: "Settings",      path: "/settings" },
    ],
  },

  // ─── CONSTANT CONTACT ──────────────────────────────────────────────────────
  // Primary: #0062EA (Blue), accent: #FF9920 (Orange), bg: #ffffff
  // Typography: Open Sans; border-radius: 0.375rem
  constantcontact: {
    id: "constantcontact",
    name: "Constant Contact Mode",
    tagline: "Familiar Constant Contact layout — powered by AXIOM",
    primaryColor: "#0062ea",
    accentColor: "#ff9920",
    bgColor: "#ffffff",
    textColor: "#1a1a1a",
    fontFamily: "Open Sans, sans-serif",
    borderRadius: "0.375rem",
    logo: "📧",
    terms: {
      contacts: "Contacts", companies: "Accounts", deals: "Deals",
      pipeline: "Pipeline", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Leads", accounts: "Accounts",
      opportunities: "Deals", dashboard: "Dashboard",
      reports: "Reporting", settings: "Account Settings",
      inbox: "Inbox", campaigns: "Email Campaigns",
      automation: "Automation", ai: "AI Content",
    },
    navItems: [
      { label: "Dashboard",        icon: "LayoutDashboard", path: "/dashboard" },
      { label: "Contacts",         icon: "Users",           path: "/contacts" },
      { label: "Email Campaigns",  icon: "Mail",            path: "/campaigns" },
      { label: "Automation",       icon: "GitBranch",       path: "/automation" },
      { label: "Leads",            icon: "UserPlus",        path: "/leads" },
      { label: "Deals",            icon: "TrendingUp",      path: "/deals" },
      { label: "Activities",       icon: "Calendar",        path: "/activities" },
      { label: "AI Content",       icon: "Sparkles",        path: "/ai" },
      { label: "Reporting",        icon: "BarChart3",       path: "/reports" },
      { label: "Account Settings", icon: "Settings",        path: "/settings" },
    ],
  },

  // ─── MONDAY CRM ────────────────────────────────────────────────────────────
  // Primary: #6161FF (Indigo), accent: #FB275D (Red), bg: #f6f7fb
  // Typography: Poppins; border-radius: 0.5rem; colorful board-style UI
  monday: {
    id: "monday",
    name: "Monday CRM Mode",
    tagline: "Familiar Monday.com layout — powered by AXIOM",
    primaryColor: "#6161ff",
    accentColor: "#fb275d",
    bgColor: "#f6f7fb",
    textColor: "#323338",
    fontFamily: "Poppins, sans-serif",
    borderRadius: "0.5rem",
    logo: "📋",
    terms: {
      contacts: "Contacts", companies: "Accounts", deals: "Deals",
      pipeline: "Pipeline", activities: "Activities", tasks: "Items",
      notes: "Updates", leads: "Leads", accounts: "Accounts",
      opportunities: "Deals", dashboard: "Home",
      reports: "Dashboards", settings: "Admin",
      inbox: "Inbox", campaigns: "Campaigns",
      automation: "Automations", ai: "AI Assistant",
    },
    navItems: [
      { label: "Home",        icon: "Home",            path: "/dashboard" },
      { label: "Leads",       icon: "UserPlus",        path: "/leads" },
      { label: "Contacts",    icon: "Users",           path: "/contacts" },
      { label: "Accounts",    icon: "Building2",       path: "/companies" },
      { label: "Deals",       icon: "TrendingUp",      path: "/deals" },
      { label: "Activities",  icon: "Calendar",        path: "/activities" },
      { label: "Campaigns",   icon: "Megaphone",       path: "/campaigns" },
      { label: "Automations", icon: "GitBranch",       path: "/automation" },
      { label: "AI Assistant",icon: "Sparkles",        path: "/ai" },
      { label: "Dashboards",  icon: "BarChart2",       path: "/reports" },
      { label: "Admin",       icon: "Settings",        path: "/settings" },
    ],
  },

  // ─── FRESHSALES (Freshworks) ───────────────────────────────────────────────
  // Primary: #0B5FFF (Blue), accent: #00B8A9 (Teal), bg: #f4f6f8
  // Typography: Inter; border-radius: 0.5rem
  freshsales: {
    id: "freshsales",
    name: "Freshsales Mode",
    tagline: "Familiar Freshsales layout — powered by AXIOM",
    primaryColor: "#0b5fff",
    accentColor: "#00b8a9",
    bgColor: "#f4f6f8",
    textColor: "#1a1a1a",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
    logo: "🌿",
    terms: {
      contacts: "Contacts", companies: "Accounts", deals: "Deals",
      pipeline: "Pipeline", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Leads", accounts: "Accounts",
      opportunities: "Deals", dashboard: "Overview",
      reports: "Reports", settings: "Admin Settings",
      inbox: "Emails", campaigns: "Campaigns",
      automation: "Workflows", ai: "Freddy AI",
    },
    navItems: [
      { label: "Overview",       icon: "LayoutDashboard", path: "/dashboard" },
      { label: "Leads",          icon: "UserPlus",        path: "/leads" },
      { label: "Contacts",       icon: "Users",           path: "/contacts" },
      { label: "Accounts",       icon: "Building2",       path: "/companies" },
      { label: "Deals",          icon: "TrendingUp",      path: "/deals" },
      { label: "Activities",     icon: "Calendar",        path: "/activities" },
      { label: "Emails",         icon: "Mail",            path: "/inbox" },
      { label: "Campaigns",      icon: "Megaphone",       path: "/campaigns" },
      { label: "Freddy AI",      icon: "Brain",           path: "/ai" },
      { label: "Reports",        icon: "BarChart3",       path: "/reports" },
      { label: "Admin Settings", icon: "Settings",        path: "/settings" },
    ],
  },

  // ─── ACTIVECAMPAIGN ────────────────────────────────────────────────────────
  // Primary: #356AE6 (AC Blue), accent: #FF5A5F (Coral), bg: #ffffff
  // Theme color: rgb(0,0,45) = deep navy; Typography: Inter; radius: 0.375rem
  activecampaign: {
    id: "activecampaign",
    name: "ActiveCampaign Mode",
    tagline: "Familiar ActiveCampaign layout — powered by AXIOM",
    primaryColor: "#356ae6",
    accentColor: "#ff5a5f",
    bgColor: "#ffffff",
    textColor: "#00002d",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.375rem",
    logo: "⚙️",
    terms: {
      contacts: "Contacts", companies: "Accounts", deals: "Deals",
      pipeline: "Pipeline", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Leads", accounts: "Accounts",
      opportunities: "Deals", dashboard: "Overview",
      reports: "Reports", settings: "Settings",
      inbox: "Conversations", campaigns: "Campaigns",
      automation: "Automations", ai: "AI Features",
    },
    navItems: [
      { label: "Overview",       icon: "LayoutDashboard", path: "/dashboard" },
      { label: "Contacts",       icon: "Users",           path: "/contacts" },
      { label: "Accounts",       icon: "Building2",       path: "/companies" },
      { label: "Deals",          icon: "TrendingUp",      path: "/deals" },
      { label: "Campaigns",      icon: "Mail",            path: "/campaigns" },
      { label: "Automations",    icon: "GitBranch",       path: "/automation" },
      { label: "Conversations",  icon: "MessageSquare",   path: "/inbox" },
      { label: "Activities",     icon: "Calendar",        path: "/activities" },
      { label: "AI Features",    icon: "Sparkles",        path: "/ai" },
      { label: "Reports",        icon: "BarChart2",       path: "/reports" },
      { label: "Settings",       icon: "Settings",        path: "/settings" },
    ],
  },

  // ─── KEAP (formerly Infusionsoft) ──────────────────────────────────────────
  // Primary: #36A635 (Fruit Salad Green), accent: #5BBF5A, bg: #f9f9f9
  // Typography: Source Sans 3; border-radius: 0.375rem
  keap: {
    id: "keap",
    name: "Keap Mode",
    tagline: "Familiar Keap (Infusionsoft) layout — powered by AXIOM",
    primaryColor: "#36a635",
    accentColor: "#5bbf5a",
    bgColor: "#f9f9f9",
    textColor: "#1a1a1a",
    fontFamily: "Source Sans 3, sans-serif",
    borderRadius: "0.375rem",
    logo: "🌱",
    terms: {
      contacts: "Contacts", companies: "Companies", deals: "Opportunities",
      pipeline: "Pipeline", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Leads", accounts: "Companies",
      opportunities: "Opportunities", dashboard: "Dashboard",
      reports: "Reports", settings: "Settings",
      inbox: "Messages", campaigns: "Broadcasts",
      automation: "Campaigns (Automation)", ai: "AI Tools",
    },
    navItems: [
      { label: "Dashboard",            icon: "LayoutDashboard", path: "/dashboard" },
      { label: "Contacts",             icon: "Users",           path: "/contacts" },
      { label: "Companies",            icon: "Building2",       path: "/companies" },
      { label: "Leads",                icon: "UserPlus",        path: "/leads" },
      { label: "Opportunities",        icon: "TrendingUp",      path: "/deals" },
      { label: "Activities",           icon: "Calendar",        path: "/activities" },
      { label: "Broadcasts",           icon: "Mail",            path: "/campaigns" },
      { label: "Campaign Automation",  icon: "GitBranch",       path: "/automation" },
      { label: "AI Tools",             icon: "Sparkles",        path: "/ai" },
      { label: "Reports",              icon: "BarChart3",       path: "/reports" },
      { label: "Settings",             icon: "Settings",        path: "/settings" },
    ],
  },

  // ─── COPPER CRM ────────────────────────────────────────────────────────────
  // Primary: #FF3465 (Radical Red / Hot Pink), accent: #F494B4, bg: #ffffff
  // Google-Workspace-native feel; Typography: Google Sans / Roboto; radius: 0.5rem
  copper: {
    id: "copper",
    name: "Copper Mode",
    tagline: "Familiar Copper CRM layout — powered by AXIOM",
    primaryColor: "#ff3465",
    accentColor: "#f494b4",
    bgColor: "#ffffff",
    textColor: "#1a1a1a",
    fontFamily: "Roboto, sans-serif",
    borderRadius: "0.5rem",
    logo: "🔶",
    terms: {
      contacts: "People", companies: "Companies", deals: "Opportunities",
      pipeline: "Pipeline", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Leads", accounts: "Companies",
      opportunities: "Opportunities", dashboard: "Dashboard",
      reports: "Reports", settings: "Settings",
      inbox: "Emails", campaigns: "Campaigns",
      automation: "Workflows", ai: "AI Insights",
    },
    navItems: [
      { label: "Dashboard",     icon: "LayoutDashboard", path: "/dashboard" },
      { label: "Leads",         icon: "UserPlus",        path: "/leads" },
      { label: "People",        icon: "Users",           path: "/contacts" },
      { label: "Companies",     icon: "Building2",       path: "/companies" },
      { label: "Opportunities", icon: "TrendingUp",      path: "/deals" },
      { label: "Activities",    icon: "Calendar",        path: "/activities" },
      { label: "Emails",        icon: "Mail",            path: "/inbox" },
      { label: "Workflows",     icon: "GitBranch",       path: "/automation" },
      { label: "AI Insights",   icon: "Brain",           path: "/ai" },
      { label: "Reports",       icon: "BarChart2",       path: "/reports" },
      { label: "Settings",      icon: "Settings",        path: "/settings" },
    ],
  },

  // ─── NUTSHELL CRM ──────────────────────────────────────────────────────────
  // Primary: #F37021 (Orange), accent: #FFA040, bg: #ffffff
  // Typography: Inter; border-radius: 0.5rem
  nutshell: {
    id: "nutshell",
    name: "Nutshell Mode",
    tagline: "Familiar Nutshell CRM layout — powered by AXIOM",
    primaryColor: "#f37021",
    accentColor: "#ffa040",
    bgColor: "#ffffff",
    textColor: "#1a1a1a",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
    logo: "🥜",
    terms: {
      contacts: "People", companies: "Companies", deals: "Leads",
      pipeline: "Pipeline", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Leads", accounts: "Companies",
      opportunities: "Leads", dashboard: "Dashboard",
      reports: "Reports", settings: "Settings",
      inbox: "Emails", campaigns: "Email Sequences",
      automation: "Automations", ai: "AI Tools",
    },
    navItems: [
      { label: "Dashboard",        icon: "LayoutDashboard", path: "/dashboard" },
      { label: "Leads",            icon: "TrendingUp",      path: "/deals" },
      { label: "People",           icon: "Users",           path: "/contacts" },
      { label: "Companies",        icon: "Building2",       path: "/companies" },
      { label: "Activities",       icon: "Calendar",        path: "/activities" },
      { label: "Email Sequences",  icon: "Mail",            path: "/campaigns" },
      { label: "Automations",      icon: "GitBranch",       path: "/automation" },
      { label: "AI Tools",         icon: "Sparkles",        path: "/ai" },
      { label: "Reports",          icon: "BarChart3",       path: "/reports" },
      { label: "Settings",         icon: "Settings",        path: "/settings" },
    ],
  },

  // ─── INSIGHTLY ─────────────────────────────────────────────────────────────
  // Primary: #E8392C (Red), accent: #FF6B5B, bg: #f5f5f5
  // Typography: Roboto; border-radius: 0.375rem
  insightly: {
    id: "insightly",
    name: "Insightly Mode",
    tagline: "Familiar Insightly layout — powered by AXIOM",
    primaryColor: "#e8392c",
    accentColor: "#ff6b5b",
    bgColor: "#f5f5f5",
    textColor: "#1a1a1a",
    fontFamily: "Roboto, sans-serif",
    borderRadius: "0.375rem",
    logo: "🔍",
    terms: {
      contacts: "Contacts", companies: "Organizations", deals: "Opportunities",
      pipeline: "Pipeline", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Leads", accounts: "Organizations",
      opportunities: "Opportunities", dashboard: "Home",
      reports: "Reports", settings: "System Settings",
      inbox: "Emails", campaigns: "Email Campaigns",
      automation: "Workflow Automation", ai: "AppConnect AI",
    },
    navItems: [
      { label: "Home",                 icon: "Home",            path: "/dashboard" },
      { label: "Leads",                icon: "UserPlus",        path: "/leads" },
      { label: "Contacts",             icon: "Users",           path: "/contacts" },
      { label: "Organizations",        icon: "Building2",       path: "/companies" },
      { label: "Opportunities",        icon: "TrendingUp",      path: "/deals" },
      { label: "Activities",           icon: "Calendar",        path: "/activities" },
      { label: "Email Campaigns",      icon: "Mail",            path: "/campaigns" },
      { label: "Workflow Automation",  icon: "GitBranch",       path: "/automation" },
      { label: "AppConnect AI",        icon: "Brain",           path: "/ai" },
      { label: "Reports",              icon: "BarChart3",       path: "/reports" },
      { label: "System Settings",      icon: "Settings",        path: "/settings" },
    ],
  },

  // ─── SUGARCRM ──────────────────────────────────────────────────────────────
  // Primary: #E61718 (Red), accent: #FF4B4C, bg: #f7f7f7
  // Typography: Source Sans 3; border-radius: 0.25rem (enterprise boxy feel)
  sugarcrm: {
    id: "sugarcrm",
    name: "SugarCRM Mode",
    tagline: "Familiar SugarCRM layout — powered by AXIOM",
    primaryColor: "#e61718",
    accentColor: "#ff4b4c",
    bgColor: "#f7f7f7",
    textColor: "#1a1a1a",
    fontFamily: "Source Sans 3, sans-serif",
    borderRadius: "0.25rem",
    logo: "🍬",
    terms: {
      contacts: "Contacts", companies: "Accounts", deals: "Opportunities",
      pipeline: "Pipeline", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Leads", accounts: "Accounts",
      opportunities: "Opportunities", dashboard: "Home",
      reports: "Reports", settings: "Admin",
      inbox: "Emails", campaigns: "Campaigns",
      automation: "Process Automation", ai: "SugarPredict AI",
    },
    navItems: [
      { label: "Home",               icon: "Home",            path: "/dashboard" },
      { label: "Leads",              icon: "UserPlus",        path: "/leads" },
      { label: "Contacts",           icon: "Users",           path: "/contacts" },
      { label: "Accounts",           icon: "Building2",       path: "/companies" },
      { label: "Opportunities",      icon: "TrendingUp",      path: "/deals" },
      { label: "Activities",         icon: "Calendar",        path: "/activities" },
      { label: "Emails",             icon: "Mail",            path: "/inbox" },
      { label: "Campaigns",          icon: "Megaphone",       path: "/campaigns" },
      { label: "Process Automation", icon: "GitBranch",       path: "/automation" },
      { label: "SugarPredict AI",    icon: "Brain",           path: "/ai" },
      { label: "Reports",            icon: "BarChart3",       path: "/reports" },
      { label: "Admin",              icon: "Settings",        path: "/settings" },
    ],
  },

  // ─── STREAK CRM (Gmail-native) ─────────────────────────────────────────────
  // Primary: #4285F4 (Google Blue), accent: #34A853 (Google Green), bg: #ffffff
  // Lives inside Gmail; Typography: Roboto / Google Sans; radius: 0.25rem
  streak: {
    id: "streak",
    name: "Streak Mode",
    tagline: "Familiar Streak CRM layout — powered by AXIOM",
    primaryColor: "#4285f4",
    accentColor: "#34a853",
    bgColor: "#ffffff",
    textColor: "#202124",
    fontFamily: "Roboto, sans-serif",
    borderRadius: "0.25rem",
    logo: "📬",
    terms: {
      contacts: "Contacts", companies: "Organizations", deals: "Boxes",
      pipeline: "Pipeline", activities: "Activities", tasks: "Reminders",
      notes: "Notes", leads: "Leads", accounts: "Organizations",
      opportunities: "Boxes", dashboard: "Home",
      reports: "Reports", settings: "Settings",
      inbox: "Gmail Inbox", campaigns: "Mail Merge",
      automation: "Snippets & Automation", ai: "AI Features",
    },
    navItems: [
      { label: "Home",                    icon: "Home",         path: "/dashboard" },
      { label: "Contacts",                icon: "Users",        path: "/contacts" },
      { label: "Organizations",           icon: "Building2",    path: "/companies" },
      { label: "Pipeline (Boxes)",        icon: "TrendingUp",   path: "/deals" },
      { label: "Leads",                   icon: "UserPlus",     path: "/leads" },
      { label: "Activities",              icon: "Calendar",     path: "/activities" },
      { label: "Mail Merge",              icon: "Mail",         path: "/campaigns" },
      { label: "Snippets & Automation",   icon: "GitBranch",    path: "/automation" },
      { label: "AI Features",             icon: "Sparkles",     path: "/ai" },
      { label: "Reports",                 icon: "BarChart2",    path: "/reports" },
      { label: "Settings",                icon: "Settings",     path: "/settings" },
    ],
  },

  // ─── NIMBLE CRM ────────────────────────────────────────────────────────────
  // Primary: #00AEEF (Sky Blue), accent: #FF6B35 (Orange), bg: #f5f7fa
  // Social-enrichment focused; Typography: Open Sans; radius: 0.5rem
  nimble: {
    id: "nimble",
    name: "Nimble Mode",
    tagline: "Familiar Nimble CRM layout — powered by AXIOM",
    primaryColor: "#00aeef",
    accentColor: "#ff6b35",
    bgColor: "#f5f7fa",
    textColor: "#1a1a1a",
    fontFamily: "Open Sans, sans-serif",
    borderRadius: "0.5rem",
    logo: "🌐",
    terms: {
      contacts: "Contacts", companies: "Companies", deals: "Deals",
      pipeline: "Pipeline", activities: "Activities", tasks: "Tasks",
      notes: "Notes", leads: "Leads", accounts: "Companies",
      opportunities: "Deals", dashboard: "Today Page",
      reports: "Reports", settings: "Settings",
      inbox: "Messages", campaigns: "Group Messages",
      automation: "Workflows", ai: "AI Insights",
    },
    navItems: [
      { label: "Today Page",     icon: "Home",            path: "/dashboard" },
      { label: "Contacts",       icon: "Users",           path: "/contacts" },
      { label: "Companies",      icon: "Building2",       path: "/companies" },
      { label: "Leads",          icon: "UserPlus",        path: "/leads" },
      { label: "Deals",          icon: "TrendingUp",      path: "/deals" },
      { label: "Activities",     icon: "Calendar",        path: "/activities" },
      { label: "Group Messages", icon: "Mail",            path: "/campaigns" },
      { label: "Workflows",      icon: "GitBranch",       path: "/automation" },
      { label: "AI Insights",    icon: "Brain",           path: "/ai" },
      { label: "Reports",        icon: "BarChart3",       path: "/reports" },
      { label: "Settings",       icon: "Settings",        path: "/settings" },
    ],
  },
};

interface SkinContextValue {
  skin: SkinConfig;
  skinId: SkinId;
  setSkin: (id: SkinId) => void;
  graduateToAxiom: () => void;
  allSkins: SkinConfig[];
  t: (key: keyof SkinConfig["terms"]) => string;
  migratedFrom: string | null;
}

const SkinContext = createContext<SkinContextValue | null>(null);

export function SkinProvider({ children }: { children: ReactNode }) {
  // Start with axiom skin, will be overridden by DB preference on load
  const [skinId, setSkinId] = useState<SkinId>("axiom");
  const [migratedFrom, setMigratedFrom] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Load skin preference from DB (authoritative source)
  // Only query when authenticated — prevents redirect loop on public pages
  const { user, loading: authLoading } = useAuth();
  const { data: prefData, isError: prefError } = trpc.migration.getSkin.useQuery(undefined, {
    retry: false,
    enabled: !!user && !authLoading,
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

  // If auth is resolved and there's no user, mark skin as loaded (use default axiom skin)
  useEffect(() => {
    if (!authLoading && !user) setLoaded(true);
  }, [authLoading, user]);

  const setSkinMutation = trpc.migration.setSkin.useMutation();
  const graduateMutation = trpc.migration.graduateToAxiom.useMutation();

  const skin = SKINS[skinId];

  const setSkin = (id: SkinId) => {
    setSkinId(id);
    setSkinMutation.mutate({ skin: id });
  };

  const graduateToAxiom = () => {
    setSkinId("axiom");
    setMigratedFrom(null);
    graduateMutation.mutate();
  };

  // Dynamically load the correct Google Font for the active skin
  useEffect(() => {
    const fontUrl = SKIN_FONTS[skinId];
    const linkId = "axiom-skin-font";
    const existing = document.getElementById(linkId);
    if (existing) existing.remove();
    if (fontUrl) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = fontUrl;
      document.head.appendChild(link);
    }
  }, [skinId]);

  // Apply CSS variables — bridge skin config to Tailwind 4 tokens so every
  // bg-primary, text-foreground, bg-background, font-sans, rounded-* class
  // in the entire app instantly reflects the active competitor skin.
  useEffect(() => {
    const root = document.documentElement;
    const isDark = skin.isDark ?? false;

    // ── Legacy skin-* aliases (kept for backward compat) ──────────────────
    root.style.setProperty("--skin-primary", skin.primaryColor);
    root.style.setProperty("--skin-accent", skin.accentColor);
    root.style.setProperty("--skin-bg", skin.bgColor);
    root.style.setProperty("--skin-text", skin.textColor);
    root.style.setProperty("--skin-radius", skin.borderRadius);
    root.style.setProperty("--skin-font", skin.fontFamily);

    // ── Bridge to Tailwind 4 CSS tokens ───────────────────────────────────
    root.style.setProperty("--primary", skin.primaryColor);
    root.style.setProperty("--primary-foreground", "#ffffff");
    root.style.setProperty("--background", skin.bgColor);
    root.style.setProperty("--foreground", skin.textColor);
    root.style.setProperty("--card", skin.bgColor);
    root.style.setProperty("--card-foreground", skin.textColor);
    root.style.setProperty("--popover", skin.bgColor);
    root.style.setProperty("--popover-foreground", skin.textColor);
    root.style.setProperty("--accent", skin.accentColor);
    root.style.setProperty("--accent-foreground", "#ffffff");
    root.style.setProperty("--muted", isDark ? "#1e293b" : "#f1f5f9");
    root.style.setProperty("--muted-foreground", isDark ? "#94a3b8" : "#64748b");
    root.style.setProperty("--border", isDark ? "#334155" : "#e2e8f0");
    root.style.setProperty("--input", isDark ? "#334155" : "#e2e8f0");
    root.style.setProperty("--ring", skin.primaryColor);
    root.style.setProperty("--radius", skin.borderRadius);

    // Sidebar tokens
    root.style.setProperty("--sidebar", skin.bgColor);
    root.style.setProperty("--sidebar-foreground", skin.textColor);
    root.style.setProperty("--sidebar-primary", skin.primaryColor);
    root.style.setProperty("--sidebar-primary-foreground", "#ffffff");
    root.style.setProperty("--sidebar-accent", skin.accentColor);
    root.style.setProperty("--sidebar-accent-foreground", "#ffffff");
    root.style.setProperty("--sidebar-border", isDark ? "#334155" : "#e2e8f0");
    root.style.setProperty("--sidebar-ring", skin.primaryColor);

    // Font
    root.style.setProperty("--font-sans", skin.fontFamily);
    document.body.style.fontFamily = skin.fontFamily;
  }, [skin]);

  const t = (key: keyof SkinConfig["terms"]) => skin.terms[key];

  return (
    <SkinContext.Provider value={{ skin, skinId, setSkin, graduateToAxiom, allSkins: Object.values(SKINS), t, migratedFrom }}>
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
