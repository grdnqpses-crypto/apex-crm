import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { motion, useScroll, useTransform, AnimatePresence, useInView } from "framer-motion";
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
];

const COMPARISON = [
  { feature: "AI Prospect Research", apex: true, hubspot: false, salesforce: false, pipedrive: false },
  { feature: "Autonomous Email Sequences", apex: true, hubspot: "Add-on", salesforce: false, pipedrive: false },
  { feature: "98%+ Inbox Placement", apex: true, hubspot: false, salesforce: false, pipedrive: false },
  { feature: "260 SMTP Rotation", apex: true, hubspot: false, salesforce: false, pipedrive: false },
  { feature: "Auto Compliance Validation", apex: true, hubspot: "Partial", salesforce: "Partial", pipedrive: false },
  { feature: "60-Day Free Trial", apex: true, hubspot: false, salesforce: false, pipedrive: false },
  { feature: "One-Touch Migration", apex: true, hubspot: false, salesforce: false, pipedrive: false },
  { feature: "AI Battle Cards", apex: true, hubspot: false, salesforce: false, pipedrive: false },
  { feature: "Price / User / Month", apex: "$197", hubspot: "$800+", salesforce: "$1,200+", pipedrive: "$400+" },
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
    id: "starter",
    name: "Starter", price: 197, desc: "For small teams getting started.",
    features: ["Up to 5 users", "10,000 contacts", "Paradigm Engine™ (Basic)", "Ghost Mode sequences", "Deliverability suite", "Standard support"],
    cta: "Start Free Trial", highlight: false,
  },
  {
    id: "professional",
    name: "Professional", price: 697, desc: "The complete platform for growing teams.",
    features: ["Up to 25 users", "100,000 contacts", "Paradigm Engine™ (Full)", "Ghost Mode + Battle Cards", "260 SMTP rotation", "Compliance Fortress™", "Priority support", "Custom branding"],
    cta: "Start Free Trial", highlight: true, badge: "Most Popular",
  },
  {
    id: "enterprise",
    name: "Enterprise", price: 1497, desc: "Unlimited scale for large operations.",
    features: ["Unlimited users", "Unlimited contacts", "All Professional features", "Dedicated SMTP infra", "Custom AI training", "SLA guarantee", "Dedicated account manager", "White-label option"],
    cta: "Start Free Trial", highlight: false,
  },
];

const FAQS = [
  { q: "How does the 60-day free trial work?", a: "You get full access to the entire platform for 60 days. A credit card is required to start — this ensures we can provision your dedicated SMTP infrastructure and AI resources from day one. You won't be charged until day 61, and you can cancel anytime before that." },
  { q: "How long does migration from my current CRM take?", a: "Most customers complete their full migration in under 30 minutes. Our one-touch migration engine connects directly to HubSpot, Salesforce, Pipedrive, and Close via API, automatically maps all your custom fields, and imports contacts, deals, emails, and activity history with zero data loss." },
  { q: "Can Apex CRM be customized for my industry?", a: "Absolutely. Apex CRM is built for any B2B sales team. Custom fields, workflows, pipeline stages, email templates, and AI prompts can all be tailored to your specific industry and sales process. Our onboarding team will configure everything for you." },
  { q: "Why is your inbox placement rate so much higher?", a: "We operate 260 dedicated SMTP addresses across 52 domains with real-time rotation. Every domain is warmed up, monitored against 50+ blacklists, and configured with SPF, DKIM, and DMARC. Competitors use shared sending infrastructure — your emails compete with thousands of other senders. Ours don't." },
  { q: "What is the Paradigm Engine™?", a: "It's our 5-layer AI prospecting system: (1) Sentinel Layer monitors job changes and social signals 24/7, (2) Nutrition Gate verifies every email via NeverBounce, (3) Digital Twin builds a psychographic profile of each prospect, (4) Ghost Mode deploys personalized sequences, (5) Battle Cards generate AI tactical summaries when a prospect shows buying intent." },
];

