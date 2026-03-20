import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Phone, Plus, Play, Pause, SkipForward, PhoneCall, PhoneOff, Clock, Users, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function PowerDialer() {
  const utils = trpc.useUtils();
  const { data: sessions, isLoading } = trpc.powerDialer.getSessions.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [showScript, setShowScript] = useState<any>(null);
  const [form, setForm] = useState({ name: "", contactIds: "", scriptTemplate: "" });
  const [scriptPrompt, setScriptPrompt] = useState("");

  const createMutation = trpc.powerDialer.createSession.useMutation({
    onSuccess: () => {
      utils.powerDialer.getSessions.invalidate();
      setShowCreate(false);
      setForm({ name: "", contactIds: "", scriptTemplate: "" });
      toast.success("Dialer session created");
    },
    onError: (e) => toast.error(e.message),
  });
  const advanceMutation = trpc.powerDialer.advanceSession.useMutation({
    onSuccess: () => { utils.powerDialer.getSessions.invalidate(); toast.success("Advanced to next contact"); },
    onError: (e) => toast.error(e.message),
  });
  const pauseMutation = trpc.powerDialer.pauseSession.useMutation({
    onSuccess: () => { utils.powerDialer.getSessions.invalidate(); toast.success("Session paused"); },
    onError: (e) => toast.error(e.message),
  });
  const resumeMutation = trpc.powerDialer.resumeSession.useMutation({
    onSuccess: () => { utils.powerDialer.getSessions.invalidate(); toast.success("Session resumed"); },
    onError: (e) => toast.error(e.message),
  });
  const generateScriptMutation = trpc.powerDialer.generateScript.useMutation({
    onSuccess: (data) => { setForm(prev => ({ ...prev, scriptTemplate: data.script || prev.scriptTemplate })); toast.success("Script generated"); },
    onError: (e) => toast.error(e.message),
  });

  const sessionList = sessions as any[] || [];
  const activeSessions = sessionList.filter((s: any) => s.status === "active");
  const totalCalls = sessionList.reduce((sum: number, s: any) => sum + (s.currentIndex || 0), 0);

  const statusColor: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    paused: "bg-yellow-500/20 text-yellow-400",
    completed: "bg-blue-500/20 text-blue-400",
    draft: "bg-gray-500/20 text-gray-400",
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Phone className="w-6 h-6 text-primary" /> Power Dialer</h1>
            <p className="text-muted-foreground mt-1">High-velocity calling sessions with AI-generated scripts, auto-advance, and outcome tracking</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> New Session</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Sessions", value: sessionList.length, icon: Phone, color: "text-blue-400" },
            { label: "Active Now", value: activeSessions.length, icon: PhoneCall, color: "text-green-400" },
            { label: "Calls Made", value: totalCalls, icon: CheckCircle2, color: "text-purple-400" },
            { label: "Completed", value: sessionList.filter((s: any) => s.status === "completed").length, icon: CheckCircle2, color: "text-orange-400" },
          ].map(stat => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p><p className="text-2xl font-bold mt-1">{stat.value}</p></div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-60`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sessions List */}
        <div className="space-y-3">
          {isLoading && <div className="text-center py-8 text-muted-foreground">Loading sessions...</div>}
          {!isLoading && sessionList.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Phone className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">No dialer sessions yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Create a power dialer session to call through a list of contacts with AI-generated scripts</p>
                <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> Create First Session</Button>
              </CardContent>
            </Card>
          )}
          {sessionList.map((session: any) => {
            const contactList = session.contactIds as number[] || [];
            const progress = contactList.length > 0 ? Math.round((session.currentIndex / contactList.length) * 100) : 0;
            return (
              <Card key={session.id} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{session.name}</span>
                        <Badge className={statusColor[session.status] || "bg-gray-500/20 text-gray-400"}>{session.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{contactList.length} contacts</span>
                        <span className="flex items-center gap-1"><PhoneCall className="w-3 h-3" />{session.currentIndex || 0} called</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(session.createdAt).toLocaleDateString()}</span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{progress}% complete ({session.currentIndex || 0} / {contactList.length})</p>
                      {session.scriptTemplate && (
                        <button onClick={() => setShowScript(session)} className="text-xs text-primary hover:underline mt-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> View Script
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {session.status === "active" && (
                        <>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => advanceMutation.mutate({ sessionId: session.id, outcome: "no_answer" })}><SkipForward className="w-3 h-3" /> Skip</Button>
                          <Button size="sm" variant="outline" className="gap-1 text-green-400 border-green-400/30 hover:bg-green-400/10" onClick={() => advanceMutation.mutate({ sessionId: session.id, outcome: "connected" })}><PhoneCall className="w-3 h-3" /> Connected</Button>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => pauseMutation.mutate({ sessionId: session.id })}><Pause className="w-3 h-3" /> Pause</Button>
                        </>
                      )}
                      {session.status === "paused" && (
                        <Button size="sm" variant="outline" className="gap-1 text-green-400 border-green-400/30 hover:bg-green-400/10" onClick={() => resumeMutation.mutate({ sessionId: session.id })}><Play className="w-3 h-3" /> Resume</Button>
                      )}
                      {session.status === "draft" && (
                        <Button size="sm" variant="outline" className="gap-1 text-green-400 border-green-400/30 hover:bg-green-400/10" onClick={() => resumeMutation.mutate({ sessionId: session.id })}><Play className="w-3 h-3" /> Start</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Create Session Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Power Dialer Session</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Session Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Q1 Prospect Outreach" /></div>
              <div>
                <Label>Contact IDs (comma-separated)</Label>
                <Input value={form.contactIds} onChange={e => setForm({ ...form, contactIds: e.target.value })} placeholder="1, 2, 3, 45, 67..." />
                <p className="text-xs text-muted-foreground mt-1">Enter contact IDs to include in this dialing session</p>
              </div>
              <div>
                <Label>Call Script</Label>
                <Textarea value={form.scriptTemplate} onChange={e => setForm({ ...form, scriptTemplate: e.target.value })} placeholder="Write your call script here..." rows={5} />
              </div>
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                <Input value={scriptPrompt} onChange={e => setScriptPrompt(e.target.value)} placeholder="Describe your call goal for AI script generation..." className="border-0 bg-transparent p-0 focus-visible:ring-0 text-sm" />
                <Button size="sm" variant="outline" disabled={!scriptPrompt || generateScriptMutation.isPending} onClick={() => generateScriptMutation.mutate({ purpose: scriptPrompt, productService: 'CRM Software', targetAudience: 'Sales Teams' })}>
                  <Sparkles className="w-3 h-3 mr-1" /> Generate
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate({
                name: form.name,
                contactIds: form.contactIds.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n)),
                script: form.scriptTemplate || undefined,
              })} disabled={!form.name || createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Session"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Script Viewer Dialog */}
        <Dialog open={!!showScript} onOpenChange={() => setShowScript(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Call Script — {showScript?.name}</DialogTitle></DialogHeader>
            <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">{showScript?.scriptTemplate || "No script"}</pre>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowScript(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
