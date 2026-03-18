# Apex CRM Pricing Strategy — Design Document

## Competitor Baseline (True Competitors Only)

| Competitor | Entry Plan | Mid Plan | Enterprise |
|---|---|---|---|
| HubSpot Sales Hub | $20/seat/mo (Starter, no sequences) | $100/seat/mo (Pro, 5-seat min = $500/mo) | $120/seat/mo (10-seat min = $1,200/mo) |
| Salesforce Sales Cloud | $25/seat/mo (Starter) | $100/seat/mo (Pro Suite) | $175/seat/mo (Enterprise) |
| Monday CRM | $12/seat/mo (Basic, 3-seat min) | $17/seat/mo (Standard) | $28/seat/mo (Pro) |
| ActiveCampaign | $15/mo (Starter, 1k contacts) | $49/mo (Plus) | $149/mo (Pro) |
| Close CRM | $49/seat/mo (Essentials) | $109/seat/mo (Growth) | $139/seat/mo (Business) |
| Zoho CRM Plus | $57/seat/mo (full suite) | $57/seat/mo | Custom |

## 25% Discount Benchmark

For a 5-user team needing full CRM (sequences, automation, AI, reporting):
- HubSpot Pro: $500/mo → 25% off = **$375/mo**
- Salesforce Pro: $500/mo → 25% off = **$375/mo**
- Close Growth: $545/mo → 25% off = **$409/mo**

For a 15-user team:
- HubSpot Pro: $1,500/mo → 25% off = **$1,125/mo**
- Salesforce Enterprise: $2,625/mo → 25% off = **$1,969/mo**

For a 25-user team:
- HubSpot Enterprise: $3,000/mo → 25% off = **$2,250/mo**
- Salesforce Enterprise: $4,375/mo → 25% off = **$3,281/mo**

---

## Feature Classification

### Category A: Standard CRM (price at 25% below market)
These are table-stakes features all competitors offer. Price competitively.
- Contacts, Companies, Deals, Pipeline management
- Tasks, Activities, Notes, Calendar
- Email templates, basic campaigns
- Basic reporting & dashboards
- Team collaboration (tasks, assignments)
- Import/Export (CSV) — ALWAYS FREE
- One-click migration — ALWAYS FREE (competitive differentiator, never charge)
- Business category intelligence — ALWAYS FREE (leading-edge differentiator)
- Basic AI assistant (50 queries/mo) — ALWAYS FREE (leading-edge differentiator)

### Category B: Apex-Unique, High-Maintenance Services (mark up above market)
These are features competitors don't offer OR require significant Apex infrastructure/ops.
- **SMTP Deliverability Engine** (52 domains, 260 addresses, rotation, warm-up) — HIGH MAINTENANCE
  → Competitors charge $200-500/mo add-on for basic deliverability tools
  → Apex includes in tiers but marks up at Fortune Foundation+
- **Compliance Fortress™** (CAN-SPAM/GDPR/CCPA auto-enforcement) — MEDIUM MAINTENANCE
  → No competitor includes this natively
- **BNB Paradigm Engine™** (Quantum Lead Score, Ghost Mode, Behavioral DNA) — HIGH MAINTENANCE
  → Competitors charge $500-2,000/mo for comparable tools (Apollo, Outreach, Salesloft)
  → Apex includes basic in Growth, full in Fortune Foundation+
- **White-labeling** — MEDIUM MAINTENANCE (setup + support overhead)
  → HubSpot: not available at any price for Sales Hub
  → Salesforce: requires Partner license ($$$)
  → Apex: Fortune+ only, premium tier
- **Dedicated SMTP Infrastructure** (dedicated IPs, custom domain pools) — VERY HIGH MAINTENANCE
  → Fortune Plus only, significant infrastructure cost
- **AI Voice Agent** — HIGH MAINTENANCE (telephony costs)
  → Fortune Foundation+, usage-based overage
- **AR/AP Automation** — MEDIUM MAINTENANCE
  → No competitor includes this
  → Freemium: basic AR/AP free, automation/bulk features premium
- **Shipping & Receiving Module** — LOW MAINTENANCE
  → No competitor includes this
  → Freemium: basic free, advanced tracking premium
- **Custom AI Training** — VERY HIGH MAINTENANCE
  → Fortune+ only

### Category C: Freemium (free tier to hook, premium to scale)
These are Apex-unique features with no competitor equivalent. Give basic free, charge for scale.
- **AI Assistant**: 50 queries/mo FREE → credit-based above that
- **Logo Generation**: simple logo FREE → custom variations + high-res = credits
- **Business Category Intelligence**: FREE across all tiers (differentiator)
- **One-click Migration**: FREE across all tiers (differentiator, removes friction)
- **AR/AP Basic**: FREE → automation rules, bulk invoicing = Fortune Foundation+
- **Shipping/Receiving Basic**: FREE → advanced tracking, carrier integration = Fortune Foundation+
- **BNB Engine Basic**: 100 prospects/mo FREE → unlimited = Growth Foundation+
- **Compliance Fortress™ Basic**: FREE (CAN-SPAM only) → GDPR/CCPA = Fortune Foundation+
- **Domain Health Monitoring**: 1 domain FREE → all domains = Growth Foundation+
- **Visitor Tracking**: 100 visitors/mo FREE → unlimited = Fortune Foundation+

