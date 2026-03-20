import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Headphones, Brain, TrendingUp, Clock, MessageSquare } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

export default function ConversationIntel() {
  const { t } = useSkin();
  const recordings = trpc.conversationIntel.list.useQuery();

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Conversation Intelligence</h1><p className="text-muted-foreground">AI analysis of call recordings — sentiment, talk ratio, action items, coaching insights</p></div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Recordings", value: recordings.data?.length || 0, icon: Headphones, color: "text-blue-400" },
          { label: "Analyzed", value: recordings.data?.filter((r: any) => r.analysisStatus === "completed").length || 0, icon: Brain, color: "text-green-400" },
          { label: "Avg Sentiment", value: recordings.data?.length ? (recordings.data.reduce((s: number, r: any) => s + (r.sentimentScore || 0), 0) / recordings.data.length).toFixed(1) : "N/A", icon: TrendingUp, color: "text-purple-400" },
          { label: "Pending", value: recordings.data?.filter((r: any) => r.analysisStatus === "pending").length || 0, icon: Clock, color: "text-yellow-400" },
        ].map(s => (
          <Card key={s.label} className="border-border/50"><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
            <s.icon className={`w-8 h-8 ${s.color} opacity-50`} />
          </CardContent></Card>
        ))}
      </div>

      <div className="space-y-3">
        {recordings.data?.map((rec: any) => (
          <Card key={rec.id} className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Headphones className="w-5 h-5 text-primary" /></div>
                <div>
                  <div className="flex items-center gap-2"><span className="font-semibold">Call #{rec.id}</span>
                    <Badge className={rec.analysisStatus === "completed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>{rec.analysisStatus}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    {rec.duration && <span>{Math.round(rec.duration / 60)}min</span>}
                    {rec.talkRatio && <span>Talk: {rec.talkRatio}%</span>}
                    {rec.sentimentScore !== null && <span>Sentiment: {rec.sentimentScore}/10</span>}
                  </div>
                </div>
              </div>
              {rec.actionItems && <div className="text-right"><p className="text-xs text-muted-foreground">Action Items</p><p className="font-medium">{JSON.parse(String(rec.actionItems || "[]")).length}</p></div>}
            </CardContent>
          </Card>
        ))}
        {(!recordings.data || recordings.data.length === 0) && (
          <Card className="border-dashed"><CardContent className="p-12 text-center"><Headphones className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" /><h3 className="text-lg font-medium">No recordings yet</h3><p className="text-sm text-muted-foreground mt-1">Voice Agent calls will automatically appear here for AI analysis</p></CardContent></Card>
        )}
      </div>
    </div>
  );
}
