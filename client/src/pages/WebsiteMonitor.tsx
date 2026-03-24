import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Globe, Plus, Trash2, Play, Eye, CheckCircle2, XCircle,
  Mail, Zap, TrendingUp, Clock, AlertCircle, RefreshCw,
  Award, Building2, DollarSign, Users, Rocket, Star,
  ChevronDown, ChevronRight, Loader2, Crown, Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ─── Signal type config ────────────────────────────────────────────────────────
const signalTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  award:          { label: "Award / Recognition",  icon: <Award className="h-4 w-4" />,     color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
  expansion:      { label: "Business Expansion",   icon: <Building2 className="h-4 w-4" />, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  funding:        { label: "Funding / Investment",  icon: <DollarSign className="h-4 w-4" />, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  new_hire:       { label: "New Hire / Promotion",  icon: <Users className="h-4 w-4" />,     color: "text-blue-400",  bg: "bg-blue-500/10 border-blue-500/20" },
  partnership:    { label: "New Partnership",       icon: <Zap className="h-4 w-4" />,       color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  product_launch: { label: "Product Launch",        icon: <Rocket className="h-4 w-4" />,    color: "text-cyan-400",  bg: "bg-cyan-500/10 border-cyan-500/20" },
  milestone:      { label: "Milestone Achieved",    icon: <Star className="h-4 w-4" />,      color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  certification:  { label: "Certification",         icon: <CheckCircle2 className="h-4 w-4" />, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20" },
  community:      { label: "Community Initiative",  icon: <Star className="h-4 w-4" />,      color: "text-pink-400",  bg: "bg-pink-500/10 border-pink-500/20" },
  other_positive: { label: "Positive News",         icon: <TrendingUp className="h-4 w-4" />, color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20" },
};

const ALL_SIGNAL_TYPES = Object.keys(signalTypeConfig);

// ─── Empty form ────────────────────────────────────────────────────────────────
const emptyForm = {
  companyName: "",
  websiteUrl: "",
  checkFrequency: "daily" as "daily" | "weekly",
  autoEmailEnabled: false,
  autoEmailFromName: "",
  autoEmailFromAddress: "",
  signalFilters: ALL_SIGNAL_TYPES,
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function WebsiteMonitor() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expandedMonitor, setExpandedMonitor] = useState<number | null>(null);
  const [crawlingId, setCrawlingId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data: stats } = trpc.websiteMonitor.stats.useQuery();
  const { data: monitors = [], isLoading } = trpc.websiteMonitor.list.useQuery();

  const createMut = trpc.websiteMonitor.create.useMutation({
    onSuccess: () => {
      utils.websiteMonitor.list.invalidate();
      utils.websiteMonitor.stats.invalidate();
      setShowCreate(false);
      setForm(emptyForm);
      toast.success("Website monitor created! First crawl will run shortly.");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.websiteMonitor.delete.useMutation({
    onSuccess: () => {
      utils.websiteMonitor.list.invalidate();
      utils.websiteMonitor.stats.invalidate();
      toast.success("Monitor deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.websiteMonitor.update.useMutation({
    onSuccess: () => {
      utils.websiteMonitor.list.invalidate();
      toast.success("Monitor updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const crawlMut = trpc.websiteMonitor.triggerCrawl.useMutation({
    onSuccess: (data, variables) => {
      setCrawlingId(null);
      utils.websiteMonitor.list.invalidate();
      utils.websiteMonitor.stats.invalidate();
      utils.signals.list.invalidate();
      if (data.signalsFound > 0) {
        toast.success(`Crawl complete! Found ${data.signalsFound} signal${data.signalsFound > 1 ? "s" : ""}. Check the Signals feed!`);
      } else {
        toast.info("Crawl complete — no new signals detected.");
      }
    },
    onError: (e) => {
      setCrawlingId(null);
      toast.error(e.message);
    },
  });

  function handleCrawl(id: number) {
    setCrawlingId(id);
    crawlMut.mutate({ id });
  }

  function toggleSignalFilter(type: string) {
    setForm(prev => ({
      ...prev,
      signalFilters: prev.signalFilters.includes(type)
        ? prev.signalFilters.filter(t => t !== type)
        : [...prev.signalFilters, type],
    }));
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-violet-400" />
              Website Intelligence Monitor
            </h1>
            <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 text-xs px-2 py-0.5">
              <Crown className="h-3 w-3 mr-1" />
              PREMIUM
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor client websites daily for positive signals — awards, expansions, funding, new hires — and auto-send congratulations emails.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" /> Add Website Monitor
        </Button>
      </div>

      {/* ─── Stats Bar ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Monitors", value: stats?.totalMonitors ?? 0, icon: <Globe className="h-5 w-5 text-violet-400" />, color: "text-violet-400" },
          { label: "Active", value: stats?.activeMonitors ?? 0, icon: <Activity className="h-5 w-5 text-green-400" />, color: "text-green-400" },
          { label: "Signals Found", value: stats?.totalSignals ?? 0, icon: <Zap className="h-5 w-5 text-amber-400" />, color: "text-amber-400" },
          { label: "Auto-Email On", value: stats?.autoEmailMonitors ?? 0, icon: <Mail className="h-5 w-5 text-cyan-400" />, color: "text-cyan-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                {stat.icon}
                <div>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── How It Works Banner ─── */}
      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-violet-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-violet-300">How Website Intelligence Monitor Works</p>
              <p className="text-xs text-muted-foreground mt-1">
                Each day, our AI crawls the websites you add, scans for positive announcements (awards, expansions, funding, new hires, partnerships, product launches, milestones), and creates signals in your feed.
                With Auto-Email enabled, a personalized congratulations email is automatically drafted and sent to your contact at that company — keeping you top-of-mind at exactly the right moment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Monitor List ─── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading monitors...
        </div>
      ) : monitors.length === 0 ? (
        <Card className="border-dashed border-border/50">
          <CardContent className="py-16 text-center">
            <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No website monitors yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1 mb-4">Add your first client website to start detecting signals automatically</p>
            <Button onClick={() => setShowCreate(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Add Your First Monitor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {monitors.map((monitor: any) => (
            <MonitorCard
              key={monitor.id}
              monitor={monitor}
              isExpanded={expandedMonitor === monitor.id}
              isCrawling={crawlingId === monitor.id}
              onToggleExpand={() => setExpandedMonitor(expandedMonitor === monitor.id ? null : monitor.id)}
              onCrawl={() => handleCrawl(monitor.id)}
              onToggleActive={() => updateMut.mutate({ id: monitor.id, isActive: !monitor.isActive })}
              onDelete={() => {
                if (confirm(`Delete monitor for ${monitor.companyName}?`)) {
                  deleteMut.mutate({ id: monitor.id });
                }
              }}
            />
          ))}
        </div>
      )}

      {/* ─── Create Dialog ─── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-violet-400" />
              Add Website Monitor
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-2">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="basic">Website</TabsTrigger>
              <TabsTrigger value="signals">Signal Types</TabsTrigger>
              <TabsTrigger value="email">Auto-Email</TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label className="text-xs">Company Name *</Label>
                <Input
                  value={form.companyName}
                  onChange={(e) => setForm(p => ({ ...p, companyName: e.target.value }))}
                  placeholder="Acme Logistics Inc."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Website URL *</Label>
                <Input
                  value={form.websiteUrl}
                  onChange={(e) => setForm(p => ({ ...p, websiteUrl: e.target.value }))}
                  placeholder="https://www.acmelogistics.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Check Frequency</Label>
                <Select value={form.checkFrequency} onValueChange={(v: any) => setForm(p => ({ ...p, checkFrequency: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily (recommended)</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Signal Types Tab */}
            <TabsContent value="signals" className="mt-4">
              <p className="text-xs text-muted-foreground mb-3">Select which types of positive signals should be detected and create alerts:</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(signalTypeConfig).map(([type, config]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleSignalFilter(type)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-colors ${
                      form.signalFilters.includes(type)
                        ? `${config.bg} border-current`
                        : "border-border/40 hover:border-border"
                    }`}
                  >
                    <span className={form.signalFilters.includes(type) ? config.color : "text-muted-foreground"}>
                      {config.icon}
                    </span>
                    <span className={form.signalFilters.includes(type) ? "font-medium" : "text-muted-foreground"}>
                      {config.label}
                    </span>
                    {form.signalFilters.includes(type) && (
                      <CheckCircle2 className="h-3 w-3 text-green-400 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setForm(p => ({ ...p, signalFilters: ALL_SIGNAL_TYPES }))}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setForm(p => ({ ...p, signalFilters: [] }))}>
                  Clear All
                </Button>
              </div>
            </TabsContent>

            {/* Auto-Email Tab */}
            <TabsContent value="email" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div>
                  <p className="text-sm font-medium">Auto-Send Congratulations Email</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Automatically send a personalized email when a positive signal is detected</p>
                </div>
                <Switch
                  checked={form.autoEmailEnabled}
                  onCheckedChange={(v) => setForm(p => ({ ...p, autoEmailEnabled: v }))}
                />
              </div>

              {form.autoEmailEnabled && (
                <div className="space-y-3 p-3 rounded-lg border border-violet-500/20 bg-violet-500/5">
                  <p className="text-xs font-medium text-violet-300">Email Sender Details</p>
                  <div>
                    <Label className="text-xs">From Name</Label>
                    <Input
                      value={form.autoEmailFromName}
                      onChange={(e) => setForm(p => ({ ...p, autoEmailFromName: e.target.value }))}
                      placeholder="Your Name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">From Email Address</Label>
                    <Input
                      value={form.autoEmailFromAddress}
                      onChange={(e) => setForm(p => ({ ...p, autoEmailFromAddress: e.target.value }))}
                      placeholder="you@yourcompany.com"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-300">
                      The AI will draft a warm, personalized congratulations email based on the specific signal detected. You can review sent emails in the activity log.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => createMut.mutate(form)}
              disabled={!form.companyName.trim() || !form.websiteUrl.trim() || createMut.isPending}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
              Create Monitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Monitor Card ──────────────────────────────────────────────────────────────
function MonitorCard({
  monitor,
  isExpanded,
  isCrawling,
  onToggleExpand,
  onCrawl,
  onToggleActive,
  onDelete,
}: {
  monitor: any;
  isExpanded: boolean;
  isCrawling: boolean;
  onToggleExpand: () => void;
  onCrawl: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const { data: history } = trpc.websiteMonitor.crawlHistory.useQuery(
    { monitorId: monitor.id, limit: 10 },
    { enabled: isExpanded }
  );

  return (
    <Card className={`border-border/50 transition-all ${monitor.isActive ? "" : "opacity-60"}`}>
      <CardContent className="pt-4 pb-4">
        {/* Header Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={onToggleExpand} className="text-muted-foreground hover:text-foreground">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{monitor.companyName}</span>
              <Badge variant="outline" className="text-xs font-normal border-border/40">
                <Globe className="h-3 w-3 mr-1" />
                {monitor.checkFrequency}
              </Badge>
              {monitor.autoEmailEnabled ? (
                <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs">
                  <Mail className="h-3 w-3 mr-1" /> Auto-Email On
                </Badge>
              ) : null}
              <Badge className={monitor.isActive
                ? "bg-green-500/10 text-green-400 border-green-500/20 text-xs"
                : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 text-xs"
              }>
                {monitor.isActive ? "Active" : "Paused"}
              </Badge>
            </div>
            <a
              href={monitor.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-violet-400 transition-colors truncate block"
            >
              {monitor.websiteUrl}
            </a>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            {monitor.totalSignalsFound > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <Zap className="h-3 w-3" />
                {monitor.totalSignalsFound} signal{monitor.totalSignalsFound !== 1 ? "s" : ""}
              </span>
            )}
            {monitor.lastCrawledAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(monitor.lastCrawledAt), { addSuffix: true })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-violet-400 hover:text-violet-300"
              onClick={onCrawl}
              disabled={isCrawling}
              title="Run crawl now"
            >
              {isCrawling ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onToggleActive}
              title={monitor.isActive ? "Pause monitor" : "Resume monitor"}
            >
              {monitor.isActive ? <Eye className="h-3 w-3 text-green-400" /> : <Play className="h-3 w-3 text-muted-foreground" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-red-400 hover:text-red-300"
              onClick={onDelete}
              title="Delete monitor"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Expanded: Crawl History */}
        {isExpanded && (
          <div className="mt-4 border-t border-border/30 pt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Recent Crawl History</p>
            {!history || history.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No crawls yet. Click the refresh icon to run the first crawl.</p>
            ) : (
              <div className="space-y-3">
                {history.map((crawl: any) => (
                  <CrawlResultRow key={crawl.id} crawl={crawl} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Crawl Result Row ──────────────────────────────────────────────────────────
function CrawlResultRow({ crawl }: { crawl: any }) {
  const [expanded, setExpanded] = useState(false);
  const signals: any[] = crawl.detectedSignals ?? [];

  return (
    <div className="rounded-lg border border-border/30 p-3 bg-muted/10">
      <div className="flex items-center gap-3">
        {crawl.crawlStatus === "success" ? (
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-red-400 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium">
              {new Date(crawl.crawledAt).toLocaleDateString()} {new Date(crawl.crawledAt).toLocaleTimeString()}
            </span>
            {signals.length > 0 ? (
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                <Zap className="h-3 w-3 mr-1" /> {signals.length} signal{signals.length !== 1 ? "s" : ""} detected
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">No signals detected</span>
            )}
          </div>
          {crawl.errorMessage && (
            <p className="text-xs text-red-400 mt-0.5">{crawl.errorMessage}</p>
          )}
        </div>
        {signals.length > 0 && (
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>

      {expanded && signals.length > 0 && (
        <div className="mt-3 space-y-2">
          {signals.map((signal: any, idx: number) => {
            const config = signalTypeConfig[signal.type] ?? signalTypeConfig.other_positive;
            return (
              <div key={idx} className={`rounded p-2.5 border ${config.bg}`}>
                <div className="flex items-start gap-2">
                  <span className={config.color}>{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold">{signal.title}</span>
                      <Badge variant="outline" className="text-xs border-border/40">
                        {Math.round(signal.confidence * 100)}% confidence
                      </Badge>
                      {signal.autoEmailSent && (
                        <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs">
                          <Mail className="h-3 w-3 mr-1" /> Email sent
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{signal.summary}</p>
                    {signal.sourceText && (
                      <p className="text-xs text-muted-foreground/60 mt-1 italic border-l-2 border-border/30 pl-2">
                        "{signal.sourceText.slice(0, 150)}{signal.sourceText.length > 150 ? "…" : ""}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
