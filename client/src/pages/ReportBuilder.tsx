import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Plus, BarChart2, Download, Share2, Trash2, MoreHorizontal, Play, Table, PieChart, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const REPORT_TYPES = [
  { value: "contacts", label: "Contacts", icon: "👥" },
  { value: "companies", label: "Companies", icon: "🏢" },
  { value: "deals", label: "Deals & Pipeline", icon: "💰" },
  { value: "activities", label: "Activities", icon: "📋" },
  { value: "campaigns", label: "Campaigns", icon: "📧" },
  { value: "revenue", label: "Revenue", icon: "📈" },
];

const COLUMNS_BY_TYPE: Record<string, string[]> = {
  contacts: ["First Name", "Last Name", "Email", "Company", "Lead Score", "Stage", "Created At", "Last Activity"],
  companies: ["Name", "Industry", "Size", "Revenue", "City", "Country", "Created At"],
  deals: ["Title", "Value", "Stage", "Close Date", "Owner", "Company", "Created At"],
  activities: ["Type", "Subject", "Contact", "Company", "Date", "Owner"],
  campaigns: ["Name", "Status", "Sent", "Opens", "Clicks", "Replies", "Created At"],
  revenue: ["Month", "Deals Won", "Total Value", "Avg Deal Size", "Win Rate"],
};

export default function ReportBuilder() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    reportType: "contacts",
    selectedColumns: [] as string[],
    groupBy: "",
    sortBy: "",
    sortDir: "desc" as "asc" | "desc",
    isShared: false,
  });
  const [runningId, setRunningId] = useState<number | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  const { data: reports = [], refetch } = trpc.reports.list.useQuery();
  const createMutation = trpc.reports.create.useMutation();
  const deleteMutation = trpc.reports.delete.useMutation();
  const runMutation = trpc.reports.runReport.useMutation();
  const exportMutation = trpc.reports.runReport.useMutation(); // export uses same run, we'll generate CSV client-side

  const availableColumns = COLUMNS_BY_TYPE[form.reportType] ?? [];

  const toggleColumn = (col: string) => {
    setForm(f => ({
      ...f,
      selectedColumns: f.selectedColumns.includes(col)
        ? f.selectedColumns.filter(c => c !== col)
        : [...f.selectedColumns, col],
    }));
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await createMutation.mutateAsync({
        name: form.name,
        reportType: form.reportType as any,
        columnsJson: form.selectedColumns.length ? form.selectedColumns : undefined,
        groupBy: form.groupBy || undefined,
        sortBy: form.sortBy || undefined,
        sortDir: form.sortDir,
        isShared: form.isShared,
      });
      toast.success("Report created");
      setShowCreate(false);
      setForm({ name: "", reportType: "contacts", selectedColumns: [], groupBy: "", sortBy: "", sortDir: "desc", isShared: false });
      refetch();
    } catch { toast.error("Create failed"); }
  };

  const handleRun = async (id: number) => {
    setRunningId(id);
    try {
      const result = await runMutation.mutateAsync({ id });
      setReportData(result);
    } catch { toast.error("Run failed"); }
    finally { setRunningId(null); }
  };

  const handleExport = async (id: number, name: string) => {
    try {
      const result = await runMutation.mutateAsync({ id });
      if (!result.rows?.length) { toast.error("No data to export"); return; }
      const headers = Object.keys(result.rows[0]).join(",");
      const rows = result.rows.map((r: any) => Object.values(r).map((v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const csv = headers + "\n" + rows;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.replace(/\s+/g, "_")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch { toast.error("Export failed"); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Report deleted");
      if (reportData?.reportId === id) setReportData(null);
      refetch();
    } catch { toast.error("Delete failed"); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Report Builder</h1>
            <p className="text-muted-foreground mt-1">Build custom reports and export data as CSV</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />New Report
          </Button>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map(report => {
            const typeConfig = REPORT_TYPES.find(t => t.value === report.reportType);
            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{typeConfig?.icon ?? "📊"}</span>
                      <div>
                        <CardTitle className="text-base">{report.name}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1 capitalize">{report.reportType}</Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExport(report.id, report.name)}>
                          <Download className="h-4 w-4 mr-2" />Export CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(report.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-3">
                    {report.isShared ? "Shared report" : "Private report"} · {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                  <Button size="sm" className="w-full" onClick={() => handleRun(report.id)} disabled={runningId === report.id}>
                    <Play className="h-3 w-3 mr-1" />
                    {runningId === report.id ? "Running..." : "Run Report"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          {reports.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No reports yet</p>
              <p className="text-sm mt-1">Create your first custom report</p>
            </div>
          )}
        </div>

        {/* Report Results */}
        {reportData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Report Results ({reportData.totalRows} rows)
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleExport(reportData.reportId, "report")}>
                  <Download className="h-4 w-4 mr-1" />Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reportData.rows?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(reportData.rows[0]).map((col: string) => (
                          <th key={col} className="text-left py-2 px-3 font-semibold text-muted-foreground capitalize">{col.replace(/_/g, " ")}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.rows.slice(0, 50).map((row: any, i: number) => (
                        <tr key={i} className="border-b hover:bg-muted/30">
                          {Object.values(row).map((val: any, j: number) => (
                            <td key={j} className="py-2 px-3 text-sm">{String(val ?? "—")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reportData.rows.length > 50 && (
                    <p className="text-sm text-muted-foreground mt-3 text-center">Showing 50 of {reportData.totalRows} rows. Export CSV for full data.</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No data found for this report</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Report</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Report Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Monthly Deal Summary" className="mt-1" />
            </div>
            <div>
              <Label>Data Source</Label>
              <Select value={form.reportType} onValueChange={v => setForm(f => ({ ...f, reportType: v, selectedColumns: [] }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Columns <span className="text-muted-foreground text-xs">(select all to include)</span></Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                {availableColumns.map(col => (
                  <label key={col} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.selectedColumns.includes(col)} onCheckedChange={() => toggleColumn(col)} />
                    {col}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sort By</Label>
                <Select value={form.sortBy} onValueChange={v => setForm(f => ({ ...f, sortBy: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Default" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Default</SelectItem>
                    {availableColumns.map(col => <SelectItem key={col} value={col}>{col}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sort Direction</Label>
                <Select value={form.sortDir} onValueChange={v => setForm(f => ({ ...f, sortDir: v as any }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.isShared} onCheckedChange={v => setForm(f => ({ ...f, isShared: !!v }))} />
              <Label className="cursor-pointer">Share with team</Label>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name.trim() || createMutation.isPending}>Create Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
