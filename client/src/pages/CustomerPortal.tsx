import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Globe, Plus, Users, FileText, Eye, Shield } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

export default function CustomerPortal() {
  const { t } = useSkin();
  const [showGrant, setShowGrant] = useState(false);
  const [form, setForm] = useState<any>({});
  const access = trpc.portal.listAccess.useQuery();
  const quotes = trpc.portal.listQuotes.useQuery();
  const grantAccess = trpc.portal.grantAccess.useMutation({ onSuccess: () => { access.refetch(); setShowGrant(false); setForm({}); toast.success("Portal access granted"); } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Customer Portal</h1><p className="text-muted-foreground">Self-service portal for shippers — quote requests, load tracking, invoice viewing</p></div>
        <Dialog open={showGrant} onOpenChange={setShowGrant}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Grant Access</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Grant Portal Access</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-sm font-medium">Contact ID</label><Input type="number" value={form.contactId || ""} onChange={e => setForm({ ...form, contactId: Number(e.target.value) })} /></div>
              <div><label className="text-sm font-medium">Email</label><Input value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="shipper@company.com" /></div>
            </div>
            <Button className="w-full mt-4" onClick={() => grantAccess.mutate({ contactId: form.contactId, email: form.email })} disabled={grantAccess.isPending}>{grantAccess.isPending ? "Granting..." : "Grant Access"}</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Portal Users", value: access.data?.length || 0, icon: Users, color: "text-blue-400" },
          { label: "Quote Requests", value: quotes.data?.length || 0, icon: FileText, color: "text-green-400" },
          { label: "Active Sessions", value: 0, icon: Eye, color: "text-purple-400" },
        ].map(s => (
          <Card key={s.label} className="border-border/50"><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
            <s.icon className={`w-8 h-8 ${s.color} opacity-50`} />
          </CardContent></Card>
        ))}
      </div>

      <Card className="border-border/50"><CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Shield className="w-5 h-5" />Portal Users</h3>
        <div className="space-y-3">
          {access.data?.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div><p className="font-medium">{a.email}</p><p className="text-sm text-muted-foreground">Contact #{a.contactId}</p></div>
              <Badge className={a.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20"}>{a.isActive ? "Active" : "Inactive"}</Badge>
            </div>
          ))}
          {(!access.data || access.data.length === 0) && <p className="text-center text-muted-foreground py-8">No portal users yet. Grant access to shippers so they can track loads and view invoices.</p>}
        </div>
      </CardContent></Card>
    </div>
  );
}
