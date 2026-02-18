import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Calendar, MoreHorizontal, Trash2, Phone, Mail, ClipboardList, RefreshCw, Building2, User, Target, Clock, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";


const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-chart-3/15 text-chart-3",
  high: "bg-red-500/15 text-red-400",
};

const TYPE_ICONS: Record<string, any> = {
  call: Phone, email: Mail, to_do: ClipboardList, follow_up: RefreshCw,
};

const QUEUES = ["Prospecting Calls", "Customer Renewals", "Carrier Setup", "Follow-ups", "Onboarding", "General"];

export default function Tasks() {
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [queueFilter, setQueueFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();

  const taskInput = useMemo(() => ({
    status: statusFilter !== "all" ? statusFilter : undefined,
    taskType: typeFilter !== "all" ? typeFilter : undefined,
    queue: queueFilter !== "all" ? queueFilter : undefined,
    limit: 100,
  }), [statusFilter, typeFilter, queueFilter]);

  const { data, isLoading } = trpc.tasks.list.useQuery(taskInput);
  const { data: contacts } = trpc.contacts.list.useQuery({ limit: 100 });
  const { data: companies } = trpc.companies.list.useQuery({ limit: 100 });

  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); utils.dashboard.stats.invalidate(); setShowCreate(false); resetForm(); toast.success("Task created"); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMutation = trpc.tasks.update.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); utils.dashboard.stats.invalidate(); },
  });
  const deleteMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); utils.dashboard.stats.invalidate(); toast.success("Task deleted"); },
  });

  const [form, setForm] = useState({
    title: "", taskType: "to_do" as string, priority: "medium" as string,
    description: "", dueDate: "", dueTime: "", queue: "",
    contactId: null as number | null, companyId: null as number | null, dealId: null as number | null,
    isRecurring: false, recurringFrequency: "",
  });

  const resetForm = () => setForm({
    title: "", taskType: "to_do", priority: "medium", description: "", dueDate: "", dueTime: "",
    queue: "", contactId: null, companyId: null, dealId: null, isRecurring: false, recurringFrequency: "",
  });

  const handleCreate = () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    createMutation.mutate({
      title: form.title,
      taskType: form.taskType as any,
      priority: form.priority as any,
      description: form.description || undefined,
      dueDate: form.dueDate ? new Date(form.dueDate).getTime() : undefined,
      dueTime: form.dueTime || undefined,
      queue: form.queue || undefined,
      contactId: form.contactId ?? undefined,
      companyId: form.companyId ?? undefined,
      dealId: form.dealId ?? undefined,
      isRecurring: form.isRecurring,
      recurringFrequency: form.recurringFrequency || undefined,
    });
  };

  const filteredTasks = data?.items?.filter(t => {
    if (!search) return true;
    return t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
  }) ?? [];

  const pendingCount = data?.items?.filter(t => t.status === "not_started").length ?? 0;
  const completedCount = data?.items?.filter(t => t.status === "completed").length ?? 0;

  return (
    <div className="space-y-5">
      <PageGuide {...pageGuides.tasks} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pendingCount} pending · {completedCount} completed · {data?.total ?? 0} total
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/30" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-secondary/30"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36 bg-secondary/30"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="to_do">To-do</SelectItem>
            <SelectItem value="follow_up">Follow-up</SelectItem>
          </SelectContent>
        </Select>
        <Select value={queueFilter} onValueChange={setQueueFilter}>
          <SelectTrigger className="w-44 bg-secondary/30"><SelectValue placeholder="Queue" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Queues</SelectItem>
            {QUEUES.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-card border-border"><CardContent className="p-4"><div className="h-5 w-full bg-muted rounded animate-pulse" /></CardContent></Card>
          ))
        ) : filteredTasks.length === 0 ? (
          <Card className="bg-card border-border"><CardContent className="p-12 text-center text-muted-foreground">No tasks found. Create your first task to get started.</CardContent></Card>
        ) : (
          filteredTasks.map((task) => {
            const TypeIcon = TYPE_ICONS[task.taskType ?? "to_do"] || ClipboardList;
            const isOverdue = task.dueDate && task.status !== "completed" && task.dueDate < Date.now();
            return (
              <Card key={task.id} className={`bg-card border-border hover:border-primary/20 transition-colors ${isOverdue ? "border-red-500/30" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={task.status === "completed"}
                      onCheckedChange={(checked) => updateMutation.mutate({
                        id: task.id,
                        status: checked ? "completed" : "not_started",
                        completedAt: checked ? Date.now() : undefined,
                      })}
                      className="mt-1"
                    />
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <TypeIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                        <Badge variant="secondary" className={`text-[10px] ${PRIORITY_COLORS[task.priority] ?? ""}`}>{task.priority}</Badge>
                        {task.taskType && <Badge variant="outline" className="text-[10px] capitalize">{task.taskType.replace("_", " ")}</Badge>}
                        {task.queue && <Badge variant="outline" className="text-[10px] bg-primary/5">{task.queue}</Badge>}
                        {isOverdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                        {task.isRecurring && <Badge variant="outline" className="text-[10px]"><RefreshCw className="h-2.5 w-2.5 mr-1" />Recurring</Badge>}
                      </div>
                      {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {task.dueDate && (
                          <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
                            <Calendar className="h-3 w-3" />
                            <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                            {task.dueTime && <span>at {task.dueTime}</span>}
                          </div>
                        )}
                        {task.contactId && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" /> Contact #{task.contactId}
                          </div>
                        )}
                        {task.companyId && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" /> Company #{task.companyId}
                          </div>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: task.id, status: "not_started" })}>Mark Not Started</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: task.id, status: "completed", completedAt: Date.now() })}>Mark Completed</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate({ id: task.id })}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh]">
          <DialogHeader><DialogTitle>Add New Task</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="bg-secondary/30 w-full">
                <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                <TabsTrigger value="associations" className="text-xs">Associations</TabsTrigger>
                <TabsTrigger value="scheduling" className="text-xs">Scheduling</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Task Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Call shipping manager about new lane" className="bg-secondary/30" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Task Type</Label>
                    <Select value={form.taskType} onValueChange={(v) => setForm(p => ({ ...p, taskType: v }))}>
                      <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="to_do">To-do</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm(p => ({ ...p, priority: v }))}>
                      <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Queue (optional)</Label>
                  <Select value={form.queue || "none"} onValueChange={(v) => setForm(p => ({ ...p, queue: v === "none" ? "" : v }))}>
                    <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select queue" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No queue</SelectItem>
                      {QUEUES.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes / Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Lane, volume, pain point, next steps..." className="bg-secondary/30 min-h-[80px]" />
                </div>
              </TabsContent>

              <TabsContent value="associations" className="mt-4 space-y-4">
                <p className="text-xs text-muted-foreground">Link this task to existing records for context and tracking.</p>
                <div className="space-y-2">
                  <Label>Associated Contact</Label>
                  <Select value={form.contactId?.toString() ?? "none"} onValueChange={(v) => setForm(p => ({ ...p, contactId: v === "none" ? null : parseInt(v) }))}>
                    <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select contact" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No contact</SelectItem>
                      {contacts?.items?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.firstName} {c.lastName ?? ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Associated Company</Label>
                  <Select value={form.companyId?.toString() ?? "none"} onValueChange={(v) => setForm(p => ({ ...p, companyId: v === "none" ? null : parseInt(v) }))}>
                    <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select company" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No company</SelectItem>
                      {companies?.items?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="scheduling" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={form.dueDate} onChange={(e) => setForm(p => ({ ...p, dueDate: e.target.value }))} className="bg-secondary/30" />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Time</Label>
                    <Input type="time" value={form.dueTime} onChange={(e) => setForm(p => ({ ...p, dueTime: e.target.value }))} className="bg-secondary/30" />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20">
                  <Switch checked={form.isRecurring} onCheckedChange={(checked) => setForm(p => ({ ...p, isRecurring: checked }))} />
                  <div>
                    <Label>Recurring Task</Label>
                    <p className="text-xs text-muted-foreground">Auto-regenerate this task on a schedule</p>
                  </div>
                </div>
                {form.isRecurring && (
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={form.recurringFrequency || "none"} onValueChange={(v) => setForm(p => ({ ...p, recurringFrequency: v === "none" ? "" : v }))}>
                      <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not set</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
