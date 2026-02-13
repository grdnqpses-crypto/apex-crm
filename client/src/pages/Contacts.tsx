import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, UserPlus, Mail, Phone, MoreHorizontal, Trash2 } from "lucide-react";
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
  customer: "bg-success/15 text-success",
  evangelist: "bg-primary/15 text-primary",
};

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const searchInput = useMemo(() => ({
    search: search || undefined,
    stage: stageFilter !== "all" ? stageFilter : undefined,
    limit: 50,
  }), [search, stageFilter]);

  const { data, isLoading } = trpc.contacts.list.useQuery(searchInput);
  const createMutation = trpc.contacts.create.useMutation({
    onSuccess: () => { utils.contacts.list.invalidate(); setShowCreate(false); toast.success("Contact created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => { utils.contacts.list.invalidate(); toast.success("Contact deleted"); },
  });

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", title: "", lifecycleStage: "lead" as typeof STAGES[number], source: "" });

  const handleCreate = () => {
    if (!form.firstName.trim()) { toast.error("First name is required"); return; }
    createMutation.mutate({ ...form, email: form.email || undefined, phone: form.phone || undefined, title: form.title || undefined, source: form.source || undefined });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} contacts total</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" /> Add Contact
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/30" />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40 bg-secondary/30"><SelectValue placeholder="All stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.toUpperCase()}</SelectItem>)}
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
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score</TableHead>
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
                    No contacts found. Create your first contact to get started.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="border-border cursor-pointer hover:bg-secondary/30"
                    onClick={() => setLocation(`/contacts/${contact.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">{contact.firstName.charAt(0)}{contact.lastName?.charAt(0) ?? ""}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{contact.firstName} {contact.lastName ?? ""}</p>
                          {contact.title && <p className="text-xs text-muted-foreground">{contact.title}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.email ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />{contact.email}
                        </div>
                      ) : <span className="text-xs text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell>
                      {contact.phone ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />{contact.phone}
                        </div>
                      ) : <span className="text-xs text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] font-semibold uppercase ${STAGE_COLORS[contact.lifecycleStage] ?? ""}`}>
                        {contact.lifecycleStage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-foreground">{contact.leadScore}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Add New Contact</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input value={form.firstName} onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="John" className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={form.lastName} onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Doe" className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555 0123" className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="VP of Sales" className="bg-secondary/30" />
            </div>
            <div className="space-y-2">
              <Label>Lifecycle Stage</Label>
              <Select value={form.lifecycleStage} onValueChange={(v) => setForm(p => ({ ...p, lifecycleStage: v as any }))}>
                <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Source</Label>
              <Input value={form.source} onChange={(e) => setForm(p => ({ ...p, source: e.target.value }))} placeholder="Website, Referral, LinkedIn..." className="bg-secondary/30" />
            </div>
          </div>
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
