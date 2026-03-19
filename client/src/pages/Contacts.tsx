import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, UserPlus, Mail, Phone, MoreHorizontal, Trash2, Upload, Download, Users, Building2, Plus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";

const STAGES = ["subscriber", "lead", "mql", "sql", "opportunity", "customer", "evangelist"] as const;
const STAGE_COLORS: Record<string, string> = {
  subscriber: "bg-muted/60 text-muted-foreground",
  lead: "bg-blue-50 text-blue-600",
  mql: "bg-amber-50 text-amber-600",
  sql: "bg-purple-50 text-purple-600",
  opportunity: "bg-orange-50 text-orange-600",
  customer: "bg-emerald-50 text-emerald-600",
  evangelist: "bg-primary/10 text-primary",
};

const LEAD_STATUSES = [
  "Qualified", "Cold", "Cold-Upwork", "Hot", "Warm", "Customer",
  "Attempted Contact", "DM Reached/Awaiting Quote",
  "Currently Quoting/Awaiting Business", "Paperwork Received",
  "Has Freight/DM not Reached", "Cannot Get a Quote from DM",
  "Under Contract", "BOL Lead", "Not Enough Freight", "No Freight",
  "Cannot Reach DM", "Cannot Reach Anyone/VM Every Time",
  "Competitor", "Has Own Trucks", "Customer Routed", "Small Parcel",
  "Our Rates Are Too High Every Time",
  "Lost - Not a Good Fit", "Lost - Disconnected/Out of Business",
  "Bad Credit", "Inactive Customer",
];

const STATUS_COLORS: Record<string, string> = {
  "Hot": "bg-red-50 text-red-600",
  "Warm": "bg-amber-50 text-amber-600",
  "Cold": "bg-blue-50 text-blue-600",
  "Qualified": "bg-emerald-50 text-emerald-600",
  "Customer": "bg-emerald-50 text-emerald-600",
};

const emptyForm = {
  firstName: "", lastName: "", email: "", directPhone: "", mobilePhone: "",
  companyPhone: "", jobTitle: "", linkedinUrl: "", websiteUrl: "",
  streetAddress: "", addressLine2: "", city: "", stateRegion: "", postalCode: "", country: "", timezone: "",
  lifecycleStage: "lead", leadStatus: "Cold", leadSource: "CRM",
  decisionMakerRole: "", department: "", freightVolume: "", customerType: "", paymentResponsibility: "", preferredContactMethod: "",
  twitterHandle: "", facebookProfile: "", instagramProfile: "",
  notes: "", companyId: "",
};

