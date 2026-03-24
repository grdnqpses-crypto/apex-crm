import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DollarSign, Calendar, FileText, MessageSquare,
  Upload, User, Paperclip, Send, Shield,
} from "lucide-react";

export default function PublicPortalView() {
  const { token } = useParams<{ token: string }>();
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [uploading, setUploading] = useState(false);

  // Backend returns: { tokenId, label, contact, deal, documents, comments }
  const { data, isLoading, error, refetch } = trpc.portalTokens.getByToken.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  const addComment = trpc.portalTokens.addContactComment.useMutation({
    onSuccess: () => {
      setComment("");
      refetch();
      toast.success("Comment posted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const uploadDoc = trpc.portalTokens.uploadDocument.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Document uploaded");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      toast.error("File too large (max 16 MB)");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64Data = (ev.target?.result as string).split(",")[1];
        await uploadDoc.mutateAsync({
          token: token!,
          fileName: file.name,
          mimeType: file.type,
          base64Data,
          fileSize: file.size,
        });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="rounded-2xl shadow-lg max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Portal Not Found</h2>
            <p className="text-sm text-muted-foreground">
              {(error as any)?.message || "This portal link is invalid or has expired. Please contact your account manager for a new link."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { label, contact, deal, documents, comments } = data;

  const stageColors: Record<string, string> = {
    "Lead": "bg-slate-100 text-slate-700",
    "Qualified": "bg-blue-100 text-blue-700",
    "Proposal": "bg-amber-100 text-amber-700",
    "Negotiation": "bg-orange-100 text-orange-700",
    "Closed Won": "bg-emerald-100 text-emerald-700",
    "Closed Lost": "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-border/40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Axiom CRM Client Portal</h1>
            <p className="text-xs text-muted-foreground">
              {contact ? `Secure deal view for ${contact.firstName} ${contact.lastName}` : "Secure deal portal"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-card to-card border border-border/40 p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-1">
            {label || "Your Deal Portal"}
          </h2>
          {contact && (
            <p className="text-sm text-muted-foreground">
              Welcome, {contact.firstName} {contact.lastName}
              {contact.jobTitle ? ` · ${contact.jobTitle}` : ""}
            </p>
          )}
        </div>

        {/* Deal Summary */}
        {deal && (
          <Card className="rounded-2xl border-border/40 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> Deal Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{deal.name}</h3>
                  {deal.description && <p className="text-sm text-muted-foreground mt-1">{deal.description}</p>}
                </div>
                <Badge className={`text-xs font-semibold rounded-lg shrink-0 ${stageColors[deal.stage ?? ""] ?? "bg-muted/60 text-muted-foreground"}`}>
                  {deal.stage}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {deal.amount && (
                  <div className="rounded-xl bg-muted/30 border border-border/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">Value</p>
                    <p className="text-sm font-bold text-emerald-600">${Number(deal.amount).toLocaleString()}</p>
                  </div>
                )}
                {deal.closeDate && (
                  <div className="rounded-xl bg-muted/30 border border-border/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">Expected Close</p>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(deal.closeDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {deal.probability != null && (
                  <div className="rounded-xl bg-muted/30 border border-border/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">Probability</p>
                    <p className="text-sm font-semibold text-foreground">{deal.probability}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Documents */}
          <Card className="rounded-2xl border-border/40 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {documents && documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc: any) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Paperclip className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No documents shared yet</p>
                </div>
              )}

              {/* Upload */}
              <div className="pt-2 border-t border-border/40">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {uploading ? "Uploading..." : "Upload a document"}
                    </span>
                  </div>
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card className="rounded-2xl border-border/40 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {comments && comments.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {comments.map((c: any) => (
                    <div key={c.id} className={`flex items-start gap-2 p-3 rounded-xl border border-border/40 ${c.authorType === "rep" ? "bg-primary/5" : "bg-muted/30"}`}>
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground">
                            {c.authorName || "You"}
                            {c.authorType === "rep" && <span className="ml-1 text-[10px] text-primary font-normal">(Account Rep)</span>}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No comments yet. Start the conversation below.</p>
                </div>
              )}

              {/* Add comment */}
              <div className="pt-2 border-t border-border/40 space-y-2">
                <input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full rounded-xl bg-muted/30 border border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Leave a comment..."
                  className="rounded-xl bg-muted/30 border-border/50 min-h-[70px] text-sm resize-none"
                />
                <Button
                  size="sm"
                  disabled={!comment.trim() || addComment.isPending}
                  onClick={() => addComment.mutate({ token: token!, content: comment, authorName: authorName || undefined })}
                  className="w-full gap-2 rounded-xl"
                >
                  <Send className="h-3.5 w-3.5" />
                  {addComment.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground/60 py-4">
          <p>This portal is private and secure. Powered by Axiom CRM.</p>
        </div>
      </div>
    </div>
  );
}
