import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowRightLeft, CheckCircle, AlertCircle, Zap, RefreshCw,
  ShieldAlert, Lock, Users, Building2, Briefcase, Activity,
  Clock, CalendarClock, Trash2, Plus, RotateCcw, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  in_progress: "bg-blue-500/20 text-blue-400",
  validating: "bg-blue-500/20 text-blue-400",
  fetching: "bg-blue-500/20 text-blue-400",
  analyzing: "bg-blue-500/20 text-blue-400",
  mapping: "bg-blue-500/20 text-blue-400",
  importing: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  validating: "Validating",
  fetching: "Fetching Data",
  analyzing: "Analyzing",
  mapping: "Mapping Fields",
  importing: "Importing",
  completed: "Completed",
  failed: "Failed",
};

const FREQUENCY_LABELS: Record<string, string> = {
  hourly: "Every Hour",
  daily: "Every Day",
  weekly: "Every Week",
};

export default function MigrationEngine() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";

  const jobs = trpc.migration.listJobs.useQuery(undefined, { enabled: isAdmin });
  const autoSyncConfigs = trpc.migration.getAutoSync.useQuery(undefined, { enabled: isAdmin });

  const setAutoSync = trpc.migration.setAutoSync.useMutation({
    onSuccess: () => {
      autoSyncConfigs.refetch();
      toast.success("Auto-sync settings saved.");
    },
    onError: (err) => toast.error(`Failed to save: ${err.message}`),
  });

  const deleteAutoSync = trpc.migration.deleteAutoSync.useMutation({
    onSuccess: () => {
      autoSyncConfigs.refetch();
      toast.success("Auto-sync removed.");
    },
    onError: (err) => toast.error(`Failed to remove: ${err.message}`),
  });

  // Rollback state
  const [rollbackJobId, setRollbackJobId] = useState<number | null>(null);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const rollbackEligible = trpc.migration.getRollbackEligibleJobs.useQuery(undefined, { enabled: isAdmin });
  const rollbackMigration = trpc.migration.rollback.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Rollback complete: ${data.deletedContacts ?? 0} contacts, ${data.deletedCompanies ?? 0} companies, ${data.deletedDeals ?? 0} deals removed`);
      setRollbackOpen(false);
      setRollbackJobId(null);
      jobs.refetch();
      rollbackEligible.refetch();
    },
    onError: (err: any) => toast.error(`Rollback failed: ${err.message}`),
  });

  // Local state for the "Add auto-sync" form
  const [addingSync, setAddingSync] = useState(false);
  const [newSyncPlatform, setNewSyncPlatform] = useState("hubspot");
  const [newSyncFrequency, setNewSyncFrequency] = useState<"hourly" | "daily" | "weekly">("daily");
  const [newSyncApiKey, setNewSyncApiKey] = useState("");

  // ── Admin gate ────────────────────────────────────────────────────────────
  if (loading) {
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
        <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  // Completed jobs for the "Sync New Records" feature
  const completedJobs = (jobs.data || []).filter((j: any) => j.status === "completed");
  // Most recent completed job per platform (for auto-sync display)
  const latestByPlatform: Record<string, any> = {};
  for (const job of completedJobs) {
    if (!latestByPlatform[job.sourcePlatform]) latestByPlatform[job.sourcePlatform] = job;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">One-Touch Migration</h1>
          <p className="text-muted-foreground">
            Switch to AXIOM CRM in 60 seconds — bring everything with you from any platform
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-xs text-amber-700 font-medium">Admin only</span>
        </div>
      </div>

      {/* CTA to full wizard */}
      <Card className="border-primary/30 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-900">Start a New Migration</h3>
            <p className="text-sm text-gray-500 mt-1">
              Import contacts, companies, deals, and activities from any CRM with AI-powered field mapping.
            </p>
          </div>
          <Link href="/migration/wizard">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-6">
              <Zap className="w-4 h-4 mr-2" /> Launch Wizard
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* ── Auto-Sync Settings ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary" />
              Scheduled Auto-Sync
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setAddingSync(v => !v)}
            >
              <Plus className="w-3 h-3 mr-1" /> Add Schedule
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Automatically pull new and updated records from your source CRM on a schedule.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add new form */}
          {addingSync && (
            <div className="flex items-end gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-medium">Source CRM</Label>
                <select
                  className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background"
                  value={newSyncPlatform}
                  onChange={e => setNewSyncPlatform(e.target.value)}
                >
                  {Object.keys(latestByPlatform).length > 0
                    ? Object.keys(latestByPlatform).map(p => (
                        <option key={p} value={p} className="capitalize">{p}</option>
                      ))
                    : ["hubspot", "salesforce", "pipedrive", "zoho"].map(p => (
                        <option key={p} value={p} className="capitalize">{p}</option>
                      ))
                  }
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-medium">Frequency</Label>
                <select
                  className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background"
                  value={newSyncFrequency}
                  onChange={e => setNewSyncFrequency(e.target.value as any)}
                >
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Every Day</option>
                  <option value="weekly">Every Week</option>
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-medium">API Key (optional)</Label>
                <input
                  type="password"
                  placeholder="Store for auto-run"
                  className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-background"
                  value={newSyncApiKey}
                  onChange={e => setNewSyncApiKey(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                className="rounded-xl"
                onClick={() => {
                  setAutoSync.mutate({ sourcePlatform: newSyncPlatform, enabled: true, frequency: newSyncFrequency, apiKey: newSyncApiKey || undefined });
                  setAddingSync(false);
                  setNewSyncApiKey("");
                }}
                disabled={setAutoSync.isPending}
              >
                Save
              </Button>
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setAddingSync(false)}>
                Cancel
              </Button>
            </div>
          )}

          {/* Existing configs */}
          {autoSyncConfigs.data && autoSyncConfigs.data.length > 0 ? (
            autoSyncConfigs.data.map((cfg: any) => (
              <div key={cfg.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm capitalize">{cfg.sourcePlatform}</p>
                    <p className="text-xs text-muted-foreground">
                      {FREQUENCY_LABELS[cfg.frequency] || cfg.frequency}
                      {cfg.nextRunAt && ` · Next: ${new Date(Number(cfg.nextRunAt)).toLocaleString()}`}
                    </p>
                    {cfg.hasCredentials ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-medium mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Auto-run enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Needs credentials
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={cfg.enabled}
                      onCheckedChange={(checked) =>
                        setAutoSync.mutate({ sourcePlatform: cfg.sourcePlatform, enabled: checked, frequency: cfg.frequency })
                      }
                    />
                    <span className="text-xs text-muted-foreground">{cfg.enabled ? "On" : "Off"}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    onClick={() => deleteAutoSync.mutate({ sourcePlatform: cfg.sourcePlatform })}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No auto-sync schedules configured. Click "Add Schedule" to set one up.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Migration History ───────────────────────────────────────────────── */}
      {jobs.data && jobs.data.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Migration History</h3>
          <div className="space-y-3">
            {jobs.data.map((job: any) => {
              const isCompleted = job.status === "completed";
              const lastSynced = job.lastSyncedAt
                ? new Date(Number(job.lastSyncedAt)).toLocaleString()
                : null;

              const contacts = job.contactsImported || 0;
              const companies = job.companiesImported || 0;
              const deals = job.dealsImported || 0;
              const activities = job.activitiesImported || 0;
              const totalImported = contacts + companies + deals + activities;
              const hasEntityCounts = contacts + companies + deals + activities > 0;

              return (
                <Card key={job.id} className="border-border/50">
                  <CardContent className="p-4 space-y-3">
                    {/* Top row: icon + name + badges + sync button */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <ArrowRightLeft className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold capitalize">{job.sourcePlatform}</span>
                            <Badge className={STATUS_COLORS[job.status] || "bg-gray-500/20"}>
                              {STATUS_LABELS[job.status] || job.status}
                            </Badge>
                            {job.isIncrementalSync && (
                              <Badge className="bg-blue-500/10 text-blue-500 text-xs">Incremental</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(Number(job.createdAt)).toLocaleDateString()}</span>
                            {lastSynced && (
                              <>
                                <span>·</span>
                                <span>Last synced: {lastSynced}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: status + sync button */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {isCompleted && (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <Link href={`/migration/wizard?sync=${job.sourcePlatform}&sinceDate=${job.lastSyncedAt || job.completedAt || ""}`}>
                              <Button variant="outline" size="sm" className="rounded-xl font-medium text-xs">
                                <RefreshCw className="w-3 h-3 mr-1.5" /> Sync New Records
                              </Button>
                            </Link>
                          </>
                        )}
                        {job.status === "failed" && (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                        {["validating", "fetching", "analyzing", "mapping", "importing", "in_progress"].includes(job.status) && (
                          <div className="w-28 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Per-entity count breakdown */}
                    {hasEntityCounts && (
                      <div className="grid grid-cols-4 gap-2 pt-1 border-t border-border/30">
                        {[
                          { icon: Users, label: "Contacts", count: contacts, color: "text-blue-500" },
                          { icon: Building2, label: "Companies", count: companies, color: "text-purple-500" },
                          { icon: Briefcase, label: "Deals", count: deals, color: "text-orange-500" },
                          { icon: Activity, label: "Activities", count: activities, color: "text-green-500" },
                        ].map(({ icon: Icon, label, count, color }) => (
                          <div key={label} className="flex items-center gap-1.5 text-xs">
                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${color}`} />
                            <span className="font-semibold">{count.toLocaleString()}</span>
                            <span className="text-muted-foreground hidden sm:inline">{label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fallback: total only */}
                    {!hasEntityCounts && totalImported > 0 && (
                      <p className="text-xs text-muted-foreground pt-1 border-t border-border/30">
                        {totalImported.toLocaleString()} total records imported
                      </p>
                    )}

                    {/* Error details */}
                    {job.status === "failed" && job.errorDetails && Array.isArray(job.errorDetails) && job.errorDetails.length > 0 && (
                      <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-600">
                        <strong>Error:</strong> {job.errorDetails[0]?.error || "Unknown error"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {jobs.data && jobs.data.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No migrations yet</p>
          <p className="text-sm mt-1">Click "Launch Wizard" above to import your first CRM.</p>
        </div>
      )}

      {/* ── 48-Hour Rollback ──────────────────────────────────────────────── */}
      {rollbackEligible.data && rollbackEligible.data.length >= 0 && (
        <Card className="border-amber-200/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-500" />
              48-Hour Rollback
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Undo a completed migration within 48 hours. This permanently removes all records imported by that job.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {(rollbackEligible.data || []).map((job: any) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                <div>
                  <p className="font-medium text-sm capitalize">{job.sourcePlatform} import</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(Number(job.completedAt)).toLocaleString()} · {(job.contactsImported || 0) + (job.companiesImported || 0) + (job.dealsImported || 0)} records
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">Expires: {new Date(Number(job.expiresAt)).toLocaleString()}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                  onClick={() => { setRollbackJobId(job.id); setRollbackOpen(true); }}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Rollback
                </Button>
              </div>
            ))}
            {(rollbackEligible.data || []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-3">
                No migrations within the 48-hour rollback window.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rollback confirmation dialog */}
      <Dialog open={rollbackOpen} onOpenChange={setRollbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Confirm Rollback
            </DialogTitle>
          </DialogHeader>
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700 text-sm">
              This will permanently delete all contacts, companies, deals, and activities imported by this migration job. This action cannot be undone.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRollbackOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => rollbackJobId && rollbackMigration.mutate({ jobId: rollbackJobId })}
              disabled={rollbackMigration.isPending}
            >
              {rollbackMigration.isPending ? "Rolling back..." : "Yes, Rollback Migration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
