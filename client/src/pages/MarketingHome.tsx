import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { motion, useScroll, useTransform, AnimatePresence, useInView } from "framer-motion";
import { useSkin } from "@/contexts/SkinContext";
import {
  ArrowRight, Check, ChevronDown, Zap, Shield, Brain, Mail,
  BarChart3, Users, Target, Globe, Lock, Rocket, Star,
  TrendingUp, Clock, CheckCircle, XCircle, Sparkles,
  CreditCard, Cpu, RefreshCw, Eye, EyeOff, Activity, DollarSign,
  GitBranch, Menu, X, Play, ChevronRight, Building2,
  MessageSquare, Database, Layers, Workflow, Bot,
} from "lucide-react";

// ─── Animated gradient text ───────────────────────────────────────────────
function GradText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}

// ─── Fade-in on scroll ────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Ticker / marquee ─────────────────────────────────────────────────────
function Marquee({ items }: { items: string[] }) {
  return (
    <div className="overflow-hidden whitespace-nowrap py-4">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
        className="inline-flex gap-12"
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} className="text-sm font-semibold text-white/30 tracking-widest uppercase">{item}</span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────
function Counter({ to, suffix = "", decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(timer); }
      else setVal(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);
  return <span ref={ref}>{val.toFixed(decimals)}{suffix}</span>;
}

// ─── Data ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Brain,
    accent: "from-purple-500 to-violet-600",
    glow: "shadow-purple-500/20",
    title: "Paradigm Engine™",
    headline: "AI that prospects, qualifies, and engages — autonomously.",
    body: "5 layers of intelligence: real-time signal monitoring, email verification, psychographic profiling, automated sequences, and live battle cards. Your pipeline fills itself.",
    stats: [{ label: "Prospects found/week", value: "340+" }, { label: "Hours saved/rep", value: "12h" }],
  },
  {
    icon: Eye,
    accent: "from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/20",
    title: "Ghost Mode™",
    headline: "Personalized sequences that write themselves.",
    body: "AI analyzes each prospect's digital footprint and crafts a 4-stage email sequence tailored to their role, company, and behavior. When intent is detected, your rep gets a live Battle Card.",
    stats: [{ label: "Reply rate increase", value: "3.4×" }, { label: "Sequences per day", value: "1,000+" }],
  },
  {
    icon: Mail,
    accent: "from-green-500 to-emerald-500",
    glow: "shadow-green-500/20",
    title: "Deliverability Engine",
    headline: "98.7% inbox placement. Not spam. Not promotions. Inbox.",
    body: "260 dedicated SMTP addresses across 52 domains with real-time rotation. Every domain warmed, monitored against 50+ blacklists, and configured with SPF, DKIM, and DMARC.",
    stats: [{ label: "Inbox placement", value: "98.7%" }, { label: "SMTP addresses", value: "260" }],
  },
  {
    icon: Shield,
    accent: "from-orange-500 to-red-500",
    glow: "shadow-orange-500/20",
    title: "Compliance Fortress™",
    headline: "Every email validated before it leaves your server.",
    body: "Automatic CAN-SPAM, GDPR, and CCPA validation on every outbound message. Unsubscribe management, suppression lists, and audit logs — all handled without lifting a finger.",
    stats: [{ label: "Compliance checks", value: "100%" }, { label: "Regulations covered", value: "3" }],
  },
  {
    icon: BarChart3,
    accent: "from-rose-500 to-pink-500",
    glow: "shadow-rose-500/20",
    title: "Revenue Intelligence",
    headline: "Know exactly where every dollar is going.",
    body: "Pipeline analytics, email heatmaps, team leaderboards, AI-powered revenue forecasting, and deal health scores. See what's working before it's too late to act.",
    stats: [{ label: "Forecast accuracy", value: "94%" }, { label: "Close rate lift", value: "+41%" }],
  },
  {
    icon: Rocket,
    accent: "from-indigo-500 to-blue-600",
    glow: "shadow-indigo-500/20",
    title: "30-Minute Migration",
    headline: "Switch from any CRM. Keep everything.",
    body: "One-touch import from HubSpot, Salesforce, Pipedrive, or any CSV. Contacts, deals, email history, custom fields — all transferred with zero data loss. Most customers are live in under 30 minutes.",
    stats: [{ label: "Migration time", value: "< 30min" }, { label: "Data loss", value: "0%" }],
  },
  {
    icon: Zap,
    accent: "from-cyan-500 to-teal-500",
    glow: "shadow-cyan-500/20",
    title: "AI Visitor Tracking",
    headline: "Installs itself in 30 seconds. No developer needed.",
    body: "Paste your URL and AXIOM detects your platform (WordPress, Shopify, Webflow, Wix, Squarespace, and more) and installs the tracking script automatically via API. Every competitor requires manual copy-paste. AXIOM does it for you.",
    stats: [{ label: "Install time", value: "< 30s" }, { label: "Platforms supported", value: "8+" }],
  },
];

const COMPARISON = [
  { feature: "AI Visitor Tracking (Auto-Install)", axiom: true, hubspot: false, salesforce: false, close: false },
  { feature: "AI Prospect Research", axiom: true, hubspot: false, salesforce: false, close: false },
  { feature: "Autonomous Email Sequences", axiom: true, hubspot: "Add-on ($500+/mo)", salesforce: "Add-on ($125+/user)", close: "Partial" },
  { feature: "98%+ Inbox Placement", axiom: true, hubspot: false, salesforce: false, close: false },
  { feature: "260 SMTP Rotation Engine", axiom: true, hubspot: false, salesforce: false, close: false },
  { feature: "Compliance Fortress™ (GDPR/CCPA)", axiom: true, hubspot: "Partial", salesforce: "Partial", close: false },
  { feature: "60-Day Free Trial", axiom: true, hubspot: false, salesforce: false, close: false },
  { feature: "One-Click Migration — FREE", axiom: true, hubspot: false, salesforce: false, close: false },
  { feature: "AI Battle Cards", axiom: true, hubspot: false, salesforce: false, close: false },
  { feature: "AR/AP Module", axiom: true, hubspot: false, salesforce: false, close: false },
  { feature: "Shipping & Receiving Module", axiom: true, hubspot: false, salesforce: false, close: false },
  { feature: "Business Category Intelligence", axiom: true, hubspot: false, salesforce: false, close: false },
  { feature: "White-Labeling", axiom: true, hubspot: false, salesforce: "Enterprise only", close: false },
  { feature: "Price for 10 users/month", axiom: "$297", hubspot: "$1,000", salesforce: "$1,750", close: "$1,090" },
];

