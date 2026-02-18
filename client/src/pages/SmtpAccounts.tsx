import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Server, Plus, MoreHorizontal, Trash2, RefreshCw, Shield, Zap, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const emptyForm = {
  emailAddress: "", displayName: "", domain: "", smtpHost: "", smtpPort: 587,
  smtpUsername: "", smtpPassword: "", useTls: true, dailyLimit: 400,
};

export default function SmtpAccounts() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const utils = trpc.useUtils();

  const { data: accounts, isLoading } = trpc.smtpAccounts.list.useQuery();
  const createMutation = trpc.smtpAccounts.create.useMutation({
    onSuccess: () => { utils.smtpAccounts.list.invalidate(); setShowCreate(false); setForm({ ...emptyForm }); toast.success("SMTP account added"); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMutation = trpc.smtpAccounts.delete.useMutation({
    onSuccess: () => { utils.smtpAccounts.list.invalidate(); toast.success("Account deleted"); },
  });
  const resetMutation = trpc.smtpAccounts.resetDailyCounts.useMutation({
    onSuccess: () => { utils.smtpAccounts.list.invalidate(); toast.success("Daily counts reset"); },
  });
  const updateMutation = trpc.smtpAccounts.update.useMutation({
    onSuccess: () => { utils.smtpAccounts.list.invalidate(); toast.success("Account updated"); },
  });

  const totalAccounts = accounts?.length ?? 0;
  const activeAccounts = accounts?.filter((a: any) => a.isActive).length ?? 0;
  const totalDailyCapacity = accounts?.reduce((sum: number, a: any) => sum + (a.isActive ? (a.dailyLimit ?? 400) : 0), 0) ?? 0;
  const totalSentToday = accounts?.reduce((sum: number, a: any) => sum + (a.sentToday ?? 0), 0) ?? 0;
  const uniqueDomains = new Set(accounts?.map((a: any) => a.domain) ?? []).size;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SMTP Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your sending infrastructure for email campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending}>
            <RefreshCw className="h-4 w-4" /> Reset Daily Counts
          </Button>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Add Account
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Accounts</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalAccounts}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{activeAccounts}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Domains</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{uniqueDomains}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sent Today</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalSentToday.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Daily Capacity</span>
            </div>
            <p className="text-2xl font-bold text-primary">{totalDailyCapacity.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Bar */}
      {totalDailyCapacity > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Daily Sending Capacity</span>
              <span className="text-sm text-muted-foreground">{totalSentToday.toLocaleString()} / {totalDailyCapacity.toLocaleString()}</span>
            </div>
            <Progress value={(totalSentToday / totalDailyCapacity) * 100} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Accounts Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Domain</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SMTP Host</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sent / Limit</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">TLS</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>)}
                  </TableRow>
                ))
              ) : (!accounts || accounts.length === 0) ? (
                <TableRow className="border-border">
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No SMTP accounts configured. Add your first sending account to start sending campaigns.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account: any) => {
                  const usage = account.dailyLimit ? (account.sentToday / account.dailyLimit) * 100 : 0;
                  return (
                    <TableRow key={account.id} className="border-border">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm text-foreground">{account.emailAddress}</p>
                          {account.displayName && <p className="text-xs text-muted-foreground">{account.displayName}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{account.domain}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{account.smtpHost}:{account.smtpPort}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={account.isActive}
                            onCheckedChange={(checked) => updateMutation.mutate({ id: account.id, isActive: checked })}
                          />
                          <Badge variant="secondary" className={account.isActive ? "bg-green-500/15 text-green-400" : "bg-muted text-muted-foreground"}>
                            {account.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">{account.sentToday ?? 0} / {account.dailyLimit ?? 400}</span>
                          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${usage > 80 ? "bg-red-400" : usage > 50 ? "bg-yellow-400" : "bg-green-400"}`} style={{ width: `${Math.min(usage, 100)}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{account.useTls ? "TLS" : "None"}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate({ id: account.id })}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader><DialogTitle>Add SMTP Account</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <Input value={form.emailAddress} onChange={(e) => setForm(p => ({ ...p, emailAddress: e.target.value }))} placeholder="sales@domain.com" className="bg-secondary/30" />
                </div>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={form.displayName} onChange={(e) => setForm(p => ({ ...p, displayName: e.target.value }))} placeholder="Sales Team" className="bg-secondary/30" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Domain *</Label>
                <Input value={form.domain} onChange={(e) => setForm(p => ({ ...p, domain: e.target.value }))} placeholder="domain.com" className="bg-secondary/30" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host *</Label>
                  <Input value={form.smtpHost} onChange={(e) => setForm(p => ({ ...p, smtpHost: e.target.value }))} placeholder="mail.domain.com" className="bg-secondary/30" />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input type="number" value={form.smtpPort} onChange={(e) => setForm(p => ({ ...p, smtpPort: parseInt(e.target.value) || 587 }))} className="bg-secondary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Username *</Label>
                  <Input value={form.smtpUsername} onChange={(e) => setForm(p => ({ ...p, smtpUsername: e.target.value }))} placeholder="sales@domain.com" className="bg-secondary/30" />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Password *</Label>
                  <Input type="password" value={form.smtpPassword} onChange={(e) => setForm(p => ({ ...p, smtpPassword: e.target.value }))} placeholder="••••••••" className="bg-secondary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Daily Limit</Label>
                  <Input type="number" value={form.dailyLimit} onChange={(e) => setForm(p => ({ ...p, dailyLimit: parseInt(e.target.value) || 400 }))} className="bg-secondary/30" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={form.useTls} onCheckedChange={(checked) => setForm(p => ({ ...p, useTls: checked }))} />
                  <Label>Use TLS</Label>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!form.emailAddress || !form.domain || !form.smtpHost || !form.smtpUsername || !form.smtpPassword) {
                toast.error("Please fill in all required fields"); return;
              }
              createMutation.mutate(form);
            }} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
