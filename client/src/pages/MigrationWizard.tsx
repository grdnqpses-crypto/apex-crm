import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { MigrationProgress } from "@/components/MigrationProgress";
import { EmailProviderSetup } from "@/components/EmailProviderSetup";
import {
  CheckCircle2, ArrowRight, Upload, Zap, Users, Building2,
  Briefcase, Activity, Puzzle, FileText, AlertCircle, RefreshCw,
  Download, ExternalLink, Key, Globe, Lock, ShieldAlert
} from "lucide-react";

type ImportMode = "extension" | "csv" | "api";
type Step = "mode" | "select" | "connect" | "migrating" | "email-setup" | "complete";

const STATUS_LABELS: Record<string, string> = {
  validating: "Validating connection...",
  fetching: "Fetching your data...",
  analyzing: "Analyzing your data structure...",
  mapping: "AI is mapping your fields...",
  importing: "Importing your data...",
  completed: "Migration complete!",
  failed: "Migration encountered an error",
};

const STATUS_PROGRESS: Record<string, number> = {
  validating: 10, fetching: 30, analyzing: 40,
  mapping: 55, importing: 75, completed: 100, failed: 0,
};

// Step-by-step guides for finding API keys per CRM
const API_KEY_GUIDES: Record<string, { steps: string[]; link: string }> = {
  hubspot: {
    steps: ["Go to HubSpot → Settings (gear icon)", "Click 'Private Apps' in the left sidebar", "Click 'Create a private app'", "Name it 'Axiom Import', grant CRM read scopes", "Copy the token shown"],
    link: "https://app.hubspot.com/private-apps",
  },
  pipedrive: {
    steps: ["Go to Pipedrive → Your name (top right)", "Click 'Personal preferences'", "Click the 'API' tab", "Copy your Personal API Token"],
    link: "https://app.pipedrive.com/settings/api",
  },
  gohighlevel: {
    steps: ["Go to GoHighLevel → Settings", "Click 'Integrations'", "Click 'API Key'", "Copy your API key"],
    link: "https://app.gohighlevel.com/settings/integrations",
  },
  close: {
    steps: ["Go to Close CRM → Settings", "Click 'API Keys' in the left menu", "Click 'Generate API Key'", "Copy the key"],
    link: "https://app.close.com/settings/api-keys/",
  },
  apollo: {
    steps: ["Go to Apollo.io → Settings", "Click 'Integrations' in the left menu", "Click 'API' tab", "Copy your API Key"],
    link: "https://app.apollo.io/#/settings/integrations/api",
  },
  freshsales: {
    steps: ["Go to Freshsales → Profile picture (top right)", "Click 'Profile Settings'", "Click 'API Settings' tab", "Copy your API Key", "Also note your subdomain (e.g. 'mycompany' from mycompany.freshsales.io)", "Enter as: apikey:subdomain"],
    link: "https://crm.freshworks.com/crm/sales/",
  },
  activecampaign: {
    steps: ["Go to ActiveCampaign → Settings (gear icon)", "Click 'Developer'", "Copy your API Key and API URL", "Enter as: apikey:https://yoururl.api-us1.com"],
    link: "https://www.activecampaign.com/login/",
  },
  keap: {
    steps: ["Go to Keap → Settings", "Click 'Integrations'", "Click 'API Key'", "Copy your API key"],
    link: "https://signin.infusionsoft.com/",
  },
  copper: {
    steps: ["Go to Copper → Settings", "Click 'Integrations'", "Click 'API Keys'", "Generate a new key", "Enter as: apikey:youremail@company.com"],
    link: "https://app.copper.com/",
  },
  nutshell: {
    steps: ["Go to Nutshell → Your profile (top right)", "Click 'Profile Settings'", "Click 'API Keys' tab", "Generate a new API key", "Enter as: youremail@company.com:apikey"],
    link: "https://app.nutshell.com/",
  },
  insightly: {
    steps: ["Go to Insightly → User icon (top right)", "Click 'User Settings'", "Scroll to the bottom", "Copy your API Key"],
    link: "https://crm.na1.insightly.com/",
  },
  sugarcrm: {
    steps: ["Enter your SugarCRM username", "Enter your SugarCRM password", "Enter your instance URL (e.g. https://mycompany.sugarcrm.com)", "Format: username:password:https://yourinstance.sugarcrm.com"],
    link: "https://www.sugarcrm.com/",
  },
  streak: {
    steps: ["Open Gmail in Chrome", "Click the Streak icon in the toolbar", "Click 'Settings'", "Click 'API' tab", "Copy your API Key"],
    link: "https://mail.google.com/",
  },
  nimble: {
    steps: ["Go to Nimble → Settings (gear icon)", "Click 'API'", "Click 'Generate New Token'", "Copy your API token"],
    link: "https://app.nimble.com/settings/api",
  },
  monday: {
    steps: ["Go to Monday.com → Profile picture (top right)", "Click 'Developers'", "Click 'My Access Tokens'", "Copy your personal API token"],
    link: "https://monday.com/",
  },
};

