import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, UserPlus, Mail, Phone, MoreHorizontal, Trash2, Upload, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const STAGES = ["subscriber", "lead", "mql", "sql", "opportunity", "customer", "evangelist"] as const;
const STAGE_COLORS: Record<string, string> = {
  subscriber: "bg-muted text-muted-foreground",
  lead: "bg-chart-1/15 text-chart-1",
  mql: "bg-chart-2/15 text-chart-2",
  sql: "bg-chart-3/15 text-chart-3",
  opportunity: "bg-chart-5/15 text-chart-5",
  customer: "bg-green-500/15 text-green-400",
  evangelist: "bg-primary/15 text-primary",
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
  "Hot": "bg-red-500/15 text-red-400",
  "Warm": "bg-orange-500/15 text-orange-400",
  "Cold": "bg-blue-500/15 text-blue-400",
  "Qualified": "bg-green-500/15 text-green-400",
  "Customer": "bg-emerald-500/15 text-emerald-400",
};

const emptyForm = {
  firstName: "", lastName: "", email: "", directPhone: "", mobilePhone: "",
  companyPhone: "", jobTitle: "", linkedinUrl: "", websiteUrl: "",
  streetAddress: "", addressLine2: "", city: "", stateRegion: "", postalCode: "", country: "", timezone: "",
  lifecycleStage: "lead", leadStatus: "Cold", leadSource: "CRM",
  decisionMakerRole: "", department: "", freightVolume: "", customerType: "", paymentResponsibility: "", preferredContactMethod: "",
  twitterHandle: "", facebookProfile: "", instagramProfile: "",
  notes: "",
};

