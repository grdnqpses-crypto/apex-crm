import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Zap, TrendingUp, Phone, Mail, Truck, DollarSign, AlertTriangle,
  CheckCircle, Clock, Brain, Target, ArrowRight, Rocket, Shield,
  BarChart3, Users, FileText, Star
} from "lucide-react";

function MetricCard({ label, value, icon: Icon, color, trend }: any) {
  return (
    <Card className="border-border/50 hover:border-primary/20 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && <p className={`text-xs mt-1 ${trend > 0 ? "text-green-400" : "text-red-400"}`}>{trend > 0 ? "+" : ""}{trend}% this week</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({ title, description, icon: Icon, color, priority, action, actionLabel }: any) {
  return (
    <Card className={`border-border/50 hover:border-primary/30 transition-all cursor-pointer ${priority === "urgent" ? "border-l-4 border-l-red-500" : priority === "high" ? "border-l-4 border-l-amber-500" : ""}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}><Icon className="w-4 h-4" /></div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{title}</p>
              {priority === "urgent" && <Badge className="bg-red-500/20 text-red-400 text-[10px]">URGENT</Badge>}
              {priority === "high" && <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">HIGH</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={action}><ArrowRight className="w-4 h-4" /></Button>
      </CardContent>
    </Card>
  );
}

export default function CommandCenter() {
  const [, navigate] = useLocation();
  const deals = trpc.deals.list.useQuery();
  const contacts = trpc.contacts.list.useQuery({ limit: 5 });
  const loads = trpc.loads.list.useQuery();
  const invoices = trpc.invoicing.list.useQuery();
  const notifications = trpc.smartNotifications.list.useQuery();

  const totalDeals = deals.data?.items?.length || 0;
  const wonDeals = deals.data?.items?.filter((d: any) => d.stage === "won").length || 0;
  const totalPipeline = deals.data?.items?.reduce((s: number, d: any) => s + Number(d.value || 0), 0) || 0;
  const activeLoads = loads.data?.filter((l: any) => l.status === "in_transit" || l.status === "dispatched").length || 0;
  const paidInvoices = invoices.data?.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.totalAmount || 0), 0) || 0;
  const overdueInvoices = invoices.data?.filter((i: any) => i.status === "overdue").length || 0;

  const urgentActions = [
    ...(overdueInvoices > 0 ? [{ title: `${overdueInvoices} Overdue Invoices`, description: "Collect payment to maintain cash flow", icon: DollarSign, color: "bg-red-500/10 text-red-400", priority: "urgent", action: () => navigate("/invoicing") }] : []),
    ...(activeLoads > 0 ? [{ title: `${activeLoads} Active Loads`, description: "Monitor in-transit shipments for on-time delivery", icon: Truck, color: "bg-blue-500/10 text-blue-400", priority: "high", action: () => navigate("/loads") }] : []),
    { title: "AI Voice Campaigns", description: "Launch automated outreach to warm prospects", icon: Phone, color: "bg-purple-500/10 text-purple-400", priority: "normal", action: () => navigate("/voice-agent") },
    { title: "Review Win Probability", description: "Check deals at risk and take action", icon: Target, color: "bg-amber-500/10 text-amber-400", priority: "normal", action: () => navigate("/win-probability") },
    { title: "Revenue Autopilot Briefing", description: "Get today's AI-generated revenue actions", icon: Brain, color: "bg-green-500/10 text-green-400", priority: "normal", action: () => navigate("/revenue-autopilot") },
    { title: "Check Carrier Packets", description: "Ensure all carrier documentation is current", icon: FileText, color: "bg-cyan-500/10 text-cyan-400", priority: "normal", action: () => navigate("/carrier-packets") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold">Command Center</h1>
              <p className="text-muted-foreground text-sm">Your autonomous AI copilot — everything in one view</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />All Systems Operational</Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-6 gap-3">
        <MetricCard label="Pipeline" value={`$${(totalPipeline / 1000).toFixed(0)}K`} icon={TrendingUp} color="bg-green-500/10 text-green-400" trend={12} />
        <MetricCard label="Deals Won" value={wonDeals} icon={Star} color="bg-amber-500/10 text-amber-400" trend={8} />
        <MetricCard label="Active Loads" value={activeLoads} icon={Truck} color="bg-blue-500/10 text-blue-400" />
        <MetricCard label="Revenue" value={`$${(paidInvoices / 1000).toFixed(0)}K`} icon={DollarSign} color="bg-emerald-500/10 text-emerald-400" trend={15} />
        <MetricCard label="Contacts" value={contacts.data?.items?.length || 0} icon={Users} color="bg-purple-500/10 text-purple-400" />
        <MetricCard label="Overdue" value={overdueInvoices} icon={AlertTriangle} color="bg-red-500/10 text-red-400" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* AI Actions */}
        <div className="col-span-2 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Brain className="w-5 h-5 text-primary" />AI-Recommended Actions</h3>
          <div className="space-y-2">
            {urgentActions.map((a, i) => <ActionCard key={i} {...a} actionLabel="Go" />)}
          </div>
        </div>

        {/* Smart Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Smart Alerts</h3>
          <div className="space-y-2">
            {notifications.data?.map((n: any) => (
              <Card key={n.id} className="border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${n.priority === "critical" ? "bg-red-400" : n.priority === "high" ? "bg-amber-400" : "bg-blue-400"}`} />
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message?.substring(0, 80)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!notifications.data || notifications.data.length === 0) && (
              <Card className="border-dashed"><CardContent className="p-6 text-center"><CheckCircle className="w-8 h-8 mx-auto text-green-400/30 mb-2" /><p className="text-sm text-muted-foreground">All clear — no urgent alerts</p></CardContent></Card>
            )}
          </div>

          {/* Quick Launch */}
          <h3 className="text-lg font-semibold flex items-center gap-2 mt-6"><Rocket className="w-5 h-5 text-primary" />Quick Launch</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "New Load", path: "/loads", icon: Truck },
              { label: "New Deal", path: "/deals", icon: DollarSign },
              { label: "Voice Call", path: "/voice-agent", icon: Phone },
              { label: "Send Email", path: "/campaigns", icon: Mail },
              { label: "Scan Doc", path: "/docscan", icon: FileText },
              { label: "Analytics", path: "/analytics", icon: BarChart3 },
            ].map(q => (
              <Button key={q.label} variant="outline" size="sm" className="justify-start" onClick={() => navigate(q.path)}>
                <q.icon className="w-3 h-3 mr-2" />{q.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <Card className="border-border/50"><CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            {[
              { label: "CRM", status: "active" }, { label: "Voice Agent", status: "active" },
              { label: "Email Engine", status: "active" }, { label: "Load Board", status: "active" },
              { label: "DocScan", status: "active" }, { label: "AI Scoring", status: "active" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </CardContent></Card>
    </div>
  );
}
