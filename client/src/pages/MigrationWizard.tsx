import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  CheckCircle2, ArrowRight, Upload, Zap, Users, Building2,
  Briefcase, Activity, Star, ChevronRight, RefreshCw, Sparkles,
  FileText, AlertCircle, Clock, TrendingUp
} from "lucide-react";

type Step = "select" | "connect" | "migrating" | "complete";

const STATUS_LABELS: Record<string, string> = {
  validating: "Validating connection...",
  fetching: "Fetching your data from the API...",
  analyzing: "Analyzing your data structure...",
  mapping: "AI is mapping your fields...",
  importing: "Importing your data...",
  completed: "Migration complete!",
  failed: "Migration encountered an error",
};

const STATUS_PROGRESS: Record<string, number> = {
  validating: 10,
  fetching: 30,
  analyzing: 40,
  mapping: 55,
  importing: 75,
  completed: 100,
  failed: 0,
};

export default function MigrationWizard() {

  const [step, setStep] = useState<Step>("select");
  const [selectedCRM, setSelectedCRM] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvType, setCsvType] = useState<"contacts" | "companies" | "deals">("contacts");
  const [jobId, setJobId] = useState<number | null>(null);
  const [cheatSheet, setCheatSheet] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: competitors = [] } = trpc.migration.getCompetitors.useQuery();
  const { data: job, refetch: refetchJob } = trpc.migration.getJob.useQuery(
    { id: jobId! },
    { enabled: !!jobId, refetchInterval: jobId ? 2000 : false }
  );
  const { data: existingJobs = [] } = trpc.migration.listJobs.useQuery();
  const setSkin = trpc.migration.setSkin.useMutation();
  const startMigration = trpc.migration.startMigration.useMutation({
    onSuccess: (data) => {
      setJobId(data.jobId);
      setStep("migrating");
    },
    onError: (err) => {
      toast.error(`Migration failed to start: ${err.message}`);
    },
  });

  // Watch job status and transition to complete
  useEffect(() => {
    if (!job) return;
    if (job.status === "completed") {
      // Extract cheat sheet from importLog
      const log = (job as any).importLog;
      if (Array.isArray(log) && log.length > 0) {
        setCheatSheet(log[0]?.message || null);
      }
      setStep("complete");
    }
  }, [job?.status]);

  const selectedProfile = competitors.find(c => c.key === selectedCRM);

  const handleStartMigration = async () => {
    if (!selectedCRM) return;

    let csvData: string | undefined;
    if (selectedProfile?.authMethod === "csv_upload" && csvFile) {
      csvData = await csvFile.text();
    }

    startMigration.mutate({
      sourceSystem: selectedCRM as any,
      apiKey: apiKey || undefined,
      instanceUrl: instanceUrl || undefined,
      csvData,
      csvType: csvData ? csvType : undefined,
    });
  };

  const progress = job ? (STATUS_PROGRESS[job.status as string] || 0) : 0;
  const statusLabel = job ? (STATUS_LABELS[job.status as string] || job.status) : "";

  // ── Step 1: Select CRM ────────────────────────────────────────────────────
  if (step === "select") {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 text-sm font-medium text-orange-700">
            <Zap className="w-4 h-4" />
            One-Button AI Migration
          </div>
          <h1 className="text-4xl font-black text-gray-900">
            Bring Your Entire CRM With You
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Our AI maps every field — standard and custom — and imports everything automatically.
            You don't touch a single setting. It just works.
          </p>
        </div>

        {/* What gets imported */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Users, label: "Contacts", desc: "Every field, every tag" },
            { icon: Building2, label: "Companies", desc: "Full org hierarchy" },
            { icon: Briefcase, label: "Deals", desc: "Pipelines & stages" },
            { icon: Activity, label: "Activity History", desc: "Calls, emails, notes" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-orange-500" />
              </div>
              <div className="font-semibold text-gray-900 text-sm">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>

        {/* CRM Picker */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Where are you migrating from?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {competitors.map((crm) => (
              <button
                key={crm.key}
                onClick={() => setSelectedCRM(crm.key)}
                className={`group relative p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                  selectedCRM === crm.key
                    ? "border-orange-500 bg-orange-50 shadow-lg scale-[1.02]"
                    : "border-gray-100 bg-white hover:border-orange-200 hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{crm.logo}</span>
                  <span className="font-bold text-gray-900">{crm.name}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {crm.authMethod === "csv_upload" ? "Upload CSV file" : "Connect via API"}
                </div>
                {selectedCRM === crm.key && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Previous migrations */}
        {existingJobs.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Previous Migrations</h3>
            <div className="space-y-2">
              {existingJobs.slice(0, 3).map((j: any) => (
                <div key={j.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{competitors.find(c => c.key === j.sourcePlatform)?.logo || "📦"}</span>
                    <div>
                      <div className="font-medium text-gray-800 capitalize">{j.sourcePlatform}</div>
                      <div className="text-xs text-gray-400">{new Date(j.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Badge variant={j.status === "completed" ? "default" : "secondary"} className={j.status === "completed" ? "bg-green-100 text-green-700" : ""}>
                    {j.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          size="lg"
          className="w-full h-14 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-lg"
          disabled={!selectedCRM}
          onClick={() => setStep("connect")}
        >
          Continue with {selectedProfile?.name || "Selected CRM"}
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    );
  }

  // ── Step 2: Connect ───────────────────────────────────────────────────────
  if (step === "connect" && selectedProfile) {
    const isCsv = selectedProfile.authMethod === "csv_upload";

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <button onClick={() => setStep("select")} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
          ← Back
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: selectedProfile.color + "20" }}>
            {selectedProfile.logo}
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Connect {selectedProfile.name}</h1>
            <p className="text-gray-500 text-sm">One connection. Everything imports automatically.</p>
          </div>
        </div>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6 space-y-5">
            {isCsv ? (
              <>
                <div className="space-y-2">
                  <Label className="font-semibold">What type of data is in your CSV?</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["contacts", "companies", "deals"] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setCsvType(t)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                          csvType === t ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-100 text-gray-600 hover:border-orange-200"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Upload your CSV file</Label>
                  <div
                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all"
                    onClick={() => document.getElementById("csv-upload")?.click()}
                  >
                    {csvFile ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">{csvFile.name}</span>
                        <span className="text-gray-400 text-sm">({(csvFile.size / 1024).toFixed(0)} KB)</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 font-medium">Click to upload CSV</p>
                        <p className="text-xs text-gray-400 mt-1">Any CSV exported from your CRM</p>
                      </>
                    )}
                  </div>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  />
                </div>
              </>
            ) : (
              <>
                {selectedProfile.authMethod === "oauth" && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Instance URL</Label>
                    <Input
                      placeholder={selectedProfile.apiKeyPlaceholder || "https://yourcompany.salesforce.com"}
                      value={instanceUrl}
                      onChange={(e) => setInstanceUrl(e.target.value)}
                      className="h-12 rounded-xl border-gray-200"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="font-semibold">{selectedProfile.apiKeyLabel}</Label>
                  <Input
                    type="password"
                    placeholder={selectedProfile.apiKeyPlaceholder}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="h-12 rounded-xl border-gray-200 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 flex items-start gap-1.5">
                    <span className="mt-0.5">💡</span>
                    {selectedProfile.apiKeyHelp}
                  </p>
                </div>
              </>
            )}

            {/* What the AI will do */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-gray-800 text-sm">What happens next</span>
              </div>
              <div className="space-y-2">
                {[
                  "AI analyzes your data structure",
                  "Maps every field — standard and custom",
                  "Creates any missing fields automatically",
                  "Imports contacts, companies, deals & history",
                  "Applies your familiar interface",
                  "Generates your personal cheat sheet",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 text-[10px] font-bold">{i + 1}</span>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full h-14 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-lg"
          disabled={startMigration.isPending || (isCsv ? !csvFile : !apiKey && selectedProfile.authMethod !== "oauth")}
          onClick={handleStartMigration}
        >
          {startMigration.isPending ? (
            <>
              <RefreshCw className="mr-2 w-5 h-5 animate-spin" />
              Starting migration...
            </>
          ) : (
            <>
              <Zap className="mr-2 w-5 h-5" />
              Start Migration — One Click
            </>
          )}
        </Button>
        <p className="text-center text-xs text-gray-400">
          Your data is encrypted in transit. We never store your API credentials.
        </p>
      </div>
    );
  }

  // ── Step 3: Migrating ─────────────────────────────────────────────────────
  if (step === "migrating") {
    const isFailed = job?.status === "failed";

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            {isFailed ? (
              <AlertCircle className="w-10 h-10 text-red-500" />
            ) : job?.status === "completed" ? (
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            ) : (
              <RefreshCw className="w-10 h-10 text-orange-500 animate-spin" />
            )}
          </div>
          <h1 className="text-3xl font-black text-gray-900">
            {isFailed ? "Migration Error" : job?.status === "completed" ? "Done!" : "Migration in Progress"}
          </h1>
          <p className="text-gray-500">{statusLabel}</p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{statusLabel}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-3 rounded-full" />
        </div>

        {/* Live stats */}
        {job && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Users, label: "Contacts", value: (job as any).contactsImported || 0 },
              { icon: Building2, label: "Companies", value: (job as any).companiesImported || 0 },
              { icon: Briefcase, label: "Deals", value: (job as any).dealsImported || 0 },
              { icon: Activity, label: "Activities", value: (job as any).activitiesImported || 0 },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                <Icon className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <div className="text-2xl font-black text-gray-900">{value.toLocaleString()}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Steps timeline */}
        <div className="space-y-3">
          {["validating", "analyzing", "mapping", "importing", "completed"].map((s, i) => {
            const currentIdx = ["validating", "analyzing", "mapping", "importing", "completed"].indexOf(job?.status || "validating");
            const isDone = i < currentIdx || job?.status === "completed";
            const isActive = i === currentIdx && job?.status !== "completed";
            return (
              <div key={s} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? "bg-orange-50 border border-orange-200" : isDone ? "opacity-60" : "opacity-30"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? "bg-green-500" : isActive ? "bg-orange-500" : "bg-gray-200"}`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4 text-white" /> : isActive ? <RefreshCw className="w-3 h-3 text-white animate-spin" /> : <span className="text-gray-400 text-xs">{i + 1}</span>}
                </div>
                <span className={`text-sm font-medium ${isActive ? "text-orange-700" : isDone ? "text-gray-500" : "text-gray-300"}`}>
                  {STATUS_LABELS[s] || s}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-400">
          <Clock className="inline w-4 h-4 mr-1" />
          This usually takes 1–5 minutes depending on your data size
        </p>
      </div>
    );
  }

  // ── Step 4: Complete ──────────────────────────────────────────────────────
  if (step === "complete" && job) {
    const totalImported = ((job as any).contactsImported || 0) + ((job as any).companiesImported || 0) +
      ((job as any).dealsImported || 0) + ((job as any).activitiesImported || 0);

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Success hero */}
        <div className="text-center space-y-3">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900">You're In!</h1>
          <p className="text-gray-500 text-lg">
            {totalImported.toLocaleString()} records imported successfully.
            Your Apex CRM is ready — and it already looks familiar.
          </p>
        </div>

        {/* Import summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Users, label: "Contacts", value: (job as any).contactsImported || 0, color: "blue" },
            { icon: Building2, label: "Companies", value: (job as any).companiesImported || 0, color: "purple" },
            { icon: Briefcase, label: "Deals", value: (job as any).dealsImported || 0, color: "orange" },
            { icon: Activity, label: "Activities", value: (job as any).activitiesImported || 0, color: "green" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
              <Icon className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <div className="text-2xl font-black text-gray-900">{value.toLocaleString()}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Duplicates merged */}
        {(job as any).duplicatesMerged > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="font-semibold text-amber-800">
                {(job as any).duplicatesMerged} duplicate{(job as any).duplicatesMerged !== 1 ? 's' : ''} merged automatically
              </div>
              <div className="text-sm text-amber-600 mt-0.5">
                The AI detected and merged duplicate contacts before importing — your data is clean.
              </div>
            </div>
          </div>
        )}

        {/* Custom fields created */}
        {(job as any).customFieldsCreated > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <Star className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-blue-800">
                {(job as any).customFieldsCreated} custom fields created automatically
              </div>
              <div className="text-sm text-blue-600 mt-0.5">
                The AI detected fields unique to your previous CRM and created them in Apex so nothing was lost.
              </div>
            </div>
          </div>
        )}

        {/* Cheat sheet */}
        {cheatSheet && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">Your Personal Migration Guide</h3>
              <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">AI Generated</Badge>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{cheatSheet}</p>
          </div>
        )}

        {/* Skin info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: (selectedProfile?.color || "#f97316") + "20" }}>
            {selectedProfile?.logo || "🎨"}
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900">
              Your interface now matches {selectedProfile?.name || "your previous CRM"}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Same navigation, same terminology, same layout. You already know how to use this.
              When you're ready, switch to the full Apex experience to unlock everything.
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-12 rounded-xl border-gray-200"
            onClick={() => setSkin.mutate({ skin: "apex" })}
          >
            <TrendingUp className="mr-2 w-4 h-4" />
            Switch to Apex UI
          </Button>
          <Button
            className="h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
            onClick={() => window.location.href = "/dashboard"}
          >
            Go to Dashboard
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
