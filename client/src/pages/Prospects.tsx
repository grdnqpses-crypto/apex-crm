import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Plus, Search, Brain, Shield, Ghost, Mail, Flame, Target,
  Trash2, ArrowUpRight, CheckCircle2, XCircle, Loader2,
  ChevronRight, UserPlus, Ban, Pause, Play,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";
import { FeatureGate } from "@/components/FeatureGate";
import { useSkin } from "@/contexts/SkinContext";


const stages = [
  { value: "all", label: "All Stages" },
  { value: "discovered", label: "Discovered" },
  { value: "verified", label: "Verified" },
  { value: "profiled", label: "Profiled" },
  { value: "sequenced", label: "Sequenced" },
  { value: "engaged", label: "Engaged" },
  { value: "replied", label: "Replied" },
  { value: "hot_lead", label: "Hot Lead" },
  { value: "converted", label: "Converted" },
  { value: "disqualified", label: "Disqualified" },
];

const stageBadge: Record<string, string> = {
  discovered: "bg-zinc-600 text-zinc-100",
  verified: "bg-blue-600 text-blue-100",
  profiled: "bg-violet-600 text-violet-100",
  sequenced: "bg-amber-600 text-amber-100",
  engaged: "bg-cyan-600 text-cyan-100",
  replied: "bg-green-600 text-green-100",
  hot_lead: "bg-red-600 text-red-100",
  converted: "bg-emerald-600 text-emerald-100",
  disqualified: "bg-zinc-500 text-zinc-200",
};

const verifyBadge: Record<string, string> = {
  pending: "bg-zinc-600",
  valid: "bg-green-600",
  invalid: "bg-red-600",
  catch_all: "bg-amber-600",
  unknown: "bg-zinc-500",
  disposable: "bg-red-500",
};

const emptyForm = {
  firstName: "", lastName: "", email: "", jobTitle: "",
  companyName: "", companyDomain: "", linkedinUrl: "",
  phone: "", location: "", industry: "", sourceType: "manual",
  notes: "",
};

