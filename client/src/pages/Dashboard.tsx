import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Building2, Kanban, DollarSign, Mail, ListChecks,
  TrendingUp, Trophy, Target, Radar, Ghost, Shield,
  FileText, Workflow, LayoutGrid, AlertCircle, Truck,
  Package, Brain, Phone, ArrowRight, Sparkles,
} from "lucide-react";
import { Link } from "wouter";

/*
 * Enterprise CRM Color System:
 *   Blue   (crm-blue)   = Standard pipeline activity / normal workflow
 *   Green  (crm-green)  = Booked loads / closed-won / completed / success
 *   Amber  (crm-amber)  = Quote pending / follow-up due / needs attention
 *   Red    (crm-red)    = Credit hold / overdue / churn risk / critical
 *   Purple (crm-purple) = Insights / premium / AI-powered features
 *   Gray   (crm-gray)   = Inactive accounts / archived / disabled
 */

function StatCard({ title, value, icon: Icon, subtitle, gradient, iconBg, href }: {
  title: string;
  value: string | number;
  icon: any;
  subtitle?: string;
  gradient: string;
  iconBg: string;
  href?: string;
}) {
  const content = (
    <div className={`group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.03] hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">{title}</span>
          <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {/* Subtle gradient accent at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${gradient} opacity-60`} />
    </div>
  );
  if (href) return <Link href={href} className="block">{content}</Link>;
  return content;
}

