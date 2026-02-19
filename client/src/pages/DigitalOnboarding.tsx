import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, Plus, FileSignature, CheckCircle, Clock, Mail } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400", in_progress: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400", expired: "bg-red-500/20 text-red-400",
};

export default function DigitalOnboarding() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>({});
  const flows = trpc.onboarding.listFlows.useQuery();
  const createFlow = trpc.onboarding.createFlow.useMutation({ onSuccess: () => { flows.refetch(); setShowCreate(false); setForm({}); toast.success("Onboarding flow created"); } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Digital Onboarding</h1><p className="text-muted-foreground">Streamlined customer onboarding with digital credit apps, e-signatures, and automated setup</p></div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Onboarding</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Start Customer Onboarding</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-sm font-medium">Company Name</label><Input value={form.companyName || ""} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="ABC Logistics" /></div>
              <div><label className="text-sm font-medium">Contact Email</label><Input value={form.contactEmail || ""} onChange={e => setForm({ ...form, contactEmail: e.target.value })} placeholder="contact@company.com" /></div>
              <div><label className="text-sm font-medium">Contact Name</label><Input value={form.contactName || ""} onChange={e => setForm({ ...form, contactName: e.target.value })} placeholder="John Smith" /></div>
            </div>
            <Button className="w-full mt-4" onClick={() => createFlow.mutate(form)} disabled={createFlow.isPending}>{createFlow.isPending ? "Creating..." : "Start Onboarding"}</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Flows", value: flows.data?.length || 0, icon: UserPlus, color: "text-blue-400" },
          { label: "In Progress", value: flows.data?.filter((f: any) => f.status === "in_progress").length || 0, icon: Clock, color: "text-yellow-400" },
          { label: "Completed", value: flows.data?.filter((f: any) => f.status === "completed").length || 0, icon: CheckCircle, color: "text-green-400" },
          { label: "E-Signatures", value: flows.data?.filter((f: any) => f.signatureStatus === "signed").length || 0, icon: FileSignature, color: "text-purple-400" },
        ].map(s => (
          <Card key={s.label} className="border-border/50"><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
            <s.icon className={`w-8 h-8 ${s.color} opacity-50`} />
          </CardContent></Card>
        ))}
      </div>

      <div className="space-y-3">
        {flows.data?.map((flow: any) => (
          <Card key={flow.id} className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><UserPlus className="w-5 h-5 text-primary" /></div>
                <div>
                  <div className="flex items-center gap-2"><span className="font-semibold">{flow.companyName}</span><Badge className={STATUS_COLORS[flow.status] || "bg-gray-500/20"}>{flow.status?.replace("_", " ")}</Badge></div>
                  <p className="text-sm text-muted-foreground mt-1">{flow.contactEmail} · Step {flow.currentStep || 1} of {flow.totalSteps || 5}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {flow.signatureStatus && <Badge variant="outline"><FileSignature className="w-3 h-3 mr-1" />{flow.signatureStatus}</Badge>}
                {flow.creditAppStatus && <Badge variant="outline">{flow.creditAppStatus}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
        {(!flows.data || flows.data.length === 0) && (
          <Card className="border-dashed"><CardContent className="p-12 text-center"><UserPlus className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" /><h3 className="text-lg font-medium">No onboarding flows</h3><p className="text-sm text-muted-foreground mt-1">Start onboarding new customers with digital credit apps and e-signatures</p></CardContent></Card>
        )}
      </div>
    </div>
  );
}
