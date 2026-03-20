import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles, ArrowRight, Building2, Users, Kanban, ListChecks,
  Send, Shield, Brain, Target, Radar, Ghost, Flame, Truck,
  Phone, Wand2, BarChart3, Zap, CheckCircle2, Play,
  ChevronRight, Star, Award, Rocket, Globe, Bot,
  MessageSquare, TrendingUp, Clock, Heart,
} from "lucide-react";
import { useLocation } from "wouter";
import { useSkin } from "@/contexts/SkinContext";

/* ─────────────────────── Animated Counter ─────────────────────── */
function AnimatedNumber({ target, duration = 2000, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─────────────────────── AI Demo Typewriter ─────────────────────── */
function AIDemo({ command, response, delay = 0 }: { command: string; response: string; delay?: number }) {
  const [typedCmd, setTypedCmd] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setTypedCmd(command.slice(0, i + 1));
        i++;
        if (i >= command.length) {
          clearInterval(interval);
          setTimeout(() => setShowResponse(true), 600);
        }
      }, 35);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [visible, command, delay]);

  return (
    <div ref={ref} className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-5 shadow-2xl border border-gray-700/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-3 w-3 rounded-full bg-red-400" />
        <div className="h-3 w-3 rounded-full bg-yellow-400" />
        <div className="h-3 w-3 rounded-full bg-green-400" />
        <span className="text-[10px] text-gray-500 ml-2 font-mono">REALM AI Assistant</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Users className="h-3 w-3 text-blue-400" />
          </div>
          <div className="bg-blue-500/10 rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%]">
            <p className="text-sm text-blue-200 font-mono">
              {typedCmd}
              {typedCmd.length < command.length && <span className="animate-pulse text-blue-400">|</span>}
            </p>
          </div>
        </div>
        {showResponse && (
          <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="h-3 w-3 text-amber-400" />
            </div>
            <div className="bg-amber-500/10 rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%]">
              <p className="text-sm text-amber-200">{response}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium">Done</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── Feature Card ─────────────────────── */
function FeatureCard({ icon: Icon, title, desc, color }: { icon: React.ElementType; title: string; desc: string; color: string }) {
  return (
    <Card className={`group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-${color}-200/30 overflow-hidden`}>
      <CardContent className="p-5">
        <div className={`h-11 w-11 rounded-xl bg-gradient-to-br from-${color}-100 to-${color}-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
          <Icon className={`h-5 w-5 text-${color}-600`} />
        </div>
        <h3 className="font-bold text-foreground text-sm mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────── Main Commercial Page ─────────────────────── */
export default function Commercial() {
  const { t } = useSkin();
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-0 -m-6">

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-10 right-20 h-96 w-96 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-orange-400/5 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="h-4 w-4 text-amber-200" />
            <span className="text-xs font-semibold text-white/90 tracking-wide uppercase">The Future of Freight CRM</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Meet <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-amber-100">REALM CRM</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/85 font-light max-w-2xl mx-auto leading-relaxed mb-4">
            The most powerful freight broker CRM ever built.
          </p>
          <p className="text-base text-white/70 max-w-xl mx-auto mb-10">
            AI-powered prospecting. Automated outreach. Visual pipelines. Freight operations. 
            Email marketing. Compliance. All in one beautiful platform.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button
              size="lg"
              className="bg-white text-amber-600 hover:bg-white/90 font-bold text-base px-8 py-6 rounded-xl shadow-2xl shadow-black/20"
              onClick={() => setLocation("/")}
            >
              <Rocket className="h-5 w-5 mr-2" /> Launch Dashboard
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 font-bold text-base px-8 py-6 rounded-xl bg-transparent"
              onClick={() => setLocation("/help")}
            >
              <Play className="h-5 w-5 mr-2" /> Explore Guide
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════ STATS BAR ═══════════════════ */}
      <section className="bg-gray-900 text-white py-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-black text-amber-400"><AnimatedNumber target={72} /></p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Database Tables</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black text-emerald-400"><AnimatedNumber target={307} /></p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">API Endpoints</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black text-blue-400"><AnimatedNumber target={69} /></p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Feature Pages</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-black text-purple-400"><AnimatedNumber target={30} suffix="+" /></p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">AI Capabilities</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ AI ASSISTANT DEMO ═══════════════════ */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge text="AI-POWERED" />
            <h2 className="text-3xl md:text-4xl font-black text-foreground mt-4 mb-3">
              Just Tell It What You Want.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The REALM AI Assistant understands natural language and executes CRM actions instantly. 
              No menus. No forms. No friction. Just results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <AIDemo
              command="Add a company called Swift Logistics in Transportation"
              response="Created company 'Swift Logistics' in the Transportation industry. Ready for contacts."
              delay={500}
            />
            <AIDemo
              command="Create a $75K deal called Q2 Fleet Expansion"
              response="Created deal 'Q2 Fleet Expansion' valued at $75,000 in your Sales Pipeline."
              delay={1500}
            />
            <AIDemo
              command="Log a call with Sarah — discussed pricing for Texas lanes"
              response="Logged a call activity on Sarah's contact record with notes about Texas lane pricing."
              delay={2500}
            />
            <AIDemo
              command="Show me my pipeline summary"
              response="You have 12 open deals worth $847K total. 3 in Negotiation ($320K), 5 in Proposal ($290K), 4 in Prospecting ($237K)."
              delay={3500}
            />
          </div>

          <div className="text-center mt-10">
            <p className="text-sm text-muted-foreground mb-3">
              Create contacts. Build campaigns. Import lists. Log activities. Search anything. All by voice.
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {["Add customer", "Create campaign", "Import contacts", "Log a call", "Search deals", "Build segment"].map(cmd => (
                <span key={cmd} className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200/50">
                  "{cmd}" → Done!
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURE GRID ═══════════════════ */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge text="EVERYTHING YOU NEED" />
            <h2 className="text-3xl md:text-4xl font-black text-foreground mt-4 mb-3">
              One Platform. Infinite Power.
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From first contact to closed deal to delivered load — REALM CRM handles the entire lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <FeatureCard icon={Building2} title="Companies" desc="Company-first architecture with 40+ fields and aggregate metrics" color="amber" />
            <FeatureCard icon={Users} title="Contacts" desc="50+ fields per contact with full activity timeline" color="blue" />
            <FeatureCard icon={Kanban} title="Deals Pipeline" desc="Visual Kanban board with drag-and-drop stage management" color="emerald" />
            <FeatureCard icon={ListChecks} title="Task Management" desc="Queues, priorities, reminders — never miss a follow-up" color="purple" />
            <FeatureCard icon={Send} title="Campaigns" desc="Targeted email campaigns with real-time analytics" color="rose" />
            <FeatureCard icon={Brain} title="Paradigm Engine" desc="AI-powered prospecting, signals, and battle cards" color="indigo" />
            <FeatureCard icon={Ghost} title="Ghost Sequences" desc="Automated multi-step outreach on autopilot" color="violet" />
            <FeatureCard icon={Shield} title="Compliance" desc="CAN-SPAM, GDPR, CCPA — stay legal automatically" color="red" />
            <FeatureCard icon={Truck} title="Load Management" desc="Track freight from booking to delivery to payment" color="orange" />
            <FeatureCard icon={Phone} title="Voice Agent" desc="AI-powered phone campaigns with natural conversation" color="teal" />
            <FeatureCard icon={Wand2} title="AI Ghostwriter" desc="Personalized email copy generated in seconds" color="pink" />
            <FeatureCard icon={BarChart3} title="Analytics" desc="Pipeline reports, email metrics, team performance" color="cyan" />
            <FeatureCard icon={Zap} title="Workflows" desc="Automate everything with triggers and conditions" color="yellow" />
            <FeatureCard icon={Target} title="Prospects" desc="AI-discovered leads scored and ready for outreach" color="lime" />
            <FeatureCard icon={Radar} title="Signals" desc="Buying signals detected in real-time by AI" color="sky" />
            <FeatureCard icon={Flame} title="Battle Cards" desc="Competitive intelligence for every sales call" color="red" />
          </div>
        </div>
      </section>

      {/* ═══════════════════ THE DIFFERENCE ═══════════════════ */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge text="WHY REALM" />
            <h2 className="text-3xl md:text-4xl font-black text-foreground mt-4 mb-3">
              Built Different. Built Better.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-amber-200/30 overflow-hidden">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">AI That Actually Works</h3>
                <p className="text-sm text-muted-foreground">
                  Not a chatbot. Not a gimmick. A fully integrated AI that creates records, 
                  searches data, logs activities, and manages your CRM through natural conversation. 
                  Say it. Done.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-amber-200/30 overflow-hidden">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Built for Freight</h3>
                <p className="text-sm text-muted-foreground">
                  MC/DOT verification. Carrier vetting. Load management. Invoicing. Lane preferences. 
                  Fleet tracking. This isn't a generic CRM with freight bolted on — it's freight-native.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-amber-200/30 overflow-hidden">
              <CardContent className="p-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Beautiful by Design</h3>
                <p className="text-sm text-muted-foreground">
                  Warm colors. Soft gradients. Thoughtful typography. Every pixel crafted for comfort. 
                  A CRM you actually enjoy looking at — because you'll be looking at it all day.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIAL / VISION ═══════════════════ */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <blockquote className="text-2xl md:text-3xl font-light leading-relaxed text-white/90 italic mb-6">
            "Imagine a CRM that knows your business as well as you do. That anticipates your next move. 
            That handles the busywork while you focus on relationships. That's not the future — 
            that's REALM CRM, right now."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">The REALM Vision</p>
              <p className="text-xs text-gray-400">Where AI Meets Human Ambition</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ SPEED REEL ═══════════════════ */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <Badge text="SPEED MATTERS" />
            <h2 className="text-3xl md:text-4xl font-black text-foreground mt-4 mb-3">
              What Used to Take Hours Now Takes Seconds.
            </h2>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              { before: "Manually entering 50 contacts from a spreadsheet", after: "\"Import my contact list\" → Done", time: "2 hours → 3 seconds" },
              { before: "Building a targeted email campaign from scratch", after: "\"Create a campaign for hot leads in Texas\" → Done", time: "45 minutes → 10 seconds" },
              { before: "Searching through notes to prep for a sales call", after: "\"Prep me for my call with Acme Logistics\" → Done", time: "20 minutes → 5 seconds" },
              { before: "Creating follow-up tasks after a meeting", after: "\"Create 5 follow-up tasks from today's meeting\" → Done", time: "15 minutes → 5 seconds" },
              { before: "Checking pipeline health across all deals", after: "\"Show my pipeline summary\" → Done", time: "10 minutes → 2 seconds" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-red-50 via-white to-emerald-50 border border-gray-100">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-red-400 line-through mb-0.5">{item.before}</p>
                  <p className="text-sm font-semibold text-emerald-700">{item.after}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-amber-600">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA SECTION ═══════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white py-20">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-10 left-10 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Stop juggling spreadsheets. Stop losing leads. Stop wasting time. 
            Start closing deals with the most powerful CRM in freight.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button
              size="lg"
              className="bg-white text-amber-600 hover:bg-white/90 font-bold text-lg px-10 py-7 rounded-xl shadow-2xl shadow-black/20"
              onClick={() => setLocation("/")}
            >
              <Rocket className="h-6 w-6 mr-2" /> Get Started Now
            </Button>
          </div>
          <p className="text-sm text-white/60 mt-6">
            No credit card required. Full access. Unlimited potential.
          </p>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <section className="bg-gray-900 text-white py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">REALM CRM</span>
          </div>
          <p className="text-xs text-gray-500">
            Built with AI. Designed for humans. Engineered for freight.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            72 database tables · 307 API endpoints · 69 feature pages · 30+ AI capabilities
          </p>
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────── Badge Component ─────────────────────── */
function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase">
      <Sparkles className="h-3 w-3" />
      {text}
    </span>
  );
}
