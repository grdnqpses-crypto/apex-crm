import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Brain, Mail, MessageSquare, BarChart3, Search, Mic, Image, TrendingUp } from "lucide-react";

const FEATURE_ICONS: Record<string, React.ElementType> = {
  "quantum_score": Brain,
  "email_writer": Mail,
  "ai_chat": MessageSquare,
  "report_insights": BarChart3,
  "prospect_search": Search,
  "voice_transcription": Mic,
  "image_generation": Image,
  "win_probability": TrendingUp,
  "next_best_action": Zap,
};

export default function AICreditUsage() {
  const { data: usage, isLoading } = trpc.aiCreditUsage.getBreakdown.useQuery({});

  const totalCredits = usage?.reduce((s: number, u: { totalCredits: number }) => s + u.totalCredits, 0) ?? 0;
  const totalQueries = usage?.reduce((s: number, u: { totalQueries: number }) => s + u.totalQueries, 0) ?? 0;
  const topFeature = usage?.slice().sort((a: { totalCredits: number }, b: { totalCredits: number }) => b.totalCredits - a.totalCredits)[0];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            AI Credit Usage Breakdown
          </h1>
          <p className="text-muted-foreground mt-1">See exactly which features are consuming your AI credits</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCredits.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Credits Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalQueries.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total AI Queries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{topFeature?.featureName ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Top Feature</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage by Feature</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted/50 rounded w-1/3" />
                    <div className="h-2 bg-muted/50 rounded" />
                  </div>
                ))}
              </div>
            ) : !usage?.length ? (
              <div className="text-center py-12">
                <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No AI credit usage recorded yet for this period.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {usage
                  .slice().sort((a: { totalCredits: number }, b: { totalCredits: number }) => b.totalCredits - a.totalCredits)
                  .map((u: { featureKey: string; featureName: string; totalCredits: number; totalQueries: number }) => {
                    const pct = totalCredits > 0 ? Math.round((u.totalCredits / totalCredits) * 100) : 0;
                    const Icon = FEATURE_ICONS[u.featureKey] ?? Zap;
                    const avgPerQuery = u.totalQueries > 0
                      ? Math.round(u.totalCredits / u.totalQueries)
                      : 0;
                    return (
                      <div key={u.featureKey} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{u.featureName}</span>
                            <Badge variant="secondary" className="text-xs">{u.totalQueries} queries</Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{avgPerQuery} credits/query</span>
                            <span className="font-semibold text-sm">{u.totalCredits.toLocaleString()} credits</span>
                            <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
