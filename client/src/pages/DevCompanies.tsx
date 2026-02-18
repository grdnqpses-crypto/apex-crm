import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Users, Globe, Mail, Phone, Trash2, Edit, Search } from "lucide-react";
import PageGuide from "@/components/PageGuide";

const tierColors: Record<string, string> = {
  trial: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  starter: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  professional: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  enterprise: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  suspended: "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  expired: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export default function DevCompanies() {
  const { data: companies, isLoading } = trpc.tenants.list.useQuery();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editCompany, setEditCompany] = useState<any>(null);

  // Create form state
  const [form, setForm] = useState({
    name: "", slug: "", industry: "", website: "", contactEmail: "", phone: "", address: "",
    maxUsers: 25, subscriptionTier: "trial" as const,
  });

  const createMutation = trpc.tenants.create.useMutation({
    onSuccess: () => { utils.tenants.list.invalidate(); setShowCreate(false); resetForm(); toast.success("Company created"); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.tenants.update.useMutation({
    onSuccess: () => { utils.tenants.list.invalidate(); setEditCompany(null); toast.success("Company updated"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.tenants.delete.useMutation({
    onSuccess: () => { utils.tenants.list.invalidate(); toast.success("Company deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => setForm({ name: "", slug: "", industry: "", website: "", contactEmail: "", phone: "", address: "", maxUsers: 25, subscriptionTier: "trial" });

  const filtered = useMemo(() => {
    if (!companies) return [];
    if (!search) return companies;
    const s = search.toLowerCase();
    return companies.filter((c: any) => c.name.toLowerCase().includes(s) || c.slug.toLowerCase().includes(s) || (c.industry || "").toLowerCase().includes(s));
  }, [companies, search]);

  return (
    <div className="space-y-6">
      <PageGuide title="Company Management" description="Manage all tenant companies across the platform" sections={[{ title: "Overview", content: "Create and manage tenant companies. Each company gets its own users, settings, and feature assignments.", icon: "purpose" }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Company Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage tenant companies across the platform</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Create Company</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create New Company</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Company Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Corp" /></div>
                <div><Label>Slug *</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))} placeholder="acme-corp" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Industry</Label><Input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} placeholder="Transportation" /></div>
                <div><Label>Website</Label><Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://acme.com" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Contact Email</Label><Input value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="admin@acme.com" /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555-0100" /></div>
              </div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, City, ST" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Max Users</Label><Input type="number" value={form.maxUsers} onChange={e => setForm(f => ({ ...f, maxUsers: parseInt(e.target.value) || 25 }))} /></div>
                <div>
                  <Label>Subscription Tier</Label>
                  <Select value={form.subscriptionTier} onValueChange={(v: any) => setForm(f => ({ ...f, subscriptionTier: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={() => createMutation.mutate(form)} disabled={!form.name || !form.slug || createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Company"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Card key={i} className="animate-pulse"><CardContent className="h-48" /></Card>)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No companies found. Create your first company to get started.</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company: any) => (
            <Card key={company.id} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{company.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">/{company.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditCompany(company)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Delete this company?")) deleteMutation.mutate({ id: company.id }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant="outline" className={tierColors[company.subscriptionTier] || ""}>{company.subscriptionTier}</Badge>
                  <Badge variant="outline" className={statusColors[company.subscriptionStatus] || ""}>{company.subscriptionStatus}</Badge>
                </div>
                <div className="space-y-1.5 text-sm">
                  {company.industry && <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-3.5 w-3.5" />{company.industry}</div>}
                  {company.contactEmail && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{company.contactEmail}</div>}
                  {company.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{company.phone}</div>}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-1.5 text-sm"><Users className="h-3.5 w-3.5 text-muted-foreground" /><span>{company.userCount}/{company.maxUsers} users</span></div>
                  <span className="text-xs text-muted-foreground">{company.enabledFeatures?.length || 0} features</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editCompany} onOpenChange={(open) => !open && setEditCompany(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Company</DialogTitle></DialogHeader>
          {editCompany && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Name</Label><Input defaultValue={editCompany.name} onChange={e => setEditCompany((c: any) => ({ ...c, name: e.target.value }))} /></div>
                <div><Label>Industry</Label><Input defaultValue={editCompany.industry || ""} onChange={e => setEditCompany((c: any) => ({ ...c, industry: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Subscription Tier</Label>
                  <Select defaultValue={editCompany.subscriptionTier} onValueChange={(v: any) => setEditCompany((c: any) => ({ ...c, subscriptionTier: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select defaultValue={editCompany.subscriptionStatus} onValueChange={(v: any) => setEditCompany((c: any) => ({ ...c, subscriptionStatus: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Max Users</Label><Input type="number" defaultValue={editCompany.maxUsers} onChange={e => setEditCompany((c: any) => ({ ...c, maxUsers: parseInt(e.target.value) }))} /></div>
              <Button className="w-full" onClick={() => updateMutation.mutate({ id: editCompany.id, name: editCompany.name, industry: editCompany.industry, subscriptionTier: editCompany.subscriptionTier, subscriptionStatus: editCompany.subscriptionStatus, maxUsers: editCompany.maxUsers })} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
