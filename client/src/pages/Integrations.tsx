import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Key, Plus, Trash2, Loader2, CheckCircle2, XCircle,
  RefreshCw, Globe, Shield,
} from "lucide-react";
import { useState } from "react";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";
import { useSkin } from "@/contexts/SkinContext";


const serviceOptions = [
  { value: "apollo", label: "Apollo.io", description: "B2B contact and company data enrichment" },
  { value: "neverbounce", label: "NeverBounce", description: "Email verification and list cleaning" },
  { value: "phantombuster", label: "PhantomBuster", description: "LinkedIn automation and scraping" },
  { value: "google_ai", label: "Google AI", description: "Gemini AI for advanced analysis" },
  { value: "sendgrid", label: "SendGrid", description: "Transactional email delivery" },
  { value: "clearbit", label: "Clearbit", description: "Company and person enrichment" },
  { value: "hunter", label: "Hunter.io", description: "Email finder and verification" },
  { value: "custom", label: "Custom API", description: "Custom integration endpoint" },
];

const statusColors: Record<string, string> = {
  success: "text-green-400",
  failed: "text-red-400",
  untested: "text-zinc-400",
};

export default function Integrations() {
  const { t } = useSkin();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ service: "apollo", apiKey: "", apiSecret: "", baseUrl: "" });

  const utils = trpc.useUtils();
  const { data: integrations, isLoading } = trpc.integrations.list.useQuery();
  const upsertMut = trpc.integrations.upsert.useMutation({
    onSuccess: () => { utils.integrations.list.invalidate(); setShowAdd(false); setForm({ service: "apollo", apiKey: "", apiSecret: "", baseUrl: "" }); toast.success("Integration saved"); },
  });
  const testMut = trpc.integrations.test.useMutation({
    onSuccess: () => { utils.integrations.list.invalidate(); toast.success("Connection test passed"); },
    onError: () => toast.error("Connection test failed"),
  });
  const deleteMut = trpc.integrations.delete.useMutation({
    onSuccess: () => { utils.integrations.list.invalidate(); toast.success("Integration removed"); },
  });

  const creds = integrations ?? [];

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.integrations} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            Integrations
          </h1>
          <p className="text-muted-foreground mt-1">Manage API credentials for external services</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Integration</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Integration</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Service</Label>
                <Select value={form.service} onValueChange={(v) => setForm(p => ({ ...p, service: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {serviceOptions.find(s => s.value === form.service)?.description}
                </p>
              </div>
              <div>
                <Label className="text-xs">API Key *</Label>
                <Input type="password" value={form.apiKey} onChange={(e) => setForm(p => ({ ...p, apiKey: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">API Secret (optional)</Label>
                <Input type="password" value={form.apiSecret} onChange={(e) => setForm(p => ({ ...p, apiSecret: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Base URL (optional)</Label>
                <Input value={form.baseUrl} onChange={(e) => setForm(p => ({ ...p, baseUrl: e.target.value }))} className="mt-1" placeholder="https://api.example.com" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={() => upsertMut.mutate(form)} disabled={!form.apiKey.trim() || upsertMut.isPending}>
                {upsertMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : creds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Key className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">No integrations configured</p>
            <p className="text-sm">Add API keys for Apollo, NeverBounce, PhantomBuster, and more</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {creds.map((cred) => {
            const svc = serviceOptions.find(s => s.value === cred.service);
            return (
              <Card key={cred.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {svc?.label ?? cred.service}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {cred.testStatus === "success" && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                      {cred.testStatus === "failed" && <XCircle className="h-4 w-4 text-red-400" />}
                    </div>
                  </div>
                  <CardDescription className="text-xs">{svc?.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 text-xs text-muted-foreground font-mono">
                      {cred.apiKey ? `${cred.apiKey.slice(0, 8)}${"*".repeat(20)}` : "No key set"}
                    </div>
                    {cred.testStatus && (
                      <Badge variant="outline" className={`text-[10px] ${statusColors[cred.testStatus ?? "untested"] ?? ""}`}>
                        {cred.testStatus}
                      </Badge>
                    )}
                  </div>
                  {cred.testMessage && (
                    <p className="text-xs text-muted-foreground mb-3">{cred.testMessage}</p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => testMut.mutate({ id: cred.id })} disabled={testMut.isPending}>
                      {testMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                      Test
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { if (confirm("Remove this integration?")) deleteMut.mutate({ id: cred.id }); }}>
                      <Trash2 className="h-3.5 w-3.5 mr-1 text-red-400" /> Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
