import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Flame, Plus, TrendingUp, Pause, Play, BarChart3 } from "lucide-react";

export default function EmailWarmup() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>({});
  const campaigns = trpc.emailWarmup.list.useQuery();
  const createCampaign = trpc.emailWarmup.create.useMutation({ onSuccess: () => { campaigns.refetch(); setShowCreate(false); setForm({}); toast.success("Warmup campaign created"); } });
  const updateCampaign = trpc.emailWarmup.update.useMutation({ onSuccess: () => { campaigns.refetch(); toast.success("Campaign updated"); } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Email Warmup</h1><p className="text-muted-foreground">Automated domain warmup — gradually increase sending volume to build reputation</p></div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Warmup</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Start Domain Warmup</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-sm font-medium">Domain</label><Input value={form.domain || ""} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="example.com" /></div>
              <div><label className="text-sm font-medium">SMTP Account ID</label><Input type="number" value={form.smtpAccountId || ""} onChange={e => setForm({ ...form, smtpAccountId: Number(e.target.value) })} /></div>
              <div><label className="text-sm font-medium">Daily Target</label><Input type="number" value={form.dailyTarget || ""} onChange={e => setForm({ ...form, dailyTarget: Number(e.target.value) })} placeholder="50" /></div>
            </div>
            <Button className="w-full mt-4" onClick={() => createCampaign.mutate(form)} disabled={createCampaign.isPending}>{createCampaign.isPending ? "Creating..." : "Start Warmup"}</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Warmups", value: campaigns.data?.filter((c: any) => c.status === "active").length || 0, icon: Flame, color: "text-orange-400" },
          { label: "Completed", value: campaigns.data?.filter((c: any) => c.status === "completed").length || 0, icon: TrendingUp, color: "text-green-400" },
          { label: "Paused", value: campaigns.data?.filter((c: any) => c.status === "paused").length || 0, icon: Pause, color: "text-yellow-400" },
        ].map(s => (
          <Card key={s.label} className="border-border/50"><CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
            <s.icon className={`w-8 h-8 ${s.color} opacity-50`} />
          </CardContent></Card>
        ))}
      </div>

      <div className="space-y-3">
        {campaigns.data?.map((c: any) => (
          <Card key={c.id} className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.status === "active" ? "bg-orange-500/10" : "bg-gray-500/10"}`}><Flame className={`w-5 h-5 ${c.status === "active" ? "text-orange-400" : "text-gray-400"}`} /></div>
                <div>
                  <div className="flex items-center gap-2"><span className="font-semibold">{c.domain}</span><Badge className={c.status === "active" ? "bg-orange-500/20 text-orange-400" : c.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20"}>{c.status}</Badge></div>
                  <p className="text-sm text-muted-foreground mt-1">Day {c.currentDay || 0} · {c.currentDailyLimit || 0} emails/day · Target: {c.dailyTarget || 0}/day</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.min(100, ((c.currentDailyLimit || 0) / (c.dailyTarget || 1)) * 100)}%` }} /></div>
                <Button variant="outline" size="sm" onClick={() => updateCampaign.mutate({ id: c.id, status: c.status === "active" ? "paused" : "active" })}>
                  {c.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!campaigns.data || campaigns.data.length === 0) && (
          <Card className="border-dashed"><CardContent className="p-12 text-center"><Flame className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" /><h3 className="text-lg font-medium">No warmup campaigns</h3><p className="text-sm text-muted-foreground mt-1">Start warming up new domains to build sending reputation</p></CardContent></Card>
        )}
      </div>
    </div>
  );
}
