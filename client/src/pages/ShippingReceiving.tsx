import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, PackageOpen, Plus, Search, Truck, CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:            { label: "Pending",           color: "bg-gray-500/10 text-gray-500 border-gray-500/20",       icon: Clock },
  ordered:            { label: "Ordered",           color: "bg-blue-500/10 text-blue-500 border-blue-500/20",       icon: Package },
  in_transit:         { label: "In Transit",        color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Truck },
  out_for_delivery:   { label: "Out for Delivery",  color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: Truck },
  delivered:          { label: "Delivered",         color: "bg-green-500/10 text-green-600 border-green-500/20",    icon: CheckCircle2 },
  received:           { label: "Received",          color: "bg-green-500/10 text-green-600 border-green-500/20",    icon: CheckCircle2 },
  exception:          { label: "Exception",         color: "bg-red-500/10 text-red-500 border-red-500/20",          icon: AlertTriangle },
  cancelled:          { label: "Cancelled",         color: "bg-gray-500/10 text-gray-400 border-gray-500/20",       icon: XCircle },
};

type ShipmentStatus = "pending" | "ordered" | "in_transit" | "out_for_delivery" | "delivered" | "received" | "exception" | "cancelled";

interface NewShipment {
  shipmentType: "inbound" | "outbound";
  referenceNumber: string;
  shipStatus: ShipmentStatus;
  carrierName: string;
  trackingNumber: string;
  carrierService: string;
  shipDate: string;
  expectedDelivery: string;
  shipDescription: string;
  weight: string;
  quantity: string;
  originAddress: string;
  destinationAddress: string;
  shipNotes: string;
}

const emptyForm: NewShipment = {
  shipmentType: "inbound",
  referenceNumber: "",
  shipStatus: "pending",
  carrierName: "",
  trackingNumber: "",
  carrierService: "",
  shipDate: "",
  expectedDelivery: "",
  shipDescription: "",
  weight: "",
  quantity: "",
  originAddress: "",
  destinationAddress: "",
  shipNotes: "",
};