---

## NEW PRICING TIERS

### Tier 0: Success Starter — $74/mo (was $99)
**Competitor equivalent**: HubSpot Starter ($20/seat) + Close Essentials ($49/seat) = ~$69-100/mo for 1 user
**25% below**: HubSpot Pro 1-seat equivalent = $100 → $75 ✓

- 1 user included (+$25/user/mo, up to 4 more users)
- 5,000 contacts
- Core CRM (contacts, companies, deals, pipeline)
- Tasks, activities, notes, calendar
- Email templates (25 templates)
- Basic campaigns (500 sends/mo)
- AI Assistant: 50 queries/mo FREE
- One-click migration: FREE
- Business category intelligence: FREE
- Basic AR/AP (manual entry): FREE
- Basic Shipping/Receiving (manual entry): FREE
- BNB Engine: 50 prospects/mo (freemium)
- Domain health: 1 domain
- Standard support (email)
- ❌ Sequences/automation
- ❌ SMTP rotation
- ❌ Compliance Fortress™
- ❌ Ghost Mode
- ❌ White-labeling

**Annual**: $66.60/mo (10% off) = $799/yr

---

### Tier 1: Growth Foundation — $149/mo (was $197)
**Competitor equivalent**: HubSpot Pro 5-seat = $500/mo, Close Growth 5-seat = $545/mo
**25% below HubSpot Pro**: $500 × 0.75 = $375 → Apex at $149 is 70% below (justified by fewer seats in base)
**Per-seat comparison**: $149/5 = $29.80/seat vs HubSpot $100/seat = **70% savings**

- 5 users included (+$25/user/mo, up to 10 more users)
- 25,000 contacts
- Full CRM suite
- Unlimited email templates
- Campaigns: 5,000 sends/mo
- Marketing automation (visual workflow builder)
- Lead scoring
- BNB Paradigm Engine™ Basic (500 prospects/mo, Quantum Lead Score)
- Ghost Mode sequences (3 active)
- Deliverability suite (basic warm-up, SPF/DKIM guidance)
- Domain health: up to 5 domains
- AI Assistant: 50 queries/mo FREE + credit overage
- Compliance Fortress™ Basic (CAN-SPAM only)
- AR/AP Basic (manual + simple automation)
- Shipping/Receiving Basic
- One-click migration: FREE
- Business category intelligence: FREE
- Standard support + live chat
- ❌ 260 SMTP rotation
- ❌ Full Compliance Fortress™ (GDPR/CCPA)
- ❌ White-labeling
- ❌ Voice Agent

**Annual**: $134.10/mo (10% off) = $1,609/yr

---

### Tier 2: Fortune Foundation — $374/mo (was $497) ⭐ MOST POPULAR
**Competitor equivalent**: HubSpot Pro 15-seat = $1,500/mo, Salesforce Enterprise 15-seat = $2,625/mo
**25% below HubSpot**: $1,500 × 0.75 = $1,125 → Apex at $374 is **75% below** (massive value story)
**Per-seat**: $374/15 = $24.93/seat vs HubSpot $100/seat

- 15 users included (+$25/user/mo, up to 10 more users)
- 100,000 contacts
- All Growth Foundation features
- **260 SMTP rotation** (HIGH MAINTENANCE — included, premium tier unlock)
- **Compliance Fortress™ Full** (CAN-SPAM + GDPR + CCPA) (MEDIUM MAINTENANCE — premium unlock)
- **BNB Paradigm Engine™ Full** (unlimited prospects, all 8 AI layers) (HIGH MAINTENANCE — premium unlock)
- Ghost Mode (unlimited sequences)
- Battle Cards
- Behavioral DNA Profiler
- Predictive Send Time Optimizer
- Campaigns: 50,000 sends/mo
- Voice Agent: 200 calls/mo
- DocScan: 50 scans/mo
- Win Probability Engine
- AR/AP Full (automation rules, bulk invoicing, payment tracking)
- Shipping/Receiving Full (carrier integration, tracking)
- Visitor Tracking: 1,000 visitors/mo
- Custom branding (logo, colors)
- Priority support
- ❌ White-labeling
- ❌ Dedicated SMTP infrastructure
- ❌ Custom AI training

**Annual**: $336.60/mo (10% off) = $4,039/yr

---

### Tier 3: Fortune — $524/mo (was $697)
**Competitor equivalent**: HubSpot Enterprise 25-seat = $3,000/mo, Salesforce Enterprise 25-seat = $4,375/mo
**25% below HubSpot Enterprise**: $3,000 × 0.75 = $2,250 → Apex at $524 is **83% below**

- 25 users included (+$25/user/mo, up to 15 more users)
- 250,000 contacts
- All Fortune Foundation features
- Voice Agent: unlimited calls
- DocScan: unlimited scans
- Revenue Autopilot ("Money Machine")
- Apex Autopilot (freight consolidation + lane prediction)
- Custom AI training (basic)
- Visitor Tracking: unlimited
- Campaigns: 200,000 sends/mo
- White-labeling ✅ (HIGH VALUE — premium unlock)
- Dedicated account manager
- SLA: 99.5% uptime
- ❌ Dedicated SMTP infrastructure

