import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ChevronLeft, ChevronRight, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSkin } from "@/contexts/SkinContext";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-500/15 text-green-400",
  update: "bg-blue-500/15 text-blue-400",
  delete: "bg-red-500/15 text-red-400",
  bulk_update: "bg-purple-500/15 text-purple-400",
  bulk_delete: "bg-red-500/15 text-red-400",
  set_parent: "bg-amber-500/15 text-amber-400",
  login: "bg-cyan-500/15 text-cyan-400",
  logout: "bg-muted text-muted-foreground",
  export: "bg-teal-500/15 text-teal-400",
  import: "bg-indigo-500/15 text-indigo-400",
};

export default function AuditLogs() {
  const { t } = useSkin();
  const [entityType, setEntityType] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const queryInput = useMemo(() => ({
    entityType: entityType || undefined,
    action: action || undefined,
    limit,
    offset,
    startDate: dateFrom ? new Date(dateFrom).getTime() : undefined,
    endDate: dateTo ? new Date(dateTo + "T23:59:59").getTime() : undefined,
  }), [entityType, action, dateFrom, dateTo, offset]);

  const { data, isLoading } = trpc.auditLogs.list.useQuery(queryInput);

  // CSV export — fetch all matching rows (up to 5000) and download
  const handleExportCSV = async () => {
    if (!data?.logs.length) { toast.error("No data to export"); return; }
    const headers = ["Time", "User", "Email", "Action", "Entity Type", "Entity Name", "Details"];
    const rows = data.logs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.userName || "System",
      log.userEmail || "",
      log.action,
      log.entityType,
      log.entityName || "",
      log.changes ? JSON.stringify(log.changes).replace(/"/g, "'") : "",
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.logs.length} entries`);
  };

  const clearFilters = () => {
    setEntityType("");
    setAction("");
    setDateFrom("");
    setDateTo("");
    setOffset(0);
  };

  const hasFilters = entityType || action || dateFrom || dateTo;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground text-sm">Complete record of all actions taken in your CRM.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV} disabled={!data?.logs.length}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-6 text-xs ml-auto" onClick={clearFilters}>
                Clear all
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Entity Type</Label>
              <Select value={entityType || "all"} onValueChange={v => { setEntityType(v === "all" ? "" : v); setOffset(0); }}>
                <SelectTrigger className="h-8 bg-secondary/30">
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entities</SelectItem>
                  <SelectItem value="contacts">{t("contacts")}</SelectItem>
                  <SelectItem value="deals">{t("deals")}</SelectItem>
                  <SelectItem value="companies">{t("companies")}</SelectItem>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="campaigns">Campaigns</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="company">Company Settings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Event Type</Label>
              <Select value={action || "all"} onValueChange={v => { setAction(v === "all" ? "" : v); setOffset(0); }}>
                <SelectTrigger className="h-8 bg-secondary/30">
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="bulk_update">Bulk Update</SelectItem>
                  <SelectItem value="bulk_delete">Bulk Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setOffset(0); }}
                className="h-8 bg-secondary/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setOffset(0); }}
                className="h-8 bg-secondary/30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Activity Log</CardTitle>
          {data && (
            <span className="text-sm text-muted-foreground">
              {data.total.toLocaleString()} {hasFilters ? "filtered" : "total"} entries
            </span>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading audit logs…</div>
          ) : !data?.logs.length ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">No audit log entries found.</p>
              {hasFilters && <Button variant="link" size="sm" onClick={clearFilters}>Clear filters</Button>}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2.5 px-4 font-medium whitespace-nowrap">Time</th>
                      <th className="text-left py-2.5 px-4 font-medium">User</th>
                      <th className="text-left py-2.5 px-4 font-medium">Event</th>
                      <th className="text-left py-2.5 px-4 font-medium">Entity</th>
                      <th className="text-left py-2.5 px-4 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.logs.map(log => (
                      <tr key={log.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap text-xs">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-sm">{log.userName || "System"}</div>
                          {log.userEmail && <div className="text-xs text-muted-foreground">{log.userEmail}</div>}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide ${ACTION_COLORS[log.action] ?? "bg-muted text-muted-foreground"}`}>
                            {log.action.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant="outline" className="text-xs capitalize">{log.entityType}</Badge>
                          {log.entityName && (
                            <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[140px]" title={log.entityName}>
                              {log.entityName}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-xs text-muted-foreground max-w-[220px] truncate" title={log.changes ? JSON.stringify(log.changes) : undefined}>
                          {log.changes ? JSON.stringify(log.changes).slice(0, 90) + (JSON.stringify(log.changes).length > 90 ? "…" : "") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  {offset + 1}–{Math.min(offset + limit, data.total)} of {data.total.toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={offset + limit >= data.total} onClick={() => setOffset(offset + limit)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
