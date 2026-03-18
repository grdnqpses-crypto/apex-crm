import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, DollarSign, TrendingUp, Plus, Shield, Crown, Search, BarChart3 } from "lucide-react";
import { toast } from "sonner";

// ─── New 5-Tier Structure ───────────────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  trial:              "bg-gray-500/10 text-gray-400 border-gray-500/20",
  success_starter:    "bg-sky-500/10 text-sky-400 border-sky-500/20",
  growth_foundation:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  fortune_foundation: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  fortune:            "bg-purple-500/10 text-purple-400 border-purple-500/20",
  fortune_plus:       "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const TIER_LABELS: Record<string, string> = {
  trial:              "Trial",
  success_starter:    "Success Starter",
  growth_foundation:  "Growth Foundation",
  fortune_foundation: "Fortune Foundation",
  fortune:            "Fortune",
  fortune_plus:       "Fortune Plus",
};

const TIER_PRICES: Record<string, number> = {
  trial:              0,
  success_starter:    74,
  growth_foundation:  149,
  fortune_foundation: 374,
  fortune:            524,
  fortune_plus:       1124,
};

const TIER_MAX_USERS: Record<string, number> = {
  trial:              5,
  success_starter:    5,
  growth_foundation:  15,
  fortune_foundation: 25,
  fortune:            40,
  fortune_plus:       50,
};

