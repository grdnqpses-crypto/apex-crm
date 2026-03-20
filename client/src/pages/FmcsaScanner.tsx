import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  FileSearch, Radar, UserPlus, Send, Trash2, RefreshCw,
  Building2, MapPin, Phone, Mail, Shield, Hash,
  TrendingUp, AlertCircle, CheckCircle2, Clock, Loader2,
  ChevronDown, ChevronUp, ExternalLink, FileText,
} from "lucide-react";
import PageGuide from "@/components/PageGuide";
import { useSkin } from "@/contexts/SkinContext";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export default function FmcsaScanner() {
  const { t } = useSkin();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Scan parameters
  const [scanType, setScanType] = useState<"new" | "renewal" | "both">("both");
  const [state, setState] = useState<string>("");
  const [dateRange, setDateRange] = useState<"last_7_days" | "last_30_days" | "last_90_days" | "last_year">("last_30_days");
  const [count, setCount] = useState(25);
  const [isScanning, setIsScanning] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterTab, setFilterTab] = useState("all");
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [campaignType, setCampaignType] = useState<"new_broker" | "renewing_broker">("new_broker");

  // Queries
  const filingsQuery = trpc.brokerFilings.list.useQuery(
    { limit: 200 },
    { enabled: !!user && user.role === "admin" }
  );
  const statsQuery = trpc.brokerFilings.stats.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  // Mutations
  const scanMutation = trpc.brokerFilings.scan.useMutation({
    onSuccess: (data) => {
      toast.success(`Found ${data.created} broker filings (Batch: ${data.batchId})`);
      utils.brokerFilings.list.invalidate();
      utils.brokerFilings.stats.invalidate();
      setIsScanning(false);
    },
    onError: (err) => {
      toast.error(`Scan failed: ${err.message}`);
      setIsScanning(false);
    },
  });

  const createProspectsMutation = trpc.brokerFilings.createProspects.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.created} of ${data.total} filings converted to prospects`);
      utils.brokerFilings.list.invalidate();
      utils.brokerFilings.stats.invalidate();
      setSelectedIds(new Set());
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const enrollMutation = trpc.brokerFilings.enrollInCampaign.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.enrolled} brokers enrolled in ${data.campaignType === 'new_broker' ? 'New Broker Welcome' : 'Renewing Broker'} campaign`);
      utils.brokerFilings.list.invalidate();
      utils.brokerFilings.stats.invalidate();
      setSelectedIds(new Set());
      setShowCampaignDialog(false);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteBatchMutation = trpc.brokerFilings.deleteBatch.useMutation({
    onSuccess: () => {
      toast.success("Batch deleted");
      utils.brokerFilings.list.invalidate();
      utils.brokerFilings.stats.invalidate();
    },
  });

  // Filtered filings
  const filings = filingsQuery.data?.items ?? [];
  const filteredFilings = useMemo(() => {
    if (filterTab === "all") return filings;
    if (filterTab === "new") return filings.filter(f => f.filingType === "new");
    if (filterTab === "renewal") return filings.filter(f => f.filingType === "renewal");
    if (filterTab === "pending") return filings.filter(f => f.processedStatus === "pending");
    if (filterTab === "processed") return filings.filter(f => f.processedStatus !== "pending");
    return filings;
  }, [filings, filterTab]);

  const stats = statsQuery.data;

  // Batch IDs for cleanup
  const batchIds = useMemo(() => {
    const ids = new Set(filings.map(f => f.scanBatchId).filter(Boolean));
    return Array.from(ids) as string[];
  }, [filings]);

  const handleScan = () => {
    setIsScanning(true);
    scanMutation.mutate({
      scanType,
      state: state || undefined,
      dateRange,
      count,
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredFilings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFilings.map(f => f.id)));
    }
  };

  const selectByType = (type: "new" | "renewal") => {
    const ids = filteredFilings.filter(f => f.filingType === type && f.processedStatus === "pending").map(f => f.id);
    setSelectedIds(new Set(ids));
  };

  // Access check
  if (!user || user.role !== "admin") {
    return (
      <div className="container py-8">
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Shield className="h-16 w-16 text-destructive opacity-50" />
            <h2 className="text-xl font-semibold">Developer Access Required</h2>
            <p className="text-muted-foreground text-center max-w-md">
              The FMCSA Broker Filing Scanner is restricted to admin/developer accounts.
              Contact your system administrator for access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <PageGuide
        title="FMCSA Broker Filing Scanner"
        description="Developer-only tool that scans DOT/FMCSA broker authority filings to identify new and renewing transportation brokers. Convert filings to prospects and enroll them in targeted campaigns."
        sections={[
          { icon: "purpose", title: "What This Does", content: "Scans FMCSA databases for new broker authority applications and renewals, then converts them into prospects for targeted outreach campaigns." },
          { icon: "actions", title: "How To Use", content: "1) Configure scan parameters (type, state, date range). 2) Run scan. 3) Select filings. 4) Create prospects or enroll in campaigns." },
          { icon: "tips", title: "Campaign Types", content: "New Broker Welcome: congratulatory + trial offer. Renewing Broker Retention: empathy + competitor pricing + trial + easy import." },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSearch className="h-7 w-7 text-primary" />
            FMCSA Broker Filing Scanner
          </h1>
          <p className="text-muted-foreground mt-1">
            Scan DOT/FMCSA filings for new and renewing transportation broker authorities
          </p>
        </div>
        <Badge variant="outline" className="text-xs border-amber-500 text-amber-500">
          <Shield className="h-3 w-3 mr-1" /> DEVELOPER ONLY
        </Badge>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total Filings</div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/10 border-emerald-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{stats.newFilings}</div>
              <div className="text-xs text-muted-foreground">New Brokers</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.renewals}</div>
              <div className="text-xs text-muted-foreground">Renewals</div>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/10 border-purple-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.prospectCreated}</div>
              <div className="text-xs text-muted-foreground">Prospects</div>
            </CardContent>
          </Card>
          <Card className="bg-cyan-500/10 border-cyan-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">{stats.campaignEnrolled}</div>
              <div className="text-xs text-muted-foreground">In Campaigns</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scan Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-primary" />
            Scan Configuration
          </CardTitle>
          <CardDescription>
            Configure parameters for the FMCSA broker filing scan. The AI engine will query
            DOT/FMCSA databases and generate filing records for new and renewing broker authorities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Filing Type</Label>
              <Select value={scanType} onValueChange={(v) => setScanType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both (New & Renewal)</SelectItem>
                  <SelectItem value="new">New Applications Only</SelectItem>
                  <SelectItem value="renewal">Renewals Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>State Filter (Optional)</Label>
              <Select value={state || "all_states"} onValueChange={(v) => setState(v === "all_states" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_states">All States</SelectItem>
                  {US_STATES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Number of Results</Label>
              <Input
                type="number"
                min={5}
                max={100}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <Button
              size="lg"
              onClick={handleScan}
              disabled={isScanning}
              className="bg-gradient-to-r from-primary to-blue-600"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning FMCSA Filings...
                </>
              ) : (
                <>
                  <Radar className="h-4 w-4 mr-2" />
                  Run FMCSA Scan
                </>
              )}
            </Button>
            {isScanning && (
              <span className="text-sm text-muted-foreground animate-pulse">
                AI is querying FMCSA databases... This may take 15-30 seconds.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filings.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Scan Results ({filteredFilings.length})
                </CardTitle>
                <CardDescription>
                  Select filings to create prospects or enroll in campaigns
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <>
                    <Badge variant="secondary">{selectedIds.size} selected</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => createProspectsMutation.mutate({ filingIds: Array.from(selectedIds) })}
                      disabled={createProspectsMutation.isPending}
                    >
                      {createProspectsMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <UserPlus className="h-3 w-3 mr-1" />}
                      Create Prospects
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowCampaignDialog(true)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Enroll in Campaign
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter tabs and quick select */}
            <div className="flex items-center justify-between mb-4">
              <Tabs value={filterTab} onValueChange={setFilterTab}>
                <TabsList>
                  <TabsTrigger value="all">All ({filings.length})</TabsTrigger>
                  <TabsTrigger value="new">New ({filings.filter(f => f.filingType === "new").length})</TabsTrigger>
                  <TabsTrigger value="renewal">Renewal ({filings.filter(f => f.filingType === "renewal").length})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({filings.filter(f => f.processedStatus === "pending").length})</TabsTrigger>
                  <TabsTrigger value="processed">Processed ({filings.filter(f => f.processedStatus !== "pending").length})</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={selectAll}>
                  {selectedIds.size === filteredFilings.length ? "Deselect All" : "Select All"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => selectByType("new")}>
                  Select New
                </Button>
                <Button size="sm" variant="ghost" onClick={() => selectByType("renewal")}>
                  Select Renewals
                </Button>
              </div>
            </div>

            {/* Filings list */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredFilings.map((filing) => (
                <div
                  key={filing.id}
                  className={`border rounded-lg transition-all ${
                    selectedIds.has(filing.id) ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    <Checkbox
                      checked={selectedIds.has(filing.id)}
                      onCheckedChange={() => toggleSelect(filing.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{filing.legalName}</span>
                        {filing.dbaName && filing.dbaName !== filing.legalName && (
                          <span className="text-xs text-muted-foreground">DBA: {filing.dbaName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" /> DOT: {filing.dotNumber}
                        </span>
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" /> MC: {filing.mcNumber}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {filing.phyCity}, {filing.phyState}
                        </span>
                        {filing.contactEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {filing.contactEmail}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={filing.filingType === "new" ? "default" : "secondary"}>
                        {filing.filingType === "new" ? "NEW" : "RENEWAL"}
                      </Badge>
                      <Badge variant="outline" className={
                        filing.processedStatus === "pending" ? "text-amber-500 border-amber-500" :
                        filing.processedStatus === "prospect_created" ? "text-purple-500 border-purple-500" :
                        filing.processedStatus === "campaign_enrolled" ? "text-cyan-500 border-cyan-500" :
                        "text-muted-foreground"
                      }>
                        {filing.processedStatus === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {filing.processedStatus === "prospect_created" && <UserPlus className="h-3 w-3 mr-1" />}
                        {filing.processedStatus === "campaign_enrolled" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {filing.processedStatus}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedId(expandedId === filing.id ? null : filing.id)}
                      >
                        {expandedId === filing.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedId === filing.id && (
                    <div className="px-3 pb-3 border-t border-border/50 pt-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground block text-xs">Contact Person</span>
                          <span className="font-medium">{filing.contactName || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">Phone</span>
                          <span className="font-medium flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {filing.contactPhone || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">Email</span>
                          <span className="font-medium flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {filing.contactEmail || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">Authority Status</span>
                          <Badge variant="outline">{filing.authorityStatus}</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">Full Address</span>
                          <span className="font-medium flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {filing.phyStreet}, {filing.phyCity}, {filing.phyState} {filing.phyZip}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">Bond/Surety</span>
                          <span className="font-medium">{filing.bondSuretyName || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">Bond Amount</span>
                          <span className="font-medium">${(filing.bondAmount ?? 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs">Filing Date</span>
                          <span className="font-medium">
                            {filing.filingDate ? new Date(filing.filingDate).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </div>
                      {filing.notes && (
                        <div className="mt-3 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
                          {filing.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {filteredFilings.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileSearch className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No filings found. Run a scan to discover broker filings.</p>
                </div>
              )}
            </div>

            {/* Batch management */}
            {batchIds.length > 0 && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-xs text-muted-foreground">Scan Batches:</span>
                {batchIds.map(batchId => (
                  <Badge key={batchId} variant="outline" className="text-xs gap-1">
                    {batchId}
                    <button
                      onClick={() => deleteBatchMutation.mutate({ scanBatchId: batchId })}
                      className="ml-1 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Campaign Enrollment Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Enroll in Campaign
            </DialogTitle>
            <DialogDescription>
              Choose a campaign type for the {selectedIds.size} selected broker filings.
              Prospects will be auto-created if they don't already exist.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                campaignType === "new_broker" ? "border-emerald-500 bg-emerald-500/10" : "border-border hover:border-muted-foreground/30"
              }`}
              onClick={() => setCampaignType("new_broker")}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold">New Broker Welcome Campaign</h4>
                  <p className="text-xs text-muted-foreground">
                    Congratulates new brokers, introduces Apex CRM benefits, offers 2-month free trial
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                campaignType === "renewing_broker" ? "border-blue-500 bg-blue-500/10" : "border-border hover:border-muted-foreground/30"
              }`}
              onClick={() => setCampaignType("renewing_broker")}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold">Renewing Broker Retention Campaign</h4>
                  <p className="text-xs text-muted-foreground">
                    Thanks for continued support, competitor pricing comparison, 2-month trial, easy import
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => enrollMutation.mutate({
                filingIds: Array.from(selectedIds),
                campaignType,
              })}
              disabled={enrollMutation.isPending}
            >
              {enrollMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enroll {selectedIds.size} Brokers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Templates Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              New Broker Welcome Campaign
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="text-muted-foreground">This campaign targets newly registered freight brokers with:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Congratulations on their new brokerage authority</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>How Apex CRM helps new brokers grow and prosper</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>2-month free trial offer with full access</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Quick-start guide and onboarding support</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-400" />
              Renewing Broker Retention Campaign
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="text-muted-foreground">This campaign targets renewing brokers with:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <span>Thanks for continued support in the industry</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <span>Empathy for industry struggles and challenges</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <span>Competitor pricing comparison (showing their high costs)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <span>How we're alleviating costs + 2-month free trial</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <span>Sign-up link + one-click contact/lead import</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <span>Fully automated onboarding to get rolling fast</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
