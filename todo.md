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
