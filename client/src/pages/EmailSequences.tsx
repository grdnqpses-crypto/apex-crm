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
import { Plus, Mail, Play, Pause, Trash2, Edit, Users, Clock, Sparkles, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function EmailSequences() {
  const utils = trpc.useUtils();
  const { data: sequences, isLoading } = trpc.emailSequences.list.useQuery();
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);
  const [expandedSeq, setExpandedSeq] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", triggerType: "manual" as const });
  const [stepForm, setStepForm] = useState({ subject: "", body: "", delayDays: 1, delayHours: 0, stepType: "email" as const });
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const createMutation = trpc.emailSequences.create.useMutation({
    onSuccess: () => { utils.emailSequences.list.invalidate(); setShowCreate(false); setForm({ name: "", description: "", triggerType: "manual" }); toast.success("Sequence created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.emailSequences.delete.useMutation({
    onSuccess: () => { utils.emailSequences.list.invalidate(); toast.success("Sequence deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.emailSequences.update.useMutation({
    onSuccess: () => { utils.emailSequences.list.invalidate(); toast.success("Updated"); },
    onError: (e) => toast.error(e.message),
  });
  const addStepMutation = trpc.emailSequences.addStep.useMutation({
    onSuccess: () => { utils.emailSequences.list.invalidate(); setShowAddStep(false); setStepForm({ subject: "", body: "", delayDays: 1, delayHours: 0, stepType: "email" }); toast.success("Step added"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteStepMutation = trpc.emailSequences.deleteStep.useMutation({
    onSuccess: () => { utils.emailSequences.list.invalidate(); toast.success("Step removed"); },
    onError: (e) => toast.error(e.message),
  });
  const generateAIMutation = trpc.emailSequences.generateStepWithAI.useMutation({
    onSuccess: (data) => {
      setStepForm(prev => ({ ...prev, subject: data.subject || prev.subject, body: data.body || prev.body }));
      toast.success("AI generated step content");
    },
    onError: (e) => toast.error(e.message),
  });

  const statusColor: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    paused: "bg-yellow-500/20 text-yellow-400",
    draft: "bg-gray-500/20 text-gray-400",
    archived: "bg-red-500/20 text-red-400",
  };

  const totalEnrolled = sequences?.reduce((s: number, seq: any) => s + (seq.enrolledCount || 0), 0) ?? 0;
  const totalActive = sequences?.filter((s: any) => s.status === "active").length ?? 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="w-6 h-6 text-primary" /> Email Sequences</h1>
            <p className="text-muted-foreground mt-1">Automated multi-step email cadences with AI-generated content and reply detection</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> New Sequence</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Sequences", value: sequences?.length ?? 0, icon: Mail, color: "text-blue-400" },
            { label: "Active", value: totalActive, icon: Play, color: "text-green-400" },
            { label: "Total Enrolled", value: totalEnrolled, icon: Users, color: "text-purple-400" },
            { label: "Avg Steps", value: sequences?.length ? (sequences.reduce((s: number, seq: any) => s + (seq.steps?.length || 0), 0) / sequences.length).toFixed(1) : "0", icon: ArrowRight, color: "text-orange-400" },
          ].map(stat => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p><p className="text-2xl font-bold mt-1">{stat.value}</p></div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-60`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sequences List */}
        <div className="space-y-3">
          {isLoading && <div className="text-center py-8 text-muted-foreground">Loading sequences...</div>}
          {!isLoading && (!sequences || sequences.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Mail className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">No sequences yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Create automated email cadences to nurture leads through your pipeline</p>
                <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> Create First Sequence</Button>
              </CardContent>
            </Card>
          )}
          {sequences?.map((seq: any) => (
            <Card key={seq.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setExpandedSeq(expandedSeq === seq.id ? null : seq.id)} className="text-muted-foreground hover:text-foreground">
                      {expandedSeq === seq.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{seq.name}</span>
                        <Badge className={statusColor[seq.status] || "bg-gray-500/20 text-gray-400"}>{seq.status}</Badge>
                        <Badge variant="outline" className="text-xs">{seq.triggerType}</Badge>
                      </div>
                      {seq.description && <p className="text-sm text-muted-foreground mt-0.5">{seq.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" />{seq.steps?.length || 0} steps</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{seq.enrolledCount || 0} enrolled</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Created {new Date(seq.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {seq.status === "active" ? (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => updateMutation.mutate({ id: seq.id, status: "paused" })}><Pause className="w-3 h-3" /> Pause</Button>
                    ) : (
                      <Button size="sm" variant="outline" className="gap-1 text-green-400 border-green-400/30 hover:bg-green-400/10" onClick={() => updateMutation.mutate({ id: seq.id, status: "active" })}><Play className="w-3 h-3" /> Activate</Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => { setSelected(seq); setShowAddStep(true); }}><Plus className="w-3 h-3" /> Add Step</Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate({ id: seq.id })}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>

                {/* Steps */}
                {expandedSeq === seq.id && seq.steps && seq.steps.length > 0 && (
                  <div className="mt-4 pl-7 space-y-2">
                    {seq.steps.map((step: any, idx: number) => (
                      <div key={step.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/30">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-0.5">{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{step.subject || `Step ${idx + 1}`}</span>
                            <Badge variant="outline" className="text-xs">{step.stepType}</Badge>
                            {step.delayDays > 0 && <span className="text-xs text-muted-foreground">+{step.delayDays}d {step.delayHours > 0 ? `${step.delayHours}h` : ""}</span>}
                          </div>
                          {step.body && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{step.body}</p>}
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive flex-shrink-0" onClick={() => deleteStepMutation.mutate({ id: step.id })}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    ))}
                  </div>
                )}
                {expandedSeq === seq.id && (!seq.steps || seq.steps.length === 0) && (
                  <div className="mt-4 pl-7 text-sm text-muted-foreground">No steps yet. Add your first email step above.</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Sequence Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Email Sequence</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. New Lead Nurture" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What is this sequence for?" rows={2} /></div>
              <div><Label>Trigger Type</Label>
                <Select value={form.triggerType} onValueChange={(v: any) => setForm({ ...form, triggerType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
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
                {createMutation.isPending ? "Creating..." : "Create Sequence"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Step Dialog */}
        <Dialog open={showAddStep} onOpenChange={setShowAddStep}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Add Step to "{selected?.name}"</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Step Type</Label>
                  <Select value={stepForm.stepType} onValueChange={(v: any) => setStepForm({ ...stepForm, stepType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="wait">Wait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Delay (days)</Label><Input type="number" min={0} value={stepForm.delayDays} onChange={e => setStepForm({ ...stepForm, delayDays: parseInt(e.target.value) || 0 })} /></div>
                  <div><Label>Hours</Label><Input type="number" min={0} max={23} value={stepForm.delayHours} onChange={e => setStepForm({ ...stepForm, delayHours: parseInt(e.target.value) || 0 })} /></div>
                </div>
              </div>
              {stepForm.stepType === "email" && (
                <>
                  <div><Label>Subject Line</Label><Input value={stepForm.subject} onChange={e => setStepForm({ ...stepForm, subject: e.target.value })} placeholder="e.g. Following up on our conversation" /></div>
                  <div><Label>Email Body</Label><Textarea value={stepForm.body} onChange={e => setStepForm({ ...stepForm, body: e.target.value })} placeholder="Write your email content here..." rows={6} /></div>
                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                    <Input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe the goal of this email for AI generation..." className="border-0 bg-transparent p-0 focus-visible:ring-0" />
                    <Button size="sm" variant="outline" disabled={!aiPrompt || aiLoading} onClick={async () => {
                      setAiLoading(true);
                      generateAIMutation.mutate({ sequenceId: selected?.id, stepNumber: (selected?.steps?.length || 0) + 1, context: aiPrompt });
                      setAiLoading(false);
                    }}>
                      <Sparkles className="w-3 h-3 mr-1" /> Generate
                    </Button>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddStep(false)}>Cancel</Button>
              <Button onClick={() => addStepMutation.mutate({ sequenceId: selected?.id, stepNumber: (selected?.steps?.length || 0) + 1, type: stepForm.stepType, subject: stepForm.subject, body: stepForm.body, waitDays: stepForm.delayDays, waitHours: stepForm.delayHours })} disabled={addStepMutation.isPending}>
                {addStepMutation.isPending ? "Adding..." : "Add Step"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
