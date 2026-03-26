import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingDown, BarChart3, DollarSign, TrendingUp, Target, Calendar } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from "recharts";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildMonthlyTrend(recentDeals: any[]): { month: string; won: number; lost: number; winRate: number }[] {
  const map: Record<string, { won: number; lost: number }> = {};
  for (const d of recentDeals) {
    if (!d.closedAt) continue;
    const dt = new Date(Number(d.closedAt));
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    if (!map[key]) map[key] = { won: 0, lost: 0 };
    if (d.status === "won") map[key].won++;
    else if (d.status === "lost") map[key].lost++;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, v]) => ({
      month: new Date(key + "-01").toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      won: v.won,
      lost: v.lost,
      winRate: v.won + v.lost > 0 ? Math.round((v.won / (v.won + v.lost)) * 100) : 0,
    }));
}

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];
const LOSS_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#14b8a6", "#3b82f6"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-bold">{p.value}{p.name === "Win Rate" ? "%" : ""}</span>
        </p>
      ))}
    </div>
  );
}

export default function WinLossAnalysis() {
  const { t } = useSkin();
  const [days, setDays] = useState(90);
  const startDate = useMemo(() => Date.now() - days * 86400000, [days]);
  const { data: stats, isLoading } = trpc.winLoss.stats.useQuery({ startDate });
  const monthlyTrend = useMemo(() => buildMonthlyTrend(stats?.recentDeals ?? []), [stats]);

  return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Win / Loss Analysis</h1>
              <p className="text-muted-foreground text-sm">Understand why deals are won and lost to improve your close rate.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/40 rounded-xl p-1">
            {[30, 60, 90, 180, 365].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${days === d ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="rounded-2xl"><CardContent className="pt-6 h-24 animate-pulse bg-muted/30" /></Card>
            ))}
          </div>
        ) : !stats ? (
          <Card><CardContent className="p-12 text-center"><BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" /><h3 className="text-lg font-medium">Unable to load analysis</h3><p className="text-sm text-muted-foreground mt-1">Please try refreshing the page.</p></CardContent></Card>
        ) : stats.totalWon === 0 && stats.totalLost === 0 ? (
          <Card><CardContent className="p-12 text-center"><Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" /><h3 className="text-lg font-medium">No closed deals in this period</h3><p className="text-sm text-muted-foreground mt-1">Mark deals as Won or Lost in your pipeline to see win/loss analysis here. Try extending the date range above.</p></CardContent></Card>
        ) : (
          <>
            {/* ─── KPI Cards ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Deals Won</p>
                      <p className="text-3xl font-bold text-green-600 mt-1">{stats.totalWon}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">${stats.wonValue.toLocaleString()} total value</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <div className="h-1 bg-green-100 rounded-full mt-3">
                    <div className="h-1 bg-green-500 rounded-full" style={{ width: `${stats.winRate}%` }} />
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Deals Lost</p>
                      <p className="text-3xl font-bold text-red-500 mt-1">{stats.totalLost}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">${stats.lostValue.toLocaleString()} total value</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                  <div className="h-1 bg-red-100 rounded-full mt-3">
                    <div className="h-1 bg-red-500 rounded-full" style={{ width: `${100 - stats.winRate}%` }} />
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Win Rate</p>
                      <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.winRate}%</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stats.totalWon + stats.totalLost} total closed</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Target className="h-5 w-5 text-indigo-500" />
                    </div>
                  </div>
                  <div className="h-1 bg-indigo-100 rounded-full mt-3">
                    <div className="h-1 bg-indigo-500 rounded-full" style={{ width: `${stats.winRate}%` }} />
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Avg Deal Size</p>
                      <p className="text-3xl font-bold text-foreground mt-1">${stats.avgDealSize.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">won deals only</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                  <div className="h-1 bg-amber-100 rounded-full mt-3">
                    <div className="h-1 bg-amber-500 rounded-full" style={{ width: "100%" }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ─── Monthly Trend Chart ─── */}
            {monthlyTrend.length > 1 && (
              <Card className="rounded-2xl border-border/40 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                    Monthly Win / Loss Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="won" name="Won" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lost" name="Lost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
                      <span className="inline-block w-3 h-0.5 bg-indigo-500 rounded" /> Win Rate % by Month
                    </p>
                    <ResponsiveContainer width="100%" height={80}>
                      <LineChart data={monthlyTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="%" />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="winRate" name="Win Rate" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: "#6366f1" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ─── Reason Breakdowns ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl border-border/40 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-destructive flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" /> Top Loss Reasons
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.lostReasons.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No lost deals in this period.</p>
                  ) : (
                    <>
                      {stats.lostReasons.map(([reason, count], i) => (
                        <div key={reason} className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-muted-foreground w-4 text-right">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-sm truncate max-w-[70%] font-medium">{reason}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">{Math.round((count / stats.totalLost) * 100)}%</span>
                                <Badge variant="destructive" className="text-xs">{count}</Badge>
                              </div>
                            </div>
                            <div className="h-1.5 bg-red-100 rounded-full">
                              <div
                                className="h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.round((count / stats.totalLost) * 100)}%`, backgroundColor: LOSS_COLORS[i % LOSS_COLORS.length] }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {stats.lostReasons.length > 1 && (
                        <div className="mt-4 pt-4 border-t border-border/40">
                          <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                              <Pie
                                data={stats.lostReasons.map(([name, value]) => ({ name, value }))}
                                cx="50%" cy="50%"
                                innerRadius={40} outerRadius={70}
                                paddingAngle={2} dataKey="value"
                              >
                                {stats.lostReasons.map((_, index) => (
                                  <Cell key={index} fill={LOSS_COLORS[index % LOSS_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v: any, n: any) => [v, n]} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/40 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-green-600 flex items-center gap-2">
                    <Trophy className="h-4 w-4" /> Top Win Reasons
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.wonReasons.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No won deals in this period.</p>
                  ) : (
                    <>
                      {stats.wonReasons.map(([reason, count], i) => (
                        <div key={reason} className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-muted-foreground w-4 text-right">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-sm truncate max-w-[70%] font-medium">{reason}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">{Math.round((count / stats.totalWon) * 100)}%</span>
                                <Badge className="text-xs bg-green-500 hover:bg-green-600">{count}</Badge>
                              </div>
                            </div>
                            <div className="h-1.5 bg-green-100 rounded-full">
                              <div
                                className="h-1.5 bg-green-500 rounded-full transition-all"
                                style={{ width: `${Math.round((count / stats.totalWon) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {stats.wonReasons.length > 1 && (
                        <div className="mt-4 pt-4 border-t border-border/40">
                          <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                              <Pie
                                data={stats.wonReasons.map(([name, value]) => ({ name, value }))}
                                cx="50%" cy="50%"
                                innerRadius={40} outerRadius={70}
                                paddingAngle={2} dataKey="value"
                              >
                                {stats.wonReasons.map((_, index) => (
                                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v: any, n: any) => [v, n]} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ─── Recent Closed Deals ─── */}
            <Card className="rounded-2xl border-border/40 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Recent Closed Deals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 pr-4 font-medium">Deal</th>
                        <th className="text-left py-2 pr-4 font-medium">Value</th>
                        <th className="text-left py-2 pr-4 font-medium">Outcome</th>
                        <th className="text-left py-2 pr-4 font-medium">Reason</th>
                        <th className="text-left py-2 font-medium">Closed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentDeals.map((deal: any) => (
                        <tr key={deal.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-2 pr-4 font-medium">{deal.name}</td>
                          <td className="py-2 pr-4">${(deal.value ?? 0).toLocaleString()}</td>
                          <td className="py-2 pr-4">
                            <Badge
                              variant={deal.status === "won" ? "default" : "destructive"}
                              className={`text-xs ${deal.status === "won" ? "bg-green-500 hover:bg-green-600" : ""}`}
                            >
                              {deal.status}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4 text-xs text-muted-foreground max-w-[200px] truncate">
                            {deal.status === "won" ? deal.wonReason : deal.lostReason || "—"}
                          </td>
                          <td className="py-2 text-muted-foreground text-xs">
                            {deal.closedAt ? new Date(deal.closedAt).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
  );
}
