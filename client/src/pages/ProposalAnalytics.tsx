import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Eye, Clock, TrendingUp, MousePointer, AlertCircle } from "lucide-react";

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ProposalAnalytics() {
  const [selectedProposalId] = useState(1);
  const { data: analytics, isLoading } = trpc.proposalAnalytics.getStats.useQuery({ proposalId: selectedProposalId });

  const totalViews = analytics?.totalViews ?? 0;
  const avgTime = analytics?.avgTimeSeconds ?? 0;
  const highEngagement = analytics ? Math.round((analytics.completionRate / 100) * analytics.totalViews) : 0;

  return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-500" />
            Proposal Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Track how prospects engage with your proposals</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalViews}</p>
                  <p className="text-xs text-muted-foreground">Total Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatDuration(avgTime)}</p>
                  <p className="text-xs text-muted-foreground">Avg. Time Spent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{highEngagement}</p>
                  <p className="text-xs text-muted-foreground">High Engagement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Proposal list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-24 bg-muted/30 rounded-xl" />
              </Card>
            ))}
          </div>
        ) : !analytics?.totalViews ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No proposal views yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Once prospects open your proposals, engagement data will appear here. Send proposals from the Proposals page.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {(analytics?.recentViews ?? []).map((a: { id: number; viewerEmail?: string | null; sessionId: string; totalTimeSeconds: number; scrollDepthPct: number; completed: boolean; viewedAt: number; sectionsViewed: unknown }) => {
              const sections = Array.isArray(a.sectionsViewed) ? (a.sectionsViewed as string[]) : [];
              const engagementScore = Math.min(100, Math.round((a.totalTimeSeconds / 300) * 100));
              const isHot = a.totalTimeSeconds > 120;
              return (
                <Card key={a.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Session {a.sessionId.slice(0, 8)}...</p>
                          <p className="text-xs text-muted-foreground">
                            Last viewed {timeAgo(a.viewedAt ?? Date.now())}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isHot && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                            🔥 Hot Lead
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          {a.scrollDepthPct}% scroll
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Time Spent</p>
                        <p className="font-semibold text-sm">{formatDuration(a.totalTimeSeconds)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Sections Viewed</p>
                        <p className="font-semibold text-sm">{sections.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Engagement Score</p>
                        <p className="font-semibold text-sm">{engagementScore}%</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Engagement</p>
                        <p className="text-xs font-medium">{engagementScore}%</p>
                      </div>
                      <Progress value={engagementScore} className="h-1.5" />
                    </div>
                    {sections.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {sections.map((s) => (
                          <Badge key={s} variant="outline" className="text-xs">
                            <MousePointer className="w-2.5 h-2.5 mr-1" />
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
  );
}
