import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, Search, Users, Building2, Kanban, ListChecks, Send, Mail, Shield,
  FlaskConical, Zap, GitBranch, Filter, BarChart3, Key, Webhook,
  Brain, Target, Radar, Ghost, Flame, Plug, Sparkles,
  ShieldCheck, Ban, Settings, Globe, ChevronDown, ChevronRight,
  Lightbulb, AlertTriangle, CheckCircle2, ArrowRight,
} from "lucide-react";
import { useLocation } from "wouter";

interface ManualSection {
  id: string;
  title: string;
  icon: React.ElementType;
  category: string;
  path: string;
  summary: string;
  content: ManualContent;
}

interface ManualContent {
  overview: string;
  whatItDoes: string;
  howToUse: string[];
  expectedOutcomes: string[];
  bestPractices: string[];
  commonMistakes: string[];
  relatedPages: string[];
}

const manualSections: ManualSection[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: BarChart3,
    category: "Getting Started",
    path: "/",
    summary: "Your real-time command center showing all CRM metrics at a glance.",
    content: {
      overview: "The Dashboard is your daily starting point. It aggregates key metrics from every part of the CRM — contacts, companies, deals, campaigns, and tasks — into a single view. Think of it as the cockpit of your sales operation.",
      whatItDoes: "Displays real-time counts and values for: Total Contacts, Companies, Open Deals, Pipeline Value, Won/Lost Deals, Active Campaigns, and Pending Tasks. Each metric card links directly to its respective page for drill-down.",
      howToUse: [
        "Check the Dashboard first thing every morning to assess your business health.",
        "Click any metric card to navigate directly to that section.",
        "Use the Quick Actions section to jump to common tasks like adding contacts or creating deals.",
        "Follow the Getting Started checklist if you're new to the system.",
      ],
      expectedOutcomes: [
        "Immediate visibility into your entire sales operation.",
        "Quick identification of areas needing attention (e.g., climbing task count, stalled deals).",
        "Faster decision-making through centralized metrics.",
      ],
      bestPractices: [
        "Review Dashboard daily — it's your early warning system.",
        "If pending tasks are climbing, prioritize clearing them before adding new work.",
        "If pipeline value drops, review your Deals page for stalled opportunities.",
      ],
      commonMistakes: [
        "Ignoring the Dashboard and working in individual pages — you miss the big picture.",
        "Not acting on declining metrics until they become critical.",
      ],
      relatedPages: ["Contacts", "Companies", "Deals", "Tasks", "Campaigns"],
    },
  },
  {
    id: "contacts",
    title: "Contacts",
    icon: Users,
    category: "CRM Core",
    path: "/contacts",
    summary: "Manage every person your business interacts with — 50+ fields per contact.",
    content: {
      overview: "The Contacts page is the foundation of your CRM. Every person — prospect, customer, partner, vendor — lives here with 50+ fields covering identity, communication, address, lifecycle stage, marketing attribution, social profiles, and logistics-specific data.",
      whatItDoes: "Provides a searchable, filterable table of all contacts. Each contact record includes fields organized into sections: Identity (name, email, phone), Communication (preferred channel, timezone), Address (full mailing address), Lifecycle & Sales (lead status, lifecycle stage, deal value), Marketing Attribution (source, campaign), Social Media (LinkedIn, Twitter), and Logistics-Specific (equipment type, lane preferences, TMS integration).",
      howToUse: [
        "Click '+ Add Contact' to create a new contact. Fill in at minimum: name, email, company, and lead status.",
        "Use the search bar to find contacts by name or email.",
        "Filter by lead status to segment your pipeline (27 logistics-specific statuses available).",
        "Click any contact row to view their full 360° profile with activity timeline.",
        "Use the Edit tab on the detail page to update any of the 50+ fields.",
      ],
      expectedOutcomes: [
        "A comprehensive database of every person in your business network.",
        "Quick access to any contact's full profile and interaction history.",
        "Better email campaign targeting through rich contact data.",
        "Improved AI prospecting accuracy with more data points.",
      ],
      bestPractices: [
        "Always set the Lead Status — it drives your entire sales pipeline.",
        "Fill in as many fields as possible — the AI uses this data for personalization.",
        "Log every interaction in the Activities tab — calls, emails, meetings, notes.",
        "Link contacts to their companies for account-based selling.",
        "Use the logistics fields (Equipment Type, Lane Preferences) for freight-specific outreach.",
      ],
      commonMistakes: [
        "Creating contacts without email addresses — they can't receive campaigns.",
        "Not setting lead status — contacts become invisible in pipeline views.",
        "Duplicate contacts — always search before creating.",
        "Not logging activities — the timeline becomes useless.",
      ],
      relatedPages: ["Contact Detail", "Companies", "Campaigns", "Segments"],
    },
  },
  {
    id: "companies",
    title: "Companies",
    icon: Building2,
    category: "CRM Core",
    path: "/companies",
    summary: "Manage company records with 40+ fields including logistics-specific data.",
    content: {
      overview: "Companies are the organizational layer above contacts. Each company can have multiple associated contacts, creating a hierarchy that enables account-based selling. Company records include 40+ fields covering firmographics, location, lifecycle, social presence, and logistics-specific data.",
      whatItDoes: "Provides a searchable table of all companies with key columns: name, industry, employee count, and website. Each company record includes sections for Identity, Location, Firmographics (industry, revenue, employee count), Lifecycle & Sales, Social Media, and Logistics-Specific fields (Fleet Size, Equipment Types, Service Areas, MC/DOT Numbers).",
      howToUse: [
        "Click '+ Add Company' to create a new company record.",
        "Fill in key fields: name, industry, website, and any logistics-specific data you have.",
        "Click any company row to view its full profile with associated contacts and activity history.",
        "Use the Contacts tab on the detail page to see everyone at this company in your CRM.",
      ],
      expectedOutcomes: [
        "Complete organizational view of your market.",
        "Account-based selling with multi-contact company relationships.",
        "Better targeting through firmographic data (industry, revenue, fleet size).",
      ],
      bestPractices: [
        "Always link contacts to their companies.",
        "Fill in MC Number and DOT Number for freight companies — essential for verification.",
        "Track Fleet Size and Equipment Types for targeted outreach.",
        "Use Service Areas to match companies with your lane coverage.",
      ],
      commonMistakes: [
        "Creating contacts without company associations — you lose the account view.",
        "Not filling in logistics fields — your outreach becomes generic.",
        "Duplicate companies — search by name and website before creating.",
      ],
      relatedPages: ["Company Detail", "Contacts", "Deals"],
    },
  },
  {
    id: "deals",
    title: "Deals Pipeline",
    icon: Kanban,
    category: "CRM Core",
    path: "/deals",
    summary: "Visual Kanban board for tracking sales opportunities through pipeline stages.",
    content: {
      overview: "The Deals page is your visual sales pipeline. Every active opportunity appears as a card on a Kanban board, organized by stage. Drag deals between stages, track values, and forecast revenue. Multiple pipelines let you separate different business lines.",
      whatItDoes: "Displays a Kanban board with columns for each pipeline stage (Qualification, Proposal, Negotiation, Closed Won, Closed Lost). Each deal card shows the deal name, value, associated contact/company, and expected close date. Pipeline selector lets you switch between different pipelines.",
      howToUse: [
        "Click '+ Add Deal' to create a new opportunity with value, stage, contact, company, and expected close date.",
        "Drag deal cards between columns to update their stage.",
        "Click a deal card to view or edit its details.",
        "Use the pipeline dropdown to switch between different pipelines.",
        "Create custom pipelines with your own stages for different business lines.",
      ],
      expectedOutcomes: [
        "Accurate revenue forecasting based on pipeline stages.",
        "Visual identification of bottlenecks (stages with too many stalled deals).",
        "Better prioritization — focus on high-value deals close to closing.",
      ],
      bestPractices: [
        "Update deal stages promptly — stale pipelines give false forecasts.",
        "Set realistic expected close dates and update them when things change.",
        "Associate every deal with both a contact and a company.",
        "Review your pipeline weekly to identify and address stalled deals.",
      ],
      commonMistakes: [
        "Leaving deals in the same stage for weeks without updating.",
        "Not setting deal values — your pipeline value becomes meaningless.",
        "Creating deals without contact/company associations.",
      ],
      relatedPages: ["Contacts", "Companies", "Tasks", "Analytics"],
    },
  },
  {
    id: "tasks",
    title: "Task Management",
    icon: ListChecks,
    category: "CRM Core",
    path: "/tasks",
    summary: "Track follow-ups, calls, emails, and to-dos with queues and reminders.",
    content: {
      overview: "Tasks keep your team organized and accountable. Every follow-up call, email to send, meeting to schedule, or to-do item lives here. Tasks can be associated with contacts, companies, and deals, and organized into queues.",
      whatItDoes: "Provides a filterable task list showing title, type (Call, Email, To-do, Follow-up), priority, due date, status, and assigned person. Filter by status (Not Started, In Progress, Waiting, Completed, Deferred) or by queue.",
      howToUse: [
        "Click '+ Add Task' to create a new task with type, priority, due date, and queue.",
        "Associate tasks with contacts, companies, or deals for context.",
        "Set reminders so you never miss a follow-up.",
        "Mark tasks complete with outcome notes.",
        "Use queues to organize tasks by work stream (e.g., 'Prospecting Calls', 'Customer Renewals').",
      ],
      expectedOutcomes: [
        "Zero missed follow-ups — every promise gets tracked.",
        "Measurable team productivity — see who's completing tasks on time.",
        "Better time management through queue-based task batching.",
      ],
      bestPractices: [
        "Create a task immediately after every call or meeting.",
        "Use queues to batch similar work (do all prospecting calls in one block).",
        "Set reminders for high-priority tasks.",
        "Review overdue tasks daily and either complete or reschedule them.",
      ],
      commonMistakes: [
        "Not creating tasks after meetings — follow-ups get forgotten.",
        "Setting unrealistic due dates — tasks pile up and become overwhelming.",
        "Not using queues — all tasks blend together without organization.",
      ],
      relatedPages: ["Contacts", "Deals", "Workflows"],
    },
  },
  {
    id: "campaigns",
    title: "Email Campaigns",
    icon: Send,
    category: "Email Marketing",
    path: "/campaigns",
    summary: "Create, manage, and send bulk email campaigns with AI spam analysis.",
    content: {
      overview: "The Campaigns page is where you create, manage, and send bulk email campaigns. Each campaign includes a subject line, HTML content, and targeting options. The built-in AI spam analyzer checks your email before sending to maximize inbox placement.",
      whatItDoes: "Lists all campaigns with status (Draft, Scheduled, Sending, Sent, Paused), subject line, and creation date. Each campaign shows key metrics after sending: open rate, click rate, bounce rate, and unsubscribe rate. The AI Spam Analyzer scores your content 0-100.",
      howToUse: [
        "Click '+ New Campaign' to create a campaign with subject, HTML content, and from email.",
        "Use the AI Spam Analyzer to check your content before sending — aim for 80+ score.",
        "Schedule campaigns for optimal send times or send immediately.",
        "Monitor post-send metrics to measure effectiveness.",
        "The system automatically rotates across your 260 email addresses.",
      ],
      expectedOutcomes: [
        "High inbox placement rates (target: 95%+ for warmed domains).",
        "Measurable campaign performance through open/click/bounce metrics.",
        "Protected domain reputation through intelligent rotation and throttling.",
      ],
      bestPractices: [
        "Always run the AI Spam Analyzer before sending.",
        "Avoid ALL CAPS, excessive exclamation marks, and spam trigger words.",
        "Keep text-to-image ratio balanced.",
        "Personalize with recipient's name and company.",
        "Send to segments, not your entire list.",
      ],
      commonMistakes: [
        "Sending without running spam analysis — risky for deliverability.",
        "Blasting entire list instead of targeted segments.",
        "Using deceptive subject lines — violates CAN-SPAM.",
        "Not monitoring bounce rates — damages domain reputation.",
      ],
      relatedPages: ["Templates", "Segments", "A/B Tests", "Compliance Center", "SMTP Accounts"],
    },
  },
  {
    id: "templates",
    title: "Email Templates",
    icon: Mail,
    category: "Email Marketing",
    path: "/templates",
    summary: "Reusable email designs with personalization tokens for consistent messaging.",
    content: {
      overview: "Templates are reusable email designs that save time and ensure consistency. Instead of writing every email from scratch, create templates for common scenarios and use personalization tokens that auto-fill with contact data.",
      whatItDoes: "Provides a library of saved templates with name, category, subject line, and preview. Templates support personalization tokens like {{firstName}}, {{company}}, {{title}} that are replaced with actual contact data when used.",
      howToUse: [
        "Click '+ New Template' to create a template with name, category, subject, and HTML body.",
        "Use personalization tokens: {{firstName}}, {{lastName}}, {{company}}, {{title}}.",
        "Organize templates by category for easy discovery.",
        "Duplicate existing templates to create variations quickly.",
      ],
      expectedOutcomes: [
        "Consistent, professional emails across your entire team.",
        "Faster campaign creation — no starting from scratch.",
        "New team members can send effective emails on day one.",
      ],
      bestPractices: [
        "Create templates for every stage: cold outreach, follow-up, proposal, negotiation, win-back.",
        "Keep templates short and focused — long emails get lower engagement.",
        "Test different versions using A/B Tests.",
        "Update templates based on campaign performance data.",
      ],
      commonMistakes: [
        "Using the same template for every audience — personalization matters.",
        "Forgetting to include unsubscribe links — required by law.",
        "Not testing templates before sending to large lists.",
      ],
      relatedPages: ["Campaigns", "A/B Tests", "Compliance Center"],
    },
  },
  {
    id: "deliverability",
    title: "Deliverability",
    icon: Shield,
    category: "Email Marketing",
    path: "/deliverability",
    summary: "Monitor domain health, SPF/DKIM/DMARC authentication, and blacklist status.",
    content: {
      overview: "The Deliverability page monitors the health of your 52 sending domains. It checks SPF, DKIM, and DMARC authentication, monitors blacklist status, and provides domain warm-up scheduling. This is your domain reputation command center.",
      whatItDoes: "Shows each domain with authentication status (SPF, DKIM, DMARC), blacklist status, and overall health score. Green indicators mean properly configured; red means action needed. Provides warm-up scheduling for new domains.",
      howToUse: [
        "Run authentication checks on any domain to verify SPF, DKIM, and DMARC.",
        "Check blacklist status across major blacklist providers.",
        "Set up warm-up schedules for new domains.",
        "Monitor overall domain health scores.",
      ],
      expectedOutcomes: [
        "All 52 domains showing green across SPF, DKIM, and DMARC.",
        "Zero blacklist entries across all domains.",
        "Maintained domain reputation for consistent inbox placement.",
      ],
      bestPractices: [
        "Check this page weekly.",
        "If any domain gets blacklisted, stop sending from it immediately.",
        "Keep DMARC policy at 'none' initially, then upgrade to 'quarantine' then 'reject'.",
        "Warm up new domains gradually — don't blast full volume on day one.",
      ],
      commonMistakes: [
        "Ignoring blacklist alerts — they compound quickly.",
        "Not checking authentication after DNS changes.",
        "Sending full volume from newly added domains.",
      ],
      relatedPages: ["Domain Stats", "SMTP Accounts", "Sender Settings"],
    },
  },
  {
    id: "smtp",
    title: "SMTP Accounts",
    icon: Zap,
    category: "Email Marketing",
    path: "/smtp-accounts",
    summary: "Manage 260 email sending addresses across 52 domains and 5 mail servers.",
    content: {
      overview: "SMTP Accounts manages your 260 email sending addresses across 52 domains. Each account connects to one of your 5 Contabo mail servers. The system rotates across all accounts when sending campaigns, distributing volume evenly.",
      whatItDoes: "Lists all configured SMTP accounts with email address, server host, port, daily send limit, today's send count, and status. Daily limits ensure no single address exceeds safe thresholds.",
      howToUse: [
        "Click '+ Add Account' to add an SMTP account with email, server, port, username, and password.",
        "Set daily send limits per account (recommended: ~385 per address for 100K daily total).",
        "Enable/disable accounts as needed.",
        "Monitor daily send counts to ensure even distribution.",
      ],
      expectedOutcomes: [
        "Even distribution across all 260 addresses and 52 domains.",
        "No single domain or IP overloaded.",
        "100K emails/day capacity with intelligent rotation.",
      ],
      bestPractices: [
        "Add all 260 accounts before starting campaigns.",
        "Start with conservative limits (200/address) and gradually increase.",
        "Monitor Domain Stats to ensure even distribution.",
        "Investigate any accounts showing errors immediately.",
      ],
      commonMistakes: [
        "Sending from only a few accounts — overloads those domains.",
        "Setting limits too high — risks domain reputation.",
        "Not testing SMTP connectivity before campaigns.",
      ],
      relatedPages: ["Campaigns", "Deliverability", "Domain Stats", "Sender Settings"],
    },
  },
  {
    id: "compliance",
    title: "Compliance Center",
    icon: ShieldCheck,
    category: "Compliance & Safety",
    path: "/compliance",
    summary: "CAN-SPAM, GDPR, and CCPA compliance validation with pre-send checking.",
    content: {
      overview: "The Compliance Center is your legal safety net. It ensures every email complies with CAN-SPAM, GDPR, and CCPA regulations. The pre-send validator checks for required elements and blocks non-compliant emails before they go out.",
      whatItDoes: "Provides compliance statistics, a pre-send checker tool, and an AI email analyzer. The audit log shows every compliance check with pass/fail results and specific issues found. Validates: physical address, unsubscribe link, subject line honesty, suppression list, and provider requirements.",
      howToUse: [
        "Run pre-send compliance checks on every email before sending.",
        "Use the AI analyzer for deeper content analysis with spam scoring.",
        "Review the audit log weekly for recurring issues.",
        "Configure your Sender Settings first (physical address, unsubscribe URL).",
      ],
      expectedOutcomes: [
        "100% legal compliance on every email sent.",
        "Zero risk of CAN-SPAM fines (up to $51,744 per violation).",
        "Protected domain reputation through proactive compliance.",
      ],
      bestPractices: [
        "Run compliance check on every campaign before sending.",
        "Set up Sender Settings first — the checker needs baseline data.",
        "Review audit log weekly to spot recurring issues.",
        "Keep your physical address and unsubscribe link current.",
      ],
      commonMistakes: [
        "Sending without compliance check — risking federal fines.",
        "Missing physical address in emails — CAN-SPAM violation.",
        "Broken unsubscribe links — CAN-SPAM violation.",
        "Deceptive subject lines — CAN-SPAM violation.",
      ],
      relatedPages: ["Suppression List", "Sender Settings", "Campaigns"],
    },
  },
  {
    id: "suppression",
    title: "Suppression List",
    icon: Ban,
    category: "Compliance & Safety",
    path: "/suppression",
    summary: "Automatic 'do not email' database for bounces, unsubscribes, and complaints.",
    content: {
      overview: "The Suppression List is your 'do not email' database. It contains every email address that should never receive another message — bounces, unsubscribes, complaints, and manually blocked addresses. The system automatically checks this list before every send.",
      whatItDoes: "Maintains a searchable list of suppressed emails with reason (Bounce, Unsubscribe, Complaint, Manual), source, and date. Statistics show breakdown by reason type. Automatic capture of bounces and unsubscribes.",
      howToUse: [
        "Add individual emails or bulk import suppression lists.",
        "Check if a specific email is suppressed.",
        "Review suppression statistics for list health indicators.",
        "Import historical suppression data from previous email tools.",
      ],
      expectedOutcomes: [
        "Clean sending lists protecting domain reputation.",
        "Bounce rate below 2% and complaint rate below 0.1%.",
        "Automatic capture of all bounces and unsubscribes.",
      ],
      bestPractices: [
        "Never remove a suppression entry unless absolutely certain it was added in error.",
        "Import existing suppression lists from previous tools before first campaign.",
        "Monitor suppression growth — rapid growth indicates list quality issues.",
      ],
      commonMistakes: [
        "Removing legitimate suppressions — damages reputation.",
        "Not importing historical data — re-sending to known bad addresses.",
        "Ignoring complaint suppressions — they indicate content problems.",
      ],
      relatedPages: ["Compliance Center", "Sender Settings", "Domain Stats"],
    },
  },
  {
    id: "paradigm",
    title: "Paradigm Pulse Dashboard",
    icon: Brain,
    category: "Paradigm Engine",
    path: "/paradigm",
    summary: "AI-powered prospecting command center aggregating all intelligence.",
    content: {
      overview: "Paradigm Pulse is your AI-powered prospecting command center. It aggregates all intelligence from the prospecting engine: active prospects, trigger signals, hot leads, engagement metrics, and AI activity. Manage by exception — the AI handles routine, you handle opportunities.",
      whatItDoes: "Displays key metrics: total prospects, verified leads, hot leads ready for handoff, active ghost sequences, and recent trigger signals. Highlights what needs attention: hot leads needing human touch, buying signals, and sequences needing review.",
      howToUse: [
        "Check Pulse first thing every morning.",
        "Click into hot leads for immediate action.",
        "Review trigger signals for new opportunities.",
        "Monitor ghost sequence performance.",
        "Use the pipeline funnel to track prospect flow.",
      ],
      expectedOutcomes: [
        "Efficient prospecting at scale — AI surfaces best opportunities.",
        "Steady flow of new prospects moving through verification to engagement.",
        "Focus shifts from finding leads to closing them.",
      ],
      bestPractices: [
        "Act on hot leads immediately — timing is everything.",
        "If verified lead count is low, review prospect sources.",
        "If engagement is dropping, review ghost sequence messaging.",
      ],
      commonMistakes: [
        "Ignoring the Pulse Dashboard — missing time-sensitive opportunities.",
        "Not acting on hot leads within 24 hours.",
        "Not reviewing signal feed regularly.",
      ],
      relatedPages: ["Prospects", "Signals", "Ghost Sequences", "Battle Cards", "Quantum Score"],
    },
  },
  {
    id: "prospects",
    title: "Prospects Pipeline",
    icon: Target,
    category: "Paradigm Engine",
    path: "/paradigm/prospects",
    summary: "Manage AI-discovered leads through the discovery-to-conversion pipeline.",
    content: {
      overview: "The Prospects page manages AI-discovered leads before they become full CRM contacts. Prospects flow through: Discovered → Verified → Profiled → Engaged → Converted. The AI handles discovery and verification; you handle high-value engagement and conversion.",
      whatItDoes: "Provides a filterable list of prospects with name, company, job title, email, engagement stage, verification status, and AI-computed score. AI actions available: Verify Email, Build Profile, Generate Battle Card, Draft Email, Promote to Contact.",
      howToUse: [
        "Create prospects manually or let the AI discover them.",
        "Run AI actions in order: Verify → Profile → Battle Card → Draft Email.",
        "Filter by stage to focus on specific pipeline segments.",
        "Promote verified, engaged prospects to full CRM contacts.",
      ],
      expectedOutcomes: [
        "Steady pipeline of verified, profiled prospects ready for outreach.",
        "AI handles research and verification heavy lifting.",
        "Target: 10+ new verified leads per day.",
      ],
      bestPractices: [
        "Never skip verification — sending to unverified emails damages reputation.",
        "Build profiles before drafting emails — personalization gets 3x higher response.",
        "Promote to contacts once genuine interest is shown.",
      ],
      commonMistakes: [
        "Sending to unverified emails — bounce rate spikes.",
        "Generic outreach without profiling — low response rates.",
        "Not promoting engaged prospects — they stay in limbo.",
      ],
      relatedPages: ["Paradigm Pulse", "Signals", "Ghost Sequences", "Battle Cards"],
    },
  },
  {
    id: "signals",
    title: "Trigger Signals",
    icon: Radar,
    category: "Paradigm Engine",
    path: "/paradigm/signals",
    summary: "Real-time monitoring of buying signals for perfectly timed outreach.",
    content: {
      overview: "The Sentinel monitors trigger signals — events indicating a prospect may be ready to buy. Job changes, company expansions, funding announcements, competitor complaints — these create perfect outreach timing.",
      whatItDoes: "Provides a real-time feed of trigger signals with type, priority level, associated prospect, and timestamp. High-priority signals are highlighted for immediate action.",
      howToUse: [
        "Review signals daily, prioritizing high-priority ones.",
        "Mark signals as actioned or dismissed.",
        "Link signals to prospects for context.",
        "Create outreach sequences tailored to specific signal types.",
      ],
      expectedOutcomes: [
        "Perfectly timed outreach based on real buying signals.",
        "Higher response rates through relevant, timely contact.",
        "Competitive advantage through signal-based selling.",
      ],
      bestPractices: [
        "Act on high-priority signals within 24 hours.",
        "Reference the specific signal in your outreach.",
        "Job changes are the #1 buying signal — prioritize them.",
      ],
      commonMistakes: [
        "Letting signals go stale — timing is everything.",
        "Not referencing the signal in outreach — misses the relevance.",
        "Treating all signals equally — prioritize by type and urgency.",
      ],
      relatedPages: ["Prospects", "Paradigm Pulse", "Ghost Sequences"],
    },
  },
  {
    id: "sequences",
    title: "Ghost Sequences",
    icon: Ghost,
    category: "Paradigm Engine",
    path: "/paradigm/sequences",
    summary: "Automated multi-step email follow-up sequences with smart stopping.",
    content: {
      overview: "Ghost Sequences are automated multi-step email follow-up sequences. Create a series of emails with delays between them. The system sends each step automatically, stopping when the prospect replies or shows positive intent.",
      whatItDoes: "Lists sequences with name, number of steps, status, and performance metrics. Each sequence shows enrolled prospects and response rate. Auto-stops when prospect replies.",
      howToUse: [
        "Create multi-step sequences with customizable delays.",
        "Example: Day 1: Introduction, Day 3: Value Prop, Day 7: Case Study, Day 14: Final Follow-up.",
        "Assign prospects to sequences.",
        "Monitor response rates and adjust messaging.",
      ],
      expectedOutcomes: [
        "Consistent follow-up without manual effort.",
        "15-25% response rates on well-crafted sequences.",
        "No prospect falls through the cracks.",
      ],
      bestPractices: [
        "Keep sequences to 4-6 steps maximum.",
        "Space steps out: Day 1, 3, 7, 14, 21.",
        "Each step should add new value — don't just say 'following up'.",
        "Reference prospect's industry, pain points, or signals.",
      ],
      commonMistakes: [
        "Too many steps — becomes annoying.",
        "Steps too close together — feels aggressive.",
        "Generic messaging — low response rates.",
        "Not monitoring and adjusting based on performance.",
      ],
      relatedPages: ["Prospects", "Templates", "Signals"],
    },
  },
  {
    id: "battlecards",
    title: "Battle Cards",
    icon: Flame,
    category: "Paradigm Engine",
    path: "/paradigm/battle-cards",
    summary: "AI-generated tactical summaries with talking points and objection handlers.",
    content: {
      overview: "Battle Cards are AI-generated one-page tactical summaries for your hottest prospects. They contain everything needed before a sales conversation: talking points, objection rebuttals, competitive positioning, and recommended approach.",
      whatItDoes: "Displays a gallery of battle cards with prospect name, company, urgency level, and read status. Each card expands to show talking points, objection handlers, and recommended next steps.",
      howToUse: [
        "Generate battle cards from the Prospect Detail page.",
        "Read cards before every sales conversation.",
        "Archive cards after use.",
        "Share cards with team members for collaborative selling.",
      ],
      expectedOutcomes: [
        "Every sales conversation is prepared and purposeful.",
        "20-30% higher close rates through preparation.",
        "Consistent messaging across your sales team.",
      ],
      bestPractices: [
        "Generate a fresh card before every important call.",
        "Review objection handlers carefully.",
        "Share cards with your team for collaborative selling.",
      ],
      commonMistakes: [
        "Going into calls without reviewing the battle card.",
        "Using outdated cards — regenerate for latest data.",
        "Not sharing cards with team members.",
      ],
      relatedPages: ["Prospects", "Prospect Detail", "Quantum Score"],
    },
  },
  {
    id: "quantum",
    title: "Quantum Score",
    icon: Sparkles,
    category: "Paradigm Engine",
    path: "/paradigm/quantum-score",
    summary: "12-dimension AI scoring system predicting conversion probability.",
    content: {
      overview: "Quantum Score evaluates every prospect across 12 dimensions: Firmographic, Behavioral, Engagement, Timing, Social, Content, Recency, Frequency, Monetary, Channel, Intent, and Relationship. It predicts conversion probability and recommends optimal outreach strategy.",
      whatItDoes: "Displays a radar chart of all 12 scores, overall grade (A+ through F), predicted conversion probability, estimated deal value, optimal contact time, and recommended channel. Plus AI-generated strengths, weaknesses, and actions.",
      howToUse: [
        "Calculate quantum scores for any prospect from their detail page.",
        "Sort prospects by total score to prioritize your pipeline.",
        "Focus on A and B grade prospects for manual outreach.",
        "Use automated sequences for C and D prospects.",
      ],
      expectedOutcomes: [
        "Data-driven prospect prioritization.",
        "30-40% improvement in conversion rates.",
        "Optimal resource allocation — right effort on right prospects.",
      ],
      bestPractices: [
        "Score all prospects and sort by total score.",
        "Focus manual effort on A and B grades.",
        "Re-score monthly — scores change as new data comes in.",
      ],
      commonMistakes: [
        "Spending equal time on all prospects regardless of score.",
        "Not re-scoring after new interactions.",
        "Ignoring the recommended channel and timing.",
      ],
      relatedPages: ["Prospects", "Battle Cards", "Paradigm Pulse"],
    },
  },
  {
    id: "workflows",
    title: "Automation Workflows",
    icon: GitBranch,
    category: "Automation",
    path: "/workflows",
    summary: "Trigger-based automation for lead nurturing and sales processes.",
    content: {
      overview: "Workflows automate repetitive tasks. Set up trigger-based actions that fire automatically — when a contact is created, a deal moves stages, or an email is opened. This saves hours of manual work weekly.",
      whatItDoes: "Lists automation workflows with name, trigger type, status (Active/Paused/Draft), and execution count. Each workflow has a trigger, conditions, and actions.",
      howToUse: [
        "Create workflows with a trigger (e.g., 'New Contact Created').",
        "Add conditions (e.g., 'Lead Status = New Shipper Lead').",
        "Define actions (e.g., 'Send Welcome Email', 'Create Follow-up Task').",
        "Monitor execution counts to verify workflows fire correctly.",
      ],
      expectedOutcomes: [
        "No lead falls through the cracks.",
        "Consistent follow-up processes.",
        "Team focuses on high-value activities.",
      ],
      bestPractices: [
        "Start simple and add complexity over time.",
        "Best first workflow: New Lead → Welcome Email → Follow-up Task.",
        "Monitor execution counts regularly.",
      ],
      commonMistakes: [
        "Overly complex workflows that are hard to debug.",
        "Not testing workflows before activating.",
        "Forgetting to pause workflows during system maintenance.",
      ],
      relatedPages: ["Segments", "Campaigns", "Tasks"],
    },
  },
  {
    id: "segments",
    title: "Smart Segments",
    icon: Filter,
    category: "Automation",
    path: "/segments",
    summary: "Dynamic and static contact lists based on filter rules for targeted campaigns.",
    content: {
      overview: "Segments create smart lists of contacts based on criteria. Define rules (e.g., 'Industry = Manufacturing AND Lead Status = Active') and the segment auto-updates as contacts match or unmatch.",
      whatItDoes: "Lists segments with name, type (Dynamic/Static), member count, and last refresh. Dynamic segments auto-update; static segments are manually curated.",
      howToUse: [
        "Create segments with filter rules based on any contact field.",
        "Use dynamic segments for auto-updating lists.",
        "Use static segments for manually curated lists.",
        "Target segments in email campaigns for better results.",
      ],
      expectedOutcomes: [
        "Highly targeted campaigns that speak to each audience.",
        "3-5x better performance than blast-to-all approaches.",
        "Automatic list maintenance through dynamic rules.",
      ],
      bestPractices: [
        "Create segments for each customer type: TL shippers, LTL shippers, manufacturers, distributors.",
        "Create engagement segments: 'Opened last 3 emails', 'No engagement in 30 days'.",
        "Use engagement segments to clean lists and protect reputation.",
      ],
      commonMistakes: [
        "Sending to entire list instead of targeted segments.",
        "Not creating engagement-based segments for list hygiene.",
        "Overly broad segments that don't improve targeting.",
      ],
      relatedPages: ["Campaigns", "Contacts", "Workflows"],
    },
  },
  {
    id: "analytics",
    title: "Analytics & Reports",
    icon: BarChart3,
    category: "Analytics",
    path: "/analytics",
    summary: "Deep insight into CRM performance with trends and benchmarks.",
    content: {
      overview: "Analytics provides deep insight into CRM performance. Track contact growth, deal pipeline health, campaign effectiveness, and team productivity. Data helps you make informed decisions.",
      whatItDoes: "Displays key metrics: total contacts, active deals, pipeline value, campaign performance (open/click rates), and task completion rates. Charts show trends over time.",
      howToUse: [
        "Review key performance indicators weekly.",
        "Identify trends and drill down into specific metrics.",
        "Use data to adjust sales strategy.",
        "Compare week-over-week performance.",
      ],
      expectedOutcomes: [
        "Data-driven decision making.",
        "Healthy benchmarks: open rates >20%, click rates >2%, bounce rates <2%, close rates >15%.",
        "Continuous improvement through measurement.",
      ],
      bestPractices: [
        "Review Analytics weekly.",
        "Compare this week to last week.",
        "Investigate significant metric drops immediately.",
      ],
      commonMistakes: [
        "Only checking analytics monthly — miss trends.",
        "Not acting on declining metrics.",
        "Focusing on vanity metrics instead of conversion rates.",
      ],
      relatedPages: ["Dashboard", "Campaigns", "Deals"],
    },
  },
  {
    id: "sender-settings",
    title: "Sender Settings",
    icon: Settings,
    category: "Compliance & Safety",
    path: "/sender-settings",
    summary: "Configure company identity, throttle limits, and compliance defaults.",
    content: {
      overview: "Sender Settings configure the foundational elements of your email sending: company identity, default sender info, unsubscribe handling, and per-provider throttling limits. These settings apply to every email sent.",
      whatItDoes: "Two sections: Company Information (name, physical address, privacy policy URL, unsubscribe URL) and Sending Limits (throttle rates per provider, maximum bounce/complaint thresholds).",
      howToUse: [
        "Set your company name and physical mailing address (required by CAN-SPAM).",
        "Configure unsubscribe URL and privacy policy URL.",
        "Set per-provider throttle limits (Outlook: 8-10/min, Gmail: 15-20/min).",
        "Set max bounce rate (2%) and complaint rate (0.1%) thresholds.",
      ],
      expectedOutcomes: [
        "Every email automatically includes physical address and unsubscribe link.",
        "Throttle limits prevent overwhelming any provider.",
        "Rate thresholds auto-pause sending if reputation is at risk.",
      ],
      bestPractices: [
        "Configure this page FIRST before sending any emails.",
        "Outlook is strictest — set throttle to 8-10/min.",
        "Set conservative thresholds initially.",
      ],
      commonMistakes: [
        "Sending emails before configuring sender settings.",
        "Setting throttle limits too high for Outlook.",
        "Not setting up unsubscribe URL.",
      ],
      relatedPages: ["Compliance Center", "SMTP Accounts", "Domain Stats"],
    },
  },
  {
    id: "domain-stats",
    title: "Domain Stats",
    icon: Globe,
    category: "Compliance & Safety",
    path: "/domain-stats",
    summary: "Per-domain sending analytics with provider-specific breakdowns.",
    content: {
      overview: "Domain Stats tracks sending performance of each of your 52 domains individually. Shows sent volume, bounce rates, complaint rates, and provider-specific breakdowns. Identify which domains perform well and which need attention.",
      whatItDoes: "Per-domain metrics: total sent, delivered, bounced, complained, and unsubscribed with percentages. Provider breakdown shows performance with Gmail, Outlook, Yahoo separately.",
      howToUse: [
        "Monitor each domain's health metrics after campaigns.",
        "Identify domains with high bounce or complaint rates.",
        "Compare provider-specific performance.",
        "Pause underperforming domains and increase volume on healthy ones.",
      ],
      expectedOutcomes: [
        "Full visibility into sending infrastructure health.",
        "Each domain: bounce rate <2%, complaint rate <0.1%, delivery >95%.",
        "Data-driven domain rotation decisions.",
      ],
      bestPractices: [
        "Review after every major campaign.",
        "Investigate bounce rate spikes immediately.",
        "Rotate domains evenly to prevent overwork.",
      ],
      commonMistakes: [
        "Not monitoring individual domain performance.",
        "Continuing to send from domains with high bounce rates.",
        "Uneven domain rotation — some overworked, some idle.",
      ],
      relatedPages: ["Deliverability", "SMTP Accounts", "Sender Settings"],
    },
  },
  {
    id: "ab-tests",
    title: "A/B Testing",
    icon: FlaskConical,
    category: "Email Marketing",
    path: "/ab-tests",
    summary: "Scientific email optimization through controlled variant testing.",
    content: {
      overview: "A/B Testing lets you scientifically determine what works best in your emails. Test subject lines, content, send times, or sender names. The system splits your audience and measures which version performs better.",
      whatItDoes: "Lists A/B tests with name, type, status, and results. Completed tests show winning variant with statistical confidence.",
      howToUse: [
        "Create tests with two variants (A and B) of your email element.",
        "Set test audience size (10-20% of list).",
        "System sends both versions and measures performance.",
        "Send winning version to the rest of your list.",
      ],
      expectedOutcomes: [
        "Continuous improvement in email performance.",
        "Data-backed decisions on subject lines, content, and timing.",
        "Compounding improvements over time.",
      ],
      bestPractices: [
        "Test one variable at a time for clear results.",
        "Subject lines have biggest impact — start there.",
        "Use 1,000+ per variant for statistical significance.",
      ],
      commonMistakes: [
        "Testing multiple variables simultaneously — unclear results.",
        "Sample sizes too small for significance.",
        "Not applying learnings to future campaigns.",
      ],
      relatedPages: ["Campaigns", "Templates", "Analytics"],
    },
  },
];

