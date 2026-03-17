import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Play, X, Check, ChevronDown,
  Zap, Shield, Brain, Mail, BarChart3, Users, Target,
  Globe, Lock, Rocket, Star, TrendingUp, Clock,
  CheckCircle, XCircle, Sparkles, CreditCard,
  Database, Cpu, RefreshCw, Eye, MessageSquare,
  FileText, Activity, DollarSign, Building2,
  GitBranch, ChevronRight, Menu,
} from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";
import ScrollReveal from "@/components/ScrollReveal";
import InteractiveDemoTour from "@/components/InteractiveDemoTour";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function GradientText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Brain,
    color: "text-purple-600",
    bg: "bg-purple-50",
    title: "Paradigm Engine™",
    desc: "5-layer AI that finds, verifies, profiles, and engages prospects autonomously — while you sleep.",
  },
  {
    icon: Eye,
    color: "text-blue-600",
    bg: "bg-blue-50",
    title: "Ghost Mode Sequences",
    desc: "AI writes and sends personalized 4-stage email sequences. Hands off hot leads the moment intent is detected.",
  },
  {
    icon: Mail,
    color: "text-green-600",
    bg: "bg-green-50",
    title: "98.7% Inbox Placement",
    desc: "260 rotating SMTP addresses across 52 domains. Real-time blacklist monitoring on 50+ lists.",
  },
  {
    icon: Shield,
    color: "text-orange-600",
    bg: "bg-orange-50",
    title: "Compliance Fortress™",
    desc: "Every email auto-validated against CAN-SPAM, GDPR & CCPA before it ever leaves your server.",
  },
  {
    icon: BarChart3,
    color: "text-rose-600",
    bg: "bg-rose-50",
    title: "Revenue Intelligence",
    desc: "Pipeline analytics, email heatmaps, team leaderboards, and AI-powered revenue forecasting.",
  },
  {
    icon: Rocket,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    title: "30-Minute Migration",
    desc: "One-touch import from HubSpot, Salesforce, Pipedrive, or any CSV. Zero data loss guaranteed.",
  },
];

const comparison = [
  { feature: "AI Prospect Research", apex: true, hubspot: false, salesforce: false, pipedrive: false },
  { feature: "Autonomous Email Sequences", apex: true, hubspot: "Partial", salesforce: false, pipedrive: false },
  { feature: "98%+ Inbox Placement", apex: true, hubspot: false, salesforce: false, pipedrive: false },
  { feature: "260 SMTP Rotation", apex: true, hubspot: false, salesforce: false, pipedrive: false },
  { feature: "Compliance Auto-Validation", apex: true, hubspot: "Partial", salesforce: "Partial", pipedrive: false },
  { feature: "60-Day Free Trial", apex: true, hubspot: false, salesforce: false, pipedrive: false },
  { feature: "One-Touch Migration", apex: true, hubspot: false, salesforce: false, pipedrive: false },
  { feature: "Freight/Logistics Focus", apex: true, hubspot: false, salesforce: false, pipedrive: false },
  { feature: "Battle Cards (AI)", apex: true, hubspot: false, salesforce: false, pipedrive: false },
  { feature: "Price / User / Month", apex: "$197", hubspot: "$800+", salesforce: "$1,200+", pipedrive: "$400+" },
];

