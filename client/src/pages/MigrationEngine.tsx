import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowRightLeft, CheckCircle, AlertCircle, Zap, RefreshCw, ShieldAlert, Lock } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";
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

export default function MigrationEngine() {
  const { t } = useSkin();
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";

  const jobs = trpc.migration.listJobs.useQuery(undefined, { enabled: isAdmin });
  const startMigration = trpc.migration.startMigration.useMutation({
    onSuccess: () => {
      jobs.refetch();
      toast.success("Sync started! We'll import only new and updated records.");
    },
    onError: (err) => {
      toast.error(`Sync failed to start: ${err.message}`);
    },
  });

  const [syncingJobId, setSyncingJobId] = useState<number | null>(null);

  function handleIncrementalSync(job: any) {
    if (!job.sourcePlatform || !job.lastSyncedAt) return;
    setSyncingJobId(job.id);
    // Use the job's lastSyncedAt as the sinceDate so we only pull records modified since then
    startMigration.mutate({
      sourceSystem: job.sourcePlatform as any,
      // We don't have the API key stored — send the user to the wizard to re-enter it
      sinceDate: job.lastSyncedAt,
      isIncrementalSync: true,
    }, {
      onSettled: () => setSyncingJobId(null),
    });
  }

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
            CRM migrations can only be initiated by company administrators. Please contact your admin to run a migration, or ask them to upgrade your account role.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Migration History */}
      {jobs.data && jobs.data.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Migration History</h3>
          <div className="space-y-3">
            {jobs.data.map((job: any) => {
              const isCompleted = job.status === "completed";
              const isSyncing = syncingJobId === job.id || startMigration.isPending;
              const lastSynced = job.lastSyncedAt
                ? new Date(Number(job.lastSyncedAt)).toLocaleString()
                : null;
              const totalImported =
                (job.contactsImported || 0) +
                (job.companiesImported || 0) +
                (job.dealsImported || 0) +
                (job.activitiesImported || 0);

              return (
                <Card key={job.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: icon + info */}
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
                              <Badge className="bg-blue-500/10 text-blue-500 text-xs">
                                Incremental Sync
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {totalImported > 0
                              ? `${totalImported.toLocaleString()} records imported`
                              : `${job.totalRecords || 0} records`}
                            {" · "}
                            {new Date(Number(job.createdAt)).toLocaleDateString()}
                          </p>
                          {lastSynced && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5">
                              Last synced: {lastSynced}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: status icon + sync button */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {isCompleted && (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <Link href={`/migration/wizard?sync=${job.sourcePlatform}&sinceDate=${job.lastSyncedAt || job.completedAt || ""}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl font-medium text-xs"
                                disabled={isSyncing}
                              >
                                {isSyncing ? (
                                  <><RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> Syncing...</>
                                ) : (
                                  <><RefreshCw className="w-3 h-3 mr-1.5" /> Sync New Records</>
                                )}
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

                    {/* Error details */}
                    {job.status === "failed" && job.errorDetails && Array.isArray(job.errorDetails) && job.errorDetails.length > 0 && (
                      <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-600">
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
    </div>
  );
}
