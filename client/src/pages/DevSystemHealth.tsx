import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Database, Server, Clock, Cpu, HardDrive, RefreshCw, Users, Building2, Mail, Target, Zap } from "lucide-react";
import PageGuide from "@/components/PageGuide";

export default function DevSystemHealth() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.devTools.systemStats.useQuery();
  const { data: serverInfo, isLoading: serverLoading, refetch: refetchServer } = trpc.devTools.serverInfo.useQuery();
  const { data: tableCounts, isLoading: tablesLoading, refetch: refetchTables } = trpc.devTools.tableRowCounts.useQuery();

  const handleRefresh = () => { refetchStats(); refetchServer(); refetchTables(); };

  const memoryPercent = serverInfo ? Math.round((serverInfo.memory.heapUsed / serverInfo.memory.heapTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageGuide title="System Health Monitor" description="Real-time system health and performance metrics" sections={[
        { title: "Overview", content: "Monitor server health, memory usage, database table sizes, and platform-wide statistics in real time.", icon: "purpose" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Health Monitor</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time platform health and performance metrics</p>
        </div>
        <Button variant="outline" onClick={handleRefresh}><RefreshCw className="h-4 w-4 mr-2" />Refresh All</Button>
      </div>

      {/* Server Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Server className="h-5 w-5 text-emerald-400" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Server Status</p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Online</Badge>
                  <span className="text-xs text-muted-foreground">{serverInfo?.env || "dev"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Clock className="h-5 w-5 text-blue-400" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="text-lg font-bold">{serverLoading ? "..." : serverInfo?.uptimeFormatted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center"><Cpu className="h-5 w-5 text-purple-400" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Memory (Heap)</p>
                <p className="text-lg font-bold">{serverLoading ? "..." : `${serverInfo?.memory.heapUsed}MB / ${serverInfo?.memory.heapTotal}MB`}</p>
                <div className="w-full h-1.5 bg-muted rounded-full mt-1">
                  <div className={`h-full rounded-full ${memoryPercent > 80 ? "bg-red-500" : memoryPercent > 60 ? "bg-yellow-500" : "bg-emerald-500"}`} style={{ width: `${memoryPercent}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center"><HardDrive className="h-5 w-5 text-orange-400" /></div>
              <div>
                <p className="text-xs text-muted-foreground">RSS Memory</p>
                <p className="text-lg font-bold">{serverLoading ? "..." : `${serverInfo?.memory.rss}MB`}</p>
                <p className="text-xs text-muted-foreground">Node {serverInfo?.nodeVersion}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-400 bg-blue-500/10" },
          { label: "Active Users", value: stats?.activeUsers, icon: Activity, color: "text-emerald-400 bg-emerald-500/10" },
          { label: "Companies", value: stats?.totalCompanies, icon: Building2, color: "text-purple-400 bg-purple-500/10" },
          { label: "Pending Invites", value: stats?.pendingInvites, icon: Mail, color: "text-yellow-400 bg-yellow-500/10" },
          { label: "Contacts", value: stats?.totalContacts, icon: Users, color: "text-cyan-400 bg-cyan-500/10" },
          { label: "Deals", value: stats?.totalDeals, icon: Target, color: "text-pink-400 bg-pink-500/10" },
          { label: "Campaigns", value: stats?.totalCampaigns, icon: Mail, color: "text-indigo-400 bg-indigo-500/10" },
          { label: "Prospects", value: stats?.totalProspects, icon: Zap, color: "text-amber-400 bg-amber-500/10" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statsLoading ? "..." : stat.value ?? 0}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Database Table Sizes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Database Inspector</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead className="text-right">Row Count</TableHead>
                <TableHead className="text-right">Size Indicator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tablesLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : (
                (tableCounts || []).sort((a: any, b: any) => b.rows - a.rows).map((t: any) => {
                  const maxRows = Math.max(...(tableCounts || []).map((x: any) => x.rows), 1);
                  const pct = Math.round((t.rows / maxRows) * 100);
                  return (
                    <TableRow key={t.table}>
                      <TableCell className="font-mono text-sm">{t.table}</TableCell>
                      <TableCell className="text-right font-mono">{t.rows.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full">
                            <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                        </div>
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
