import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Building2, Users, Kanban, CheckCircle2, ArrowRight,
  Sparkles, Rocket, PartyPopper, X, ChevronLeft,
} from "lucide-react";

type Step = "welcome" | "company" | "contact" | "deal" | "complete";

interface OnboardingWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingWizard({ onClose, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [dealName, setDealName] = useState("");

  // Company form
  const [coName, setCoName] = useState("");
  const [coIndustry, setCoIndustry] = useState("Transportation");

  // Contact form
  const [ctFirstName, setCtFirstName] = useState("");
  const [ctLastName, setCtLastName] = useState("");
  const [ctEmail, setCtEmail] = useState("");

  // Deal form
  const [dlName, setDlName] = useState("");
  const [dlValue, setDlValue] = useState("");

  const utils = trpc.useUtils();

  const createCompany = trpc.companies.create.useMutation({
    onSuccess: (data) => {
      setCompanyId(Number(data.id));
      setCompanyName(coName);
      toast.success(`Company "${coName}" created!`);
      setStep("contact");
    },
    onError: () => toast.error("Failed to create company"),
  });

  const createContact = trpc.contacts.create.useMutation({
    onSuccess: () => {
      setContactName(`${ctFirstName} ${ctLastName}`);
      toast.success(`Contact "${ctFirstName} ${ctLastName}" created!`);
      setStep("deal");
    },
    onError: () => toast.error("Failed to create contact"),
  });

  const { data: pipelines } = trpc.pipelines.list.useQuery();
  const firstPipelineId = pipelines?.[0]?.id;
  const { data: stages } = trpc.pipelines.stages.useQuery(
    { pipelineId: firstPipelineId! },
    { enabled: !!firstPipelineId }
  );

  const createDeal = trpc.deals.create.useMutation({
    onSuccess: () => {
      setDealName(dlName);
      toast.success(`Deal "${dlName}" created!`);
      utils.dashboard.stats.invalidate();
      setStep("complete");
    },
    onError: () => toast.error("Failed to create deal"),
  });

  const steps = [
    { key: "company", label: "Company", icon: Building2, color: "amber" },
    { key: "contact", label: "Contact", icon: Users, color: "blue" },
    { key: "deal", label: "Deal", icon: Kanban, color: "emerald" },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  const handleCreateCompany = () => {
    if (!coName.trim()) { toast.error("Company name is required"); return; }
    createCompany.mutate({ name: coName, industry: coIndustry });
  };

  const handleCreateContact = () => {
    if (!ctFirstName.trim() || !ctLastName.trim()) { toast.error("First and last name are required"); return; }
    if (!companyId) { toast.error("No company selected"); return; }
    createContact.mutate({
      firstName: ctFirstName,
      lastName: ctLastName,
      email: ctEmail || undefined,
      companyId,
    });
  };

  const handleCreateDeal = () => {
    if (!dlName.trim()) { toast.error("Deal name is required"); return; }
    if (!firstPipelineId) { toast.error("No pipeline found"); return; }
    const firstStage = stages?.[0];
    createDeal.mutate({
      name: dlName,
      value: dlValue ? parseFloat(dlValue) : 0,
      pipelineId: firstPipelineId,
      stageId: firstStage?.id ?? 0,
      companyId: companyId ?? undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
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
              Let's set up your CRM in 60 seconds. We'll walk you through creating your first company, 
              adding a contact, and setting up a deal.
            </p>
            <div className="flex items-center justify-center gap-6 mb-8">
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
              onClick={() => setStep("company")}
            >
              <Sparkles className="h-5 w-5 mr-2" /> Let's Get Started
            </Button>
          </div>
        )}

        {/* ═══ PROGRESS BAR (for company/contact/deal steps) ═══ */}
        {(step === "company" || step === "contact" || step === "deal") && (
          <>
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
          </>
        )}

        {/* ═══ COMPANY STEP ═══ */}
        {step === "company" && (
          <div className="px-8 pb-8">
            <h3 className="text-xl font-bold text-stone-800 mb-1">Create Your First Company</h3>
            <p className="text-sm text-stone-500 mb-5">Companies are the foundation of your CRM. Every contact and deal is linked to a company.</p>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-stone-600">Company Name *</Label>
                <Input
                  value={coName}
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
                    {["Transportation", "Logistics", "Warehousing", "Manufacturing", "Technology", "Finance", "Healthcare", "Other"].map(i => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep("welcome")} className="text-stone-500">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={handleCreateCompany}
                disabled={createCompany.isPending}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 rounded-xl"
              >
                {createCompany.isPending ? "Creating..." : "Create Company"} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ═══ CONTACT STEP ═══ */}
        {step === "contact" && (
          <div className="px-8 pb-8">
            <h3 className="text-xl font-bold text-stone-800 mb-1">Add Your First Contact</h3>
            <p className="text-sm text-stone-500 mb-5">
              Contacts are the people you work with at <span className="font-semibold text-amber-600">{companyName}</span>.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-stone-600">First Name *</Label>
                  <Input value={ctFirstName} onChange={(e) => setCtFirstName(e.target.value)} placeholder="Sarah" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-stone-600">Last Name *</Label>
                  <Input value={ctLastName} onChange={(e) => setCtLastName(e.target.value)} placeholder="Johnson" className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-stone-600">Email</Label>
                <Input value={ctEmail} onChange={(e) => setCtEmail(e.target.value)} placeholder="sarah@swiftlogistics.com" className="mt-1" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep("company")} className="text-stone-500">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={handleCreateContact}
                disabled={createContact.isPending}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 rounded-xl"
              >
                {createContact.isPending ? "Creating..." : "Add Contact"} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ═══ DEAL STEP ═══ */}
        {step === "deal" && (
          <div className="px-8 pb-8">
            <h3 className="text-xl font-bold text-stone-800 mb-1">Create Your First Deal</h3>
            <p className="text-sm text-stone-500 mb-5">
              Deals track your sales opportunities. Link this to <span className="font-semibold text-amber-600">{companyName}</span>.
            </p>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-stone-600">Deal Name *</Label>
                <Input value={dlName} onChange={(e) => setDlName(e.target.value)} placeholder="e.g., Q2 Fleet Expansion" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-stone-600">Value ($)</Label>
                <Input value={dlValue} onChange={(e) => setDlValue(e.target.value)} placeholder="50000" type="number" className="mt-1" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep("contact")} className="text-stone-500">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={handleCreateDeal}
                disabled={createDeal.isPending}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-6 rounded-xl"
              >
                {createDeal.isPending ? "Creating..." : "Create Deal"} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ═══ COMPLETE STEP ═══ */}
        {step === "complete" && (
          <div className="p-8 text-center">
            <div className="relative mb-6">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <PartyPopper className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-amber-400 flex items-center justify-center animate-bounce shadow-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-stone-800 mb-2">You're All Set!</h2>
            <p className="text-stone-500 mb-6 max-w-sm mx-auto">
              Congratulations! You've created your first company, contact, and deal. Your CRM is ready to go.
            </p>
            <div className="bg-stone-50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-stone-700"><span className="font-semibold">Company:</span> {companyName}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-stone-700"><span className="font-semibold">Contact:</span> {contactName}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-sm text-stone-700"><span className="font-semibold">Deal:</span> {dealName}</span>
              </div>
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-amber-500/20"
              onClick={() => { onComplete(); onClose(); }}
            >
              <Rocket className="h-5 w-5 mr-2" /> Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
