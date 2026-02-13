import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Kanban, DollarSign, Mail, ListChecks, TrendingUp, Trophy } from "lucide-react";

function StatCard({ title, value, icon: Icon, subtitle, color }: { title: string; value: string | number; icon: any; subtitle?: string; color: string }) {
  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-colors">
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your CRM performance and key metrics.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Contacts" value={stats?.totalContacts ?? 0} icon={Users} color="bg-primary/10 text-primary" />
          <StatCard title="Companies" value={stats?.totalCompanies ?? 0} icon={Building2} color="bg-chart-2/10 text-chart-2" />
          <StatCard title="Open Deals" value={stats?.openDeals ?? 0} icon={Kanban} subtitle={`${stats?.totalDeals ?? 0} total`} color="bg-chart-3/10 text-chart-3" />
          <StatCard title="Pipeline Value" value={formatCurrency(stats?.totalValue ?? 0)} icon={DollarSign} color="bg-chart-5/10 text-chart-5" />
          <StatCard title="Won Deals" value={stats?.wonDeals ?? 0} icon={Trophy} subtitle={formatCurrency(stats?.wonValue ?? 0)} color="bg-success/10 text-success" />
          <StatCard title="Lost Deals" value={stats?.lostDeals ?? 0} icon={TrendingUp} color="bg-destructive/10 text-destructive" />
          <StatCard title="Campaigns" value={stats?.totalCampaigns ?? 0} icon={Mail} color="bg-chart-1/10 text-chart-1" />
          <StatCard title="Pending Tasks" value={stats?.pendingTasks ?? 0} icon={ListChecks} subtitle={`${stats?.totalTasks ?? 0} total`} color="bg-warning/10 text-warning" />
        </div>
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
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors"
              >
                <action.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{action.label}</span>
              </a>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { step: "1", text: "Import or add your contacts and companies" },
              { step: "2", text: "Set up your deal pipeline with custom stages" },
              { step: "3", text: "Configure email authentication (SPF/DKIM/DMARC)" },
              { step: "4", text: "Create your first email campaign" },
              { step: "5", text: "Build automation workflows for lead nurturing" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{item.step}</span>
                </div>
                <span className="text-sm text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
