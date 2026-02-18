// ─── FMCSA Campaign Email Templates ───

export const NEW_BROKER_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Welcome to the Industry</title>
<style>
  body { margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
  .container { max-width: 640px; margin: 0 auto; padding: 0; }
  .header { background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 48px 40px; text-align: center; border-radius: 0 0 24px 24px; }
  .header h1 { color: #ffffff; font-size: 28px; margin: 0 0 8px 0; font-weight: 700; }
  .header p { color: #c7d2fe; font-size: 16px; margin: 0; }
  .badge { display: inline-block; background: rgba(255,255,255,0.15); color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 13px; margin-top: 16px; }
  .body { padding: 40px; }
  .body h2 { color: #f1f5f9; font-size: 22px; margin: 0 0 16px 0; }
  .body p { color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0; }
  .highlight { background: #1e293b; border-left: 4px solid #3b82f6; padding: 20px 24px; border-radius: 0 12px 12px 0; margin: 24px 0; }
  .highlight p { color: #cbd5e1; margin: 0; }
  .features { margin: 32px 0; }
  .feature { display: flex; align-items: flex-start; margin-bottom: 20px; }
  .feature-icon { width: 40px; height: 40px; background: #1e293b; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0; color: #60a5fa; font-size: 18px; }
  .feature-text h4 { color: #f1f5f9; font-size: 15px; margin: 0 0 4px 0; }
  .feature-text p { color: #94a3b8; font-size: 13px; margin: 0; line-height: 1.5; }
  .cta-section { text-align: center; padding: 32px 0; }
  .cta-btn { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; }
  .trial-badge { display: inline-block; background: #065f46; color: #6ee7b7; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-bottom: 16px; }
  .footer { text-align: center; padding: 32px 40px; border-top: 1px solid #1e293b; }
  .footer p { color: #64748b; font-size: 12px; margin: 0 0 8px 0; }
  .footer a { color: #60a5fa; text-decoration: none; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🎉 Congratulations!</h1>
    <p>Your New Brokerage Authority is a Big Deal</p>
    <div class="badge">DOT/FMCSA Verified Broker</div>
  </div>
  <div class="body">
    <h2>Welcome to the Transportation Industry</h2>
    <p>We noticed your recent FMCSA broker authority filing, and we wanted to be the first to congratulate you on taking this exciting step. Starting a freight brokerage is one of the most rewarding ventures in the transportation industry, and we're here to help you succeed from day one.</p>

    <div class="highlight">
      <p><strong>Did you know?</strong> The average new freight broker spends 60% of their first year on administrative tasks instead of building relationships and moving loads. Apex CRM was built specifically to flip that ratio.</p>
    </div>

    <h2>How Apex CRM Helps New Brokers Grow</h2>
    <div class="features">
      <div class="feature">
        <div class="feature-icon">📊</div>
        <div class="feature-text">
          <h4>Paradigm Intelligence Engine</h4>
          <p>AI-powered prospect discovery that finds shippers and carriers actively looking for broker partners. Our Quantum Score algorithm identifies the hottest leads so you focus on deals that close.</p>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">📧</div>
        <div class="feature-text">
          <h4>Automated Email Campaigns</h4>
          <p>Built-in email marketing with deliverability monitoring, CAN-SPAM compliance, and A/B testing. Reach more shippers without worrying about spam filters or blacklists.</p>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">👻</div>
        <div class="feature-text">
          <h4>Ghost Sequence Automation</h4>
          <p>Multi-step outreach sequences that run on autopilot. Set up once and let the system nurture prospects through personalized touchpoints until they're ready to ship.</p>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">🛡️</div>
        <div class="feature-text">
          <h4>Compliance & Deliverability</h4>
          <p>Stay compliant with federal regulations while maximizing inbox placement. Domain health monitoring, suppression management, and sender reputation tracking built right in.</p>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">📈</div>
        <div class="feature-text">
          <h4>Deal Pipeline Management</h4>
          <p>Track every opportunity from first contact to closed deal. Visual pipeline with drag-and-drop stages, automated task reminders, and revenue forecasting.</p>
        </div>
      </div>
    </div>

    <div class="cta-section">
      <div class="trial-badge">✨ 2 MONTHS FREE — No Credit Card Required</div>
      <br/><br/>
      <p style="color: #cbd5e1; margin-bottom: 24px;">We're so confident Apex CRM will transform your brokerage that we're offering you a full 2-month trial with zero obligation. Get access to every feature, every tool, every advantage.</p>
      <a href="#" class="cta-btn">Start Your Free Trial →</a>
      <p style="color: #64748b; font-size: 13px; margin-top: 16px;">No credit card required. Cancel anytime. Full access to all features.</p>
    </div>
  </div>
  <div class="footer">
    <p>Apex CRM — Built for Transportation Brokers</p>
    <p>Questions? Reply to this email or visit our <a href="#">Help Center</a></p>
    <p style="margin-top: 16px;"><a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a></p>
  </div>
</div>
</body>
</html>`;


export const RENEWING_BROKER_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>A Better Way Forward</title>
<style>
  body { margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e2e8f0; }
  .container { max-width: 640px; margin: 0 auto; padding: 0; }
  .header { background: linear-gradient(135deg, #0e7490 0%, #1e40af 100%); padding: 48px 40px; text-align: center; border-radius: 0 0 24px 24px; }
  .header h1 { color: #ffffff; font-size: 26px; margin: 0 0 8px 0; font-weight: 700; }
  .header p { color: #a5f3fc; font-size: 16px; margin: 0; }
  .badge { display: inline-block; background: rgba(255,255,255,0.15); color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 13px; margin-top: 16px; }
  .body { padding: 40px; }
  .body h2 { color: #f1f5f9; font-size: 22px; margin: 0 0 16px 0; }
  .body h3 { color: #e2e8f0; font-size: 18px; margin: 24px 0 12px 0; }
  .body p { color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0; }
  .empathy-box { background: #1e293b; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #334155; }
  .empathy-box p { color: #cbd5e1; margin: 0 0 8px 0; }
  .empathy-box p:last-child { margin: 0; }
  .price-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
  .price-table th { background: #1e293b; color: #94a3b8; padding: 12px 16px; text-align: left; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .price-table td { padding: 14px 16px; border-bottom: 1px solid #1e293b; font-size: 14px; }
  .price-table tr:nth-child(even) td { background: rgba(30,41,59,0.3); }
  .price-high { color: #f87171; font-weight: 600; }
  .price-low { color: #34d399; font-weight: 600; }
  .savings { background: linear-gradient(135deg, #065f46, #064e3b); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
  .savings .amount { font-size: 36px; font-weight: 700; color: #6ee7b7; }
  .savings p { color: #a7f3d0; margin: 8px 0 0 0; }
  .solutions { margin: 24px 0; }
  .solution { background: #1e293b; border-radius: 10px; padding: 16px 20px; margin-bottom: 12px; display: flex; align-items: flex-start; }
  .solution-icon { font-size: 20px; margin-right: 14px; margin-top: 2px; }
  .solution h4 { color: #f1f5f9; font-size: 14px; margin: 0 0 4px 0; }
  .solution p { color: #94a3b8; font-size: 13px; margin: 0; line-height: 1.5; }
  .cta-section { text-align: center; padding: 32px 0; }
  .cta-btn { display: inline-block; background: linear-gradient(135deg, #0891b2, #3b82f6); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; }
  .cta-secondary { display: inline-block; border: 2px solid #3b82f6; color: #60a5fa; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-size: 15px; font-weight: 600; margin-top: 12px; }
  .trial-badge { display: inline-block; background: #065f46; color: #6ee7b7; padding: 8px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-bottom: 16px; }
  .import-box { background: linear-gradient(135deg, #1e293b, #0f172a); border: 2px dashed #334155; border-radius: 16px; padding: 32px; text-align: center; margin: 32px 0; }
  .import-box h3 { color: #f1f5f9; margin: 0 0 8px 0; }
  .import-box p { color: #94a3b8; font-size: 14px; margin: 0 0 20px 0; }
  .import-btn { display: inline-block; background: #1e40af; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 10px; font-size: 14px; font-weight: 600; }
  .footer { text-align: center; padding: 32px 40px; border-top: 1px solid #1e293b; }
  .footer p { color: #64748b; font-size: 12px; margin: 0 0 8px 0; }
  .footer a { color: #60a5fa; text-decoration: none; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Thank You for Your Dedication</h1>
    <p>Your continued commitment to the transportation industry matters</p>
    <div class="badge">Renewed FMCSA Broker Authority</div>
  </div>
  <div class="body">
    <h2>We See You. We Understand.</h2>
    <p>Congratulations on renewing your broker authority. In an industry where many give up after the first year, your persistence speaks volumes about your dedication and resilience.</p>

    <div class="empathy-box">
      <p><strong>We know it hasn't been easy.</strong></p>
      <p>Rising fuel costs. Tightening margins. Carrier capacity swings. Shipper demands that keep growing while rates keep getting squeezed. The regulatory burden alone is enough to make anyone question why they got into this business.</p>
      <p>But you're still here. And that tells us you're exactly the kind of broker who deserves better tools — not more expensive ones.</p>
    </div>

    <h3>The Problem: Your CRM Shouldn't Cost More Than Your Loads Pay</h3>
    <p>We've been watching the freight tech space, and frankly, the pricing has gotten out of control. Here's what the "big names" are charging brokers like you:</p>

    <table class="price-table">
      <thead>
        <tr>
          <th>Platform</th>
          <th>Monthly Cost</th>
          <th>Per User Add-on</th>
          <th>Hidden Fees</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>HubSpot (Sales Pro)</td>
          <td class="price-high">$450/mo</td>
          <td class="price-high">$90/user</td>
          <td>Onboarding: $1,500</td>
        </tr>
        <tr>
          <td>Salesforce</td>
          <td class="price-high">$300/mo</td>
          <td class="price-high">$150/user</td>
          <td>Implementation: $5,000+</td>
        </tr>
        <tr>
          <td>Outreach.io</td>
          <td class="price-high">$130/user/mo</td>
          <td>—</td>
          <td>Annual contract only</td>
        </tr>
        <tr>
          <td>Tai TMS + CRM</td>
          <td class="price-high">$500+/mo</td>
          <td class="price-high">$75/user</td>
          <td>Setup: $3,000+</td>
        </tr>
        <tr>
          <td style="color: #34d399; font-weight: 700;">Apex CRM</td>
          <td class="price-low">$0 for 2 months</td>
          <td class="price-low">Included</td>
          <td style="color: #34d399;">None. Ever.</td>
        </tr>
      </tbody>
    </table>

    <div class="savings">
      <div class="amount">Save $3,000 - $12,000/year</div>
      <p>Compared to leading CRM platforms — with more features built for freight</p>
    </div>

    <h3>What We're Doing Differently</h3>
    <p>Apex CRM was built by people who understand the freight brokerage business. We're not a generic CRM with a "transportation add-on" — every feature was designed for how brokers actually work.</p>

    <div class="solutions">
      <div class="solution">
        <div class="solution-icon">🧠</div>
        <div>
          <h4>Paradigm Intelligence Engine</h4>
          <p>AI that finds shippers and carriers actively looking for broker partners. No more cold-calling from purchased lists that go nowhere.</p>
        </div>
      </div>
      <div class="solution">
        <div class="solution-icon">👻</div>
        <div>
          <h4>Ghost Sequence Automation</h4>
          <p>Set up multi-step outreach sequences that run on autopilot. Your follow-ups happen even when you're on the road or handling emergencies.</p>
        </div>
      </div>
      <div class="solution">
        <div class="solution-icon">📧</div>
        <div>
          <h4>Email Campaigns with Deliverability Built In</h4>
          <p>Domain health monitoring, CAN-SPAM compliance, suppression management, and inbox placement optimization — all included, not add-ons.</p>
        </div>
      </div>
      <div class="solution">
        <div class="solution-icon">⚡</div>
        <div>
          <h4>Battle Cards & Competitive Intel</h4>
          <p>Know exactly how to position against competitors in every conversation. Real-time market intelligence at your fingertips.</p>
        </div>
      </div>
      <div class="solution">
        <div class="solution-icon">📊</div>
        <div>
          <h4>Full Pipeline Visibility</h4>
          <p>See every deal, every contact, every task in one place. No more spreadsheets, no more sticky notes, no more lost opportunities.</p>
        </div>
      </div>
    </div>

    <div class="cta-section">
      <div class="trial-badge">✨ 2 MONTHS FREE — Full Access, Zero Risk</div>
      <br/><br/>
      <p style="color: #cbd5e1; margin-bottom: 24px;">You've earned this. After everything you've been through in this industry, you deserve a CRM that works as hard as you do — without breaking the bank.</p>
      <a href="#" class="cta-btn">Start Your Free Trial →</a>
      <p style="color: #64748b; font-size: 13px; margin-top: 16px;">No credit card. No contracts. No hidden fees. Cancel anytime.</p>
    </div>

    <div class="import-box">
      <h3>🚀 Switch in 60 Seconds</h3>
      <p>Already using another CRM? We'll import all your contacts, leads, and deal history with a single click. No data entry, no CSV headaches, no lost information.</p>
      <a href="#" class="import-btn">One-Click Import →</a>
      <p style="color: #64748b; font-size: 12px; margin-top: 12px;">Supports imports from HubSpot, Salesforce, Zoho, spreadsheets, and more</p>
    </div>

    <h3>Get Rolling in Minutes, Not Months</h3>
    <p>Unlike enterprise CRMs that take weeks to set up and require expensive consultants, Apex CRM is ready to go the moment you sign up:</p>
    <div class="solutions">
      <div class="solution">
        <div class="solution-icon">1️⃣</div>
        <div>
          <h4>Sign Up (30 seconds)</h4>
          <p>Create your account with just your email. No credit card, no sales calls, no demos required.</p>
        </div>
      </div>
      <div class="solution">
        <div class="solution-icon">2️⃣</div>
        <div>
          <h4>Import Your Data (60 seconds)</h4>
          <p>One-click import brings in all your contacts, leads, and history from your current system.</p>
        </div>
      </div>
      <div class="solution">
        <div class="solution-icon">3️⃣</div>
        <div>
          <h4>Start Working (Immediately)</h4>
          <p>Your pipeline is set up, your contacts are organized, and the AI is already finding new prospects for you.</p>
        </div>
      </div>
    </div>

    <div class="cta-section">
      <a href="#" class="cta-btn">Join Apex CRM Free →</a>
      <br/><br/>
      <a href="#" class="cta-secondary">Schedule a Quick Demo Instead</a>
    </div>
  </div>
  <div class="footer">
    <p>Apex CRM — Built by Brokers, for Brokers</p>
    <p>Questions? Reply to this email or visit our <a href="#">Help Center</a></p>
    <p style="margin-top: 16px;"><a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a></p>
  </div>
</div>
</body>
</html>`;
