import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  CreditCard, Download, ExternalLink, RefreshCw, AlertCircle,
  CheckCircle2, Clock, XCircle, Calendar, TrendingUp, Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSkin } from "@/contexts/SkinContext";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  paid: { label: "Paid", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  open: { label: "Open", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  draft: { label: "Draft", color: "bg-stone-100 text-stone-600 border-stone-200", icon: Receipt },
  uncollectible: { label: "Uncollectible", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  void: { label: "Void", color: "bg-stone-100 text-stone-500 border-stone-200", icon: XCircle },
};

const SUB_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  past_due: { label: "Past Due", color: "bg-red-100 text-red-700 border-red-200" },
  canceled: { label: "Canceled", color: "bg-stone-100 text-stone-600 border-stone-200" },
  trialing: { label: "Trial", color: "bg-blue-100 text-blue-700 border-blue-200" },
  unpaid: { label: "Unpaid", color: "bg-red-100 text-red-700 border-red-200" },
  incomplete: { label: "Incomplete", color: "bg-amber-100 text-amber-700 border-amber-200" },
};

export default function BillingHistory() {
  const { t } = useSkin();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data, isLoading, refetch } = trpc.billing.invoices.useQuery(undefined, {
    retry: false,
  });

  const allowedRoles = ["company_admin", "axiom_admin", "axiom_owner", "apex_owner", "developer"];
  if (user && !allowedRoles.includes(user.systemRole || user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-stone-400" />
        <h2 className="text-xl font-semibold text-stone-700">Access Restricted</h2>
        <p className="text-stone-500">Billing history is only available to Company Admins and above.</p>
        <Button variant="outline" onClick={() => navigate("/")}>Back to Dashboard</Button>
      </div>
    );
  }

  const sub = data?.subscriptionStatus;
  const invoices = data?.invoices ?? [];
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Billing History</h1>
          <p className="text-stone-500 text-sm mt-0.5">Your subscription invoices and payment records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/billing")} className="gap-2">
            <CreditCard className="w-4 h-4" />
            Manage Plan
          </Button>
        </div>
      </div>

      {/* Subscription Status Card */}
      {isLoading ? (
        <Skeleton className="h-28 w-full rounded-xl" />
      ) : sub ? (
        <Card className="border-stone-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Current Plan</p>
                  <p className="text-lg font-semibold text-stone-900">{sub.planName}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-xs text-stone-500">Status</p>
                  <Badge className={`mt-1 border text-xs font-medium ${SUB_STATUS_CONFIG[sub.status]?.color ?? "bg-stone-100 text-stone-600"}`}>
                    {SUB_STATUS_CONFIG[sub.status]?.label ?? sub.status}
                  </Badge>
                </div>
                {sub.currentPeriodEnd && (
                  <div>
                    <p className="text-xs text-stone-500">
                      {sub.cancelAtPeriodEnd ? "Cancels on" : "Renews on"}
                    </p>
                    <p className="text-sm font-medium text-stone-700 mt-1">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-stone-500">Total Paid</p>
                  <p className="text-sm font-semibold text-emerald-700 mt-1">
                    ${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
            {sub.cancelAtPeriodEnd && (
              <div className="mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Your subscription is set to cancel at the end of the billing period. Contact your AXIOM Owner to reactivate.
              </div>
            )}
          </CardContent>
        </Card>
      ) : !isLoading && (
        <Card className="border-stone-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-stone-800">No active subscription found</p>
              <p className="text-sm text-stone-500 mt-0.5">
                Subscribe to a plan to unlock all AXIOM CRM features.{" "}
                <button onClick={() => navigate("/billing")} className="text-amber-600 hover:underline font-medium">
                  View Plans →
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Table */}
      <Card className="border-stone-200 shadow-sm">
        <CardHeader className="pb-3 px-5 pt-5">
          <CardTitle className="text-base font-semibold text-stone-800 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-500" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <div className="px-5 pb-5 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : invoices.length === 0 ? (
            <div className="px-5 pb-8 pt-4 text-center">
              <Receipt className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500 text-sm">No invoices yet. They will appear here once you subscribe to a plan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Invoice</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Description</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, i) => {
                    const statusCfg = STATUS_CONFIG[inv.status ?? "draft"] ?? STATUS_CONFIG.draft;
                    const StatusIcon = statusCfg.icon;
                    return (
                      <tr key={inv.id} className={`border-b border-stone-50 hover:bg-stone-50/50 transition-colors ${i === invoices.length - 1 ? "border-0" : ""}`}>
                        <td className="px-5 py-4 font-mono text-xs text-stone-600">{inv.number ?? inv.id.slice(-8).toUpperCase()}</td>
                        <td className="px-5 py-4 text-stone-700 max-w-[200px] truncate">{inv.description}</td>
                        <td className="px-5 py-4 text-stone-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            {new Date(inv.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-stone-800">
                          ${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {inv.currency}
                        </td>
                        <td className="px-5 py-4">
                          <Badge className={`border text-xs font-medium gap-1 ${statusCfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            {inv.pdfUrl && (
                              <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs gap-1.5 text-stone-600 hover:text-stone-900">
                                  <Download className="w-3.5 h-3.5" />
                                  PDF
                                </Button>
                              </a>
                            )}
                            {inv.hostedUrl && (
                              <a href={inv.hostedUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs gap-1.5 text-stone-600 hover:text-stone-900">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  View
                                </Button>
                              </a>
                            )}
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

      <p className="text-xs text-stone-400 text-center pb-4">
        Billing is managed securely by Stripe. AXIOM CRM never stores your payment card details.
      </p>
    </div>
  );
}
