import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DEMO_STEPS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "⚡",
    title: "Your Command Center",
    subtitle: "Everything at a glance — pipeline, leads, AI activity, team performance.",
    screen: {
      bg: "from-slate-900 to-slate-950",
      accent: "#f97316",
      content: "dashboard",
    },
  },
  {
    id: "pipeline",
    label: "Pipeline",
    icon: "🎯",
    title: "Visual Deal Pipeline",
    subtitle: "Drag-and-drop Kanban board with AI win probability on every deal.",
    screen: {
      bg: "from-slate-900 to-indigo-950",
      accent: "#6366f1",
      content: "pipeline",
    },
  },
  {
    id: "paradigm",
    label: "Paradigm Engine™",
    icon: "🤖",
    title: "AI That Prospects For You",
    subtitle: "5-layer AI finds, verifies, profiles, and engages prospects autonomously.",
    screen: {
      bg: "from-slate-900 to-purple-950",
      accent: "#a855f7",
      content: "paradigm",
    },
  },
  {
    id: "ghost",
    label: "Ghost Mode",
    icon: "👻",
    title: "Autonomous Email Sequences",
    subtitle: "AI writes and sends personalized 4-stage sequences. Hands off hot leads instantly.",
    screen: {
      bg: "from-slate-900 to-cyan-950",
      accent: "#06b6d4",
      content: "ghost",
    },
  },
  {
    id: "deliverability",
    label: "Deliverability",
    icon: "📬",
    title: "98.7% Inbox Placement",
    subtitle: "260 rotating SMTP addresses. 52 domains. Real-time blacklist monitoring.",
    screen: {
      bg: "from-slate-900 to-green-950",
      accent: "#22c55e",
      content: "deliverability",
    },
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: "🛡️",
    title: "Compliance Fortress™",
    subtitle: "Every email auto-validated against CAN-SPAM, GDPR & CCPA before it sends.",
    screen: {
      bg: "from-slate-900 to-orange-950",
      accent: "#f97316",
      content: "compliance",
    },
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: "📊",
    title: "Deep Revenue Intelligence",
    subtitle: "Pipeline analytics, email heatmaps, team leaderboards, and AI forecasting.",
    screen: {
      bg: "from-slate-900 to-rose-950",
      accent: "#f43f5e",
      content: "analytics",
    },
  },
  {
    id: "migration",
    label: "Migration",
    icon: "🚀",
    title: "Switch in 30 Minutes",
    subtitle: "One-touch import from HubSpot, Salesforce, Pipedrive, or any CSV.",
    screen: {
      bg: "from-slate-900 to-amber-950",
      accent: "#f59e0b",
      content: "migration",
    },
  },
];

