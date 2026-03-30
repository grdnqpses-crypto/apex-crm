import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Send, XCircle, FileSignature, Loader2, Wand2, Users, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  draft: { label: "Draft", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  sent: { label: "Sent", variant: "default", icon: <Send className="h-3 w-3" /> },
  completed: { label: "Completed", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  voided: { label: "Voided", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
  expired: { label: "Expired", variant: "outline", icon: <AlertCircle className="h-3 w-3" /> },
};

export default function ESignature() {
  const { t } = useSkin();
  const [showGuide, setShowGuide] = useState(false);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.eSignature.listDocuments.useQuery({});

  const createMutation = trpc.eSignature.createDocument.useMutation({
    onSuccess: () => {
      utils.eSignature.listDocuments.invalidate();
      setCreateOpen(false);
      resetForm();
      toast.success("Document created", { description: "Your document is ready to send for signature." });
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  const sendMutation = trpc.eSignature.sendDocument.useMutation({
    onSuccess: () => {
      utils.eSignature.listDocuments.invalidate();
      toast.success("Document sent", { description: "Signers have been notified." });
    },
  });

  const voidMutation = trpc.eSignature.voidDocument.useMutation({
    onSuccess: () => {
      utils.eSignature.listDocuments.invalidate();
      toast.success("Document voided");
    },
  });

  const aiDraftMutation = trpc.eSignature.aiDraftDocument.useMutation({
    onSuccess: (data) => {
      setDocContent(data.content);
      toast.success("AI draft ready", { description: "Review and customize the document before sending." });
    },
    onError: (e) => toast.error("AI Error", { description: e.message }),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [signers, setSigners] = useState([{ name: "", email: "" }]);
  const [activeTab, setActiveTab] = useState("manual");
  const [aiType, setAiType] = useState<"nda" | "proposal" | "contract" | "sow" | "msa">("nda");
  const [aiCompany, setAiCompany] = useState("");
  const [aiContact, setAiContact] = useState("");
  const [aiInstructions, setAiInstructions] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const resetForm = () => {
    setDocTitle("");
    setDocContent("");
    setSigners([{ name: "", email: "" }]);
    setActiveTab("manual");
    setAiCompany("");
    setAiContact("");
    setAiInstructions("");
  };

  const addSigner = () => setSigners(prev => [...prev, { name: "", email: "" }]);
  const updateSigner = (idx: number, field: "name" | "email", value: string) => {
    setSigners(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };
  const removeSigner = (idx: number) => setSigners(prev => prev.filter((_, i) => i !== idx));

  const handleCreate = () => {
    if (!docTitle.trim() || !docContent.trim()) {
      toast.error("Title and content required");
      return;
    }
    const validSigners = signers.filter(s => s.name && s.email);
    if (validSigners.length === 0) {
      toast.error("At least one signer required");
      return;
    }
    createMutation.mutate({ title: docTitle, content: docContent, signers: validSigners });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large", { description: "Maximum 10MB" });
        return;
      }
      setUploadedFile(file);
      setDocTitle(file.name.replace(/\.[^.]+$/, ""));
      toast.success("File uploaded", { description: `Ready to send for signature` });
    }
  };

  const docs = data?.items ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">E-Signature</h1>
          <p className="text-muted-foreground">Send documents for digital signature — NDAs, proposals, contracts, and more.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {(["draft", "sent", "completed", "voided"] as const).map(status => {
          const count = docs.filter(d => d.status === status).length;
          const cfg = STATUS_CONFIG[status];
          return (
            <Card key={status}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-muted-foreground">{cfg.icon}</span>
                  <span className="text-sm text-muted-foreground capitalize">{cfg.label}</span>
                </div>
                <div className="text-3xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Documents list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading documents...</div>
      ) : docs.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-4">Create your first document to send for signature.</p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => {
            const cfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.draft;
            return (
              <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileSignature className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{doc.title}</div>
                        <div className="text-xs text-muted-foreground">
                          Created {new Date(doc.createdAt).toLocaleDateString()}
                          {doc.expiresAt && ` · Expires ${new Date(doc.expiresAt).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant={cfg.variant} className="flex items-center gap-1">
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                      {doc.status === "draft" && (
                        <Button size="sm" onClick={() => sendMutation.mutate({ id: doc.id })}>
                          <Send className="h-3 w-3 mr-1" />
                          Send
                        </Button>
                      )}
                      {(doc.status === "draft" || doc.status === "sent") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                          onClick={() => voidMutation.mutate({ id: doc.id })}
                        >
                          Void
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

      {/* Create Document Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Document for Signature</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="manual">Manual</TabsTrigger>
              <TabsTrigger value="ai">
                <Wand2 className="h-4 w-4 mr-2" />
                AI Draft
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Document Type</Label>
                  <Select value={aiType} onValueChange={v => setAiType(v as typeof aiType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nda">Non-Disclosure Agreement (NDA)</SelectItem>
                      <SelectItem value="proposal">Business Proposal</SelectItem>
                      <SelectItem value="contract">Service Contract</SelectItem>
                      <SelectItem value="sow">Statement of Work (SOW)</SelectItem>
                      <SelectItem value="msa">Master Service Agreement (MSA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Company Name</Label>
                  <Input value={aiCompany} onChange={e => setAiCompany(e.target.value)} placeholder="Acme Corp" />
                </div>
                <div>
                  <Label>Contact Name</Label>
                  <Input value={aiContact} onChange={e => setAiContact(e.target.value)} placeholder="John Smith" />
                </div>
                <div>
                  <Label>Custom Instructions (optional)</Label>
                  <Input value={aiInstructions} onChange={e => setAiInstructions(e.target.value)} placeholder="e.g. 12-month term, payment net 30" />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => aiDraftMutation.mutate({
                  type: aiType,
                  companyName: aiCompany || "the Company",
                  contactName: aiContact || "the Contact",
                  customInstructions: aiInstructions || undefined,
                })}
                disabled={aiDraftMutation.isPending}
              >
                {aiDraftMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><Wand2 className="h-4 w-4 mr-2" />Generate with AI</>
                )}
              </Button>
              {docContent && (
                <div className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  AI draft generated. Switch to Manual tab to review and edit.
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div>
                <Label>Document Title *</Label>
                <Input value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="e.g. NDA with Acme Corp" />
              </div>
              <div>
                <Label>Document Content *</Label>
                <Textarea
                  value={docContent}
                  onChange={e => setDocContent(e.target.value)}
                  placeholder="Paste or type your document content here. Use [SIGNATURE] and [DATE] as placeholders."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Signers section (always visible) */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Signers
              </Label>
              <Button size="sm" variant="outline" onClick={addSigner}>
                <Plus className="h-3 w-3 mr-1" />
                Add Signer
              </Button>
            </div>
            {signers.map((signer, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    className="h-8"
                    value={signer.name}
                    onChange={e => updateSigner(idx, "name", e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    className="h-8"
                    type="email"
                    value={signer.email}
                    onChange={e => updateSigner(idx, "email", e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                {signers.length > 1 && (
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => removeSigner(idx)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
