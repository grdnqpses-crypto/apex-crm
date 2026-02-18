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