// ─── Main component ───────────────────────────────────────────────────────
export default function MarketingHome() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [loginOpen, setLoginOpen] = useState(false);
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
        navigate("/dashboard");
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
              <span className="font-black text-lg tracking-tight">Apex CRM</span>
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
                    <p className="text-sm text-white/40">Sign in to your Apex CRM account</p>
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors p-1"
                          tabIndex={-1}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                      <div
                        onClick={() => setRememberMe(v => !v)}
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                          rememberMe
                            ? 'bg-orange-500 border-orange-500'
                            : 'bg-white/5 border-white/20 group-hover:border-white/40'
                        }`}
                      >
                        {rememberMe && <Check className="h-2.5 w-2.5 text-black" strokeWidth={3} />}
                      </div>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">Remember me for 30 days</span>
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
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663348315388/mLLZEfmfSEuH47dfeJgVGY/apex-demo-video_ca6bcb62.mp4"
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
        {/* Background mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-orange-500/5 blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 w-full max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 border border-orange-500/20 bg-orange-500/5 text-orange-400 text-xs font-bold px-4 py-1.5 rounded-full mb-10 tracking-wider uppercase"
          >
            <Sparkles className="h-3 w-3" />
            The AI-Powered CRM for Every Business
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tight leading-[0.95] mb-8"
          >
            Close More Deals.<br />
            <GradText>Automatically.</GradText>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Apex CRM combines autonomous AI prospecting, 98.7% email deliverability, and one-touch migration — in a platform that adapts to any business, any industry, any team.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4"
          >
            <Link href="/signup">
              <button className="group flex items-center gap-2 bg-white text-black font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/90 transition-all hover:shadow-2xl hover:shadow-white/10 hover:-translate-y-0.5">
                Start 60-Day Free Trial
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button
              onClick={() => setVideoOpen(true)}
              className="group flex items-center gap-2 text-white/70 font-semibold text-base px-6 py-4 rounded-2xl border border-white/10 hover:border-orange-500/40 hover:text-white transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center group-hover:bg-orange-500/30 transition-all">
                <Play className="h-3.5 w-3.5 fill-orange-400 text-orange-400 ml-0.5" />
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

      {/* ── Inline video ─────────────────────────────────────────────────── */}
      <section id="demo" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">See It In Action</p>
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Watch Apex CRM <GradText>work.</GradText>
              </h2>
              <p className="text-white/40 text-lg max-w-xl mx-auto">No demo request. No sales call. Just the product, doing what it does.</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60">
              {/* Autoplay muted video — full width, no button needed */}
              <video
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663348315388/mLLZEfmfSEuH47dfeJgVGY/apex-highlight-reel-final_5b1650cb.mp4"
                className="w-full aspect-video object-contain bg-black"
                autoPlay
                muted
                loop
                playsInline
              />
              {/* YouTube overlay — click to open full video with sound */}
              <div className="absolute inset-0 flex items-end justify-end p-4 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                <a
                  href="https://youtube.com/shorts/Y91YVB-yZhs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/20 transition-all"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Watch with sound
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
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
                    <th className="p-4 font-black text-orange-400 bg-orange-500/5">Apex CRM</th>
                    <th className="p-4 font-semibold text-white/30">HubSpot</th>
                    <th className="p-4 font-semibold text-white/30">Salesforce</th>
                    <th className="p-4 font-semibold text-white/30">Pipedrive</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={i} className={`border-b border-white/[0.04] ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                      <td className="p-4 text-white/60 font-medium">{row.feature}</td>
                      {[row.apex, row.hubspot, row.salesforce, row.pipedrive].map((val, j) => (
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
                  <span className="text-xs font-black text-green-400">-25%</span>
                </button>
              </div>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan, i) => {
              const price = annual ? Math.round(plan.price * 0.75) : plan.price;
              return (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className={`relative rounded-2xl p-7 h-full flex flex-col transition-all ${plan.highlight
                    ? "bg-gradient-to-b from-orange-500/10 to-transparent border-2 border-orange-500/30 shadow-2xl shadow-orange-500/10"
                    : "bg-white/5 border border-white/8 hover:border-white/15"
                  }`}>
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-orange-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg shadow-orange-500/30">{plan.badge}</span>
                      </div>
                    )}
                    <div className="mb-6">
                      <h3 className="text-lg font-black text-white mb-1">{plan.name}</h3>
                      <p className="text-sm text-white/40 mb-4">{plan.desc}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-white">${price}</span>
                        <span className="text-sm text-white/30">/mo</span>
                      </div>
                    </div>
                    <ul className="space-y-3 flex-1 mb-7">
                      {plan.features.map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2.5">
                          <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.highlight ? "text-orange-400" : "text-green-400"}`} />
                          <span className="text-sm text-white/60">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handlePlanCTA(plan.id, annual ? "annual" : "monthly")}
                      disabled={checkoutLoadingPlan === plan.id}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${plan.highlight
                        ? "bg-orange-500 text-white hover:bg-orange-400 shadow-lg shadow-orange-500/20"
                        : "bg-white/10 text-white hover:bg-white/15 border border-white/10"
                      }`}
                    >
                      {checkoutLoadingPlan === plan.id ? (
                        <><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Redirecting...</>
                      ) : (
                        <>{plan.cta} <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                    <p className="text-xs text-center mt-3 text-white/20 flex items-center justify-center gap-1">
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
                  Join thousands of teams who switched to Apex CRM and never looked back. Any business. Any industry. Any size.
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
            <span className="font-black text-white">Apex CRM</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/25">
            {["Privacy Policy", "Terms of Service", "Contact"].map(l => (
              <a key={l} href="#" className="hover:text-white/60 transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-sm text-white/20">© 2026 Apex CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