function QuickAction({ label, href, icon: Icon, color }: { label: string; href: string; icon: any; color: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-card hover:bg-accent/40 transition-all duration-200 hover:shadow-sm"
    >
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color} transition-transform duration-200 group-hover:scale-105`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${val}`;
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8">
      {/* ─── Welcome Header ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-primary/10 p-7">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-foreground">
            {greeting()}, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">
            Here's what's happening across your CRM, operations, and marketplace today.
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/5" />
        <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-primary/3" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/40 bg-card p-5">
              <div className="animate-pulse space-y-3">
                <div className="h-3 w-20 bg-muted rounded-full" />
                <div className="h-8 w-16 bg-muted rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ─── CRM Core ─── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-[0.12em]">CRM Core</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Companies" value={stats?.totalCompanies ?? 0} icon={Building2} gradient="bg-gradient-to-r from-blue-500 to-blue-400" iconBg="bg-blue-50 text-blue-600" href="/companies" />
              <StatCard title="Contacts" value={stats?.totalContacts ?? 0} icon={Users} gradient="bg-gradient-to-r from-blue-500 to-blue-400" iconBg="bg-blue-50 text-blue-600" href="/contacts" />
              <StatCard title="Open Deals" value={stats?.openDeals ?? 0} icon={Kanban} subtitle={`${stats?.totalDeals ?? 0} total`} gradient="bg-gradient-to-r from-amber-500 to-amber-400" iconBg="bg-amber-50 text-amber-600" href="/deals" />
              <StatCard title="Pipeline Value" value={formatCurrency(stats?.totalValue ?? 0)} icon={DollarSign} gradient="bg-gradient-to-r from-emerald-500 to-emerald-400" iconBg="bg-emerald-50 text-emerald-600" href="/deals" />
            </div>
          </div>

          {/* ─── Performance ─── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-[0.12em]">Performance</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Won Deals" value={stats?.wonDeals ?? 0} icon={Trophy} subtitle={formatCurrency(stats?.wonValue ?? 0)} gradient="bg-gradient-to-r from-emerald-500 to-emerald-400" iconBg="bg-emerald-50 text-emerald-600" href="/deals" />
              <StatCard title="Lost Deals" value={stats?.lostDeals ?? 0} icon={TrendingUp} gradient="bg-gradient-to-r from-red-500 to-red-400" iconBg="bg-red-50 text-red-500" href="/deals" />
              <StatCard title="Pending Tasks" value={stats?.pendingTasks ?? 0} icon={ListChecks} subtitle={`${stats?.totalTasks ?? 0} total`} gradient="bg-gradient-to-r from-amber-500 to-amber-400" iconBg="bg-amber-50 text-amber-600" href="/tasks" />
              <StatCard title="Segments" value={(stats as any)?.totalSegments ?? 0} icon={LayoutGrid} gradient="bg-gradient-to-r from-blue-500 to-blue-400" iconBg="bg-blue-50 text-blue-600" href="/segments" />
            </div>
          </div>

          {/* ─── Email & Paradigm ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-[0.12em]">Email Operations</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StatCard title="Campaigns" value={stats?.totalCampaigns ?? 0} icon={Mail} gradient="bg-gradient-to-r from-blue-500 to-blue-400" iconBg="bg-blue-50 text-blue-600" href="/campaigns" />
                <StatCard title="Templates" value={(stats as any)?.totalTemplates ?? 0} icon={FileText} gradient="bg-gradient-to-r from-blue-500 to-blue-400" iconBg="bg-blue-50 text-blue-600" href="/templates" />
                <StatCard title="Workflows" value={(stats as any)?.totalWorkflows ?? 0} icon={Workflow} gradient="bg-gradient-to-r from-amber-500 to-amber-400" iconBg="bg-amber-50 text-amber-600" href="/workflows" />
                <StatCard title="Suppressed" value={(stats as any)?.suppressedEmails ?? 0} icon={Shield} gradient="bg-gradient-to-r from-red-500 to-red-400" iconBg="bg-red-50 text-red-500" href="/suppression" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-[0.12em]">Paradigm Engine</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StatCard title="Prospects" value={(stats as any)?.totalProspects ?? 0} icon={Target} gradient="bg-gradient-to-r from-blue-500 to-blue-400" iconBg="bg-blue-50 text-blue-600" href="/paradigm/prospects" />
                <StatCard title="Hot Leads" value={(stats as any)?.hotLeads ?? 0} icon={AlertCircle} gradient="bg-gradient-to-r from-red-500 to-red-400" iconBg="bg-red-50 text-red-500" href="/paradigm/prospects" />
                <StatCard title="Sequences" value={(stats as any)?.activeSequences ?? 0} icon={Ghost} gradient="bg-gradient-to-r from-purple-500 to-purple-400" iconBg="bg-purple-50 text-purple-600" href="/paradigm/sequences" />
                <StatCard title="Signals" value={(stats as any)?.newSignals ?? 0} icon={Radar} subtitle="Unreviewed" gradient="bg-gradient-to-r from-amber-500 to-amber-400" iconBg="bg-amber-50 text-amber-600" href="/paradigm/signals" />
              </div>
            </div>
          </div>

          {/* ─── Freight Operations ─── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-[0.12em]">Freight Operations</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Active Loads" value={0} icon={Truck} gradient="bg-gradient-to-r from-blue-500 to-blue-400" iconBg="bg-blue-50 text-blue-600" href="/loads" />
              <StatCard title="Marketplace" value={0} icon={Package} subtitle="Posted loads" gradient="bg-gradient-to-r from-emerald-500 to-emerald-400" iconBg="bg-emerald-50 text-emerald-600" href="/freight-marketplace" />
              <StatCard title="Autopilot" value="Active" icon={Brain} gradient="bg-gradient-to-r from-purple-500 to-purple-400" iconBg="bg-purple-50 text-purple-600" href="/apex-autopilot" />
              <StatCard title="Voice Agent" value={0} icon={Phone} subtitle="Campaigns" gradient="bg-gradient-to-r from-purple-500 to-purple-400" iconBg="bg-purple-50 text-purple-600" href="/voice-agent" />
            </div>
          </div>
        </>
      )}

      {/* ─── Quick Actions & System Status ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <QuickAction label="Add Company" href="/companies" icon={Building2} color="bg-blue-50 text-blue-600" />
            <QuickAction label="Create Deal" href="/deals" icon={Kanban} color="bg-amber-50 text-amber-600" />
            <QuickAction label="New Campaign" href="/campaigns" icon={Mail} color="bg-blue-50 text-blue-600" />
            <QuickAction label="Add Task" href="/tasks" icon={ListChecks} color="bg-amber-50 text-amber-600" />
            <QuickAction label="Post Load" href="/freight-marketplace" icon={Truck} color="bg-emerald-50 text-emerald-600" />
            <QuickAction label="Signal Feed" href="/paradigm/signals" icon={Radar} color="bg-purple-50 text-purple-600" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { module: "CRM Core", status: "active", desc: "Companies, Contacts, Deals, Tasks" },
              { module: "Email Pipeline", status: "active", desc: "Campaigns, Templates, SMTP, Compliance" },
              { module: "Paradigm Engine", status: "active", desc: "Prospects, Signals, Sequences, Battle Cards" },
              { module: "Freight Marketplace", status: "active", desc: "Load Posting, Carrier Match, Tracking, Payment" },
              { module: "Apex Autopilot", status: "active", desc: "Consolidation, Lane Prediction, Optimization" },
            ].map((item) => (
              <div key={item.module} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/30 transition-colors">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground">{item.module}</span>
                  <span className="text-xs text-muted-foreground ml-2">{item.desc}</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200 shrink-0">
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
