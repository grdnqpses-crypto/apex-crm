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
import { Search, UserPlus, Mail, Phone, MoreHorizontal, Trash2, Upload, Download, Users, Building2, Plus, CheckSquare, Square, Tag, UserCheck, Workflow, Sparkles, Pencil, Link2, ShieldCheck, Activity, Ban, MessageSquare, MessageCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";

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
  const [dupCheckEmail, setDupCheckEmail] = useState("");
  const { data: dupCheck } = trpc.contacts.list.useQuery(
    { search: dupCheckEmail, limit: 3 },
    { enabled: dupCheckEmail.length > 4 && dupCheckEmail.includes("@") }
  );
  const dupMatches = (dupCheck?.items || []).filter((c: any) => c.email?.toLowerCase() === dupCheckEmail.toLowerCase());
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
  const [showImport, setShowImport] = useState(false);
  const [importCsv, setImportCsv] = useState("");
  const importMutation = trpc.contacts.importCsv.useMutation({
    onSuccess: (d) => { utils.contacts.list.invalidate(); toast.success(`Imported ${d.imported} contacts`); setShowImport(false); setImportCsv(""); },
    onError: (e: any) => toast.error(e.message),
  });
  const exportQuery = trpc.contacts.exportCsv.useQuery(undefined, { enabled: false });
  const handleExport = async () => {
    const result = await exportQuery.refetch();
    if (!result.data) return;
    const blob = new Blob([result.data.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "contacts.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${result.data.count} contacts`);
  };
  const handleImportSubmit = () => {
    const lines = importCsv.trim().split("\n");
    if (lines.length < 2) { toast.error("CSV must have a header row and at least one data row"); return; }
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, ""));
    const rows = lines.slice(1).map(line => {
      const vals = line.split(",");
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = vals[i]?.trim() ?? ""; });
      return {
        firstName: obj["firstname"] || obj["first_name"] || obj["first"] || "",
        lastName: obj["lastname"] || obj["last_name"] || obj["last"] || "",
        email: obj["email"] || "",
        phone: obj["phone"] || obj["directphone"] || obj["direct_phone"] || "",
        jobTitle: obj["jobtitle"] || obj["job_title"] || obj["title"] || "",
        company: obj["company"] || obj["companyname"] || "",
        city: obj["city"] || "",
        state: obj["state"] || obj["stateregion"] || "",
        country: obj["country"] || "",
      };
    });
    importMutation.mutate({ rows });
  };

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
    if (!form.email.trim()) { toast.error("Email is required — every contact must have a valid email address."); return; }
    const phoneVal = form.directPhone.trim() || form.mobilePhone.trim();
    if (!phoneVal) { toast.error("Phone number is required — enter a Direct Phone or Mobile Phone."); return; }
    const payload: Record<string, any> = { firstName: form.firstName, companyId: parseInt(form.companyId) };
    Object.entries(form).forEach(([k, v]) => {
      if (v && k !== "firstName" && k !== "companyId") payload[k] = v;
    });
    createMutation.mutate(payload as any);
  };

  // Completeness score for contacts
  const getContactScore = (c: any): number => {
    const fields = [c.firstName, c.lastName, c.email, c.directPhone || c.mobilePhone,
      c.jobTitle, c.companyId, c.lifecycleStage, c.leadStatus, c.linkedinUrl, c.city];
    const filled = fields.filter(f => f && String(f).trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  };
  const [contactTab, setContactTab] = useState<"all" | "incomplete">("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const bulkDeleteContacts = trpc.contacts.bulkDelete.useMutation({
    onSuccess: (d) => { utils.contacts.list.invalidate(); setSelectedIds(new Set()); toast.success(`Deleted ${d.deleted} contacts`); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteAllContactsMutation = trpc.contacts.deleteAll.useMutation({
    onSuccess: () => { utils.contacts.list.invalidate(); setSelectedIds(new Set()); toast.success("All contacts deleted"); },
    onError: (e: any) => toast.error(e.message),
  });
  const [dncContact, setDncContact] = useState<{ id: number; name: string; current: boolean } | null>(null);
  const [dncReason, setDncReason] = useState("");
  const setDoNotContact = trpc.contacts.setDoNotContact.useMutation({
    onSuccess: () => { utils.contacts.list.invalidate(); setDncContact(null); setDncReason(""); toast.success("Do Not Contact status updated"); },
    onError: (e) => toast.error(e.message),
  });
  const bulkUpdateContacts = trpc.bulkActions.updateContacts.useMutation({
    onSuccess: (d) => { utils.contacts.list.invalidate(); setSelectedIds(new Set()); toast.success(`Updated ${d.updated} contacts`); },
    onError: (e: any) => toast.error(e.message),
  });
  const fillSmartProps = trpc.bulkActions.fillSmartProperties.useMutation({
    onSuccess: (d) => { utils.contacts.list.invalidate(); setSelectedIds(new Set()); toast.success(`Smart properties filled for ${d.processed} contacts (${d.filled} fields inferred)`); },
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
  const [bulkTagDialog, setBulkTagDialog] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [bulkStatusDialog, setBulkStatusDialog] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState("Cold");
  const [bulkSmsDialog, setBulkSmsDialog] = useState(false);
  const [bulkSmsBody, setBulkSmsBody] = useState("");
  const [bulkWhatsappDialog, setBulkWhatsappDialog] = useState(false);
  const [bulkWhatsappBody, setBulkWhatsappBody] = useState("");
  const bulkSmsSendMutation = trpc.sms.bulkSend.useMutation({
    onSuccess: (d) => { utils.contacts.list.invalidate(); setSelectedIds(new Set()); setBulkSmsDialog(false); setBulkSmsBody(""); toast.success(`SMS sent to ${d.sent} contacts (${d.failed} failed)`); },
    onError: (e: any) => toast.error(e.message),
  });
  const bulkWhatsappSendMutation = trpc.whatsapp.bulkSend.useMutation({
    onSuccess: (d) => { utils.contacts.list.invalidate(); setSelectedIds(new Set()); setBulkWhatsappDialog(false); setBulkWhatsappBody(""); toast.success(`WhatsApp sent to ${d.sent} contacts (${d.failed} failed)`); },
    onError: (e: any) => toast.error(e.message),
  });
  const trackActivityMutation = trpc.bulkActions.trackBulkActivity.useMutation({
    onSuccess: (d) => { utils.contacts.list.invalidate(); setSelectedIds(new Set()); setBulkActivityDialog(false); setBulkActivityForm({ activityType: "note", subject: "", body: "" }); toast.success(`Activity logged for ${d.logged} contacts`); },
    onError: (e: any) => toast.error(e.message),
  });
  const visibleContacts = (contactTab === "incomplete" ? data?.items?.filter(c => getContactScore(c) < 70) : data?.items) ?? [];
  const toggleSelect = (id: number, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const toggleSelectAll = () => { if (selectedIds.size === visibleContacts.length && visibleContacts.length > 0) { setSelectedIds(new Set()); } else { setSelectedIds(new Set(visibleContacts.map(c => c.id))); } };

  // Build a lookup for company names
  const companyMap = useMemo(() => {
    const map: Record<number, string> = {};
    companiesData?.items?.forEach((c: any) => { map[c.id] = c.name; });
    return map;
  }, [companiesData]);

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.contactsPage} />
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
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={handleExport} disabled={exportQuery.isFetching}>
            <Download className="h-4 w-4" /> {exportQuery.isFetching ? "Exporting..." : "Export"}
          </Button>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2 rounded-xl shadow-sm">
            <UserPlus className="h-4 w-4" /> Add Contact
          </Button>
        </div>
      </div>

      {/* ─── Completeness Filter Tabs ─── */}
      <div className="flex gap-2">
        <button onClick={() => setContactTab("all")} className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${contactTab === "all" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
          All Contacts <span className="ml-1 opacity-70">{data?.total ?? 0}</span>
        </button>
        <button onClick={() => setContactTab("incomplete")} className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${contactTab === "incomplete" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}>
          ⚠ Incomplete <span className="ml-1 opacity-70">{data?.items?.filter(c => getContactScore(c) < 70).length ?? 0}</span>
        </button>
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

      {/* ─── Bulk Action Toolbar ─── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-semibold text-primary mr-1">{selectedIds.size} selected</span>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => toast.info(`Enriching ${selectedIds.size} contacts with AI data (Lead Enrichment — paid service)`)}>
            <Sparkles className="h-3.5 w-3.5 text-purple-500" /> Enrich
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" disabled={fillSmartProps.isPending} onClick={() => fillSmartProps.mutate({ ids: Array.from(selectedIds), entityType: "contacts" })}>
            <Pencil className="h-3.5 w-3.5 text-blue-500" /> {fillSmartProps.isPending ? "Filling..." : "Fill Smart Properties"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => { if (confirm(`Assign ${selectedIds.size} contacts to yourself?`)) bulkUpdateContacts.mutate({ ids: Array.from(selectedIds), updates: {} }); }}>
            <UserCheck className="h-3.5 w-3.5" /> Assign
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => toast.info(`Bulk edit ${selectedIds.size} contacts — coming soon`)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => toast.info(`Reviewing associations for ${selectedIds.size} contacts...`)}>
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
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => toast.info(`Checking enrichment coverage for ${selectedIds.size} contacts...`)}>
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> Check Coverage
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => setBulkActivityDialog(true)}>
            <Activity className="h-3.5 w-3.5 text-rose-500" /> Track Activity
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => setBulkTagDialog(true)}>
            <Tag className="h-3.5 w-3.5 text-blue-500" /> Add Tags
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => setBulkStatusDialog(true)}>
            <UserCheck className="h-3.5 w-3.5 text-green-500" /> Set Status
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => setBulkSmsDialog(true)}>
            <MessageSquare className="h-3.5 w-3.5 text-blue-500" /> Send SMS
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => setBulkWhatsappDialog(true)}>
            <MessageCircle className="h-3.5 w-3.5 text-green-600" /> Send WhatsApp
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8 text-orange-600 border-orange-300" onClick={() => { if (confirm(`Mark ${selectedIds.size} contacts as Do Not Contact?`)) bulkUpdateContacts.mutate({ ids: Array.from(selectedIds), updates: { leadStatus: "do_not_contact" } }); }}>
            <Ban className="h-3.5 w-3.5" /> Mark DNC
          </Button>
          <Button variant="destructive" size="sm" className="gap-1.5 rounded-xl text-xs h-8" disabled={bulkDeleteContacts.isPending} onClick={() => { if (confirm(`Delete ${selectedIds.size} selected contacts? This cannot be undone.`)) bulkDeleteContacts.mutate({ ids: Array.from(selectedIds) }); }}>
            <Trash2 className="h-3.5 w-3.5" /> {bulkDeleteContacts.isPending ? "Deleting..." : "Delete Selected"}
          </Button>
          <Button variant="destructive" size="sm" className="gap-1.5 rounded-xl text-xs h-8 opacity-80" disabled={deleteAllContactsMutation.isPending} onClick={() => { if (confirm(`DELETE ALL ${data?.total ?? 0} contacts? This cannot be undone.`)) deleteAllContactsMutation.mutate(); }}>
            <Trash2 className="h-3.5 w-3.5" /> {deleteAllContactsMutation.isPending ? "Deleting All..." : "Delete All"}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* ─── Contacts Table ─── */}
      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent bg-muted/30">
                <TableHead className="w-10 py-3.5">
                  <Checkbox
                    checked={visibleContacts.length > 0 && selectedIds.size === visibleContacts.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 py-3.5">Name</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Company</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Email</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Phone</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Stage</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">Lead Score</TableHead>
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
                (contactTab === "incomplete" ? data?.items.filter(c => getContactScore(c) < 70) : data?.items)?.map((contact) => (
                  <TableRow key={contact.id} className={`border-border/30 cursor-pointer hover:bg-accent/30 transition-colors group ${selectedIds.has(contact.id) ? 'bg-primary/5' : ''}`} onClick={() => setLocation(`/contacts/${contact.id}`)}>                    
                    <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
                      <Checkbox checked={selectedIds.has(contact.id)} onCheckedChange={() => setSelectedIds(prev => { const n = new Set(prev); n.has(contact.id) ? n.delete(contact.id) : n.add(contact.id); return n; })} aria-label="Select contact" />
                    </TableCell>
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
                      {(() => { const s = (contact as any).leadScore ?? 0; return s > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${s >= 70 ? 'text-emerald-500' : s >= 40 ? 'text-amber-500' : 'text-red-400'}`}>{s}</span>
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${s >= 70 ? 'bg-emerald-500' : s >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${Math.min(s, 100)}%` }} /></div>
                        </div>
                      ) : <span className="text-xs text-muted-foreground/40">&mdash;</span>; })()}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="secondary" className={`text-[10px] font-semibold rounded-lg ${STATUS_COLORS[contact.leadStatus as string] ?? "bg-muted/60 text-muted-foreground"}`}>
                          {contact.leadStatus}
                        </Badge>
                        {(() => { const s = getContactScore(contact); return (
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDncContact({ id: contact.id, name: `${contact.firstName} ${contact.lastName ?? ''}`.trim(), current: !!(contact as any).doNotContact }); setDncReason((contact as any).doNotContactReason ?? ''); }}>
                            <Ban className="mr-2 h-4 w-4 text-orange-500" /> {(contact as any).doNotContact ? 'Remove DNC Flag' : 'Mark Do Not Contact'}
                          </DropdownMenuItem>
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
            <DialogDescription>Every contact must belong to a company and have a valid email and phone number. Fields marked * are required.</DialogDescription>
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
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Email *</Label>
                    <Input type="email" {...f("email")} placeholder="john@company.com" className="rounded-xl bg-muted/30 border-border/50" onChange={(e) => { setForm(p => ({ ...p, email: e.target.value })); setDupCheckEmail(e.target.value); }} />
                    {dupMatches.length > 0 && (
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                        <span className="text-amber-500 mt-0.5">⚠</span>
                        <div>
                          <p className="font-semibold text-amber-600">Possible duplicate detected</p>
                          {dupMatches.map((m: any) => (
                            <p key={m.id} className="text-muted-foreground">{m.firstName} {m.lastName} — {m.email}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Direct Phone *</Label><Input {...f("directPhone")} placeholder="+1 555 0123" className="rounded-xl bg-muted/30 border-border/50" /></div>
                  <div className="space-y-2"><Label className="text-xs font-semibold">Mobile Phone *</Label><Input {...f("mobilePhone")} placeholder="+1 555 0456" className="rounded-xl bg-muted/30 border-border/50" /></div>
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
      {/* Bulk Add Tags Dialog */}
      <Dialog open={bulkTagDialog} onOpenChange={setBulkTagDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Tags to {selectedIds.size} Contacts</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <Label>Tags (comma-separated)</Label>
            <Input placeholder="e.g. vip, hot-lead, q4-prospect" value={bulkTagInput} onChange={e => setBulkTagInput(e.target.value)} className="rounded-xl" />
            <p className="text-xs text-muted-foreground">These tags will be added to all selected contacts.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkTagDialog(false)} className="rounded-xl">Cancel</Button>
            <Button disabled={!bulkTagInput.trim() || bulkUpdateContacts.isPending} onClick={() => {
              const tags = bulkTagInput.split(",").map(t => t.trim()).filter(Boolean);
              bulkUpdateContacts.mutate({ ids: Array.from(selectedIds), updates: { tags } }, { onSuccess: () => { setBulkTagDialog(false); setBulkTagInput(""); setSelectedIds(new Set()); } });
            }} className="rounded-xl">{bulkUpdateContacts.isPending ? "Applying..." : `Apply Tags to ${selectedIds.size} Contacts`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Bulk Set Status Dialog */}
      <Dialog open={bulkStatusDialog} onOpenChange={setBulkStatusDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Set Status for {selectedIds.size} Contacts</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <Label>New Lead Status</Label>
            <Select value={bulkStatusValue} onValueChange={setBulkStatusValue}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStatusDialog(false)} className="rounded-xl">Cancel</Button>
            <Button disabled={bulkUpdateContacts.isPending} onClick={() => {
              bulkUpdateContacts.mutate({ ids: Array.from(selectedIds), updates: { leadStatus: bulkStatusValue } }, { onSuccess: () => { setBulkStatusDialog(false); setSelectedIds(new Set()); } });
            }} className="rounded-xl">{bulkUpdateContacts.isPending ? "Updating..." : `Update ${selectedIds.size} Contacts`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Bulk Create Tasks Dialog */}
      <Dialog open={bulkTaskDialog} onOpenChange={setBulkTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Tasks for {selectedIds.size} Contacts</DialogTitle>
            <DialogDescription>A task will be created for each selected contact.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Task Title *</Label>
              <Input value={bulkTaskForm.title} onChange={e => setBulkTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="Follow up with contact" className="rounded-xl" />
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
              <textarea value={bulkTaskForm.notes} onChange={e => setBulkTaskForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional context for this task..." className="w-full min-h-[80px] rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setBulkTaskDialog(false)} className="rounded-xl">Cancel</Button>
            <Button disabled={!bulkTaskForm.title.trim() || createBulkTasksMutation.isPending} onClick={() => createBulkTasksMutation.mutate({ ids: Array.from(selectedIds), entityType: "contacts", title: bulkTaskForm.title, taskType: bulkTaskForm.taskType, priority: bulkTaskForm.priority, notes: bulkTaskForm.notes || undefined })} className="rounded-xl">
              {createBulkTasksMutation.isPending ? "Creating..." : `Create ${selectedIds.size} Tasks`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Bulk Track Activity Dialog */}
      <Dialog open={bulkActivityDialog} onOpenChange={setBulkActivityDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Activity for {selectedIds.size} Contacts</DialogTitle>
            <DialogDescription>An activity entry will be logged against each selected contact.</DialogDescription>
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
              <Input value={bulkActivityForm.subject} onChange={e => setBulkActivityForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Initial outreach call" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Details (optional)</Label>
              <textarea value={bulkActivityForm.body} onChange={e => setBulkActivityForm(p => ({ ...p, body: e.target.value }))} placeholder="Notes about this activity..." className="w-full min-h-[80px] rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setBulkActivityDialog(false)} className="rounded-xl">Cancel</Button>
            <Button disabled={!bulkActivityForm.subject.trim() || trackActivityMutation.isPending} onClick={() => trackActivityMutation.mutate({ ids: Array.from(selectedIds), entityType: "contacts", activityType: bulkActivityForm.activityType, subject: bulkActivityForm.subject, body: bulkActivityForm.body || undefined })} className="rounded-xl">
              {trackActivityMutation.isPending ? "Logging..." : `Log Activity for ${selectedIds.size} Contacts`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* CSV Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Contacts from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground">Paste CSV content below. First row must be headers. Supported columns: firstName, lastName, email, phone, jobTitle, company, city, state, country.</p>
            <textarea
              className="w-full h-48 text-xs font-mono border rounded-md p-2 bg-secondary/20 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder={"firstName,lastName,email,phone,jobTitle,company\nJohn,Doe,john@acme.com,555-1234,CEO,Acme Inc"}
              value={importCsv}
              onChange={e => setImportCsv(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" onClick={() => setShowImport(false)}>Cancel</Button>
            <Button onClick={handleImportSubmit} disabled={!importCsv.trim() || importMutation.isPending}>
              {importMutation.isPending ? "Importing..." : "Import"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Send SMS Dialog */}
      <Dialog open={bulkSmsDialog} onOpenChange={setBulkSmsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send SMS to {selectedIds.size} Contacts</DialogTitle>
            <DialogDescription>SMS will be sent to all selected contacts with valid mobile phone numbers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Message *</Label>
              <textarea value={bulkSmsBody} onChange={e => setBulkSmsBody(e.target.value)} placeholder="Enter your SMS message (max 1600 characters)" maxLength={1600} className="w-full min-h-[100px] rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="text-xs text-muted-foreground">{bulkSmsBody.length}/1600 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBulkSmsDialog(false); setBulkSmsBody(""); }} className="rounded-xl">Cancel</Button>
            <Button disabled={!bulkSmsBody.trim() || bulkSmsSendMutation.isPending} onClick={() => bulkSmsSendMutation.mutate({ contactIds: Array.from(selectedIds), body: bulkSmsBody })} className="rounded-xl">
              {bulkSmsSendMutation.isPending ? "Sending..." : `Send SMS to ${selectedIds.size} Contacts`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Bulk Send WhatsApp Dialog */}
      <Dialog open={bulkWhatsappDialog} onOpenChange={setBulkWhatsappDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send WhatsApp to {selectedIds.size} Contacts</DialogTitle>
            <DialogDescription>WhatsApp messages will be sent to all selected contacts with valid mobile phone numbers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Message *</Label>
              <textarea value={bulkWhatsappBody} onChange={e => setBulkWhatsappBody(e.target.value)} placeholder="Enter your WhatsApp message" className="w-full min-h-[100px] rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBulkWhatsappDialog(false); setBulkWhatsappBody(""); }} className="rounded-xl">Cancel</Button>
            <Button disabled={!bulkWhatsappBody.trim() || bulkWhatsappSendMutation.isPending} onClick={() => bulkWhatsappSendMutation.mutate({ contactIds: Array.from(selectedIds), body: bulkWhatsappBody })} className="rounded-xl">
              {bulkWhatsappSendMutation.isPending ? "Sending..." : `Send WhatsApp to ${selectedIds.size} Contacts`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Do Not Contact Dialog */}
      <Dialog open={!!dncContact} onOpenChange={(o) => { if (!o) { setDncContact(null); setDncReason(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Ban className="h-5 w-5 text-orange-500" /> {dncContact?.current ? 'Remove Do Not Contact' : 'Mark Do Not Contact'}</DialogTitle>
            <DialogDescription>{dncContact?.current ? `Remove the DNC flag from ${dncContact?.name}?` : `Mark ${dncContact?.name} as Do Not Contact. All future outreach will be blocked.`}</DialogDescription>
          </DialogHeader>
          {!dncContact?.current && (
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input placeholder="e.g. Requested no contact, Unsubscribed" value={dncReason} onChange={e => setDncReason(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDncContact(null); setDncReason(""); }}>Cancel</Button>
            <Button variant={dncContact?.current ? "default" : "destructive"} onClick={() => { if (dncContact) setDoNotContact.mutate({ id: dncContact.id, doNotContact: !dncContact.current, reason: dncReason || undefined }); }} disabled={setDoNotContact.isPending}>
              {setDoNotContact.isPending ? "Saving..." : dncContact?.current ? "Remove DNC" : "Mark DNC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
