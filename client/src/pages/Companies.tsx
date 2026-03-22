import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Building2, Globe, MoreHorizontal, Trash2, Users, ChevronRight, AlertTriangle, MapPin, Phone as PhoneIcon, DollarSign, Kanban } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";

export default function Companies() {
  const { t } = useSkin();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const searchInput = useMemo(() => ({ search: search || undefined, limit: 50 }), [search]);
  const { data, isLoading } = trpc.companies.listWithMetrics.useQuery(searchInput);
  const createMutation = trpc.companies.create.useMutation({
    onSuccess: () => { utils.companies.list.invalidate(); utils.companies.listWithMetrics.invalidate(); setShowCreate(false); toast.success("Company created"); setForm({ name: "", domain: "", industry: "", numberOfEmployees: "", phone: "", website: "", description: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.companies.delete.useMutation({
    onSuccess: () => { utils.companies.list.invalidate(); utils.companies.listWithMetrics.invalidate(); setDeleteTarget(null); toast.success("Company and all contacts deleted"); },
  });

  const [form, setForm] = useState({ name: "", domain: "", industry: "", numberOfEmployees: "", phone: "", website: "", description: "" });

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error("Company name is required"); return; }
    createMutation.mutate({
      name: form.name,
      domain: form.domain || undefined,
      industry: form.industry || undefined,
      numberOfEmployees: form.numberOfEmployees || undefined,
      phone: form.phone || undefined,
      website: form.website || undefined,
      description: form.description || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.companiesPage} />
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("companies")}</h1>
              <p className="text-sm text-muted-foreground">{data?.total ?? 0} companies &middot; Companies are your primary entity — every contact, deal, and activity belongs to a company. Start here to build your pipeline.</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 rounded-xl shadow-sm">
          <Plus className="h-4 w-4" /> Add Company
        </Button>
      </div>

      {/* ─── Search ─── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, domain..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl border-border/50 bg-card h-11"
        />
      </div>

      {/* ─── Companies Table ─── */}
      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent bg-muted/30">
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 py-3.5">Company</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Domain</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Industry</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Contacts</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Open Deals</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Pipeline</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border/30">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 w-24 bg-muted/50 rounded-full animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.items.length === 0 ? (
                <TableRow className="border-border/30">
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <Building2 className="h-7 w-7 text-muted-foreground/40" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">No companies yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Add your first company to start managing contacts and deals.</p>
                      </div>
                      <Button onClick={() => setShowCreate(true)} size="sm" variant="outline" className="mt-2 rounded-xl gap-2">
                        <Plus className="h-3.5 w-3.5" /> Add Company
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((company) => (
                  <TableRow
                    key={company.id}
                    className="border-border/30 cursor-pointer hover:bg-accent/30 transition-colors group"
                    onClick={() => setLocation(`/companies/${company.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                          <Building2 className="h-4.5 w-4.5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{company.name}</p>
                          {company.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <PhoneIcon className="h-3 w-3" />{company.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.domain ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground/50" />{company.domain}
                        </div>
                      ) : <span className="text-xs text-muted-foreground/40">&mdash;</span>}
                    </TableCell>
                    <TableCell>
                      {company.industry ? (
                        <Badge variant="secondary" className="text-[10px] font-medium rounded-lg bg-muted/60">
                          {company.industry}
                        </Badge>
                      ) : <span className="text-xs text-muted-foreground/40">&mdash;</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded-md bg-blue-50 flex items-center justify-center">
                          <Users className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{(company as any).contactCount ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded-md bg-emerald-50 flex items-center justify-center">
                          <Kanban className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{(company as any).openDeals ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {((company as any).pipelineValue ?? 0) > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-6 w-6 rounded-md bg-amber-50 flex items-center justify-center">
                            <DollarSign className="h-3 w-3 text-amber-600" />
                          </div>
                          <span className="text-sm font-bold text-foreground">${((company as any).pipelineValue ?? 0).toLocaleString()}</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground/40">&mdash;</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] font-semibold rounded-lg ${
                        company.leadStatus === "Hot" ? "bg-red-50 text-red-600" :
                        company.leadStatus === "Warm" ? "bg-amber-50 text-amber-600" :
                        company.leadStatus === "Customer" ? "bg-emerald-50 text-emerald-600" :
                        company.leadStatus === "Qualified" ? "bg-blue-50 text-blue-600" :
                        "bg-muted/60 text-muted-foreground"
                      }`}>
                        {company.leadStatus || "Cold"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/companies/${company.id}`); }} className="rounded-lg">
                            <ChevronRight className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive rounded-lg"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: company.id, name: company.name }); }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Company
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

      {/* ─── Create Company Dialog ─── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border/50 rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              Add New Company
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Companies are the primary entity. Contacts, deals, and activities are organized under companies.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Company Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Acme Logistics" className="rounded-xl bg-muted/30 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Domain</Label>
              <Input value={form.domain} onChange={(e) => setForm(p => ({ ...p, domain: e.target.value }))} placeholder="acme.com" className="rounded-xl bg-muted/30 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Industry</Label>
              <Input value={form.industry} onChange={(e) => setForm(p => ({ ...p, industry: e.target.value }))} placeholder="Freight & Logistics" className="rounded-xl bg-muted/30 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Employees</Label>
              <Input value={form.numberOfEmployees} onChange={(e) => setForm(p => ({ ...p, numberOfEmployees: e.target.value }))} placeholder="51-200" className="rounded-xl bg-muted/30 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555 0123" className="rounded-xl bg-muted/30 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Website</Label>
              <Input value={form.website} onChange={(e) => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://acme.com" className="rounded-xl bg-muted/30 border-border/50" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label className="text-xs font-semibold">Description</Label>
              <Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of the company..." className="rounded-xl bg-muted/30 border-border/50" />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="rounded-xl shadow-sm">
              {createMutation.isPending ? "Creating..." : "Create Company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog (Cascade Warning) ─── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-card border-border/50 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Company
            </DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> and <strong>all associated contacts</strong>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })}
              disabled={deleteMutation.isPending}
              className="rounded-xl"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Company & Contacts"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
