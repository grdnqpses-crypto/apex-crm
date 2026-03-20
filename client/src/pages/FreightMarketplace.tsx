import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Package, Truck, MapPin, DollarSign, FileText, Clock, CheckCircle, AlertCircle, Zap, TrendingUp } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

const STATUS_COLORS: Record<string, string> = {
  posted: "bg-crm-workflow/20 text-crm-workflow",
  matching: "bg-crm-pending/20 text-crm-pending",
  matched: "bg-crm-pending/20 text-crm-pending",
  booked: "bg-crm-success/20 text-crm-success",
  dispatched: "bg-crm-workflow/20 text-crm-workflow",
  in_transit: "bg-crm-premium/20 text-crm-premium",
  delivered: "bg-crm-success/20 text-crm-success",
  completed: "bg-crm-success/20 text-crm-success",
  cancelled: "bg-crm-critical/20 text-crm-critical",
};

export default function FreightMarketplace() {
  const { t } = useSkin();
  const [showPostLoad, setShowPostLoad] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [formData, setFormData] = useState({
    shipperCompanyName: "", shipperContactName: "", shipperEmail: "", shipperPhone: "",
    commodity: "", weight: "", pieces: 0, pallets: 0, equipmentType: "dry_van",
    specialRequirements: "", hazmat: false, temperatureControlled: false,
    originCity: "", originState: "", originZip: "", originAddress: "",
    pickupDate: Date.now(), pickupWindowStart: "08:00", pickupWindowEnd: "17:00",
    destCity: "", destState: "", destZip: "", destAddress: "",
    deliveryDate: Date.now() + 86400000 * 2, deliveryWindowStart: "08:00", deliveryWindowEnd: "17:00",
    shipperRate: "",
  });

  const { data: loads, isLoading } = trpc.marketplace.listLoads.useQuery(
    statusFilter ? { status: statusFilter } : undefined
  );
  const { data: stats } = trpc.marketplace.stats.useQuery();
  const { data: selectedLoadData } = trpc.marketplace.getLoad.useQuery(
    { id: selectedLoad! }, { enabled: !!selectedLoad }
  );
  const { data: bids } = trpc.marketplace.listBids.useQuery(
    { loadId: selectedLoad! }, { enabled: !!selectedLoad }
  );
  const { data: tracking } = trpc.marketplace.listTracking.useQuery(
    { loadId: selectedLoad! }, { enabled: !!selectedLoad }
  );
  const { data: docs } = trpc.marketplace.listDocuments.useQuery(
    { loadId: selectedLoad! }, { enabled: !!selectedLoad }
  );

  const utils = trpc.useUtils();
  const postLoad = trpc.marketplace.postLoad.useMutation({
    onSuccess: () => { utils.marketplace.listLoads.invalidate(); utils.marketplace.stats.invalidate(); setShowPostLoad(false); toast.success("Load posted to marketplace!"); },
  });
  const matchCarriers = trpc.marketplace.matchCarriers.useMutation({
    onSuccess: () => { utils.marketplace.listBids.invalidate(); utils.marketplace.listLoads.invalidate(); toast.success("AI found carrier matches!"); },
  });
  const acceptBid = trpc.marketplace.acceptBid.useMutation({
    onSuccess: () => { utils.marketplace.listBids.invalidate(); utils.marketplace.listLoads.invalidate(); utils.marketplace.stats.invalidate(); toast.success("Bid accepted! Load booked."); },
  });
  const collectPayment = trpc.marketplace.collectShipperPayment.useMutation({
    onSuccess: () => { utils.marketplace.getPayment.invalidate(); toast.success("Payment collected!"); },
  });
  const generateDocs = trpc.marketplace.generateDocuments.useMutation({
    onSuccess: () => { utils.marketplace.listDocuments.invalidate(); toast.success("Documents generated autonomously!"); },
  });
  const addTracking = trpc.marketplace.addTracking.useMutation({
    onSuccess: () => { utils.marketplace.listTracking.invalidate(); utils.marketplace.listLoads.invalidate(); toast.success("Tracking updated!"); },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-7 w-7 text-crm-premium" />
            Freight Marketplace
          </h1>
          <p className="text-muted-foreground mt-1">Autonomous load posting, carrier matching, and delivery tracking</p>
        </div>
        <Dialog open={showPostLoad} onOpenChange={setShowPostLoad}>
          <DialogTrigger asChild>
            <Button className="bg-crm-success hover:bg-crm-success/90">
              <Zap className="h-4 w-4 mr-2" /> Post Load (FREE)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Post a Load to Marketplace</DialogTitle>
              <DialogDescription>Free for all manufacturers and distributors. AI will match the best carrier automatically.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="col-span-2 font-semibold text-sm text-crm-workflow">Shipper Information</div>
              <div><Label>Company Name</Label><Input value={formData.shipperCompanyName} onChange={e => setFormData(p => ({ ...p, shipperCompanyName: e.target.value }))} /></div>
              <div><Label>Contact Name</Label><Input value={formData.shipperContactName} onChange={e => setFormData(p => ({ ...p, shipperContactName: e.target.value }))} /></div>
              <div><Label>Email</Label><Input type="email" value={formData.shipperEmail} onChange={e => setFormData(p => ({ ...p, shipperEmail: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={formData.shipperPhone} onChange={e => setFormData(p => ({ ...p, shipperPhone: e.target.value }))} /></div>

              <div className="col-span-2 font-semibold text-sm text-crm-workflow mt-2">Load Details</div>
              <div><Label>Commodity</Label><Input value={formData.commodity} onChange={e => setFormData(p => ({ ...p, commodity: e.target.value }))} placeholder="e.g. Electronics, Produce" /></div>
              <div><Label>Weight (lbs)</Label><Input value={formData.weight} onChange={e => setFormData(p => ({ ...p, weight: e.target.value }))} /></div>
              <div>
                <Label>Equipment Type</Label>
                <Select value={formData.equipmentType} onValueChange={v => setFormData(p => ({ ...p, equipmentType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dry_van">Dry Van</SelectItem>
                    <SelectItem value="flatbed">Flatbed</SelectItem>
                    <SelectItem value="reefer">Reefer</SelectItem>
                    <SelectItem value="step_deck">Step Deck</SelectItem>
                    <SelectItem value="box_truck">Box Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Rate ($)</Label><Input value={formData.shipperRate} onChange={e => setFormData(p => ({ ...p, shipperRate: e.target.value }))} placeholder="Shipper pays this amount" /></div>

              <div className="col-span-2 font-semibold text-sm text-crm-workflow mt-2">Origin</div>
              <div><Label>City</Label><Input value={formData.originCity} onChange={e => setFormData(p => ({ ...p, originCity: e.target.value }))} /></div>
              <div><Label>State</Label><Input value={formData.originState} onChange={e => setFormData(p => ({ ...p, originState: e.target.value }))} /></div>
              <div><Label>ZIP</Label><Input value={formData.originZip} onChange={e => setFormData(p => ({ ...p, originZip: e.target.value }))} /></div>
              <div><Label>Pickup Window</Label><Input value={formData.pickupWindowStart} onChange={e => setFormData(p => ({ ...p, pickupWindowStart: e.target.value }))} placeholder="08:00" /></div>

              <div className="col-span-2 font-semibold text-sm text-crm-workflow mt-2">Destination</div>
              <div><Label>City</Label><Input value={formData.destCity} onChange={e => setFormData(p => ({ ...p, destCity: e.target.value }))} /></div>
              <div><Label>State</Label><Input value={formData.destState} onChange={e => setFormData(p => ({ ...p, destState: e.target.value }))} /></div>
              <div><Label>ZIP</Label><Input value={formData.destZip} onChange={e => setFormData(p => ({ ...p, destZip: e.target.value }))} /></div>
              <div><Label>Delivery Window</Label><Input value={formData.deliveryWindowStart} onChange={e => setFormData(p => ({ ...p, deliveryWindowStart: e.target.value }))} placeholder="08:00" /></div>

              <div className="col-span-2"><Label>Special Requirements</Label><Textarea value={formData.specialRequirements} onChange={e => setFormData(p => ({ ...p, specialRequirements: e.target.value }))} placeholder="Liftgate, inside delivery, etc." /></div>

              <div className="col-span-2">
                <Button className="w-full bg-crm-success hover:bg-crm-success/90" disabled={postLoad.isPending}
                  onClick={() => postLoad.mutate(formData)}>
                  {postLoad.isPending ? "Posting..." : "Post Load — AI Will Match Carrier Automatically"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "Total Loads", value: stats?.totalLoads || 0, icon: Package, color: "text-crm-workflow" },
          { label: "Active", value: stats?.activeLoads || 0, icon: Truck, color: "text-crm-pending" },
          { label: "Delivered", value: stats?.deliveredLoads || 0, icon: CheckCircle, color: "text-crm-success" },
          { label: "Revenue", value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-crm-success" },
          { label: "Margin", value: `$${(stats?.totalMargin || 0).toLocaleString()}`, icon: TrendingUp, color: "text-crm-premium" },
          { label: "Avg Margin %", value: `${(stats?.avgMarginPercent || 0).toFixed(1)}%`, icon: Zap, color: "text-crm-premium" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["", "posted", "matching", "booked", "in_transit", "delivered", "completed"].map(s => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm"
            onClick={() => setStatusFilter(s)}>
            {s || "All"}
          </Button>
        ))}
      </div>

      {/* Load List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Load List */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Loading marketplace loads...</CardContent></Card>
          ) : !loads?.length ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No loads yet. Post your first load for free!</CardContent></Card>
          ) : loads.map(load => (
            <Card key={load.id} className={`cursor-pointer transition-all hover:ring-1 hover:ring-primary ${selectedLoad === load.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedLoad(load.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold">{load.loadNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[load.status] || ''}`}>
                      {load.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">{load.equipmentType.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-crm-workflow" />
                  <span>{load.originCity}, {load.originState}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>{load.destCity}, {load.destState}</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                  <span>{load.commodity} • {load.weight} lbs</span>
                  <div className="flex items-center gap-3">
                    {load.shipperRate && <span className="text-crm-success font-medium">${Number(load.shipperRate).toLocaleString()}</span>}
                    {load.margin && <span className="text-crm-premium font-medium">+${Number(load.margin).toLocaleString()}</span>}
                  </div>
                </div>
                {load.matchedCarrierName && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-crm-success">
                    <Truck className="h-3 w-3" /> Carrier: {load.matchedCarrierName}
                    {load.matchScore && <span className="text-crm-premium">({Number(load.matchScore)}% match)</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedLoad && selectedLoadData ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{selectedLoadData.loadNumber}</CardTitle>
                  <CardDescription>{selectedLoadData.shipperCompanyName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[selectedLoadData.status]}`}>{selectedLoadData.status}</span></div>
                    <div><span className="text-muted-foreground">Equipment:</span> {selectedLoadData.equipmentType}</div>
                    <div><span className="text-muted-foreground">Weight:</span> {selectedLoadData.weight} lbs</div>
                    <div><span className="text-muted-foreground">Commodity:</span> {selectedLoadData.commodity}</div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    {selectedLoadData.status === 'posted' && (
                      <Button className="w-full bg-crm-premium hover:bg-crm-premium/90" size="sm"
                        disabled={matchCarriers.isPending}
                        onClick={() => matchCarriers.mutate({ loadId: selectedLoad })}>
                        <Zap className="h-4 w-4 mr-2" /> {matchCarriers.isPending ? "AI Matching..." : "AI Match Carriers"}
                      </Button>
                    )}
                    {['booked', 'dispatched'].includes(selectedLoadData.status) && (
                      <>
                        <Button className="w-full bg-crm-success hover:bg-crm-success/90" size="sm"
                          onClick={() => collectPayment.mutate({ loadId: selectedLoad, method: 'credit_card' })}>
                          <DollarSign className="h-4 w-4 mr-2" /> Collect Shipper Payment
                        </Button>
                        <Button className="w-full" variant="outline" size="sm"
                          onClick={() => generateDocs.mutate({ loadId: selectedLoad })}>
                          <FileText className="h-4 w-4 mr-2" /> Generate All Documents
                        </Button>
                      </>
                    )}
                    {selectedLoadData.status === 'booked' && (
                      <Button className="w-full bg-crm-workflow hover:bg-crm-workflow/90" size="sm"
                        onClick={() => addTracking.mutate({ loadId: selectedLoad, eventType: 'pickup_confirmed', description: 'Carrier confirmed pickup' })}>
                        <Truck className="h-4 w-4 mr-2" /> Confirm Pickup
                      </Button>
                    )}
                    {selectedLoadData.status === 'in_transit' && (
                      <Button className="w-full bg-crm-success hover:bg-crm-success/90" size="sm"
                        onClick={() => addTracking.mutate({ loadId: selectedLoad, eventType: 'delivery_confirmed', description: 'Delivery confirmed at destination' })}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Confirm Delivery
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Carrier Bids */}
              {bids && bids.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Carrier Matches</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {bids.map(bid => (
                      <div key={bid.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                        <div>
                          <div className="text-sm font-medium">{bid.carrierName}</div>
                          <div className="text-xs text-muted-foreground">{bid.equipmentType} • Score: {Number(bid.matchScore)}%</div>
                          {bid.notes && <div className="text-xs text-muted-foreground mt-1">{bid.notes}</div>}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-crm-success">${Number(bid.bidRate).toLocaleString()}</div>
                          {bid.status === 'pending' && (
                            <Button size="sm" variant="outline" className="mt-1 text-xs h-6"
                              onClick={() => acceptBid.mutate({ bidId: bid.id, loadId: selectedLoad })}>
                              Accept
                            </Button>
                          )}
                          {bid.status !== 'pending' && (
                            <span className={`text-xs ${bid.status === 'accepted' ? 'text-crm-success' : 'text-crm-inactive'}`}>{bid.status}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Tracking */}
              {tracking && tracking.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Tracking Events</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {tracking.map(event => (
                        <div key={event.id} className="flex items-start gap-2 text-sm">
                          <div className="mt-1 h-2 w-2 rounded-full bg-crm-workflow shrink-0" />
                          <div>
                            <div className="font-medium">{event.eventType.replace(/_/g, ' ')}</div>
                            {event.description && <div className="text-xs text-muted-foreground">{event.description}</div>}
                            {event.city && <div className="text-xs text-muted-foreground">{event.city}, {event.state}</div>}
                            <div className="text-xs text-muted-foreground">{new Date(Number(event.createdAt)).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              {docs && docs.length > 0 && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Documents</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {docs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between text-sm p-2 rounded bg-secondary/30">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-crm-workflow" />
                            <span>{doc.title}</span>
                          </div>
                          <span className={`text-xs ${doc.status === 'generated' ? 'text-crm-success' : 'text-crm-pending'}`}>{doc.status}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Select a load to view details, match carriers, and manage the shipment lifecycle.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
