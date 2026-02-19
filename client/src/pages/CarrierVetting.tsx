import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShieldCheck, Plus, AlertTriangle, CheckCircle, XCircle, Loader2, Search, Truck } from "lucide-react";

const VET_COLORS: Record<string, string> = {
  pending: "bg-gray-500/20 text-gray-400", approved: "bg-green-500/20 text-green-400",
  flagged: "bg-yellow-500/20 text-yellow-400", blacklisted: "bg-red-500/20 text-red-400",
};

export default function CarrierVetting() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>({});
  const carriers = trpc.carrierVetting.list.useQuery();
  const createCarrier = trpc.carrierVetting.create.useMutation({ onSuccess: () => { carriers.refetch(); setShowCreate(false); setForm({}); toast.success("Carrier added"); } });
  const runVetting = trpc.carrierVetting.runVetting.useMutation({ onSuccess: () => { carriers.refetch(); toast.success("Vetting complete"); } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Carrier Vetting</h1>
          <p className="text-muted-foreground">Deep carrier analysis with DOT/FMCSA integration, insurance tracking, and AI safety scoring</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Carrier</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Carrier for Vetting</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-sm font-medium">Carrier Name *</label><Input value={form.carrierName || ""} onChange={e => setForm({ ...form, carrierName: e.target.value })} placeholder="ABC Trucking LLC" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium">DOT Number</label><Input value={form.dotNumber || ""} onChange={e => setForm({ ...form, dotNumber: e.target.value })} placeholder="1234567" /></div>
                <div><label className="text-sm font-medium">MC Number</label><Input value={form.mcNumber || ""} onChange={e => setForm({ ...form, mcNumber: e.target.value })} placeholder="MC-123456" /></div>
              </div>
              <div><label className="text-sm font-medium">SCAC Code</label><Input value={form.scacCode || ""} onChange={e => setForm({ ...form, scacCode: e.target.value })} /></div>
            </div>
            <Button className="w-full mt-4" onClick={() => createCarrier.mutate(form)} disabled={!form.carrierName || createCarrier.isPending}>{createCarrier.isPending ? "Adding..." : "Add Carrier"}</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Carriers", value: carriers.data?.length || 0, icon: Truck, color: "text-blue-400" },
          { label: "Approved", value: carriers.data?.filter((c: any) => c.vetStatus === "approved").length || 0, icon: CheckCircle, color: "text-green-400" },
          { label: "Flagged", value: carriers.data?.filter((c: any) => c.vetStatus === "flagged").length || 0, icon: AlertTriangle, color: "text-yellow-400" },
          { label: "Blacklisted", value: carriers.data?.filter((c: any) => c.vetStatus === "blacklisted").length || 0, icon: XCircle, color: "text-red-400" },
        ].map(s => (
          <Card key={s.label} className="border-border/50"><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
            <s.icon className={`w-8 h-8 ${s.color} opacity-50`} />
          </CardContent></Card>
        ))}
      </div>

      <div className="space-y-3">
        {carriers.data?.map((carrier: any) => (
          <Card key={carrier.id} className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${carrier.vetStatus === 'approved' ? 'bg-green-500/10' : carrier.vetStatus === 'flagged' ? 'bg-yellow-500/10' : 'bg-gray-500/10'}`}>
                    <ShieldCheck className={`w-5 h-5 ${carrier.vetStatus === 'approved' ? 'text-green-400' : carrier.vetStatus === 'flagged' ? 'text-yellow-400' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{carrier.carrierName}</span>
                      <Badge className={VET_COLORS[carrier.vetStatus] || "bg-gray-500/20"}>{carrier.vetStatus}</Badge>
                      {carrier.overallScore && <Badge variant="outline">Score: {carrier.overallScore}/100</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      {carrier.dotNumber && <span>DOT: {carrier.dotNumber}</span>}
                      {carrier.mcNumber && <span>MC: {carrier.mcNumber}</span>}
                      {carrier.safetyRating && <span>Safety: {carrier.safetyRating}</span>}
                      {carrier.totalLoadsCompleted > 0 && <span>{carrier.totalLoadsCompleted} loads completed</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {carrier.insuranceOnFile && carrier.insuranceExpiry && (
                    <Badge className={Number(carrier.insuranceExpiry) < Date.now() ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}>
                      Insurance: {Number(carrier.insuranceExpiry) < Date.now() ? "EXPIRED" : "Active"}
                    </Badge>
                  )}
                  <Button variant="outline" size="sm" onClick={() => runVetting.mutate({ id: carrier.id })} disabled={runVetting.isPending}>
                    {runVetting.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-1" />Run AI Vet</>}
                  </Button>
                </div>
              </div>
              {carrier.autoFlagged && carrier.flagReason && (
                <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />Auto-flagged: {carrier.flagReason}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {(!carriers.data || carriers.data.length === 0) && (
          <Card className="border-dashed"><CardContent className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No carriers yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Add carriers to start vetting with AI-powered safety analysis</p>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
