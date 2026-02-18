import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, GitBranch, Play, Pause, MoreHorizontal, Trash2, Zap, Mail, Clock, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";


const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-success/15 text-success",
  paused: "bg-warning/15 text-warning",
  archived: "bg-muted text-muted-foreground",
};

const TRIGGER_TYPES = [
  { value: "contact_created", label: "Contact Created", icon: Users },
  { value: "form_submitted", label: "Form Submitted", icon: Zap },
  { value: "email_opened", label: "Email Opened", icon: Mail },
  { value: "deal_stage_changed", label: "Deal Stage Changed", icon: GitBranch },
  { value: "time_based", label: "Time-Based Trigger", icon: Clock },
];

const ACTION_TYPES = [
  { value: "send_email", label: "Send Email" },
  { value: "wait", label: "Wait / Delay" },
  { value: "update_contact", label: "Update Contact Property" },
  { value: "add_tag", label: "Add Tag" },
  { value: "create_task", label: "Create Task" },
  { value: "notify_owner", label: "Notify Owner" },
  { value: "move_deal", label: "Move Deal Stage" },
];

export default function Workflows() {
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: workflows, isLoading } = trpc.workflows.list.useQuery();
  const createMutation = trpc.workflows.create.useMutation({
    onSuccess: () => { utils.workflows.list.invalidate(); setShowCreate(false); toast.success("Workflow created"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.workflows.update.useMutation({
    onSuccess: () => { utils.workflows.list.invalidate(); },
  });
  const deleteMutation = trpc.workflows.delete.useMutation({
    onSuccess: () => { utils.workflows.list.invalidate(); toast.success("Workflow deleted"); },
  });

  const [form, setForm] = useState({ name: "", description: "", triggerType: "contact_created" });

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    createMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      trigger: { type: form.triggerType },
      steps: [{ type: "send_email", config: {} }],
    });
  };

  return (
    <div className="space-y-5">
      <PageGuide {...pageGuides.workflows} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automation Workflows</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Build trigger-based automation sequences for lead nurturing.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> New Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-card border-border"><CardContent className="p-6"><div className="space-y-3 animate-pulse"><div className="h-5 w-32 bg-muted rounded" /><div className="h-4 w-48 bg-muted rounded" /></div></CardContent></Card>
          ))
        ) : workflows?.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-card border-border"><CardContent className="p-12 text-center text-muted-foreground">No workflows yet. Create your first automation workflow.</CardContent></Card>
          </div>
        ) : (
          workflows?.map((workflow) => {
            const trigger = (workflow.trigger as any)?.type ?? "unknown";
            const triggerInfo = TRIGGER_TYPES.find(t => t.value === trigger);
            const TriggerIcon = triggerInfo?.icon ?? Zap;
            const steps = (workflow.steps as any[]) ?? [];
            return (
              <Card key={workflow.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0">
                        <GitBranch className="h-4 w-4 text-chart-2" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{workflow.name}</p>
                        <Badge variant="secondary" className={`text-[10px] mt-1 ${STATUS_COLORS[workflow.status] ?? ""}`}>{workflow.status}</Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {workflow.status === "draft" || workflow.status === "paused" ? (
                          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: workflow.id, status: "active" })}>
                            <Play className="mr-2 h-4 w-4" /> Activate
                          </DropdownMenuItem>
                        ) : workflow.status === "active" ? (
                          <DropdownMenuItem onClick={() => updateMutation.mutate({ id: workflow.id, status: "paused" })}>
                            <Pause className="mr-2 h-4 w-4" /> Pause
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate({ id: workflow.id })}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {workflow.description && <p className="text-xs text-muted-foreground">{workflow.description}</p>}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TriggerIcon className="h-3.5 w-3.5" />
                    <span>Trigger: {triggerInfo?.label ?? trigger}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{steps.length} step{steps.length !== 1 ? "s" : ""}</div>
                  <div className="text-[10px] text-muted-foreground/40">{new Date(workflow.createdAt).toLocaleDateString()}</div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Create Automation Workflow</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Workflow Name *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Lead Nurture Sequence" className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe what this workflow does..." className="bg-secondary/30" /></div>
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select value={form.triggerType} onValueChange={(v) => setForm(p => ({ ...p, triggerType: v }))}>
                <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Workflow"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