function DashboardScreen({ accent }: { accent: string }) {
  return (
    <div className="h-full flex flex-col gap-2 p-3">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Pipeline", value: "$4.2M", delta: "+12%" },
          { label: "Hot Leads", value: "47", delta: "+8" },
          { label: "Deliverability", value: "98.7%", delta: "+27%" },
          { label: "Deals Won", value: "23", delta: "+5" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-lg p-2 border border-white/10"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <div className="text-xs text-white/50">{stat.label}</div>
            <div className="text-lg font-bold text-white">{stat.value}</div>
            <div className="text-xs" style={{ color: accent }}>{stat.delta}</div>
          </motion.div>
        ))}
      </div>
      {/* Activity feed */}
      <div className="flex-1 rounded-lg border border-white/10 p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="text-xs text-white/50 mb-2">AI Activity Feed — Live</div>
        {[
          { msg: "Paradigm Engine™ identified 12 new hot leads", time: "2s ago", color: accent },
          { msg: "Ghost Mode sent 47 personalized emails", time: "14s ago", color: "#22c55e" },
          { msg: "Battle Card generated for Marcus T. at Velocity Freight", time: "1m ago", color: "#06b6d4" },
          { msg: "NeverBounce verified 203 contacts — 0 bounces", time: "3m ago", color: "#a855f7" },
          { msg: "Revenue Autopilot re-engaged 3 stalled deals", time: "5m ago", color: "#f59e0b" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="flex items-start gap-2 py-1 border-b border-white/5 last:border-0"
          >
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: item.color }} />
            <div className="text-xs text-white/70 flex-1">{item.msg}</div>
            <div className="text-xs text-white/30 flex-shrink-0">{item.time}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PipelineScreen({ accent }: { accent: string }) {
  const stages = [
    { name: "New Lead", count: 23, value: "$890K", deals: ["Global Transit Inc.", "Midwest Logistics", "FastFreight Co."] },
    { name: "Qualified", count: 15, value: "$1.2M", deals: ["Velocity Freight", "CrossCountry Bkg.", "Premier Partners"] },
    { name: "Demo Sched.", count: 8, value: "$780K", deals: ["National Transport", "AXIOM Consulting", "Swift Logistics"] },
    { name: "Closed Won", count: 12, value: "$1.3M", deals: ["Quantum Haulage", "Orion Logistics", "StarRoute Inc."] },
  ];
  return (
    <div className="h-full flex gap-2 p-3">
      {stages.map((stage, si) => (
        <motion.div
          key={stage.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.12 }}
          className="flex-1 flex flex-col gap-1"
        >
          <div className="flex justify-between items-center mb-1">
            <div className="text-xs font-semibold text-white/70">{stage.name}</div>
            <div className="text-xs px-1.5 py-0.5 rounded-full text-white/60" style={{ background: "rgba(255,255,255,0.08)" }}>{stage.count}</div>
          </div>
          <div className="text-xs font-bold mb-1" style={{ color: accent }}>{stage.value}</div>
          {stage.deals.map((deal, di) => (
            <motion.div
              key={deal}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: si * 0.12 + di * 0.08 }}
              className="rounded p-1.5 border border-white/10 cursor-pointer hover:border-white/20 transition-colors"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div className="text-xs text-white/80 truncate">{deal}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="h-1 flex-1 rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${60 + di * 10}%`, background: accent }} />
                </div>
                <div className="text-xs text-white/40">{60 + di * 10}%</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

function ParadigmScreen({ accent }: { accent: string }) {
  const layers = [
    { name: "Sentinel Layer", desc: "Monitors job changes & social signals 24/7", status: "Active", pct: 100 },
    { name: "Nutrition Gate", desc: "NeverBounce email verification", status: "Verified 203", pct: 95 },
    { name: "Digital Twin", desc: "AI psychographic profiling", status: "Profiling", pct: 78 },
    { name: "Ghost Mode", desc: "Autonomous 4-stage sequences", status: "47 Active", pct: 88 },
    { name: "Battle Cards", desc: "AI tactical summaries for hot leads", status: "12 Generated", pct: 100 },
  ];
  return (
    <div className="h-full flex flex-col gap-2 p-3">
      <div className="text-sm font-bold text-white mb-1">Paradigm Engine™ — 5-Layer AI Stack</div>
      {layers.map((layer, i) => (
        <motion.div
          key={layer.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12 }}
          className="flex items-center gap-3 rounded-lg p-2 border border-white/10"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: accent, color: "#000" }}>{i + 1}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white">{layer.name}</div>
            <div className="text-xs text-white/50 truncate">{layer.desc}</div>
            <div className="h-1 mt-1 rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${layer.pct}%` }}
                transition={{ delay: i * 0.12 + 0.3, duration: 0.6 }}
                className="h-full rounded-full"
                style={{ background: accent }}
              />
            </div>
          </div>
          <div className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${accent}22`, color: accent }}>{layer.status}</div>
        </motion.div>
      ))}
    </div>
  );
}

function GhostScreen({ accent }: { accent: string }) {
  const stages = [
    { stage: "Stage 1", type: "Initial Outreach", status: "Sent", open: "68%" },
    { stage: "Stage 2", type: "Follow-Up (Alt Angle)", status: "Queued", open: "—" },
    { stage: "Stage 3", type: "Value-Add Email", status: "Pending", open: "—" },
    { stage: "Stage 4", type: "Breakup Email", status: "Pending", open: "—" },
  ];
  return (
    <div className="h-full flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="text-sm font-bold text-white">Ghost Mode Sequence</div>
        <div className="text-xs px-2 py-0.5 rounded-full text-black font-semibold" style={{ background: accent }}>ACTIVE</div>
      </div>
      <div className="rounded-lg p-2 border border-white/10 mb-1" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="text-xs text-white/50">Prospect</div>
        <div className="text-sm font-semibold text-white">Marcus T. — VP Sales, Velocity Freight</div>
        <div className="text-xs text-white/40 mt-0.5">Profile: Driver personality · Pain: CRM too complex · Intent score: 87/100</div>
      </div>
      {stages.map((s, i) => (
        <motion.div
          key={s.stage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12 }}
          className="flex items-center gap-3 rounded-lg p-2 border border-white/10"
          style={{ background: s.status === "Sent" ? `${accent}11` : "rgba(255,255,255,0.03)", borderColor: s.status === "Sent" ? `${accent}44` : "rgba(255,255,255,0.1)" }}
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: s.status === "Sent" ? accent : "rgba(255,255,255,0.1)", color: s.status === "Sent" ? "#000" : "#fff" }}>{i + 1}</div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-white">{s.stage}: {s.type}</div>
          </div>
          <div className="text-xs text-white/50">{s.open !== "—" ? `Open: ${s.open}` : ""}</div>
          <div className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.status === "Sent" ? `${accent}33` : "rgba(255,255,255,0.08)", color: s.status === "Sent" ? accent : "rgba(255,255,255,0.4)" }}>{s.status}</div>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="rounded-lg p-2 border text-xs"
        style={{ background: "#22c55e11", borderColor: "#22c55e44", color: "#22c55e" }}
      >
        🔥 Positive intent detected in reply — Battle Card generated, rep notified
      </motion.div>
    </div>
  );
}

function DeliverabilityScreen({ accent }: { accent: string }) {
  const bars = [
    { label: "AXIOM CRM", pct: 98.7, color: accent },
    { label: "HubSpot", pct: 71, color: "#6b7280" },
    { label: "Salesforce", pct: 68, color: "#6b7280" },
    { label: "Pipedrive", pct: 73, color: "#6b7280" },
    { label: "Close", pct: 75, color: "#6b7280" },
  ];
  return (
    <div className="h-full flex flex-col gap-2 p-3">
      <div className="text-sm font-bold text-white mb-1">Inbox Placement Rate Comparison</div>
      <div className="flex-1 flex flex-col justify-center gap-2">
        {bars.map((bar, i) => (
          <motion.div key={bar.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-2">
            <div className="text-xs text-white/60 w-20 text-right">{bar.label}</div>
            <div className="flex-1 h-5 rounded bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bar.pct}%` }}
                transition={{ delay: i * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                className="h-full rounded flex items-center justify-end pr-2"
                style={{ background: bar.color }}
              >
                <span className="text-xs font-bold text-white">{bar.pct}%</span>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-1">
        {[
          { label: "SMTP Addresses", value: "260" },
          { label: "Domains", value: "52" },
          { label: "Blacklists Monitored", value: "50+" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg p-2 text-center border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="text-lg font-bold" style={{ color: accent }}>{stat.value}</div>
            <div className="text-xs text-white/50">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComplianceScreen({ accent }: { accent: string }) {
  const checks = [
    { name: "CAN-SPAM Compliance", status: "Pass", detail: "Physical address, unsubscribe link verified" },
    { name: "GDPR Consent Check", status: "Pass", detail: "All EU recipients have valid consent records" },
    { name: "CCPA Opt-Out", status: "Pass", detail: "California residents excluded from list" },
    { name: "Subject Line Audit", status: "Pass", detail: "No deceptive language detected" },
    { name: "Blacklist Check", status: "Pass", detail: "All 50+ blacklists clear" },
    { name: "DMARC Alignment", status: "Pass", detail: "SPF + DKIM + DMARC all aligned" },
  ];
  return (
    <div className="h-full flex flex-col gap-2 p-3">
      <div className="text-sm font-bold text-white mb-1">Compliance Fortress™ — Pre-Send Validation</div>
      {checks.map((check, i) => (
        <motion.div
          key={check.name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-2 rounded-lg p-1.5 border border-white/10"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: "#22c55e22", color: "#22c55e" }}>✓</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white">{check.name}</div>
            <div className="text-xs text-white/40 truncate">{check.detail}</div>
          </div>
          <div className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#22c55e22", color: "#22c55e" }}>{check.status}</div>
        </motion.div>
      ))}
    </div>
  );
}

function AnalyticsScreen({ accent }: { accent: string }) {
  return (
    <div className="h-full flex flex-col gap-2 p-3">
      <div className="text-sm font-bold text-white mb-1">Revenue Intelligence Dashboard</div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg p-2 border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="text-xs text-white/50 mb-1">Pipeline Velocity</div>
          <div className="flex items-end gap-1 h-12">
            {[40, 55, 45, 70, 60, 85, 75, 90, 80, 95, 88, 100].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.05 }}
                className="flex-1 rounded-sm"
                style={{ background: i === 11 ? accent : `${accent}44` }}
              />
            ))}
          </div>
        </div>
        <div className="rounded-lg p-2 border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="text-xs text-white/50 mb-1">Win Rate by Rep</div>
          {[
            { name: "Sarah K.", rate: 42 },
            { name: "Marcus T.", rate: 38 },
            { name: "James R.", rate: 31 },
          ].map((rep) => (
            <div key={rep.name} className="flex items-center gap-2 mb-1">
              <div className="text-xs text-white/60 w-14 truncate">{rep.name}</div>
              <div className="flex-1 h-2 rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${rep.rate}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full rounded-full"
                  style={{ background: accent }}
                />
              </div>
              <div className="text-xs" style={{ color: accent }}>{rep.rate}%</div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg p-2 border border-white/10 flex-1" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="text-xs text-white/50 mb-1">Q2 Revenue Forecast</div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Best Case", value: "$2.8M", color: "#22c55e" },
            { label: "Most Likely", value: "$2.1M", color: accent },
            { label: "Worst Case", value: "$1.4M", color: "#f43f5e" },
          ].map((f) => (
            <div key={f.label} className="text-center">
              <div className="text-sm font-bold" style={{ color: f.color }}>{f.value}</div>
              <div className="text-xs text-white/40">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MigrationScreen({ accent }: { accent: string }) {
  const sources = ["HubSpot", "Salesforce", "Pipedrive", "Close", "CSV File", "Any CRM"];
  const steps = [
    { step: "Connect", desc: "Authorize your existing CRM via API", status: "Complete", time: "< 1 min" },
    { step: "Map Fields", desc: "AI auto-maps all your custom fields", status: "Complete", time: "< 2 min" },
    { step: "Import Data", desc: "Contacts, deals, emails, activities", status: "Complete", time: "~20 min" },
    { step: "Verify", desc: "AI checks for missing or duplicate data", status: "Complete", time: "< 5 min" },
  ];
  return (
    <div className="h-full flex flex-col gap-2 p-3">
      <div className="text-sm font-bold text-white mb-1">One-Touch Migration Engine</div>
      <div className="flex gap-1 flex-wrap mb-1">
        {sources.map((s) => (
          <div key={s} className="text-xs px-2 py-0.5 rounded-full border border-white/20 text-white/60">{s}</div>
        ))}
      </div>
      {steps.map((step, i) => (
        <motion.div
          key={step.step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}
          className="flex items-center gap-3 rounded-lg p-2 border"
          style={{ background: `${accent}0d`, borderColor: `${accent}33` }}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black" style={{ background: accent }}>{i + 1}</div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-white">{step.step}</div>
            <div className="text-xs text-white/50">{step.desc}</div>
          </div>
          <div className="text-right">
            <div className="text-xs" style={{ color: "#22c55e" }}>✓ {step.status}</div>
            <div className="text-xs text-white/30">{step.time}</div>
          </div>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="rounded-lg p-2 text-center border"
        style={{ background: `${accent}11`, borderColor: `${accent}44` }}
      >
        <div className="text-lg font-bold" style={{ color: accent }}>4,200 contacts · 847 deals · Full email history</div>
        <div className="text-xs text-white/50">Migrated in 23 minutes · Zero data loss</div>
      </motion.div>
    </div>
  );
}

function ScreenContent({ stepId, accent }: { stepId: string; accent: string }) {
  switch (stepId) {
    case "dashboard": return <DashboardScreen accent={accent} />;
    case "pipeline": return <PipelineScreen accent={accent} />;
    case "paradigm": return <ParadigmScreen accent={accent} />;
    case "ghost": return <GhostScreen accent={accent} />;
    case "deliverability": return <DeliverabilityScreen accent={accent} />;
    case "compliance": return <ComplianceScreen accent={accent} />;
    case "analytics": return <AnalyticsScreen accent={accent} />;
    case "migration": return <MigrationScreen accent={accent} />;
    default: return null;
  }
}

export default function InteractiveDemoTour() {
  const [activeStep, setActiveStep] = useState(0);
  const step = DEMO_STEPS[activeStep];

  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 100%)" }}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10 blur-3xl"
          style={{ background: `radial-gradient(ellipse, ${step.screen.accent} 0%, transparent 70%)` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-sm text-white/60 mb-4"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Interactive Platform Demo
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-white mb-4"
          >
            See Every Feature. <span style={{ color: step.screen.accent }}>Live.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/50 max-w-2xl mx-auto"
          >
            Click any feature below to explore AXIOM CRM interactively — no signup required.
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Feature tabs */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 w-full lg:w-48 flex-shrink-0">
            {DEMO_STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveStep(i)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all duration-200 whitespace-nowrap flex-shrink-0 lg:flex-shrink lg:w-full"
                style={{
                  background: activeStep === i ? `${s.screen.accent}22` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${activeStep === i ? s.screen.accent + "66" : "rgba(255,255,255,0.08)"}`,
                  color: activeStep === i ? s.screen.accent : "rgba(255,255,255,0.5)",
                }}
              >
                <span className="text-base">{s.icon}</span>
                <span className="text-xs font-semibold">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Demo screen */}
          <div className="flex-1 min-w-0">
            {/* Browser chrome */}
            <div className="rounded-2xl overflow-hidden border border-white/10" style={{ background: "#0f0f1a" }}>
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-white/5 rounded-md px-3 py-1 text-xs text-white/30 flex items-center gap-2">
                    <span className="text-green-400">🔒</span>
                    app.axiomcrm.com/{step.id}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/30">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Live
                </div>
              </div>

              {/* Sidebar + content */}
              <div className="flex" style={{ height: "380px" }}>
                {/* Mini sidebar */}
                <div className="w-10 border-r border-white/10 flex flex-col items-center py-3 gap-3" style={{ background: "rgba(0,0,0,0.3)" }}>
                  {["⚡", "🎯", "👥", "📧", "📊", "⚙️"].map((icon, i) => (
                    <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center text-sm cursor-pointer hover:bg-white/10 transition-colors" style={{ background: i === 0 ? `${step.screen.accent}33` : "transparent" }}>
                      {icon}
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0"
                    >
                      <ScreenContent stepId={step.id} accent={step.screen.accent} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Step description */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 flex items-start gap-3"
              >
                <div className="text-3xl">{step.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  <p className="text-white/50 mt-1">{step.subtitle}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
              >
                ← Previous
              </button>
              <div className="flex gap-1.5">
                {DEMO_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{ background: i === activeStep ? step.screen.accent : "rgba(255,255,255,0.2)" }}
                  />
                ))}
              </div>
              {activeStep < DEMO_STEPS.length - 1 ? (
                <button
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: step.screen.accent, color: "#000" }}
                >
                  Next Feature →
                </button>
              ) : (
                <a
                  href="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: step.screen.accent, color: "#000" }}
                >
                  Start Free Trial →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
