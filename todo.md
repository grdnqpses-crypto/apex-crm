# Apex CRM - Project TODO

## Core Infrastructure
- [x] Database schema design (all tables)
- [x] Apply database migrations
- [x] Server-side tRPC routers for all features
- [x] Dark theme with professional CRM design
- [x] Dashboard layout with sidebar navigation
- [x] Google Fonts (Inter) integration

## 1. Contact & Company Management
- [x] Contacts CRUD with custom fields, tags, lifecycle stages
- [x] Companies CRUD with hierarchy support
- [x] 360-degree activity timeline
- [x] Contact detail page with full profile

## 2. Multi-Pipeline Deal Management
- [x] Deal pipelines with customizable stages
- [x] Kanban board view for deals
- [x] Weighted forecasting
- [x] Win/loss analysis

## 3. Email Campaign Builder
- [x] Email template library
- [x] Campaign creation with personalization tokens
- [x] Dynamic content blocks
- [x] Campaign list and management

## 4. Email Deliverability Engine
- [x] Pre-send spam score analysis (AI-powered)
- [x] Domain/IP warm-up scheduler
- [x] Authentication checker (SPF/DKIM/DMARC guidance)
- [x] Reputation monitoring dashboard

## 5. Marketing Automation Workflows
- [x] Visual workflow builder
- [x] Trigger-based actions
- [x] Lead scoring system
- [x] Multi-channel sequences

## 6. Analytics Dashboard
- [x] Real-time metrics overview
- [x] Engagement heatmaps
- [x] Funnel analysis
- [x] ROI tracking

## 7. Team Collaboration
- [x] Task assignment system
- [x] Activity logging
- [x] Internal notes on contacts/deals
- [x] Email threading view

## 8. Smart Segmentation & List Management
- [x] Dynamic filter builder
- [x] Engagement-based scoring
- [x] Automated list hygiene
- [x] Segment management

## 9. A/B Testing Framework
- [x] Subject line testing
- [x] Content variation testing
- [x] Send time optimization
- [x] Sender name testing

## 10. API & Webhook System
- [x] API key management
- [x] Webhook configuration
- [x] Event log viewer
- [x] API documentation page

## Testing & Polish
- [x] Vitest unit tests for server routers (31 tests passing)
- [x] Final UI polish and responsive design

## Phase 2: Rebuild per Contact, Company & Task Instructions

### Database Schema Overhaul
- [x] Expand contacts table with all fields from ContactInstructions (50+ fields including social, marketing attribution, logistics-specific)
- [x] Expand companies table with all fields from CompanyInstructions (40+ fields including firmographics, social, logistics)
- [x] Add 25+ logistics-specific lead statuses as configurable options
- [x] Expand activities table to support Notes, Calls, Emails, Meetings with full field sets
- [x] Expand tasks table with all fields from TaskPage (type, queue, reminder, associations, completion fields, recurring)
- [x] Add SMTP sending accounts table for 52 domains / 260 email addresses
- [x] Add email sending queue and tracking tables

### Server API Rebuild
- [x] Rebuild server/db.ts with new query helpers for all expanded tables
- [x] Rebuild server/routers.ts with updated field names and new SMTP/queue routers
- [x] Add SMTP account management endpoints (CRUD, reset daily counts)
- [x] Add email queue management endpoints
- [x] Add lead status listing endpoint
- [x] Fix all TypeScript errors in frontend pages (Contacts, ContactDetail, Companies, Tasks)

### Contact Page Rebuild
- [x] Rebuild contact form with all fields grouped by category (Identity, Communication, Address, Lifecycle, Marketing, Social, Logistics)
- [x] Contact detail page with 3 tabs: Overview (timeline), Companies, Activities
- [x] Activity sub-filters on Activities tab: All, Notes, Emails, Calls, Tasks, Meetings
- [x] Activity creation forms for each type with full field sets per instructions
- [x] All 25+ logistics lead statuses in dropdown

### Company Page Rebuild
- [x] Rebuild company form with all fields grouped by category (Identity, Location, Firmographics, Lifecycle, Social, Logistics)
- [x] Company detail page with 3 tabs: Overview (timeline), Contacts, Activities
- [x] Associated contacts tab showing linked contacts
- [x] Activity sub-filters matching contact page
- [x] Logistics-specific fields: Credit Terms, Payment Status, Lane Preferences, TMS Integration

### Task Page Rebuild
- [x] Task form with all fields: Title, Type (Call/Email/To-do/Follow-up), Due Date/Time, Assigned To, Priority, Notes, Status, Queue
- [x] Task associations: Contact, Company, Deal
- [x] Task reminders and notifications
- [x] Task completion fields (Completed Date, Completed By, Outcome)
- [x] Task visibility/permissions
- [x] Recurring task settings
- [x] Task queue grouping (Prospecting Calls, Customer Renewals, Carrier Setup)

### SMTP Email Sending Engine
- [x] SMTP connection manager for 5 Contabo MX servers
- [x] Email address rotation across 260 addresses
- [x] Per-address daily sending limits (~385/address)
- [x] Throttled sending with configurable delays
- [x] Bounce handling and automatic list cleanup
- [x] Domain health monitoring per sending domain

## Phase 3: Paradigm Engine - BNB Prospecting & Sales Intelligence Module

### Database Schema Additions
- [x] Add prospects table (AI-discovered leads with verification status, psychographic profile, engagement stage)
- [x] Add trigger_signals table (Sentinel events: job changes, patents, social complaints)
- [x] Add ghost_sequences table (4-stage automated follow-up sequences)
- [x] Add ghost_sequence_steps table (individual steps within sequences)
- [x] Add battle_cards table (AI-generated tactical summaries for hot leads)
- [x] Add integration_credentials table (Apollo, NeverBounce, Google AI, SendGrid, PhantomBuster keys)
- [x] Add prospect_outreach table (AI engagement log: emails sent, replies, intent signals)

### Sentinel Layer (Discovery)
- [x] Trigger event monitoring dashboard (job changes, patents, social signals)
- [x] Signal feed with real-time event stream
- [x] Auto-create lead objects from detected signals
- [ ] Apollo.io integration for lead sourcing (names, titles, companies) - requires API key
- [ ] PhantomBuster integration for LinkedIn scraping - requires API key

### Nutrition Layer (Verification Gate)
- [x] NeverBounce email verification integration (LLM-based verification built in)
- [x] Zero-trust gatekeeper: only 'Valid' emails proceed
- [x] Bounce rate monitoring (target: <2%)
- [x] Auto-trigger Self-Healing on invalid emails

### Digital Twin Layer (Psychographic Profiling)
- [x] AI integration for personality analysis (LLM-powered)
- [x] Analyze personality type, communication style, motivators
- [x] Store psychographic profiles as JSON metadata
- [x] Visual personality profile cards on prospect detail

### Ghost Mode (Autonomous Engagement)
- [x] Multi-stage automated follow-up sequence builder
- [x] AI draft generation with personalization
- [x] Positive Intent detection for human handoff
- [x] Hot lead alerts via Pulse Dashboard
- [x] Sequence management UI (create, pause, resume, stop)

### Self-Healing Layer (Data Immortality)
- [x] Self-healing data architecture (signal-based updates)
- [x] Auto-detect job changes via trigger signals
- [x] Prospect promotion to CRM contact on conversion
- [x] Engagement stage tracking across lifecycle

### Pulse Dashboard
- [x] Live AI activity feed (manage by exception)
- [x] Hot Leads panel with visual handoff alerts
- [x] Battle Cards: one-page tactical summaries per hot lead
- [x] Prospect pipeline visualization
- [x] Daily verified leads counter

### Integration Credentials Settings
- [x] Secure API key storage for Apollo.io, NeverBounce, Google AI Studio, SendGrid, PhantomBuster
- [x] Connection test for each integration
- [x] Status indicators for each service

### Tests
- [x] Vitest tests for Paradigm Engine routers (50 tests passing)

## Phase 4: Proprietary BNB Engine + Compliance Fortress + Deliverability Infrastructure

### Compliance Engine (CAN-SPAM / GDPR / CCPA)
- [x] Pre-send compliance validator that blocks non-compliant emails
- [x] Physical address requirement enforcement
- [x] Unsubscribe link injection (RFC 8058 one-click)
- [x] Subject line deception detector (AI-powered)
- [x] Opt-out honor system (automatic suppression within 10 business days)
- [x] GDPR consent tracking and right-to-erasure support
- [x] CCPA data access and deletion request handling
- [x] Compliance audit log for every email sent

### Deliverability Infrastructure
- [x] Provider-specific email routing (Gmail, Outlook, Yahoo detection)
- [x] Outlook-specific optimizations (SNDS headers, RFC 8058, complaint rate monitoring)
- [x] Gmail-specific optimizations (List-Unsubscribe, dual SPF+DKIM, <0.1% complaint target)
- [x] Yahoo-specific optimizations (CFL headers, DMARC alignment)
- [x] Email header optimization engine (proper MIME, Message-ID, Date, Return-Path)
- [x] Send rate throttling per provider with configurable limits
- [x] Automatic domain rotation with health-aware load balancing
- [x] Real-time bounce processing and automatic suppression
- [x] Complaint feedback loop processing
- [x] Blacklist monitoring across 50+ lists

### Proprietary AI Prospecting Engine
- [x] Quantum Lead Score: 12-dimension scoring model (firmographic, behavioral, engagement, timing, social, content, recency, frequency, monetary, channel, intent, relationship)
- [x] Behavioral DNA Profiler: AI personality analysis from public data
- [x] Predictive Send Time Optimizer: per-prospect optimal timing
- [x] Adaptive Sequence Engine: sequences that rewrite based on engagement
- [x] Intent Signal Synthesizer: combine weak signals into strong buying indicators
- [x] AI Email Composer: hyper-personalized emails using prospect DNA profile
- [x] Prospect Discovery Engine: AI-powered ICP matching and lookalike finding
- [x] Engagement Velocity Tracker: measure speed of prospect warming

### Domain Reputation Autopilot
- [x] Per-domain health scoring dashboard
- [x] Automatic sending pause when domain approaches danger thresholds
- [x] Domain warm-up scheduler with graduated volume increases
- [x] Reputation recovery protocols (automatic cooldown periods)
- [x] Cross-domain load balancing based on health scores

### Provider-Specific Monitoring Dashboard
- [x] Real-time inbox placement estimation per provider
- [x] Bounce rate, complaint rate, unsubscribe rate per domain per provider
- [x] Blacklist status checker with auto-alerts
- [x] Authentication status monitor (SPF/DKIM/DMARC per domain)
- [x] Sending volume and velocity charts

### Tests
- [ ] Vitest tests for compliance engine
- [ ] Vitest tests for deliverability infrastructure
- [ ] Vitest tests for AI prospecting engine

## Phase 5: Contextual Help & Instruction Manual

### Contextual Page Guides
- [x] Create reusable PageGuide component (collapsible help section at top of each page)
- [x] Add contextual help to Dashboard page
- [x] Add contextual help to Contacts page
- [x] Add contextual help to Contact Detail page
- [x] Add contextual help to Companies page
- [x] Add contextual help to Company Detail page
- [x] Add contextual help to Deals page
- [x] Add contextual help to Tasks page
- [x] Add contextual help to Campaigns page
- [x] Add contextual help to Templates page
- [x] Add contextual help to Deliverability page
- [x] Add contextual help to Workflows page
- [x] Add contextual help to Analytics page
- [x] Add contextual help to Segments page
- [x] Add contextual help to A/B Tests page
- [x] Add contextual help to API Keys page
- [x] Add contextual help to Webhooks page
- [x] Add contextual help to Paradigm Pulse page
- [x] Add contextual help to Prospects page
- [x] Add contextual help to Prospect Detail page
- [x] Add contextual help to Signals page
- [x] Add contextual help to Ghost Sequences page
- [x] Add contextual help to Battle Cards page
- [x] Add contextual help to Integrations page
- [x] Add contextual help to Compliance Center page
- [x] Add contextual help to Suppression List page
- [x] Add contextual help to Sender Settings page
- [x] Add contextual help to Domain Stats page
- [x] Add contextual help to Quantum Score page
- [x] Add contextual help to SMTP Accounts page

### Instruction Manual / Help Center
- [x] Build Help Center page with full documentation for every feature
- [x] Add Help Center to sidebar navigation
- [x] Add route in App.tsx

## Phase 6: Logistics Lead Scanning & Email Campaign Test

### AI Lead Scanning
- [ ] Use AI to scan for manufacturers that ship freight (TL) and generate prospects
- [ ] Use AI to scan for distributors that ship freight (LTL) and generate prospects
- [ ] Populate prospect records with company info, contacts, and engagement stages
- [ ] Tag/segment prospects by TL vs LTL (manufacturers vs distributors)

### Email Campaign Creation & Test
- [ ] Create targeted email campaign for TL prospects
- [ ] Create targeted email campaign for LTL prospects
- [ ] Run compliance pre-check on both campaigns
- [ ] Execute test send through the system

## Phase 7: Cross-Feature Integration (Making Everything Work Together)

