import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  PenTool, Sparkles, Send, Reply, Copy, RefreshCw, Mail, MessageSquare
} from "lucide-react";

export default function AIGhostwriter() {
  const [draftForm, setDraftForm] = useState({ contactId: 0, dealId: 0, purpose: "follow_up", tone: "professional", context: "" });
  const [replyForm, setReplyForm] = useState({ originalEmail: "", contactId: 0, tone: "professional", intent: "continue" });
  const [generatedDraft, setGeneratedDraft] = useState<any>(null);
  const [generatedReply, setGeneratedReply] = useState<any>(null);

  const draftEmail = trpc.aiGhostwriter.draftEmail.useMutation({
    onSuccess: (data) => { setGeneratedDraft(data); toast.success("Email drafted"); },
    onError: () => toast.error("Failed to generate draft"),
  });
  const draftReply = trpc.aiGhostwriter.draftReply.useMutation({
    onSuccess: (data) => { setGeneratedReply(data); toast.success("Reply drafted"); },
    onError: () => toast.error("Failed to generate reply"),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PenTool className="h-7 w-7 text-primary" />
          AI Ghostwriter
        </h1>
        <p className="text-muted-foreground mt-1">AI-powered email drafting and reply generation for freight brokerage sales</p>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compose"><Mail className="h-4 w-4 mr-1" /> Compose Email</TabsTrigger>
          <TabsTrigger value="reply"><Reply className="h-4 w-4 mr-1" /> Draft Reply</TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Email Parameters</CardTitle>
                <CardDescription>Configure the email context for AI generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Purpose</label>
                    <Select value={draftForm.purpose} onValueChange={(v) => setDraftForm({ ...draftForm, purpose: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                        <SelectItem value="introduction">Introduction</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="thank_you">Thank You</SelectItem>
                        <SelectItem value="check_in">Check In</SelectItem>
                        <SelectItem value="rate_quote">Rate Quote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tone</label>
                    <Select value={draftForm.tone} onValueChange={(v) => setDraftForm({ ...draftForm, tone: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Context / Notes</label>
                  <Textarea value={draftForm.context} onChange={(e) => setDraftForm({ ...draftForm, context: e.target.value })} placeholder="Any context for the AI to use... e.g., 'Following up on our call about the Chicago to Dallas lane'" rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Contact ID (optional)</label>
                    <Input type="number" value={draftForm.contactId || ""} onChange={(e) => setDraftForm({ ...draftForm, contactId: parseInt(e.target.value) || 0 })} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Deal ID (optional)</label>
                    <Input type="number" value={draftForm.dealId || ""} onChange={(e) => setDraftForm({ ...draftForm, dealId: parseInt(e.target.value) || 0 })} placeholder="0" />
                  </div>
                </div>
                <Button className="w-full" onClick={() => draftEmail.mutate({
                  contactId: draftForm.contactId || undefined,
                  dealId: draftForm.dealId || undefined,
                  purpose: draftForm.purpose,
                  tone: draftForm.tone,
                  context: draftForm.context,
                })} disabled={draftEmail.isPending}>
                  <Sparkles className="h-4 w-4 mr-2" /> {draftEmail.isPending ? "Generating..." : "Generate Email"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Generated Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedDraft ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Subject</label>
                      <div className="flex items-center gap-2">
                        <p className="font-medium flex-1">{generatedDraft.subject}</p>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(generatedDraft.subject)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Body</label>
                      <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">{generatedDraft.plainText || generatedDraft.body}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedDraft.plainText || generatedDraft.body)}>
                        <Copy className="h-3 w-3 mr-1" /> Copy Body
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => draftEmail.mutate({
                        contactId: draftForm.contactId || undefined,
                        dealId: draftForm.dealId || undefined,
                        purpose: draftForm.purpose,
                        tone: draftForm.tone,
                        context: draftForm.context,
                      })}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <PenTool className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Configure parameters and click Generate to create an email</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reply Tab */}
        <TabsContent value="reply" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Original Email</CardTitle>
                <CardDescription>Paste the email you want to reply to</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea value={replyForm.originalEmail} onChange={(e) => setReplyForm({ ...replyForm, originalEmail: e.target.value })} placeholder="Paste the original email content here..." rows={8} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tone</label>
                    <Select value={replyForm.tone} onValueChange={(v) => setReplyForm({ ...replyForm, tone: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="firm">Firm</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Intent</label>
                    <Select value={replyForm.intent} onValueChange={(v) => setReplyForm({ ...replyForm, intent: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="continue">Continue Conversation</SelectItem>
                        <SelectItem value="close_deal">Close Deal</SelectItem>
                        <SelectItem value="negotiate">Negotiate</SelectItem>
                        <SelectItem value="decline">Politely Decline</SelectItem>
                        <SelectItem value="schedule">Schedule Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" onClick={() => draftReply.mutate({
                  originalEmail: replyForm.originalEmail,
                  contactId: replyForm.contactId || undefined,
                  tone: replyForm.tone,
                  intent: replyForm.intent,
                })} disabled={!replyForm.originalEmail || draftReply.isPending}>
                  <Reply className="h-4 w-4 mr-2" /> {draftReply.isPending ? "Generating..." : "Generate Reply"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Reply className="h-4 w-4" /> Generated Reply
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedReply ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Subject</label>
                      <p className="font-medium">{generatedReply.subject}</p>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Reply</label>
                      <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">{generatedReply.plainText || generatedReply.body}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedReply.plainText || generatedReply.body)}>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => draftReply.mutate({
                        originalEmail: replyForm.originalEmail,
                        contactId: replyForm.contactId || undefined,
                        tone: replyForm.tone,
                        intent: replyForm.intent,
                      })}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Paste an email and click Generate to create a reply</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
