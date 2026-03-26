import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Building2, GitMerge, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function BulkMerge() {
  const [entityType, setEntityType] = useState<"contact" | "company">("contact");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [matchOn, setMatchOn] = useState<"email" | "phone">("email");
  const { data: duplicates, isLoading, refetch } = trpc.bulkMerge.findDuplicates.useQuery({ matchOn });
  const merge = trpc.bulkMerge.merge.useMutation({
    onSuccess: (data) => {
      toast.success(`Merged ${data.merged} duplicate${data.merged !== 1 ? "s" : ""} successfully`);
      setSelected(new Set());
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleSelect = (id: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!duplicates) return;
    const allIds = duplicates.flatMap((g) => g.duplicateIds);
    setSelected(new Set(allIds));
  };

  const handleMerge = () => {
    if (selected.size === 0) return toast.error("Select at least one duplicate group to merge");
    merge.mutate({ entityType, selectedIds: Array.from(selected) });
  };

  const totalDuplicates = duplicates?.reduce((s, g) => s + g.duplicateIds.length, 0) ?? 0;

  return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <GitMerge className="w-6 h-6 text-blue-500" />
              Bulk Duplicate Merge
            </h1>
            <p className="text-muted-foreground mt-1">Detect and merge duplicate contacts or companies automatically</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Rescan
            </Button>
            {selected.size > 0 && (
              <Button onClick={handleMerge} disabled={merge.isPending} className="bg-blue-600 hover:bg-blue-700">
                <GitMerge className="w-4 h-4 mr-2" />
                {merge.isPending ? "Merging..." : `Merge ${selected.size} Selected`}
              </Button>
            )}
          </div>
        </div>

        {/* Entity type selector */}
        <div className="flex gap-3">
          <button
            onClick={() => { setEntityType("contact"); setSelected(new Set()); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all text-sm font-medium ${
              entityType === "contact" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <Users className="w-4 h-4" />
            Contacts
          </button>
          <button
            onClick={() => { setEntityType("company"); setSelected(new Set()); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all text-sm font-medium ${
              entityType === "company" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Companies
          </button>
        </div>

        {/* Stats bar */}
        {!isLoading && (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {duplicates?.length ?? 0} duplicate group{(duplicates?.length ?? 0) !== 1 ? "s" : ""} found
                {totalDuplicates > 0 && ` (${totalDuplicates} total records)`}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Duplicates are detected by matching email, name, or phone number similarity
              </p>
            </div>
            {(duplicates?.length ?? 0) > 0 && (
              <Button variant="outline" size="sm" onClick={selectAll} className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100">
                Select All
              </Button>
            )}
          </div>
        )}

        {/* Duplicate groups */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-28 bg-muted/30 rounded-xl" />
              </Card>
            ))}
          </div>
        ) : !duplicates?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No duplicates found</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Your {entityType} database is clean. AXIOM scans for matching emails, names, and phone numbers.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {duplicates.map((group) => (
              <Card key={group.primaryId} className={`transition-all ${selected.has(group.primaryId) ? "border-blue-400 bg-blue-50/30 dark:bg-blue-900/10" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected.has(group.primaryId)}
                      onCheckedChange={() => toggleSelect(group.primaryId)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-sm">{group.primaryName}</p>
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">Primary</Badge>
                        <Badge variant="secondary" className="text-xs">{group.matchReason}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.duplicateNames.map((name, i) => (
                          <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs">
                            <GitMerge className="w-3 h-3 text-muted-foreground" />
                            {name}
                          </div>
                        ))}
                      </div>
                      {group.primaryEmail && (
                        <p className="text-xs text-muted-foreground mt-2">{group.primaryEmail}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {group.duplicateIds.length + 1} records
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
  );
}
