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
import {
  DollarSign, TrendingUp, AlertTriangle, CheckCircle2, Building2,
  Plus, FileText, Ban, RefreshCw, ExternalLink, Search
} from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const fmtK = (cents: number) => {
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}k`;
  return `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
};

const TIER_COLORS: Record<string, string> = {
  success_starter:    "bg-gray-500/10 text-gray-500 border-gray-500/20",
  growth_foundation:  "bg-blue-500/10 text-blue-500 border-blue-500/20",
  fortune_foundation: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  fortune:            "bg-orange-500/10 text-orange-500 border-orange-500/20",
  fortune_plus:       "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  trial:              "bg-green-500/10 text-green-600 border-green-500/20",
};

const TIER_LABELS: Record<string, string> = {
  success_starter:    "Success Starter",
  growth_foundation:  "Growth Foundation",
  fortune_foundation: "Fortune Foundation",
  fortune:            "Fortune",
  fortune_plus:       "Fortune Plus",
  trial:              "Trial",
};

const STATUS_COLORS: Record<string, string> = {
  active:    "bg-green-500/10 text-green-600 border-green-500/20",
  trial:     "bg-blue-500/10 text-blue-500 border-blue-500/20",
  suspended: "bg-red-500/10 text-red-500 border-red-500/20",
  cancelled: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const INV_STATUS_COLORS: Record<string, string> = {
  open:    "bg-blue-500/10 text-blue-500 border-blue-500/20",
  paid:    "bg-green-500/10 text-green-600 border-green-500/20",
  overdue: "bg-red-500/10 text-red-500 border-red-500/20",
  void:    "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function ApexPaymentManagement() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<{ id: number; name: string } | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    amountDueCents: "",
    description: "",
    invoiceType: "subscription" as "subscription" | "ai_credits" | "user_addon" | "manual",
    dueDate: "",
  });

  const { data, isLoading, refetch } = trpc.billingMgmt.allTenantPayments.useQuery({ page: 1, limit: 100 });
  const createInvoice = trpc.billingMgmt.createManualInvoice.useMutation({
    onSuccess: () => {
      toast.success("Invoice created successfully");
      setShowInvoiceDialog(false);
      setInvoiceForm({ amountDueCents: "", description: "", invoiceType: "subscription", dueDate: "" });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const markPaid = trpc.billingMgmt.markInvoicePaid.useMutation({
    onSuccess: () => { toast.success("Invoice marked as paid"); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const setTenantStatus = trpc.billingMgmt.setTenantStatus.useMutation({
    onSuccess: () => { toast.success("Tenant status updated"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const stats = data?.stats ?? { mrr: 0, arr: 0, overdueTotal: 0, collectedThisMonth: 0 };
  const allTenants = data?.items ?? [];

  const filtered = allTenants.filter(t =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subscriptionTier?.toLowerCase().includes(search.toLowerCase())
  );

  const overdueCount = allTenants.filter(t =>
    t.recentInvoices?.some((inv: { siStatus: string }) => inv.siStatus === "overdue")
  ).length;

  const handleCreateInvoice = () => {
    if (!selectedTenant) return;
    const amountCents = Math.round(parseFloat(invoiceForm.amountDueCents || "0") * 100);
    createInvoice.mutate({
      tenantCompanyId: selectedTenant.id,
      amountDueCents: amountCents,
      description: invoiceForm.description,
      invoiceType: invoiceForm.invoiceType,
      dueDate: invoiceForm.dueDate ? new Date(invoiceForm.dueDate).getTime() : undefined,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-orange-500" />
            Payment Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor all tenant subscriptions, invoices, and revenue</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Monthly Recurring Revenue", value: fmtK(stats.mrr * 100), sub: "MRR", color: "text-green-600", bg: "bg-green-500/5" },
          { label: "Annual Recurring Revenue", value: fmtK(stats.arr * 100), sub: "ARR", color: "text-blue-500", bg: "bg-blue-500/5" },
          { label: "Collected This Month", value: fmtK(stats.collectedThisMonth), sub: "Payments", color: "text-orange-500", bg: "bg-orange-500/5" },
          { label: "Overdue Balance", value: fmtK(stats.overdueTotal), sub: `${overdueCount} accounts`, color: "text-red-500", bg: "bg-red-500/5" },
        ].map(stat => (
          <Card key={stat.label} className={stat.bg}>
            <CardContent className="p-4">
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              <p className="text-xs text-muted-foreground/60">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">All Tenants</TabsTrigger>
            <TabsTrigger value="overdue">
              Overdue
              {overdueCount > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs h-4 px-1">{overdueCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="invoices">All Invoices</TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>

        {/* All Tenants Tab */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No tenant companies found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Trial Ends</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Invoice</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(tenant => {
                        const lastInv = tenant.recentInvoices?.[0];
                        const hasOverdue = tenant.recentInvoices?.some((inv: { siStatus: string }) => inv.siStatus === "overdue");
                        return (
                          <tr key={tenant.id} className={cn(
                            "border-b border-border/50 hover:bg-muted/20 transition-colors",
                            hasOverdue && "bg-red-500/5"
                          )}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {hasOverdue && <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                                <span className="font-medium text-foreground">{tenant.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={cn("text-xs", TIER_COLORS[tenant.subscriptionTier ?? "trial"] ?? "")}>
                                {TIER_LABELS[tenant.subscriptionTier ?? "trial"] ?? tenant.subscriptionTier ?? "Trial"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={cn("text-xs", STATUS_COLORS[tenant.subscriptionStatus ?? "trial"] ?? "")}>
                                {(tenant.subscriptionStatus ?? "trial").charAt(0).toUpperCase() + (tenant.subscriptionStatus ?? "trial").slice(1)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {lastInv ? (
                                <span className="flex items-center gap-1">
                                  <span className="text-foreground">{fmt(lastInv.amountDueCents)}</span>
                                  <Badge variant="outline" className={cn("text-xs", INV_STATUS_COLORS[lastInv.siStatus] ?? "")}>
                                    {lastInv.siStatus}
                                  </Badge>
                                </span>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => { setSelectedTenant({ id: tenant.id, name: tenant.name }); setShowInvoiceDialog(true); }}
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Invoice
                                </Button>
                                {tenant.subscriptionStatus === "active" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
                                    onClick={() => setTenantStatus.mutate({ tenantCompanyId: tenant.id, status: "suspended" })}
                                  >
                                    <Ban className="h-3 w-3 mr-1" /> Suspend
                                  </Button>
                                ) : tenant.subscriptionStatus === "suspended" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-green-600 border-green-500/30 hover:bg-green-500/10"
                                    onClick={() => setTenantStatus.mutate({ tenantCompanyId: tenant.id, status: "active" })}
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Reactivate
                                  </Button>
                                ) : null}
                              </div>
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
        </TabsContent>

        {/* Overdue Tab */}
        <TabsContent value="overdue" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filtered.filter(t => t.recentInvoices?.some((inv: { siStatus: string }) => inv.siStatus === "overdue")).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500/40 mb-3" />
                  <p className="text-muted-foreground font-medium">No overdue accounts</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">All tenant payments are current</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Overdue Amount</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered
                        .filter(t => t.recentInvoices?.some((inv: { siStatus: string }) => inv.siStatus === "overdue"))
                        .map(tenant => {
                          const overdueInvs = tenant.recentInvoices?.filter((inv: { siStatus: string }) => inv.siStatus === "overdue") ?? [];
                          const overdueTotal = overdueInvs.reduce((sum: number, inv: { amountDueCents: number; amountPaidCents: number }) => sum + (inv.amountDueCents - inv.amountPaidCents), 0);
                          return (
                            <tr key={tenant.id} className="border-b border-border/50 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                              <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                {tenant.name}
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className={cn("text-xs", TIER_COLORS[tenant.subscriptionTier ?? "trial"] ?? "")}>
                                  {TIER_LABELS[tenant.subscriptionTier ?? "trial"] ?? "Trial"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 font-bold text-red-500">{fmt(overdueTotal)}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  {overdueInvs.map((inv: { id: number; amountDueCents: number }) => (
                                    <Button
                                      key={inv.id}
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs text-green-600 border-green-500/30 hover:bg-green-500/10"
                                      onClick={() => markPaid.mutate({ invoiceId: inv.id, amountPaidCents: inv.amountDueCents })}
                                    >
                                      <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Paid
                                    </Button>
                                  ))}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10"
                                    onClick={() => setTenantStatus.mutate({ tenantCompanyId: tenant.id, status: "suspended" })}
                                  >
                                    <Ban className="h-3 w-3 mr-1" /> Suspend
                                  </Button>
                                </div>
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
        </TabsContent>

        {/* All Invoices Tab */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {filtered.flatMap(t => t.recentInvoices ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No invoices found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.flatMap(tenant =>
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ((tenant.recentInvoices ?? []) as any[]).map((inv: {
                          id: number;
                          invoiceType: string;
                          amountDueCents: number;
                          siStatus: string;
                          dueDate: number | null;
                          description: string;
                        }) => (
                          <tr key={`${tenant.id}-${inv.id}`} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 font-medium text-foreground">{tenant.name}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{inv.invoiceType?.replace("_", " ")}</td>
                            <td className="px-4 py-3 font-semibold text-foreground">{fmt(inv.amountDueCents)}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={cn("text-xs", INV_STATUS_COLORS[inv.siStatus] ?? "")}>
                                {inv.siStatus}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {inv.siStatus !== "paid" && inv.siStatus !== "void" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-green-600 border-green-500/30 hover:bg-green-500/10"
                                  onClick={() => markPaid.mutate({ invoiceId: inv.id, amountPaidCents: inv.amountDueCents })}
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Paid
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Invoice — {selectedTenant?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Invoice Type</Label>
              <Select value={invoiceForm.invoiceType} onValueChange={v => setInvoiceForm(f => ({ ...f, invoiceType: v as typeof f.invoiceType }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="ai_credits">AI Credits</SelectItem>
                  <SelectItem value="user_addon">User Add-on</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={invoiceForm.amountDueCents}
                onChange={e => setInvoiceForm(f => ({ ...f, amountDueCents: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                placeholder="Monthly subscription — Fortune Plan"
                value={invoiceForm.description}
                onChange={e => setInvoiceForm(f => ({ ...f, description: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={invoiceForm.dueDate}
                onChange={e => setInvoiceForm(f => ({ ...f, dueDate: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateInvoice}
              disabled={createInvoice.isPending || !invoiceForm.description || !invoiceForm.amountDueCents}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {createInvoice.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
