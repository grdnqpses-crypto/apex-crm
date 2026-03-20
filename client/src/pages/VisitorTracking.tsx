import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
import {
  Eye, Building2, Globe, UserPlus, Clock, Code, Copy, Trash2,
  CheckCircle, AlertCircle, MonitorSmartphone, Sparkles, Loader2,
  Mail, ChevronDown, ChevronUp, Zap, Key, X, RefreshCw,
} from "lucide-react";

// ─── AI progress steps ───────────────────────────────────────────────────────
const PROGRESS_STEPS = [
  { id: "fetch",    label: "Fetching your website…" },
  { id: "detect",   label: "Detecting platform…" },
  { id: "attempt",  label: "Attempting automatic installation…" },
  { id: "finalize", label: "Finalising…" },
];

function ProgressStep({ label, state }: { label: string; state: "pending" | "active" | "done" }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      {state === "done"    && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
      {state === "active"  && <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />}
      {state === "pending" && <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />}
      <span className={state === "pending" ? "text-muted-foreground text-sm" : "text-sm font-medium"}>{label}</span>
    </div>
  );
}

const PLATFORM_COLORS: Record<string, string> = {
  wordpress:   "bg-blue-500/10 text-blue-400 border-blue-500/30",
  shopify:     "bg-green-500/10 text-green-400 border-green-500/30",
  webflow:     "bg-purple-500/10 text-purple-400 border-purple-500/30",
  wix:         "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  squarespace: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  framer:      "bg-pink-500/10 text-pink-400 border-pink-500/30",
  weebly:      "bg-orange-500/10 text-orange-400 border-orange-500/30",
  godaddy:     "bg-green-600/10 text-green-300 border-green-600/30",
  custom:      "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  unknown:     "bg-muted text-muted-foreground border-border",
};

// ─── Credentials Dialog ──────────────────────────────────────────────────────
type Platform = "wordpress" | "shopify" | "webflow";

