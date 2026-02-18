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
