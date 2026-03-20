import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Brain, TrendingUp, Layers, Zap, ArrowRight, DollarSign, Truck, BarChart3, Target } from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";
import { useSkin } from "@/contexts/SkinContext";

export default function RealmAutopilot() {
  const { t } = useSkin();
  const { data: lanes, isLoading: lanesLoading } = trpc.autopilot.lanes.useQuery();
  const { data: consolidations, isLoading: consLoading } = trpc.autopilot.consolidations.useQuery();
  const { data: stats } = trpc.marketplace.stats.useQuery();

  const utils = trpc.useUtils();
  const analyzeLanes = trpc.autopilot.analyzeLanes.useMutation({
    onSuccess: () => { utils.autopilot.lanes.invalidate(); toast.success("Lane analysis complete!"); },
  });
  const findConsolidations = trpc.autopilot.findConsolidations.useMutation({
    onSuccess: () => { utils.autopilot.consolidations.invalidate(); toast.success("Consolidation opportunities found!"); },
  });
  const executeConsolidation = trpc.autopilot.executeConsolidation.useMutation({
    onSuccess: () => { utils.autopilot.consolidations.invalidate(); toast.success("Consolidation executed!"); },
  });

  const totalSavings = consolidations?.reduce((sum, c) => sum + Number(c.savings || 0), 0) || 0;

  return (
      <FeatureGate
        featureKey="realm_autopilot"
        featureName="REALM Autopilot™"
        description="Full autonomous CRM operation — AI handles prospecting, outreach, follow-up, and deal progression end-to-end. Fortune plan and above."
        freemium={false}
      >

    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-crm-premium" />
            REALM Autopilot
          </h1>
          <p className="text-muted-foreground mt-1">AI-powered freight consolidation, lane prediction, and autonomous route optimization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={analyzeLanes.isPending} onClick={() => analyzeLanes.mutate()}>
            <BarChart3 className="h-4 w-4 mr-2" /> {analyzeLanes.isPending ? "Analyzing..." : "Analyze Lanes"}
          </Button>
          <Button className="bg-crm-premium hover:bg-crm-premium/90" disabled={findConsolidations.isPending}
            onClick={() => findConsolidations.mutate()}>
            <Layers className="h-4 w-4 mr-2" /> {findConsolidations.isPending ? "Scanning..." : "Find Consolidations"}
          </Button>
        </div>
      </div>

      {/* Autopilot Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-crm-premium/30">
          <CardContent className="p-4 text-center">
            <Zap className="h-6 w-6 mx-auto mb-2 text-crm-premium" />
            <div className="text-2xl font-bold text-crm-premium">{consolidations?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Consolidation Opportunities</div>
          </CardContent>
        </Card>
        <Card className="border-crm-success/30">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-crm-success" />
            <div className="text-2xl font-bold text-crm-success">${totalSavings.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Potential Savings</div>
          </CardContent>
        </Card>
        <Card className="border-crm-workflow/30">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-crm-workflow" />
            <div className="text-2xl font-bold">{lanes?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Predicted Lanes</div>
          </CardContent>
        </Card>
        <Card className="border-crm-pending/30">
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-crm-pending" />
            <div className="text-2xl font-bold">{stats?.activeLoads || 0}</div>
            <div className="text-xs text-muted-foreground">Active Loads</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consolidation Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-crm-premium" /> Consolidation Opportunities
            </CardTitle>
            <CardDescription>AI-identified shipments that can be combined for cost savings</CardDescription>
          </CardHeader>
          <CardContent>
            {consLoading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : !consolidations?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No consolidation opportunities yet.</p>
                <p className="text-xs mt-1">Click "Find Consolidations" to scan active loads.</p>
              </div>
            ) : consolidations.map(c => (
              <div key={c.id} className="mb-4 p-4 rounded-lg bg-secondary/50 border border-crm-premium/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold">{c.groupId}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${c.status === 'identified' ? 'bg-crm-pending/20 text-crm-pending' : c.status === 'executed' ? 'bg-crm-success/20 text-crm-success' : 'bg-crm-workflow/20 text-crm-workflow'}`}>
                      {c.status}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-crm-success">Save ${Number(c.savings).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mb-2">
                  <span>{c.originRegion}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span>{c.destRegion}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
                  <div>Loads: <span className="text-foreground font-medium">{c.loadCount}</span></div>
                  <div>Individual: <span className="text-foreground">${Number(c.individualCost).toLocaleString()}</span></div>
                  <div>Combined: <span className="text-crm-success font-medium">${Number(c.consolidatedCost).toLocaleString()}</span></div>
                </div>
                {c.aiReasoning && <p className="text-xs text-muted-foreground italic mb-2">{c.aiReasoning}</p>}
                {c.status === 'identified' && (
                  <Button size="sm" className="w-full bg-crm-premium hover:bg-crm-premium/90"
                    onClick={() => executeConsolidation.mutate({ id: c.id })}>
                    <Zap className="h-3 w-3 mr-1" /> Execute Consolidation
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Lane Predictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-crm-workflow" /> Lane Demand Predictions
            </CardTitle>
            <CardDescription>AI-predicted freight demand by lane — position carriers before loads post</CardDescription>
          </CardHeader>
          <CardContent>
            {lanesLoading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : !lanes?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No lane data yet.</p>
                <p className="text-xs mt-1">Click "Analyze Lanes" to predict demand.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lanes.map(lane => (
                  <div key={lane.id} className="p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{lane.originCity}, {lane.originState}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{lane.destCity}, {lane.destState}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${Number(lane.demandScore) > 70 ? 'bg-crm-success' : Number(lane.demandScore) > 40 ? 'bg-crm-pending' : 'bg-crm-inactive'}`} />
                        <span className="text-xs font-medium">{Number(lane.demandScore)}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <div>Trend: <span className={`font-medium ${lane.demandTrend === 'rising' ? 'text-crm-success' : lane.demandTrend === 'falling' ? 'text-crm-critical' : 'text-crm-pending'}`}>{lane.demandTrend}</span></div>
                      <div>Avg Rate: <span className="text-foreground">${Number(lane.avgRate).toLocaleString()}</span></div>
                      <div>Next Wk: <span className="text-foreground">{lane.nextWeekPrediction} loads</span></div>
                      <div>Carriers: <span className="text-foreground">{lane.availableCarriers}</span></div>
                    </div>
                    {/* Demand bar */}
                    <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${Number(lane.demandScore) > 70 ? 'bg-crm-success' : Number(lane.demandScore) > 40 ? 'bg-crm-pending' : 'bg-crm-inactive'}`}
                        style={{ width: `${Number(lane.demandScore)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How Autopilot Works */}
      <Card className="border-crm-premium/30 bg-crm-premium/5">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-crm-premium" /> How REALM Autopilot Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Predict Demand", desc: "AI analyzes historical data to predict which lanes will have freight before it's posted", icon: BarChart3 },
              { step: "2", title: "Consolidate Loads", desc: "Combines LTL shipments heading the same direction into full truckloads, cutting costs up to 70%", icon: Layers },
              { step: "3", title: "Match & Book", desc: "Automatically matches the best carrier based on route, safety, price, and availability", icon: Target },
              { step: "4", title: "Scale Autonomously", desc: "Handle 300-400% more volume without adding headcount — the system runs itself", icon: Zap },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-crm-premium/20 flex items-center justify-center mx-auto mb-2">
                  <s.icon className="h-5 w-5 text-crm-premium" />
                </div>
                <div className="text-sm font-bold mb-1">Step {s.step}: {s.title}</div>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  
      </FeatureGate>);
}
