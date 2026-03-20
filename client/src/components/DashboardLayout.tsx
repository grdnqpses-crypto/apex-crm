import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, Users, Building2, Kanban, Mail, Shield,
  BarChart3, ListChecks, GitBranch, FlaskConical, Key, Webhook,
  Filter, PanelLeft, LogOut, Zap, Send, ChevronDown,
  Brain, Target, Radar, Ghost, Flame, Plug,
  ShieldCheck, Ban, Settings, Globe, Sparkles, BookOpen, FileSearch,
  Activity, Database, Eye, ScrollText, UserCog, Download,
  Phone, FileText, TrendingUp, Rocket, Bell, PenTool, Briefcase, ScanLine, Truck,
  Receipt, Globe2, UserPlus, Headphones, Database as DatabaseIcon, Flame as FlameIcon,
  EyeIcon, MailOpen, Paintbrush, ArrowRightLeft, Crown, Command, Package, CreditCard,
  TrendingDown, DollarSign, Tag, Home, Calendar, MessageSquare, Megaphone, BarChart2,
  Inbox, Layers, Star, LucideIcon, FileSignature, ClipboardList, ThumbsUp, Plane,
  MessageCircle, Share2, PhoneCall, AlertTriangle, Search as SearchIcon, Route, ListOrdered,
} from "lucide-react";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import GlobalSearch from './GlobalSearch';
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import AIAssistantPanel from "./AIAssistantPanel";
import OnboardingTutorial from "./OnboardingTutorial";
import PaymentFailedBanner from "./PaymentFailedBanner";
import { trpc } from "@/lib/trpc";
import { useSkin } from "@/contexts/SkinContext";

// ─── Icon resolver for skin nav items ───
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Users, Building2, Kanban, Mail, Shield,
  BarChart3, ListChecks, GitBranch, FlaskConical, Key, Webhook,
  Filter, Zap, Send, Brain, Target, Radar, Ghost, Flame, Plug,
  ShieldCheck, Ban, Settings, Globe, Sparkles, BookOpen, FileSearch,
  Activity, Eye, ScrollText, UserCog, Download, Phone, FileText,
  TrendingUp, Rocket, Bell, PenTool, Briefcase, ScanLine, Truck,
  Receipt, UserPlus, Headphones, Paintbrush, ArrowRightLeft, Crown,
  Command, Package, CreditCard, TrendingDown, DollarSign, Tag,
  Home, Calendar, MessageSquare, Megaphone, BarChart2, Inbox, Star,
  // Star is imported above
};

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? LayoutDashboard;
}

// ─── Menu Sections (Developer is separate, hidden by default) ───

