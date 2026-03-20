import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingDown, BarChart3, DollarSign } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

export default function WinLossAnalysis() {
  const { t } = useSkin();
  const [days, setDays] = useState(90);
  const startDate = Date.now() - days * 86400000;

  const { data: stats, isLoading } = trpc.winLoss.stats.useQuery({ startDate });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Win / Loss Analysis</h1>
              <p className="text-muted-foreground text-sm">Understand why deals are won and lost to improve your close rate.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[30, 60, 90, 180, 365].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${days === d ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading analysis…</div>
        ) : stats ? (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">{stats.totalWon}</p>
                      <p className="text-xs text-muted-foreground">Deals Won</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-6 w-6 text-destructive" />
                    <div>
                      <p className="text-2xl font-bold text-destructive">{stats.totalLost}</p>
                      <p className="text-xs text-muted-foreground">Deals Lost</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{stats.winRate}%</p>
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-amber-500" />
                    <div>
                      <p className="text-2xl font-bold">${stats.avgDealSize.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Avg Won Deal</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reason breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base text-destructive flex items-center gap-2"><TrendingDown className="h-4 w-4" /> Top Loss Reasons</CardTitle></CardHeader>
                <CardContent>
                  {stats.lostReasons.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No lost deals in this period.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.lostReasons.map(([reason, count]) => (
                        <div key={reason} className="flex items-center justify-between">
                          <span className="text-sm truncate max-w-[70%]">{reason}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 bg-destructive/20 rounded-full w-24">
                              <div
                                className="h-2 bg-destructive rounded-full"
                                style={{ width: `${Math.round((count / stats.totalLost) * 100)}%` }}
                              />
                            </div>
                            <Badge variant="destructive" className="text-xs">{count}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base text-green-600 flex items-center gap-2"><Trophy className="h-4 w-4" /> Top Win Reasons</CardTitle></CardHeader>
                <CardContent>
                  {stats.wonReasons.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No won deals in this period.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.wonReasons.map(([reason, count]) => (
                        <div key={reason} className="flex items-center justify-between">
                          <span className="text-sm truncate max-w-[70%]">{reason}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-2 bg-green-100 rounded-full w-24">
                              <div
                                className="h-2 bg-green-500 rounded-full"
                                style={{ width: `${Math.round((count / stats.totalWon) * 100)}%` }}
                              />
                            </div>
                            <Badge className="text-xs bg-green-500 hover:bg-green-600">{count}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent closed deals */}
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Closed Deals</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 pr-4 font-medium">Deal</th>
                        <th className="text-left py-2 pr-4 font-medium">Value</th>
                        <th className="text-left py-2 pr-4 font-medium">Outcome</th>
                        <th className="text-left py-2 font-medium">Closed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentDeals.map(deal => (
                        <tr key={deal.id} className="border-b hover:bg-muted/30">
                          <td className="py-2 pr-4 font-medium">{deal.name}</td>
                          <td className="py-2 pr-4">${(deal.value ?? 0).toLocaleString()}</td>
                          <td className="py-2 pr-4">
                            <Badge variant={deal.status === "won" ? "default" : "destructive"} className={`text-xs ${deal.status === "won" ? "bg-green-500 hover:bg-green-600" : ""}`}>
                              {deal.status}
                            </Badge>
                          </td>
                          <td className="py-2 text-muted-foreground">
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
        ) : null}
      </div>
    </DashboardLayout>
  );
}
