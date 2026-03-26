import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Activity, CheckCircle2, RefreshCw, Shield, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";

export default function AnomalyDetection() {
  const { t } = useSkin();
  const utils = trpc.useUtils();
  const { data: alerts, isLoading } = trpc.anomalyDetection.getAlerts.useQuery({ resolved: false, severity: 'all' });
  const [running, setRunning] = useState(false);

  const runMutation = trpc.anomalyDetection.runDetection.useMutation({
    onSuccess: () => { utils.anomalyDetection.getAlerts.invalidate(); setRunning(false); toast.success("Anomaly scan complete"); },
    onError: (e) => { setRunning(false); toast.error(e.message); },
  });
  const resolveMutation = trpc.anomalyDetection.resolve.useMutation({
    onSuccess: () => { utils.anomalyDetection.getAlerts.invalidate(); toast.success("Alert resolved"); },
    onError: (e) => toast.error(e.message),
  });
  const resolveAllMutation = trpc.anomalyDetection.resolveAll.useMutation({
    onSuccess: () => { utils.anomalyDetection.getAlerts.invalidate(); toast.success("All alerts resolved"); },
    onError: (e) => toast.error(e.message),
  });

  const alertList = alerts as any[] || [];
  const openAlerts = alertList.filter((a: any) => a.status === "open");
  const criticalAlerts = alertList.filter((a: any) => a.severity === "critical" && a.status === "open");
  const resolvedAlerts = alertList.filter((a: any) => a.status === "resolved");

  const severityColor: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  const typeIcon: Record<string, any> = {
    revenue_drop: TrendingDown,
    deal_velocity: Activity,
    email_bounce: AlertTriangle,
    pipeline_stall: TrendingDown,
    activity_spike: TrendingUp,
    conversion_drop: TrendingDown,
  };

  return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-primary" /> AI Anomaly Detection</h1>
            <p className="text-muted-foreground mt-1">Continuous monitoring of revenue, pipeline, and email metrics — AI flags unusual patterns before they become problems</p>
          </div>
          <div className="flex gap-2">
            {openAlerts.length > 0 && (
              <Button variant="outline" onClick={() => resolveAllMutation.mutate()} disabled={resolveAllMutation.isPending}>
                {resolveAllMutation.isPending ? "Resolving..." : "Resolve All"}
              </Button>
            )}
            <Button onClick={() => { setRunning(true); runMutation.mutate(); }} disabled={running} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} />
              {running ? "Scanning..." : "Run Detection"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Open Alerts", value: openAlerts.length, icon: AlertTriangle, color: openAlerts.length > 0 ? "text-red-400" : "text-green-400" },
            { label: "Critical", value: criticalAlerts.length, icon: Zap, color: criticalAlerts.length > 0 ? "text-red-400" : "text-green-400" },
            { label: "Resolved", value: resolvedAlerts.length, icon: CheckCircle2, color: "text-green-400" },
            { label: "Total Scans", value: alertList.length, icon: Activity, color: "text-blue-400" },
          ].map(stat => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p><p className="text-2xl font-bold mt-1">{stat.value}</p></div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-60`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status Banner */}
        {openAlerts.length === 0 && !isLoading && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-400">All systems normal</p>
                <p className="text-sm text-muted-foreground">No anomalies detected. Run a scan to check for new issues.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts List */}
        <div className="space-y-3">
          {isLoading && <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>}
          {!isLoading && alertList.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">No anomaly data yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Run a detection scan to analyze your CRM data for unusual patterns</p>
                <Button onClick={() => { setRunning(true); runMutation.mutate(); }} disabled={running} className="gap-2">
                  <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} />
                  {running ? "Scanning..." : "Run First Scan"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Open Alerts */}
          {openAlerts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Open Alerts ({openAlerts.length})</h2>
              <div className="space-y-3">
                {openAlerts.map((alert: any) => {
                  const Icon = typeIcon[alert.anomalyType] || AlertTriangle;
                  return (
                    <Card key={alert.id} className={`border ${severityColor[alert.severity]?.split(" ").pop() || "border-border/50"}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${severityColor[alert.severity]?.split(" ").slice(0, 2).join(" ") || "bg-gray-500/20 text-gray-400"}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">{alert.title || alert.anomalyType?.replace(/_/g, " ")}</span>
                                <Badge className={severityColor[alert.severity] || "bg-gray-500/20 text-gray-400"}>{alert.severity}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                              {alert.affectedMetric && (
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                  <span>Metric: <span className="text-foreground">{alert.affectedMetric}</span></span>
                                  {alert.currentValue !== null && <span>Current: <span className="text-foreground">{alert.currentValue}</span></span>}
                                  {alert.expectedValue !== null && <span>Expected: <span className="text-foreground">{alert.expectedValue}</span></span>}
                                  {alert.deviation !== null && <span>Deviation: <span className={alert.deviation > 0 ? "text-red-400" : "text-green-400"}>{alert.deviation > 0 ? "+" : ""}{alert.deviation?.toFixed(1)}%</span></span>}
                                </div>
                              )}
                              {alert.suggestedAction && (
                                <div className="mt-2 p-2 bg-primary/5 rounded text-xs text-muted-foreground border border-primary/10">
                                  <span className="text-primary font-medium">Suggested: </span>{alert.suggestedAction}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="flex-shrink-0 gap-1 text-green-400 border-green-400/30 hover:bg-green-400/10" onClick={() => resolveMutation.mutate({ id: alert.id })}>
                            <CheckCircle2 className="w-3 h-3" /> Resolve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resolved Alerts */}
          {resolvedAlerts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Resolved ({resolvedAlerts.length})</h2>
              <div className="space-y-2">
                {resolvedAlerts.slice(0, 5).map((alert: any) => (
                  <Card key={alert.id} className="border-border/30 opacity-60">
                    <CardContent className="p-3 flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{alert.title || alert.anomalyType?.replace(/_/g, " ")}</span>
                        <span className="text-xs text-muted-foreground ml-2">Resolved {new Date(alert.resolvedAt || alert.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{alert.severity}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
