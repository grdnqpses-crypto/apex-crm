import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Building2, User, DollarSign, Calendar, Tag, Target, TrendingUp,
  CheckCircle2, Circle, Clock, AlertTriangle, Edit2, Save, X, Plus, Activity,
  Phone, Mail, FileText, Briefcase, ChevronRight, Layers
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-600",
  high: "bg-amber-50 text-amber-600",
  urgent: "bg-red-50 text-red-600",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-50 text-blue-600",
  won: "bg-emerald-50 text-emerald-600",
  lost: "bg-red-50 text-red-600",
};

function formatCurrency(val?: number | null, currency = "USD") {
  if (!val) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(val);
}
function formatDate(ts?: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function timeAgo(ts?: number | null) {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m}mo ago`;
  return `${Math.floor(m / 12)}y ago`;
}

const ACTIVITY_ICONS: Record<string, any> = {
  deal_created: Briefcase, deal_won: CheckCircle2, deal_lost: X,
  deal_stage_changed: Layers, note: FileText, call: Phone, email: Mail,
  meeting: Calendar, task: CheckCircle2,
};

export default function DealDetail() {
  const params = useParams<{ id: string }>();
  const dealId = parseInt(params.id ?? "0");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: deal, isLoading } = trpc.deals.get.useQuery({ id: dealId }, { enabled: !!dealId });
  const { data: pipelines } = trpc.pipelines.list.useQuery();
  const { data: tasks } = trpc.crossFeature.tasksByDeal.useQuery({ dealId }, { enabled: !!dealId });
  const { data: activities } = trpc.activities.list.useQuery(
    useMemo(() => ({ dealId, limit: 50 }), [dealId]),
    { enabled: !!dealId }
  );
  const { data: companiesData } = trpc.companies.list.useQuery({ limit: 200 });
  const { data: contactsData } = trpc.contacts.list.useQuery(
    useMemo(() => ({ companyId: deal?.companyId ?? undefined, limit: 100 }), [deal?.companyId]),
    { enabled: !!deal?.companyId }
  );

  // Linked company + contact detail
  const company = useMemo(() => companiesData?.items?.find((c: any) => c.id === deal?.companyId), [companiesData, deal]);
  const contact = useMemo(() => contactsData?.items?.find((c: any) => c.id === deal?.contactId), [contactsData, deal]);

  // Pipeline stages
  const activePipelineId = deal?.pipelineId;
  const { data: stagesData } = trpc.pipelines.stages.useQuery(
    { pipelineId: activePipelineId! },
    { enabled: !!activePipelineId }
  );
  const stages = stagesData ?? [];
  const currentStage = stages.find((s: any) => s.id === deal?.stageId);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const updateMutation = trpc.deals.update.useMutation({
    onSuccess: () => {
      utils.deals.get.invalidate({ id: dealId });
      setEditing(false);
      toast.success("Deal updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = () => {
    setEditForm({
      name: deal?.name ?? "",
      value: deal?.value ?? "",
      stageId: deal?.stageId ?? "",
      status: deal?.status ?? "open",
      priority: deal?.priority ?? "medium",
      expectedCloseDate: deal?.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split("T")[0] : "",
      notes: deal?.notes ?? "",
      companyId: deal?.companyId ?? "",
      contactId: deal?.contactId ?? "",
    });
    setEditing(true);
  };

  const handleSave = () => {
    const payload: any = { id: dealId };
    if (editForm.name) payload.name = editForm.name;
    if (editForm.value !== "") payload.value = Number(editForm.value);
    if (editForm.stageId) payload.stageId = Number(editForm.stageId);
    if (editForm.status) payload.status = editForm.status;
    if (editForm.priority) payload.priority = editForm.priority;
    if (editForm.expectedCloseDate) payload.expectedCloseDate = new Date(editForm.expectedCloseDate).getTime();
    if (editForm.notes !== undefined) payload.notes = editForm.notes;
    if (editForm.companyId) payload.companyId = Number(editForm.companyId);
    payload.contactId = editForm.contactId ? Number(editForm.contactId) : null;
    updateMutation.mutate(payload);
  };

  // Log activity
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: "note", subject: "", body: "" });
  const createActivityMutation = trpc.activities.create.useMutation({
    onSuccess: () => {
      utils.activities.list.invalidate();
      setShowLogActivity(false);
      setActivityForm({ type: "note", subject: "", body: "" });
      toast.success("Activity logged");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted/50 rounded-xl" />
        <div className="h-40 bg-muted/30 rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-muted/30 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Target className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="text-lg font-semibold text-foreground">Deal not found</p>
        <p className="text-sm text-muted-foreground">This deal may have been deleted or you don't have access.</p>
        <Button variant="outline" className="rounded-xl gap-2" onClick={() => setLocation("/deals")}>
          <ArrowLeft className="h-4 w-4" /> Back to Deals
        </Button>
      </div>
    );
  }

  const completenessFields = [deal.name, deal.value, deal.companyId, deal.contactId, deal.expectedCloseDate, deal.stageId, deal.priority, deal.notes];
  const completeness = Math.round((completenessFields.filter(Boolean).length / completenessFields.length) * 100);

  return (
    <div className="space-y-6">
      {/* ─── Breadcrumb Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2 rounded-xl text-muted-foreground hover:text-foreground" onClick={() => setLocation("/deals")}>
            <ArrowLeft className="h-4 w-4" /> Deals
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          <span className="text-sm font-semibold text-foreground truncate max-w-[300px]">{deal.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <Button size="sm" variant="outline" className="gap-2 rounded-xl" onClick={startEdit}>
              <Edit2 className="h-4 w-4" /> Edit Deal
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" className="gap-2 rounded-xl" onClick={() => setEditing(false)}>
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button size="sm" className="gap-2 rounded-xl" onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4" /> {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ─── Deal Hero Card ─── */}
      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center shrink-0">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <Input value={editForm.name} onChange={e => setEditForm((p: any) => ({ ...p, name: e.target.value }))}
                    className="text-xl font-bold rounded-xl border-border/50 mb-2" />
                ) : (
                  <h1 className="text-2xl font-bold text-foreground truncate">{deal.name}</h1>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className={`text-xs font-semibold rounded-lg ${STATUS_COLORS[deal.status]}`}>
                    {deal.status.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary" className={`text-xs font-semibold rounded-lg ${PRIORITY_COLORS[deal.priority]}`}>
                    {deal.priority} priority
                  </Badge>
                  {currentStage && (
                    <Badge variant="secondary" className="text-xs font-semibold rounded-lg bg-purple-50 text-purple-600">
                      <Layers className="h-3 w-3 mr-1" />{currentStage.name}
                    </Badge>
                  )}
                  {deal.tags?.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs rounded-lg gap-1">
                      <Tag className="h-2.5 w-2.5" />{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            {/* Deal Value */}
            <div className="text-right shrink-0">
              {editing ? (
                <Input type="number" value={editForm.value} onChange={e => setEditForm((p: any) => ({ ...p, value: e.target.value }))}
                  className="w-40 text-right rounded-xl border-border/50" placeholder="Deal value" />
              ) : (
                <div>
                  <p className="text-3xl font-bold text-foreground">{formatCurrency(deal.value, deal.currency ?? "USD")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{deal.currency ?? "USD"}</p>
                </div>
              )}
            </div>
          </div>

          {/* Completeness bar */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all ${completeness >= 80 ? 'bg-emerald-500' : completeness >= 60 ? 'bg-blue-400' : completeness >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${completeness}%` }} />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{completeness}% complete</span>
          </div>
        </CardContent>
      </Card>

      {/* ─── Key Metrics Row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground/60" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Close Date</p>
            </div>
            {editing ? (
              <Input type="date" value={editForm.expectedCloseDate} onChange={e => setEditForm((p: any) => ({ ...p, expectedCloseDate: e.target.value }))}
                className="rounded-xl border-border/50 h-8 text-sm" />
            ) : (
              <p className="text-sm font-bold text-foreground">{formatDate(deal.expectedCloseDate)}</p>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground/60" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</p>
            </div>
            <p className="text-sm font-bold text-foreground">{timeAgo(deal.createdAt)}</p>
            <p className="text-[10px] text-muted-foreground">{formatDate(deal.createdAt)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-muted-foreground/60" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activities</p>
            </div>
            <p className="text-sm font-bold text-foreground">{activities?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground/60" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Open Tasks</p>
            </div>
            <p className="text-sm font-bold text-foreground">{tasks?.filter((t: any) => t.status !== "completed").length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── 360° Relationship Panel ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company Card */}
        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Linked Company
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {editing ? (
              <Select value={String(editForm.companyId)} onValueChange={v => setEditForm((p: any) => ({ ...p, companyId: v, contactId: "" }))}>
                <SelectTrigger className="rounded-xl border-border/50"><SelectValue placeholder="Select company..." /></SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  {companiesData?.items?.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : company ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-accent/40 transition-colors cursor-pointer group"
                onClick={() => setLocation(`/companies/${company.id}`)}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{company.name}</p>
                    {company.industry && <p className="text-xs text-muted-foreground">{company.industry}</p>}
                    {company.website && <p className="text-xs text-muted-foreground/60 truncate max-w-[160px]">{company.website}</p>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700">No company linked. Edit this deal to add one.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Card */}
        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Primary Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {editing ? (
              <Select value={String(editForm.contactId ?? "")} onValueChange={v => setEditForm((p: any) => ({ ...p, contactId: v }))}>
                <SelectTrigger className="rounded-xl border-border/50"><SelectValue placeholder="Select contact..." /></SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  <SelectItem value="">No contact</SelectItem>
                  {contactsData?.items?.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.firstName} {c.lastName ?? ""} {c.jobTitle ? `— ${c.jobTitle}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : contact ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-accent/40 transition-colors cursor-pointer group"
                onClick={() => setLocation(`/contacts/${contact.id}`)}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{contact.firstName.charAt(0)}{contact.lastName?.charAt(0) ?? ""}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{contact.firstName} {contact.lastName ?? ""}</p>
                    {contact.jobTitle && <p className="text-xs text-muted-foreground">{contact.jobTitle}</p>}
                    {contact.email && <p className="text-xs text-muted-foreground/60">{contact.email}</p>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30">
                <User className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <p className="text-xs text-muted-foreground">No contact linked yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Stage Selector (edit mode) ─── */}
      {editing && (
        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Stage</Label>
                <Select value={String(editForm.stageId)} onValueChange={v => setEditForm((p: any) => ({ ...p, stageId: v }))}>
                  <SelectTrigger className="rounded-xl border-border/50"><SelectValue placeholder="Select stage..." /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {stages.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm((p: any) => ({ ...p, status: v }))}>
                  <SelectTrigger className="rounded-xl border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Priority</Label>
                <Select value={editForm.priority} onValueChange={v => setEditForm((p: any) => ({ ...p, priority: v }))}>
                  <SelectTrigger className="rounded-xl border-border/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Notes</Label>
                <Textarea value={editForm.notes} onChange={e => setEditForm((p: any) => ({ ...p, notes: e.target.value }))}
                  className="rounded-xl border-border/50 text-sm min-h-[38px]" rows={1} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Tabs: Tasks / Activity / Notes ─── */}
      <Tabs defaultValue="tasks">
        <TabsList className="rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="tasks" className="rounded-lg text-xs font-semibold">
            Tasks <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px]">{tasks?.length ?? 0}</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg text-xs font-semibold">
            Activity <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px]">{activities?.length ?? 0}</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg text-xs font-semibold">Notes</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-4">
          <Card className="rounded-2xl border-border/40 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">Tasks for this Deal</CardTitle>
              <Button size="sm" variant="outline" className="gap-2 rounded-xl text-xs h-8"
                onClick={() => setLocation("/tasks")}>
                <Plus className="h-3.5 w-3.5" /> Add Task
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {!tasks || tasks.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No tasks linked to this deal yet.</p>
                  <p className="text-xs text-muted-foreground/60">Tasks are the next steps in this deal's journey. Add one to keep momentum.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task: any) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-accent/30 transition-colors cursor-pointer"
                      onClick={() => setLocation("/tasks")}>
                      <div className="mt-0.5">
                        {task.status === "completed"
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          : task.dueDate && task.dueDate < Date.now()
                            ? <AlertTriangle className="h-4 w-4 text-red-400" />
                            : <Circle className="h-4 w-4 text-muted-foreground/40" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {task.type && <span className="text-[10px] text-muted-foreground capitalize">{task.type}</span>}
                          {task.dueDate && (
                            <span className={`text-[10px] ${task.dueDate < Date.now() && task.status !== "completed" ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                              Due {formatDate(task.dueDate)}
                            </span>
                          )}
                          {task.priority && (
                            <Badge variant="secondary" className={`text-[9px] rounded-md ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Timeline Tab */}
        <TabsContent value="activity" className="mt-4">
          <Card className="rounded-2xl border-border/40 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">Activity Timeline</CardTitle>
              <Button size="sm" variant="outline" className="gap-2 rounded-xl text-xs h-8" onClick={() => setShowLogActivity(true)}>
                <Plus className="h-3.5 w-3.5" /> Log Activity
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {!activities || activities.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                  <p className="text-xs text-muted-foreground/60">Log calls, emails, notes, and meetings to track every touch on this deal.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-border/40" />
                  <div className="space-y-4">
                    {activities.map((act: any) => {
                      const Icon = ACTIVITY_ICONS[act.type] ?? Activity;
                      return (
                        <div key={act.id} className="flex items-start gap-4 pl-2">
                          <div className="h-8 w-8 rounded-xl bg-card border border-border/40 flex items-center justify-center shrink-0 z-10">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0 pb-4">
                            <p className="text-sm font-semibold text-foreground">{act.subject || act.type}</p>
                            {act.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{act.body}</p>}
                            <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(act.createdAt)} · {formatDate(act.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-4">
          <Card className="rounded-2xl border-border/40 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-bold">Deal Notes</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {editing ? (
                <Textarea value={editForm.notes} onChange={e => setEditForm((p: any) => ({ ...p, notes: e.target.value }))}
                  className="rounded-xl border-border/50 min-h-[120px]" placeholder="Add notes about this deal..." />
              ) : deal.notes ? (
                <p className="text-sm text-foreground whitespace-pre-wrap">{deal.notes}</p>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                  <Button size="sm" variant="outline" className="rounded-xl gap-2 text-xs mt-1" onClick={startEdit}>
                    <Edit2 className="h-3.5 w-3.5" /> Add Notes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Log Activity Dialog ─── */}
      <Dialog open={showLogActivity} onOpenChange={setShowLogActivity}>
        <DialogContent className="bg-card border-border/50 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Log Activity
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Activity Type</Label>
              <Select value={activityForm.type} onValueChange={v => setActivityForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="rounded-xl border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Subject</Label>
              <Input value={activityForm.subject} onChange={e => setActivityForm(p => ({ ...p, subject: e.target.value }))}
                placeholder="Brief description..." className="rounded-xl border-border/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Details</Label>
              <Textarea value={activityForm.body} onChange={e => setActivityForm(p => ({ ...p, body: e.target.value }))}
                placeholder="Additional details..." className="rounded-xl border-border/50 min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setShowLogActivity(false)}>Cancel</Button>
            <Button className="rounded-xl gap-2" onClick={() => createActivityMutation.mutate({ dealId, ...activityForm })}
              disabled={createActivityMutation.isPending}>
              <Plus className="h-4 w-4" /> {createActivityMutation.isPending ? "Logging..." : "Log Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
