import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Crown, Zap, CheckCircle, XCircle, Star, Rocket, BarChart3, Brain,
  Shield, Users, Plus, Lock, Gift, TrendingDown, AlertCircle, Sparkles
} from "lucide-react";

// ─── Tier definitions (synced with server/stripe-products.ts) ────────────────
const PLANS = [
  {
    id: "success_starter",
    name: "Success Starter",
    tagline: "Launch your CRM in minutes.",
    price: 74,
    annualPrice: 67,
    baseUsers: 1,
    addOnMax: 5,
    addOnPrice: 25,
    contacts: "5,000",
    emailSends: "500/mo",
    vsCompetitor: "HubSpot Starter: ~$100/mo",
    savings: "26% less",
    color: "border-sky-200",
    ringColor: "",
    icon: Zap,
    iconColor: "text-sky-500",
    bgGradient: "from-sky-50 to-white",
    features: [
      { text: "1 user included", type: "included" },
      { text: "Add up to 4 more users ($25/user/mo)", type: "included" },
      { text: "5,000 contacts", type: "included" },
      { text: "Core CRM — contacts, companies, deals, pipeline", type: "included" },
      { text: "Tasks, activities, notes, calendar", type: "included" },
      { text: "25 email templates + 500 sends/mo", type: "included" },
      { text: "AI Assistant — 50 queries/mo FREE", type: "free" },
      { text: "One-click migration from any CRM — FREE", type: "free" },
      { text: "Business category intelligence — FREE", type: "free" },
      { text: "Basic AR/AP (manual entry) — FREE", type: "free" },
      { text: "Basic Shipping & Receiving — FREE", type: "free" },
      { text: "BNB Prospecting — 50 prospects/mo FREE", type: "freemium" },
      { text: "1 domain health monitor", type: "included" },
      { text: "Email support", type: "included" },
      { text: "Marketing automation & sequences", type: "excluded" },
      { text: "260 SMTP rotation engine", type: "excluded" },
      { text: "Compliance Fortress™", type: "excluded" },
    ],
  },
  {
    id: "growth_foundation",
    name: "Growth Foundation",
    tagline: "Scale with automation.",
    price: 149,
    annualPrice: 134,
    baseUsers: 5,
    addOnMax: 15,
    addOnPrice: 25,
    contacts: "25,000",
    emailSends: "5,000/mo",
    vsCompetitor: "HubSpot Pro (5 users): $500/mo",
    savings: "70% less",
    color: "border-blue-200",
    ringColor: "",
    icon: BarChart3,
    iconColor: "text-blue-500",
    bgGradient: "from-blue-50 to-white",
    features: [
      { text: "5 users included", type: "included" },
      { text: "Add up to 10 more users ($25/user/mo)", type: "included" },
      { text: "25,000 contacts", type: "included" },
      { text: "Full CRM suite", type: "included" },
      { text: "Unlimited email templates + 5,000 sends/mo", type: "included" },
      { text: "Marketing automation (visual workflow builder)", type: "included" },
      { text: "Lead scoring", type: "included" },
      { text: "BNB Paradigm Engine™ — 500 prospects/mo", type: "premium" },
      { text: "Ghost Mode sequences — 3 active", type: "premium" },
      { text: "Deliverability suite (warm-up, SPF/DKIM)", type: "included" },
      { text: "5 domain health monitors", type: "included" },
      { text: "Compliance Fortress™ — CAN-SPAM", type: "included" },
      { text: "AR/AP automation (rules, bulk invoicing)", type: "included" },
      { text: "Shipping & Receiving — full module", type: "included" },
      { text: "AI Assistant — 50 queries/mo FREE + credit overage", type: "freemium" },
      { text: "One-click migration — FREE", type: "free" },
      { text: "Email + live chat support", type: "included" },
      { text: "260 SMTP rotation engine", type: "excluded" },
      { text: "Full Compliance Fortress™ (GDPR/CCPA)", type: "excluded" },
      { text: "Voice Agent", type: "excluded" },
      { text: "White-labeling", type: "excluded" },
    ],
  },
  {
    id: "fortune_foundation",
    name: "Fortune Foundation",
    tagline: "Enterprise deliverability. Mid-market price.",
    price: 374,
    annualPrice: 337,
    baseUsers: 15,
    addOnMax: 25,
    addOnPrice: 25,
    contacts: "100,000",
    emailSends: "50,000/mo",
    vsCompetitor: "HubSpot Pro (15 users): $1,500/mo",
    savings: "75% less",
    popular: true,
    color: "border-violet-300",
    ringColor: "ring-2 ring-violet-400/60 shadow-lg shadow-violet-100",
    icon: Brain,
    iconColor: "text-violet-500",
    bgGradient: "from-violet-50 to-white",
    features: [
      { text: "15 users included", type: "included" },
      { text: "Add up to 10 more users ($25/user/mo)", type: "included" },
      { text: "100,000 contacts", type: "included" },
      { text: "All Growth Foundation features", type: "included" },
      { text: "260 SMTP rotation engine", type: "premium", highlight: true },
      { text: "Compliance Fortress™ — CAN-SPAM + GDPR + CCPA", type: "premium", highlight: true },
      { text: "BNB Paradigm Engine™ Full — unlimited, all 8 AI layers", type: "premium", highlight: true },
      { text: "Ghost Mode — unlimited sequences", type: "premium" },
      { text: "Battle Cards + Behavioral DNA Profiler", type: "premium" },
      { text: "Predictive Send Time Optimizer", type: "premium" },
      { text: "50,000 email sends/month", type: "included" },
      { text: "Voice Agent — 200 calls/month", type: "premium" },
      { text: "DocScan — 50 scans/month", type: "premium" },
      { text: "Win Probability Engine", type: "premium" },
      { text: "Visitor Tracking — 1,000/month", type: "premium" },
      { text: "Custom branding (logo, colors)", type: "included" },
      { text: "Unlimited domain health monitors", type: "included" },
      { text: "Priority support", type: "included" },
      { text: "White-labeling", type: "excluded" },
      { text: "Dedicated SMTP infrastructure", type: "excluded" },
    ],
  },
  {
    id: "fortune",
    name: "Fortune",
    tagline: "Your brand. Your platform.",
    price: 524,
    annualPrice: 472,
    baseUsers: 25,
    addOnMax: 40,
    addOnPrice: 25,
    contacts: "250,000",
    emailSends: "200,000/mo",
    vsCompetitor: "HubSpot Enterprise (25 users): $3,000/mo",
    savings: "83% less",
    color: "border-purple-200",
    ringColor: "",
    icon: Crown,
    iconColor: "text-purple-500",
    bgGradient: "from-purple-50 to-white",
    features: [
      { text: "25 users included", type: "included" },
      { text: "Add up to 15 more users ($25/user/mo)", type: "included" },
      { text: "250,000 contacts", type: "included" },
      { text: "All Fortune Foundation features", type: "included" },
      { text: "Voice Agent — unlimited calls", type: "premium" },
      { text: "DocScan — unlimited scans", type: "premium" },
      { text: "Revenue Autopilot (\"Money Machine\")", type: "premium", highlight: true },
      { text: "Apex Autopilot (freight consolidation + lane prediction)", type: "premium", highlight: true },
      { text: "200,000 email sends/month", type: "included" },
      { text: "Visitor Tracking — unlimited", type: "premium" },
      { text: "White-labeling — full platform branding", type: "premium", highlight: true },
      { text: "Custom AI training (basic)", type: "premium" },
      { text: "Dedicated account manager", type: "included" },
      { text: "99.5% SLA guarantee", type: "included" },
      { text: "Dedicated SMTP infrastructure", type: "excluded" },
      { text: "Custom AI training (full)", type: "excluded" },
    ],
  },
  {
    id: "fortune_plus",
    name: "Fortune Plus",
    tagline: "Dedicated infrastructure. White-glove service.",
    price: 1124,
    annualPrice: 1012,
    baseUsers: 50,
    addOnMax: null,
    addOnPrice: 0,
    contacts: "Unlimited",
    emailSends: "Unlimited",
    vsCompetitor: "HubSpot Enterprise (50 users): $6,000/mo",
    savings: "81% less",
    color: "border-amber-200",
    ringColor: "",
    icon: Shield,
    iconColor: "text-amber-500",
    bgGradient: "from-amber-50 to-white",
    features: [
      { text: "50 users included", type: "included" },
      { text: "Unlimited contacts", type: "included" },
      { text: "All Fortune features", type: "included" },
      { text: "Dedicated SMTP infrastructure (your own IPs + domain pools)", type: "premium", highlight: true },
      { text: "Unlimited email sends", type: "included" },
      { text: "Custom AI training — full, unlimited", type: "premium", highlight: true },
      { text: "99.9% SLA guarantee", type: "included" },
      { text: "Priority 24/7 white-glove support", type: "premium" },
      { text: "Dedicated infrastructure team", type: "included" },
      { text: "Custom integrations", type: "included" },
    ],
  },
];

