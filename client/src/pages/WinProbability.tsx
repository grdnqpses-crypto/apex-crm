import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
import {
  Target, TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle2, BarChart3, Sparkles, RefreshCw, DollarSign,
  ArrowUpRight, ArrowDownRight, Zap
} from "lucide-react";

const probColor = (p: number) => p >= 70 ? "text-emerald-400" : p >= 40 ? "text-amber-400" : "text-red-400";
const probBg = (p: number) => p >= 70 ? "bg-emerald-500/20" : p >= 40 ? "bg-amber-500/20" : "bg-red-500/20";
const trendIcon = (t: string) => t === 'up' ? TrendingUp : t === 'down' ? TrendingDown : Minus;
const trendColor = (t: string) => t === 'up' ? "text-emerald-400" : t === 'down' ? "text-red-400" : "text-muted-foreground";

export default function WinProbability() {
  const { t } = useSkin();
  const [selectedDeal, setSelectedDeal] = useState<number | null>(null);

  const atRisk = trpc.dealScores.atRisk.useQuery();
  const readyToClose = trpc.dealScores.readyToClose.useQuery();
  const scoreDeal = trpc.dealScores.score.useMutation({
    onSuccess: () => { atRisk.refetch(); readyToClose.refetch(); toast.success("Deal scored"); },
    onError: () => toast.error("Failed to score deal"),
  });
  const scoreDetail = trpc.dealScores.get.useQuery({ dealId: selectedDeal! }, { enabled: !!selectedDeal });
  const scoreHistory = trpc.dealScores.history.useQuery({ dealId: selectedDeal! }, { enabled: !!selectedDeal });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-7 w-7 text-primary" />
            Win Probability Engine
          </h1>
          <p className="text-muted-foreground mt-1">AI-powered deal scoring with multi-signal analysis and trend tracking</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" /> Deals at Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-400">{atRisk.data?.length || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Win probability below 40%</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Ready to Close
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">{readyToClose.data?.length || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Win probability above 70%</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Weighted Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              ${((readyToClose.data || []).reduce((sum: number, d: any) => sum + (d.weightedValue || 0), 0) + (atRisk.data || []).reduce((sum: number, d: any) => sum + (d.weightedValue || 0), 0)).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Probability-adjusted value</p>
          </CardContent>
        </Card>
      </div>

      {/* At Risk Deals */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" /> Deals at Risk
          </CardTitle>
          <CardDescription>Deals with declining win probability that need attention</CardDescription>
        </CardHeader>
        <CardContent>
          {(atRisk.data?.length || 0) === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No deals at risk. Score some deals to see results here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Win Probability</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Weighted Value</TableHead>
                  <TableHead>Risk Factors</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atRisk.data?.map((deal: any) => {
                  const TrendComp = trendIcon(deal.trend || 'stable');
                  return (
                    <TableRow key={deal.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedDeal(deal.dealId)}>
                      <TableCell className="font-medium">{deal.dealName || `Deal #${deal.dealId}`}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${probColor(deal.winProbability)}`}>{deal.winProbability}%</span>
                          <Progress value={deal.winProbability} className="w-20 h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell><TrendComp className={`h-4 w-4 ${trendColor(deal.trend || 'stable')}`} /></TableCell>
                      <TableCell>${(deal.weightedValue || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(deal.riskFactors as string[] || []).slice(0, 2).map((r: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs border-red-500/30 text-red-400">{r.substring(0, 30)}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); scoreDeal.mutate({ dealId: deal.dealId }); }}>
                          <RefreshCw className="h-3 w-3 mr-1" /> Re-score
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ready to Close */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" /> Ready to Close
          </CardTitle>
          <CardDescription>High-probability deals that should be prioritized</CardDescription>
        </CardHeader>
        <CardContent>
          {(readyToClose.data?.length || 0) === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No high-probability deals yet. Score your deals to identify closers.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {readyToClose.data?.map((deal: any) => (
                <div key={deal.id} className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg cursor-pointer hover:bg-emerald-500/10" onClick={() => setSelectedDeal(deal.dealId)}>
                  <div>
                    <h4 className="font-medium">{deal.dealName || `Deal #${deal.dealId}`}</h4>
                    <p className="text-sm text-muted-foreground">${(deal.weightedValue || 0).toLocaleString()} weighted</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-emerald-400">{deal.winProbability}%</span>
                    <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Detail Dialog */}
      <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deal Score Analysis</DialogTitle>
          </DialogHeader>
          {scoreDetail.data ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${probBg(scoreDetail.data.winProbability)}`}>
                  <span className={`text-3xl font-bold ${probColor(scoreDetail.data.winProbability)}`}>{scoreDetail.data.winProbability}%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Win Probability</p>
              </div>

              {/* Signal Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Engagement", value: scoreDetail.data.engagementSignal },
                  { label: "Response Time", value: scoreDetail.data.responseTimeSignal },
                  { label: "Meeting Frequency", value: scoreDetail.data.meetingFrequencySignal },
                  { label: "Stakeholder", value: scoreDetail.data.stakeholderSignal },
                  { label: "Competitive", value: scoreDetail.data.competitiveSignal },
                  { label: "Budget", value: scoreDetail.data.budgetSignal },
                  { label: "Timeline", value: scoreDetail.data.timelineSignal },
                  { label: "Champion", value: scoreDetail.data.championSignal },
                ].map((signal) => (
                  <div key={signal.label} className="bg-muted/30 rounded-lg p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{signal.label}</span>
                      <span className={`text-sm font-medium ${probColor(signal.value || 0)}`}>{signal.value || 0}</span>
                    </div>
                    <Progress value={signal.value || 0} className="h-1" />
                  </div>
                ))}
              </div>

              {/* AI Explanation */}
              {scoreDetail.data.aiExplanation && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <h4 className="text-sm font-semibold mb-1 flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" /> AI Analysis</h4>
                  <p className="text-sm text-muted-foreground">{scoreDetail.data.aiExplanation}</p>
                </div>
              )}

              {/* Risk & Positive Factors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-red-400">Risk Factors</h4>
                  {(scoreDetail.data.riskFactors as string[] || []).map((r: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm mb-1">
                      <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{r}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-emerald-400">Positive Indicators</h4>
                  {(scoreDetail.data.positiveIndicators as string[] || []).map((p: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm mb-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              {scoreDetail.data.recommendedActions && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Recommended Actions</h4>
                  {(scoreDetail.data.recommendedActions as string[] || []).map((a: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm mb-1">
                      <Zap className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{a}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Score History */}
              {(scoreHistory.data?.length || 0) > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Score History</h4>
                  <div className="flex items-end gap-1 h-16">
                    {scoreHistory.data?.map((h: any, i: number) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground">{h.winProbability}%</span>
                        <div className={`w-full rounded-t ${probBg(h.winProbability)}`} style={{ height: `${Math.max(4, h.winProbability * 0.6)}px` }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No score data available for this deal yet.</p>
              <Button className="mt-2" onClick={() => selectedDeal && scoreDeal.mutate({ dealId: selectedDeal })}>
                <Sparkles className="h-4 w-4 mr-2" /> Score This Deal
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
