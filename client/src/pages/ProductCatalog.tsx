import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Package, Pencil, Trash2, Search } from "lucide-react";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  unit: string | null;
  sku: string | null;
  category: string | null;
  isActive: number;
};

export default function ProductCatalog() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", currency: "USD", unit: "", sku: "", category: "" });

  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.productCatalog.list.useQuery({ search: search || undefined });

  const createMutation = trpc.productCatalog.create.useMutation({
    onSuccess: () => { utils.productCatalog.list.invalidate(); setDialogOpen(false); toast.success("Product created"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const updateMutation = trpc.productCatalog.update.useMutation({
    onSuccess: () => { utils.productCatalog.list.invalidate(); setDialogOpen(false); toast.success("Product updated"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const deleteMutation = trpc.productCatalog.delete.useMutation({
    onSuccess: () => { utils.productCatalog.list.invalidate(); toast.success("Product deleted"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditProduct(null);
    setForm({ name: "", description: "", price: "", currency: "USD", unit: "", sku: "", category: "" });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ name: p.name, description: p.description ?? "", price: p.price, currency: p.currency, unit: p.unit ?? "", sku: p.sku ?? "", category: p.category ?? "" });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Product name is required");
    if (!form.price || isNaN(parseFloat(form.price))) return toast.error("Valid price is required");
    if (editProduct) {
      updateMutation.mutate({ id: editProduct.id, ...form, price: parseFloat(form.price) });
    } else {
      createMutation.mutate({ ...form, price: parseFloat(form.price) });
    }
  };

  const filtered = products?.items ?? [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Product Catalog
            </h1>
            <p className="text-muted-foreground mt-1">Manage your products and services for use in deals and proposals</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products yet. Add your first product to get started.</p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      {p.sku && <p className="text-xs text-muted-foreground mt-0.5">SKU: {p.sku}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate({ id: p.id })}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-green-600">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency }).format(parseFloat(p.price))}
                      {p.unit && <span className="text-sm font-normal text-muted-foreground"> / {p.unit}</span>}
                    </span>
                    {p.category && <Badge variant="secondary">{p.category}</Badge>}
                  </div>
                  <Badge variant={p.isActive ? "default" : "secondary"} className="text-xs">
                    {p.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Price *</Label>
                  <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="USD" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Unit</Label>
                  <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. month, seat" />
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Optional SKU" />
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Software, Services" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editProduct ? "Save Changes" : "Add Product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
