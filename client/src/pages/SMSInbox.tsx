import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Send, Phone, Search, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function SMSInbox() {
  const { user } = useAuth();
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [newSmsOpen, setNewSmsOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: threads, refetch: refetchThreads } = trpc.sms.listThreads.useQuery();
  const { data: messages, refetch: refetchMessages } = trpc.sms.getThread.useQuery(
    { contactId: selectedContactId! },
    { enabled: selectedContactId !== null, refetchInterval: 5000 }
  );

  const sendSms = trpc.sms.send.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
      refetchThreads();
    },
    onError: (e) => toast.error(e.message || "Failed to send SMS"),
  });

  const sendNew = trpc.sms.sendToPhone.useMutation({
    onSuccess: () => {
      toast.success("SMS sent");
      setNewSmsOpen(false);
      setNewPhone("");
      setNewMsg("");
      refetchThreads();
    },
    onError: (e) => toast.error(e.message || "Failed to send SMS"),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredThreads = (threads ?? []).filter((t: any) =>
    !searchQ || t.contactName?.toLowerCase().includes(searchQ.toLowerCase()) || t.phone?.includes(searchQ)
  );

  const selectedThread = (threads ?? []).find((t: any) => t.contactId === selectedContactId);

  const isTwilioConfigured = true; // Show UI regardless; backend will error gracefully if not configured

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Sidebar: thread list */}
        <div className="w-72 border-r border-border/50 flex flex-col shrink-0">
          <div className="p-3 border-b border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">SMS Inbox</h2>
              <Dialog open={newSmsOpen} onOpenChange={setNewSmsOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7"><Plus className="w-4 h-4" /></Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New SMS</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-sm font-medium">Phone Number</label>
                      <Input placeholder="+1 555 000 0000" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Message</label>
                      <Input placeholder="Type your message…" value={newMsg} onChange={e => setNewMsg(e.target.value)} />
                    </div>
                    <Button className="w-full" onClick={() => sendNew.mutate({ phone: newPhone, body: newMsg })} disabled={sendNew.isPending || !newPhone || !newMsg}>
                      {sendNew.isPending ? "Sending…" : "Send"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input className="pl-8 h-8 text-sm" placeholder="Search contacts…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No SMS threads yet
              </div>
            )}
            {filteredThreads.map((thread: any) => (
              <button
                key={thread.contactId ?? thread.phone}
                onClick={() => setSelectedContactId(thread.contactId)}
                className={`w-full text-left px-3 py-3 border-b border-border/30 hover:bg-muted/30 transition-colors ${selectedContactId === thread.contactId ? "bg-primary/10" : ""}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium text-sm truncate">{thread.contactName ?? thread.phone}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-1">{thread.lastAt ? new Date(thread.lastAt).toLocaleDateString() : ""}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{thread.lastMessage}</p>
                {thread.unread > 0 && (
                  <Badge className="mt-1 bg-primary text-primary-foreground text-xs h-4 px-1.5">{thread.unread}</Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main: message thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedContactId ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-3 text-muted-foreground">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p className="text-sm">Select a conversation or start a new one</p>
              {!isTwilioConfigured && (
                <Card className="border-yellow-500/30 bg-yellow-500/5 max-w-sm">
                  <CardContent className="p-4 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-yellow-300">Twilio credentials not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in Settings → Secrets to enable SMS.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {selectedThread?.contactName?.charAt(0) ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-sm">{selectedThread?.contactName ?? selectedThread?.phone}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {selectedThread?.phone}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(messages ?? []).map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl text-sm ${
                      msg.direction === "outbound"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    }`}>
                      <p>{msg.body}</p>
                      <p className={`text-xs mt-0.5 ${msg.direction === "outbound" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {msg.status && msg.direction === "outbound" && ` · ${msg.status}`}
                      </p>
                    </div>
                  </div>
                ))}
                {(!messages || messages.length === 0) && (
                  <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Send the first one!</p>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose */}
              <div className="p-3 border-t border-border/50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message…"
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (messageText.trim()) sendSms.mutate({ contactId: selectedContactId, body: messageText }); } }}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={() => { if (messageText.trim()) sendSms.mutate({ contactId: selectedContactId, body: messageText }); }}
                    disabled={sendSms.isPending || !messageText.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
