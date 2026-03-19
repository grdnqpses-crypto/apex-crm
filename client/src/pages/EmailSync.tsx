import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, CheckCircle, XCircle, Plug, Trash2, Plus, Inbox, Send, Copy } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const PROVIDERS = [
  { key: "gmail", label: "Gmail", logo: "📧", description: "Two-way sync with Gmail inbox" },
  { key: "outlook", label: "Outlook / Microsoft 365", logo: "📨", description: "Sync with Outlook and Exchange" },
];

export default function EmailSync() {
  const [showConnect, setShowConnect] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"gmail" | "outlook">("gmail");
  const [emailAddress, setEmailAddress] = useState("");

  const { data: connection, refetch } = trpc.emailSync.getConnection.useQuery();
  const { data: emails = [] } = trpc.emailSync.getRecentEmails.useQuery();
  const connectMutation = trpc.emailSync.connect.useMutation();
  const disconnectMutation = trpc.emailSync.disconnect.useMutation();

  const handleConnect = async () => {
    if (!emailAddress.trim()) { toast.error("Enter your email address"); return; }
    try {
      await connectMutation.mutateAsync({ provider: selectedProvider, emailAddress });
      toast.success(`${PROVIDERS.find(p => p.key === selectedProvider)?.label} connected`);
      setShowConnect(false);
      setEmailAddress("");
      refetch();
    } catch { toast.error("Connection failed"); }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync();
      toast.success("Email disconnected");
      refetch();
    } catch { toast.error("Disconnect failed"); }
  };

  const bccAddress = connection?.bccAddress;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Email Inbox Sync</h1>
            <p className="text-muted-foreground mt-1">Two-way email sync — every conversation logged automatically</p>
          </div>
          {!connection && (
            <Button onClick={() => setShowConnect(true)}>
              <Plus className="h-4 w-4 mr-2" />Connect Email
            </Button>
          )}
        </div>

        {/* BCC Address */}
        {bccAddress && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold">BCC Logging Address</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    BCC any email to this address and it will be automatically logged to the matching contact's timeline.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono">{bccAddress}</code>
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(bccAddress); toast.success("Copied!"); }}>
                      <Copy className="h-3 w-3 mr-1" />Copy
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="connection">
          <TabsList>
            <TabsTrigger value="connection">Connected Inbox</TabsTrigger>
            <TabsTrigger value="emails">Recent Emails ({emails.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="mt-4 space-y-4">
            {connection ? (
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{PROVIDERS.find(p => p.key === connection.provider)?.logo ?? "📧"}</span>
                      <div>
                        <div className="font-semibold">{PROVIDERS.find(p => p.key === connection.provider)?.label ?? connection.provider}</div>
                        <div className="text-sm text-muted-foreground">
                          {connection.emailAddress}
                          {connection.lastSyncAt && ` · Last synced ${new Date(connection.lastSyncAt).toLocaleString()}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={connection.syncEnabled ? "default" : "secondary"} className={connection.syncEnabled ? "bg-green-500" : ""}>
                        {connection.syncEnabled ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {connection.syncEnabled ? "Active" : "Paused"}
                      </Badge>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDisconnect} disabled={disconnectMutation.isPending}>
                        <Trash2 className="h-3 w-3 mr-1" />Disconnect
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PROVIDERS.map(p => (
                  <Card key={p.key} className="cursor-pointer hover:border-primary hover:shadow-md transition-all" onClick={() => { setSelectedProvider(p.key as "gmail" | "outlook"); setShowConnect(true); }}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{p.logo}</span>
                        <div className="font-semibold">{p.label}</div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{p.description}</p>
                      <Button size="sm" variant="outline" className="w-full">
                        <Plug className="h-3 w-3 mr-1" />Connect
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="emails" className="mt-4 space-y-2">
            {emails.map((email) => (
              <div key={email.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0 mt-0.5">
                  {email.direction === "inbound" ? <Inbox className="h-4 w-4 text-primary" /> : <Send className="h-4 w-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{email.subject ?? "(no subject)"}</div>
                    <div className="text-xs text-muted-foreground flex-shrink-0">{new Date(email.occurredAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {email.direction === "inbound" ? `From: ${email.fromEmail ?? "unknown"}` : `To: ${email.toEmail ?? "unknown"}`}
                  </div>
                  {email.body && <div className="text-xs text-muted-foreground mt-1 truncate">{email.body}</div>}
                </div>
                <Badge variant="outline" className="flex-shrink-0 text-xs capitalize">{email.direction}</Badge>
              </div>
            ))}
            {emails.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No emails synced yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Connect Dialog */}
      <Dialog open={showConnect} onOpenChange={setShowConnect}>
        <DialogContent>
          <DialogHeader><DialogTitle>Connect Email Account</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Email Provider</Label>
              <Select value={selectedProvider} onValueChange={v => setSelectedProvider(v as "gmail" | "outlook")}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map(p => <SelectItem key={p.key} value={p.key}>{p.logo} {p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Email Address</Label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={emailAddress}
                onChange={e => setEmailAddress(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              You'll be redirected to authorize Apex CRM to access your {PROVIDERS.find(p => p.key === selectedProvider)?.label} account securely via OAuth.
            </p>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowConnect(false)}>Cancel</Button>
            <Button onClick={handleConnect} disabled={connectMutation.isPending}>
              <Plug className="h-4 w-4 mr-1" />Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