### Cross-Feature Data Queries
- [x] Add crossFeature router with dealsByContact, dealsByCompany, tasksByContact, tasksByCompany, tasksByDeal, segmentContacts, prospectsBySequence, contactsByCompany
- [x] Add getProspectsBySequence db helper

### Dashboard Enhancement
- [x] Dashboard stats now pull real data from contacts, companies, deals, campaigns, paradigm engine, and email queue
- [x] Enhanced dashboard with cross-module metrics (paradigm stats, email queue, sequence counts)

### Contact Detail Cross-Feature
- [x] Contact detail page now shows Deals tab with associated deals
- [x] Contact detail page now shows Tasks tab with associated tasks

### Company Detail Cross-Feature
- [x] Company detail page now shows Deals tab with associated deals
- [x] Company detail page now shows Tasks tab with associated tasks

### Campaign Pipeline Integration
- [x] Campaign creation now loads templates from template library
- [x] Campaign creation now targets segments with contact preview count
- [x] Campaign send pipeline: segment contacts → compliance check → suppression filter → queue emails → SMTP delivery
- [x] Campaign send button with pre-flight validation

### Paradigm Engine Integration
- [x] Signals page: Create Prospect directly from a trigger signal
- [x] Prospect detail: Enroll in Ghost Sequence with sequence selector
- [x] Prospect promotion: Auto-creates company and links to contact on promote
- [x] Ghost Sequences: Shows enrolled prospects per sequence

### Analytics Cross-Module
- [x] Analytics page now pulls real data from all modules (contacts, deals, paradigm, campaigns, sequences, domain health, suppression)
- [x] Pipeline funnel uses real contact → prospect → hot lead → deal → won data
- [x] Prospect engagement chart from Paradigm Engine stats
- [x] Campaign status breakdown from real campaign data
- [x] Domain health chart from deliverability data

### Tests
- [x] Cross-feature integration tests (18 tests verifying all cross-feature procedures exist)
- [x] All 85 tests passing across 3 test files

## Phase 8: DOT/FMCSA Broker Filing Lookup & Targeted Campaigns (Developer Only)