const TESTIMONIALS = [
  {
    quote: "We switched from Salesforce in a weekend. Email deliverability went from 62% to 97% in the first month. The AI sequences alone paid for the entire year.",
    name: "Sarah K.", title: "VP Sales", company: "National Partners", avatar: "SK", color: "bg-orange-500",
  },
  {
    quote: "The Paradigm Engine found 340 qualified prospects in our first week. Our old CRM couldn't do that in a year. This is a completely different category of software.",
    name: "Marcus T.", title: "Director of Sales", company: "Velocity Group", avatar: "MT", color: "bg-blue-500",
  },
  {
    quote: "Ghost Mode is unreal. It runs our entire outbound sequence without us touching it. When a lead replies, our reps get a Battle Card and jump in. Close rates are up 41%.",
    name: "James R.", title: "CEO", company: "CrossCountry Brokerage", avatar: "JR", color: "bg-purple-500",
  },
];

const PLANS = [
  {
    id: "success_starter",
    name: "Solo", price: 49, annualPrice: 44,
    desc: "Everything a solo operator needs — with AI built in from day one.",
    savings: "50% less than GoHighLevel",
    features: ["1 user included", "2,500 contacts", "Core CRM suite", "500 AI credits/month", "1,000 email sends/month", "AI Assistant (write emails, take CRM actions)", "100 BNB prospects/month", "One-click migration — FREE", "Basic AR/AP & Shipping — FREE"],
    cta: "Start Free Trial", highlight: false, addOnNote: "Add seats at $35/user/mo",
  },
  {
    id: "growth_foundation",
    name: "Starter", price: 97, annualPrice: 87,
    desc: "For small teams ready to scale their outreach.",
    savings: "68% less than HubSpot for 3 users",
    features: ["3 users included (+$35/user/mo)", "10,000 contacts", "2,000 AI credits/month", "10,000 email sends/month", "500 BNB prospects/month", "5 Ghost Mode sequences", "Win probability scoring", "Full AR/AP automation + full Shipping module"],
    cta: "Start Free Trial", highlight: false, addOnNote: "Add seats at $35/user/mo",
  },
  {
    id: "fortune_foundation",
    name: "Growth", price: 297, annualPrice: 267,
    desc: "For growing teams who need real prospecting power and voice.",
    savings: "55% less than GHL + Instantly combined",
    features: ["10 users included (+$35/user/mo)", "100,000 contacts", "10,000 AI credits/month", "100,000 email sends/month", "5,000 BNB prospects/month", "Voice Agent (200 min/mo)", "Behavioral DNA Profiling", "Battle Cards + Predictive Send Time"],
    cta: "Start Free Trial", highlight: true, badge: "Most Popular", addOnNote: "Add seats at $35/user/mo",
  },
  {
    id: "fortune",
    name: "Fortune Foundation", price: 497, annualPrice: 447,
    desc: "Elite deliverability. Full compliance. The agency standard.",
    savings: "57% less than agency stack",
    features: ["20 users included (+$35/user/mo)", "Unlimited contacts", "30,000 AI credits/month", "260 SMTP Rotation Engine™", "Compliance Fortress™ (GDPR + CCPA + CAN-SPAM)", "Unlimited BNB prospects", "500,000 email sends/month", "1,000 voice minutes/month", "Priority support"],
    cta: "Start Free Trial", highlight: false, addOnNote: "Add seats at $35/user/mo",
  },
  {
    id: "fortune_plus",
    name: "Fortune Plus", price: 1497, annualPrice: 1347,
    desc: "Dedicated infrastructure. Custom AI. Resell AXIOM as your own.",
    savings: "85% less than HubSpot Enterprise",
    features: ["100 users included (+$30/user/mo)", "Unlimited everything", "200,000 AI credits/month", "Revenue Autopilot™ + AXIOM Autopilot™", "White-labeling (your brand, FREE setup)", "Dedicated SMTP infrastructure", "SaaS Mode — resell AXIOM as your product", "99.9% SLA + 24/7 white-glove support"],
    cta: "Start Free Trial", highlight: false, addOnNote: "Add seats at $30/user/mo",
  },
];

const FAQS = [
  { q: "How does the 60-day free trial work?", a: "You get full access to the entire platform for 60 days. A credit card is required to start — this ensures we can provision your dedicated SMTP infrastructure and AI resources from day one. You won't be charged until day 61, and you can cancel anytime before that." },
  { q: "How long does migration from my current CRM take?", a: "Most customers complete their full migration in under 30 minutes. Our one-touch migration engine connects directly to HubSpot, Salesforce, Pipedrive, and Close via API, automatically maps all your custom fields, and imports contacts, deals, emails, and activity history with zero data loss." },
  { q: "Can AXIOM CRM be customized for my industry?", a: "Absolutely. AXIOM CRM is built for any B2B sales team. Custom fields, workflows, pipeline stages, email templates, and AI prompts can all be tailored to your specific industry and sales process. Our onboarding team will configure everything for you." },
  { q: "Why is your inbox placement rate so much higher?", a: "We operate 260 dedicated SMTP addresses across 52 domains with real-time rotation. Every domain is warmed up, monitored against 50+ blacklists, and configured with SPF, DKIM, and DMARC. Competitors use shared sending infrastructure — your emails compete with thousands of other senders. Ours don't." },
  { q: "What is the Paradigm Engine™?", a: "It's our 5-layer AI prospecting system: (1) Sentinel Layer monitors job changes and social signals 24/7, (2) Nutrition Gate verifies every email via NeverBounce, (3) Digital Twin builds a psychographic profile of each prospect, (4) Ghost Mode deploys personalized sequences, (5) Battle Cards generate AI tactical summaries when a prospect shows buying intent." },
];

