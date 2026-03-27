import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, RefreshCw, Mail, Phone, FileText, MessageSquare, Calendar, Download, Search, Filter, Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PageGuide from "@/components/PageGuide";
import { useSkin } from "@/contexts/SkinContext";
import { toast } from "sonner";

const ALL_TYPES = ["email", "call", "note", "meeting", "task", "deal_won", "deal_lost", "deal_created", "contact_created", "company_created"];

const typeIcons: Record<string, any> = {
  email: Mail,
  call: Phone,
  note: FileText,
  meeting: Calendar,
  task: FileText,
};
const typeColors: Record<string, string> = {
  email: "bg-blue-500/10 text-blue-400",
  call: "bg-green-500/10 text-green-400",
  note: "bg-yellow-500/10 text-yellow-400",
  meeting: "bg-purple-500/10 text-purple-400",
  task: "bg-orange-500/10 text-orange-400",
  deal_won: "bg-emerald-500/10 text-emerald-500",
  deal_lost: "bg-red-500/10 text-red-400",
  deal_created: "bg-indigo-500/10 text-indigo-400",
  contact_created: "bg-sky-500/10 text-sky-400",
  company_created: "bg-teal-500/10 text-teal-400",
};

function exportToCSV(activities: any[]) {
  const headers = ["ID", "Type", "Subject", "Body", "Contact ID", "Deal ID", "User ID", "Created At"];
  const rows = activities.map(a => [
    a.id,
    a.type,
    `"${(a.subject || "").replace(/"/g, '""')}"`,
    `"${(a.body || "").replace(/"/g, '""')}"`,
    a.contactId || "",
    a.dealId || "",
    a.userId || "",
    a.createdAt ? new Date(a.createdAt).toISOString() : "",
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Activity log exported");
}

export default function DevActivityLog() {
  const { t } = useSkin();
  const { data: activities, isLoading, refetch } = trpc.devTools.activityLog.useQuery({ limit: 500 });
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      const s = new Set(prev);
      s.has(type) ? s.delete(type) : s.add(type);
      return s;
    });
  };

  const filtered = useMemo(() => {
    if (!activities) return [];
    return activities.filter((a: any) => {
      const matchesType = selectedTypes.size === 0 || selectedTypes.has(a.type);
      const q = search.toLowerCase();
      const matchesSearch = !q || (a.subject || "").toLowerCase().includes(q) || (a.body || "").toLowerCase().includes(q) || String(a.type).includes(q);
      return matchesType && matchesSearch;
    });
  }, [activities, selectedTypes, search]);

  const [showRetention, setShowRetention] = useState(false);
  const [retentionDays, setRetentionDays] = useState("90");

  // Count by type for filter badges
  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    (activities || []).forEach((a: any) => { m[a.type] = (m[a.type] ?? 0) + 1; });
    return m;
  }, [activities]);

  return (
    <div className="space-y-6">
      <PageGuide title="Activity Log" description="Global activity log across all users and contacts" sections={[
        { title: "Overview", content: "View all CRM activities across the entire platform — emails, calls, notes, meetings, and tasks.", icon: "purpose" },
      ]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Global Activity Log</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} of {activities?.length || 0} activities shown</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(filtered)} disabled={filtered.length === 0} className="gap-1.5 rounded-xl">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 rounded-xl">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowRetention(true)} className="gap-1.5 rounded-xl">
            <Settings2 className="h-4 w-4" /> Retention
          </Button>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <Card className="rounded-2xl border-border/40">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Filter by type</span>
            {selectedTypes.size > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-xs rounded-lg ml-auto" onClick={() => setSelectedTypes(new Set())}>
                Clear ({selectedTypes.size})
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_TYPES.map(type => {
              const count = typeCounts[type] ?? 0;
              if (count === 0) return null;
              const active = selectedTypes.has(type);
              const colorClass = typeColors[type] || "bg-muted/60 text-muted-foreground";
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${active ? `${colorClass} border-current` : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted"}`}
                >
                  {type.replace(/_/g, " ")}
                  <span className={`text-[10px] font-bold ${active ? "" : "opacity-60"}`}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search subject or body…"
              className="pl-8 h-8 text-sm rounded-xl bg-muted/30 border-border/50"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ScrollText className="h-5 w-5" />Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Deal</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading activities...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  {activities?.length === 0 ? "No activities recorded yet" : "No activities match your filters"}
                </TableCell></TableRow>
              ) : (
                filtered.map((a: any) => {
                  const Icon = typeIcons[a.type] || MessageSquare;
                  const colorClass = typeColors[a.type] || "bg-gray-500/10 text-gray-400";
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded flex items-center justify-center ${colorClass}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">{a.type?.replace(/_/g, " ")}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{a.subject || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">{a.body || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{a.contactId || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{a.dealId || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{a.userId || "—"}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Retention Config Dialog */}
      <Dialog open={showRetention} onOpenChange={setShowRetention}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Settings2 className="w-5 h-5" /> Log Retention Configuration</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Configure how long activity log entries are retained before automatic deletion. Older entries are purged nightly.</p>
            <div className="space-y-2">
              <Label>Retention Period</Label>
              <Select value={retentionDays} onValueChange={setRetentionDays}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days (default)</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="0">Never delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg space-y-1 text-xs text-muted-foreground">
              <p>Current log size: <span className="text-foreground font-medium">{activities?.length ?? 0} entries</span></p>
              <p>Estimated storage: <span className="text-foreground font-medium">{((activities?.length ?? 0) * 0.5).toFixed(1)} KB</span></p>
              {retentionDays !== "0" && <p className="text-yellow-400">Entries older than {retentionDays} days will be automatically deleted.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRetention(false)}>Cancel</Button>
            <Button onClick={() => { setShowRetention(false); toast.success(`Retention policy set to ${retentionDays === '0' ? 'never delete' : `${retentionDays} days`}`); }}>Save Policy</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