const standardSections = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: Users, label: "Team", path: "/team" },
      { icon: BarChart3, label: "Team Performance", path: "/team-performance" },
    ],
  },
  {
    label: "CRM",
    items: [
      { icon: Building2, label: "Companies", path: "/companies" },
      { icon: Users, label: "Contacts", path: "/contacts" },
      { icon: Kanban, label: "Deals", path: "/deals" },
      { icon: ListChecks, label: "Tasks", path: "/tasks" },
      { icon: Calendar, label: "Calendar Sync", path: "/calendar-sync" },
      { icon: Mail, label: "Email Sync", path: "/email-sync" },
      { icon: Phone, label: "Dialer", path: "/dialer" },
      { icon: Briefcase, label: "Meeting Scheduler", path: "/meeting-scheduler" },
      { icon: FileText, label: "Proposals", path: "/proposals" },
      { icon: DatabaseIcon, label: "Custom Objects", path: "/custom-objects" },
      { icon: TrendingDown, label: "Rotten Deals", path: "/rotten-deals" },
      { icon: Building2, label: "Account Hierarchy", path: "/account-hierarchy" },
      { icon: Globe2, label: "Territory Management", path: "/territories" },
      { icon: Package, label: "Product Catalog", path: "/product-catalog" },
      { icon: Brain, label: "AI Next Best Action", path: "/ai-next-best-action" },
      { icon: ClipboardList, label: "Web Forms Builder", path: "/web-forms" },
      { icon: FileSignature, label: "E-Signature", path: "/esignature" },
      { icon: ThumbsUp, label: "Reputation Mgmt", path: "/reputation" },
      { icon: Plane, label: "OOO Detection", path: "/ooo-detection" },
      { icon: ListOrdered, label: "Email Sequences", path: "/email-sequences" },
      { icon: Route, label: "Journey Orchestration", path: "/journey-orchestration" },
      { icon: MessageCircle, label: "WhatsApp Messaging", path: "/whatsapp" },
      { icon: Share2, label: "Social Scheduler", path: "/social-scheduler" },
      { icon: PhoneCall, label: "Power Dialer", path: "/power-dialer" },
      { icon: AlertTriangle, label: "Anomaly Detection", path: "/anomaly-detection" },
      { icon: SearchIcon, label: "Pipeline Inspection", path: "/pipeline-inspection" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { icon: Send, label: "Campaigns", path: "/campaigns" },
      { icon: Mail, label: "Templates", path: "/templates" },
      { icon: Shield, label: "Deliverability", path: "/deliverability" },
      { icon: FlaskConical, label: "A/B Tests", path: "/ab-tests" },
      { icon: Zap, label: "SMTP Accounts", path: "/smtp-accounts" },
      { icon: Activity, label: "Domain Optimizer", path: "/domain-optimizer" },
      { icon: Mail, label: "Email Masking", path: "/email-masking" },
      { icon: Sparkles, label: "A/B Engine", path: "/ab-engine" },
    ],
  },
  {
    label: "Automation",
    items: [
      { icon: GitBranch, label: "Workflows", path: "/workflows" },
      { icon: Sparkles, label: "Workflow Builder", path: "/workflow-builder" },
      { icon: Plug, label: "Integration Hub", path: "/integration-hub" },
      { icon: Filter, label: "Segments", path: "/segments" },
    ],
  },
  {
    label: "Paradigm Engine",
    items: [
      { icon: Brain, label: "Pulse Dashboard", path: "/paradigm" },
      { icon: Target, label: "Prospects", path: "/paradigm/prospects" },
      { icon: Radar, label: "Signals", path: "/paradigm/signals" },
      { icon: Ghost, label: "Ghost Sequences", path: "/paradigm/sequences" },
      { icon: Flame, label: "Battle Cards", path: "/paradigm/battle-cards" },
      { icon: Plug, label: "Integrations", path: "/paradigm/integrations" },
      { icon: Sparkles, label: "Quantum Score", path: "/paradigm/quantum-score" },
    ],
  },
  {
    label: "Compliance & Safety",
    items: [
      { icon: ShieldCheck, label: "Compliance Center", path: "/compliance" },
      { icon: ScrollText, label: "Audit Logs", path: "/audit-logs" },
      { icon: Ban, label: "Suppression List", path: "/suppression" },
      { icon: Settings, label: "Sender Settings", path: "/sender-settings" },
      { icon: Globe, label: "Domain Stats", path: "/domain-stats" },
    ],
  },
  {
    label: "Operations",
    items: [
      { icon: Truck, label: "Load Management", path: "/loads" },
      { icon: ShieldCheck, label: "Carrier Vetting", path: "/carrier-vetting" },
      { icon: Receipt, label: "Invoicing", path: "/invoicing" },
      { icon: Globe, label: "Customer Portal", path: "/portal" },
      { icon: UserPlus, label: "Onboarding", path: "/onboarding" },
      { icon: MailOpen, label: "Order Entry", path: "/order-entry" },
    ],
  },
  {
    label: "AI Premium",
    items: [
      { icon: Phone, label: "Voice Agent", path: "/voice-agent" },
      { icon: ScanLine, label: "DocScan", path: "/docscan" },
      { icon: FileText, label: "Carrier Packets", path: "/carrier-packets" },
      { icon: TrendingUp, label: "Win Probability", path: "/win-probability" },
      { icon: Rocket, label: "Revenue Autopilot", path: "/revenue-autopilot" },
      { icon: Bell, label: "Smart Notifications", path: "/smart-notifications" },
      { icon: PenTool, label: "AI Ghostwriter", path: "/ghostwriter" },
      { icon: Briefcase, label: "Meeting Prep", path: "/meeting-prep" },
      { icon: Headphones, label: "Call Intelligence", path: "/conversation-intel" },
      { icon: DatabaseIcon, label: "B2B Database", path: "/b2b-database" },
      { icon: FlameIcon, label: "Email Warmup", path: "/email-warmup" },
      { icon: EyeIcon, label: "Visitor Tracking", path: "/visitor-tracking" },
      { icon: Command, label: "Command Center", path: "/command-center" },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { icon: Package, label: "Freight Marketplace", path: "/freight-marketplace" },
      { icon: Brain, label: "AXIOM Autopilot", path: "/axiom-autopilot" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { icon: BarChart3, label: "Reports", path: "/analytics" },
      { icon: BarChart2, label: "Report Builder", path: "/report-builder" },
      { icon: TrendingUp, label: "Win/Loss Analysis", path: "/win-loss" },
      { icon: Filter, label: "Smart Views", path: "/smart-views" },
      { icon: Layers, label: "Bulk Actions", path: "/bulk-actions" },
      { icon: BarChart3, label: "Sales Forecasting", path: "/sales-forecasting" },
      { icon: Star, label: "Lead Scoring", path: "/lead-scoring" },
    ],
  },
  {
    label: "Resources",
    items: [
      { icon: BookOpen, label: "Help Center", path: "/help" },
      { icon: BookOpen, label: "CRM Bible", path: "/crm-bible" },
      { icon: Settings, label: "Settings", path: "/settings" },
      { icon: Download, label: "HubSpot Import", path: "/import/hubspot" },
      { icon: Paintbrush, label: "White Label", path: "/white-label" },
      { icon: ArrowRightLeft, label: "Migration", path: "/migration" },
      { icon: ArrowRightLeft, label: "Migration Wizard", path: "/migration/wizard" },
      { icon: Crown, label: "Subscription", path: "/subscription" },
      { icon: CreditCard, label: "Billing & Plans", path: "/billing" },
      { icon: Receipt, label: "Billing History", path: "/billing-history" },
      { icon: CreditCard, label: "Billing & Invoices", path: "/settings/billing" },
      { icon: Zap, label: "AI Credits", path: "/settings/ai-credits" },
      { icon: Mail, label: "Email Infrastructure", path: "/email-setup" },
      { icon: Tag, label: "Business Type", path: "/settings/business-type" },
    ],
  },
  {
    label: "Finance",
    items: [
      { icon: TrendingUp, label: "Accounts Receivable", path: "/accounts-receivable" },
      { icon: TrendingDown, label: "Accounts Payable", path: "/accounts-payable" },
      { icon: Package, label: "Shipping & Receiving", path: "/shipping-receiving" },
    ],
  },
];

const axiomPlatformSection = {
  label: "AXIOM Platform",
  items: [
    { icon: Crown, label: "Platform Dashboard", path: "/axiom" },
    { icon: Zap, label: "AI Credits", path: "/axiom/ai-credits" },
    { icon: DollarSign, label: "Payment Management", path: "/axiom/payments" },
  ],
};

const developerSection = {
  label: "Developer",
  items: [
    { icon: Building2, label: "Companies", path: "/dev/companies" },
    { icon: UserCog, label: "All Users", path: "/dev/users" },
    { icon: Activity, label: "System Health", path: "/dev/health" },
    { icon: ShieldCheck, label: "Self-Healing Engine", path: "/system-health" },
    { icon: Brain, label: "AI Engine Panel", path: "/ai-engine" },
    { icon: ScrollText, label: "Activity Log", path: "/dev/activity" },
    { icon: Eye, label: "Impersonate", path: "/dev/impersonate" },
    { icon: FileSearch, label: "FMCSA Scanner", path: "/fmcsa-scanner" },
    { icon: Key, label: "API Keys", path: "/api-keys" },
    { icon: Webhook, label: "Webhooks", path: "/webhooks" },
  ],
};

const DEV_MODE_KEY = "axiom-dev-mode";
const TAP_TARGET = 11;
const TAP_TIMEOUT = 4000;

function useDevMode() {
  const [devMode, setDevMode] = useState(() => {
    return sessionStorage.getItem(DEV_MODE_KEY) === "true";
  });
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = useCallback(() => {
    if (devMode) return;
    tapCountRef.current += 1;
    const remaining = TAP_TARGET - tapCountRef.current;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (remaining <= 0) {
      tapCountRef.current = 0;
      sessionStorage.setItem(DEV_MODE_KEY, "true");
      setDevMode(true);
      toast.success("Developer options unlocked", {
        description: "Developer tools are now visible in the sidebar. This will reset when you close the browser.",
        duration: 5000,
      });
    } else if (remaining <= 5) {
      toast.info(`${remaining} tap${remaining === 1 ? "" : "s"} to unlock developer options`, {
        duration: 1500,
        id: "dev-tap-countdown",
      });
      tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, TAP_TIMEOUT);
    } else {
      tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, TAP_TIMEOUT);
    }
  }, [devMode]);

  const disableDevMode = useCallback(() => {
    sessionStorage.removeItem(DEV_MODE_KEY);
    setDevMode(false);
    toast.info("Developer options hidden", { description: "Tap the logo 11 times to re-enable.", duration: 3000 });
  }, []);

  return { devMode, handleLogoTap, disableDevMode };
}

