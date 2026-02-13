import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-chart-3/15 text-chart-3",
  high: "bg-warning/15 text-warning",
  urgent: "bg-destructive/15 text-destructive",
};

export default function Tasks() {
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const utils = trpc.useUtils();

  const taskInput = useMemo(() => ({
    status: statusFilter !== "all" ? statusFilter : undefined,
    limit: 50,
  }), [statusFilter]);

  const { data, isLoading } = trpc.tasks.list.useQuery(taskInput);
  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); utils.dashboard.stats.invalidate(); setShowCreate(false); toast.success("Task created"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.tasks.update.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); utils.dashboard.stats.invalidate(); },
  });
  const deleteMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); utils.dashboard.stats.invalidate(); toast.success("Task deleted"); },
  });

  const [form, setForm] = useState({ title: "", description: "", priority: "medium" as string, dueDate: "" });

  const handleCreate = () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      priority: form.priority as any,
      dueDate: form.dueDate ? new Date(form.dueDate).getTime() : undefined,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} tasks total</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-secondary/30"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-card border-border"><CardContent className="p-4"><div className="h-5 w-full bg-muted rounded animate-pulse" /></CardContent></Card>
          ))
        ) : data?.items.length === 0 ? (
          <Card className="bg-card border-border"><CardContent className="p-12 text-center text-muted-foreground">No tasks found. Create your first task to get started.</CardContent></Card>
        ) : (
          data?.items.map((task) => (
            <Card key={task.id} className="bg-card border-border hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.status === "done"}
                    onCheckedChange={(checked) => updateMutation.mutate({ id: task.id, status: checked ? "done" : "todo" })}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                      <Badge variant="secondary" className={`text-[10px] ${PRIORITY_COLORS[task.priority] ?? ""}`}>{task.priority}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{task.status.replace("_", " ")}</Badge>
                    </div>
                    {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
                    {task.dueDate && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateMutation.mutate({ id: task.id, status: "in_progress" })}>Mark In Progress</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMutation.mutate({ id: task.id, status: "done" })}>Mark Done</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate({ id: task.id })}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Add New Task</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Follow up with client" className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Details..." className="bg-secondary/30" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm(p => ({ ...p, dueDate: e.target.value }))} className="bg-secondary/30" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
