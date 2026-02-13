import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, Filter, MoreHorizontal, Trash2, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";

const SEGMENT_TYPES: Record<string, string> = {
  static: "bg-muted text-muted-foreground",
  dynamic: "bg-chart-1/15 text-chart-1",
};

export default function Segments() {
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: segments, isLoading } = trpc.segments.list.useQuery();
  const createMutation = trpc.segments.create.useMutation({
    onSuccess: () => { utils.segments.list.invalidate(); setShowCreate(false); toast.success("Segment created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.segments.delete.useMutation({
    onSuccess: () => { utils.segments.list.invalidate(); toast.success("Segment deleted"); },
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "dynamic" as string,
    filterField: "lifecycleStage",
    filterOp: "equals",
    filterValue: "",
  });

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    createMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      isDynamic: form.type === "dynamic",
      filters: [{ field: form.filterField, operator: form.filterOp, value: form.filterValue }],
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Segments & Lists</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create dynamic and static segments for targeted campaigns.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> New Segment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-card border-border"><CardContent className="p-6"><div className="space-y-3 animate-pulse"><div className="h-5 w-32 bg-muted rounded" /><div className="h-4 w-48 bg-muted rounded" /></div></CardContent></Card>
          ))
        ) : segments?.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-card border-border"><CardContent className="p-12 text-center text-muted-foreground">No segments yet. Create your first segment to target specific audiences.</CardContent></Card>
          </div>
        ) : (
          segments?.map((segment) => {
            const filters = (segment.filters as any[]) ?? [];
            return (
              <Card key={segment.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-chart-4/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-chart-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{segment.name}</p>
                        <Badge variant="secondary" className={`text-[10px] mt-1 capitalize ${segment.isDynamic ? SEGMENT_TYPES.dynamic : SEGMENT_TYPES.static}`}>{segment.isDynamic ? "dynamic" : "static"}</Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate({ id: segment.id })}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {segment.description && <p className="text-xs text-muted-foreground">{segment.description}</p>}
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{filters.length} filter{filters.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{segment.contactCount ?? 0}</span>
                      <span className="text-xs text-muted-foreground">contacts</span>
                    </div>
                    {segment.lastRefreshedAt && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <RefreshCw className="h-3 w-3" />
                        {new Date(segment.lastRefreshedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Create Segment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Segment Name *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="High-value leads" className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe this segment..." className="bg-secondary/30" /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dynamic">Dynamic (auto-updates)</SelectItem>
                  <SelectItem value="static">Static (manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filter Rule</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={form.filterField} onValueChange={(v) => setForm(p => ({ ...p, filterField: v }))}>
                  <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lifecycleStage">Lifecycle Stage</SelectItem>
                    <SelectItem value="leadScore">Lead Score</SelectItem>
                    <SelectItem value="source">Source</SelectItem>
                    <SelectItem value="country">Country</SelectItem>
                    <SelectItem value="tag">Tag</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={form.filterOp} onValueChange={(v) => setForm(p => ({ ...p, filterOp: v }))}>
                  <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Not Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greater_than">Greater Than</SelectItem>
                    <SelectItem value="less_than">Less Than</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={form.filterValue} onChange={(e) => setForm(p => ({ ...p, filterValue: e.target.value }))} placeholder="Value" className="bg-secondary/30" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Segment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
