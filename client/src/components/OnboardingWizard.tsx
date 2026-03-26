import { useState, useRef } from "react";
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
  videoLabel?: string;
};

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
        description: "From the Dashboard, click the camera icon next to your company logo in the top-left sidebar. A dialog will pop up with logo options.",
        illustration: "🖼️",
        tip: "Your logo appears in the sidebar, email footers, and all exported reports — so a clean, square image works best.",
      },
      {
        number: 2,
        title: "Generate or Upload Your Logo",
        description: "Click \"AI Generate\" to have the AI create a professional logo based on your company name and industry — no design skills needed. Or click \"Upload\" to use your own PNG/JPG file (recommended size: 512×512 px or larger).",
        illustration: "✨",
        tip: "After generating, click \"Customize It\" to describe specific colors, styles, or icons you want. The AI will regenerate to match your vision.",
      },
      {
        number: 3,
        title: "Apply and Set as Favicon",
        description: "Once you're happy with the preview, click \"Yes, Use This Logo\" to apply it. Then click \"Set as Favicon\" to also use it as the browser tab icon.",
        illustration: "✅",
        tip: "You can return to the logo dialog anytime from the Dashboard to update your logo or browse your logo history.",
      },
    ],
  },
  {
    id: "smtp",
    icon: Server,
    color: "blue",
    gradient: "from-blue-500 to-cyan-600",
    title: "Set Up Email Sending",
    subtitle: "Connect your SMTP server to send emails",
    estimatedTime: "5 min",
    steps: [
      {
        number: 1,
        title: "Navigate to Email Infrastructure",
        description: "Go to Settings → Email Infrastructure → SMTP Accounts in the left sidebar. This is where all your sending accounts live.",
        illustration: "📬",
        path: "/settings/email-infrastructure",
        pathLabel: "Go to SMTP Settings",
        tip: "You can add multiple SMTP accounts and rotate between them — great for high-volume sending or multiple domains.",
      },
      {
        number: 2,
        title: "Click \"Add SMTP Account\"",
        description: "Fill in your mail server details:\n• Host: your mail server (e.g. mail.yourdomain.com or smtp.gmail.com)\n• Port: 587 (TLS) or 465 (SSL) — avoid port 25\n• Username: your full email address\n• Password: your email password or app-specific password",
        illustration: "🔧",
        warning: "If using Gmail, you must create an App Password in your Google Account under Security → 2-Step Verification → App Passwords. Your regular Gmail password will not work.",
        tip: "For best deliverability, use an email address on your own domain (e.g. sales@yourcompany.com) rather than a free Gmail/Yahoo address.",
      },
      {
        number: 3,
        title: "Test the Connection",
        description: "Click \"Test Connection\" — you should see a green checkmark within a few seconds. If it fails, double-check your hostname, port, and credentials. Common fix: make sure your mail provider allows SMTP access (some require enabling it in account settings).",
        illustration: "🟢",
        tip: "After testing, send yourself a test email from the SMTP account to confirm it lands in your inbox (not spam).",
      },
      {
        number: 4,
        title: "Set Up Domain Authentication (SPF/DKIM)",
        description: "Go to Settings → Email Infrastructure → Domain Authentication. Add your sending domain and follow the DNS record instructions provided. This tells email providers your emails are legitimate and dramatically improves deliverability.",
        illustration: "🔐",
        warning: "Skipping domain authentication is the #1 cause of emails landing in spam. It takes about 10 minutes to set up and makes a huge difference.",
        path: "/settings/email-infrastructure",
        pathLabel: "Go to Domain Auth",
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
    estimatedTime: "5 min",
    steps: [
      {
        number: 1,
        title: "Prepare Your CSV File",
        description: "Export your contacts from your current system (Excel, Google Sheets, old CRM) as a CSV file. Make sure you have columns for: First Name, Last Name, Email, Phone, Company Name. Extra columns like Job Title, City, Lead Source are also supported.",
        illustration: "📊",
        tip: "Download our import template from Settings → Import & Export → Download Template to see the exact column format expected.",
        path: "/settings",
        pathLabel: "Go to Import & Export",
      },
      {
        number: 2,
        title: "Upload Your CSV",
        description: "Go to Settings → Import & Export → Import Contacts. Click \"Choose File\", select your CSV, then click \"Upload\". The system will show you a preview of the first few rows and let you map your columns to the correct fields.",
        illustration: "⬆️",
        tip: "You can import up to 10,000 contacts at once. For larger lists, split them into batches.",
      },
      {
        number: 3,
        title: "Map Your Columns",
        description: "The importer will auto-detect common column names. For any unrecognized columns, use the dropdown to manually match them to the correct CRM field. You can also choose to skip columns you don't need.",
        illustration: "🗺️",
        tip: "The \"Lead Source\" field is important — set it to \"Import\" or the name of your previous system so you can track where contacts came from.",
      },
      {
        number: 4,
        title: "Review and Confirm",
        description: "After mapping, you'll see a summary showing how many contacts will be created vs. updated (if duplicates are detected). Click \"Import\" to start. Large imports may take a minute or two.",
        illustration: "✅",
        tip: "After importing, go to Contacts and use the filter bar to find your imported contacts. Check a few records to make sure the data looks correct.",
      },
    ],
  },
  {
    id: "pipeline",
    icon: Briefcase,
    color: "amber",
    gradient: "from-amber-500 to-orange-600",
    title: "Build Your Sales Pipeline",
    subtitle: "Set up deal stages and create your first deal",
    estimatedTime: "5 min",
    steps: [
      {
        number: 1,
        title: "Review Your Pipeline Stages",
        description: "Go to Deals in the sidebar. You'll see a Kanban board with default stages: Lead In → Qualified → Proposal → Negotiation → Closed Won / Closed Lost. These stages represent your sales process.",
        illustration: "📋",
        path: "/deals",
        pathLabel: "Go to Deals",
        tip: "You can customize stage names in Settings → Pipeline Settings to match your exact sales process.",
      },
      {
        number: 2,
        title: "Create Your First Deal",
        description: "Click the \"+ New Deal\" button (top right). Fill in:\n• Deal Name (e.g. \"Acme Corp — Q2 Freight Contract\")\n• Contact: link it to an existing contact\n• Deal Value: estimated revenue\n• Expected Close Date\n• Stage: where it is in your pipeline right now",
        illustration: "💼",
        tip: "Always attach a deal to a contact and company. This links all emails, calls, and notes to the deal automatically.",
      },
      {
        number: 3,
        title: "Log Activities on the Deal",
        description: "Open the deal by clicking on it. In the Activity section, you can log calls, emails, meetings, and notes. Every interaction is timestamped and visible to your whole team.",
        illustration: "📝",
        tip: "Use the AI Meeting Prep feature (on the deal detail page) before any important call — it pulls together everything you know about the contact and company.",
      },
      {
        number: 4,
        title: "Move Deals Through Stages",
        description: "Drag and drop deal cards between columns on the Kanban board as they progress. When marking a deal as \"Lost\", you'll be prompted to enter a loss reason — this data powers your Win/Loss Analysis reports.",
        illustration: "➡️",
        tip: "The aging badge on each card shows how many days since the last update. Red means a deal is going cold — take action!",
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
    estimatedTime: "10 min",
    steps: [
      {
        number: 1,
        title: "Go to Email Campaigns",
        description: "Navigate to Campaigns → Email Campaigns in the sidebar. This is where you create, schedule, and track all your outbound email campaigns.",
        illustration: "📧",
        path: "/campaigns",
        pathLabel: "Go to Campaigns",
        warning: "You must have at least one verified SMTP account set up before you can send campaigns. Complete the Email Setup chapter first.",
      },
      {
        number: 2,
        title: "Create a New Campaign",
        description: "Click \"+ New Campaign\". Give it a name, select your SMTP sending account, and write your subject line. Use the rich text editor to compose your email body — or click \"AI Write\" to have the AI draft it based on your goal.",
        illustration: "✍️",
        tip: "Keep subject lines under 50 characters and avoid words like \"FREE\", \"URGENT\", or excessive exclamation marks — these trigger spam filters.",
      },
      {
        number: 3,
        title: "Select Your Audience",
        description: "Choose which contacts receive this campaign. You can select by: tag, lead status, lifecycle stage, company, or a custom filter. Always send to a targeted segment — blasting your entire list hurts deliverability.",
        illustration: "🎯",
        tip: "Start with a small test segment of 20–50 contacts to verify the email looks correct before sending to your full list.",
      },
      {
        number: 4,
        title: "Schedule and Send",
        description: "Choose to send immediately or schedule for a specific date and time. Best send times are Tuesday–Thursday, 9–11 AM in your recipient's timezone. After sending, monitor open rates, click rates, and bounces in the Campaign Analytics tab.",
        illustration: "🚀",
        tip: "An open rate above 25% is good. A bounce rate above 5% means your list needs cleaning — use the Bounce Management tool in Email Infrastructure.",
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
    estimatedTime: "3 min",
    steps: [
      {
        number: 1,
        title: "Open the AI Engine Panel",
        description: "Go to Developer → AI Engine in the sidebar. This panel shows all 13 AI background tasks that run automatically — from duplicate detection to lead scoring to data decay alerts.",
        illustration: "🤖",
        path: "/developer/ai-engine",
        pathLabel: "Go to AI Engine",
        tip: "All AI tasks run on a schedule automatically. You can also trigger any task manually by clicking the \"Run Now\" button next to it.",
      },
      {
        number: 2,
        title: "Use the AI Assistant",
        description: "Click the chat bubble icon (bottom right of any page) to open the AI Assistant. Ask it anything: \"Which deals are going cold?\", \"Draft a follow-up email for John Smith\", \"Summarize my pipeline this week\". It has full context of your CRM data.",
        illustration: "💬",
        tip: "The AI Assistant can write emails, summarize contacts, explain features, and give you sales coaching — treat it like a knowledgeable colleague.",
      },
      {
        number: 3,
        title: "Enable Ghost Sequences",
        description: "Go to Campaigns → Ghost Sequences. These are AI-powered drip sequences that automatically follow up with leads based on their behavior. Set up a sequence once and the AI handles the timing and personalization.",
        illustration: "👻",
        warning: "Ghost Sequences require a verified SMTP account and at least one active contact list. Make sure email setup is complete first.",
        path: "/campaigns/sequences",
        pathLabel: "Go to Ghost Sequences",
      },
      {
        number: 4,
        title: "Review AI Insights on the Dashboard",
        description: "Return to your Dashboard. The AI Insights panel (right side) shows real-time recommendations: contacts to follow up with, deals at risk, pipeline health score, and suggested next actions. Check this daily.",
        illustration: "📈",
        tip: "The Win Probability score on each deal is calculated by the AI based on deal age, activity frequency, contact engagement, and historical win patterns.",
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
    estimatedTime: "3 min",
    steps: [
      {
        number: 1,
        title: "Go to Team Management",
        description: "Navigate to Settings → Team Management. Here you can see all active users, their roles, and their activity levels.",
        illustration: "👥",
        path: "/settings/team",
        pathLabel: "Go to Team Management",
        tip: "Each user role has different permissions. Sales Reps can only see their own contacts; Managers see their team; Admins see everything.",
      },
      {
        number: 2,
        title: "Send Invitations",
        description: "Click \"Invite Member\". Enter their email address and select their role:\n• Sales Rep — front-line sellers\n• Account Manager — manages existing accounts\n• Sales Manager — oversees a team of reps\n• Company Admin — full access to all settings\n• Coordinator — support role, limited access",
        illustration: "✉️",
        tip: "The invited person will receive an email with a link to create their account. The link expires in 48 hours.",
      },
      {
        number: 3,
        title: "Assign Manager Relationships",
        description: "After a user accepts their invite, go to their profile and set their \"Reports To\" manager. This controls whose data they can see and enables manager-level reporting in the Dashboard.",
        illustration: "🏗️",
        tip: "The hierarchy flows: Company Admin → Sales Manager → Account Manager / Sales Rep. Set this up correctly for accurate team performance reports.",
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

  // Quick setup state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [generatingLogo, setGeneratingLogo] = useState(false);
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
    onSuccess: (data) => { setLogoPreview(data.logoUrl); setGeneratingLogo(false); toast.success("Logo generated!"); },
    onError: () => { setGeneratingLogo(false); toast.error("Failed to generate logo"); },
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
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {/* Illustration + title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl shrink-0 mt-0.5">{currentStep.illustration}</div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-800 leading-tight">
                      Step {currentStep.number}: {currentStep.title}
                    </h3>
                  </div>
                </div>

                {/* Description — handle newlines */}
                <div className="text-sm text-stone-600 leading-relaxed mb-4 whitespace-pre-line bg-stone-50 rounded-xl p-4 border border-stone-100">
                  {currentStep.description}
                </div>

                {/* Warning */}
                {currentStep.warning && (
                  <div className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-3">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">{currentStep.warning}</p>
                  </div>
                )}

                {/* Tip */}
                {currentStep.tip && (
                  <div className="flex gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 mb-3">
                    <Lightbulb className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 leading-relaxed"><strong>Pro Tip:</strong> {currentStep.tip}</p>
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
                  <p className="text-sm text-stone-500">Upload your logo or let AI generate one from your company name.</p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-stone-200 flex items-center justify-center bg-stone-50 overflow-hidden">
                    {logoPreview ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" /> : <ImageIcon className="h-8 w-8 text-stone-300" />}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs">
                      <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setGeneratingLogo(true); generateLogoMutation.mutate({ companyName: myCompany?.name || "AXIOM" }); }} disabled={generatingLogo} className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50">
                      <Wand2 className="h-3.5 w-3.5 mr-1.5" /> {generatingLogo ? "Generating..." : "AI Generate"}
                    </Button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setQuickStep("company")} className="text-stone-400 text-sm">Skip</Button>
                  <Button onClick={() => {
                    if (logoFile) {
                      const reader = new FileReader();
                      reader.onload = (ev) => uploadLogoMutation.mutate({ dataUrl: ev.target?.result as string, mimeType: logoFile.type });
                      reader.readAsDataURL(logoFile);
                    }
                    setQuickStep("company");
                  }} className="bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold px-6 rounded-xl">
                    Save & Continue <ArrowRight className="h-4 w-4 ml-2" />
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
