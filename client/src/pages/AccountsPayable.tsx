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
import { TrendingDown, Plus, Receipt, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSkin } from "@/contexts/SkinContext";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:    { label: "Draft",    color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  pending:  { label: "Pending",  color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  approved: { label: "Approved", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  partial:  { label: "Partial",  color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  paid:     { label: "Paid",     color: "bg-green-500/10 text-green-600 border-green-500/20" },
  overdue:  { label: "Overdue",  color: "bg-red-500/10 text-red-500 border-red-500/20" },
  void:     { label: "Void",     color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

const fmt = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function AccountsPayable() {
  const { t } = useSkin();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    apBillNumber: `BILL-${Date.now().toString().slice(-6)}`,
    apIssueDate: new Date().toISOString().split("T")[0],
    apDueDate: "",
    apCategory: "",
    apNotes: "",
    apTotalCents: "",
  });

  const { data, isLoading, refetch } = trpc.ap.list.useQuery({ page: 1, limit: 50 });
  const createBill = trpc.ap.create.useMutation({
    onSuccess: () => {
      toast.success("Bill created successfully");
      setShowCreate(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const updateStatus = trpc.ap.updateStatus.useMutation({
    onSuccess: () => { toast.success("Bill status updated"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    const totalCents = Math.round(parseFloat(form.apTotalCents || "0") * 100);
    createBill.mutate({
      apBillNumber: form.apBillNumber,
      apIssueDate: new Date(form.apIssueDate).getTime(),
      apDueDate: form.apDueDate ? new Date(form.apDueDate).getTime() : undefined,
      apCategory: form.apCategory || undefined,
      apNotes: form.apNotes || undefined,
      apTotalCents: totalCents,
      apSubtotalCents: totalCents,
      apLineItems: [],
    });
  };

  const items = data?.items ?? [];
  const totalPending = items.filter(b => !["paid", "void"].includes(b.status)).reduce((sum, b) => sum + b.balanceDueCents, 0);
  const totalOverdue = items.filter(b => b.status === "overdue").reduce((sum, b) => sum + b.balanceDueCents, 0);
  const totalPaid = items.filter(b => b.status === "paid").reduce((sum, b) => sum + b.amountPaidCents, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-red-500" />
            Accounts Payable
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage vendor bills and outgoing payments</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-red-600 hover:bg-red-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Bill
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Outstanding", value: totalPending, color: "text-foreground", bg: "bg-muted/30" },
          { label: "Overdue", value: totalOverdue, color: "text-red-500", bg: "bg-red-500/5" },
          { label: "Paid (All Time)", value: totalPaid, color: "text-green-600", bg: "bg-green-500/5" },
        ].map(item => (
          <Card key={item.label} className={item.bg}>
            <CardContent className="p-4">
              <p className={cn("text-2xl font-bold", item.color)}>{fmt(item.value)}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bills Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">No bills yet</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Add vendor bills to track your payables</p>
              <Button onClick={() => setShowCreate(true)} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" /> Add Bill
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bill #</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Issue Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Balance</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(bill => {
              const statusCfg = STATUS_CONFIG[bill.status] ?? STATUS_CONFIG.pending;
                    const isOverdue = bill.dueDate && bill.dueDate < Date.now() && !["paid", "void"].includes(bill.status);                   return (
                      <tr key={bill.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                          {bill.billNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{bill.category || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(bill.issueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className={cn(isOverdue && "text-red-500 font-medium")}>
                            {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : "—"}
                            {isOverdue && " ⚠"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">{fmt(bill.totalCents)}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{fmt(bill.balanceDueCents)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-xs", statusCfg.color)}>
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={bill.status}
                            onValueChange={(val) => updateStatus.mutate({
                              id: bill.id,
                              status: val as "draft" | "pending" | "approved" | "partial" | "paid" | "overdue" | "void",
                              ...(val === "paid" ? { amountPaidCents: bill.totalCents, paidDate: Date.now() } : {}),
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
            <DialogTitle>Add Vendor Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bill Number</Label>
                <Input value={form.apBillNumber} onChange={e => setForm(f => ({ ...f, apBillNumber: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Total Amount ($)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.apTotalCents} onChange={e => setForm(f => ({ ...f, apTotalCents: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Issue Date</Label>
                <Input type="date" value={form.apIssueDate} onChange={e => setForm(f => ({ ...f, apIssueDate: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.apDueDate} onChange={e => setForm(f => ({ ...f, apDueDate: e.target.value }))} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>Category</Label>
                <Select value={form.apCategory} onValueChange={v => setForm(f => ({ ...f, apCategory: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select category..." /></SelectTrigger>
                  <SelectContent>
                    {["Rent/Lease", "Utilities", "Insurance", "Software/SaaS", "Marketing", "Payroll", "Supplies", "Equipment", "Professional Services", "Shipping/Freight", "Other"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>{t("notes")}</Label>
                <Input placeholder="Vendor name, invoice reference, notes..." value={form.apNotes} onChange={e => setForm(f => ({ ...f, apNotes: e.target.value }))} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createBill.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {createBill.isPending ? "Creating..." : "Add Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