const testimonials = [
  {
    quote: "We switched from Salesforce in a weekend. Our email deliverability went from 62% to 97% in the first month. The AI sequences alone paid for the entire year.",
    name: "Sarah K.",
    title: "VP Sales, National Freight Partners",
    avatar: "SK",
    color: "bg-orange-500",
  },
  {
    quote: "The Paradigm Engine found 340 qualified prospects in our first week. Our old CRM couldn't do that in a year. This is a completely different category of software.",
    name: "Marcus T.",
    title: "Director of Sales, Velocity Logistics",
    avatar: "MT",
    color: "bg-blue-500",
  },
  {
    quote: "Ghost Mode is unreal. It runs our entire outbound sequence without us touching it. When a lead replies with interest, our reps get a Battle Card and jump in. Close rates are up 41%.",
    name: "James R.",
    title: "CEO, CrossCountry Brokerage",
    avatar: "JR",
    color: "bg-purple-500",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: 197,
    description: "Perfect for small freight teams getting started.",
    features: ["Up to 5 users", "10,000 contacts", "Paradigm Engine™ (Basic)", "Ghost Mode sequences", "Email deliverability suite", "Standard support"],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Professional",
    price: 697,
    description: "The complete platform for growing brokerages.",
    features: ["Up to 25 users", "100,000 contacts", "Paradigm Engine™ (Full)", "Ghost Mode + Battle Cards", "260 SMTP rotation", "Compliance Fortress™", "Priority support", "Custom branding"],
    cta: "Start Free Trial",
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    price: 1497,
    description: "Unlimited scale for enterprise freight operations.",
    features: ["Unlimited users", "Unlimited contacts", "All Professional features", "Dedicated SMTP infrastructure", "Custom AI training", "SLA guarantee", "Dedicated account manager", "White-label option"],
    cta: "Start Free Trial",
    highlight: false,
  },
];

