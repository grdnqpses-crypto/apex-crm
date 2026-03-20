import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowRightLeft, Upload, CheckCircle, Clock, AlertCircle, Zap } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

const PLATFORMS = [
  { id: "hubspot", name: "HubSpot", desc: "Contacts, companies, deals, emails", color: "bg-orange-500/10 text-orange-400" },
  { id: "salesforce", name: "Salesforce", desc: "Contacts, accounts, opportunities", color: "bg-blue-500/10 text-blue-400" },
  { id: "dat", name: "DAT / Tai TMS", desc: "Loads, carriers, lanes", color: "bg-green-500/10 text-green-400" },
  { id: "zoho", name: "Zoho CRM", desc: "Contacts, deals, accounts", color: "bg-red-500/10 text-red-400" },
  { id: "csv", name: "CSV / Spreadsheet", desc: "Universal import from any format", color: "bg-purple-500/10 text-purple-400" },
  { id: "mcleod", name: "McLeod PowerBroker", desc: "Full TMS data migration", color: "bg-cyan-500/10 text-cyan-400" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400", in_progress: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400", failed: "bg-red-500/20 text-red-400",
};

export default function MigrationEngine() {
  const { t } = useSkin();
  const jobs = trpc.migration.listJobs.useQuery();
  const startMigration = trpc.migration.startMigration.useMutation({ onSuccess: () => { jobs.refetch(); toast.success("Migration started!"); } });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">One-Touch Migration</h1><p className="text-muted-foreground">Switch to AXIOM CRM in 60 seconds — bring everything with you from any platform</p></div>

      <div className="grid grid-cols-3 gap-4">
        {PLATFORMS.map(p => (
          <Card key={p.id} className="border-border/50 hover:border-primary/30 transition-all cursor-pointer group" onClick={() => startMigration.mutate({ sourceSystem: p.id as any })}>
            <CardContent className="p-6 text-center">
              <div className={`w-14 h-14 rounded-xl ${p.color} flex items-center justify-center mx-auto mb-3`}><ArrowRightLeft className="w-7 h-7" /></div>
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
              <Button variant="outline" size="sm" className="mt-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Zap className="w-3 h-3 mr-1" />Import Now</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {jobs.data && jobs.data.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Migration History</h3>
          <div className="space-y-3">
            {jobs.data.map((job: any) => (
              <Card key={job.id} className="border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><ArrowRightLeft className="w-5 h-5 text-primary" /></div>
                    <div>
                      <div className="flex items-center gap-2"><span className="font-semibold capitalize">{job.sourcePlatform}</span><Badge className={STATUS_COLORS[job.status] || "bg-gray-500/20"}>{job.status}</Badge></div>
                      <p className="text-sm text-muted-foreground mt-1">{job.totalRecords || 0} records · {new Date(Number(job.createdAt)).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {job.status === "in_progress" && <div className="w-32 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full animate-pulse" style={{ width: `${job.progress || 50}%` }} /></div>}
                  {job.status === "completed" && <CheckCircle className="w-6 h-6 text-green-400" />}
                  {job.status === "failed" && <AlertCircle className="w-6 h-6 text-red-400" />}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
