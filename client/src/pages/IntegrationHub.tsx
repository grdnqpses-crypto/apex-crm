import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, Plug, ExternalLink, Trash2, TestTube } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const CATEGORIES = ["all", "communication", "automation", "finance", "meetings", "ecommerce", "forms", "scheduling", "prospecting", "telephony", "email", "migration"];

export default function IntegrationHub() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [connectingKey, setConnectingKey] = useState<string | null>(null);
  const [connectForm, setConnectForm] = useState({ webhookUrl: "", apiKey: "" });

  const { data: integrations = [], refetch } = trpc.integrationHub.list.useQuery();
  const connectMutation = trpc.integrationHub.connect.useMutation();
  const disconnectMutation = trpc.integrationHub.disconnect.useMutation();
  const testMutation = trpc.integrationHub.test.useMutation();

  const filtered = integrations.filter(i => {
    const matchCat = activeCategory === "all" || i.category === activeCategory;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const connected = integrations.filter(i => i.connection?.status === "connected");

  const handleConnect = async () => {
    if (!connectingKey) return;
    const integration = integrations.find(i => i.key === connectingKey);
    if (!integration) return;
    try {
      await connectMutation.mutateAsync({
        connectorKey: connectingKey,
        displayName: integration.name,
        webhookUrl: connectForm.webhookUrl || undefined,
        apiKey: connectForm.apiKey || undefined,
      });
      toast.success(`${integration.name} connected`);
      setConnectingKey(null);
      setConnectForm({ webhookUrl: "", apiKey: "" });
      refetch();
    } catch { toast.error("Connection failed"); }
  };

  const handleDisconnect = async (key: string, name: string) => {
    try {
      await disconnectMutation.mutateAsync({ connectorKey: key });
      toast.success(`${name} disconnected`);
      refetch();
    } catch { toast.error("Disconnect failed"); }
  };

  const handleTest = async (key: string, name: string) => {
    try {
      const result = await testMutation.mutateAsync({ connectorKey: key });
      if (result.success) toast.success(`${name} connection verified`);
      else toast.error(`${name} test failed — check your credentials`);
      refetch();
    } catch { toast.error("Test failed"); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Integration Hub</h1>
          <p className="text-muted-foreground mt-1">Connect Apex CRM to your favorite tools and automate your workflow</p>
        </div>

        {/* Connected summary */}
        {connected.length > 0 && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-400">{connected.length} integration{connected.length > 1 ? "s" : ""} connected</span>
                <div className="flex gap-2 ml-2 flex-wrap">
                  {connected.map(c => (
                    <Badge key={c.key} variant="outline" className="border-green-400 text-green-700 dark:text-green-400">
                      {c.logo} {c.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search + Filter */}
        <div className="flex gap-3 items-center">
          <Input placeholder="Search integrations..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex-wrap h-auto gap-1">
            {CATEGORIES.map(c => (
              <TabsTrigger key={c} value={c} className="capitalize text-xs">
                {c === "all" ? `All (${integrations.length})` : c}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(integration => {
                const isConnected = integration.connection?.status === "connected";
                const hasError = integration.connection?.status === "error";
                return (
                  <Card key={integration.key} className={`relative ${isConnected ? "border-green-300 dark:border-green-700" : ""}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{integration.logo}</span>
                          <div>
                            <CardTitle className="text-base">{integration.name}</CardTitle>
                            <Badge variant="outline" className="text-xs mt-1 capitalize">{integration.category}</Badge>
                          </div>
                        </div>
                        {isConnected && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
                        {hasError && <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm mb-4">{integration.description}</CardDescription>
                      <div className="flex gap-2">
                        {isConnected ? (
                          <>
                            <Button variant="outline" size="sm" className="flex-1"
                              onClick={() => handleTest(integration.key, integration.name)}
                              disabled={testMutation.isPending}>
                              <TestTube className="h-3 w-3 mr-1" />Test
                            </Button>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"
                              onClick={() => handleDisconnect(integration.key, integration.name)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" className="flex-1" onClick={() => { setConnectingKey(integration.key); setConnectForm({ webhookUrl: "", apiKey: "" }); }}>
                            <Plug className="h-3 w-3 mr-1" />Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Plug className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No integrations found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Connect Dialog */}
      <Dialog open={!!connectingKey} onOpenChange={open => !open && setConnectingKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {integrations.find(i => i.key === connectingKey)?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              {integrations.find(i => i.key === connectingKey)?.description}
            </p>
            <div>
              <Label>Webhook URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={connectForm.webhookUrl} onChange={e => setConnectForm(f => ({ ...f, webhookUrl: e.target.value }))}
                placeholder="https://hooks.example.com/..." className="mt-1" />
            </div>
            <div>
              <Label>API Key <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input type="password" value={connectForm.apiKey} onChange={e => setConnectForm(f => ({ ...f, apiKey: e.target.value }))}
                placeholder="sk-..." className="mt-1" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConnectingKey(null)}>Cancel</Button>
            <Button onClick={handleConnect} disabled={connectMutation.isPending}>
              {connectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plug className="h-4 w-4 mr-1" />}
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
