import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Send, MoreHorizontal, Trash2, Shield, AlertTriangle, CheckCircle, Info, FileText, Users, Loader2, Rocket } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-chart-3/15 text-chart-3",
  sending: "bg-chart-1/15 text-chart-1",
  sent: "bg-success/15 text-success",
  paused: "bg-warning/15 text-warning",
  cancelled: "bg-destructive/15 text-destructive",
};

export default function Campaigns() {
  const [showCreate, setShowCreate] = useState(false);
  const [showSpamCheck, setShowSpamCheck] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [sendCampaignId, setSendCampaignId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [spamResult, setSpamResult] = useState<any>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("");
  const utils = trpc.useUtils();

  const listInput = useMemo(() => ({
    status: statusFilter !== "all" ? statusFilter : undefined,
    limit: 50,
  }), [statusFilter]);

  const { data, isLoading } = trpc.campaigns.list.useQuery(listInput);
  const { data: templates } = trpc.emailTemplates.list.useQuery();
  const { data: segmentList } = trpc.segments.list.useQuery();

  const createMutation = trpc.campaigns.create.useMutation({
    onSuccess: () => { utils.campaigns.list.invalidate(); utils.dashboard.stats.invalidate(); setShowCreate(false); resetForm(); toast.success("Campaign created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.campaigns.delete.useMutation({
    onSuccess: () => { utils.campaigns.list.invalidate(); toast.success("Campaign deleted"); },
  });
  const loadTemplateMut = trpc.campaigns.loadTemplate.useMutation({
    onSuccess: (data) => {
      setForm(p => ({ ...p, subject: data.subject ?? p.subject, htmlContent: data.htmlContent ?? p.htmlContent }));
      toast.success("Template loaded into campaign");
    },
    onError: (e) => toast.error(e.message),
  });
  const sendMut = trpc.campaigns.send.useMutation({
    onSuccess: (result) => {
      utils.campaigns.list.invalidate();
      setShowSendConfirm(false);
      setSendCampaignId(null);
      toast.success(`Campaign sent! ${result.queued} emails queued. ${result.skippedSuppressed > 0 ? `${result.skippedSuppressed} suppressed.` : ""}`);
    },
    onError: (e) => { toast.error(e.message); },
  });
  const analyzeSpam = trpc.campaigns.analyzeSpam.useMutation({
    onSuccess: (data) => { setSpamResult(data); },
    onError: (e) => toast.error(e.message),
  });

  // Segment preview for send confirmation
  const segmentPreviewQuery = trpc.campaigns.segmentPreview.useQuery(
    { segmentId: Number(selectedSegmentId) },
    { enabled: !!selectedSegmentId && selectedSegmentId !== "all" }
  );

  const [form, setForm] = useState({ name: "", subject: "", fromName: "", fromEmail: "", htmlContent: "", segmentId: "" });
  const [spamForm, setSpamForm] = useState({ subject: "", htmlContent: "", fromName: "" });

  const resetForm = () => {
    setForm({ name: "", subject: "", fromName: "", fromEmail: "", htmlContent: "", segmentId: "" });
    setSelectedTemplateId("");
    setSelectedSegmentId("");
  };

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error("Campaign name is required"); return; }
    createMutation.mutate({
      name: form.name,
      subject: form.subject || undefined,
      fromName: form.fromName || undefined,
      fromEmail: form.fromEmail || undefined,
      htmlContent: form.htmlContent || undefined,
      segmentId: form.segmentId ? Number(form.segmentId) : undefined,
    });
  };

  const handleSpamCheck = () => {
    if (!spamForm.subject.trim() || !spamForm.htmlContent.trim()) { toast.error("Subject and content are required"); return; }
    analyzeSpam.mutate(spamForm);
  };

  const handleSendCampaign = (campaignId: number) => {
    setSendCampaignId(campaignId);
    setShowSendConfirm(true);
  };

  const SEVERITY_ICONS: Record<string, any> = { critical: AlertTriangle, warning: AlertTriangle, info: Info };
  const SEVERITY_COLORS: Record<string, string> = { critical: "text-destructive", warning: "text-warning", info: "text-chart-1" };

  return (
    <div className="space-y-5">
      <PageGuide {...pageGuides.campaigns} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} campaigns &middot; Connected to Templates, Segments, Compliance &amp; SMTP</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setSpamResult(null); setShowSpamCheck(true); }}>
            <Shield className="h-4 w-4" /> Spam Checker
          </Button>
          <Button onClick={() => { resetForm(); setShowCreate(true); }} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> New Campaign
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-secondary/30"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campaign</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Spam Score</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.items.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No campaigns yet. Create your first email campaign.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((campaign) => (
                  <TableRow key={campaign.id} className="border-border hover:bg-secondary/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-chart-1/10 flex items-center justify-center shrink-0">
                          <Send className="h-4 w-4 text-chart-1" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{campaign.name}</p>
                          {campaign.fromName && <p className="text-xs text-muted-foreground">From: {campaign.fromName}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{campaign.subject || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] font-semibold uppercase ${STATUS_COLORS[campaign.status] ?? ""}`}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {campaign.spamScore != null ? (
                        <div className="flex items-center gap-1.5">
                          {campaign.spamScore <= 25 ? <CheckCircle className="h-3.5 w-3.5 text-success" /> : campaign.spamScore <= 50 ? <AlertTriangle className="h-3.5 w-3.5 text-warning" /> : <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                          <span className="text-sm font-medium">{campaign.spamScore}</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {campaign.status === "draft" && (
                            <DropdownMenuItem onClick={() => handleSendCampaign(campaign.id)}>
                              <Rocket className="mr-2 h-4 w-4 text-green-400" /> Send Campaign
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate({ id: campaign.id })}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Campaign Dialog - Enhanced with Template & Segment */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Email Campaign</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Campaign Name *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Q1 Newsletter" className="bg-secondary/30" /></div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-cyan-400" /> Load from Template</Label>
              <Select value={selectedTemplateId} onValueChange={(v) => {
                setSelectedTemplateId(v);
                if (v) toast.info("Click 'Apply Template' to load content");
              }}>
                <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select template..." /></SelectTrigger>
                <SelectContent>
                  {(templates ?? []).map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplateId && (
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => {
                  // We'll load template content directly into form
                  const tpl = (templates ?? []).find((t: any) => t.id === Number(selectedTemplateId));
                  if (tpl) {
                    setForm(p => ({ ...p, subject: tpl.subject ?? p.subject, htmlContent: tpl.htmlContent ?? p.htmlContent }));
                    toast.success("Template content loaded");
                  }
                }}>
                  <FileText className="h-3.5 w-3.5" /> Apply Template
                </Button>
              )}
            </div>
            <div className="space-y-2"><Label>Subject Line</Label><Input value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Your weekly update" className="bg-secondary/30" /></div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-violet-400" /> Target Segment</Label>
              <Select value={form.segmentId} onValueChange={(v) => {
                setForm(p => ({ ...p, segmentId: v === "all" ? "" : v }));
                setSelectedSegmentId(v);
              }}>
                <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="All contacts" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All contacts with email</SelectItem>
                  {(segmentList ?? []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSegmentId && selectedSegmentId !== "all" && segmentPreviewQuery.data && (
                <p className="text-xs text-muted-foreground">
                  <Users className="h-3 w-3 inline mr-1" />
                  {segmentPreviewQuery.data.count} contacts match this segment
                </p>
              )}
            </div>
            <div className="space-y-2"><Label>From Name</Label><Input value={form.fromName} onChange={(e) => setForm(p => ({ ...p, fromName: e.target.value }))} placeholder="John from Acme" className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>From Email</Label><Input type="email" value={form.fromEmail} onChange={(e) => setForm(p => ({ ...p, fromEmail: e.target.value }))} placeholder="john@acme.com" className="bg-secondary/30" /></div>
            <div className="space-y-2 col-span-2">
              <Label>Email Content (HTML)</Label>
              <Textarea value={form.htmlContent} onChange={(e) => setForm(p => ({ ...p, htmlContent: e.target.value }))} placeholder="<html>...</html>" className="bg-secondary/30 min-h-[150px] font-mono text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Campaign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation Dialog */}
      <Dialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Rocket className="h-5 w-5 text-green-400" /> Send Campaign</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This will queue emails for all matching contacts. The system will automatically:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5 ml-4">
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" /> Check suppression list for each recipient</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" /> Run CAN-SPAM compliance checks</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" /> Verify unsubscribe mechanism</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" /> Queue emails for SMTP delivery</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendConfirm(false)}>Cancel</Button>
            <Button className="gap-2 bg-green-600 hover:bg-green-700" onClick={() => { if (sendCampaignId) sendMut.mutate({ id: sendCampaignId }); }} disabled={sendMut.isPending}>
              {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
              {sendMut.isPending ? "Sending..." : "Confirm Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spam Checker Dialog */}
      <Dialog open={showSpamCheck} onOpenChange={setShowSpamCheck}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Pre-Send Spam Score Analyzer</DialogTitle></DialogHeader>
          {!spamResult ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Analyze your email content before sending to maximize deliverability and avoid spam folders.</p>
              <div className="space-y-2"><Label>Subject Line *</Label><Input value={spamForm.subject} onChange={(e) => setSpamForm(p => ({ ...p, subject: e.target.value }))} placeholder="Your subject line" className="bg-secondary/30" /></div>
              <div className="space-y-2"><Label>From Name</Label><Input value={spamForm.fromName} onChange={(e) => setSpamForm(p => ({ ...p, fromName: e.target.value }))} placeholder="Sender name" className="bg-secondary/30" /></div>
              <div className="space-y-2">
                <Label>Email Content *</Label>
                <Textarea value={spamForm.htmlContent} onChange={(e) => setSpamForm(p => ({ ...p, htmlContent: e.target.value }))} placeholder="Paste your email content here..." className="bg-secondary/30 min-h-[150px]" />
              </div>
              <Button onClick={handleSpamCheck} disabled={analyzeSpam.isPending} className="w-full gap-2">
                <Shield className="h-4 w-4" /> {analyzeSpam.isPending ? "Analyzing..." : "Analyze Deliverability"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Spam Score</p>
                  <p className={`text-3xl font-bold ${spamResult.score <= 25 ? "text-success" : spamResult.score <= 50 ? "text-warning" : "text-destructive"}`}>{spamResult.score}/100</p>
                </div>
                <Badge variant="secondary" className={`text-sm px-3 py-1 ${spamResult.overallRating === "excellent" ? "bg-success/15 text-success" : spamResult.overallRating === "good" ? "bg-chart-2/15 text-chart-2" : spamResult.overallRating === "fair" ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"}`}>
                  {spamResult.overallRating?.toUpperCase()}
                </Badge>
              </div>
              {spamResult.issues?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Issues Found ({spamResult.issues.length})</p>
                  {spamResult.issues.map((issue: any, i: number) => {
                    const Icon = SEVERITY_ICONS[issue.severity] || Info;
                    return (
                      <Card key={i} className="bg-secondary/20 border-border">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${SEVERITY_COLORS[issue.severity] ?? ""}`} />
                            <div>
                              <p className="text-sm font-medium text-foreground">{issue.message}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Fix: {issue.fix}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              <Button variant="outline" onClick={() => setSpamResult(null)} className="w-full">Analyze Another Email</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