export default function ShippingReceiving() {
  const [activeTab, setActiveTab] = useState<"all" | "inbound" | "outbound">("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewShipment>(emptyForm);

  const { data, isLoading, refetch } = trpc.shipping.list.useQuery({ type: activeTab });
  const createShipment = trpc.shipping.create.useMutation({
    onSuccess: () => {
      toast.success("Shipment created successfully");
      setShowCreate(false);
      setForm(emptyForm);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const updateShipment = trpc.shipping.update.useMutation({
    onSuccess: () => { toast.success("Shipment updated"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const filtered = (data?.items ?? []).filter(s =>
    !search ||
    s.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.referenceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.carrierName?.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    createShipment.mutate({
      ...form,
      quantity: form.quantity ? parseInt(form.quantity) : undefined,
      shipDate: form.shipDate ? new Date(form.shipDate).getTime() : undefined,
      expectedDelivery: form.expectedDelivery ? new Date(form.expectedDelivery).getTime() : undefined,
    });
  };

  const stats = {
    inbound: (data?.items ?? []).filter(s => s.shipmentType === "inbound").length,
    outbound: (data?.items ?? []).filter(s => s.shipmentType === "outbound").length,
    inTransit: (data?.items ?? []).filter(s => s.status === "in_transit" || s.status === "out_for_delivery").length,
    exceptions: (data?.items ?? []).filter(s => s.status === "exception").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-orange-500" />
            Shipping & Receiving
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track inbound and outbound shipments</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Shipment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Inbound", value: stats.inbound, icon: PackageOpen, color: "text-blue-500" },
          { label: "Outbound", value: stats.outbound, icon: Truck, color: "text-orange-500" },
          { label: "In Transit", value: stats.inTransit, icon: Truck, color: "text-yellow-600" },
          { label: "Exceptions", value: stats.exceptions, icon: AlertTriangle, color: "text-red-500" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={cn("h-8 w-8", stat.color)} />
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tracking #, reference, carrier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="inbound">Inbound</TabsTrigger>
            <TabsTrigger value="outbound">Outbound</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Shipments Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">No shipments found</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Create your first shipment to get started</p>
              <Button onClick={() => setShowCreate(true)} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> Add Shipment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reference</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Carrier</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tracking #</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expected</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(shipment => {
                    const statusCfg = STATUS_CONFIG[shipment.status] ?? STATUS_CONFIG.pending;
                    const StatusIcon = statusCfg.icon;
                    return (
                      <tr key={shipment.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            shipment.shipmentType === "inbound"
                              ? "text-blue-500 border-blue-500/30 bg-blue-500/10"
                              : "text-orange-500 border-orange-500/30 bg-orange-500/10"
                          )}>
                            {shipment.shipmentType === "inbound" ? "↓ Inbound" : "↑ Outbound"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-foreground">
                          {shipment.referenceNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-foreground">{shipment.carrierName || "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-foreground">
                          {shipment.trackingNumber || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-xs flex items-center gap-1 w-fit", statusCfg.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {shipment.expectedDelivery ? new Date(shipment.expectedDelivery).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={shipment.status ?? 'pending'}
                            onValueChange={(val) => updateShipment.mutate({ id: shipment.id, shipStatus: val as ShipmentStatus })}
                          >
                            <SelectTrigger className="h-7 text-xs w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                <SelectItem key={key} value={key} className="text-xs">{cfg.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Shipment</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Shipment Type</Label>
              <div className="flex gap-2 mt-1">
                {(["inbound", "outbound"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, shipmentType: t }))}
                    className={cn(
                      "flex-1 py-2 rounded-lg border text-sm font-medium transition-all capitalize",
                      form.shipmentType === t
                        ? "border-orange-500 bg-orange-500/10 text-orange-500"
                        : "border-border text-muted-foreground hover:border-orange-500/40"
                    )}
                  >
                    {t === "inbound" ? "↓ Inbound" : "↑ Outbound"}
                  </button>
                ))}
              </div>
            </div>
            {[
              { label: "Reference Number", key: "referenceNumber", placeholder: "PO-2024-001" },
              { label: "Carrier Name", key: "carrierName", placeholder: "FedEx, UPS, USPS..." },
              { label: "Tracking Number", key: "trackingNumber", placeholder: "1Z999AA10123456784" },
              { label: "Carrier Service", key: "carrierService", placeholder: "Ground, Express..." },
              { label: "Ship Date", key: "shipDate", type: "date" },
              { label: "Expected Delivery", key: "expectedDelivery", type: "date" },
              { label: "Weight", key: "weight", placeholder: "5 lbs" },
              { label: "Quantity", key: "quantity", placeholder: "10", type: "number" },
            ].map(field => (
              <div key={field.key}>
                <Label>{field.label}</Label>
                <Input
                  type={field.type ?? "text"}
                  placeholder={field.placeholder}
                  value={form[field.key as keyof NewShipment] as string}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="mt-1"
                />
              </div>
            ))}
            <div className="col-span-2">
              <Label>Origin Address</Label>
              <Input
                placeholder="123 Warehouse St, Chicago, IL 60601"
                value={form.originAddress}
                onChange={e => setForm(f => ({ ...f, originAddress: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Destination Address</Label>
              <Input
                placeholder="456 Distribution Ave, Dallas, TX 75201"
                value={form.destinationAddress}
                onChange={e => setForm(f => ({ ...f, destinationAddress: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Input
                placeholder="Office supplies, electronics, raw materials..."
                value={form.shipDescription}
                onChange={e => setForm(f => ({ ...f, shipDescription: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input
                placeholder="Special handling instructions, notes..."
                value={form.shipNotes}
                onChange={e => setForm(f => ({ ...f, shipNotes: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={createShipment.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {createShipment.isPending ? "Creating..." : "Create Shipment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
