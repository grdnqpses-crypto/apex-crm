import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Search, Users, Building2, Kanban, ListChecks, Send, Mail, Shield,
  FlaskConical, Zap, GitBranch, Filter, BarChart3, Key, Webhook,
  Brain, Target, Radar, Ghost, Flame, Plug, Sparkles,
  ShieldCheck, Ban, Settings, Globe, ChevronDown, ChevronRight,
  Lightbulb, AlertTriangle, CheckCircle2, ArrowRight,
  Truck, Package, FileText, Phone, Bot, Wand2, Eye,
  TrendingUp, Award, Rocket, Heart, Star, Crown,
  MessageSquare, Layers, Database, Clock, RefreshCw, UserCheck,
} from "lucide-react";
import { useLocation } from "wouter";

/* ─────────────────────── Types ─────────────────────── */
interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  category: string;
  path: string;
  tagline: string;
  overview: string;
  capabilities: string[];
  workflow: string[];
  proTips: string[];
  pitfalls: string[];
  related: string[];
}

/* ─────────────────────── Data ─────────────────────── */
const guides: GuideSection[] = [
  // ── GETTING STARTED ──
  {
    id: "dashboard", title: "Dashboard", icon: BarChart3, category: "Getting Started", path: "/",
    tagline: "Your real-time command center — every metric, every opportunity, one glance.",
    overview: "The Dashboard is the nerve center of Apex CRM. The moment you log in, you see live counts for companies, contacts, open deals, pipeline value, won/lost deals, pending tasks, active campaigns, and AI prospects. Six color-coded sections — CRM Core, Performance, Email Operations, Paradigm Engine, Freight Operations, and a Recent Activity feed — give you a 360° pulse on your business. Every card is clickable, so you can drill into any metric instantly.",
    capabilities: ["Live KPI cards across 6 business domains", "Recent Activity feed with 12 latest interactions", "Quick Actions for one-click company/deal/campaign/task creation", "System Status panel showing health of all subsystems", "Color-coded section headers with contextual descriptions"],
    workflow: ["Check Dashboard every morning — it's your early warning system", "Click any metric card to drill into that section", "Use Quick Actions to create records without navigating away", "Scroll to Recent Activity to see what happened while you were away", "Monitor System Status to ensure all engines are running"],
    proTips: ["If pipeline value drops, investigate stalled deals immediately", "Rising pending tasks = team is overloaded — redistribute or prioritize", "Use the AI Assistant (orange button, bottom-right) to ask about any metric"],
    pitfalls: ["Ignoring the Dashboard and working in silos — you miss the big picture", "Not acting on declining metrics until they become critical"],
    related: ["Companies", "Contacts", "Deals", "Tasks", "AI Assistant"],
  },
  {
    id: "ai-assistant", title: "AI Assistant", icon: Sparkles, category: "Getting Started", path: "/",
    tagline: "Your personal CRM copilot — ask anything, command anything, instantly.",
    overview: "The Apex AI Assistant is a fully integrated copilot that lives in every page of the CRM. Click the orange sparkle button in the bottom-right corner to open it. It knows every feature, every workflow, and every data point in your CRM. Ask it questions ('How many open deals do I have?') or give it commands ('Add a company called Acme Logistics in Transportation') — it executes immediately and confirms the result. It can create contacts, companies, deals, tasks, campaigns, templates, segments, log activities, search your data, and provide analytics summaries — all through natural conversation.",
    capabilities: ["Create companies, contacts, deals, tasks, campaigns, templates, segments", "Log activities (notes, calls, emails, meetings) on any contact", "Search across all entities — contacts, companies, deals, tasks", "Provide pipeline summaries and analytics on demand", "Import/bulk-create contacts from a list", "Update or delete existing records", "Answer questions about any CRM feature or workflow"],
    workflow: ["Click the orange sparkle button on any page to open the AI panel", "Type a question or command in natural language", "The AI executes immediately — no confirmation dialogs, no friction", "See action confirmations with green badges showing what was created", "Ask follow-up questions to refine or continue your workflow"],
    proTips: ["Say 'Add a company called X in Y industry' — it creates it instantly", "Say 'Show my pipeline summary' — it pulls live data and summarizes", "Say 'Log a call with John at Acme — discussed Q2 pricing' — done", "The AI remembers your conversation context within the session", "Use it for bulk operations: 'Create 5 tasks for follow-ups this week'"],
    pitfalls: ["Don't forget to specify the company when creating contacts — it's required", "The AI can delete records — be specific about what you want removed"],
    related: ["Dashboard", "Companies", "Contacts", "Deals", "Tasks"],
  },
  // ── CRM CORE ──
  {
    id: "companies", title: "Companies", icon: Building2, category: "CRM Core", path: "/companies",
    tagline: "Your primary entity — every contact, deal, and activity belongs to a company.",
    overview: "Companies are the foundation of Apex CRM's architecture. Every contact must belong to a company, every deal is linked through a contact to a company, and every activity rolls up to the company level. This company-first design gives you true account-based selling. The Companies page shows a searchable, sortable table with aggregate metrics — contact count, open deals, pipeline value, and status — so you can instantly see which accounts need attention.",
    capabilities: ["Searchable table with 40+ fields per company", "Aggregate metrics: contact count, open deals, pipeline value per company", "Status tracking: Cold, Warm, Hot, Customer, Churned", "Logistics fields: MC/DOT numbers, fleet size, equipment types, service areas", "Cascade delete: removing a company removes all its contacts and activities", "Quick Add Company from the contact creation dialog"],
    workflow: ["Click '+ Add Company' to create a new company record", "Fill in name, industry, website, and any logistics-specific data", "Click any company row to view its full profile with contacts and deals", "Use the search bar to find companies by name or domain", "Monitor the Contacts and Open Deals columns for account health"],
    proTips: ["Always create the company first, then add contacts to it", "Fill in MC/DOT numbers for freight companies — essential for verification", "Use the aggregate metrics columns to prioritize high-value accounts", "The AI Assistant can create companies instantly: 'Add a company called...'"],
    pitfalls: ["Deleting a company deletes ALL its contacts — this is by design but irreversible", "Duplicate companies fragment your data — search before creating"],
    related: ["Contacts", "Company Detail", "Deals", "AI Assistant"],
  },
  {
    id: "contacts", title: "Contacts", icon: Users, category: "CRM Core", path: "/contacts",
    tagline: "Every person your business interacts with — 50+ fields, full activity timeline.",
    overview: "The Contacts page is where relationships live. Every person — prospect, customer, partner, vendor — has a rich profile with 50+ fields covering identity, communication preferences, address, lifecycle stage, marketing attribution, social profiles, and logistics-specific data. Every contact must belong to a company (company-first architecture), ensuring clean data and account-based workflows. The table supports search, filtering by stage and lead status, import/export, and one-click access to full 360° profiles.",
    capabilities: ["50+ fields per contact organized into logical sections", "Search by name, email, phone across all contacts", "Filter by lifecycle stage and lead status (27 logistics-specific statuses)", "Import contacts from CSV with automatic company matching", "Export contacts for external use", "Quick Add Company inline when creating a contact", "Full activity timeline on each contact's detail page"],
    workflow: ["Click '+ Add Contact' — select or create a company first", "Fill in name, email, phone, and lead status at minimum", "Click any contact row for the full 360° profile", "Use the Activities tab to log calls, emails, meetings, and notes", "Filter by lead status to focus on hot leads or qualified prospects"],
    proTips: ["Always set Lead Status — it drives your entire pipeline", "Log every interaction in Activities — the timeline becomes invaluable", "Use the Quick Add Company button if the company doesn't exist yet", "The AI can create contacts: 'Add John Smith at Acme Logistics, email john@acme.com'"],
    pitfalls: ["Creating contacts without email addresses — they can't receive campaigns", "Not logging activities — the timeline becomes useless", "Duplicate contacts — always search before creating"],
    related: ["Companies", "Contact Detail", "Campaigns", "Segments"],
  },
  {
    id: "deals", title: "Deals Pipeline", icon: Kanban, category: "CRM Core", path: "/deals",
    tagline: "Your visual pipeline — move deals across stages from first contact to closed-won.",
    overview: "The Deals page is a visual Kanban board where every active opportunity lives as a card. Columns represent pipeline stages (Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost). Each card shows the deal name, value, priority, and associated contact. Multiple pipelines let you separate different business lines. The header shows live stats: open deal count and total pipeline value.",
    capabilities: ["Kanban board with drag-and-drop stage management", "Multiple pipelines with custom stages", "Deal cards showing value, priority, and contact info", "Pipeline-level metrics: open deals count, total pipeline value", "Create custom pipelines for different business lines", "Deal detail view with full history and notes"],
    workflow: ["Click '+ Add Deal' with name, value, stage, contact, and expected close date", "Move deals between columns as they progress", "Click the '...' menu on any deal card for quick actions", "Use the pipeline dropdown to switch between business lines", "Create new pipelines with custom stages for different workflows"],
    proTips: ["Update deal stages promptly — stale pipelines give false forecasts", "Associate every deal with both a contact and a company", "Review your pipeline weekly to identify stalled deals", "The AI can create deals: 'Create a $50K deal called Q2 Renewal'"],
    pitfalls: ["Leaving deals in the same stage for weeks", "Not setting deal values — pipeline metrics become meaningless", "Creating deals without contact associations"],
    related: ["Contacts", "Companies", "Tasks", "Analytics"],
  },
  {
    id: "tasks", title: "Task Management", icon: ListChecks, category: "CRM Core", path: "/tasks",
    tagline: "Never miss a follow-up — track calls, emails, to-dos with queues and reminders.",
    overview: "Tasks keep your team organized and accountable. Every follow-up call, email to send, meeting to schedule, or to-do item lives here. Tasks can be linked to contacts, companies, and deals. Organize them into queues (Prospecting Calls, Customer Renewals, etc.), set priorities, due dates, and reminders. The page shows pending vs completed counts and supports filtering by status, type, and queue.",
    capabilities: ["Task cards with title, type, priority, due date, and queue", "Filter by status, type, and queue", "Checkbox completion with outcome notes", "Link tasks to contacts, companies, or deals", "Recurring task support", "Overdue task highlighting", "Task Management Guide banner with tips"],
    workflow: ["Click '+ Add Task' with title, type, priority, due date, and queue", "Associate tasks with contacts or companies for context", "Check off tasks as you complete them", "Use filters to focus on specific queues or overdue items", "Review the pending/completed counter for productivity tracking"],
    proTips: ["Batch similar tasks into queues for efficient processing", "Set reminders for time-sensitive follow-ups", "Use the AI: 'Create a task to follow up with John next Tuesday'", "Mark tasks complete with notes about the outcome"],
    pitfalls: ["Creating tasks without due dates — they become invisible", "Not linking tasks to contacts — you lose context", "Letting the pending count grow unchecked"],
    related: ["Contacts", "Companies", "Deals", "Workflows"],
  },
  // ── EMAIL MARKETING ──
  {
    id: "campaigns", title: "Campaigns", icon: Send, category: "Email Marketing", path: "/campaigns",
    tagline: "Launch targeted email campaigns with templates, segments, and real-time analytics.",
    overview: "Campaigns are the execution layer of your email marketing. Each campaign combines a template, a segment (audience), sender settings, and scheduling into a single deliverable. Track open rates, click rates, bounces, and unsubscribes in real-time. The campaign list shows status, send date, and key metrics at a glance.",
    capabilities: ["Create campaigns with template + segment + sender", "Schedule sends or launch immediately", "Real-time metrics: opens, clicks, bounces, unsubscribes", "Campaign status tracking: Draft, Scheduled, Sending, Sent, Paused", "Duplicate campaigns for quick iteration", "A/B test integration for subject line optimization"],
    workflow: ["Create a segment (audience) first", "Build or select an email template", "Click '+ Create Campaign' and configure subject, sender, template, segment", "Preview and test before sending", "Launch and monitor real-time metrics"],
    proTips: ["Always send a test email to yourself first", "Start with small segments to validate deliverability", "Use A/B testing on subject lines for 20-30% better open rates", "The AI can create campaigns: 'Create a campaign called Q1 Outreach'"],
    pitfalls: ["Sending to unsegmented lists — low engagement, high unsubscribes", "Not testing emails before sending — broken layouts damage credibility", "Ignoring bounce rates — they affect domain reputation"],
    related: ["Templates", "Segments", "Deliverability", "A/B Tests"],
  },
  {
    id: "templates", title: "Email Templates", icon: Mail, category: "Email Marketing", path: "/templates",
    tagline: "Reusable email designs — build once, personalize infinitely, deploy everywhere.",
    overview: "Templates are your email building blocks. Create rich HTML email designs with personalization tokens ({{firstName}}, {{companyName}}) that auto-fill for each recipient. Organize templates by category (Cold Outreach, Follow-up, Proposal, Newsletter) and reuse them across campaigns. The template editor supports HTML with live preview.",
    capabilities: ["HTML email editor with live preview", "Personalization tokens for dynamic content", "Category organization for easy retrieval", "Template duplication for quick variants", "Subject line included with each template", "Used-in-campaigns tracking"],
    workflow: ["Click '+ Create Template' with name, subject, category, and HTML content", "Use personalization tokens: {{firstName}}, {{companyName}}, {{title}}", "Preview the template to verify layout and personalization", "Assign templates to campaigns for sending", "Duplicate and modify templates for A/B testing"],
    proTips: ["Keep subject lines under 50 characters for mobile", "Use personalization in the first line — it doubles open rates", "Create a template library: cold outreach, follow-up, proposal, re-engagement", "The AI can create templates: 'Create a cold outreach template for shippers'"],
    pitfalls: ["Forgetting to test on mobile — 60% of emails are read on phones", "Using too many images — they get blocked by email clients", "Not including an unsubscribe link — CAN-SPAM violation"],
    related: ["Campaigns", "Segments", "A/B Tests", "Compliance Center"],
  },
  {
    id: "segments", title: "Segments", icon: Filter, category: "Email Marketing", path: "/segments",
    tagline: "Precision targeting — slice your audience by any criteria for laser-focused campaigns.",
    overview: "Segments let you create targeted audiences from your contact database using filter rules. Build segments based on lead status, industry, location, engagement level, or any contact field. Segments are dynamic — they automatically update as contacts match or unmatch your criteria. Use them as the audience for campaigns, sequences, and workflows.",
    capabilities: ["Dynamic segments that auto-update as contacts change", "Filter by any contact or company field", "Multiple filter rules with AND/OR logic", "Segment size preview before saving", "Direct use in campaigns and sequences", "Segment health monitoring"],
    workflow: ["Click '+ Create Segment' with name and filter rules", "Add conditions: field + operator + value", "Preview segment size to validate your targeting", "Save and use in campaigns or sequences", "Monitor segment growth over time"],
    proTips: ["Start narrow and expand — a 500-person segment outperforms a 50,000 blast", "Create segments for each stage of your funnel", "Use company industry + contact role for B2B targeting", "The AI can create segments: 'Create a segment of hot leads in Texas'"],
    pitfalls: ["Segments too broad — low engagement, high unsubscribes", "Not refreshing segment criteria as your business evolves", "Overlapping segments causing duplicate sends"],
    related: ["Campaigns", "Contacts", "Workflows", "Analytics"],
  },
  {
    id: "deliverability", title: "Deliverability", icon: Shield, category: "Email Marketing", path: "/deliverability",
    tagline: "Protect your sender reputation — monitor SPF, DKIM, DMARC across all domains.",
    overview: "Deliverability is your email health dashboard. It monitors SPF, DKIM, and DMARC configuration across all your sending domains, tracks bounce rates, spam complaints, and inbox placement. A healthy deliverability score means your emails reach inboxes instead of spam folders. This page is your first stop when email performance drops.",
    capabilities: ["Domain health monitoring: SPF, DKIM, DMARC status", "Bounce rate and spam complaint tracking", "Inbox placement estimates", "Domain-by-domain breakdown", "Actionable fix recommendations", "Historical trend tracking"],
    workflow: ["Check Deliverability weekly — it's your email immune system", "Fix any domains showing red (failed) authentication", "Monitor bounce rates — keep under 2%", "Address spam complaints immediately — keep under 0.1%", "Use Domain Optimizer for advanced domain rotation"],
    proTips: ["Set up all three: SPF + DKIM + DMARC — missing any one hurts deliverability", "Warm up new domains gradually — don't blast 10,000 emails on day one", "Rotate sending across multiple domains to spread reputation risk"],
    pitfalls: ["Ignoring authentication failures — emails go straight to spam", "Sending from a single domain — one complaint tanks everything", "Not monitoring bounce rates — ISPs blacklist high-bounce senders"],
    related: ["SMTP Accounts", "Domain Optimizer", "Sender Settings", "Email Warmup"],
  },
  {
    id: "smtp", title: "SMTP Accounts", icon: Settings, category: "Email Marketing", path: "/smtp-accounts",
    tagline: "Configure your sending infrastructure — email addresses, daily limits, domain rotation.",
    overview: "SMTP Accounts are your email sending infrastructure. Each account represents an email address configured to send through your SMTP server. Set daily sending limits per address, organize by domain, and let the system rotate across accounts automatically. This is the engine room of your email operations.",
    capabilities: ["Add and manage SMTP email accounts", "Set daily sending limits per account", "Domain-based organization", "Automatic rotation across accounts", "Health status monitoring per account", "Bulk import of SMTP configurations"],
    workflow: ["Add SMTP accounts with server, port, username, password", "Set daily limits (recommended: ~385 per address)", "Organize accounts by domain for rotation", "Monitor account health for bounces or blocks", "Replace underperforming accounts as needed"],
    proTips: ["Spread sending across many accounts — 50+ is ideal for high volume", "Set conservative daily limits initially, increase as reputation builds", "Monitor each account's bounce rate individually"],
    pitfalls: ["Sending too much from one account — it gets flagged", "Not rotating domains — single point of failure", "Ignoring blocked accounts — they drag down overall deliverability"],
    related: ["Deliverability", "Domain Optimizer", "Campaigns", "Email Warmup"],
  },
  {
    id: "ab-tests", title: "A/B Testing", icon: FlaskConical, category: "Email Marketing", path: "/ab-tests",
    tagline: "Scientific email optimization — test subject lines, content, and timing.",
    overview: "A/B Testing lets you scientifically determine what works best. Test subject lines, email content, send times, or sender names. The system splits your audience, sends both variants, measures performance, and declares a winner. Apply learnings to every future campaign for compounding improvements.",
    capabilities: ["Test subject lines, content, send times, sender names", "Automatic audience splitting", "Statistical significance calculation", "Winner auto-selection", "Results with confidence intervals", "Historical test archive"],
    workflow: ["Create a test with two variants (A and B)", "Set test audience size (10-20% of your list)", "System sends both versions and measures opens/clicks", "Winner is sent to the remaining audience", "Review results and apply learnings to future campaigns"],
    proTips: ["Test one variable at a time for clear results", "Subject lines have the biggest impact — start there", "Need 1,000+ per variant for statistical significance", "Run tests consistently — small improvements compound dramatically"],
    pitfalls: ["Testing multiple variables at once — unclear which caused the difference", "Sample sizes too small — results aren't statistically valid", "Not applying learnings to future campaigns"],
    related: ["Campaigns", "Templates", "Analytics"],
  },
  // ── COMPLIANCE & SAFETY ──
  {
    id: "compliance", title: "Compliance Center", icon: ShieldCheck, category: "Compliance & Safety", path: "/compliance",
    tagline: "Stay legal — CAN-SPAM, GDPR, and CCPA compliance checking for every email.",
    overview: "The Compliance Center is your legal safety net. Before any email goes out, run it through compliance checks for CAN-SPAM, GDPR, and CCPA requirements. The system checks for required elements (physical address, unsubscribe link, sender identification) and flags potential violations before they become fines.",
    capabilities: ["CAN-SPAM compliance checking", "GDPR consent verification", "CCPA opt-out compliance", "Required element validation (address, unsubscribe)", "Pre-send compliance scoring", "Violation history and audit trail"],
    workflow: ["Run compliance check before every campaign launch", "Fix any flagged issues before sending", "Maintain consent records for GDPR compliance", "Monitor violation history for patterns", "Update physical address and unsubscribe URLs in Sender Settings"],
    proTips: ["Make compliance checking a mandatory step in your campaign workflow", "Keep consent records up to date — GDPR audits can happen anytime", "Use the Suppression List to honor all opt-out requests immediately"],
    pitfalls: ["Skipping compliance checks — fines can reach $46,517 per violation", "Not honoring unsubscribe requests within 10 days", "Missing physical address in emails — required by CAN-SPAM"],
    related: ["Suppression List", "Sender Settings", "Campaigns"],
  },
  {
    id: "suppression", title: "Suppression List", icon: Ban, category: "Compliance & Safety", path: "/suppression",
    tagline: "Honor every opt-out — automatically prevent sending to unsubscribed addresses.",
    overview: "The Suppression List is your do-not-contact registry. Every unsubscribe, bounce, and spam complaint automatically adds the address here. The system checks this list before every send, ensuring you never email someone who opted out. You can also manually add addresses for legal or business reasons.",
    capabilities: ["Automatic addition from unsubscribes and bounces", "Manual address addition", "Reason tracking (unsubscribe, bounce, complaint, manual)", "Pre-send filtering across all campaigns", "Bulk import of suppression lists", "Export for compliance audits"],
    workflow: ["The system auto-populates from unsubscribes and bounces", "Manually add addresses when requested", "Review the list periodically for accuracy", "Export for compliance audits when needed", "Never remove addresses unless legally required"],
    proTips: ["Import any existing suppression lists from previous email tools", "Check suppression list size — if it's growing fast, your targeting needs work", "Keep records of why each address was suppressed"],
    pitfalls: ["Manually removing addresses to 'grow your list' — this is illegal", "Not importing suppression lists from previous tools — instant complaints", "Ignoring a growing suppression list — it signals targeting problems"],
    related: ["Compliance Center", "Deliverability", "Campaigns"],
  },
  {
    id: "sender-settings", title: "Sender Settings", icon: Settings, category: "Compliance & Safety", path: "/sender-settings",
    tagline: "Configure your sender identity — company name, address, and unsubscribe URL.",
    overview: "Sender Settings define who your emails come from. Set your company name, physical mailing address (required by CAN-SPAM), and unsubscribe URL. These settings are embedded in every email you send and are legally required. Get them right once and they apply everywhere.",
    capabilities: ["Company name and address configuration", "Unsubscribe URL management", "Default sender name and email", "Reply-to address configuration", "Settings applied globally to all campaigns"],
    workflow: ["Set your company name and physical address first — it's required by law", "Configure your unsubscribe URL", "Set default sender name and reply-to address", "Review settings quarterly to ensure accuracy"],
    proTips: ["Use a real physical address — P.O. boxes are acceptable", "Set a monitored reply-to address — replies are valuable engagement signals", "Keep your unsubscribe URL working at all times"],
    pitfalls: ["Missing physical address — CAN-SPAM violation", "Broken unsubscribe URL — legal liability and spam complaints", "Using a no-reply address — kills engagement and trust"],
    related: ["Compliance Center", "Campaigns", "SMTP Accounts"],
  },
  {
    id: "domain-stats", title: "Domain Stats", icon: Globe, category: "Compliance & Safety", path: "/domain-stats",
    tagline: "Per-domain analytics — track reputation and performance across all sending domains.",
    overview: "Domain Stats gives you a per-domain breakdown of your email sending performance. See volume, bounce rates, open rates, and reputation scores for each domain. Identify underperforming domains before they damage your overall deliverability.",
    capabilities: ["Per-domain volume and performance metrics", "Bounce rate tracking by domain", "Open/click rates by domain", "Reputation score estimates", "Historical trend charts", "Domain comparison view"],
    workflow: ["Review Domain Stats weekly alongside Deliverability", "Identify domains with rising bounce rates", "Rotate away from underperforming domains", "Compare domain performance to find your best senders"],
    proTips: ["Keep bounce rates under 2% per domain", "Retire domains that consistently underperform", "Warm up new domains gradually before heavy sending"],
    pitfalls: ["Ignoring per-domain metrics — one bad domain can tank your average", "Not retiring damaged domains — they drag everything down"],
    related: ["Deliverability", "SMTP Accounts", "Domain Optimizer"],
  },
  // ── PARADIGM ENGINE ──
  {
    id: "paradigm", title: "Paradigm Pulse", icon: Brain, category: "Paradigm Engine", path: "/paradigm",
    tagline: "AI-powered sales intelligence — discover prospects, signals, and opportunities automatically.",
    overview: "The Paradigm Engine is Apex CRM's AI brain. It continuously scans the market for new prospects, buying signals, and opportunities. The Pulse Dashboard gives you a real-time view of AI activity: new prospects discovered, signals detected, sequences running, and battle cards generated. Think of it as your always-on sales research team.",
    capabilities: ["AI prospect discovery from market data", "Buying signal detection and scoring", "Automated outreach sequences", "Competitive battle card generation", "Real-time activity dashboard", "Integration with CRM contacts and deals"],
    workflow: ["Check the Pulse Dashboard daily for new AI discoveries", "Review and qualify new prospects", "Act on high-priority buying signals", "Launch sequences for qualified prospects", "Use battle cards in competitive situations"],
    proTips: ["The more data you feed the CRM, the smarter the AI becomes", "Review AI prospects weekly — they're pre-qualified leads", "Combine signals with your own market knowledge for best results"],
    pitfalls: ["Ignoring AI discoveries — they go stale quickly", "Not qualifying AI prospects — quality varies", "Over-relying on AI without human judgment"],
    related: ["Prospects", "Signals", "Ghost Sequences", "Battle Cards"],
  },
  {
    id: "prospects", title: "Prospects", icon: Target, category: "Paradigm Engine", path: "/prospects",
    tagline: "AI-discovered leads — pre-qualified, scored, and ready for outreach.",
    overview: "Prospects are leads discovered by the Paradigm Engine's AI. Each prospect comes with a relevance score, company information, and recommended outreach approach. Review, qualify, and convert the best ones into contacts and deals. The prospect list is continuously refreshed as the AI finds new opportunities.",
    capabilities: ["AI-scored prospect list with relevance ranking", "Company and contact information pre-filled", "Recommended outreach approach per prospect", "One-click conversion to CRM contact", "Bulk actions for efficient processing", "Prospect detail view with AI reasoning"],
    workflow: ["Review new prospects daily — freshness matters", "Sort by relevance score to prioritize", "Click into prospects for AI reasoning and details", "Convert promising prospects to contacts with one click", "Archive or dismiss low-quality prospects"],
    proTips: ["Convert high-score prospects within 48 hours — timing is everything", "Use the AI's recommended approach as a starting point for outreach", "Feed back results to improve AI accuracy over time"],
    pitfalls: ["Letting prospects sit too long — competitors move fast", "Converting without reviewing — not all AI picks are winners", "Not providing feedback — the AI can't improve without it"],
    related: ["Paradigm Pulse", "Signals", "Contacts", "Ghost Sequences"],
  },
  {
    id: "signals", title: "Signals", icon: Radar, category: "Paradigm Engine", path: "/signals",
    tagline: "Buying signals detected by AI — know when prospects are ready to buy.",
    overview: "Signals are AI-detected buying indicators: job changes, funding rounds, expansion announcements, RFP postings, and more. Each signal is scored by urgency and linked to a prospect or existing contact. Act on signals quickly — they represent time-sensitive opportunities.",
    capabilities: ["AI-detected buying signals from market data", "Urgency scoring per signal", "Signal types: job changes, funding, expansion, RFPs", "Link to prospects or existing contacts", "Signal review and action workflow", "Historical signal archive"],
    workflow: ["Check Signals daily — they're time-sensitive", "Sort by urgency to prioritize", "Click into signals for full context", "Take action: create a deal, send an email, or log a note", "Mark signals as reviewed to track your response rate"],
    proTips: ["Act on high-urgency signals within 24 hours", "Combine multiple signals about the same company for a stronger approach", "Use signals to time your outreach perfectly"],
    pitfalls: ["Ignoring signals — they expire quickly", "Not acting on funding signals — competitors will", "Treating all signals equally — prioritize by urgency"],
    related: ["Paradigm Pulse", "Prospects", "Contacts", "Deals"],
  },
  {
    id: "sequences", title: "Ghost Sequences", icon: Ghost, category: "Paradigm Engine", path: "/ghost-sequences",
    tagline: "Automated multi-step outreach — emails, delays, and follow-ups on autopilot.",
    overview: "Ghost Sequences are automated outreach workflows. Define a series of emails with delays between them, assign a prospect list, and let the system execute. Each step can be customized with templates and timing. The system tracks opens, clicks, and replies at each step, pausing the sequence when a prospect engages.",
    capabilities: ["Multi-step email sequences with custom delays", "Template assignment per step", "Automatic pause on prospect engagement", "Per-step analytics: opens, clicks, replies", "Prospect list assignment", "Sequence cloning for quick iteration"],
    workflow: ["Create a sequence with 3-5 email steps", "Set delays between steps (2-5 days recommended)", "Assign templates to each step", "Add prospects to the sequence", "Monitor engagement and let the system handle follow-ups"],
    proTips: ["3-5 steps is the sweet spot — more than 7 feels spammy", "First email should provide value, not ask for a meeting", "Space emails 2-3 business days apart", "The AI can create sequences: 'Create a 4-step cold outreach sequence'"],
    pitfalls: ["Too many steps — prospects mark you as spam", "First email is a hard sell — leads with value instead", "Not pausing on replies — you look like a robot"],
    related: ["Paradigm Pulse", "Prospects", "Templates", "Campaigns"],
  },
  {
    id: "battlecards", title: "Battle Cards", icon: Flame, category: "Paradigm Engine", path: "/battle-cards",
    tagline: "Competitive intelligence — know your rivals' strengths, weaknesses, and counter-strategies.",
    overview: "Battle Cards are AI-generated competitive intelligence briefs. Each card covers a competitor's strengths, weaknesses, pricing, market position, and recommended counter-strategies. Use them in sales calls, proposals, and competitive situations. The AI updates cards as new market intelligence becomes available.",
    capabilities: ["AI-generated competitor profiles", "Strengths and weaknesses analysis", "Pricing intelligence", "Recommended counter-strategies", "Win/loss pattern analysis", "Auto-updating with new market data"],
    workflow: ["Review battle cards before competitive sales calls", "Use counter-strategies in proposals and negotiations", "Share relevant cards with your sales team", "Provide feedback to improve AI accuracy", "Check for updates before major deals"],
    proTips: ["Memorize the top 3 counter-strategies for your main competitors", "Use battle cards in proposal writing — address objections proactively", "Combine battle cards with signals for timing advantage"],
    pitfalls: ["Using outdated battle cards — competitors evolve", "Relying solely on AI analysis without your own market knowledge", "Sharing battle cards externally — they're internal intelligence"],
    related: ["Paradigm Pulse", "Deals", "Prospects", "Quantum Score"],
  },
  {
    id: "quantum", title: "Quantum Score", icon: Award, category: "Paradigm Engine", path: "/quantum-score",
    tagline: "AI lead scoring — prioritize prospects by conversion probability.",
    overview: "Quantum Score is Apex CRM's AI-powered lead scoring system. It analyzes every prospect and contact across dozens of signals — engagement, firmographics, behavior, timing — and assigns a conversion probability score. Higher scores mean higher likelihood of closing. Use it to prioritize your outreach and focus on the prospects most likely to convert.",
    capabilities: ["AI-powered conversion probability scoring", "Multi-signal analysis: engagement, firmographics, behavior", "Score breakdown showing contributing factors", "Historical score tracking", "Threshold-based alerts", "Integration with deals and pipeline"],
    workflow: ["Review Quantum Scores weekly to reprioritize your pipeline", "Focus outreach on high-score prospects first", "Investigate score changes — drops may indicate lost interest", "Use score thresholds to automate routing (e.g., score > 80 → sales team)"],
    proTips: ["Scores above 70 are strong — prioritize these aggressively", "Declining scores are early warnings — reach out before they go cold", "Combine Quantum Score with Signals for maximum insight"],
    pitfalls: ["Ignoring low scores entirely — some become great customers", "Not investigating score drops — you miss save opportunities", "Over-indexing on score without human judgment"],
    related: ["Paradigm Pulse", "Prospects", "Signals", "Deals"],
  },
  // ── AUTOMATION ──
  {
    id: "workflows", title: "Workflows", icon: GitBranch, category: "Automation", path: "/workflows",
    tagline: "Automate everything — trigger actions based on events, conditions, and schedules.",
    overview: "Workflows are your automation engine. Define triggers (new contact created, deal stage changed, task overdue), conditions (if lead status is Hot, if deal value > $10K), and actions (send email, create task, update field, notify team). Workflows run automatically in the background, ensuring nothing falls through the cracks.",
    capabilities: ["Event-based triggers: contact created, deal moved, task overdue", "Conditional logic: if/then branching", "Actions: send email, create task, update field, notify", "Multi-step workflows with delays", "Active/inactive toggle", "Execution history and logging"],
    workflow: ["Define a trigger: what event starts the workflow?", "Add conditions: what must be true for the workflow to proceed?", "Set actions: what should happen?", "Test with a sample record", "Activate and monitor execution logs"],
    proTips: ["Start with simple workflows: new contact → welcome email", "Use delays between actions for natural timing", "Monitor execution logs weekly for failures", "The AI can create workflows: 'Create a workflow that sends a welcome email to new contacts'"],
    pitfalls: ["Overly complex workflows — they're hard to debug", "No error handling — failed actions go unnoticed", "Conflicting workflows — two workflows updating the same field"],
    related: ["Campaigns", "Tasks", "Segments", "Ghost Sequences"],
  },
  // ── OPERATIONS ──
  {
    id: "loads", title: "Load Management", icon: Truck, category: "Operations", path: "/loads",
    tagline: "Track freight loads from pickup to delivery — status, carrier, and payment in one view.",
    overview: "Load Management is the operational heart of freight brokerage. Track every load from booking through pickup, in-transit, delivery, and payment. Each load record includes shipper, carrier, origin, destination, rate, and real-time status. The system integrates with carrier vetting and invoicing for end-to-end load lifecycle management.",
    capabilities: ["Load lifecycle tracking: booked → picked up → in transit → delivered → paid", "Shipper and carrier assignment", "Origin/destination with mileage", "Rate and margin tracking", "Status updates and notifications", "Integration with invoicing and carrier vetting"],
    workflow: ["Create a load with shipper, origin, destination, and rate", "Assign a vetted carrier", "Track status updates through the lifecycle", "Generate invoices upon delivery", "Close the load when payment is received"],
    proTips: ["Update load status in real-time — customers expect visibility", "Vet carriers before assignment — use Carrier Vetting page", "Track margins per load to identify profitable lanes"],
    pitfalls: ["Not updating status — customers lose trust", "Assigning unvetted carriers — liability risk", "Not tracking margins — you can't optimize what you don't measure"],
    related: ["Carrier Vetting", "Invoicing", "Freight Marketplace", "Order Entry"],
  },
  {
    id: "carrier-vetting", title: "Carrier Vetting", icon: ShieldCheck, category: "Operations", path: "/carrier-vetting",
    tagline: "Verify carriers before you book — authority, insurance, safety scores, and fraud checks.",
    overview: "Carrier Vetting protects your business by verifying carriers before you assign loads. Check MC/DOT authority status, insurance coverage, safety scores, and fraud indicators. The system flags carriers with issues so you can make informed decisions. Never book an unvetted carrier.",
    capabilities: ["MC/DOT authority verification", "Insurance coverage checking", "Safety score analysis", "Fraud indicator detection", "Carrier profile database", "Vetting history and audit trail"],
    workflow: ["Enter carrier MC or DOT number", "System checks authority, insurance, and safety", "Review results and flag any issues", "Approve or reject the carrier", "Assign approved carriers to loads"],
    proTips: ["Vet every carrier, every time — don't rely on past vetting alone", "Check insurance expiration dates — coverage can lapse", "Use FMCSA Scanner for deeper analysis on questionable carriers"],
    pitfalls: ["Skipping vetting for 'known' carriers — things change", "Not checking insurance dates — expired coverage = full liability", "Ignoring safety score trends — they predict future problems"],
    related: ["Load Management", "FMCSA Scanner", "Carrier Packets"],
  },
  {
    id: "invoicing", title: "Invoicing", icon: FileText, category: "Operations", path: "/invoicing",
    tagline: "Generate and track invoices — from load delivery to payment collection.",
    overview: "Invoicing closes the loop on your freight operations. Generate invoices from delivered loads, track payment status, and manage accounts receivable. Each invoice links back to its load, carrier, and shipper for complete audit trail.",
    capabilities: ["Auto-generate invoices from delivered loads", "Payment status tracking: pending, sent, paid, overdue", "Shipper and carrier billing", "Invoice PDF generation", "Aging reports for accounts receivable", "Payment reminders"],
    workflow: ["Deliver a load → system prompts for invoice creation", "Review and customize invoice details", "Send invoice to shipper", "Track payment status", "Follow up on overdue invoices"],
    proTips: ["Invoice immediately upon delivery — faster invoicing = faster payment", "Set up payment reminders for overdue invoices", "Track aging to identify slow-paying customers"],
    pitfalls: ["Delayed invoicing — cash flow suffers", "Not following up on overdue invoices", "Missing load details on invoices — causes payment disputes"],
    related: ["Load Management", "Customer Portal", "Order Entry"],
  },
  // ── AI PREMIUM ──
  {
    id: "voice-agent", title: "Voice Agent", icon: Phone, category: "AI Premium", path: "/voice-agent",
    tagline: "AI-powered phone campaigns — automated calls with natural conversation.",
    overview: "Voice Agent brings AI to your phone outreach. Create voice campaigns that make automated calls with natural-sounding AI conversation. The agent can qualify leads, schedule meetings, and gather information — all without human intervention. Review call recordings and transcripts for quality assurance.",
    capabilities: ["AI-powered automated calling", "Natural conversation with prospects", "Lead qualification during calls", "Meeting scheduling capability", "Call recording and transcription", "Campaign-level analytics"],
    workflow: ["Create a voice campaign with script and target list", "Configure call schedule and daily limits", "Launch campaign and monitor in real-time", "Review recordings and transcripts", "Follow up on qualified leads"],
    proTips: ["Start with a small test campaign to calibrate the AI", "Review early recordings to refine the script", "Use Voice Agent for initial qualification, humans for closing"],
    pitfalls: ["Calling too aggressively — respect do-not-call lists", "Not reviewing recordings — quality can drift", "Using Voice Agent for complex negotiations — it's best for qualification"],
    related: ["Campaigns", "Contacts", "Call Intelligence", "AI Ghostwriter"],
  },
  {
    id: "ai-ghostwriter", title: "AI Ghostwriter", icon: Wand2, category: "AI Premium", path: "/ai-ghostwriter",
    tagline: "AI-written emails — personalized, on-brand, and ready to send in seconds.",
    overview: "AI Ghostwriter generates personalized email copy using your contact data and brand voice. Give it a prompt ('Write a cold outreach email to a shipping manager about our new lane coverage') and it produces ready-to-send copy with personalization tokens. Use it for cold outreach, follow-ups, proposals, and re-engagement campaigns.",
    capabilities: ["AI-generated email copy from natural language prompts", "Personalization token integration", "Brand voice customization", "Multiple tone options: professional, casual, urgent", "Template generation from prompts", "Bulk copy generation for campaigns"],
    workflow: ["Describe what you want: audience, purpose, tone", "AI generates personalized email copy", "Review and edit as needed", "Save as a template or use directly in a campaign", "Iterate with feedback for better results"],
    proTips: ["Be specific in your prompts — 'cold email to shipping managers about Texas lanes' beats 'write an email'", "Always review AI output — it's a draft, not a final product", "Use it for first drafts, then add your personal touch"],
    pitfalls: ["Sending AI copy without review — it can miss context", "Generic prompts produce generic emails", "Over-relying on AI — your personal voice matters"],
    related: ["Templates", "Campaigns", "Ghost Sequences"],
  },
  {
    id: "meeting-prep", title: "Meeting Prep", icon: MessageSquare, category: "AI Premium", path: "/meeting-prep",
    tagline: "AI-generated meeting briefs — know everything about your prospect before the call.",
    overview: "Meeting Prep generates comprehensive briefs before sales calls. It pulls together contact history, company data, deal status, recent activities, competitive landscape, and talking points — all in one page. Walk into every meeting fully prepared.",
    capabilities: ["AI-generated meeting briefs", "Contact and company data aggregation", "Deal history and status summary", "Recent activity timeline", "Suggested talking points", "Competitive context from battle cards"],
    workflow: ["Select a contact or deal for the upcoming meeting", "AI generates a comprehensive brief", "Review key talking points and competitive context", "Note any recent activities or changes", "Use the brief during the meeting for reference"],
    proTips: ["Generate briefs 30 minutes before meetings — data is freshest", "Share briefs with your team for collaborative meetings", "Use talking points as a guide, not a script"],
    pitfalls: ["Not reviewing the brief — you miss important context", "Reading from the brief during the meeting — it should inform, not script", "Generating briefs too far in advance — data goes stale"],
    related: ["Contacts", "Companies", "Deals", "Battle Cards"],
  },
  {
    id: "call-intelligence", title: "Call Intelligence", icon: Phone, category: "AI Premium", path: "/call-intelligence",
    tagline: "AI-analyzed call recordings — sentiment, key topics, and action items extracted automatically.",
    overview: "Call Intelligence analyzes your sales call recordings using AI. It extracts sentiment, key topics discussed, objections raised, commitments made, and action items — all automatically. Use it to coach your team, track deal progress, and ensure follow-through on promises.",
    capabilities: ["AI call recording analysis", "Sentiment detection throughout the call", "Key topic extraction", "Objection identification", "Action item extraction", "Call scoring and coaching insights"],
    workflow: ["Record sales calls (with consent)", "AI analyzes the recording automatically", "Review sentiment trends and key topics", "Check extracted action items", "Use insights for coaching and follow-up"],
    proTips: ["Review call intelligence weekly for coaching opportunities", "Track objection patterns — they reveal market concerns", "Use action items to create follow-up tasks automatically"],
    pitfalls: ["Not recording calls — you lose valuable intelligence", "Ignoring sentiment trends — they predict deal outcomes", "Not acting on extracted action items"],
    related: ["Voice Agent", "Contacts", "Deals", "Tasks"],
  },
  // ── ANALYTICS ──
  {
    id: "analytics", title: "Reports & Analytics", icon: BarChart3, category: "Analytics", path: "/reports",
    tagline: "Data-driven decisions — pipeline reports, email metrics, and team performance.",
    overview: "Reports & Analytics transforms your CRM data into actionable insights. Pipeline reports show deal flow and conversion rates. Email analytics track campaign performance across opens, clicks, and conversions. Team reports measure individual and group productivity. Use these insights to optimize your sales process and marketing strategy.",
    capabilities: ["Pipeline reports: deal flow, conversion rates, stage duration", "Email analytics: opens, clicks, bounces, unsubscribes by campaign", "Team performance: tasks completed, deals closed, activities logged", "Custom date range filtering", "Export to CSV for external analysis", "Trend charts and comparisons"],
    workflow: ["Check pipeline reports weekly for deal flow health", "Review email analytics after every campaign", "Monitor team performance monthly", "Export data for deeper analysis when needed", "Share insights with leadership for strategic decisions"],
    proTips: ["Set up a weekly analytics review ritual", "Compare month-over-month trends, not just absolute numbers", "Use pipeline stage duration to identify bottlenecks"],
    pitfalls: ["Looking at vanity metrics (opens) instead of conversion metrics", "Not acting on insights — analytics without action is just data", "Comparing incomparable time periods (holiday vs. normal weeks)"],
    related: ["Dashboard", "Campaigns", "Deals", "Tasks"],
  },
];

