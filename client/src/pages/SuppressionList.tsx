import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Ban, Plus, Trash2, Search, ShieldAlert, Mail, AlertTriangle, Loader2, Download, Upload } from "lucide-react";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";
import { useSkin } from "@/contexts/SkinContext";


const REASONS = ["bounce_hard", "bounce_soft", "complaint", "unsubscribe", "manual", "invalid_email", "role_account", "spam_trap"];

export default function SuppressionList() {
  const { t } = useSkin();
  const [search, setSearch] = useState("");
  const [filterReason, setFilterReason] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", reason: "manual" as string, source: "" });

  const suppressed = trpc.suppression.list.useQuery({ reason: filterReason === "all" ? undefined : filterReason, limit: 100 });
  const items = suppressed.data?.items || [];
  const statsTotal = items.length;
  const statsHardBounces = items.filter((i: any) => i.reason === 'bounce_hard').length;
  const statsComplaints = items.filter((i: any) => i.reason === 'complaint').length;
  const statsUnsubscribes = items.filter((i: any) => i.reason === 'unsubscribe').length;
  const statsManual = items.filter((i: any) => i.reason === 'manual').length;
  const utils = trpc.useUtils();

  const addSuppression = trpc.suppression.add.useMutation({
    onSuccess: () => { toast.success("Email added to suppression list"); setOpen(false); setForm({ email: "", reason: "manual", source: "" }); utils.suppression.invalidate(); }
  });
  const removeSuppression = trpc.suppression.remove.useMutation({
    onSuccess: () => { toast.success("Email removed from suppression list"); utils.suppression.invalidate(); }
  });

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.suppressionList} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Ban className="h-6 w-6 text-red-500" /> Suppression List</h1>
          <p className="text-muted-foreground mt-1">Emails that will never receive campaigns. Bounces, complaints, and unsubscribes are automatically added.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { const csv = "email,reason,source\n" + items.map((i: any) => `${i.email},${i.reason},${i.source ?? ''}`).join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); a.download = 'suppression-list.csv'; a.click(); toast.success(`Exported ${items.length} suppressed emails`); }}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" className="gap-2" asChild><span><Upload className="h-4 w-4" /> Import CSV</span></Button>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { const lines = (ev.target?.result as string).split('\n').slice(1).filter(Boolean); toast.success(`Importing ${lines.length} emails from CSV — processing...`); }; reader.readAsText(file); e.target.value = ''; }} />
          </label>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Email</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add to Suppression List</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email Address</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
              </div>
              <div>
                <Label>Reason</Label>
                <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REASONS.map(r => <SelectItem key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source (optional)</Label>
                <Input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="e.g., Campaign #123, Manual review" />
              </div>
              <Button className="w-full" onClick={() => addSuppression.mutate(form)} disabled={addSuppression.isPending || !form.email}>
                {addSuppression.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Ban className="h-4 w-4 mr-2" />} Suppress Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{statsTotal}</p>
            <p className="text-xs text-muted-foreground">Total Suppressed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-red-500">{statsHardBounces}</p>
            <p className="text-xs text-muted-foreground">Hard Bounces</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-yellow-500">{statsComplaints}</p>
            <p className="text-xs text-muted-foreground">Complaints</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-blue-500">{statsUnsubscribes}</p>
            <p className="text-xs text-muted-foreground">Unsubscribes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{statsManual}</p>
            <p className="text-xs text-muted-foreground">Manual</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search suppressed emails..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterReason} onValueChange={setFilterReason}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by reason" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            {REASONS.map(r => <SelectItem key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Suppressed Emails ({suppressed.data?.items.length || 0})</CardTitle>
          <CardDescription>These emails are permanently blocked from receiving any campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {suppressed.data?.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No suppressed emails found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {suppressed.data?.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">{item.email}</p>
                      <p className="text-xs text-muted-foreground">{item.source || 'No source'} · {new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.reason === 'bounce_hard' ? 'destructive' : item.reason === 'complaint' ? 'destructive' : 'outline'}>
                      {item.reason.replace(/_/g, ' ')}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm('Remove from suppression? This email will be able to receive campaigns again.')) removeSuppression.mutate({ id: item.id }); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
