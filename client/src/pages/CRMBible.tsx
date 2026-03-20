import { useState, useEffect, useRef } from "react";
import { Search, BookOpen, ChevronRight, ChevronDown, ArrowUp, Zap, Brain, Shield, BarChart3, Settings, Layers, Users, Mail, GitBranch, Truck, Sparkles, Share2, X, UserPlus, Eye, Pencil, Trash2, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSkin } from "@/contexts/SkinContext";

// ─── Role Access Matrix ───────────────────────────────────────────────────────
// minRoles: array of roles that can see this section by default (and all higher roles)
// Role hierarchy: developer > realm_owner > company_admin > sales_manager/office_manager > account_manager/coordinator

const ROLE_LEVEL: Record<string, number> = {
  developer: 100,
  realm_owner: 90,
  super_admin: 85,
  company_admin: 80,
  sales_manager: 60,
  office_manager: 60,
  manager: 60,
  account_manager: 30,
  coordinator: 30,
  sales_rep: 30,
  user: 30,
};

// Minimum role level required to see a section by default
const SECTION_MIN_LEVEL: Record<string, number> = {
  dashboard: 30,      // Everyone
  team: 60,           // Sales Manager, Office Manager, and above
  crm: 30,            // Everyone
  marketing: 30,      // Everyone (Coordinators involved in marketing)
  automation: 60,     // Sales Manager, Office Manager, and above
  paradigm: 60,       // Sales Manager and above
  compliance: 60,     // Office Manager and above
  operations: 30,     // Everyone
  ai: 60,             // Sales Manager, Office Manager, and above
  analytics: 60,      // Sales Manager, Office Manager, and above (team-scoped)
  settings: 80,     // Company Admin and above (general settings)
  billing: 80,       // Company Admin and above (payment history/schedule - read-only)
  billingManage: 90, // REALM Owner and Developer only (change plan, update payment method)
};

