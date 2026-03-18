import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Check, X, Zap, CreditCard, Shield, Sparkles, Crown,
  Users, BarChart3, Mail, Brain, Building2, ArrowRight,
  AlertCircle, CheckCircle2, Clock
} from "lucide-react";
import { useLocation } from "wouter";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function SubscriptionBadge({ status, tier }: { status: string; tier: string }) {
  const tierColors: Record<string, string> = {
    trial: "bg-amber-100 text-amber-700 border-amber-200",
    success_starter: "bg-sky-100 text-sky-700 border-sky-200",
    growth_foundation: "bg-blue-100 text-blue-700 border-blue-200",
    fortune_foundation: "bg-violet-100 text-violet-700 border-violet-200",
    fortune: "bg-purple-100 text-purple-700 border-purple-200",
    fortune_plus: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  const statusIcons: Record<string, React.ReactNode> = {
    active: <CheckCircle2 className="h-3.5 w-3.5" />,
    trial: <Clock className="h-3.5 w-3.5" />,
    suspended: <AlertCircle className="h-3.5 w-3.5" />,
    cancelled: <X className="h-3.5 w-3.5" />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${tierColors[tier] || "bg-muted text-muted-foreground border-border"}`}>
      {statusIcons[status] || null}
      {tier.charAt(0).toUpperCase() + tier.slice(1)} — {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function Billing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [annualAcknowledged, setAnnualAcknowledged] = useState(false);

  const { data: plans, isLoading: plansLoading } = trpc.billing.plans.useQuery();
  const { data: subscription, isLoading: subLoading } = trpc.billing.subscription.useQuery(undefined, {
    enabled: !!user,
  });

  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
        toast.success("Redirecting to Stripe checkout...");
      }
      setLoadingPlan(null);
    },
    onError: (e) => {
      toast.error(e.message);
      setLoadingPlan(null);
    },
  });

  const createPortal = trpc.billing.createPortal.useMutation({
    onSuccess: (data) => {
      if (data.portalUrl) {
        window.open(data.portalUrl, "_blank");
        toast.success("Opening billing portal...");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const [seatQty, setSeatQty] = useState(1);

  const addUserSeats = trpc.billing.addUserSeats.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
        toast.success(`Redirecting to checkout for ${seatQty} additional seat${seatQty > 1 ? 's' : ''}...`);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAddSeats = () => {
    if (!isAdmin) { toast.error("Only company admins can add user seats"); return; }
    addUserSeats.mutate({ quantity: seatQty, origin: window.location.origin });
  };

  const isAdmin = user && ["developer", "apex_owner", "company_admin"].includes(user.systemRole);
  const currentTier = subscription?.tier || "trial";
  const isOnTrial = currentTier === "trial";

  const handleUpgrade = (planId: string) => {
    if (!isAdmin) {
      toast.error("Only company admins can manage billing");
      return;
    }
    if (billingCycle === "annual" && !annualAcknowledged) {
      toast.error("Please acknowledge the non-refundable annual billing policy before proceeding.");
      document.getElementById("annual-policy-checkbox")?.focus();
      return;
    }
    setLoadingPlan(planId);
    createCheckout.mutate({
      planId: planId as any,
      billing: billingCycle,
      origin: window.location.origin,
      annualAcknowledged: billingCycle === "annual" ? annualAcknowledged : undefined,
    });
  };

  const handleManageBilling = () => {
    createPortal.mutate({ origin: window.location.origin });
  };

  if (plansLoading || subLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing & Plans</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription. Priced 25–83% below HubSpot and Salesforce — with more features included.</p>
        </div>
        {subscription && (
          <div className="flex items-center gap-3">
            <SubscriptionBadge status={subscription.status} tier={subscription.tier} />
            {subscription.stripeCustomerId && isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageBilling}
                disabled={createPortal.isPending}
                className="gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {createPortal.isPending ? "Opening..." : "Manage Billing"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ─── Trial Banner ─── */}
      {isOnTrial && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-900">You're on a free trial</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  {subscription?.trialEndsAt
                    ? `Your trial ends ${new Date(subscription.trialEndsAt).toLocaleDateString()}.`
                    : "Upgrade to unlock all features and remove limits."}
                  {" "}Choose a plan below to get started.
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => document.getElementById("pricing-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                View Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Competitor Savings Banner ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { tier: "1 user", apex: "$74/mo", vs: "HubSpot: $100", save: "26% less" },
          { tier: "5 users", apex: "$149/mo", vs: "HubSpot: $500", save: "70% less" },
          { tier: "15 users", apex: "$374/mo", vs: "HubSpot: $1,500", save: "75% less" },
          { tier: "25 users", apex: "$524/mo", vs: "HubSpot: $3,000", save: "83% less" },
          { tier: "50 users", apex: "$1,124/mo", vs: "HubSpot: $6,000", save: "81% less" },
        ].map((item) => (
          <div key={item.tier} className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
            <p className="text-xs text-muted-foreground">{item.tier}</p>
            <p className="text-lg font-bold text-green-700">{item.apex}</p>
            <p className="text-xs text-muted-foreground line-through">{item.vs}</p>
            <p className="text-xs font-semibold text-green-600">{item.save}</p>
          </div>
        ))}
      </div>

      {/* ─── Billing Cycle Toggle ─── */}
      <div id="pricing-section" className="space-y-4">
        <div className="flex items-center justify-center gap-4 py-2">
          <Label className={billingCycle === "monthly" ? "font-semibold" : "text-muted-foreground"}>Monthly</Label>
          <Switch
            checked={billingCycle === "annual"}
            onCheckedChange={(v) => {
              setBillingCycle(v ? "annual" : "monthly");
              if (!v) setAnnualAcknowledged(false);
            }}
          />
          <Label className={billingCycle === "annual" ? "font-semibold" : "text-muted-foreground"}>
            Annual
            <Badge variant="secondary" className="ml-2 text-xs bg-emerald-100 text-emerald-700">Save 10%</Badge>
          </Label>
        </div>

        {/* Non-refundable acknowledgment — only shown when annual is selected */}
        {billingCycle === "annual" && (
          <Card className="border-amber-200 bg-amber-50/40 max-w-2xl mx-auto">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <input
                  id="annual-policy-checkbox"
                  type="checkbox"
                  checked={annualAcknowledged}
                  onChange={(e) => setAnnualAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-amber-400 accent-amber-600 cursor-pointer shrink-0"
                />
                <label htmlFor="annual-policy-checkbox" className="text-sm text-amber-900 cursor-pointer leading-relaxed">
                  <span className="font-semibold">I understand and agree</span> that annual plans are billed upfront and are{" "}
                  <span className="font-bold uppercase">non-refundable for any reason</span>, including partial-year cancellations.
                  By checking this box, I acknowledge this policy before proceeding to checkout.
                </label>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── Pricing Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {(plans || []).map((plan) => {
          // New pricing: SS=$74, GF=$149, FF=$374, F=$524, FP=$1124
          const newPrices: Record<string, { monthly: number; annual: number }> = {
            success_starter:    { monthly: 7400,   annual: 6660 },
            growth_foundation:  { monthly: 14900,  annual: 13410 },
            fortune_foundation: { monthly: 37400,  annual: 33660 },
            fortune:            { monthly: 52400,  annual: 47160 },
            fortune_plus:       { monthly: 112400, annual: 101160 },
          };
          const pricingOverride = newPrices[plan.tier];
          const price = billingCycle === "annual"
            ? (pricingOverride?.annual ?? plan.annualPricePerMonth)
            : (pricingOverride?.monthly ?? plan.monthlyPrice);
          const isCurrentPlan = currentTier === plan.tier;
          const isPopular = plan.popular;

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col transition-all duration-200 ${
                isPopular
                  ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                  : "hover:border-primary/50 hover:shadow-md"
              } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold shadow-sm">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="outline" className="bg-background text-xs font-semibold border-primary text-primary">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {plan.tier === "success_starter" && <Zap className="h-5 w-5 text-sky-500" />}
                  {plan.tier === "growth_foundation" && <BarChart3 className="h-5 w-5 text-blue-500" />}
                  {plan.tier === "fortune_foundation" && <Brain className="h-5 w-5 text-violet-500" />}
                  {plan.tier === "fortune" && <Crown className="h-5 w-5 text-purple-500" />}
                  {plan.tier === "fortune_plus" && <Shield className="h-5 w-5 text-emerald-500" />}
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{formatPrice(price)}</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                  {billingCycle === "annual" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Billed annually — {formatPrice(plan.annualPriceTotal)}/yr
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-4">
                <div className="space-y-2.5">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground/60"}`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-4">
                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className={`w-full gap-2 ${isPopular ? "" : "variant-outline"}`}
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={!isAdmin || loadingPlan === plan.id || createCheckout.isPending}
                    >
                      {loadingPlan === plan.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      {loadingPlan === plan.id ? "Redirecting..." : `Upgrade to ${plan.name}`}
                    </Button>
                  )}
                  {!isAdmin && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Contact your company admin to upgrade
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Test Mode Notice ─── */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 text-sm">Test Mode Active</p>
              <p className="text-sm text-blue-700 mt-0.5">
                Use card number <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-xs">4242 4242 4242 4242</code> with any future expiry and any 3-digit CVC to test payments.
                {" "}Your Stripe sandbox must be claimed at{" "}
                <a
                  href="https://dashboard.stripe.com/claim_sandbox/YWNjdF8xVEM1Sk5SR0x6eUQ2enpMLDE3NzQzODkwODcv1005hVGBHWJ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  Stripe Dashboard
                </a>
                {" "}before May 16, 2026.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Add User Seats ─── */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Add User Seats
          </CardTitle>
          <CardDescription>
            Need more team members? Add seats to your current plan at <span className="font-semibold text-foreground">$25/user/month</span> — 25% below the market standard of $33–$50/seat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setSeatQty(q => Math.max(1, q - 1))}
                disabled={seatQty <= 1}
              >
                −
              </Button>
              <span className="w-12 text-center font-semibold text-lg">{seatQty}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setSeatQty(q => Math.min(50, q + 1))}
                disabled={seatQty >= 50}
              >
                +
              </Button>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {seatQty} seat{seatQty > 1 ? 's' : ''} × $25/mo = <span className="font-semibold text-foreground">${seatQty * 25}/month</span> added to your subscription
              </p>
            </div>
            <Button
              onClick={handleAddSeats}
              disabled={addUserSeats.isPending || !isAdmin}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              {addUserSeats.isPending ? "Opening checkout..." : `Add ${seatQty} Seat${seatQty > 1 ? 's' : ''}`}
            </Button>
          </div>
          {!isAdmin && (
            <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Only company admins can purchase additional seats.
            </p>
          )}
          <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-500" /> Seats added instantly after payment</div>
            <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-500" /> Cancel extra seats anytime via billing portal</div>
            <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-green-500" /> Prorated automatically by Stripe</div>
          </div>
        </CardContent>
      </Card>

      <Separator />
      {/* ─── FAQ ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            q: "Can I change plans later?",
            a: "Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the end of your billing cycle.",
          },
          {
            q: "What happens when my trial ends?",
            a: "Your account will be paused until you select a paid plan. Your data is preserved for 30 days.",
          },
          {
            q: "Do you offer refunds?",
            a: "Monthly plans can be cancelled at any time with no penalty. Annual plans are billed upfront and are NON-REFUNDABLE for any reason, including partial-year cancellations. You will be asked to acknowledge this policy before completing an annual purchase.",
          },
          {
            q: "How do I cancel?",
            a: "Click 'Manage Billing' above to access the Stripe billing portal where you can cancel at any time.",
          },
        ].map((item, i) => (
          <div key={i} className="space-y-1">
            <p className="font-semibold text-sm">{item.q}</p>
            <p className="text-sm text-muted-foreground">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
