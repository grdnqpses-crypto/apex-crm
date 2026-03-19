import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, ArrowRight, Play, Shield, Zap, Users, BarChart3, Brain, Truck, Crown, Star, ChevronDown } from "lucide-react";

const PRICING_TIERS = [
  {
    name: "Solo",
    slug: "success_starter",
    price: 49,
    period: "month",
    description: "Everything a solo operator needs — with AI built in from day one.",
    highlight: false,
    savings: "50% less than GoHighLevel",
    features: [
      "1 user included (add seats @ $35/user/mo)",
      "2,500 contacts",
      "Core CRM — contacts, companies, deals, pipeline",
      "500 AI credits/month",
      "1,000 email sends/month",
      "AI Assistant — write emails, take CRM actions",
      "One-click migration from any CRM — FREE",
      "Basic AR/AP & Shipping — FREE",
    ],
    limits: "1 user · 2,500 contacts · add-ons available",
  },
  {
    name: "Starter",
    slug: "growth_foundation",
    price: 97,
    period: "month",
    description: "For small teams ready to scale their outreach.",
    highlight: false,
    savings: "68% less than HubSpot for 3 users",
    features: [
      "3 users included (add seats @ $35/user/mo)",
      "10,000 contacts",
      "2,000 AI credits/month",
      "10,000 email sends/month",
      "500 BNB prospects/month",
      "5 Ghost Mode sequences",
      "Full AR/AP automation + full Shipping module",
    ],
    limits: "3 users · 10,000 contacts · add-ons available",
  },
  {
    name: "Growth",
    slug: "fortune_foundation",
    price: 297,
    period: "month",
    description: "For growing teams who need real prospecting power and voice.",
    highlight: true,
    badge: "Most Popular",
    savings: "55% less than GHL + Instantly combined",
    features: [
      "10 users included (add seats @ $35/user/mo)",
      "100,000 contacts",
      "10,000 AI credits/month",
      "100,000 email sends/month",
      "5,000 BNB prospects/month",
      "Voice Agent (200 min/mo)",
      "Behavioral DNA Profiling + Battle Cards",
    ],
    limits: "10 users · 100,000 contacts · add-ons available",
  },
  {
    name: "Fortune Foundation",
    slug: "fortune",
    price: 497,
    period: "month",
    description: "Elite deliverability. Full compliance. The agency standard.",
    highlight: false,
    savings: "57% less than agency stack",
    features: [
      "20 users included (add seats @ $35/user/mo)",
      "Unlimited contacts",
      "30,000 AI credits/month",
      "260 SMTP Rotation Engine™",
      "Compliance Fortress™ — GDPR + CCPA + CAN-SPAM",
      "Unlimited BNB prospects",
      "500,000 email sends/month + 1,000 voice min/mo",
    ],
    limits: "20 users · Unlimited contacts · add-ons available",
  },
  {
    name: "Fortune Plus",
    slug: "fortune_plus",
    price: 1497,
    period: "month",
    description: "Dedicated infrastructure. Custom AI. Resell Apex as your own.",
    highlight: false,
    badge: "Enterprise",
    savings: "85% less than HubSpot Enterprise",
    features: [
      "100 users included (add seats @ $30/user/mo)",
      "Unlimited everything",
      "Revenue Autopilot™ + Apex Autopilot™",
      "White-labeling (your brand, FREE setup)",
      "Dedicated SMTP infrastructure (your own IPs)",
      "SaaS Mode — resell Apex as your product",
      "99.9% SLA + 24/7 white-glove support",
    ],
    limits: "100 users · Unlimited contacts",
  },
];

const FEATURES_SHOWCASE = [
  { icon: Users, title: "Smart CRM", desc: "Manage companies, contacts, deals, and tasks with AI-powered insights" },
  { icon: Zap, title: "Email Automation", desc: "Campaigns, templates, A/B testing, and deliverability optimization" },
  { icon: Brain, title: "AI Paradigm Engine", desc: "Discover 546+ prospects automatically with AI-powered lead scoring" },
  { icon: BarChart3, title: "Analytics & Reports", desc: "Real-time dashboards, win probability, and revenue forecasting" },
  { icon: Truck, title: "Freight & Logistics", desc: "Load management, carrier vetting, and freight marketplace" },
  { icon: Shield, title: "Enterprise Security", desc: "Role-based access, compliance center, and data isolation" },
];

const TESTIMONIALS = [
  { name: "Sarah Chen", role: "Sales Manager, TechCorp", quote: "Apex CRM increased our close rate by 34% in the first quarter. The AI prospecting alone is worth the investment." },
  { name: "Mike Rodriguez", role: "VP Sales, LogiFreight", quote: "We migrated from Salesforce and saved $12,000/year. The freight features are a game-changer for our industry." },
  { name: "Lisa Park", role: "Director, FastShip Inc.", quote: "The onboarding was seamless. Our team was productive within hours, not weeks." },
];

