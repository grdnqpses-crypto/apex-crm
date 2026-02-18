import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, DollarSign, MoreHorizontal, Trash2, Trophy, X, GripVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";


const DEFAULT_STAGES = [
  { name: "Qualification", probability: 10, color: "#6366f1" },
  { name: "Discovery", probability: 25, color: "#8b5cf6" },
  { name: "Proposal", probability: 50, color: "#a855f7" },
  { name: "Negotiation", probability: 75, color: "#d946ef" },
  { name: "Closed Won", probability: 100, color: "#22c55e" },
];

export default function Deals() {
  const [showCreate, setShowCreate] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);
  const utils = trpc.useUtils();

  const { data: pipelines } = trpc.pipelines.list.useQuery();
  const [selectedPipeline, setSelectedPipeline] = useState<number | null>(null);

  const activePipelineId = selectedPipeline ?? pipelines?.[0]?.id ?? null;
  const { data: stages } = trpc.pipelines.stages.useQuery(
    { pipelineId: activePipelineId! },
    { enabled: !!activePipelineId }
  );
  const dealInput = useMemo(() => ({
    pipelineId: activePipelineId ?? undefined,
    limit: 200,
  }), [activePipelineId]);
  const { data: dealData, isLoading } = trpc.deals.list.useQuery(dealInput);

  const createPipeline = trpc.pipelines.create.useMutation({
    onSuccess: () => { utils.pipelines.list.invalidate(); setShowPipeline(false); toast.success("Pipeline created"); },
  });
  const createDeal = trpc.deals.create.useMutation({
    onSuccess: () => { utils.deals.list.invalidate(); utils.dashboard.stats.invalidate(); setShowCreate(false); toast.success("Deal created"); },
    onError: (e) => toast.error(e.message),
  });
  const updateDeal = trpc.deals.update.useMutation({
    onSuccess: () => { utils.deals.list.invalidate(); utils.dashboard.stats.invalidate(); },
  });
  const deleteDeal = trpc.deals.delete.useMutation({
    onSuccess: () => { utils.deals.list.invalidate(); utils.dashboard.stats.invalidate(); toast.success("Deal deleted"); },
  });

  const [dealForm, setDealForm] = useState({ name: "", value: "", priority: "medium" as string });
  const [pipelineForm, setPipelineForm] = useState({ name: "", stages: [...DEFAULT_STAGES] });

  const handleCreateDeal = () => {
    if (!dealForm.name.trim() || !activePipelineId || !stages?.length) { toast.error("Fill in deal name and ensure pipeline exists"); return; }
    createDeal.mutate({
      name: dealForm.name,
      pipelineId: activePipelineId,
      stageId: stages[0].id,
      value: dealForm.value ? parseFloat(dealForm.value) : undefined,
      priority: dealForm.priority as any,
    });
  };

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${val.toLocaleString()}`;
  };

  const dealsByStage = useMemo(() => {
    const map = new Map<number, (typeof dealData extends undefined ? never : NonNullable<typeof dealData>['items'])>();
    if (!stages || !dealData?.items) return map;
    stages.forEach(s => map.set(s.id, []));
    dealData.items.filter(d => d.status === "open").forEach(deal => {
      const arr = map.get(deal.stageId);
      if (arr) arr.push(deal);
    });
    return map;
  }, [stages, dealData]);

  return (
    <div className="space-y-5">
      <PageGuide {...pageGuides.deals} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{dealData?.total ?? 0} deals in pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          {pipelines && pipelines.length > 0 && (
            <Select value={activePipelineId?.toString() ?? ""} onValueChange={(v) => setSelectedPipeline(parseInt(v))}>
              <SelectTrigger className="w-48 bg-secondary/30"><SelectValue placeholder="Select pipeline" /></SelectTrigger>
              <SelectContent>
                {pipelines.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowPipeline(true)}>New Pipeline</Button>
          <Button size="sm" className="gap-2" onClick={() => setShowCreate(true)} disabled={!activePipelineId}>
            <Plus className="h-4 w-4" /> Add Deal
          </Button>
        </div>
      </div>

      {!pipelines?.length ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No pipelines yet. Create your first pipeline to start tracking deals.</p>
            <Button onClick={() => setShowPipeline(true)}>Create Pipeline</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 220px)" }}>
          {stages?.map((stage) => {
            const stageDeals = dealsByStage.get(stage.id) ?? [];
            const stageValue = stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
            return (
              <div key={stage.id} className="flex flex-col min-w-[280px] w-[280px] shrink-0">
                <div className="flex items-center justify-between px-3 py-2 rounded-t-lg" style={{ backgroundColor: (stage.color ?? '#6366f1') + '15' }}>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color ?? '#6366f1' }} />
                    <span className="text-sm font-semibold text-foreground">{stage.name}</span>
                    <Badge variant="secondary" className="text-[10px] h-5">{stageDeals.length}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatCurrency(stageValue)}</span>
                </div>
                <div className="flex-1 bg-secondary/10 rounded-b-lg p-2 space-y-2 border border-border border-t-0">
                  {stageDeals.map((deal) => (
                    <Card key={deal.id} className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-foreground leading-tight">{deal.name}</p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => updateDeal.mutate({ id: deal.id, status: "won", closedAt: Date.now() })}>
                                <Trophy className="mr-2 h-4 w-4 text-success" /> Mark Won
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateDeal.mutate({ id: deal.id, status: "lost", closedAt: Date.now() })}>
                                <X className="mr-2 h-4 w-4 text-destructive" /> Mark Lost
                              </DropdownMenuItem>
                              {stages.filter(s => s.id !== stage.id).map(s => (
                                <DropdownMenuItem key={s.id} onClick={() => updateDeal.mutate({ id: deal.id, stageId: s.id })}>
                                  <GripVertical className="mr-2 h-4 w-4" /> Move to {s.name}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteDeal.mutate({ id: deal.id })}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {deal.value != null && deal.value > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="h-3.5 w-3.5 text-success" />
                            <span className="font-semibold text-foreground">{formatCurrency(deal.value)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] capitalize">{deal.priority}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stageDeals.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground/60">No deals</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Deal Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Add New Deal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Deal Name *</Label><Input value={dealForm.name} onChange={(e) => setDealForm(p => ({ ...p, name: e.target.value }))} placeholder="Enterprise contract" className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Value ($)</Label><Input type="number" value={dealForm.value} onChange={(e) => setDealForm(p => ({ ...p, value: e.target.value }))} placeholder="50000" className="bg-secondary/30" /></div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={dealForm.priority} onValueChange={(v) => setDealForm(p => ({ ...p, priority: v }))}>
                <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreateDeal} disabled={createDeal.isPending}>{createDeal.isPending ? "Creating..." : "Create Deal"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Pipeline Dialog */}
      <Dialog open={showPipeline} onOpenChange={setShowPipeline}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>Create Pipeline</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Pipeline Name *</Label><Input value={pipelineForm.name} onChange={(e) => setPipelineForm(p => ({ ...p, name: e.target.value }))} placeholder="Sales Pipeline" className="bg-secondary/30" /></div>
            <div className="space-y-2">
              <Label>Stages</Label>
              <div className="space-y-2">
                {pipelineForm.stages.map((stage, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={stage.name} onChange={(e) => { const s = [...pipelineForm.stages]; s[i] = { ...s[i], name: e.target.value }; setPipelineForm(p => ({ ...p, stages: s })); }} className="bg-secondary/30 flex-1" />
                    <Input type="number" value={stage.probability} onChange={(e) => { const s = [...pipelineForm.stages]; s[i] = { ...s[i], probability: parseInt(e.target.value) || 0 }; setPipelineForm(p => ({ ...p, stages: s })); }} className="bg-secondary/30 w-20" />
                    <span className="text-xs text-muted-foreground">%</span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { const s = pipelineForm.stages.filter((_, j) => j !== i); setPipelineForm(p => ({ ...p, stages: s })); }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setPipelineForm(p => ({ ...p, stages: [...p.stages, { name: "", probability: 50, color: "#6366f1" }] }))}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Stage
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPipeline(false)}>Cancel</Button>
            <Button onClick={() => { if (!pipelineForm.name.trim()) { toast.error("Pipeline name required"); return; } createPipeline.mutate({ name: pipelineForm.name, stages: pipelineForm.stages }); }} disabled={createPipeline.isPending}>
              {createPipeline.isPending ? "Creating..." : "Create Pipeline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
