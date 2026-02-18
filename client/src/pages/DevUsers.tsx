import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Shield, ShieldCheck, UserCog, User, Building2, ToggleLeft, ToggleRight, Eye } from "lucide-react";
import PageGuide from "@/components/PageGuide";

const roleIcons: Record<string, any> = {
  developer: Shield,
  company_admin: ShieldCheck,
  manager: UserCog,
  user: User,
};

const roleColors: Record<string, string> = {
  developer: "bg-red-500/10 text-red-400 border-red-500/20",
  company_admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  manager: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  user: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function DevUsers() {
  const { data: allUsers, isLoading } = trpc.userManagement.allUsers.useQuery();
  const { data: companies } = trpc.tenants.list.useQuery();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [viewUser, setViewUser] = useState<any>(null);
  const [assignCompany, setAssignCompany] = useState<any>(null);

  const setRoleMutation = trpc.userManagement.setRole.useMutation({
    onSuccess: () => { utils.userManagement.allUsers.invalidate(); toast.success("Role updated"); },
    onError: (e) => toast.error(e.message),
  });

  const assignCompanyMutation = trpc.userManagement.assignToCompany.useMutation({
    onSuccess: () => { utils.userManagement.allUsers.invalidate(); setAssignCompany(null); toast.success("Company assigned"); },
    onError: (e) => toast.error(e.message),
  });

  const deactivateMutation = trpc.userManagement.deactivate.useMutation({
    onSuccess: () => { utils.userManagement.allUsers.invalidate(); toast.success("User deactivated"); },
    onError: (e) => toast.error(e.message),
  });

  const activateMutation = trpc.userManagement.activate.useMutation({
    onSuccess: () => { utils.userManagement.allUsers.invalidate(); toast.success("User activated"); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!allUsers) return [];
    if (!search) return allUsers;
    const s = search.toLowerCase();
    return allUsers.filter((u: any) =>
      (u.user.name || "").toLowerCase().includes(s) ||
      (u.user.email || "").toLowerCase().includes(s) ||
      (u.companyName || "").toLowerCase().includes(s)
    );
  }, [allUsers, search]);

  const roleCounts = useMemo(() => {
    if (!allUsers) return { developer: 0, company_admin: 0, manager: 0, user: 0 };
    const counts: Record<string, number> = { developer: 0, company_admin: 0, manager: 0, user: 0 };
    allUsers.forEach((u: any) => { counts[u.user.systemRole || "user"] = (counts[u.user.systemRole || "user"] || 0) + 1; });
    return counts;
  }, [allUsers]);

  return (
    <div className="space-y-6">
      <PageGuide title="Global User Management" description="Manage all users across all companies" sections={[
        { title: "Hierarchy", content: "Developer (God) → Company Admin → Manager → User. Each level can manage the levels below it.", icon: "purpose" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Global User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{allUsers?.length || 0} total users across {companies?.length || 0} companies</p>
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(roleCounts).map(([role, count]) => {
          const Icon = roleIcons[role] || User;
          return (
            <Card key={role}>
              <CardContent className="py-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${roleColors[role]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{role.replace("_", " ")}s</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search users by name, email, or company..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading users...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
              ) : (
                filtered.map((item: any) => {
                  const u = item.user;
                  const RoleIcon = roleIcons[u.systemRole || "user"] || User;
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                            {(u.name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{u.name || "Unnamed"}</p>
                            <p className="text-xs text-muted-foreground">{u.email || "No email"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={u.systemRole || "user"} onValueChange={(v: any) => setRoleMutation.mutate({ userId: u.id, systemRole: v })}>
                          <SelectTrigger className="w-[140px] h-8">
                            <div className="flex items-center gap-1.5">
                              <RoleIcon className="h-3.5 w-3.5" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="developer">Developer</SelectItem>
                            <SelectItem value="company_admin">Company Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {item.companyName ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{item.companyName}</span>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setAssignCompany(u)}>
                            Assign Company
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={u.isActive !== false ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}>
                          {u.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewUser(item)} title="View details">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {u.isActive !== false ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deactivateMutation.mutate({ userId: u.id })} title="Deactivate">
                              <ToggleRight className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-400" onClick={() => activateMutation.mutate({ userId: u.id })} title="Activate">
                              <ToggleLeft className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold">
                  {(viewUser.user.name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{viewUser.user.name || "Unnamed"}</h3>
                  <p className="text-sm text-muted-foreground">{viewUser.user.email}</p>
                  <Badge variant="outline" className={roleColors[viewUser.user.systemRole || "user"]}>{(viewUser.user.systemRole || "user").replace("_", " ")}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Company:</span> <span className="font-medium">{viewUser.companyName || "None"}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{viewUser.user.isActive !== false ? "Active" : "Inactive"}</span></div>
                <div><span className="text-muted-foreground">Job Title:</span> <span className="font-medium">{viewUser.user.jobTitle || "N/A"}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{viewUser.user.phone || "N/A"}</span></div>
                <div><span className="text-muted-foreground">Login Method:</span> <span className="font-medium">{viewUser.user.loginMethod || "N/A"}</span></div>
                <div><span className="text-muted-foreground">Last Login:</span> <span className="font-medium">{viewUser.user.lastSignedIn ? new Date(viewUser.user.lastSignedIn).toLocaleString() : "Never"}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Company Dialog */}
      <Dialog open={!!assignCompany} onOpenChange={(open) => !open && setAssignCompany(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign to Company</DialogTitle></DialogHeader>
          {assignCompany && companies && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Assign <strong>{assignCompany.name}</strong> to a company:</p>
              <div className="space-y-2">
                {companies.map((c: any) => (
                  <Button key={c.id} variant="outline" className="w-full justify-start gap-3" onClick={() => assignCompanyMutation.mutate({ userId: assignCompany.id, companyId: c.id })}>
                    <Building2 className="h-4 w-4" />
                    <span>{c.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{c.userCount}/{c.maxUsers} users</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
