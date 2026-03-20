import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, DollarSign, Calendar, Target } from "lucide-react";

export default function SalesForecasting() {
  const [pipelineId, setPipelineId] = useState<string>("all");

  const { data: forecast, isLoading } = trpc.salesForecasting.getSummary.useQuery({
    pipelineId: pipelineId !== "all" ? parseInt(pipelineId) : undefined,
  });
  const { data: closingDeals } = trpc.salesForecasting.getClosingThisMonth.useQuery();
  // pipelines query removed — filter by pipeline not yet supported in UI
  const pipelines: { id: number; name: string }[] = [];

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  const totalPipeline = forecast?.byStage?.reduce((s, r) => s + (r.totalValue ?? 0), 0) ?? 0;
  const weightedForecast = forecast?.weightedTotal ?? 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Sales Forecasting
            </h1>
            <p className="text-muted-foreground mt-1">AI-weighted revenue forecast based on deal probability</p>
          </div>
          <Select value={pipelineId} onValueChange={setPipelineId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Pipelines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pipelines</SelectItem>
              {pipelines?.map((p: { id: number; name: string }) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Pipeline</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPipeline)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weighted Forecast</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(weightedForecast)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Closing This Month</p>
                  <p className="text-2xl font-bold">{closingDeals?.length ?? 0} deals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline by Stage */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={forecast?.byStage ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="stageId" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="totalValue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Value" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Monthly Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={forecast?.trend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Closing This Month */}
        <Card>
          <CardHeader>
            <CardTitle>Deals Closing This Month</CardTitle>
          </CardHeader>
          <CardContent>
            {!closingDeals?.length ? (
              <p className="text-muted-foreground text-center py-8">No deals closing this month.</p>
            ) : (
              <div className="space-y-3">
                {closingDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div>
                      <p className="font-medium">{deal.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Close: {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : "Not set"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(deal.value ?? 0)}</p>
                      <Badge variant={deal.status === "won" ? "default" : deal.status === "lost" ? "destructive" : "secondary"}>
                        {deal.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
