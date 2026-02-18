import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, Mail, Users, DollarSign, Target, AlertTriangle, Ghost, Zap, Shield, Inbox } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";


const CHART_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

export default function Analytics() {
  // Core CRM stats
  const { data: stats } = trpc.dashboard.stats.useQuery();
  // Paradigm Engine stats
  const { data: paradigmStats } = trpc.paradigm.stats.useQuery();
  // Email deliverability
  const { data: domainHealth } = trpc.domainHealth.list.useQuery();
  // Campaigns
  const { data: campaigns } = trpc.campaigns.list.useQuery({ limit: 100 });
  // Ghost sequences
  const { data: sequences } = trpc.ghostSequences.list.useQuery();
  // Suppression list
  const { data: suppressionList } = trpc.suppression.list.useQuery();

  // Core metrics
  const totalContacts = stats?.totalContacts ?? 0;
  const totalCompanies = stats?.totalCompanies ?? 0;
  const totalDeals = stats?.totalDeals ?? 0;
  const totalRevenue = stats?.totalValue ?? 0;
  const totalCampaigns = stats?.totalCampaigns ?? 0;
  const openDeals = stats?.openDeals ?? 0;
  const wonDeals = stats?.wonDeals ?? 0;
  const lostDeals = stats?.lostDeals ?? 0;
  const winRate = (wonDeals + lostDeals) > 0 ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100) : 0;

  // Paradigm metrics
  const totalProspects = paradigmStats?.total ?? 0;
  const hotLeads = paradigmStats?.hotLeads ?? 0;
  const convertedProspects = paradigmStats?.converted ?? 0;
  const avgIntentScore = paradigmStats?.avgIntentScore ?? 0;

  // Sequence metrics
  const totalSequences = sequences?.length ?? 0;
  const activeSequences = sequences?.filter((s: any) => s.status === "active").length ?? 0;

  // Suppression metrics
  const suppressedCount = suppressionList?.items?.length ?? suppressionList?.total ?? 0;

  // Pipeline funnel data from real stats
  const funnelData = [
    { stage: "Contacts", count: totalContacts, fill: "#6366f1" },
    { stage: "Prospects", count: totalProspects, fill: "#8b5cf6" },
    { stage: "Hot Leads", count: hotLeads, fill: "#d946ef" },
    { stage: "Open Deals", count: openDeals, fill: "#f59e0b" },
    { stage: "Won Deals", count: wonDeals, fill: "#22c55e" },
  ];

  // Deal status breakdown
  const dealStatusData = [
    { name: "Open", value: openDeals, fill: "#6366f1" },
    { name: "Won", value: wonDeals, fill: "#22c55e" },
    { name: "Lost", value: lostDeals, fill: "#ef4444" },
  ].filter(d => d.value > 0);

  // Prospect engagement stages from paradigm stats
  const prospectStages = [
    { name: "New", value: totalProspects - hotLeads - convertedProspects, fill: "#6366f1" },
    { name: "Hot Lead", value: hotLeads, fill: "#d946ef" },
    { name: "Converted", value: convertedProspects, fill: "#22c55e" },
  ].filter(d => d.value > 0);

  // Domain health data
  const domainData = domainHealth?.map((d: any) => ({
    domain: d.domain,
    score: d.reputationScore ?? 0,
    fill: (d.reputationScore ?? 0) >= 80 ? "#22c55e" : (d.reputationScore ?? 0) >= 50 ? "#f59e0b" : "#ef4444",
  })) ?? [];

  // Campaign status breakdown
  const campaignItems: any[] = Array.isArray(campaigns) ? campaigns : (campaigns as any)?.items ?? [];
  const campaignStatusData = [
    { name: "Draft", value: campaignItems.filter((c: any) => c.status === "draft").length, fill: "#6366f1" },
    { name: "Sending", value: campaignItems.filter((c: any) => c.status === "sending").length, fill: "#f59e0b" },
    { name: "Sent", value: campaignItems.filter((c: any) => c.status === "sent").length, fill: "#22c55e" },
    { name: "Scheduled", value: campaignItems.filter((c: any) => c.status === "scheduled").length, fill: "#8b5cf6" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.analytics} />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics & Reporting</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Comprehensive insights across your entire CRM — contacts, deals, campaigns, and Paradigm Engine.</p>
      </div>

      {/* KPI Cards Row 1: Core CRM */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Contacts" value={totalContacts.toLocaleString()} icon={Users} subtitle={`${totalCompanies} companies`} />
        <KpiCard title="Pipeline Value" value={`$${(totalRevenue / 1000).toFixed(0)}K`} icon={DollarSign} subtitle={`${openDeals} open deals`} />
        <KpiCard title="Win Rate" value={`${winRate}%`} icon={Target} subtitle={`${wonDeals}W / ${lostDeals}L`} />
        <KpiCard title="Campaigns" value={totalCampaigns.toString()} icon={Mail} subtitle={`${campaignStatusData.find(d => d.name === "Sent")?.value ?? 0} sent`} />
      </div>

      {/* KPI Cards Row 2: Paradigm Engine */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Prospects" value={totalProspects.toLocaleString()} icon={Zap} subtitle={`${hotLeads} hot leads`} color="violet" />
        <KpiCard title="Avg Intent Score" value={avgIntentScore.toFixed(0)} icon={Target} subtitle={`${convertedProspects} converted`} color="violet" />
        <KpiCard title="Ghost Sequences" value={totalSequences.toString()} icon={Ghost} subtitle={`${activeSequences} active`} color="violet" />
        <KpiCard title="Suppressed" value={suppressedCount.toString()} icon={Shield} subtitle="blocked emails" color="amber" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-chart-1" /> Sales Pipeline Funnel
            </CardTitle>
            <p className="text-xs text-muted-foreground">From contacts through to won deals — real data across all modules</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="stage" type="category" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-violet-400" /> Prospect Engagement
            </CardTitle>
            <p className="text-xs text-muted-foreground">Paradigm Engine prospect distribution by stage</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {prospectStages.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={prospectStages} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {prospectStages.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No prospect data yet — run AI Prospecting from the Paradigm Engine</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Deal Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {dealStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dealStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {dealStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No deal data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4 text-chart-5" /> Campaign Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {campaignStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {campaignStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No campaigns yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-chart-3" /> Domain Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {domainData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={domainData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="domain" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {domainData.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Add domains in Deliverability settings</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cross-Module Summary */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Inbox className="h-4 w-4 text-primary" /> Cross-Module Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <MetricCard label="Contacts" value={totalContacts.toString()} color="indigo" />
            <MetricCard label="Companies" value={totalCompanies.toString()} color="blue" />
            <MetricCard label="Deals" value={totalDeals.toString()} color="emerald" />
            <MetricCard label="Prospects" value={totalProspects.toString()} color="violet" />
            <MetricCard label="Campaigns" value={totalCampaigns.toString()} color="purple" />
            <MetricCard label="Sequences" value={totalSequences.toString()} color="pink" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, subtitle, color = "primary" }: { title: string; value: string; icon: any; subtitle: string; color?: string }) {
  const bgClass = color === "violet" ? "bg-violet-500/10" : color === "amber" ? "bg-amber-500/10" : "bg-primary/10";
  const iconClass = color === "violet" ? "text-violet-400" : color === "amber" ? "text-amber-400" : "text-primary";
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg ${bgClass} flex items-center justify-center shrink-0`}>
            <Icon className={`h-4.5 w-4.5 ${iconClass}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-[10px] text-muted-foreground/70">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-400", blue: "text-blue-400", emerald: "text-emerald-400",
    violet: "text-violet-400", purple: "text-purple-400", pink: "text-pink-400",
  };
  return (
    <div className="p-3 rounded-lg bg-secondary/20 text-center">
      <p className={`text-xl font-bold ${colorMap[color] ?? "text-primary"}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
