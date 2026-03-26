import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Globe, Plus, Users, FileText, Eye, Shield, Copy, ExternalLink,
  Upload, MessageSquare, Link2, Trash2, RefreshCw, Calendar,
} from "lucide-react";

export default function CustomerPortal() {
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    contactId: "",
    dealId: "",
    label: "",
    expiresInDays: "30",
  });
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const utils = trpc.useUtils();

  // New token-based portal system
  const tokens = trpc.portalTokens.listTokens.useQuery();
  const createToken = trpc.portalTokens.createToken.useMutation({
    onSuccess: () => {
      tokens.refetch();
      setShowCreate(false);
      setCreateForm({ contactId: "", dealId: "", label: "", expiresInDays: "30" });
      toast.success("Portal link created! Copy the link to share with your customer.");
    },
    onError: (e: any) => toast.error(e.message),
  });
  const revokeToken = trpc.portalTokens.revokeToken.useMutation({
    onSuccess: () => { tokens.refetch(); toast.success("Portal link deactivated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const { data: tokenDocs } = trpc.portalTokens.listDocuments.useQuery(
    { tokenId: selectedTokenId! },
    { enabled: selectedTokenId !== null }
  );
  const { data: tokenComments } = trpc.portalTokens.listComments.useQuery(
    { tokenId: selectedTokenId! },
    { enabled: selectedTokenId !== null }
  );
  const addOwnerComment = trpc.portalTokens.addOwnerComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.portalTokens.listComments.invalidate({ tokenId: selectedTokenId! });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const copyPortalLink = (token: string) => {
    const url = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Portal link copied to clipboard");
  };

  const selectedToken = (tokens.data ?? []).find((t: any) => t.id === selectedTokenId);

  const activeCount = (tokens.data ?? []).filter((t: any) => t.isActive).length;
  const totalAccesses = (tokens.data ?? []).reduce((sum: number, t: any) => sum + (t.accessCount || 0), 0);

  return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" /> Customer Portal
            </h1>
            <p className="text-muted-foreground mt-1">
              Share secure deal portals with customers — no login required
            </p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="gap-1.5">
                <Plus className="w-4 h-4" /> Generate Portal Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> Generate Portal Link
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-sm font-medium">Label (optional)</label>
                  <Input
                    value={createForm.label}
                    onChange={e => setCreateForm({ ...createForm, label: e.target.value })}
                    placeholder="e.g. Q1 Proposal for Acme Corp"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Contact ID (optional)</label>
                  <Input
                    type="number"
                    value={createForm.contactId}
                    onChange={e => setCreateForm({ ...createForm, contactId: e.target.value })}
                    placeholder="Link to a specific contact"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Deal ID (optional)</label>
                  <Input
                    type="number"
                    value={createForm.dealId}
                    onChange={e => setCreateForm({ ...createForm, dealId: e.target.value })}
                    placeholder="Link to a specific deal"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Expires in (days)</label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={createForm.expiresInDays}
                    onChange={e => setCreateForm({ ...createForm, expiresInDays: e.target.value })}
                  />
                </div>
              </div>
              <Button
                className="w-full mt-4"
                onClick={() => createToken.mutate({
                  contactId: createForm.contactId ? Number(createForm.contactId) : undefined,
                  dealId: createForm.dealId ? Number(createForm.dealId) : undefined,
                  label: createForm.label || undefined,
                  expiresInDays: Number(createForm.expiresInDays) || 30,
                })}
                disabled={createToken.isPending}
              >
                {createToken.isPending ? "Generating..." : "Generate Link"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active Links", value: activeCount, icon: Shield, color: "text-emerald-400" },
            { label: "Total Links", value: tokens.data?.length || 0, icon: Link2, color: "text-blue-400" },
            { label: "Total Views", value: totalAccesses, icon: Eye, color: "text-purple-400" },
          ].map(s => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className={`w-8 h-8 ${s.color} opacity-40`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Token List */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" /> Portal Links
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tokens.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (!tokens.data || tokens.data.length === 0) ? (
                <div className="text-center py-8 px-4">
                  <Link2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No portal links yet.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Click "Generate Portal Link" to create one.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {tokens.data.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTokenId(t.id === selectedTokenId ? null : t.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors ${selectedTokenId === t.id ? "bg-primary/10" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{t.label || `Portal #${t.id}`}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t.accessCount || 0} views
                            {t.contactId ? ` · Contact #${t.contactId}` : ""}
                            {t.dealId ? ` · Deal #${t.dealId}` : ""}
                          </p>
                          {t.expiresAt && (
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              Expires {new Date(t.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge className={t.isActive ? "bg-green-500/20 text-green-600 text-[10px]" : "bg-gray-500/20 text-gray-500 text-[10px]"}>
                            {t.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <button
                            onClick={e => { e.stopPropagation(); copyPortalLink(t.token); }}
                            className="p-1 rounded hover:bg-muted/50"
                            title="Copy link"
                          >
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Token Detail */}
          <div className="lg:col-span-2">
            {!selectedTokenId ? (
              <Card className="border-border/50 h-full">
                <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
                  <div className="text-center">
                    <Globe className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Select a portal link to manage documents and messages</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base">{selectedToken?.label || `Portal #${selectedTokenId}`}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => selectedToken?.token && copyPortalLink(selectedToken.token)}
                      >
                        <ExternalLink className="w-3 h-3" /> Copy Link
                      </Button>
                      {selectedToken?.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs text-destructive hover:text-destructive"
                          onClick={() => revokeToken.mutate({ tokenId: selectedTokenId })}
                          disabled={revokeToken.isPending}
                        >
                          <Trash2 className="w-3 h-3" /> Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{selectedToken?.accessCount || 0} views</span>
                    {selectedToken?.lastAccessedAt && (
                      <span>Last accessed {new Date(selectedToken.lastAccessedAt).toLocaleString()}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="docs">
                    <TabsList className="w-full">
                      <TabsTrigger value="docs" className="flex-1">
                        Documents ({tokenDocs?.length ?? 0})
                      </TabsTrigger>
                      <TabsTrigger value="messages" className="flex-1">
                        Messages ({tokenComments?.length ?? 0})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="docs" className="mt-3 space-y-3">
                      {(!tokenDocs || tokenDocs.length === 0) ? (
                        <div className="text-center py-8">
                          <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No documents shared yet.</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">Customers can upload documents via their portal link.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {tokenDocs.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-primary shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{doc.fileName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {doc.uploadedBy === "customer" ? "Customer upload" : "Rep upload"} · {new Date(doc.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="ghost" className="gap-1">
                                  <ExternalLink className="w-3 h-3" /> View
                                </Button>
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="messages" className="mt-3 space-y-3">
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                        {(!tokenComments || tokenComments.length === 0) ? (
                          <p className="text-sm text-muted-foreground text-center py-6">No messages yet.</p>
                        ) : tokenComments.map((c: any) => (
                          <div key={c.id} className={`flex gap-2 ${c.authorType === "customer" ? "justify-start" : "justify-end"}`}>
                            <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${c.authorType === "customer" ? "bg-muted rounded-bl-sm" : "bg-primary text-primary-foreground rounded-br-sm"}`}>
                              <p className="text-xs font-semibold mb-0.5 opacity-70">{c.authorName || (c.authorType === "rep" ? "You" : "Customer")}</p>
                              <p>{c.body}</p>
                              <p className={`text-xs mt-0.5 ${c.authorType === "customer" ? "text-muted-foreground" : "text-primary-foreground/60"}`}>
                                {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Reply to customer…"
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && commentText.trim()) {
                              addOwnerComment.mutate({ tokenId: selectedTokenId, content: commentText });
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          onClick={() => {
                            if (commentText.trim()) {
                              addOwnerComment.mutate({ tokenId: selectedTokenId, content: commentText });
                            }
                          }}
                          disabled={!commentText.trim() || addOwnerComment.isPending}
                        >
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
  );
}
