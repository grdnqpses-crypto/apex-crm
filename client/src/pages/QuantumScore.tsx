import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Brain, Zap, Target, TrendingUp, Clock, MessageSquare, Star, ChevronRight, Loader2, Sparkles } from "lucide-react";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";
import { useSkin } from "@/contexts/SkinContext";


const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-emerald-400', 'A': 'text-emerald-500', 'B+': 'text-blue-400', 'B': 'text-blue-500',
  'C+': 'text-yellow-400', 'C': 'text-yellow-500', 'D': 'text-orange-500', 'F': 'text-red-500',
};

export default function QuantumScore() {
  const { t } = useSkin();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const prospects = trpc.prospects.list.useQuery({ limit: 50 });
  const selectedScore = trpc.quantumScore.get.useQuery({ prospectId: selectedId! }, { enabled: !!selectedId });
  const calculate = trpc.quantumScore.calculate.useMutation({
    onSuccess: () => { toast.success("Quantum Score calculated"); },
    onError: (e) => toast.error(e.message),
  });

  const scoreItems = prospects.data?.items?.filter((p: any) => p.score && p.score > 0) || [];
  const unscored = prospects.data?.items?.filter((p: any) => !p.score || p.score === 0) || [];

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.quantumScore} />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="h-6 w-6 text-purple-500" /> Quantum Lead Scoring</h1>
        <p className="text-muted-foreground mt-1">AI-powered 12-dimension prospect scoring with predictive conversion analysis and optimal outreach timing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Prospect List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scored Prospects ({scoreItems.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
              {scoreItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No scored prospects yet. Select a prospect below to calculate.</p>
              ) : (
                scoreItems.map((p: any) => (
                  <div key={p.id} onClick={() => setSelectedId(p.id)} className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedId === p.id ? 'border-purple-500 bg-purple-500/5' : 'hover:bg-muted/50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-muted-foreground">{p.companyName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{p.score}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Unscored Prospects ({unscored.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
              {unscored.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-muted-foreground">{p.companyName}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setSelectedId(p.id); calculate.mutate({ prospectId: p.id }); }} disabled={calculate.isPending}>
                    {calculate.isPending && calculate.variables?.prospectId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Score Detail */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedId ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <p className="text-lg font-medium text-muted-foreground">Select a prospect to view their Quantum Score</p>
                <p className="text-sm text-muted-foreground mt-1">Or calculate a new score from the unscored list</p>
              </CardContent>
            </Card>
          ) : selectedScore.isLoading ? (
            <Card><CardContent className="py-16 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></CardContent></Card>
          ) : !selectedScore.data ? (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">No score data yet for this prospect.</p>
                <Button className="mt-4" onClick={() => calculate.mutate({ prospectId: selectedId })} disabled={calculate.isPending}>
                  {calculate.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Calculating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Calculate Quantum Score</>}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Score Header */}
              <Card className={`border-2 ${(selectedScore.data.totalScore || 0) >= 70 ? 'border-emerald-500' : (selectedScore.data.totalScore || 0) >= 40 ? 'border-yellow-500' : 'border-red-500'}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Quantum Score</p>
                      <p className="text-5xl font-bold">{selectedScore.data.totalScore || 0}</p>
                      <p className="text-sm text-muted-foreground mt-1">{selectedScore.data.scoreExplanation}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-4xl font-bold ${GRADE_COLORS[selectedScore.data.scoreGrade || 'C'] || 'text-muted-foreground'}`}>{selectedScore.data.scoreGrade}</p>
                      <Badge variant="outline" className="mt-2">Updated {new Date(selectedScore.data.createdAt).toLocaleDateString()}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 12 Dimensions */}
              <Card>
                <CardHeader><CardTitle className="text-base">12-Dimension Analysis</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { key: 'firmographicScore', label: 'Firmographic', icon: Target },
                      { key: 'behavioralScore', label: 'Behavioral', icon: TrendingUp },
                      { key: 'engagementScore', label: 'Engagement', icon: MessageSquare },
                      { key: 'timingScore', label: 'Timing', icon: Clock },
                      { key: 'socialScore', label: 'Social', icon: Star },
                      { key: 'contentScore', label: 'Content', icon: Zap },
                      { key: 'recencyScore', label: 'Recency', icon: Clock },
                      { key: 'frequencyScore', label: 'Frequency', icon: TrendingUp },
                      { key: 'monetaryScore', label: 'Monetary', icon: Target },
                      { key: 'channelScore', label: 'Channel', icon: MessageSquare },
                      { key: 'intentScore', label: 'Intent', icon: Brain },
                      { key: 'relationshipScore', label: 'Relationship', icon: Star },
                    ].map(({ key, label, icon: Icon }) => {
                      const val = (selectedScore.data as any)?.[key] || 0;
                      const color = val >= 70 ? 'text-emerald-500' : val >= 40 ? 'text-yellow-500' : 'text-red-500';
                      return (
                        <div key={key} className="p-3 rounded-lg border">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{label}</span>
                          </div>
                          <p className={`text-2xl font-bold ${color}`}>{val}</p>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                            <div className={`h-1.5 rounded-full ${val >= 70 ? 'bg-emerald-500' : val >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${val}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Predictions & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Predictions</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Conversion Probability</span><span className="font-bold">{selectedScore.data.predictedConversionProb || 0}%</span></div>
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Predicted Deal Value</span><span className="font-bold">${(selectedScore.data.predictedDealValue || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Optimal Contact Time</span><span className="font-bold">{selectedScore.data.optimalContactTime || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Optimal Channel</span><span className="font-bold">{selectedScore.data.optimalChannel || 'N/A'}</span></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Strengths & Weaknesses</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Top Strengths</p>
                      {(Array.isArray(selectedScore.data.topStrengths) ? selectedScore.data.topStrengths : typeof selectedScore.data.topStrengths === 'string' ? JSON.parse(selectedScore.data.topStrengths) : []).map((s: string, i: number) => (
                        <p key={i} className="text-sm text-emerald-500">+ {s}</p>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Top Weaknesses</p>
                      {(Array.isArray(selectedScore.data.topWeaknesses) ? selectedScore.data.topWeaknesses : typeof selectedScore.data.topWeaknesses === 'string' ? JSON.parse(selectedScore.data.topWeaknesses) : []).map((w: string, i: number) => (
                        <p key={i} className="text-sm text-red-400">- {w}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommended Actions */}
              <Card>
                <CardHeader><CardTitle className="text-base">AI Recommended Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(Array.isArray(selectedScore.data.recommendedActions) ? selectedScore.data.recommendedActions : typeof selectedScore.data.recommendedActions === 'string' ? JSON.parse(selectedScore.data.recommendedActions) : []).map((a: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                      <Zap className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                      <p className="text-sm">{a}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Button className="w-full" onClick={() => calculate.mutate({ prospectId: selectedId })} disabled={calculate.isPending}>
                {calculate.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Recalculating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Recalculate Quantum Score</>}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