export default function MigrationWizard() {
  const { t } = useSkin();
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";

  // Read ?sync= and ?sinceDate= query params for incremental sync from MigrationEngine
  const searchParams = new URLSearchParams(window.location.search);
  const syncCRM = searchParams.get("sync");
  const syncSinceDate = searchParams.get("sinceDate") ? Number(searchParams.get("sinceDate")) : null;

  const [mode, setMode] = useState<ImportMode | null>(syncCRM ? "api" : null);
  const [step, setStep] = useState<Step>(syncCRM ? "connect" : "mode");
  const [selectedCRM, setSelectedCRM] = useState<string | null>(syncCRM || null);
  const [apiKey, setApiKey] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvType, setCsvType] = useState<"contacts" | "companies" | "deals">("contacts");
  const [jobId, setJobId] = useState<number | null>(null);
  const [cheatSheet, setCheatSheet] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [oauthPending, setOauthPending] = useState(false);
  const [oauthToken, setOauthToken] = useState<string | null>(null);
  const [oauthInstanceUrl, setOauthInstanceUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const oauthPopupRef = useRef<Window | null>(null);

  const { data: competitors = [] } = trpc.migration.getCompetitors.useQuery();
  const { data: job } = trpc.migration.getJob.useQuery(
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
  const oauthCallback = trpc.migration.oauthCallback.useMutation({
    onSuccess: (data) => {
      setOauthToken(data.accessToken);
      setOauthInstanceUrl(data.instanceUrl || null);
      setOauthPending(false);
      toast.success(`Connected to ${selectedCRM}! Starting import...`);
      // Auto-start migration with the received token
      startMigration.mutate({
        sourceSystem: selectedCRM as any,
        apiKey: data.accessToken,
        instanceUrl: data.instanceUrl || undefined,
      });
    },
    onError: (err) => {
      setOauthPending(false);
      toast.error(`OAuth failed: ${err.message}`);
    },
  });

  // Listen for OAuth callback message from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "axiom_oauth_callback" && event.data?.code && event.data?.crm) {
        oauthPopupRef.current?.close();
        oauthCallback.mutate({
          crm: event.data.crm as "salesforce" | "zoho" | "keap" | "constantcontact",
          code: event.data.code,
          redirectUri: `${window.location.origin}/oauth-callback`,
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const utils = trpc.useUtils();

  const handleOAuthConnect = useCallback(async (crm: string) => {
    const redirectUri = `${window.location.origin}/oauth-callback`;
    try {
      setOauthPending(true);
      const result = await utils.migration.getOAuthUrl.fetch({
        crm: crm as "salesforce" | "zoho" | "keap" | "constantcontact",
        redirectUri,
      });
      if (!result.url || result.url.includes("YOUR_")) {
        // OAuth credentials not yet configured — show instructions
        setOauthPending(false);
        toast.info(
          `OAuth for ${crm} requires OAuth client credentials to be configured. Please use the API key method or ask your admin to configure the ${crm.toUpperCase()}_CLIENT_ID and ${crm.toUpperCase()}_CLIENT_SECRET environment variables.`,
          { duration: 8000 }
        );
        return;
      }
      const popup = window.open(result.url, "axiom_oauth", "width=600,height=700,scrollbars=yes");
      oauthPopupRef.current = popup;
      // Poll for popup closure (user cancelled without authorizing)
      const pollTimer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          setOauthPending(false);
        }
      }, 500);
    } catch (err) {
      setOauthPending(false);
      toast.error(`Could not get OAuth URL: ${String(err)}`);
    }
  }, [utils]);

  useEffect(() => {
    if (!job) return;
    if (job.status === "completed") {
      const log = (job as any).importLog;
      if (Array.isArray(log) && log.length > 0) {
        setCheatSheet(log[0]?.message || null);
      }
      setStep("complete");
      // Auto-switch skin to match the imported CRM
      if (selectedCRM) {
        setSkin.mutate({ skin: selectedCRM as any });
      }
    }
  }, [job?.status]);

  const selectedProfile = competitors.find(c => c.key === selectedCRM);
  const guide = selectedCRM ? API_KEY_GUIDES[selectedCRM] : null;
  const progress = job ? (STATUS_PROGRESS[job.status as string] || 0) : 0;
  const statusLabel = job ? (STATUS_LABELS[job.status as string] || job.status) : "";

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
      // Incremental sync: pass sinceDate if coming from MigrationEngine "Sync New Records"
      sinceDate: syncSinceDate ?? undefined,
      isIncrementalSync: !!syncSinceDate,
    });
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setCsvFile(file);
      } else {
        toast.error("Please drop a CSV file");
      }
    }
  };

  // ── Admin gate ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <Lock className="w-10 h-10 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Admin Access Required</h2>
          <p className="text-gray-500 mt-1">Only workspace administrators can run migrations.</p>
        </div>
      </div>
    );
  }

  // ── Step: Mode Picker ─────────────────────────────────────────────────────
  if (step === "mode") {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 text-sm font-medium text-orange-700">
            <Zap className="w-4 h-4" />
            One-Button AI Migration
          </div>
          <h1 className="text-4xl font-black text-gray-900">Choose Your Import Method</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">Select how you'd like to import your data into AXIOM. Each method is optimized for different scenarios.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Extension Method */}
          <Card
            className={`cursor-pointer transition-all border-2 ${mode === "extension" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300"}`}
            onClick={() => {
              setMode("extension");
              setStep("select");
            }}
          >
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-xl">
                🔗
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Browser Extension</h3>
                <p className="text-sm text-gray-500 mt-1">Click a button while logged into your CRM. Fastest method.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">1-Click</Badge>
                <Badge variant="secondary">Live Data</Badge>
              </div>
            </CardContent>
          </Card>

          {/* CSV Method */}
          <Card
            className={`cursor-pointer transition-all border-2 ${mode === "csv" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300"}`}
            onClick={() => {
              setMode("csv");
              setStep("select");
            }}
          >
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-xl">
                📊
              </div>
              <div>
                <h3 className="font-bold text-gray-900">CSV Upload</h3>
                <p className="text-sm text-gray-500 mt-1">Upload a CSV file exported from your CRM.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">File Upload</Badge>
                <Badge variant="secondary">Flexible</Badge>
              </div>
            </CardContent>
          </Card>

          {/* API Method */}
          <Card
            className={`cursor-pointer transition-all border-2 ${mode === "api" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300"}`}
            onClick={() => {
              setMode("api");
              setStep("select");
            }}
          >
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-xl">
                🔌
              </div>
              <div>
                <h3 className="font-bold text-gray-900">API Key</h3>
                <p className="text-sm text-gray-500 mt-1">Connect directly using your CRM's API key.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">Direct Connect</Badge>
                <Badge variant="secondary">Secure</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Migrations */}
        {existingJobs.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Recent Migrations</h3>
            <div className="space-y-2">
              {existingJobs.slice(0, 3).map(j => (
                <div key={j.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">From {j.sourceSystem}</p>
                    <p className="text-xs text-gray-500">{new Date(j.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={j.status === "completed" ? "default" : "outline"}>{j.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Step: CRM Selection ────────────────────────────────────────────────────
  if (step === "select") {
    const isCsvMode = mode === "csv";

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <button onClick={() => setStep("mode")} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
          ← Back
        </button>

        <div className="text-center space-y-3">
          <h1 className="text-3xl font-black text-gray-900">
            {isCsvMode ? "Upload Your CSV" : "Select Your CRM"}
          </h1>
          <p className="text-gray-500">
            {isCsvMode
              ? "Choose the type of data in your CSV file"
              : "We'll guide you through connecting your CRM"}
          </p>
        </div>

        {isCsvMode ? (
          <div className="space-y-6">
            {/* CSV Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">What type of data are you importing?</Label>
              <div className="grid md:grid-cols-3 gap-3">
                {(["contacts", "companies", "deals"] as const).map(type => (
                  <Card
                    key={type}
                    className={`cursor-pointer transition-all border-2 ${csvType === type ? "border-orange-500 bg-orange-50" : "border-gray-200"}`}
                    onClick={() => setCsvType(type)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">
                        {type === "contacts" && "👤"}
                        {type === "companies" && "🏢"}
                        {type === "deals" && "💼"}
                      </div>
                      <p className="font-semibold text-gray-900 capitalize">{type}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* CSV Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragOver ? "border-orange-500 bg-orange-50" : "border-gray-300"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-900">Drop your CSV file here</p>
              <p className="text-sm text-gray-500 mt-1">or</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setCsvFile(file);
                }}
              />
              {csvFile && (
                <p className="text-sm text-green-600 mt-3 font-medium">✓ {csvFile.name}</p>
              )}
            </div>

            {csvFile && (
              <Button
                onClick={() => setStep("connect")}
                className="w-full"
                size="lg"
              >
                Continue with CSV <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {competitors.map(c => (
              <Card
                key={c.key}
                className="cursor-pointer hover:shadow-md transition-all border-2 border-gray-200 hover:border-orange-300"
                onClick={() => {
                  setSelectedCRM(c.key);
                  setStep("connect");
                }}
              >
                <CardContent className="p-4 text-center space-y-3">
                  <div className="text-4xl">{c.logo}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{c.authMethod}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Step: Connect ─────────────────────────────────────────────────────────
  if (step === "connect") {
    const isOAuth = selectedProfile?.authMethod === "oauth";

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {!syncCRM && (
          <button onClick={() => setStep("select")} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
            ← Back
          </button>
        )}

        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto" style={{ backgroundColor: (selectedProfile?.color || "#f97316") + "20" }}>
            {selectedProfile?.logo || "📦"}
          </div>
          <h1 className="text-2xl font-black text-gray-900">Connect to {selectedProfile?.name}</h1>
          <p className="text-gray-500">Securely authenticate to import your data</p>
        </div>

        {isOAuth ? (
          <div className="space-y-4">
            <Button
              onClick={() => handleOAuthConnect(selectedCRM!)}
              disabled={oauthPending}
              className="w-full"
              size="lg"
            >
              {oauthPending ? "Opening..." : `Login with ${selectedProfile?.name}`}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              You'll be redirected to {selectedProfile?.name} to authorize the connection
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* API Key Input */}
            <div className="space-y-2">
              <Label className="font-semibold">{selectedProfile?.apiKeyLabel}</Label>
              <Input
                type="password"
                placeholder={selectedProfile?.apiKeyPlaceholder}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-gray-500">{selectedProfile?.apiKeyHelp}</p>

              {/* Show guide button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGuide(!showGuide)}
                className="mt-2"
              >
                {showGuide ? "Hide" : "Show"} Step-by-Step Guide
              </Button>

              {/* Guide */}
              {showGuide && guide && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3 mt-3">
                  <div className="flex items-start gap-2">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      {guide.steps.map((step, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-semibold text-blue-900">{i + 1}.</span>
                          <span className="text-blue-800 ml-2">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <a
                    href={guide.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Open {selectedProfile?.name} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Instance URL (if needed) */}
            {selectedProfile?.authMethod === "instance_url" && (
              <div className="space-y-2">
                <Label className="font-semibold">Instance URL</Label>
                <Input
                  placeholder="https://yourinstance.sugarcrm.com"
                  value={instanceUrl}
                  onChange={(e) => setInstanceUrl(e.target.value)}
                />
              </div>
            )}

            {/* Start Button */}
            <Button
              onClick={handleStartMigration}
              disabled={!apiKey || startMigration.isPending}
              className="w-full"
              size="lg"
            >
              {startMigration.isPending ? "Starting..." : "Start Migration"}
              <Zap className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-semibold">Your data is secure</p>
            <p className="mt-1">We use encrypted connections and never store your API keys. Your data is imported directly into your workspace.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: Migrating ───────────────────────────────────────────────────────
  if (step === "migrating") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto" style={{ backgroundColor: (selectedProfile?.color || "#f97316") + "20" }}>
            {selectedProfile?.logo || "📦"}
          </div>
          <h1 className="text-2xl font-black text-gray-900">Importing from {selectedProfile?.name}</h1>
          <p className="text-gray-500">Watch the real-time progress as your data is migrated</p>
        </div>

        {/* Real-time progress display */}
        {jobId && <MigrationProgress migrationId={String(jobId)} onComplete={() => setStep("complete")} />}

        {/* Fallback to legacy progress display if needed */}
        {!jobId && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{statusLabel}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-3 rounded-full" />
          </div>
        )}
      </div>
    );
  }

  // ── Step: Complete ────────────────────────────────────────────────────────
  if (step === "complete") {
    const totalImported = ((job as any)?.contactsImported || 0) + ((job as any)?.companiesImported || 0) + ((job as any)?.dealsImported || 0);

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Migration Complete!</h1>
            <p className="text-gray-500 mt-2">Your data has been successfully imported into AXIOM</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black text-orange-600">{totalImported}</p>
              <p className="text-sm text-gray-500 mt-1">Records Imported</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black text-blue-600">{(job as any)?.contactsImported || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Contacts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black text-purple-600">{(job as any)?.companiesImported || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Companies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black text-green-600">{(job as any)?.dealsImported || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Deals</p>
            </CardContent>
          </Card>
        </div>

        {/* Cheat Sheet */}
        {cheatSheet && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Migration Summary</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono overflow-auto max-h-48">
                {cheatSheet}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Next Steps</h3>
          <ul className="text-left space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Your workspace now matches the {selectedProfile?.name} layout</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>All custom fields have been automatically created</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Your team can now start using AXIOM with all your data</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => setStep("email-setup")}
            size="lg"
            className="gap-2"
          >
            Setup Email Provider <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => window.location.href = "/"}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => {
              setStep("mode");
              setSelectedCRM(null);
              setApiKey("");
              setJobId(null);
            }}
            variant="outline"
            size="lg"
          >
            Run Another Migration
          </Button>
        </div>
      </div>
    );
  }

  // Step: Email Provider Setup
  if (step === "email-setup") {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <button
          onClick={() => setStep("complete")}
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          Back
        </button>

        <div className="space-y-4">
          <h1 className="text-3xl font-black text-gray-900">Setup Email Provider</h1>
          <p className="text-gray-500">Connect your email account to start sending campaigns and automated emails</p>
        </div>

        <EmailProviderSetup
          onComplete={(provider, email) => {
            toast.success(`Email provider configured: ${email}`);
            setStep("complete");
          }}
          onSkip={() => setStep("complete")}
          showSkip={true}
        />
      </div>
    );
  }

  return null;
}
