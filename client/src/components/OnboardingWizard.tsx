import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Building2, Users, CheckCircle2, ArrowRight, ArrowLeft,
  Sparkles, Rocket, PartyPopper, X, ChevronLeft, ChevronRight,
  ImageIcon, Upload, UserPlus, Mail, Wand2, Server, FileSpreadsheet,
  Briefcase, Megaphone, Bot, Settings, PlayCircle, ExternalLink,
  Info, AlertCircle, Lightbulb, Check, Circle,
} from "lucide-react";

// ─── Setup chapter definitions ─────────────────────────────────────────────
type Chapter = {
  id: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  title: string;
  subtitle: string;
  estimatedTime: string;
  steps: SetupStep[];
};

type SetupStep = {
  number: number;
  title: string;
  description: string;
  tip?: string;
  warning?: string;
  illustration: string; // emoji illustration
  path?: string; // navigation path
  pathLabel?: string;
  videoUrl?: string;   // YouTube embed URL
  videoLabel?: string;
  subSteps?: string[]; // numbered sub-steps for complex actions
  diagram?: React.ReactNode; // inline SVG/JSX diagram
};

// ─── Inline illustrated diagrams ─────────────────────────────────────────────
function StepDiagram({ chapterId, stepNumber, gradient }: { chapterId: string; stepNumber: number; gradient: string }) {
  const diagrams: Record<string, Record<number, React.ReactNode>> = {
    branding: {
      1: (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-[10px] font-mono">
          <div className="flex gap-2">
            {/* Sidebar mock */}
            <div className="w-28 bg-stone-800 rounded-lg p-2 space-y-1.5">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="h-6 w-6 rounded bg-amber-500 flex items-center justify-center">
                  <span className="text-white text-[8px] font-black">A</span>
                </div>
                <span className="text-stone-300 text-[9px] font-bold">AXIOM CRM</span>
                <div className="ml-auto h-4 w-4 rounded bg-amber-500/30 border border-amber-400 flex items-center justify-center cursor-pointer">
                  <span className="text-amber-400 text-[8px]">📷</span>
                </div>
              </div>
              {["Dashboard","Contacts","Deals","Campaigns"].map(l => (
                <div key={l} className="h-5 rounded bg-stone-700 flex items-center px-1.5">
                  <span className="text-stone-400 text-[8px]">{l}</span>
                </div>
              ))}
            </div>
            {/* Arrow callout */}
            <div className="flex flex-col justify-start pt-1">
              <div className="flex items-center gap-1">
                <div className="h-0.5 w-6 bg-amber-500" />
                <div className="bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">← Click here</div>
              </div>
              <p className="text-stone-500 text-[9px] mt-1 max-w-[100px]">Camera icon next to company name opens the logo dialog</p>
            </div>
          </div>
        </div>
      ),
      2: (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
            <div className="bg-stone-100 px-3 py-1.5 border-b border-stone-200 flex items-center gap-2">
              <span className="text-[9px] font-bold text-stone-600">Logo Dialog</span>
              <div className="flex gap-1 ml-2">
                {["Upload","AI Generate","History"].map((t,i) => (
                  <div key={t} className={`px-2 py-0.5 rounded text-[8px] font-semibold ${i===1 ? "bg-amber-500 text-white" : "bg-stone-200 text-stone-500"}`}>{t}</div>
                ))}
              </div>
            </div>
            <div className="p-3 space-y-2">
              <div className="h-16 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 flex items-center justify-center">
                <span className="text-[9px] text-amber-600 font-semibold">✨ AI will generate your logo here</span>
              </div>
              <div className="bg-amber-500 rounded text-white text-[9px] font-bold text-center py-1.5">Generate My Logo →</div>
            </div>
          </div>
        </div>
      ),
      3: (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <div className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
            <div className="bg-stone-100 px-3 py-1.5 border-b border-stone-200 flex items-center gap-2">
              <span className="text-[9px] font-bold text-stone-600">Logo Dialog</span>
              <div className="flex gap-1 ml-2">
                {["Upload","AI Generate","History"].map((t,i) => (
                  <div key={t} className={`px-2 py-0.5 rounded text-[8px] font-semibold ${i===0 ? "bg-blue-500 text-white" : "bg-stone-200 text-stone-500"}`}>{t}</div>
                ))}
              </div>
            </div>
            <div className="p-3 space-y-2">
              <div className="h-14 rounded-lg bg-blue-50 border-2 border-dashed border-blue-300 flex flex-col items-center justify-center gap-1">
                <span className="text-[10px]">📁</span>
                <span className="text-[9px] text-blue-600 font-semibold">Click to choose PNG or JPG file</span>
              </div>
              <div className="text-[8px] text-stone-400 text-center">Recommended: 512×512 px PNG with transparent background</div>
            </div>
          </div>
        </div>
      ),
    },
    smtp: {
      1: (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-base">📧</div>
            <div>
              <p className="text-[10px] font-bold text-stone-700">How SMTP works</p>
              <p className="text-[9px] text-stone-500">Your email account → SMTP server → Recipient inbox</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[9px]">
            {["Your CRM","→","SMTP Server","→","Inbox ✅"].map((s,i) => (
              <div key={i} className={`px-2 py-1 rounded font-semibold ${
                s==="→" ? "text-stone-400" :
                s.includes("✅") ? "bg-emerald-100 text-emerald-700" :
                "bg-blue-100 text-blue-700"
              }`}>{s}</div>
            ))}
          </div>
        </div>
      ),
      2: (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-2">Settings → Email Infrastructure → SMTP Accounts → Add Account</p>
          <div className="bg-white rounded-lg border border-stone-200 p-3 space-y-1.5">
            {[
              ["Host","smtp.gmail.com","text-blue-600"],
              ["Port","587","text-emerald-600"],
              ["Username","you@yourcompany.com","text-stone-500"],
              ["Password","••••••••••••••••","text-stone-400"],
            ].map(([label,val,cls]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[9px] text-stone-500 w-16 shrink-0">{label}</span>
                <div className={`flex-1 bg-stone-50 border border-stone-200 rounded px-2 py-1 text-[9px] font-mono ${cls}`}>{val}</div>
              </div>
            ))}
            <div className="bg-blue-500 rounded text-white text-[9px] font-bold text-center py-1 mt-1">Test Connection</div>
          </div>
        </div>
      ),
      3: (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-2">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <span className="text-base">✅</span>
            <div>
              <p className="text-[10px] font-bold text-emerald-700">Connection Successful</p>
              <p className="text-[9px] text-emerald-600">Test email sent to you@yourcompany.com</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <span className="text-base">❌</span>
            <div>
              <p className="text-[10px] font-bold text-red-700">Connection Failed</p>
              <p className="text-[9px] text-red-600">Check hostname, port, and password</p>
            </div>
          </div>
        </div>
      ),
      4: (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-2">DNS Records to Add (example)</p>
          <div className="space-y-1.5">
            {[
              ["TXT","@","v=spf1 include:_spf.yourdomain.com ~all","SPF"],
              ["TXT","mail._domainkey","v=DKIM1; k=rsa; p=MIGf...","DKIM"],
              ["TXT","_dmarc","v=DMARC1; p=none; rua=mailto:...","DMARC"],
            ].map(([type,name,val,label]) => (
              <div key={label} className="bg-white rounded border border-stone-200 px-2 py-1.5 flex items-start gap-2">
                <span className={`text-[8px] font-black px-1 py-0.5 rounded shrink-0 ${
                  label==="SPF" ? "bg-blue-100 text-blue-700" :
                  label==="DKIM" ? "bg-purple-100 text-purple-700" :
                  "bg-amber-100 text-amber-700"
                }`}>{label}</span>
                <div className="min-w-0">
                  <p className="text-[8px] text-stone-500">Type: <span className="font-mono text-stone-700">{type}</span> · Name: <span className="font-mono text-stone-700">{name}</span></p>
                  <p className="text-[8px] font-mono text-stone-600 truncate">{val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    contacts: {
      1: (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-2">Your CSV file should look like this:</p>
          <div className="bg-white rounded border border-stone-200 overflow-hidden">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="bg-emerald-500 text-white">
                  {["First Name","Last Name","Email","Phone","Company"].map(h => (
                    <th key={h} className="px-2 py-1 text-left font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["John","Smith","john@acme.com","555-1234","Acme Corp"],
                  ["Sarah","Jones","sarah@beta.com","555-5678","Beta LLC"],
                  ["Mike","Brown","mike@co.com","555-9012","Co Inc"],
                ].map((row,i) => (
                  <tr key={i} className={i%2===0 ? "bg-white" : "bg-stone-50"}>
                    {row.map((cell,j) => <td key={j} className="px-2 py-1 text-stone-600">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ),
      2: (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-2">Settings → Import & Export → Import Contacts</p>
          <div className="bg-white rounded-lg border border-stone-200 p-3 space-y-2">
            <div className="h-12 rounded-lg bg-emerald-50 border-2 border-dashed border-emerald-300 flex items-center justify-center gap-2">
              <span className="text-sm">📁</span>
              <span className="text-[9px] text-emerald-700 font-semibold">contacts.csv (2,450 rows)</span>
            </div>
            <div className="bg-emerald-500 rounded text-white text-[9px] font-bold text-center py-1">Upload & Preview →</div>
          </div>
        </div>
      ),
      3: (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-2">Column Mapping</p>
          <div className="space-y-1">
            {[
              ["Email Address","Email","green"],
              ["Full Name","? Needs mapping","yellow"],
              ["Phone #","Phone","green"],
              ["Biz Name","Company","green"],
            ].map(([from,to,color]) => (
              <div key={from} className="flex items-center gap-2">
                <div className="bg-stone-100 rounded px-2 py-0.5 text-[8px] text-stone-600 w-24 shrink-0">{from}</div>
                <span className="text-stone-400 text-[8px]">→</span>
                <div className={`rounded px-2 py-0.5 text-[8px] font-semibold flex-1 ${
                  color==="green" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>{to}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    pipeline: {
      1: (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-2">Deals → Kanban View</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[
              {stage:"Lead In",color:"bg-stone-200",deals:["Acme Corp","Beta LLC"]},
              {stage:"Qualified",color:"bg-blue-200",deals:["Gamma Inc"]},
              {stage:"Proposal",color:"bg-amber-200",deals:["Delta Co","Epsilon"]},
              {stage:"Won ✅",color:"bg-emerald-200",deals:["Zeta Ltd"]},
            ].map(col => (
              <div key={col.stage} className="shrink-0 w-20">
                <div className={`${col.color} rounded-t px-1.5 py-1 text-[8px] font-bold text-stone-700`}>{col.stage}</div>
                <div className="bg-white border border-stone-200 rounded-b p-1 space-y-1 min-h-[40px]">
                  {col.deals.map(d => (
                    <div key={d} className="bg-white border border-stone-200 rounded px-1 py-0.5 text-[7px] text-stone-600 shadow-sm">{d}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[8px] text-stone-400 mt-1.5 text-center">↔ Drag cards between columns to advance deals</p>
        </div>
      ),
      2: (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-2">New Deal Form</p>
          <div className="bg-white rounded-lg border border-stone-200 p-2.5 space-y-1.5">
            {[
              ["Deal Name","Acme Corp — Q2 Contract"],
              ["Company","Acme Corp"],
              ["Value","$24,000"],
              ["Stage","Qualified"],
            ].map(([label,val]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[8px] text-stone-500 w-16 shrink-0">{label}</span>
                <div className="flex-1 bg-stone-50 border border-stone-200 rounded px-2 py-0.5 text-[8px] text-stone-700">{val}</div>
              </div>
            ))}
            <div className="bg-amber-500 rounded text-white text-[9px] font-bold text-center py-1 mt-1">Create Deal</div>
          </div>
        </div>
      ),
    },
    campaigns: {
      1: (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-2">Campaigns → New Campaign</p>
          <div className="flex gap-2">
            {["Email Blast","Drip Sequence","AI Ghost Sequence"].map((t,i) => (
              <div key={t} className={`flex-1 rounded-lg border p-2 text-center ${
                i===0 ? "border-amber-400 bg-amber-50" : "border-stone-200 bg-white"
              }`}>
                <div className="text-base mb-0.5">{["📨","🔄","🤖"][i]}</div>
                <p className="text-[8px] font-semibold text-stone-700">{t}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    ai: {
      1: (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-2">AI Features Overview</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              ["🤖","AI Ghostwriter","Write emails in your voice"],
              ["📊","Win Probability","Score every deal 0–100%"],
              ["🎯","Lead Scoring","Rank contacts by likelihood"],
              ["📅","Meeting Prep","Auto-brief before calls"],
            ].map(([icon,name,desc]) => (
              <div key={name} className="bg-white rounded-lg border border-stone-200 p-2">
                <div className="text-sm mb-0.5">{icon}</div>
                <p className="text-[8px] font-bold text-stone-700">{name}</p>
                <p className="text-[7px] text-stone-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    team: {
      1: (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-2">Settings → Team → Invite Member</p>
          <div className="bg-white rounded-lg border border-stone-200 p-2.5 space-y-1.5">
            {[
              ["Email","colleague@yourcompany.com"],
              ["Role","Account Manager"],
            ].map(([label,val]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[8px] text-stone-500 w-10 shrink-0">{label}</span>
                <div className="flex-1 bg-stone-50 border border-stone-200 rounded px-2 py-0.5 text-[8px] text-stone-600">{val}</div>
              </div>
            ))}
            <div className="bg-indigo-500 rounded text-white text-[9px] font-bold text-center py-1 mt-1">Send Invite Email →</div>
          </div>
        </div>
      ),
    },
  };
  const diagram = diagrams[chapterId]?.[stepNumber];
  if (!diagram) return null;
  return <div className="w-full">{diagram}</div>;
}

const CHAPTERS: Chapter[] = [
  {
    id: "branding",
    icon: ImageIcon,
    color: "purple",
    gradient: "from-purple-500 to-violet-600",
    title: "Brand Your CRM",
    subtitle: "Add your logo and company identity",
    estimatedTime: "2 min",
    steps: [
      {
        number: 1,
        title: "Open the Logo Dialog",
        description: "Your logo is the first thing every team member and email recipient sees. Let's add it now. Look at the top-left corner of the sidebar — you'll see your company name with a small camera icon next to it. Click that camera icon to open the logo dialog.",
        illustration: "🖼️",
        subSteps: [
          "Look at the left sidebar — find your company name at the very top",
          "Click the small camera/pencil icon that appears next to the company name",
          "A dialog box will pop up in the center of the screen with logo options",
        ],
        tip: "Your logo appears everywhere: the sidebar, email footers, PDF exports, and the AI assistant. A clean square image (PNG with transparent background) looks best.",
      },
      {
        number: 2,
        title: "Generate a Logo with AI (No Design Skills Needed)",
        description: "Don't have a logo? No problem. Click the \"AI Generate\" tab in the logo dialog. The AI will create a professional logo based on your company name and industry in about 15 seconds — completely free.",
        illustration: "✨",
        subSteps: [
          "In the logo dialog, click the \"AI Generate\" tab",
          "Your company name is pre-filled — click \"Generate My Logo\"",
          "Wait 10–20 seconds while the AI creates your logo",
          "A large preview will appear — review it carefully",
          "Click \"Customize It\" to describe changes (e.g. \"use navy blue and gold, add a truck icon\")",
          "Click \"Yes, Use This Logo\" when you're happy with it",
        ],
        tip: "Be specific when customizing: say \"dark navy background, gold text, minimalist truck icon, sans-serif font\" instead of just \"make it better\". The more detail you give, the better the result.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoLabel: "Watch: AI Logo Generation (2 min)",
      },
      {
        number: 3,
        title: "Upload Your Own Logo",
        description: "Already have a logo file? Click the \"Upload\" button in the logo dialog. Select your PNG or JPG file from your computer. The system will show you a preview before applying it.",
        illustration: "⬆️",
        subSteps: [
          "In the logo dialog, click the \"Upload\" button",
          "Select your logo file (PNG or JPG, ideally 512×512 px or larger)",
          "A preview will appear — confirm it looks correct",
          "Click \"Yes, Use This Logo\" to apply it",
        ],
        tip: "PNG files with a transparent background look the most professional, especially on colored sidebar backgrounds. Avoid logos with white backgrounds — they'll look like a white box.",
      },
      {
        number: 4,
        title: "Set as Favicon (Browser Tab Icon)",
        description: "After applying your logo, you'll see a \"Set as Favicon\" button. Click it to also use your logo as the small icon that appears in the browser tab. This makes the CRM feel like your own branded product.",
        illustration: "🌐",
        subSteps: [
          "After clicking \"Yes, Use This Logo\", look for the \"Set as Favicon\" button",
          "Click it — your logo will now appear in the browser tab",
          "Refresh the page to see the new favicon take effect",
        ],
        tip: "You can change your logo anytime. Go to the Dashboard, click the camera icon again, and the full logo history is saved so you can switch back to any previous version.",
      },
    ],
  },
  {
    id: "smtp",
    icon: Server,
    color: "blue",
    gradient: "from-blue-500 to-cyan-600",
    title: "Set Up Email Sending",
    subtitle: "Connect your SMTP server so you can send campaigns",
    estimatedTime: "5–10 min",
    steps: [
      {
        number: 1,
        title: "What is SMTP and Why Do You Need It?",
        description: "SMTP (Simple Mail Transfer Protocol) is the technology that lets the CRM send emails on your behalf. Think of it as connecting your email account to the CRM so it can send campaigns, follow-ups, and sequences using your email address — not a generic system address.",
        illustration: "📬",
        subSteps: [
          "You need: your email address, your mail server hostname, and your password",
          "If you use Gmail, Outlook, or a custom domain email — all work fine",
          "This setup takes about 5 minutes and only needs to be done once",
        ],
        tip: "Use an email on your own domain (e.g. sales@yourcompany.com) rather than a free Gmail address. Emails from your own domain look more professional and land in inboxes more reliably.",
        path: "/settings/email-infrastructure",
        pathLabel: "Open SMTP Settings",
      },
      {
        number: 2,
        title: "Add Your SMTP Account",
        description: "Go to Settings → Email Infrastructure → SMTP Accounts. Click \"Add Account\". You'll see a form with 4 fields to fill in.",
        illustration: "🔧",
        subSteps: [
          "Host: your mail server address (examples below)",
          "Port: use 587 for most providers, or 465 if 587 doesn't work",
          "Username: your full email address (e.g. john@yourcompany.com)",
          "Password: your email password (see special note for Gmail below)",
        ],
        warning: "Gmail users: You CANNOT use your regular Gmail password here. You must create a special \"App Password\": go to myaccount.google.com → Security → 2-Step Verification → App Passwords → create one for \"Mail\". Copy that 16-character code and use it as your password here.",
        tip: "Common SMTP hostnames: Gmail = smtp.gmail.com | Outlook/Office365 = smtp.office365.com | Yahoo = smtp.mail.yahoo.com | Custom domain = usually mail.yourdomain.com or smtp.yourdomain.com (check with your hosting provider).",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoLabel: "Watch: Adding Your SMTP Account (3 min)",
      },
      {
        number: 3,
        title: "Test the Connection",
        description: "After filling in your details, click \"Test Connection\". The system will try to connect to your mail server and send a test message. This tells you immediately if your settings are correct.",
        illustration: "🟢",
        subSteps: [
          "Click \"Test Connection\" — wait up to 10 seconds",
          "Green checkmark = success! Your account is ready to send",
          "Red error = something is wrong (see tips below)",
          "After success, check your inbox for the test email to confirm delivery",
        ],
        tip: "If the test fails: (1) Double-check your hostname and port. (2) Make sure your email provider allows SMTP access — some require you to enable it in your account settings. (3) For Gmail, make sure you used an App Password, not your regular password. (4) Try port 465 instead of 587.",
      },
      {
        number: 4,
        title: "Set Up SPF and DKIM (Stops Emails Going to Spam)",
        description: "This is the most important step for email deliverability. SPF and DKIM are DNS records that prove to Gmail, Outlook, and other providers that your emails are legitimate. Without them, your campaigns will often land in spam.",
        illustration: "🔐",
        subSteps: [
          "Go to Settings → Email Infrastructure → Domain Authentication",
          "Click \"Add Domain\" and enter your sending domain (e.g. yourcompany.com)",
          "The system will show you 2–3 DNS records to add",
          "Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)",
          "Go to DNS settings and add each record exactly as shown",
          "Come back and click \"Verify\" — DNS changes take 5–60 minutes to propagate",
        ],
        warning: "Skipping SPF/DKIM is the #1 reason emails land in spam. It takes 10 minutes and makes an enormous difference. Do not skip this step.",
        path: "/settings/email-infrastructure",
        pathLabel: "Go to Domain Authentication",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoLabel: "Watch: Setting Up SPF & DKIM (5 min)",
      },
      {
        number: 5,
        title: "Warm Up Your Domain (New Domains Only)",
        description: "If your domain is new (less than 3 months old) or you've never sent bulk email from it before, you need to \"warm it up\". This means gradually increasing your sending volume over 4–6 weeks so email providers learn to trust you.",
        illustration: "🌡️",
        subSteps: [
          "Go to Settings → Email Infrastructure → Warm-Up Scheduler",
          "Select your SMTP account and click \"Start Warm-Up\"",
          "The system will automatically send a small number of emails per day, increasing gradually",
          "Week 1: ~20 emails/day. Week 2: ~50/day. Week 4: ~200/day. Week 6: ~1000+/day",
          "Do NOT send large campaigns until warm-up is complete",
        ],
        tip: "Skipping warm-up on a new domain and immediately sending 1,000 emails will get your domain blacklisted within days. The warm-up process is automatic — just turn it on and wait.",
      },
    ],
  },
  {
    id: "contacts",
    icon: Users,
    color: "emerald",
    gradient: "from-emerald-500 to-teal-600",
    title: "Import Your Contacts",
    subtitle: "Bring in your existing leads and customers",
    estimatedTime: "5–10 min",
    steps: [
      {
        number: 1,
        title: "Prepare Your Contact List as a CSV File",
        description: "A CSV (Comma-Separated Values) file is a simple spreadsheet format that the CRM can read. You need to export your contacts from wherever they currently live — Excel, Google Sheets, another CRM, or even a business card scanner app.",
        illustration: "📊",
        subSteps: [
          "Open your existing contact list in Excel or Google Sheets",
          "Make sure you have these columns: First Name, Last Name, Email, Phone, Company",
          "Optional but useful: Job Title, City, State, Lead Source, Notes",
          "In Excel: File → Save As → choose \"CSV (Comma delimited)\" format",
          "In Google Sheets: File → Download → Comma-separated values (.csv)",
        ],
        tip: "Download our pre-formatted import template first so you know exactly what columns to use. Go to Settings → Import & Export → Download Template.",
        path: "/settings",
        pathLabel: "Go to Import & Export",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoLabel: "Watch: Preparing Your CSV File (2 min)",
      },
      {
        number: 2,
        title: "Upload Your CSV to the CRM",
        description: "Now that your CSV is ready, upload it to the CRM. The system will automatically read the file and show you a preview.",
        illustration: "⬆️",
        subSteps: [
          "Go to Settings → Import & Export in the left sidebar",
          "Click the \"Import Contacts\" tab",
          "Click \"Choose File\" and select your CSV file",
          "Click \"Upload\" — a preview of the first 5 rows will appear",
          "Verify the preview looks correct before proceeding",
        ],
        tip: "Maximum 10,000 contacts per import. If you have more, split your file into batches of 10,000 and import them one at a time.",
      },
      {
        number: 3,
        title: "Match Your Columns to CRM Fields",
        description: "The importer tries to automatically match your column names to the correct CRM fields. For example, if your CSV has a column called \"Email Address\", it will automatically map it to the Email field. You just need to fix any columns it couldn't figure out.",
        illustration: "🗺️",
        subSteps: [
          "Review the column mapping table that appears after upload",
          "Green rows = automatically matched (no action needed)",
          "Yellow rows = needs your attention — click the dropdown to select the correct field",
          "Gray rows = will be skipped (click \"Include\" if you want to import them)",
          "Click \"Preview Import\" to see a sample of how the data will look",
        ],
        tip: "The \"Lead Source\" field is especially important — set it to \"Import\" or the name of your old system (e.g. \"Salesforce Export\") so you can always filter by where contacts came from.",
      },
      {
        number: 4,
        title: "Run the Import and Verify",
        description: "You're almost done. The final step is to confirm and run the import. The system will tell you exactly how many contacts will be created and if any duplicates were found.",
        illustration: "✅",
        subSteps: [
          "Review the import summary: new contacts, updates, and skipped rows",
          "Click \"Start Import\" to begin — large files may take 1–2 minutes",
          "A progress bar will show the import status",
          "When complete, go to Contacts → filter by Lead Source = \"Import\" to see your contacts",
          "Click on 3–5 random contacts to verify the data imported correctly",
        ],
        tip: "If you see duplicate contacts after importing, use the AI Duplicate Detection tool in Developer → AI Engine. It will automatically find and merge duplicates for you.",
        path: "/contacts",
        pathLabel: "Go to Contacts",
      },
    ],
  },
  {
    id: "pipeline",
    icon: Briefcase,
    color: "amber",
    gradient: "from-amber-500 to-orange-600",
    title: "Build Your Sales Pipeline",
    subtitle: "Set up deal stages and track every opportunity",
    estimatedTime: "5–10 min",
    steps: [
      {
        number: 1,
        title: "Understanding the Kanban Board",
        description: "The Deals page shows your pipeline as a Kanban board — a visual board with columns for each stage of your sales process. Each deal is a card that moves from left to right as it progresses toward a sale.",
        illustration: "📋",
        subSteps: [
          "Click \"Deals\" in the left sidebar to open the pipeline",
          "You'll see columns: Lead In → Qualified → Proposal → Negotiation → Won / Lost",
          "Each column = a stage in your sales process",
          "Each card = one deal opportunity",
          "Drag cards left or right to move them between stages",
        ],
        tip: "Customize your stage names to match your actual sales process. Go to Settings → Pipeline Settings and rename or reorder the stages.",
        path: "/deals",
        pathLabel: "Open the Deals Pipeline",
      },
      {
        number: 2,
        title: "Create Your First Deal",
        description: "A deal represents one sales opportunity — for example, a company you're trying to sell to. Creating a deal lets you track all the emails, calls, and notes related to that opportunity in one place.",
        illustration: "💼",
        subSteps: [
          "Click the \"+ New Deal\" button in the top-right corner",
          "Deal Name: describe the opportunity (e.g. \"Acme Corp — Annual Freight Contract\")",
          "Contact: search for and link an existing contact",
          "Deal Value: enter the estimated revenue in dollars",
          "Expected Close Date: your best guess for when it will close",
          "Stage: select where this deal currently is in your process",
          "Click \"Create Deal\" to save",
        ],
        tip: "Always link a deal to both a Contact and a Company. This automatically connects all emails, calls, and notes to the deal so nothing gets lost.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoLabel: "Watch: Creating Your First Deal (3 min)",
      },
      {
        number: 3,
        title: "Log Activities (Calls, Emails, Meetings)",
        description: "Every time you interact with a prospect — a phone call, email, meeting, or note — log it on the deal. This builds a complete history of the relationship and helps your team stay in sync.",
        illustration: "📝",
        subSteps: [
          "Click on any deal card to open the Deal Detail page",
          "Scroll down to the \"Activity\" section",
          "Click \"Log Activity\" and choose the type: Call, Email, Meeting, or Note",
          "Add your notes about what was discussed",
          "Set a follow-up date if needed",
          "Click \"Save\" — the activity appears in the timeline",
        ],
        tip: "Before any important call, click \"AI Meeting Prep\" on the Deal Detail page. The AI will summarize everything you know about the contact, their company, and the deal history — so you walk in prepared.",
      },
      {
        number: 4,
        title: "Close a Deal (Won or Lost)",
        description: "When a deal reaches its conclusion, mark it as Won or Lost. This updates your pipeline metrics and feeds data into your Win/Loss Analysis reports.",
        illustration: "🏆",
        subSteps: [
          "Drag the deal card to the \"Won\" or \"Lost\" column",
          "OR open the deal and click \"Mark as Won\" / \"Mark as Lost\"",
          "If marking as Lost: a dialog will ask for the loss reason (e.g. \"Price too high\", \"Chose competitor\")",
          "Enter the reason — this is required and powers your analytics",
          "Click \"Confirm\" to close the deal",
        ],
        tip: "The aging badge on each deal card shows how many days since the last update. If a card turns red, that deal is going cold — reach out immediately.",
      },
    ],
  },
  {
    id: "campaigns",
    icon: Megaphone,
    color: "rose",
    gradient: "from-rose-500 to-pink-600",
    title: "Launch Your First Campaign",
    subtitle: "Send targeted email campaigns to your contacts",
    estimatedTime: "10–15 min",
    steps: [
      {
        number: 1,
        title: "Before You Start: Email Setup Required",
        description: "Email campaigns require a verified SMTP account. If you haven't set one up yet, complete the \"Set Up Email Sending\" chapter first. You cannot send campaigns without it.",
        illustration: "⚠️",
        subSteps: [
          "Confirm you have a verified SMTP account (green checkmark in Settings → SMTP Accounts)",
          "Confirm your domain has SPF and DKIM records set up",
          "Confirm you have at least 20–50 contacts imported",
          "Once all three are done, you're ready to send campaigns",
        ],
        warning: "Sending campaigns without SPF/DKIM set up will result in most emails landing in spam. Do not skip the email authentication step.",
        path: "/campaigns",
        pathLabel: "Go to Campaigns",
      },
      {
        number: 2,
        title: "Create a New Campaign",
        description: "A campaign is a single email (or series of emails) sent to a specific group of contacts. Think of it like a newsletter or a sales outreach email.",
        illustration: "✍️",
        subSteps: [
          "Go to Campaigns → Email Campaigns in the sidebar",
          "Click \"+ New Campaign\"",
          "Campaign Name: internal name for your reference (contacts don't see this)",
          "From Account: select your verified SMTP account",
          "Subject Line: write a compelling subject (keep it under 50 characters)",
          "Email Body: write your email in the editor, or click \"AI Write\" to have the AI draft it",
        ],
        tip: "Avoid spam trigger words in your subject line: FREE, URGENT, ACT NOW, LIMITED TIME, $$, WINNER, GUARANTEED. These words cause Gmail and Outlook to flag your email as spam.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoLabel: "Watch: Writing Your First Campaign (4 min)",
      },
      {
        number: 3,
        title: "Choose Your Audience (Targeting)",
        description: "Don't send to your entire contact list — send to a targeted segment. The more relevant your email is to the recipient, the higher your open rate and the better your deliverability.",
        illustration: "🎯",
        subSteps: [
          "In the campaign editor, click the \"Audience\" tab",
          "Choose a filter: by Tag, Lead Status, Lifecycle Stage, Company, or Custom Filter",
          "Example: send only to contacts with Status = \"Qualified Lead\" and Industry = \"Transportation\"",
          "The audience count will update to show how many contacts match",
          "Start with 20–50 contacts for your first test campaign",
        ],
        tip: "Use tags to organize your contacts into groups before creating campaigns. For example, tag contacts as \"Hot Lead\", \"Cold Lead\", or \"Customer\" so you can target them precisely.",
      },
      {
        number: 4,
        title: "Send or Schedule Your Campaign",
        description: "You can send your campaign immediately or schedule it for a specific time. Timing matters — emails sent at the right time get significantly higher open rates.",
        illustration: "🚀",
        subSteps: [
          "Click \"Review & Send\" to see a final preview of your campaign",
          "Send Now: click \"Send Immediately\" to send right away",
          "Schedule: click \"Schedule for Later\" and pick a date and time",
          "Best times to send: Tuesday–Thursday, 9–11 AM or 1–3 PM in your recipients' timezone",
          "After sending, go to the Analytics tab to monitor open rates and clicks",
        ],
        tip: "A good open rate is 25%+. A good click rate is 3%+. If your open rate is below 15%, your subject line needs work. If emails are bouncing, your list needs cleaning.",
      },
    ],
  },
  {
    id: "ai",
    icon: Bot,
    color: "violet",
    gradient: "from-violet-500 to-purple-700",
    title: "Activate AI Features",
    subtitle: "Let the AI work for you automatically",
    estimatedTime: "5 min",
    steps: [
      {
        number: 1,
        title: "Meet Your AI Assistant",
        description: "The AI Assistant is like having a knowledgeable sales colleague available 24/7. It knows your entire CRM — every contact, deal, email, and activity. You can ask it questions, give it commands, and it will take action.",
        illustration: "💬",
        subSteps: [
          "Look for the glowing chat bubble icon in the bottom-right corner of any page",
          "Click it to open the AI Assistant panel (it slides in from the right)",
          "Type any question or command in the text box at the bottom",
          "Press Enter or click the send button",
          "The AI will respond in seconds with answers or take action",
        ],
        tip: "Try these commands: \"Which deals haven't been updated in 2 weeks?\", \"Draft a follow-up email for [Contact Name]\", \"How many deals did we close last month?\", \"Summarize the pipeline for this week\".",
      },
      {
        number: 2,
        title: "The AI Engine (Background Automation)",
        description: "The AI Engine runs 13 automated tasks in the background — things like detecting duplicate contacts, scoring leads, flagging stale deals, and identifying data quality issues. These run automatically every day.",
        illustration: "🤖",
        subSteps: [
          "Go to Developer → AI Engine in the sidebar",
          "You'll see a list of all 13 AI tasks and their last run time",
          "Green = task ran successfully. Yellow = running. Red = needs attention",
          "Click \"Run Now\" next to any task to trigger it immediately",
          "Click on a task to see what it found and what actions it took",
        ],
        tip: "The most valuable AI tasks to check first: Duplicate Detection (merges duplicate contacts), Lead Scorer (ranks your hottest leads), and Data Decay Alert (flags contacts with outdated information).",
        path: "/developer/ai-engine",
        pathLabel: "Open AI Engine",
      },
      {
        number: 3,
        title: "Ghost Sequences (AI-Powered Follow-Ups)",
        description: "Ghost Sequences are automated email sequences that follow up with leads on your behalf. You write the emails once, set the timing, and the AI sends them automatically based on each lead's behavior.",
        illustration: "👻",
        subSteps: [
          "Go to Campaigns → Ghost Sequences",
          "Click \"+ New Sequence\"",
          "Add 3–5 email steps with delays between them (e.g. Day 1, Day 3, Day 7, Day 14)",
          "For each step, write the email or click \"AI Write\" to generate it",
          "Assign contacts to the sequence — the AI handles the rest",
          "Monitor replies and engagement in the Sequence Analytics tab",
        ],
        warning: "Ghost Sequences require a verified SMTP account. Complete the Email Setup chapter before setting up sequences.",
        path: "/campaigns/sequences",
        pathLabel: "Go to Ghost Sequences",
      },
      {
        number: 4,
        title: "AI Insights on Your Dashboard",
        description: "Your Dashboard shows AI-generated insights in real time. These are actionable recommendations based on patterns in your data — not generic advice, but specific to your pipeline and contacts.",
        illustration: "📈",
        subSteps: [
          "Go to your Dashboard (click the home icon in the sidebar)",
          "Look at the AI Insights panel on the right side",
          "Each insight card shows a specific recommendation with a \"Take Action\" button",
          "Examples: \"3 deals haven't been updated in 14 days\", \"Lead score for [Contact] jumped 40 points\"",
          "Click \"Take Action\" to go directly to the relevant record",
        ],
        tip: "Check the Dashboard AI Insights every morning as part of your daily routine. It takes 2 minutes and ensures you never miss a hot lead or a deal going cold.",
        path: "/",
        pathLabel: "Go to Dashboard",
      },
    ],
  },
  {
    id: "team",
    icon: UserPlus,
    color: "sky",
    gradient: "from-sky-500 to-blue-600",
    title: "Invite Your Team",
    subtitle: "Add team members and set their roles",
    estimatedTime: "3–5 min",
    steps: [
      {
        number: 1,
        title: "Understanding User Roles",
        description: "Before inviting your team, understand what each role can do. Choosing the right role for each person ensures they see the right data and have the right level of access.",
        illustration: "👥",
        subSteps: [
          "Sales Rep: can see and manage their own contacts and deals only",
          "Account Manager: manages assigned accounts, can see company-wide contacts",
          "Sales Manager: sees their team's data, can run team reports",
          "Company Admin: full access to everything including settings and billing",
          "Coordinator: support role — can view and assist but not delete records",
        ],
        tip: "Start with the minimum permissions needed. You can always upgrade someone's role later, but it's harder to restrict access after they've already seen everything.",
        path: "/settings/team",
        pathLabel: "Go to Team Management",
      },
      {
        number: 2,
        title: "Send Team Invitations",
        description: "Invite your team members by email. They'll receive a link to create their account and will be automatically added to your CRM with the role you assigned.",
        illustration: "✉️",
        subSteps: [
          "Go to Settings → Team Management",
          "Click \"Invite Member\"",
          "Enter their email address",
          "Select their role from the dropdown",
          "Click \"Send Invite\" — they'll receive an email within 2 minutes",
          "The invite link expires in 48 hours — remind them to accept promptly",
        ],
        tip: "You can resend an expired invite from the Team Management page. Look for the \"Pending\" badge next to uninvited members and click \"Resend\".",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        videoLabel: "Watch: Inviting Your Team (2 min)",
      },
      {
        number: 3,
        title: "Set Up the Reporting Hierarchy",
        description: "After your team accepts their invites, set up who reports to whom. This controls what data each person can see and enables accurate team performance reports.",
        illustration: "🏗️",
        subSteps: [
          "Go to Settings → Team Management",
          "Click on a team member's name to open their profile",
          "Find the \"Reports To\" field and select their manager",
          "Repeat for each team member",
          "The hierarchy should flow: Company Admin → Sales Manager → Reps",
        ],
        tip: "Once the hierarchy is set, Sales Managers will automatically see their team's pipeline, activity, and performance metrics in the Dashboard — without needing to manually filter.",
      },
      {
        number: 4,
        title: "Assign Contacts and Deals to Team Members",
        description: "After your team is set up, assign existing contacts and deals to the right people. This ensures each rep sees their own pipeline when they log in.",
        illustration: "🔗",
        subSteps: [
          "Go to Contacts and use the bulk select checkboxes to select multiple contacts",
          "Click \"Bulk Actions\" → \"Reassign Owner\"",
          "Select the team member to assign them to",
          "Do the same in Deals → select deals → Bulk Actions → Reassign",
          "Each team member will now see their assigned records when they log in",
        ],
        tip: "Use the \"Round Robin\" assignment rule in Settings → Lead Assignment to automatically distribute new incoming leads evenly across your sales team.",
        path: "/contacts",
        pathLabel: "Go to Contacts",
      },
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────────────────
type WizardStep = "welcome" | "setup-guide" | "quick-setup" | "complete";

interface OnboardingWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingWizard({ onClose, onComplete }: OnboardingWizardProps) {
  const [wizardStep, setWizardStep] = useState<WizardStep>("welcome");
  const [activeChapter, setActiveChapter] = useState<string>("smtp");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());
  // ─── Progress persistence ──────────────────────────────────────────────────
  const { data: savedProgress } = trpc.onboarding.getProgress.useQuery();
  const initProgressMutation = trpc.onboarding.initProgress.useMutation();
  const completeStepMutation = trpc.onboarding.completeStep.useMutation();
  // Load saved progress from DB on mount
  useEffect(() => {
    if (savedProgress?.completedSteps) {
      const steps = savedProgress.completedSteps as string[];
      setCompletedChapters(new Set(steps));
    }
  }, [savedProgress]);

  // Quick setup state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [generatingLogo, setGeneratingLogo] = useState(false);
  const [logoApproved, setLogoApproved] = useState(false);
  const [logoCustomizeText, setLogoCustomizeText] = useState("");
  const [showLogoCustomize, setShowLogoCustomize] = useState(false);
  const [coName, setCoName] = useState("");
  const [coIndustry, setCoIndustry] = useState("Transportation");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("account_manager");
  const [quickStep, setQuickStep] = useState<"logo" | "company" | "invite" | "done">("logo");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [, navigate] = useLocation();
  const { data: myCompany } = trpc.tenants.myCompany.useQuery();
  const utils = trpc.useUtils();

  const generateLogoMutation = trpc.tenants.generateLogo.useMutation({
    onSuccess: (data) => {
      setLogoPreview(data.logoUrl);
      setGeneratingLogo(false);
      setLogoApproved(false);
      setShowLogoCustomize(false);
      setLogoCustomizeText("");
    },
    onError: () => { setGeneratingLogo(false); toast.error("Failed to generate logo. Please try again."); },
  });

  const uploadLogoMutation = trpc.tenants.uploadLogo.useMutation({
    onSuccess: (data) => { setLogoPreview(data.logoUrl); utils.tenants.myCompany.invalidate(); toast.success("Logo uploaded!"); },
    onError: () => toast.error("Failed to upload logo"),
  });

  const createInvite = trpc.invites.create.useMutation({
    onSuccess: () => { toast.success(`Invite sent to ${inviteEmail}!`); setQuickStep("done"); },
    onError: () => toast.error("Failed to send invite"),
  });

  const currentChapter = CHAPTERS.find(c => c.id === activeChapter) ?? CHAPTERS[0];
  const currentStep = currentChapter.steps[activeStepIndex];
  const totalSteps = currentChapter.steps.length;

  const markChapterComplete = (id: string) => {
    setCompletedChapters(prev => new Set(Array.from(prev).concat(id)));
    // Persist to DB
    completeStepMutation.mutate({ stepId: id });
    // Init record if it doesn't exist yet
    if (!savedProgress) {
      initProgressMutation.mutate();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-400 max-h-[90vh] flex flex-col">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-1.5 rounded-full hover:bg-stone-100 transition-colors">
          <X className="h-4 w-4 text-stone-400" />
        </button>

        {/* ═══════════════════════════════════════════════════════════
            WELCOME SCREEN
        ═══════════════════════════════════════════════════════════ */}
        {wizardStep === "welcome" && (
          <div className="p-8 text-center overflow-y-auto">
            {/* Hero */}
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-amber-500/30">
              <Rocket className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-black text-stone-800 mb-2">Welcome to AXIOM CRM</h2>
            <p className="text-stone-500 mb-6 max-w-md mx-auto text-sm leading-relaxed">
              You're about to have the most powerful sales tool in the industry working for you. Let's get everything set up — it's easier than you think.
            </p>

            {/* Chapter overview grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              {CHAPTERS.map((ch) => (
                <div key={ch.id} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${ch.gradient} flex items-center justify-center shrink-0`}>
                    <ch.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-700 truncate">{ch.title}</p>
                    <p className="text-[10px] text-stone-400">{ch.estimatedTime}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-8 rounded-xl shadow-lg shadow-amber-500/20 w-full"
                onClick={() => setWizardStep("setup-guide")}
              >
                <Sparkles className="h-5 w-5 mr-2" /> View Full Setup Guide
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full rounded-xl font-semibold"
                onClick={() => setWizardStep("quick-setup")}
              >
                <Rocket className="h-4 w-4 mr-2" /> Quick Setup (2 min)
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SETUP GUIDE — Chapter list + Step detail
        ═══════════════════════════════════════════════════════════ */}
        {wizardStep === "setup-guide" && (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left sidebar — chapter list */}
            <div className="w-52 shrink-0 bg-stone-50 border-r border-stone-100 overflow-y-auto py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 px-4 mb-3">Setup Chapters</p>
              {CHAPTERS.map((ch) => {
                const isActive = ch.id === activeChapter;
                const isDone = completedChapters.has(ch.id);
                return (
                  <button
                    key={ch.id}
                    onClick={() => { setActiveChapter(ch.id); setActiveStepIndex(0); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-all ${
                      isActive ? "bg-white border-r-2 border-amber-500 shadow-sm" : "hover:bg-stone-100"
                    }`}
                  >
                    <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${ch.gradient} flex items-center justify-center shrink-0`}>
                      <ch.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate ${isActive ? "text-stone-800" : "text-stone-600"}`}>{ch.title}</p>
                      <p className="text-[10px] text-stone-400">{ch.estimatedTime}</p>
                    </div>
                    {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                  </button>
                );
              })}

              {/* Back to welcome */}
              <div className="px-4 mt-4 pt-4 border-t border-stone-200">
                <button
                  onClick={() => setWizardStep("welcome")}
                  className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" /> Back
                </button>
              </div>
            </div>

            {/* Right content — step detail */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Chapter header */}
              <div className={`bg-gradient-to-r ${currentChapter.gradient} px-6 py-4 text-white`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <currentChapter.icon className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80">{currentChapter.title}</span>
                  <Badge className="ml-auto bg-white/20 text-white border-0 text-[10px]">{currentChapter.estimatedTime}</Badge>
                </div>
                <p className="text-sm opacity-90">{currentChapter.subtitle}</p>
              </div>

              {/* Step progress dots */}
              <div className="flex items-center gap-1.5 px-6 py-3 border-b border-stone-100 bg-white">
                {currentChapter.steps.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStepIndex(i)}
                    className={`flex items-center gap-1.5 transition-all ${i === activeStepIndex ? "opacity-100" : "opacity-50 hover:opacity-75"}`}
                  >
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                      i < activeStepIndex ? "bg-emerald-500 border-emerald-500 text-white" :
                      i === activeStepIndex ? `bg-gradient-to-br ${currentChapter.gradient} border-transparent text-white` :
                      "bg-white border-stone-300 text-stone-400"
                    }`}>
                      {i < activeStepIndex ? <Check className="h-2.5 w-2.5" /> : s.number}
                    </div>
                    {i < currentChapter.steps.length - 1 && (
                      <div className={`h-0.5 w-6 rounded-full ${i < activeStepIndex ? "bg-emerald-300" : "bg-stone-200"}`} />
                    )}
                  </button>
                ))}
                <span className="ml-auto text-[10px] text-stone-400 font-medium">Step {activeStepIndex + 1} of {totalSteps}</span>
              </div>

              {/* Step content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {/* Step title */}
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${currentChapter.gradient} flex items-center justify-center shrink-0`}>
                    <span className="text-white text-xs font-black">{currentStep.number}</span>
                  </div>
                  <h3 className="text-lg font-bold text-stone-800 leading-tight">
                    {currentStep.title}
                  </h3>
                </div>

                {/* Inline diagram */}
                <StepDiagram chapterId={currentChapter.id} stepNumber={currentStep.number} gradient={currentChapter.gradient} />

                {/* Description */}
                <p className="text-sm text-stone-600 leading-relaxed">
                  {currentStep.description}
                </p>

                {/* Sub-steps checklist */}
                {currentStep.subSteps && currentStep.subSteps.length > 0 && (
                  <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
                    <div className="px-4 py-2 bg-stone-100 border-b border-stone-200">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Step-by-Step Instructions</p>
                    </div>
                    <ol className="divide-y divide-stone-100">
                      {currentStep.subSteps.map((sub, i) => (
                        <li key={i} className="flex items-start gap-3 px-4 py-3">
                          <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 bg-gradient-to-br ${currentChapter.gradient} text-white`}>
                            {i + 1}
                          </span>
                          <span className="text-xs text-stone-700 leading-relaxed">{sub}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Warning */}
                {currentStep.warning && (
                  <div className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed"><strong>Important:</strong> {currentStep.warning}</p>
                  </div>
                )}

                {/* Tip */}
                {currentStep.tip && (
                  <div className="flex gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <Lightbulb className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 leading-relaxed"><strong>Pro Tip:</strong> {currentStep.tip}</p>
                  </div>
                )}

                {/* Video tutorial */}
                {currentStep.videoUrl && (
                  <div className="rounded-xl overflow-hidden border border-stone-200 bg-stone-900">
                    <div className="px-4 py-2 bg-stone-800 flex items-center gap-2">
                      <PlayCircle className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-[11px] font-semibold text-stone-300">{currentStep.videoLabel ?? "Video Tutorial"}</span>
                    </div>
                    <div className="relative" style={{ paddingBottom: "56.25%" }}>
                      <iframe
                        src={currentStep.videoUrl}
                        title={currentStep.videoLabel ?? "Tutorial"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                  </div>
                )}

                {/* Navigation shortcut */}
                {currentStep.path && (
                  <button
                    onClick={() => { navigate(currentStep.path!); onClose(); }}
                    className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 hover:bg-amber-100 transition-colors w-full justify-center"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {currentStep.pathLabel ?? "Go there now"}
                  </button>
                )}
              </div>

              {/* Step navigation footer */}
              <div className="px-6 py-4 border-t border-stone-100 bg-white flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeStepIndex === 0}
                  onClick={() => setActiveStepIndex(i => Math.max(0, i - 1))}
                  className="text-stone-500"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>

                {activeStepIndex < totalSteps - 1 ? (
                  <Button
                    size="sm"
                    className={`bg-gradient-to-r ${currentChapter.gradient} text-white font-semibold px-5 rounded-xl`}
                    onClick={() => setActiveStepIndex(i => i + 1)}
                  >
                    Next Step <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-5 rounded-xl"
                    onClick={() => {
                      markChapterComplete(currentChapter.id);
                      // Advance to next chapter
                      const idx = CHAPTERS.findIndex(c => c.id === currentChapter.id);
                      if (idx < CHAPTERS.length - 1) {
                        setActiveChapter(CHAPTERS[idx + 1].id);
                        setActiveStepIndex(0);
                      } else {
                        setWizardStep("complete");
                      }
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Chapter Complete!
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            QUICK SETUP (original 3-step flow, streamlined)
        ═══════════════════════════════════════════════════════════ */}
        {wizardStep === "quick-setup" && (
          <div className="p-8 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
              <button onClick={() => setWizardStep("welcome")} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
                <ChevronLeft className="h-4 w-4 text-stone-500" />
              </button>
              <div>
                <h3 className="text-lg font-bold text-stone-800">Quick Setup</h3>
                <p className="text-xs text-stone-500">Logo → Company → Team — done in 2 minutes</p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-6">
              {(["logo", "company", "invite"] as const).map((s, i) => {
                const labels = ["Logo", "Company", "Team"];
                const done = (quickStep === "company" && i === 0) || (quickStep === "invite" && i <= 1) || (quickStep === "done" && i <= 2);
                const active = quickStep === s;
                return (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                      done ? "bg-emerald-100 text-emerald-700" : active ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-400"
                    }`}>
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span className={`text-xs font-medium ${active ? "text-stone-800" : "text-stone-400"}`}>{labels[i]}</span>
                    {i < 2 && <div className={`flex-1 h-0.5 rounded-full ${done ? "bg-emerald-300" : "bg-stone-200"}`} />}
                  </div>
                );
              })}
            </div>

            {/* Logo step */}
            {quickStep === "logo" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-stone-800 mb-1">Add Your Company Logo</h4>
                  <p className="text-sm text-stone-500">Upload your logo or let AI generate one. You'll see a preview before anything is applied.</p>
                </div>

                {/* Generating spinner */}
                {generatingLogo && (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="h-16 w-16 rounded-2xl bg-purple-50 flex items-center justify-center">
                      <Wand2 className="h-8 w-8 text-purple-500 animate-pulse" />
                    </div>
                    <p className="text-sm font-semibold text-stone-700">Creating your logo...</p>
                    <p className="text-xs text-stone-400">This takes 10–20 seconds. Please wait.</p>
                  </div>
                )}

                {/* Preview state — show after generation or upload */}
                {!generatingLogo && logoPreview && !logoApproved && (
                  <div className="space-y-3">
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-2xl border-2 border-purple-200 bg-purple-50/30 p-5 shadow-sm">
                        <img src={logoPreview} alt="Logo preview" className="h-32 w-32 object-contain" />
                      </div>
                      <p className="text-sm text-stone-600 text-center">Here's your logo preview. Do you want to use it?</p>
                    </div>

                    {/* Customize input */}
                    {showLogoCustomize && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-stone-600">Describe changes (colors, style, icon...)</Label>
                        <textarea
                          value={logoCustomizeText}
                          onChange={e => setLogoCustomizeText(e.target.value)}
                          placeholder="e.g. Use deep blue and gold. Add a truck icon. Bold and modern."
                          className="w-full text-sm px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none min-h-[72px]"
                        />
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl"
                          disabled={!logoCustomizeText.trim() || generateLogoMutation.isPending}
                          onClick={() => {
                            setGeneratingLogo(true);
                            generateLogoMutation.mutate({ companyName: myCompany?.name || "AXIOM", industry: logoCustomizeText.trim() });
                          }}
                        >
                          <Wand2 className="h-3.5 w-3.5 mr-1.5" /> Regenerate with Changes
                        </Button>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold rounded-xl"
                        onClick={() => {
                          // Apply logo to company
                          uploadLogoMutation.mutate({ dataUrl: logoPreview!, mimeType: "image/png" });
                          setLogoApproved(true);
                        }}
                        disabled={uploadLogoMutation.isPending}
                      >
                        {uploadLogoMutation.isPending ? "Applying..." : "✓ Yes, Use This Logo"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                        onClick={() => setShowLogoCustomize(v => !v)}
                      >
                        <Wand2 className="h-3.5 w-3.5 mr-1.5" /> {showLogoCustomize ? "Hide Customize" : "Customize It"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-stone-400"
                        onClick={() => {
                          setLogoPreview(null);
                          setShowLogoCustomize(false);
                          setLogoCustomizeText("");
                        }}
                      >
                        ↺ Try Again
                      </Button>
                    </div>
                  </div>
                )}

                {/* Approved state */}
                {!generatingLogo && logoPreview && logoApproved && (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-50 border-2 border-emerald-200 overflow-hidden flex items-center justify-center">
                      <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                      <CheckCircle2 className="h-4 w-4" /> Logo applied!
                    </div>
                  </div>
                )}

                {/* Initial state — no preview yet */}
                {!generatingLogo && !logoPreview && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-stone-200 flex items-center justify-center bg-stone-50">
                      <ImageIcon className="h-8 w-8 text-stone-300" />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs">
                        <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => { setGeneratingLogo(true); generateLogoMutation.mutate({ companyName: myCompany?.name || "AXIOM" }); }}
                        disabled={generatingLogo}
                        className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <Wand2 className="h-3.5 w-3.5 mr-1.5" /> AI Generate
                      </Button>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setQuickStep("company")} className="text-stone-400 text-sm">Skip</Button>
                  <Button
                    onClick={() => setQuickStep("company")}
                    disabled={generatingLogo}
                    className="bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold px-6 rounded-xl"
                  >
                    {logoApproved ? "Continue" : "Skip Logo & Continue"} <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Company step */}
            {quickStep === "company" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-stone-800 mb-1">Confirm Your Company</h4>
                  <p className="text-sm text-stone-500">Every contact and deal is linked to your company profile.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-stone-600">Company Name</Label>
                    <Input value={coName || myCompany?.name || ""} onChange={(e) => setCoName(e.target.value)} placeholder="e.g., Swift Logistics" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-stone-600">Industry</Label>
                    <Select value={coIndustry} onValueChange={setCoIndustry}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Transportation", "Logistics", "Warehousing", "Manufacturing", "Technology", "Finance", "Healthcare", "Real Estate", "Other"].map(i => (
                          <SelectItem key={i} value={i}>{i}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setQuickStep("logo")} className="text-stone-500"><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <Button onClick={() => setQuickStep("invite")} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-6 rounded-xl">
                    Continue <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Invite step */}
            {quickStep === "invite" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-stone-800 mb-1">Invite Your First Team Member</h4>
                  <p className="text-sm text-stone-500">Great CRMs are team sports. Invite someone now or skip and do it later.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-stone-600">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                      <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.com" className="pl-9" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-stone-600">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="account_manager">Account Manager</SelectItem>
                        <SelectItem value="coordinator">Coordinator</SelectItem>
                        <SelectItem value="sales_manager">Sales Manager</SelectItem>
                        <SelectItem value="office_manager">Office Manager</SelectItem>
                        <SelectItem value="company_admin">Company Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setQuickStep("company")} className="text-stone-500"><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setWizardStep("complete")} className="text-stone-400 text-sm">Skip</Button>
                    <Button
                      onClick={() => {
                        if (!inviteEmail.trim()) { toast.error("Email is required"); return; }
                        if (!myCompany?.id) { toast.error("Company not found"); return; }
                        createInvite.mutate({ email: inviteEmail, companyId: myCompany.id, role: inviteRole as any });
                      }}
                      disabled={createInvite.isPending}
                      className="bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold px-6 rounded-xl"
                    >
                      {createInvite.isPending ? "Sending..." : "Send Invite"} <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            COMPLETE SCREEN
        ═══════════════════════════════════════════════════════════ */}
        {wizardStep === "complete" && (
          <div className="p-8 text-center overflow-y-auto">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/30">
              <PartyPopper className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-stone-800 mb-2">You're All Set!</h2>
            <p className="text-stone-500 mb-5 max-w-sm mx-auto text-sm">
              Your CRM is ready to go. The setup guide is always available from the Help Center whenever you need it.
            </p>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-2 mb-5 text-left">
              {[
                { icon: "📧", label: "Email Setup", desc: "Connect your SMTP", path: "/settings/email-infrastructure" },
                { icon: "👥", label: "Import Contacts", desc: "Upload your CSV", path: "/settings" },
                { icon: "💼", label: "Build Pipeline", desc: "Create your first deal", path: "/deals" },
                { icon: "🤖", label: "AI Engine", desc: "See what's running", path: "/developer/ai-engine" },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.path); onClose(); }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100 hover:bg-stone-100 transition-colors text-left"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-stone-700">{item.label}</p>
                    <p className="text-[10px] text-stone-400">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold px-8 rounded-xl shadow-lg shadow-emerald-500/20 w-full"
                onClick={onComplete}
              >
                <Sparkles className="h-5 w-5 mr-2" /> Go to My Dashboard
              </Button>
              <Button
                variant="ghost"
                className="w-full text-stone-500 text-sm"
                onClick={() => { setWizardStep("setup-guide"); setActiveChapter("smtp"); setActiveStepIndex(0); }}
              >
                View Full Setup Guide
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
