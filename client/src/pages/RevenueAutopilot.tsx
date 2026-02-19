import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Rocket, DollarSign, TrendingUp, AlertTriangle, Sparkles,
  RefreshCw, ArrowUpRight, Clock, CheckCircle2, Zap, BarChart3
} from "lucide-react";

const priorityColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

const actionTypeIcons: Record<string, typeof Zap> = {
  follow_up: Clock,
  close: CheckCircle2,
  upsell: TrendingUp,
  rescue: AlertTriangle,
  nurture: Sparkles,
};

export default function RevenueAutopilot() {
  const [isGenerating, setIsGenerating] = useState(false);

  const briefings = trpc.revenueBriefings.list.useQuery();
  const generateBriefing = trpc.revenueBriefings.generate.useMutation({
    onSuccess: () => { briefings.refetch(); setIsGenerating(false); toast.success("Revenue briefing generated"); },
    onError: () => { setIsGenerating(false); toast.error("Failed to generate briefing"); },
  });

  const latestBriefing = briefings.data?.[0];
  const actions = latestBriefing?.actions as any[] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="h-7 w-7 text-primary" />
            Revenue Autopilot
          </h1>
          <p className="text-muted-foreground mt-1">AI-powered daily revenue briefings with prioritized action plans</p>
        </div>
        <Button onClick={() => { setIsGenerating(true); generateBriefing.mutate(); }} disabled={isGenerating}>
          <Sparkles className="h-4 w-4 mr-2" /> {isGenerating ? "Generating..." : "Generate Briefing"}
        </Button>
      </div>

      {/* Revenue Summary */}
      {latestBriefing ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50 border-l-4 border-l-red-500">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-xs text-muted-foreground">Revenue at Risk</span>
                </div>
                <p className="text-2xl font-bold text-red-400">${(latestBriefing.revenueAtRisk || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 border-l-4 border-l-emerald-500">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-muted-foreground">Revenue Opportunity</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">${(latestBriefing.revenueOpportunity || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 border-l-4 border-l-primary">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Actions Today</span>
                </div>
                <p className="text-2xl font-bold text-primary">{actions.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* AI Summary */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Daily Intelligence Brief
              </CardTitle>
              <CardDescription>Generated {new Date(latestBriefing.createdAt).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{latestBriefing.summary}</p>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" /> Prioritized Actions
              </CardTitle>
              <CardDescription>AI-recommended actions ranked by revenue impact</CardDescription>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No actions needed right now. Generate a new briefing to refresh.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actions.map((action: any, i: number) => {
                    const Icon = actionTypeIcons[action.type] || Zap;
                    return (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${priorityColors[action.priority] || priorityColors.medium}`}>
                        <div className="h-8 w-8 rounded-lg bg-background/50 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="outline" className="text-xs capitalize">{action.type?.replace(/_/g, ' ')}</Badge>
                            <Badge className={`text-xs ${priorityColors[action.priority] || ''}`}>{action.priority}</Badge>
                          </div>
                          <p className="text-sm">{action.description}</p>
                          {action.estimatedRevenue > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <DollarSign className="h-3 w-3" /> Est. revenue impact: ${action.estimatedRevenue.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Previous Briefings */}
          {(briefings.data?.length || 0) > 1 && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Previous Briefings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {briefings.data?.slice(1).map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{b.briefingDate}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-md">{b.summary?.substring(0, 100)}...</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-red-400">${(b.revenueAtRisk || 0).toLocaleString()} risk</span>
                        <span className="text-emerald-400">${(b.revenueOpportunity || 0).toLocaleString()} opp</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="py-16 text-center">
            <Rocket className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Revenue Briefings Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Generate your first AI-powered revenue briefing to get personalized action plans based on your pipeline data</p>
            <Button size="lg" onClick={() => { setIsGenerating(true); generateBriefing.mutate(); }} disabled={isGenerating}>
              <Sparkles className="h-5 w-5 mr-2" /> {isGenerating ? "Generating..." : "Generate First Briefing"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
