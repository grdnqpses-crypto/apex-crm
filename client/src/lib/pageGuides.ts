// Centralized contextual help content for every page in Apex CRM

export interface GuideSection {
  icon: "purpose" | "expect" | "actions" | "outcomes" | "tips";
  title: string;
  content: string;
}

export interface PageGuideData {
  title: string;
  description: string;
  sections: GuideSection[];
}

export const pageGuides: Record<string, PageGuideData> = {
  dashboard: {
    title: "Dashboard Overview",
    description: "Click to learn what this page does and how to use it",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "Your command center. The Dashboard gives you a real-time snapshot of your entire CRM — contacts, companies, deals, campaigns, and tasks — all in one place. It's designed so you can make decisions at a glance without digging through individual pages." },
      { icon: "expect", title: "What You'll See", content: "Six key metric cards showing total contacts, companies, active deals, pipeline value, active campaigns, and pending tasks. Each card updates in real-time as your team works. Below the cards you'll find quick-access shortcuts to the most common actions." },
      { icon: "actions", title: "What You Can Do", content: "Use the Dashboard to quickly assess your business health. Click any metric card to navigate directly to that section. The numbers reflect your actual data — if they show zero, it means you need to start adding contacts, companies, or deals." },
      { icon: "outcomes", title: "Expected Outcomes", content: "After using the CRM for a few days, your Dashboard will show meaningful trends. Watch for growing contact counts, increasing pipeline value, and campaign engagement rates. A healthy CRM shows steady growth across all metrics." },
      { icon: "tips", title: "Pro Tips", content: "Check your Dashboard first thing every morning. If your pending tasks count is climbing, prioritize clearing them. If your pipeline value drops, review your deals page for stalled opportunities. The Dashboard is your early warning system." },
    ],
  },

  contacts: {
    title: "Contact Management Guide",
    description: "Click to learn how to manage your contacts effectively",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "This is where you manage every person your business interacts with — prospects, customers, partners, and vendors. Each contact has 50+ fields covering identity, communication, address, lifecycle stage, marketing attribution, social profiles, and logistics-specific data." },
      { icon: "expect", title: "What You'll See", content: "A searchable table of all your contacts with key columns: name, email, company, lead status, and lifecycle stage. Use the search bar to find contacts instantly. The lead status filter lets you segment by 27 logistics-specific statuses like 'New Shipper Lead', 'Active Customer', or 'Contract Negotiation'." },
      { icon: "actions", title: "What You Can Do", content: "Create new contacts with the '+ Add Contact' button. The form is organized into collapsible sections: Identity, Communication, Address, Lifecycle & Sales, Marketing Attribution, Social Media, and Logistics-Specific fields. Click any contact row to view their full 360° profile." },
      { icon: "outcomes", title: "Expected Outcomes", content: "A well-maintained contact database is the foundation of your CRM. Every contact should have at minimum: name, email, company, and lead status. The more fields you fill in, the better your email campaigns and AI prospecting will perform." },
      { icon: "tips", title: "Pro Tips", content: "Always set the Lead Status when creating a contact — it drives your sales pipeline. Use the lifecycle stage to track where each contact is in your sales process. The logistics fields (Equipment Type, Lane Preferences, TMS Integration) are critical for freight-specific outreach." },
    ],
  },

  contactDetail: {
    title: "Contact Detail Guide",
    description: "Click to learn about the 360° contact profile",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "The Contact Detail page gives you a complete 360° view of a single contact. It combines their profile information, company associations, and full activity history in one place. This is where you understand the complete story of your relationship with this person." },
      { icon: "expect", title: "What You'll See", content: "Four tabs: Overview (contact info + recent activity timeline), Companies (associated companies), Activities (full history of notes, calls, emails, meetings), and Edit (update all 50+ fields). The activity timeline shows everything that's happened with this contact in chronological order." },
      { icon: "actions", title: "What You Can Do", content: "Log activities (notes, calls, emails, meetings) directly from the Activities tab. Each activity type has specific fields — calls track duration and outcome, emails track subject and body, meetings track attendees and location. Associate the contact with companies and edit any field." },
      { icon: "outcomes", title: "Expected Outcomes", content: "A rich contact profile with regular activity logging means your team always knows the full context before reaching out. No more asking 'when did we last talk to them?' — it's all right here in the timeline." },
      { icon: "tips", title: "Pro Tips", content: "Log every interaction — even quick phone calls. The activity timeline becomes invaluable when a colleague needs to take over an account. Use the Notes activity type for internal observations that shouldn't be in emails." },
    ],
  },

  companies: {
    title: "Company Management Guide",
    description: "Click to learn how to manage your company records",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "Manage every company your business works with. Companies are the organizational layer above contacts — each company can have multiple associated contacts. The company record includes 40+ fields covering firmographics, location, lifecycle, social presence, and logistics-specific data." },
      { icon: "expect", title: "What You'll See", content: "A searchable table of all companies with key columns: name, industry, number of employees, and website. Click any company to view its full profile with associated contacts and activity history." },
      { icon: "actions", title: "What You Can Do", content: "Create companies with the '+ Add Company' button. The form includes sections for Identity, Location, Firmographics (industry, revenue, employee count), Lifecycle & Sales, Social Media, and Logistics-Specific fields (Fleet Size, Equipment Types, Service Areas, MC/DOT Numbers)." },
      { icon: "outcomes", title: "Expected Outcomes", content: "A complete company database lets you understand your market at the organizational level. When you know a company's fleet size, service areas, and annual revenue, your outreach becomes dramatically more targeted and effective." },
      { icon: "tips", title: "Pro Tips", content: "Always link contacts to their companies. This creates a hierarchy that makes account-based selling possible. The logistics fields (MC Number, DOT Number, Fleet Size) are essential for freight industry prospecting — fill these in whenever possible." },
    ],
  },

  companyDetail: {
    title: "Company Detail Guide",
    description: "Click to learn about the company profile view",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "The Company Detail page provides a complete view of a single company — its profile, all associated contacts, and the full activity history. This is your account-level intelligence hub." },
      { icon: "expect", title: "What You'll See", content: "Four tabs: Overview (company info + recent activities), Contacts (all people associated with this company), Activities (full interaction history), and Edit (update all 40+ fields). The Contacts tab shows everyone at this company in your CRM." },
      { icon: "actions", title: "What You Can Do", content: "View and manage all contacts at this company, log activities against the company record, and update company information. Use the Activities tab to see every interaction your team has had with anyone at this organization." },
      { icon: "outcomes", title: "Expected Outcomes", content: "A well-maintained company profile means your entire team understands the account. When multiple people are selling into the same company, the shared activity history prevents duplicate outreach and conflicting messages." },
      { icon: "tips", title: "Pro Tips", content: "Review the company's activity timeline before any major outreach. Check which contacts are most engaged. Use the logistics fields to tailor your pitch — if you know their equipment types and lane preferences, your proposal will be much more relevant." },
    ],
  },

  deals: {
    title: "Deal Pipeline Guide",
    description: "Click to learn how to manage your sales pipeline",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "The Deals page is your visual sales pipeline. It shows every active opportunity as a card on a Kanban board, organized by stage. You can drag deals between stages, track values, and forecast revenue. Multiple pipelines let you separate different business lines." },
      { icon: "expect", title: "What You'll See", content: "A Kanban board with columns for each pipeline stage (e.g., Qualification, Proposal, Negotiation, Closed Won, Closed Lost). Each deal card shows the deal name, value, associated contact/company, and expected close date. The pipeline selector at the top lets you switch between different pipelines." },
      { icon: "actions", title: "What You Can Do", content: "Create new deals with the '+ Add Deal' button, specifying the value, stage, associated contact and company, and expected close date. Drag cards between columns to update stages. Click a deal to view or edit its details. Create custom pipelines with your own stages." },
      { icon: "outcomes", title: "Expected Outcomes", content: "A well-managed pipeline gives you accurate revenue forecasting. You'll see at a glance how much potential revenue is in each stage, which deals are stalling, and what your win rate looks like. This drives better sales decisions." },
      { icon: "tips", title: "Pro Tips", content: "Update deal stages promptly — stale pipelines give false forecasts. Set realistic expected close dates and update them when things change. Use the deal value to prioritize your time — focus on high-value deals that are close to closing." },
    ],
  },

  tasks: {
    title: "Task Management Guide",
    description: "Click to learn how to manage tasks and follow-ups",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "Tasks keep your team organized and accountable. Every follow-up call, email to send, meeting to schedule, or to-do item lives here. Tasks can be associated with contacts, companies, and deals, and organized into queues like 'Prospecting Calls', 'Customer Renewals', or 'Carrier Setup'." },
      { icon: "expect", title: "What You'll See", content: "A filterable task list showing title, type (Call, Email, To-do, Follow-up), priority, due date, status, and assigned person. Filter by status (Not Started, In Progress, Waiting, Completed, Deferred) or by queue to focus on specific work streams." },
      { icon: "actions", title: "What You Can Do", content: "Create tasks with type, priority, due date, queue assignment, and associations to contacts/companies/deals. Set reminders so you never miss a follow-up. Mark tasks complete with outcome notes. Set up recurring tasks for regular check-ins." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Zero missed follow-ups. Every promise you make to a prospect or customer gets tracked as a task. Your team's productivity becomes measurable — you can see who's completing tasks on time and who needs support." },
      { icon: "tips", title: "Pro Tips", content: "Create a task immediately after every call or meeting — capture the next action while it's fresh. Use queues to batch similar work (e.g., do all prospecting calls in one block). Set reminders for high-priority tasks so they don't slip through the cracks." },
    ],
  },

  campaigns: {
    title: "Email Campaigns Guide",
    description: "Click to learn how to create and send email campaigns",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "The Campaigns page is where you create, manage, and send bulk email campaigns to your contacts. Each campaign includes a subject line, HTML content, and targeting options. The built-in AI spam analyzer checks your email before sending to maximize inbox placement." },
      { icon: "expect", title: "What You'll See", content: "A list of all your campaigns with their status (Draft, Scheduled, Sending, Sent, Paused), subject line, and creation date. Each campaign shows key metrics after sending: open rate, click rate, bounce rate, and unsubscribe rate." },
      { icon: "actions", title: "What You Can Do", content: "Create new campaigns with subject, HTML content, and from email. Use the AI Spam Analyzer to check your content before sending — it scores your email 0-100 and flags specific issues. Schedule campaigns for optimal send times or send immediately." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Well-crafted campaigns with high spam scores (80+) will achieve strong inbox placement. The system automatically rotates across your 260 email addresses and respects per-provider throttling limits to protect your domain reputation." },
      { icon: "tips", title: "Pro Tips", content: "Always run the AI Spam Analyzer before sending. Avoid ALL CAPS, excessive exclamation marks, and words like 'FREE' or 'ACT NOW'. Keep your text-to-image ratio balanced. Personalize with the recipient's name and company whenever possible." },
    ],
  },

  templates: {
    title: "Email Templates Guide",
    description: "Click to learn how to create reusable email templates",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "Templates are reusable email designs that save you time. Instead of writing every email from scratch, create templates for common scenarios: introduction emails, follow-ups, proposals, newsletters. Templates support personalization tokens that auto-fill with contact data." },
      { icon: "expect", title: "What You'll See", content: "A library of your saved templates with name, category, subject line, and preview. Templates are organized by category so you can quickly find the right one for any situation." },
      { icon: "actions", title: "What You Can Do", content: "Create templates with a name, category, subject line, and HTML body. Use personalization tokens like {{firstName}}, {{company}}, {{title}} that will be replaced with actual contact data when used in campaigns. Edit and duplicate existing templates." },
      { icon: "outcomes", title: "Expected Outcomes", content: "A well-stocked template library means your team sends consistent, professional emails every time. New team members can start sending effective emails on day one by using proven templates." },
      { icon: "tips", title: "Pro Tips", content: "Create templates for every stage of your sales process: cold outreach, follow-up, proposal, negotiation, and win-back. Test different subject lines and content variations using A/B Tests. Keep templates short and focused — long emails get lower engagement." },
    ],
  },

  deliverability: {
    title: "Deliverability Guide",
    description: "Click to learn about email deliverability monitoring",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "The Deliverability page monitors the health of your sending domains and helps you maintain high inbox placement rates. It checks SPF, DKIM, and DMARC authentication, monitors blacklist status, and provides domain warm-up scheduling." },
      { icon: "expect", title: "What You'll See", content: "A domain health dashboard showing each of your 52 domains with their authentication status (SPF, DKIM, DMARC), blacklist status, and overall health score. Green indicators mean everything is properly configured; red means action is needed." },
      { icon: "actions", title: "What You Can Do", content: "Run authentication checks on any domain to verify SPF, DKIM, and DMARC are properly configured. Check blacklist status across major blacklist providers. Set up warm-up schedules for new domains to gradually increase sending volume." },
      { icon: "outcomes", title: "Expected Outcomes", content: "All 52 domains should show green across SPF, DKIM, and DMARC. Zero blacklist entries. If any domain shows issues, the system provides specific remediation steps. Maintaining clean domain health is the #1 factor in inbox placement." },
      { icon: "tips", title: "Pro Tips", content: "Check this page weekly. If any domain gets blacklisted, stop sending from it immediately and follow the delisting process. Keep your DMARC policy at 'none' initially, then upgrade to 'quarantine' and eventually 'reject' as you confirm everything works." },
    ],
  },

  workflows: {
    title: "Automation Workflows Guide",
    description: "Click to learn how to automate your sales processes",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "Workflows automate repetitive tasks in your sales process. Set up trigger-based actions that fire automatically — when a new contact is created, when a deal moves to a new stage, or when an email is opened. This saves hours of manual work every week." },
      { icon: "expect", title: "What You'll See", content: "A list of your automation workflows with their name, trigger type, status (Active/Paused/Draft), and execution count. Each workflow shows when it last ran and how many times it's been triggered." },
      { icon: "actions", title: "What You Can Do", content: "Create workflows with a trigger (e.g., 'New Contact Created', 'Deal Stage Changed'), conditions (e.g., 'Lead Status = New Shipper Lead'), and actions (e.g., 'Send Welcome Email', 'Create Follow-up Task', 'Assign to Sales Rep'). Pause or resume workflows at any time." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Automated workflows ensure no lead falls through the cracks. Every new contact gets a welcome sequence, every deal gets timely follow-ups, and your team focuses on high-value activities instead of repetitive tasks." },
      { icon: "tips", title: "Pro Tips", content: "Start with simple workflows and add complexity over time. The most impactful first workflow is usually 'New Lead → Send Welcome Email → Create Follow-up Task'. Monitor execution counts to make sure workflows are firing as expected." },
    ],
  },

  analytics: {
    title: "Analytics Guide",
    description: "Click to learn about your CRM analytics and reporting",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "Analytics gives you deep insight into your CRM performance. Track contact growth, deal pipeline health, campaign effectiveness, and team productivity. The data helps you make informed decisions about where to focus your sales and marketing efforts." },
      { icon: "expect", title: "What You'll See", content: "Key metrics including total contacts, active deals, pipeline value, campaign performance (open rates, click rates), and task completion rates. Charts show trends over time so you can spot patterns and measure progress." },
      { icon: "actions", title: "What You Can Do", content: "Review your key performance indicators, identify trends, and drill down into specific metrics. Use the data to adjust your sales strategy — if open rates are dropping, review your email content. If deals are stalling, review your pipeline stages." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Data-driven decision making. Instead of guessing what's working, you'll have concrete numbers. Healthy benchmarks: email open rates above 20%, click rates above 2%, bounce rates below 2%, and deal close rates above 15%." },
      { icon: "tips", title: "Pro Tips", content: "Review Analytics weekly. Compare this week's numbers to last week's. If any metric drops significantly, investigate immediately. The best sales teams use data to continuously improve their process." },
    ],
  },

  segments: {
    title: "Segments Guide",
    description: "Click to learn about smart list segmentation",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "Segments let you create smart lists of contacts based on specific criteria. Instead of manually selecting recipients for each campaign, define rules (e.g., 'Industry = Manufacturing AND Lead Status = Active') and the segment automatically updates as contacts match or unmatch." },
      { icon: "expect", title: "What You'll See", content: "A list of your segments with name, type (Dynamic or Static), member count, and last refresh date. Dynamic segments auto-update; static segments are fixed lists you manually curate." },
      { icon: "actions", title: "What You Can Do", content: "Create segments with filter rules based on any contact field. Dynamic segments automatically include/exclude contacts as their data changes. Static segments let you manually add/remove specific contacts. Use segments as targeting for email campaigns." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Highly targeted email campaigns that speak directly to each audience. A 'Manufacturers in Texas' segment gets different messaging than 'LTL Distributors in California'. Targeted campaigns consistently outperform blast-to-all approaches by 3-5x." },
      { icon: "tips", title: "Pro Tips", content: "Create segments for each major customer type: TL shippers, LTL shippers, manufacturers, distributors. Also create engagement-based segments: 'Opened last 3 emails', 'No engagement in 30 days'. Use engagement segments to clean your lists and protect sender reputation." },
    ],
  },

  abTests: {
    title: "A/B Testing Guide",
    description: "Click to learn how to optimize your emails with testing",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "A/B Testing lets you scientifically determine what works best in your emails. Test different subject lines, content variations, send times, or sender names against each other. The system splits your audience and measures which version performs better." },
      { icon: "expect", title: "What You'll See", content: "A list of your A/B tests with the test name, type (Subject, Content, Send Time, Sender), status, and results. Completed tests show the winning variant with statistical confidence metrics." },
      { icon: "actions", title: "What You Can Do", content: "Create tests by defining two variants (A and B) of your email element. Set the test audience size (typically 10-20% of your list), and the system sends both versions. After enough data is collected, it declares a winner and you can send the winning version to the rest." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Continuous improvement in your email performance. Even small improvements compound over time — a 5% better open rate means thousands more people seeing your message. The best email marketers test constantly." },
      { icon: "tips", title: "Pro Tips", content: "Test one variable at a time for clear results. Subject lines have the biggest impact on open rates — start there. Always test with a large enough sample (at least 1,000 per variant) for statistically significant results. Keep a log of what you've learned from each test." },
    ],
  },

  apiKeys: {
    title: "API Keys Guide",
    description: "Click to learn about API access and integrations",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "API Keys let you connect external systems to your CRM programmatically. Any software that needs to read or write CRM data — your website, custom tools, third-party integrations — uses an API key to authenticate. This is how you extend Apex CRM's capabilities." },
      { icon: "expect", title: "What You'll See", content: "A list of your API keys with their name, key prefix (the full key is shown only once at creation), creation date, last used date, and status (Active/Revoked). Each key can have specific permission scopes." },
      { icon: "actions", title: "What You Can Do", content: "Generate new API keys with a descriptive name and permission scopes. Copy the key immediately after creation (it won't be shown again). Revoke keys that are no longer needed or may have been compromised." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Secure, auditable API access to your CRM data. Every API call is logged with the key that made it, so you always know which integration is doing what. This is essential for enterprise-grade security." },
      { icon: "tips", title: "Pro Tips", content: "Create separate API keys for each integration — never share one key across multiple systems. If a key is compromised, you can revoke just that one without affecting others. Use descriptive names like 'Website Contact Form' or 'Zapier Integration' so you know what each key is for." },
    ],
  },

  webhooks: {
    title: "Webhooks Guide",
    description: "Click to learn about real-time event notifications",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "Webhooks push real-time notifications to your external systems when events happen in your CRM. Instead of polling the API repeatedly, webhooks instantly notify your systems when a contact is created, a deal closes, or a campaign is sent." },
      { icon: "expect", title: "What You'll See", content: "A list of your webhook endpoints with their URL, event types they listen for, status (Active/Paused), and delivery logs showing recent payloads and response codes." },
      { icon: "actions", title: "What You Can Do", content: "Create webhooks by specifying a URL and the events you want to receive (e.g., contact.created, deal.updated, campaign.sent). Test webhooks to verify your endpoint is receiving data correctly. View delivery logs to debug any issues." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Real-time data flow between your CRM and other systems. When a new lead comes in, your Slack channel gets notified instantly. When a deal closes, your accounting system creates an invoice automatically. Webhooks are the backbone of modern integrations." },
      { icon: "tips", title: "Pro Tips", content: "Always implement retry logic on your webhook endpoint — network issues happen. Return a 200 status code quickly and process the payload asynchronously. Use the delivery logs to monitor for failures and fix them before they accumulate." },
    ],
  },

  paradigmPulse: {
    title: "Paradigm Pulse Guide",
    description: "Click to learn about your AI prospecting command center",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "Paradigm Pulse is your AI-powered prospecting command center. It aggregates all intelligence from the prospecting engine into a single dashboard: active prospects, trigger signals, hot leads, engagement metrics, and AI activity. This is where you manage by exception — the AI handles the routine, you handle the opportunities." },
      { icon: "expect", title: "What You'll See", content: "Key metrics: total prospects, verified leads, hot leads ready for handoff, active ghost sequences, and recent trigger signals. The dashboard highlights what needs your attention right now — hot leads that need a human touch, signals that indicate buying intent, and sequences that need review." },
      { icon: "actions", title: "What You Can Do", content: "Monitor your prospecting pipeline health at a glance. Click into hot leads for immediate action. Review trigger signals for new opportunities. Check ghost sequence performance. The Pulse Dashboard is your morning starting point for prospecting activities." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Efficient prospecting at scale. Instead of manually searching for leads, the AI surfaces the best opportunities. Your focus shifts from finding leads to closing them. A healthy Pulse shows a steady flow of new prospects moving through verification to engagement." },
      { icon: "tips", title: "Pro Tips", content: "Check Pulse first thing every morning. Act on hot leads immediately — timing is everything in sales. If your verified lead count is low, review your prospect sources. If engagement is dropping, review your ghost sequence messaging." },
    ],
  },

  prospects: {
    title: "Prospects Pipeline Guide",
    description: "Click to learn how to manage AI-discovered prospects",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "The Prospects page manages your AI-discovered leads before they become full CRM contacts. Prospects go through a pipeline: Discovered → Verified → Profiled → Engaged → Converted. The AI handles discovery and verification; you handle the high-value engagement and conversion." },
      { icon: "expect", title: "What You'll See", content: "A filterable list of prospects with name, company, job title, email, engagement stage, verification status, and AI-computed score. Filter by stage to focus on specific pipeline segments. Verified prospects have confirmed email addresses ready for outreach." },
      { icon: "actions", title: "What You Can Do", content: "Create prospects manually or let the AI discover them. Run AI actions: Verify Email (checks deliverability), Build Profile (creates psychographic analysis), Generate Battle Card (tactical summary), Draft Email (personalized outreach), and Promote to Contact (converts to full CRM record)." },
      { icon: "outcomes", title: "Expected Outcomes", content: "A steady pipeline of verified, profiled prospects ready for outreach. The AI does the heavy lifting of research and verification. You focus on the human elements: building relationships and closing deals. Target: 10+ new verified leads per day." },
      { icon: "tips", title: "Pro Tips", content: "Don't skip the verification step — sending to unverified emails damages your domain reputation. Always build a profile before drafting an email — personalized outreach gets 3x higher response rates. Promote prospects to contacts once they show genuine interest." },
    ],
  },

  prospectDetail: {
    title: "Prospect Detail Guide",
    description: "Click to learn about the AI prospect intelligence view",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "The Prospect Detail page is your AI intelligence dossier for a single prospect. It combines verification status, psychographic profile (Digital Twin), battle card, outreach history, and quantum score into a comprehensive view that tells you everything you need to know before making contact." },
      { icon: "expect", title: "What You'll See", content: "The prospect's full profile with AI-generated insights: verification status, psychographic profile (personality type, communication style, motivators), battle card (tactical summary with talking points), outreach history, and quantum score (12-dimension scoring)." },
      { icon: "actions", title: "What You Can Do", content: "Run any AI action: verify their email, build their psychographic profile, generate a battle card, draft a personalized email, calculate their quantum score, or promote them to a full CRM contact. Each action adds intelligence to the prospect record." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Before you ever pick up the phone or send an email, you'll know: their personality type, what motivates them, the best communication approach, key talking points, and the optimal time to reach out. This level of preparation dramatically increases your success rate." },
      { icon: "tips", title: "Pro Tips", content: "Run all AI actions in order: Verify → Profile → Battle Card → Quantum Score → Draft Email. Each step builds on the previous one. Read the battle card before every call — it gives you the talking points and objection handlers you need." },
    ],
  },

  signals: {
    title: "Trigger Signals Guide",
    description: "Click to learn about the Sentinel signal monitoring system",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "The Sentinel monitors trigger signals — events that indicate a prospect may be ready to buy. Job changes, company expansions, new patents, social media complaints about competitors, funding announcements — these are all buying signals that create perfect outreach timing." },
      { icon: "expect", title: "What You'll See", content: "A real-time feed of trigger signals with type (Job Change, Funding, Expansion, Complaint, Patent, etc.), priority level, associated prospect, and timestamp. High-priority signals are highlighted for immediate action." },
      { icon: "actions", title: "What You Can Do", content: "Review signals, mark them as actioned or dismissed, and link them to prospects. When you see a high-priority signal (e.g., a prospect's company just got funding), immediately create an outreach sequence tailored to that event." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Perfectly timed outreach. Instead of cold-calling at random, you reach out when prospects have a specific need. 'I noticed your company just expanded to the Midwest — we specialize in Midwest freight lanes' is 10x more effective than a generic pitch." },
      { icon: "tips", title: "Pro Tips", content: "Act on high-priority signals within 24 hours — timing is everything. Job changes are the #1 buying signal in B2B sales. When someone new joins a company, they often bring in new vendors. Reference the specific signal in your outreach for maximum relevance." },
    ],
  },

  ghostSequences: {
    title: "Ghost Sequences Guide",
    description: "Click to learn about automated follow-up sequences",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "Ghost Sequences are automated multi-step email follow-up sequences. Instead of manually remembering to follow up, create a sequence of emails with delays between them. The system sends each step automatically, stopping when the prospect replies or shows positive intent." },
      { icon: "expect", title: "What You'll See", content: "A list of your sequences with name, number of steps, status (Draft, Active, Paused, Completed), and performance metrics. Each sequence shows how many prospects are currently enrolled and the response rate." },
      { icon: "actions", title: "What You Can Do", content: "Create multi-step sequences with customizable delays between steps (e.g., Day 1: Introduction, Day 3: Value Prop, Day 7: Case Study, Day 14: Final Follow-up). Assign prospects to sequences. Pause or stop sequences at any time. The system auto-stops when a prospect replies." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Consistent follow-up without manual effort. Most sales happen after 5-7 touches, but most salespeople give up after 1-2. Ghost Sequences ensure every prospect gets the full sequence. Expect 15-25% response rates on well-crafted sequences." },
      { icon: "tips", title: "Pro Tips", content: "Keep sequences to 4-6 steps maximum. Space them out: Day 1, Day 3, Day 7, Day 14, Day 21. Each step should add new value — don't just say 'following up'. Reference the prospect's industry, pain points, or recent signals for maximum impact." },
    ],
  },

  battleCards: {
    title: "Battle Cards Guide",
    description: "Click to learn about AI-generated tactical summaries",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "Battle Cards are AI-generated one-page tactical summaries for your hottest prospects. They contain everything you need before a sales conversation: key talking points, potential objections with rebuttals, competitive positioning, and recommended approach. Think of them as your cheat sheet for every sales call." },
      { icon: "expect", title: "What You'll See", content: "A gallery of battle cards with prospect name, company, urgency level, and read status. Unread cards are highlighted. Each card expands to show the full tactical summary including talking points, objection handlers, and recommended next steps." },
      { icon: "actions", title: "What You Can Do", content: "Generate battle cards for any prospect (from their detail page). Read and review cards before sales conversations. Archive cards after use. The AI generates cards based on the prospect's profile, company data, industry trends, and your previous interactions." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Every sales conversation is prepared and purposeful. No more going in blind. Battle cards give you confidence and specific talking points that resonate with each prospect's situation. Sales teams using battle cards report 20-30% higher close rates." },
      { icon: "tips", title: "Pro Tips", content: "Generate a fresh battle card before every important call — the AI incorporates the latest data. Review the objection handlers section carefully — knowing how to handle 'we already have a carrier' or 'your rates are too high' is critical. Share battle cards with your team for collaborative selling." },
    ],
  },

  integrations: {
    title: "Integrations Guide",
    description: "Click to learn about connecting external services",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "The Integrations page manages API credentials for external services that enhance your CRM. Connect Apollo.io for lead sourcing, NeverBounce for email verification, PhantomBuster for LinkedIn data, and other services. Each integration extends your CRM's capabilities." },
      { icon: "expect", title: "What You'll See", content: "A list of available integrations with their connection status (Connected, Not Connected, Error), last test date, and configuration options. Connected integrations show a green status indicator." },
      { icon: "actions", title: "What You Can Do", content: "Add API keys for each service, test the connection to verify it works, and manage credentials. Each integration has a test button that verifies your API key is valid and the service is accessible." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Enhanced CRM capabilities through external data sources. Apollo.io provides company and contact data. NeverBounce verifies email addresses. PhantomBuster scrapes LinkedIn profiles. Together, they supercharge your prospecting engine." },
      { icon: "tips", title: "Pro Tips", content: "The built-in AI can handle most prospecting tasks without external integrations. External services add additional data sources and verification layers. Start with the built-in AI, then add integrations as you scale and need more data." },
    ],
  },

  complianceCenter: {
    title: "Compliance Center Guide",
    description: "Click to learn about email compliance and legal requirements",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "The Compliance Center is your legal safety net. It ensures every email you send complies with CAN-SPAM, GDPR, and CCPA regulations. The pre-send validator checks for required elements (physical address, unsubscribe link, honest subject lines) and blocks non-compliant emails before they go out." },
      { icon: "expect", title: "What You'll See", content: "Compliance statistics (pass rate, total audits, common failures), a pre-send checker tool, and an AI email analyzer. The audit log shows every compliance check that's been run with pass/fail results and specific issues found." },
      { icon: "actions", title: "What You Can Do", content: "Run pre-send compliance checks on any email before sending. The checker validates: physical address present, unsubscribe link working, subject line not deceptive, recipient not suppressed, and provider-specific requirements met. The AI analyzer provides a deeper content analysis with spam scoring." },
      { icon: "outcomes", title: "Expected Outcomes", content: "100% legal compliance on every email sent. Zero risk of CAN-SPAM fines (up to $51,744 per violation). The compliance engine catches issues before they become problems, protecting your business and your domain reputation." },
      { icon: "tips", title: "Pro Tips", content: "Run the compliance check on every campaign before sending — it takes seconds and could save you thousands in fines. Set up your Sender Settings first (physical address, unsubscribe URL) so the checker has baseline data. Review the audit log weekly to spot recurring issues." },
    ],
  },

  suppressionList: {
    title: "Suppression List Guide",
    description: "Click to learn about email suppression and list hygiene",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "The Suppression List is your 'do not email' database. It contains every email address that should never receive another message from you — bounces, unsubscribes, complaints, and manually blocked addresses. The system automatically checks this list before every send." },
      { icon: "expect", title: "What You'll See", content: "A searchable list of suppressed email addresses with the reason (Bounce, Unsubscribe, Complaint, Manual), source (automatic or manual), and date added. Statistics show the breakdown by reason type." },
      { icon: "actions", title: "What You Can Do", content: "Add individual emails or bulk import suppression lists. Check if a specific email is suppressed. Remove entries if they were added in error (use caution — removing a legitimate bounce or complaint can damage your reputation). The system automatically adds bounces and unsubscribes." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Clean sending lists that protect your domain reputation. Every bounce, unsubscribe, and complaint is automatically captured and permanently suppressed. This keeps your bounce rate below 2% and complaint rate below 0.1% — the thresholds Gmail and Outlook use to judge your reputation." },
      { icon: "tips", title: "Pro Tips", content: "Never remove a suppression entry unless you're absolutely certain it was added in error. Import any existing suppression lists from previous email tools. If you're migrating from another CRM, bulk import all historical bounces and unsubscribes before sending your first campaign." },
    ],
  },

  senderSettings: {
    title: "Sender Settings Guide",
    description: "Click to learn about configuring your sending infrastructure",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "Sender Settings configure the foundational elements of your email sending: your company identity (name, physical address for CAN-SPAM), default sender information, unsubscribe handling, and per-provider throttling limits. These settings apply to every email sent from the system." },
      { icon: "expect", title: "What You'll See", content: "Two sections: Company Information (name, physical address, privacy policy URL, unsubscribe URL) and Sending Limits (throttle rates per minute for Outlook, Gmail, Yahoo, and default providers, plus maximum bounce and complaint rate thresholds)." },
      { icon: "actions", title: "What You Can Do", content: "Set your company name and physical mailing address (required by CAN-SPAM for every email). Configure your unsubscribe URL and privacy policy URL. Set per-provider throttle limits to control how fast emails are sent to each provider. Set maximum bounce and complaint rate thresholds." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Properly configured sender settings mean every email automatically includes your physical address and unsubscribe link. Throttle limits prevent you from overwhelming any single provider. Rate thresholds automatically pause sending if your reputation is at risk." },
      { icon: "tips", title: "Pro Tips", content: "Configure this page FIRST before sending any emails. Outlook is the strictest provider — set its throttle to 8-10 per minute. Gmail can handle 15-20 per minute. Set your max bounce rate to 2% and max complaint rate to 0.1% — these are the industry safety thresholds." },
    ],
  },

  domainStats: {
    title: "Domain Stats Guide",
    description: "Click to learn about per-domain sending analytics",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "Domain Stats tracks the sending performance of each of your 52 domains individually. It shows sent volume, bounce rates, complaint rates, and provider-specific breakdowns. This is how you identify which domains are performing well and which need attention." },
      { icon: "expect", title: "What You'll See", content: "Per-domain metrics: total sent, delivered, bounced, complained, and unsubscribed counts with percentage rates. A provider breakdown shows how each domain performs with Gmail, Outlook, Yahoo, and other providers separately." },
      { icon: "actions", title: "What You Can Do", content: "Monitor each domain's health metrics. Identify domains with high bounce or complaint rates. Compare provider-specific performance. Use this data to make rotation decisions — pause underperforming domains and increase volume on healthy ones." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Full visibility into your sending infrastructure health. Each domain should maintain: bounce rate below 2%, complaint rate below 0.1%, and consistent delivery rates above 95%. Domains that fall below these thresholds should be investigated immediately." },
      { icon: "tips", title: "Pro Tips", content: "Review Domain Stats after every major campaign. If a domain's bounce rate spikes, check if you're sending to a stale list. If complaint rates rise on a specific domain, review the content being sent from it. Rotate domains evenly to prevent any single domain from being overworked." },
    ],
  },

  quantumScore: {
    title: "Quantum Score Guide",
    description: "Click to learn about AI-powered prospect scoring",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "Quantum Score is a 12-dimension AI scoring system that evaluates every prospect across: Firmographic, Behavioral, Engagement, Timing, Social, Content, Recency, Frequency, Monetary, Channel, Intent, and Relationship scores. It predicts conversion probability and recommends the optimal outreach strategy." },
      { icon: "expect", title: "What You'll See", content: "A radar chart showing all 12 dimension scores, an overall grade (A+ through F), predicted conversion probability, estimated deal value, optimal contact time, and recommended channel. Plus AI-generated strengths, weaknesses, and recommended actions." },
      { icon: "actions", title: "What You Can Do", content: "Calculate quantum scores for any prospect. The AI analyzes all available data — profile, company, outreach history, engagement patterns — and produces a comprehensive score. Use the score to prioritize your pipeline: focus on A and B prospects first." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Data-driven prospect prioritization. Instead of guessing who to call first, the quantum score tells you exactly which prospects are most likely to convert. Sales teams using scoring report 30-40% improvement in conversion rates because they focus on the right prospects." },
      { icon: "tips", title: "Pro Tips", content: "Score all your prospects and sort by total score. Focus your time on A and B grade prospects. For C and D prospects, use automated ghost sequences instead of manual outreach. Re-score prospects monthly — their score changes as new data comes in." },
    ],
  },

  smtpAccounts: {
    title: "SMTP Accounts Guide",
    description: "Click to learn about managing your email sending accounts",
    sections: [
      { icon: "purpose", title: "What This Page Does", content: "SMTP Accounts manages your 260 email sending addresses across 52 domains. Each account connects to one of your 5 Contabo mail servers. The system rotates across all accounts when sending campaigns, distributing volume evenly to protect each domain's reputation." },
      { icon: "expect", title: "What You'll See", content: "A list of all configured SMTP accounts with email address, server host, port, daily send limit, today's send count, and status (Active/Paused/Error). The daily limit ensures no single address sends more than its safe threshold." },
      { icon: "actions", title: "What You Can Do", content: "Add SMTP accounts with email address, server host, port, username, and password. Set daily send limits per account (recommended: ~385 per address for 100K daily total across 260 addresses). Enable/disable accounts. The system automatically rotates across active accounts." },
      { icon: "outcomes", title: "Expected Outcomes", content: "Even distribution of sending volume across all 260 addresses and 52 domains. No single domain or IP gets overloaded. Daily limits prevent any account from exceeding safe sending thresholds. This is the foundation of your 100K/day sending capacity." },
      { icon: "tips", title: "Pro Tips", content: "Add all 260 accounts before starting any campaigns. Set conservative daily limits initially (200/address) and gradually increase. Monitor Domain Stats to ensure even distribution. If any account shows errors, check the SMTP credentials and server connectivity." },
    ],
  },
};
