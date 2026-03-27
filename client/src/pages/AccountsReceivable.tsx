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
import { DollarSign, Plus, FileText, TrendingUp, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSkin } from "@/contexts/SkinContext";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:   { label: "Draft",   color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  sent:    { label: "Sent",    color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  viewed:  { label: "Viewed",  color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  partial: { label: "Partial", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  paid:    { label: "Paid",    color: "bg-green-500/10 text-green-600 border-green-500/20" },
  overdue: { label: "Overdue", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  void:    { label: "Void",    color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

const fmt = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function AccountsReceivable() {
  const { t } = useSkin();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    arInvoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    arIssueDate: new Date().toISOString().split("T")[0],
    arDueDate: "",
    arPaymentTerms: "Net 30",
    arNotes: "",
    arTotalCents: "",
    arSubtotalCents: "",
  });

  const { data, isLoading, refetch } = trpc.ar.list.useQuery({ page: 1, limit: 50 });
  const { data: aging } = trpc.ar.agingReport.useQuery();
  const createInvoice = trpc.ar.create.useMutation({
    onSuccess: () => {
      toast.success("Invoice created successfully");
      setShowCreate(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const updateStatus = trpc.ar.updateStatus.useMutation({
    onSuccess: () => { toast.success("Invoice status updated"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    const totalCents = Math.round(parseFloat(form.arTotalCents || "0") * 100);
    createInvoice.mutate({
      arInvoiceNumber: form.arInvoiceNumber,
      arIssueDate: new Date(form.arIssueDate).getTime(),
      arDueDate: form.arDueDate ? new Date(form.arDueDate).getTime() : undefined,
      arPaymentTerms: form.arPaymentTerms,
      arNotes: form.arNotes,
      arTotalCents: totalCents,
      arSubtotalCents: totalCents,
      arLineItems: [],
    });
  };

  const agingData = aging ?? { current: 0, days30: 0, days60: 0, days90plus: 0, total: 0 };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-500" />
            Accounts Receivable
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage customer invoices and incoming payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const rows = [["Invoice #","Issue Date","Due Date","Amount","Balance Due","Status"]];
            (data?.items ?? []).forEach((inv: any) => rows.push([inv.invoiceNumber, new Date(inv.issueDate).toLocaleDateString(), inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "", fmt(inv.totalCents), fmt(inv.balanceDueCents), inv.status]));
            const csv = rows.map(r => r.join(",")).join("\n");
            const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = "ar-aging-report.csv"; a.click();
            toast.success("Aging report exported");
          }}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          <Button onClick={() => setShowCreate(true)} className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Aging Report */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Aging Report — Outstanding Receivables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Current", value: agingData.current, color: "text-green-600" },
              { label: "1–30 Days", value: agingData.days30, color: "text-yellow-600" },
              { label: "31–60 Days", value: agingData.days60, color: "text-orange-500" },
              { label: "90+ Days", value: agingData.days90plus, color: "text-red-500" },
              { label: "Total Outstanding", value: agingData.total, color: "text-foreground", bold: true },
            ].map(item => (
              <div key={item.label} className={cn("text-center p-3 rounded-lg bg-muted/30", item.bold && "bg-orange-500/10")}>
                <p className={cn("text-xl font-bold", item.color)}>{fmt(item.value)}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
            </div>
          ) : (data?.items ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">No invoices yet</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Create your first invoice to start tracking receivables</p>
              <Button onClick={() => setShowCreate(true)} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> Create Invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Issue Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Balance Due</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items ?? []).map(inv => {
                    const statusCfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;
                    const isOverdue = inv.dueDate && inv.dueDate < Date.now() && !["paid", "void"].includes(inv.status);
                    return (
                      <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(inv.issueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className={cn(isOverdue && "text-red-500 font-medium")}>
                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                            {isOverdue && " ⚠"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">{fmt(inv.totalCents)}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{fmt(inv.balanceDueCents)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-xs", statusCfg.color)}>
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={inv.status}
                            onValueChange={(val) => updateStatus.mutate({
                              id: inv.id,
                              status: val as "draft" | "sent" | "viewed" | "partial" | "paid" | "overdue" | "void",
                              ...(val === "paid" ? { amountPaidCents: inv.totalCents, paidDate: Date.now() } : {}),
                            })}
                          >
                            <SelectTrigger className="h-7 text-xs w-28">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Invoice Number</Label>
                <Input value={form.arInvoiceNumber} onChange={e => setForm(f => ({ ...f, arInvoiceNumber: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Total Amount ($)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.arTotalCents} onChange={e => setForm(f => ({ ...f, arTotalCents: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Issue Date</Label>
                <Input type="date" value={form.arIssueDate} onChange={e => setForm(f => ({ ...f, arIssueDate: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.arDueDate} onChange={e => setForm(f => ({ ...f, arDueDate: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Payment Terms</Label>
                <Select value={form.arPaymentTerms} onValueChange={v => setForm(f => ({ ...f, arPaymentTerms: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Due on Receipt", "Net 15", "Net 30", "Net 45", "Net 60", "Net 90"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>{t("notes")}</Label>
                <Input placeholder="Payment instructions, notes..." value={form.arNotes} onChange={e => setForm(f => ({ ...f, arNotes: e.target.value }))} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createInvoice.isPending} className="bg-green-600 hover:bg-green-700 text-white">
              {createInvoice.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