function CredentialsDialog({
  open, onClose, websiteId, websiteName, existingPlatforms, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  websiteId: number;
  websiteName: string;
  existingPlatforms: string[];
  onSaved: () => void;
}) {
  const [platform, setPlatform] = useState<Platform>("wordpress");
  const [wpUser, setWpUser] = useState("");
  const [wpPass, setWpPass] = useState("");
  const [shopifyToken, setShopifyToken] = useState("");
  const [webflowToken, setWebflowToken] = useState("");

  const saveCredentials = trpc.visitorTracking.saveCredentials.useMutation({
    onSuccess: () => { toast.success("Credentials saved — auto-install is now active!"); onSaved(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCredentials = trpc.visitorTracking.deleteCredentials.useMutation({
    onSuccess: () => { toast.success("Credentials removed"); onSaved(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    const creds: Record<string, string> = {};
    if (platform === "wordpress") { creds.wpUser = wpUser; creds.wpAppPassword = wpPass; }
    if (platform === "shopify")   { creds.shopifyToken = shopifyToken; }
    if (platform === "webflow")   { creds.webflowToken = webflowToken; }
    saveCredentials.mutate({ websiteId, platform, credentials: creds });
  };

  const isValid =
    (platform === "wordpress" && wpUser && wpPass) ||
    (platform === "shopify" && shopifyToken) ||
    (platform === "webflow" && webflowToken);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />Connect Account — {websiteName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Store your platform credentials so Apex can auto-install the tracking script without any manual steps — now and for future updates.
          </p>

          {/* Platform selector */}
          <div className="flex gap-2">
            {(["wordpress", "shopify", "webflow"] as Platform[]).map(p => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all capitalize ${
                  platform === p
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {p}
                {existingPlatforms.includes(p) && (
                  <span className="ml-1 text-green-400">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Platform-specific fields */}
          {platform === "wordpress" && (
            <div className="space-y-3">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
                Use a WordPress Application Password (not your login password). Go to Users → Profile → Application Passwords in your WP admin.
              </div>
              <div className="space-y-1">
                <Label>WordPress Username</Label>
                <Input placeholder="admin" value={wpUser} onChange={e => setWpUser(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Application Password</Label>
                <Input type="password" placeholder="xxxx xxxx xxxx xxxx xxxx xxxx" value={wpPass} onChange={e => setWpPass(e.target.value)} />
              </div>
            </div>
          )}
          {platform === "shopify" && (
            <div className="space-y-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-xs text-green-300">
                Create a Private App in your Shopify Admin → Apps → Develop Apps. Grant "Themes" read/write access.
              </div>
              <div className="space-y-1">
                <Label>Admin API Access Token</Label>
                <Input type="password" placeholder="shpat_..." value={shopifyToken} onChange={e => setShopifyToken(e.target.value)} />
              </div>
            </div>
          )}
          {platform === "webflow" && (
            <div className="space-y-3">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-xs text-purple-300">
                Generate an API token in Webflow → Account Settings → Integrations → API Access.
              </div>
              <div className="space-y-1">
                <Label>Webflow API Token</Label>
                <Input type="password" placeholder="..." value={webflowToken} onChange={e => setWebflowToken(e.target.value)} />
              </div>
            </div>
          )}

          {/* Remove existing */}
          {existingPlatforms.includes(platform) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive w-full"
              onClick={() => deleteCredentials.mutate({ websiteId, platform })}
              disabled={deleteCredentials.isPending}
            >
              <X className="w-3 h-3 mr-1" />Remove saved {platform} credentials
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isValid || saveCredentials.isPending}>
            {saveCredentials.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
            Save & Enable Auto-Install
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function VisitorTracking() {
  const { t } = useSkin();
  const [url, setUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [result, setResult] = useState<null | {
    installMethod: "auto" | "mailto";
    platform: string;
    platformTitle: string;
    siteName: string;
    trackingId: string;
    trackingScript: string;
    message: string;
    mailtoLink: string | null;
    manualSteps: string[];
  }>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [showScript, setShowScript] = useState(false);

  // Credentials dialog state
  const [credDialog, setCredDialog] = useState<{ websiteId: number; websiteName: string } | null>(null);

  // Real-time visitor polling
  const [lastChecked, setLastChecked] = useState(() => Date.now());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const websites = trpc.visitorTracking.listWebsites.useQuery();
  const sessions  = trpc.visitorTracking.list.useQuery();
  const utils     = trpc.useUtils();

  // Credential platforms per website
  const credPlatforms = trpc.visitorTracking.getCredentialPlatforms.useQuery(
    { websiteId: credDialog?.websiteId ?? 0 },
    { enabled: !!credDialog }
  );

  // Poll for new identified visitors every 30s
  const newVisitors = trpc.visitorTracking.newIdentifiedVisitors.useQuery(
    { since: lastChecked },
    { enabled: false, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      const prev = lastChecked;
      setLastChecked(Date.now());
      const fresh = await utils.visitorTracking.newIdentifiedVisitors.fetch({ since: prev });
      if (fresh && fresh.length > 0) {
        fresh.forEach((v: any) => {
          toast(
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">{v.company} is on your site</p>
                <p className="text-xs text-muted-foreground">{v.industry ? `${v.industry} · ` : ""}{v.pageViews} page{v.pageViews !== 1 ? "s" : ""}</p>
              </div>
            </div>,
            {
              duration: 8000,
              action: {
                label: "View",
                onClick: () => {
                  const tab = document.querySelector('[data-value="visitors"]') as HTMLElement;
                  tab?.click();
                },
              },
            }
          );
        });
        sessions.refetch();
      }
    }, 30000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [lastChecked]);

  const setupTracking = trpc.visitorTracking.setupTracking.useMutation({
    onSuccess: (data) => {
      setActiveStep(3);
      setTimeout(() => {
        setIsRunning(false);
        setActiveStep(-1);
        setResult(data);
        utils.visitorTracking.listWebsites.invalidate();
      }, 600);
    },
    onError: (e) => {
      setIsRunning(false);
      setActiveStep(-1);
      toast.error(e.message || "Setup failed — please try again.");
    },
  });

  const removeWebsite = trpc.visitorTracking.removeWebsite.useMutation({
    onSuccess: () => { utils.visitorTracking.listWebsites.invalidate(); toast.success("Website removed"); },
  });

  const verify = trpc.visitorTracking.verifyInstallation.useMutation({
    onSuccess: (d) => {
      if (d.verified) toast.success("✅ Tracking script detected on your website!");
      else toast.error("Script not found yet — it may take a few minutes after installation.");
    },
  });

  const reinstall = trpc.visitorTracking.reinstallTracking.useMutation({
    onSuccess: (d) => {
      if (d.success) toast.success(`Auto-installed via ${d.platform}!`);
      else toast.error("No stored credentials found — connect your account first.");
    },
  });

  const convert = trpc.visitorTracking.convertToProspect.useMutation({
    onSuccess: () => { sessions.refetch(); toast.success("Converted to prospect"); },
  });

  const stepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isRunning) return;
    setActiveStep(0);
    const delays = [0, 1200, 2800, 5000];
    delays.forEach((d, i) => {
      stepTimer.current = setTimeout(() => setActiveStep(i), d);
    });
    return () => { if (stepTimer.current) clearTimeout(stepTimer.current); };
  }, [isRunning]);

  const handleSetup = () => {
    if (!url.trim()) { toast.error("Please enter your website URL"); return; }
    setResult(null);
    setIsRunning(true);
    setupTracking.mutate({ url: url.trim() });
  };

  const copyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    toast.success("Tracking script copied!");
  };

  const identified = sessions.data?.filter((s: any) => s.identifiedCompany) || [];
  const anonymous  = sessions.data?.filter((s: any) => !s.identifiedCompany) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visitor Tracking</h1>
        <p className="text-muted-foreground">Identify anonymous website visitors — reveal companies, track behaviour, convert to prospects. Free on all plans.</p>
      </div>

      <Tabs defaultValue="setup">
        <TabsList>
          <TabsTrigger value="setup">
            <MonitorSmartphone className="w-4 h-4 mr-2" />Set Up Tracking
          </TabsTrigger>
          <TabsTrigger value="websites" data-value="websites">
            <Globe className="w-4 h-4 mr-2" />My Websites
            {websites.data && websites.data.length > 0 && (
              <Badge className="ml-2 text-xs">{websites.data.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="visitors" data-value="visitors">
            <Eye className="w-4 h-4 mr-2" />Visitors
            {sessions.data && sessions.data.length > 0 && (
              <Badge className="ml-2 text-xs">{sessions.data.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Set Up Tracking Tab ───────────────────────────────────────── */}
        <TabsContent value="setup" className="space-y-4 mt-4">
          <Card className="border-border/60">
            <CardContent className="pt-6 pb-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-1">AI-Powered One-Click Install</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Enter your website URL. Apex detects your platform and installs the tracking script automatically — no technical knowledge needed.
                </p>
              </div>

              <div className="flex gap-2 max-w-xl mx-auto">
                <Input
                  placeholder="https://yourwebsite.com"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !isRunning && handleSetup()}
                  disabled={isRunning}
                  className="flex-1 h-11 text-base"
                />
                <Button onClick={handleSetup} disabled={isRunning || !url.trim()} className="h-11 px-6 font-semibold">
                  {isRunning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  {isRunning ? "Setting up…" : "Set Up Tracking"}
                </Button>
              </div>

              {isRunning && (
                <div className="mt-6 max-w-sm mx-auto bg-muted/40 rounded-xl p-4 border border-border/40">
                  {PROGRESS_STEPS.map((step, i) => (
                    <ProgressStep
                      key={step.id}
                      label={step.label}
                      state={i < activeStep ? "done" : i === activeStep ? "active" : "pending"}
                    />
                  ))}
                </div>
              )}

              {result && !isRunning && (
                <div className="mt-6 max-w-xl mx-auto space-y-4">
                  {result.installMethod === "auto" ? (
                    <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-400">Installed automatically!</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{result.message}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                      <Mail className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-amber-400">One more step needed</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PLATFORM_COLORS[result.platform] || PLATFORM_COLORS.unknown}`}>
                            {result.platformTitle}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {result.mailtoLink && (
                      <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                        <a href={result.mailtoLink}><Mail className="w-4 h-4 mr-2" />Open in Email — Send to Developer</a>
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setShowScript(s => !s)}>
                      <Code className="w-4 h-4 mr-2" />{showScript ? "Hide Script" : "View Script"}
                    </Button>
                    {result.manualSteps.length > 0 && (
                      <Button variant="ghost" onClick={() => setShowSteps(s => !s)}>
                        {showSteps ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                        {showSteps ? "Hide Steps" : "Show Manual Steps"}
                      </Button>
                    )}
                  </div>

                  {showScript && (
                    <div className="relative">
                      <pre className="bg-zinc-900 text-zinc-100 rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-border leading-relaxed">
                        {result.trackingScript}
                      </pre>
                      <Button size="sm" variant="outline" className="absolute top-2 right-2" onClick={() => copyScript(result.trackingScript)}>
                        <Copy className="w-3 h-3 mr-1" />Copy
                      </Button>
                    </div>
                  )}

                  {showSteps && result.manualSteps.length > 0 && (
                    <div className="bg-muted/40 rounded-xl p-4 border border-border/40">
                      <p className="text-sm font-semibold mb-3">Manual installation steps ({result.platformTitle}):</p>
                      <ol className="space-y-2">
                        {result.manualSteps.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">{i + 1}</span>
                            <span className="text-muted-foreground">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <p className="text-xs text-muted-foreground">After installation, verify it's working:</p>
                    <Button size="sm" variant="outline" onClick={() => {
                      const site = websites.data?.find((w: any) => w.twTrackingId === result.trackingId);
                      if (site) verify.mutate({ id: site.id });
                      else toast.info("Website saved — check the My Websites tab to verify.");
                    }} disabled={verify.isPending}>
                      {verify.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                      Verify Installation
                    </Button>
                  </div>
                </div>
              )}

              {!isRunning && !result && (
                <div className="mt-8 grid grid-cols-3 gap-4 max-w-xl mx-auto">
                  {[
                    { icon: Globe,     title: "Detects Platform",    desc: "WordPress, Shopify, Webflow, Wix, Squarespace, and more" },
                    { icon: Zap,       title: "Auto-Installs",       desc: "Injects the script via platform API — no code editing needed" },
                    { icon: Building2, title: "Identifies Visitors", desc: "Reveals which companies are browsing your site in real time" },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="text-center p-3 rounded-xl bg-muted/30 border border-border/40">
                      <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                      <p className="text-xs font-semibold mb-1">{title}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── My Websites Tab ───────────────────────────────────────────── */}
        <TabsContent value="websites" className="space-y-3 mt-4">
          {websites.data?.length === 0 ? (
            <Card className="border-dashed border-2 border-border">
              <CardContent className="py-12 text-center">
                <Globe className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold mb-1">No websites yet</p>
                <p className="text-sm text-muted-foreground">Use the Set Up Tracking tab to add your first website.</p>
              </CardContent>
            </Card>
          ) : (
            websites.data?.map((site: any) => (
              <WebsiteCard
                key={site.id}
                site={site}
                onVerify={() => verify.mutate({ id: site.id })}
                onReinstall={() => reinstall.mutate({ websiteId: site.id })}
                onConnectAccount={() => setCredDialog({ websiteId: site.id, websiteName: site.twName })}
                onRemove={() => removeWebsite.mutate({ id: site.id })}
                verifyPending={verify.isPending}
                reinstallPending={reinstall.isPending}
              />
            ))
          )}
        </TabsContent>

        {/* ── Visitor Sessions Tab ──────────────────────────────────────── */}
        <TabsContent value="visitors" className="space-y-4 mt-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Visitors",  value: sessions.data?.length || 0,                                            icon: Eye,       color: "text-blue-400" },
              { label: "Identified",      value: identified.length,                                                     icon: Building2, color: "text-green-400" },
              { label: "Anonymous",       value: anonymous.length,                                                      icon: Globe,     color: "text-gray-400" },
              { label: "Converted",       value: sessions.data?.filter((s: any) => s.convertedToProspect).length || 0, icon: UserPlus,  color: "text-purple-400" },
            ].map(s => (
              <Card key={s.label} className="border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div><p className="text-xs text-muted-foreground uppercase">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
                  <s.icon className={`w-8 h-8 ${s.color} opacity-50`} />
                </CardContent>
              </Card>
            ))}
          </div>

          {sessions.data?.length === 0 ? (
            <Card className="border-dashed border-2 border-border">
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold mb-1">No visitor sessions yet</p>
                <p className="text-sm text-muted-foreground">Set up tracking on your website to start seeing visitors.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {identified.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Building2 className="w-5 h-5" />Identified Companies</h3>
                  <div className="space-y-3">
                    {identified.map((s: any) => (
                      <Card key={s.id} className="border-border/50 border-l-4 border-l-green-500">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-green-400" /></div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{s.identifiedCompany}</span>
                                {s.identifiedIndustry && <Badge variant="outline">{s.identifiedIndustry}</Badge>}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                {s.identifiedDomain && <span><Globe className="w-3 h-3 inline mr-1" />{s.identifiedDomain}</span>}
                                <span><Clock className="w-3 h-3 inline mr-1" />{s.totalPageViews || 0} pages · {Math.round((s.totalDuration || 0) / 60)}min</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => convert.mutate({ id: s.id })} disabled={s.convertedToProspect || convert.isPending}>
                            <UserPlus className="w-4 h-4 mr-1" />{s.convertedToProspect ? "Converted" : "Convert to Prospect"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {anonymous.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Eye className="w-5 h-5" />Anonymous Visitors</h3>
                  <div className="space-y-2">
                    {anonymous.slice(0, 20).map((s: any) => (
                      <Card key={s.id} className="border-border/50">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><Eye className="w-4 h-4 text-muted-foreground" /></div>
                            <div>
                              <p className="text-sm font-medium">Anonymous Visitor</p>
                              <p className="text-xs text-muted-foreground">{s.totalPageViews || 1} page{(s.totalPageViews || 1) > 1 ? "s" : ""} · {new Date(s.lastVisit).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Unidentified</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Credentials Dialog */}
      {credDialog && (
        <CredentialsDialog
          open={!!credDialog}
          onClose={() => setCredDialog(null)}
          websiteId={credDialog.websiteId}
          websiteName={credDialog.websiteName}
          existingPlatforms={credPlatforms.data?.map((p: any) => p.platform) || []}
          onSaved={() => websites.refetch()}
        />
      )}
    </div>
  );
}

// ─── Website Card ─────────────────────────────────────────────────────────────
function WebsiteCard({
  site, onVerify, onReinstall, onConnectAccount, onRemove, verifyPending, reinstallPending,
}: {
  site: any;
  onVerify: () => void;
  onReinstall: () => void;
  onConnectAccount: () => void;
  onRemove: () => void;
  verifyPending: boolean;
  reinstallPending: boolean;
}) {
  const credPlatforms = trpc.visitorTracking.getCredentialPlatforms.useQuery({ websiteId: site.id });
  const hasCredentials = (credPlatforms.data?.length ?? 0) > 0;

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{site.twName}</span>
                <Badge variant={site.twIsActive ? "default" : "secondary"} className="text-xs">
                  {site.twIsActive ? "Active" : "Inactive"}
                </Badge>
                {hasCredentials && (
                  <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                    <Zap className="w-3 h-3 mr-1" />Auto-install ready
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{site.twDomain}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">ID: {site.twTrackingId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={onConnectAccount}>
              <Key className="w-3 h-3 mr-1" />Connect Account
            </Button>
            {hasCredentials && (
              <Button variant="outline" size="sm" onClick={onReinstall} disabled={reinstallPending}>
                {reinstallPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                Re-install
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onVerify} disabled={verifyPending}>
              {verifyPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
              Verify
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onRemove}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
