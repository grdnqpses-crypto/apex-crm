# Apex CRM — Pricing & Feature Gate Audit Report
**Date:** March 18, 2026 | **Status: FULLY IMPLEMENTED**

---

## Pricing Summary — All 5 Tiers

| Tier | Monthly | Annual/mo | Annual Total | Users Included | Add-On Users | Contacts | Competitor Savings |
|---|---|---|---|---|---|---|---|
| **Success Starter** | $74 | $66.60 | $799.20/yr | 1 | +4 @ $25/user/mo | 5,000 | 26% less than HubSpot |
| **Growth Foundation** | $149 | $134.10 | $1,609.20/yr | 5 | +10 @ $25/user/mo | 25,000 | 70% less than HubSpot Pro |
| **Fortune Foundation** | $374 | $336.60 | $4,039.20/yr | 15 | +10 @ $25/user/mo | 100,000 | 75% less than HubSpot Pro |
| **Fortune** | $524 | $471.60 | $5,659.20/yr | 25 | +15 @ $25/user/mo | 250,000 | 83% less than HubSpot Enterprise |
| **Fortune Plus** | $1,124 | $1,011.60 | $12,139.20/yr | 50 | None (top tier) | Unlimited | 81% less than HubSpot Enterprise |

**Add-on user seat:** $25/user/mo (was $30 — 25% below market standard of $33–$50/seat)
**Annual discount:** 10% off, billed upfront, **NON-REFUNDABLE**

---

## Competitor Comparison (Per-Seat Equivalent)

| Competitor | Their Price | Apex Equivalent | Savings |
|---|---|---|---|
| HubSpot Starter | $100/mo (1 user) | $74/mo | 26% |
| HubSpot Pro (5 users) | $500/mo | $149/mo | 70% |
| HubSpot Pro (15 users) | $1,500/mo | $374/mo | 75% |
| HubSpot Enterprise (25 users) | $3,000/mo | $524/mo | 83% |
| HubSpot Enterprise (50 users) | $6,000/mo | $1,124/mo | 81% |
| Salesforce Pro (5 users) | $500/mo | $149/mo | 70% |
| Salesforce Enterprise (15 users) | $2,625/mo | $374/mo | 86% |
| Close Growth (5 users) | $545/mo | $149/mo | 73% |
| Close Growth (25 users) | $2,725/mo | $524/mo | 81% |

---

## Feature Gate Matrix

### Always FREE (All Tiers Including Trial)

| Feature | Notes |
|---|---|
| Data entry (contacts, companies, deals, tasks, notes) | Core CRM data — never gated |
| One-click migration from any CRM | HubSpot, Salesforce, Close, ActiveCampaign, Zoho, Pipedrive, Freshsales |
| Business category intelligence | Adaptive UI/terminology per industry |
| AI Assistant — first 50 queries/month | Freemium — more on paid tiers |
| Basic AR/AP (manual entry) | Automation unlocks at Growth Foundation |
| Basic Shipping & Receiving (manual entry) | Full module unlocks at Growth Foundation |
| BNB Prospecting — 50 prospects/month | Freemium — full engine unlocks at Fortune Foundation |

---

### Success Starter ($74/mo) — Unlocks

| Feature | Limit |
|---|---|
| Core CRM — contacts, companies, deals, pipeline | Full |
| 25 email templates | — |
| Email sends | 500/mo |
| 1 domain health monitor | — |
| Email support | — |

---

### Growth Foundation ($149/mo) — Unlocks

| Feature | Limit |
|---|---|
| Marketing automation (visual workflow builder) | Unlimited workflows |
| Lead scoring | Engagement-based |
| BNB Paradigm Engine™ | 500 prospects/mo |
| Ghost Mode sequences | 3 active |
| Deliverability suite (warm-up, SPF/DKIM) | — |
| 5 domain health monitors | — |
| Compliance Fortress™ — CAN-SPAM only | — |
| AR/AP automation (rules, bulk invoicing) | Full |
| Shipping & Receiving — full module | Carrier integration + tracking |
| Email sends | 5,000/mo |

---

### Fortune Foundation ($374/mo) — HIGH-MAINTENANCE Services Unlocked

