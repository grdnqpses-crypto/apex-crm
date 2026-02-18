import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, UserPlus, Shield, ShieldCheck, UserCog, User, Mail, Settings, ToggleLeft, ToggleRight, CheckCircle } from "lucide-react";
import PageGuide from "@/components/PageGuide";

const roleColors: Record<string, string> = {
  developer: "bg-red-500/10 text-red-400 border-red-500/20",
  company_admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  manager: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  user: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const roleIcons: Record<string, any> = {
  developer: Shield,
  company_admin: ShieldCheck,
  manager: UserCog,
  user: User,
};

export default function CompanyAdmin() {
  const { user } = useAuth();
  const companyId = user?.tenantCompanyId;
  const isAdmin = user?.systemRole === "company_admin" || user?.systemRole === "developer";
  const isManager = user?.systemRole === "manager";

  const { data: companyUsers, isLoading } = trpc.tenants.users.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId }
  );
  const { data: allFeatures } = trpc.tenants.allFeatures.useQuery();
  const { data: invites } = trpc.invites.list.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId && isAdmin }
  );
  const utils = trpc.useUtils();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"company_admin" | "manager" | "user">("user");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [featureUserId, setFeatureUserId] = useState<number | null>(null);

  const createInviteMutation = trpc.invites.create.useMutation({
    onSuccess: (data) => {
      utils.invites.list.invalidate();
      setShowInvite(false);
      setInviteEmail("");
      toast.success("Invite sent", { description: `Token: ${data.token.slice(0, 12)}...` });
    },
    onError: (e) => toast.error(e.message),
  });

  const revokeInviteMutation = trpc.invites.revoke.useMutation({
    onSuccess: () => { utils.invites.list.invalidate(); toast.success("Invite revoked"); },
    onError: (e) => toast.error(e.message),
  });

  const setRoleMutation = trpc.userManagement.setRole.useMutation({
    onSuccess: () => { utils.tenants.users.invalidate(); toast.success("Role updated"); },
    onError: (e) => toast.error(e.message),
  });

  const assignFeaturesMutation = trpc.userManagement.assignFeatures.useMutation({
    onSuccess: () => { setFeatureUserId(null); toast.success("Features updated"); },
    onError: (e) => toast.error(e.message),
  });

  const deactivateMutation = trpc.userManagement.deactivate.useMutation({
    onSuccess: () => { utils.tenants.users.invalidate(); toast.success("User deactivated"); },
  });

  const activateMutation = trpc.userManagement.activate.useMutation({
    onSuccess: () => { utils.tenants.users.invalidate(); toast.success("User activated"); },
  });

  // Load user features when editing
  const { data: editingFeatures } = trpc.userManagement.getFeatures.useQuery(
    { userId: featureUserId! },
    { enabled: !!featureUserId }
  );

  // Sync features when opening editor
  const openFeatureEditor = (userId: number) => {
    setFeatureUserId(userId);
    setSelectedFeatures([]);
  };

  const featureGroups = useMemo(() => {
    if (!allFeatures) return {};
    const groups: Record<string, any[]> = {};
    allFeatures.forEach((f: any) => {
      if (!groups[f.group]) groups[f.group] = [];
      (groups[f.group] as any[]).push(f);
    });
    return groups;
  }, [allFeatures]);

  // Get managers for team view
  const managers = useMemo(() => {
    if (!companyUsers) return [];
    return companyUsers.filter((u: any) => u.systemRole === "manager");
  }, [companyUsers]);

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card><CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">You are not assigned to a company. Contact your administrator.</p>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageGuide title="Team Management" description="Manage your company's team, roles, and feature access" sections={[
        { title: "Roles", content: "Company Admin can manage all users and features. Managers can manage their assigned users. Users have access to assigned features only.", icon: "purpose" },
        { title: "Features", content: "Assign specific CRM features to each user. Managers can only assign features they themselves have access to.", icon: "actions" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{companyUsers?.length || 0} team members</p>
        </div>
        {(isAdmin || isManager) && (
          <Dialog open={showInvite} onOpenChange={setShowInvite}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" />Invite Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Email Address</Label><Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" /></div>
                <div>
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {isAdmin && <SelectItem value="company_admin">Company Admin</SelectItem>}
                      {isAdmin && <SelectItem value="manager">Manager</SelectItem>}
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => createInviteMutation.mutate({ companyId: companyId!, email: inviteEmail, role: inviteRole })} disabled={!inviteEmail || createInviteMutation.isPending}>
                  {createInviteMutation.isPending ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members"><Users className="h-4 w-4 mr-1.5" />Members</TabsTrigger>
          {isAdmin && <TabsTrigger value="invites"><Mail className="h-4 w-4 mr-1.5" />Invites</TabsTrigger>}
          <TabsTrigger value="features"><Settings className="h-4 w-4 mr-1.5" />Feature Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : (companyUsers || []).map((u: any) => {
                    const RoleIcon = roleIcons[u.systemRole || "user"] || User;
                    const manager = managers.find((m: any) => m.id === u.managerId);
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                              {(u.name || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{u.name || "Unnamed"}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <Select value={u.systemRole || "user"} onValueChange={(v: any) => setRoleMutation.mutate({ userId: u.id, systemRole: v })}>
                              <SelectTrigger className="w-[140px] h-8">
                                <div className="flex items-center gap-1.5"><RoleIcon className="h-3.5 w-3.5" /><SelectValue /></div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="company_admin">Company Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline" className={roleColors[u.systemRole || "user"]}>
                              <RoleIcon className="h-3 w-3 mr-1" />{(u.systemRole || "user").replace("_", " ")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{manager?.name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={u.isActive !== false ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}>
                            {u.isActive !== false ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(isAdmin || isManager) && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openFeatureEditor(u.id)}>
                                <Settings className="h-3 w-3 mr-1" />Features
                              </Button>
                            )}
                            {isAdmin && (
                              u.isActive !== false ? (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deactivateMutation.mutate({ userId: u.id })}>
                                  <ToggleRight className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400" onClick={() => activateMutation.mutate({ userId: u.id })}>
                                  <ToggleLeft className="h-3.5 w-3.5" />
                                </Button>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="invites" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!invites || invites.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No invites sent yet</TableCell></TableRow>
                    ) : (invites || []).map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.email}</TableCell>
                        <TableCell><Badge variant="outline" className={roleColors[inv.inviteRole]}>{inv.inviteRole.replace("_", " ")}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            inv.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                            inv.status === "accepted" ? "bg-emerald-500/10 text-emerald-400" :
                            "bg-red-500/10 text-red-400"
                          }>{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(inv.expiresAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          {inv.status === "pending" && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => revokeInviteMutation.mutate({ id: inv.id })}>
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="features" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Assignment Matrix</CardTitle>
              <CardDescription>View which features each team member has access to</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10">Member</TableHead>
                    {(allFeatures || []).map((f: any) => (
                      <TableHead key={f.key} className="text-center text-xs whitespace-nowrap px-2">{f.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(companyUsers || []).map((u: any) => (
                    <FeatureRow key={u.id} user={u} allFeatures={allFeatures || []} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature Assignment Dialog */}
      <Dialog open={!!featureUserId} onOpenChange={(open) => !open && setFeatureUserId(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Assign Features</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {Object.entries(featureGroups).map(([group, features]) => (
              <div key={group}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">{group}</h4>
                <div className="space-y-2">
                  {(features as any[]).map((f: any) => {
                    const checked = selectedFeatures.includes(f.key) || (editingFeatures || []).includes(f.key);
                    return (
                      <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={checked} onCheckedChange={(c) => {
                          if (c) setSelectedFeatures(prev => [...prev, f.key]);
                          else setSelectedFeatures(prev => prev.filter(k => k !== f.key));
                        }} />
                        <span className="text-sm">{f.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedFeatures((allFeatures || []).map((f: any) => f.key))}>Select All</Button>
              <Button variant="outline" className="flex-1" onClick={() => setSelectedFeatures([])}>Clear All</Button>
            </div>
            <Button className="w-full" onClick={() => {
              if (featureUserId && companyId) {
                const finalFeatures = Array.from(new Set([...selectedFeatures, ...(editingFeatures || [])]));
                assignFeaturesMutation.mutate({ userId: featureUserId, featureKeys: selectedFeatures.length > 0 ? selectedFeatures : finalFeatures, companyId });
              }
            }} disabled={assignFeaturesMutation.isPending}>
              {assignFeaturesMutation.isPending ? "Saving..." : "Save Feature Assignments"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-component for feature matrix row
function FeatureRow({ user: u, allFeatures }: { user: any; allFeatures: readonly any[] }) {
  const { data: features } = trpc.userManagement.getFeatures.useQuery({ userId: u.id });
  const isDev = u.systemRole === "developer";

  return (
    <TableRow>
      <TableCell className="sticky left-0 bg-card z-10">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
            {(u.name || "?")[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium">{u.name || "Unnamed"}</span>
        </div>
      </TableCell>
      {allFeatures.map((f: any) => (
        <TableCell key={f.key} className="text-center px-2">
          {isDev || (features || []).includes(f.key) ? (
            <CheckCircle className="h-4 w-4 text-emerald-400 mx-auto" />
          ) : (
            <span className="text-muted-foreground/30">—</span>
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}
