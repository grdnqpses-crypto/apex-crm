import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Brain, Zap, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

const URGENCY_COLOR: Record<string, string> = {
  critical: "text-red-600",
  high: "text-orange-500",
  medium: "text-yellow-600",
  low: "text-green-600",
};

const CHANNEL_ICON: Record<string, string> = {
  email: "📧",
  phone: "📞",
  meeting: "🤝",
  linkedin: "💼",
  demo: "🖥️",
  proposal: "📄",
};

export default function AINextBestAction() {
  const { t } = useSkin();
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  const [enabled, setEnabled] = useState(false);

  const { data: deals, isLoading: dealsLoading } = trpc.deals.list.useQuery({ limit: 50 });
  const { data: aiResult, isFetching: analyzing } = trpc.nextBestAction.getForDeal.useQuery(
    { dealId: selectedDealId! },
    { enabled: enabled && selectedDealId !== null, staleTime: 0 }
  );

  const handleAnalyze = (dealId: number) => {
    setSelectedDealId(dealId);
    setEnabled(true);
  };

  const openDeals = (deals as { items?: { id: number; name: string; value: number | null; currency: string | null; status: string; expectedCloseDate: number | null }[] } | undefined)?.items?.filter((d) => d.status === "open") ?? [];

  return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            AI Next Best Action
          </h1>
          <p className="text-muted-foreground mt-1">Get AI-powered coaching on your most important deals</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deal Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select a Deal to Analyze</CardTitle>
            </CardHeader>
            <CardContent>
              {dealsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded bg-muted animate-pulse" />)}
                </div>
              ) : openDeals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No open deals found.</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {openDeals.map((deal) => (
                    <button
                      key={deal.id}
                      onClick={() => handleAnalyze(deal.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all hover:border-primary/50 hover:bg-accent/50 ${selectedDealId === deal.id ? "border-primary bg-primary/5" : "bg-card"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{deal.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {deal.value ? new Intl.NumberFormat("en-US", { style: "currency", currency: deal.currency ?? "USD", maximumFractionDigits: 0 }).format(deal.value) : "No value"}
                          </p>
                        </div>
                        {analyzing && selectedDealId === deal.id ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground ml-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Analysis Result */}
          <div className="space-y-4">
            {!aiResult && !analyzing && (
              <Card>
                <CardContent className="py-16 text-center">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a deal on the left to get AI-powered coaching</p>
                </CardContent>
              </Card>
            )}

            {analyzing && (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-medium">Analyzing deal...</p>
                  <p className="text-sm text-muted-foreground mt-1">The AI is reviewing deal history, contact info, and market signals</p>
                </CardContent>
              </Card>
            )}

            {aiResult && (
              <>
                {/* Deal Health Score */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Deal Health Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold" style={{ color: aiResult.dealHealthScore >= 70 ? "#16a34a" : aiResult.dealHealthScore >= 40 ? "#d97706" : "#dc2626" }}>
                          {aiResult.dealHealthScore}/100
                        </span>
                        <Badge variant={aiResult.dealHealthScore >= 70 ? "default" : aiResult.dealHealthScore >= 40 ? "secondary" : "destructive"}>
                          {aiResult.dealHealthScore >= 70 ? "Healthy" : aiResult.dealHealthScore >= 40 ? "At Risk" : "Critical"}
                        </Badge>
                      </div>
                      <Progress value={aiResult.dealHealthScore} className="h-2" />
                    </div>
                    {aiResult.riskFlags.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {aiResult.riskFlags.map((flag, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-orange-600">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            {flag}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recommended Actions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Recommended Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiResult.actions.sort((a, b) => a.priority - b.priority).map((action, i) => (
                        <div key={i} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-start gap-3">
                            <span className="text-xl">{CHANNEL_ICON[action.channel] ?? "📌"}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">#{action.priority} {action.action}</span>
                                <span className={`text-xs font-medium ${URGENCY_COLOR[action.urgency] ?? "text-muted-foreground"}`}>
                                  {action.urgency}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{action.reason}</p>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          </div>
                        </div>
                      ))}
                    </div>
              <Button className="w-full mt-4" variant="outline" onClick={() => { setEnabled(false); setTimeout(() => { setEnabled(true); }, 100); }}>
                <Brain className="w-4 h-4 mr-2" />
                Re-analyze
              </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
  );
}
