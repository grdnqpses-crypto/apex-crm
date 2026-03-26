import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ShieldPlus, Trash2, Plus, Lock, Eye, Edit3, Zap } from "lucide-react";
import { toast } from "sonner";

const PERMISSION_GROUPS = [
  {
    group: "Contacts & Companies",
    permissions: [
      { key: "contacts.view", label: "View Contacts" },
      { key: "contacts.create", label: "Create Contacts" },
      { key: "contacts.edit", label: "Edit Contacts" },
      { key: "contacts.delete", label: "Delete Contacts" },
      { key: "companies.view", label: "View Companies" },
      { key: "companies.manage", label: "Manage Companies" },
    ],
  },
  {
    group: "Deals & Pipeline",
    permissions: [
      { key: "deals.view", label: "View Deals" },
      { key: "deals.create", label: "Create Deals" },
      { key: "deals.edit", label: "Edit Deals" },
      { key: "deals.delete", label: "Delete Deals" },
      { key: "pipeline.manage", label: "Manage Pipelines" },
    ],
  },
  {
    group: "Email & Campaigns",
    permissions: [
      { key: "email.send", label: "Send Emails" },
      { key: "campaigns.view", label: "View Campaigns" },
      { key: "campaigns.manage", label: "Manage Campaigns" },
      { key: "sequences.manage", label: "Manage Sequences" },
    ],
  },
  {
    group: "Reports & Analytics",
    permissions: [
      { key: "reports.view", label: "View Reports" },
      { key: "reports.create", label: "Create Reports" },
      { key: "analytics.view", label: "View Analytics" },
    ],
  },
  {
    group: "Admin",
    permissions: [
      { key: "users.manage", label: "Manage Users" },
      { key: "settings.manage", label: "Manage Settings" },
      { key: "billing.view", label: "View Billing" },
      { key: "integrations.manage", label: "Manage Integrations" },
    ],
  },
];

export default function CustomRoleBuilder() {
  const { data: roles, isLoading } = trpc.customRoles.list.useQuery();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [editRole, setEditRole] = useState<{ id?: number; name: string; description: string; permissions: string[] } | null>(null);

  const create = trpc.customRoles.create.useMutation({
    onSuccess: () => {
      toast.success("Role created");
      utils.customRoles.list.invalidate();
      setOpen(false);
      setEditRole(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.customRoles.update.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      utils.customRoles.list.invalidate();
      setOpen(false);
      setEditRole(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = trpc.customRoles.delete.useMutation({
    onSuccess: () => {
      toast.success("Role deleted");
      utils.customRoles.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditRole({ name: "", description: "", permissions: [] });
    setOpen(true);
  };

  const openEdit = (role: { id: number; name: string; description?: string | null; permissions: unknown }) => {
    setEditRole({
      id: role.id,
      name: role.name,
      description: role.description ?? "",
      permissions: Array.isArray(role.permissions) ? (role.permissions as string[]) : [],
    });
    setOpen(true);
  };

  const togglePermission = (key: string) => {
    if (!editRole) return;
    const has = editRole.permissions.includes(key);
    setEditRole((r) => r ? ({
      ...r,
      permissions: has ? r.permissions.filter((p) => p !== key) : [...r.permissions, key],
    }) : r);
  };

  const handleSave = () => {
    if (!editRole?.name.trim()) return toast.error("Role name is required");
    if (editRole.id) {
      update.mutate({ id: editRole.id, name: editRole.name, description: editRole.description, permissions: editRole.permissions });
    } else {
      create.mutate({ name: editRole.name, baseRole: "user" as "user" | "admin", description: editRole.description, permissions: editRole.permissions });
    }
  };

  return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShieldPlus className="w-6 h-6 text-blue-500" />
              Custom Role Builder
            </h1>
            <p className="text-muted-foreground mt-1">Create granular permission roles for your team members</p>
          </div>
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Role
          </Button>
        </div>

        {/* Built-in roles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Built-in Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {[
              { name: "Admin", desc: "Full access to all features and settings", icon: Lock, color: "text-red-500" },
              { name: "User", desc: "Standard CRM access — contacts, deals, tasks", icon: Eye, color: "text-blue-500" },
              { name: "Manager", desc: "Team visibility, reports, and pipeline management", icon: Edit3, color: "text-purple-500" },
              { name: "Developer", desc: "Full system access including dev tools and API", icon: Zap, color: "text-amber-500" },
            ].map((r) => (
              <div key={r.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <r.icon className={`w-4 h-4 ${r.color}`} />
                  <div>
                    <p className="font-medium text-sm">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">System</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Custom roles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Custom Roles</CardTitle>
            <CardDescription>Roles you've created with specific permission sets</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-14 bg-muted/30 rounded-xl animate-pulse" />)}
              </div>
            ) : !roles?.length ? (
              <div className="text-center py-10">
                <ShieldPlus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No custom roles yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {roles.map((role) => {
                  const perms = Array.isArray(role.permissions) ? (role.permissions as string[]) : [];
                  return (
                    <div key={role.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <ShieldPlus className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{role.name}</p>
                          <p className="text-xs text-muted-foreground">{perms.length} permission{perms.length !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(role)}>
                          <Edit3 className="w-3.5 h-3.5 mr-1" />Edit
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => remove.mutate({ id: role.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editRole?.id ? "Edit Role" : "Create Custom Role"}</DialogTitle>
            </DialogHeader>
            {editRole && (
              <div className="space-y-5 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role Name</Label>
                    <Input
                      placeholder="e.g. Sales Rep"
                      value={editRole.name}
                      onChange={(e) => setEditRole((r) => r ? ({ ...r, name: e.target.value }) : r)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Brief description of this role"
                      value={editRole.description}
                      onChange={(e) => setEditRole((r) => r ? ({ ...r, description: e.target.value }) : r)}
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-5">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.group}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{group.group}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {group.permissions.map((perm) => (
                          <div key={perm.key} className="flex items-center justify-between p-2 rounded-lg border">
                            <span className="text-sm">{perm.label}</span>
                            <Switch
                              checked={editRole.permissions.includes(perm.key)}
                              onCheckedChange={() => togglePermission(perm.key)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Badge variant="secondary">{editRole.permissions.length} permissions selected</Badge>
                  <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="bg-blue-600 hover:bg-blue-700">
                    {create.isPending || update.isPending ? "Saving..." : editRole.id ? "Update Role" : "Create Role"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}
