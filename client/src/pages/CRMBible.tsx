import { useState, useRef, useEffect } from "react";
import { Search, BookOpen, ChevronRight, ChevronDown, ArrowUp, Target, Zap, Brain, Shield, BarChart3, Settings, Layers, Users, Mail, GitBranch, Truck, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
        what: "Team is your user management panel — where you create, edit, and assign roles to every person in your organization. The role hierarchy is: Developer → Apex Owner → Company Admin → Sales Manager / Office Manager → Account Manager / Coordinator.",
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
        how: "Navigate to Contacts → New Contact. Fill in: Identity (name, title, company), Communication (email, phone, LinkedIn), Lifecycle Stage, Lead Status, and Marketing Attribution. The Lead Status field has 25+ pre-built statuses: New Lead, Contacted, Quote Sent, Negotiating, Booked, Active Shipper, Inactive, Do Not Contact, and more. Always keep Lead Status current — it drives segmentation and workflow triggers. On the Contact Detail page, log Notes, Calls, Emails, Meetings, or Tasks directly against the contact.",
        automation: "Contact lifecycle stage changes trigger Workflow automations. When a contact moves from Lead to Qualified, a follow-up email sequence fires automatically. When a contact's email bounces, the Paradigm Engine detects the signal and updates the record.",
        outcome: "Contacts with complete records close at higher rates because reps can personalize every touchpoint. The goal is to know your contact better than they know themselves.",
      },
      {
        id: "deals",
        title: "Deals",
        what: "A visual Kanban pipeline that tracks every sales opportunity from first conversation to closed-won or closed-lost. Each deal card represents a specific revenue opportunity with a value, close date, probability, and assigned rep.",
        why: "Without a pipeline, revenue is unpredictable. The Deals module gives you a real-time view of where every dollar of potential revenue sits in your sales process and what your forecast looks like.",
        how: "Navigate to Deals → New Deal. Enter: deal name, associated company and contact, deal value, expected close date, and pipeline stage (Prospect → Qualified → Proposal Sent → Negotiation → Closed Won/Lost). Drag deal cards between columns to advance them. The Weighted Forecast view multiplies each deal's value by its probability percentage to give a realistic revenue forecast. A $50,000 deal at 40% probability contributes $20,000 to the forecast.",
        automation: "Stage changes trigger Workflow automations. Moving a deal to Proposal Sent can automatically send a follow-up email 3 days later if no response is detected. Moving to Closed Won triggers a customer onboarding workflow, creates an invoice, and notifies the operations team.",
        outcome: "A healthy pipeline is the foundation of predictable revenue. Managers use the pipeline to identify stalled deals, coach reps on specific opportunities, and forecast the month's close with confidence.",
      },
      {
        id: "tasks",
        title: "Tasks",
        what: "The atomic unit of sales execution. Every call to make, email to send, follow-up to schedule, and document to review lives in Tasks. Tasks can be assigned to any team member, associated with a contact, company, or deal, and organized into queues.",
        why: "Sales is a game of follow-through. The rep who follows up consistently wins. Tasks ensure that nothing falls through the cracks — every commitment is tracked, every deadline is visible.",
        how: "Create a task from the Tasks page or directly from any contact, company, or deal record. Fill in: Title, Type (Call / Email / To-Do / Follow-Up), Due Date, Assigned To, Priority (Low / Medium / High / Urgent), and Queue. Queues group related tasks — Prospecting Calls, Customer Renewals, Follow-Ups — letting reps batch similar work for maximum focus. When completing a task, fill in the Outcome field and mark it complete to create a permanent activity log entry.",
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
        how: "Navigate to Campaigns → New Campaign. Step 1: Name your campaign and select a goal. Step 2: Choose a template. Step 3: Select your audience — choose a Segment or upload a list. Step 4: Personalize with tokens: {{first_name}}, {{company_name}}, {{rep_name}}. Step 5: Set the send time — immediate, scheduled, or AI-optimized (the system picks the time each recipient is most likely to open). Step 6: Review the pre-send checklist (spam score, compliance check, authentication status) and send.",
        automation: "Campaigns feed directly into Workflows. A contact who opens but does not click can be automatically enrolled in a follow-up sequence. A contact who clicks a pricing link triggers a Hot Lead alert to their assigned rep. Campaign engagement data updates contact lead scores in real time.",
        outcome: "Campaigns keep your brand in front of prospects who are not yet ready to buy. The goal is to stay top-of-mind so that when the prospect is ready, you are the first call they make.",
      },
      {
        id: "templates",
        title: "Email Templates",
        what: "A library of reusable email designs and copy blocks. Templates can be built once and used across unlimited campaigns, with personalization tokens that auto-fill recipient-specific data at send time.",
        why: "Without templates, every rep writes emails from scratch — inconsistent quality, inconsistent branding, wasted time. Templates codify your best-performing emails and make them available to the entire team instantly.",
        how: "Navigate to Templates → New Template. Choose a layout. Use the block editor to add text, images, buttons, dividers, and dynamic content blocks. Dynamic blocks show different content based on recipient attributes. Save with a descriptive name and category tag. Select templates in the Campaign builder — all tokens replace with live data at send time.",
        automation: "Templates are the content layer for both Campaigns and Ghost Sequences. When the Paradigm Engine sends an automated email, it uses a template personalized with the prospect's Digital Twin psychographic profile.",
        outcome: "A library of proven templates means your team's best ideas scale to every rep. The top-performing email your best rep ever wrote becomes the default for everyone.",
      },
      {
        id: "deliverability",
        title: "Deliverability",
        what: "Your email health command center. Monitors sending reputation, checks authentication records (SPF, DKIM, DMARC), tracks bounce and complaint rates, and provides AI-powered pre-send spam scoring.",
        why: "An email that lands in spam is worth zero. Deliverability is the invisible foundation of every email campaign. A 98.7% inbox placement rate is a competitive weapon.",
        how: "The Deliverability dashboard shows four health indicators: Authentication Status (green = SPF + DKIM + DMARC all passing), Bounce Rate (target: under 2%), Complaint Rate (target: under 0.1%), and Blacklist Status (monitored across 50+ lists). The Pre-Send Spam Score tool lets you paste any email and receive an AI score from 0–100 with specific fix suggestions. The Authentication Checker walks you through adding DNS records for each sending domain.",
        automation: "When a domain's health score drops below the warning threshold, the system automatically pauses sending from that domain and routes traffic to healthy domains. When a bounce is detected, the contact's email is automatically added to the Suppression List.",
        outcome: "Every percentage point of inbox placement improvement translates directly to more opens, more replies, and more pipeline. Clean, authenticated infrastructure consistently outperforms shared or poorly configured servers.",
      },
      {
        id: "ab-tests",
        title: "A/B Tests",
        what: "Test two or more variations of an email element — subject line, sender name, send time, or body content — against a split of your audience to determine which version performs better, then automatically send the winner to the remainder.",
        why: "Gut instinct is not a strategy. A/B testing replaces opinion with data. Over time, a team that systematically tests and iterates will develop a library of proven, high-performing copy that compounds in effectiveness.",
        how: "Navigate to A/B Tests → New Test. Select the test type. Enter Variant A and Variant B. Set the test split (e.g., 20% gets A, 20% gets B, 60% gets the winner). Set the winning metric (Open Rate, Click Rate, or Reply Rate) and the decision time. After the decision time, the system automatically sends the winning variant to the remaining 60%.",
        automation: "A/B test results feed back into the AI Send Time Optimizer and the AI Email Composer. When a subject line pattern consistently wins, the AI learns to apply that pattern in future Ghost Sequence emails.",
        outcome: "A single winning subject line improvement of 5 percentage points on a 10,000-contact list means 500 more opens per campaign. Over a year of systematic testing, the compounding effect on pipeline is substantial.",
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
        what: "The automation engine of Apex CRM. A Workflow is a set of rules: When [trigger event] happens, and [conditions] are met, then [actions] execute. Workflows run 24/7 without human intervention.",
        why: "The best sales teams are not the ones who work the hardest — they are the ones who have automated everything that can be automated, freeing human attention for the conversations that actually require it.",
        how: "Navigate to Workflows → New Workflow. Step 1: Choose a trigger (Contact Created, Deal Stage Changed, Email Opened, Date-Based, etc.). Step 2: Add conditions to filter which records the workflow applies to. Step 3: Add actions (Send Email, Create Task, Update Field, Add to Segment, Wait X Days, Branch with If/Then logic). Example: Trigger on new lead → Wait 1 hour → Send intro email → Wait 3 days → If opened: send case study / If not: create call task.",
        automation: "Workflows ARE the automation layer. They connect every other module: a campaign open triggers a task, a deal stage change triggers an email, a date triggers a renewal reminder. The more workflows you build, the more the system runs itself.",
        outcome: "A single well-built workflow can replace hours of manual follow-up per week. A team with 10 active workflows running simultaneously is effectively operating with a team twice its size.",
      },
      {
        id: "segments",
        title: "Segments",
        what: "Dynamic, rule-based lists of contacts or companies that automatically update as records change. A Segment is not a static export — it is a living filter that always shows the current members matching your criteria.",
        why: "Sending the same email to everyone on your list is the fastest way to destroy your deliverability and annoy your prospects. Segments let you send the right message to the right people at the right time.",
        how: "Navigate to Segments → New Segment. Build your filter using any combination of fields: Industry, Lifecycle Stage, Lead Status, Last Activity Date, Email Engagement Score, Location, Deal Stage, Tags, and more. Combine filters with AND/OR logic. Example: 'Hot Prospects — Midwest Freight' = Industry is Freight AND State is IL/OH/IN/MI AND Lead Score > 70 AND Last Contacted > 14 days ago.",
        automation: "Segments are available as audience targets in Campaigns and as triggers/conditions in Workflows. When a contact's data changes and they now match a segment's criteria, they are automatically added. When they no longer match, they are automatically removed.",
        outcome: "Segmented campaigns consistently outperform broadcast campaigns by 3–5x on open and click rates. The more precisely you define your audience, the more relevant your message — and relevance is what converts.",
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
        how: "The top row shows four live counters: Prospects in Pipeline, Sequences Active, Hot Leads Today, and Verified Emails. The AI Activity Feed streams every action in the last 24 hours. The Hot Leads Panel shows prospects who have shown buying intent — these are the people your reps should call today.",
        automation: "The Pulse Dashboard is the output layer of the entire Paradigm Engine automation stack. Every autonomous action the AI takes appears here in real time.",
        outcome: "A rep who starts their day on the Pulse Dashboard knows exactly who to call, what to say, and why that person is likely to buy — before they pick up the phone.",
      },
      {
        id: "prospects",
        title: "Prospects",
        what: "The database of AI-discovered leads that have not yet been converted to CRM contacts. Prospects are sourced from trigger signals and enriched with psychographic profiles before any human touches them.",
        why: "Traditional prospecting is manual, slow, and inconsistent. The Paradigm Engine discovers and qualifies prospects automatically, so your reps only spend time on leads that have already been verified and profiled.",
        how: "Navigate to Paradigm → Prospects. Each row shows: Name, Company, Title, Verification Status, Quantum Lead Score, Engagement Stage, and the trigger signal that surfaced them. Click a prospect to open their full profile including their Digital Twin psychographic analysis. To convert to a CRM contact, click Convert to Contact — all enriched data pre-fills automatically.",
        automation: "Prospects flow automatically from the Sentinel Layer (signal detection) → Nutrition Gate (email verification) → Digital Twin (psychographic profiling) → Quantum Score (lead scoring) → Ghost Sequences (automated engagement).",
        outcome: "Every prospect in this list has been machine-verified and AI-scored. Your reps are not cold calling — they are calling people who have been identified as likely buyers, at the moment they are most likely to be receptive.",
      },
      {
        id: "signals",
        title: "Signals (Sentinel Layer)",
        what: "Trigger events that indicate a prospect may be entering a buying window. The Sentinel Layer monitors job changes, company news, patent filings, social media complaints about competitors, and funding announcements — 24/7, across thousands of companies simultaneously.",
        why: "Timing is everything in sales. A prospect who just got promoted to VP of Logistics is in a buying window — they want to make their mark, they have budget authority, and they are evaluating new vendors.",
        how: "Navigate to Paradigm → Signals to see the live signal feed. Each signal shows: the company, the event type, the date, the confidence score, and the recommended action. Use filters to focus on specific signal types (Job Changes, Funding, Social Complaints, News).",
        automation: "When a high-confidence signal is detected for a prospect already in a Ghost Sequence, the sequence automatically adapts — inserting a signal-specific email: 'Congratulations on your new role — here is how Apex CRM can help you hit your Q1 targets.'",
        outcome: "Signal-triggered outreach converts at 3–5x the rate of cold outreach because you are reaching the right person at the right time with the right message.",
      },
      {
        id: "ghost-sequences",
        title: "Ghost Sequences",
        what: "Multi-stage automated follow-up sequences that the AI deploys to prospects. Each sequence consists of 4–8 touchpoints across email and task reminders, spaced over days or weeks, with AI-personalized content at each stage.",
        why: "Most sales require 7–12 touchpoints before a prospect responds. Most reps give up after 2. Ghost Sequences ensure that every prospect receives the full follow-up cadence, every time, without the rep having to remember to do it.",
        how: "Navigate to Paradigm → Ghost Sequences → New Sequence. Define the sequence name and goal. Add steps: each step is either an Email (with a template and personalization instructions) or a Task. Set the delay between steps. Set exit conditions: 'Stop sequence if prospect replies' or 'Stop if prospect books a meeting.' The AI personalizes each email using the prospect's Digital Twin profile.",
        automation: "Sequences are triggered automatically when a prospect reaches a Quantum Score threshold, when a Signal is detected, or when a rep manually enrolls a prospect. Positive Intent Detection monitors all replies — when a reply shows buying intent, the sequence stops and a hot lead alert fires to the assigned rep.",
        outcome: "A rep running 50 active Ghost Sequences is effectively having 50 simultaneous sales conversations — without spending 50x the time. The sequences do the follow-up; the rep does the closing.",
      },
      {
        id: "battle-cards",
        title: "Battle Cards",
        what: "One-page AI-generated tactical summaries for hot leads. When a prospect shows buying intent, the AI synthesizes everything known about them into a concise briefing: who they are, what they care about, what objections to expect, and the recommended close strategy.",
        why: "The moment a hot lead responds, the rep has minutes to prepare for a call. A Battle Card gives them everything they need to know in 60 seconds.",
        how: "Navigate to Paradigm → Battle Cards to see all generated cards. Each card shows: Prospect Name, Company, Role, Quantum Score, Recommended Approach, Key Pain Points, Likely Objections, and Suggested Opening. Click Generate New Card to create one for any prospect manually.",
        automation: "Battle Cards are generated automatically when a prospect's Positive Intent score crosses the threshold. They are also regenerated when new signals are detected for an existing hot lead.",
        outcome: "Reps who use Battle Cards before calls close at significantly higher rates because they walk into every conversation with a personalized strategy — not a generic pitch.",
      },
      {
        id: "quantum-score",
        title: "Quantum Score",
        what: "A 0–100 AI-generated score that predicts the likelihood of a prospect converting to a customer. Calculated across 12 dimensions: firmographic fit, behavioral signals, engagement velocity, timing indicators, social proof, content consumption, recency, frequency, monetary signals, channel preference, intent signals, and relationship depth.",
        why: "Not all leads are equal. A rep who spends equal time on a score-20 lead and a score-85 lead is misallocating their most valuable resource: time.",
        how: "Navigate to Paradigm → Quantum Score to see the scoring model configuration. Adjust the weight of each dimension to match your specific sales model. The score updates in real time as new data comes in — an email open adds points, a reply adds more, a meeting booked adds the most. Use the score as the primary sorting criterion on the Prospects list. Work the 80+ scores first, every day.",
        automation: "The Quantum Score is the trigger for Ghost Sequence enrollment (score crosses 60 → sequence starts), hot lead alerts (score crosses 80 → rep notified), and Battle Card generation (score crosses 85 → card created).",
        outcome: "Teams that prioritize by Quantum Score consistently outperform teams that work leads in chronological order. The score is the algorithm that replaces gut instinct with data-driven prioritization.",
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
    subtitle: "CAN-SPAM, GDPR, CCPA, Suppression",
    features: [
      {
        id: "compliance-center",
        title: "Compliance Center",
        what: "Your legal protection layer. Enforces CAN-SPAM, GDPR, and CCPA requirements on every email sent, blocking non-compliant sends before they happen and maintaining a full audit log of every action.",
        why: "A single CAN-SPAM violation can result in a fine of up to $51,744 per email. GDPR violations can reach €20 million or 4% of global annual revenue. Compliance is not optional — it is existential.",
        how: "The Pre-Send Validator runs automatically on every campaign, checking: physical address present, unsubscribe link present, subject line not deceptive, sender identity not misleading, and list consent status. If any check fails, the send is blocked with a specific explanation. The GDPR Consent Tracker shows every contact's consent status. The Right to Erasure tool permanently deletes a contact's data from all systems with one click, generating a deletion certificate.",
        automation: "When a contact unsubscribes, they are immediately and automatically added to the Suppression List. The system honors opt-outs within seconds, not the 10-business-day maximum allowed by law.",
        outcome: "A compliant sending operation is a sustainable one. Teams that ignore compliance eventually face deliverability crises, legal exposure, or both.",
      },
      {
        id: "suppression",
        title: "Suppression List",
        what: "The master do-not-contact registry. Any email address on this list will never receive an email from your system, regardless of what campaigns or sequences are running.",
        why: "Sending to people who have opted out is illegal, damages your reputation, and destroys trust. The Suppression List is the safety net that prevents this from ever happening.",
        how: "Navigate to Suppression List to view, search, and manage the list. Addresses are added automatically when a contact unsubscribes, when an email hard-bounces, or when a complaint is received. You can also manually add addresses or upload a CSV.",
        automation: "Every send — campaign, sequence, or individual — is checked against the Suppression List before delivery. Suppressed addresses are silently skipped. No manual intervention required.",
        outcome: "A clean suppression list protects your sender reputation, keeps you legally compliant, and ensures your emails only reach people who want to receive them.",
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
    subtitle: "Load Management, Carrier Vetting, Invoicing, Portal",
    features: [
      {
        id: "load-management",
        title: "Load Management",
        what: "The freight-specific operations module for managing active shipments, tracking load status, and coordinating between shippers and carriers. Provides a real-time view of every load from booking to delivery.",
        why: "Freight brokers live and die by their ability to cover loads quickly and keep shippers informed. Load Management centralizes all load data so nothing falls through the cracks.",
        how: "Navigate to Loads to see the load board. Each load card shows: Load ID, Origin, Destination, Pickup Date, Delivery Date, Carrier, Status, and Rate. Use status filters to view loads by stage: Available, Covered, In Transit, Delivered, Invoiced. Click any load to open the full detail view with all associated documents, communications, and status history.",
        automation: "When a load is marked Delivered, a Workflow can automatically trigger invoice creation, send a delivery confirmation to the shipper, and create a follow-up task for the rep to check in on the next load opportunity.",
        outcome: "Centralized load management reduces errors, speeds up coverage time, and gives shippers the visibility they expect — which drives repeat business.",
      },
      {
        id: "carrier-vetting",
        title: "Carrier Vetting",
        what: "Automates the process of verifying carrier safety records, insurance certificates, and operating authority before booking a load. Connects to FMCSA data and insurance verification services to flag high-risk carriers automatically.",
        why: "Using an unvetted carrier exposes your brokerage to significant liability. Carrier Vetting makes due diligence fast, consistent, and documented.",
        how: "Navigate to Carrier Vetting and enter a carrier's MC number or DOT number. The system returns a full vetting report: safety rating, insurance status, authority status, out-of-service percentage, and any recent violations. Carriers that pass all checks are marked Approved. Carriers with issues are flagged with specific concerns.",
        automation: "Approved carriers are automatically added to your preferred carrier pool. When a load is posted, the system can automatically notify approved carriers in the relevant lane.",
        outcome: "Consistent, documented carrier vetting protects your brokerage from liability, builds shipper trust, and creates a defensible compliance record.",
      },
      {
        id: "invoicing",
        title: "Invoicing",
        what: "Generates, sends, and tracks freight invoices. Pulls load data automatically to pre-fill invoice line items, sends invoices directly to shipper contacts, and tracks payment status.",
        why: "Manual invoicing is slow, error-prone, and creates cash flow delays. Automated invoicing gets invoices out faster and makes it easier for shippers to pay.",
        how: "Navigate to Invoicing → New Invoice. Select the associated load — all rate and party information pre-fills automatically. Add any accessorial charges. Review and send. The invoice is emailed to the shipper's billing contact with a payment link. Track payment status on the Invoicing dashboard.",
        automation: "When a load is marked Delivered, a Workflow can automatically trigger invoice creation. Overdue invoices trigger automatic reminder emails to the shipper's billing contact.",
        outcome: "Faster invoicing means faster payment. Automated reminders reduce days-sales-outstanding without requiring manual follow-up from your team.",
      },
      {
        id: "customer-portal",
        title: "Customer Portal",
        what: "A white-labeled self-service portal where your shipper customers can log in, view their active loads, download invoices, submit new load requests, and communicate with their rep — without calling or emailing.",
        why: "Shippers want visibility without friction. A portal reduces inbound 'where's my load?' calls by 60–80%, freeing your team to focus on selling rather than status updates.",
        how: "Navigate to Customer Portal to configure the portal settings: custom domain, branding, and access permissions. Share the portal URL with your shipper contacts. They create their own login and immediately have access to their load history, active shipments, and invoices.",
        automation: "Load status updates in the portal are automatic — as you update load status in Load Management, the portal reflects the change in real time. No manual portal updates required.",
        outcome: "A self-service portal is a retention tool. Shippers who have visibility into their shipments are more satisfied, more loyal, and less likely to shop your competitors.",
      },
    ],
  },
  {
    id: "ai-premium",
    icon: Sparkles,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    title: "AI Premium Tools",
    subtitle: "Voice, DocScan, Win Probability, Ghostwriter, and more",
    features: [
      {
        id: "voice-agent",
        title: "Voice Agent",
        what: "An AI-powered call assistant that listens to sales calls in real time, provides live coaching prompts, transcribes the conversation, and generates a post-call summary with action items.",
        why: "Most sales coaching happens after the fact — reviewing recordings, giving feedback on what should have been said. Voice Agent provides coaching in the moment, when it can actually change the outcome of the call.",
        how: "Navigate to Voice Agent and connect your phone system. When a call begins, the Voice Agent activates automatically. During the call, it displays real-time prompts: 'Prospect mentioned budget — ask about timeline,' 'Competitor mentioned — use Battle Card objection handler.' After the call, the full transcript and AI summary are saved to the contact record automatically.",
        automation: "Post-call summaries automatically create follow-up tasks based on the commitments made during the call. 'I'll send you a proposal by Friday' becomes a task: 'Send proposal — due Friday.'",
        outcome: "Reps who use Voice Agent close more deals because they get real-time guidance on the most critical moments of the sales process — the live conversation.",
      },
      {
        id: "docscan",
        title: "DocScan",
        what: "Uses AI to extract structured data from uploaded documents — rate confirmations, bills of lading, carrier packets, insurance certificates — and automatically populate the relevant fields in Apex CRM.",
        why: "Manual data entry from documents is slow, error-prone, and a waste of skilled rep time. DocScan eliminates this entirely.",
        how: "Navigate to DocScan → Upload Document. Select the document type and upload the file. The AI extracts all relevant data fields and presents them for review. Confirm the extraction and the data is written to the appropriate records automatically.",
        automation: "DocScan can be triggered automatically when a document is received via email attachment. The system detects the document type, extracts the data, and creates or updates the relevant records without human intervention.",
        outcome: "Faster data entry, fewer errors, and more time for reps to focus on selling rather than administrative tasks.",
      },
      {
        id: "win-probability",
        title: "Win Probability",
        what: "Uses machine learning to predict the likelihood of closing each deal in your pipeline, based on historical win/loss patterns, deal characteristics, engagement signals, and time-in-stage data.",
        why: "Not all deals in your pipeline are equally likely to close. Win Probability tells you which deals deserve your attention and which are at risk of being lost.",
        how: "Navigate to Win Probability to see every open deal ranked by predicted close probability. Deals with high probability and high value are your priority. Deals with dropping probability are at risk — the system flags these with specific reasons: 'No activity in 14 days,' 'Proposal not opened,' 'Competitor mentioned in last call.'",
        automation: "When a deal's Win Probability drops below a threshold, a Smart Notification fires to the assigned rep and their manager. A Workflow can automatically trigger a re-engagement email or create a task: 'Reach out — deal at risk.'",
        outcome: "Managers who review Win Probability weekly catch at-risk deals before they are lost. Reps who prioritize by probability close more revenue in less time.",
      },
      {
        id: "revenue-autopilot",
        title: "Revenue Autopilot",
        what: "An AI-driven revenue forecasting and optimization engine. Analyzes your pipeline, historical conversion rates, seasonal patterns, and rep performance to generate a rolling 90-day revenue forecast and identify specific actions that will increase it.",
        why: "Revenue forecasting without AI is guesswork. Revenue Autopilot gives you a data-driven forecast with specific, actionable recommendations to improve it.",
        how: "Navigate to Revenue Autopilot to see the forecast dashboard. The top section shows the 90-day forecast with confidence intervals. The Optimization Recommendations panel lists specific actions: 'Advance these 5 deals — they are 80% likely to close this month with one more touchpoint,' 'These 3 reps are underperforming vs. forecast — review their pipelines.'",
        automation: "Revenue Autopilot continuously updates its forecast as deals advance, stall, or close. Recommendations update daily based on the latest pipeline data.",
        outcome: "Predictable revenue. Sales leaders who use Revenue Autopilot can commit to revenue targets with confidence and identify the specific actions needed to hit them.",
      },
      {
        id: "ai-ghostwriter",
        title: "AI Ghostwriter",
        what: "Generates personalized email copy, LinkedIn messages, call scripts, and follow-up sequences on demand. Input the prospect's name, company, role, and the context of your outreach, and the Ghostwriter produces polished, personalized copy in seconds.",
        why: "Writing personalized outreach at scale is impossible for humans. The Ghostwriter makes it possible — every prospect gets a message that feels like it was written specifically for them.",
        how: "Navigate to AI Ghostwriter. Select the content type (Email, LinkedIn, Call Script, Follow-Up). Fill in the context fields. Click Generate. Review the output, edit as needed, and copy it to your campaign, template, or sequence. The Ghostwriter learns from your edits over time, improving its output to match your voice.",
        automation: "The Ghostwriter feeds directly into Ghost Sequences — when a new sequence is created, the AI can generate all email copy automatically based on the target persona and sequence goal.",
        outcome: "Reps who use the Ghostwriter send more personalized outreach in less time, resulting in higher reply rates and more pipeline.",
      },
      {
        id: "meeting-prep",
        title: "Meeting Prep",
        what: "Generates a comprehensive briefing document for any upcoming sales call or meeting. Pulls data from the contact record, company record, deal history, recent news, and the prospect's Digital Twin profile to produce a one-page prep sheet.",
        why: "Preparation is the most underrated sales skill. A rep who walks into a call knowing the prospect's company news, their role history, and their likely objections will always outperform a rep who wings it.",
        how: "Navigate to Meeting Prep → New Briefing. Select the contact and the meeting date. The AI generates a briefing that includes: Company overview, recent news, the contact's role and background, previous interaction history, open deal status, recommended talking points, likely objections, and suggested close strategy.",
        automation: "Meeting Prep briefings can be automatically generated when a meeting is booked — triggered by a calendar integration or a task completion event.",
        outcome: "Reps who use Meeting Prep close at higher rates because they walk into every conversation with a personalized strategy and full context.",
      },
      {
        id: "b2b-database",
        title: "B2B Database",
        what: "Access to a searchable database of business contacts and companies for prospecting. Search by industry, title, company size, location, and technology stack to build targeted prospect lists that feed directly into the Paradigm Engine.",
        why: "The best outreach starts with the best list. The B2B Database gives you access to verified, enriched contact data without requiring a separate prospecting tool.",
        how: "Navigate to B2B Database. Use the search filters to define your target profile. Review the results, select the contacts you want, and click Import to Paradigm Engine. The selected contacts are added to the Prospects list and can be enrolled in Ghost Sequences immediately.",
        automation: "Imported contacts automatically receive a Quantum Score and are evaluated for Ghost Sequence enrollment based on their profile fit.",
        outcome: "A targeted prospect list built from the B2B Database will always outperform a generic list because every contact matches your ideal customer profile.",
      },
      {
        id: "email-warmup",
        title: "Email Warmup",
        what: "The automated process of gradually increasing sending volume from a new email address or domain to build sender reputation before launching full campaigns. The system sends and receives real emails between your addresses and a network of partner addresses, simulating organic engagement.",
        why: "A new email address has no reputation. ISPs treat unknown senders with suspicion. Warmup builds the reputation that gets your emails into inboxes instead of spam folders.",
        how: "Navigate to Email Warmup → Add Address. Enter the new email address and SMTP credentials. Set the warmup schedule (typically 4–8 weeks). The system automatically sends increasing volumes of emails daily, marks them as important, and moves them out of spam if they land there. Do not send campaigns from a new address until warmup is complete.",
        automation: "The warmup schedule runs automatically on a daily cadence. When warmup is complete, the system sends a notification and the address is automatically added to the active sending pool.",
        outcome: "A warmed-up address achieves inbox placement rates of 95%+ from day one of active sending. Skipping warmup typically results in 40–60% spam placement rates.",
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
        why: "You cannot improve what you do not measure. Analytics gives you the data to answer the most important questions in sales management: Where is revenue coming from? Which reps are performing? Which campaigns are working? Where is the pipeline stalling?",
        how: "Navigate to Analytics and select a report category from the left panel. The Pipeline Report shows deals by stage, average deal size, win rate, and average sales cycle length. The Campaign Report shows open rates, click rates, bounce rates, and revenue attributed to each campaign. The Team Report shows individual rep performance against quota. Use the date range picker to compare periods. Use the export button to download any report as a CSV. Use Scheduled Reports to have key reports emailed to you every Monday morning automatically.",
        automation: "All report data updates in real time as activities are logged, deals advance, and campaigns send. No manual data entry or report generation required.",
        outcome: "Data-driven sales leadership. The teams that review analytics weekly make better decisions, allocate resources more effectively, and hit their numbers more consistently than teams that operate on gut instinct.",
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
    subtitle: "Branding, integrations, billing, API",
    features: [
      {
        id: "company-settings",
        title: "Company Settings & Branding",
        what: "Configure all account-level preferences: Company Profile (name, logo, address), User Profile, Notification Preferences, Email Signature, and API access. The Company Branding section lets you upload your logo or generate one with AI — this logo appears in the sidebar, top nav, and all outbound emails.",
        why: "A CRM that carries your company's identity feels like your tool, not a generic software product. Branding builds team pride and reinforces your company's identity in every customer interaction.",
        how: "Navigate to Settings → Company. Upload your logo (PNG or SVG, recommended 200×200px) or click AI Generate to create one from your company name. The logo appears immediately in the sidebar header and top navigation. Fill in your company address — this is required for CAN-SPAM compliance on all outbound emails.",
        automation: "Your company logo is automatically included in all outbound email footers and in the Customer Portal header.",
        outcome: "A fully branded CRM experience that reinforces your company's identity to every team member and every customer who interacts with your portal.",
      },
      {
        id: "integrations-settings",
        title: "Integrations",
        what: "Connect external services to Apex CRM: Apollo.io (lead sourcing), NeverBounce (email verification), SendGrid (additional sending capacity), PhantomBuster (LinkedIn automation), and Google AI Studio (enhanced AI features).",
        why: "No single tool does everything. Integrations let Apex CRM serve as the hub that connects your entire sales technology stack.",
        how: "Navigate to Paradigm → Integrations. Each integration card shows the connection status and required credentials. Click Connect, enter your API key, and click Test Connection to verify. Connected integrations appear with a green status indicator.",
        automation: "Connected integrations feed data automatically into Apex CRM. Apollo.io sends new prospects to the Paradigm Engine. NeverBounce verifies emails before they are added to the system. SendGrid handles overflow sending when your primary SMTP pool is at capacity.",
        outcome: "A connected tech stack where data flows automatically between tools, eliminating manual imports, exports, and copy-paste workflows.",
      },
      {
        id: "billing",
        title: "Billing & Plans",
        what: "Manage your subscription, view invoices, upgrade or downgrade your plan, and access the Stripe billing portal for payment method management.",
        why: "Transparent billing and easy plan management reduce friction and build trust with your customers.",
        how: "Navigate to Billing to see your current plan, next billing date, and usage metrics. Click Upgrade to see available plans and pricing. Click Manage Billing to open the Stripe portal where you can update your payment method, download invoices, or cancel your subscription.",
        automation: "Subscription status is checked automatically on every login. If a payment fails, the system sends automated reminder emails and provides a direct link to update the payment method.",
        outcome: "Frictionless billing management that keeps your team focused on selling, not on administrative subscription tasks.",
      },
    ],
  },
];

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({ feature, sectionColor, sectionBg, sectionBorder }: {
  feature: typeof SECTIONS[0]["features"][0];
  sectionColor: string;
  sectionBg: string;
  sectionBorder: string;
}) {
  const [open, setOpen] = useState(false);

  const pillClass = `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sectionBg} ${sectionColor} border ${sectionBorder}`;

  return (
    <div className={`rounded-xl border bg-card transition-all duration-200 ${open ? "shadow-md" : "hover:shadow-sm"}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-semibold text-foreground text-sm">{feature.title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

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
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CRMBible() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  const filteredSections = SECTIONS.map(section => ({
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

  const totalFeatures = SECTIONS.reduce((acc, s) => acc + s.features.length, 0);

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
              <h1 className="text-2xl font-black tracking-tight">Apex CRM Bible</h1>
              <p className="text-sm text-muted-foreground">The complete operator's guide — from first contact to closed deal</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <Badge variant="secondary">{SECTIONS.length} sections</Badge>
            <Badge variant="secondary">{totalFeatures} features documented</Badge>
            <Badge variant="secondary">What · Why · How · Automation · Outcome</Badge>
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
            {SECTIONS.map(section => {
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
                  <div>
                    <h2 className={`text-lg font-black ${section.color}`}>{section.title}</h2>
                    <p className="text-xs text-muted-foreground">{section.subtitle}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {section.features.length} {section.features.length === 1 ? "feature" : "features"}
                  </Badge>
                </div>

                {/* Feature cards */}
                <div className="space-y-2">
                  {section.features.map(feature => (
                    <FeatureCard
                      key={feature.id}
                      feature={feature}
                      sectionColor={section.color}
                      sectionBg={section.bg}
                      sectionBorder={section.border}
                    />
                  ))}
                </div>
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
                "Every feature in Apex CRM exists to answer one question — <strong className="text-foreground not-italic">what is the next best action to take, for this specific person, right now?</strong> The system answers that question automatically, at scale, for every prospect and customer in your database, simultaneously. Your job is to execute the actions the system surfaces. The machine does the thinking. You do the talking. Together, you close more deals."
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
