import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Webhook, MoreHorizontal, Trash2, Eye, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";
import { useSkin } from "@/contexts/SkinContext";


const EVENTS = [
  "contact.created", "contact.updated", "contact.deleted",
  "deal.created", "deal.updated", "deal.won", "deal.lost",
  "campaign.sent", "campaign.opened", "campaign.clicked",
  "task.created", "task.completed",
];

export default function Webhooks() {
  const { t } = useSkin();
  const [showCreate, setShowCreate] = useState(false);
  const [showLogs, setShowLogs] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: webhooks, isLoading } = trpc.webhooks.list.useQuery();
  const createMutation = trpc.webhooks.create.useMutation({
    onSuccess: () => { utils.webhooks.list.invalidate(); setShowCreate(false); toast.success("Webhook created"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.webhooks.update.useMutation({
    onSuccess: () => { utils.webhooks.list.invalidate(); },
  });
  const deleteMutation = trpc.webhooks.delete.useMutation({
    onSuccess: () => { utils.webhooks.list.invalidate(); toast.success("Webhook deleted"); },
  });
  const utils2 = trpc.useUtils();
  const { data: logs } = trpc.webhooks.logs.useQuery(
    { webhookId: showLogs!, limit: 50 },
    { enabled: !!showLogs }
  );
  const retryMutation = trpc.webhooks.retryDelivery.useMutation({
    onSuccess: (res) => {
      utils2.webhooks.logs.invalidate();
      if (res.success) toast.success("Retry delivered successfully");
      else toast.error(`Retry failed (HTTP ${res.responseStatus ?? "—"})`);
    },
    onError: (e) => toast.error(e.message),
  });
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const [form, setForm] = useState({ name: "", url: "", secret: "", events: [] as string[] });

  const handleCreate = () => {
    if (!form.name.trim() || !form.url.trim()) { toast.error("Name and URL are required"); return; }
    createMutation.mutate({
      name: form.name,
      url: form.url,
      events: form.events.length > 0 ? form.events : undefined,
      secret: form.secret || undefined,
    });
  };

  const toggleEvent = (event: string) => {
    setForm(p => ({
      ...p,
      events: p.events.includes(event) ? p.events.filter(e => e !== event) : [...p.events, event],
    }));
  };

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.webhooks} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Webhooks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Receive real-time notifications when events occur in your CRM.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Webhook
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Webhook</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Events</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : webhooks?.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No webhooks configured. Add your first webhook endpoint.
                  </TableCell>
                </TableRow>
              ) : (
                webhooks?.map((webhook) => (
                  <TableRow key={webhook.id} className="border-border hover:bg-secondary/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Webhook className="h-4 w-4 text-chart-4" />
                        <span className="font-medium text-sm text-foreground">{webhook.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><code className="text-xs text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded truncate max-w-[200px] block">{webhook.url}</code></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {((webhook.events as string[]) ?? []).slice(0, 3).map((e, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">{e}</Badge>
                        ))}
                        {((webhook.events as string[]) ?? []).length > 3 && (
                          <Badge variant="secondary" className="text-[10px]">+{((webhook.events as string[]).length - 3)}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={webhook.isActive} onCheckedChange={(checked) => updateMutation.mutate({ id: webhook.id, isActive: checked })} />
                        <span className="text-xs text-muted-foreground">{webhook.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(webhook.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setShowLogs(webhook.id)}>
                            <Eye className="mr-2 h-4 w-4" /> View Logs
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate({ id: webhook.id })}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Webhook Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>Add Webhook</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="My Integration" className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Endpoint URL *</Label><Input value={form.url} onChange={(e) => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://api.example.com/webhook" className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Signing Secret (optional)</Label><Input value={form.secret} onChange={(e) => setForm(p => ({ ...p, secret: e.target.value }))} placeholder="whsec_..." className="bg-secondary/30" /></div>
            <div className="space-y-2">
              <Label>Events</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {EVENTS.map(event => (
                  <label key={event} className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    <input type="checkbox" checked={form.events.includes(event)} onChange={() => toggleEvent(event)} className="rounded border-border" />
                    {event}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Webhook"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={!!showLogs} onOpenChange={() => { setShowLogs(null); setExpandedLog(null); }}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Webhook Delivery Logs
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {!logs ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-10">
                <Webhook className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No delivery logs yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Logs appear here when events are triggered.</p>
              </div>
            ) : (
              logs.map((log) => {
                const isSuccess = log.responseStatus !== null && log.responseStatus !== undefined && log.responseStatus >= 200 && log.responseStatus < 300;
                const isExpanded = expandedLog === log.id;
                return (
                  <Card key={log.id} className={`border transition-colors ${isSuccess ? "border-green-200/60 bg-green-50/30" : "border-red-200/60 bg-red-50/30"}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isSuccess ? (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">{log.event}</span>
                          <Badge
                            variant={isSuccess ? "default" : "destructive"}
                            className={`text-[10px] flex-shrink-0 ${isSuccess ? "bg-green-500 hover:bg-green-600" : ""}`}
                          >
                            {log.responseStatus ?? "—"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded-lg"
                            onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs rounded-lg"
                            onClick={() => retryMutation.mutate({ logId: log.id })}
                            disabled={retryMutation.isPending}
                          >
                            <RefreshCw className={`h-3 w-3 mr-1 ${retryMutation.isPending ? "animate-spin" : ""}`} />
                            Retry
                          </Button>
                        </div>
                      </div>
                      {isExpanded && (log as any).responseBody && (
                        <div className="mt-2 pt-2 border-t border-border/40">
                          <p className="text-[10px] text-muted-foreground font-medium mb-1">Response Body</p>
                          <pre className="text-xs bg-muted/40 rounded-lg p-2 overflow-x-auto max-h-32 text-muted-foreground">{(log as any).responseBody}</pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