// ─── Data ────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "dashboard",
    icon: BarChart3,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    title: "Dashboard",
    subtitle: "Your real-time command center",
    features: [
      {
        id: "dashboard-overview",
        title: "Dashboard Overview",
        what: "The Dashboard is your command center — the first screen you see after logging in. It provides a real-time snapshot of your entire sales operation: pipeline value, hot leads, deliverability health, tasks due today, and AI activity.",
        why: "Sales managers and reps need to know — in under 10 seconds — what needs attention right now. The Dashboard eliminates the need to click through multiple screens to understand the state of the business. It surfaces the signal, not the noise.",
        how: "Scan the four key metric cards at the top: Pipeline Value, Hot Leads, Deliverability Rate, and Tasks Due Today. Each card is clickable and takes you directly to the relevant module. Below the cards, the AI Activity Feed streams what the Paradigm Engine™ has done autonomously. The Pipeline Overview chart shows deal velocity by stage. The Team Leaderboard shows rep performance ranked by deals closed this month.",
        automation: "The Dashboard reflects the output of every automation running in the background. When a Ghost Sequence gets a reply, the Hot Leads counter increments. When a domain health score drops, the Deliverability card turns amber. You configure nothing here — you act on what you see.",
        outcome: "A well-read Dashboard means zero surprises. Reps start each day knowing exactly which prospects are warm, which tasks are overdue, and which deals are stalling. This daily ritual is the difference between a reactive team and a proactive one.",
      },
    ],
  },
  {
    id: "team",
    icon: Users,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    title: "Team & Performance",
    subtitle: "Roles, accountability, and coaching",
    features: [
      {
        id: "team-setup",
        title: "Team Setup & Roles",
        what: "Team is your user management panel — where you create, edit, and assign roles to every person in your organization. The role hierarchy is: Developer → REALM Owner → Company Admin → Sales Manager / Office Manager → Account Manager / Coordinator.",
        why: "A CRM is only as good as the people using it correctly. The Team module ensures every rep has the right access level, is assigned to the right manager, and is accountable to measurable performance targets.",
        how: "Navigate to Team → Invite User. Enter their email, select their role (Account Manager, Coordinator, Sales Manager, Office Manager, or Company Admin), and assign them to a manager. They receive an email invitation with a one-click setup link. Role assignments control what each user can see throughout the entire CRM — a Sales Manager automatically sees all deals assigned to their Account Managers.",
        automation: "Role assignments cascade visibility automatically. An Account Manager only sees their own contacts and deals. A Sales Manager sees everything under their team. A Company Admin sees the entire organization. No manual filtering required.",
        outcome: "Clear role hierarchy creates accountability. When every rep knows their manager can see their activity in real time, performance improves. Managers have the data they need for weekly 1:1s, quota reviews, and coaching decisions.",
      },
      {
        id: "team-performance",
        title: "Team Performance",
        what: "A live leaderboard and analytics view showing individual and team-level sales metrics: calls made, emails sent, deals created, deals closed, and revenue generated — for any date range.",
        why: "You cannot coach what you cannot see. Team Performance gives managers objective data to identify top performers, struggling reps, and the specific behaviors that separate the two.",
        how: "Navigate to Team Performance. Use the date range picker to select the period. Click any rep's row to drill into their individual activity timeline. Use the comparison view to benchmark reps against each other or against quota.",
        automation: "Performance data updates in real time as reps log activities, advance deals, and complete tasks. No manual reporting required.",
        outcome: "Data-driven coaching. Managers who review performance weekly close the gap between top and bottom performers faster than managers who rely on gut instinct.",
      },
    ],
  },
  {
    id: "crm",
    icon: Layers,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    title: "CRM Core",
    subtitle: "Companies, Contacts, Deals, Tasks",
    features: [
      {
        id: "companies",
        title: "Companies",
        what: "The master record for every business you sell to or prospect. Each company record is the parent container for all contacts, deals, activities, and notes associated with that organization.",
        why: "B2B sales is fundamentally account-based. You sell to companies, and multiple people at that company are involved in the buying decision. The Companies module keeps all of that context in one place.",
        how: "Click Companies → New Company. Fill in: Company Name, Industry, Size, Website, Phone, Address, and Lifecycle Stage (Prospect → Lead → Customer → Churned). The Logistics tab contains freight-specific fields: Credit Terms, Payment Status, Lane Preferences, and TMS Integration status. On the Company Detail page, the Overview tab shows a chronological activity timeline, the Contacts tab lists every person at that company, and the Activities tab shows all interactions filtered by type.",
        automation: "When a Workflow trigger fires on a company (e.g., Lifecycle Stage changes to Customer), automated actions execute: a welcome email sends, a task is created for the assigned rep, and the company is added to the Customers segment automatically.",
        outcome: "A complete company record means any rep — even one who has never spoken to that account — can walk into a call fully briefed. The company record is institutional memory.",
      },
      {
        id: "contacts",
        title: "Contacts",
        what: "Individual people within companies. Each contact record holds 50+ fields covering identity, communication preferences, social profiles, marketing attribution, logistics-specific data, and a full activity history.",
        why: "The richer your contact record, the more personalized your outreach — and personalization is the single highest-leverage variable in sales conversion.",
        how: "Navigate to Contacts → New Contact. Fill in: Identity (name, title, company), Communication (email, phone, LinkedIn), Lifecycle Stage, Lead Status, and Marketing Attribution. The Lead Status field has 25+ pre-built statuses: New Lead, Contacted, Quote Sent, Negotiating, Booked, Active Shipper, Inactive, Do Not Contact, and more. Always keep Lead Status current — it drives segmentation and workflow triggers.",
        automation: "Contact lifecycle stage changes trigger Workflow automations. When a contact moves from Lead to Qualified, a follow-up email sequence fires automatically. When a contact's email bounces, the Paradigm Engine detects the signal and updates the record.",
        outcome: "Contacts with complete records close at higher rates because reps can personalize every touchpoint. The goal is to know your contact better than they know themselves.",
      },
      {
        id: "deals",
        title: "Deals",
        what: "A visual Kanban pipeline that tracks every sales opportunity from first conversation to closed-won or closed-lost. Each deal card represents a specific revenue opportunity with a value, close date, probability, and assigned rep.",
        why: "Without a pipeline, revenue is unpredictable. The Deals module gives you a real-time view of where every dollar of potential revenue sits in your sales process and what your forecast looks like.",
        how: "Navigate to Deals → New Deal. Enter: deal name, associated company and contact, deal value, expected close date, and pipeline stage (Prospect → Qualified → Proposal Sent → Negotiation → Closed Won/Lost). Drag deal cards between columns to advance them. The Weighted Forecast view multiplies each deal's value by its probability percentage to give a realistic revenue forecast.",
        automation: "Stage changes trigger Workflow automations. Moving a deal to Proposal Sent can automatically send a follow-up email 3 days later if no response is detected. Moving to Closed Won triggers a customer onboarding workflow, creates an invoice, and notifies the operations team.",
        outcome: "A healthy pipeline is the foundation of predictable revenue. Managers use the pipeline to identify stalled deals, coach reps on specific opportunities, and forecast the month's close with confidence.",
      },
      {
        id: "tasks",
        title: "Tasks",
        what: "The atomic unit of sales execution. Every call to make, email to send, follow-up to schedule, and document to review lives in Tasks. Tasks can be assigned to any team member, associated with a contact, company, or deal, and organized into queues.",
        why: "Sales is a game of follow-through. The rep who follows up consistently wins. Tasks ensure that nothing falls through the cracks — every commitment is tracked, every deadline is visible.",
        how: "Create a task from the Tasks page or directly from any contact, company, or deal record. Fill in: Title, Type (Call / Email / To-Do / Follow-Up), Due Date, Assigned To, Priority (Low / Medium / High / Urgent), and Queue. Queues group related tasks — Prospecting Calls, Customer Renewals, Follow-Ups — letting reps batch similar work for maximum focus.",
        automation: "Workflows create tasks automatically. When a deal moves to Proposal Sent, a task auto-creates: 'Follow up if no response in 3 days.' Smart Notifications alert reps when high-priority tasks are overdue.",
        outcome: "Reps who work from a task queue close more deals than reps who work from memory. Tasks create a structured daily workflow that ensures the highest-value activities get done first, every day.",
      },
    ],
  },
  {
    id: "marketing",
    icon: Mail,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    title: "Marketing",
    subtitle: "Campaigns, Templates, Deliverability, A/B Tests",
    features: [
      {
        id: "campaigns",
        title: "Campaigns",
        what: "Your email campaign builder and sender. Create, schedule, and send targeted email campaigns to specific segments of your contact list, then track opens, clicks, bounces, and unsubscribes in real time.",
        why: "Email remains the highest-ROI marketing channel in B2B sales. A well-executed campaign to a warm list can generate more qualified conversations in 48 hours than a month of cold calling.",
        how: "Navigate to Campaigns → New Campaign. Step 1: Name your campaign and select a goal. Step 2: Choose a template. Step 3: Select your audience — choose a Segment or upload a list. Step 4: Personalize with tokens: {{first_name}}, {{company_name}}, {{rep_name}}. Step 5: Set the send time — immediate, scheduled, or AI-optimized. Step 6: Review the pre-send checklist and send.",
        automation: "Campaigns feed directly into Workflows. A contact who opens but does not click can be automatically enrolled in a follow-up sequence. A contact who clicks a pricing link triggers a Hot Lead alert to their assigned rep.",
        outcome: "Campaigns keep your brand in front of prospects who are not yet ready to buy. The goal is to stay top-of-mind so that when the prospect is ready, you are the first call they make.",
      },
      {
        id: "templates",
        title: "Email Templates",
        what: "A library of reusable email designs and copy blocks. Templates can be built once and used across unlimited campaigns, with personalization tokens that auto-fill recipient-specific data at send time.",
        why: "Without templates, every rep writes emails from scratch — inconsistent quality, inconsistent branding, wasted time. Templates codify your best-performing emails and make them available to the entire team instantly.",
        how: "Navigate to Templates → New Template. Choose a layout. Use the block editor to add text, images, buttons, dividers, and dynamic content blocks. Save with a descriptive name and category tag. Select templates in the Campaign builder — all tokens replace with live data at send time.",
        automation: "Templates are the content layer for both Campaigns and Ghost Sequences. When the Paradigm Engine sends an automated email, it uses a template personalized with the prospect's Digital Twin psychographic profile.",
        outcome: "A library of proven templates means your team's best ideas scale to every rep. The top-performing email your best rep ever wrote becomes the default for everyone.",
      },
      {
        id: "deliverability",
        title: "Deliverability",
        what: "Your email health command center. Monitors sending reputation, checks authentication records (SPF, DKIM, DMARC), tracks bounce and complaint rates, and provides AI-powered pre-send spam scoring.",
        why: "An email that lands in spam is worth zero. Deliverability is the invisible foundation of every email campaign. A 98.7% inbox placement rate is a competitive weapon.",
        how: "The Deliverability dashboard shows four health indicators: Authentication Status, Bounce Rate (target: under 2%), Complaint Rate (target: under 0.1%), and Blacklist Status. The Pre-Send Spam Score tool lets you paste any email and receive an AI score from 0–100 with specific fix suggestions.",
        automation: "When a domain's health score drops below the warning threshold, the system automatically pauses sending from that domain and routes traffic to healthy domains.",
        outcome: "Every percentage point of inbox placement improvement translates directly to more opens, more replies, and more pipeline.",
      },
      {
        id: "ab-tests",
        title: "A/B Tests",
        what: "Test two or more variations of an email element — subject line, sender name, send time, or body content — against a split of your audience to determine which version performs better, then automatically send the winner to the remainder.",
        why: "Gut instinct is not a strategy. A/B testing replaces opinion with data. Over time, a team that systematically tests and iterates will develop a library of proven, high-performing copy.",
        how: "Navigate to A/B Tests → New Test. Select the test type. Enter Variant A and Variant B. Set the test split (e.g., 20% gets A, 20% gets B, 60% gets the winner). Set the winning metric (Open Rate, Click Rate, or Reply Rate) and the decision time.",
        automation: "A/B test results feed back into the AI Send Time Optimizer and the AI Email Composer. When a subject line pattern consistently wins, the AI learns to apply that pattern in future Ghost Sequence emails.",
        outcome: "A single winning subject line improvement of 5 percentage points on a 10,000-contact list means 500 more opens per campaign.",
      },
    ],
  },
  {
    id: "automation",
    icon: GitBranch,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    title: "Automation",
    subtitle: "Workflows & Segments",
    features: [
      {
        id: "workflows",
        title: "Workflows",
        what: "The automation engine of REALM CRM. A Workflow is a set of rules: When [trigger event] happens, and [conditions] are met, then [actions] execute. Workflows run 24/7 without human intervention.",
        why: "The best sales teams are not the ones who work the hardest — they are the ones who have automated everything that can be automated, freeing human attention for the conversations that actually require it.",
        how: "Navigate to Workflows → New Workflow. Step 1: Choose a trigger (Contact Created, Deal Stage Changed, Email Opened, Date-Based, etc.). Step 2: Add conditions. Step 3: Add actions (Send Email, Create Task, Update Field, Add to Segment, Wait X Days, Branch with If/Then logic).",
        automation: "Workflows ARE the automation layer. They connect every other module: a campaign open triggers a task, a deal stage change triggers an email, a date triggers a renewal reminder.",
        outcome: "A single well-built workflow can replace hours of manual follow-up per week. A team with 10 active workflows running simultaneously is effectively operating with a team twice its size.",
      },
      {
        id: "segments",
        title: "Segments",
        what: "Dynamic, rule-based lists of contacts or companies that automatically update as records change. A Segment is not a static export — it is a living filter that always shows the current members matching your criteria.",
        why: "Sending the same email to everyone on your list is the fastest way to destroy your deliverability and annoy your prospects. Segments let you send the right message to the right people at the right time.",
        how: "Navigate to Segments → New Segment. Build your filter using any combination of fields: Industry, Lifecycle Stage, Lead Status, Last Activity Date, Email Engagement Score, Location, Deal Stage, Tags, and more. Combine filters with AND/OR logic.",
        automation: "Segments are available as audience targets in Campaigns and as triggers/conditions in Workflows. When a contact's data changes and they now match a segment's criteria, they are automatically added.",
        outcome: "Segmented campaigns consistently outperform broadcast campaigns by 3–5x on open and click rates.",
      },
    ],
  },
  {
    id: "paradigm",
    icon: Brain,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    title: "Paradigm Engine™",
    subtitle: "AI prospecting — discover, verify, profile, engage, convert",
    features: [
      {
        id: "pulse",
        title: "Pulse Dashboard",
        what: "The command center for the Paradigm Engine. Shows everything the AI is doing in real time: prospects discovered, sequences running, intent signals detected, hot leads surfaced, and battle cards generated.",
        why: "The Paradigm Engine operates autonomously, but humans need to know what it is doing so they can act on the highest-value outputs. The Pulse Dashboard is the manage-by-exception interface.",
        how: "The top row shows four live counters: Prospects in Pipeline, Sequences Active, Hot Leads Today, and Verified Emails. The AI Activity Feed streams every action in the last 24 hours. The Hot Leads Panel shows prospects who have shown buying intent.",
        automation: "The Pulse Dashboard is the output layer of the entire Paradigm Engine automation stack. Every autonomous action the AI takes appears here in real time.",
        outcome: "A rep who starts their day on the Pulse Dashboard knows exactly who to call, what to say, and why that person is likely to buy — before they pick up the phone.",
      },
      {
        id: "prospect-discovery",
        title: "Prospect Discovery",
        what: "The Sentinel Layer monitors thousands of companies for trigger signals: job changes, funding announcements, competitor complaints, technology stack changes, and hiring patterns. When a signal fires, a prospect record is created automatically.",
        why: "The best time to reach a prospect is when they have a problem you can solve. Trigger-based prospecting means you reach out at the moment of maximum relevance — not randomly.",
        how: "Navigate to Paradigm → Prospects. Set your Ideal Customer Profile (ICP): industry, company size, geography, technology stack, and trigger types. The system continuously monitors for matching companies. New prospects appear in the Prospects queue daily.",
        automation: "Fully automated. The Sentinel Layer runs 24/7. You define the ICP once; the system delivers matching prospects continuously.",
        outcome: "A consistent daily flow of pre-qualified, trigger-validated prospects entering your pipeline without manual research.",
      },
      {
        id: "ghost-sequences",
        title: "Ghost Sequences",
        what: "AI-written, fully personalized multi-touch email sequences that deploy automatically to prospects. Each email is customized using the prospect's Digital Twin psychographic profile — communication style, motivators, and likely objections.",
        why: "Personalization at scale is impossible for humans. A rep can write 10 personalized emails per day. The Ghost Sequence system writes and sends thousands — each one indistinguishable from a hand-crafted message.",
        how: "Navigate to Paradigm → Ghost Sequences. Create a new sequence or use a pre-built template. Set the cadence (Day 1, Day 3, Day 7, Day 14). Enable AI Personalization. Assign to a prospect segment. The system handles everything from that point forward.",
        automation: "Fully automated. The sequence adapts in real time: if a prospect opens but does not reply, the next email references the previous one. If they click a link, the next email focuses on that topic. If they reply, the sequence stops and a hot lead alert fires.",
        outcome: "Ghost Sequences generate qualified replies from prospects who would never have responded to a generic template. The personalization creates the impression of a one-to-one relationship at one-to-many scale.",
      },
    ],
  },
  {
    id: "compliance",
    icon: Shield,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    title: "Compliance & Safety",
    subtitle: "GDPR, CAN-SPAM, suppression, audit trail",
    features: [
      {
        id: "compliance-overview",
        title: "Compliance Overview",
        what: "A dedicated compliance module covering GDPR consent management, CAN-SPAM compliance, suppression list management, unsubscribe processing, and a full audit trail of all data access and modifications.",
        why: "Non-compliance with email regulations can result in fines of up to $50,000 per violation (CAN-SPAM) or €20 million (GDPR). Compliance is not optional — it is a legal requirement and a trust signal to your customers.",
        how: "Navigate to Compliance. The GDPR panel shows consent status for every contact. The Suppression List shows all unsubscribed, bounced, and Do Not Contact addresses. The Audit Trail shows every data access, export, and modification with timestamp and user attribution.",
        automation: "Unsubscribes are processed automatically within 10 business days (CAN-SPAM requirement). Bounced addresses are automatically added to the suppression list. GDPR consent expiry triggers automatic re-consent request emails.",
        outcome: "A compliant sending operation that protects your company from regulatory risk and builds trust with prospects who know their data is handled responsibly.",
      },
    ],
  },
  {
    id: "operations",
    icon: Truck,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    title: "Operations",
    subtitle: "Loads, Carriers, Invoicing, Customer Portal",
    features: [
      {
        id: "loads",
        title: "Load Management",
        what: "Track freight loads from booking to delivery. Each load record contains: shipper, consignee, origin, destination, commodity, weight, equipment type, pickup date, delivery date, carrier, rate, and status.",
        why: "For freight brokers and logistics companies, loads are the unit of revenue. Load Management bridges the gap between CRM (relationship) and TMS (operations) — keeping sales and operations aligned.",
        how: "Navigate to Operations → Loads → New Load. Fill in the load details. Assign a carrier from your Carrier database. Set the rate. Track status through the pipeline: Available → Covered → In Transit → Delivered → Invoiced → Paid.",
        automation: "When a load moves to Delivered, an invoice is automatically generated. When a load is Covered, a confirmation email sends to the shipper automatically. Overdue loads trigger task alerts to the assigned rep.",
        outcome: "Complete operational visibility from the CRM. Sales reps can see the status of every load for every customer without switching to a separate TMS system.",
      },
      {
        id: "carriers",
        title: "Carrier Management",
        what: "A database of vetted carriers with safety ratings, insurance certificates, contact information, preferred lanes, and performance history.",
        why: "Carrier relationships are the supply side of a freight brokerage. A well-maintained carrier database means faster coverage, better rates, and fewer service failures.",
        how: "Navigate to Operations → Carriers → New Carrier. Enter MC/DOT numbers — the system auto-populates safety data from FMCSA. Add contact information, preferred lanes, and rate history. The Carrier Scorecard tracks on-time delivery percentage, claims history, and communication responsiveness.",
        automation: "Carrier insurance expiry triggers automatic renewal reminder emails. When a carrier's safety score drops below threshold, they are automatically flagged and removed from the active carrier pool.",
        outcome: "A curated, performance-tracked carrier network that reduces coverage time and improves service reliability.",
      },
      {
        id: "invoicing",
        title: "Invoicing",
        what: "Generate, send, and track invoices for completed loads. Invoices pull data directly from the load record — no manual re-entry. Track payment status, send reminders, and reconcile accounts receivable.",
        why: "Getting paid is the final step of every sale. Invoicing closes the loop from prospect to paid customer and feeds revenue data back into the CRM for accurate reporting.",
        how: "Navigate to Operations → Invoicing. Invoices are auto-generated when loads reach Delivered status. Review the invoice, add any accessorial charges, and click Send. The customer receives a branded invoice via email with a payment link. Track status: Sent → Viewed → Paid → Overdue.",
        automation: "Overdue invoices trigger automatic reminder sequences at 7, 14, and 30 days. Payment receipt triggers a thank-you email and updates the customer's payment history in their company record.",
        outcome: "Faster collections, fewer manual touchpoints, and a complete revenue record that feeds directly into your analytics.",
      },
    ],
  },
  {
    id: "ai",
    icon: Sparkles,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    title: "AI Premium Tools",
    subtitle: "Email composer, call coach, meeting prep, battle cards",
    features: [
      {
        id: "ai-email",
        title: "AI Email Composer",
        what: "Write high-converting sales emails in seconds. Input the prospect's name, company, your goal (intro, follow-up, re-engagement), and tone — the AI generates a complete, personalized email ready to send or edit.",
        why: "Writing effective sales emails is a skill that takes years to develop. The AI Composer gives every rep access to the writing quality of your best performer, on demand.",
        how: "Navigate to AI Tools → Email Composer. Select the email type. Enter the prospect's name and company. Add any specific context (recent trigger event, previous conversation). Select tone (Professional, Conversational, Direct, Empathetic). Click Generate. Edit as needed and copy to your email client or campaign.",
        automation: "The AI Composer learns from your highest-performing sent emails. Over time, it incorporates the patterns from your best emails into every generation.",
        outcome: "Higher-quality outreach at higher volume. Reps spend time on conversations, not on staring at blank screens.",
      },
      {
        id: "ai-assistant",
        title: "AI CRM Assistant",
        what: "A conversational AI assistant fully versed in every aspect of REALM CRM. Ask it anything — 'How do I set up a workflow?', 'Add a contact named John Smith at Acme Corp', 'Show me my hot leads', 'Create a campaign for my top 50 prospects'. It answers questions and executes CRM tasks directly.",
        why: "The best CRM is one that gets out of your way. The AI Assistant removes friction from every task — instead of navigating menus, you describe what you want and it happens.",
        how: "Click the AI button (bottom-right of any screen). Type your request in natural language. The assistant responds with information or executes the action directly. Examples: 'What is my pipeline value this month?', 'Mark the Johnson deal as closed won', 'Schedule a follow-up call with Sarah at Freight Co for next Tuesday'.",
        automation: "The AI Assistant is connected to every module. It can create contacts, update deals, send campaigns, generate reports, and trigger workflows — all from a single conversation.",
        outcome: "A CRM that works at the speed of thought. The AI Assistant is the fastest path from intention to action in the entire system.",
      },
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    title: "Analytics & Reports",
    subtitle: "Pipeline, campaigns, team, deliverability",
    features: [
      {
        id: "reports",
        title: "Reports",
        what: "Comprehensive reporting across every dimension of your sales and marketing operation: pipeline performance, campaign metrics, deliverability trends, team performance, revenue forecasting, and ROI analysis.",
        why: "You cannot improve what you do not measure. Analytics gives you the data to answer the most important questions in sales management: Where is revenue coming from? Which reps are performing? Which campaigns are working?",
        how: "Navigate to Analytics and select a report category from the left panel. The Pipeline Report shows deals by stage, average deal size, win rate, and average sales cycle length. The Campaign Report shows open rates, click rates, bounce rates, and revenue attributed to each campaign. The Team Report shows individual rep performance against quota — Sales Managers see their Account Managers; Office Managers see their Coordinators.",
        automation: "All report data updates in real time as activities are logged, deals advance, and campaigns send. No manual data entry or report generation required.",
        outcome: "Data-driven sales leadership. The teams that review analytics weekly make better decisions, allocate resources more effectively, and hit their numbers more consistently.",
      },
    ],
  },
  {
    id: "settings",
    icon: Settings,
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    title: "Settings & Admin",
    subtitle: "Branding, integrations, billing, API, role access",
    features: [
      {
        id: "company-settings",
        title: "Company Settings & Branding",
        what: "Configure all account-level preferences: Company Profile (name, logo, address), User Profile, Notification Preferences, Email Signature, and API access. The Company Branding section lets you upload your logo or generate one with AI — this logo appears in the sidebar, top nav, and all outbound emails.",
        why: "A CRM that carries your company's identity feels like your tool, not a generic software product. Branding builds team pride and reinforces your company's identity in every customer interaction.",
        how: "Navigate to Settings → Company. Upload your logo (PNG or SVG, recommended 200×200px) or click AI Generate to create one from your company name. The logo appears immediately in the sidebar header and top navigation.",
        automation: "Your company logo is automatically included in all outbound email footers and in the Customer Portal header.",
        outcome: "A fully branded CRM experience that reinforces your company's identity to every team member and every customer who interacts with your portal.",
      },
      {
        id: "role-access",
        title: "Role-Based Access Control",
        what: "Every user in REALM CRM is assigned a role that determines which sections of the CRM they can access by default. The hierarchy is: Developer → REALM Owner → Company Admin → Sales Manager / Office Manager → Account Manager / Coordinator.",
        why: "Not every team member needs access to every feature. Role-based access protects sensitive data, reduces cognitive overload for front-line users, and ensures that advanced features are only used by people trained to use them correctly.",
        how: "Default access is assigned automatically based on role. Company Admins can extend access to specific users via the Share system (see CRM Bible Sharing below). To change a user's role, navigate to Team → click the user → Edit Role.",
        automation: "Role changes take effect immediately. When a user is promoted from Account Manager to Sales Manager, their access expands automatically — no manual permission updates required.",
        outcome: "A clean, uncluttered interface for front-line users and full visibility for managers and admins — each person sees exactly what they need to do their job effectively.",
      },
      {
        id: "bible-sharing",
        title: "CRM Bible Sharing",
        what: "Any user with access to a CRM Bible section can share that section — or individual features within it — with any other user in the same company. Shares can be View Only or Collaborate (the recipient can also share further). Shares are revocable at any time.",
        why: "Cross-functional projects require cross-functional knowledge. A Coordinator working on a marketing campaign needs to understand the Marketing section. A Sales Manager collaborating with the Office Manager on compliance needs to share relevant documentation. The Share system enables this without permanently changing anyone's role.",
        how: "On any section header or feature card in the CRM Bible, click the Share button. Search for the team member by name. Select View Only or Collaborate. Click Share. The recipient immediately gains access to that section or feature. To revoke, open the Shared With Me panel (top of the Bible page) and click Revoke next to any active share.",
        automation: "Share grants take effect immediately. No admin approval required. The grantor retains the ability to revoke at any time. Admins can revoke any share in the system.",
        outcome: "Flexible, project-based knowledge sharing that respects the default role hierarchy while enabling collaboration across teams without permanent permission changes.",
      },
      {
        id: "integrations-settings",
        title: "Integrations",
        what: "Connect external services to REALM CRM: Apollo.io (lead sourcing), NeverBounce (email verification), SendGrid (additional sending capacity), PhantomBuster (LinkedIn automation), and Google AI Studio (enhanced AI features).",
        why: "No single tool does everything. Integrations let REALM CRM serve as the hub that connects your entire sales technology stack.",
        how: "Navigate to Paradigm → Integrations. Each integration card shows the connection status and required credentials. Click Connect, enter your API key, and click Test Connection to verify.",
        automation: "Connected integrations feed data automatically into REALM CRM. Apollo.io sends new prospects to the Paradigm Engine. NeverBounce verifies emails before they are added to the system.",
        outcome: "A connected tech stack where data flows automatically between tools, eliminating manual imports, exports, and copy-paste workflows.",
      },
      {
        id: "billing-history",
        title: "Billing History",
        what: "The Billing History page is a read-only ledger of every payment your company has made to REALM CRM. It shows each invoice with its date, amount, plan name, payment status (Paid, Open, or Void), and a direct link to download the PDF invoice from Stripe. The page also displays your current subscription plan and the total amount paid to date.",
        why: "Finance teams, accountants, and Company Admins need a reliable record of subscription payments for budgeting, expense reporting, and audit purposes. Rather than emailing the REALM Owner every time an invoice is needed, the Billing History page gives authorized users instant self-service access to the complete payment record.",
        how: "Navigate to Resources → Billing History. The page loads your Stripe invoice history automatically. Each row shows the invoice date, description (e.g., 'REALM CRM Professional — March 2026'), amount, and status. Click the PDF icon on any row to open the Stripe-hosted invoice in a new tab for download or printing. The summary card at the top shows your current plan and total lifetime spend.",
        automation: "Billing History is updated automatically by Stripe webhooks. Every time a payment succeeds or fails, the invoice record is updated in real time. No manual refresh or sync is required. If a payment fails, the status changes to 'Open' and the Payment Failed Banner appears on the dashboard.",
        outcome: "Company Admins have instant, self-service access to the full payment history without needing to contact the REALM Owner or log into Stripe. This eliminates a recurring administrative bottleneck and ensures accounting teams always have the records they need.",
      },
      {
        id: "payment-failed-banner",
        title: "Payment Failed Banner",
        what: "The Payment Failed Banner is a high-visibility alert that appears at the top of every CRM page when your company's Stripe subscription is past-due or has an unpaid invoice. It displays a clear message — 'Payment issue detected' — with a direct 'Resolve Payment' button that takes the authorized user to the Billing & Plans page.",
        why: "A failed payment can result in service interruption for your entire team. The banner ensures that the right people (Company Admins and above) are immediately aware of a payment issue the moment they log in, so it can be resolved before it affects the team's access.",
        how: "The banner appears automatically — no configuration needed. When Stripe reports a subscription status of 'past_due' or 'unpaid', the banner renders above the main content area on every page. Click 'Resolve Payment' to go directly to Billing & Plans, where an REALM Owner can update the payment method via the Stripe portal. The banner disappears automatically once the payment is resolved and the subscription status returns to 'active'.",
        automation: "Stripe webhooks update the subscription status in real time. The banner checks the status on every page load for Company Admin, REALM Owner, and Developer roles. When the payment is resolved, the webhook fires, the status updates, and the banner is removed without any manual action.",
        outcome: "Zero service interruptions due to missed payments. The banner creates an unavoidable, immediate call-to-action for the people who can resolve the issue, reducing the window between a failed payment and resolution from days to minutes.",
      },
      {
        id: "email-infrastructure",
        title: "Email Infrastructure Setup",
        what: "The Email Infrastructure Setup wizard is a guided, three-path tool that helps any company — from a brand-new startup to an established enterprise — configure professional email sending infrastructure. It covers domain verification, DNS record setup (SPF, DKIM, DMARC, MX), and email hosting configuration for Google Workspace and Microsoft 365.",
        why: "Email deliverability is the foundation of every campaign, sequence, and outreach in REALM CRM. Without properly configured DNS records, your emails land in spam — or worse, get your domain blacklisted. Most CRMs leave users to figure this out alone. REALM CRM guides you through the entire process, regardless of your technical background.",
        how: "Navigate to Resources → Email Infrastructure. Choose one of three paths: (1) Connect Existing Domain — enter your domain and run a live DNS check. The wizard shows the exact status of your SPF, DKIM, DMARC, and MX records with color-coded pass/fail indicators and copy-paste fix values for any failing records. (2) Connect Google Workspace or Microsoft 365 — select your provider and the wizard generates the exact DNS records you need to add to your registrar, pre-filled with your domain. (3) Start Fresh — search for domain availability, get registrar recommendations with direct purchase links (Namecheap, GoDaddy, Cloudflare), then follow the step-by-step DNS setup guide. After any path, click Verify to confirm all records are live.",
        automation: "Once your domain passes verification, REALM CRM automatically enrolls it in the Email Warmup module — a graduated sending schedule that builds your domain's sender reputation over 30 days. The warmup schedule runs in the background without any manual intervention. DNS record status is re-checked automatically every 24 hours and you are notified if any records degrade.",
        outcome: "A fully configured email sending infrastructure that achieves 98%+ inbox placement rates. New companies go from zero to professional email in under 30 minutes. Established companies identify and fix hidden deliverability issues that may have been silently hurting their campaigns for months.",
      },
      {
        id: "billing",
        title: "Billing & Plans",
        what: "The Billing section gives your company visibility into its REALM CRM subscription — the plan your company is on, the next billing date, and a full payment history. Access is split into two tiers: Company Admins can view payment history and the upcoming billing schedule (read-only). REALM Owners and Developers have full management access — they can change plans, update the payment method, download invoices, and cancel through the Stripe billing portal.",
        why: "Company Admins need to see what the company is paying and when, for budgeting and accounting purposes. However, the ability to change or cancel the subscription is a financial decision that belongs at the ownership level only. This split ensures transparency without risk.",
        how: "Company Admins: Navigate to Billing to view the current plan, next billing date, and payment history. All controls are read-only. REALM Owners and Developers: All of the above, plus the ability to click Upgrade to compare plans and initiate a Stripe checkout, or click Manage Billing to open the Stripe portal for payment method updates, invoice downloads, or cancellation.",
        automation: "Subscription status is checked automatically on every login. If a payment fails, the system sends automated reminder emails to the REALM Owner with a direct link to update the payment method. Subscription changes take effect immediately and are reflected in the billing history for all authorized viewers.",
        outcome: "Full financial transparency for Company Admins without the risk of accidental plan changes or cancellations. Ownership retains complete control over the subscription while the admin team stays informed.",
      },
    ],
  },
];

