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
  EyeIcon, MailOpen, Paintbrush, ArrowRightLeft, Crown, Command, Package,
} from "lucide-react";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

// ─── Menu Sections (Developer is separate, hidden by default) ───

const standardSections = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
      { icon: Users, label: "Team", path: "/team" },
    ],
  },
  {
    label: "CRM",
    items: [
      { icon: Building2, label: "Companies", path: "/companies" },
      { icon: Users, label: "Contacts", path: "/contacts" },
      { icon: Kanban, label: "Deals", path: "/deals" },
      { icon: ListChecks, label: "Tasks", path: "/tasks" },
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
      { icon: Brain, label: "Apex Autopilot", path: "/apex-autopilot" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { icon: BarChart3, label: "Reports", path: "/analytics" },
    ],
  },
  {
    label: "Resources",
    items: [
      { icon: BookOpen, label: "Help Center", path: "/help" },
      { icon: Settings, label: "Settings", path: "/settings" },
      { icon: Download, label: "HubSpot Import", path: "/import/hubspot" },
      { icon: Paintbrush, label: "White Label", path: "/white-label" },
      { icon: ArrowRightLeft, label: "Migration", path: "/migration" },
      { icon: Crown, label: "Subscription", path: "/subscription" },
    ],
  },
];

const developerSection = {
  label: "Developer",
  items: [
    { icon: Building2, label: "Companies", path: "/dev/companies" },
    { icon: UserCog, label: "All Users", path: "/dev/users" },
    { icon: Activity, label: "System Health", path: "/dev/health" },
    { icon: ScrollText, label: "Activity Log", path: "/dev/activity" },
    { icon: Eye, label: "Impersonate", path: "/dev/impersonate" },
    { icon: FileSearch, label: "FMCSA Scanner", path: "/fmcsa-scanner" },
    { icon: Key, label: "API Keys", path: "/api-keys" },
    { icon: Webhook, label: "Webhooks", path: "/webhooks" },
  ],
};

const DEV_MODE_KEY = "apex-dev-mode";
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

function getMenuSections(devMode: boolean) {
  if (devMode) {
    const sections = [...standardSections];
    const resourcesIdx = sections.findIndex(s => s.label === "Resources");
    if (resourcesIdx >= 0) {
      sections.splice(resourcesIdx, 0, developerSection);
    } else {
      sections.push(developerSection);
    }
    return sections;
  }
  return standardSections;
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          {/* Premium login card */}
          <div className="w-full rounded-2xl bg-card p-10 shadow-lg border border-border/50 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">Apex CRM</span>
            </div>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed">
              The most powerful freight broker CRM. Manage companies, contacts, deals, and operations in one place.
            </p>
            <Button
              onClick={() => { window.location.href = getLoginUrl(); }}
              size="lg"
              className="w-full rounded-xl h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Sign in to continue
            </Button>
          </div>
        </div>
      </div>
    );
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
  const { canAccessSidebarItem } = useFeatureAccess();

  const menuSections = getMenuSections(devMode);
  const filteredSections = menuSections.map(section => ({
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
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${devMode ? "bg-amber-100" : "bg-primary/10"}`}>
                    <Zap className={`h-4.5 w-4.5 transition-colors ${devMode ? "text-amber-500" : "text-primary"}`} />
                  </div>
                  <span className="font-bold tracking-tight text-foreground text-[15px]">Apex CRM</span>
                  {devMode && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500/80 ml-0.5 bg-amber-50 px-1.5 py-0.5 rounded">DEV</span>
                  )}
                </div>
              )}
            </div>
          </SidebarHeader>

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
                              ? "bg-primary/8 text-primary font-medium shadow-sm"
                              : "hover:bg-accent/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
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
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary rounded-lg">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-semibold truncate leading-none text-foreground">
                      {user?.name || "User"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-1">
                      {user?.email || ""}
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border-border/50">
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
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b border-border/40 h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-xl" />
              <span className="font-semibold text-foreground text-sm">
                {activeMenuItem?.label ?? "Apex CRM"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 p-5 lg:p-7">{children}</main>
      </SidebarInset>
    </>
  );
}
