import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Radar, Plus, AlertTriangle, Briefcase, TrendingUp,
  MessageSquare, Globe, CheckCircle2, Clock, Eye, Loader2,
} from "lucide-react";
import { useState } from "react";

const signalTypeConfig: Record<string, { label: string; color: string }> = {
  job_change: { label: "Job Change", color: "text-blue-400" },
  funding_round: { label: "Funding Round", color: "text-green-400" },
  social_complaint: { label: "Social Complaint", color: "text-red-400" },
  patent_filing: { label: "Patent Filing", color: "text-violet-400" },
  news_mention: { label: "News Mention", color: "text-cyan-400" },
  competitor_switch: { label: "Competitor Switch", color: "text-amber-400" },
  expansion: { label: "Expansion", color: "text-emerald-400" },
  other: { label: "Other", color: "text-zinc-400" },
};

const priorityColors: Record<string, string> = {
  critical: "bg-red-600 text-red-100",
  high: "bg-amber-600 text-amber-100",
  medium: "bg-blue-600 text-blue-100",
  low: "bg-zinc-600 text-zinc-100",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-600",
  reviewed: "bg-amber-600",
  actioned: "bg-green-600",
  dismissed: "bg-zinc-500",
};

const emptyForm = {
  signalType: "job_change", title: "", description: "",
  sourceUrl: "", sourcePlatform: "", companyName: "",
  personName: "", priority: "medium",
};

export default function Signals() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.signals.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
    limit: 100,
  });
  const createMut = trpc.signals.create.useMutation({
    onSuccess: () => { utils.signals.list.invalidate(); setShowCreate(false); setForm(emptyForm); toast.success("Signal created"); },
  });
  const updateMut = trpc.signals.update.useMutation({
    onSuccess: () => { utils.signals.list.invalidate(); toast.success("Signal updated"); },
  });

  const signals = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radar className="h-6 w-6 text-amber-400" />
            Sentinel Signal Feed
          </h1>
          <p className="text-muted-foreground mt-1">Trigger events and market intelligence</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Log Signal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Log Trigger Signal</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="col-span-2">
                <Label className="text-xs">Signal Type</Label>
                <Select value={form.signalType} onValueChange={(v) => setForm(p => ({ ...p, signalType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(signalTypeConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Title *</Label>
                <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Person Name</Label>
                <Input value={form.personName} onChange={(e) => setForm(p => ({ ...p, personName: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Company Name</Label>
                <Input value={form.companyName} onChange={(e) => setForm(p => ({ ...p, companyName: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Source Platform</Label>
                <Input value={form.sourcePlatform} onChange={(e) => setForm(p => ({ ...p, sourcePlatform: e.target.value }))} className="mt-1" placeholder="LinkedIn, Twitter..." />
              </div>
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Source URL</Label>
                <Input value={form.sourceUrl} onChange={(e) => setForm(p => ({ ...p, sourceUrl: e.target.value }))} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1" rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => createMut.mutate(form)} disabled={!form.title.trim() || createMut.isPending}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="actioned">Actioned</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(signalTypeConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Signal List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : signals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Radar className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">No signals found</p>
            <p className="text-sm">Log trigger events as they happen or connect integrations to auto-detect them</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {signals.map((sig) => {
            const typeConf = signalTypeConfig[sig.signalType] ?? signalTypeConfig.other;
            return (
              <Card key={sig.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0`}>
                      <Radar className={`h-5 w-5 ${typeConf.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{sig.title}</p>
                        <Badge className={`text-[10px] ${priorityColors[sig.priority ?? "medium"] ?? "bg-zinc-600"}`}>{sig.priority ?? "medium"}</Badge>
                        <Badge className={`text-[10px] ${statusColors[sig.status] ?? "bg-zinc-600"}`}>{sig.status}</Badge>
                        <Badge variant="outline" className="text-[10px]">{typeConf.label}</Badge>
                      </div>
                      {sig.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sig.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {sig.personName && <span>{sig.personName}</span>}
                        {sig.companyName && <span>{sig.companyName}</span>}
                        {sig.sourcePlatform && <span>{sig.sourcePlatform}</span>}
                        {sig.createdAt && <span>{new Date(Number(sig.createdAt)).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {sig.status === "new" && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => updateMut.mutate({ id: sig.id, status: "reviewed" })} title="Mark Reviewed">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => updateMut.mutate({ id: sig.id, status: "actioned" })} title="Mark Actioned">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                          </Button>
                        </>
                      )}
                      {sig.status === "reviewed" && (
                        <Button variant="ghost" size="sm" onClick={() => updateMut.mutate({ id: sig.id, status: "actioned" })} title="Mark Actioned">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                        </Button>
                      )}
                      {sig.sourceUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={sig.sourceUrl} target="_blank" rel="noopener noreferrer"><Globe className="h-3.5 w-3.5" /></a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
