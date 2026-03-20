import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Globe, Mail, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Activity } from "lucide-react";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";
import { useSkin } from "@/contexts/SkinContext";


export default function DomainStats() {
  const { t } = useSkin();
  const [tab, setTab] = useState("domains");
  const domainAgg = trpc.domainStats.aggregated.useQuery();
  const providerBreakdown = trpc.domainStats.providerBreakdown.useQuery({ days: 30 });

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.domainStats} />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-blue-500" /> Domain Reputation Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor sending reputation, bounce rates, and complaint rates across all domains and providers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Domains</p>
                <p className="text-2xl font-bold">{domainAgg.data?.length || 0}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{domainAgg.data?.reduce((sum: number, d: any) => sum + (d.totalSent || 0), 0) || 0}</p>
              </div>
              <Mail className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Bounce Rate</p>
                <p className="text-2xl font-bold">{domainAgg.data?.length ? (domainAgg.data.reduce((sum: number, d: any) => sum + (d.avgBounceRate || 0), 0) / domainAgg.data.length / 100).toFixed(2) : '0.00'}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Open Rate</p>
                <p className="text-2xl font-bold">{domainAgg.data?.length ? (domainAgg.data.reduce((sum: number, d: any) => sum + (d.avgOpenRate || 0), 0) / domainAgg.data.length / 100).toFixed(1) : '0.0'}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="domains">By Domain</TabsTrigger>
          <TabsTrigger value="providers">By Provider</TabsTrigger>
        </TabsList>

        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Domain Performance</CardTitle>
              <CardDescription>Sending statistics aggregated per domain across all providers</CardDescription>
            </CardHeader>
            <CardContent>
              {!domainAgg.data?.length ? (
                <p className="text-center text-muted-foreground py-8">No sending data yet. Send your first campaign to see domain stats.</p>
              ) : (
                <div className="space-y-3">
                  {domainAgg.data.map((d: any) => {
                    const bounceRate = d.totalSent > 0 ? (d.totalBounced / d.totalSent * 100) : 0;
                    const complaintRate = d.totalSent > 0 ? (d.totalComplaints / d.totalSent * 100) : 0;
                    const openRate = d.totalDelivered > 0 ? (d.totalOpens / d.totalDelivered * 100) : 0;
                    const health = bounceRate < 2 && complaintRate < 0.1 ? 'healthy' : bounceRate < 5 ? 'warning' : 'danger';
                    return (
                      <div key={d.domain} className={`p-4 rounded-lg border-l-4 ${health === 'healthy' ? 'border-l-emerald-500' : health === 'warning' ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span className="font-semibold">{d.domain}</span>
                          </div>
                          <Badge variant={health === 'healthy' ? 'default' : health === 'warning' ? 'outline' : 'destructive'}>
                            {health === 'healthy' ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Healthy</> : health === 'warning' ? <><AlertTriangle className="h-3 w-3 mr-1" /> Warning</> : <><AlertTriangle className="h-3 w-3 mr-1" /> Danger</>}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-6 gap-4 text-sm">
                          <div><span className="text-muted-foreground">Sent:</span> <span className="font-medium">{d.totalSent}</span></div>
                          <div><span className="text-muted-foreground">Delivered:</span> <span className="font-medium">{d.totalDelivered}</span></div>
                          <div><span className="text-muted-foreground">Bounced:</span> <span className={`font-medium ${bounceRate > 2 ? 'text-red-500' : ''}`}>{d.totalBounced} ({bounceRate.toFixed(2)}%)</span></div>
                          <div><span className="text-muted-foreground">Complaints:</span> <span className={`font-medium ${complaintRate > 0.1 ? 'text-red-500' : ''}`}>{d.totalComplaints} ({complaintRate.toFixed(3)}%)</span></div>
                          <div><span className="text-muted-foreground">Opens:</span> <span className="font-medium">{d.totalOpens} ({openRate.toFixed(1)}%)</span></div>
                          <div><span className="text-muted-foreground">Clicks:</span> <span className="font-medium">{d.totalClicks}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Breakdown (Last 30 Days)</CardTitle>
              <CardDescription>How your emails perform across Gmail, Outlook, Yahoo, and other providers</CardDescription>
            </CardHeader>
            <CardContent>
              {!providerBreakdown.data?.length ? (
                <p className="text-center text-muted-foreground py-8">No provider data yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {providerBreakdown.data.map((p: any) => {
                    const bounceRate = p.totalSent > 0 ? (p.totalBounced / p.totalSent * 100) : 0;
                    const complaintRate = p.totalSent > 0 ? (p.totalComplaints / p.totalSent * 100) : 0;
                    return (
                      <Card key={p.provider}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Activity className="h-5 w-5" />
                            <h3 className="font-semibold capitalize text-lg">{p.provider}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-muted-foreground">Sent:</span> <span className="font-bold">{p.totalSent}</span></div>
                            <div><span className="text-muted-foreground">Delivered:</span> <span className="font-bold">{p.totalDelivered}</span></div>
                            <div>
                              <span className="text-muted-foreground">Bounce Rate:</span>{' '}
                              <span className={`font-bold ${bounceRate > 2 ? 'text-red-500' : 'text-emerald-500'}`}>{bounceRate.toFixed(2)}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Complaint Rate:</span>{' '}
                              <span className={`font-bold ${complaintRate > 0.1 ? 'text-red-500' : 'text-emerald-500'}`}>{complaintRate.toFixed(3)}%</span>
                            </div>
                            <div><span className="text-muted-foreground">Opens:</span> <span className="font-bold">{p.totalOpens}</span></div>
                            <div>
                              <span className="text-muted-foreground">Avg Open Rate:</span>{' '}
                              <span className="font-bold">{(p.avgOpenRate / 100).toFixed(1)}%</span>
                            </div>
                          </div>
                          {/* Health indicator */}
                          <div className="mt-3 pt-3 border-t">
                            {bounceRate < 2 && complaintRate < 0.1 ? (
                              <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" /> Within safe thresholds</Badge>
                            ) : (
                              <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Exceeds safe thresholds — review immediately</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
