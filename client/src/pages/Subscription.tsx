import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
import {
  Crown, Zap, CheckCircle, XCircle, Star, Rocket, BarChart3, Brain,
  Shield, Users, Plus, Lock, Gift, TrendingDown, AlertCircle, Sparkles, Mic
} from "lucide-react";

// ─── Tier definitions (synced with server/stripe-products.ts) ────────────────
// Internal DB keys are kept stable; display names reflect the final approved pricing.
const PLANS = [
  {
    id: "success_starter",
    name: "Solo",
    tagline: "For the serious solo seller. Everything you need, nothing you don't.",
    price: 49,
    annualPrice: 44,
    baseUsers: 1,
    addOnMax: null,
    addOnPrice: 0,
    contacts: "2,500",
    emailSends: "1,000/mo",
    aiCredits: "500/mo",
    vsCompetitor: "GoHighLevel Starter: $97/mo | HubSpot: $100/mo",
    savings: "50% less than GHL",
    color: "border-sky-200",
    ringColor: "",
    icon: Zap,
    iconColor: "text-sky-500",
    bgGradient: "from-sky-50 to-white",
    features: [
      { text: "1 user included", type: "included" },
      { text: "2,500 contacts", type: "included" },
      { text: "Core CRM — contacts, companies, deals, pipeline", type: "included" },
      { text: "Tasks, activities, notes, calendar", type: "included" },
      { text: "500 AI credits/month", type: "freemium" },
      { text: "AI Assistant — write emails, take CRM actions", type: "included" },
      { text: "1,000 email sends/month", type: "included" },
      { text: "100 BNB prospects/month", type: "freemium" },
      { text: "1 Ghost Mode sequence", type: "included" },
      { text: "20 DocScans/month", type: "included" },
      { text: "One-click migration from any CRM — FREE", type: "free" },
      { text: "Business category intelligence — FREE", type: "free" },
      { text: "Basic AR/AP (manual entry) — FREE", type: "free" },
      { text: "Basic Shipping & Receiving — FREE", type: "free" },
      { text: "Free onboarding & setup", type: "free" },
      { text: "Email support", type: "included" },
      { text: "Voice Agent", type: "excluded" },
      { text: "260 SMTP Rotation Engine", type: "excluded" },
      { text: "Compliance Fortress™", type: "excluded" },
    ],
  },
  {
    id: "growth_foundation",
    name: "Starter",
    tagline: "For small teams ready to scale their outreach.",
    price: 97,
    annualPrice: 87,
    baseUsers: 3,
    addOnMax: null,
    addOnPrice: 35,
    contacts: "10,000",
    emailSends: "10,000/mo",
    aiCredits: "2,000/mo",
    vsCompetitor: "HubSpot Starter for 3 users: $300/mo",
    savings: "68% less than HubSpot",
    color: "border-blue-200",
    ringColor: "",
    icon: BarChart3,
    iconColor: "text-blue-500",
    bgGradient: "from-blue-50 to-white",
    features: [
      { text: "3 users included (+$35/user/mo)", type: "included" },
      { text: "10,000 contacts", type: "included" },
      { text: "Everything in Solo", type: "included" },
      { text: "2,000 AI credits/month", type: "freemium" },
      { text: "AI email personalization", type: "included" },
      { text: "AI call summaries", type: "included" },
      { text: "Win probability scoring", type: "included" },
      { text: "10,000 email sends/month", type: "included" },
      { text: "500 BNB prospects/month", type: "freemium" },
      { text: "5 Ghost Mode sequences", type: "included" },
      { text: "100 DocScans/month", type: "included" },
      { text: "Full AR/AP automation", type: "included" },
      { text: "Full Shipping & Receiving", type: "included" },
      { text: "Email warmup (2 accounts)", type: "included" },
      { text: "Email support", type: "included" },
      { text: "Voice Agent", type: "excluded" },
      { text: "260 SMTP Rotation Engine", type: "excluded" },
    ],
  },
  {
    id: "fortune_foundation",
    name: "Growth",
    tagline: "For growing teams who need real prospecting power and voice.",
    price: 297,
    annualPrice: 267,
    baseUsers: 10,
    addOnMax: null,
    addOnPrice: 35,
    contacts: "100,000",
    emailSends: "100,000/mo",
    aiCredits: "10,000/mo",
    vsCompetitor: "GHL Unlimited ($297) + Instantly ($358) = $655/mo",
    savings: "55% less than GHL + Instantly",
    color: "border-indigo-200",
    ringColor: "",
    icon: Brain,
    iconColor: "text-indigo-500",
    bgGradient: "from-indigo-50 to-white",
    features: [
      { text: "10 users included (+$35/user/mo)", type: "included" },
      { text: "100,000 contacts", type: "included" },
      { text: "Everything in Starter", type: "included" },
      { text: "10,000 AI credits/month", type: "freemium" },
      { text: "Behavioral DNA Profiling", type: "premium", highlight: true },
      { text: "Predictive Send Time Optimizer", type: "premium" },
      { text: "Battle Cards (AI tactical summaries)", type: "premium" },
      { text: "100,000 email sends/month", type: "included" },
      { text: "5,000 BNB prospects/month", type: "freemium" },
      { text: "25 Ghost Mode sequences", type: "included" },
      { text: "Voice Agent — 200 min/month", type: "premium", highlight: true },
      { text: "500 DocScans/month", type: "included" },
      { text: "Blacklist monitoring", type: "included" },
      { text: "High-priority SMTP routing", type: "included" },
      { text: "Email warmup (10 accounts)", type: "included" },
      { text: "Chat support", type: "included" },
      { text: "260 SMTP Rotation Engine", type: "excluded" },
      { text: "Compliance Fortress™", type: "excluded" },
    ],
  },
  {
    id: "fortune",
    name: "Fortune Foundation",
    tagline: "Elite deliverability. Full compliance. The agency standard.",
    price: 497,
    annualPrice: 447,
    baseUsers: 20,
    addOnMax: null,
    addOnPrice: 35,
    contacts: "Unlimited",
    emailSends: "500,000/mo",
    aiCredits: "30,000/mo",
    vsCompetitor: "GHL ($497) + Instantly ($358) + OneTrust ($300) = $1,155/mo",
    savings: "57% less than agency stack",
    popular: true,
    color: "border-violet-300",
    ringColor: "ring-2 ring-violet-400/60 shadow-lg shadow-violet-100",
    icon: Crown,
    iconColor: "text-violet-500",
    bgGradient: "from-violet-50 to-white",
    features: [
      { text: "20 users included (+$35/user/mo)", type: "included" },
      { text: "Unlimited contacts", type: "included" },
      { text: "Everything in Growth", type: "included" },
      { text: "30,000 AI credits/month", type: "freemium" },
      { text: "260 SMTP Rotation Engine™", type: "premium", highlight: true },
      { text: "Compliance Fortress™ (GDPR + CCPA + CAN-SPAM auto)", type: "premium", highlight: true },
      { text: "Unlimited BNB prospects", type: "premium", highlight: true },
      { text: "Unlimited Ghost Mode sequences", type: "included" },
      { text: "500,000 email sends/month", type: "included" },
      { text: "1,000 voice minutes/month", type: "premium" },
      { text: "2,000 DocScans/month", type: "included" },
      { text: "Email warmup (50 accounts)", type: "included" },
      { text: "Priority support", type: "included" },
      { text: "Revenue Autopilot™", type: "excluded" },
      { text: "REALM Autopilot™", type: "excluded" },
      { text: "White-labeling", type: "excluded" },
    ],
  },
  {
    id: "fortune_plus",
    name: "Fortune Plus",
    tagline: "Dedicated infrastructure. Custom AI. Resell REALM as your own.",
    price: 1497,
    annualPrice: 1347,
    baseUsers: 100,
    addOnMax: null,
    addOnPrice: 30,
    contacts: "Unlimited",
    emailSends: "Unlimited",
    aiCredits: "200,000/mo",
    vsCompetitor: "HubSpot Enterprise for 100 users: $10,000+/mo",
    savings: "85% less than HubSpot Enterprise",
    color: "border-amber-200",
    ringColor: "",
    icon: Shield,
    iconColor: "text-amber-500",
    bgGradient: "from-amber-50 to-white",
    features: [
      { text: "100 users included (+$30/user/mo)", type: "included" },
      { text: "Unlimited everything", type: "included" },
      { text: "Everything in Fortune Foundation", type: "included" },
      { text: "200,000 AI credits/month", type: "freemium" },
      { text: "Revenue Autopilot™", type: "premium", highlight: true },
      { text: "REALM Autopilot™ (fully autonomous sales)", type: "premium", highlight: true },
      { text: "White-labeling (your brand, FREE setup)", type: "premium", highlight: true },
      { text: "Dedicated SMTP infrastructure (your own IPs)", type: "premium", highlight: true },
      { text: "SaaS Mode — resell REALM as your own product", type: "premium", highlight: true },
      { text: "Custom AI model training (unlimited)", type: "premium" },
      { text: "99.9% uptime SLA", type: "included" },
      { text: "24/7 white-glove support", type: "included" },
      { text: "Custom contract & invoicing", type: "included" },
      { text: "Dedicated infrastructure team", type: "included" },
      { text: "Priority feature requests", type: "included" },
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
  const { t } = useSkin();
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
          Priced <span className="text-primary font-semibold">50–85% below HubSpot, Salesforce, and GoHighLevel</span> with more features than any of them.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-sm">
          <span className="flex items-center gap-1.5 text-emerald-600"><Gift className="w-4 h-4" /> Always free features</span>
          <span className="flex items-center gap-1.5 text-blue-600"><Sparkles className="w-4 h-4" /> Freemium (limited free)</span>
          <span className="flex items-center gap-1.5 text-amber-600"><Star className="w-4 h-4" /> Premium (tier unlock)</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><Lock className="w-4 h-4" /> Not included</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          All overages: flat <strong>$10</strong> per unit block — same for everyone, regardless of tier.
          Annual billing: <strong>10% off</strong>, non-refundable.
        </p>
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
                    {plan.addOnPrice > 0 ? ` · +$${plan.addOnPrice}/user/mo` : ""}
                  </span>
                </div>

                {/* Contacts, Sends & AI */}
                <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                  <span className="text-xs bg-muted/60 rounded-full px-2 py-0.5">{plan.contacts} contacts</span>
                  <span className="text-xs bg-muted/60 rounded-full px-2 py-0.5">{plan.emailSends} sends</span>
                  <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">{plan.aiCredits} AI</span>
                </div>

                {/* Competitor savings */}
                <div className="mt-2 rounded-lg bg-green-50 border border-green-200 px-2 py-1.5">
                  <div className="flex items-center justify-center gap-1 text-green-700">
                    <TrendingDown className="w-3 h-3" />
                    <span className="text-xs font-bold">{plan.savings}</span>
                  </div>
                  <p className="text-xs text-green-600 text-center leading-tight mt-0.5">{plan.vsCompetitor}</p>
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
                {plan.addOnPrice > 0 && (
                  <div className="flex items-start gap-1.5 text-xs mt-2 pt-2 border-t border-border/30">
                    <Plus className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-primary font-medium">+${plan.addOnPrice}/user/mo add-on seats</span>
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

      {/* Overage Rates */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Simple Overage Pricing — Flat $10, Same for Everyone
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            {[
              { label: "AI Credits", unit: "500 credits", icon: Brain },
              { label: "Voice Minutes", unit: "100 minutes", icon: Mic },
              { label: "BNB Prospects", unit: "500 prospects", icon: Zap },
              { label: "Email Sends", unit: "10,000 emails", icon: BarChart3 },
              { label: "DocScans", unit: "100 scans", icon: Shield },
            ].map(item => (
              <div key={item.label} className="text-center bg-white rounded-lg p-3 border border-blue-200">
                <item.icon className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="font-bold text-blue-700">$10</p>
                <p className="text-xs font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">per {item.unit}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Overages are billed at the end of each billing cycle. No surprise charges — you'll receive an alert when approaching your limit.
          </p>
        </CardContent>
      </Card>

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
                <p className="text-xs text-muted-foreground">Data entry, one-click migration, business category intelligence, basic AR/AP, basic Shipping & Receiving, onboarding & setup</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-700">Freemium</p>
                <p className="text-xs text-muted-foreground">Free up to monthly limit — pay $10 per unit block for overages. AI credits, BNB prospects, email sends, voice minutes, DocScans.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700">Premium</p>
                <p className="text-xs text-muted-foreground">High-value features unlocked at specific tiers. Includes 260 SMTP rotation, Compliance Fortress™, Revenue Autopilot™, and white-labeling.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">User Add-Ons</p>
                <p className="text-xs text-muted-foreground">$35/user/mo on all plans (Fortune Plus: $30/user/mo). Add unlimited seats — no tier cap on add-ons.</p>
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
            How REALM Compares — Same Team, More Features, Fraction of the Cost
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-green-200">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Team Size</th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground">HubSpot Pro</th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground">GoHighLevel</th>
                  <th className="text-right py-2 px-4 font-medium text-green-700 font-bold">REALM CRM</th>
                  <th className="text-right py-2 pl-4 font-medium text-green-700">You Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                <tr>
                  <td className="py-2 pr-4 font-medium">1 user (Solo)</td>
                  <td className="text-right px-4 text-muted-foreground">$100/mo</td>
                  <td className="text-right px-4 text-muted-foreground">$97/mo</td>
                  <td className="text-right px-4 text-green-700 font-bold">$49/mo</td>
                  <td className="text-right pl-4 text-green-600 font-semibold">$48–51/mo</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">3 users (Starter)</td>
                  <td className="text-right px-4 text-muted-foreground">$300/mo</td>
                  <td className="text-right px-4 text-muted-foreground">$97/mo</td>
                  <td className="text-right px-4 text-green-700 font-bold">$97/mo</td>
                  <td className="text-right pl-4 text-green-600 font-semibold">$203/mo vs HubSpot</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">10 users (Growth)</td>
                  <td className="text-right px-4 text-muted-foreground">$1,000/mo</td>
                  <td className="text-right px-4 text-muted-foreground">$655/mo*</td>
                  <td className="text-right px-4 text-green-700 font-bold">$297/mo</td>
                  <td className="text-right pl-4 text-green-600 font-semibold">$358–703/mo</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">20 users (Fortune Foundation)</td>
                  <td className="text-right px-4 text-muted-foreground">$2,000/mo</td>
                  <td className="text-right px-4 text-muted-foreground">$1,155/mo*</td>
                  <td className="text-right px-4 text-green-700 font-bold">$497/mo</td>
                  <td className="text-right pl-4 text-green-600 font-semibold">$658–1,503/mo</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">100 users (Fortune Plus)</td>
                  <td className="text-right px-4 text-muted-foreground">$10,000+/mo</td>
                  <td className="text-right px-4 text-muted-foreground">N/A</td>
                  <td className="text-right px-4 text-green-700 font-bold">$1,497/mo</td>
                  <td className="text-right pl-4 text-green-600 font-semibold">$8,503+/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            * GHL + Instantly combined. REALM includes features competitors charge extra for or don't offer at all: 260 SMTP Rotation Engine, Compliance Fortress™, BNB Paradigm Engine™, AR/AP module, Shipping & Receiving, Voice Agent, Revenue Autopilot™, REALM Autopilot™, and one-click migration — all included at qualifying tiers.
          </p>
        </CardContent>
      </Card>

      {/* Migration CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <Rocket className="w-10 h-10 mx-auto text-primary mb-3" />
          <h3 className="text-lg font-semibold">Switch in 60 Seconds — Always Free</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            One-click migration from HubSpot, Salesforce, GoHighLevel, ActiveCampaign, Close CRM, Zoho, and more.
            Bring every contact, deal, pipeline, note, and custom field with you. No data left behind. No migration fee. Ever.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.href = "/migration"}>
            Start Migration — It's Free →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