export default function Contacts() {
  const { t } = useSkin();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const searchInput = useMemo(() => ({
    search: search || undefined,
    stage: stageFilter !== "all" ? stageFilter : undefined,
    leadStatus: statusFilter !== "all" ? statusFilter : undefined,
    limit: 50,
  }), [search, stageFilter, statusFilter]);

  const { data, isLoading } = trpc.contacts.list.useQuery(searchInput);
  const { data: companiesData } = trpc.companies.list.useQuery({ limit: 100 });
  const createMutation = trpc.contacts.create.useMutation({
    onSuccess: () => { utils.contacts.list.invalidate(); setShowCreate(false); setForm({ ...emptyForm }); toast.success("Contact created"); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => { utils.contacts.list.invalidate(); toast.success("Contact deleted"); },
  });

  const [form, setForm] = useState({ ...emptyForm });
  const [showQuickCompany, setShowQuickCompany] = useState(false);
  const [quickCompanyName, setQuickCompanyName] = useState("");
  const [quickCompanyDomain, setQuickCompanyDomain] = useState("");
  const createCompanyMutation = trpc.companies.create.useMutation({
    onSuccess: (data: any) => {
      utils.companies.list.invalidate();
      setForm(p => ({ ...p, companyId: String(data.id) }));
      setShowQuickCompany(false);
      setQuickCompanyName("");
      setQuickCompanyDomain("");
      toast.success("Company created — now selected");
    },
    onError: (e: any) => toast.error(e.message),
  });
  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [key]: e.target.value })),
  });

  const handleCreate = () => {
    if (!form.firstName.trim()) { toast.error("First name is required"); return; }
    if (!form.companyId) { toast.error("Company is required. Every contact must belong to a company."); return; }
    const payload: Record<string, any> = { firstName: form.firstName, companyId: parseInt(form.companyId) };
    Object.entries(form).forEach(([k, v]) => {
      if (v && k !== "firstName" && k !== "companyId") payload[k] = v;
    });
    createMutation.mutate(payload as any);
  };

  // Build a lookup for company names
  const companyMap = useMemo(() => {
    const map: Record<number, string> = {};
    companiesData?.items?.forEach((c: any) => { map[c.id] = c.name; });
    return map;
  }, [companiesData]);

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("contacts")}</h1>
            <p className="text-sm text-muted-foreground">{data?.total ?? 0} contacts &middot; Every contact is linked to a company. Track interactions, log calls, send emails, and nurture relationships from here.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => toast.info("CSV import coming soon")}>
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => toast.info("CSV export coming soon")}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2 rounded-xl shadow-sm">
            <UserPlus className="h-4 w-4" /> Add Contact
          </Button>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl border-border/50 bg-card h-11" />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40 rounded-xl border-border/50 bg-card h-11"><SelectValue placeholder="All stages" /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.toUpperCase()}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56 rounded-xl border-border/50 bg-card h-11"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Lead Statuses</SelectItem>
            {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* ─── Contacts Table ─── */}
      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent bg-muted/30">
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 py-3.5">Name</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Company</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Email</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Phone</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Stage</TableHead>
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
                        <Users className="h-7 w-7 text-muted-foreground/40" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">No contacts found</p>
                        <p className="text-xs text-muted-foreground mt-1">Add contacts to a company to get started.</p>
                      </div>
                      <Button onClick={() => setShowCreate(true)} size="sm" variant="outline" className="mt-2 rounded-xl gap-2">
                        <UserPlus className="h-3.5 w-3.5" /> Add Contact
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((contact) => (
                  <TableRow key={contact.id} className="border-border/30 cursor-pointer hover:bg-accent/30 transition-colors group" onClick={() => setLocation(`/contacts/${contact.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/12 transition-colors">
                          <span className="text-xs font-bold text-primary">{contact.firstName.charAt(0)}{contact.lastName?.charAt(0) ?? ""}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{contact.firstName} {contact.lastName ?? ""}</p>
                          {contact.jobTitle && <p className="text-xs text-muted-foreground mt-0.5">{contact.jobTitle}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.companyId && companyMap[contact.companyId] ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground/50" />
                          <span className="truncate max-w-[140px]">{companyMap[contact.companyId]}</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground/40">&mdash;</span>}
                    </TableCell>
                    <TableCell>
                      {contact.email ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" /><span className="truncate max-w-[160px]">{contact.email}</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground/40">&mdash;</span>}
                    </TableCell>
                    <TableCell>
                      {contact.directPhone ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />{contact.directPhone}
                        </div>
                      ) : <span className="text-xs text-muted-foreground/40">&mdash;</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] font-semibold uppercase rounded-lg ${STAGE_COLORS[contact.lifecycleStage as string] ?? "bg-muted/60 text-muted-foreground"}`}>
                        {contact.lifecycleStage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] font-semibold rounded-lg ${STATUS_COLORS[contact.leadStatus as string] ?? "bg-muted/60 text-muted-foreground"}`}>
                        {contact.leadStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="text-destructive rounded-lg" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: contact.id }); }}>
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

      {/* ─── Create Contact Dialog (Company Required) ─── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border/50 rounded-2xl max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-blue-600" />
              </div>
              Add New Contact
            </DialogTitle>
            <DialogDescription>Every contact must belong to a company. Select or create a company first.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {/* Company Selection (Required, shown first) */}
            <div className="mb-5 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
              <Label className="text-xs font-bold text-blue-700 uppercase tracking-wider">Company *</Label>
              <Select value={form.companyId} onValueChange={(v) => setForm(p => ({ ...p, companyId: v }))}>
                <SelectTrigger className="mt-2 rounded-xl bg-card border-border/50 h-11">
                  <SelectValue placeholder="Select a company..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  {companiesData?.items?.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)} className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 mt-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8 border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => setShowQuickCompany(true)}>
                  <Plus className="h-3.5 w-3.5" /> Quick Add Company
                </Button>
                {!form.companyId && (
                  <p className="text-[11px] text-blue-600">Required</p>
                )}
              </div>
              {showQuickCompany && (
                <div className="mt-3 p-3.5 rounded-xl bg-card border border-blue-200 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Create New Company</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Company Name *</Label>
                      <Input value={quickCompanyName} onChange={(e) => setQuickCompanyName(e.target.value)} placeholder="Acme Inc" className="rounded-xl bg-muted/30 border-border/50 h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Domain</Label>
                      <Input value={quickCompanyDomain} onChange={(e) => setQuickCompanyDomain(e.target.value)} placeholder="acme.com" className="rounded-xl bg-muted/30 border-border/50 h-9 text-sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="rounded-xl text-xs h-8 shadow-sm" disabled={createCompanyMutation.isPending || !quickCompanyName.trim()} onClick={() => createCompanyMutation.mutate({ name: quickCompanyName, domain: quickCompanyDomain || undefined })}>
                      {createCompanyMutation.isPending ? "Creating..." : "Create & Select"}
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-xl text-xs h-8" onClick={() => setShowQuickCompany(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>

            <Tabs defaultValue="identity" className="w-full">
              <TabsList className="bg-muted/40 w-full flex-wrap h-auto gap-1 p-1 rounded-xl">
                <TabsTrigger value="identity" className="text-xs rounded-lg">Identity</TabsTrigger>
                <TabsTrigger value="communication" className="text-xs rounded-lg">Communication</TabsTrigger>
                <TabsTrigger value="address" className="text-xs rounded-lg">Address</TabsTrigger>
                <TabsTrigger value="lifecycle" className="text-xs rounded-lg">Lifecycle</TabsTrigger>
                <TabsTrigger value="logistics" className="text-xs rounded-lg">Logistics</TabsTrigger>
                <TabsTrigger value="social" className="text-xs rounded-lg">Social</TabsTrigger>
              </TabsList>

              <TabsContent value="identity" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-xs font-semibold">First Name *</Label><Input {...f("firstName")} placeholder="John" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Last Name</Label><Input {...f("lastName")} placeholder="Doe" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Job Title</Label><Input {...f("jobTitle")} placeholder="VP of Operations" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Department</Label><Input {...f("department")} placeholder="Logistics" className="rounded-xl bg-muted/30 border-border/50" /></div>
                </div>
              </TabsContent>

              <TabsContent value="communication" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-xs font-semibold">Email</Label><Input type="email" {...f("email")} placeholder="john@company.com" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Direct Phone</Label><Input {...f("directPhone")} placeholder="+1 555 0123" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Mobile Phone</Label><Input {...f("mobilePhone")} placeholder="+1 555 0456" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Company Phone</Label><Input {...f("companyPhone")} placeholder="+1 555 0000" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">LinkedIn URL</Label><Input {...f("linkedinUrl")} placeholder="https://linkedin.com/in/..." className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Website URL</Label><Input {...f("websiteUrl")} placeholder="https://..." className="rounded-xl bg-muted/30 border-border/50" /></div>
                </div>
              </TabsContent>

              <TabsContent value="address" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2"><Label className="text-xs font-semibold">Street Address</Label><Input {...f("streetAddress")} placeholder="123 Main St" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2 col-span-2"><Label className="text-xs font-semibold">Address Line 2</Label><Input {...f("addressLine2")} placeholder="Suite 100" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">City</Label><Input {...f("city")} placeholder="New York" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">State/Region</Label><Input {...f("stateRegion")} placeholder="NY" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Postal Code</Label><Input {...f("postalCode")} placeholder="10001" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Country</Label><Input {...f("country")} placeholder="United States" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Timezone</Label><Input {...f("timezone")} placeholder="America/New_York" className="rounded-xl bg-muted/30 border-border/50" /></div>
                </div>
              </TabsContent>

              <TabsContent value="lifecycle" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Lifecycle Stage</Label>
                    <Select value={form.lifecycleStage} onValueChange={(v) => setForm(p => ({ ...p, lifecycleStage: v }))}>
                      <SelectTrigger className="rounded-xl bg-muted/30 border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">{STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.toUpperCase()}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Lead Status</Label>
                    <Select value={form.leadStatus} onValueChange={(v) => setForm(p => ({ ...p, leadStatus: v }))}>
                      <SelectTrigger className="rounded-xl bg-muted/30 border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">{LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Lead Source</Label><Input {...f("leadSource")} placeholder="CRM, Website, Referral..." className="rounded-xl bg-muted/30 border-border/50" /></div>
                </div>
              </TabsContent>

              <TabsContent value="logistics" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-xs font-semibold">Decision Maker Role</Label><Input {...f("decisionMakerRole")} placeholder="Final Decision Maker" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Freight Volume</Label><Input {...f("freightVolume")} placeholder="50+ loads/month" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Customer Type</Label>
                    <Select value={form.customerType || "none"} onValueChange={(v) => setForm(p => ({ ...p, customerType: v === "none" ? "" : v }))}>
                      <SelectTrigger className="rounded-xl bg-muted/30 border-border/50"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none">Not specified</SelectItem>
                        <SelectItem value="Shipper">Shipper</SelectItem>
                        <SelectItem value="Carrier">Carrier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Payment Responsibility</Label><Input {...f("paymentResponsibility")} placeholder="Net 30" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Preferred Contact Method</Label>
                    <Select value={form.preferredContactMethod || "none"} onValueChange={(v) => setForm(p => ({ ...p, preferredContactMethod: v === "none" ? "" : v }))}>
                      <SelectTrigger className="rounded-xl bg-muted/30 border-border/50"><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none">Not specified</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Phone">Phone</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="social" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-xs font-semibold">Twitter/X Handle</Label><Input {...f("twitterHandle")} placeholder="@handle" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Facebook Profile</Label><Input {...f("facebookProfile")} placeholder="https://facebook.com/..." className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Instagram Profile</Label><Input {...f("instagramProfile")} placeholder="@handle" className="rounded-xl bg-muted/30 border-border/50" /></div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 space-y-2">
              <Label className="text-xs font-semibold">Notes</Label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Additional notes about this contact..."
                className="w-full min-h-[80px] rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </ScrollArea>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="rounded-xl shadow-sm">
              {createMutation.isPending ? "Creating..." : "Create Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
