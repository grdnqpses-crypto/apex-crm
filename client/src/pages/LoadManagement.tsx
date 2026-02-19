import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Truck, Plus, MapPin, DollarSign, Clock, Package, ArrowRight, Filter, BarChart3 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400", posted: "bg-blue-500/20 text-blue-400",
  dispatched: "bg-yellow-500/20 text-yellow-400", in_transit: "bg-purple-500/20 text-purple-400",
  delivered: "bg-green-500/20 text-green-400", closed: "bg-emerald-500/20 text-emerald-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function LoadManagement() {

  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [form, setForm] = useState<any>({});

  const loads = trpc.loads.list.useQuery(statusFilter !== "all" ? { status: statusFilter } : undefined);
  const stats = trpc.loads.stats.useQuery();
  const createLoad = trpc.loads.create.useMutation({ onSuccess: () => { loads.refetch(); stats.refetch(); setShowCreate(false); setForm({}); toast.success("Load created"); } });
  const updateStatus = trpc.loads.updateStatus.useMutation({ onSuccess: () => { loads.refetch(); stats.refetch(); toast.success("Status updated"); } });

  const statCards = useMemo(() => [
    { label: "Total Loads", value: stats.data?.total || 0, icon: Package },
    { label: "In Transit", value: stats.data?.inTransit || 0, icon: Truck },
    { label: "Delivered", value: stats.data?.delivered || 0, icon: MapPin },
    { label: "Dispatched", value: stats.data?.dispatched || 0, icon: Clock },
  ], [stats.data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Load Management</h1>
          <p className="text-muted-foreground">Full lifecycle load tracking — create, dispatch, track, deliver, close</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Load</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create New Load</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="text-sm font-medium">Load Type</label>
                <Select value={form.loadType || "FTL"} onValueChange={v => setForm({ ...form, loadType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="FTL">Full Truckload</SelectItem><SelectItem value="LTL">Less Than Truckload</SelectItem><SelectItem value="Partial">Partial</SelectItem><SelectItem value="Intermodal">Intermodal</SelectItem></SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Origin City</label><Input value={form.originCity || ""} onChange={e => setForm({ ...form, originCity: e.target.value })} placeholder="Chicago" /></div>
              <div><label className="text-sm font-medium">Origin State</label><Input value={form.originState || ""} onChange={e => setForm({ ...form, originState: e.target.value })} placeholder="IL" /></div>
              <div><label className="text-sm font-medium">Destination City</label><Input value={form.destCity || ""} onChange={e => setForm({ ...form, destCity: e.target.value })} placeholder="Dallas" /></div>
              <div><label className="text-sm font-medium">Destination State</label><Input value={form.destState || ""} onChange={e => setForm({ ...form, destState: e.target.value })} placeholder="TX" /></div>
              <div><label className="text-sm font-medium">Commodity</label><Input value={form.commodity || ""} onChange={e => setForm({ ...form, commodity: e.target.value })} placeholder="Electronics" /></div>
              <div><label className="text-sm font-medium">Equipment</label>
                <Select value={form.equipmentType || "Dry Van"} onValueChange={v => setForm({ ...form, equipmentType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Dry Van">Dry Van</SelectItem><SelectItem value="Reefer">Reefer</SelectItem><SelectItem value="Flatbed">Flatbed</SelectItem><SelectItem value="Step Deck">Step Deck</SelectItem><SelectItem value="Power Only">Power Only</SelectItem></SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Weight (lbs)</label><Input type="number" value={form.weight || ""} onChange={e => setForm({ ...form, weight: Number(e.target.value) })} /></div>
              <div><label className="text-sm font-medium">Miles</label><Input type="number" value={form.miles || ""} onChange={e => setForm({ ...form, miles: Number(e.target.value) })} /></div>
              <div><label className="text-sm font-medium">Customer Rate ($)</label><Input type="number" value={form.customerRate || ""} onChange={e => setForm({ ...form, customerRate: Number(e.target.value) })} /></div>
              <div><label className="text-sm font-medium">Carrier Rate ($)</label><Input type="number" value={form.carrierRate || ""} onChange={e => setForm({ ...form, carrierRate: Number(e.target.value) })} /></div>
              <div className="col-span-2"><label className="text-sm font-medium">Special Instructions</label><Textarea value={form.specialInstructions || ""} onChange={e => setForm({ ...form, specialInstructions: e.target.value })} /></div>
            </div>
            <Button className="w-full mt-4" onClick={() => createLoad.mutate(form)} disabled={createLoad.isPending}>{createLoad.isPending ? "Creating..." : "Create Load"}</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground uppercase">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
              <s.icon className="w-8 h-8 text-muted-foreground/50" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="posted">Posted</SelectItem>
            <SelectItem value="dispatched">Dispatched</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {loads.data?.map((load: any) => (
          <Card key={load.id} className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Truck className="w-5 h-5 text-primary" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{load.referenceNumber}</span>
                      <Badge className={STATUS_COLORS[load.status] || "bg-gray-500/20"}>{load.status?.replace("_", " ")}</Badge>
                      <Badge variant="outline">{load.loadType || "FTL"}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />{load.originCity || "?"}, {load.originState || "?"}
                      <ArrowRight className="w-3 h-3" />
                      {load.destCity || "?"}, {load.destState || "?"}
                      {load.commodity && <><span className="mx-1">·</span>{load.commodity}</>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {load.customerRate && <div className="text-right"><p className="text-xs text-muted-foreground">Revenue</p><p className="font-semibold text-green-400">${Number(load.customerRate).toLocaleString()}</p></div>}
                  {load.margin && <div className="text-right"><p className="text-xs text-muted-foreground">Margin</p><p className="font-semibold text-emerald-400">${Number(load.margin).toLocaleString()} <span className="text-xs">({load.marginPercent})</span></p></div>}
                  <Select value={load.status} onValueChange={v => updateStatus.mutate({ loadId: load.id, status: v })}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="posted">Posted</SelectItem>
                      <SelectItem value="dispatched">Dispatched</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!loads.data || loads.data.length === 0) && (
          <Card className="border-dashed border-border/50"><CardContent className="p-12 text-center">
            <Truck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No loads yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Create your first load to start managing freight</p>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
