import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skull, AlertTriangle, Clock, DollarSign, RefreshCw, Download, Zap, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";

export default function RottenDeals() {
  const { t } = useSkin();
  const [thresholdDays, setThresholdDays] = useState(14);
  const [engagingId, setEngagingId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: rottenDealsData, isLoading, refetch } = trpc.rottenDeals.list.useQuery({ thresholdDays });
  const rottenDeals = rottenDealsData ?? [];

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Re-engagement task created — check your Tasks page");
      setEngagingId(null);
    },
    onError: () => { toast.error("Failed to create task"); setEngagingId(null); },
  });

  const totalValue = rottenDeals.reduce((s: number, d: any) => s + (d.value ?? 0), 0);

  function rottenColor(days: number) {
    if (days >= 30) return "destructive";
    if (days >= 21) return "secondary";
    return "outline";
  }

  function handleReEngage(deal: any) {
    setEngagingId(deal.id);
    createTask.mutate({
      title: `Re-engage: ${deal.name}`,
      taskType: "follow_up",
      priority: deal.daysSinceUpdate >= 30 ? "high" : "medium",
      dealId: deal.id,
      description: `This deal has been stale for ${deal.daysSinceUpdate} days. Last updated: ${new Date(deal.updatedAt).toLocaleDateString()}. Take action to move it forward or mark as lost.`,
      dueDate: Date.now() + 86400000, // tomorrow
    });
  }

  function handleExportCsv() {
    if (!rottenDeals.length) { toast.error("No rotten deals to export"); return; }
    const headers = ["Deal Name", "Value", "Stage", "Days Stale", "Last Updated"];
    const rows = rottenDeals.map((d: any) => [
      `"${d.name}"`,
      d.value ?? 0,
      d.stageId ?? "",
      d.daysSinceUpdate,
      new Date(d.updatedAt).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rotten-deals-${thresholdDays}d.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported rotten deals CSV");
  }

  return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Skull className="h-7 w-7 text-destructive" />
            <div>
              <h1 className="text-2xl font-bold">Rotten Deals</h1>
              <p className="text-muted-foreground text-sm">Deals with no activity past your threshold — act now before they go cold.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Label htmlFor="threshold" className="text-sm whitespace-nowrap">Stale after</Label>
            <Input
              id="threshold"
              type="number"
              min={1}
              max={365}
              value={thresholdDays}
              onChange={e => setThresholdDays(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">days</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={!rottenDeals.length}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{rottenDeals?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground">Rotten deals</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <DollarSign className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">At-risk pipeline value</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{thresholdDays}d</p>
                <p className="text-sm text-muted-foreground">Inactivity threshold</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deals table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stale Deals</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading rotten deals…</div>
            ) : !rottenDeals.length ? (
              <div className="text-center py-12">
                <Skull className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No rotten deals — great work keeping your pipeline fresh!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 pr-4 font-medium">Deal</th>
                      <th className="text-left py-2 pr-4 font-medium">Value</th>
                      <th className="text-left py-2 pr-4 font-medium">Stage</th>
                      <th className="text-left py-2 pr-4 font-medium">Days Stale</th>
                      <th className="text-left py-2 pr-4 font-medium">Last Updated</th>
                      <th className="text-left py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rottenDeals.map((deal: any) => (
                      <tr key={deal.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-medium">{deal.name}</td>
                        <td className="py-3 pr-4">${(deal.value ?? 0).toLocaleString()}</td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline" className="text-xs">{deal.stageId}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={rottenColor(deal.daysSinceUpdate)} className="text-xs">
                            {deal.daysSinceUpdate}d
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {new Date(deal.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs h-7 rounded-lg"
                            disabled={engagingId === deal.id || createTask.isPending}
                            onClick={() => handleReEngage(deal)}
                          >
                            {engagingId === deal.id ? (
                              <><CheckCircle2 className="h-3 w-3 text-green-500" /> Creating…</>
                            ) : (
                              <><Zap className="h-3 w-3 text-amber-500" /> Re-engage</>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
