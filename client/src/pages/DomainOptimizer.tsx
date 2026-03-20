import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageGuide from "@/components/PageGuide";
import { useSkin } from "@/contexts/SkinContext";
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX,
  Activity, Zap, Play, Pause, RotateCcw,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Server, Mail, ArrowUpRight, Clock,
} from "lucide-react";

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : score >= 40 ? "bg-orange-500" : "bg-red-500";
  return <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm ${color}`}>{score}</span>;
}

function AuthBadge({ status }: { status: string }) {
  if (status === "pass") return <Badge variant="default" className="bg-emerald-600"><ShieldCheck className="w-3 h-3 mr-1" />Pass</Badge>;
  if (status === "fail") return <Badge variant="destructive"><ShieldX className="w-3 h-3 mr-1" />Fail</Badge>;
  if (status === "missing") return <Badge variant="outline" className="text-amber-600 border-amber-600"><ShieldAlert className="w-3 h-3 mr-1" />Missing</Badge>;
  return <Badge variant="secondary"><Shield className="w-3 h-3 mr-1" />Unknown</Badge>;
}

function WarmupProgress({ phase }: { phase: number }) {
  const pct = phase === 0 ? 0 : Math.round((phase / 8) * 100);
  const labels = ["Not Started", "Phase 1: 50/day", "Phase 2: 100/day", "Phase 3: 200/day", "Phase 4: 500/day", "Phase 5: 1K/day", "Phase 6: 2K/day", "Phase 7: 3K/day", "Phase 8: 5K/day (Complete)"];
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{labels[phase] || "Unknown"}</span>
        <span>{pct}%</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

export default function DomainOptimizer() {
  const { t } = useSkin();
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
  const summary = trpc.domainOptimizer.summary.useQuery();
  const trend = trpc.domainOptimizer.trend.useQuery(
    { domainHealthId: selectedDomain!, days: 30 },
    { enabled: !!selectedDomain }
  );
  const warmupSchedule = trpc.domainOptimizer.warmupSchedule.useQuery();
  const thresholds = trpc.domainOptimizer.thresholds.useQuery();
  const bestDomain = trpc.domainOptimizer.bestDomain.useQuery();

  const runHealing = trpc.domainOptimizer.runAutoHealing.useMutation({
    onSuccess: (data) => {
      toast.success(`Auto-healing complete: ${data.healed} healthy, ${data.paused} paused, ${data.warmedUp} advanced`);
      summary.refetch();
    },
    onError: () => toast.error("Auto-healing failed"),
  });

  const startWarmup = trpc.domainOptimizer.startWarmup.useMutation({
    onSuccess: () => {
      toast.success("Warm-up started! Domain will gradually ramp up over 8 weeks.");
      summary.refetch();
    },
    onError: () => toast.error("Failed to start warm-up"),
  });

  const data = summary.data;

  return (
    <div className="space-y-6">
      <PageGuide
        title="Domain Health Optimizer"
        description="Automated domain health monitoring, auto-healing, warm-up scheduling, and intelligent rotation."
        sections={[
          { title: "Auto-Healing", icon: "actions", content: "The optimizer automatically pauses domains exceeding bounce (>2%) or complaint (>0.1%) thresholds, rests them for 24-72 hours, then gradually brings them back at reduced volume." },
          { title: "Warm-Up", icon: "tips", content: "New domains follow an 8-week graduated ramp: 50→100→200→500→1K→2K→3K→5K emails/day. The system auto-advances phases weekly." },
          { title: "Domain Rotation", icon: "outcomes", content: "When sending campaigns, the system automatically selects the healthiest domain that hasn't hit its daily limit." },
        ]}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold">{data?.totalDomains ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Domains</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/30">
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-emerald-500">{data?.healthyDomains ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Healthy (80+)</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30">
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-amber-500">{data?.warningDomains ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Warning (50-79)</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/30">
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-red-500">{data?.criticalDomains ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Critical (&lt;50)</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30">
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-blue-500">{data?.warmingUp ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Warming Up</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/30">
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-purple-500">{data?.avgScore ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Avg Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => runHealing.mutate()} disabled={runHealing.isPending} className="bg-emerald-600 hover:bg-emerald-700">
          <Zap className="w-4 h-4 mr-2" />
          {runHealing.isPending ? "Running Auto-Healing..." : "Run Auto-Healing Now"}
        </Button>
        <Button variant="outline" onClick={() => summary.refetch()}>
          <RotateCcw className="w-4 h-4 mr-2" />Refresh
        </Button>
        {bestDomain.data && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm">
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            <span>Best sending domain: <strong>{bestDomain.data.domain}</strong> ({bestDomain.data.sentToday}/{bestDomain.data.dailyLimit} today)</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="domains">
        <TabsList>
          <TabsTrigger value="domains">Domain Leaderboard</TabsTrigger>
          <TabsTrigger value="warmup">Warm-Up Schedule</TabsTrigger>
          <TabsTrigger value="thresholds">Auto-Healing Rules</TabsTrigger>
          <TabsTrigger value="trend">Health Trends</TabsTrigger>
        </TabsList>

        {/* Domain Leaderboard */}
        <TabsContent value="domains" className="space-y-3">
          {(data?.domains ?? []).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No domains configured yet. Add domains in the Deliverability section to start monitoring.</p>
              </CardContent>
            </Card>
          ) : (
            (data?.domains ?? []).map((d: any) => (
              <Card key={d.id} className={`transition-all hover:shadow-md ${d.healthScore >= 80 ? 'border-l-4 border-l-emerald-500' : d.healthScore >= 50 ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-red-500'}`}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <ScoreBadge score={d.healthScore} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{d.domain}</h3>
                        <Badge variant="outline">{d.healthGrade}</Badge>
                        {(d.warmupPhase ?? 0) > 0 && (d.warmupPhase ?? 0) < 8 && (
                          <Badge className="bg-blue-500"><Activity className="w-3 h-3 mr-1" />Warming Up</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-xs">SPF: <AuthBadge status={d.spfStatus} /></span>
                        <span className="text-xs">DKIM: <AuthBadge status={d.dkimStatus} /></span>
                        <span className="text-xs">DMARC: <AuthBadge status={d.dmarcStatus} /></span>
                      </div>
                      {d.warmupPhase > 0 && <WarmupProgress phase={d.warmupPhase} />}
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                        <span><Mail className="w-3 h-3 inline mr-1" />Sent: {d.stats?.totalSent ?? 0}</span>
                        <span>Delivered: {d.stats?.totalDelivered ?? 0}</span>
                        <span>Bounced: {d.stats?.totalBounced ?? 0}</span>
                        <span>Complaints: {d.stats?.totalComplaints ?? 0}</span>
                        <span>Opens: {d.stats?.totalOpens ?? 0}</span>
                        <span>Limit: {d.dailySendLimit}/day</span>
                      </div>
                      {d.recommendations?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {d.recommendations.map((r: string, i: number) => (
                            <div key={i} className={`text-xs flex items-start gap-1 ${r.includes('CRITICAL') ? 'text-red-500' : r.includes('excellent') ? 'text-emerald-500' : 'text-amber-600'}`}>
                              {r.includes('CRITICAL') ? <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> : r.includes('excellent') ? <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" /> : <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                              {r}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {(d.warmupPhase ?? 0) === 0 && (
                        <Button size="sm" variant="outline" onClick={() => startWarmup.mutate({ domainId: d.id })}>
                          <Play className="w-3 h-3 mr-1" />Start Warm-Up
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setSelectedDomain(d.id)}>
                        <TrendingUp className="w-3 h-3 mr-1" />View Trend
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Warm-Up Schedule */}
        <TabsContent value="warmup">
          <Card>
            <CardHeader>
              <CardTitle>8-Week Warm-Up Schedule</CardTitle>
              <CardDescription>New domains follow this graduated ramp to build sender reputation safely.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(warmupSchedule.data ?? []).map((phase: any) => (
                  <div key={phase.phase} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                      {phase.phase}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{phase.description}</p>
                      <p className="text-xs text-muted-foreground">Max {phase.dailyLimit.toLocaleString()} emails per day</p>
                    </div>
                    <div className="text-right">
                      <Progress value={phase.phase * 12.5} className="w-24 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Healing Rules */}
        <TabsContent value="thresholds">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Healing Rules</CardTitle>
              <CardDescription>These thresholds are enforced automatically. When a domain crosses a threshold, the system takes immediate action.</CardDescription>
            </CardHeader>
            <CardContent>
              {thresholds.data && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
                      <h4 className="font-semibold text-amber-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Warning Pause</h4>
                      <p className="text-sm mt-1">Bounce rate &gt; {thresholds.data.maxBounceRate / 100}% or Complaint rate &gt; {thresholds.data.maxComplaintRate / 1000}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Cooldown: {thresholds.data.normalCooldown / 3600000} hours</p>
                    </div>
                    <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
                      <h4 className="font-semibold text-red-600 flex items-center gap-2"><ShieldX className="w-4 h-4" />Critical Pause</h4>
                      <p className="text-sm mt-1">Bounce rate &gt; {thresholds.data.criticalBounceRate / 100}% or Complaint rate &gt; {thresholds.data.criticalComplaintRate / 1000}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Cooldown: {thresholds.data.severeCooldown / 3600000} hours</p>
                    </div>
                    <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/5">
                      <h4 className="font-semibold text-blue-600 flex items-center gap-2"><TrendingDown className="w-4 h-4" />Low Health Pause</h4>
                      <p className="text-sm mt-1">Health score below {thresholds.data.minHealthScoreForSending}</p>
                      <p className="text-xs text-muted-foreground mt-1">Domain paused until health improves</p>
                    </div>
                    <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                      <h4 className="font-semibold text-emerald-600 flex items-center gap-2"><RotateCcw className="w-4 h-4" />Recovery Protocol</h4>
                      <p className="text-sm mt-1">Volume reduced by {thresholds.data.recoveryVolumeReduction * 100}% on resume</p>
                      <p className="text-xs text-muted-foreground mt-1">Gradual ramp back to full capacity</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">Health Score Formula</h4>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      <div className="text-center p-2 rounded bg-background"><div className="font-bold text-lg">25%</div><div className="text-xs text-muted-foreground">Authentication</div><div className="text-xs">(SPF+DKIM+DMARC)</div></div>
                      <div className="text-center p-2 rounded bg-background"><div className="font-bold text-lg">25%</div><div className="text-xs text-muted-foreground">Bounce Rate</div><div className="text-xs">(&lt;1% = 100)</div></div>
                      <div className="text-center p-2 rounded bg-background"><div className="font-bold text-lg">25%</div><div className="text-xs text-muted-foreground">Complaint Rate</div><div className="text-xs">(&lt;0.05% = 100)</div></div>
                      <div className="text-center p-2 rounded bg-background"><div className="font-bold text-lg">15%</div><div className="text-xs text-muted-foreground">Open Rate</div><div className="text-xs">(&gt;25% = 100)</div></div>
                      <div className="text-center p-2 rounded bg-background"><div className="font-bold text-lg">10%</div><div className="text-xs text-muted-foreground">Delivery Rate</div><div className="text-xs">(&gt;98% = 100)</div></div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Trends */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>Health Trend {selectedDomain ? `(Domain #${selectedDomain})` : ""}</CardTitle>
              <CardDescription>{selectedDomain ? "30-day health score history" : "Select a domain from the leaderboard to view its trend."}</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedDomain ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click "View Trend" on any domain to see its health history.</p>
                </div>
              ) : trend.isLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading trend data...</div>
              ) : (trend.data ?? []).length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No historical data yet. Run Auto-Healing to start recording daily snapshots.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(trend.data ?? []).map((record: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/30 text-sm">
                      <span className="w-24 text-muted-foreground">{record.date}</span>
                      <ScoreBadge score={record.healthScore} />
                      <div className="flex-1 flex gap-4 text-xs text-muted-foreground">
                        <span>Sent: {record.totalSent}</span>
                        <span>Bounced: {record.totalBounced}</span>
                        <span>Complaints: {record.totalComplaints}</span>
                        <span>Opens: {record.totalOpens}</span>
                      </div>
                      {record.isPaused && <Badge variant="destructive" className="text-xs"><Pause className="w-3 h-3 mr-1" />Paused</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
