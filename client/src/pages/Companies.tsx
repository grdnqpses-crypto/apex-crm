import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Building2, Globe, MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function Companies() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const searchInput = useMemo(() => ({ search: search || undefined, limit: 50 }), [search]);
  const { data, isLoading } = trpc.companies.list.useQuery(searchInput);
  const createMutation = trpc.companies.create.useMutation({
    onSuccess: () => { utils.companies.list.invalidate(); setShowCreate(false); toast.success("Company created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.companies.delete.useMutation({
    onSuccess: () => { utils.companies.list.invalidate(); toast.success("Company deleted"); },
  });

  const [form, setForm] = useState({ name: "", domain: "", industry: "", size: "", phone: "", website: "", description: "" });

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error("Company name is required"); return; }
    createMutation.mutate({
      name: form.name,
      domain: form.domain || undefined,
      industry: form.industry || undefined,
      size: form.size || undefined,
      phone: form.phone || undefined,
      website: form.website || undefined,
      description: form.description || undefined,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Companies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} companies total</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Company
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/30" />
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Domain</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Industry</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Size</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.items.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No companies found. Add your first company to get started.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((company) => (
                  <TableRow key={company.id} className="border-border hover:bg-secondary/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-chart-2" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{company.name}</p>
                          {company.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{company.description}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.domain ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Globe className="h-3.5 w-3.5" />{company.domain}
                        </div>
                      ) : <span className="text-xs text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{company.industry || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{company.size || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(company.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate({ id: company.id })}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Add New Company</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Company Name *</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Acme Inc." className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Domain</Label><Input value={form.domain} onChange={(e) => setForm(p => ({ ...p, domain: e.target.value }))} placeholder="acme.com" className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Industry</Label><Input value={form.industry} onChange={(e) => setForm(p => ({ ...p, industry: e.target.value }))} placeholder="Technology" className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Size</Label><Input value={form.size} onChange={(e) => setForm(p => ({ ...p, size: e.target.value }))} placeholder="51-200" className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555 0123" className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://acme.com" className="bg-secondary/30" /></div>
            <div className="space-y-2 col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." className="bg-secondary/30" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Company"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
