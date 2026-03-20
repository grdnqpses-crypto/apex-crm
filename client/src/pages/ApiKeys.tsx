import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Key, Copy, Trash2, MoreHorizontal, Shield, Code } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";
import { useSkin } from "@/contexts/SkinContext";


export default function ApiKeys() {
  const { t } = useSkin();
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: keys, isLoading } = trpc.apiKeys.list.useQuery();
  const createMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => { utils.apiKeys.list.invalidate(); setNewKey(data.key); toast.success("API key created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.apiKeys.delete.useMutation({
    onSuccess: () => { utils.apiKeys.list.invalidate(); toast.success("API key deleted"); },
  });

  const [form, setForm] = useState({ name: "", expiresIn: "" });

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    createMutation.mutate({
      name: form.name,
      permissions: ["read", "write"],
      expiresAt: form.expiresIn ? Date.now() + parseInt(form.expiresIn) * 86400000 : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.apiKeys} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage API keys for programmatic access to your CRM data.</p>
        </div>
        <Button onClick={() => { setNewKey(null); setShowCreate(true); }} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Generate Key
        </Button>
      </div>

      {/* API Documentation Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" /> Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-secondary/30 rounded-lg p-4 font-mono text-xs text-muted-foreground space-y-1">
            <p className="text-foreground">// Example: List contacts via API</p>
            <p>curl -H "Authorization: Bearer YOUR_API_KEY" \</p>
            <p className="pl-4">-H "Content-Type: application/json" \</p>
            <p className="pl-4">{window.location.origin}/api/v1/contacts</p>
          </div>
        </CardContent>
      </Card>

      {/* Keys Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Permissions</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Used</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : keys?.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No API keys yet. Generate your first key to start integrating.
                  </TableCell>
                </TableRow>
              ) : (
                keys?.map((key) => (
                  <TableRow key={key.id} className="border-border hover:bg-secondary/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-chart-3" />
                        <span className="font-medium text-sm text-foreground">{key.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded">{key.keyPrefix}...****</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {((key.permissions as string[]) ?? []).map((p, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">{p}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${key.isActive ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                        {key.isActive ? "Active" : "Revoked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate({ id: key.id })}>
                            <Trash2 className="mr-2 h-4 w-4" /> Revoke
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

      {/* Create Key Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) setNewKey(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{newKey ? "API Key Created" : "Generate API Key"}</DialogTitle></DialogHeader>
          {newKey ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm font-medium text-warning mb-2">Copy this key now. You will not be able to see it again.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-secondary/30 p-2 rounded font-mono break-all text-foreground">{newKey}</code>
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(newKey); toast.success("Copied!"); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={() => { setShowCreate(false); setNewKey(null); }} className="w-full">Done</Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Key Name *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Production API Key" className="bg-secondary/30" /></div>
                <div className="space-y-2"><Label>Expires In (days, leave empty for no expiry)</Label><Input type="number" value={form.expiresIn} onChange={(e) => setForm(p => ({ ...p, expiresIn: e.target.value }))} placeholder="90" className="bg-secondary/30" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>{createMutation.isPending ? "Generating..." : "Generate Key"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
