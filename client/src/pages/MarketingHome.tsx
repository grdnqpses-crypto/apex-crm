import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  ArrowRight, Play, X, Check, ChevronDown,
  Zap, Shield, Brain, Mail, BarChart3, Users, Target,
  Globe, Lock, Rocket, Star, TrendingUp, Clock, Award,
  CheckCircle, XCircle, ArrowUpRight, Sparkles,
  Database, Cpu, RefreshCw, Eye, MessageSquare, Phone,
  FileText, Layers, Activity, DollarSign, Truck, Building2,
  GitBranch, Wifi, ThumbsUp, ChevronRight,
} from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";
import ScrollReveal from "@/components/ScrollReveal";
import InteractiveDemoTour from "@/components/InteractiveDemoTour";

// ── Server icon (inline SVG) ─────────────────────────────────────────────────
function ServerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}

// ── Gradient text ────────────────────────────────────────────────────────────
function GradientText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}

// ── Glass card ───────────────────────────────────────────────────────────────
function GlassCard({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm ${hover ? "hover:border-orange-500/30 hover:bg-white/8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10" : ""} ${className}`}>
      {children}
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────
function Badge({ children, color = "orange" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${colors[color] || colors.orange}`}>
      {children}
    </span>
  );
}

// ── Comparison cell ──────────────────────────────────────────────────────────
function CompCell({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />;
  if (value === false) return <XCircle className="h-5 w-5 text-red-400/60 mx-auto" />;
  return <span className="text-gray-400 text-sm">{value as string}</span>;
}

// ── Typewriter ───────────────────────────────────────────────────────────────
function Typewriter({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[index];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && displayed.length < word.length) {
      timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
    } else if (!deleting && displayed.length === word.length) {
      timeout = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40);
    } else {
      setDeleting(false);
      setIndex((i) => (i + 1) % words.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, index, words]);

  return (
    <span>
      {displayed}
      <span className="animate-pulse text-orange-400">|</span>
    </span>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function MarketingHome() {
  const [videoOpen, setVideoOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroY = useTransform(scrollY, [0, 500], [0, -100]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  // ── Data ──────────────────────────────────────────────────────────────────
  const stats = [
    { end: 500, suffix: "+", label: "Companies Trust Apex", sublabel: "Freight & Logistics Teams" },
    { end: 2.1, suffix: "B+", prefix: "$", decimals: 1, label: "Pipeline Managed", sublabel: "Active Deals Tracked" },
    { end: 98.7, suffix: "%", decimals: 1, label: "Email Deliverability", sublabel: "Industry avg: 71%" },
    { end: 260, label: "SMTP Addresses", sublabel: "52 Domains Rotating" },
    { end: 60, label: "Day Free Trial", sublabel: "No Credit Card Required" },
    { end: 4, suffix: "x", label: "Faster Migration", sublabel: "One-Touch Import" },
  ];

  const features = [
    {
      icon: Brain,
      color: "orange",
      badge: "Proprietary AI",
      title: "Paradigm Engine™",
      subtitle: "AI Prospecting Nobody Else Has",
      description: "Our proprietary 5-layer AI engine discovers, verifies, profiles, and autonomously engages prospects — all without human intervention. Ghost Mode sequences write themselves, adapt in real-time, and hand off hot leads the moment buying intent is detected.",
      bullets: [
        "Sentinel Layer: monitors job changes, patents, social signals 24/7",
        "Nutrition Gate: NeverBounce verification — only valid emails proceed",
        "Digital Twin: AI psychographic profiling of every prospect",
        "Ghost Mode: autonomous 4-stage email sequences that rewrite themselves",
        "Battle Cards: one-page AI tactical summaries for every hot lead",
      ],
      stat: "12-Dimension Quantum Lead Score",
      statValue: "12D",
    },
    {
      icon: Shield,
      color: "blue",
      badge: "Built-In",
      title: "Compliance Fortress™",
      subtitle: "CAN-SPAM, GDPR & CCPA Automated",
      description: "Every email is automatically validated against federal, state, and international regulations before it ever leaves your server. No legal exposure, no blacklists, no spam folders — ever.",
      bullets: [
        "Pre-send compliance validator blocks non-compliant emails automatically",
        "RFC 8058 one-click unsubscribe injection on every send",
        "AI subject line deception detector catches misleading copy",
        "GDPR right-to-erasure and CCPA data deletion handled automatically",
        "Full compliance audit log for every email ever sent",
      ],
      stat: "Compliance Violations Reported",
      statValue: "0",
    },
    {
      icon: Mail,
      color: "purple",
      badge: "Exclusive",
      title: "Deliverability Infrastructure",
      subtitle: "98.7% Inbox Rate — Guaranteed",
      description: "260 email addresses across 52 domains, rotating automatically with health-aware load balancing. Provider-specific optimizations for Gmail, Outlook, and Yahoo. Your emails land in the inbox — period.",
      bullets: [
        "260 SMTP addresses across 5 Contabo MX servers rotating automatically",
        "Provider-specific headers: SNDS for Outlook, List-Unsubscribe for Gmail",
        "Real-time blacklist monitoring across 50+ lists with auto-alerts",
        "Domain warm-up scheduler with graduated volume increases",
        "Automatic domain pause when health score approaches danger threshold",
      ],
      stat: "Average Inbox Placement Rate",
      statValue: "98.7%",
    },
    {
      icon: Zap,
      color: "green",
      badge: "Automated",
      title: "Full Sales Automation",
      subtitle: "Your Team Sells. Apex Does Everything Else.",
      description: "Visual workflow builder with trigger-based actions, lead scoring, multi-channel sequences, and AI-powered follow-ups. Set it once, let it run forever.",
      bullets: [
        "Visual drag-and-drop workflow builder with 50+ trigger types",
        "AI lead scoring: 12-dimension Quantum Score updated in real-time",
        "Adaptive sequences that rewrite based on prospect engagement",
        "Predictive send-time optimizer per individual prospect",
        "Revenue Autopilot: AI identifies at-risk deals and takes action",
      ],
      stat: "Reduction in Manual Follow-Up Time",
      statValue: "85%",
    },
    {
      icon: Truck,
      color: "orange",
      badge: "Freight-Specific",
      title: "Built for Freight Brokers",
      subtitle: "The Only CRM That Speaks Your Language",
      description: "Every field, every workflow, every status is built for freight and logistics. FMCSA scanner, carrier vetting, load management, carrier packets, and freight marketplace — all in one platform.",
      bullets: [
        "25+ logistics-specific lead statuses (Active Shipper, Carrier Prospect, etc.)",
        "FMCSA database scanner for instant carrier verification",
        "Carrier vetting with safety score, insurance, and authority checks",
        "Load management with lane preferences and TMS integration",
        "Digital carrier packet generation and e-signature collection",
      ],
      stat: "Freight-Specific Lead Statuses",
      statValue: "25+",
    },
    {
      icon: BarChart3,
      color: "blue",
      badge: "Real-Time",
      title: "Intelligence Dashboard",
      subtitle: "See Everything. Miss Nothing.",
      description: "Real-time analytics across your entire sales operation. Engagement heatmaps, funnel analysis, ROI tracking, team performance, and AI-powered forecasting — all in one command center.",
      bullets: [
        "Live pipeline value, win rates, and velocity tracking",
        "Engagement heatmaps showing exactly when prospects are active",
        "AI win probability scoring on every open deal",
        "Team performance leaderboards with drill-down rep analytics",
        "Revenue forecasting with confidence intervals",
      ],
      stat: "View of Every Deal and Contact",
      statValue: "360°",
    },
  ];

  const comparisonRows: { feature: string; apex: boolean | string; hubspot: boolean | string; salesforce: boolean | string; pipedrive: boolean | string; close: boolean | string }[] = [
    { feature: "Starting Price", apex: "$197/mo", hubspot: "$800+/mo", salesforce: "$1,000+/mo", pipedrive: "$95+/mo", close: "$49+/mo" },
    { feature: "Free Trial", apex: "60 Days", hubspot: "14 Days", salesforce: "30 Days", pipedrive: "14 Days", close: "14 Days" },
    { feature: "Freight Operations", apex: true, hubspot: false, salesforce: false, pipedrive: false, close: false },
    { feature: "AI Prospecting Engine", apex: true, hubspot: "Limited", salesforce: "Add-on $$$", pipedrive: false, close: "Limited" },
    { feature: "SMTP Rotation (260)", apex: true, hubspot: false, salesforce: false, pipedrive: false, close: false },
    { feature: "Ghost Sequences (AI)", apex: true, hubspot: false, salesforce: false, pipedrive: false, close: false },
    { feature: "Compliance Fortress", apex: true, hubspot: "Partial", salesforce: "Partial", pipedrive: false, close: false },
    { feature: "98%+ Deliverability", apex: true, hubspot: false, salesforce: false, pipedrive: false, close: false },
    { feature: "One-Touch Migration", apex: true, hubspot: false, salesforce: false, pipedrive: "Partial", close: "Partial" },
    { feature: "Battle Cards (AI)", apex: true, hubspot: false, salesforce: "Add-on", pipedrive: false, close: false },
    { feature: "Voice AI Agent", apex: true, hubspot: "Add-on", salesforce: "Add-on $$$", pipedrive: false, close: true },
    { feature: "FMCSA Scanner", apex: true, hubspot: false, salesforce: false, pipedrive: false, close: false },
    { feature: "5-Tier Role Hierarchy", apex: true, hubspot: "Partial", salesforce: true, pipedrive: false, close: false },
    { feature: "Setup Time", apex: "< 1 Hour", hubspot: "Days", salesforce: "Weeks", pipedrive: "Hours", close: "Hours" },
  ];

  const testimonials = [
    {
      name: "Marcus T.", role: "VP of Sales", company: "Velocity Freight Solutions", avatar: "MT",
      color: "from-orange-500 to-red-500",
      quote: "We switched from Salesforce and cut our CRM costs by 73% while tripling our email deliverability. Ghost Mode sequences alone booked us 47 new shipper meetings in the first month.",
      metric: "3x", metricLabel: "Email Deliverability",
    },
    {
      name: "Sarah K.", role: "Operations Director", company: "Midwest Logistics Group", avatar: "SK",
      color: "from-blue-500 to-purple-500",
      quote: "The one-touch migration from HubSpot took 23 minutes. We imported 4,200 contacts, all our deals, and our entire email history. I've never seen anything like it.",
      metric: "23 min", metricLabel: "Migration Time",
    },
    {
      name: "James R.", role: "CEO", company: "CrossCountry Brokerage", avatar: "JR",
      color: "from-green-500 to-teal-500",
      quote: "The Compliance Fortress saved us from a potential CAN-SPAM lawsuit. It caught 3 non-compliant campaigns before they sent. The ROI paid for 10 years of subscription.",
      metric: "$0", metricLabel: "Compliance Violations",
    },
    {
      name: "Lisa M.", role: "Sales Manager", company: "Premier Freight Partners", avatar: "LM",
      color: "from-purple-500 to-pink-500",
      quote: "My reps went from 40 cold calls a day to 15 — because Apex's AI pre-qualifies everything. Our close rate went from 8% to 31%. Battle Cards are like having a sales coach on every call.",
      metric: "31%", metricLabel: "Close Rate (was 8%)",
    },
    {
      name: "David C.", role: "Founder", company: "Apex Freight Consulting", avatar: "DC",
      color: "from-yellow-500 to-orange-500",
      quote: "I've used every major CRM. HubSpot, Salesforce, Pipedrive, Close. Apex CRM is the first one built by people who actually understand freight brokerage. It's a freight platform with CRM built in.",
      metric: "5", metricLabel: "CRMs Replaced",
    },
    {
      name: "Rachel B.", role: "Director of Business Dev", company: "National Transport Alliance", avatar: "RB",
      color: "from-teal-500 to-blue-500",
      quote: "The 60-day free trial was the reason I tried it. The results were the reason I stayed. We generated $2.3M in new pipeline in our first 60 days using just the Paradigm Engine.",
      metric: "$2.3M", metricLabel: "Pipeline in 60 Days",
    },
  ];

  const pricingPlans = [
    {
      name: "Starter", price: billingAnnual ? 147 : 197, users: "Up to 5 users",
      description: "Perfect for small freight teams getting started",
      border: "border-white/10", highlight: false, badge: null,
      features: ["Full CRM (Contacts, Companies, Deals)", "Email campaigns & templates", "Basic automation workflows", "SMTP rotation (20 addresses)", "Standard deliverability tools", "FMCSA scanner", "Mobile app", "Email support", "60-day free trial"],
    },
    {
      name: "Professional", price: billingAnnual ? 497 : 697, users: "Up to 25 users",
      description: "For growing freight brokerages that want to dominate",
      border: "border-orange-500/50", highlight: true, badge: "Most Popular",
      features: ["Everything in Starter", "Paradigm Engine™ (full AI prospecting)", "Ghost Mode sequences", "Battle Cards AI", "Compliance Fortress™", "SMTP rotation (130 addresses)", "Voice AI Agent", "Carrier vetting & packets", "Load management", "Priority support", "60-day free trial"],
    },
    {
      name: "Enterprise", price: billingAnnual ? 997 : 1497, users: "Unlimited users",
      description: "For large brokerages that need the full arsenal",
      border: "border-purple-500/30", highlight: false, badge: "Best Value",
      features: ["Everything in Professional", "Full SMTP rotation (260 addresses)", "White-label branding", "Custom domain reputation", "Dedicated account manager", "API access & webhooks", "Custom integrations", "SLA guarantee", "On-site training", "60-day free trial"],
    },
  ];

  const faqs = [
    { q: "How does the 60-day free trial work?", a: "Sign up, import your data, and use every feature — no credit card required. After 60 days, choose a plan or your data is safely exported. No surprise charges, no sales pressure. We're confident you'll stay because the results speak for themselves." },
    { q: "How long does migration from HubSpot, Salesforce, or Pipedrive take?", a: "Our one-touch migration engine imports contacts, companies, deals, activities, email history, and custom fields in under 30 minutes for most databases. We support direct API migration from HubSpot, Salesforce, Pipedrive, Close, and CSV import from any other system." },
    { q: "Why is your email deliverability so much higher than competitors?", a: "We rotate sends across 260 email addresses on 52 domains across 5 dedicated MX servers. Each domain is health-monitored in real-time. Provider-specific optimizations (SNDS headers for Outlook, RFC 8058 for Gmail, CFL for Yahoo) ensure inbox placement. Our Compliance Fortress pre-validates every email before it sends." },
    { q: "What makes the Paradigm Engine different from regular email automation?", a: "Regular automation sends the same sequence to everyone. The Paradigm Engine builds a psychographic profile of each prospect, writes personalized emails based on their personality type and communication style, detects positive buying intent in replies, and hands off to your rep with a Battle Card — all autonomously. It's not automation, it's an AI sales rep." },
    { q: "Is Apex CRM built specifically for freight brokers?", a: "Yes. Every field, status, workflow, and feature was designed for freight and logistics. We have 25+ logistics-specific lead statuses, FMCSA database integration, carrier vetting, load management, lane preferences, TMS integration fields, and digital carrier packet generation. No other CRM has this." },
    { q: "How does the Compliance Fortress protect us from legal issues?", a: "Before any email sends, our AI validates it against CAN-SPAM, GDPR, and CCPA requirements. It checks for physical address, unsubscribe link, deceptive subject lines, and consent status. Non-compliant emails are blocked automatically. Every send is logged in an immutable audit trail." },
    { q: "Can I white-label Apex CRM for my clients?", a: "Yes, on the Enterprise plan. You can apply your own branding, custom domain, and logo. Your clients see your brand, not ours. Perfect for consultants and agencies managing multiple freight companies." },
    { q: "What kind of support do you offer?", a: "Starter plans get email support with 24-hour response. Professional plans get priority support with 4-hour response and access to our AI-powered help center. Enterprise plans get a dedicated account manager, phone support, and optional on-site training." },
  ];

  return (
    <div className="min-h-screen bg-[#080a0f] text-white overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-600/6 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-[400px] h-[400px] bg-purple-600/6 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#080a0f]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl" : "bg-transparent"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Zap className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-lg font-black tracking-tight">Apex <span className="text-orange-400">CRM</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            {["features", "compare", "pricing", "testimonials", "videos"].map((s) => (
              <button key={s} onClick={() => scrollTo(s)} className="hover:text-white transition-colors capitalize">{s}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="hidden sm:block text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-1.5">Sign In</button>
            </Link>
            <Link href="/signup">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white text-sm font-bold px-5 py-2 rounded-xl shadow-lg shadow-orange-500/30 transition-all">
                Start Free Trial
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-radial from-orange-600/12 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        </div>
        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 text-sm font-semibold text-orange-400 mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            60-Day Free Trial — No Credit Card Required
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
            The CRM That{" "}<br className="hidden sm:block" />
            <GradientText>
              <Typewriter words={["Closes Deals.", "Finds Leads.", "Writes Emails.", "Never Sleeps.", "Dominates."]} />
            </GradientText>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }} className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Built exclusively for freight brokers. Powered by AI that prospects, qualifies, and engages leads autonomously. Switch from any CRM in under 30 minutes.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/signup">
              <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(249,115,22,0.4)" }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-2xl shadow-orange-500/30">
                Start Your 60-Day Free Trial <ArrowRight className="h-5 w-5" />
              </motion.button>
            </Link>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setVideoOpen(true)} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold text-lg px-8 py-4 rounded-2xl transition-all">
              <div className="h-9 w-9 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Play className="h-4 w-4 text-orange-400 fill-orange-400 ml-0.5" />
              </div>
              Watch the Demo
            </motion.button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }} className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-16">
            {[{ icon: CheckCircle, text: "No credit card required" }, { icon: RefreshCw, text: "Cancel anytime" }, { icon: Clock, text: "Setup in under 1 hour" }, { icon: Shield, text: "SOC 2 compliant" }].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5"><Icon className="h-4 w-4 text-green-400" /><span>{text}</span></div>
            ))}
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div initial={{ opacity: 0, y: 60, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.9, duration: 1, ease: "easeOut" }} className="relative mx-auto max-w-5xl">
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 via-purple-500/10 to-blue-500/20 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-4 bg-white/5 rounded-md px-3 py-1 text-xs text-gray-500 text-center">app.apexcrm.com/dashboard</div>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "PIPELINE VALUE", value: "$3.2M", change: "+18%", color: "text-green-400" },
                  { label: "OPEN DEALS", value: "64", change: "+7 this week", color: "text-blue-400" },
                  { label: "HOT LEADS (AI)", value: "23", change: "Paradigm Active", color: "text-orange-400" },
                  { label: "DELIVERABILITY", value: "98.7%", change: "Excellent", color: "text-purple-400" },
                ].map((card) => (
                  <div key={card.label} className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-xs text-gray-500 font-medium mb-2">{card.label}</div>
                    <div className="text-2xl font-black text-white mb-1">{card.value}</div>
                    <div className={`text-xs font-semibold ${card.color}`}>{card.change}</div>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-gray-500 mb-3 font-medium">PARADIGM ENGINE — LIVE ACTIVITY</div>
                  <div className="space-y-2">
                    {[
                      { action: "Ghost sequence sent", target: "Marcus T. @ Velocity Freight", time: "2m ago", dot: "bg-orange-400" },
                      { action: "Hot lead detected", target: "Sarah K. @ Midwest Logistics", time: "8m ago", dot: "bg-green-400" },
                      { action: "Battle Card generated", target: "James R. @ CrossCountry", time: "15m ago", dot: "bg-blue-400" },
                      { action: "Email verified (NeverBounce)", target: "47 new prospects", time: "1h ago", dot: "bg-purple-400" },
                    ].map((item) => (
                      <div key={item.target} className="flex items-center gap-3 text-xs">
                        <div className={`h-1.5 w-1.5 rounded-full ${item.dot} flex-shrink-0`} />
                        <span className="text-gray-400">{item.action}</span>
                        <span className="text-white font-medium truncate">{item.target}</span>
                        <span className="text-gray-600 ml-auto flex-shrink-0">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-gray-500 mb-3 font-medium">COMPLIANCE STATUS</div>
                  <div className="space-y-2">
                    {[{ label: "CAN-SPAM", status: "✓ Compliant" }, { label: "GDPR", status: "✓ Compliant" }, { label: "CCPA", status: "✓ Compliant" }, { label: "Blacklists", status: "✓ Clean (50+)" }].map((item) => (
                      <div key={item.label} className="flex justify-between text-xs">
                        <span className="text-gray-400">{item.label}</span>
                        <span className="text-green-400 font-medium">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <section className="relative py-20 border-y border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-blue-500/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {stats.map((stat, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <AnimatedCounter {...stat} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof ─────────────────────────────────────────────────── */}
      <section className="py-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <p className="text-center text-xs text-gray-500 font-medium mb-8 uppercase tracking-widest">Trusted by freight brokerages across North America</p>
          </ScrollReveal>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {["Velocity Freight", "Midwest Logistics", "CrossCountry Brokerage", "Premier Freight", "National Transport", "Atlas Freight Solutions"].map((name, i) => (
              <ScrollReveal key={name} delay={i * 0.05}>
                <div className="text-gray-600 font-bold text-sm tracking-wide hover:text-gray-400 transition-colors">{name.toUpperCase()}</div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge color="orange"><Sparkles className="h-3 w-3" /> Advanced Features</Badge>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mt-4 mb-4">Technology That <GradientText>Nobody Else Has</GradientText></h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">Every feature was built from the ground up for freight brokers. Not adapted. Not bolted on. Built.</p>
            </div>
          </ScrollReveal>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {features.map((f, i) => (
              <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveFeature(i)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeFeature === i ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"}`}>
                <f.icon className="h-4 w-4" />
                {f.title.split("™")[0].split(" ")[0]}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeFeature} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge color={features[activeFeature].color as "orange" | "blue" | "purple" | "green"}>{features[activeFeature].badge}</Badge>
                <h3 className="text-3xl md:text-4xl font-black mt-4 mb-2">{features[activeFeature].title}</h3>
                <p className="text-orange-400 font-semibold text-lg mb-4">{features[activeFeature].subtitle}</p>
                <p className="text-gray-400 leading-relaxed mb-6">{features[activeFeature].description}</p>
                <ul className="space-y-3">
                  {features[activeFeature].bullets.map((bullet, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-start gap-3 text-sm text-gray-300">
                      <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      {bullet}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-orange-500/10 to-purple-500/10 rounded-3xl blur-2xl" />
                <GlassCard className="p-8" hover={false}>
                  <div className="text-center mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 flex items-center justify-center mx-auto mb-4">
                      {(() => { const Icon = features[activeFeature].icon; return <Icon className="h-8 w-8 text-orange-400" />; })()}
                    </div>
                    <div className="text-5xl font-black text-white mb-1">{features[activeFeature].statValue}</div>
                    <div className="text-gray-400 text-sm">{features[activeFeature].stat}</div>
                  </div>
                  <div className="space-y-3">
                    {features[activeFeature].bullets.slice(0, 3).map((bullet, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                        <div className="h-2 w-2 rounded-full bg-orange-400 flex-shrink-0" />
                        <span className="text-xs text-gray-300">{bullet.split(":")[0]}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── Why Apex Wins ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge color="green"><TrendingUp className="h-3 w-3" /> Why Teams Switch</Badge>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mt-4 mb-4">
                <GradientText>4 Reasons</GradientText> Freight Teams Leave HubSpot for Apex
              </h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: DollarSign, title: "73% Lower Cost", desc: "Apex Professional at $697/mo replaces HubSpot Enterprise ($3,200+/mo), Salesforce ($1,800+/mo), and your email tool ($300+/mo). One platform. One bill.", color: "from-green-500/20 to-teal-500/20", border: "border-green-500/20", iconColor: "text-green-400" },
              { icon: Zap, title: "One-Touch Migration", desc: "Import every contact, deal, activity, and email thread from any CRM in under 30 minutes. Our migration engine handles the technical work. You just click 'Import'.", color: "from-orange-500/20 to-yellow-500/20", border: "border-orange-500/20", iconColor: "text-orange-400" },
              { icon: Brain, title: "AI That Actually Works", desc: "Not a chatbot. Not a subject line suggester. A full AI prospecting engine that finds leads, verifies emails, writes personalized sequences, and hands off hot leads — autonomously.", color: "from-purple-500/20 to-blue-500/20", border: "border-purple-500/20", iconColor: "text-purple-400" },
              { icon: Truck, title: "Built for Freight", desc: "HubSpot was built for software companies. Salesforce for enterprise. Apex was built for freight brokers. FMCSA integration, carrier vetting, load management — all standard.", color: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/20", iconColor: "text-blue-400" },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <GlassCard className={`p-8 bg-gradient-to-br ${item.color} ${item.border}`}>
                  <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                    <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3">{item.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{item.desc}</p>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ──────────────────────────────────────────────── */}
      <section id="compare" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge color="blue"><BarChart3 className="h-3 w-3" /> Side by Side</Badge>
              <h2 className="text-4xl md:text-5xl font-black mt-4 mb-4">How Apex Stacks Up Against <GradientText>Every Competitor</GradientText></h2>
              <p className="text-gray-400 text-lg">More features. Lower price. Built for freight. No contest.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-gray-400 font-semibold text-sm w-1/4">Feature</th>
                    <th className="p-4 text-center w-1/6">
                      <div className="flex flex-col items-center gap-1">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center"><Zap className="h-4 w-4 text-white fill-white" /></div>
                        <span className="text-white font-black text-sm">Apex CRM</span>
                        <Badge color="orange">Best Value</Badge>
                      </div>
                    </th>
                    {["HubSpot", "Salesforce", "Pipedrive", "Close"].map((name) => (
                      <th key={name} className="p-4 text-center text-gray-400 font-semibold text-sm w-1/6">{name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-white/[0.02]" : ""} hover:bg-white/5 transition-colors`}>
                      <td className="p-4 text-sm text-gray-300 font-medium">{row.feature}</td>
                      <td className="p-4 text-center bg-orange-500/5"><CompCell value={row.apex} /></td>
                      <td className="p-4 text-center"><CompCell value={row.hubspot} /></td>
                      <td className="p-4 text-center"><CompCell value={row.salesforce} /></td>
                      <td className="p-4 text-center"><CompCell value={row.pipedrive} /></td>
                      <td className="p-4 text-center"><CompCell value={row.close} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── One-Touch Migration ───────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-purple-500/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal direction="right">
              <Badge color="green"><RefreshCw className="h-3 w-3" /> Zero Friction</Badge>
              <h2 className="text-4xl md:text-5xl font-black mt-4 mb-6">Switch From Any CRM in <GradientText>Under 30 Minutes</GradientText></h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">Our one-touch migration engine connects directly to your existing CRM via API and imports everything — contacts, companies, deals, activities, email threads, custom fields, and attachments — automatically. No CSV exports. No manual data entry. No downtime.</p>
              <div className="space-y-4 mb-8">
                {["Contacts, companies & deals imported automatically", "Full email history and activity timeline preserved", "Custom fields mapped intelligently by AI", "Team members notified and onboarded in minutes", "Your old CRM data backed up before migration"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" /><span className="text-gray-300">{item}</span></div>
                ))}
              </div>
              <Link href="/signup">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-orange-500/30">
                  Start Migration Free <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
            </ScrollReveal>
            <ScrollReveal direction="left">
              <GlassCard className="p-8" hover={false}>
                <h4 className="text-white font-bold mb-6 text-center">Import from anywhere:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "HubSpot", color: "text-orange-400" }, { name: "Salesforce", color: "text-blue-400" },
                    { name: "Pipedrive", color: "text-green-400" }, { name: "Close CRM", color: "text-purple-400" },
                    { name: "Zoho CRM", color: "text-red-400" }, { name: "Monday.com", color: "text-yellow-400" },
                    { name: "Spreadsheets", color: "text-teal-400" }, { name: "Any CSV", color: "text-pink-400" },
                  ].map((source) => (
                    <div key={source.name} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className={`font-semibold text-sm ${source.color}`}>{source.name}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                  <div className="text-3xl font-black text-white mb-1">&lt; 30 min</div>
                  <div className="text-green-400 text-sm font-semibold">Average migration time</div>
                </div>
              </GlassCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Deliverability Deep-Dive ──────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge color="purple"><Mail className="h-3 w-3" /> Deliverability</Badge>
              <h2 className="text-4xl md:text-5xl font-black mt-4 mb-4">Your Emails Will <GradientText>Never Hit Spam</GradientText> Again. Guaranteed.</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">While competitors average 71% inbox placement, Apex delivers 98.7% — because we built the infrastructure that every other CRM outsources.</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: ServerIcon, title: "260 SMTP Addresses", desc: "5 dedicated Contabo MX servers. 52 domains. 260 individual email addresses rotating automatically with health-aware load balancing.", stat: "260", statLabel: "Rotating Addresses" },
              { icon: Shield, title: "Provider Optimization", desc: "Outlook gets SNDS headers + RFC 8058. Gmail gets dual SPF+DKIM + List-Unsubscribe. Yahoo gets CFL headers + DMARC alignment. Every provider, perfectly tuned.", stat: "3", statLabel: "Providers Optimized" },
              { icon: Activity, title: "Real-Time Monitoring", desc: "50+ blacklist checks, complaint rate monitoring, bounce processing, and automatic domain pause — all running 24/7 without any manual intervention.", stat: "50+", statLabel: "Blacklists Monitored" },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <GlassCard className="p-6">
                  <div className="text-4xl font-black text-white mb-1">{item.stat}</div>
                  <div className="text-gray-500 text-xs mb-4">{item.statLabel}</div>
                  <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal>
            <GlassCard className="p-8" hover={false}>
              <h4 className="text-white font-bold text-lg mb-6 text-center">Inbox Placement Rate Comparison</h4>
              <div className="space-y-4">
                {[
                  { name: "Apex CRM", rate: 98.7, color: "bg-gradient-to-r from-orange-500 to-orange-400" },
                  { name: "HubSpot", rate: 74, color: "bg-gray-600" },
                  { name: "Salesforce", rate: 68, color: "bg-gray-600" },
                  { name: "Mailchimp", rate: 72, color: "bg-gray-600" },
                  { name: "Industry Avg", rate: 71, color: "bg-gray-700" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-4">
                    <div className="w-28 text-sm text-gray-400 text-right flex-shrink-0">{item.name}</div>
                    <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${item.rate}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2, ease: "easeOut" }} className={`h-full ${item.color} rounded-full flex items-center justify-end pr-2`}>
                        <span className="text-white text-xs font-bold">{item.rate}%</span>
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Videos ───────────────────────────────────────────────────────── */}
      <section id="videos" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge color="orange"><Play className="h-3 w-3" /> See It In Action</Badge>
              <h2 className="text-4xl md:text-5xl font-black mt-4 mb-4">Watch Apex CRM <GradientText>Dominate</GradientText></h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ScrollReveal delay={0.1}>
              <GlassCard className="overflow-hidden" hover={false}>
                <div className="relative aspect-video bg-[#0d1117] overflow-hidden">
                  <video
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663348315388/mLLZEfmfSEuH47dfeJgVGY/apex-highlight-reel-final_5b1650cb.mp4"
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster="https://d2xsxph8kpxj0f.cloudfront.net/310519663348315388/mLLZEfmfSEuH47dfeJgVGY/apex-hero-frame-XrAXb6zgvMWBoAzeNgDwyE.webp"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  <button
                    onClick={() => setVideoOpen(true)}
                    className="absolute inset-0 flex items-center justify-center group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="h-16 w-16 rounded-full bg-black/60 border-2 border-white/50 flex items-center justify-center group-hover:bg-orange-500/80 group-hover:border-orange-400 transition-all"
                    >
                      <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                    </motion.div>
                  </button>
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-xl mb-2">The Apex CRM Demo</h3>
                  <p className="text-gray-400 text-sm">Watch our quick product overview showcasing the key features that make Apex CRM the #1 choice for freight brokers.</p>
                </div>
              </GlassCard>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <GlassCard className="overflow-hidden" hover={false}>
                <div className="relative aspect-video bg-[#0d1117] overflow-hidden">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663348315388/mLLZEfmfSEuH47dfeJgVGY/apex-ai-frame-LmqB7Kb5usa7JGFCmryBee.webp"
                    alt="Apex CRM Tutorial"
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setTutorialOpen(true)}
                      className="cursor-pointer text-center"
                    >
                      <div className="h-16 w-16 rounded-full bg-blue-500/30 border-2 border-blue-400/60 flex items-center justify-center mx-auto mb-3 hover:bg-blue-500/50 transition-all">
                        <Play className="h-6 w-6 text-blue-300 fill-blue-300 ml-0.5" />
                      </div>
                      <p className="text-white font-bold">Full Tutorial Coming Soon</p>
                      <p className="text-blue-300/70 text-sm">Try the interactive demo below</p>
                    </motion.div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-xl mb-2">Complete Platform Tutorial</h3>
                  <p className="text-gray-400 text-sm">A comprehensive step-by-step walkthrough of every feature — from contact management to the Paradigm Engine AI, compliance, and automation.</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Full walkthrough • All features covered</span>
                  </div>
                </div>
              </GlassCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Interactive Demo Tour ─────────────────────────────────────── */}
      <InteractiveDemoTour />

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge color="green"><DollarSign className="h-3 w-3" /> Pricing</Badge>
              <h2 className="text-4xl md:text-5xl font-black mt-4 mb-4">Simple Pricing. <GradientText>Massive Value.</GradientText></h2>
              <p className="text-gray-400 text-lg mb-8">All plans include a 60-day free trial. No credit card required.</p>
              <div className="inline-flex items-center gap-3 bg-white/5 rounded-xl p-1 border border-white/10">
                <button onClick={() => setBillingAnnual(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!billingAnnual ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"}`}>Monthly</button>
                <button onClick={() => setBillingAnnual(true)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${billingAnnual ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"}`}>Annual <span className="text-green-400 text-xs ml-1">Save 25%</span></button>
              </div>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className={`relative rounded-2xl border ${plan.border} ${plan.highlight ? "bg-gradient-to-b from-orange-500/10 to-transparent" : "bg-white/5"} p-8 h-full flex flex-col`}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge color="orange">{plan.badge}</Badge>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xl font-black text-white mb-1">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-white">${plan.price}</span>
                      <span className="text-gray-400">/mo</span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">{plan.users}</div>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className={feature === "60-day free trial" ? "text-orange-400 font-semibold" : "text-gray-300"}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${plan.highlight ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30" : "bg-white/10 hover:bg-white/20 text-white border border-white/20"}`}>
                      Start 60-Day Free Trial
                    </motion.button>
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <Badge color="purple"><Star className="h-3 w-3" /> Customer Stories</Badge>
              <h2 className="text-4xl md:text-5xl font-black mt-4 mb-4">Real Results from <GradientText>Real Freight Teams</GradientText></h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <GlassCard className="p-6 h-full flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>{t.avatar}</div>
                    <div>
                      <div className="text-white font-bold text-sm">{t.name}</div>
                      <div className="text-gray-400 text-xs">{t.role}</div>
                      <div className="text-gray-500 text-xs">{t.company}</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-xl font-black text-white">{t.metric}</div>
                      <div className="text-xs text-gray-500">{t.metricLabel}</div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">{[...Array(5)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 text-orange-400 fill-orange-400" />)}</div>
                  <p className="text-gray-300 text-sm leading-relaxed flex-1 italic">"{t.quote}"</p>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge color="blue"><MessageSquare className="h-3 w-3" /> FAQ</Badge>
              <h2 className="text-4xl md:text-5xl font-black mt-4 mb-4">Questions <GradientText>Answered</GradientText></h2>
            </div>
          </ScrollReveal>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <ScrollReveal key={i} delay={i * 0.05}>
                <GlassCard hover={false}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                    <span className="text-white font-semibold text-sm pr-4">{faq.q}</span>
                    <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-orange-500/10 to-purple-600/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-orange-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 text-sm font-semibold text-orange-400 mb-8">
              <Rocket className="h-3.5 w-3.5" />
              60 Days Free — No Risk, No Credit Card
            </div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">Ready to Leave Your <br className="hidden md:block" /><GradientText>Old CRM Behind?</GradientText></h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">Join 500+ freight brokerages already using Apex CRM to close more deals, deliver more emails, and grow faster than ever.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(249,115,22,0.5)" }} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-xl px-10 py-5 rounded-2xl shadow-2xl shadow-orange-500/40">
                  Start Your 60-Day Free Trial <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
              <Link href="/login">
                <button className="flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-lg px-6 py-4 transition-colors">
                  Already have an account? Sign in <ChevronRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center"><Zap className="h-4 w-4 text-white fill-white" /></div>
                <span className="text-lg font-black">Apex <span className="text-orange-400">CRM</span></span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">The only CRM built exclusively for freight brokers. AI-powered prospecting, 98.7% deliverability, and one-touch migration from any platform.</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Compare", "Migration", "API Docs"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Press", "Contact"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service", "GDPR", "CCPA", "Security"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-bold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}><a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">© 2026 Apex CRM. All rights reserved.</p>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> SOC 2 Compliant</span>
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> 256-bit Encryption</span>
              <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> GDPR Ready</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Demo Video Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setVideoOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <button onClick={() => setVideoOpen(false)} className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"><X className="h-4 w-4" /></button>
              <iframe src="https://www.youtube.com/embed/Y91YVB-yZhs?autoplay=1&rel=0&modestbranding=1" title="Apex CRM Demo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tutorial Video Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {tutorialOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTutorialOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0d1117]">
              <button onClick={() => setTutorialOpen(false)} className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"><X className="h-4 w-4" /></button>
              <div className="p-6">
                <h3 className="text-white font-bold text-xl mb-1">Full Platform Tutorial</h3>
                <p className="text-gray-400 text-sm mb-4">Record your screen walkthrough and paste the YouTube URL to embed it here. The script is ready — see the interactive demo below for a live preview.</p>
                <div className="aspect-video bg-[#0a0a0f] rounded-xl overflow-hidden">
                  <video
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663348315388/mLLZEfmfSEuH47dfeJgVGY/apex-highlight-reel-final_5b1650cb.mp4"
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