| Feature | Limit | Note |
|---|---|---|
| **260 SMTP rotation engine** | Full | HIGH MAINTENANCE — marked up |
| **Compliance Fortress™ — GDPR + CCPA + CAN-SPAM** | Full | MEDIUM MAINTENANCE |
| **BNB Paradigm Engine™ Full** | Unlimited, all 8 AI layers | HIGH MAINTENANCE |
| Ghost Mode — unlimited sequences | Unlimited | — |
| Battle Cards — AI tactical summaries | — | Competitors don't offer |
| Behavioral DNA Profiler | — | Competitors don't offer |
| Predictive Send Time Optimizer | — | Competitors don't offer |
| Voice Agent | 200 calls/mo | Competitors don't offer |
| DocScan | 50 scans/mo | Competitors don't offer |
| Win Probability Engine | — | — |
| Visitor Tracking | 1,000/mo | — |
| Custom branding (logo, colors) | — | Not full white-label |
| Email sends | 50,000/mo | — |
| Unlimited domain health monitors | — | — |
| Priority support | — | — |

---

### Fortune ($524/mo) — Premium Unique Features

| Feature | Limit | Note |
|---|---|---|
| Voice Agent | Unlimited | — |
| DocScan | Unlimited | — |
| **Revenue Autopilot ("Money Machine")** | Full | Competitors don't offer |
| **Apex Autopilot** (freight consolidation + lane prediction) | Full | Competitors don't offer |
| Visitor Tracking | Unlimited | — |
| **White-labeling — full platform branding** | Full | MEDIUM MAINTENANCE — marked up |
| Custom AI training (basic) | — | Competitors don't offer |
| Dedicated account manager | Human | — |
| 99.5% SLA guarantee | — | — |
| Email sends | 200,000/mo | — |

---

### Fortune Plus ($1,124/mo) — Enterprise, Very High Maintenance

| Feature | Limit | Note |
|---|---|---|
| **Dedicated SMTP infrastructure (your own IPs + domain pools)** | Full | VERY HIGH MAINTENANCE — marked up |
| **Custom AI training — full, unlimited** | Unlimited | VERY HIGH MAINTENANCE — marked up |
| 99.9% SLA guarantee | — | — |
| Priority 24/7 white-glove support | — | — |
| Dedicated infrastructure team | — | — |
| Custom integrations | — | — |
| Email sends | Unlimited | — |
| Contacts | Unlimited | — |

---

## Add-On Pricing

| Add-On | Price | Availability |
|---|---|---|
| Extra user seat | $25/user/mo | All paid tiers |
| AI credit overage | 25% markup on cost | All paid tiers |
| Extra email sends | $10/10,000 sends | Fortune Foundation+ |
| Voice Agent overage | $0.05/call | Fortune Foundation+ |
| DocScan overage | $0.50/scan | Fortune Foundation+ |
| Dedicated IP | $50/IP/mo | Fortune Plus only |
| White-label setup fee | $299 one-time | Fortune tier |
| Custom AI model training | $499/model | Fortune Plus only |

---

## Pages Updated

| Page | Status |
|---|---|
| `server/stripe-products.ts` | ✅ New prices, feature gates, tier limits, utility functions |
| `client/src/pages/MarketingHome.tsx` | ✅ Pricing cards, competitor savings, comparison table |
| `client/src/pages/Subscription.tsx` | ✅ Full 5-tier pricing with free/freemium/premium/locked badges |
| `client/src/pages/Billing.tsx` | ✅ Current plan display, competitor savings table |
| `client/src/pages/ApexDashboard.tsx` | ✅ Admin tier dropdowns, TIER_PRICES lookup table |
| `client/src/pages/Signup.tsx` | ✅ Signup flow pricing tiers |

---

## High-Maintenance Services (Marked Up vs. Standard Tiers)

These are Apex-unique services with real operational cost, priced at premium tiers:

| Service | Tier | Why Marked Up |
|---|---|---|
| 260 SMTP rotation engine | Fortune Foundation | IP pool management, deliverability ops |
| Full Compliance Fortress™ | Fortune Foundation | Legal monitoring, GDPR/CCPA compliance ops |
| Full BNB Paradigm Engine™ | Fortune Foundation | AI compute, data enrichment costs |
| White-labeling | Fortune | Custom domain SSL, branding infrastructure |
| Dedicated SMTP infrastructure | Fortune Plus | Dedicated IP provisioning, warmup, monitoring |
| Custom AI training | Fortune Plus | GPU compute, model management |
| 24/7 white-glove support | Fortune Plus | Human staffing cost |

---

## Data Entry — Always Free

Per original requirement: **data entry is free across all tiers**, including during trial. This includes contacts, companies, deals, tasks, notes, and activities. This is a deliberate competitive differentiator — no competitor offers free data entry at scale.
