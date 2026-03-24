import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Globe, Plus, Users, FileText, Eye, Shield, Copy, ExternalLink, Upload, MessageSquare } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function CustomerPortal() {
  const { user } = useAuth();
  const [showGrant, setShowGrant] = useState(false);
  const [form, setForm] = useState<any>({});
  const [selectedPortalId, setSelectedPortalId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const utils = trpc.useUtils();
  const access = trpc.portal.listAccess.useQuery();
  const quotes = trpc.portal.listQuotes.useQuery();
  const { data: portalDocs } = trpc.portalDocs.list.useQuery(
    { portalAccessId: selectedPortalId! },
    { enabled: selectedPortalId !== null }
  );
  const { data: portalComments } = trpc.portalDocs.listComments.useQuery(
    { portalAccessId: selectedPortalId! },
    { enabled: selectedPortalId !== null }
  );

  const grantAccess = trpc.portal.grantAccess.useMutation({
    onSuccess: () => { access.refetch(); setShowGrant(false); setForm({}); toast.success("Portal access granted"); }
  });

  const addComment = trpc.portalDocs.addComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.portalDocs.listComments.invalidate({ portalAccessId: selectedPortalId! });
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadDoc = trpc.portalDocs.uploadDoc.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded");
      setUploadFile(null);
      utils.portalDocs.list.invalidate({ portalAccessId: selectedPortalId! });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleUpload = async () => {
    if (!uploadFile || !selectedPortalId) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadDoc.mutate({ portalAccessId: selectedPortalId, fileName: uploadFile.name, mimeType: uploadFile.type, base64Data: base64 });
    };
    reader.readAsDataURL(uploadFile);
  };

  const copyPortalLink = (token: string) => {
    const url = `${window.location.origin}/portal/view/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Portal link copied");
  };

  const selectedAccess = (access.data ?? []).find((a: any) => a.id === selectedPortalId);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="w-6 h-6 text-primary" /> Customer Portal</h1>
            <p className="text-muted-foreground mt-1">Self-service portal for customers — deal tracking, document sharing, and messaging</p>
          </div>
          <Dialog open={showGrant} onOpenChange={setShowGrant}>
            <DialogTrigger asChild><Button className="gap-1.5"><Plus className="w-4 h-4" /> Grant Portal Access</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Grant Portal Access</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div><label className="text-sm font-medium">Contact ID</label><Input type="number" value={form.contactId || ""} onChange={e => setForm({ ...form, contactId: Number(e.target.value) })} /></div>
                <div><label className="text-sm font-medium">Email</label><Input value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="customer@company.com" /></div>
              </div>
              <Button className="w-full mt-4" onClick={() => grantAccess.mutate({ contactId: form.contactId, email: form.email })} disabled={grantAccess.isPending}>{grantAccess.isPending ? "Granting…" : "Grant Access"}</Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Portal Users", value: access.data?.length || 0, icon: Users, color: "text-blue-400" },
            { label: "Quote Requests", value: quotes.data?.length || 0, icon: FileText, color: "text-green-400" },
            { label: "Active", value: (access.data ?? []).filter((a: any) => a.isActive).length, icon: Eye, color: "text-purple-400" },
          ].map(s => (
            <Card key={s.label} className="border-border/50"><CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p><p className="text-2xl font-bold mt-1">{s.value}</p></div>
              <s.icon className={`w-8 h-8 ${s.color} opacity-40`} />
            </CardContent></Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> Portal Users</CardTitle></CardHeader>
            <CardContent className="p-0">
              {(!access.data || access.data.length === 0) ? (
                <p className="text-center text-muted-foreground py-8 text-sm px-4">No portal users yet.</p>
              ) : (
                <div className="divide-y divide-border/30">
                  {access.data.map((a: any) => (
                    <button key={a.id} onClick={() => setSelectedPortalId(a.id === selectedPortalId ? null : a.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors ${selectedPortalId === a.id ? "bg-primary/10" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div><p className="font-medium text-sm">{a.email}</p><p className="text-xs text-muted-foreground">Contact #{a.contactId}</p></div>
                        <div className="flex items-center gap-1.5">
                          <Badge className={a.isActive ? "bg-green-500/20 text-green-400 text-xs" : "bg-gray-500/20 text-xs"}>{a.isActive ? "Active" : "Inactive"}</Badge>
                          <button onClick={e => { e.stopPropagation(); copyPortalLink(a.accessToken); }} className="p-1 rounded hover:bg-muted/50"><Copy className="w-3 h-3 text-muted-foreground" /></button>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            {!selectedPortalId ? (
              <Card className="border-border/50 h-full"><CardContent className="flex items-center justify-center h-48 text-muted-foreground">
                <div className="text-center"><Globe className="w-10 h-10 mx-auto mb-2 opacity-20" /><p className="text-sm">Select a portal user to manage their documents and messages</p></div>
              </CardContent></Card>
            ) : (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{selectedAccess?.email}</CardTitle>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => copyPortalLink(selectedAccess?.accessToken)}><ExternalLink className="w-3 h-3" /> Copy Link</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="docs">
                    <TabsList className="w-full">
                      <TabsTrigger value="docs" className="flex-1">Documents ({portalDocs?.length ?? 0})</TabsTrigger>
                      <TabsTrigger value="messages" className="flex-1">Messages ({portalComments?.length ?? 0})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="docs" className="mt-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <Input type="file" className="flex-1 text-sm" onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />
                        <Button size="sm" onClick={handleUpload} disabled={!uploadFile || uploadDoc.isPending} className="gap-1.5 shrink-0">
                          <Upload className="w-3.5 h-3.5" /> {uploadDoc.isPending ? "Uploading…" : "Upload"}
                        </Button>
                      </div>
                      {(!portalDocs || portalDocs.length === 0) ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No documents shared yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {portalDocs.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-primary shrink-0" />
                                <div className="min-w-0"><p className="text-sm font-medium truncate">{doc.fileName}</p><p className="text-xs text-muted-foreground">{new Date(doc.uploadedAt).toLocaleDateString()}</p></div>
                              </div>
                              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="ghost" className="gap-1"><ExternalLink className="w-3 h-3" /> View</Button></a>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="messages" className="mt-3 space-y-3">
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                        {(!portalComments || portalComments.length === 0) ? (
                          <p className="text-sm text-muted-foreground text-center py-6">No messages yet.</p>
                        ) : portalComments.map((c: any) => (
                          <div key={c.id} className={`flex gap-2 ${c.isFromCustomer ? "justify-start" : "justify-end"}`}>
                            <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${c.isFromCustomer ? "bg-muted rounded-bl-sm" : "bg-primary text-primary-foreground rounded-br-sm"}`}>
                              <p>{c.body}</p>
                              <p className={`text-xs mt-0.5 ${c.isFromCustomer ? "text-muted-foreground" : "text-primary-foreground/60"}`}>{new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input placeholder="Reply to customer…" value={commentText} onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) addComment.mutate({ portalAccessId: selectedPortalId, body: commentText, isFromCustomer: false }); }} />
                        <Button size="icon" onClick={() => { if (commentText.trim()) addComment.mutate({ portalAccessId: selectedPortalId, body: commentText, isFromCustomer: false }); }} disabled={!commentText.trim() || addComment.isPending}>
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
