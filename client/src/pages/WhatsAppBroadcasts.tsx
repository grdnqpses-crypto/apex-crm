import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Plus, Send, Users, Clock, CheckCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  sending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function WhatsAppBroadcasts() {
  const { data: broadcasts, isLoading } = trpc.whatsappBroadcasts.list.useQuery();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", message: "", mediaUrl: "", scheduledAt: "" });

  const create = trpc.whatsappBroadcasts.create.useMutation({
    onSuccess: () => {
      toast.success("Broadcast campaign created");
      utils.whatsappBroadcasts.list.invalidate();
      setOpen(false);
      setForm({ name: "", message: "", mediaUrl: "", scheduledAt: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const send = trpc.whatsappBroadcasts.send.useMutation({
    onSuccess: (data) => {
      toast.success(`Broadcast sent to ${data.sentCount} recipients`);
      utils.whatsappBroadcasts.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.name.trim()) return toast.error("Campaign name is required");
    if (!form.message.trim()) return toast.error("Message is required");
    create.mutate({
      name: form.name,
      message: form.message,
      mediaUrl: form.mediaUrl || undefined,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).getTime() : undefined,
    });
  };

  const totalSent = broadcasts?.filter((b) => b.status === "sent").reduce((s, b) => s + (b.recipientCount ?? 0), 0) ?? 0;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-emerald-500" />
              WhatsApp Broadcasts
            </h1>
            <p className="text-muted-foreground mt-1">Send bulk WhatsApp messages to your contacts</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                New Broadcast
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create WhatsApp Broadcast</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Campaign Name</Label>
                  <Input
                    placeholder="e.g. Q2 Product Launch"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Hi {{first_name}}, we have an exciting announcement..."
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Use {"{{first_name}}"}, {"{{company}}"} for personalization</p>
                </div>
                <div className="space-y-2">
                  <Label>Media URL (optional)</Label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={form.mediaUrl}
                    onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Schedule (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  />
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <strong>Note:</strong> WhatsApp Business API requires approved message templates for broadcast campaigns. Ensure your message follows WhatsApp's business messaging policies.
                  </p>
                </div>
                <Button onClick={handleCreate} disabled={create.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {create.isPending ? "Creating..." : "Create Broadcast"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Send className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{broadcasts?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Campaigns</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalSent.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Messages Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{broadcasts?.filter((b) => b.status === "scheduled").length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Broadcast list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-20 bg-muted/30 rounded-xl" />
              </Card>
            ))}
          </div>
        ) : !broadcasts?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No broadcasts yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Create your first WhatsApp broadcast campaign to reach all your contacts at once.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((b) => (
              <Card key={b.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{b.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${STATUS_COLORS[b.status ?? "draft"] ?? STATUS_COLORS.draft}`}>
                          {b.status ?? "draft"}
                        </Badge>
                        {(b.recipientCount ?? 0) > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {b.recipientCount} recipients
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">{timeAgo(b.createdAt ?? Date.now())}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => send.mutate({ id: b.id })}
                        disabled={send.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        Send Now
                      </Button>
                    )}
                    {b.status === "sent" && (
                      <div className="flex items-center gap-1 text-emerald-600 text-xs">
                        <CheckCheck className="w-4 h-4" />
                        Delivered
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
