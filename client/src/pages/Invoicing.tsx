import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Receipt, Plus, DollarSign, Clock, CheckCircle, AlertTriangle, Send } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400", sent: "bg-blue-500/20 text-blue-400",
  paid: "bg-green-500/20 text-green-400", overdue: "bg-red-500/20 text-red-400",
  cancelled: "bg-gray-500/20 text-gray-400",
};

export default function Invoicing() {
  const { t } = useSkin();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>({});
  const invoices = trpc.invoicing.list.useQuery();
  const createInvoice = trpc.invoicing.create.useMutation({ onSuccess: () => { invoices.refetch(); setShowCreate(false); setForm({}); toast.success("Invoice created"); } });
  const updateInvoice = trpc.invoicing.update.useMutation({ onSuccess: () => { invoices.refetch(); toast.success("Status updated"); } });

  const totalRevenue = invoices.data?.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.totalAmount || 0), 0) || 0;
  const outstanding = invoices.data?.filter((i: any) => i.status === "sent" || i.status === "overdue").reduce((s: number, i: any) => s + Number(i.totalAmount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Invoicing & Billing</h1><p className="text-muted-foreground">Generate invoices from loads, track payments, manage billing</p></div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Invoice</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-sm font-medium">Invoice Number</label><Input value={form.invoiceNumber || ""} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="INV-001" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium">Subtotal ($)</label><Input type="number" value={form.subtotal || ""} onChange={e => setForm({ ...form, subtotal: e.target.value })} /></div>
                <div><label className="text-sm font-medium">Total ($)</label><Input type="number" value={form.totalAmount || ""} onChange={e => setForm({ ...form, totalAmount: e.target.value })} /></div>
              </div>
              <div><label className="text-sm font-medium">Due Date</label><Input type="date" value={form.dueDate || ""} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
              <div><label className="text-sm font-medium">{t("notes")}</label><Input value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <Button className="w-full mt-4" onClick={() => createInvoice.mutate({ totalAmount: Number(form.totalAmount || 0), notes: form.notes })} disabled={createInvoice.isPending}>{createInvoice.isPending ? "Creating..." : "Create Invoice"}</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Invoices", value: invoices.data?.length || 0, icon: Receipt, color: "text-blue-400" },
          { label: "Collected", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-400" },
          { label: "Outstanding", value: `$${outstanding.toLocaleString()}`, icon: Clock, color: "text-yellow-400" },
          { label: "Overdue", value: invoices.data?.filter((i: any) => i.status === "overdue").length || 0, icon: AlertTriangle, color: "text-red-400" },
        ].map(s => (
          <Card key={s.label} className="border-border/50"><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
            <s.icon className={`w-8 h-8 ${s.color} opacity-50`} />
          </CardContent></Card>
        ))}
      </div>

      <div className="space-y-3">
        {invoices.data?.map((inv: any) => (
          <Card key={inv.id} className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Receipt className="w-5 h-5 text-primary" /></div>
                <div>
                  <div className="flex items-center gap-2"><span className="font-semibold">{inv.invoiceNumber || `INV-${inv.id}`}</span><Badge className={STATUS_COLORS[inv.status] || "bg-gray-500/20"}>{inv.status}</Badge></div>
                  <p className="text-sm text-muted-foreground mt-1">{inv.dueDate ? `Due: ${new Date(Number(inv.dueDate)).toLocaleDateString()}` : "No due date"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-lg font-bold text-green-400">${Number(inv.totalAmount || 0).toLocaleString()}</p>
                <Select value={inv.status} onValueChange={v => updateInvoice.mutate({ id: inv.id, status: v })}>
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="sent">Sent</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!invoices.data || invoices.data.length === 0) && (
          <Card className="border-dashed"><CardContent className="p-12 text-center"><Receipt className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" /><h3 className="text-lg font-medium">No invoices yet</h3><p className="text-sm text-muted-foreground mt-1">Create invoices from completed loads or manually</p></CardContent></Card>
        )}
      </div>
    </div>
  );
}