const STATUS_COLORS: Record<string, string> = {
  active:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  suspended: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  expired:   "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const ALL_TIERS = ["trial", "success_starter", "growth_foundation", "fortune_foundation", "fortune", "fortune_plus"] as const;

export default function ApexDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState("overview");

  const [newCompany, setNewCompany] = useState({
    name: "", slug: "", industry: "", website: "", contactEmail: "", phone: "", address: "",
    maxUsers: 5, subscriptionTier: "success_starter" as const,
  });

  const companiesQuery = trpc.tenants.list.useQuery();
  const createMutation = trpc.tenants.create.useMutation({
    onSuccess: () => {
      toast.success("Company Created", { description: "New company account has been provisioned." });
      setShowCreateDialog(false);
      setNewCompany({ name: "", slug: "", industry: "", website: "", contactEmail: "", phone: "", address: "", maxUsers: 5, subscriptionTier: "success_starter" });
      companiesQuery.refetch();
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });
  const updateMutation = trpc.tenants.update.useMutation({
    onSuccess: () => {
      toast.success("Company Updated", { description: "Company settings have been saved." });
      setShowEditDialog(false);
      setEditingCompany(null);
      companiesQuery.refetch();
    },
    onError: (err) => toast.error("Error", { description: err.message }),
  });

  const companies = companiesQuery.data ?? [];
  const filtered = companies.filter((c: any) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((c: any) => c.subscriptionStatus === "active").length;
  const totalUsers = companies.reduce((sum: number, c: any) => sum + (c.userCount || 0), 0);
  const monthlyRevenue = companies.reduce((sum: number, c: any) => {
    if (c.subscriptionStatus !== "active") return sum;
    return sum + (TIER_PRICES[c.subscriptionTier] || 0);
  }, 0);

  const tierBreakdown = ALL_TIERS.reduce((acc, tier) => {
    acc[tier] = companies.filter((c: any) => c.subscriptionTier === tier).length;
    return acc;
  }, {} as Record<string, number>);

  const handleCreate = () => {
    if (!newCompany.name || !newCompany.slug) {
      toast.error("Error", { description: "Company name and slug are required" });
      return;
    }
    createMutation.mutate(newCompany);
  };

  const handleUpdate = () => {
    if (!editingCompany) return;
    updateMutation.mutate({
      id: editingCompany.id,
      name: editingCompany.name,
      subscriptionTier: editingCompany.subscriptionTier,
      subscriptionStatus: editingCompany.subscriptionStatus,
      maxUsers: editingCompany.maxUsers,
      industry: editingCompany.industry,
      website: editingCompany.website,
      contactEmail: editingCompany.contactEmail,
      phone: editingCompany.phone,
    });
  };

  if (!user || !["developer", "apex_owner"].includes(user.systemRole)) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">This dashboard is only available to Apex Owners and Developers.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Crown className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl font-bold tracking-tight">Apex Platform Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Manage all tenant companies, subscriptions, and platform health</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Onboard Company</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Onboard New Company</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input value={newCompany.name} onChange={e => setNewCompany(p => ({ ...p, name: e.target.value }))} placeholder="Acme Corp" />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL-safe) *</Label>
                  <Input value={newCompany.slug} onChange={e => setNewCompany(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))} placeholder="acme-corp" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input value={newCompany.industry} onChange={e => setNewCompany(p => ({ ...p, industry: e.target.value }))} placeholder="Logistics" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={newCompany.website} onChange={e => setNewCompany(p => ({ ...p, website: e.target.value }))} placeholder="https://acme.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input value={newCompany.contactEmail} onChange={e => setNewCompany(p => ({ ...p, contactEmail: e.target.value }))} placeholder="admin@acme.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={newCompany.phone} onChange={e => setNewCompany(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555-0100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subscription Tier</Label>
                  <Select value={newCompany.subscriptionTier} onValueChange={v => {
                    const tier = v as typeof newCompany.subscriptionTier;
                    setNewCompany(p => ({ ...p, subscriptionTier: tier, maxUsers: TIER_MAX_USERS[tier] || 5 }));
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial ($0/mo)</SelectItem>
                      <SelectItem value="success_starter">Success Starter ($74/mo)</SelectItem>
                      <SelectItem value="growth_foundation">Growth Foundation ($149/mo)</SelectItem>
                      <SelectItem value="fortune_foundation">Fortune Foundation ($374/mo)</SelectItem>
                      <SelectItem value="fortune">Fortune ($524/mo)</SelectItem>
                      <SelectItem value="fortune_plus">Fortune Plus ($1,124/mo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Users</Label>
                  <Input type="number" value={newCompany.maxUsers} onChange={e => setNewCompany(p => ({ ...p, maxUsers: parseInt(e.target.value) || 5 }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Company"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Companies</p>
                <p className="text-3xl font-bold">{totalCompanies}</p>
                <p className="text-xs text-emerald-400 mt-1">{activeCompanies} active</p>
              </div>
              <Building2 className="w-10 h-10 text-blue-400/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">across all companies</p>
              </div>
              <Users className="w-10 h-10 text-purple-400/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-3xl font-bold">${monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-emerald-400 mt-1">recurring</p>
              </div>
              <DollarSign className="w-10 h-10 text-emerald-400/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Annual Run Rate</p>
                <p className="text-3xl font-bold">${(monthlyRevenue * 12).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">projected ARR</p>
              </div>
              <TrendingUp className="w-10 h-10 text-amber-400/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Breakdown */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Subscription Tier Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {ALL_TIERS.map(tier => (
              <div key={tier} className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
                <Badge className={`${TIER_COLORS[tier]} mb-2 text-xs`}>{TIER_LABELS[tier]}</Badge>
                <p className="text-2xl font-bold">{tierBreakdown[tier] || 0}</p>
                <p className="text-xs text-muted-foreground">${TIER_PRICES[tier]}/mo</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ${((tierBreakdown[tier] || 0) * TIER_PRICES[tier]).toLocaleString()} total
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Company Management Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="overview">All Companies</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="trial">Trials</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search companies..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
        </div>
        <TabsContent value="overview">
          <CompanyTable companies={filtered} onEdit={(c: any) => { setEditingCompany({ ...c }); setShowEditDialog(true); }} tierColors={TIER_COLORS} tierLabels={TIER_LABELS} tierPrices={TIER_PRICES} statusColors={STATUS_COLORS} />
        </TabsContent>
        <TabsContent value="active">
          <CompanyTable companies={filtered.filter((c: any) => c.subscriptionStatus === "active")} onEdit={(c: any) => { setEditingCompany({ ...c }); setShowEditDialog(true); }} tierColors={TIER_COLORS} tierLabels={TIER_LABELS} tierPrices={TIER_PRICES} statusColors={STATUS_COLORS} />
        </TabsContent>
        <TabsContent value="trial">
          <CompanyTable companies={filtered.filter((c: any) => c.subscriptionTier === "trial")} onEdit={(c: any) => { setEditingCompany({ ...c }); setShowEditDialog(true); }} tierColors={TIER_COLORS} tierLabels={TIER_LABELS} tierPrices={TIER_PRICES} statusColors={STATUS_COLORS} />
        </TabsContent>
        <TabsContent value="issues">
          <CompanyTable companies={filtered.filter((c: any) => c.subscriptionStatus !== "active")} onEdit={(c: any) => { setEditingCompany({ ...c }); setShowEditDialog(true); }} tierColors={TIER_COLORS} tierLabels={TIER_LABELS} tierPrices={TIER_PRICES} statusColors={STATUS_COLORS} />
        </TabsContent>
      </Tabs>

      {/* Edit Company Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Manage Company — {editingCompany?.name}</DialogTitle></DialogHeader>
          {editingCompany && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={editingCompany.name} onChange={e => setEditingCompany((p: any) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Subscription Tier</Label>
                  <Select value={editingCompany.subscriptionTier} onValueChange={v => setEditingCompany((p: any) => ({ ...p, subscriptionTier: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial ($0/mo)</SelectItem>
                      <SelectItem value="success_starter">Success Starter ($74/mo)</SelectItem>
                      <SelectItem value="growth_foundation">Growth Foundation ($149/mo)</SelectItem>
                      <SelectItem value="fortune_foundation">Fortune Foundation ($374/mo)</SelectItem>
                      <SelectItem value="fortune">Fortune ($524/mo)</SelectItem>
                      <SelectItem value="fortune_plus">Fortune Plus ($1,124/mo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editingCompany.subscriptionStatus} onValueChange={v => setEditingCompany((p: any) => ({ ...p, subscriptionStatus: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Users</Label>
                  <Input type="number" value={editingCompany.maxUsers} onChange={e => setEditingCompany((p: any) => ({ ...p, maxUsers: parseInt(e.target.value) || 5 }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input value={editingCompany.industry || ""} onChange={e => setEditingCompany((p: any) => ({ ...p, industry: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input value={editingCompany.contactEmail || ""} onChange={e => setEditingCompany((p: any) => ({ ...p, contactEmail: e.target.value }))} />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Users</span>
                  <span className="font-medium">{editingCompany.userCount} / {editingCompany.maxUsers}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Monthly Revenue</span>
                  <span className="font-medium text-emerald-400">${TIER_PRICES[editingCompany.subscriptionTier]?.toLocaleString()}/mo</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompanyTable({ companies, onEdit, tierColors, tierLabels, tierPrices, statusColors }: {
  companies: any[];
  onEdit: (c: any) => void;
  tierColors: Record<string, string>;
  tierLabels: Record<string, string>;
  tierPrices: Record<string, number>;
  statusColors: Record<string, string>;
}) {
  if (companies.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">No companies found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Company</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tier</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Users</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Revenue</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company: any) => (
                <tr key={company.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.slug} {company.industry ? `· ${company.industry}` : ""}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge className={tierColors[company.subscriptionTier] || ""}>
                      {tierLabels[company.subscriptionTier] || company.subscriptionTier}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge className={statusColors[company.subscriptionStatus] || ""}>
                      {company.subscriptionStatus}
                    </Badge>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-medium">{company.userCount || 0}</span>
                    <span className="text-muted-foreground">/{company.maxUsers}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-medium text-emerald-400">
                      ${(company.subscriptionStatus === "active" ? tierPrices[company.subscriptionTier] || 0 : 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(company)}>
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