const categories = Array.from(new Set(guides.map(g => g.category)));

/* ─────────────────────── Section Card ─────────────────────── */
function GuideCard({ guide, expanded, onToggle }: { guide: GuideSection; expanded: boolean; onToggle: () => void }) {
  const [, setLocation] = useLocation();
  const Icon = guide.icon;

  return (
    <Card className={`transition-all duration-200 ${expanded ? "border-amber-400/40 shadow-lg shadow-amber-500/5" : "hover:border-amber-400/20 hover:shadow-md"}`}>
      <div className="flex items-center gap-4 p-4 cursor-pointer select-none" onClick={onToggle}>
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0 shadow-sm">
          <Icon className="h-5 w-5 text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">{guide.title}</h3>
            <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{guide.category}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 italic">{guide.tagline}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-50"
            onClick={(e) => { e.stopPropagation(); setLocation(guide.path); }}
          >
            Open <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          {expanded ? <ChevronDown className="h-4 w-4 text-amber-500" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <CardContent className="pt-0 pb-5 px-4 space-y-4">
          <div className="border-t border-amber-200/30 pt-4">
            <p className="text-sm text-foreground/80 leading-relaxed">{guide.overview}</p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 p-4">
            <h4 className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" /> Capabilities
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {guide.capabilities.map((item, i) => (
                <li key={i} className="text-xs text-blue-900/70 flex gap-2">
                  <span className="text-blue-500 shrink-0 mt-0.5">&#9679;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/50 p-4">
              <h4 className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2 className="h-3.5 w-3.5" /> How to Use
              </h4>
              <ol className="space-y-1.5">
                {guide.workflow.map((item, i) => (
                  <li key={i} className="text-xs text-emerald-900/70 flex gap-2">
                    <span className="text-emerald-600 shrink-0 font-bold">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200/50 p-4">
              <h4 className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                <Lightbulb className="h-3.5 w-3.5" /> Pro Tips
              </h4>
              <ul className="space-y-1.5">
                {guide.proTips.map((item, i) => (
                  <li key={i} className="text-xs text-amber-900/70 flex gap-2">
                    <span className="text-amber-500 shrink-0">&#9733;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/50 p-4">
            <h4 className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
              <AlertTriangle className="h-3.5 w-3.5" /> Pitfalls to Avoid
            </h4>
            <ul className="space-y-1.5">
              {guide.pitfalls.map((item, i) => (
                <li key={i} className="text-xs text-red-900/70 flex gap-2">
                  <span className="text-red-500 shrink-0">&#10007;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs text-muted-foreground font-medium">Related:</span>
            {guide.related.map((page) => {
              const rel = guides.find(g => g.title === page);
              return (
                <Badge
                  key={page}
                  variant="outline"
                  className="text-[10px] cursor-pointer hover:bg-amber-50 hover:border-amber-300 transition-colors"
                  onClick={() => rel && setLocation(rel.path)}
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

/* ─────────────────────── Main Component ─────────────────────── */
export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = guides;
    if (activeCategory !== "all") {
      result = result.filter(g => g.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.tagline.toLowerCase().includes(q) ||
        g.overview.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.capabilities.some(c => c.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, activeCategory]);

  return (
    <div className="space-y-8">
      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJoMTJ6TTM2IDI0djJIMjR2LTJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Apex CRM Guide</h1>
              <p className="text-white/80 text-sm font-medium">Master every feature. Close more deals. Grow faster.</p>
            </div>
          </div>
          <p className="text-white/90 text-sm leading-relaxed max-w-2xl mt-4">
            Welcome to the complete guide for Apex CRM — the most powerful freight broker CRM platform ever built. 
            Below you'll find detailed documentation for every feature, from basic contact management to AI-powered 
            prospecting, automated sequences, and freight operations. Each guide includes capabilities, step-by-step 
            workflows, pro tips from power users, and pitfalls to avoid.
          </p>
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-2xl font-extrabold">{guides.length}</p>
              <p className="text-white/70 text-xs">Feature Guides</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-extrabold">{categories.length}</p>
              <p className="text-white/70 text-xs">Categories</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-extrabold">{guides.reduce((a, g) => a + g.proTips.length, 0)}</p>
              <p className="text-white/70 text-xs">Pro Tips</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-extrabold">{guides.reduce((a, g) => a + g.capabilities.length, 0)}</p>
              <p className="text-white/70 text-xs">Capabilities</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search guides... (e.g., 'AI assistant', 'campaigns', 'carrier vetting', 'invoicing')"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 text-sm border-amber-200/50 focus:border-amber-400"
        />
      </div>

      {/* ── Category Pills ── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            activeCategory === "all"
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50"
          }`}
        >
          All ({guides.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === cat
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50"
            }`}
          >
            {cat} ({guides.filter(g => g.category === cat).length})
          </button>
        ))}
      </div>

      {/* ── Guide List ── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="bg-card">
            <CardContent className="p-12 text-center">
              <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="text-sm text-muted-foreground">No guides match your search. Try different keywords.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map(guide => (
            <GuideCard
              key={guide.id}
              guide={guide}
              expanded={expandedId === guide.id}
              onToggle={() => setExpandedId(expandedId === guide.id ? null : guide.id)}
            />
          ))
        )}
      </div>

      {/* ── Quick Start Guide ── */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Rocket className="h-5 w-5" /> First Day Setup — Get Running in 10 Steps
          </h2>
          <p className="text-white/80 text-xs mt-1">Follow this checklist to go from zero to fully operational.</p>
        </div>
        <CardContent className="p-4 space-y-2">
          {[
            { step: 1, title: "Configure Sender Settings", desc: "Set your company name, physical address, and unsubscribe URL. Required by CAN-SPAM law.", path: "/sender-settings" },
            { step: 2, title: "Add SMTP Accounts", desc: "Configure your email sending addresses. Set daily limits per address (~385 recommended).", path: "/smtp-accounts" },
            { step: 3, title: "Verify Domain Health", desc: "Check that all domains have SPF, DKIM, and DMARC properly configured.", path: "/deliverability" },
            { step: 4, title: "Import Companies", desc: "Add your existing companies — they're the foundation of everything in Apex CRM.", path: "/companies" },
            { step: 5, title: "Import Contacts", desc: "Add contacts and link them to companies. Fill in as many fields as possible.", path: "/contacts" },
            { step: 6, title: "Create Your First Segment", desc: "Build a targeted list (e.g., 'Manufacturers in Texas') for your first campaign.", path: "/segments" },
            { step: 7, title: "Build Email Templates", desc: "Create reusable templates for cold outreach, follow-ups, and proposals.", path: "/templates" },
            { step: 8, title: "Run Compliance Check", desc: "Test your first email through the Compliance Center before sending.", path: "/compliance" },
            { step: 9, title: "Launch First Campaign", desc: "Send your first targeted campaign to a small segment. Monitor results.", path: "/campaigns" },
            { step: 10, title: "Meet Your AI Assistant", desc: "Click the orange sparkle button and say 'Hello' — it can do everything from here.", path: "/" },
          ].map((item) => (
            <QuickStartStep key={item.step} {...item} />
          ))}
        </CardContent>
      </Card>

      {/* ── AI Assistant CTA ── */}
      <Card className="overflow-hidden border-amber-300/50">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-lg">Still have questions? Ask Apex AI.</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Click the orange sparkle button in the bottom-right corner of any page. Ask anything — 
              "How do I create a campaign?", "Add a company called Acme", "Show my pipeline summary" — 
              the AI knows everything and can execute any action instantly.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function QuickStartStep({ step, title, desc, path }: { step: number; title: string; desc: string; path: string }) {
  const [, setLocation] = useLocation();
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 hover:bg-amber-100/50 cursor-pointer transition-all group"
      onClick={() => setLocation(path)}
    >
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-xs font-bold text-white">{step}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-amber-400 shrink-0 group-hover:translate-x-1 transition-transform" />
    </div>
  );
}
