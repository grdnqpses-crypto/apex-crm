import { useState, useEffect, useRef, useCallback } from "react";
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
import {
  CheckCircle2, ArrowRight, Upload, Zap, Users, Building2,
  Briefcase, Activity, Puzzle, FileText, AlertCircle, RefreshCw,
  Download, ExternalLink, Key, Globe, Lock, ShieldAlert
} from "lucide-react";

type ImportMode = "extension" | "csv" | "api";
type Step = "mode" | "select" | "connect" | "migrating" | "complete";

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
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))) {
      setCsvFile(file);
    } else {
      toast.error("Please upload a CSV file");
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
          <h2 className="text-2xl font-bold text-gray-900">Admin Access Required</h2>
          <p className="text-gray-500 mt-2 max-w-md">
            CRM migrations can only be initiated by company administrators. Please contact your admin to run a migration.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // ── Incremental sync banner ───────────────────────────────────────────────
  const IncrementalBanner = syncSinceDate ? (
    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
      <RefreshCw className="w-5 h-5 text-blue-500 flex-shrink-0" />
      <div>
        <p className="font-semibold text-blue-800 text-sm">Incremental Sync Mode</p>
        <p className="text-blue-600 text-xs mt-0.5">
          Only records modified after {new Date(syncSinceDate).toLocaleString()} will be imported.
        </p>
      </div>
    </div>
  ) : null;

  // ── Step: Mode Picker ─────────────────────────────────────────────────────
  if (step === "mode") {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 text-sm font-medium text-orange-700">
            <Zap className="w-4 h-4" />
            One-Button AI Migration
          </div>
          <h1 className="text-4xl font-black text-gray-900">Bring Your Entire CRM With You</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Choose how you want to import. All three methods import contacts, companies, deals, and activity history automatically.
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

        {/* Mode cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Extension */}
          <button
            onClick={() => { setMode("extension"); setStep("select"); }}
            className="group relative p-6 rounded-2xl border-2 border-gray-100 bg-white hover:border-orange-400 hover:shadow-lg text-left transition-all duration-200"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <Puzzle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="font-black text-gray-900 text-lg mb-1">Browser Extension</div>
            <div className="text-sm text-gray-500 mb-3">
              Install once. Click import while logged into your old CRM. No API keys, no passwords shared with us.
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 rounded-full px-3 py-1">
              <CheckCircle2 className="w-3 h-3" /> Easiest — truly one click
            </div>
          </button>

          {/* CSV */}
          <button
            onClick={() => { setMode("csv"); setStep("select"); }}
            className="group relative p-6 rounded-2xl border-2 border-gray-100 bg-white hover:border-orange-400 hover:shadow-lg text-left transition-all duration-200"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="font-black text-gray-900 text-lg mb-1">Upload CSV / Excel</div>
            <div className="text-sm text-gray-500 mb-3">
              Export from your old CRM and drag the file here. Our AI auto-maps every column — even custom fields.
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full px-3 py-1">
              <CheckCircle2 className="w-3 h-3" /> Works with any CRM
            </div>
          </button>

          {/* API */}
          <button
            onClick={() => { setMode("api"); setStep("select"); }}
            className="group relative p-6 rounded-2xl border-2 border-gray-100 bg-white hover:border-orange-400 hover:shadow-lg text-left transition-all duration-200"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Key className="w-6 h-6 text-purple-600" />
            </div>
            <div className="font-black text-gray-900 text-lg mb-1">Direct API Connect</div>
            <div className="text-sm text-gray-500 mb-3">
              Connect via API key or OAuth. We pull everything live — contacts, deals, notes, and custom fields.
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 rounded-full px-3 py-1">
              <CheckCircle2 className="w-3 h-3" /> Most complete import
            </div>
          </button>
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
      </div>
    );
  }

  // ── Step: Select CRM ──────────────────────────────────────────────────────
  if (step === "select") {
    const isExtension = mode === "extension";
    const isCsvMode = mode === "csv";

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <button onClick={() => setStep("mode")} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
          ← Back
        </button>

        {/* Extension install guide */}
        {isExtension && (
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Puzzle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-gray-900 mb-1">Axiom CRM Importer Extension</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Install the extension, log into your old CRM in the same browser, then click the Axiom icon and hit <strong>Import</strong>. That's it — no API keys, no exports, no configuration.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="https://d2xsxph8kpxj0f.cloudfront.net/310519663348315388/mLLZEfmfSEuH47dfeJgVGY/axiom-crm-importer_a8c955b3.zip"
                      download
                      className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Extension (.zip)
                    </a>
                    <button
                      onClick={() => setShowGuide(!showGuide)}
                      className="inline-flex items-center gap-2 bg-white border border-orange-200 text-orange-700 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-orange-50 transition-colors"
                    >
                      {showGuide ? "Hide" : "Show"} Install Instructions
                    </button>
                  </div>
                  {showGuide && (
                    <div className="mt-4 bg-white rounded-xl border border-orange-100 p-4 space-y-2">
                      <p className="text-sm font-semibold text-gray-700">How to install an unpacked Chrome extension:</p>
                      <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                        <li>Download and unzip the extension file above</li>
                        <li>Open Chrome and go to <code className="bg-gray-100 px-1 rounded">chrome://extensions</code></li>
                        <li>Enable <strong>Developer mode</strong> (toggle in top right)</li>
                        <li>Click <strong>Load unpacked</strong> and select the unzipped folder</li>
                        <li>The Axiom icon will appear in your Chrome toolbar</li>
                        <li>Log into your old CRM, click the Axiom icon, and hit <strong>Import</strong></li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isCsvMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900">How to export from your CRM</p>
                <p className="text-sm text-blue-700 mt-1">
                  In most CRMs: go to Contacts → All Contacts → Export → Download as CSV. Then select your CRM below so we know how to map the columns.
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {isExtension ? "Which CRM are you logged into?" : isCsvMode ? "Which CRM did you export from?" : "Which CRM are you connecting?"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {competitors
              .filter(crm => isCsvMode ? true : isExtension ? crm.key !== "spreadsheet" : crm.key !== "spreadsheet")
              .map((crm) => (
                <button
                  key={crm.key}
                  onClick={() => setSelectedCRM(crm.key)}
                  className={`group relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                    selectedCRM === crm.key
                      ? "border-orange-500 bg-orange-50 shadow-lg scale-[1.02]"
                      : "border-gray-100 bg-white hover:border-orange-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{crm.logo}</span>
                    <span className="font-bold text-gray-900 text-sm leading-tight">{crm.name}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {crm.authMethod === "oauth" ? "OAuth login" : crm.authMethod === "csv_upload" ? "Upload file" : "API key"}
                  </div>
                  {selectedCRM === crm.key && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
          </div>
        </div>

        <Button
          size="lg"
          className="w-full h-14 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-lg"
          disabled={!selectedCRM}
          onClick={() => {
            if (isExtension) {
              toast.success(`Extension ready! Log into ${selectedProfile?.name} and click the Axiom icon in your toolbar.`);
            } else {
              setStep("connect");
            }
          }}
        >
          {isExtension ? `I'm logged into ${selectedProfile?.name || "my CRM"} — ready!` : `Continue with ${selectedProfile?.name || "Selected CRM"}`}
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    );
  }

  // ── Step: Connect / Upload ────────────────────────────────────────────────
  if (step === "connect" && selectedProfile) {
    const isCsv = selectedProfile.authMethod === "csv_upload" || mode === "csv";
    const isOAuth = selectedProfile.authMethod === "oauth";

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {!syncCRM && (
          <button onClick={() => setStep("select")} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
            ← Back
          </button>
        )}
        {syncCRM && (
          <button onClick={() => window.history.back()} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
            ← Back to Migration History
          </button>
        )}

        {IncrementalBanner}

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
                  <Label className="font-semibold">What type of data is in your file?</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["contacts", "companies", "deals"] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setCsvType(type)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                          csvType === type ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-100 text-gray-600 hover:border-orange-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Upload your CSV or Excel file</Label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      dragOver ? "border-orange-400 bg-orange-50" : csvFile ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-orange-300"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setCsvFile(file);
                      }}
                    />
                    {csvFile ? (
                      <div className="space-y-1">
                        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                        <p className="font-semibold text-green-700">{csvFile.name}</p>
                        <p className="text-xs text-green-600">{(csvFile.size / 1024).toFixed(1)} KB — click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-gray-300 mx-auto" />
                        <p className="text-gray-500 font-medium">Drag & drop your file here</p>
                        <p className="text-xs text-gray-400">or click to browse — CSV, XLS, XLSX supported</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                  <strong>AI field mapping:</strong> Our AI will automatically match your column headers to Axiom fields — even custom fields and non-standard column names. You'll see a preview before anything is imported.
                </div>
              </>
            ) : isOAuth ? (
              <div className="text-center space-y-5 py-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto" style={{ backgroundColor: selectedProfile.color + "20" }}>
                  {selectedProfile.logo}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-lg">Connect with {selectedProfile.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    A secure popup will open so you can log into {selectedProfile.name}. We never see your password — only a temporary access token.
                  </p>
                </div>

                {/* Security badges */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-green-50 border border-green-100 rounded-xl p-2 text-green-700 flex flex-col items-center gap-1">
                    <Lock className="w-4 h-4" />
                    <span>OAuth 2.0</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 text-blue-700 flex flex-col items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>No password shared</span>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-2 text-purple-700 flex flex-col items-center gap-1">
                    <Globe className="w-4 h-4" />
                    <span>Revocable anytime</span>
                  </div>
                </div>

                {/* What we import */}
                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
                  <p className="text-sm font-semibold text-gray-700">What we'll import from {selectedProfile.name}:</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["All contacts", "All companies", "Open & closed deals", "Activity history", "Custom fields", "Tags & segments"].map(item => (
                      <div key={item} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {oauthToken ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <p className="font-semibold text-green-800">Connected! Starting import...</p>
                  </div>
                ) : (
                  <Button
                    size="lg"
                    className="w-full font-bold rounded-xl text-white"
                    style={{ backgroundColor: selectedProfile.color }}
                    onClick={() => handleOAuthConnect(selectedCRM!)}
                    disabled={oauthPending || oauthCallback.isPending}
                  >
                    {oauthPending ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Waiting for authorization...</>
                    ) : (
                      <><Globe className="w-4 h-4 mr-2" /> Connect with {selectedProfile.name}</>
                    )}
                  </Button>
                )}

                <p className="text-xs text-gray-400">
                  After connecting, we'll automatically import everything and switch your interface to match {selectedProfile.name}'s layout.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="font-semibold">{selectedProfile.apiKeyLabel}</Label>
                  <Input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={selectedProfile.apiKeyPlaceholder}
                    type="password"
                    className="font-mono"
                  />
                </div>

                {/* Step-by-step guide */}
                {guide && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">How to find your {selectedProfile.name} key:</p>
                      {guide.link && (
                        <a href={guide.link} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-600 hover:underline flex items-center gap-1">
                          Open {selectedProfile.name} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <ol className="space-y-1.5">
                      {guide.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="w-5 h-5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {selectedProfile.authMethod === "api_key" && selectedCRM === "salesforce" && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Salesforce Instance URL</Label>
                    <Input
                      value={instanceUrl}
                      onChange={(e) => setInstanceUrl(e.target.value)}
                      placeholder="https://yourcompany.salesforce.com"
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {!isOAuth && (
          <Button
            size="lg"
            className="w-full h-14 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-lg"
            disabled={
              startMigration.isPending ||
              (isCsv ? !csvFile : !apiKey.trim())
            }
            onClick={handleStartMigration}
          >
            {startMigration.isPending ? (
              <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Starting import...</>
            ) : (
              <>{isCsv ? "Import File" : "Start Import"} <ArrowRight className="ml-2 w-5 h-5" /></>
            )}
          </Button>
        )}
      </div>
    );
  }

  // ── Step: Migrating ───────────────────────────────────────────────────────
  if (step === "migrating") {
    const stages = ["validating", "fetching", "analyzing", "mapping", "importing", "completed"];
    const currentIdx = stages.indexOf(job?.status || "validating");

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mx-auto" style={{ backgroundColor: (selectedProfile?.color || "#f97316") + "20" }}>
            {selectedProfile?.logo || "📦"}
          </div>
          <h1 className="text-2xl font-black text-gray-900">Importing from {selectedProfile?.name}</h1>
          <p className="text-gray-500">{statusLabel}</p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{statusLabel}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-3 rounded-full" />
        </div>

        <div className="space-y-2">
          {stages.slice(0, -1).map((stage, i) => (
            <div key={stage} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              i < currentIdx ? "bg-green-50" : i === currentIdx ? "bg-orange-50" : "bg-gray-50"
            }`}>
              {i < currentIdx ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : i === currentIdx ? (
                <RefreshCw className="w-5 h-5 text-orange-500 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
              )}
              <span className={`text-sm font-medium capitalize ${
                i < currentIdx ? "text-green-700" : i === currentIdx ? "text-orange-700" : "text-gray-400"
              }`}>
                {STATUS_LABELS[stage] || stage}
              </span>
            </div>
          ))}
        </div>

        {job?.status === "failed" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Import failed</p>
              <p className="text-sm text-red-600 mt-1">Please check your API key and try again. If the problem persists, try the CSV upload method instead.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setStep("connect")}>
                Try Again
              </Button>
            </div>
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
          <h1 className="text-3xl font-black text-gray-900">Migration Complete! 🎉</h1>
          <p className="text-gray-500">
            Your {selectedProfile?.name} data is now in Axiom. We also switched your interface to match {selectedProfile?.name}'s layout so everything feels familiar.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Users, label: "Contacts", value: (job as any)?.contactsImported || 0 },
            { icon: Building2, label: "Companies", value: (job as any)?.companiesImported || 0 },
            { icon: Briefcase, label: "Deals", value: (job as any)?.dealsImported || 0 },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <Icon className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-black text-gray-900">{value.toLocaleString()}</div>
              <div className="text-xs text-gray-400">{label} imported</div>
            </div>
          ))}
        </div>

        {cheatSheet && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-left">
            <p className="font-bold text-orange-800 mb-2">Your {selectedProfile?.name} → Axiom Cheat Sheet</p>
            <pre className="text-xs text-orange-700 whitespace-pre-wrap font-mono">{cheatSheet}</pre>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            size="lg"
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
            onClick={() => window.location.href = "/contacts"}
          >
            <Users className="w-4 h-4 mr-2" /> View Contacts
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1 font-bold rounded-xl"
            onClick={() => { setStep("mode"); setSelectedCRM(null); setApiKey(""); setCsvFile(null); setJobId(null); }}
          >
            Import Another CRM
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