export default function Signup() {
  const [step, setStep] = useState<"landing" | "register">("landing");
  const [selectedTier, setSelectedTier] = useState("professional");
  const [formData, setFormData] = useState({
    companyName: "",
    fullName: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const handleRegister = async () => {
    if (!formData.companyName || !formData.fullName || !formData.email || !formData.username || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.companyName,
          slug: formData.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"),
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          username: formData.username,
          password: formData.password,
          subscriptionTier: selectedTier,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Account Created!", { description: "Redirecting to your dashboard..." });
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "register") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => setStep("landing")} className="flex items-center gap-2 text-xl font-bold text-slate-900 hover:opacity-80 transition">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              Apex CRM
            </button>
            <Button variant="outline" onClick={() => window.location.href = "/login"}>
              Already have an account? Sign In
            </Button>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-amber-100 text-amber-800 border-amber-200">
              {PRICING_TIERS.find(t => t.slug === selectedTier)?.name} Plan — ${PRICING_TIERS.find(t => t.slug === selectedTier)?.price}/mo
            </Badge>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Account</h1>
            <p className="text-slate-600">Set up your company and start closing deals in minutes</p>
          </div>

          <Card className="shadow-xl border-slate-200">
            <CardHeader>
              <CardTitle>Company & Admin Setup</CardTitle>
              <CardDescription>This creates your company account and your admin login</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">1</div>
                  Company Information
                </h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input id="companyName" placeholder="e.g., Logistics Worldwide" value={formData.companyName}
                      onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">2</div>
                  Admin Account
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input id="fullName" placeholder="John Smith" value={formData.fullName}
                      onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" placeholder="john@company.com" value={formData.email}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+1 (555) 000-0000" value={formData.phone}
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input id="username" placeholder="jsmith" value={formData.username}
                      onChange={e => setFormData(p => ({ ...p, username: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">3</div>
                  Set Password
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input id="password" type="password" placeholder="Min 8 characters" value={formData.password}
                      onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input id="confirmPassword" type="password" placeholder="Confirm password" value={formData.confirmPassword}
                      onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900 mb-1">What happens next?</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Your company account is created instantly</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> You're logged in as Company Admin</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> AI onboarding guide walks you through setup</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Start adding your team, companies, and contacts</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full h-12 text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={handleRegister} disabled={isSubmitting}>
                {isSubmitting ? "Creating Account..." : "Create Account & Start Free Trial"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <p className="text-xs text-slate-500 text-center">
                2 months free, then ${PRICING_TIERS.find(t => t.slug === selectedTier)?.price}/month. Cancel anytime. No credit card required.
              </p>
            </CardFooter>
          </Card>

          <div className="mt-6 text-center">
            <button onClick={() => setStep("landing")} className="text-sm text-slate-500 hover:text-slate-700 transition">
              ← Back to pricing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Landing page
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            Apex CRM
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
              Pricing
            </Button>
            <Button variant="ghost" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              Features
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/login"}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, rgba(251,191,36,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(249,115,22,0.2) 0%, transparent 50%)" }} />
        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <Badge className="mb-6 bg-amber-500/20 text-amber-300 border-amber-500/30 text-sm px-4 py-1">
            <Star className="w-4 h-4 mr-1" /> 2 Months Free — Limited Time Offer
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Stop Losing Deals.<br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Start Closing Them.</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            The all-in-one CRM built for logistics and freight. AI-powered prospecting, email automation, 
            and freight management — at a fraction of what Salesforce and HubSpot charge.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={() => { setStep("register"); window.scrollTo(0, 0); }}>
              Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-600 text-slate-200 hover:bg-slate-800"
              onClick={() => setShowVideo(!showVideo)}>
              <Play className="mr-2 w-5 h-5" /> Watch Demo
            </Button>
          </div>

          {showVideo && (
            <div className="max-w-3xl mx-auto mb-8 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
              <video controls autoPlay className="w-full" src="/commercial-video.mp4">
                Your browser does not support video playback.
              </video>
            </div>
          )}

          {/* Competitor comparison */}
          <div className="flex items-center justify-center gap-8 text-slate-400 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400 line-through">$800+/mo</div>
              <div>HubSpot</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400 line-through">$1,000+/mo</div>
              <div>Salesforce</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-400">$49–$1,497/mo</div>
              <div className="text-amber-300">Apex CRM</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything You Need to Dominate Your Market</h2>
            <p className="text-lg text-slate-600">Built specifically for logistics, freight, and B2B sales teams</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES_SHOWCASE.map((f, i) => (
              <Card key={i} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-4">
                    <f.icon className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-600">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Trusted by Sales Teams Everywhere</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i} className="border-slate-200">
                <CardContent className="pt-6">
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-4 italic">"{t.quote}"</p>
                  <div>
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">2 Months Free on All Plans</Badge>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-slate-600">No hidden fees. No contracts. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {PRICING_TIERS.map((tier) => (
              <Card key={tier.slug} className={`relative overflow-hidden transition-all ${
                tier.highlight ? "border-amber-400 shadow-xl scale-105 ring-2 ring-amber-400/20" : "border-slate-200 hover:shadow-lg"
              }`}>
                {tier.badge && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    {tier.badge}
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="pt-2">
                    <span className="text-4xl font-bold text-slate-900">${tier.price}</span>
                    <span className="text-slate-500">/{tier.period}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{tier.limits}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-slate-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className={`w-full ${
                    tier.highlight
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`} onClick={() => { setSelectedTier(tier.slug); setStep("register"); window.scrollTo(0, 0); }}>
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Sales?</h2>
          <p className="text-lg text-slate-300 mb-8">
            Join hundreds of companies already using Apex CRM to close more deals, faster.
          </p>
          <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={() => { setStep("register"); window.scrollTo(0, 0); }}>
            Start Your Free Trial <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-slate-400 mt-4">No credit card required. 2 months free.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Apex CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
