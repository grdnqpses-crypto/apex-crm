import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Ghost, Plus, Trash2, Loader2, Play, Pause, ChevronDown, ChevronUp,
  Mail, Clock, Sparkles,
} from "lucide-react";
import { useState } from "react";

const statusBadge: Record<string, string> = {
  draft: "bg-zinc-600",
  active: "bg-green-600",
  paused: "bg-amber-600",
  completed: "bg-blue-600",
};

export default function GhostSequences() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [stepForm, setStepForm] = useState({ subject: "", bodyTemplate: "", delayDays: 1, toneOverride: "" });

  const utils = trpc.useUtils();
  const { data: sequences, isLoading } = trpc.ghostSequences.list.useQuery();
  const createMut = trpc.ghostSequences.create.useMutation({
    onSuccess: () => { utils.ghostSequences.list.invalidate(); setShowCreate(false); setForm({ name: "", description: "" }); toast.success("Sequence created"); },
  });
  const updateMut = trpc.ghostSequences.update.useMutation({
    onSuccess: () => { utils.ghostSequences.list.invalidate(); toast.success("Sequence updated"); },
  });
  const deleteMut = trpc.ghostSequences.delete.useMutation({
    onSuccess: () => { utils.ghostSequences.list.invalidate(); toast.success("Sequence deleted"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ghost className="h-6 w-6 text-violet-400" />
            Ghost Mode Sequences
          </h1>
          <p className="text-muted-foreground mt-1">Autonomous multi-step follow-up sequences</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Sequence</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Ghost Sequence</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Sequence Name *</Label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1" placeholder="e.g., Cold Outreach - Logistics Decision Makers" />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1" rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => createMut.mutate(form)} disabled={!form.name.trim() || createMut.isPending}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !sequences || sequences.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Ghost className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">No sequences yet</p>
            <p className="text-sm">Create automated follow-up sequences for your prospects</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sequences.map((seq) => (
            <SequenceCard
              key={seq.id}
              sequence={seq}
              expanded={expandedId === seq.id}
              onToggle={() => setExpandedId(expandedId === seq.id ? null : seq.id)}
              onUpdate={(data) => updateMut.mutate({ id: seq.id, ...data })}
              onDelete={() => { if (confirm("Delete this sequence?")) deleteMut.mutate({ id: seq.id }); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SequenceCard({ sequence, expanded, onToggle, onUpdate, onDelete }: {
  sequence: any;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (data: any) => void;
  onDelete: () => void;
}) {
  const [showAddStep, setShowAddStep] = useState(false);
  const [stepForm, setStepForm] = useState({ subject: "", bodyTemplate: "", delayDays: 1, toneOverride: "" });

  const utils = trpc.useUtils();
  const { data: steps } = trpc.ghostSequences.steps.list.useQuery(
    { sequenceId: sequence.id },
    { enabled: expanded }
  );
  const createStepMut = trpc.ghostSequences.steps.create.useMutation({
    onSuccess: () => {
      utils.ghostSequences.steps.list.invalidate({ sequenceId: sequence.id });
      setShowAddStep(false);
      setStepForm({ subject: "", bodyTemplate: "", delayDays: 1, toneOverride: "" });
      toast.success("Step added");
    },
  });
  const deleteStepMut = trpc.ghostSequences.steps.delete.useMutation({
    onSuccess: () => { utils.ghostSequences.steps.list.invalidate({ sequenceId: sequence.id }); toast.success("Step removed"); },
  });

  return (
    <Card className={expanded ? "border-primary/30" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Ghost className="h-5 w-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{sequence.name}</p>
              <Badge className={`text-[10px] ${statusBadge[sequence.status] ?? "bg-zinc-600"}`}>{sequence.status}</Badge>
            </div>
            {sequence.description && <p className="text-xs text-muted-foreground truncate">{sequence.description}</p>}
          </div>
          <div className="flex gap-1 shrink-0">
            {sequence.status === "draft" && (
              <Button variant="ghost" size="sm" onClick={() => onUpdate({ status: "active" })} title="Activate">
                <Play className="h-3.5 w-3.5 text-green-400" />
              </Button>
            )}
            {sequence.status === "active" && (
              <Button variant="ghost" size="sm" onClick={() => onUpdate({ status: "paused" })} title="Pause">
                <Pause className="h-3.5 w-3.5 text-amber-400" />
              </Button>
            )}
            {sequence.status === "paused" && (
              <Button variant="ghost" size="sm" onClick={() => onUpdate({ status: "active" })} title="Resume">
                <Play className="h-3.5 w-3.5 text-green-400" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3">
            <Separator />
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Sequence Steps</p>
              <Button variant="outline" size="sm" onClick={() => setShowAddStep(!showAddStep)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Step
              </Button>
            </div>

            {showAddStep && (
              <Card className="bg-muted/50">
                <CardContent className="p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Label className="text-xs">Subject Line</Label>
                      <Input value={stepForm.subject} onChange={(e) => setStepForm(p => ({ ...p, subject: e.target.value }))} className="mt-1" placeholder="e.g., Quick question about {{companyName}}" />
                    </div>
                    <div>
                      <Label className="text-xs">Delay (days after previous)</Label>
                      <Input type="number" value={stepForm.delayDays} onChange={(e) => setStepForm(p => ({ ...p, delayDays: Number(e.target.value) }))} className="mt-1" min={0} />
                    </div>
                    <div>
                      <Label className="text-xs">Tone Override</Label>
                      <Input value={stepForm.toneOverride} onChange={(e) => setStepForm(p => ({ ...p, toneOverride: e.target.value }))} className="mt-1" placeholder="e.g., casual, urgent" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Email Body Template</Label>
                      <Textarea value={stepForm.bodyTemplate} onChange={(e) => setStepForm(p => ({ ...p, bodyTemplate: e.target.value }))} className="mt-1" rows={4} placeholder="Use {{firstName}}, {{companyName}}, etc." />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAddStep(false)}>Cancel</Button>
                    <Button size="sm" onClick={() => createStepMut.mutate({
                      sequenceId: sequence.id,
                      stepOrder: (steps?.length ?? 0) + 1,
                      ...stepForm,
                      delayDays: stepForm.delayDays,
                    })} disabled={createStepMut.isPending}>
                      {createStepMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                      Save Step
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {(!steps || steps.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">No steps yet. Add steps to build your sequence.</p>
            ) : (
              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-7 w-7 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
                        {idx + 1}
                      </div>
                      {idx < steps.length - 1 && <div className="w-px h-6 bg-border" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm font-medium">{step.subject || "No subject"}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Wait {step.delayDays ?? 0} day{(step.delayDays ?? 0) !== 1 ? "s" : ""}</span>
                        {step.toneOverride && <Badge variant="outline" className="text-[10px]">{step.toneOverride}</Badge>}
                        {step.aiGenerated && <Badge className="text-[10px] bg-violet-600"><Sparkles className="h-2.5 w-2.5 mr-0.5" /> AI</Badge>}
                      </div>
                      {step.bodyTemplate && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{step.bodyTemplate}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteStepMut.mutate({ id: step.id })}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