function getMenuSections(devMode: boolean, userRole?: string) {
  const sections = [...standardSections];

  // Add AXIOM Platform section for axiom_owner and developer roles
  if (userRole === "axiom_owner" || userRole === "developer") {
    const overviewIdx = sections.findIndex(s => s.label === "Overview");
    if (overviewIdx >= 0) {
      sections.splice(overviewIdx + 1, 0, axiomPlatformSection);
    } else {
      sections.unshift(axiomPlatformSection);
    }
  }

  // Add Developer section for developer role (when dev mode is active)
  if (devMode && userRole === "developer") {
    const resIdx = sections.findIndex(s => s.label === "Resources");
    if (resIdx >= 0) {
      sections.splice(resIdx, 0, developerSection);
    } else {
      sections.push(developerSection);
    }
  }

  return sections;
}

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    // Redirect unauthenticated users to the marketing homepage
    window.location.replace("/");
    return <DashboardLayoutSkeleton />;
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { devMode, handleLogoTap, disableDevMode } = useDevMode();
  const { canAccessSidebarItem, isAdmin, isAxiomOwner, isDeveloper } = useFeatureAccess();
  const [aiOpen, setAiOpen] = useState(false);
  const { data: myCompany } = trpc.tenants.myCompany.useQuery(undefined, { enabled: !!user });
  // White-label: only Company Admin and above see "powered by AXIOM"
  const showAxiomBranding = isDeveloper || isAxiomOwner || isAdmin;

  // ─── Skin system ───
  const { skin, skinId, graduateToAxiom, migratedFrom } = useSkin();
  const isCompetitorSkin = skinId !== "axiom";

  // Build nav sections: competitor skin overrides standard sections
  let displaySections: Array<{ label: string; items: Array<{ icon: LucideIcon; label: string; path: string }> }>;

  if (isCompetitorSkin) {
    // Competitor skin: show their exact nav items as a single section
    const skinNavItems = skin.navItems.map(item => ({
      icon: resolveIcon(item.icon),
      label: item.label,
      path: item.path,
    }));
    displaySections = [
      {
        label: skin.name,
        items: skinNavItems,
      },
      // Always include Resources section for settings/billing access
      {
        label: "Resources",
        items: [
          { icon: ArrowRightLeft, label: "Migration", path: "/migration" },
          { icon: Settings, label: "Settings", path: "/settings" },
          { icon: Crown, label: "Subscription", path: "/subscription" },
        ],
      },
    ];
    // Add developer section if needed
    if (devMode && user?.systemRole === "developer") {
      displaySections.push(developerSection);
    }
  } else {
    const menuSections = getMenuSections(devMode, user?.systemRole);
    displaySections = menuSections;
  }

  const filteredSections = displaySections.map(section => ({
    ...section,
    items: section.items.filter(item => canAccessSidebarItem(item.path)),
  })).filter(section => section.items.length > 0);

  const allMenuItems = filteredSections.flatMap(s => s.items);
  const activeMenuItem = allMenuItems.find(item => item.path === location) || allMenuItems.find(item => location.startsWith(item.path) && item.path !== "/");

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-border/40" disableTransition={isResizing}>
          {/* ─── Sidebar Header ─── */}
          <SidebarHeader className="h-16 justify-center border-b border-border/40 px-3">
            <div className="flex items-center gap-2.5 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-9 w-9 flex items-center justify-center hover:bg-accent rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4.5 w-4.5 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none"
                  onClick={handleLogoTap}
                  title={devMode ? "Developer mode active" : undefined}
                >
                  {myCompany?.logoUrl ? (
                    <img
                      src={myCompany.logoUrl}
                      alt={myCompany.name}
                      className={`h-8 w-8 rounded-lg object-contain shrink-0 ${devMode ? "ring-2 ring-amber-400" : ""}`}
                    />
                  ) : (
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm"
                      style={devMode ? { background: "#fef3c7", color: "#f59e0b" } : { background: `${skin.primaryColor}1a`, color: skin.primaryColor }}
                    >
                      {devMode ? <Zap className="h-4.5 w-4.5" /> : (myCompany?.name?.charAt(0).toUpperCase() ?? <Zap className="h-4.5 w-4.5" />)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="font-bold tracking-tight text-foreground text-[15px] block truncate">
                      {myCompany?.name || "AXIOM CRM"}
                    </span>
                    {isCompetitorSkin ? (
                      <span className="text-[10px] text-muted-foreground/60 block -mt-0.5">powered by AXIOM</span>
                    ) : (
                      myCompany?.name && showAxiomBranding && <span className="text-[10px] text-muted-foreground/60 block -mt-0.5">powered by AXIOM</span>
                    )}
                  </div>
                  {devMode && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500/80 ml-0.5 bg-amber-50 px-1.5 py-0.5 rounded">DEV</span>
                  )}
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* ─── Global Search ─── */}
          {!isCollapsed && (
            <div className="px-3 pt-3 pb-1">
              <GlobalSearch />
            </div>
          )}

          {/* ─── Competitor skin banner ─── */}
          {isCompetitorSkin && !isCollapsed && (
            <div
              className="mx-3 mt-2 mb-1 px-3 py-2 rounded-lg border"
              style={{ background: `${skin.primaryColor}12`, borderColor: `${skin.primaryColor}33` }}
            >
              <p className="text-[11px] font-medium leading-tight" style={{ color: skin.primaryColor }}>
                {skin.tagline}
              </p>
            </div>
          )}

          {/* ─── Sidebar Navigation ─── */}
          <SidebarContent className="gap-0 py-3 px-2">
            {filteredSections.map((section, sectionIdx) => (
              <div key={section.label} className={sectionIdx > 0 ? "mt-4" : ""}>
                {!isCollapsed && (
                  <div className="px-3 mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                      section.label === "Developer" ? "text-amber-500/70" : "text-muted-foreground/60"
                    }`}>
                      {section.label}
                    </span>
                  </div>
                )}
                <SidebarMenu className="gap-0.5">
                  {section.items.map(item => {
                    const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className={`h-9 rounded-lg transition-all duration-200 font-normal text-[13px] ${
                            isActive
                              ? "font-medium shadow-sm"
                              : "hover:bg-accent/60 text-muted-foreground hover:text-foreground"
                          }`}
                          style={isActive ? { background: `${skin.primaryColor}14`, color: skin.primaryColor } : {}}
                        >
                          <item.icon className="h-4 w-4" style={isActive ? { color: skin.primaryColor } : {}} />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            ))}
          </SidebarContent>

          {/* ─── Sidebar Footer ─── */}
          <SidebarFooter className="p-3 border-t border-border/40">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-accent/60 transition-all duration-200 w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 shrink-0 shadow-sm">
                    <AvatarFallback className="text-xs font-semibold rounded-lg" style={{ background: `${skin.primaryColor}1a`, color: skin.primaryColor }}>
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-semibold truncate leading-none text-foreground">
                      {user?.name || "User"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-1">
                      {myCompany?.name || user?.email || ""}
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-border/50">
                {devMode && (
                  <>
                    <DropdownMenuItem
                      onClick={disableDevMode}
                      className="cursor-pointer text-amber-500 focus:text-amber-500 rounded-lg"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      <span>Hide Dev Options</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {isCompetitorSkin && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        graduateToAxiom();
                        toast.success("Welcome to native AXIOM CRM!", {
                          description: "You've graduated to the full AXIOM experience.",
                          duration: 4000,
                        });
                      }}
                      className="cursor-pointer rounded-lg"
                    >
                      <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                      <span className="text-sm">Graduate to AXIOM Native</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive rounded-lg"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* ─── Persistent Top Header Bar ─── */}
        <div className="flex border-b border-border/40 h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-xl" />}
            <button
              onClick={() => setLocation("/dashboard")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              title="Go to Dashboard"
            >
              {myCompany?.logoUrl ? (
                <img src={myCompany.logoUrl} alt={myCompany.name} className="h-7 w-7 rounded-lg object-contain" />
              ) : (
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${skin.primaryColor}1a` }}>
                  <Zap className="h-4 w-4" style={{ color: skin.primaryColor }} />
                </div>
              )}
              <span className="font-bold text-foreground text-sm tracking-tight">{myCompany?.name || "AXIOM CRM"}</span>
            </button>
            <span className="text-muted-foreground/40 text-sm">/</span>
            <span className="text-sm font-medium text-foreground">
              {activeMenuItem?.label ?? "Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {location !== "/" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="h-8 rounded-lg text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAiOpen(true)}
              className="h-8 rounded-lg text-xs gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 hover:from-amber-100 hover:to-orange-100 border border-amber-200/50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Assistant
            </Button>
          </div>
        </div>
        <PaymentFailedBanner />
        <main className="flex-1 p-5 lg:p-7">{children}</main>
      </SidebarInset>

      {/* AI Assistant floating button — bottom-right, just above Made with Manus tag */}
      {!aiOpen && (
        <button
          onClick={() => setAiOpen(true)}
          className="fixed bottom-16 right-5 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200/50 flex items-center justify-center hover:scale-105 hover:shadow-xl transition-all duration-200 group"
          title="Open AI Assistant"
        >
          <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
        </button>
      )}
      <AIAssistantPanel open={aiOpen} onClose={() => setAiOpen(false)} />
      <OnboardingTutorial />
    </>
  );
}
