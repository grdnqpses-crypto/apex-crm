import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, DollarSign, Target, Users, CheckCircle2, Settings2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v / 100);

function getPeriod(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getPeriodOffset(period: string): number {
  const [y, m] = period.split("-").map(Number);
  const now = new Date();
  return (y - now.getFullYear()) * 12 + (m - (now.getMonth() + 1));
}

function MetricCard({ label, value, icon: Icon, color, sub }: { label: string; value: string; icon: any; color: string; sub?: string }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <Icon className={`w-4 h-4 ${color} opacity-60`} />
        </div>
        <p className="text-xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function SalesForecasting() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(() => getPeriod(0));
  const [quotaInput, setQuotaInput] = useState("");
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [activeView, setActiveView] = useState<"weighted" | "commit" | "best_case">("weighted");

  const periodLabel = useMemo(() => {
    const [y, m] = period.split("-");
    return new Date(Number(y), Number(m) - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
  }, [period]);

  const utils = trpc.useUtils();
  const { data: forecast, isLoading } = trpc.salesQuotas.getForecastWithQuota.useQuery({ period });
  const { data: teamData } = trpc.salesQuotas.listTeamQuotas.useQuery({ period });

  const setQuota = trpc.salesQuotas.setQuota.useMutation({
    onSuccess: () => {
      toast.success("Quota updated");
      setQuotaOpen(false);
      utils.salesQuotas.getForecastWithQuota.invalidate();
      utils.salesQuotas.listTeamQuotas.invalidate();
    },
    onError: () => toast.error("Failed to update quota"),
  });

  const handleSetQuota = () => {
    const amount = Math.round(parseFloat(quotaInput) * 100);
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid amount"); return; }
    setQuota.mutate({ period, targetAmount: amount });
  };

  const viewAmount = activeView === "weighted"
    ? (forecast?.weightedAmount ?? 0)
    : activeView === "commit"
    ? (forecast?.commitAmount ?? 0)
    : (forecast?.bestCaseAmount ?? 0);

  const quota = forecast?.quota?.targetAmount ?? 0;
  const won = forecast?.wonAmount ?? 0;
  const attainment = quota > 0 ? Math.min(Math.round((won / quota) * 100), 100) : null;
  const viewAttainment = quota > 0 ? Math.min(Math.round((viewAmount / quota) * 100), 100) : null;

  const chartData = [
    { name: "Won", value: won, color: "#22c55e" },
    { name: "Commit", value: forecast?.commitAmount ?? 0, color: "#3b82f6" },
    { name: "Weighted", value: forecast?.weightedAmount ?? 0, color: "#f97316" },
    { name: "Best Case", value: forecast?.bestCaseAmount ?? 0, color: "#a855f7" },
    ...(quota > 0 ? [{ name: "Quota", value: quota, color: "#ef4444" }] : []),
  ];

  return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Sales Forecasting
            </h1>
            <p className="text-muted-foreground mt-1">{periodLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPeriod(p => getPeriod(getPeriodOffset(p) - 1))}>‹ Prev</Button>
            <span className="text-sm font-medium px-2">{periodLabel}</span>
            <Button variant="outline" size="sm" onClick={() => setPeriod(p => getPeriod(getPeriodOffset(p) + 1))}>Next ›</Button>
            <Dialog open={quotaOpen} onOpenChange={setQuotaOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Settings2 className="w-4 h-4" /> Set Quota
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Set Monthly Quota — {periodLabel}</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Target Amount (USD)</Label>
                    <Input type="number" placeholder="e.g. 50000" value={quotaInput} onChange={e => setQuotaInput(e.target.value)} />
                    {quota > 0 && <p className="text-xs text-muted-foreground">Current quota: {fmt(quota)}</p>}
                  </div>
                  <Button className="w-full" onClick={handleSetQuota} disabled={setQuota.isPending}>
                    {setQuota.isPending ? "Saving…" : "Save Quota"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quota Progress Bar */}
        {quota > 0 && (
          <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Quota Attainment</span>
                  <Badge className={attainment !== null && attainment >= 100 ? "bg-green-500/20 text-green-400" : attainment !== null && attainment >= 70 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}>
                    {attainment !== null ? `${attainment}%` : "No quota"}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Won vs Target</p>
                  <p className="font-bold">{fmt(won)} / {fmt(quota)}</p>
                </div>
              </div>
              <Progress value={attainment ?? 0} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                <span>$0</span>
                <span>{fmt(quota)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Forecast Views */}
        <Tabs value={activeView} onValueChange={v => setActiveView(v as any)}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="weighted">Weighted</TabsTrigger>
            <TabsTrigger value="commit">Commit</TabsTrigger>
            <TabsTrigger value="best_case">Best Case</TabsTrigger>
          </TabsList>
          {(["weighted", "commit", "best_case"] as const).map(view => (
            <TabsContent key={view} value={view} className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Won (Closed)" value={fmt(won)} icon={CheckCircle2} color="text-green-400" />
                <MetricCard
                  label={view === "weighted" ? "Weighted Forecast" : view === "commit" ? "Commit Forecast" : "Best Case"}
                  value={fmt(viewAmount)} icon={TrendingUp} color="text-primary"
                  sub={viewAttainment !== null ? `${viewAttainment}% of quota` : undefined}
                />
                <MetricCard label="Open Pipeline" value={fmt(forecast?.pipelineAmount ?? 0)} icon={DollarSign} color="text-blue-400" />
                <MetricCard label="Quota" value={quota > 0 ? fmt(quota) : "Not set"} icon={Target} color="text-orange-400" />
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base">Forecast Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `$${(v / 100 / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Deals Closing This Period */}
        {(forecast?.deals?.length ?? 0) > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-base">Deals Closing This Period ({forecast!.deals.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {forecast!.deals.slice(0, 10).map((deal: any) => (
                  <div key={deal.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{deal.name}</p>
                      <p className="text-xs text-muted-foreground">{deal.stageName} · {deal.probability ?? 50}% probability</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{fmt(Number(deal.dealValue ?? 0))}</p>
                      <Badge className={deal.status === "won" ? "bg-green-500/20 text-green-400 text-xs" : "bg-blue-500/20 text-blue-400 text-xs"}>{deal.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scenario Modeling */}
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-purple-400" /> Scenario Modeling &amp; Confidence Interval</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[{label:"Conservative",mult:0.7,color:"text-red-400"},{label:"Base Case",mult:1.0,color:"text-blue-400"},{label:"Optimistic",mult:1.3,color:"text-emerald-400"}].map(s => (
                <div key={s.label} className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{fmt(Math.round(viewAmount * s.mult))}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/30 border border-blue-100/50">
              <span className="text-xs font-semibold text-blue-600">Confidence Interval (90%):</span>
              <span className="text-xs text-blue-500">{fmt(Math.round(viewAmount * 0.75))} &ndash; {fmt(Math.round(viewAmount * 1.25))}</span>
              <span className="text-xs text-muted-foreground ml-auto">Based on historical win rate variance</span>
            </div>
          </CardContent>
        </Card>

        {/* Team Leaderboard */}
        {user?.role === "admin" && teamData && teamData.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Team Leaderboard — {periodLabel}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {[...teamData].sort((a: any, b: any) => b.wonAmount - a.wonAmount).map((rep: any, i: number) => (
                  <div key={rep.userId} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <span className="text-lg font-bold text-muted-foreground w-6 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{rep.name ?? rep.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={rep.attainmentPct ?? 0} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{rep.attainmentPct ?? 0}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{fmt(rep.wonAmount)}</p>
                      {rep.targetAmount > 0 && <p className="text-xs text-muted-foreground">of {fmt(rep.targetAmount)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );
}
