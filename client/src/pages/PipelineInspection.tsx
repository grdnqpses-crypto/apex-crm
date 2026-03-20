import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw, TrendingUp, AlertTriangle, DollarSign, Clock, BarChart2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function PipelineInspection() {
  const utils = trpc.useUtils();
  const [selectedPipeline, setSelectedPipeline] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [latestResult, setLatestResult] = useState<any>(null);
  const { data: pipelines } = trpc.pipelines.list.useQuery();
  const { data: history, isLoading } = trpc.pipelineInspection.getHistory.useQuery({ pipelineId: selectedPipeline ? parseInt(selectedPipeline) : 0 });

  const runMutation = trpc.pipelineInspection.run.useMutation({
    onSuccess: (data) => {
      utils.pipelineInspection.getHistory.invalidate();
      setRunning(false);
      setLatestResult(data);
      toast.success("Pipeline inspection complete");
    },
    onError: (e) => { setRunning(false); toast.error(e.message); },
  });

  const historyList = history as any[] || [];
  const pipelineList = pipelines as any[] || [];

  const healthColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const result = latestResult || historyList[0];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Search className="w-6 h-6 text-primary" /> Pipeline Inspection</h1>
            <p className="text-muted-foreground mt-1">AI-powered deep analysis of your sales pipeline — health scores, bottlenecks, stalled deals, and revenue forecasts</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select pipeline" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Pipelines</SelectItem>
                {pipelineList.map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => { setRunning(true); runMutation.mutate({ pipelineId: selectedPipeline ? parseInt(selectedPipeline) : 0 }); }} disabled={running} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} />
              {running ? "Inspecting..." : "Run Inspection"}
            </Button>
          </div>
        </div>

        {/* Latest Result */}
        {result && (
          <>
            {/* Health Score */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Health Score", value: `${result.healthScore ?? 0}%`, icon: BarChart2, color: healthColor(result.healthScore ?? 0) },
                { label: "Total Deals", value: result.totalDeals ?? 0, icon: TrendingUp, color: "text-blue-400" },
                { label: "Stalled Deals", value: result.stalledDeals ?? 0, icon: AlertTriangle, color: (result.stalledDeals ?? 0) > 0 ? "text-yellow-400" : "text-green-400" },
                { label: "Pipeline Value", value: result.totalValue ? `$${((result.totalValue as number) / 1000).toFixed(0)}K` : "$0", icon: DollarSign, color: "text-green-400" },
              ].map(stat => (
                <Card key={stat.label} className="border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div><p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p><p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p></div>
                    <stat.icon className={`w-8 h-8 ${stat.color} opacity-60`} />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Issues */}
              {result.issues && result.issues.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-400" /> Issues Found ({result.issues.length})</CardTitle></CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {result.issues.map((issue: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-yellow-500/5 rounded border border-yellow-500/20">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{issue.title || issue.type}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{issue.description}</p>
                          {issue.affectedDeals && <p className="text-xs text-yellow-400 mt-0.5">{issue.affectedDeals} deals affected</p>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /> Recommendations ({result.recommendations.length})</CardTitle></CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {result.recommendations.map((rec: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-green-500/5 rounded border border-green-500/20">
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{rec.title || rec.action}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                          {rec.expectedImpact && <p className="text-xs text-green-400 mt-0.5">Impact: {rec.expectedImpact}</p>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Stage Breakdown */}
            {result.stageBreakdown && result.stageBreakdown.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Stage Breakdown</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {result.stageBreakdown.map((stage: any, i: number) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-medium truncate">{stage.stageName}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>{stage.dealCount} deals</span>
                            <span>${((stage.totalValue || 0) / 1000).toFixed(0)}K</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, (stage.dealCount / (result.totalDeals || 1)) * 100)}%` }} />
                          </div>
                        </div>
                        {stage.avgDaysInStage && (
                          <div className="text-xs text-muted-foreground w-20 text-right flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />{stage.avgDaysInStage}d avg
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Summary */}
            {result.aiSummary && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-2">AI Analysis</p>
                  <p className="text-sm">{result.aiSummary}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Empty State */}
        {!result && !isLoading && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No inspections yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Run a pipeline inspection to get AI-powered analysis of your deals, bottlenecks, and revenue forecast</p>
                <Button onClick={() => { setRunning(true); runMutation.mutate({ pipelineId: 0 }); }} disabled={running} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} />
                {running ? "Inspecting..." : "Run First Inspection"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* History */}
        {historyList.length > 1 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Inspection History</h2>
            <div className="space-y-2">
              {historyList.slice(1, 6).map((item: any) => (
                <Card key={item.id} className="border-border/30">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BarChart2 className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium">{new Date(item.createdAt).toLocaleString()}</span>
                        {item.pipelineId && <span className="text-xs text-muted-foreground ml-2">Pipeline #{item.pipelineId}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${healthColor(item.healthScore ?? 0)}`}>{item.healthScore ?? 0}%</span>
                      <span className="text-xs text-muted-foreground">{item.totalDeals ?? 0} deals</span>
                      <Button size="sm" variant="ghost" onClick={() => setLatestResult(item)}>View</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
