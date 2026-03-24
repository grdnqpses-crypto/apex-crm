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
import { Users, UserPlus, Shield, ShieldCheck, UserCog, User, Mail, Settings, ToggleLeft, ToggleRight, CheckCircle, KeyRound, Eye, EyeOff, Copy, LogIn } from "lucide-react";
import PageGuide from "@/components/PageGuide";
import { useSkin } from "@/contexts/SkinContext";

// Sub-component: shows masked password with reveal/copy for axiom-level admins
function PasswordCell({ userId, username, loginMethod }: { userId: number; username?: string | null; loginMethod?: string | null }) {
  const [revealed, setRevealed] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPw, setNewPw] = useState("");
  const utils = trpc.useUtils();
  const { data, isFetching, refetch } = trpc.userManagement.getPassword.useQuery(
    { userId },
    { enabled: revealed }
  );
  const resetMutation = trpc.userManagement.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Password updated");
      setResetting(false);
      setNewPw("");
      refetch();
      utils.tenants.users.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  // Only Google/OAuth SSO users have no password — email and credentials users always have one
  const isOAuth = loginMethod === "google" || loginMethod === "oauth";
  if (isOAuth) return <span className="text-xs text-muted-foreground italic">OAuth Login</span>;
  // Inline reset form
  if (resetting) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          className="text-xs bg-muted px-1.5 py-0.5 rounded border border-border w-24"
          placeholder="New password"
          value={newPw}
          onChange={e => setNewPw(e.target.value)}
          autoFocus
        />
        <button type="button" className="text-xs text-primary hover:underline" disabled={resetMutation.isPending}
          onClick={() => { if (newPw.length >= 8) resetMutation.mutate({ userId, newPassword: newPw }); else toast.error("Min 8 characters"); }}>
          {resetMutation.isPending ? "..." : "Save"}
        </button>
        <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={() => { setResetting(false); setNewPw(""); }}>Cancel</button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      {revealed && !isFetching && !data?.password ? (
        <span className="text-xs text-amber-400 italic">Not set</span>
      ) : (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded min-w-[80px]">
          {revealed ? (isFetching ? "..." : (data?.password ?? "—")) : "••••••••"}
        </code>
      )}
      <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setRevealed(r => !r)} title={revealed ? "Hide" : "Reveal"}>
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      {revealed && data?.password && (
        <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => { navigator.clipboard.writeText(data!.password!); toast.success("Password copied"); }} title="Copy">
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
      <button type="button" className="text-amber-400 hover:text-amber-300" onClick={() => { setResetting(true); setRevealed(false); }} title="Set / Reset password">
        <KeyRound className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// Sub-component: Emulate button that swaps session to target user
function EmulateButton({ userId, userName }: { userId: number; userName?: string | null }) {
  const emulateMutation = trpc.tenants.emulate.useMutation({
    onSuccess: (data) => {
      // Store original session info so user can exit emulation
      sessionStorage.setItem("emulation_active", "true");
      sessionStorage.setItem("emulation_target", data.name || data.username || String(data.userId));
      toast.success(`Entering session as ${data.name || data.username}...`);
      setTimeout(() => { window.location.href = "/"; }, 800);
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-xs text-amber-400 hover:text-amber-300"
      onClick={() => emulateMutation.mutate({ userId })}
      disabled={emulateMutation.isPending}
      title={`Emulate ${userName || "user"}`}
    >
      <LogIn className="h-3 w-3 mr-1" />Emulate
    </Button>
  );
}

const roleColors: Record<string, string> = {
  developer:      "bg-red-500/10 text-red-400 border-red-500/20",
  axiom_admin:    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  axiom_owner:    "bg-orange-500/10 text-orange-400 border-orange-500/20",  // legacy
  apex_owner:     "bg-orange-500/10 text-orange-400 border-orange-500/20",  // legacy
  company_admin:  "bg-purple-500/10 text-purple-400 border-purple-500/20",
  sales_manager:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  office_manager: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  manager:        "bg-blue-500/10 text-blue-400 border-blue-500/20",
  account_manager:"bg-green-500/10 text-green-400 border-green-500/20",
  coordinator:    "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  sales_rep:      "bg-green-500/10 text-green-400 border-green-500/20",
  user:           "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const roleLabels: Record<string, string> = {
  developer:      "Developer",
  axiom_admin:    "Axiom Admin",
  axiom_owner:    "Axiom Admin",   // legacy → display as Axiom Admin
  apex_owner:     "Axiom Admin",   // legacy
  company_admin:  "Company Admin",
  sales_manager:  "Sales Manager",
  office_manager: "Office Manager",
  manager:        "Sales Manager",
  account_manager:"Account Manager",
  coordinator:    "Coordinator",
  sales_rep:      "Account Manager",
  user:           "Account Manager",
};

const roleIcons: Record<string, any> = {
  developer:      Shield,
  axiom_admin:    Shield,
  axiom_owner:    Shield,
  apex_owner:     Shield,
  company_admin:  ShieldCheck,
  sales_manager:  UserCog,
  office_manager: UserCog,
  manager:        UserCog,
  account_manager:User,
  coordinator:    User,
  sales_rep:      User,
  user:           User,
};

export default function CompanyAdmin() {
  const { t } = useSkin();
  const { user } = useAuth();
  const companyId = user?.tenantCompanyId;
  // isAdmin: company_admin and above can manage users within their company
  const isAdmin = ["developer", "axiom_admin", "axiom_owner", "apex_owner", "company_admin"].includes(user?.systemRole || "");
  // isAxiomLevel: developer and axiom_admin can see/assign axiom_admin role
  const isAxiomLevel = ["developer", "axiom_admin"].includes(user?.systemRole || "");
  const isManager = ["manager", "sales_manager", "office_manager"].includes(user?.systemRole || "");

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

  // Create User state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "", password: "", name: "", email: "", systemRole: "account_manager" as "axiom_admin" | "company_admin" | "sales_manager" | "office_manager" | "account_manager" | "coordinator",
    jobTitle: "", phone: "",
  });
  const [createUserErrors, setCreateUserErrors] = useState<Record<string, string>>({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newUserFeatures, setNewUserFeatures] = useState<string[]>([]);

  // Auto-derive username from email prefix
  function handleEmailChange(email: string) {
    const prefix = email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, ".").toLowerCase();
    setNewUser(p => ({
      ...p,
      email,
      username: p.username === "" || p.username === (p.email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, ".").toLowerCase()) ? prefix : p.username,
    }));
    setCreateUserErrors(prev => ({ ...prev, email: "", username: "" }));
  }

  function validateCreateUser() {
    const errors: Record<string, string> = {};
    if (!newUser.name.trim()) errors.name = "Full name is required";
    if (!newUser.email.trim()) errors.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newUser.email)) errors.email = "Enter a valid email address";
    if (!newUser.username.trim()) errors.username = "Username is required";
    else if (newUser.username.length < 3) errors.username = "Username must be at least 3 characters";
    else if (!/^[a-zA-Z0-9._-]+$/.test(newUser.username)) errors.username = "Only letters, numbers, dots, hyphens, underscores allowed";
    if (!newUser.password) errors.password = "Password is required";
    else if (newUser.password.length < 8) errors.password = "Password must be at least 8 characters";
    setCreateUserErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"axiom_admin" | "company_admin" | "sales_manager" | "office_manager" | "account_manager" | "coordinator">("account_manager");
  const [inviteCustomRoleId, setInviteCustomRoleId] = useState<number | undefined>(undefined);
  const { data: customRoles } = trpc.customRoles.list.useQuery(undefined, { enabled: isAdmin });

  // Feature editor state
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [featureUserId, setFeatureUserId] = useState<number | null>(null);

  // Reset password state
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  const createUserMutation = trpc.userManagement.createUser.useMutation({
    onSuccess: (data) => {
      utils.tenants.users.invalidate();
      setShowCreateUser(false);
      setNewUser({ username: "", password: "", name: "", email: "", systemRole: "account_manager", jobTitle: "", phone: "" });
      setNewUserFeatures([]);
      setCreateUserErrors({});
      toast.success("User created", { description: `Username: ${data.username}` });
    },
    onError: (e) => {
      // Surface specific field errors from backend
      const msg = e.message;
      if (msg.toLowerCase().includes("username")) {
        setCreateUserErrors(prev => ({ ...prev, username: msg }));
      } else if (msg.toLowerCase().includes("email")) {
        setCreateUserErrors(prev => ({ ...prev, email: msg }));
      } else if (msg.toLowerCase().includes("password")) {
        setCreateUserErrors(prev => ({ ...prev, password: msg }));
      } else {
        toast.error(msg);
      }
    },
  });

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

  const resetPasswordMutation = trpc.userManagement.resetPassword.useMutation({
    onSuccess: () => { setResetUserId(null); setResetPassword(""); toast.success("Password reset successfully"); },
    onError: (e) => toast.error(e.message),
  });

  // Load user features when editing
  const { data: editingFeatures } = trpc.userManagement.getFeatures.useQuery(
    { userId: featureUserId! },
    { enabled: !!featureUserId }
  );

  const featureGroups = useMemo(() => {
    if (!allFeatures) return {};
    const groups: Record<string, any[]> = {};
    allFeatures.forEach((f: any) => {
      if (!groups[f.group]) groups[f.group] = [];
      (groups[f.group] as any[]).push(f);
    });
    return groups;
  }, [allFeatures]);

  const managers = useMemo(() => {
    if (!companyUsers) return [];
    return companyUsers.filter((u: any) => ["manager", "sales_manager", "office_manager"].includes(u.systemRole));
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
        { title: "Create Users", content: "Create users with username and password. They can log in at /login with their credentials.", icon: "actions" },
      ]} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{companyUsers?.length || 0} team members</p>
        </div>
        {(isAdmin || isManager) && (
          <div className="flex gap-2">
            <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
              <DialogTrigger asChild>
                <Button><UserPlus className="h-4 w-4 mr-2" />Create User</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <p className="text-sm text-muted-foreground">Create a user with username and password login</p>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label>Full Name *</Label>
                      <Input
                        value={newUser.name}
                        onChange={e => { setNewUser(p => ({ ...p, name: e.target.value })); setCreateUserErrors(prev => ({ ...prev, name: "" })); }}
                        placeholder="John Smith"
                        className={createUserErrors.name ? "border-destructive" : ""}
                      />
                      {createUserErrors.name && <p className="text-xs text-destructive mt-1">{createUserErrors.name}</p>}
                    </div>
                    <div className="col-span-2">
                      <Label>Email Address * <span className="text-xs text-muted-foreground">(username auto-filled from email)</span></Label>
                      <Input
                        type="email"
                        value={newUser.email}
                        onChange={e => handleEmailChange(e.target.value)}
                        placeholder="john@company.com"
                        className={createUserErrors.email ? "border-destructive" : ""}
                      />
                      {createUserErrors.email && <p className="text-xs text-destructive mt-1">{createUserErrors.email}</p>}
                    </div>
                    <div>
                      <Label>Username *</Label>
                      <Input
                        value={newUser.username}
                        onChange={e => { setNewUser(p => ({ ...p, username: e.target.value })); setCreateUserErrors(prev => ({ ...prev, username: "" })); }}
                        placeholder="john.smith"
                        className={createUserErrors.username ? "border-destructive" : ""}
                      />
                      {createUserErrors.username && <p className="text-xs text-destructive mt-1">{createUserErrors.username}</p>}
                    </div>
                    <div>
                      <Label>Password *</Label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          value={newUser.password}
                          onChange={e => { setNewUser(p => ({ ...p, password: e.target.value })); setCreateUserErrors(prev => ({ ...prev, password: "" })); }}
                          placeholder="Min 8 characters"
                          className={`pr-9 ${createUserErrors.password ? "border-destructive" : ""}`}
                        />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {createUserErrors.password && <p className="text-xs text-destructive mt-1">{createUserErrors.password}</p>}
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Select value={newUser.systemRole} onValueChange={(v: any) => setNewUser(p => ({ ...p, systemRole: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {isAxiomLevel && <SelectItem value="axiom_admin">Axiom Admin</SelectItem>}
                          {isAdmin && <SelectItem value="company_admin">Company Admin</SelectItem>}
                          {isAdmin && <SelectItem value="sales_manager">Sales Manager</SelectItem>}
                          {isAdmin && <SelectItem value="office_manager">Office Manager</SelectItem>}
                          {(isAdmin || user?.systemRole === "sales_manager" || user?.systemRole === "manager") && <SelectItem value="account_manager">Account Manager</SelectItem>}
                          {(isAdmin || user?.systemRole === "office_manager") && <SelectItem value="coordinator">Coordinator</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Job Title</Label>
                      <Input value={newUser.jobTitle} onChange={e => setNewUser(p => ({ ...p, jobTitle: e.target.value }))} placeholder="Account Manager" />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={newUser.phone} onChange={e => setNewUser(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555-0123" />
                    </div>
                  </div>

                  {/* Feature selection */}
                  <div>
                    <Label className="mb-2 block">Feature Access</Label>
                    <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-3">
                      {Object.entries(featureGroups).map(([group, features]) => (
                        <div key={group}>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">{group}</p>
                          <div className="grid grid-cols-2 gap-1">
                            {(features as any[]).map((f: any) => (
                              <label key={f.key} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                <Checkbox
                                  checked={newUserFeatures.includes(f.key)}
                                  onCheckedChange={(c) => {
                                    if (c) setNewUserFeatures(prev => [...prev, f.key]);
                                    else setNewUserFeatures(prev => prev.filter(k => k !== f.key));
                                  }}
                                />
                                {f.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setNewUserFeatures((allFeatures || []).map((f: any) => f.key))}>Select All</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setNewUserFeatures([])}>Clear</Button>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      if (!validateCreateUser()) return;
                      createUserMutation.mutate({
                        username: newUser.username,
                        password: newUser.password,
                        name: newUser.name,
                        email: newUser.email || undefined,
                        systemRole: newUser.systemRole,
                        tenantCompanyId: companyId!,
                        jobTitle: newUser.jobTitle || undefined,
                        phone: newUser.phone || undefined,
                        features: newUserFeatures.length > 0 ? newUserFeatures : undefined,
                      });
                    }}
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showInvite} onOpenChange={setShowInvite}>
              <DialogTrigger asChild>
                <Button variant="outline"><Mail className="h-4 w-4 mr-2" />Invite via Email</Button>
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
                        {isAxiomLevel && <SelectItem value="axiom_admin">Axiom Admin</SelectItem>}
                        {isAdmin && <SelectItem value="company_admin">Company Admin</SelectItem>}
                        {isAdmin && <SelectItem value="sales_manager">Sales Manager</SelectItem>}
                        {isAdmin && <SelectItem value="office_manager">Office Manager</SelectItem>}
                        {(isAdmin || user?.systemRole === "sales_manager" || user?.systemRole === "manager") && <SelectItem value="account_manager">Account Manager</SelectItem>}
                        {(isAdmin || user?.systemRole === "office_manager") && <SelectItem value="coordinator">Coordinator</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  {customRoles && customRoles.length > 0 && (
                    <div>
                      <Label>Custom Role <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                      <Select value={inviteCustomRoleId?.toString() ?? "none"} onValueChange={(v) => setInviteCustomRoleId(v === "none" ? undefined : Number(v))}>
                        <SelectTrigger><SelectValue placeholder="No custom role" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No custom role</SelectItem>
                          {(customRoles as any[]).map((r) => (
                            <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">Custom roles grant additional permissions on top of the base role.</p>
                    </div>
                  )}
                  <Button className="w-full" onClick={() => createInviteMutation.mutate({ companyId: companyId!, email: inviteEmail, role: inviteRole })} disabled={!inviteEmail || createInviteMutation.isPending}>
                    {createInviteMutation.isPending ? "Sending..." : "Send Invite"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Status</TableHead>
                    {isAxiomLevel && <TableHead>Password</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={isAxiomLevel ? 7 : 6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
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
                          {u.username ? (
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{u.username}</code>
                          ) : (
                            <span className="text-xs text-muted-foreground">OAuth</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <Select value={u.systemRole || "account_manager"} onValueChange={(v: any) => setRoleMutation.mutate({ userId: u.id, systemRole: v })}>
                              <SelectTrigger className="w-[160px] h-8">
                                <div className="flex items-center gap-1.5"><RoleIcon className="h-3.5 w-3.5" /><SelectValue /></div>
                              </SelectTrigger>
                              <SelectContent>
                                {isAxiomLevel && <SelectItem value="axiom_admin">Axiom Admin</SelectItem>}
                                <SelectItem value="company_admin">Company Admin</SelectItem>
                                <SelectItem value="sales_manager">Sales Manager</SelectItem>
                                <SelectItem value="office_manager">Office Manager</SelectItem>
                                <SelectItem value="account_manager">Account Manager</SelectItem>
                                <SelectItem value="coordinator">Coordinator</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline" className={roleColors[u.systemRole || "account_manager"]}>
                              <RoleIcon className="h-3 w-3 mr-1" />{roleLabels[u.systemRole] || u.systemRole}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{manager?.name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={u.isActive !== false ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}>
                            {u.isActive !== false ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        {isAxiomLevel && (
                          <TableCell>
                            <PasswordCell userId={u.id} username={u.username} loginMethod={u.loginMethod} />
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(isAdmin || isManager) && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setFeatureUserId(u.id); setSelectedFeatures([]); }}>
                                <Settings className="h-3 w-3 mr-1" />Features
                              </Button>
                            )}
                            {isAdmin && u.username && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setResetUserId(u.id); setResetPassword(""); }}>
                                <KeyRound className="h-3 w-3 mr-1" />Reset PW
                              </Button>
                            )}
                            {isAxiomLevel && u.loginMethod === "credentials" && (
                              <EmulateButton userId={u.id} userName={u.name} />
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

      {/* Reset Password Dialog */}
      <Dialog open={!!resetUserId} onOpenChange={(open) => !open && setResetUserId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset User Password</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showResetPassword ? "text" : "password"}
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="pr-9"
                />
                <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => resetUserId && resetPasswordMutation.mutate({ userId: resetUserId, newPassword: resetPassword })}
              disabled={resetPassword.length < 8 || resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
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
  // Developer and Axiom Admin have full feature access by default
  const isDev = ["developer", "axiom_admin", "axiom_owner", "apex_owner"].includes(u.systemRole);

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