const categories = Array.from(new Set(manualSections.map(s => s.category)));

function SectionCard({ section, expanded, onToggle }: { section: ManualSection; expanded: boolean; onToggle: () => void }) {
  const [, setLocation] = useLocation();
  const Icon = section.icon;

  return (
    <Card className={`transition-all ${expanded ? "border-primary/30 shadow-lg" : "hover:border-primary/20"}`}>
      <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={onToggle}>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{section.title}</h3>
            <Badge variant="secondary" className="text-[10px]">{section.category}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{section.summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={(e) => { e.stopPropagation(); setLocation(section.path); }}
          >
            Go to page <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <CardContent className="pt-0 pb-5 px-4 space-y-4">
          <div className="border-t border-border/50 pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{section.content.overview}</p>
          </div>

          <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
            <h4 className="text-xs font-semibold text-blue-400 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> What It Does
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{section.content.whatItDoes}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
              <h4 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> How to Use
              </h4>
              <ul className="space-y-1.5">
                {section.content.howToUse.map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-emerald-500 shrink-0">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3">
              <h4 className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" /> Expected Outcomes
              </h4>
              <ul className="space-y-1.5">
                {section.content.expectedOutcomes.map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-purple-500 shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
              <h4 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" /> Best Practices
              </h4>
              <ul className="space-y-1.5">
                {section.content.bestPractices.map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-amber-500 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
              <h4 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Common Mistakes
              </h4>
              <ul className="space-y-1.5">
                {section.content.commonMistakes.map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-red-500 shrink-0">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Related:</span>
            {section.content.relatedPages.map((page) => {
              const related = manualSections.find(s => s.title === page);
              return (
                <Badge
                  key={page}
                  variant="outline"
                  className="text-[10px] cursor-pointer hover:bg-primary/10"
                  onClick={() => related && setLocation(related.path)}
                >
                  {page}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = manualSections;
    if (activeCategory !== "all") {
      result = result.filter(s => s.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.content.overview.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, activeCategory]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Help Center & Instruction Manual
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete guide to every feature in Apex CRM. Click any section to learn what it does, how to use it, and what to expect.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{manualSections.length}</p>
            <p className="text-xs text-muted-foreground">Feature Guides</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{categories.length}</p>
            <p className="text-xs text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{manualSections.reduce((acc, s) => acc + s.content.bestPractices.length, 0)}</p>
            <p className="text-xs text-muted-foreground">Best Practices</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{manualSections.reduce((acc, s) => acc + s.content.commonMistakes.length, 0)}</p>
            <p className="text-xs text-muted-foreground">Pitfalls to Avoid</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search guides... (e.g., 'campaigns', 'compliance', 'prospects')"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="bg-secondary/30 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="text-xs">All ({manualSections.length})</TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="text-xs">
              {cat} ({manualSections.filter(s => s.category === cat).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Section List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="bg-card">
            <CardContent className="p-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No guides match your search. Try different keywords.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map(section => (
            <SectionCard
              key={section.id}
              section={section}
              expanded={expandedId === section.id}
              onToggle={() => setExpandedId(expandedId === section.id ? null : section.id)}
            />
          ))
        )}
      </div>

      {/* Getting Started Guide */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-400" />
            Quick Start Guide — First Day Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { step: 1, title: "Configure Sender Settings", desc: "Set your company name, physical address, and unsubscribe URL. This is required by CAN-SPAM law.", path: "/sender-settings" },
            { step: 2, title: "Add SMTP Accounts", desc: "Configure your 260 email addresses across 52 domains. Set daily limits to ~385 per address.", path: "/smtp-accounts" },
            { step: 3, title: "Verify Domain Health", desc: "Check that all 52 domains have SPF, DKIM, and DMARC properly configured. Fix any issues.", path: "/deliverability" },
            { step: 4, title: "Import Contacts & Companies", desc: "Add your existing contacts and companies. Fill in as many fields as possible for better targeting.", path: "/contacts" },
            { step: 5, title: "Create Your First Segment", desc: "Build a targeted list (e.g., 'Manufacturers in Texas') for your first campaign.", path: "/segments" },
            { step: 6, title: "Build Email Templates", desc: "Create reusable templates for cold outreach, follow-ups, and proposals.", path: "/templates" },
            { step: 7, title: "Run Compliance Check", desc: "Test your first email through the Compliance Center to ensure legal compliance.", path: "/compliance" },
            { step: 8, title: "Launch First Campaign", desc: "Send your first targeted campaign to a small segment. Monitor results closely.", path: "/campaigns" },
            { step: 9, title: "Activate Paradigm Engine", desc: "Start AI prospecting to discover new leads automatically.", path: "/paradigm" },
            { step: 10, title: "Set Up Automation", desc: "Create workflows to automate follow-ups and lead nurturing.", path: "/workflows" },
          ].map((item) => (
            <QuickStartStep key={item.step} {...item} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function QuickStartStep({ step, title, desc, path }: { step: number; title: string; desc: string; path: string }) {
  const [, setLocation] = useLocation();
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 cursor-pointer transition-colors"
      onClick={() => setLocation(path)}
    >
      <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-primary">{step}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
    </div>
  );
}
