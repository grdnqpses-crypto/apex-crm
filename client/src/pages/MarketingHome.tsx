import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Building2, Users, Kanban, Mail, BarChart3, Brain, Target, Truck,
  Shield, CheckCircle2, X, ChevronDown, ChevronUp, Play, ArrowRight,
  Star, Quote, TrendingUp, Clock, Globe, Rocket, Menu, Phone,
  Sparkles, Ghost, Activity, FileText, Package, Crown,
} from "lucide-react";

// ─── Navigation ───────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-gray-950/95 backdrop-blur-md shadow-lg shadow-black/20 border-b border-white/5" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Apex CRM</span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Features", id: "features" },
              { label: "How It Works", id: "how-it-works" },
              { label: "Compare", id: "compare" },
              { label: "Pricing", id: "pricing" },
              { label: "Testimonials", id: "testimonials" },
            ].map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 text-sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold px-5 shadow-lg shadow-orange-500/25">
                Start Free Trial
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-950/98 border-t border-white/5 px-4 py-4 space-y-2">
          {[
            { label: "Features", id: "features" },
            { label: "How It Works", id: "how-it-works" },
            { label: "Compare", id: "compare" },
            { label: "Pricing", id: "pricing" },
            { label: "Testimonials", id: "testimonials" },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="block w-full text-left text-sm text-gray-300 py-2 hover:text-white"
            >
              {label}
            </button>
          ))}
          <div className="flex gap-3 pt-2 border-t border-white/5">
            <Link href="/login" className="flex-1">
              <Button variant="outline" className="w-full border-white/20 text-white bg-transparent">Sign In</Button>
            </Link>
            <Link href="/signup" className="flex-1">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Start Free</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function Hero() {
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <section className="relative min-h-screen bg-gray-950 flex flex-col items-center justify-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-gray-950 to-gray-950" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-orange-500/5 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOFYwaDQydjQySDM2VjE4eiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvZz48L3N2Zz4=')] opacity-30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-8">
          <Sparkles className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-xs font-medium text-orange-300">The #1 CRM for Freight Brokers & Sales Teams</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6">
          Stop Losing Deals.
          <br />
          <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
            Start Closing Them.
          </span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Apex CRM combines AI-powered prospecting, freight operations, email deliverability, and full sales automation — all in one platform built for teams that move fast.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-8 h-14 text-base shadow-2xl shadow-orange-500/30 rounded-xl"
            >
              Start Free — 2 Months Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <button
            onClick={() => setVideoOpen(true)}
            className="flex items-center gap-3 text-white bg-white/10 hover:bg-white/15 border border-white/10 px-8 h-14 rounded-xl font-semibold text-base transition-all"
          >
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <Play className="h-3.5 w-3.5 text-white fill-white ml-0.5" />
            </div>
            Watch Demo
          </button>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-16">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> No credit card required</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> 2 months free on all plans</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Cancel anytime</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-500" /> Setup in under 10 minutes</span>
        </div>

        {/* Dashboard preview */}
        <div className="relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10 pointer-events-none" style={{ top: "60%" }} />
          <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/60 bg-gray-900">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/80 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 mx-4 bg-gray-700/50 rounded-md h-6 flex items-center px-3">
                <span className="text-xs text-gray-400">app.apexcrm.com/dashboard</span>
              </div>
            </div>
            {/* Dashboard mockup */}
            <div className="p-6 bg-gray-900">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Companies", value: "2,847", color: "text-blue-400", bg: "bg-blue-500/10" },
                  { label: "Open Deals", value: "342", color: "text-orange-400", bg: "bg-orange-500/10" },
                  { label: "Pipeline Value", value: "$4.8M", color: "text-green-400", bg: "bg-green-500/10" },
                  { label: "Won This Month", value: "$892K", color: "text-purple-400", bg: "bg-purple-500/10" },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl p-4 border border-white/5`}>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-gray-800/50 rounded-xl p-4 border border-white/5 h-32 flex items-end gap-1">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-orange-500 to-amber-400 rounded-sm opacity-80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5 space-y-2">
                  {["Sarah Chen — TechCorp", "Mike R. — LogiFreight", "Lisa P. — FastShip"].map((name) => (
                    <div key={name} className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-orange-500/20 flex items-center justify-center text-xs text-orange-400 font-bold">
                        {name[0]}
                      </div>
                      <span className="text-xs text-gray-400 truncate">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video modal */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setVideoOpen(false)}
        >
          <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
            {/* YouTube embed */}
            <iframe
              src="https://www.youtube.com/embed/Y91YVB-yZhs?autoplay=1&rel=0&modestbranding=1"
              title="Apex CRM Product Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { value: "500+", label: "Companies Using Apex" },
    { value: "$2.1B+", label: "Pipeline Managed" },
    { value: "98.7%", label: "Email Deliverability" },
    { value: "34%", label: "Avg. Close Rate Increase" },
    { value: "10 min", label: "Average Setup Time" },
  ];

  return (
    <section className="bg-gray-900 border-y border-white/5 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-extrabold text-white mb-1">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────
const features = [
  {
    icon: Building2,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    title: "CRM Core",
    description: "Companies, contacts, deals, and tasks — all linked. 360° activity timelines, custom fields, and multi-pipeline kanban boards.",
    bullets: ["Custom fields & tags", "Multi-pipeline deals", "Activity timeline", "Task management"],
  },
  {
    icon: Brain,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    title: "Paradigm Engine",
    description: "AI-powered prospecting that discovers, verifies, profiles, and engages leads automatically. Your 24/7 sales development rep.",
    bullets: ["Quantum Lead Score", "Digital Twin profiling", "Ghost Sequences", "Battle Cards"],
  },
  {
    icon: Mail,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    title: "Email Deliverability",
    description: "52 domains, 260 email addresses, provider-specific routing. Industry-leading inbox placement with compliance built in.",
    bullets: ["SMTP rotation engine", "SPF/DKIM/DMARC", "Bounce management", "CAN-SPAM / GDPR"],
  },
  {
    icon: Truck,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    title: "Freight Operations",
    description: "Built for freight brokers. Load management, carrier vetting, freight marketplace, and FMCSA scanner all in one platform.",
    bullets: ["Load management", "Carrier vetting", "Freight marketplace", "FMCSA scanner"],
  },
  {
    icon: Activity,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    title: "Marketing Automation",
    description: "Visual workflow builder, A/B testing, segmentation, and multi-channel sequences. Set it and let it run.",
    bullets: ["Visual workflows", "A/B testing engine", "Smart segmentation", "Lead scoring"],
  },
  {
    icon: BarChart3,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    title: "Analytics & Reports",
    description: "Real-time dashboards, win probability scoring, revenue autopilot, and team performance tracking.",
    bullets: ["Win probability AI", "Revenue autopilot", "Team performance", "Funnel analysis"],
  },
  {
    icon: Ghost,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    title: "Ghost Sequences",
    description: "Autonomous 4-stage follow-up sequences that adapt based on engagement signals. Never lose a warm lead again.",
    bullets: ["4-stage sequences", "Intent detection", "Auto-personalization", "Human handoff alerts"],
  },
  {
    icon: Shield,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    title: "Compliance Fortress",
    description: "Pre-send compliance validation, suppression management, and audit logs. Stay compliant automatically.",
    bullets: ["Pre-send validator", "Suppression lists", "Audit logging", "GDPR / CCPA tools"],
  },
  {
    icon: Package,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    title: "AI Premium Suite",
    description: "Voice agent, AI ghostwriter, meeting prep, call intelligence, and B2B database. The full AI stack.",
    bullets: ["Voice AI agent", "AI ghostwriter", "Meeting prep", "Call intelligence"],
  },
];

function Features() {
  return (
    <section id="features" className="bg-gray-950 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 mb-4">Everything You Need</Badge>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            One Platform. Every Tool.
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Stop paying for 12 different tools. Apex CRM replaces your entire sales stack with a single, deeply integrated platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, color, bg, border, title, description, bullets }) => (
            <div
              key={title}
              className={`group relative rounded-2xl bg-gray-900 border border-white/5 p-6 hover:border-white/10 transition-all hover:shadow-xl hover:shadow-black/30 hover:-translate-y-1`}
            >
              <div className={`inline-flex h-11 w-11 rounded-xl ${bg} border ${border} items-center justify-center mb-4`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">{description}</p>
              <ul className="space-y-1.5">
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      step: "01",
      icon: Package,
      title: "Import Your Data",
      description: "Connect HubSpot, Salesforce, or upload a CSV. Your entire history — companies, contacts, deals, notes — migrates in minutes with our one-click import engine.",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      step: "02",
      icon: Sparkles,
      title: "Automate Everything",
      description: "Set up AI-powered workflows, Ghost Sequences, and the Paradigm Engine. Apex CRM discovers new leads, nurtures them, and alerts you when they're ready to buy.",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      step: "03",
      icon: TrendingUp,
      title: "Close More Deals",
      description: "Your dashboard shows exactly where every deal stands. Win Probability AI tells you which deals to focus on. Revenue Autopilot handles the rest.",
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
  ];

  return (
    <section id="how-it-works" className="bg-gray-900 py-24 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 mb-4">Simple Process</Badge>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Up and Running in 10 Minutes
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            No complex setup. No IT required. Just sign up, import your data, and start closing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-px bg-gradient-to-r from-orange-500/50 via-purple-500/50 to-green-500/50" />

          {steps.map(({ step, icon: Icon, title, description, color, bg }) => (
            <div key={step} className="relative text-center">
              <div className={`inline-flex h-16 w-16 rounded-2xl ${bg} items-center justify-center mb-6 mx-auto relative`}>
                <Icon className={`h-7 w-7 ${color}`} />
                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-400">{step}</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
              <p className="text-gray-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Comparison Table ─────────────────────────────────────────────────────────
function ComparisonTable() {
  const features = [
    { name: "Starting Price", apex: "$197/mo (5 users)", hubspot: "$800+/mo", salesforce: "$1,000+/mo", pipedrive: "$95+/mo" },
    { name: "Freight Operations", apex: true, hubspot: false, salesforce: false, pipedrive: false },
    { name: "AI Prospecting Engine", apex: true, hubspot: "Limited", salesforce: "Add-on $$$", pipedrive: false },
    { name: "Email Deliverability Suite", apex: true, hubspot: "Add-on", salesforce: "Add-on", pipedrive: false },
    { name: "SMTP Rotation (260 addresses)", apex: true, hubspot: false, salesforce: false, pipedrive: false },
    { name: "Ghost Sequences (AI)", apex: true, hubspot: false, salesforce: false, pipedrive: false },
    { name: "Compliance Fortress", apex: true, hubspot: "Partial", salesforce: "Partial", pipedrive: false },
    { name: "Freight Marketplace", apex: true, hubspot: false, salesforce: false, pipedrive: false },
    { name: "Voice AI Agent", apex: true, hubspot: "Add-on", salesforce: "Add-on $$$", pipedrive: false },
    { name: "Battle Cards (AI)", apex: true, hubspot: false, salesforce: false, pipedrive: false },
    { name: "Setup Time", apex: "< 10 minutes", hubspot: "Days–Weeks", salesforce: "Weeks–Months", pipedrive: "Hours" },
    { name: "Free Trial", apex: "2 Months Free", hubspot: "14 days", salesforce: "30 days", pipedrive: "14 days" },
  ];

  const renderCell = (val: boolean | string) => {
    if (val === true) return <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />;
    if (val === false) return <X className="h-5 w-5 text-red-500/50 mx-auto" />;
    return <span className="text-xs text-gray-400">{val}</span>;
  };

  return (
    <section id="compare" className="bg-gray-950 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20 mb-4">Side by Side</Badge>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Why Teams Switch to Apex
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            More features. Lower price. Built specifically for freight brokers and high-velocity sales teams.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900">
                <th className="text-left p-4 text-gray-400 font-medium text-sm w-1/3">Feature</th>
                <th className="p-4 text-center">
                  <div className="inline-flex flex-col items-center">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-1">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-white font-bold text-sm">Apex CRM</span>
                    <Badge className="bg-orange-500/20 text-orange-400 border-0 text-xs mt-1">Best Value</Badge>
                  </div>
                </th>
                <th className="p-4 text-center">
                  <span className="text-gray-400 font-medium text-sm">HubSpot</span>
                </th>
                <th className="p-4 text-center">
                  <span className="text-gray-400 font-medium text-sm">Salesforce</span>
                </th>
                <th className="p-4 text-center">
                  <span className="text-gray-400 font-medium text-sm">Pipedrive</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map(({ name, apex, hubspot, salesforce, pipedrive }, i) => (
                <tr
                  key={name}
                  className={`border-t border-white/5 ${i % 2 === 0 ? "bg-gray-900/30" : "bg-transparent"}`}
                >
                  <td className="p-4 text-sm text-gray-300">{name}</td>
                  <td className="p-4 text-center bg-orange-500/5">{renderCell(apex)}</td>
                  <td className="p-4 text-center">{renderCell(hubspot)}</td>
                  <td className="p-4 text-center">{renderCell(salesforce)}</td>
                  <td className="p-4 text-center">{renderCell(pipedrive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-8">
          <Link href="/signup">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-8 h-12 text-base shadow-lg shadow-orange-500/25">
              Switch to Apex CRM — 2 Months Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing Section ──────────────────────────────────────────────────────────
function Pricing() {
  const [annual, setAnnual] = useState(false);

  const plans = [
    {
      name: "Starter",
      monthlyPrice: 197,
      description: "Perfect for small teams getting started with CRM",
      users: "Up to 5 users",
      contacts: "10,000 contacts",
      storage: "5 GB storage",
      highlight: false,
      features: [
        "CRM Core (Companies, Contacts, Deals, Tasks)",
        "Email campaigns & templates",
        "Basic reporting & analytics",
        "HubSpot data import",
        "Email support",
        "2 months free trial",
      ],
    },
    {
      name: "Growth",
      monthlyPrice: 697,
      description: "For growing teams that need advanced automation",
      users: "Up to 15 users",
      contacts: "100,000 contacts",
      storage: "25 GB storage",
      highlight: true,
      features: [
        "Everything in Starter, plus:",
        "Paradigm Engine (AI prospecting)",
        "Ghost Sequences & Battle Cards",
        "Advanced email deliverability",
        "Workflow automation",
        "A/B testing engine",
        "Team performance tracking",
        "Priority support",
      ],
    },
    {
      name: "Enterprise",
      monthlyPrice: 1497,
      description: "Full platform access with white-label capabilities",
      users: "Up to 25 users",
      contacts: "Unlimited contacts",
      storage: "100 GB storage",
      highlight: false,
      features: [
        "Everything in Growth, plus:",
        "White-label branding",
        "AI Voice Agent",
        "Revenue Autopilot",
        "Freight Marketplace access",
        "Custom domain support",
        "API access & webhooks",
        "Dedicated account manager",
        "Custom integrations",
      ],
    },
  ];

  return (
    <section id="pricing" className="bg-gray-900 py-24 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 mb-4">Simple Pricing</Badge>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Transparent Pricing. No Surprises.
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Every plan includes 2 months free. Cancel anytime. No hidden fees.
          </p>

          {/* Annual toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-800 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!annual ? "bg-white text-gray-900" : "text-gray-400"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${annual ? "bg-white text-gray-900" : "text-gray-400"}`}
            >
              Annual <span className="text-green-400 text-xs ml-1">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(({ name, monthlyPrice, description, users, contacts, storage, highlight, features }) => {
            const price = annual ? Math.round(monthlyPrice * 0.8) : monthlyPrice;
            return (
              <div
                key={name}
                className={`relative rounded-2xl p-8 border transition-all ${
                  highlight
                    ? "bg-gradient-to-b from-orange-500/10 to-gray-900 border-orange-500/30 shadow-2xl shadow-orange-500/10 scale-105"
                    : "bg-gray-950 border-white/5"
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white border-0 shadow-lg">Most Popular</Badge>
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
                <p className="text-sm text-gray-400 mb-4">{description}</p>
                <div className="mb-4">
                  <span className="text-4xl font-extrabold text-white">${price}</span>
                  <span className="text-gray-400 text-sm">/month</span>
                  {annual && <p className="text-xs text-green-400 mt-1">Billed annually (save ${(monthlyPrice - price) * 12}/yr)</p>}
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {[users, contacts, storage].map((t) => (
                    <span key={t} className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded-md">{t}</span>
                  ))}
                </div>
                <Link href="/signup">
                  <Button
                    className={`w-full mb-6 font-semibold ${
                      highlight
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
                        : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                    }`}
                  >
                    Get Started — 2 Months Free
                  </Button>
                </Link>
                <ul className="space-y-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Chen",
      title: "Sales Manager",
      company: "TechCorp Logistics",
      avatar: "SC",
      color: "bg-blue-500",
      quote: "Apex CRM increased our close rate by 34% in the first quarter. The AI prospecting alone is worth the investment — it found 200+ qualified leads we never would have found manually.",
      stars: 5,
    },
    {
      name: "Mike Rodriguez",
      title: "VP of Sales",
      company: "LogiFreight Inc.",
      avatar: "MR",
      color: "bg-orange-500",
      quote: "We migrated from Salesforce and saved $12,000/year. The freight features are a game-changer for our industry — load management, carrier vetting, and the marketplace are all built in.",
      stars: 5,
    },
    {
      name: "Lisa Park",
      title: "Director of Operations",
      company: "FastShip Inc.",
      avatar: "LP",
      color: "bg-purple-500",
      quote: "The onboarding was seamless. Our team was productive within hours, not weeks. The AI-driven tutorials walked everyone through exactly what they needed to know for their role.",
      stars: 5,
    },
    {
      name: "James Lavallee",
      title: "CEO",
      company: "Logistics Worldwide",
      avatar: "JL",
      color: "bg-green-500",
      quote: "The Ghost Sequences feature is incredible. It automatically follows up with prospects and only alerts us when someone is ready to talk. Our team's productivity doubled overnight.",
      stars: 5,
    },
    {
      name: "Amanda Torres",
      title: "Head of Marketing",
      company: "CargoConnect",
      avatar: "AT",
      color: "bg-pink-500",
      quote: "Email deliverability went from 72% to 98.7% after switching. The compliance fortress and SMTP rotation system is something no other CRM offers at this price point.",
      stars: 5,
    },
    {
      name: "David Kim",
      title: "Freight Broker",
      company: "Prime Freight Solutions",
      avatar: "DK",
      color: "bg-cyan-500",
      quote: "As a freight broker, I needed a CRM that understood my business. Apex CRM has FMCSA scanning, carrier vetting, load management — it's like it was built specifically for us.",
      stars: 5,
    },
  ];

  return (
    <section id="testimonials" className="bg-gray-950 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 mb-4">Customer Stories</Badge>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Trusted by Sales Teams Everywhere
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Real results from real customers who switched to Apex CRM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map(({ name, title, company, avatar, color, quote, stars }) => (
            <div
              key={name}
              className="bg-gray-900 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all hover:shadow-xl hover:shadow-black/20"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <Quote className="h-5 w-5 text-gray-600 mb-3" />
              <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">"{quote}"</p>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {avatar}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{name}</p>
                  <p className="text-gray-500 text-xs">{title} · {company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: "How long does setup take?",
      a: "Most teams are fully operational within 10 minutes. Import your existing data from HubSpot, Salesforce, or a CSV, and our AI-driven onboarding tutorial walks every team member through their specific role. No IT required.",
    },
    {
      q: "Can I import my data from HubSpot or Salesforce?",
      a: "Yes. Apex CRM has a one-click HubSpot import and a full migration engine for Salesforce, Pipedrive, and other CRMs. Your companies, contacts, deals, notes, and activities all transfer automatically.",
    },
    {
      q: "What makes Apex CRM different from HubSpot or Salesforce?",
      a: "Apex CRM is purpose-built for freight brokers and high-velocity sales teams. It includes freight operations (load management, carrier vetting, FMCSA scanner), AI prospecting (Paradigm Engine), email deliverability infrastructure (52 domains, 260 addresses), and compliance tools — all in one platform at a fraction of the cost.",
    },
    {
      q: "How does the 2-month free trial work?",
      a: "Sign up for any plan and get 2 full months free — no credit card required. After 2 months, you'll be billed at your plan's monthly rate. Cancel anytime before the trial ends and you won't be charged.",
    },
    {
      q: "Is there a limit on contacts or storage?",
      a: "Starter includes 10,000 contacts and 5 GB storage. Growth includes 100,000 contacts and 25 GB. Enterprise includes unlimited contacts and 100 GB. You can upgrade at any time.",
    },
    {
      q: "What is the Paradigm Engine?",
      a: "The Paradigm Engine is Apex CRM's AI-powered prospecting system. It automatically discovers leads from trigger signals (job changes, patents, social activity), verifies emails, builds psychographic profiles (Digital Twins), and runs autonomous Ghost Sequences to engage prospects — alerting your team only when a prospect is ready to buy.",
    },
    {
      q: "Do you offer white-label options?",
      a: "Yes. Enterprise plan includes full white-label branding — custom domain, your logo, your color scheme. Your clients see your brand, not ours.",
    },
    {
      q: "What support is included?",
      a: "Starter includes email support. Growth includes priority support with faster response times. Enterprise includes a dedicated account manager and custom integration support.",
    },
  ];

  return (
    <section className="bg-gray-900 py-24 border-y border-white/5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 mb-4">FAQ</Badge>
          <h2 className="text-4xl font-extrabold text-white mb-4">Common Questions</h2>
          <p className="text-gray-400">Everything you need to know before getting started.</p>
        </div>

        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <div
              key={i}
              className="bg-gray-950 rounded-xl border border-white/5 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/2 transition-colors"
              >
                <span className="text-white font-medium text-sm pr-4">{q}</span>
                {open === i ? (
                  <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="bg-gray-950 py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative rounded-3xl bg-gradient-to-br from-orange-500/20 via-gray-900 to-purple-500/10 border border-orange-500/20 p-12 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
          <div className="relative z-10">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 items-center justify-center mb-6 shadow-2xl shadow-orange-500/30">
              <Rocket className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
              Ready to Transform Your Sales?
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join hundreds of companies already using Apex CRM to close more deals, faster. Start your 2-month free trial today — no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-10 h-14 text-base shadow-2xl shadow-orange-500/30 rounded-xl"
                >
                  Start Free — 2 Months Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white bg-transparent hover:bg-white/10 h-14 px-8 text-base rounded-xl"
                >
                  Sign In to Your Account
                </Button>
              </Link>
            </div>
            <p className="text-gray-500 text-sm mt-6">
              2 months free · No credit card required · Cancel anytime · Setup in 10 minutes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-gray-950 border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Apex CRM</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              The most powerful CRM for freight brokers and high-velocity sales teams.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Product</h4>
            <ul className="space-y-2">
              {[
                { label: "Features", action: () => scrollTo("features") },
                { label: "Pricing", action: () => scrollTo("pricing") },
                { label: "Compare", action: () => scrollTo("compare") },
                { label: "How It Works", action: () => scrollTo("how-it-works") },
              ].map(({ label, action }) => (
                <li key={label}>
                  <button onClick={action} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Resources</h4>
            <ul className="space-y-2">
              {[
                { label: "Help Center", href: "/help" },
                { label: "API Documentation", href: "/api-keys" },
                { label: "Migration Guide", href: "/migration" },
                { label: "Integrations", href: "/paradigm/integrations" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Account</h4>
            <ul className="space-y-2">
              {[
                { label: "Sign In", href: "/login" },
                { label: "Create Account", href: "/signup" },
                { label: "Subscription", href: "/subscription" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">© 2025 Apex CRM. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-gray-600 text-xs">Privacy Policy</span>
            <span className="text-gray-600 text-xs">Terms of Service</span>
            <span className="text-gray-600 text-xs">Contact Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function MarketingHome() {
  return (
    <div className="min-h-screen bg-gray-950 font-sans">
      <Nav />
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <ComparisonTable />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
