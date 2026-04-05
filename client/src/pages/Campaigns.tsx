import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Send, MoreHorizontal, Trash2, Shield, AlertTriangle, CheckCircle, Info, FileText, Users, Loader2, Rocket, Calendar, Edit2, Eye, DollarSign } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";
import { useSkin } from "@/contexts/SkinContext";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-chart-3/15 text-chart-3",
  sending: "bg-chart-1/15 text-chart-1",
  sent: "bg-success/15 text-success",
  paused: "bg-warning/15 text-warning",
  cancelled: "bg-destructive/15 text-destructive",
};

const EMPTY_FORM = {
  name: "",
  subject: "",
  fromName: "",
  fromEmail: "",
  htmlContent: "",
  segmentId: "",
  status: "draft" as string,
  scheduledAt: "",
  scheduledTime: "",
};

// Extract CampaignFormFields outside to prevent re-creation on every render
const CampaignFormFields = ({ 
  form, 
  setForm, 
  selectedTemplateId, 
  setSelectedTemplateId, 
  selectedSegmentId, 
  setSelectedSegmentId, 
  templates, 
  segmentList, 
  segmentPreviewQuery, 
  handleTemplateChange, 
  handleSegmentChange, 
  handleStatusChange, 
  handleDateChange, 
  handleTimeChange 
}: any) => (
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label>Campaign Name *</Label>
      <Input 
        value={form.name} 
        onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))} 
        placeholder="Q1 Newsletter" 
        className="bg-secondary/30" 
      />
    </div>
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-cyan-400" /> Load from Template</Label>
      <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
        <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select template..." /></SelectTrigger>
        <SelectContent>
          {(templates ?? []).map((t: any) => (
            <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>Subject Line</Label>
      <Input 
        value={form.subject} 
        onChange={(e) => setForm((p: any) => ({ ...p, subject: e.target.value }))} 
        placeholder="Your weekly update" 
        className="bg-secondary/30" 
      />
    </div>
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-violet-400" /> Target Segment</Label>
      <Select value={selectedSegmentId || "all"} onValueChange={handleSegmentChange}>
        <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="All contacts" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All contacts with email</SelectItem>
          {(segmentList ?? []).map((s: any) => (
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
    <div className="space-y-2">
      <Label>From Name</Label>
      <Input 
        value={form.fromName} 
        onChange={(e) => setForm((p: any) => ({ ...p, fromName: e.target.value }))} 
        placeholder="John from Acme" 
        className="bg-secondary/30" 
      />
    </div>
    <div className="space-y-2">
      <Label>From Email</Label>
      <Input 
        type="email" 
        value={form.fromEmail} 
        onChange={(e) => setForm((p: any) => ({ ...p, fromEmail: e.target.value }))} 
        placeholder="john@acme.com" 
        className="bg-secondary/30" 
      />
    </div>
    {/* Schedule section */}
    <div className="col-span-2 border border-border/50 rounded-xl p-4 bg-secondary/10 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-chart-3" />
        <Label className="text-sm font-semibold">Schedule (Optional)</Label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={form.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="bg-secondary/30 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Send Date</Label>
          <Input
            type="date"
            value={form.scheduledAt}
            onChange={handleDateChange}
            className="bg-secondary/30 h-9"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Send Time</Label>
          <Input
            type="time"
            value={form.scheduledTime}
            onChange={handleTimeChange}
            className="bg-secondary/30 h-9"
            disabled={!form.scheduledAt}
          />
        </div>
      </div>
      {form.status === "scheduled" && form.scheduledAt && (
        <p className="text-xs text-chart-3">
          <Calendar className="h-3 w-3 inline mr-1" />
          Scheduled for {new Date(`${form.scheduledAt}T${form.scheduledTime || "09:00"}`).toLocaleString()}
        </p>
      )}
    </div>
    <div className="space-y-2 col-span-2">
      <Label>Email Content (HTML)</Label>
      <Textarea 
        value={form.htmlContent} 
        onChange={(e) => setForm((p: any) => ({ ...p, htmlContent: e.target.value }))} 
        placeholder="<html>...</html>" 
        className="bg-secondary/30 min-h-[150px] font-mono text-xs" 
      />
    </div>
  </div>
);

export default function Campaigns() {
  const { t } = useSkin();
  const [showCreate, setShowCreate] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
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
    onSuccess: () => {
      utils.campaigns.list.invalidate();
      utils.dashboard.stats.invalidate();
      setShowCreate(false);
      resetForm();
      toast.success("Campaign created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.campaigns.update.useMutation({
    onSuccess: () => {
      utils.campaigns.list.invalidate();
      setEditingCampaign(null);
      toast.success("Campaign updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.campaigns.delete.useMutation({
    onSuccess: () => { utils.campaigns.list.invalidate(); toast.success("Campaign deleted"); },
  });

  const sendMut = trpc.campaigns.send.useMutation({
    onSuccess: (result) => {
      utils.campaigns.list.invalidate();
      setShowSendConfirm(false);
      setSendCampaignId(null);
      toast.success(`Campaign sent! ${result.queued} emails queued.${result.skippedSuppressed > 0 ? ` ${result.skippedSuppressed} suppressed.` : ""}`);
    },
    onError: (e) => { toast.error(e.message); },
  });

  const analyzeSpam = trpc.campaigns.analyzeSpam.useMutation({
    onSuccess: (data) => { setSpamResult(data); },
    onError: (e) => toast.error(e.message),
  });

  const segmentPreviewQuery = trpc.campaigns.segmentPreview.useQuery(
    { segmentId: Number(selectedSegmentId) },
    { enabled: !!selectedSegmentId && selectedSegmentId !== "all" }
  );

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [spamForm, setSpamForm] = useState({ subject: "", htmlContent: "", fromName: "" });

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setSelectedTemplateId("");
    setSelectedSegmentId("");
  };

  const openEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    const scheduledDate = campaign.scheduledAt ? new Date(campaign.scheduledAt) : null;
    setForm({
      name: campaign.name ?? "",
      subject: campaign.subject ?? "",
      fromName: campaign.fromName ?? "",
      fromEmail: campaign.fromEmail ?? "",
      htmlContent: campaign.htmlContent ?? "",
      segmentId: campaign.segmentId ? String(campaign.segmentId) : "",
      status: campaign.status ?? "draft",
      scheduledAt: scheduledDate ? scheduledDate.toISOString().split("T")[0] : "",
      scheduledTime: scheduledDate ? scheduledDate.toTimeString().slice(0, 5) : "",
    });
    setSelectedSegmentId(campaign.segmentId ? String(campaign.segmentId) : "");
  };

  const buildScheduledAt = () => {
    if (!form.scheduledAt) return undefined;
    const dt = new Date(`${form.scheduledAt}T${form.scheduledTime || "09:00"}:00`);
    return isNaN(dt.getTime()) ? undefined : dt.getTime();
  };

  const handleTemplateChange = useCallback((v: string) => {
    setSelectedTemplateId(v);
    const tpl = (templates ?? []).find((t: any) => t.id === Number(v));
    if (tpl) {
      setForm(p => ({ ...p, subject: tpl.subject ?? p.subject, htmlContent: tpl.htmlContent ?? p.htmlContent }));
      toast.success("Template content loaded");
    }
  }, [templates]);

  const handleSegmentChange = useCallback((v: string) => {
    setForm(p => ({ ...p, segmentId: v === "all" ? "" : v }));
    setSelectedSegmentId(v);
  }, []);

  const handleStatusChange = useCallback((v: string) => {
    setForm(p => ({ ...p, status: v }));
  }, []);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, scheduledAt: e.target.value, status: e.target.value ? "scheduled" : p.status }));
  }, []);

  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, scheduledTime: e.target.value }));
  }, []);

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error("Campaign name is required"); return; }
    if (form.status === "scheduled" && !form.scheduledAt) {
      toast.error("Please set a scheduled date for this campaign");
      return;
    }
    createMutation.mutate({
      name: form.name,
      subject: form.subject || undefined,
      fromName: form.fromName || undefined,
      fromEmail: form.fromEmail || undefined,
      htmlContent: form.htmlContent || undefined,
      segmentId: form.segmentId ? Number(form.segmentId) : undefined,
    });
  };

  const handleUpdate = () => {
    if (!editingCampaign) return;
    if (!form.name.trim()) { toast.error("Campaign name is required"); return; }
    if (form.status === "scheduled" && !form.scheduledAt) {
      toast.error("Please set a scheduled date for this campaign");
      return;
    }
    updateMutation.mutate({
      id: editingCampaign.id,
      name: form.name,
      subject: form.subject || undefined,
      fromName: form.fromName || undefined,
      fromEmail: form.fromEmail || undefined,
      htmlContent: form.htmlContent || undefined,
      segmentId: form.segmentId ? Number(form.segmentId) : undefined,
      status: form.status as any,
      scheduledAt: buildScheduledAt(),
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
            <Plus className="h-4 w-4" /> New Email Campaign
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
                <TableHead className="text-xs font-semibold text-muted-foreground">Campaign</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Recipients</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Sent</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Opened</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Clicked</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading campaigns...</TableCell>
                </TableRow>
              ) : !data?.campaigns?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No campaigns yet. Create one to get started!</TableCell>
                </TableRow>
              ) : (
                data.campaigns.map((campaign: any) => (
                  <TableRow key={campaign.id} className="border-border hover:bg-muted/30">
                    <TableCell className="text-sm font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${STATUS_COLORS[campaign.status] || ""}`}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{campaign.totalRecipients}</TableCell>
                    <TableCell className="text-sm">{campaign.delivered}</TableCell>
                    <TableCell className="text-sm">{campaign.opened} ({campaign.totalRecipients > 0 ? Math.round((campaign.opened / campaign.totalRecipients) * 100) : 0}%)</TableCell>
                    <TableCell className="text-sm">{campaign.clicked} ({campaign.totalRecipients > 0 ? Math.round((campaign.clicked / campaign.totalRecipients) * 100) : 0}%)</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(campaign)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendCampaign(campaign.id)} disabled={campaign.status !== "draft"}>
                            <Send className="h-4 w-4 mr-2" /> Send
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteMutation.mutate({ id: campaign.id })}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
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

      {/* Create Campaign Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Email Campaign</DialogTitle></DialogHeader>
          <CampaignFormFields 
            form={form}
            setForm={setForm}
            selectedTemplateId={selectedTemplateId}
            setSelectedTemplateId={setSelectedTemplateId}
            selectedSegmentId={selectedSegmentId}
            setSelectedSegmentId={setSelectedSegmentId}
            templates={templates}
            segmentList={segmentList}
            segmentPreviewQuery={segmentPreviewQuery}
            handleTemplateChange={handleTemplateChange}
            handleSegmentChange={handleSegmentChange}
            handleStatusChange={handleStatusChange}
            handleDateChange={handleDateChange}
            handleTimeChange={handleTimeChange}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={!!editingCampaign} onOpenChange={(open) => { if (!open) setEditingCampaign(null); }}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit2 className="h-4 w-4" /> Edit Campaign</DialogTitle></DialogHeader>
          <CampaignFormFields 
            form={form}
            setForm={setForm}
            selectedTemplateId={selectedTemplateId}
            setSelectedTemplateId={setSelectedTemplateId}
            selectedSegmentId={selectedSegmentId}
            setSelectedSegmentId={setSelectedSegmentId}
            templates={templates}
            segmentList={segmentList}
            segmentPreviewQuery={segmentPreviewQuery}
            handleTemplateChange={handleTemplateChange}
            handleSegmentChange={handleSegmentChange}
            handleStatusChange={handleStatusChange}
            handleDateChange={handleDateChange}
            handleTimeChange={handleTimeChange}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCampaign(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
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
