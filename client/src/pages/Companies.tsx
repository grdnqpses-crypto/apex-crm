import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Building2, Globe, MoreHorizontal, Trash2, Users, ChevronRight, AlertTriangle, MapPin, Phone as PhoneIcon, DollarSign, Kanban, Tag, Briefcase, TrendingUp, MessageSquare, UserCheck, CheckSquare, Workflow, Sparkles, Pencil, Link2, ShieldCheck, Activity, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapView } from "@/components/Map";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  const emptyForm = {
    name: "", domain: "", industry: "", numberOfEmployees: "", phone: "", website: "", description: "",
    companyType: "", companyEmail: "", streetAddress: "", city: "", stateRegion: "", postalCode: "", country: "",
    annualRevenue: "", businessClassification: "", foundedYear: "", leadSource: "", leadStatus: "",
    creditTerms: "", paymentStatus: "", lanePreferences: "",
    facebookPage: "", twitterHandle: "", linkedinUrl: "", youtubeUrl: "",
    // Commercial / Pipeline
    revenueAmount: "", forecastCategory: "", businessCategory: "", whatsappNumber: "", proposalUrl: "",
  };
  const createMutation = trpc.companies.create.useMutation({
    onSuccess: () => { utils.companies.list.invalidate(); utils.companies.listWithMetrics.invalidate(); setShowCreate(false); toast.success("Company created"); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.companies.delete.useMutation({
    onSuccess: () => { utils.companies.list.invalidate(); utils.companies.listWithMetrics.invalidate(); setDeleteTarget(null); toast.success("Company and all contacts deleted"); },
  });
  const bulkDeleteMutation = trpc.companies.bulkDelete.useMutation({
    onSuccess: (d) => { utils.companies.list.invalidate(); utils.companies.listWithMetrics.invalidate(); setSelectedIds(new Set()); toast.success(`Deleted ${d.deleted} companies and their contacts`); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteAllMutation = trpc.companies.deleteAll.useMutation({
    onSuccess: () => { utils.companies.list.invalidate(); utils.companies.listWithMetrics.invalidate(); setSelectedIds(new Set()); toast.success("All companies and contacts deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Completeness score: count how many key fields are filled
  const getCompanyScore = (c: any): number => {
    const fields = [c.name, c.domain, c.industry, c.phone, c.website, c.companyEmail,
      c.streetAddress, c.city, c.country, c.annualRevenue, c.leadStatus, c.leadSource,
      c.businessClassification, c.numberOfEmployees, c.description];
    const filled = fields.filter(f => f && String(f).trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  };
  const [activeTab, setActiveTab] = useState<"all" | "incomplete">("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const bulkUpdateCompanies = trpc.bulkActions.updateCompanies.useMutation({
    onSuccess: (d: any) => { utils.companies.listWithMetrics.invalidate(); setSelectedIds(new Set()); toast.success(`Updated ${d.updated} companies`); },
    onError: (e: any) => toast.error(e.message),
  });
  const fillSmartPropsCompanies = trpc.bulkActions.fillSmartProperties.useMutation({
    onSuccess: (d) => { utils.companies.listWithMetrics.invalidate(); setSelectedIds(new Set()); toast.success(`Smart properties filled for ${d.processed} companies (${d.filled} fields inferred)`); },
    onError: (e: any) => toast.error(e.message),
  });
  const [bulkTaskDialog, setBulkTaskDialog] = useState(false);
  const [bulkTaskForm, setBulkTaskForm] = useState({ title: "", taskType: "follow_up" as "call"|"email"|"to_do"|"follow_up", priority: "medium" as "low"|"medium"|"high", notes: "" });
  const createBulkTasksMutation = trpc.bulkActions.createBulkTasks.useMutation({
    onSuccess: (d) => { setSelectedIds(new Set()); setBulkTaskDialog(false); setBulkTaskForm({ title: "", taskType: "follow_up", priority: "medium", notes: "" }); toast.success(`Created ${d.created} tasks`); },
    onError: (e: any) => toast.error(e.message),
  });
  const [bulkActivityDialog, setBulkActivityDialog] = useState(false);
  const [bulkActivityForm, setBulkActivityForm] = useState({ activityType: "note" as "note"|"call"|"email_sent"|"meeting", subject: "", body: "" });
  const trackActivityMutation = trpc.bulkActions.trackBulkActivity.useMutation({
    onSuccess: (d) => { utils.companies.listWithMetrics.invalidate(); setSelectedIds(new Set()); setBulkActivityDialog(false); setBulkActivityForm({ activityType: "note", subject: "", body: "" }); toast.success(`Activity logged for ${d.logged} companies`); },
    onError: (e: any) => toast.error(e.message),
  });
  const visibleCompanies = (activeTab === "incomplete" ? data?.items?.filter(c => getCompanyScore(c) < 60) : data?.items) ?? [];
  const toggleSelectAll = () => { if (selectedIds.size === visibleCompanies.length && visibleCompanies.length > 0) { setSelectedIds(new Set()); } else { setSelectedIds(new Set(visibleCompanies.map((c: any) => c.id))); } };

  const [form, setForm] = useState(emptyForm);
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

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
      companyType: form.companyType || undefined,
      companyEmail: form.companyEmail || undefined,
      streetAddress: form.streetAddress || undefined,
      city: form.city || undefined,
      stateRegion: form.stateRegion || undefined,
      postalCode: form.postalCode || undefined,
      country: form.country || undefined,
      annualRevenue: form.annualRevenue || undefined,
      businessClassification: form.businessClassification || undefined,
      foundedYear: form.foundedYear || undefined,
      leadSource: form.leadSource || undefined,
      leadStatus: form.leadStatus || undefined,
      creditTerms: form.creditTerms || undefined,
      paymentStatus: form.paymentStatus || undefined,
      lanePreferences: form.lanePreferences || undefined,
      facebookPage: form.facebookPage || undefined,
      twitterHandle: form.twitterHandle || undefined,
      linkedinUrl: form.linkedinUrl || undefined,
      youtubeUrl: form.youtubeUrl || undefined,
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

      {/* ─── Filter Tabs ─── */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab("all")} className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${activeTab === "all" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
          All Companies <span className="ml-1 opacity-70">{data?.total ?? 0}</span>
        </button>
        <button onClick={() => setActiveTab("incomplete")} className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${activeTab === "incomplete" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}>
          ⚠ Incomplete <span className="ml-1 opacity-70">{data?.items?.filter(c => getCompanyScore(c) < 60).length ?? 0}</span>
        </button>
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

      {/* ─── Bulk Action Toolbar ─── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-semibold text-primary mr-1">{selectedIds.size} selected</span>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => toast.info(`Enriching ${selectedIds.size} companies with AI data (Lead Enrichment — paid service)`)}>
            <Sparkles className="h-3.5 w-3.5 text-purple-500" /> Enrich
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" disabled={fillSmartPropsCompanies.isPending} onClick={() => fillSmartPropsCompanies.mutate({ ids: Array.from(selectedIds), entityType: "companies" })}>
            <Pencil className="h-3.5 w-3.5 text-blue-500" /> {fillSmartPropsCompanies.isPending ? "Filling..." : "Fill Smart Properties"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => toast.info("Assign Owner — coming soon")}>
            <UserCheck className="h-3.5 w-3.5" /> Assign
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => toast.info(`Bulk edit ${selectedIds.size} companies — coming soon`)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => toast.info(`Reviewing associations for ${selectedIds.size} companies...`)}>
            <Link2 className="h-3.5 w-3.5 text-green-600" /> Review Associations
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => setBulkTaskDialog(true)}>
            <CheckSquare className="h-3.5 w-3.5" /> Create Tasks
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => toast.info("Add to Segment — coming soon")}>
            <Tag className="h-3.5 w-3.5" /> Add to Segment
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => toast.info("Enroll in Workflow — coming soon")}>
            <Workflow className="h-3.5 w-3.5" /> Enroll in Workflow
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => toast.info(`Checking enrichment coverage for ${selectedIds.size} companies...`)}>
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> Check Coverage
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => setBulkActivityDialog(true)}>
            <Activity className="h-3.5 w-3.5 text-rose-500" /> Track Activity
          </Button>
          <Button variant="destructive" size="sm" className="gap-1.5 rounded-xl text-xs h-8" disabled={bulkDeleteMutation.isPending} onClick={() => { if (confirm(`Delete ${selectedIds.size} selected companies and all their contacts? This cannot be undone.`)) { bulkDeleteMutation.mutate({ ids: Array.from(selectedIds) }); } }}>
            <Trash2 className="h-3.5 w-3.5" /> {bulkDeleteMutation.isPending ? "Deleting..." : "Delete Selected"}
          </Button>
          <Button variant="destructive" size="sm" className="gap-1.5 rounded-xl text-xs h-8 opacity-80" disabled={deleteAllMutation.isPending} onClick={() => { if (confirm(`DELETE ALL ${data?.total ?? 0} companies and ALL their contacts? This cannot be undone.`)) { deleteAllMutation.mutate(); } }}>
            <Trash2 className="h-3.5 w-3.5" /> {deleteAllMutation.isPending ? "Deleting All..." : "Delete All"}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* ─── Companies Table ─── */}
      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent bg-muted/30">
                <TableHead className="w-10 py-3.5">
                  <Checkbox
                    checked={visibleCompanies.length > 0 && selectedIds.size === visibleCompanies.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all companies"
                  />
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 py-3.5">Company</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Domain</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Industry</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Contacts</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Open Deals</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Pipeline</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Health</TableHead>
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
                (activeTab === "incomplete" ? data?.items.filter(c => getCompanyScore(c) < 60) : data?.items)?.map((company) => (
                  <TableRow
                    key={company.id}
                    className={`border-border/30 cursor-pointer hover:bg-accent/30 transition-colors group ${selectedIds.has(company.id) ? 'bg-primary/5' : ''}`}
                    onClick={() => setLocation(`/companies/${company.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
                      <Checkbox
                        checked={selectedIds.has(company.id)}
                        onCheckedChange={() => setSelectedIds(prev => { const n = new Set(prev); n.has(company.id) ? n.delete(company.id) : n.add(company.id); return n; })}
                        aria-label="Select company"
                      />
                    </TableCell>
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
                      <div className="space-y-1">
                        <Badge variant="secondary" className={`text-[10px] font-semibold rounded-lg ${
                          company.leadStatus === "Hot" ? "bg-red-50 text-red-600" :
                          company.leadStatus === "Warm" ? "bg-amber-50 text-amber-600" :
                          company.leadStatus === "Customer" ? "bg-emerald-50 text-emerald-600" :
                          company.leadStatus === "Qualified" ? "bg-blue-50 text-blue-600" :
                          "bg-muted/60 text-muted-foreground"
                        }`}>
                          {company.leadStatus || "Cold"}
                        </Badge>
                        {(() => { const s = getCompanyScore(company); return (
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-blue-400' : s >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${s}%` }} />
                            </div>
                            <span className="text-[9px] text-muted-foreground">{s}%</span>
                          </div>
                        ); })()}
                      </div>
                    </TableCell>

                    <TableCell>
                      {(() => {
                        const hs = (company as any).healthScore ?? 50;
                        const color = hs >= 80 ? 'text-emerald-600' : hs >= 60 ? 'text-blue-500' : hs >= 40 ? 'text-amber-500' : 'text-red-500';
                        const bg = hs >= 80 ? 'bg-emerald-50' : hs >= 60 ? 'bg-blue-50' : hs >= 40 ? 'bg-amber-50' : 'bg-red-50';
                        const label = hs >= 80 ? 'Excellent' : hs >= 60 ? 'Good' : hs >= 40 ? 'Fair' : 'Poor';
                        return (
                          <div className="flex items-center gap-1.5">
                            <div className={`h-6 px-2 rounded-md ${bg} flex items-center`}>
                              <span className={`text-[10px] font-bold ${color}`}>{hs}</span>
                            </div>
                            <span className={`text-[10px] ${color}`}>{label}</span>
                          </div>
                        );
                      })()}
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
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/contacts?companyId=${company.id}&addNew=true`); }} className="rounded-lg">
                            <UserPlus className="mr-2 h-4 w-4" /> Add Contact
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
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
      <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) setForm(emptyForm); }}>
        <DialogContent className="bg-card border-border/50 rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              Add New Company
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Fill in as much as you know now. Incomplete fields will appear in the <strong>Incomplete</strong> tab for follow-up.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-5">
            {/* ── IDENTITY ── */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><Building2 className="h-3 w-3" /> Identity</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-semibold">Company Name <span className="text-red-500">*</span></Label>
                  <Input value={form.name} onChange={e => setF("name", e.target.value)} placeholder="Acme Logistics" className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Domain</Label>
                  <Input
                    value={form.domain}
                    onChange={e => {
                      const d = e.target.value.trim();
                      setF("domain", d);
                      // Auto-fill website and email if they're still empty
                      if (d && !form.website) setF("website", `https://${d}`);
                      if (d && !form.companyEmail) setF("companyEmail", `info@${d}`);
                    }}
                    placeholder="acme.com"
                    className="rounded-xl bg-muted/30"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Company Email</Label>
                  <Input value={form.companyEmail} onChange={e => setF("companyEmail", e.target.value)} placeholder="info@acme.com" className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Phone</Label>
                  <Input value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="+1 555 0123" className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">WhatsApp #</Label>
                  <Input value={form.whatsappNumber} onChange={e => setF("whatsappNumber", e.target.value)} placeholder="+1 555 0123" className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Website</Label>
                  <Input value={form.website} onChange={e => setF("website", e.target.value)} placeholder="https://acme.com" className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Industry</Label>
                  <Input value={form.industry} onChange={e => setF("industry", e.target.value)} placeholder="Freight & Logistics" className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Business Category</Label>
                  <Select value={form.businessCategory || ""} onValueChange={v => setF("businessCategory", v)}>
                    <SelectTrigger className="rounded-xl bg-muted/30"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {["Freight Broker","Carrier","Shipper","3PL","Warehouse","Technology","Manufacturing","Retail","Healthcare","Finance","Other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Business Classification</Label>
                  <Select value={form.businessClassification || ""} onValueChange={v => setF("businessClassification", v)}>
                    <SelectTrigger className="rounded-xl bg-muted/30"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {["LLC","S-Corp","C-Corp","Sole Proprietor","Partnership","Non-Profit","Government"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Employees</Label>
                  <Select value={form.numberOfEmployees || ""} onValueChange={v => setF("numberOfEmployees", v)}>
                    <SelectTrigger className="rounded-xl bg-muted/30"><SelectValue placeholder="Select range" /></SelectTrigger>
                    <SelectContent>
                      {["1-10","11-50","51-200","201-500","501-1000","1001-5000","5000+"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Founded Year</Label>
                  <Input value={form.foundedYear} onChange={e => setF("foundedYear", e.target.value)} placeholder="2005" className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-semibold">Description</Label>
                  <Textarea value={form.description} onChange={e => setF("description", e.target.value)} placeholder="Brief description of what this company does..." className="rounded-xl bg-muted/30 resize-none" rows={2} />
                </div>
              </div>
            </div>
            {/* ── ADDRESS ── */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-semibold">Search Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="places-autocomplete"
                      placeholder="Start typing an address..."
                      className="rounded-xl bg-muted/30 pl-8"
                      onFocus={() => {
                        // Initialize Google Places autocomplete on first focus
                        const input = document.getElementById('places-autocomplete') as HTMLInputElement;
                        if (input && (window as any).google?.maps?.places && !(input as any)._autocompleteInit) {
                          (input as any)._autocompleteInit = true;
                          const ac = new (window as any).google.maps.places.Autocomplete(input, { types: ['address'] });
                          ac.addListener('place_changed', () => {
                            const place = ac.getPlace();
                            const comps = place.address_components || [];
                            const get = (type: string) => comps.find((c: any) => c.types.includes(type))?.long_name || '';
                            const getShort = (type: string) => comps.find((c: any) => c.types.includes(type))?.short_name || '';
                            setF('streetAddress', `${get('street_number')} ${get('route')}`.trim());
                            setF('city', get('locality') || get('sublocality'));
                            setF('stateRegion', getShort('administrative_area_level_1'));
                            setF('postalCode', get('postal_code'));
                            setF('country', get('country'));
                          });
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-semibold">Street Address</Label>
                  <Input value={form.streetAddress} onChange={e => setF("streetAddress", e.target.value)} placeholder="123 Main St" className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">City</Label>
                  <Input value={form.city} onChange={e => setF("city", e.target.value)} placeholder="Chicago" className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">State / Region</Label>
                  <Input value={form.stateRegion} onChange={e => setF("stateRegion", e.target.value)} placeholder="IL" className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Postal Code</Label>
                  <Input value={form.postalCode} onChange={e => setF("postalCode", e.target.value)} placeholder="60601" className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Country</Label>
                  <Input value={form.country} onChange={e => setF("country", e.target.value)} placeholder="United States" className="rounded-xl bg-muted/30" />
                </div>
              </div>
            </div>
            {/* ── COMMERCIAL ── */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Commercial</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Annual Revenue</Label>
                  <Input value={form.annualRevenue} onChange={e => setF("annualRevenue", e.target.value)} placeholder="$5M" className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Revenue Potential</Label>
                  <Input value={form.revenueAmount} onChange={e => setF("revenueAmount", e.target.value)} placeholder="$250,000" className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Forecast Category</Label>
                  <Select value={form.forecastCategory || ""} onValueChange={v => setF("forecastCategory", v)}>
                    <SelectTrigger className="rounded-xl bg-muted/30"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Pipeline","Best Case","Commit","Closed Won","Closed Lost"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Proposal URL</Label>
                  <Input value={form.proposalUrl} onChange={e => setF("proposalUrl", e.target.value)} placeholder="https://docs.google.com/..." className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Credit Terms</Label>
                  <Select value={form.creditTerms || ""} onValueChange={v => setF("creditTerms", v)}>
                    <SelectTrigger className="rounded-xl bg-muted/30"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Net 15","Net 30","Net 45","Net 60","Net 90","COD","Prepaid"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Payment Status</Label>
                  <Select value={form.paymentStatus || ""} onValueChange={v => setF("paymentStatus", v)}>
                    <SelectTrigger className="rounded-xl bg-muted/30"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Current","Overdue","Credit Hold","Collections","Closed"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs font-semibold">Lane Preferences</Label>
                  <Input value={form.lanePreferences} onChange={e => setF("lanePreferences", e.target.value)} placeholder="Chicago to Dallas, Southeast corridor..." className="rounded-xl bg-muted/30" />
                </div>
              </div>
            </div>
            {/* ── STATUS ── */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><Tag className="h-3 w-3" /> Status</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Lead Status</Label>
                  <Select value={form.leadStatus || ""} onValueChange={v => setF("leadStatus", v)}>
                    <SelectTrigger className="rounded-xl bg-muted/30"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["New","Open","In Progress","Open Deal","Unqualified","Attempted Contact","Connected","Bad Timing"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Lead Source</Label>
                  <Select value={form.leadSource || ""} onValueChange={v => setF("leadSource", v)}>
                    <SelectTrigger className="rounded-xl bg-muted/30"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Website","Referral","Cold Call","Email Campaign","LinkedIn","Trade Show","Partner","Other"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Company Type</Label>
                  <Select value={form.companyType || ""} onValueChange={v => setF("companyType", v)}>
                    <SelectTrigger className="rounded-xl bg-muted/30"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Prospect","Customer","Partner","Vendor","Competitor","Other"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* ── SOCIAL ── */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><Globe className="h-3 w-3" /> Social</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">LinkedIn URL</Label>
                  <Input value={form.linkedinUrl} onChange={e => setF("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/company/..." className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Twitter / X</Label>
                  <Input value={form.twitterHandle} onChange={e => setF("twitterHandle", e.target.value)} placeholder="@acmelogistics" className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Facebook Page</Label>
                  <Input value={form.facebookPage} onChange={e => setF("facebookPage", e.target.value)} placeholder="https://facebook.com/..." className="rounded-xl bg-muted/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">YouTube</Label>
                  <Input value={form.youtubeUrl} onChange={e => setF("youtubeUrl", e.target.value)} placeholder="https://youtube.com/..." className="rounded-xl bg-muted/30" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setShowCreate(false); setForm(emptyForm); }} className="rounded-xl">Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || !form.name.trim()} className="rounded-xl shadow-sm">
              {createMutation.isPending ? "Creating..." : "Create Company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Tasks Dialog */}
      <Dialog open={bulkTaskDialog} onOpenChange={setBulkTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Tasks for {selectedIds.size} Companies</DialogTitle>
            <DialogDescription>A task will be created for each selected company.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Task Title *</Label>
              <Input value={bulkTaskForm.title} onChange={e => setBulkTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="Follow up with company" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Task Type</Label>
                <Select value={bulkTaskForm.taskType} onValueChange={v => setBulkTaskForm(p => ({ ...p, taskType: v as any }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="follow_up">Follow Up</SelectItem><SelectItem value="call">Call</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="to_do">To Do</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Priority</Label>
                <Select value={bulkTaskForm.priority} onValueChange={v => setBulkTaskForm(p => ({ ...p, priority: v as any }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Notes (optional)</Label>
              <Textarea value={bulkTaskForm.notes} onChange={e => setBulkTaskForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional context..." className="rounded-xl min-h-[80px]" />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setBulkTaskDialog(false)} className="rounded-xl">Cancel</Button>
            <Button disabled={!bulkTaskForm.title.trim() || createBulkTasksMutation.isPending} onClick={() => createBulkTasksMutation.mutate({ ids: Array.from(selectedIds), entityType: "companies", title: bulkTaskForm.title, taskType: bulkTaskForm.taskType, priority: bulkTaskForm.priority, notes: bulkTaskForm.notes || undefined })} className="rounded-xl">
              {createBulkTasksMutation.isPending ? "Creating..." : `Create ${selectedIds.size} Tasks`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Bulk Track Activity Dialog */}
      <Dialog open={bulkActivityDialog} onOpenChange={setBulkActivityDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Activity for {selectedIds.size} Companies</DialogTitle>
            <DialogDescription>An activity entry will be logged against each selected company.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Activity Type</Label>
              <Select value={bulkActivityForm.activityType} onValueChange={v => setBulkActivityForm(p => ({ ...p, activityType: v as any }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="note">Note</SelectItem><SelectItem value="call">Call</SelectItem><SelectItem value="email_sent">Email Sent</SelectItem><SelectItem value="meeting">Meeting</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Subject *</Label>
              <Input value={bulkActivityForm.subject} onChange={e => setBulkActivityForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Quarterly check-in call" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Details (optional)</Label>
              <Textarea value={bulkActivityForm.body} onChange={e => setBulkActivityForm(p => ({ ...p, body: e.target.value }))} placeholder="Notes about this activity..." className="rounded-xl min-h-[80px]" />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setBulkActivityDialog(false)} className="rounded-xl">Cancel</Button>
            <Button disabled={!bulkActivityForm.subject.trim() || trackActivityMutation.isPending} onClick={() => trackActivityMutation.mutate({ ids: Array.from(selectedIds), entityType: "companies", activityType: bulkActivityForm.activityType, subject: bulkActivityForm.subject, body: bulkActivityForm.body || undefined })} className="rounded-xl">
              {trackActivityMutation.isPending ? "Logging..." : `Log Activity for ${selectedIds.size} Companies`}
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
