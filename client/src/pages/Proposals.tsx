import { useState } from "react";
import jsPDF from "jspdf";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Plus, FileText, Send, CheckCircle, Eye, Clock, XCircle, MoreHorizontal, Trash2, Sparkles, Loader2, Download } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSkin } from "@/contexts/SkinContext";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Send },
  viewed: { label: "Viewed", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Eye },
  signed: { label: "Signed", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  declined: { label: "Declined", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-500", icon: Clock },
};

export default function Proposals() {
  const { t } = useSkin();
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [form, setForm] = useState({ title: "", notes: "", totalAmount: "", currency: "USD", serviceDescription: "" });
  const [aiGenerating, setAiGenerating] = useState(false);

  const { data: proposals = [], refetch } = trpc.proposals.list.useQuery({ status: filterStatus !== "all" ? filterStatus as any : undefined });
  const createMutation = trpc.proposals.create.useMutation();
  const sendMutation = trpc.proposals.send.useMutation();
  const deleteMutation = trpc.proposals.delete.useMutation();
  const generateMutation = trpc.proposals.generateWithAI.useMutation();

  const handleDownloadPDF = (proposal: any) => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    // Header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("PROPOSAL", 14, 18);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleDateString(), pageW - 14, 18, { align: "right" });
    // Title
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(proposal.title, 14, 44);
    // Status badge
    const statusColors: Record<string, [number, number, number]> = {
      draft: [100, 100, 100], sent: [59, 130, 246], signed: [34, 197, 94], declined: [239, 68, 68], expired: [156, 163, 175]
    };
    const sc = statusColors[proposal.status] ?? [100, 100, 100];
    doc.setFillColor(...sc);
    doc.roundedRect(14, 48, 30, 7, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text((proposal.status ?? "draft").toUpperCase(), 29, 53.5, { align: "center" });
    // Amount
    if (proposal.totalAmount) {
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: proposal.currency ?? "USD" }).format(Number(proposal.totalAmount));
      doc.text(formatted, pageW - 14, 53, { align: "right" });
    }
    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 60, pageW - 14, 60);
    // Sections from templateJson
    let y = 70;
    const sections = (proposal.templateJson as any)?.sections ?? [];
    for (const section of sections) {
      if (y > 260) { doc.addPage(); y = 20; }
      if (section.type === "header" || section.type === "intro") {
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(section.content ?? "", pageW - 28);
        doc.text(lines, 14, y);
        y += lines.length * 6 + 6;
      } else if (section.type === "scope" && section.items) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(section.content ?? "Scope of Work", 14, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        for (const item of section.items as string[]) {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.setFillColor(59, 130, 246);
          doc.circle(17, y - 1.5, 1.5, "F");
          doc.setTextColor(71, 85, 105);
          doc.text(item, 22, y);
          y += 7;
        }
        y += 4;
      } else if (section.type === "pricing") {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(section.content ?? "Investment", 14, y);
        y += 8;
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, y - 4, pageW - 28, 14, 2, 2, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text("Total Investment", 18, y + 4);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        const amt = section.amount ? new Intl.NumberFormat("en-US", { style: "currency", currency: section.currency ?? "USD" }).format(Number(section.amount)) : "TBD";
        doc.text(amt, pageW - 18, y + 4, { align: "right" });
        y += 20;
      } else if (section.type === "terms") {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(section.content ?? "Terms & Conditions", 14, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        const lines = doc.splitTextToSize(section.text ?? "", pageW - 28);
        doc.text(lines, 14, y);
        y += lines.length * 5.5 + 8;
      } else if (section.type === "signature") {
        if (y > 230) { doc.addPage(); y = 20; }
        doc.setDrawColor(226, 232, 240);
        doc.line(14, y + 20, 80, y + 20);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("Authorized Signature", 14, y + 26);
        if (proposal.signedByName) {
          doc.setFontSize(9);
          doc.setTextColor(34, 197, 94);
          doc.text(`Signed by: ${proposal.signedByName}`, 14, y + 34);
        }
        y += 40;
      }
    }
    // Notes
    if (proposal.notes) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Notes", 14, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const noteLines = doc.splitTextToSize(proposal.notes, pageW - 28);
      doc.text(noteLines, 14, y);
    }
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${pageCount}`, pageW / 2, 290, { align: "center" });
      doc.text("Generated by Axiom CRM", 14, 290);
    }
    doc.save(`${proposal.title.replace(/[^a-z0-9]/gi, "_")}_proposal.pdf`);
    toast.success("PDF downloaded");
  };
  const utils = trpc.useUtils();

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      const result = await createMutation.mutateAsync({
        title: form.title,
        notes: form.notes || undefined,
        totalAmount: form.totalAmount || undefined,
        currency: form.currency,
      });
      toast.success("Proposal created");
      setShowCreate(false);
      setForm({ title: "", notes: "", totalAmount: "", currency: "USD", serviceDescription: "" });
      refetch();
    } catch { toast.error("Create failed"); }
  };

  const handleGenerateWithAI = async () => {
    if (!form.serviceDescription) { toast.error("Describe the service first"); return; }
    setAiGenerating(true);
    try {
      const result = await generateMutation.mutateAsync({ serviceDescription: form.serviceDescription, amount: form.totalAmount });
      setForm(f => ({ ...f, title: result.generated.title as string }));
      toast.success("AI generated proposal content");
    } catch { toast.error("AI generation failed"); }
    finally { setAiGenerating(false); }
  };

  const handleSend = async (id: number, title: string) => {
    try {
      await sendMutation.mutateAsync({ id });
      toast.success(`"${title}" sent for signature`);
      refetch();
    } catch { toast.error("Send failed"); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Proposal deleted");
      refetch();
    } catch { toast.error("Delete failed"); }
  };

  const stats = {
    total: proposals.length,
    signed: proposals.filter(p => p.status === "signed").length,
    pending: proposals.filter(p => ["sent", "viewed"].includes(p.status)).length,
    value: proposals.filter(p => p.status === "signed").reduce((sum, p) => sum + parseFloat(p.totalAmount ?? "0"), 0),
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Proposals & E-Signatures</h1>
            <p className="text-muted-foreground mt-1">Create, send, and track proposals with built-in e-signature</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />New Proposal
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Pending Signature", value: stats.pending, color: "text-blue-600" },
            { label: "Signed", value: stats.signed, color: "text-green-600" },
            { label: "Signed Value", value: `$${stats.value.toLocaleString()}`, color: "text-orange-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {["all", ...Object.keys(STATUS_CONFIG)].map(s => (
            <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(s)} className="capitalize">
              {s === "all" ? "All" : STATUS_CONFIG[s].label}
            </Button>
          ))}
        </div>

        {/* Proposals List */}
        <div className="space-y-3">
          {proposals.map(proposal => {
            const cfg = STATUS_CONFIG[proposal.status] ?? STATUS_CONFIG.draft;
            const Icon = cfg.icon;
            return (
              <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{proposal.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {proposal.totalAmount ? `$${parseFloat(proposal.totalAmount).toLocaleString()} ${proposal.currency}` : "No amount set"} · {new Date(proposal.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge className={cfg.color}>
                        <Icon className="h-3 w-3 mr-1" />{cfg.label}
                      </Badge>
                      {proposal.signedAt && (
                        <div className="text-xs text-muted-foreground">
                          Signed by {proposal.signedByName}
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {proposal.status === "draft" && (
                            <DropdownMenuItem onClick={() => handleSend(proposal.id, proposal.title)}>
                              <Send className="h-4 w-4 mr-2" />Send for Signature
                            </DropdownMenuItem>
                          )}
                          {proposal.signatureToken && (
                            <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/sign/${proposal.signatureToken}`); toast.success("Signature link copied"); }}>
                              <Eye className="h-4 w-4 mr-2" />Copy Signature Link
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDownloadPDF(proposal)}>
                            <Download className="h-4 w-4 mr-2" />Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(proposal.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {proposals.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No proposals yet</p>
              <p className="text-sm mt-1">Create your first proposal to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Proposal</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Service Description <span className="text-muted-foreground text-xs">(for AI generation)</span></Label>
              <Textarea value={form.serviceDescription} onChange={e => setForm(f => ({ ...f, serviceDescription: e.target.value }))}
                placeholder="Describe what you're proposing..." className="mt-1" rows={2} />
              <Button variant="outline" size="sm" className="mt-2" onClick={handleGenerateWithAI} disabled={aiGenerating}>
                {aiGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                Generate with AI
              </Button>
            </div>
            <div>
              <Label>Proposal Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Marketing Services Proposal" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount</Label>
                <Input value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} placeholder="5000" className="mt-1" />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["USD", "EUR", "GBP", "CAD", "AUD"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t("notes")}</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Internal notes..." className="mt-1" rows={2} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title.trim() || createMutation.isPending}>Create Proposal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