const featureTypeConfig = {
  included: { icon: CheckCircle, color: "text-green-500", textColor: "text-foreground" },
  free:     { icon: Gift,        color: "text-emerald-500", textColor: "text-emerald-700 font-medium" },
  freemium: { icon: Sparkles,    color: "text-blue-500",   textColor: "text-blue-700" },
  premium:  { icon: Star,        color: "text-amber-500",  textColor: "text-foreground" },
  excluded: { icon: XCircle,     color: "text-muted-foreground/40", textColor: "text-muted-foreground/50 line-through" },
};

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
    <div className="space-y-8 pb-12">

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Every plan includes a <span className="text-green-600 font-semibold">2-month free trial</span> — no credit card required.
          Priced <span className="text-primary font-semibold">25–83% below HubSpot and Salesforce</span> for the same (or better) features.
        </p>
        <div className="flex items-center justify-center gap-6 mt-3 text-sm">
          <span className="flex items-center gap-1.5 text-emerald-600"><Gift className="w-4 h-4" /> Always free features</span>
          <span className="flex items-center gap-1.5 text-blue-600"><Sparkles className="w-4 h-4" /> Freemium (limited free)</span>
          <span className="flex items-center gap-1.5 text-amber-600"><Star className="w-4 h-4" /> Premium (tier unlock)</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><Lock className="w-4 h-4" /> Not included</span>
        </div>
      </div>

      {/* Current Plan Banner */}
      {sub.data && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-primary" />
              <div>
                <p className="font-semibold">Current Plan: <span className="capitalize">{sub.data.planId || "None"}</span></p>
                <p className="text-sm text-muted-foreground">
                  Status: <Badge className={sub.data.status === "trial" ? "bg-green-500/20 text-green-700" : "bg-blue-500/20 text-blue-700"}>{sub.data.status}</Badge>
                  {sub.data.status === "trial" && <span className="ml-2">{trialDaysLeft} days remaining in trial</span>}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {PLANS.map((plan, idx) => {
          const Icon = plan.icon;
          return (
            <Card
              key={plan.id}
              className={`${plan.color} ${plan.ringColor} relative bg-gradient-to-b ${plan.bgGradient} flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-violet-500 text-white px-3 shadow-md">
                    <Star className="w-3 h-3 mr-1" />Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2 pt-6">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                  <CardTitle className="text-base font-bold">{plan.name}</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{plan.tagline}</p>

                {/* Price */}
                <div className="mt-3">
                  <span className="text-3xl font-extrabold">${plan.price}</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  or <span className="font-semibold text-green-600">${plan.annualPrice}/mo</span> billed annually (10% off)
                </p>
                <p className="text-xs text-green-600 font-semibold mt-1">First 2 months FREE</p>

                {/* Users */}
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {plan.baseUsers} user{plan.baseUsers > 1 ? "s" : ""} included
                    {plan.addOnMax ? ` · up to ${plan.addOnMax} total` : " · 50 max"}
                  </span>
                </div>

                {/* Contacts & Sends */}
                <div className="flex justify-center gap-3 mt-2">
                  <span className="text-xs bg-muted/60 rounded-full px-2 py-0.5">{plan.contacts} contacts</span>
                  <span className="text-xs bg-muted/60 rounded-full px-2 py-0.5">{plan.emailSends} sends</span>
                </div>

                {/* Competitor savings */}
                <div className="mt-2 rounded-lg bg-green-50 border border-green-200 px-2 py-1.5">
                  <div className="flex items-center justify-center gap-1 text-green-700">
                    <TrendingDown className="w-3 h-3" />
                    <span className="text-xs font-bold">{plan.savings}</span>
                  </div>
                  <p className="text-xs text-green-600 text-center">{plan.vsCompetitor}</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-1.5 pb-4 flex-1 flex flex-col">
                <div className="flex-1 space-y-1.5">
                  {plan.features.map((f, fi) => {
                    const cfg = featureTypeConfig[f.type as keyof typeof featureTypeConfig];
                    const FIcon = cfg.icon;
                    return (
                      <div
                        key={fi}
                        className={`flex items-start gap-1.5 text-xs ${f.highlight ? "bg-amber-50/80 rounded px-1 py-0.5 border border-amber-200/60" : ""}`}
                      >
                        <FIcon className={`w-3.5 h-3.5 ${cfg.color} shrink-0 mt-0.5`} />
                        <span className={cfg.textColor}>{f.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Add-on note */}
                {plan.addOnMax && (
                  <div className="flex items-start gap-1.5 text-xs mt-2 pt-2 border-t border-border/30">
                    <Plus className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-primary font-medium">+${plan.addOnPrice}/user/mo add-on</span>
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

      {/* Feature Legend */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            Feature Availability Guide
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Gift className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-700">Always Free</p>
                <p className="text-xs text-muted-foreground">Data entry, one-click migration, business category intelligence, AI assistant (50/mo), basic AR/AP, basic Shipping & Receiving</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-700">Freemium</p>
                <p className="text-xs text-muted-foreground">Free up to a monthly limit — upgrade for more. AI credits, BNB prospects, and more.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700">Premium</p>
                <p className="text-xs text-muted-foreground">High-value features unlocked at specific tiers. Includes high-maintenance services like 260 SMTP rotation, Compliance Fortress™, and white-labeling.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">User Add-Ons</p>
                <p className="text-xs text-muted-foreground">$25/user/month on any plan (25% below market). Add up to the next tier's base count, then upgrade for better per-seat rates.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitor Comparison */}
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-green-600" />
            How Apex Compares — Same Team, Same Features
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-green-200">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Team Size</th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground">HubSpot Pro</th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground">Salesforce Pro</th>
                  <th className="text-right py-2 px-4 font-medium text-green-700 font-bold">Apex CRM</th>
                  <th className="text-right py-2 pl-4 font-medium text-green-700">You Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                <tr>
                  <td className="py-2 pr-4 font-medium">1 user</td>
                  <td className="text-right px-4 text-muted-foreground">$100/mo</td>
                  <td className="text-right px-4 text-muted-foreground">$100/mo</td>
                  <td className="text-right px-4 text-green-700 font-bold">$74/mo</td>
                  <td className="text-right pl-4 text-green-600 font-semibold">$26/mo</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">5 users</td>
                  <td className="text-right px-4 text-muted-foreground">$500/mo</td>
                  <td className="text-right px-4 text-muted-foreground">$500/mo</td>
                  <td className="text-right px-4 text-green-700 font-bold">$149/mo</td>
                  <td className="text-right pl-4 text-green-600 font-semibold">$351/mo</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">15 users</td>
                  <td className="text-right px-4 text-muted-foreground">$1,500/mo</td>
                  <td className="text-right px-4 text-muted-foreground">$2,625/mo</td>
                  <td className="text-right px-4 text-green-700 font-bold">$374/mo</td>
                  <td className="text-right pl-4 text-green-600 font-semibold">$1,126/mo</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">25 users</td>
                  <td className="text-right px-4 text-muted-foreground">$3,000/mo</td>
                  <td className="text-right px-4 text-muted-foreground">$4,375/mo</td>
                  <td className="text-right px-4 text-green-700 font-bold">$524/mo</td>
                  <td className="text-right pl-4 text-green-600 font-semibold">$2,476/mo</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">50 users</td>
                  <td className="text-right px-4 text-muted-foreground">$6,000/mo</td>
                  <td className="text-right px-4 text-muted-foreground">$8,750/mo</td>
                  <td className="text-right px-4 text-green-700 font-bold">$1,124/mo</td>
                  <td className="text-right pl-4 text-green-600 font-semibold">$4,876/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            * Apex includes features competitors charge extra for: SMTP deliverability engine, Compliance Fortress™, BNB Paradigm Engine™, AR/AP module, Shipping & Receiving, and one-click migration — all at no additional cost at qualifying tiers.
          </p>
        </CardContent>
      </Card>

      {/* Migration CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <Rocket className="w-10 h-10 mx-auto text-primary mb-3" />
          <h3 className="text-lg font-semibold">Switch in 60 Seconds — Always Free</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            One-click migration from HubSpot, Salesforce, ActiveCampaign, Close CRM, Zoho, and more.
            Bring every contact, deal, pipeline, note, and custom field with you. No data left behind.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.href = "/migration"}>
            Start Migration — It's Free →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