const faqs = [
  {
    q: "How does the 60-day free trial work?",
    a: "You get full access to the entire platform for 60 days. A credit card is required to start — this ensures we can provision your dedicated SMTP infrastructure and AI resources from day one. You won't be charged until day 61, and you can cancel anytime before that.",
  },
  {
    q: "How long does migration from my current CRM take?",
    a: "Most customers complete their full migration in under 30 minutes. Our one-touch migration engine connects directly to HubSpot, Salesforce, Pipedrive, and Close via API, automatically maps all your custom fields, and imports contacts, deals, emails, and activity history with zero data loss.",
  },
  {
    q: "Why is your inbox placement rate so much higher than competitors?",
    a: "We operate 260 dedicated SMTP addresses across 52 domains with real-time rotation. Every domain is warmed up, monitored against 50+ blacklists, and configured with SPF, DKIM, and DMARC. Competitors use shared sending infrastructure — your emails compete with thousands of other senders. Ours don't.",
  },
  {
    q: "What is the Paradigm Engine™?",
    a: "It's our 5-layer AI prospecting system: (1) Sentinel Layer monitors job changes and social signals 24/7, (2) Nutrition Gate verifies every email via NeverBounce, (3) Digital Twin builds a psychographic profile of each prospect, (4) Ghost Mode deploys personalized sequences, (5) Battle Cards generate AI tactical summaries when a prospect shows buying intent.",
  },
  {
    q: "Is Apex CRM only for freight brokers?",
    a: "While we're purpose-built for freight and logistics with industry-specific workflows, our platform works for any B2B sales team. The AI prospecting, email infrastructure, and compliance tools are universally valuable. Freight teams just get additional features like load board integration and carrier management.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function MarketingHome() {
  const [videoOpen, setVideoOpen] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Demo", href: "#demo" },
    { label: "Pricing", href: "#pricing" },
    { label: "Compare", href: "#compare" },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="font-black text-lg tracking-tight text-gray-900">Apex CRM</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">{l.label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <button className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors px-4 py-2">Sign In</button>
            </Link>
            <Link href="/signup">
              <button className="text-sm font-semibold bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors">
                Start Free Trial
              </button>
            </Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4"
            >
              {navLinks.map((l) => (
                <a key={l.label} href={l.href} className="text-sm font-medium text-gray-600" onClick={() => setMobileMenuOpen(false)}>{l.label}</a>
              ))}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <Link href="/login"><button className="flex-1 text-sm font-semibold border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl">Sign In</button></Link>
                <Link href="/signup"><button className="flex-1 text-sm font-semibold bg-gray-900 text-white px-4 py-2.5 rounded-xl">Start Free Trial</button></Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50/60 via-white to-white pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-orange-100/40 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-8"
          >
            <Sparkles className="h-3.5 w-3.5" />
            The AI-Powered CRM Built for Freight Brokers
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 leading-[1.05] mb-6"
          >
            Stop Losing Deals.<br />
            <GradientText>Start Closing Them.</GradientText>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Apex CRM combines autonomous AI prospecting, 98.7% email deliverability, and one-touch migration from any CRM — all in a platform purpose-built for freight and logistics.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
          >
            <Link href="/signup">
              <button className="flex items-center gap-2 bg-gray-900 text-white font-bold text-base px-8 py-4 rounded-2xl hover:bg-gray-800 transition-all hover:shadow-xl hover:shadow-gray-900/20 hover:-translate-y-0.5">
                Start 60-Day Free Trial
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <button
              onClick={() => setVideoOpen(true)}
              className="flex items-center gap-2.5 text-gray-600 font-semibold text-base px-6 py-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                <Play className="h-3 w-3 text-orange-600 fill-orange-600 ml-0.5" />
              </div>
              Watch Demo
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-gray-400 flex items-center justify-center gap-1.5"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Credit card required · Cancel anytime · Full access from day one
          </motion.p>
        </div>

        {/* Hero dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="max-w-5xl mx-auto mt-16 relative"
        >
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/80 border border-gray-200/80">
            {/* Browser bar */}
            <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-400 flex items-center gap-1.5 max-w-xs mx-auto">
                  <Lock className="h-3 w-3 text-green-500" />
                  app.apexcrm.com/dashboard
                </div>
              </div>
            </div>
            {/* Dashboard preview */}
            <div className="bg-gray-50 p-6" style={{ minHeight: 320 }}>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Pipeline Value", value: "$4.2M", delta: "+12%", color: "text-orange-600" },
                  { label: "Hot Leads", value: "47", delta: "+8 today", color: "text-blue-600" },
                  { label: "Deliverability", value: "98.7%", delta: "+27% vs before", color: "text-green-600" },
                  { label: "Deals Won", value: "23", delta: "This month", color: "text-purple-600" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                  >
                    <div className="text-xs text-gray-400 mb-1">{stat.label}</div>
                    <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                    <div className={`text-xs font-semibold mt-0.5 ${stat.color}`}>{stat.delta}</div>
                  </motion.div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-3">Pipeline Activity — Last 30 Days</div>
                  <div className="flex items-end gap-1 h-16">
                    {[35, 48, 42, 65, 58, 72, 68, 85, 78, 92, 88, 100, 95, 88, 76, 82, 90, 96, 88, 100].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 0.8 + i * 0.03 }}
                        className="flex-1 rounded-sm"
                        style={{ background: i >= 18 ? "#f97316" : "#e5e7eb" }}
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="text-xs font-semibold text-gray-500 mb-3">AI Activity — Live</div>
                  {[
                    { dot: "bg-orange-400", msg: "12 new prospects found" },
                    { dot: "bg-green-400", msg: "47 emails sent" },
                    { dot: "bg-blue-400", msg: "3 Battle Cards ready" },
                    { dot: "bg-purple-400", msg: "203 contacts verified" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.dot}`} />
                      <div className="text-xs text-gray-600 truncate">{item.msg}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Floating badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0 }}
            className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Average customer result</div>
              <div className="text-sm font-black text-gray-900">+41% close rate in 90 days</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 98.7, suffix: "%", label: "Inbox Placement Rate", decimals: 1 },
              { value: 41, suffix: "%", label: "Avg. Close Rate Increase", decimals: 0 },
              { value: 30, suffix: " min", label: "Migration Time", decimals: 0 },
              { value: 260, suffix: "", label: "Dedicated SMTP Addresses", decimals: 0 },
            ].map((stat, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div>
                  <div className="text-4xl font-black text-gray-900">
                    <AnimatedCounter end={stat.value} decimals={stat.decimals} suffix={stat.suffix} label="" />
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-3">Platform Features</p>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                Everything your team needs.<br />
                <GradientText>Nothing you don't.</GradientText>
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mx-auto">
                Built specifically for freight brokers who want to close more deals, not manage more software.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <div className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-orange-100 hover:shadow-lg hover:shadow-orange-50 transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                    <feature.icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50/60">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-3">How It Works</p>
              <h2 className="text-4xl font-black text-gray-900 mb-4">Up and running in <GradientText>under an hour.</GradientText></h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: GitBranch, title: "Connect & Migrate", desc: "Sign up, enter your current CRM credentials, and our engine imports everything — contacts, deals, email history — in under 30 minutes." },
              { step: "02", icon: Cpu, title: "AI Goes to Work", desc: "The Paradigm Engine starts researching prospects, Ghost Mode queues personalized sequences, and your inbox placement climbs to 98%+." },
              { step: "03", icon: TrendingUp, title: "Close More Deals", desc: "Your reps get Battle Cards when leads show intent. Revenue Autopilot re-engages stalled deals. You watch the pipeline grow." },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 0.12}>
                <div className="relative">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-gray-200 to-transparent z-10" style={{ width: "calc(100% - 2rem)", left: "calc(100% - 1rem)" }} />
                  )}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl font-black text-gray-100">{item.step}</span>
                      <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                        <item.icon className="h-4.5 w-4.5 text-orange-600" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Video section ────────────────────────────────────────────────── */}
      <section id="demo" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-3">See It In Action</p>
              <h2 className="text-4xl font-black text-gray-900 mb-4">Watch Apex CRM <GradientText>in action.</GradientText></h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Highlight reel */}
            <ScrollReveal delay={0.1}>
              <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                <div className="relative aspect-video bg-gray-900 overflow-hidden cursor-pointer group" onClick={() => setVideoOpen(true)}>
                  <video
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663348315388/mLLZEfmfSEuH47dfeJgVGY/apex-highlight-reel-final_5b1650cb.mp4"
                    className="w-full h-full object-cover opacity-80"
                    autoPlay muted loop playsInline
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div whileHover={{ scale: 1.1 }} className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Play className="h-5 w-5 text-gray-900 fill-gray-900 ml-0.5" />
                    </motion.div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-1">Product Highlight Reel</h3>
                  <p className="text-sm text-gray-500">A 60-second cinematic overview of what makes Apex CRM different.</p>
                </div>
              </div>
            </ScrollReveal>

            {/* Full tutorial placeholder */}
            <ScrollReveal delay={0.2}>
              <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center mx-auto mb-3">
                      <Play className="h-5 w-5 text-blue-600 fill-blue-600 ml-0.5" />
                    </div>
                    <p className="font-bold text-gray-700">Full Tutorial</p>
                    <p className="text-sm text-gray-400">Coming soon</p>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-1">Complete Platform Walkthrough</h3>
                  <p className="text-sm text-gray-500">Step-by-step guide through every feature — from setup to your first closed deal.</p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    Full walkthrough · All features covered
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Interactive Demo Tour ─────────────────────────────────────────── */}
      <div id="interactive-demo">
        <InteractiveDemoTour />
      </div>

      {/* ── Comparison ───────────────────────────────────────────────────── */}
      <section id="compare" className="py-24 px-6 bg-gray-50/60">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-3">How We Compare</p>
              <h2 className="text-4xl font-black text-gray-900 mb-4">The competition doesn't <GradientText>come close.</GradientText></h2>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-4 font-semibold text-gray-500 w-1/3">Feature</th>
                    <th className="p-4 font-black text-orange-600 bg-orange-50/50">Apex CRM</th>
                    <th className="p-4 font-semibold text-gray-400">HubSpot</th>
                    <th className="p-4 font-semibold text-gray-400">Salesforce</th>
                    <th className="p-4 font-semibold text-gray-400">Pipedrive</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                      <td className="p-4 text-gray-700 font-medium">{row.feature}</td>
                      {[row.apex, row.hubspot, row.salesforce, row.pipedrive].map((val, j) => (
                        <td key={j} className={`p-4 text-center ${j === 0 ? "bg-orange-50/30" : ""}`}>
                          {val === true ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          ) : val === false ? (
                            <XCircle className="h-4 w-4 text-gray-200 mx-auto" />
                          ) : (
                            <span className={`text-xs font-semibold ${j === 0 ? "text-orange-600" : "text-gray-400"}`}>{val}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-3">Pricing</p>
              <h2 className="text-4xl font-black text-gray-900 mb-4">Simple pricing. <GradientText>Massive value.</GradientText></h2>
              <p className="text-gray-500 mb-8">All plans include a 60-day free trial. Credit card required.</p>
              <div className="inline-flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setBillingAnnual(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!billingAnnual ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingAnnual(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${billingAnnual ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
                >
                  Annual
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">Save 25%</span>
                </button>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, i) => {
              const price = billingAnnual ? Math.round(plan.price * 0.75) : plan.price;
              return (
                <ScrollReveal key={i} delay={i * 0.1}>
                  <div className={`relative rounded-2xl p-8 h-full flex flex-col ${plan.highlight ? "bg-gray-900 text-white shadow-2xl shadow-gray-900/20 scale-105" : "bg-white border border-gray-100 shadow-sm"}`}>
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">{plan.badge}</span>
                      </div>
                    )}
                    <div className="mb-6">
                      <h3 className={`text-lg font-black mb-1 ${plan.highlight ? "text-white" : "text-gray-900"}`}>{plan.name}</h3>
                      <p className={`text-sm mb-4 ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>{plan.description}</p>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-5xl font-black ${plan.highlight ? "text-white" : "text-gray-900"}`}>${price}</span>
                        <span className={`text-sm ${plan.highlight ? "text-gray-400" : "text-gray-400"}`}>/mo</span>
                      </div>
                    </div>
                    <ul className="space-y-3 flex-1 mb-8">
                      {plan.features.map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2.5">
                          <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.highlight ? "text-orange-400" : "text-green-500"}`} />
                          <span className={`text-sm ${plan.highlight ? "text-gray-300" : "text-gray-600"}`}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/signup">
                      <button className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${plan.highlight ? "bg-orange-500 text-white hover:bg-orange-400" : "bg-gray-900 text-white hover:bg-gray-800"}`}>
                        {plan.cta}
                      </button>
                    </Link>
                    <p className={`text-xs text-center mt-3 flex items-center justify-center gap-1 ${plan.highlight ? "text-gray-500" : "text-gray-400"}`}>
                      <CreditCard className="h-3 w-3" />
                      Credit card required
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50/60">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-3">Customer Stories</p>
              <h2 className="text-4xl font-black text-gray-900 mb-4">Real results from <GradientText>real brokers.</GradientText></h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, si) => (
                      <Star key={si} className="h-4 w-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed flex-1 mb-6">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold`}>{t.avatar}</div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{t.name}</div>
                      <div className="text-xs text-gray-400">{t.title}</div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-3">FAQ</p>
              <h2 className="text-4xl font-black text-gray-900">Common questions.</h2>
            </div>
          </ScrollReveal>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <ScrollReveal key={i} delay={i * 0.05}>
                <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 text-sm pr-4">{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-4">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <div className="bg-gray-900 rounded-3xl p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-4xl font-black text-white mb-4">
                  Ready to close more deals?
                </h2>
                <p className="text-gray-400 mb-8 text-lg">
                  Join hundreds of freight brokers who switched to Apex CRM and never looked back.
                </p>
                <Link href="/signup">
                  <button className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-base px-8 py-4 rounded-2xl transition-all hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5">
                    Start Your 60-Day Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <p className="text-gray-500 text-sm mt-4 flex items-center justify-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  Credit card required · Cancel anytime
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-white fill-white" />
              </div>
              <span className="font-black text-gray-900">Apex CRM</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              {["Privacy Policy", "Terms of Service", "Contact"].map((l) => (
                <a key={l} href="#" className="hover:text-gray-600 transition-colors">{l}</a>
              ))}
            </div>
            <p className="text-sm text-gray-400">© 2026 Apex CRM. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ── Video Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setVideoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
            >
              <button
                onClick={() => setVideoOpen(false)}
                className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="aspect-video">
                <iframe
                  src="https://www.youtube.com/embed/Y91YVB-yZhs?autoplay=1&rel=0&modestbranding=1"
                  title="Apex CRM Demo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
