import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, MoreHorizontal, Trash2, Copy, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";


export default function Templates() {
  const [showCreate, setShowCreate] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: templates, isLoading } = trpc.emailTemplates.list.useQuery();
  const createMutation = trpc.emailTemplates.create.useMutation({
    onSuccess: () => { utils.emailTemplates.list.invalidate(); setShowCreate(false); toast.success("Template created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.emailTemplates.delete.useMutation({
    onSuccess: () => { utils.emailTemplates.list.invalidate(); toast.success("Template deleted"); },
  });

  const [form, setForm] = useState({ name: "", subject: "", htmlContent: "", category: "" });

  const handleCreate = () => {
    if (!form.name.trim() || !form.subject.trim()) { toast.error("Name and subject are required"); return; }
    createMutation.mutate({
      name: form.name,
      subject: form.subject,
      htmlContent: form.htmlContent || "<p>Your email content here</p>",
      category: form.category || undefined,
    });
  };

  const CATEGORIES = ["Newsletter", "Promotional", "Transactional", "Welcome", "Follow-up", "Re-engagement"];

  return (
    <div className="space-y-5">
      <PageGuide {...pageGuides.templates} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{templates?.length ?? 0} templates</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card border-border"><CardContent className="p-6"><div className="space-y-3 animate-pulse"><div className="h-5 w-32 bg-muted rounded" /><div className="h-4 w-48 bg-muted rounded" /><div className="h-20 bg-muted rounded" /></div></CardContent></Card>
          ))
        ) : templates?.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-card border-border"><CardContent className="p-12 text-center text-muted-foreground">No templates yet. Create your first email template.</CardContent></Card>
          </div>
        ) : (
          templates?.map((template) => (
            <Card key={template.id} className="bg-card border-border hover:border-primary/30 transition-colors group">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-chart-5/10 flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-chart-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{template.name}</p>
                      {template.category && <Badge variant="secondary" className="text-[10px] mt-1">{template.category}</Badge>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewHtml(template.htmlContent)}>
                        <Eye className="mr-2 h-4 w-4" /> Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(template.htmlContent ?? ""); toast.success("HTML copied"); }}>
                        <Copy className="mr-2 h-4 w-4" /> Copy HTML
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate({ id: template.id })}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-xs text-muted-foreground">Subject: {template.subject}</p>
                <div className="text-xs text-muted-foreground/60 truncate">{template.htmlContent?.substring(0, 100)}...</div>
                <p className="text-[10px] text-muted-foreground/40">{new Date(template.createdAt).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader><DialogTitle>Create Email Template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Template Name *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Welcome Email" className="bg-secondary/30" /></div>
              <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Newsletter, Promotional..." className="bg-secondary/30" /></div>
            </div>
            <div className="space-y-2"><Label>Subject Line *</Label><Input value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Welcome to {{company_name}}" className="bg-secondary/30" /></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>HTML Content</Label>
                <div className="flex gap-1">
                  {["{{first_name}}", "{{company_name}}", "{{unsubscribe_link}}"].map(token => (
                    <Button key={token} variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => setForm(p => ({ ...p, htmlContent: p.htmlContent + token }))}>
                      {token}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea value={form.htmlContent} onChange={(e) => setForm(p => ({ ...p, htmlContent: e.target.value }))} placeholder="<html>...</html>" className="bg-secondary/30 min-h-[200px] font-mono text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Template"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewHtml} onOpenChange={() => setPreviewHtml(null)}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[80vh]">
          <DialogHeader><DialogTitle>Template Preview</DialogTitle></DialogHeader>
          <div className="bg-white rounded-lg p-4 overflow-auto max-h-[60vh]">
            <div dangerouslySetInnerHTML={{ __html: previewHtml ?? "" }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
