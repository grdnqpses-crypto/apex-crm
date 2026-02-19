import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Crown, Zap, CheckCircle, Star, Rocket, Shield, Clock } from "lucide-react";

const PLANS = [
  { id: "starter", name: "Starter", price: 99, desc: "For solo brokers getting started", features: ["5 users", "1,000 contacts", "Basic CRM", "Email campaigns", "Load management", "Phone support"], color: "border-blue-500/30" },
  { id: "professional", name: "Professional", price: 249, desc: "For growing brokerages", features: ["25 users", "10,000 contacts", "Full CRM + AI", "Voice Agent (500 calls)", "DocScan", "Win Probability", "Load boards", "Priority support"], color: "border-purple-500/30", popular: true },
  { id: "enterprise", name: "Enterprise", price: 599, desc: "For large operations", features: ["Unlimited users", "Unlimited contacts", "Everything in Pro", "Voice Agent (unlimited)", "White-labeling", "Custom integrations", "Dedicated account manager", "99.9% SLA"], color: "border-amber-500/30" },
];

export default function Subscription() {
  const sub = trpc.subscriptions.current.useQuery({ companyId: 1 });
  const selectPlan = trpc.subscriptions.activate.useMutation({ onSuccess: () => { sub.refetch(); toast.success("Plan selected! 2-month free trial activated."); } });

  const trialDaysLeft = sub.data?.trialEnd ? Math.max(0, Math.ceil((Number(sub.data.trialEnd) - Date.now()) / 86400000)) : 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Choose Your Plan</h1>
        <p className="text-muted-foreground mt-2">Every plan includes a <span className="text-green-400 font-semibold">2-month free trial</span> — no credit card required</p>
      </div>

      {sub.data && (
        <Card className="border-primary/30 bg-primary/5"><CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-primary" />
            <div>
              <p className="font-semibold">Current Plan: <span className="capitalize">{sub.data.planId || "None"}</span></p>
              <p className="text-sm text-muted-foreground">Status: <Badge className={sub.data.status === "trial" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}>{sub.data.status}</Badge>
                {sub.data.status === "trial" && <span className="ml-2">{trialDaysLeft} days remaining</span>}
              </p>
            </div>
          </div>
        </CardContent></Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        {PLANS.map(plan => (
          <Card key={plan.id} className={`${plan.color} relative ${plan.popular ? "ring-2 ring-purple-500/50" : ""}`}>
            {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="bg-purple-500 text-white"><Star className="w-3 h-3 mr-1" />Most Popular</Badge></div>}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.desc}</p>
              <div className="mt-4"><span className="text-4xl font-bold">${plan.price}</span><span className="text-muted-foreground">/mo</span></div>
              <p className="text-xs text-green-400 font-medium mt-1">First 2 months FREE</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.features.map(f => (
                <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-400 shrink-0" /><span>{f}</span></div>
              ))}
              <Button className="w-full mt-4" variant={plan.popular ? "default" : "outline"} onClick={() => selectPlan.mutate({ companyId: 1, planId: PLANS.indexOf(plan) + 1 })} disabled={selectPlan.isPending}>
                Start Free Trial
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50"><CardContent className="p-6 text-center">
        <Rocket className="w-10 h-10 mx-auto text-primary mb-3" />
        <h3 className="text-lg font-semibold">Switch in 60 Seconds</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">One-touch migration from HubSpot, Salesforce, DAT, Tai TMS, Zoho, and more. Bring all your contacts, deals, and loads with you.</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.href = "/migration"}>Start Migration →</Button>
      </CardContent></Card>
    </div>
  );
}
