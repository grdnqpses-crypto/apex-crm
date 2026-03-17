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
    starter: "bg-blue-100 text-blue-700 border-blue-200",
    professional: "bg-purple-100 text-purple-700 border-purple-200",
    enterprise: "bg-emerald-100 text-emerald-700 border-emerald-200",
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

  const isAdmin = user && ["developer", "apex_owner", "company_admin"].includes(user.systemRole);
  const currentTier = subscription?.tier || "trial";
  const isOnTrial = currentTier === "trial";

  const handleUpgrade = (planId: string) => {
    if (!isAdmin) {
      toast.error("Only company admins can manage billing");
      return;
    }
    setLoadingPlan(planId);
    createCheckout.mutate({
      planId: planId as any,
      billing: billingCycle,
      origin: window.location.origin,
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
          <p className="text-muted-foreground mt-1">Manage your subscription and billing information.</p>
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

      {/* ─── Billing Cycle Toggle ─── */}
      <div id="pricing-section" className="flex items-center justify-center gap-4 py-2">
        <Label className={billingCycle === "monthly" ? "font-semibold" : "text-muted-foreground"}>Monthly</Label>
        <Switch
          checked={billingCycle === "annual"}
          onCheckedChange={(v) => setBillingCycle(v ? "annual" : "monthly")}
        />
        <Label className={billingCycle === "annual" ? "font-semibold" : "text-muted-foreground"}>
          Annual
          <Badge variant="secondary" className="ml-2 text-xs bg-emerald-100 text-emerald-700">Save 20%</Badge>
        </Label>
      </div>

      {/* ─── Pricing Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(plans || []).map((plan) => {
          const price = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
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
                  {plan.tier === "starter" && <Zap className="h-5 w-5 text-blue-500" />}
                  {plan.tier === "professional" && <Crown className="h-5 w-5 text-purple-500" />}
                  {plan.tier === "enterprise" && <Shield className="h-5 w-5 text-emerald-500" />}
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{formatPrice(price)}</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                  {billingCycle === "annual" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Billed annually ({formatPrice(price * 12)}/yr)
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
            a: "We offer a 14-day money-back guarantee on all plans. Contact support within 14 days of your first payment.",
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
