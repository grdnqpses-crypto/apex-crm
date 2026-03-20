/**
 * ApexAiCredits.tsx
 * Apex Owner only — manage AI credit packages and tenant balances.
 *
 * Model:
 *   - CRM AI features are FREE (included in subscription)
 *   - Non-CRM AI usage requires purchased credits at 25% markup on Manus pricing
 *   - Apex Owner defines packages and can grant credits to tenants
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
import {
  Zap,
  Package,
  Building2,
  Plus,
  Gift,
  TrendingUp,
  Info,
  DollarSign,
  Coins,
} from "lucide-react";

export default function ApexAiCredits() {
  const { t } = useSkin();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Guard: only Apex Owner
  if (user && (user as any).systemRole !== "apex_owner") {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-orange-500" />
            AI Credits Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage AI credit packages and tenant balances. CRM AI features are always free — credits
            apply only to non-CRM AI usage.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <Card className="border-orange-500/30 bg-orange-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-orange-600 dark:text-orange-400">Billing Model</p>
              <p className="text-muted-foreground">
                <strong>CRM AI features</strong> (email ghostwriting, lead scoring, psychographic
                profiling, battle cards, AI assistant for CRM data) are{" "}
                <strong>included in the subscription at no extra cost</strong>.
              </p>
              <p className="text-muted-foreground">
                <strong>Non-CRM AI usage</strong> (general AI chat, custom AI tasks, bulk
                processing) requires purchased credits at a{" "}
                <strong>25% markup on Manus pricing</strong>, billed directly to the tenant
                company's card on file.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">
            <Package className="h-4 w-4 mr-2" />
            Credit Packages
          </TabsTrigger>
          <TabsTrigger value="tenants">
            <Building2 className="h-4 w-4 mr-2" />
            Tenant Balances
          </TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="mt-4">
          <PackagesTab />
        </TabsContent>

        <TabsContent value="tenants" className="mt-4">
          <TenantsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Packages Tab ───────────────────────────────────────────────────────────

function PackagesTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", credits: "", manusBasePriceCents: "" });

  const { data: packages = [], refetch } = trpc.aiCredits.listPackages.useQuery();
  const createMutation = trpc.aiCredits.createPackage.useMutation({
    onSuccess: () => {
      toast.success("Package created", { description: "The credit package has been added." });
      setShowCreate(false);
      setForm({ name: "", description: "", credits: "", manusBasePriceCents: "" });
      refetch();
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });
  const updateMutation = trpc.aiCredits.updatePackage.useMutation({
    onSuccess: () => { toast.success("Package updated"); refetch(); },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  const handleCreate = () => {
    if (!form.name || !form.credits || !form.manusBasePriceCents) {
      toast.error("Missing fields", { description: "Please fill in all required fields." });
      return;
    }
    createMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      credits: parseInt(form.credits),
      manusBasePriceCents: Math.round(parseFloat(form.manusBasePriceCents) * 100),
    });
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Define credit packages with Manus base pricing. The 25% markup is applied automatically.
        </p>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Package
        </Button>
      </div>

      {packages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No packages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first credit package to start selling AI credits to tenant companies.
            </p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Package
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <Card key={pkg.id} className={!pkg.isActive ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{pkg.name}</CardTitle>
                  <Badge variant={pkg.isActive ? "default" : "secondary"}>
                    {pkg.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {pkg.description && (
                  <CardDescription>{pkg.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold text-lg">{pkg.credits.toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm">credits</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Manus base price</p>
                    <p className="font-medium">{formatPrice(pkg.manusBasePriceCents)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tenant pays (+25%)</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {formatPrice(pkg.finalPriceCents)}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Margin: {formatPrice(pkg.finalPriceCents - pkg.manusBasePriceCents)} per package
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      updateMutation.mutate({ id: pkg.id, isActive: !pkg.isActive })
                    }
                  >
                    {pkg.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Package Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Credit Package</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Package Name *</Label>
              <Input
                placeholder="e.g. Starter Pack, Growth Pack"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Number of Credits *</Label>
              <Input
                type="number"
                placeholder="e.g. 1000"
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: e.target.value })}
              />
            </div>
            <div>
              <Label>Manus Base Price (USD) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 10.00"
                  className="pl-9"
                  value={form.manusBasePriceCents}
                  onChange={(e) => setForm({ ...form, manusBasePriceCents: e.target.value })}
                />
              </div>
              {form.manusBasePriceCents && (
                <p className="text-xs text-muted-foreground mt-1">
                  Tenant will pay:{" "}
                  <strong className="text-green-600">
                    ${(parseFloat(form.manusBasePriceCents || "0") * 1.25).toFixed(2)}
                  </strong>{" "}
                  (25% markup applied automatically)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tenants Tab ─────────────────────────────────────────────────────────────

function TenantsTab() {
  const [grantDialog, setGrantDialog] = useState<{ tenantId: number; name: string } | null>(null);
  const [grantForm, setGrantForm] = useState({ credits: "", description: "" });
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);

  const { data: balances = [], refetch } = trpc.aiCredits.allTenantBalances.useQuery();
  const { data: transactions = [] } = trpc.aiCredits.tenantTransactions.useQuery(
    { tenantCompanyId: selectedTenant! },
    { enabled: !!selectedTenant }
  );
  const grantMutation = trpc.aiCredits.grantCredits.useMutation({
    onSuccess: () => {
      toast.success("Credits granted", { description: `${grantForm.credits} credits added successfully.` });
      setGrantDialog(null);
      setGrantForm({ credits: "", description: "" });
      refetch();
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  const handleGrant = () => {
    if (!grantDialog || !grantForm.credits) return;
    grantMutation.mutate({
      tenantCompanyId: grantDialog.tenantId,
      credits: parseInt(grantForm.credits),
      description: grantForm.description || "Credits granted by Apex Owner",
    });
  };

  const txTypeLabel: Record<string, string> = {
    purchase: "Purchase",
    crm_free: "CRM Free",
    paid_usage: "Paid Usage",
    refund: "Refund",
    adjustment: "Adjustment",
  };

  const txTypeBadge: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    purchase: "default",
    crm_free: "secondary",
    paid_usage: "destructive",
    refund: "outline",
    adjustment: "outline",
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        View AI credit balances across all tenant companies. You can grant credits manually or
        initiate a Stripe checkout for a tenant.
      </p>

      {balances.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No tenant data yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tenant credit balances will appear here once companies are registered.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Available Credits</TableHead>
                <TableHead className="text-right">Lifetime Purchased</TableHead>
                <TableHead className="text-right">Lifetime Used</TableHead>
                <TableHead className="text-right">Last Updated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map((b) => (
                <TableRow
                  key={b.tenantCompanyId}
                  className={selectedTenant === b.tenantCompanyId ? "bg-muted/50" : ""}
                >
                  <TableCell className="font-medium">{b.companyName || `Tenant #${b.tenantCompanyId}`}</TableCell>
                  <TableCell className="text-right">
                    <span className={b.availableCredits === 0 ? "text-muted-foreground" : "font-semibold"}>
                      {(b.availableCredits || 0).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {(b.lifetimePurchasedCredits || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {(b.lifetimeUsedCredits || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {b.updatedAt ? new Date(b.updatedAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedTenant(
                            selectedTenant === b.tenantCompanyId ? null : b.tenantCompanyId!
                          )
                        }
                      >
                        {selectedTenant === b.tenantCompanyId ? "Hide" : "History"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          setGrantDialog({
                            tenantId: b.tenantCompanyId!,
                            name: b.companyName || `Tenant #${b.tenantCompanyId}`,
                          })
                        }
                      >
                        <Gift className="h-3 w-3 mr-1" />
                        Grant
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Transaction history panel */}
      {selectedTenant && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Transaction History —{" "}
              {balances.find((b) => b.tenantCompanyId === selectedTenant)?.companyName ||
                `Tenant #${selectedTenant}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead className="text-right">Balance After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={txTypeBadge[tx.type] || "secondary"}>
                          {txTypeLabel[tx.type] || tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {tx.featureKey || "—"}
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {tx.description || "—"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono text-sm ${
                          tx.credits > 0
                            ? "text-green-600"
                            : tx.credits < 0
                            ? "text-red-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {tx.credits > 0 ? "+" : ""}
                        {tx.credits}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {tx.balanceAfter}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grant Credits Dialog */}
      <Dialog open={!!grantDialog} onOpenChange={() => setGrantDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Credits — {grantDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Manually add credits to this tenant's balance. Use this for promotional credits,
              corrections, or when payment was received outside Stripe.
            </p>
            <div>
              <Label>Credits to Grant *</Label>
              <Input
                type="number"
                placeholder="e.g. 500"
                value={grantForm.credits}
                onChange={(e) => setGrantForm({ ...grantForm, credits: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                placeholder="e.g. Promotional credits, Q1 bonus"
                value={grantForm.description}
                onChange={(e) => setGrantForm({ ...grantForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleGrant} disabled={grantMutation.isPending}>
              {grantMutation.isPending ? "Granting..." : "Grant Credits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
