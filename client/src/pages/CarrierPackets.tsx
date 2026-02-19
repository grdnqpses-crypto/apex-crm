import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Package, Plus, Search, Shield, ShieldCheck, ShieldAlert, FileCheck,
  Truck, MapPin, Clock, DollarSign, AlertTriangle, CheckCircle2,
  XCircle, FileText, Building2, ChevronRight
} from "lucide-react";

const statusColors: Record<string, string> = {
  incomplete: "bg-red-500/20 text-red-400",
  pending_review: "bg-amber-500/20 text-amber-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
  expired: "bg-zinc-500/20 text-zinc-400",
};

const complianceColor = (score: number) => score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";

export default function CarrierPackets() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPacket, setSelectedPacket] = useState<number | null>(null);
  const [newPacket, setNewPacket] = useState({ carrierName: "", mcNumber: "", dotNumber: "", equipmentTypes: [] as string[], operatingRadius: "regional" });

  const packets = trpc.carrierPackets.list.useQuery({ search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined });
  const packetDetail = trpc.carrierPackets.get.useQuery({ id: selectedPacket! }, { enabled: !!selectedPacket });
  const createPacket = trpc.carrierPackets.create.useMutation({ onSuccess: () => { packets.refetch(); setShowCreate(false); toast.success("Carrier packet created"); } });
  const validateCompliance = trpc.carrierPackets.validateCompliance.useMutation({ onSuccess: (data) => { packets.refetch(); if (selectedPacket) packetDetail.refetch(); toast.success(`Compliance score: ${data.score}%`); } });
  const updatePacket = trpc.carrierPackets.update.useMutation({ onSuccess: () => { packets.refetch(); if (selectedPacket) packetDetail.refetch(); toast.success("Packet updated"); } });
  const deletePacket = trpc.carrierPackets.delete.useMutation({ onSuccess: () => { packets.refetch(); setSelectedPacket(null); toast.success("Packet deleted"); } });

  const equipmentOptions = ["Dry Van", "Flatbed", "Reefer", "Step Deck", "Lowboy", "Tanker", "Intermodal", "Power Only", "Box Truck", "Hotshot"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-7 w-7 text-primary" />
            Carrier Packets
          </h1>
          <p className="text-muted-foreground mt-1">Manage carrier onboarding, compliance verification, and documentation</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Carrier</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Carrier</DialogTitle>
              <DialogDescription>Start a new carrier packet for onboarding</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Carrier Name *</label>
                <Input value={newPacket.carrierName} onChange={(e) => setNewPacket({ ...newPacket, carrierName: e.target.value })} placeholder="e.g., Swift Transportation" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">MC Number</label>
                  <Input value={newPacket.mcNumber} onChange={(e) => setNewPacket({ ...newPacket, mcNumber: e.target.value })} placeholder="MC-XXXXXX" />
                </div>
                <div>
                  <label className="text-sm font-medium">DOT Number</label>
                  <Input value={newPacket.dotNumber} onChange={(e) => setNewPacket({ ...newPacket, dotNumber: e.target.value })} placeholder="XXXXXXX" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Operating Radius</label>
                <Select value={newPacket.operatingRadius} onValueChange={(v) => setNewPacket({ ...newPacket, operatingRadius: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local (under 100 mi)</SelectItem>
                    <SelectItem value="regional">Regional (100-500 mi)</SelectItem>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Equipment Types</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {equipmentOptions.map((eq) => (
                    <Badge key={eq} variant={newPacket.equipmentTypes.includes(eq.toLowerCase().replace(/ /g, '_')) ? "default" : "outline"} className="cursor-pointer" onClick={() => {
                      const key = eq.toLowerCase().replace(/ /g, '_');
                      setNewPacket({ ...newPacket, equipmentTypes: newPacket.equipmentTypes.includes(key) ? newPacket.equipmentTypes.filter(e => e !== key) : [...newPacket.equipmentTypes, key] });
                    }}>{eq}</Badge>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={() => createPacket.mutate(newPacket)} disabled={!newPacket.carrierName || createPacket.isPending}>
                {createPacket.isPending ? "Creating..." : "Create Carrier Packet"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search carriers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Carriers", value: packets.data?.total || 0, icon: Truck, color: "text-blue-400" },
          { label: "Approved", value: packets.data?.items?.filter((p: any) => p.packetStatus === 'approved').length || 0, icon: ShieldCheck, color: "text-emerald-400" },
          { label: "Pending Review", value: packets.data?.items?.filter((p: any) => p.packetStatus === 'pending_review').length || 0, icon: Clock, color: "text-amber-400" },
          { label: "Incomplete", value: packets.data?.items?.filter((p: any) => p.packetStatus === 'incomplete').length || 0, icon: ShieldAlert, color: "text-red-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Carrier List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Carrier Directory</CardTitle>
            </CardHeader>
            <CardContent>
              {(packets.data?.items?.length || 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No carrier packets yet. Add your first carrier to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {packets.data?.items?.map((packet: any) => (
                    <div key={packet.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${selectedPacket === packet.id ? 'bg-muted/70 ring-1 ring-primary/20' : ''}`} onClick={() => setSelectedPacket(packet.id)}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Truck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{packet.carrierName}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {packet.mcNumber && <span>MC: {packet.mcNumber}</span>}
                            {packet.dotNumber && <span>DOT: {packet.dotNumber}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className={`text-sm font-semibold ${complianceColor(packet.complianceScore || 0)}`}>{packet.complianceScore || 0}%</span>
                            <Progress value={packet.complianceScore || 0} className="w-16 h-1.5" />
                          </div>
                        </div>
                        <Badge className={statusColors[packet.packetStatus] || ""}>{packet.packetStatus?.replace(/_/g, ' ')}</Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail Panel */}
        <div>
          {selectedPacket && packetDetail.data ? (
            <Card className="border-border/50 sticky top-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{packetDetail.data.carrierName}</CardTitle>
                  <Badge className={statusColors[packetDetail.data.packetStatus] || ""}>{packetDetail.data.packetStatus?.replace(/_/g, ' ')}</Badge>
                </div>
                <CardDescription>
                  {packetDetail.data.mcNumber && `MC: ${packetDetail.data.mcNumber}`}
                  {packetDetail.data.dotNumber && ` | DOT: ${packetDetail.data.dotNumber}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Compliance Score */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Compliance Score</span>
                    <span className={`text-lg font-bold ${complianceColor(packetDetail.data.complianceScore || 0)}`}>{packetDetail.data.complianceScore || 0}%</span>
                  </div>
                  <Progress value={packetDetail.data.complianceScore || 0} className="h-2" />
                </div>

                {/* Compliance Checklist */}
                {packetDetail.data.complianceChecklist && (
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-medium">Compliance Checklist</h4>
                    {Object.entries(packetDetail.data.complianceChecklist as Record<string, boolean>).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {value ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                        <span className={value ? "text-foreground" : "text-muted-foreground"}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Insurance Info */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Insurance</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted/20 rounded p-2">
                      <span className="text-xs text-muted-foreground">Cargo</span>
                      <p className="font-medium">${(packetDetail.data.cargoInsuranceAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/20 rounded p-2">
                      <span className="text-xs text-muted-foreground">Liability</span>
                      <p className="font-medium">${(packetDetail.data.liabilityInsuranceAmount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Equipment */}
                {packetDetail.data.equipmentTypes && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Equipment</h4>
                    <div className="flex flex-wrap gap-1">
                      {(packetDetail.data.equipmentTypes as string[]).map((eq: string) => (
                        <Badge key={eq} variant="outline" className="text-xs">{eq.replace(/_/g, ' ')}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1" onClick={() => validateCompliance.mutate({ id: selectedPacket })} disabled={validateCompliance.isPending}>
                    <Shield className="h-3 w-3 mr-1" /> {validateCompliance.isPending ? "Validating..." : "Validate"}
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => deletePacket.mutate({ id: selectedPacket })}>
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="py-12 text-center">
                <FileCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Select a carrier to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
