import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Building2, Kanban, DollarSign, Mail, ListChecks,
  TrendingUp, Trophy, Target, Radar, Ghost, Shield,
  FileText, Workflow, LayoutGrid, AlertCircle,
} from "lucide-react";
import { Link } from "wouter";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";

function StatCard({ title, value, icon: Icon, subtitle, color, href }: { title: string; value: string | number; icon: any; subtitle?: string; color: string; href?: string }) {
  const content = (
    <Card className="bg-card border-border hover:border-primary/30 transition-colors group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
            <span className="text-2xl font-bold text-foreground">{value}</span>
            {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  if (href) return <Link href={href} className="block">{content}</Link>;
  return content;
}

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${val}`;
  };

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.dashboard} />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">Unified overview across CRM, Paradigm Engine, and Email Operations.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-3 w-20 bg-muted rounded" />
                  <div className="h-7 w-16 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* CRM Core */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">CRM Core</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Contacts" value={stats?.totalContacts ?? 0} icon={Users} color="bg-primary/10 text-primary" href="/contacts" />
              <StatCard title="Companies" value={stats?.totalCompanies ?? 0} icon={Building2} color="bg-chart-2/10 text-chart-2" href="/companies" />
              <StatCard title="Open Deals" value={stats?.openDeals ?? 0} icon={Kanban} subtitle={`${stats?.totalDeals ?? 0} total`} color="bg-chart-3/10 text-chart-3" href="/deals" />
              <StatCard title="Pipeline Value" value={formatCurrency(stats?.totalValue ?? 0)} icon={DollarSign} color="bg-chart-5/10 text-chart-5" href="/deals" />
              <StatCard title="Won Deals" value={stats?.wonDeals ?? 0} icon={Trophy} subtitle={formatCurrency(stats?.wonValue ?? 0)} color="bg-success/10 text-success" href="/deals" />
              <StatCard title="Lost Deals" value={stats?.lostDeals ?? 0} icon={TrendingUp} color="bg-destructive/10 text-destructive" href="/deals" />
              <StatCard title="Pending Tasks" value={stats?.pendingTasks ?? 0} icon={ListChecks} subtitle={`${stats?.totalTasks ?? 0} total`} color="bg-warning/10 text-warning" href="/tasks" />
              <StatCard title="Segments" value={(stats as any)?.totalSegments ?? 0} icon={LayoutGrid} color="bg-violet-500/10 text-violet-400" href="/segments" />
            </div>
          </div>

          {/* Email Operations */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Email Operations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Campaigns" value={stats?.totalCampaigns ?? 0} icon={Mail} color="bg-chart-1/10 text-chart-1" href="/campaigns" />
              <StatCard title="Templates" value={(stats as any)?.totalTemplates ?? 0} icon={FileText} color="bg-cyan-500/10 text-cyan-400" href="/email-templates" />
              <StatCard title="Workflows" value={(stats as any)?.totalWorkflows ?? 0} icon={Workflow} color="bg-amber-500/10 text-amber-400" href="/workflows" />
              <StatCard title="Suppressed" value={(stats as any)?.suppressedEmails ?? 0} icon={Shield} subtitle="Blocked addresses" color="bg-red-500/10 text-red-400" href="/suppression" />
            </div>
          </div>

          {/* Paradigm Engine */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Paradigm Engine</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Prospects" value={(stats as any)?.totalProspects ?? 0} icon={Target} color="bg-indigo-500/10 text-indigo-400" href="/paradigm/prospects" />
              <StatCard title="Hot Leads" value={(stats as any)?.hotLeads ?? 0} icon={AlertCircle} color="bg-red-500/10 text-red-400" href="/paradigm/prospects" />
              <StatCard title="Active Sequences" value={(stats as any)?.activeSequences ?? 0} icon={Ghost} color="bg-violet-500/10 text-violet-400" href="/paradigm/sequences" />
              <StatCard title="New Signals" value={(stats as any)?.newSignals ?? 0} icon={Radar} subtitle="Unreviewed" color="bg-amber-500/10 text-amber-400" href="/paradigm/signals" />
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: "Add Contact", href: "/contacts", icon: Users },
              { label: "Create Deal", href: "/deals", icon: Kanban },
              { label: "New Campaign", href: "/campaigns", icon: Mail },
              { label: "Add Task", href: "/tasks", icon: ListChecks },
              { label: "Prospect Pipeline", href: "/paradigm/prospects", icon: Target },
              { label: "Signal Feed", href: "/paradigm/signals", icon: Radar },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors"
              >
                <action.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{action.label}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">System Integration Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { module: "CRM Core", status: "active", desc: "Contacts, Companies, Deals, Tasks" },
              { module: "Email Pipeline", status: "active", desc: "Campaigns → Templates → Segments → SMTP → Compliance" },
              { module: "Paradigm Engine", status: "active", desc: "Prospects → Signals → Sequences → Battle Cards → Quantum Score" },
              { module: "Cross-Feature Links", status: "active", desc: "Contact↔Company↔Deal↔Task bidirectional queries" },
              { module: "Compliance Engine", status: "active", desc: "CAN-SPAM, Suppression, Domain Health" },
            ].map((item) => (
              <div key={item.module} className="flex items-center gap-3">
                <Badge variant="outline" className="text-[10px] bg-green-500/15 text-green-400 border-green-500/30 shrink-0">
                  {item.status}
                </Badge>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-foreground">{item.module}</span>
                  <span className="text-xs text-muted-foreground ml-2">{item.desc}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
