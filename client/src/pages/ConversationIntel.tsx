import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Headphones, Brain, TrendingUp, Clock, Upload, ChevronDown, ChevronUp, AlertTriangle, Users, Mic, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const SENTIMENT_COLOR = (s: number) => s >= 0.6 ? "text-green-400" : s >= 0.3 ? "text-yellow-400" : "text-red-400";
const SENTIMENT_LABEL = (s: number) => s >= 0.6 ? "Positive" : s >= 0.3 ? "Neutral" : "Negative";

export default function ConversationIntel() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadContactId, setUploadContactId] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const { data: recordings, isLoading } = trpc.conversationIntel.list.useQuery();
  const uploadRecording = trpc.conversationIntel.upload.useMutation({
    onSuccess: () => { toast.success("Recording uploaded — AI analysis starting"); setUploadOpen(false); setUploadFile(null); setUploadContactId(""); setUploadTitle(""); utils.conversationIntel.list.invalidate(); },
    onError: (e) => toast.error(e.message || "Upload failed"),
  });
  const triggerAnalysis = trpc.conversationIntel.analyze.useMutation({
    onSuccess: () => { toast.success("Analysis started"); utils.conversationIntel.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const handleUpload = () => {
    if (!uploadFile) { toast.error("Select a file first"); return; }
    if (!uploadTitle) { toast.error("Enter a call title"); return; }
    const reader = new FileReader();
    reader.onload = (e) => { const b64 = (e.target?.result as string).split(",")[1]; uploadRecording.mutate({ title: uploadTitle, contactId: uploadContactId ? parseInt(uploadContactId) : undefined, fileName: uploadFile.name, mimeType: uploadFile.type, base64Data: b64 }); };
    reader.readAsDataURL(uploadFile);
  };
  const stats = { total: recordings?.length ?? 0, analyzed: recordings?.filter((r: any) => r.analysisStatus === "completed").length ?? 0, avgSentiment: recordings?.length ? recordings.reduce((s: number, r: any) => s + (r.sentimentScore ?? 0.5), 0) / recordings.length : 0, pending: recordings?.filter((r: any) => r.analysisStatus === "pending" || r.analysisStatus === "processing").length ?? 0 };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="w-6 h-6 text-primary" /> Revenue Intelligence</h1>
            <p className="text-muted-foreground mt-1">AI call analysis: sentiment, objections, competitor mentions, coaching insights</p>
          </div>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild><Button className="gap-1.5"><Upload className="w-4 h-4" /> Upload Recording</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload Call Recording</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div><label className="text-sm font-medium">Call Title *</label><Input placeholder="e.g. Discovery call with Acme Corp" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} /></div>
                <div><label className="text-sm font-medium">Contact ID (optional)</label><Input type="number" placeholder="Link to a contact record" value={uploadContactId} onChange={e => setUploadContactId(e.target.value)} /></div>
                <div>
                  <label className="text-sm font-medium">Recording File *</label>
                  <div className="mt-1 border-2 border-dashed border-border/50 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                    {uploadFile ? (
                      <div><Mic className="w-8 h-8 text-primary mx-auto mb-2" /><p className="text-sm font-medium">{uploadFile.name}</p><p className="text-xs text-muted-foreground">{(uploadFile.size / 1024 / 1024).toFixed(1)} MB</p></div>
                    ) : (
                      <div><Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Click to select audio file</p><p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A, WebM · Max 16MB</p></div>
                    )}
                    <input ref={fileInputRef} type="file" accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg" className="hidden" onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />
                  </div>
                </div>
                <Button className="w-full" onClick={handleUpload} disabled={uploadRecording.isPending || !uploadFile || !uploadTitle}>{uploadRecording.isPending ? "Uploading..." : "Upload & Analyze"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Recordings", value: stats.total, icon: Headphones, color: "text-blue-400" },
            { label: "Analyzed", value: stats.analyzed, icon: Brain, color: "text-green-400" },
            { label: "Avg Sentiment", value: stats.total ? SENTIMENT_LABEL(stats.avgSentiment) : "N/A", icon: TrendingUp, color: SENTIMENT_COLOR(stats.avgSentiment) },
            { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-400" },
          ].map(s => (
            <Card key={s.label} className="border-border/50"><CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p><p className="text-xl font-bold mt-1">{s.value}</p></div>
              <s.icon className={`w-8 h-8 ${s.color} opacity-40`} />
            </CardContent></Card>
          ))}
        </div>

        <div className="space-y-3">
          {isLoading && <p className="text-muted-foreground text-sm animate-pulse">Loading recordings...</p>}
          {!isLoading && (!recordings || recordings.length === 0) && (
            <Card className="border-border/50"><CardContent className="py-12 text-center">
              <Headphones className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="font-medium">No recordings yet</p>
              <p className="text-sm text-muted-foreground mt-1">Upload your first call recording to get AI-powered insights</p>
            </CardContent></Card>
          )}
          {recordings?.map((rec: any) => (
            <Card key={rec.id} className="border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <button className="w-full text-left px-5 py-4 hover:bg-muted/20 transition-colors" onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${rec.analysisStatus === "completed" ? "bg-green-500/20" : rec.analysisStatus === "processing" ? "bg-blue-500/20" : "bg-muted"}`}>
                        {rec.analysisStatus === "completed" ? <Brain className="w-4 h-4 text-green-400" /> : rec.analysisStatus === "processing" ? <Clock className="w-4 h-4 text-blue-400 animate-spin" /> : <Mic className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{rec.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(rec.createdAt).toLocaleDateString()}{rec.duration ? ` · ${Math.round(rec.duration / 60)}m` : ""}{rec.contactId ? ` · Contact #${rec.contactId}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={rec.analysisStatus === "completed" ? "bg-green-500/20 text-green-400 text-xs" : rec.analysisStatus === "processing" ? "bg-blue-500/20 text-blue-400 text-xs" : rec.analysisStatus === "failed" ? "bg-red-500/20 text-red-400 text-xs" : "bg-yellow-500/20 text-yellow-400 text-xs"}>{rec.analysisStatus}</Badge>
                      {rec.sentimentScore != null && <span className={`text-xs font-medium ${SENTIMENT_COLOR(rec.sentimentScore)}`}>{SENTIMENT_LABEL(rec.sentimentScore)}</span>}
                      {rec.analysisStatus === "pending" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={e => { e.stopPropagation(); triggerAnalysis.mutate({ recordingId: rec.id }); }}>Analyze</Button>}
                      {expandedId === rec.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </button>
                {expandedId === rec.id && rec.analysisStatus === "completed" && (
                  <div className="px-5 pb-5 pt-2 border-t border-border/30 space-y-4">
                    {rec.talkRatio != null && <div><div className="flex items-center justify-between mb-1.5"><span className="text-xs font-medium flex items-center gap-1"><Users className="w-3 h-3" /> Talk Ratio</span><span className="text-xs text-muted-foreground">Rep {Math.round(rec.talkRatio * 100)}% · Customer {Math.round((1 - rec.talkRatio) * 100)}%</span></div><Progress value={rec.talkRatio * 100} className="h-2" /></div>}
                    {rec.sentimentScore != null && <div><div className="flex items-center justify-between mb-1.5"><span className="text-xs font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Sentiment</span><span className={`text-xs font-medium ${SENTIMENT_COLOR(rec.sentimentScore)}`}>{(rec.sentimentScore * 100).toFixed(0)}%</span></div><Progress value={rec.sentimentScore * 100} className="h-2" /></div>}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {rec.objections?.length > 0 && <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20"><p className="text-xs font-medium text-red-400 flex items-center gap-1 mb-2"><AlertTriangle className="w-3 h-3" /> Objections ({rec.objections.length})</p><ul className="space-y-1">{rec.objections.map((o: string, i: number) => <li key={i} className="text-xs text-muted-foreground">· {o}</li>)}</ul></div>}
                      {rec.competitorMentions?.length > 0 && <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20"><p className="text-xs font-medium text-yellow-400 flex items-center gap-1 mb-2"><BarChart3 className="w-3 h-3" /> Competitors</p><ul className="space-y-1">{rec.competitorMentions.map((c: string, i: number) => <li key={i} className="text-xs text-muted-foreground">· {c}</li>)}</ul></div>}
                      {rec.actionItems?.length > 0 && <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20"><p className="text-xs font-medium text-blue-400 flex items-center gap-1 mb-2"><Clock className="w-3 h-3" /> Action Items</p><ul className="space-y-1">{rec.actionItems.map((a: string, i: number) => <li key={i} className="text-xs text-muted-foreground">· {a}</li>)}</ul></div>}
                    </div>
                    {rec.summary && <div className="p-3 rounded-lg bg-muted/30"><p className="text-xs font-medium mb-1.5">AI Summary</p><p className="text-xs text-muted-foreground leading-relaxed">{rec.summary}</p></div>}
                    {rec.coachingTips?.length > 0 && <div className="p-3 rounded-lg bg-primary/5 border border-primary/20"><p className="text-xs font-medium text-primary mb-2">Coaching Insights</p><ul className="space-y-1">{rec.coachingTips.map((tip: string, i: number) => <li key={i} className="text-xs text-muted-foreground">💡 {tip}</li>)}</ul></div>}
                  </div>
                )}
                {expandedId === rec.id && rec.analysisStatus === "pending" && <div className="px-5 pb-4 pt-2 border-t border-border/30"><p className="text-sm text-muted-foreground">Click Analyze to process this recording.</p></div>}
                {expandedId === rec.id && rec.analysisStatus === "processing" && <div className="px-5 pb-4 pt-2 border-t border-border/30"><p className="text-sm text-muted-foreground animate-pulse">AI is analyzing... This may take a minute.</p></div>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
