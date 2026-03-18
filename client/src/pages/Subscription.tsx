import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Crown, Zap, CheckCircle, Star, Rocket, BarChart3, Brain, Shield, Users, Plus } from "lucide-react";

// ─── New 5-Tier Structure ───────────────────────────────────────────────────
const PLANS = [
  {
    id: "success_starter",
    name: "Success Starter",
    price: 99,
    desc: "The perfect launchpad for solo brokers and independent agents.",
    baseUsers: 1,
    addOnMax: 5,
    features: [
      "1 user included",
      "Add up to 4 users ($30/user/mo)",
      "2,500 contacts",
      "Core CRM (contacts, companies, deals)",
      "Email campaigns",
      "Load management",
      "AI Assistant (CRM features)",
      "Standard support",
    ],
    color: "border-sky-500/30",
    icon: Zap,
    iconColor: "text-sky-400",
  },
  {
    id: "growth_foundation",
    name: "Growth Foundation",
    price: 197,
    desc: "Built for small brokerages ready to scale their pipeline.",
    baseUsers: 5,
    addOnMax: 15,
    features: [
      "5 users included",
      "Add up to 10 users ($30/user/mo)",
      "10,000 contacts",
      "Full CRM suite",
      "Paradigm Engine™ (Basic)",
      "Ghost Mode sequences",
      "Deliverability suite",
      "Standard support",
    ],
    color: "border-blue-500/30",
    icon: BarChart3,
    iconColor: "text-blue-400",
  },
  {
    id: "fortune_foundation",
    name: "Fortune Foundation",
    price: 497,
    desc: "Advanced automation and AI for mid-size freight operations.",
    baseUsers: 15,
    addOnMax: 25,
    features: [
      "15 users included",
      "Add up to 10 users ($30/user/mo)",
      "50,000 contacts",
      "Paradigm Engine™ (Full)",
      "Ghost Mode + Battle Cards",
      "260 SMTP rotation",
      "Compliance Fortress™",
      "Voice Agent (500 calls/mo)",
      "Priority support",
      "Custom branding",
    ],
    color: "border-violet-500/30",
    popular: true,
    icon: Brain,
    iconColor: "text-violet-400",
  },
  {
    id: "fortune",
    name: "Fortune",
    price: 697,
    desc: "The complete platform for high-performance brokerage teams.",
    baseUsers: 25,
    addOnMax: 40,
    features: [
      "25 users included",
      "Add up to 15 users ($30/user/mo)",
      "100,000 contacts",
      "All Fortune Foundation features",
      "Voice Agent (unlimited calls)",
      "Revenue Autopilot",
      "Apex Autopilot",
      "Custom AI training",
      "Dedicated account manager",
      "White-label option",
    ],
    color: "border-purple-500/30",
    icon: Crown,
    iconColor: "text-purple-400",
  },
  {
    id: "fortune_plus",
    name: "Fortune Plus",
    price: 1497,
    desc: "Enterprise-grade scale with white-glove support and full infrastructure.",
    baseUsers: 50,
    addOnMax: null,
    features: [
      "50 users included",
      "Unlimited contacts",
      "All Fortune features",
      "Dedicated SMTP infrastructure",
      "Custom AI training",
      "99.9% SLA guarantee",
      "Dedicated account manager",
      "White-label option",
      "Priority 24/7 support",
    ],
    color: "border-amber-500/30",
    icon: Shield,
    iconColor: "text-amber-400",
  },
];

export default function Subscription() {
  const sub = trpc.subscriptions.current.useQuery({ companyId: 1 });
  const selectPlan = trpc.subscriptions.activate.useMutation({
    onSuccess: () => {
      sub.refetch();
      toast.success("Plan selected! 2-month free trial activated.");
    }
  });

  const trialDaysLeft = sub.data?.trialEnd
    ? Math.max(0, Math.ceil((Number(sub.data.trialEnd) - Date.now()) / 86400000))
    : 0;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Choose Your Plan</h1>
        <p className="text-muted-foreground mt-2">
          Every plan includes a <span className="text-green-400 font-semibold">2-month free trial</span> — no credit card required.
          Add users at <span className="text-primary font-semibold">$30/user/mo</span> up to the next tier.
        </p>
      </div>

      {sub.data && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-primary" />
              <div>
                <p className="font-semibold">Current Plan: <span className="capitalize">{sub.data.planId || "None"}</span></p>
                <p className="text-sm text-muted-foreground">
                  Status: <Badge className={sub.data.status === "trial" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}>{sub.data.status}</Badge>
                  {sub.data.status === "trial" && <span className="ml-2">{trialDaysLeft} days remaining</span>}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Grid — 5 tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {PLANS.map((plan, idx) => {
          const Icon = plan.icon;
          return (
            <Card key={plan.id} className={`${plan.color} relative ${plan.popular ? "ring-2 ring-violet-500/50 shadow-lg shadow-violet-500/10" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-violet-500 text-white px-3">
                    <Star className="w-3 h-3 mr-1" />Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2 pt-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{plan.desc}</p>
                <div className="mt-3">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <p className="text-xs text-green-400 font-medium mt-1">First 2 months FREE</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {plan.baseUsers} user{plan.baseUsers > 1 ? "s" : ""} included
                    {plan.addOnMax ? ` · up to ${plan.addOnMax} w/ add-ons` : " · 50 max"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
                {plan.addOnMax && (
                  <div className="flex items-start gap-2 text-xs mt-2 pt-2 border-t border-border/30">
                    <Plus className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-primary font-medium">+$30/user/mo add-on available</span>
                  </div>
                )}
                <Button
                  className="w-full mt-3"
                  size="sm"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => selectPlan.mutate({ companyId: 1, planId: idx + 1 })}
                  disabled={selectPlan.isPending}
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add-on Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">User Add-Ons — $30/user/month</p>
              <p className="text-sm text-muted-foreground mt-1">
                Every plan lets you add extra users at <strong>$30/user/month</strong>, up to the next tier's base user count.
                For example, a Success Starter subscriber can add up to 4 extra users (reaching 5 total).
                When you need more, simply upgrade to the next tier for a better per-user rate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-6 text-center">
          <Rocket className="w-10 h-10 mx-auto text-primary mb-3" />
          <h3 className="text-lg font-semibold">Switch in 60 Seconds</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            One-touch migration from HubSpot, Salesforce, DAT, Tai TMS, Zoho, and more. Bring all your contacts, deals, and loads with you.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.href = "/migration"}>
            Start Migration →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