export default function Prospects() {
  const { t } = useSkin();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [actionLoading, setActionLoading] = useState<Record<number, string>>({});

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.prospects.list.useQuery({
    search: search || undefined,
    stage: stageFilter === "all" ? undefined : stageFilter,
    limit: 100,
  });
  const createMut = trpc.prospects.create.useMutation({
    onSuccess: () => { utils.prospects.list.invalidate(); setShowCreate(false); setForm(emptyForm); toast.success("Prospect created"); },
  });
  const deleteMut = trpc.prospects.delete.useMutation({
    onSuccess: () => { utils.prospects.list.invalidate(); toast.success("Prospect deleted"); },
  });
  const verifyMut = trpc.prospects.verify.useMutation({
    onSuccess: (r) => { utils.prospects.list.invalidate(); toast.success(`Verification: ${r.status ?? "complete"}`); },
    onError: () => toast.error("Verification failed"),
  });
  const profileMut = trpc.prospects.buildProfile.useMutation({
    onSuccess: () => { utils.prospects.list.invalidate(); toast.success("Psychographic profile built"); },
    onError: () => toast.error("Profile generation failed"),
  });
  const promoteMut = trpc.prospects.promoteToContact.useMutation({
    onSuccess: (r) => {
      utils.prospects.list.invalidate();
      if ("contactId" in r) toast.success("Promoted to CRM contact");
      else toast.error("Promotion failed");
    },
  });
  const dncMut = trpc.prospects.setDnc.useMutation({
    onSuccess: () => { utils.prospects.list.invalidate(); toast.success("DNC status updated"); },
    onError: (e) => toast.error(e.message),
  });
  const pauseSeqMut = trpc.prospects.pauseSequence.useMutation({
    onSuccess: () => { utils.prospects.list.invalidate(); toast.success("Sequence paused"); },
  });
  const resumeSeqMut = trpc.prospects.resumeSequence.useMutation({
    onSuccess: () => { utils.prospects.list.invalidate(); toast.success("Sequence resumed"); },
  });

  const handleAction = async (id: number, action: string) => {
    setActionLoading(prev => ({ ...prev, [id]: action }));
    try {
      if (action === "verify") await verifyMut.mutateAsync({ id });
      else if (action === "profile") await profileMut.mutateAsync({ id });
      else if (action === "promote") await promoteMut.mutateAsync({ id });
    } finally {
      setActionLoading(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const prospects = data?.items ?? [];

  return (
      <FeatureGate
        featureKey="bnb_engine_full"
        featureName="BNB Paradigm Engine™"
        description="AI-powered prospect discovery, psychographic profiling, and autonomous engagement. Unlimited on Fortune Foundation and above."
        freemium={true}
      >

    <div className="space-y-6">
      <PageGuide {...pageGuides.prospects} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Prospect Pipeline
          </h1>
          <p className="text-muted-foreground mt-1">{data?.total ?? 0} prospects in pipeline</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Prospect</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Prospect</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { key: "firstName", label: "First Name *", span: 1 },
                { key: "lastName", label: "Last Name", span: 1 },
                { key: "email", label: "Email", span: 2 },
                { key: "jobTitle", label: "Job Title", span: 1 },
                { key: "companyName", label: "Company", span: 1 },
                { key: "companyDomain", label: "Company Domain", span: 1 },
                { key: "industry", label: "Industry", span: 1 },
                { key: "phone", label: "Phone", span: 1 },
                { key: "location", label: "Location", span: 1 },
                { key: "linkedinUrl", label: "LinkedIn URL", span: 2 },
              ].map((f) => (
                <div key={f.key} className={f.span === 2 ? "col-span-2" : ""}>
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <Label className="text-xs">Source</Label>
                <Select value={form.sourceType} onValueChange={(v) => setForm(prev => ({ ...prev, sourceType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                    <SelectItem value="apollo">Apollo</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="trigger_event">Trigger Event</SelectItem>
                    <SelectItem value="import">Import</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">{t("notes")}</Label>
                <Textarea value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} className="mt-1" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => createMut.mutate({ ...form, firstName: form.firstName.trim() })} disabled={!form.firstName.trim() || createMut.isPending}>
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search prospects..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {stages.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Prospect List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : prospects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Target className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">No prospects found</p>
            <p className="text-sm">Add prospects manually or import from Apollo/LinkedIn</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {prospects.map((p) => {
            const loading = actionLoading[p.id];
            return (
              <Card key={p.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {p.firstName?.[0]}{p.lastName?.[0] ?? ""}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/paradigm/prospects/${p.id}`)}>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                        <Badge className={`text-[10px] ${stageBadge[p.engagementStage] ?? "bg-zinc-600"}`}>
                          {p.engagementStage.replace("_", " ")}
                        </Badge>
                        <Badge className={`text-[10px] ${verifyBadge[p.verificationStatus] ?? "bg-zinc-500"}`}>
                          {p.verificationStatus}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.jobTitle}{p.companyName ? ` @ ${p.companyName}` : ""}{p.email ? ` \u2022 ${p.email}` : ""}
                      </p>
                    </div>

                    {/* Score */}
                    {(p.intentScore ?? 0) > 0 && (
                      <div className="text-center shrink-0">
                        <div className={`text-lg font-bold ${(p.intentScore ?? 0) >= 70 ? "text-red-400" : (p.intentScore ?? 0) >= 40 ? "text-amber-400" : "text-zinc-400"}`}>
                          {p.intentScore}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Intent</div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {p.verificationStatus === "pending" && (
                        <Button variant="ghost" size="sm" onClick={() => handleAction(p.id, "verify")} disabled={!!loading} title="Verify Email">
                          {loading === "verify" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5 text-blue-400" />}
                        </Button>
                      )}
                      {p.verificationStatus === "valid" && !p.psychographicProfile && (
                        <Button variant="ghost" size="sm" onClick={() => handleAction(p.id, "profile")} disabled={!!loading} title="Build Profile">
                          {loading === "profile" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5 text-violet-400" />}
                        </Button>
                      )}
                      {p.engagementStage !== "converted" && p.engagementStage !== "disqualified" && (
                        <Button variant="ghost" size="sm" onClick={() => handleAction(p.id, "promote")} disabled={!!loading} title="Promote to Contact">
                          {loading === "promote" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5 text-emerald-400" />}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/paradigm/prospects/${p.id}`)} title="View Details">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                      {p.engagementStage === "sequenced" || p.engagementStage === "engaged" ? (
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => (p as any).sequencePaused ? resumeSeqMut.mutate({ id: p.id }) : pauseSeqMut.mutate({ id: p.id })}
                          title={(p as any).sequencePaused ? 'Resume Sequence' : 'Pause Sequence'}
                        >
                          {(p as any).sequencePaused ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5 text-amber-400" />}
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => {
                          const isDnc = p.engagementStage === 'disqualified';
                          if (isDnc) { dncMut.mutate({ id: p.id, doNotContact: false }); return; }
                          const reason = window.prompt('DNC Reason (optional):');
                          if (reason !== null) dncMut.mutate({ id: p.id, doNotContact: true, reason: reason || undefined });
                        }}
                        title={p.engagementStage === 'disqualified' ? 'Remove DNC' : 'Mark Do Not Contact'}
                      >
                        <Ban className={`h-3.5 w-3.5 ${p.engagementStage === 'disqualified' ? 'text-muted-foreground' : 'text-orange-400'}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this prospect?")) deleteMut.mutate({ id: p.id }); }} title="Delete">
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  
      </FeatureGate>);
}
