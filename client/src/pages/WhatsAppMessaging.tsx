import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MessageCircle, Send, Plus, Sparkles, Phone, Clock, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";

export default function WhatsAppMessaging() {
  const { t } = useSkin();
  const utils = trpc.useUtils();
  const { data: conversations, isLoading } = trpc.whatsapp.getConversations.useQuery();
  const { data: templates } = trpc.whatsapp.getTemplates.useQuery();
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [showSend, setShowSend] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [msgForm, setMsgForm] = useState({ phone: "", body: "", contactId: undefined as number | undefined });
  const [templateForm, setTemplateForm] = useState({ name: "", body: "", category: "marketing" });
  const [aiPrompt, setAiPrompt] = useState("");

  const { data: messages } = trpc.whatsapp.getMessages.useQuery(
    { phone: selectedConv! },
    { enabled: !!selectedConv }
  );

  const sendMutation = trpc.whatsapp.sendMessage.useMutation({
    onSuccess: () => { utils.whatsapp.getConversations.invalidate(); setShowSend(false); setMsgForm({ phone: "", body: "", contactId: undefined }); toast.success("Message sent"); },
    onError: (e) => toast.error(e.message),
  });
  const createTemplateMutation = trpc.whatsapp.createTemplate.useMutation({
    onSuccess: () => { utils.whatsapp.getTemplates.invalidate(); setShowTemplate(false); toast.success("Template created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteTemplateMutation = trpc.whatsapp.deleteTemplate.useMutation({
    onSuccess: () => { utils.whatsapp.getTemplates.invalidate(); toast.success("Template deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const generateAIMutation = trpc.whatsapp.generateMessageWithAI.useMutation({
    onSuccess: (data) => { setMsgForm(prev => ({ ...prev, body: data.message || prev.body })); toast.success("AI message generated"); },
    onError: (e) => toast.error(e.message),
  });

  const convList = conversations as any[] || [];
  const msgList = messages as any[] || [];
  const templateList = templates as any[] || [];

  return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><MessageCircle className="w-6 h-6 text-green-400" /> WhatsApp Messaging</h1>
            <p className="text-muted-foreground mt-1">Two-way WhatsApp conversations with contacts, AI-generated messages, and reusable templates</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTemplate(true)} className="gap-2"><Plus className="w-4 h-4" /> New Template</Button>
            <Button onClick={() => setShowSend(true)} className="gap-2 bg-green-600 hover:bg-green-700"><Send className="w-4 h-4" /> Send Message</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active Conversations", value: convList.length, icon: MessageCircle, color: "text-green-400" },
            { label: "Messages Sent", value: convList.reduce((s: number, c: any) => s + (c.messageCount || 0), 0), icon: Send, color: "text-blue-400" },
            { label: "Templates", value: templateList.length, icon: Plus, color: "text-purple-400" },
          ].map(stat => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p><p className="text-2xl font-bold mt-1">{stat.value}</p></div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-60`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="col-span-1 space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("inbox")}</h2>
            {isLoading && <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>}
            {!isLoading && convList.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <Button size="sm" className="mt-3 bg-green-600 hover:bg-green-700" onClick={() => setShowSend(true)}>Start Conversation</Button>
                </CardContent>
              </Card>
            )}
            {convList.map((conv: any) => (
              <button key={conv.phone} onClick={() => setSelectedConv(conv.phone)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedConv === conv.phone ? "border-green-400/50 bg-green-400/5" : "border-border/50 hover:border-border"}`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">{conv.contactName || conv.phone}</span>
                      {conv.lastMessageAt && <span className="text-xs text-muted-foreground">{new Date(conv.lastMessageAt).toLocaleDateString()}</span>}
                    </div>
                    {conv.lastMessage && <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Message Thread */}
          <div className="col-span-2">
            {!selectedConv ? (
              <Card className="border-dashed h-full">
                <CardContent className="p-12 text-center h-full flex flex-col items-center justify-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Select a conversation to view messages</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-400" />
                    {selectedConv}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {msgList.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No messages in this conversation</p>}
                    {msgList.map((msg: any) => (
                      <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${msg.direction === "outbound" ? "bg-green-600 text-white" : "bg-muted"}`}>
                          <p>{msg.body}</p>
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            <span className="text-xs opacity-70">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            {msg.direction === "outbound" && <CheckCheck className="w-3 h-3 opacity-70" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Input placeholder="Type a message..." className="flex-1" onKeyDown={e => {
                      if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                        sendMutation.mutate({ phone: selectedConv, body: (e.target as HTMLInputElement).value.trim() });
                        (e.target as HTMLInputElement).value = "";
                      }
                    }} />
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => {
                      const input = document.querySelector('input[placeholder="Type a message..."]') as HTMLInputElement;
                      if (input?.value.trim()) {
                        sendMutation.mutate({ phone: selectedConv, body: input.value.trim() });
                        input.value = "";
                      }
                    }}><Send className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Templates Section */}
        {templateList.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Message Templates</h2>
            <div className="grid grid-cols-3 gap-3">
              {templateList.map((tmpl: any) => (
                <Card key={tmpl.id} className="border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{tmpl.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">{tmpl.category}</Badge>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{tmpl.body}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteTemplateMutation.mutate({ id: tmpl.id })}><span className="text-xs">✕</span></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Send Message Dialog */}
        <Dialog open={showSend} onOpenChange={setShowSend}>
          <DialogContent>
            <DialogHeader><DialogTitle>Send WhatsApp Message</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Phone Number *</Label><Input value={msgForm.phone} onChange={e => setMsgForm({ ...msgForm, phone: e.target.value })} placeholder="+1 555 000 0000" /></div>
              <div><Label>Message *</Label><Textarea value={msgForm.body} onChange={e => setMsgForm({ ...msgForm, body: e.target.value })} placeholder="Write your message..." rows={4} /></div>
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                <Input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe message goal for AI generation..." className="border-0 bg-transparent p-0 focus-visible:ring-0 text-sm" />
                <Button size="sm" variant="outline" disabled={!aiPrompt || generateAIMutation.isPending} onClick={() => generateAIMutation.mutate({ contactName: msgForm.phone || 'Contact', purpose: aiPrompt })}>
                  Generate
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSend(false)}>Cancel</Button>
              <Button onClick={() => sendMutation.mutate(msgForm)} disabled={!msgForm.phone || !msgForm.body || sendMutation.isPending} className="bg-green-600 hover:bg-green-700">
                {sendMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Template Dialog */}
        <Dialog open={showTemplate} onOpenChange={setShowTemplate}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Message Template</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Template Name *</Label><Input value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="e.g. Follow-up After Demo" /></div>
              <div><Label>Category</Label>
                <select className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" value={templateForm.category} onChange={e => setTemplateForm({ ...templateForm, category: e.target.value })}>
                  <option value="marketing">Marketing</option>
                  <option value="utility">Utility</option>
                  <option value="authentication">Authentication</option>
                </select>
              </div>
              <div><Label>Message Body *</Label><Textarea value={templateForm.body} onChange={e => setTemplateForm({ ...templateForm, body: e.target.value })} placeholder="Template content... Use {{name}} for variables" rows={4} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTemplate(false)}>Cancel</Button>
              <Button onClick={() => createTemplateMutation.mutate(templateForm)} disabled={!templateForm.name || !templateForm.body || createTemplateMutation.isPending}>
                {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