export default function Contacts() {
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
  const createMutation = trpc.contacts.create.useMutation({
    onSuccess: () => { utils.contacts.list.invalidate(); setShowCreate(false); setForm({ ...emptyForm }); toast.success("Contact created"); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => { utils.contacts.list.invalidate(); toast.success("Contact deleted"); },
  });

  const [form, setForm] = useState({ ...emptyForm });
  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [key]: e.target.value })),
  });

  const handleCreate = () => {
    if (!form.firstName.trim()) { toast.error("First name is required"); return; }
    const payload: Record<string, any> = { firstName: form.firstName };
    Object.entries(form).forEach(([k, v]) => { if (v && k !== "firstName") payload[k] = v; });
    createMutation.mutate(payload as any);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} contacts total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("CSV import coming soon")}>
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("CSV export coming soon")}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" /> Add Contact
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/30" />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40 bg-secondary/30"><SelectValue placeholder="All stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.toUpperCase()}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56 bg-secondary/30"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lead Statuses</SelectItem>
            {LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stage</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lead Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.items.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No contacts found. Create your first contact to get started.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((contact) => (
                  <TableRow key={contact.id} className="border-border cursor-pointer hover:bg-secondary/30" onClick={() => setLocation(`/contacts/${contact.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">{contact.firstName.charAt(0)}{contact.lastName?.charAt(0) ?? ""}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{contact.firstName} {contact.lastName ?? ""}</p>
                          {contact.jobTitle && <p className="text-xs text-muted-foreground">{contact.jobTitle}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.email ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate max-w-[180px]">{contact.email}</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell>
                      {contact.directPhone ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />{contact.directPhone}
                        </div>
                      ) : <span className="text-xs text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] font-semibold uppercase ${STAGE_COLORS[contact.lifecycleStage as string] ?? ""}`}>
                        {contact.lifecycleStage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] font-semibold ${STATUS_COLORS[contact.leadStatus as string] ?? "bg-secondary text-secondary-foreground"}`}>
                        {contact.leadStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-foreground">{contact.leadScore}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: contact.id }); }}>
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

      {/* Create Contact Dialog - Grouped by Category */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh]">
          <DialogHeader><DialogTitle>Add New Contact</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <Tabs defaultValue="identity" className="w-full">
              <TabsList className="bg-secondary/30 w-full flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="identity" className="text-xs">Identity</TabsTrigger>
                <TabsTrigger value="communication" className="text-xs">Communication</TabsTrigger>
                <TabsTrigger value="address" className="text-xs">Address</TabsTrigger>
                <TabsTrigger value="lifecycle" className="text-xs">Lifecycle</TabsTrigger>
                <TabsTrigger value="logistics" className="text-xs">Logistics</TabsTrigger>
                <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
              </TabsList>

              <TabsContent value="identity" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>First Name *</Label><Input {...f("firstName")} placeholder="John" className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>Last Name</Label><Input {...f("lastName")} placeholder="Doe" className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>Job Title</Label><Input {...f("jobTitle")} placeholder="VP of Operations" className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>Department</Label><Input {...f("department")} placeholder="Logistics" className="bg-secondary/30" /></div>
                </div>
              </TabsContent>

              <TabsContent value="communication" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Email</Label><Input type="email" {...f("email")} placeholder="john@company.com" className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>Direct Phone</Label><Input {...f("directPhone")} placeholder="+1 555 0123" className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>Mobile Phone</Label><Input {...f("mobilePhone")} placeholder="+1 555 0456" className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>Company Phone</Label><Input {...f("companyPhone")} placeholder="+1 555 0000" className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>LinkedIn URL</Label><Input {...f("linkedinUrl")} placeholder="https://linkedin.com/in/..." className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>Website URL</Label><Input {...f("websiteUrl")} placeholder="https://..." className="bg-secondary/30" /></div>
                </div>
              </TabsContent>

              <TabsContent value="address" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2"><Label>Street Address</Label><Input {...f("streetAddress")} placeholder="123 Main St" className="bg-secondary/30" /></div>
                  <div className="space-y-2 col-span-2"><Label>Address Line 2</Label><Input {...f("addressLine2")} placeholder="Suite 100" className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>City</Label><Input {...f("city")} placeholder="New York" className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>State/Region</Label><Input {...f("stateRegion")} placeholder="NY" className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>Postal Code</Label><Input {...f("postalCode")} placeholder="10001" className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>Country</Label><Input {...f("country")} placeholder="United States" className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>Timezone</Label><Input {...f("timezone")} placeholder="America/New_York" className="bg-secondary/30" /></div>
                </div>
              </TabsContent>

              <TabsContent value="lifecycle" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lifecycle Stage</Label>
                    <Select value={form.lifecycleStage} onValueChange={(v) => setForm(p => ({ ...p, lifecycleStage: v }))}>
                      <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                      <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.toUpperCase()}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Lead Status</Label>
                    <Select value={form.leadStatus} onValueChange={(v) => setForm(p => ({ ...p, leadStatus: v }))}>
                      <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                      <SelectContent>{LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Lead Source</Label><Input {...f("leadSource")} placeholder="CRM, Website, Referral..." className="bg-secondary/30" /></div>
                </div>
              </TabsContent>

              <TabsContent value="logistics" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Decision Maker Role</Label><Input {...f("decisionMakerRole")} placeholder="Final Decision Maker" className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>Freight Volume</Label><Input {...f("freightVolume")} placeholder="50+ loads/month" className="bg-secondary/30" /></div>
                  <div className="space-y-2">
                    <Label>Customer Type</Label>
                    <Select value={form.customerType || "none"} onValueChange={(v) => setForm(p => ({ ...p, customerType: v === "none" ? "" : v }))}>
                      <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        <SelectItem value="Shipper">Shipper</SelectItem>
                        <SelectItem value="Carrier">Carrier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Payment Responsibility</Label><Input {...f("paymentResponsibility")} placeholder="Net 30" className="bg-secondary/30" /></div>
                  <div className="space-y-2">
                    <Label>Preferred Contact Method</Label>
                    <Select value={form.preferredContactMethod || "none"} onValueChange={(v) => setForm(p => ({ ...p, preferredContactMethod: v === "none" ? "" : v }))}>
                      <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent>
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
                  <div className="space-y-2"><Label>Twitter/X Handle</Label><Input {...f("twitterHandle")} placeholder="@handle" className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>Facebook Profile</Label><Input {...f("facebookProfile")} placeholder="https://facebook.com/..." className="bg-secondary/30" /></div>
                  <div className="space-y-2"><Label>Instagram Profile</Label><Input {...f("instagramProfile")} placeholder="@handle" className="bg-secondary/30" /></div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 space-y-2">
              <Label>Notes</Label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Additional notes about this contact..."
                className="w-full min-h-[80px] rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