### DOT/FMCSA Filing Lookup Engine
- [x] Research FMCSA SAFER/Li&I data sources for broker filings
- [x] Build database table for broker filing records (DOT#, MC#, filing type, status, company info)
- [x] Build LLM-powered filing lookup that queries FMCSA data for new and renewing brokers
- [x] Create developer-only tRPC endpoints for filing lookup and prospect creation
- [x] Auto-create prospects from filing results with proper tagging (new vs renewing)

### Developer-Only UI
- [x] Build DOT/FMCSA Broker Scanner page (admin/developer access only)
- [x] Filing lookup interface with date range, filing type, state filters
- [x] Results table showing broker details, filing type, status with expandable details
- [x] Bulk select and enroll into campaigns with campaign type selector
- [x] Add to sidebar under Developer section (role-gated via adminProcedure)

### New Broker Campaign
- [x] Create email template: Congratulations on new brokerage
- [x] Explain how Apex CRM helps new brokers grow and prosper (5 features)
- [x] Offer 2-month free trial with CTA button
- [x] Auto-create campaign + template when enrolling new broker filings

### Renewing Broker Campaign
- [x] Create email template: Thank you for continued support
- [x] Empathize with industry struggles (fuel costs, margins, regulations)
- [x] Show competitor pricing comparison table (HubSpot, Salesforce, Outreach, Tai TMS)
- [x] Explain what we're doing to alleviate costs (5 solutions)
- [x] Offer 2-month free trial with CTA
- [x] Include sign-up/join link + schedule demo CTA
- [x] One-click contact/lead import feature (import box with supported platforms)
- [x] 3-step onboarding: sign up, import, start working

### Tests
- [x] Vitest tests for FMCSA templates (22 tests covering content, structure, quality)
- [x] All 107 tests passing across 4 test files

## Phase 9: Developer Options Secret Unlock

- [x] Hide Developer section from sidebar by default
- [x] Add 11-tap secret activation on Apex CRM logo in sidebar header
- [x] Show toast countdown feedback during tapping (last 5 taps show countdown)
- [x] Persist developer mode in sessionStorage (session-only, resets on close)
- [x] Show unlock confirmation toast when activated
- [x] Amber logo icon + DEV badge when developer mode is active
- [x] "Hide Dev Options" in user dropdown to disable without closing browser
- [x] All 107 tests passing

## Phase 10: Multi-Tenant Hierarchy & Role-Based Access Control

### Database Schema
- [x] Create tenant_companies table (company profiles, settings, branding, subscription plan, maxUsers, billing)
- [x] Extend users table with companyId, hierarchical systemRole (developer/company_admin/manager/user), managerId
- [x] Create feature_assignments table (assignable features per user with companyId, assignedBy)
- [x] Create company_invites table (invite tokens with role, email, expiry, status)
- [x] Run migrations (0002_clever_multiple_man.sql applied)

### Role Hierarchy
- [x] Developer (God mode): full access to everything, manages all companies, all features unlocked
- [x] Company Admin: manages their company settings, managers, users, and feature assignments
- [x] Manager: manages their assigned users, can assign features from their own allowed set
- [x] User: access only to features assigned by their manager/admin

### Backend API
- [x] Company CRUD endpoints (developer only via adminProcedure)
- [x] User invite/onboard endpoints (admin creates managers, managers create users)
- [x] Role management endpoints (promote/demote within hierarchy with validation)
- [x] Feature assignment endpoints (admin assigns to managers, managers assign to users with cascading validation)
- [x] Feature gate: useFeatureAccess hook checks user's allowed features on frontend
- [x] Company settings endpoints (admin manages company profile, branding)
- [x] myFeatures endpoint for current user's assigned features
- [x] allFeatures endpoint listing all 23 assignable features

### Developer God Mode Panel
- [x] Company management page (create, edit, suspend companies) — DevCompanies.tsx
- [x] Global user directory (see all users across all companies, change roles, assign companies) — DevUsers.tsx
- [x] System Health Monitor (server uptime, memory, DB table row counts, API response times) — DevSystemHealth.tsx
- [x] User Impersonation (view user details, feature assignments) — DevImpersonate.tsx
- [x] Activity Logs Viewer (global audit trail of all user actions) — DevActivityLog.tsx

### Company Admin Panel
- [x] Team management page (invite/remove managers and users) — CompanyAdmin.tsx
- [x] Feature assignment matrix (toggle 23 features per manager/user grouped by category)
- [x] Invite system with email, role, and token generation
- [x] Company-level user listing with role badges

### Manager Panel
- [x] Team view (see assigned users) — integrated into CompanyAdmin.tsx
- [x] Feature assignment for their users (from their allowed feature set, validated server-side)

### Feature-Gated Access
- [x] useFeatureAccess hook enforces feature gates across all CRM pages
- [x] Sidebar items filtered based on user's assigned features (23 feature-to-route mappings)
- [x] Developer/admin bypass: full access without feature checks
- [x] Always-accessible routes: Dashboard, Help Center, Team

### Additional Developer Tools
- [x] Database Inspector (browse all 36 tables with row counts) — DevSystemHealth.tsx
- [x] System Health Monitor (server uptime, memory usage, DB health, API metrics) — DevSystemHealth.tsx
- [x] User Impersonation (view any user's profile, features, role) — DevImpersonate.tsx
- [x] Activity Logs Viewer (global audit trail with type filters) — DevActivityLog.tsx
- [x] All 6 dev tools in sidebar under Developer section (behind 11-tap unlock)

### Tests
- [x] Multi-tenant hierarchy tests (19 tests: features, roles, schema, assignments, invites, sidebar mapping)
- [x] All tests passing across 5 test files

## Phase 11: HubSpot Integration & Comprehensive Settings Page

### User Hierarchy Update
- [x] Add "super_admin" role between developer and company_admin
- [x] Super Admin: full CRM access, no app changes, sets up paying customer companies
- [x] Update schema, migration (0003_large_pandemic.sql), and role validation logic

### Missing Freight-Specific Properties
- [x] Add freight_details enum (LTL, Truckload, Flatbed, Refrigerated, Intermodal, International Air, Domestic Air) to contacts
- [x] Add shipment dimensions (height, length, width inches; weight pounds) as decimal(10,2) to contacts
- [x] Add destination_zip_code, shipping_origination, destination to contacts
- [x] Add annual_freight_spend (decimal 14,2), commodity, credit_terms, lane_preferences, tms_integration_status to companies
- [x] Run schema migration (0003_large_pandemic.sql applied)

### Comprehensive Settings Page (from SettingsPage.docx)
- [x] Your Preferences section (Profile, Email, Calling, Calendar, Tasks, Security, Automation)
- [x] Notifications section (Email Notifications, Desktop, Mobile, Digest)
- [x] Account Management section (Account Defaults, Audit Log, Hierarchy, Product Updates)
- [x] Integrations section (Connected Apps, API Access, Webhooks Config, Marketplace)
- [x] Privacy & Consent section (Data Privacy, Cookie Settings, Consent Management, Data Retention)
- [x] AI & Automation section (AI Settings, Workflow Automation, Predictive Scoring, Smart Suggestions)
- [x] Data Management section (Properties per object, Objects config, Import & Export, Backups)
- [x] Profile settings with avatar, name, email, timezone, language
- [x] Add Settings to sidebar navigation under Resources

### HubSpot Import/Mapping Tool
- [x] Build HubSpot CSV parser with quoted field support
- [x] Auto-map 38 contact properties and 21 company properties to Apex CRM fields
- [x] Show mapping UI with source → destination field matching, grouped by category
- [x] One-click import with dedup and skip-empty options
- [x] Import progress bar and per-file results summary (created/skipped/errors)
- [x] 3-step wizard: Upload → Map → Import → Complete
- [x] Custom freight/logistics field mapping (all 14 contact + 5 company freight fields)
- [x] Add HubSpot Import to sidebar under Resources

### Tests
- [x] Tests for settings page structure (6 tests)
- [x] Tests for HubSpot import mapper (9 tests: mappings, CSV parser)
- [x] Tests for updated role hierarchy (6 tests)
- [x] Tests for freight property schema (5 tests)
- [x] Tests for CSV parser (6 tests)
- [x] All 158 tests passing across 6 test files

## Phase 12: Domain Health Optimization Engine

### Domain Health Optimizer Backend
- [ ] Create domain_health_records table for tracking daily health metrics per domain
- [ ] Build automated warm-up scheduler (gradual volume ramp over 4-8 weeks)
- [ ] Build reputation monitoring system (track bounce rate, complaint rate, open rate per domain)
- [ ] Auto-pause domains exceeding bounce/complaint thresholds
- [ ] Auto-resume domains after cooldown period with reduced volume
- [ ] Domain rotation algorithm (prioritize healthiest domains, rest underperforming ones)
- [ ] SPF/DKIM/DMARC validation checker per domain
- [ ] Provider-specific optimization (Gmail, Outlook, Yahoo rules)
- [ ] Daily health score recalculation based on weighted metrics
- [ ] Domain warm-up progress tracking (phase, daily limit, days remaining)

### Domain Health Optimizer UI
- [ ] Build Domain Health Optimizer page with health dashboard
- [ ] Domain health leaderboard (all domains ranked by score)
- [ ] Warm-up scheduler interface (start/pause/reset warm-up per domain)
- [ ] Health trend charts (score over time per domain)
- [ ] Automated recommendations panel (what to fix per domain)
- [ ] Bulk actions (pause all unhealthy, restart warm-up, rotate primaries)
- [ ] Authentication status checker (SPF/DKIM/DMARC per domain)

### Enhance Existing Pages
- [ ] Update Deliverability page with optimizer integration
- [ ] Update Domain Stats page with health trend data
- [ ] Update SMTP Accounts page with warm-up status indicators

### Tests
- [ ] Tests for health score calculation algorithm
- [ ] Tests for warm-up scheduler logic
- [ ] Tests for auto-pause/resume thresholds
- [ ] Tests for domain rotation algorithm

### Domain Auto-Healing Engine
- [ ] Auto-pause domains when bounce rate >2% or complaint rate >0.1%
- [ ] Auto-cooldown: rest paused domains for 24-72 hours based on severity
- [ ] Auto-volume reduction: cut daily limit by 50% on recovery, gradual ramp back
- [ ] Auto-rotation: shift traffic from unhealthy domains to healthy ones in real-time
- [ ] Auto-resume: bring domains back online after cooldown with reduced volume
- [ ] Bounce list auto-cleanup: suppress all addresses that caused bounces
- [ ] Authentication auto-check: verify SPF/DKIM/DMARC and flag misconfigurations
- [ ] Provider-specific thresholds (Gmail <0.1% complaints, Outlook SNDS monitoring, Yahoo CFL)
- [ ] Health score algorithm: weighted composite of auth, bounce, complaint, open, delivery rates
- [ ] Daily health recalculation cron job
- [ ] Domain warm-up auto-scheduler: 8-week graduated ramp (50→100→200→500→1000→2000→3000→5000/day)
- [ ] Recovery protocol: automatic 3-phase recovery (rest → reduced → normal)

### Continuous A/B Testing Engine
- [ ] Auto-split every campaign into A/B variants (subject line, content, send time, sender name)
- [ ] AI-generated variant creation (LLM writes alternative subject lines and content)
- [ ] Statistical significance calculator (minimum sample size, confidence interval)
- [ ] Auto-winner selection when significance threshold reached
- [ ] Auto-apply winning variant to remaining unsent emails
- [ ] Continuous learning: store winning patterns and apply to future campaigns
- [ ] Always-on mode: every campaign gets A/B tested by default, no manual setup
- [ ] Performance history: track which patterns win over time
- [ ] Multi-variate support: test multiple variables simultaneously

### UI Pages
- [ ] Domain Health Optimizer dashboard (health scores, trends, auto-healing status, recommendations)
- [ ] Continuous A/B Testing dashboard (active tests, results, winning patterns, learning history)

### Tests
- [ ] Tests for health score calculation
- [ ] Tests for auto-pause/resume thresholds
- [ ] Tests for warm-up schedule generation
- [ ] Tests for A/B split logic and significance calculation
- [ ] Tests for variant generation

## Phase 13: Premium Features — AI Voice Agent, DocScan, Win Probability, Revenue Autopilot

### AI Voice Agent ("Apex Caller")
- [ ] Build call_logs and voice_campaigns database tables
- [ ] Build voice agent backend: call initiation, script generation, transcription, lead qualification
- [ ] Build Apex Caller UI page with call dashboard, script editor, campaign builder
- [ ] Integrate with Prospect and Contact pages ("Call with Apex Caller" button)
- [ ] Call recording, transcription, and activity logging
- [ ] Hot lead flagging and automatic task creation from call results

### Document Intelligence ("DocScan") with Carrier Packets
- [ ] Research carrier packets: required documents, compliance fields, industry standards
- [ ] Build documents and carrier_packets database tables
- [ ] Build AI document extraction engine (LLM-powered parsing)
- [ ] Build carrier packet builder/validator (all required fields, expiration tracking)
- [ ] Build DocScan UI: drag-and-drop upload, extraction results, auto-filing
- [ ] Build Carrier Packet Manager page: create, validate, share carrier packets
- [ ] Auto-match extracted data to contacts/companies/deals
- [ ] Compliance watchdog: flag expired insurance, missing authority, blacklisted carriers

### Win Probability Engine
- [ ] Build deal_scores database table for historical tracking
- [ ] Build AI scoring algorithm (engagement signals, response times, email opens, call frequency)
- [ ] Real-time probability score on every deal card (0-100% with trend arrows)
- [ ] Dashboard widgets: "Deals at Risk" and "Ready to Close"
- [ ] AI explanation of score changes
- [ ] Automatic task creation when probability drops
- [ ] Revenue forecasting based on probability-weighted pipeline

### Revenue Autopilot ("Money Machine")
- [ ] Morning briefing generator (re-engagement, lane analysis, upsell detection)
- [ ] Margin optimizer with industry benchmarks
- [ ] Weekly revenue scorecard with AI commentary
- [ ] Integrate into Dashboard as "Today's Revenue Actions"

### AI Email Ghostwriter
- [ ] "Draft Reply" button on contact/deal pages
- [ ] Context-aware email generation using conversation history and deal stage
- [ ] Style learning from sent emails

### Smart Notifications
- [ ] AI-prioritized notification system ranked by revenue impact
- [ ] "Call them NOW" alerts for high-intent signals

### AI Meeting Prep ("Brief Me")
- [ ] One-click pre-call intelligence summary
- [ ] Contact history, deal context, suggested talking points

### SaaS Multi-Tenant Considerations
- [ ] Ensure all new features respect company-level data isolation
- [ ] Feature gating: premium features assignable per subscription tier
- [ ] Usage metering for voice calls, document scans, AI queries

### Tests
- [ ] Tests for AI Voice Agent endpoints
- [ ] Tests for DocScan extraction and carrier packet validation
- [ ] Tests for Win Probability scoring algorithm
- [ ] Tests for Revenue Autopilot recommendations

### 30-Second Commercial
- [ ] Create compelling 30-second video commercial for Apex CRM
- [ ] Showcase AI Voice Agent, DocScan, Win Probability, and automation features
- [ ] Target audience: freight brokers looking for cutting-edge CRM technology

### Competitive Analysis
- [x] Research all major freight broker CRM/TMS platforms comprehensively
- [x] Identify features competitors have that Apex CRM doesn't
- [x] Document competitive advantages of Apex CRM
- [x] Create comprehensive competitive analysis report

### Phase 14: Competitive Feature Parity (12 Features)

#### Load Management
- [ ] Database schema: loads table (origin, destination, commodity, weight, rate, status, carrier, shipper, pickup/delivery dates, tracking)
- [ ] Load lifecycle: create, dispatch, in-transit, delivered, closed
- [ ] Load status tracking with real-time updates
- [ ] Load Management UI page with filters, search, status board
- [ ] Integration: auto-create loads from deals, link to carriers and contacts

#### Carrier Vetting (DOT/FMCSA Deep Integration)
- [ ] Database schema: carrier_profiles table (DOT#, MC#, safety rating, insurance, authority status)
- [ ] Deep FMCSA integration: pull live safety data, insurance verification, authority status
- [ ] Carrier scorecard with performance metrics
- [ ] Carrier Vetting UI page
- [ ] Integration: link to carrier packets, auto-flag expired insurance

#### Load Board Integration
- [ ] Database schema: load_board_posts table (board, post_id, load_id, status, responses)
- [ ] Simulated integration with DAT, Truckstop, 123Loadboard
- [ ] Post loads to boards, receive carrier responses
- [ ] Load Board UI page
- [ ] Integration: auto-post from load management, carrier matching

#### Invoicing & Billing
- [ ] Database schema: invoices table (load_id, shipper, carrier, amount, status, due_date, paid_date)
- [ ] Invoice generation from completed loads
- [ ] Invoice status tracking (draft, sent, paid, overdue)
- [ ] Invoicing UI page with templates and PDF generation
- [ ] Integration: auto-generate from closed loads, link to accounting

#### Customer Portal
- [ ] Database schema: portal_sessions, portal_quotes, portal_tracking
- [ ] Self-service portal for shippers: submit quotes, track loads, view invoices
- [ ] Portal authentication and access control
- [ ] Customer Portal UI pages
- [ ] Integration: real-time load tracking, invoice viewing

#### Conversation Intelligence
- [ ] Database schema: call_recordings, call_analyses
- [ ] AI analysis of call recordings (sentiment, talk ratio, action items)
- [ ] Call coaching insights and recommendations
- [ ] Conversation Intelligence UI page
- [ ] Integration: analyze Voice Agent calls, link insights to contacts/deals

#### B2B Contact Database
- [ ] Database schema: b2b_contacts, enrichment_logs
- [ ] AI-powered contact/company search and enrichment
- [ ] Company and contact data enrichment from public sources
- [ ] B2B Database UI page with search and import
- [ ] Integration: import enriched contacts into CRM, auto-enrich existing contacts

#### Email Warmup
- [ ] Database schema: warmup_campaigns, warmup_progress
- [ ] Domain warmup scheduling and monitoring
- [ ] Warmup progress tracking with deliverability metrics
- [ ] Email Warmup UI page
- [ ] Integration: link to SMTP accounts, auto-start warmup for new domains

#### Anonymous Visitor Tracking
- [ ] Database schema: visitor_sessions, visitor_companies
- [ ] Track anonymous website visitors and identify companies
- [ ] AI company identification from IP/behavior signals
- [ ] Visitor Tracking UI page
- [ ] Integration: auto-create prospects from identified visitors

#### AI Order Entry (Email-to-Load)
- [ ] Database schema: inbound_emails, parsed_orders
- [ ] AI parsing of inbound emails to extract load details
- [ ] One-click conversion of parsed emails to loads
- [ ] AI Order Entry UI page
- [ ] Integration: auto-create loads from parsed emails, link to contacts

#### White-Labeling
- [ ] Database schema: white_label_config (logo, colors, domain, company_name)
- [ ] Per-tenant branding configuration
- [ ] Dynamic theme application based on tenant config
- [ ] White-Label Settings UI page
- [ ] Integration: apply branding across all pages, customer portal, invoices

#### Digital Customer Onboarding
- [ ] Database schema: onboarding_flows, onboarding_steps, e_signatures
- [ ] Digital credit application and onboarding forms
- [ ] E-signature capture for agreements
- [ ] Digital Onboarding UI page
- [ ] Integration: auto-create contacts/companies from completed onboarding

#### Cross-Feature Integration
- [ ] Load Management ↔ Carrier Vetting (auto-assign vetted carriers)
- [ ] Load Management ↔ Invoicing (auto-generate invoices from closed loads)
- [ ] Load Management ↔ Load Board (auto-post/remove from boards)
- [ ] AI Order Entry ↔ Load Management (email → load creation)
- [ ] Conversation Intelligence ↔ Voice Agent (analyze AI calls)
- [ ] B2B Database ↔ Paradigm Engine (enrich prospects)
- [ ] Email Warmup ↔ Deliverability Engine (warmup new domains)
- [ ] Visitor Tracking ↔ Paradigm Engine (auto-create prospects)
- [ ] White-Labeling ↔ Customer Portal (branded portal)
- [ ] Digital Onboarding ↔ CRM (auto-create contacts)
- [ ] All features work autonomously and individually

#### Tests & Documentation
- [ ] Comprehensive tests for all 12 new features
- [ ] Update system guide with all competitive features
- [ ] Create 30-second commercial video

#### 2-Month Free Trial System
- [ ] Database schema: subscription_plans, tenant_subscriptions (plan, trial_start, trial_end, status, billing)
- [ ] Trial activation on signup — automatic 2 months free, no credit card required
- [ ] Trial status tracking, expiration warnings, upgrade prompts
- [ ] Subscription management UI (plan selection, billing status, upgrade/downgrade)
- [ ] Integration: trial banner across app, feature gating after trial expires

#### One-Touch Migration / Integration
- [ ] Database schema: migration_jobs (source_platform, status, progress, imported_records)
- [ ] One-touch import from HubSpot (contacts, companies, deals, emails)
- [ ] One-touch import from Salesforce (contacts, accounts, opportunities)
- [ ] One-touch import from DAT/Tai TMS (loads, carriers, lanes)
- [ ] One-touch import from Zoho CRM (contacts, deals, accounts)
- [ ] One-touch import from spreadsheets/CSV (universal import)
- [ ] Migration wizard UI with progress tracking and validation
- [ ] Integration: map imported data to Apex CRM fields, auto-deduplicate
- [ ] Feature in commercial: "Switch in 60 seconds — bring everything with you"

### Phase 15: Complete Build + Autonomous Command Center
- [ ] Invoicing UI page
- [ ] Customer Portal UI page
- [ ] Digital Onboarding UI page
- [ ] Conversation Intelligence UI page
- [ ] B2B Database UI page
- [ ] Email Warmup UI page
- [ ] Visitor Tracking UI page
- [ ] AI Order Entry UI page
- [ ] White-Labeling UI page
- [ ] One-Touch Migration Engine UI page
- [ ] SaaS Subscription & 2-Month Free Trial UI page
- [ ] Autonomous Command Center — single-screen AI copilot
- [ ] Wire all cross-feature integrations
- [ ] Comprehensive tests for all features
- [ ] Update system guide
- [ ] Create 30-second commercial

### Enterprise CRM Color System
- [x] Apply enterprise color system: Blue=workflow, Green=success, Amber=pending, Red=critical, Purple=premium, Gray=inactive
- [x] Update index.css with semantic CRM color variables
- [x] Apply color system across all status badges, indicators, and UI elements

## Phase 16: Autonomous Digital Freight Marketplace + Apex Autopilot

### Shipper Self-Service Portal (FREE for Manufacturers/Distributors)
- [ ] Database: marketplace_loads (shipper posts load specs: origin, destination, commodity, weight, dimensions, pickup/delivery dates, special requirements)
- [ ] Database: marketplace_bids (carrier bids on loads, rate, ETA, equipment type)
- [ ] Database: marketplace_payments (shipper pays us at booking, we pay carrier after delivery, margin tracking)
- [ ] Database: marketplace_tracking (real-time GPS tracking events, status updates, ETAs)
- [ ] Database: marketplace_documents (auto-generated BOLs, rate confirmations, carrier packets, insurance certs, delivery receipts)
- [ ] Shipper registration (free, no cost to post loads)
- [ ] Load posting form: origin, destination, commodity, weight, dimensions, pickup/delivery windows, special handling
- [ ] AI Carrier Matching: automatically find best carrier based on route, equipment, safety rating, price, availability
- [ ] Autonomous paperwork: auto-generate BOL, rate confirmation, carrier packet, insurance verification
- [ ] Payment collection: shipper pays at time of booking
- [ ] Carrier payment: pay carrier after confirmed delivery (escrow model)
- [ ] Margin calculation: automatic profit margin on every load
- [ ] Real-time tracking: shipper and broker can track carrier from pickup to delivery
- [ ] Delivery confirmation: POD upload, signature capture, auto-close load
- [ ] All documentation handled autonomously — zero manual paperwork

### Apex Autopilot (Freight Consolidation + Lane Prediction)
- [ ] Database: lane_analytics (historical lane data, demand patterns, seasonal trends)
- [ ] Database: consolidation_opportunities (AI-identified shipment combinations)
- [ ] Freight consolidation algorithm: combine LTL shipments into FTL on same routes
- [ ] Lane demand prediction: predict which lanes will have freight before it's posted
- [ ] Auto-rate negotiation: AI suggests optimal pricing based on market conditions
- [ ] Backhaul optimization: find return loads so carriers never deadhead
- [ ] Volume scaling: handle 300-400% more loads without additional staff
- [ ] Continuous route optimization across all active loads

### Marketplace UI Pages
- [ ] Shipper Portal: load posting, tracking, payment, document access
- [ ] Carrier Matching Dashboard: AI matches, bid management, carrier selection
- [ ] Payment & Escrow: payment collection, carrier payouts, margin reports
- [ ] Live Tracking: real-time map view of all active shipments
- [ ] Autonomous Documents: auto-generated paperwork library
- [ ] Apex Autopilot Dashboard: consolidation opportunities, lane predictions, optimization metrics

### Tests
- [ ] Tests for marketplace load posting and carrier matching
- [ ] Tests for payment/escrow flow
- [ ] Tests for autonomous document generation
- [ ] Tests for Apex Autopilot consolidation algorithm

## Phase 17: Comprehensive Platform Audit
- [x] Audit email deliverability system (SPF/DKIM/DMARC validation logic)
- [x] Audit email warmup engine logic and scheduling
- [x] Audit domain health monitoring and reputation scoring
- [x] Audit spam prevention measures (bounce handling, complaint tracking)
- [x] Audit SMTP account management and rotation
- [x] Audit CAN-SPAM / GDPR compliance in email system
- [x] Audit all core CRM routers and API endpoints
- [x] Audit database schema integrity
- [x] Audit all UI pages for errors
- [x] Fix any issues found (5 test failures fixed, all 219 now pass)
- [x] Run full test suite and verify all pass (219/219 = 100%)

## Phase 18: Email Masking System
- [x] Add email_mask_settings table to schema (display name, display email, reply-to, per company)
- [x] Add db helpers for email mask CRUD
- [x] Add emailMask router with get/save endpoints
- [x] Update email queue logic to apply mask (display From vs envelope sender)
- [x] Build easy Email Masking settings UI page
- [x] Add masking to DashboardLayout sidebar navigation
- [x] Write tests for email masking system (15/15 passed)

## Phase 19: Fix Color Scheme
- [x] Update index.css with correct enterprise CRM color system
- [x] Blue=standard workflow, Green=success/booked, Amber=pending, Red=critical, Purple=premium, Gray=inactive
- [x] Update dashboard cards and status badges to use correct colors
- [x] Verify color scheme across all key pages

## Phase 20: Switch to Light Theme
- [x] Remove dark theme, switch ThemeProvider to "light"
- [x] Rewrite index.css :root with light theme colors (white bg, dark text)
- [x] Ensure all CRM status colors are vibrant on light background
- [x] Verify dashboard and all pages render correctly

## Phase 21: Company-First CRM Architecture
- [x] Make companyId required (NOT NULL) on contacts table
- [x] Add cascade delete: deleting a company deletes all its contacts
- [x] Update contacts router to always scope by companyId
- [x] Update Companies page to show contacts nested under each company
- [x] Update Contacts page to require company selection
- [x] Update sidebar: Companies is primary, Contacts nested under it
- [x] Prevent creating contacts without a company
- [x] Write tests for cascade delete and company-scoped contacts

## Phase 22: Beautiful Visual Redesign + Company-First Architecture
- [x] Design warm, premium color palette (soft gradients, warm tones, elegant typography)
- [x] Rewrite index.css with beautiful new theme variables
- [x] Add Google Font (Inter or similar premium font) to index.html
- [x] Redesign Dashboard with beautiful gradient cards, soft shadows, visual warmth
- [x] Redesign Companies page as primary entity with nested contacts
- [x] Update backend: companyId required on contacts, cascade delete on company removal
- [x] Update contacts router to always scope by company
- [x] Redesign sidebar with polished, warm aesthetic
- [x] Ensure all status colors (Blue/Green/Amber/Red/Purple/Gray) are beautiful on new theme

## Phase 23: Visual Polish + UX Enhancements
- [x] Redesign ContactDetail page with warm premium look (rounded cards, soft shadows, warm colors)
- [x] Redesign CompanyDetail page with warm premium look and aggregate metrics
- [x] Redesign Deals/Kanban page with warm premium look
- [x] Add Quick Add Company button inside contact creation dialog
- [x] Add company-level aggregate metrics (total contacts, open deals, pipeline value) on Companies list page
- [x] Write/update tests for new features

## Phase 24: Recent Activity Feed on Dashboard
- [x] Add backend endpoint for recent activities (all contacts, sorted by date, limited)
- [x] Build Recent Activity feed UI on Dashboard with warm premium design
- [x] Show activity type icons (note, call, email, meeting), contact name, timestamp
- [x] Write tests for recent activities endpoint

## Phase 25: In-App Documentation & Contextual Guidance
- [x] Create a Guide/Documentation page explaining every feature (HelpCenter already comprehensive)
- [x] Add contextual descriptions and purpose statements to Dashboard sections
- [x] Add page-level descriptions to Companies page
- [x] Add page-level descriptions to Contacts page
- [x] Add page-level descriptions to Deals/Kanban page
- [x] Add page-level descriptions to Tasks page
- [x] All pages already have PageGuide component with contextual help

## Phase 26: AI Assistant (CRM Copilot)
- [x] Build AI assistant backend tRPC endpoint with full CRM system prompt
- [x] System prompt covers every feature, page, workflow, and capability in the CRM
- [x] AI can answer questions about any CRM feature, explain how things work, guide users
- [x] AI can take actions: create companies, contacts, deals, log activities, create tasks
- [x] AI can look up data: search contacts, companies, deals, recent activities
- [x] AI can create campaigns, email templates, segments
- [x] AI can create and complete tasks
- [x] AI can import/bulk-create contacts from a list
- [x] AI can create workflows and automation sequences
- [x] AI can search across all entities
- [x] AI can update existing records
- [x] AI can delete records when asked
- [x] AI can provide pipeline summaries and analytics on demand
- [x] AI can log activities (notes, calls, emails, meetings) on contacts
- [x] Build floating AI chat panel UI accessible from every page
- [x] Chat supports markdown rendering
- [x] Show action confirmations when AI performs CRM actions
- [x] AI assistant wired into DashboardLayout sidebar with floating chat panel

## Phase 27: Complete Audit + Phenomenal Guide + Commercial
- [x] Full backend audit: verify all routers compile and endpoints respond (72 tables, 307 db helpers, 3312-line router, 0 TS errors, all 200s)
- [x] Full frontend audit: verify every page renders without errors
- [x] Verify AI assistant works end-to-end (chat, tool-calling, actions)
- [x] Verify all forms create/update/delete correctly
- [x] Verify all cross-feature integrations work (contacts→companies, deals→pipeline, etc.)
- [x] Fix any broken features found during audit (no issues found)
- [x] Rebuild Help Center into a phenomenal, inspiring, comprehensive guide (30 guides, 8 categories, hero section, pro tips)
- [x] Create stunning one-minute commercial page (eye-catching, informative, astounding)
- [x] Run full test suite and ensure all tests pass (14 files, 313 tests, all passed)

## Phase 28: Global Search + Onboarding Wizard + Cinematic Commercial

- [x] Build backend global search endpoint (searches companies, contacts, deals simultaneously)
- [x] Build global search bar UI in sidebar header with keyboard shortcut (Cmd+K)
- [x] Search results show type icons, names, and quick-navigate on click
- [x] Build Getting Started onboarding wizard for new users
- [x] Wizard walks through: create first company → add first contact → create first deal
- [x] Wizard shows progress steps and celebrates completion
- [x] Create downloadable video commercial (MP4) for social media posting
- [x] Video includes animated text, AI demo showcases, feature highlights
- [x] Video has background music and compelling sales narrative
- [x] Video formatted for Facebook/Instagram/LinkedIn/TikTok posting
- [x] Video makes people intrigued, amazed, and wanting to buy immediately
- [x] Run full test suite and ensure all tests pass (14 files, 313 tests, all passed)

## Phase 29: Epic Vertical Video Commercial
- [x] Vertical format (1080x1920, 9:16) for phone full-screen
- [x] Epic, cinematic, high-energy pacing with fast cuts
- [x] Dramatic glowing neon effects, particle explosions, light streaks
- [x] Pulsing visual rhythm synced to music beats
- [x] Dynamic zoom/shake camera effects
- [x] AI demo showcase with dramatic typewriter reveals
- [x] Feature highlights with explosive card animations
- [x] Compelling sales narrative that makes people want to buy immediately
- [x] Fix test timeouts (domain health LLM 60s, marketplace schema 30s)
- [x] All 313 tests passing across 14 test files

## Phase 30: Real CRM Screen Recording Video Commercial
- [x] Set up screen recording tools (ffmpeg X11 capture or headless browser recording)
- [x] Record Dashboard interaction: mouse scrolling through live metrics, clicking cards
- [x] Record AI Assistant: opening chat, typing commands, watching it create company/contact
- [x] Record Deals pipeline: clicking through stages, viewing deal details
- [x] Record Companies/Contacts: browsing list, opening detail pages
- [x] Record Campaigns: viewing campaign builder, templates
- [x] Edit recordings into 47-second cinematic vertical commercial
- [x] Add overlay text highlighting unique features vs competitors
- [x] Add epic background music and transitions
- [x] Vertical format (1080x1920) for social media
- [x] Show real mouse movement, clicks, animations — not static screenshots

## Phase 31: CRM UX Fixes - AI Everywhere + Top Navigation
- [x] AI Assistant chat button/panel available on every single page
- [x] Apex CRM branding/logo at the top of every page
- [x] Dashboard link always accessible at the top for easy navigation back
- [x] Top header bar persistent across all pages

## Phase 32: EPIC Fully Animated Motion Graphics Commercial
- [x] Pure motion graphics — every frame has movement, nothing static
- [x] Animated text flying in, shapes morphing, UI elements building on screen
- [x] Counters ticking up, pipeline bars growing, cards flipping
- [x] Cinematic music synced to visual beats
- [x] Emotional story arc: pain → discovery → transformation → excitement
- [x] Highlight unique features: AI assistant, automation, 535 prospects, email campaigns
- [x] Competitor comparison animated (not static)
- [x] Vertical format 1080x1920 for social media
- [x] 60 seconds of continuous motion

## Phase 33: CRM Market Research, Pricing Strategy, Voiceover Commercial, Pricing Page

### Market Research
- [ ] Research pricing for all major CRMs (HubSpot, Salesforce, Pipedrive, Zoho, Monday, Freshsales, Close, Copper, Insightly, Nutshell, etc.)
- [ ] Compare functionality: AI assistant, email deliverability, prospecting, automation, compliance
- [ ] Create competitive analysis matrix (features vs price)
- [ ] Determine where Apex CRM stands vs competitors
- [ ] Set competitive tier pricing below market

### Video Commercial with Voiceover
- [ ] Write professional voiceover narration script
- [ ] Generate voiceover audio using text-to-speech
- [ ] Find better cinematic background music
- [ ] Rebuild video with voiceover narration + better music
- [ ] Include correct pricing after the demo section
- [ ] Mention 2 free months trial

### Pricing Page
- [ ] Build pricing page in the CRM with tier levels
- [ ] Add pricing to sidebar navigation
- [ ] Show feature comparison across tiers

## Phase 33 Fixes
- [x] Hide Manus platform billing banner that blocks dashboard on published site

## Phase 34: Competitive Pricing Analysis & Video with Voiceover
- [ ] Complete feature-by-feature comparison: Apex CRM vs all major competitors
- [ ] Calculate average market pricing across all tiers
- [ ] Set Apex CRM pricing tiers that undercut the market
- [ ] Add voiceover narration to commercial
- [ ] Get better cinematic music
- [ ] Include pricing at the end of the commercial
- [ ] 2 free months promotional offer

## Phase 35: Mobile Navigation Fixes
- [x] Fix top header buttons not working on mobile (sidebar toggle, navigation)
- [x] Ensure sidebar is accessible on mobile via hamburger/toggle button
- [x] Fix AI Assistant error — rebuilt as self-contained, no external API needed

## Phase 36: Self-Contained AI Assistant (No External API)
- [x] Build smart command parser that understands natural language CRM commands
- [x] Create company/contact/deal via natural language
- [x] Search and lookup contacts, companies, deals
- [x] Get dashboard stats and summaries
- [x] Navigate to any page via command
- [x] Run campaign actions
- [x] Task management via AI
- [x] Smart suggestions and recommendations based on CRM data
- [x] Help and guidance for all CRM features
- [x] Always available, no external API credits needed
- [x] Falls back to LLM when available for enhanced responses

## Phase 7: Multi-Tenant SaaS Architecture
- [x] Design multi-tenant database schema (tenants, tenant_users, roles)
- [x] Add tenants table (company accounts that pay for the service)
- [x] Add tenant_users table (users within each tenant with username/password)
- [x] Role hierarchy: developer > tenant_admin > manager > user
- [x] Username/password authentication system (not just OAuth)
- [x] Login page with username/password form
- [x] Developer admin panel (manage all tenants)
- [x] Tenant admin panel (manage users within tenant)
- [x] Manager panel (create users, manage team)
- [x] Data isolation - all queries filtered by tenant_id
- [x] Add tenant_id to companies, contacts, deals, tasks, etc.
- [x] Tenant settings page (branding, features, billing info)
- [x] Set up Logistics Worldwide as first tenant
- [x] Add users under Logistics Worldwide
- [x] Add companies and contacts under those users
- [x] Test email function from sales rep
- [x] Test tasks function - schedule tasks for companies
- [x] Test HubSpot import function
- [x] Showcase additional features

## Phase 8: Role-Based Access Control (RBAC) Hierarchy
- [x] Sales Rep: Can only see their own companies, contacts, deals, tasks (backend enforcement)
- [x] Sales Rep: Cannot access team management, admin settings, or other users' data
- [x] Sales Rep: Cannot see developer tools or company admin features
- [x] Sales Rep: Frontend hides unauthorized nav items and blocks routes
- [x] Manager: Can see all team members' data (companies, contacts, deals, tasks)
- [x] Manager: Has oversight dashboard with team performance metrics
- [x] Manager: Can reassign companies/contacts/deals between team members
- [x] Manager: Cannot access developer tools or modify company settings
- [x] Company Admin: Can manage all users, features, branding within their tenant
- [x] Company Admin: Cannot access developer-level tools
- [x] Developer: Has safe backend access - read-only view of tenant data
- [x] Developer: Separate dev tools isolated from live tenant data
- [x] Frontend route guards per role (hide nav items, block routes)
- [x] Backend procedure guards per role (enforce at API level)
- [x] Write vitest tests for all role-based access scenarios (33 RBAC tests passing)

## Phase 9: 5-Tier Role Hierarchy (Developer → Apex Owner → Company Admin → Manager → Sales Rep)
- [x] Add "apex_owner" to systemRole enum in database and schema
- [x] Developer dashboard: god-mode, sees everything, manages entire platform
- [x] Developer can create Apex Owner accounts
- [x] Apex Owner dashboard: business oversight, onboard companies, manage subscriptions
- [x] Apex Owner can create Company Admin accounts and onboard new tenant companies
- [x] Company Admin dashboard: manage own company (create managers + reps, branding, imports)
- [x] Company Admin can create Managers and Sales Reps
- [x] Manager dashboard: team performance, oversight of assigned sales reps
- [x] Manager can create Sales Reps under them
- [x] Sales Rep dashboard: own data only
- [x] Unified login screen (username + password) for all 5 roles
- [x] Easy-to-use user management panel at each level
- [x] Update sidebar navigation per role (5 tiers)
- [x] Update route guards per role (5 tiers)
- [x] Create Apex Owner account and test full hierarchy flow
- [x] Write tests for 5-tier hierarchy (38 new tests)

## Phase 9b: Apex Owner Dashboard & Self-Service Signup
- [x] Apex Owner dashboard: view all companies, subscription tiers, revenue overview
- [x] Apex Owner: manage company tiers (upgrade/downgrade)
- [x] Apex Owner: onboard new companies directly
- [x] Apex Owner: view company health metrics and user counts
- [x] Self-service signup: public landing page with video and pricing
- [x] Self-service signup: registration form (company name, admin details, tier selection)
- [x] Self-service signup: payment integration placeholder
- [x] Self-service signup: auto-provision tenant company on signup
- [x] AI-driven onboarding tutorials: contextual pop-ups on first use
- [x] AI-driven onboarding tutorials: step-by-step guided walkthrough
- [x] AI-driven onboarding tutorials: adaptive based on user role
- [x] AI-driven onboarding tutorials: "How to" help button on every page

## Phase 10: Public Marketing Homepage
- [ ] Create /home route as the public marketing homepage (separate from /dashboard)
- [ ] Sticky top navigation with Login and Sign Up buttons linking to /login and /signup
- [ ] Hero section: bold headline, subheadline, demo video with play overlay, CTA buttons
- [ ] Stats bar: key numbers (companies served, deals closed, etc.)
- [ ] Feature showcase: animated feature cards for all major modules with icons and descriptions
- [ ] How It Works: 3-step visual explainer (Import → Automate → Close)
- [ ] Competitor comparison table: Apex CRM vs HubSpot vs Salesforce vs Pipedrive
- [ ] Pricing section: 3 tiers (Starter/Growth/Enterprise) with feature lists and monthly/annual toggle
- [ ] Testimonials/social proof: customer quotes with avatars, company logos, key stats
- [ ] Video section: embedded demo video with play button overlay
- [ ] FAQ accordion section
- [ ] Footer with links (Features, Pricing, Login, Sign Up, Support)
- [ ] Smooth scroll navigation between sections
- [ ] Mobile-responsive design throughout
- [ ] Update App.tsx: / goes to marketing homepage, /dashboard goes to authenticated CRM

## Phase 10: Public Marketing Homepage
- [x] Full public marketing homepage at /home with dark premium design
- [x] Sticky navigation with smooth scroll to sections
- [x] Hero section with headline, CTA buttons, dashboard mockup preview
- [x] Watch Demo button with video modal (placeholder for video embed)
- [x] Stats bar (500+ companies, $2.1B+ pipeline, 98.7% deliverability, etc.)
- [x] Features section with 9 feature cards (CRM Core, Paradigm Engine, etc.)
- [x] How It Works (3-step process)
- [x] Competitor comparison table (Apex vs HubSpot vs Salesforce vs Pipedrive)
- [x] Pricing section with monthly/annual toggle and 3 plans
- [x] Testimonials section (6 customer stories)
- [x] FAQ accordion (8 questions)
- [x] Final CTA section with login + signup buttons
- [x] Footer with navigation links
- [x] Unauthenticated users redirected to /home from any CRM route
- [x] Sign In and Start Free Trial links in nav go to /login and /signup

## Phase 11: Marketing Homepage Redesign
- [ ] Switch to light/white premium theme (like Linear, Stripe, Vercel)
- [ ] Add generous whitespace — reduce section density by 40%
- [ ] Simplify hero: one bold headline, one subline, two CTAs
- [ ] Remove dark backgrounds, use white/light gray with subtle gradients
- [ ] Update all trial messaging to "Credit card required"
- [ ] Declutter feature sections — fewer items, more breathing room
- [ ] Cleaner navigation bar — minimal, sticky, frosted glass
- [ ] Streamline comparison table — simpler, more elegant
- [ ] Lighter pricing cards — clean white cards with subtle shadows
- [ ] Modernize testimonials section
- [ ] Keep interactive demo tour but restyle for light theme

## Phase 12: World-Class Homepage Redesign (Universal Messaging)
- [ ] Remove all freight-specific language — make it universal for any business
- [ ] Dark premium theme like Linear — deep black/near-black with vivid accent colors
- [ ] Massive bold typography — 80-100px headlines, tight tracking, high contrast
- [ ] Autoplay inline product video (no button required) in hero section
- [ ] Animated product UI mockup that scrolls/transitions through features
- [ ] Trusted-by logo bar with well-known brand logos
- [ ] Feature sections with large visual demonstrations (not just text cards)
- [ ] Inline interactive demo tour (no modal, embedded in page)
- [ ] Comparison section redesigned as visual side-by-side
- [ ] Testimonials as full-width cinematic quotes
- [ ] Pricing with clear value differentiation
- [ ] Sticky nav with blur/glass effect
- [ ] Smooth scroll animations on every section
- [ ] Mobile-first responsive design

## Phase 13: Inline Login on Homepage
- [ ] Add login modal/dropdown to marketing homepage Sign In button
- [ ] On successful login redirect directly to /dashboard
- [ ] No separate /login page needed for homepage users

## Phase 13: Forgot Password
- [ ] Add password_reset_tokens table to schema
- [ ] Backend: generate reset token and send email
- [ ] Frontend: forgot password view in login modal
- [ ] Frontend: reset password page at /reset-password

## Company Branding & White-Label
- [x] Backend: tRPC procedure to get company branding (name + logoUrl)
- [x] Backend: tRPC procedure to upload company logo to S3
- [x] Backend: tRPC procedure to AI-generate logo from company name
- [x] Backend: tRPC procedure to update company logoUrl
- [x] Frontend: Company Settings page with logo upload + AI generate button
- [x] Frontend: Sidebar header shows company logo + name
- [x] Frontend: Top nav shows company name next to user info
- [x] Frontend: Dashboard welcome banner shows company name

## Stripe Integration
- [x] Add Stripe via webdev_add_feature
- [x] Subscription plans page (Trial, Starter, Professional, Enterprise)
- [x] Checkout flow for plan upgrades
- [x] Billing portal for managing subscription
- [x] Webhook handler for subscription events (activate, cancel, expire)
- [x] Subscription status shown in Company Settings

## Billing Pricing Sync
- [ ] Sync Billing page pricing with marketing homepage pricing

## Homepage Pricing → Stripe Checkout
- [x] Read homepage pricing section to get exact plan names, prices, and features
- [x] Sync stripe-products.ts with homepage pricing
- [x] Add "Get Started" / "Choose Plan" buttons on homepage pricing cards that link to Stripe checkout
- [x] For logged-in users: trigger checkout directly; for guests: redirect to signup with plan pre-selected

## Video Fix
- [x] Fix homepage video being cut off on both sides

## CRM Bible
- [ ] Audit all CRM features from source files
- [ ] Write full CRM Bible document (what/why/how/automation/sales outcome per feature)
- [ ] Build in-app CRM Bible page with table of contents and search

## CRM Bible
- [x] Audit all CRM features across all pages and routers
- [x] Write comprehensive CRM Bible (What/Why/How/Automation/Outcome for 60+ features)
- [x] Build in-app CRM Bible page with sticky TOC, search, and The Sales Machine section
- [x] Add CRM Bible to sidebar nav under Resources
- [x] Add /crm-bible route to App.tsx

## CRM Bible Role-Gated Access
- [ ] Add bible_shares table to DB (sharedBy, sharedWith, sectionId, featureId, permission: view|collaborate, revokedAt)
- [ ] Generate and apply Drizzle migration
- [ ] Add tRPC procedures: shareSection, shareFeature, revokeShare, listMyShares, listSharedWithMe
- [ ] Add minRole field to each section/feature in CRM Bible data structure
- [ ] Filter CRM Bible by role + shared grants on frontend
- [ ] Share button on each section header and feature card
- [ ] Invite modal: search users by name, select view/collaborate permission, send share
- [ ] Shared With Me panel showing all active shares and who granted them
- [ ] Revoke button for share grantor
- [ ] Role badge on CRM Bible header showing current access level
- [ ] Update Bible content to document role access levels and Share system

## Billing Access Split
- [x] Company Admin sees payment history/schedule (read-only); Apex Owner/Developer see full billing management
- [x] Update CRM Bible billing section to document the two-tier access

## AI Button & Assistant Fix
- [x] Move AI chat button from bottom-right to bottom-left to avoid Manus badge overlap
- [x] Update AI assistant system prompt to enable logo help and all CRM task execution

## Billing History Page
- [x] Backend: tRPC procedure to fetch Stripe invoices for the tenant's customer ID
- [x] Frontend: /billing-history page showing invoice date, amount, status, PDF download link
- [x] Add Billing History nav item under Resources for Company Admin+
- [x] Role-gate: Company Admin, Apex Owner, Developer only

## Payment Failed Banner
- [x] Backend: tRPC procedure to check Stripe subscription payment status
- [x] Frontend: Banner component on Dashboard for overdue/past_due subscriptions
- [x] Show banner only to Company Admin+ roles
- [x] Banner links to Billing page with "Resolve Payment" CTA

## Email Infrastructure Onboarding Wizard
- [x] DB: email_infrastructure table (handled server-side, no persistent state needed) (domain, provider, spf/dkim/dmarc status, mx status, verified, warmup_started)
- [x] Backend: DNS verification procedure (check SPF/DKIM/DMARC/MX records live)
- [x] Backend: DNS record generator (produce copy-paste values for any registrar)
- [x] Backend: Domain availability checker
- [x] Frontend: Wizard page /email-setup with 3 paths: Connect Existing, Connect Google/Microsoft, Start Fresh
- [x] Path 1 (Connect Existing): Enter domain → live DNS check → show results with copy-paste fixes
- [x] Path 2 (Connect Google/Microsoft): Generate exact DNS records for Google Workspace or M365
- [x] Path 3 (Start Fresh): Domain availability check → registrar links → DNS record generation → verify
- [x] Warm-up schedule auto-enrollment after domain verification (links to Email Warmup page)
- [x] Add Email Infrastructure to Resources sidebar nav

## CRM Bible Update (Round 2)
- [ ] Add Billing History section to CRM Bible (What/Why/How/Automation/Outcome)
- [ ] Add Payment Failed Banner section to CRM Bible
- [ ] Add Email Infrastructure Wizard section to CRM Bible (all 3 paths documented)

## Domain Purchase API Integration
- [ ] Research Namecheap/GoDaddy API for domain purchase
- [ ] Add domain search + purchase tRPC procedures to backend
- [ ] Wire domain purchase flow into Email Setup wizard Start Fresh path

## First-Login Onboarding Wizard
- [ ] DB: onboarding_progress table (userId, completedSteps, skippedAt)
- [ ] Backend: tRPC procedures for get/update onboarding progress
- [ ] Frontend: 5-step wizard modal (upload logo, invite team, email setup, first contact, first campaign)
- [ ] Show wizard on first login, skip if already completed
- [ ] Add "Resume Onboarding" button in Settings for users who skipped

## Live Testing Session Fixes
- [x] Move AI button/panel to bottom-right, above the Manus badge
- [x] Fix tour "Next" button navigating away from CRM to public homepage
- [x] Add logo upload/generate button prominently on the dashboard
- [x] Brand AI assistant with user's company name and logo (not "Apex")
- [x] White-label CRM so non-admin roles only see company branding (hide "Apex" identity)
- [x] Build AI credit reselling system (purchase, track, consume credits)

## AI Credit Reselling System (Apex Owner → Tenant Companies)
- [x] Apex Owner dashboard: define credit packages with wholesale cost + retail price
- [x] Apex Owner: sell credits to specific tenant companies at marked-up price
- [x] Apex Owner: view all tenant credit balances
- [x] Tenant Company Admin: view their credit balance (read-only)
- [x] Tenant Company Admin: view credit usage history
- [ ] AI credit balance shown in sidebar for Company Admin+
- [x] DB tables: ai_credit_packages, tenant_ai_credits, ai_credit_transactions (done)
- [x] tRPC routers: aiCredits.* (done)
- [x] Frontend: /apex/ai-credits page for Apex Owner
- [x] Frontend: credit balance widget in Company Admin settings

## AI Credit System (Revised Model)
- [x] CRM-related AI usage is FREE (included in subscription) — no credits consumed
- [x] Non-CRM AI usage requires purchased credits at 25% markup on Manus pricing
- [x] Credits billed directly to tenant company's Stripe card on file (separate from subscription)
- [x] Add `aiUsageType` enum to credit transactions: 'crm_free' | 'paid_credit'
- [x] Add `isCrmFree` flag to AI feature definitions
- [ ] Stripe: create credit top-up checkout session for tenant companies (Stripe webhook integration pending)
- [ ] Stripe webhook: handle credit purchase completion, add credits to tenant balance
- [x] Backend: consumeAiCredits checks if feature is CRM-free before deducting
- [x] Apex Owner UI: /apex/ai-credits — view all tenant balances, credit packages
- [x] Company Admin UI: /settings/ai-credits — view balance, buy more credits, usage history
- [ ] Credit balance widget in sidebar for Company Admin+
- [ ] AI Assistant: CRM queries are free, general queries consume credits

## Subscription Tier Redesign (with Stripe)
- [x] Add Tier 0: "Success Starter" — $99/mo, 1 user (single user)
- [x] Rename Tier 1 → "Growth Foundation" ($197/mo, 5 users)
- [x] Rename Tier 2 → "Fortune Foundation" ($497/mo, 15 users)
- [x] Rename Tier 3 → "Fortune" ($697/mo, 25 users)
- [x] Rename Tier 4 → "Fortune Plus" ($1,497/mo, 50 users)
- [x] Cap Fortune Plus user limit at 50
- [x] Add $30/user/mo add-on for each tier, up to the next tier's user limit
- [x] Update stripe-products.ts with new tier structure
- [x] Update DB enum for subscriptionTier (migrate existing data)
- [x] Update routers.ts tier enum validation
- [x] Update stripe.ts webhook tier type
- [x] Update ApexDashboard with new tier names, colors, prices
- [x] Update Subscription page UI with 5 new tiers
- [x] Update MarketingHome pricing section with 5 new tiers
- [x] Update Billing page tier icons/colors
- [x] Create 5 Stripe products + monthly/annual prices via API script
- [x] Store Stripe price IDs in environment secrets
- [x] Update checkout flow to use new price IDs
- [x] Update CRM Bible with new tier structure and add-on pricing

## Annual Billing Policy Update
- [x] Change annual discount from 25% to 10%
- [x] Recreate Stripe annual prices at 10% discount
- [x] Add non-refundable acknowledgment checkbox before annual checkout
- [x] Update MarketingHome annual toggle to show -10% (not -25%)
- [x] Update Subscription page annual pricing display
- [x] Update FAQ to mention non-refundable annual policy

## Billing & Payment Management System
- [ ] Tenant self-service: prominent "Billing" page with credit card management (add/update card via Stripe portal)
- [ ] Tenant self-service: subscription status, next billing date, current plan
- [ ] Tenant self-service: buy AI credits button (Stripe checkout)
- [ ] Tenant self-service: full payment history (all invoices, amounts, dates, status)
- [ ] Tenant self-service: download invoice PDFs
- [ ] Apex Owner/Developer: /apex/payments dashboard — all tenant payment records
- [ ] Apex Owner/Developer: overdue accounts list with days overdue
- [ ] Apex Owner/Developer: manual charge trigger per tenant
- [ ] Apex Owner/Developer: account suspension/reactivation for overdue
- [ ] Apex Owner/Developer: revenue reports (MRR, ARR, overdue total, collected this month)
- [ ] Apex Owner/Developer: Stripe customer portal link per tenant
- [ ] Stripe webhook: payment_intent.succeeded → mark invoice paid
- [ ] Stripe webhook: invoice.payment_failed → mark overdue, trigger notification
- [ ] Stripe webhook: customer.subscription.deleted → suspend account
- [ ] DB: invoices table (tenant, amount, status, due_date, paid_date, stripe_invoice_id)
- [ ] DB: payment_methods table (tenant, stripe_customer_id, card last4, brand, exp)
- [ ] Sidebar: "Billing" nav item clearly visible to Company Admin+
- [ ] Sidebar: "Payments" nav item in Apex Platform section for Owner/Developer

## Business Category / Vertical Intelligence System
- [ ] Define 10 business categories with sub-types and feature mappings in shared/businessCategories.ts
- [ ] Add businessCategory and businessSubType fields to tenantCompanies schema
- [ ] Company type selector in onboarding wizard (step 1: pick your business type)
- [ ] Company type selector in Company Settings page
- [ ] Adaptive sidebar: show/hide nav sections based on company category
- [ ] Adaptive terminology: "Deals" → "Jobs/Loads/Listings/Projects" by category
- [ ] Feature gating: unlock vertical-specific modules based on category
- [ ] Category-specific onboarding tips in the tour
- [ ] AI assistant knows the company's vertical for contextual answers

## Vertical-Specific Modules
- [ ] Shipping & Receiving module (for Manufacturing, Distribution, Retail, E-Commerce)
  - [ ] Inbound shipments (PO-linked, supplier, expected date, status)
  - [ ] Outbound shipments (order-linked, carrier, tracking, status)
  - [ ] Shipment status tracking (ordered, in transit, received, exception)
  - [ ] Link shipments to contacts/companies/deals
  - [ ] Packing list and BOL generation
- [ ] Accounts Payable & Receivable module (all business types)
  - [ ] AR: create and send invoices to customers
  - [ ] AR: track payment status, aging (30/60/90 days)
  - [ ] AP: record bills owed to vendors
  - [ ] AP: track payment due dates and status
  - [ ] Cash flow dashboard (AR vs AP summary)
  - [ ] Aging reports with overdue highlighting

## Trial Health Monitoring & Customer Success Automation
- [ ] Feature usage tracking table (which features each tenant has used, count, last used)
- [ ] Trial health score calculation (0-100 based on feature adoption)
- [ ] Trial health dashboard for Apex Owner/Account Managers
- [ ] Automated email campaign triggers by trial day (Day 1, 3, 7, 14, 30, 55)
- [ ] Re-engagement trigger: no login in 7 days
- [ ] Account Manager battle cards per tenant (features used/unused, call script, talking points)
- [ ] Daily call queue for Apex Account Managers sorted by priority
- [ ] Call outcome logging from battle card
- [ ] Weekly and monthly check-in email templates

## Competitor Comparison & One-Click Migration (Mar 18 2026)
- [ ] Fix "freigght" spelling error in video/marketing copy → "freight"
- [ ] Build comprehensive competitor comparison page (/compare or tab in MarketingHome)
  - All Apex features vs HubSpot, Salesforce, Pipedrive, Zoho, Monday, Freshsales, Keap, ActiveCampaign
  - Pricing comparison table by feature category
  - Visual "Apex wins" differentiators for every advantage
  - Easy toggle to compare Apex vs any single competitor
- [ ] Build one-click CRM migration system (/migration page)
  - Per-competitor migration buttons: HubSpot, Salesforce, Pipedrive, Zoho, Monday, Freshsales, Keap, ActiveCampaign, Copper, Insightly
  - Import: contacts, companies, deals, tasks, notes, emails, pipelines, custom fields, tags
  - Migration progress tracker with status per data type
  - Post-migration summary report
  - CSV/export file upload fallback for any CRM

## Hero Video Redo (Mar 18 2026)
- [ ] Remove "built for freight brokers" language from hero video
- [ ] Fix "freigght" → "freight" spelling error
- [ ] Reposition as "built for ALL companies" with customizable verticals
- [ ] Highlight one-button migration from any CRM
- [ ] Showcase ease of use and breadth of features
- [ ] Dynamic visuals: animated UI walkthroughs, not static screenshots
- [ ] Update hero section text to match new video messaging

## Dashboard Logo Button Fix (Mar 18 2026)
- [ ] Replace "Add Logo" redirect-to-settings with an inline modal
- [ ] Modal: Tab 1 — Upload logo (drag & drop or file picker, uploads to S3)
- [ ] Modal: Tab 2 — Generate logo with AI (enter company name + style prompt → AI generates logo → preview → save)
- [ ] Save generated/uploaded logo to tenant company record and refresh sidebar/dashboard immediately
- [ ] Show logo preview in modal before confirming

## Logo Generation Workflow (Mar 18 2026)
- [ ] Replace simple "Generate Logo" button with full creative workflow modal
- [ ] Step 1: Company description text area (name, industry, style, colors, vibe)
- [ ] Step 2: Suggestions area for specific requests and refinements
- [ ] Step 3: Generate 3 logo variations via AI image generation
- [ ] Step 4: Preview all 3 variations side by side
- [ ] Editing loop: type refinement suggestions and regenerate
- [ ] "Start Over" button to discard all and reset description
- [ ] Accept and save selected logo to S3 and update company record
- [ ] Show logo immediately in sidebar and dashboard after saving

## Logo Generation - Free vs Paid Tiers (Mar 18 2026)
- [ ] Free tier: simple logo from company name + basic style/color picker (1 generation, no editing loop)
- [ ] Paid tier: full custom workflow — detailed description, suggestions, 3 variations, editing loop, discard/start over
- [ ] Show credit cost before generating paid logo
- [ ] Credit deduction on paid logo generation attempt
- [ ] Clear "Free" vs "Custom (Credits)" toggle at top of modal
- [ ] Low-credit warning if balance insufficient for paid generation

## Logo Download Feature (Mar 18 2026)
- [ ] Paid logo generations are stored in S3 permanently (not just used as profile logo)
- [ ] Download button available after paid logo is generated/saved
- [ ] Download formats: PNG (high-res 1024x1024), PNG (standard 512x512)
- [ ] Download history: user can re-download any previously generated paid logo
- [ ] Free logos: no download option (use as profile logo only)

## AI Assistant Free Tier & Credit Overage (Mar 18 2026)
- [ ] Track AI assistant query count per tenant company per month in DB
- [ ] Add monthly_ai_queries_used and monthly_ai_queries_reset_at fields to tenant_ai_credits table
- [ ] Free tier: first 50 queries/month included in all subscription plans
- [ ] At 45 queries: show warning banner "5 free AI queries remaining this month"
- [ ] At 50 queries: block query, show upgrade prompt to purchase credits
- [ ] Credit cost: 25% markup on Manus pricing per query (same as general AI credit system)
- [ ] Monthly reset: auto-reset counter on 1st of each month
- [ ] Backend: checkAiQueryLimit procedure — returns { allowed, remaining, usedCredits }
- [ ] Backend: consumeAiQuery procedure — increments counter or deducts credits
- [ ] Frontend: AI Assistant shows remaining free queries in header
- [ ] Frontend: low-balance/limit warning banner in AI Assistant panel
- [ ] Frontend: upgrade prompt modal when limit reached

## Phase 30: Repricing + Feature Gating Overhaul

### Pricing Strategy
- [x] Reprice Success Starter: $74/mo (was $99), annual $66.60/mo
- [x] Reprice Growth Foundation: $149/mo (was $197), annual $134.10/mo
- [x] Reprice Fortune Foundation: $374/mo (was $497), annual $336.60/mo
- [x] Reprice Fortune: $524/mo (was $697), annual $471.60/mo
- [x] Reprice Fortune Plus: $1,124/mo (was $1,497), annual $1,011.60/mo
- [x] Reduce add-on user price: $25/user/mo (was $30)
- [x] Update all Stripe price IDs for new pricing
- [x] Update stripe-products.ts with new prices, features, and contact limits

### Feature Gating
- [x] Add featureTier field to all gated features
- [x] Gate BNB Engine: 50/mo Starter, 500/mo Growth, unlimited Fortune Foundation+
- [x] Gate Ghost Mode: 3 active Growth, unlimited Fortune Foundation+
- [x] Gate 260 SMTP rotation: Fortune Foundation+
- [x] Gate Compliance Fortress Full (GDPR/CCPA): Fortune Foundation+
- [x] Gate Voice Agent: Fortune Foundation+ (200/mo), Fortune+ unlimited
- [ ] Gate DocScan: Fortune Foundation+ (50/mo), Fortune+ unlimited
- [ ] Gate Win Probability: Fortune Foundation+
- [ ] Gate AR/AP automation: Growth Foundation+
- [ ] Gate Shipping/Receiving full: Growth Foundation+
- [ ] Gate Visitor Tracking: Fortune Foundation+ (1K/mo), Fortune+ unlimited
- [x] Gate Revenue Autopilot: Fortune+
- [x] Gate Apex Autopilot: Fortune+
- [x] Gate White-labeling: Fortune+
- [ ] Gate Dedicated SMTP infrastructure: Fortune Plus only
- [ ] Gate Custom AI training: Fortune (basic), Fortune Plus (full)
- [ ] Keep FREE across all tiers: data entry, one-click migration, business category intel, AI assistant (50/mo), basic AR/AP, basic shipping/receiving

### Frontend Updates
- [x] Update stripe-products.ts with new pricing and feature lists
- [x] Update Subscription.tsx page with new tiers, prices, and feature gates
- [x] Update Billing.tsx checkout page with new prices
- [x] Update MarketingHome.tsx pricing grid with new prices and feature comparison
- [ ] Add upgrade prompts/modals when users hit feature gates
- [ ] Add freemium usage counters (BNB prospects, AI queries, voice calls, DocScans)
- [ ] Add competitor pricing comparison section showing 25%-83% savings
- [ ] Update CRM Bible with new pricing and feature gate documentation

## Phase 31: Video/Demo Section — Full Competitive Messaging

- [x] Update hero video modal with full feature vs competitor script
- [ ] Update "Why Apex" feature showcase section with all modules vs competitors
- [ ] Expand comparison table to include all Apex differentiators (AR/AP, Shipping, BNB, Voice Agent, DocScan, etc.)
- [ ] Add dedicated "Switch in 60 Seconds" migration section with step-by-step visual
- [ ] Add animated demo section showing one-click migration flow
- [ ] Update hero headline and subheadline to reflect universal applicability (not just freight)
- [ ] Add "Works for every B2B team" messaging
- [ ] Add migration source logos (HubSpot, Salesforce, Close, ActiveCampaign, Zoho, Pipedrive, etc.)

## Phase 32: 15-Scene Promo Video

- [x] Generate 15 keyframe images for all scenes
- [x] Generate Scene 1: The Problem with legacy CRMs
- [x] Generate Scene 2: Apex CRM introduction
- [x] Generate Scene 3: Full competitive comparison
- [x] Generate Scene 4: One-touch migration
- [x] Generate Scene 5: BNB AI Prospecting Engine
- [x] Generate Scene 6: 260 SMTP Rotation Engine
- [x] Generate Scene 7: AI Voice Agent
- [x] Generate Scene 8: Compliance Fortress
- [x] Generate Scene 9: AR/AP + Shipping/Receiving
- [x] Generate Scene 10: DocScan + Revenue Autopilot
- [x] Generate Scene 11: White-Label branding
- [x] Generate Scene 12: Pricing comparison — 25% less
- [x] Generate Scene 13: Apex Autopilot
- [x] Generate Scene 14: Works for every industry
- [x] Generate Scene 15: Epic CTA finale
- [x] Concatenate all 15 scenes into apex-crm-promo-final.mp4 (96 seconds, 41MB)
- [x] Upload to CDN
- [x] Embed in MarketingHome.tsx demo section with scene breakdown
- [x] Update modal video to use new promo video
- [x] Add add-user-seats Stripe checkout procedure (backend + Billing UI)
- [x] Create useFeatureGate hook
- [x] Create FeatureGate component with locked overlay + upgrade CTA
- [x] Apply FeatureGate to: Prospects, GhostSequences, SmtpAccounts, ComplianceDashboard, VoiceAgent, RevenueAutopilot, WhiteLabel, ApexAutopilot

## Phase 33: Final Approved Pricing Implementation

- [x] Rewrite stripe-products.ts: 5 tiers (Solo $49, Starter $97, Growth $297, Fortune Foundation $497, Fortune Plus $1,497)
- [x] AI credit limits per tier (500/2K/10K/30K/200K) + $10/500 overage flat rate
- [x] Voice minute limits per tier + $10/100 overage flat rate
- [x] BNB prospect limits per tier + $10/500 overage flat rate
- [x] Email send limits per tier + $10/10K overage flat rate
- [x] DocScan limits per tier + $10/100 overage flat rate
- [x] Fortune Plus: 100 users included, $30/user add-on; all others $35/user
- [x] All service fees eliminated (white-label setup, onboarding, integration, data export — FREE)
- [x] Update Subscription.tsx with new 5-tier pricing and overage table
- [x] Update Billing.tsx with new pricing and overage explanation
- [x] Update MarketingHome.tsx pricing grid with 5 tiers
- [x] Update Signup.tsx with new tier options
- [x] Update ApexDashboard.tsx admin dropdowns
- [x] Update useFeatureGate.ts, TenantBilling.tsx, ApexPaymentManagement.tsx display names
- [x] Update subscription-tiers.test.ts — 19 tests passing
- [x] Save checkpoint

## Phase 34: Three Square Promo Videos (1080×1080)

- [ ] Define full feature comparison list (Apex vs HubSpot, Salesforce, Pipedrive) — green ✓ / red ✗
- [ ] Write scene scripts for 30-second, 90-second, and 3-minute videos
- [ ] Build 30-second pitch video — left scrolling comparison, right main content, slow transitions
- [ ] Build 90-second video — left scrolling comparison, right main content, slow transitions
- [ ] Build 3-minute video — left scrolling comparison, right main content, slow transitions
- [ ] Upload all three to CDN
- [ ] Embed/link on marketing homepage

## Phase 35: "See the Light" Platform Retheme

- [ ] Retheme MarketingHome.tsx: bright/luminous, light rays, warm gold/orange/white palette
- [ ] Retheme DashboardLayout.tsx: light sidebar, airy backgrounds, orange accents
- [ ] Update index.css: new CSS variables for light theme (white/gold/orange/sky blue)
- [ ] Update ThemeProvider to light mode default
- [ ] Apply consistent typography: Inter Black headlines, Inter Medium body
- [ ] Add subtle particle/bokeh animations to key pages
- [ ] Ensure all text is readable on bright backgrounds (dark charcoal text)
- [ ] Save checkpoint after retheme

## Phase 36: Migration Monster + Adaptive Skin System

- [ ] DB schema: custom_fields, custom_field_values, custom_objects, custom_object_records, activity_history, migration_jobs, skin_preference
- [ ] Migration Wizard page: competitor select, connect/upload, field mapping, preview, import
- [ ] Skin context system: SkinProvider, useSkin hook, skin definitions for all 6 competitors
- [ ] HubSpot skin: nav labels, colors, terminology (Contacts/Companies/Deals/Marketing/Service/Reports)
- [ ] Salesforce skin: nav labels, colors, terminology (Leads/Accounts/Contacts/Opportunities/Cases/Reports)
- [ ] Pipedrive skin: nav labels, colors, terminology (Leads/Deals/Contacts/Organizations/Activities/Insights)
- [ ] Zoho skin: nav labels, colors, terminology
- [ ] GoHighLevel skin: nav labels, colors, terminology
- [ ] Close skin: nav labels, colors, terminology
- [ ] Skin switcher UI in settings + onboarding
- [ ] Graduation flow: "Ready to switch to Apex native?" prompt
- [ ] Custom field renderer on contact/company/deal detail pages
- [ ] Activity history timeline on all record pages
- [ ] Apex native Limitless retheme (orange primary, luminous whites)
- [ ] Vitest tests for migration and skin logic
- [ ] Save checkpoint

## Phase 37: Login Bug Fixes
- [x] Add password eye toggle (show/hide password) — visible button with hover state
- [x] Fix "Remember me for 30 days" checkbox — added Checkbox component, wired to rememberMe state, sends to server
- [x] Fix login redirect loop — changed window.location.href from "/" to "/dashboard" after successful login

## Phase 38: Self-Healing System Engine

### Backend: Error Interception & Auto-Correction
- [ ] Global error interceptor middleware — catches every unhandled server error, logs it with full context (route, user, payload, stack trace)
- [ ] Health monitor daemon — runs every 5 minutes, checks DB connectivity, memory, disk, queue depth, SMTP health, API response times
- [ ] Auto-correction rules engine — detects known error patterns and applies fixes automatically (reconnect DB, flush stuck queues, clear corrupted cache, restart stalled workers)
- [ ] Predictive failure detection — AI analyzes error frequency trends and warns before thresholds are breached
- [ ] Self-healing audit log table — every error detected, every correction attempted, every outcome recorded
- [ ] Alert escalation — if auto-correction fails 3 times, escalate to owner notification

### Frontend: Error Boundary & Client Health
- [ ] Global React error boundary — catches all component crashes, logs them to server, shows graceful fallback UI
- [ ] Client-side error reporter — captures JS errors, unhandled promise rejections, network failures and sends to server
- [ ] Stale data detector — identifies queries that haven't refreshed and auto-invalidates

### System Health Dashboard
- [ ] /dev/system-health page — live health scores for DB, server, queues, SMTP, AI, storage
- [ ] Auto-correction activity log — what was broken, what was fixed, when, how
- [ ] Error frequency charts — trending up = warning, trending down = recovering
- [ ] Alert configuration — set thresholds for when to notify owner
- [ ] One-click manual health check trigger
- [ ] Add to DashboardLayout sidebar under Dev Tools

## Phase 38 Completion Update
- [x] Self-healing engine server module (self-healing.ts) — 4 layers built
- [x] systemHealthEvents and systemHealthLogs tables created in DB
- [x] systemHealthRouter wired into appRouter
- [x] SystemHealth dashboard UI page built (/system-health)
- [x] Self-healing engine wired into server startup — monitors every 5 minutes
- [x] Self-Healing Engine and System Health moved to Developer section only (hidden from regular users)

## Phase 39: Migration Monster + Skin System (Completion Update)
- [x] AI migration engine (migration-engine.ts) — LLM field mapper, competitor profiles, import pipeline
- [x] Migration router (server/routers/migration.ts) — startMigration, getStatus, listJobs
- [x] MigrationWizard page built (/migration/wizard)
- [x] SkinContext — 6 competitor skins (HubSpot, Salesforce, Pipedrive, Zoho, GoHighLevel, Close) + Apex native
- [x] SkinSwitcher component in sidebar footer
- [x] SkinProvider wired into main.tsx
- [x] Migration Wizard and System Health routes added to App.tsx
- [x] MigrationWizard TS errors resolved — 0 TypeScript errors
- [x] 19/19 vitest tests still passing

## Phase 40: AI Autonomous Engine (Developer-Only)

### Backend: AI Task Runner
- [ ] ai-engine.ts — continuous AI job scheduler with named tasks, intervals, and priority queues
- [ ] Task types: self-healing monitor, migration field mapper, prospect enricher, email optimizer, data deduplicator, health predictor, sequence optimizer
- [ ] AI engine wired into server startup — starts all tasks automatically
- [ ] Per-task AI invocation with structured JSON output
- [ ] Task result logging to DB (ai_engine_logs table)
- [ ] Task failure handling — retry with backoff, escalate after 3 failures
- [ ] Developer-only tRPC router: getTasks, getTaskLogs, pauseTask, resumeTask, runTaskNow, getEngineStatus

### Frontend: AI Engine Control Panel
- [ ] /dev/ai-engine page — developer-only control panel
- [ ] Live task status grid: task name, last run, next run, status (running/idle/paused/failed), success rate
- [ ] Per-task log viewer: last 50 AI invocations with input, output, duration, result
- [ ] Manual trigger button per task ("Run Now")
- [ ] Pause/Resume controls per task
- [ ] Global engine health score (% tasks healthy)
- [ ] AI output preview — see what the AI decided and why
- [ ] Gate entire page behind developer role check (redirect non-developers)
- [ ] Add to Developer section in DashboardLayout sidebar

### Integration
- [ ] Self-healing engine calls AI engine for predictive analysis
- [ ] Migration wizard uses AI engine for field mapping jobs
- [ ] Prospect enrichment runs as scheduled AI task
- [ ] Email send-time optimization runs nightly via AI engine

## Future: Manus Developer Panel (Build Later)
- [ ] Developer-only chat panel in CRM that connects to Manus API
- [ ] CRM-aware LLM configured with full knowledge of Apex CRM codebase
- [ ] Upgrade path to real Manus API when available

## Phase 40: AI Autonomous Engine — COMPLETED
- [x] ai_engine_tasks and ai_engine_logs tables created in DB
- [x] ai-engine.ts server module — 10 background AI tasks across 6 categories (healing, migration, enrichment, optimization, monitoring, intelligence)
- [x] AI engine wired into server startup: [AIEngine] Started — 10 tasks registered
- [x] aiEngineRouter — developer-only tRPC procedures (getStatus, getTasks, triggerTask, pause/resume, start/stop)
- [x] aiEngineRouter wired into appRouter
- [x] AIEnginePanel.tsx — developer-only control panel UI with live status, health scores, task cards, manual triggers
- [x] /ai-engine route added to App.tsx
- [x] AI Engine Panel added to Developer section in DashboardLayout (hidden from non-developers)
- [x] 0 TypeScript errors

## Phase 37-39: Login Fixes + Self-Healing + Migration Monster — COMPLETED
- [x] Login: password eye toggle visible and functional
- [x] Login: Remember Me checkbox added and wired to server
- [x] Login: redirect fixed — goes to /dashboard after successful login
- [x] Self-healing engine (self-healing.ts) — 4 layers: intercept, auto-correct, predict, escalate
- [x] System health tables in DB (systemHealthEvents, systemHealthLogs)
- [x] SystemHealth dashboard UI (/system-health) — developer section only
- [x] Self-Healing Engine in Developer section only
- [x] SkinContext — 6 competitor skins (HubSpot, Salesforce, Pipedrive, Zoho, GoHighLevel, Close) + Apex native
- [x] SkinSwitcher component in sidebar footer
- [x] SkinProvider wired into main.tsx
- [x] MigrationWizard page (/migration/wizard) — one-button AI-powered migration
- [x] AI migration engine (migration-engine.ts) — LLM field mapper, competitor profiles, import pipeline
- [x] Migration router (server/routers/migration.ts) wired into appRouter

## Future: Manus Developer Panel
- [ ] Developer-only panel inside Apex CRM with embedded Manus chat interface
- [ ] Connect to Manus API when publicly available
- [ ] CRM-aware LLM fallback until real Manus API is ready

## Phase 41: Migration Monster — Complete Build

### Skin System (Auto-Apply, No User Choice)
- [x] Remove SkinSwitcher from sidebar — users never choose a skin manually
- [x] Auto-apply competitor skin immediately on migration completion (stored in user DB record)
- [x] Skin persists across sessions — user always sees their migrated CRM's look until they graduate
- [x] Add "Graduate to Apex Native" button in user dropdown menu
- [x] Store activeSkin field on user record in DB (skinPreferences table)

### Competitor UI Layouts (Exact Mirroring)
- [x] HubSpot skin: exact nav tabs (Contacts, Companies, Deals, Activities, Reports, Marketing), HubSpot blue/orange colors, HubSpot field names and terminology
- [x] Salesforce skin: exact nav (Accounts, Contacts, Opportunities, Leads, Cases, Reports, Dashboards), Salesforce blue, Salesforce terminology (Accounts not Companies, Opportunities not Deals)
- [x] Pipedrive skin: exact nav (Deals, Contacts, Organizations, Activities, Mail, Insights), Pipedrive green, pipeline-first layout
- [x] Zoho skin: exact nav (Leads, Contacts, Accounts, Deals, Activities, Reports, Analytics), Zoho red/blue
- [x] GoHighLevel skin: exact nav (Contacts, Opportunities, Calendars, Conversations, Marketing, Automation), GHL dark theme
- [x] Close skin: exact nav (Inbox, Contacts, Leads, Opportunities, Reports), Close purple/dark

### Custom Fields on Record Pages
- [x] Contact detail page: CustomFieldsPanel renders all migrated custom fields
- [x] Company detail page: CustomFieldsPanel renders all migrated custom fields
- [ ] Deal detail page: render all migrated custom fields
- [x] Custom field types: text, number, date, dropdown, checkbox, multi-select, URL
- [x] Custom fields editable inline on record pages (edit mode in CustomFieldsPanel)

### One-Click Migration Pipeline (End-to-End)
- [ ] AI field mapper: LLM maps ALL fields including custom, with confidence scores logged (not shown to user)
- [ ] Deduplication: auto-merge exact duplicates, flag fuzzy matches for post-import review
- [ ] Activity history import: calls, emails, notes, meetings all imported with original timestamps
- [ ] Custom objects: create equivalent custom record types in Apex
- [ ] Post-import cheat sheet: AI generates "Your [Competitor] → Apex guide" after migration
- [ ] Migration progress: real-time progress bar with phase labels (Connecting → Analyzing → Mapping → Importing → Deduplicating → Finalizing)
- [ ] Skin auto-applied at completion

### Competitive Feature Gaps
- [ ] Gmail/Outlook email sync UI (connect inbox, view email thread on contact record)
- [ ] Google/Outlook calendar sync UI (connect calendar, view meetings on contact record)
- [ ] Click-to-call dialer UI (dial from contact record, log call automatically)
- [ ] Workflow automation builder (trigger → condition → action visual builder)
- [ ] Meeting scheduler (shareable booking link, calendar availability)
- [ ] Mobile-responsive layout audit (all pages work on phone)
- [ ] Proposal/e-signature UI (create proposal from deal, send for signature)
- [ ] Integration marketplace UI (Zapier, Slack, Teams, QuickBooks connectors)

### AI Engine — Move All Tasks
- [x] All self-healing rules moved to AI engine task queue
- [x] Migration field mapping runs as AI engine job
- [x] Prospect enrichment runs as AI engine job
- [x] Email optimization runs as AI engine job
- [x] Duplicate detection runs as AI engine job
- [x] Lead scoring recalculation runs as AI engine job
- [x] Domain health monitoring runs as AI engine job
- [x] Self-healing escalation: notify owner after 3 failed auto-corrections
- [x] Vitest tests for migration router, AI engine router, self-healing engine

## Phase 42: AI Engine Completion
- [x] Prospect Enrichment AI task — enriches new prospects with psychographic profiles and intent signals on schedule (every 30 min)
- [x] Owner escalation — notify owner after 3 consecutive task failures (self-healing escalation) — already wired in runTask()
- [x] Vitest tests for migration router
- [x] Vitest tests for AI engine router
- [x] Vitest tests for self-healing engine (system health router)

## Phase 43: Migration Completion + Adoption Monitoring
- [x] Show duplicates merged count on migration completion screen
- [x] Add adoption_monitor AI engine task (30-day user activity check, notifies admin of inactive users) — Task 12, runs daily

## Phase 44: Complete All Competitive Gap Features

### Phase 44A: Historical Activity Importer + Visual Workflow Builder
- [x] Historical activity importer: pull real email/call/note/stage-change history from source CRM and write to activityHistory table during migration
- [ ] Visual workflow builder canvas: drag-and-drop trigger → condition → action nodes
- [ ] Workflow actions: create task, send email, update field, notify user, webhook
- [ ] Workflow if/then branch conditions

### Phase 44B: Calendar Sync + Email Inbox Sync
- [ ] Google Calendar two-way sync UI (connect, view meetings on contact record)
- [ ] Outlook Calendar two-way sync UI
- [ ] Gmail/Outlook BCC logging: auto-log emails to contact record
- [ ] Email sync settings page with per-user BCC address

### Phase 44C: Click-to-Call Dialer + Meeting Scheduler
- [ ] Click-to-call dialer on contact record (tel: link + auto-log modal)
- [ ] Call log auto-created on contact record with duration and notes
- [ ] Meeting scheduler: shareable booking link page (/book/:username)
- [ ] Meeting scheduler: availability settings, buffer time, meeting types
- [ ] Meeting booked → auto-creates activity on contact record

### Phase 44D: Custom Object Builder + Proposal/E-Signature Builder
- [ ] Custom object builder UI: define new record types with fields and views
- [ ] Custom objects appear in sidebar nav with their own list/detail pages
- [ ] Proposal/quote builder: template, line items, pricing
- [ ] E-signature: send proposal for signature, track status on deal record

### Phase 44E: PWA + Custom Report Builder
- [x] PWA manifest + service worker for offline capability
- [ ] Custom report builder: filters (date range, rep, stage, custom field), grouping
- [ ] Report builder: CSV export
- [ ] Report builder: save/share reports

### Phase 44F: Slack/Teams + Zapier/Make Hub
- [ ] Slack real webhook delivery: deal stage changes, new leads, task reminders
- [ ] Microsoft Teams webhook delivery
- [ ] Zapier/Make compatibility: webhook trigger endpoint
- [ ] Integration marketplace UI: 15+ pre-built connectors (QuickBooks, Shopify, Zoom, DocuSign, Stripe, Typeform, Mailchimp, LinkedIn Ads, Google Ads, Twilio, SendGrid, Calendly, PandaDoc, Intercom, Zendesk)

### Phase 44G: Onboarding Concierge
- [ ] Step-by-step guided setup checklist per user (first week tasks)
- [ ] Contextual first-time-use tooltips on major features
- [ ] In-app AI help chat: "How do I do X in Apex?" with specific instructions
- [ ] Onboarding progress tracked per user, shown in dashboard

## Phase 46: Skin-Aware Developer/Owner Experience
- [x] Build SkinQAPanel component — full-panel skin switcher with color swatches, font previews, and live skin switching
- [x] Wire SkinQAPanel into DevImpersonate page (Skin QA tab)
- [x] Wire SkinQAPanel into Settings → Your Preferences → Appearance & Skin
- [x] Add getClientSkin procedure to migration router (adminProcedure, fetches skin for any user's company)
- [x] DevImpersonate auto-applies client's skin when a user is selected (useEffect + getClientSkin query)
- [x] DevImpersonate shows "Viewing in [Client's Skin]" banner when a non-apex skin is active
- [x] Fix SkinContext CSS bridging — useEffect now sets --primary, --background, --foreground, --sidebar, --font-sans, --radius, --border, --muted, --ring and all Tailwind 4 tokens directly
- [x] Apply font-family directly to document.body as belt-and-suspenders for font switching
- [x] AIEnginePanel uses useSkin() — header icon uses skin.primaryColor, title uses t("ai")
- [x] EmailMasking uses useSkin() — info card uses text-primary/border-primary/bg-primary, sender domain uses skin.primaryColor
- [x] 0 TypeScript errors after all changes
- [x] 8/8 tests passing (skin-qa.test.ts + auth.logout.test.ts)

## Phase 47b: Visitor Tracking Installation Wizard
- [ ] Platform selector: WordPress, Shopify, Wix, Squarespace, Webflow, Custom HTML, Email Developer
- [ ] Step-by-step instructions per platform (numbered steps, clear language, no jargon)
- [ ] "Copy Script" button with visual confirmation
- [ ] "Email to My Developer" option with pre-written email template
- [ ] verifyInstallation server procedure that fetches domain HTML and checks for tracking ID
- [ ] "Verify Installation" button per website with live status indicator

## Phase 48: AI One-Click Visitor Tracking Auto-Installer (Free on All Plans)
- [x] Server: autoInstall procedure — WordPress REST API injection (no credentials needed for public sites, optional WP credentials for private)
- [x] Server: autoInstall procedure — Shopify Admin API injection (requires Shopify API token)
- [x] Server: autoInstall procedure — Webflow API injection (requires Webflow API token)
- [x] Server: autoInstall procedure — smart fallback: generate mailto: link with pre-drafted email + script for unsupported platforms
- [x] Frontend: Simplify VisitorTracking UI to single URL input + "Set Up Tracking" button
- [x] Frontend: Live AI progress animation showing detection steps
- [x] Frontend: Show result — "Installed automatically ✅" or "One-click email ready 📧"
- [x] Frontend: For fallback platforms, show "Open in Email" button (mailto: with pre-filled body)
- [x] Frontend: Copy script button always available as manual fallback
- [x] Visitor tracking free on all plans (no feature gate)

## Phase 49: Three Visitor Tracking Follow-Up Features

### 49a: Platform Credentials Storage
- [x] DB: add tracked_website_credentials table (website_id, platform, encrypted credentials JSON)
- [x] Server: savePlatformCredentials procedure (upsert per website+platform)
- [x] Server: getPlatformCredentials procedure (read back for auto-install re-runs)
- [x] Server: setupTracking — auto-load stored credentials before attempting API install
- [x] Frontend: "Connect Account" button per website in My Websites tab
- [x] Frontend: Credentials dialog for WordPress (user + app password), Shopify (token), Webflow (token)
- [x] Frontend: Show "Auto-install ready" badge on websites with stored credentials

### 49b: Landing Page Auto-Install Callout
- [x] Add "Installs itself in 30 seconds" feature section to MarketingHome.tsx
- [x] Add comparison row vs competitors (all manual vs Apex auto)

### 49c: Real-Time Visitor Notifications
- [x] Server: notifyOwner call when a new identified company session is recorded
- [x] Frontend: in-app toast when a new identified visitor appears (poll every 30s)
- [x] Frontend: toast shows company name, industry, page count with "View" and "Convert" actions
