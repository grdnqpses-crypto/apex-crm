import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain, Radar, Ghost, Shield, Zap, TrendingUp, Users, Mail,
  Eye, MessageSquare, ArrowRight, Flame, Target,
  Activity, CheckCircle2, Clock,
} from "lucide-react";
import { useLocation } from "wouter";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";
import { useSkin } from "@/contexts/SkinContext";


const stageConfig: Record<string, { color: string; bg: string }> = {
  discovered: { color: "text-zinc-400", bg: "bg-zinc-600" },
  verified: { color: "text-blue-400", bg: "bg-blue-600" },
  profiled: { color: "text-violet-400", bg: "bg-violet-600" },
  sequenced: { color: "text-amber-400", bg: "bg-amber-600" },
  engaged: { color: "text-cyan-400", bg: "bg-cyan-600" },
  replied: { color: "text-green-400", bg: "bg-green-600" },
  hot_lead: { color: "text-red-400", bg: "bg-red-600" },
  converted: { color: "text-emerald-400", bg: "bg-emerald-600" },
};

export default function ParadigmPulse() {
  const { t } = useSkin();
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = trpc.paradigm.stats.useQuery();
  const { data: hotLeads } = trpc.paradigm.hotLeads.useQuery();
  const { data: activity } = trpc.paradigm.recentActivity.useQuery({ limit: 15 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Brain className="h-8 w-8 animate-pulse text-primary" />
          <span className="text-sm text-muted-foreground">Loading Paradigm Engine...</span>
        </div>
      </div>
    );
  }

  const s = stats ?? {
    total: 0, discovered: 0, verified: 0, profiled: 0, sequenced: 0,
    engaged: 0, replied: 0, hotLeads: 0, converted: 0, disqualified: 0,
    avgIntentScore: 0, totalSent: 0, totalOpened: 0, totalReplied: 0,
    totalBounced: 0, openRate: 0, replyRate: 0, bounceRate: 0,
    newSignals: 0, activeSequences: 0, unreadBattleCards: 0,
  };

  const funnelStages = [
    { key: "discovered", label: "Discovered", count: s.discovered, icon: Radar },
    { key: "verified", label: "Verified", count: s.verified, icon: Shield },
    { key: "profiled", label: "Profiled", count: s.profiled, icon: Brain },
    { key: "sequenced", label: "Sequenced", count: s.sequenced, icon: Ghost },
    { key: "engaged", label: "Engaged", count: s.engaged, icon: Mail },
    { key: "replied", label: "Replied", count: s.replied, icon: MessageSquare },
    { key: "hot_lead", label: "Hot Leads", count: s.hotLeads, icon: Flame },
    { key: "converted", label: "Converted", count: s.converted, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.paradigmPulse} />
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            Paradigm Engine
          </h1>
          <p className="text-muted-foreground mt-1">AI-powered BNB prospecting &amp; sales intelligence</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/paradigm/signals")}>
            <Radar className="h-4 w-4 mr-2" />
            Signals
            {s.newSignals > 0 && <Badge variant="destructive" className="ml-2 text-xs">{s.newSignals}</Badge>}
          </Button>
          <Button onClick={() => navigate("/paradigm/prospects")}>
            <Target className="h-4 w-4 mr-2" />
            Prospect Pipeline
          </Button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Prospects", value: s.total, icon: Users, accent: "text-primary" },
          { label: "Emails Sent", value: s.totalSent, icon: Mail, accent: "text-blue-400" },
          { label: "Open Rate", value: `${s.openRate}%`, icon: Eye, accent: "text-cyan-400" },
          { label: "Reply Rate", value: `${s.replyRate}%`, icon: MessageSquare, accent: "text-green-400" },
          { label: "Hot Leads", value: s.hotLeads, icon: Flame, accent: "text-red-400" },
          { label: "Avg Intent", value: Math.round(s.avgIntentScore), icon: TrendingUp, accent: "text-amber-400" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <kpi.icon className={`h-3.5 w-3.5 ${kpi.accent}`} /> {kpi.label}
              </div>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prospect Funnel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" /> Prospect Funnel
          </CardTitle>
          <CardDescription>Engagement pipeline from discovery to conversion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {funnelStages.map((stage) => {
              const maxCount = Math.max(...funnelStages.map(fs => fs.count), 1);
              const height = Math.max((stage.count / maxCount) * 100, 4);
              const cfg = stageConfig[stage.key] ?? { color: "text-primary", bg: "bg-primary" };
              return (
                <div key={stage.key} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold">{stage.count}</span>
                  <div
                    className={`w-full rounded-t ${cfg.bg} transition-all`}
                    style={{ height: `${height}%`, minHeight: "4px" }}
                  />
                  <div className="flex flex-col items-center gap-0.5 mt-1">
                    <stage.icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">{stage.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Hot Leads */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="h-4 w-4 text-red-400" /> Hot Leads
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/paradigm/prospects?stage=hot_lead")}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {(!hotLeads || hotLeads.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Target className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No hot leads yet</p>
                  <p className="text-xs">Prospects with high intent scores will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {hotLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => navigate(`/paradigm/prospects/${lead.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
                          <Flame className="h-4 w-4 text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{lead.firstName} {lead.lastName}</p>
                          <p className="text-xs text-muted-foreground">{lead.jobTitle} @ {lead.companyName}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">Intent: {lead.intentScore}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" /> Activity Feed
              </CardTitle>
              {s.unreadBattleCards > 0 && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/paradigm/battle-cards")}>
                  <Shield className="h-3 w-3 mr-1" />
                  {s.unreadBattleCards} Cards
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {(!activity || activity.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Activity className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No activity yet</p>
                  <p className="text-xs">Signals and outreach events will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activity.map((item, i) => (
                    <div key={`${item.type}-${item.id}-${i}`} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${item.type === "signal" ? "bg-amber-500/20" : "bg-blue-500/20"}`}>
                        {item.type === "signal" ? (
                          <Radar className="h-3.5 w-3.5 text-amber-400" />
                        ) : (
                          <Mail className="h-3.5 w-3.5 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-[10px]">
                          {item.status}
                        </Badge>
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {item.createdAt ? new Date(Number(item.createdAt)).toLocaleDateString() : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/paradigm/prospects")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Prospects</p>
              <p className="text-xs text-muted-foreground">Manage pipeline</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-amber-500/50 transition-colors" onClick={() => navigate("/paradigm/signals")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Radar className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Signals</p>
              <p className="text-xs text-muted-foreground">Trigger events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-violet-500/50 transition-colors" onClick={() => navigate("/paradigm/sequences")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Ghost className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Ghost Mode</p>
              <p className="text-xs text-muted-foreground">Auto sequences</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-red-500/50 transition-colors" onClick={() => navigate("/paradigm/battle-cards")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Battle Cards</p>
              <p className="text-xs text-muted-foreground">Tactical intel</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