// ─── Share Modal ──────────────────────────────────────────────────────────────

function ShareModal({
  open, onClose, sectionId, featureId, sectionTitle, featureTitle,
}: {
  open: boolean;
  onClose: () => void;
  sectionId: string;
  featureId?: string;
  sectionTitle: string;
  featureTitle?: string;
}) {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string | null; email: string | null; systemRole: string } | null>(null);
  const [permission, setPermission] = useState<"view" | "collaborate">("view");

  const searchQuery = trpc.bibleShares.searchUsers.useQuery(
    { query },
    { enabled: query.length >= 2 }
  );
  const shareMutation = trpc.bibleShares.share.useMutation({
    onSuccess: () => {
      toast.success("Shared successfully", { description: `${featureTitle ?? sectionTitle} shared with ${selectedUser?.name ?? "user"}.` });
      onClose();
      setQuery("");
      setSelectedUser(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleShare = () => {
    if (!selectedUser) return;
    shareMutation.mutate({ sharedWithUserId: selectedUser.id, sectionId, featureId, permission });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            Share {featureTitle ? `"${featureTitle}"` : `"${sectionTitle}" section`}
          </DialogTitle>
          <DialogDescription>
            Search for a team member to share this {featureTitle ? "feature" : "section"} with.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or email..."
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedUser(null); }}
            />
          </div>

          {query.length >= 2 && searchQuery.data && searchQuery.data.length > 0 && !selectedUser && (
            <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
              {searchQuery.data.map((u: { id: number; name: string | null; email: string | null; systemRole: string }) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted text-left transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {(u.name ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email} · {u.systemRole.replace(/_/g, " ")}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.length >= 2 && searchQuery.data?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">No team members found.</p>
          )}

          {selectedUser && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {(selectedUser.name ?? "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{selectedUser.name}</p>
                <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permission</label>
            <Select value={permission} onValueChange={v => setPermission(v as "view" | "collaborate")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Only — can read but cannot share further</span>
                  </div>
                </SelectItem>
                <SelectItem value="collaborate">
                  <div className="flex items-center gap-2">
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Collaborate — can also share with others</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1"
              disabled={!selectedUser || shareMutation.isPending}
              onClick={handleShare}
            >
              {shareMutation.isPending ? "Sharing..." : "Share"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({ feature, sectionId, sectionTitle, sectionColor, sectionBg, sectionBorder, canShare }: {
  feature: typeof SECTIONS[0]["features"][0];
  sectionId: string;
  sectionTitle: string;
  sectionColor: string;
  sectionBg: string;
  sectionBorder: string;
  canShare: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const pillClass = `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sectionBg} ${sectionColor} border ${sectionBorder}`;

  return (
    <>
      <div className={`rounded-xl border bg-card transition-all duration-200 ${open ? "shadow-md" : "hover:shadow-sm"}`}>
        <div className="flex items-center">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex-1 flex items-center justify-between px-5 py-4 text-left"
          >
            <span className="font-semibold text-foreground text-sm">{feature.title}</span>
            {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          </button>
          {canShare && (
            <button
              onClick={() => setShareOpen(true)}
              className="px-3 py-4 text-muted-foreground hover:text-primary transition-colors"
              title="Share this feature"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {open && (
          <div className="px-5 pb-5 space-y-4 border-t pt-4">
            <div>
              <span className={pillClass}>What it is</span>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.what}</p>
            </div>
            <div>
              <span className={pillClass}>Why it exists</span>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.why}</p>
            </div>
            <div>
              <span className={pillClass}>How to use it</span>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.how}</p>
            </div>
            <div>
              <span className={pillClass}>Automation connection</span>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.automation}</p>
            </div>
            <div>
              <span className={pillClass}>Sales outcome</span>
              <p className="mt-2 text-sm font-medium text-foreground leading-relaxed">{feature.outcome}</p>
            </div>
          </div>
        )}
      </div>

      {shareOpen && (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          sectionId={sectionId}
          featureId={feature.id}
          sectionTitle={sectionTitle}
          featureTitle={feature.title}
        />
      )}
    </>
  );
}

// ─── Shared With Me Panel ─────────────────────────────────────────────────────

function SharedWithMePanel() {
  const utils = trpc.useUtils();
  const { data: sharedWithMe = [] } = trpc.bibleShares.listSharedWithMe.useQuery();
  const { data: myShares = [] } = trpc.bibleShares.listMyShares.useQuery();
  const revokeMutation = trpc.bibleShares.revoke.useMutation({
    onSuccess: () => {
      utils.bibleShares.listMyShares.invalidate();
      utils.bibleShares.listSharedWithMe.invalidate();
      toast.success("Share revoked");
    },
  });

  if (sharedWithMe.length === 0 && myShares.length === 0) return null;

  return (
    <div className="mb-8 rounded-xl border bg-card p-5">
      <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
        <Share2 className="h-4 w-4 text-primary" />
        Shared Access
      </h3>
      <Tabs defaultValue="received">
        <TabsList className="mb-4">
          <TabsTrigger value="received">Shared With Me {sharedWithMe.length > 0 && `(${sharedWithMe.length})`}</TabsTrigger>
          <TabsTrigger value="granted">I've Shared {myShares.length > 0 && `(${myShares.length})`}</TabsTrigger>
        </TabsList>
        <TabsContent value="received">
          {sharedWithMe.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sections have been shared with you yet.</p>
          ) : (
            <div className="space-y-2">
              {sharedWithMe.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <div>
                    <span className="font-medium">{s.featureId ? `Feature: ${s.featureId}` : `Section: ${s.sectionId}`}</span>
                    <span className="text-muted-foreground ml-2">from {s.grantorName}</span>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{s.permission}</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="granted">
          {myShares.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven't shared anything yet.</p>
          ) : (
            <div className="space-y-2">
              {myShares.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <div>
                    <span className="font-medium">{s.featureId ? `Feature: ${s.featureId}` : `Section: ${s.sectionId}`}</span>
                    <span className="text-muted-foreground ml-2">→ {s.recipientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">{s.permission}</Badge>
                    <button
                      onClick={() => revokeMutation.mutate({ shareId: s.id as number })}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                      title="Revoke share"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

const ROLE_DISPLAY: Record<string, { label: string; color: string }> = {
  developer: { label: "Developer", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  realm_owner: { label: "REALM Owner", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  super_admin: { label: "Super Admin", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  company_admin: { label: "Company Admin", color: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
  sales_manager: { label: "Sales Manager", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  office_manager: { label: "Office Manager", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
  manager: { label: "Manager", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  account_manager: { label: "Account Manager", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  coordinator: { label: "Coordinator", color: "bg-teal-500/10 text-teal-500 border-teal-500/20" },
  sales_rep: { label: "Sales Rep", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  user: { label: "User", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CRMBible() {
  const { t } = useSkin();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [shareSectionOpen, setShareSectionOpen] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data: sharedWithMe = [] } = trpc.bibleShares.listSharedWithMe.useQuery();

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  const userRole = (user as any)?.systemRole ?? "user";
  const userLevel = ROLE_LEVEL[userRole] ?? 30;

  // Build set of section IDs shared with this user
  const sharedSectionIds = new Set(
    (sharedWithMe as any[]).filter(s => !s.featureId).map((s: any) => s.sectionId)
  );
  const sharedFeatureIds = new Set(
    (sharedWithMe as any[]).filter(s => s.featureId).map((s: any) => `${s.sectionId}::${s.featureId}`)
  );

  // Determine if user can see a section
  const canSeeSection = (sectionId: string) => {
    const minLevel = SECTION_MIN_LEVEL[sectionId] ?? 30;
    return userLevel >= minLevel || sharedSectionIds.has(sectionId);
  };

  // Determine if user can see a feature (section visible OR feature specifically shared)
  const canSeeFeature = (sectionId: string, featureId: string) => {
    return canSeeSection(sectionId) || sharedFeatureIds.has(`${sectionId}::${featureId}`);
  };

  // Can user share? They must be able to see the section
  const canShare = (sectionId: string) => canSeeSection(sectionId);

  const visibleSections = SECTIONS
    .filter(s => canSeeSection(s.id))
    .map(s => ({
      ...s,
      features: s.features.filter(f => canSeeFeature(s.id, f.id)),
    }))
    .filter(s => s.features.length > 0);

  const filteredSections = visibleSections.map(section => ({
    ...section,
    features: section.features.filter(f => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.what.toLowerCase().includes(q) ||
        f.why.toLowerCase().includes(q) ||
        f.how.toLowerCase().includes(q) ||
        f.automation.toLowerCase().includes(q) ||
        f.outcome.toLowerCase().includes(q) ||
        section.title.toLowerCase().includes(q)
      );
    }),
  })).filter(s => s.features.length > 0);

  const totalFeatures = visibleSections.reduce((acc, s) => acc + s.features.length, 0);
  const roleDisplay = ROLE_DISPLAY[userRole] ?? { label: userRole, color: "bg-slate-500/10 text-slate-500 border-slate-500/20" };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <div className="border-b bg-gradient-to-br from-background via-background to-primary/5 px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">REALM CRM Bible</h1>
              <p className="text-sm text-muted-foreground">The complete operator's guide — from first contact to closed deal</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <Badge variant="secondary">{visibleSections.length} sections</Badge>
            <Badge variant="secondary">{totalFeatures} features documented</Badge>
            <Badge variant="secondary">What · Why · How · Automation · Outcome</Badge>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleDisplay.color}`}>
              <Lock className="h-3 w-3" />
              Viewing as: {roleDisplay.label}
            </span>
          </div>

          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search any feature, workflow, or concept..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
        {/* ── Sticky TOC ── */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-6 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Sections</p>
            {visibleSections.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-all text-left ${
                    activeSection === section.id
                      ? `${section.bg} ${section.color} font-semibold`
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{section.title}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Content ── */}
        <main className="flex-1 min-w-0 space-y-10">
          {/* Shared Access Panel */}
          <SharedWithMePanel />

          {search && filteredSections.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No results for "{search}"</p>
              <p className="text-sm mt-1">Try a different keyword or browse the sections on the left.</p>
            </div>
          )}

          {filteredSections.map(section => {
            const Icon = section.icon;
            return (
              <section
                key={section.id}
                ref={el => { sectionRefs.current[section.id] = el as HTMLDivElement | null; }}
                id={section.id}
              >
                {/* Section header */}
                <div className={`flex items-center gap-3 mb-4 p-4 rounded-xl border ${section.bg} ${section.border}`}>
                  <div className={`h-9 w-9 rounded-lg ${section.bg} border ${section.border} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-4.5 w-4.5 ${section.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className={`text-lg font-black ${section.color}`}>{section.title}</h2>
                    <p className="text-xs text-muted-foreground">{section.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {section.features.length} {section.features.length === 1 ? "feature" : "features"}
                    </Badge>
                    {canShare(section.id) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1.5 text-xs"
                        onClick={() => setShareSectionOpen(section.id)}
                      >
                        <Share2 className="h-3 w-3" />
                        Share
                      </Button>
                    )}
                  </div>
                </div>

                {/* Feature cards */}
                <div className="space-y-2">
                  {section.features.map(feature => (
                    <FeatureCard
                      key={feature.id}
                      feature={feature}
                      sectionId={section.id}
                      sectionTitle={section.title}
                      sectionColor={section.color}
                      sectionBg={section.bg}
                      sectionBorder={section.border}
                      canShare={canShare(section.id)}
                    />
                  ))}
                </div>

                {/* Section share modal */}
                {shareSectionOpen === section.id && (
                  <ShareModal
                    open
                    onClose={() => setShareSectionOpen(null)}
                    sectionId={section.id}
                    sectionTitle={section.title}
                  />
                )}
              </section>
            );
          })}

          {/* ── The Sales Machine ── */}
          {!search && (
            <section className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-purple-500/5 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-primary">The Sales Machine</h2>
                  <p className="text-xs text-muted-foreground">How every feature connects — from first signal to closed deal</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { step: "01", label: "Discovery", desc: "The Sentinel Layer monitors thousands of companies for trigger signals: job changes, funding announcements, competitor complaints. A prospect record is created automatically.", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
                  { step: "02", label: "Verification", desc: "The prospect's email is verified through NeverBounce. Invalid emails are discarded. Only verified contacts proceed — keeping your bounce rate below 2%.", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
                  { step: "03", label: "Profiling", desc: "The AI builds a psychographic Digital Twin: communication style, primary motivators, likely objections, and preferred outreach channel.", color: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
                  { step: "04", label: "Scoring", desc: "The prospect receives a Quantum Lead Score across 12 dimensions. High-scoring prospects are prioritized for immediate outreach. Lower scores enter nurture sequences.", color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
                  { step: "05", label: "Engagement", desc: "The AI deploys a personalized Ghost Sequence. Each email is customized using the Digital Twin profile. The sequence adapts in real time based on engagement.", color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20" },
                  { step: "06", label: "Intent Detection", desc: "When the prospect replies with buying intent, the sequence stops. A hot lead alert fires to the assigned rep. A Battle Card is generated instantly.", color: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
                  { step: "07", label: "Conversion", desc: "The prospect converts to a CRM Contact. A Deal is created. The rep uses the Battle Card and Meeting Prep briefing to run a highly personalized discovery call.", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
                  { step: "08", label: "Pipeline Advancement", desc: "As the deal advances through stages, Workflows fire automatically. Win Probability monitors the deal and alerts the rep if momentum is slowing.", color: "text-teal-500 bg-teal-500/10 border-teal-500/20" },
                  { step: "09", label: "Close", desc: "Revenue Autopilot identifies the specific actions that will push the deal to close. The rep executes. The deal moves to Closed Won.", color: "text-green-500 bg-green-500/10 border-green-500/20" },
                  { step: "10", label: "Retention", desc: "A customer onboarding workflow fires. Regular check-in tasks are created. The Customer Portal gives shippers self-service visibility. The cycle begins again for expansion.", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
                ].map(({ step, label, desc, color }) => (
                  <div key={step} className={`flex gap-3 p-3 rounded-xl border ${color.split(" ").slice(1).join(" ")}`}>
                    <span className={`text-xs font-black ${color.split(" ")[0]} shrink-0 w-6 pt-0.5`}>{step}</span>
                    <div>
                      <p className={`text-sm font-bold ${color.split(" ")[0]}`}>{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <blockquote className="mt-6 border-l-4 border-primary pl-4 text-sm text-muted-foreground italic">
                "Every feature in REALM CRM exists to answer one question — <strong className="text-foreground not-italic">what is the next best action to take, for this specific person, right now?</strong> The system answers that question automatically, at scale, for every prospect and customer in your database, simultaneously. Your job is to execute the actions the system surfaces. The machine does the thinking. You do the talking. Together, you close more deals."
              </blockquote>
            </section>
          )}
        </main>
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <Button
          size="icon"
          variant="outline"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
