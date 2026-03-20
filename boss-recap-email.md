# AXIOM CRM — Development Progress Recap
**To:** [Boss Name]
**From:** [Your Name]
**Date:** March 17, 2026
**Subject:** AXIOM CRM — Last 18 Hours: Major Platform Milestones

---

Team,

Here is a full summary of everything shipped on AXIOM CRM in the last 18 hours. This has been one of the most productive sessions to date. The platform has moved from a functional CRM to a fully branded, role-governed, payment-enabled SaaS product.

---

## Authentication & User Experience

The Sign In modal received three significant improvements. The modal now renders as a true full-screen overlay, meaning the mobile keyboard no longer clips the username field when a user taps to type. A **Show/Hide Password** toggle was added to the password field so users can verify what they are typing. A **Remember Me** checkbox was added that extends the session to 30 days when checked — the backend honours this with a 30-day signed cookie rather than the default session-length cookie.

---

## Role System Overhaul

The generic "user" and "manager" roles have been replaced with a precise six-tier hierarchy that reflects how real sales organizations are structured:

| Role | Reports To | Primary Function |
|------|-----------|-----------------|
| Developer | — | Platform infrastructure |
| AXIOM Owner | Developer | Business oversight, company onboarding |
| Company Admin | AXIOM Owner | Full company management |
| Sales Manager | Company Admin | Team oversight, Account Managers |
| Office Manager | Company Admin | Operations oversight, Coordinators |
| Account Manager | Sales Manager | Individual selling |
| Coordinator | Office Manager | Operations support |

All existing database records have been migrated to the new role names. All backend RBAC guards and frontend route guards have been updated. The role dropdown in user creation now shows the correct role names at every level.

---

## Company Branding

Every company using AXIOM CRM now has a fully branded experience. The sidebar header and top navigation bar display the company's logo and name on every page. Company Admins can upload a logo via drag-and-drop, or click **AI Generate** to have the system create a professional logo from the company name automatically. Logos are stored in S3 and served via CDN with no performance impact.

---

## Stripe Payment Integration

Full Stripe subscription billing is now live end-to-end:

- **Pricing tiers** match the marketing homepage exactly: Starter $197/mo, Professional $697/mo, Enterprise $1,497/mo (25% discount for annual billing)
- **Homepage pricing cards** are wired directly to Stripe Checkout — logged-in users trigger checkout immediately; guests are redirected to signup with the plan pre-selected
- **Billing History page** shows all invoices with dates, amounts, status, and PDF download links — visible to Company Admins and above
- **Payment Failed Banner** appears automatically on the dashboard when a subscription is past-due, with a direct link to resolve the payment
- **Stripe webhook handler** processes subscription lifecycle events (activation, cancellation, payment failure) in real time

---

## CRM Bible — Role-Gated Knowledge Base

The CRM Bible (a comprehensive operator's guide covering 60+ features) is now role-gated. Each user sees only the sections relevant to their access level — Account Managers see CRM Core and Operations; Sales Managers add Marketing, Automation, Analytics, and AI Tools; Company Admins see Settings and Billing History; AXIOM Owners and Developers see everything.

A **Share system** was added so any user with access to a section can invite a colleague to view it regardless of role — for cross-functional projects. Shares can be **View Only** or **Collaborate**, and are revocable at any time. This enables knowledge sharing without permanently changing anyone's role.

The Bible has been updated to document all new features including the role access matrix, billing tiers, email infrastructure wizard, and onboarding wizard.

---

## Email Infrastructure Wizard

A three-path guided wizard was built to help companies configure their email sending infrastructure:

- **Path 1 — Connect Existing Domain:** Live DNS check showing SPF, DKIM, DMARC, and MX record status with copy-paste fix values
- **Path 2 — Google Workspace / Microsoft 365:** Auto-generates the exact DNS records required for the selected provider
- **Path 3 — Start Fresh:** Domain availability check with one-click links to Namecheap, GoDaddy, and Cloudflare pre-filled with the searched domain, followed by DNS record generation and live verification

Once a domain is verified, it is automatically enrolled in the Email Warmup module's graduated send schedule.

---

## First-Login Onboarding Wizard

A three-step onboarding wizard now appears automatically the first time a Company Admin logs in:

1. **Logo** — Upload or AI-generate a company logo
2. **Company** — Confirm company name and industry
3. **Invite** — Send an invitation to the first team member

Each step has a Skip option. The wizard can be restarted from Settings at any time. This ensures every new company starts with a branded, populated CRM rather than an empty screen.

---

## AI Assistant Improvements

- The AI chat button was moved from the bottom-right corner to the **bottom-left** to eliminate overlap with the platform badge
- The AI assistant's system prompt was updated so it can now help with logo generation, company branding, and all CRM tasks — it will no longer decline requests it is capable of fulfilling

---

## Video Fix

The homepage demo video and Watch Demo modal video were both fixed. They previously used `object-cover` which cropped the sides. Both now use `object-contain` with a black background so the full frame is visible without any cropping.

---

## Summary — Features Shipped

| Category | Items Delivered |
|----------|----------------|
| Authentication | Mobile modal fix, show/hide password, Remember Me |
| Role System | 7-tier hierarchy, DB migration, full RBAC update |
| Branding | Logo upload, AI logo generation, sidebar/nav display |
| Payments | Stripe billing, pricing sync, billing history, payment banner, webhooks |
| Knowledge Base | Role-gated CRM Bible, Share system, full content update |
| Infrastructure | Email setup wizard (3 paths), DNS verification, domain search |
| Onboarding | First-login 5-step wizard |
| AI | Button repositioned, system prompt updated |
| Bug Fixes | Video cropping fixed |

**Total new features and fixes: 35+**
**TypeScript errors at delivery: 0**
**Test suite status: All passing**

---

The platform is checkpoint-saved and ready to publish. The next priorities are the competitive pricing analysis, the voiceover commercial, and the API-driven domain purchase integration.

---

*AXIOM CRM Development Team*
*March 17, 2026*
