import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle2, Clock, AlertTriangle, ExternalLink, DollarSign, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const TIER_LABELS: Record<string, string> = {
  success_starter:    "Solo",
  growth_foundation:  "Starter",
  fortune_foundation: "Growth",
  fortune:            "Fortune Foundation",
  fortune_plus:       "Fortune Plus",
  trial:              "Trial",
};

const TIER_PRICES: Record<string, number> = {
  success_starter:    49,
  growth_foundation:  97,
  fortune_foundation: 297,
  fortune:            497,
  fortune_plus:       1497,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active:    { label: "Active",    color: "text-green-600 border-green-500/30 bg-green-500/10",  icon: CheckCircle2 },
  trial:     { label: "Trial",     color: "text-blue-500 border-blue-500/30 bg-blue-500/10",     icon: Clock },
  suspended: { label: "Suspended", color: "text-red-500 border-red-500/30 bg-red-500/10",        icon: AlertTriangle },
  cancelled: { label: "Cancelled", color: "text-gray-400 border-gray-500/30 bg-gray-500/10",     icon: AlertTriangle },
};

const INV_STATUS_COLORS: Record<string, string> = {
  open:    "bg-blue-500/10 text-blue-500 border-blue-500/20",
  paid:    "bg-green-500/10 text-green-600 border-green-500/20",
  overdue: "bg-red-500/10 text-red-500 border-red-500/20",
  void:    "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function TenantBilling() {
  const { data, isLoading } = trpc.billingMgmt.mySubscription.useQuery();
  const createPortal = trpc.billingMgmt.createPortalSession.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  const company = data?.company;
  const card = data?.card;
  const invoices = data?.recentInvoices ?? [];

  const status = company?.subscriptionStatus ?? "trial";
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.trial;
  const StatusIcon = statusCfg.icon;

  const tier = company?.subscriptionTier ?? "trial";
  const tierLabel = TIER_LABELS[tier] ?? tier;
  const tierPrice = TIER_PRICES[tier];

  const trialDaysLeft = company?.trialEndsAt
    ? Math.max(0, Math.floor((company.trialEndsAt - Date.now()) / 86400000))
    : null;

  const hasOverdue = invoices.some(inv => inv.siStatus === "overdue");

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-orange-500" />
          Billing & Subscription
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your subscription, payment method, and invoices</p>
      </div>

      {/* Overdue Alert */}
      {hasOverdue && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-500">Payment Overdue</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              You have overdue invoices. Please update your payment method or contact support to avoid service interruption.
            </p>
            <Button
              onClick={() => createPortal.mutate()}
              disabled={createPortal.isPending}
              size="sm"
              className="mt-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Update Payment Method
            </Button>
          </div>
        </div>
      )}

      {/* Trial Alert */}
      {status === "trial" && trialDaysLeft !== null && (
        <div className={cn(
          "flex items-start gap-3 p-4 rounded-xl border",
          trialDaysLeft <= 7
            ? "border-red-500/30 bg-red-500/10"
            : "border-blue-500/30 bg-blue-500/10"
        )}>
          <Clock className={cn("h-5 w-5 mt-0.5 flex-shrink-0", trialDaysLeft <= 7 ? "text-red-500" : "text-blue-500")} />
          <div>
            <p className={cn("font-semibold", trialDaysLeft <= 7 ? "text-red-500" : "text-blue-500")}>
              {trialDaysLeft === 0 ? "Trial expires today!" : `${trialDaysLeft} days left in your trial`}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add a payment method to continue using Apex CRM after your trial ends.
            </p>
          </div>
        </div>
      )}

      {/* Subscription Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-foreground">{tierLabel}</span>
              <Badge variant="outline" className={cn("text-xs", statusCfg.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusCfg.label}
              </Badge>
            </div>
            {tierPrice && (
              <p className="text-muted-foreground text-sm">
                <span className="text-2xl font-bold text-foreground">${tierPrice}</span>
                <span className="text-muted-foreground">/month</span>
              </p>
            )}
            {trialDaysLeft !== null && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Trial ends {company?.trialEndsAt ? new Date(company.trialEndsAt).toLocaleDateString() : "—"}
              </p>
            )}
            <Button
              onClick={() => createPortal.mutate()}
              disabled={createPortal.isPending}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {createPortal.isPending ? "Opening portal..." : "Manage Subscription"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Opens Stripe's secure billing portal to update your plan, add/change payment methods, and download invoices.
            </p>
          </CardContent>
        </Card>

        {/* Payment Method Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {card ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-foreground capitalize">
                    {card.brand} •••• {card.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {card.expMonth}/{card.expYear}
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto text-xs text-green-600 border-green-500/30 bg-green-500/10">
                  Active
                </Badge>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CreditCard className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No payment method on file</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Add a credit card to continue after your trial
                </p>
              </div>
            )}
            <Button
              onClick={() => createPortal.mutate()}
              disabled={createPortal.isPending}
              variant="outline"
              className="w-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {card ? "Update Payment Method" : "Add Payment Method"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Invoice History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Invoice History
          </CardTitle>
          <CardDescription>Your recent billing statements</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <DollarSign className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No invoices yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Invoices will appear here after your first billing cycle</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Paid Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className={cn(
                      "border-b border-border/50 hover:bg-muted/20 transition-colors",
                      inv.siStatus === "overdue" && "bg-red-500/5"
                    )}>
                      <td className="px-4 py-3 text-foreground">{inv.description || "Subscription"}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{fmt(inv.amountDueCents)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-xs", INV_STATUS_COLORS[inv.siStatus] ?? "")}>
                          {inv.siStatus === "overdue" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {inv.siStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
