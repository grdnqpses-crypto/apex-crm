import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, RefreshCw, Mail, Phone, FileText, MessageSquare, Calendar } from "lucide-react";
import PageGuide from "@/components/PageGuide";

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
};

export default function DevActivityLog() {
  const { data: activities, isLoading, refetch } = trpc.devTools.activityLog.useQuery({ limit: 100 });

  return (
    <div className="space-y-6">
      <PageGuide title="Activity Log" description="Global activity log across all users and contacts" sections={[
        { title: "Overview", content: "View all CRM activities across the entire platform — emails, calls, notes, meetings, and tasks.", icon: "purpose" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Global Activity Log</h1>
          <p className="text-muted-foreground text-sm mt-1">{activities?.length || 0} recent activities across all users</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ScrollText className="h-5 w-5" />Recent Activities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Contact ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading activities...</TableCell></TableRow>
              ) : !activities || activities.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No activities recorded yet
                </TableCell></TableRow>
              ) : (
                activities.map((a: any) => {
                  const Icon = typeIcons[a.type] || MessageSquare;
                  const colorClass = typeColors[a.type] || "bg-gray-500/10 text-gray-400";
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded flex items-center justify-center ${colorClass}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">{a.type}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{a.subject || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">{a.body || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{a.contactId || "—"}</TableCell>
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
    </div>
  );
}