**Annual**: $471.60/mo (10% off) = $5,659/yr

---

### Tier 4: Fortune Plus — $1,124/mo (was $1,497)
**Competitor equivalent**: Salesforce Unlimited 50-seat = $17,500/mo, HubSpot Enterprise 50-seat = $6,000/mo
**25% below HubSpot Enterprise**: $6,000 × 0.75 = $4,500 → Apex at $1,124 is **75% below**

- 50 users included (no add-on — top tier)
- Unlimited contacts
- All Fortune features
- **Dedicated SMTP infrastructure** (dedicated IPs, custom domain pools) (VERY HIGH MAINTENANCE — top tier only)
- **Custom AI training** (full, unlimited) (VERY HIGH MAINTENANCE)
- Campaigns: unlimited sends
- White-labeling ✅
- 99.9% SLA guarantee
- Priority 24/7 support
- Dedicated infrastructure team
- Custom integrations

**Annual**: $1,011.60/mo (10% off) = $12,139/yr

---

## Add-On Pricing

| Add-On | Price | Notes |
|---|---|---|
| Extra user | $25/user/mo | Was $30 — 25% below market |
| AI Credits | 25% markup on Manus pricing | Non-CRM AI only |
| Extra SMTP sends | $10/10,000 sends | Fortune Foundation+ |
| Extra Voice Agent calls | $0.05/call | Fortune Foundation+ |
| Extra DocScan | $0.50/scan | Fortune Foundation+ |
| Dedicated IP | $50/IP/mo | Fortune Plus only |
| White-label setup | $299 one-time | Fortune tier |
| Custom AI training | $499/model | Fortune Plus only |

---

## Feature Gate Summary

| Feature | Starter | Growth | Fortune Foundation | Fortune | Fortune Plus |
|---|---|---|---|---|---|
| Contacts | 5K | 25K | 100K | 250K | Unlimited |
| Users (base) | 1 | 5 | 15 | 25 | 50 |
| Add-on users | +$25/mo | +$25/mo | +$25/mo | +$25/mo | — |
| Email sends/mo | 500 | 5K | 50K | 200K | Unlimited |
| Core CRM | ✅ | ✅ | ✅ | ✅ | ✅ |
| Data entry | ✅ FREE | ✅ FREE | ✅ FREE | ✅ FREE | ✅ FREE |
| One-click migration | ✅ FREE | ✅ FREE | ✅ FREE | ✅ FREE | ✅ FREE |
| Business category intel | ✅ FREE | ✅ FREE | ✅ FREE | ✅ FREE | ✅ FREE |
| AI Assistant (50/mo) | ✅ FREE | ✅ FREE | ✅ FREE | ✅ FREE | ✅ FREE |
| AI Assistant (overage) | Credits | Credits | Credits | Credits | Credits |
| Marketing automation | ❌ | ✅ | ✅ | ✅ | ✅ |
| Lead scoring | ❌ | ✅ | ✅ | ✅ | ✅ |
| BNB Engine (basic) | 50/mo | 500/mo | Unlimited | Unlimited | Unlimited |
| BNB Engine (full AI) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Ghost Mode | ❌ | 3 active | Unlimited | Unlimited | Unlimited |
| 260 SMTP rotation | ❌ | ❌ | ✅ | ✅ | ✅ |
| Compliance Fortress™ | ❌ | CAN-SPAM | Full | Full | Full |
| Voice Agent | ❌ | ❌ | 200/mo | Unlimited | Unlimited |
| DocScan | ❌ | ❌ | 50/mo | Unlimited | Unlimited |
| Win Probability | ❌ | ❌ | ✅ | ✅ | ✅ |
| AR/AP (basic) | ✅ FREE | ✅ FREE | ✅ FREE | ✅ FREE | ✅ FREE |
| AR/AP (automation) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Shipping/Receiving (basic) | ✅ FREE | ✅ FREE | ✅ FREE | ✅ FREE | ✅ FREE |
| Shipping/Receiving (full) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Visitor tracking | ❌ | ❌ | 1K/mo | Unlimited | Unlimited |
| Revenue Autopilot | ❌ | ❌ | ❌ | ✅ | ✅ |
| Apex Autopilot | ❌ | ❌ | ❌ | ✅ | ✅ |
| Custom branding | ❌ | ❌ | ✅ | ✅ | ✅ |
| White-labeling | ❌ | ❌ | ❌ | ✅ | ✅ |
| Dedicated SMTP infra | ❌ | ❌ | ❌ | ❌ | ✅ |
| Custom AI training | ❌ | ❌ | ❌ | Basic | Full |
| Dedicated account mgr | ❌ | ❌ | ❌ | ✅ | ✅ |
| SLA guarantee | ❌ | ❌ | ❌ | 99.5% | 99.9% |
| Support | Email | Email+Chat | Priority | Dedicated | 24/7 White-glove |