// ─── Main component ───────────────────────────────────────────────────────
export default function MarketingHome({
  loginOpen: initialLoginOpen = false }: { loginOpen?: boolean } = {}) {
  const { t } = useSkin();
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [loginOpen, setLoginOpen] = useState(initialLoginOpen);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginView, setLoginView] = useState<'login' | 'forgot' | 'forgot-sent'>('login');
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [, navigate] = useLocation();
  const [videoOpen, setVideoOpen] = useState(false);
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<string | null>(null);

  const { user } = useAuth();

  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
        toast.success("Redirecting to secure checkout...");
      }
      setCheckoutLoadingPlan(null);
    },
    onError: (e) => {
      toast.error(e.message);
      setCheckoutLoadingPlan(null);
    },
  });

  const handlePlanCTA = (planId: string, billing: "monthly" | "annual") => {
    if (user) {
      // Logged-in user: go straight to Stripe checkout
      setCheckoutLoadingPlan(planId);
      createCheckout.mutate({ planId: planId as any, billing, origin: window.location.origin });
    } else {
      // Guest: go to signup with plan pre-selected
      navigate(`/signup?plan=${planId}&billing=${billing}`);
    }
  };

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await forgotPasswordMutation.mutateAsync({ email: forgotEmail, origin: window.location.origin });
      setLoginView('forgot-sent');
    } catch {
      // Still show sent to prevent enumeration
      setLoginView('forgot-sent');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: loginUsername, password: loginPassword, rememberMe }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = "/dashboard";
      } else {
        setLoginError(data.error || "Invalid username or password");
      }
    } catch {
      setLoginError("Connection error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Auto-cycle features
  useEffect(() => {
    const t = setInterval(() => setActiveFeature(p => (p + 1) % FEATURES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Demo", href: "#demo" },
    { label: "Pricing", href: "#pricing" },
    { label: "Compare", href: "#compare" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* ── Sticky Nav ─────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5" : ""}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-shadow">
                <Zap className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="font-black text-lg tracking-tight">AXIOM CRM</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <a key={l.label} href={l.href} className="text-sm font-medium text-white/50 hover:text-white transition-colors">{l.label}</a>
            ))}
          </div>

          {/* Always-visible buttons on ALL screen sizes */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLoginOpen(true)}
              className="text-xs sm:text-sm font-semibold text-white/70 hover:text-white transition-colors px-3 sm:px-4 py-2 rounded-xl border border-white/10 hover:border-white/20"
            >
              Sign In
            </button>
            <Link href="/signup">
              <button className="text-xs sm:text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-400 text-black px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:opacity-90 transition-all hover:shadow-lg hover:shadow-orange-500/20 whitespace-nowrap">
                Free Trial
              </button>
            </Link>
            {/* Hamburger only for nav links on mobile */}
            <button className="md:hidden p-1.5 text-white/60" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden bg-[#111] border-t border-white/5 px-6 py-5 flex flex-col gap-4"
            >
              {navLinks.map(l => (
                <a key={l.label} href={l.href} className="text-sm font-medium text-white/60" onClick={() => setMobileOpen(false)}>{l.label}</a>
              ))}
              <div className="flex gap-3 pt-3 border-t border-white/5">
                <button onClick={() => { setMobileOpen(false); setLoginOpen(true); }} className="flex-1 text-sm font-semibold border border-white/10 text-white/70 px-4 py-2.5 rounded-xl">Sign In</button>
                <Link href="/signup"><button className="flex-1 text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-400 text-black px-4 py-2.5 rounded-xl">Start Free Trial</button></Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </nav>

      {/* ── Login Modal (outside nav for proper mobile rendering) ────────── */}
      <AnimatePresence>
        {loginOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setLoginOpen(false)} />
            <div className="relative min-h-full flex items-start justify-center p-4 py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -16 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
                <button
                  onClick={() => setLoginOpen(false)}
                  className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Zap className="h-5 w-5 text-white fill-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Welcome back</h2>
                    <p className="text-sm text-white/40">Sign in to your AXIOM CRM account</p>
                  </div>
                </div>

                {loginView === 'login' && (
                  <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white/60 mb-1.5">Username</label>
                      <input
                        type="text"
                        value={loginUsername}
                        onChange={e => setLoginUsername(e.target.value)}
                        placeholder="Enter your username"
                        autoFocus
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-semibold text-white/60">Password</label>
                        <button
                          type="button"
                          onClick={() => { setLoginView('forgot'); setLoginError(''); }}
                          className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                          tabIndex={0}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer select-none group">
                      <div
                        onClick={() => setRememberMe(v => !v)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                          rememberMe
                            ? 'bg-orange-500 border-orange-500 shadow-sm shadow-orange-500/40'
                            : 'bg-white/8 border-white/40 group-hover:border-orange-400/70'
                        }`}
                        role="checkbox"
                        aria-checked={rememberMe}
                        tabIndex={0}
                        onKeyDown={e => e.key === ' ' && (e.preventDefault(), setRememberMe(v => !v))}
                      >
                        {rememberMe && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </div>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <span className="text-sm text-white/80 group-hover:text-white transition-colors font-medium">Remember me for 30 days</span>
                    </label>

                    {loginError && (
                      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                        <XCircle className="h-4 w-4 flex-shrink-0" />
                        {loginError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-black font-bold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-1"
                    >
                      {loginLoading ? (
                        <><RefreshCw className="h-4 w-4 animate-spin" /> Signing in...</>
                      ) : (
                        <>Sign In <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>

                    <p className="text-center text-sm text-white/30">
                      Don't have an account?{" "}
                      <Link href="/signup">
                        <span onClick={() => setLoginOpen(false)} className="text-orange-400 hover:text-orange-300 cursor-pointer font-semibold">Start free trial</span>
                      </Link>
                    </p>
                  </form>
                )}

                {loginView === 'forgot' && (
                  <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                    <p className="text-sm text-white/50">Enter your email address and we'll send you a link to reset your password.</p>
                    <div>
                      <label className="block text-sm font-semibold text-white/60 mb-1.5">Email address</label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="you@company.com"
                        autoFocus
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-black font-bold py-3.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      {forgotLoading ? <><RefreshCw className="h-4 w-4 animate-spin" /> Sending...</> : <>Send Reset Link <ArrowRight className="h-4 w-4" /></>}
                    </button>
                    <button type="button" onClick={() => setLoginView('login')} className="text-sm text-white/30 hover:text-white/60 transition-colors text-center">
                      ← Back to Sign In
                    </button>
                  </form>
                )}

                {loginView === 'forgot-sent' && (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold">Check your email</h3>
                    <p className="text-sm text-white/50 text-center">If an account exists for <span className="text-white/70 font-medium">{forgotEmail}</span>, you'll receive a password reset link within a few minutes.</p>
                    <button
                      onClick={() => { setLoginView('login'); setForgotEmail(''); }}
                      className="text-sm text-orange-400 hover:text-orange-300 transition-colors font-medium"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                )}
            </motion.div>
            </div>
          </motion.div>
          )}
        </AnimatePresence>

      {/* ── YouTube Video Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setVideoOpen(false)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            >
              <button
                onClick={() => setVideoOpen(false)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
              <video
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663348315388/mLLZEfmfSEuH47dfeJgVGY/axiom-promo-final_10e5790e.mp4"
                autoPlay
                controls
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-0 overflow-hidden">
        {/* Cinematic video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ filter: "brightness(0.45) saturate(1.4) contrast(1.1)" }}
        >
          <source src="https://d2xsxph8kpxj0f.cloudfront.net/310519663348315388/mLLZEfmfSEuH47dfeJgVGY/axiom-promo-final_10e5790e.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#04080f]/50 via-transparent to-[#04080f] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#04080f]/40 via-transparent to-[#04080f]/40 pointer-events-none" />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 w-full max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#c9a84c] text-xs font-bold px-4 py-1.5 rounded-full mb-10 tracking-[0.3em] uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
            THE FUTURE OF CRM IS HERE
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tight leading-[0.95] mb-8"
            style={{ textShadow: "0 0 80px rgba(201,168,76,0.3), 0 0 160px rgba(30,100,255,0.2)" }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a84c] to-[#f0d080]">AXIOM</span><br />
            <span className="text-white text-4xl md:text-5xl font-light tracking-[0.3em]">COMMAND YOUR MARKET</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed font-light tracking-wide"
          >
            The only CRM that sees every deal, every connection, every opportunity — before anyone else. Built for those who refuse to be second.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4"
          >
            <Link href="/signup">
              <button className="group flex items-center gap-2 bg-gradient-to-r from-[#c9a84c] to-[#f0d080] text-[#04080f] font-black text-sm tracking-[0.2em] px-10 py-4 rounded hover:shadow-[0_0_40px_rgba(201,168,76,0.5)] transition-all hover:-translate-y-0.5">
                START FREE TRIAL
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button
              onClick={() => setVideoOpen(true)}
              className="group flex items-center gap-2 text-white/70 font-bold text-sm tracking-[0.2em] px-6 py-4 rounded border border-white/20 hover:border-[#c9a84c]/50 hover:text-[#c9a84c] transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center group-hover:bg-[#c9a84c]/20 transition-all">
                <Play className="h-3.5 w-3.5 fill-[#c9a84c] text-[#c9a84c] ml-0.5" />
              </div>
              Watch Demo
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-white/25 flex items-center justify-center gap-1.5 mb-16"
          >
            <CreditCard className="h-3 w-3" />
            Credit card required · Cancel anytime · Full access from day one
          </motion.p>

          {/* Inline video / product showcase */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative mx-auto max-w-5xl"
          >
            {/* Glow behind screen */}
            <div className="absolute -inset-4 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent rounded-3xl blur-2xl pointer-events-none" />

            {/* Browser chrome */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/80">
              <div className="bg-[#1a1a1a] px-4 py-3 flex items-center gap-2 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white/5 rounded-md px-3 py-1 text-xs text-white/30 flex items-center gap-1.5 max-w-xs mx-auto">
                    <Lock className="h-2.5 w-2.5 text-green-400" />
                    app.apexcrm.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard UI */}
              <div className="bg-[#111] p-5">
                {/* Top stats */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Pipeline Value", value: "$4.2M", delta: "+12% MoM", color: "text-orange-400" },
                    { label: "Hot Leads", value: "47", delta: "+8 today", color: "text-blue-400" },
                    { label: "Deliverability", value: "98.7%", delta: "+27% vs before", color: "text-green-400" },
                    { label: "Deals Won", value: "23", delta: "This month", color: "text-purple-400" },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + i * 0.07 }}
                      className="bg-white/5 rounded-xl p-3 border border-white/5"
                    >
                      <div className="text-xs text-white/30 mb-1">{s.label}</div>
                      <div className="text-xl font-black text-white">{s.value}</div>
                      <div className={`text-xs font-semibold mt-0.5 ${s.color}`}>{s.delta}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-xs font-semibold text-white/30 mb-3">Pipeline Activity — Last 30 Days</div>
                    <div className="flex items-end gap-1 h-14">
                      {[35, 48, 42, 65, 58, 72, 68, 85, 78, 92, 88, 100, 95, 88, 76, 82, 90, 96, 88, 100].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.9 + i * 0.02 }}
                          className="flex-1 rounded-sm"
                          style={{ background: i >= 18 ? "#f97316" : "rgba(255,255,255,0.08)" }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="text-xs font-semibold text-white/30 mb-3">AI Activity — Live</div>
                    {[
                      { dot: "bg-orange-400", msg: "12 prospects found" },
                      { dot: "bg-green-400", msg: "47 emails sent" },
                      { dot: "bg-blue-400", msg: "3 Battle Cards ready" },
                      { dot: "bg-purple-400", msg: "203 contacts verified" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.0 + i * 0.1 }}
                        className="flex items-center gap-2 py-1"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.dot} animate-pulse`} />
                        <div className="text-xs text-white/40 truncate">{item.msg}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              initial={{ opacity: 0, x: 20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 1.2 }}
              className="absolute -right-6 top-1/3 bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl hidden lg:flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <div className="text-xs text-white/30">Avg. customer result</div>
                <div className="text-sm font-black text-white">+41% close rate</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 1.3 }}
              className="absolute -left-6 bottom-1/4 bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl hidden lg:flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <div className="text-xs text-white/30">AI working right now</div>
                <div className="text-sm font-black text-white">340 prospects found</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Ticker ───────────────────────────────────────────────────────── */}
      <div className="border-y border-white/5 bg-white/[0.02] mt-8">
        <Marquee items={[
          "AI Prospecting", "Ghost Mode Sequences", "98.7% Inbox Placement",
          "260 SMTP Addresses", "Compliance Fortress", "One-Touch Migration",
          "Battle Cards", "Revenue Intelligence", "60-Day Free Trial",
          "Any Business · Any Industry", "Customizable Workflows",
        ]} />
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 98.7, suffix: "%", label: "Inbox Placement Rate", decimals: 1 },
              { value: 41, suffix: "%", label: "Avg. Close Rate Increase", decimals: 0 },
              { value: 30, suffix: "min", label: "Migration Time", decimals: 0 },
              { value: 260, suffix: "", label: "Dedicated SMTP Addresses", decimals: 0 },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div>
                  <div className="text-5xl font-black text-white mb-1">
                    <Counter to={s.value} suffix={s.suffix} decimals={s.decimals} />
                  </div>
                  <div className="text-sm text-white/30">{s.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── EPIC CINEMATIC TRAILER + Scrolling Feature Comparison ─────── */}
      <section id="demo" className="py-0 relative overflow-hidden" style={{background:'#000'}}>
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-8">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-xs font-black tracking-widest mb-3" style={{color:'#c9a84c'}}>CINEMATIC TRAILER</p>
              <h2 className="text-4xl md:text-6xl font-black mb-4">
                <span style={{background:'linear-gradient(135deg,#1a6cf6,#c9a84c)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>See What Limitless</span><br />
                <span className="text-white">Looks Like.</span>
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                Every feature. Every competitor. One undeniable truth — AXIOM wins.
              </p>
            </div>
          </FadeIn>
        </div>

        {/* Main layout: scrolling comparison LEFT + video RIGHT */}
        <div className="flex flex-col lg:flex-row max-w-7xl mx-auto">

          {/* LEFT: Infinite Scrolling Feature Comparison */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 relative" style={{background:'linear-gradient(180deg,#050a1a 0%,#020510 100%)',borderRight:'1px solid rgba(26,108,246,0.2)',maxHeight:'540px',overflow:'hidden'}}>
            {/* Header */}
            <div className="px-4 py-3 sticky top-0 z-10" style={{background:'#050a1a',borderBottom:'1px solid rgba(26,108,246,0.2)'}}>
              <div className="text-xs font-black tracking-widest mb-2" style={{color:'#1a6cf6'}}>AXIOM VS THE WORLD</div>
              <div className="grid grid-cols-4 gap-1 text-center">
                {['AXIOM','HubSpot','Salesforce','Pipedrive'].map((c,i)=>(
                  <div key={i} className="text-xs font-bold py-1 rounded" style={i===0?{background:'linear-gradient(135deg,#1a6cf6,#0d4db5)',color:'white',borderRadius:'6px'}:{color:'rgba(255,255,255,0.4)'}}>{c}</div>
                ))}
              </div>
            </div>
            {/* Scrolling rows */}
            <style>{`
              @keyframes featureScrollUp { 0%{transform:translateY(0)} 100%{transform:translateY(-50%)} }
              .feat-scroll { animation: featureScrollUp 80s linear infinite; }
              .feat-scroll:hover { animation-play-state: paused; }
            `}</style>
            <div className="feat-scroll px-3 py-2">
              {([
                {cat:'CORE CRM',f:'Contact Management',a:true,b:true,c:true,d:true},
                {cat:'',f:'Company Records',a:true,b:true,c:true,d:true},
                {cat:'',f:'Multi-Pipeline Kanban',a:true,b:'Paid',c:'Paid',d:'Paid'},
                {cat:'',f:'Custom Fields',a:true,b:true,c:true,d:true},
                {cat:'',f:'Smart Views',a:true,b:'Limited',c:'Limited',d:false},
                {cat:'',f:'Bulk Actions',a:true,b:'Limited',c:true,d:'Limited'},
                {cat:'AI & INTELLIGENCE',f:'AI Lead Scoring',a:true,b:'$500+/mo',c:'$150+/user',d:false},
                {cat:'',f:'Win Probability AI',a:true,b:'$500+/mo',c:'$150+/user',d:false},
                {cat:'',f:'Next Best Action AI',a:true,b:false,c:false,d:false},
                {cat:'',f:'Behavioral DNA Profile',a:true,b:false,c:false,d:false},
                {cat:'',f:'AI Email Writer',a:true,b:'Add-on',c:'Add-on',d:false},
                {cat:'',f:'AI Ghostwriter',a:true,b:false,c:false,d:false},
                {cat:'',f:'Paradigm Pulse™ Intel',a:true,b:false,c:false,d:false},
                {cat:'',f:'Quantum Score™',a:true,b:false,c:false,d:false},
                {cat:'EMAIL MARKETING',f:'Email Campaigns',a:true,b:true,c:'Add-on',d:'Add-on'},
                {cat:'',f:'260 SMTP Rotation™',a:true,b:false,c:false,d:false},
                {cat:'',f:'Ghost Sequences™',a:true,b:false,c:false,d:false},
                {cat:'',f:'A/B Testing',a:true,b:true,c:'Add-on',d:'Limited'},
                {cat:'',f:'98.7% Inbox Placement',a:true,b:false,c:false,d:false},
                {cat:'',f:'Suppression Lists',a:true,b:true,c:true,d:'Limited'},
                {cat:'AUTOMATION',f:'Workflow Builder',a:true,b:true,c:true,d:'Limited'},
                {cat:'',f:'Revenue Autopilot™',a:true,b:false,c:false,d:false},
                {cat:'',f:'AI Sequences',a:true,b:'Add-on',c:'Add-on',d:false},
                {cat:'',f:'Behavioral Triggers',a:true,b:'Limited',c:'Limited',d:false},
                {cat:'',f:'Auto Lead Assignment',a:true,b:true,c:true,d:true},
                {cat:'PROSPECTING',f:'BNB Prospect Engine™',a:true,b:false,c:false,d:false},
                {cat:'',f:'FMCSA Scanner',a:true,b:false,c:false,d:false},
                {cat:'',f:'Visitor Tracking',a:true,b:'Add-on',c:'Add-on',d:false},
                {cat:'',f:'Intent Signals',a:true,b:'Add-on',c:'Add-on',d:false},
                {cat:'',f:'Battle Cards',a:true,b:false,c:false,d:false},
                {cat:'VOICE & CALLS',f:'AI Voice Agent',a:true,b:false,c:false,d:false},
                {cat:'',f:'Call Recording',a:true,b:'Add-on',c:'Add-on',d:'Add-on'},
                {cat:'',f:'Voice Transcription',a:true,b:'Add-on',c:'Add-on',d:false},
                {cat:'FINANCE & OPS',f:'Accounts Receivable',a:true,b:false,c:false,d:false},
                {cat:'',f:'Accounts Payable',a:true,b:false,c:false,d:false},
                {cat:'',f:'Shipping Module',a:true,b:false,c:false,d:false},
                {cat:'',f:'Invoice Management',a:true,b:false,c:false,d:false},
                {cat:'COMPLIANCE',f:'Compliance Fortress™',a:true,b:'Add-on',c:'Add-on',d:false},
                {cat:'',f:'GDPR Tools',a:true,b:true,c:true,d:'Limited'},
                {cat:'',f:'CCPA Compliance',a:true,b:true,c:true,d:false},
                {cat:'',f:'CAN-SPAM Mgmt',a:true,b:true,c:true,d:true},
                {cat:'MIGRATION',f:'One-Touch Migration™',a:true,b:false,c:false,d:false},
                {cat:'',f:'HubSpot Import',a:true,b:'N/A',c:false,d:false},
                {cat:'',f:'Salesforce Import',a:true,b:false,c:'N/A',d:false},
                {cat:'',f:'Pipedrive Import',a:true,b:false,c:false,d:'N/A'},
                {cat:'',f:'CSV Import',a:true,b:true,c:true,d:true},
                {cat:'PLATFORM',f:'White Labeling',a:true,b:false,c:false,d:false},
                {cat:'',f:'SaaS Resell Mode',a:true,b:false,c:false,d:false},
                {cat:'',f:'Multi-Tenant',a:true,b:'Enterprise',c:'Enterprise',d:false},
                {cat:'',f:'API Access',a:true,b:true,c:true,d:true},
                {cat:'',f:'Webhooks',a:true,b:true,c:true,d:true},
                {cat:'PRICING (10 users)',f:'Monthly Cost',a:'$297',b:'$1,000',c:'$1,750',d:'$1,090'},
                {cat:'',f:'AI Features Included',a:'✓ All',b:'$500+ add-on',c:'$150+/user',d:'None'},
                {cat:'',f:'Migration Cost',a:'FREE',b:'N/A',c:'N/A',d:'N/A'},
                // duplicate for seamless infinite loop
                {cat:'CORE CRM',f:'Contact Management',a:true,b:true,c:true,d:true},
                {cat:'',f:'Company Records',a:true,b:true,c:true,d:true},
                {cat:'',f:'Multi-Pipeline Kanban',a:true,b:'Paid',c:'Paid',d:'Paid'},
                {cat:'AI & INTELLIGENCE',f:'AI Lead Scoring',a:true,b:'$500+/mo',c:'$150+/user',d:false},
                {cat:'',f:'Win Probability AI',a:true,b:'$500+/mo',c:'$150+/user',d:false},
                {cat:'',f:'Next Best Action AI',a:true,b:false,c:false,d:false},
                {cat:'EMAIL MARKETING',f:'260 SMTP Rotation™',a:true,b:false,c:false,d:false},
                {cat:'',f:'Ghost Sequences™',a:true,b:false,c:false,d:false},
                {cat:'AUTOMATION',f:'Revenue Autopilot™',a:true,b:false,c:false,d:false},
                {cat:'PROSPECTING',f:'BNB Prospect Engine™',a:true,b:false,c:false,d:false},
                {cat:'FINANCE & OPS',f:'Accounts Receivable',a:true,b:false,c:false,d:false},
                {cat:'MIGRATION',f:'One-Touch Migration™',a:true,b:false,c:false,d:false},
                {cat:'PRICING (10 users)',f:'Monthly Cost',a:'$297',b:'$1,000',c:'$1,750',d:'$1,090'},
              ] as {cat:string,f:string,a:boolean|string,b:boolean|string,c:boolean|string,d:boolean|string}[]).map((row,i)=>(
                <div key={i}>
                  {row.cat && <div className="text-xs font-black mt-3 mb-1 px-1" style={{color:'#c9a84c',letterSpacing:'0.1em'}}>{row.cat}</div>}
                  <div className="grid grid-cols-4 gap-1 py-1.5" style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <div className="text-white/60 leading-tight pr-1" style={{fontSize:'10px'}}>{row.f}</div>
                    {([row.a,row.b,row.c,row.d] as (boolean|string)[]).map((val,ci)=>(
                      <div key={ci} className="text-center" style={{fontSize:'10px'}}>
                        {val===true?<span style={{color:'#1a6cf6',fontWeight:'bold'}}>✓</span>
                          :val===false?<span style={{color:'rgba(255,255,255,0.2)'}}>✗</span>
                          :<span style={{color:ci===0?'#c9a84c':'rgba(255,255,255,0.35)',fontWeight:ci===0?'bold':'normal'}}>{val as string}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Cinematic Video Player */}
          <div className="flex-1 relative bg-black">
            <div className="relative w-full" style={{aspectRatio:'16/9'}}>
              <video
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663348315388/mLLZEfmfSEuH47dfeJgVGY/axiom-trailer-64s_5c4e5e4e.mp4"
                className="w-full h-full object-cover"
                controls
                playsInline
                poster="https://d2xsxph8kpxj0f.cloudfront.net/310519663348315388/mLLZEfmfSEuH47dfeJgVGY/ax-s8-logo-GPHWvuWsy5if7PqiNcirSw.png"
              />
              <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <div className="text-xs font-black px-3 py-1 rounded-full" style={{background:'rgba(26,108,246,0.85)',color:'white',backdropFilter:'blur(8px)',letterSpacing:'0.15em'}}>AXIOM CRM</div>
              </div>
              <div className="absolute top-4 right-4 z-20 pointer-events-none">
                <div className="text-xs font-black px-3 py-1 rounded-full" style={{background:'rgba(201,168,76,0.85)',color:'#000',backdropFilter:'blur(8px)',letterSpacing:'0.1em'}}>COMMAND YOUR MARKET</div>
              </div>
            </div>
            {/* Scene chapter markers */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-1 p-3" style={{background:'#050a1a'}}>
              {[
                {t:'0:00',l:'The Problem'},{t:'0:08',l:'Awakening'},{t:'0:16',l:'Full Speed'},{t:'0:24',l:'AI Intel'},
                {t:'0:32',l:'Rival Falls'},{t:'0:40',l:'One Touch'},{t:'0:48',l:'Triumph'},{t:'0:56',l:'AXIOM'},
              ].map((s,i)=>(
                <div key={i} className="text-center py-2 rounded-lg" style={{background:'rgba(255,255,255,0.04)'}}>
                  <div className="text-xs font-bold" style={{color:'#1a6cf6'}}>{s.t}</div>
                  <div className="text-white/40" style={{fontSize:'9px',marginTop:'2px'}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="pb-16" />
      </section>

      {/* ── Features — tabbed deep-dive ──────────────────────────────────── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">Platform Features</p>
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Everything you need.<br />
                <GradText>Nothing you don't.</GradText>
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Tab list */}
            <div className="space-y-2">
              {FEATURES.map((f, i) => (
                <FadeIn key={i} delay={i * 0.06}>
                  <button
                    onClick={() => setActiveFeature(i)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${activeFeature === i
                      ? "bg-white/8 border-white/15 shadow-lg"
                      : "bg-transparent border-white/5 hover:border-white/10 hover:bg-white/4"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${f.accent} flex items-center justify-center flex-shrink-0`}>
                        <f.icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className={`font-bold text-sm ${activeFeature === i ? "text-white" : "text-white/60"}`}>{f.title}</span>
                    </div>
                    {activeFeature === i && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-sm text-white/40 leading-relaxed mt-2 pl-10"
                      >
                        {f.headline}
                      </motion.p>
                    )}
                  </button>
                </FadeIn>
              ))}
            </div>

            {/* Feature detail card */}
            <div className="lg:sticky lg:top-24">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl"
                >
                  {(() => { const ActiveIcon = FEATURES[activeFeature].icon; return (
                  <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${FEATURES[activeFeature].accent} p-0.5 rounded-xl mb-6`}>
                    <div className="bg-[#111] rounded-[10px] px-3 py-1.5 flex items-center gap-2">
                      <ActiveIcon className="h-4 w-4 text-white" />
                      <span className="text-sm font-bold text-white">{FEATURES[activeFeature].title}</span>
                    </div>
                  </div>
                  ); })()}
                  <h3 className="text-2xl font-black text-white mb-4 leading-tight">{FEATURES[activeFeature].headline}</h3>
                  <p className="text-white/50 leading-relaxed mb-8">{FEATURES[activeFeature].body}</p>
                  <div className="grid grid-cols-2 gap-4">
                    {FEATURES[activeFeature].stats.map((s, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="text-2xl font-black text-white mb-1">{s.value}</div>
                        <div className="text-xs text-white/30">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison ───────────────────────────────────────────────────── */}
      <section id="compare" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">How We Compare</p>
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                The competition doesn't <GradText>come close.</GradText>
              </h2>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 font-semibold text-white/30 w-2/5">Feature</th>
                    <th className="p-4 font-black text-orange-400 bg-orange-500/5">AXIOM CRM</th>
                    <th className="p-4 font-semibold text-white/30">HubSpot</th>
                    <th className="p-4 font-semibold text-white/30">Salesforce</th>
                    <th className="p-4 font-semibold text-white/30">Close CRM</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={i} className={`border-b border-white/[0.04] ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                      <td className="p-4 text-white/60 font-medium">{row.feature}</td>
                      {[row.axiom, row.hubspot, row.salesforce, row.close].map((val, j) => (
                        <td key={j} className={`p-4 text-center ${j === 0 ? "bg-orange-500/5" : ""}`}>
                          {val === true ? (
                            <CheckCircle className="h-4 w-4 text-green-400 mx-auto" />
                          ) : val === false ? (
                            <XCircle className="h-4 w-4 text-white/10 mx-auto" />
                          ) : (
                            <span className={`text-xs font-bold ${j === 0 ? "text-orange-400" : "text-white/30"}`}>{val}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">Customer Stories</p>
              <h2 className="text-4xl md:text-5xl font-black mb-4">Real results. <GradText>Real teams.</GradText></h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="bg-white/5 border border-white/8 rounded-2xl p-6 h-full flex flex-col hover:border-white/15 transition-colors">
                  <div className="flex gap-0.5 mb-5">
                    {[...Array(5)].map((_, si) => (
                      <Star key={si} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed flex-1 mb-6">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-black`}>{t.avatar}</div>
                    <div>
                      <div className="text-sm font-bold text-white">{t.name}</div>
                      <div className="text-xs text-white/30">{t.title}, {t.company}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">Pricing</p>
              <h2 className="text-4xl md:text-5xl font-black mb-4">Simple pricing. <GradText>Massive value.</GradText></h2>
              <p className="text-white/40 mb-8">All plans include a 60-day free trial. Credit card required.</p>
              <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                <button onClick={() => setAnnual(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!annual ? "bg-white text-black shadow-sm" : "text-white/40"}`}>Monthly</button>
                <button onClick={() => setAnnual(true)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${annual ? "bg-white text-black shadow-sm" : "text-white/40"}`}>
                  Annual
                  <span className="text-xs font-black text-green-400">-10%</span>
                </button>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {PLANS.map((plan, i) => {
              const price = annual ? (plan.annualPrice ?? Math.round(plan.price * 0.90)) : plan.price;
              return (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className={`relative rounded-2xl p-5 h-full flex flex-col transition-all ${plan.highlight
                    ? "bg-gradient-to-b from-orange-500/10 to-transparent border-2 border-orange-500/30 shadow-2xl shadow-orange-500/10"
                    : "bg-white/5 border border-white/8 hover:border-white/15"
                  }`}>
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg shadow-orange-500/30">{plan.badge}</span>
                      </div>
                    )}
                    <div className="mb-4">
                      <h3 className="text-base font-black text-white mb-1">{plan.name}</h3>
                      <p className="text-xs text-white/40 mb-3 leading-snug">{plan.desc}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">${price}</span>
                        <span className="text-sm text-white/30">/mo</span>
                      </div>
                      {annual && <p className="text-xs text-green-400/80 mt-0.5">Billed annually (10% off)</p>}
                      {plan.savings && (
                        <p className="text-xs text-green-400 font-semibold mt-1">↓ {plan.savings}</p>
                      )}
                      {plan.addOnNote && (
                        <p className="text-xs text-orange-300/70 mt-1">{plan.addOnNote}</p>
                      )}
                    </div>
                    <ul className="space-y-2 flex-1 mb-5">
                      {plan.features.map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2">
                          <Check className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${plan.highlight ? "text-orange-400" : "text-green-400"}`} />
                          <span className="text-xs text-white/60">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handlePlanCTA(plan.id, annual ? "annual" : "monthly")}
                      disabled={checkoutLoadingPlan === plan.id}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${plan.highlight
                        ? "bg-orange-500 text-white hover:bg-orange-400 shadow-lg shadow-orange-500/20"
                        : "bg-white/10 text-white hover:bg-white/15 border border-white/10"
                      }`}
                    >
                      {checkoutLoadingPlan === plan.id ? (
                        <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> Redirecting...</>
                      ) : (
                        <>{plan.cta} <ArrowRight className="h-3.5 w-3.5" /></>
                      )}
                    </button>
                    <p className="text-xs text-center mt-2 text-white/20 flex items-center justify-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      Credit card required
                    </p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">FAQ</p>
              <h2 className="text-4xl font-black">Common questions.</h2>
            </div>
          </FadeIn>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className={`rounded-2xl border overflow-hidden transition-colors ${openFaq === i ? "border-white/15 bg-white/5" : "border-white/5 bg-white/[0.02] hover:border-white/10"}`}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-semibold text-white/80 text-sm pr-4">{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-white/30 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm text-white/40 leading-relaxed border-t border-white/5 pt-4">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="relative rounded-3xl overflow-hidden border border-white/10 p-12 md:p-20 text-center">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-purple-500/5" />
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
                backgroundSize: "24px 24px"
              }} />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                  Ready to transform<br />
                  <GradText>your sales?</GradText>
                </h2>
                <p className="text-white/40 text-lg mb-10 max-w-xl mx-auto">
                  Join thousands of teams who switched to AXIOM CRM and never looked back. Any business. Any industry. Any size.
                </p>
                <Link href="/signup">
                  <button className="group inline-flex items-center gap-2 bg-white text-black font-black text-base px-10 py-5 rounded-2xl hover:bg-white/90 transition-all hover:shadow-2xl hover:shadow-white/10 hover:-translate-y-0.5">
                    Start Your 60-Day Free Trial
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <p className="text-white/20 text-sm mt-5 flex items-center justify-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  Credit card required · Cancel anytime
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-white fill-white" />
            </div>
            <span className="font-black text-white">AXIOM CRM</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/25">
            {["Privacy Policy", "Terms of Service", "Contact"].map(l => (
              <a key={l} href="#" className="hover:text-white/60 transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-sm text-white/20">© 2026 AXIOM CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
