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
      { icon: Users, label: "Contacts", path: "/contacts" },
      { icon: Building2, label: "Companies", path: "/companies" },
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
const TAP_TIMEOUT = 4000; // 4 seconds to complete all 11 taps

function useDevMode() {
  const [devMode, setDevMode] = useState(() => {
    return sessionStorage.getItem(DEV_MODE_KEY) === "true";
  });
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = useCallback(() => {
    if (devMode) return; // Already unlocked

    tapCountRef.current += 1;
    const remaining = TAP_TARGET - tapCountRef.current;

    // Clear previous timer
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    if (remaining <= 0) {
      // Unlocked!
      tapCountRef.current = 0;
      sessionStorage.setItem(DEV_MODE_KEY, "true");
      setDevMode(true);
      toast.success("Developer options unlocked", {
        description: "Developer tools are now visible in the sidebar. This will reset when you close the browser.",
        duration: 5000,
      });
    } else if (remaining <= 5) {
      // Show countdown for the last 5 taps
      toast.info(`${remaining} tap${remaining === 1 ? "" : "s"} to unlock developer options`, {
        duration: 1500,
        id: "dev-tap-countdown",
      });
      // Reset after timeout
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, TAP_TIMEOUT);
    } else {
      // Silent taps for the first 6, just reset timer
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, TAP_TIMEOUT);
    }
  }, [devMode]);

  const disableDevMode = useCallback(() => {
    sessionStorage.removeItem(DEV_MODE_KEY);
    setDevMode(false);
    toast.info("Developer options hidden", {
      description: "Tap the logo 11 times to re-enable.",
      duration: 3000,
    });
  }, []);

  return { devMode, handleLogoTap, disableDevMode };
}

// Build menu sections dynamically based on dev mode
function getMenuSections(devMode: boolean) {
  if (devMode) {
    // Insert developer section before Resources (last section)
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
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Zap className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold tracking-tight text-foreground">Apex CRM</span>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Enterprise-grade customer relationship management with advanced email deliverability.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in to continue
          </Button>
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
  // Filter sidebar items based on feature access
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
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-14 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-2.5 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div
                  className="flex items-center gap-2 min-w-0 cursor-pointer select-none"
                  onClick={handleLogoTap}
                  title={devMode ? "Developer mode active" : undefined}
                >
                  <Zap className={`h-5 w-5 shrink-0 transition-colors ${devMode ? "text-amber-400" : "text-primary"}`} />
                  <span className="font-semibold tracking-tight text-foreground truncate">Apex CRM</span>
                  {devMode && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400/80 ml-0.5">DEV</span>
                  )}
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            {filteredSections.map((section) => (
              <div key={section.label} className="mb-1">
                {!isCollapsed && (
                  <div className="px-4 py-1.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      section.label === "Developer" ? "text-amber-400/70" : "text-muted-foreground/70"
                    }`}>
                      {section.label}
                    </span>
                  </div>
                )}
                <SidebarMenu className="px-2 gap-0.5">
                  {section.items.map(item => {
                    const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className="h-9 transition-all font-normal text-[13px]"
                        >
                          <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={isActive ? "text-foreground font-medium" : ""}>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            ))}
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-sidebar-accent transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 border border-border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-foreground">
                      {user?.name || "User"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-1">
                      {user?.email || ""}
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {devMode && (
                  <>
                    <DropdownMenuItem
                      onClick={disableDevMode}
                      className="cursor-pointer text-amber-400 focus:text-amber-400"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      <span>Hide Dev Options</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
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
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <span className="font-medium text-foreground text-sm">
                {activeMenuItem?.label ?? "Apex CRM"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
