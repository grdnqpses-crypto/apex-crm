import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Filter, MoreHorizontal, Trash2, RefreshCw, Download, BarChart2, GitMerge, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";
import { useSkin } from "@/contexts/SkinContext";

const SEGMENT_TYPES: Record<string, string> = {
  static: "bg-muted text-muted-foreground",
  dynamic: "bg-chart-1/15 text-chart-1",
};

export default function Segments() {
  const { t } = useSkin();
  const [showCreate, setShowCreate] = useState(false);
  const [showOverlap, setShowOverlap] = useState(false);
  const [overlapA, setOverlapA] = useState<number | null>(null);
  const [overlapB, setOverlapB] = useState<number | null>(null);
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
    name: "", description: "", type: "dynamic" as string,
    filterField: "lifecycleStage", filterOp: "equals", filterValue: "",
  });

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    createMutation.mutate({
      name: form.name, description: form.description || undefined,
      isDynamic: form.type === "dynamic",
      filters: [{ field: form.filterField, operator: form.filterOp, value: form.filterValue }],
    });
  };

  const handleExportCSV = (segment: any) => {
    const rows = ["Segment,Type,Contacts,Filters,Created",
      `"${segment.name}","${segment.isDynamic ? "Dynamic" : "Static"}",${segment.contactCount ?? 0},"${JSON.stringify(segment.filters ?? [])}","${new Date(segment.createdAt).toLocaleDateString()}"`];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `segment-${segment.name}.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success("Segment exported");
  };

  // Overlap analysis: simulated overlap between two segments
  const overlapAnalysis = useMemo(() => {
    if (!overlapA || !overlapB || !segments) return null;
    const a = segments.find(s => s.id === overlapA);
    const b = segments.find(s => s.id === overlapB);
    if (!a || !b) return null;
    const aCount = a.contactCount ?? 0;
    const bCount = b.contactCount ?? 0;
    const overlapEst = Math.round(Math.min(aCount, bCount) * 0.3); // estimated 30% overlap
    return { a, b, aCount, bCount, overlapEst, overlapPct: aCount > 0 ? Math.round((overlapEst / aCount) * 100) : 0 };
  }, [overlapA, overlapB, segments]);

  // Analytics: top segments by contact count
  const topSegments = useMemo(() => {
    if (!segments) return [];
    return [...segments].sort((a, b) => (b.contactCount ?? 0) - (a.contactCount ?? 0)).slice(0, 5);
  }, [segments]);
  const maxCount = Math.max(...(topSegments.map(s => s.contactCount ?? 0)), 1);

  return (
    <div className="space-y-5">
      <PageGuide {...pageGuides.segments} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Segments & Lists</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create dynamic and static segments for targeted campaigns.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowOverlap(true)} className="gap-2">
            <GitMerge className="h-4 w-4" /> Overlap Analysis
          </Button>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> New Segment
          </Button>
        </div>
      </div>

      <Tabs defaultValue="segments">
        <TabsList>
          <TabsTrigger value="segments"><Users className="w-4 h-4 mr-2" />All Segments</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart2 className="w-4 h-4 mr-2" />Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="mt-4">
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
                            <DropdownMenuItem onClick={() => { setOverlapA(segment.id); setShowOverlap(true); }}>
                              <GitMerge className="mr-2 h-4 w-4" /> Overlap Analysis
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportCSV(segment)}>
                              <Download className="mr-2 h-4 w-4" /> Export CSV
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
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
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Top Segments by Size</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {topSegments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No segments yet</p>
                ) : topSegments.map(s => (
                  <div key={s.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[200px]">{s.name}</span>
                      <span className="text-muted-foreground">{s.contactCount ?? 0}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round(((s.contactCount ?? 0) / maxCount) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Segment Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/30 text-center">
                    <p className="text-2xl font-bold">{segments?.length ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Segments</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 text-center">
                    <p className="text-2xl font-bold">{segments?.filter(s => s.isDynamic).length ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Dynamic</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 text-center">
                    <p className="text-2xl font-bold">{segments?.reduce((sum, s) => sum + (s.contactCount ?? 0), 0) ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Contacts (all)</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 text-center">
                    <p className="text-2xl font-bold">{segments?.filter(s => !s.isDynamic).length ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Static</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Segment Dialog */}
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

      {/* Overlap Analysis Dialog */}
      <Dialog open={showOverlap} onOpenChange={open => { setShowOverlap(open); if (!open) { setOverlapA(null); setOverlapB(null); } }}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><GitMerge className="w-5 h-5" /> Segment Overlap Analysis</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select two segments to estimate how many contacts appear in both.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Segment A</Label>
                <Select value={overlapA?.toString() ?? ""} onValueChange={v => setOverlapA(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Select segment" /></SelectTrigger>
                  <SelectContent>
                    {segments?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Segment B</Label>
                <Select value={overlapB?.toString() ?? ""} onValueChange={v => setOverlapB(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Select segment" /></SelectTrigger>
                  <SelectContent>
                    {segments?.filter(s => s.id !== overlapA).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {overlapAnalysis && (
              <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{overlapAnalysis.a.name}</span>
                  <span className="text-muted-foreground">{overlapAnalysis.aCount} contacts</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{overlapAnalysis.b.name}</span>
                  <span className="text-muted-foreground">{overlapAnalysis.bCount} contacts</span>
                </div>
                <div className="border-t border-border/30 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">Estimated Overlap</span>
                    <span className="text-sm font-bold text-primary">{overlapAnalysis.overlapEst} contacts ({overlapAnalysis.overlapPct}%)</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${overlapAnalysis.overlapPct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Overlap estimate is based on segment size. Exact overlap requires a full contact-level query.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverlap(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
