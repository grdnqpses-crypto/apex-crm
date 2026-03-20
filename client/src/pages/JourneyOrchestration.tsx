import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, GitBranch, Play, Pause, Trash2, Users, Clock, Sparkles, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";

export default function JourneyOrchestration() {
  const { t } = useSkin();
  const utils = trpc.useUtils();
  const { data: journeys, isLoading } = trpc.journeyOrchestration.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", triggerType: "manual" as const });
  const [aiGoal, setAiGoal] = useState("");

  const createMutation = trpc.journeyOrchestration.create.useMutation({
    onSuccess: () => { utils.journeyOrchestration.list.invalidate(); setShowCreate(false); setForm({ name: "", description: "", triggerType: "manual" }); toast.success("Journey created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.journeyOrchestration.delete.useMutation({
    onSuccess: () => { utils.journeyOrchestration.list.invalidate(); toast.success("Journey deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.journeyOrchestration.update.useMutation({
    onSuccess: () => { utils.journeyOrchestration.list.invalidate(); toast.success("Journey updated"); },
    onError: (e) => toast.error(e.message),
  });
  const generateAIMutation = trpc.journeyOrchestration.generateWithAI.useMutation({
    onSuccess: () => { utils.journeyOrchestration.list.invalidate(); setShowAI(false); setAiGoal(""); toast.success("AI journey created"); },
    onError: (e) => toast.error(e.message),
  });

  const statusColor: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    paused: "bg-yellow-500/20 text-yellow-400",
    draft: "bg-gray-500/20 text-gray-400",
    archived: "bg-red-500/20 text-red-400",
  };

  const triggerLabels: Record<string, string> = {
    manual: "Manual",
    contact_created: "Contact Created",
    deal_stage: "Deal Stage",
    form_submit: "Form Submit",
    tag_added: "Tag Added",
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><GitBranch className="w-6 h-6 text-primary" /> Journey Orchestration</h1>
            <p className="text-muted-foreground mt-1">Visual customer journey maps with automated triggers, branching logic, and AI-generated workflows</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAI(true)} className="gap-2"><Sparkles className="w-4 h-4 text-purple-400" /> AI Generate</Button>
            <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> New Journey</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Journeys", value: journeys?.length ?? 0, icon: GitBranch, color: "text-blue-400" },
            { label: "Active", value: journeys?.filter((j: any) => j.status === "active").length ?? 0, icon: Play, color: "text-green-400" },
            { label: "Total Enrolled", value: journeys?.reduce((s: number, j: any) => s + (j.enrolledCount || 0), 0) ?? 0, icon: Users, color: "text-purple-400" },
            { label: "Completed", value: journeys?.reduce((s: number, j: any) => s + (j.completedCount || 0), 0) ?? 0, icon: CheckCircle2, color: "text-orange-400" },
          ].map(stat => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p><p className="text-2xl font-bold mt-1">{stat.value}</p></div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-60`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Journeys List */}
        <div className="space-y-3">
          {isLoading && <div className="text-center py-8 text-muted-foreground">Loading journeys...</div>}
          {!isLoading && (!journeys || journeys.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <GitBranch className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">No journeys yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Design automated customer journeys with branching logic and multi-channel touchpoints</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setShowAI(true)} className="gap-2"><Sparkles className="w-4 h-4 text-purple-400" /> Generate with AI</Button>
                  <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> Create Journey</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {journeys?.map((journey: any) => (
            <Card key={journey.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <GitBranch className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{journey.name}</span>
                        <Badge className={statusColor[journey.status] || "bg-gray-500/20 text-gray-400"}>{journey.status}</Badge>
                        <Badge variant="outline" className="text-xs">{triggerLabels[journey.triggerType] || journey.triggerType}</Badge>
                      </div>
                      {journey.description && <p className="text-sm text-muted-foreground mt-0.5">{journey.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1"><Circle className="w-3 h-3" />{journey.nodes?.length || 0} nodes</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{journey.enrolledCount || 0} enrolled</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{journey.completedCount || 0} completed</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(journey.createdAt).toLocaleDateString()}</span>
                      </div>
                      {/* Node preview */}
                      {journey.nodes && journey.nodes.length > 0 && (
                        <div className="flex items-center gap-1 mt-3 flex-wrap">
                          {journey.nodes.slice(0, 6).map((node: any, i: number) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="px-2 py-0.5 bg-muted rounded text-xs">{node.data?.label || node.type}</span>
                              {i < Math.min(5, journey.nodes.length - 1) && <span className="text-muted-foreground text-xs">→</span>}
                            </div>
                          ))}
                          {journey.nodes.length > 6 && <span className="text-xs text-muted-foreground">+{journey.nodes.length - 6} more</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {journey.status === "active" ? (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => updateMutation.mutate({ id: journey.id, status: "paused" })}><Pause className="w-3 h-3" /> Pause</Button>
                    ) : (
                      <Button size="sm" variant="outline" className="gap-1 text-green-400 border-green-400/30 hover:bg-green-400/10" onClick={() => updateMutation.mutate({ id: journey.id, status: "active" })}><Play className="w-3 h-3" /> Activate</Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate({ id: journey.id })}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Journey Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Customer Journey</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Journey Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. New Customer Onboarding" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What is this journey designed to achieve?" rows={2} /></div>
              <div><Label>Entry Trigger</Label>
                <Select value={form.triggerType} onValueChange={(v: any) => setForm({ ...form, triggerType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Enrollment</SelectItem>
                    <SelectItem value="contact_created">Contact Created</SelectItem>
                    <SelectItem value="deal_stage">Deal Stage Change</SelectItem>
                    <SelectItem value="form_submit">Form Submission</SelectItem>
                    <SelectItem value="tag_added">Tag Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Journey"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Generate Dialog */}
        <Dialog open={showAI} onOpenChange={setShowAI}>
          <DialogContent>
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-400" /> AI Journey Generator</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Describe your customer journey goal and our AI will design the optimal sequence of touchpoints, delays, and branching logic.</p>
              <div>
                <Label>Journey Goal</Label>
                <Textarea value={aiGoal} onChange={e => setAiGoal(e.target.value)} placeholder="e.g. Onboard new freight broker leads with 5 touchpoints over 2 weeks, including welcome email, product demo invite, follow-up call, case study, and close attempt" rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAI(false)}>Cancel</Button>
              <Button onClick={() => generateAIMutation.mutate({ goal: aiGoal, audience: 'prospects' })} disabled={!aiGoal || generateAIMutation.isPending} className="gap-2">
                <Sparkles className="w-4 h-4" />
                {generateAIMutation.isPending ? "Generating..." : "Generate Journey"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
