import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  bulk_update: "bg-purple-100 text-purple-800",
  bulk_delete: "bg-red-100 text-red-800",
  set_parent: "bg-amber-100 text-amber-800",
};

export default function AuditLogs() {
  const [entityType, setEntityType] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const { data, isLoading } = trpc.batch1.auditLogs.list.useQuery({
    entityType: entityType || undefined,
    action: action || undefined,
    limit,
    offset,
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground text-sm">Complete record of all actions taken in your CRM.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <Select value={entityType} onValueChange={v => { setEntityType(v === "all" ? "" : v); setOffset(0); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              <SelectItem value="contacts">Contacts</SelectItem>
              <SelectItem value="deals">Deals</SelectItem>
              <SelectItem value="companies">Companies</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
          <Select value={action} onValueChange={v => { setAction(v === "all" ? "" : v); setOffset(0); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="bulk_update">Bulk Update</SelectItem>
              <SelectItem value="bulk_delete">Bulk Delete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Activity Log</CardTitle>
            {data && <span className="text-sm text-muted-foreground">{data.total.toLocaleString()} total entries</span>}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading audit logs…</div>
            ) : !data?.logs.length ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No audit log entries found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 pr-4 font-medium">Time</th>
                        <th className="text-left py-2 pr-4 font-medium">User</th>
                        <th className="text-left py-2 pr-4 font-medium">Action</th>
                        <th className="text-left py-2 pr-4 font-medium">Entity</th>
                        <th className="text-left py-2 font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.map(log => (
                        <tr key={log.id} className="border-b hover:bg-muted/30">
                          <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2 pr-4">
                            <div className="font-medium">{log.userName || "System"}</div>
                            <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                          </td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] ?? "bg-muted text-muted-foreground"}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            <Badge variant="outline" className="text-xs">{log.entityType}</Badge>
                            {log.entityName && <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[120px]">{log.entityName}</div>}
                          </td>
                          <td className="py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                            {log.changes ? JSON.stringify(log.changes).slice(0, 80) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    Showing {offset + 1}–{Math.min(offset + limit, data.total)} of {data.total}
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
    </DashboardLayout>
  );
}
