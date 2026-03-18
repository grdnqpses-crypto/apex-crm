import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Building2, Users, CheckCircle2, ArrowRight,
  Sparkles, Rocket, PartyPopper, X, ChevronLeft,
  ImageIcon, Upload, UserPlus, Mail, Wand2,
} from "lucide-react";

type Step = "welcome" | "logo" | "company" | "invite" | "complete";

interface OnboardingWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingWizard({ onClose, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<Step>("welcome");

  // Logo step
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [generatingLogo, setGeneratingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Company step
  const [coName, setCoName] = useState("");
  const [coIndustry, setCoIndustry] = useState("Transportation");

  // Invite step
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("account_manager");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");

  const { data: myCompany } = trpc.tenants.myCompany.useQuery();
  const utils = trpc.useUtils();

  const updateBranding = trpc.tenants.updateBranding.useMutation({
    onSuccess: () => {
      utils.tenants.myCompany.invalidate();
      toast.success("Logo saved!");
    },
    onError: () => toast.error("Failed to save logo"),
  });

  const generateLogoMutation = trpc.tenants.generateLogo.useMutation({
    onSuccess: (data) => {
      setLogoPreview(data.logoUrl);
      setGeneratingLogo(false);
      toast.success("Logo generated!");
    },
    onError: () => {
      setGeneratingLogo(false);
      toast.error("Failed to generate logo");
    },
  });

  const uploadLogoMutation = trpc.tenants.uploadLogo.useMutation({
    onSuccess: (data) => {
      setLogoPreview(data.logoUrl);
      utils.tenants.myCompany.invalidate();
      toast.success("Logo uploaded!");
    },
    onError: () => toast.error("Failed to upload logo"),
  });

  const createInvite = trpc.invites.create.useMutation({
    onSuccess: () => {
      toast.success(`Invite sent to ${inviteEmail}!`);
      setStep("complete");
    },
    onError: () => toast.error("Failed to send invite"),
  });

  const steps = [
    { key: "logo", label: "Logo", icon: ImageIcon, color: "purple" },
    { key: "company", label: "Company", icon: Building2, color: "amber" },
    { key: "invite", label: "Team", icon: UserPlus, color: "blue" },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      uploadLogoMutation.mutate({ dataUrl, mimeType: logoFile.type });
    };
    reader.readAsDataURL(logoFile);
  };

  const handleGenerateLogo = () => {
    const name = myCompany?.name || coName || "Apex";
    setGeneratingLogo(true);
    generateLogoMutation.mutate({ companyName: name });
  };

  const handleSaveLogo = () => {
    if (logoPreview && !logoFile) {
      // Already saved via generate
      setStep("company");
    } else if (logoFile) {
      handleUploadLogo();
      setTimeout(() => setStep("company"), 1500);
    } else {
      setStep("company");
    }
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) { toast.error("Email is required"); return; }
    if (!myCompany?.id) { toast.error("Company not found"); return; }
    createInvite.mutate({
      email: inviteEmail,
      companyId: myCompany.id,
      role: inviteRole as "account_manager" | "coordinator" | "sales_manager" | "office_manager" | "company_admin",
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" />
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-400">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="h-4 w-4 text-stone-400" />
        </button>

        {/* ═══ WELCOME STEP ═══ */}
        {step === "welcome" && (
          <div className="p-8 text-center">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-stone-800 mb-2">Welcome to Apex CRM</h2>
            <p className="text-stone-500 mb-6 max-w-sm mx-auto">
              Let's get your CRM set up in under 2 minutes. We'll add your logo, confirm your company details, and invite your first team member.
            </p>
            <div className="flex items-center justify-center gap-4 mb-8">
              {steps.map((s, i) => (
                <div key={s.key} className="flex items-center gap-2">
                  <div className={`h-10 w-10 rounded-xl bg-${s.color}-100 flex items-center justify-center`}>
                    <s.icon className={`h-5 w-5 text-${s.color}-600`} />
                  </div>
                  <span className="text-xs font-medium text-stone-600">{s.label}</span>
                  {i < steps.length - 1 && <ArrowRight className="h-3 w-3 text-stone-300 ml-2" />}
                </div>
              ))}
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-amber-500/20"
              onClick={() => setStep("logo")}
            >
              <Sparkles className="h-5 w-5 mr-2" /> Let's Get Started
            </Button>
          </div>
        )}

        {/* ═══ PROGRESS BAR ═══ */}
        {(step === "logo" || step === "company" || step === "invite") && (
          <div className="px-8 pt-6 pb-4">
            <div className="flex items-center gap-2 mb-4">
              {steps.map((s, i) => (
                <div key={s.key} className="flex items-center gap-2 flex-1">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    i < currentStepIndex ? "bg-emerald-100" :
                    i === currentStepIndex ? `bg-${s.color}-100` : "bg-stone-100"
                  }`}>
                    {i < currentStepIndex ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <s.icon className={`h-4 w-4 ${i === currentStepIndex ? `text-${s.color}-600` : "text-stone-400"}`} />
                    )}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded-full ${i < currentStepIndex ? "bg-emerald-300" : "bg-stone-200"}`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Step {currentStepIndex + 1} of 3
            </p>
          </div>
        )}

        {/* ═══ LOGO STEP ═══ */}
        {step === "logo" && (
          <div className="px-8 pb-8">
            <h3 className="text-xl font-bold text-stone-800 mb-1">Add Your Company Logo</h3>
            <p className="text-sm text-stone-500 mb-5">Your logo appears in the sidebar and throughout the CRM. Upload one or let AI create it.</p>

            {/* Logo preview */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-stone-200 flex items-center justify-center bg-stone-50 overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-stone-300" />
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateLogo}
                  disabled={generatingLogo}
                  className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                  {generatingLogo ? "Generating..." : "AI Generate"}
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep("welcome")} className="text-stone-500">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep("company")} className="text-stone-400 text-sm">
                  Skip for now
                </Button>
                <Button
                  onClick={handleSaveLogo}
                  disabled={uploadLogoMutation.isPending}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-6 rounded-xl"
                >
                  {uploadLogoMutation.isPending ? "Saving..." : "Save & Continue"} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ COMPANY STEP ═══ */}
        {step === "company" && (
          <div className="px-8 pb-8">
            <h3 className="text-xl font-bold text-stone-800 mb-1">Confirm Your Company</h3>
            <p className="text-sm text-stone-500 mb-5">
              {myCompany?.name
                ? `We found your company: ${myCompany.name}. Confirm the details below.`
                : "Tell us about your company. Every contact and deal is linked to a company."}
            </p>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-stone-600">Company Name *</Label>
                <Input
                  value={coName || myCompany?.name || ""}
                  onChange={(e) => setCoName(e.target.value)}
                  placeholder="e.g., Swift Logistics"
                  className="mt-1"
                />
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
            <div className="flex items-center justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep("logo")} className="text-stone-500">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setStep("invite")}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 rounded-xl"
              >
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ═══ INVITE STEP ═══ */}
        {step === "invite" && (
          <div className="px-8 pb-8">
            <h3 className="text-xl font-bold text-stone-800 mb-1">Invite Your First Team Member</h3>
            <p className="text-sm text-stone-500 mb-5">
              Great CRMs are team sports. Invite someone now or skip and do it later from Team Management.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-stone-600">First Name</Label>
                  <Input value={inviteFirstName} onChange={(e) => setInviteFirstName(e.target.value)} placeholder="Sarah" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-stone-600">Last Name</Label>
                  <Input value={inviteLastName} onChange={(e) => setInviteLastName(e.target.value)} placeholder="Johnson" className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-stone-600">Email Address *</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="sarah@company.com" className="pl-9" />
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
            <div className="flex items-center justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep("company")} className="text-stone-500">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep("complete")} className="text-stone-400 text-sm">
                  Skip for now
                </Button>
                <Button
                  onClick={handleSendInvite}
                  disabled={createInvite.isPending}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 rounded-xl"
                >
                  {createInvite.isPending ? "Sending..." : "Send Invite"} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ COMPLETE STEP ═══ */}
        {step === "complete" && (
          <div className="p-8 text-center">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
              <PartyPopper className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-stone-800 mb-2">You're All Set!</h2>
            <p className="text-stone-500 mb-6 max-w-sm mx-auto">
              Your CRM is ready. Explore your dashboard, add more contacts, build your pipeline, or set up email campaigns.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              {[
                { icon: "📋", label: "CRM Bible", desc: "Learn every feature" },
                { icon: "📧", label: "Email Setup", desc: "Configure your domain" },
                { icon: "👥", label: "Team Mgmt", desc: "Invite more members" },
                { icon: "🤖", label: "AI Assistant", desc: "Ask me anything" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-stone-700">{item.label}</p>
                    <p className="text-[10px] text-stone-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-emerald-500/20 w-full"
              onClick={onComplete}
            >
              <Sparkles className="h-5 w-5 mr-2" /> Go to My Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
