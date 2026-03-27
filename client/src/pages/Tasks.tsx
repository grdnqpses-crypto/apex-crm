import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Plus, Calendar, MoreHorizontal, Trash2, Phone, Mail, ClipboardList, RefreshCw, UserCheck,
  Building2, User, Target, Clock, Search, Briefcase, DollarSign, MessageSquare,
  FileText, Zap, BarChart2, Video, MapPin, Link2, Tag, AlertCircle, Eye,
  TrendingUp, Shield, Bell, Layers, ChevronRight, Edit2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useMemo, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";
import { useSkin } from "@/contexts/SkinContext";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-500/15 text-amber-400",
  high: "bg-red-500/15 text-red-400",
};

const TYPE_ICONS: Record<string, any> = {
  call: Phone,
  email: Mail,
  to_do: ClipboardList,
  follow_up: RefreshCw,
  meeting: Video,
  demo: Layers,
  proposal: FileText,
  whatsapp: MessageSquare,
  sms: MessageSquare,
};

const TYPE_COLORS: Record<string, string> = {
  call: "text-blue-400 bg-blue-500/10",
  email: "text-purple-400 bg-purple-500/10",
  to_do: "text-gray-400 bg-gray-500/10",
  follow_up: "text-amber-400 bg-amber-500/10",
  meeting: "text-green-400 bg-green-500/10",
  demo: "text-cyan-400 bg-cyan-500/10",
  proposal: "text-pink-400 bg-pink-500/10",
  whatsapp: "text-emerald-400 bg-emerald-500/10",
  sms: "text-indigo-400 bg-indigo-500/10",
};

const QUEUES = ["Prospecting Calls", "Customer Renewals", "Carrier Setup", "Follow-ups", "Onboarding", "General", "Demo Pipeline", "Proposal Review", "WhatsApp Broadcasts"];

const FORECAST_CATEGORIES = ["Pipeline", "Best Case", "Commit", "Closed Won", "Closed Lost", "Omitted"];

const BUSINESS_CATEGORIES = [
  "Freight Broker", "Carrier", "Shipper", "3PL", "Warehouse", "Last Mile",
  "Intermodal", "Customs Broker", "NVOCC", "Freight Forwarder", "Cold Chain",
  "Hazmat", "Oversized/Heavy Haul", "Expedited", "LTL", "FTL", "Parcel"
];

const BUSINESS_TYPES = [
  "Prospect", "Customer", "Partner", "Vendor", "Competitor", "Investor", "Other"
];

const EMPTY_FORM = {
  title: "",
  taskType: "to_do" as string,
  priority: "medium" as string,
  description: "",
  dueDate: "",
  dueTime: "",
  startDate: "",
  followUpDate: "",
  queue: "",
  contactId: null as number | null,
  companyId: null as number | null,
  dealId: null as number | null,
  campaignId: null as number | null,
  pipelineId: null as number | null,
  workflowId: null as number | null,
  isRecurring: false,
  recurringFrequency: "",
  // Meeting
  meetingDate: "",
  meetingLocation: "",
  meetingAgenda: "",
  meetingAttendees: "",
  // Commercial
  productName: "",
  proposalUrl: "",
  revenueAmount: "",
  revenueCurrency: "USD",
  whatsappNumber: "",
  // Business
  businessCategory: "",
  businessType: "",
  // Forecast
  forecastCategory: "",
  forecastCloseDate: "",
  // Documents
  documents: [] as { name: string; url: string; type: string }[],
};

export default function Tasks() {
  const { t } = useSkin();
  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const TASK_TEMPLATES = [
    { label: "Follow-up Call", type: "call", title: "Follow-up call", priority: "medium", description: "Check in with contact after initial meeting", isRecurring: false, recurringFrequency: "" },
    { label: "Send Proposal", type: "email", title: "Send proposal email", priority: "high", description: "Send the proposal document and follow up", isRecurring: false, recurringFrequency: "" },
    { label: "Discovery Meeting", type: "meeting", title: "Discovery meeting", priority: "high", description: "Understand client needs and pain points", isRecurring: false, recurringFrequency: "" },
    { label: "Contract Review", type: "task", title: "Review and send contract", priority: "urgent", description: "Prepare contract for signature", isRecurring: false, recurringFrequency: "" },
    { label: "Monthly Check-In", type: "call", title: "Monthly check-in call", priority: "low", description: "Routine relationship maintenance call", isRecurring: true, recurringFrequency: "monthly" },
    { label: "Onboarding Call", type: "call", title: "Onboarding kickoff call", priority: "high", description: "Walk new client through the onboarding process", isRecurring: false, recurringFrequency: "" },
    { label: "Renewal Reminder", type: "task", title: "Renewal discussion", priority: "high", description: "Discuss contract renewal and upsell opportunities", isRecurring: false, recurringFrequency: "" },
    { label: "Product Demo", type: "meeting", title: "Product demo", priority: "high", description: "Walk prospect through product features", isRecurring: false, recurringFrequency: "" },
  ];
  const [editingTask, setEditingTask] = useState<any>(null);
  const [viewingTask, setViewingTask] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [queueFilter, setQueueFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();

  const taskInput = useMemo(() => ({
    status: statusFilter !== "all" ? statusFilter : undefined,
    taskType: typeFilter !== "all" ? typeFilter : undefined,
    queue: queueFilter !== "all" ? queueFilter : undefined,
    limit: 200,
  }), [statusFilter, typeFilter, queueFilter]);

  const { data, isLoading } = trpc.tasks.list.useQuery(taskInput);
  const { data: contacts } = trpc.contacts.list.useQuery({ limit: 200 });
  const { data: companies } = trpc.companies.list.useQuery({ limit: 200 });
  const { data: dealsData } = trpc.deals.list.useQuery({ limit: 100 });
  const { data: pipelinesData } = trpc.pipelines.list.useQuery();
  const { data: campaignsData } = trpc.campaigns.list.useQuery({ limit: 50 });
  const { data: workflowsData } = trpc.workflows.list.useQuery();
  const { data: battleCardsData } = trpc.battleCards.list.useQuery({ limit: 50 });
  const { data: teamMembersData } = trpc.teamOversight.getTeamCredentials.useQuery();
  const [reassignTaskId, setReassignTaskId] = useState<number | null>(null);

  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.stats.invalidate();
      setShowCreate(false);
      setForm({ ...EMPTY_FORM });
      toast.success("Task created successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.stats.invalidate();
      setEditingTask(null);
      toast.success("Task updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Task deleted");
    },
  });
  const bulkDeleteTasks = trpc.bulkActions.deleteTasks.useMutation({
    onSuccess: (res) => { utils.tasks.list.invalidate(); utils.dashboard.stats.invalidate(); setSelectedTaskIds(new Set()); toast.success(`${res.deleted} tasks deleted`); },
    onError: (e) => toast.error(e.message),
  });
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const toggleTaskSelect = (id: number) => setSelectedTaskIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const setF = useCallback((key: string, value: any) => setForm(p => ({ ...p, [key]: value })), []);
  const [taskTab, setTaskTab] = useState("details");

  const buildPayload = (f: typeof EMPTY_FORM) => ({
    title: f.title,
    taskType: f.taskType as any,
    priority: f.priority as any,
    description: f.description || undefined,
    dueDate: f.dueDate ? new Date(f.dueDate).getTime() : undefined,
    dueTime: f.dueTime || undefined,
    startDate: f.startDate ? new Date(f.startDate).getTime() : undefined,
    followUpDate: f.followUpDate ? new Date(f.followUpDate).getTime() : undefined,
    queue: f.queue || undefined,
    contactId: f.contactId ?? undefined,
    companyId: f.companyId ?? undefined,
    dealId: f.dealId ?? undefined,
    campaignId: f.campaignId ?? undefined,
    pipelineId: f.pipelineId ?? undefined,
    workflowId: f.workflowId ?? undefined,
    isRecurring: f.isRecurring,
    recurringFrequency: f.recurringFrequency || undefined,
    meetingDate: f.meetingDate ? new Date(f.meetingDate).getTime() : undefined,
    meetingLocation: f.meetingLocation || undefined,
    meetingAgenda: f.meetingAgenda || undefined,
    meetingAttendees: f.meetingAttendees || undefined,
    productName: f.productName || undefined,
    proposalUrl: f.proposalUrl || undefined,
    revenueAmount: f.revenueAmount ? parseFloat(f.revenueAmount) : undefined,
    revenueCurrency: f.revenueCurrency || "USD",
    whatsappNumber: f.whatsappNumber || undefined,
    businessCategory: f.businessCategory || undefined,
    businessType: f.businessType || undefined,
    forecastCategory: f.forecastCategory || undefined,
    forecastCloseDate: f.forecastCloseDate ? new Date(f.forecastCloseDate).getTime() : undefined,
    documents: f.documents.length > 0 ? JSON.stringify(f.documents) : undefined,
  });

  const handleCreate = () => {
    if (!form.title.trim()) { toast.error("Task title is required"); return; }
    if (!form.companyId) { toast.error("A task must be linked to a company — please select one"); return; }
    createMutation.mutate(buildPayload(form));
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setForm({
      title: task.title ?? "",
      taskType: task.taskType ?? "to_do",
      priority: task.priority ?? "medium",
      description: task.description ?? "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      dueTime: task.dueTime ?? "",
      startDate: task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "",
      followUpDate: task.followUpDate ? new Date(task.followUpDate).toISOString().split("T")[0] : "",
      queue: task.queue ?? "",
      contactId: task.contactId ?? null,
      companyId: task.companyId ?? null,
      dealId: task.dealId ?? null,
      campaignId: task.campaignId ?? null,
      pipelineId: task.pipelineId ?? null,
      workflowId: task.workflowId ?? null,
      isRecurring: task.isRecurring ?? false,
      recurringFrequency: task.recurringFrequency ?? "",
      meetingDate: task.meetingDate ? new Date(task.meetingDate).toISOString().split("T")[0] : "",
      meetingLocation: task.meetingLocation ?? "",
      meetingAgenda: task.meetingAgenda ?? "",
      meetingAttendees: task.meetingAttendees ?? "",
      productName: task.productName ?? "",
      proposalUrl: task.proposalUrl ?? "",
      revenueAmount: task.revenueAmount ? String(task.revenueAmount) : "",
      revenueCurrency: task.revenueCurrency ?? "USD",
      whatsappNumber: task.whatsappNumber ?? "",
      businessCategory: task.businessCategory ?? "",
      businessType: task.businessType ?? "",
      forecastCategory: task.forecastCategory ?? "",
      forecastCloseDate: task.forecastCloseDate ? new Date(task.forecastCloseDate).toISOString().split("T")[0] : "",
      documents: task.documents ? JSON.parse(task.documents) : [],
    });
  };

  const handleUpdate = () => {
    if (!editingTask) return;
    if (!form.title.trim()) { toast.error("Task title is required"); return; }
    updateMutation.mutate({ id: editingTask.id, ...buildPayload(form) });
  };

  const filteredTasks = data?.items?.filter(task => {
    if (!search) return true;
    const s = search.toLowerCase();
    return task.title.toLowerCase().includes(s) ||
      (task.description && task.description.toLowerCase().includes(s)) ||
      (task.productName && task.productName.toLowerCase().includes(s)) ||
      (task.businessCategory && task.businessCategory.toLowerCase().includes(s));
  }) ?? [];

  const pendingCount = data?.items?.filter(t => t.status === "not_started").length ?? 0;
  const completedCount = data?.items?.filter(t => t.status === "completed").length ?? 0;
  const overdueCount = data?.items?.filter(t => t.dueDate && t.status !== "completed" && t.dueDate < Date.now()).length ?? 0;

  const getContactName = (id: number | null) => {
    if (!id) return null;
    const c = contacts?.items?.find((x: any) => x.id === id);
    return c ? `${c.firstName} ${c.lastName ?? ""}`.trim() : `#${id}`;
  };
  const getCompanyName = (id: number | null) => {
    if (!id) return null;
    const c = companies?.items?.find((x: any) => x.id === id);
    return c ? c.name : `#${id}`;
  };
  const getDealName = (id: number | null) => {
    if (!id) return null;
    const d = dealsData?.items?.find((x: any) => x.id === id);
    return d ? d.name : `#${id}`;
  };
  const getPipelineName = (id: number | null) => {
    if (!id) return null;
    const p = pipelinesData?.find((x: any) => x.id === id);
    return p ? p.name : `#${id}`;
  };
  const getCampaignName = (id: number | null) => {
    if (!id) return null;
    const c = campaignsData?.items?.find((x: any) => x.id === id);
    return c ? c.name : `#${id}`;
  };

  const TaskForm = () => (
    <Tabs value={taskTab} onValueChange={setTaskTab} className="w-full">
      <TabsList className="bg-secondary/30 w-full grid grid-cols-6 text-[10px]">
        <TabsTrigger value="details" className="text-[10px]">Details</TabsTrigger>
        <TabsTrigger value="links" className="text-[10px]">Links</TabsTrigger>
        <TabsTrigger value="schedule" className="text-[10px]">Schedule</TabsTrigger>
        <TabsTrigger value="meeting" className="text-[10px]">Meeting</TabsTrigger>
        <TabsTrigger value="commercial" className="text-[10px]">Revenue</TabsTrigger>
        <TabsTrigger value="intel" className="text-[10px]">Intel</TabsTrigger>
      </TabsList>

      {/* ── DETAILS ── */}
      <TabsContent value="details" className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label>Task Title <span className="text-destructive">*</span></Label>
          <Input value={form.title} onChange={e => setF("title", e.target.value)} placeholder="e.g. Call shipping manager about new lane" className="bg-secondary/30" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Task Type</Label>
            <Select value={form.taskType} onValueChange={v => setF("taskType", v)}>
              <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="call">📞 Call</SelectItem>
                <SelectItem value="email">📧 Email</SelectItem>
                <SelectItem value="to_do">✅ To-do</SelectItem>
                <SelectItem value="follow_up">🔄 Follow-up</SelectItem>
                <SelectItem value="meeting">🎥 Meeting</SelectItem>
                <SelectItem value="demo">🖥️ Demo</SelectItem>
                <SelectItem value="proposal">📄 Proposal</SelectItem>
                <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                <SelectItem value="sms">📱 SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={v => setF("priority", v)}>
              <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Low</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="high">🔴 High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Company Category</Label>
            <Select value={form.businessCategory || "none"} onValueChange={v => setF("businessCategory", v === "none" ? "" : v)}>
              <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {BUSINESS_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Company Status</Label>
            <Select value={form.businessType || "none"} onValueChange={v => setF("businessType", v === "none" ? "" : v)}>
              <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {BUSINESS_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Queue</Label>
          <Select value={form.queue || "none"} onValueChange={v => setF("queue", v === "none" ? "" : v)}>
            <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select queue" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No queue</SelectItem>
              {QUEUES.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Notes / Description</Label>
          <Textarea value={form.description} onChange={e => setF("description", e.target.value)} placeholder="Lane, volume, pain point, next steps, meeting prep..." className="bg-secondary/30 min-h-[80px]" />
        </div>
        {form.taskType === "whatsapp" && (
          <div className="space-y-2">
            <Label>WhatsApp Number</Label>
            <Input value={form.whatsappNumber} onChange={e => setF("whatsappNumber", e.target.value)} placeholder="+1 555 000 0000" className="bg-secondary/30" />
          </div>
        )}
      </TabsContent>

      {/* ── LINKS ── */}
      <TabsContent value="links" className="mt-4 space-y-4">
        <p className="text-xs text-muted-foreground">Link this task to any record in the CRM. Every linked record creates a traceable touchpoint.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-orange-500" />
              Company <span className="text-red-500 ml-0.5">*</span>
            </Label>
            <Select value={form.companyId?.toString() ?? ""} onValueChange={v => { setF("companyId", parseInt(v)); setF("contactId", null); }}>
              <SelectTrigger className={`bg-secondary/30 ${!form.companyId ? 'border-orange-300' : 'border-emerald-300'}`}>
                <SelectValue placeholder="⚠ Select company (required)" />
              </SelectTrigger>
              <SelectContent>
                {companies?.items?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {!form.companyId && <p className="text-[10px] text-orange-500">Tasks must be linked to a company</p>}
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <User className="h-3 w-3 text-blue-500" /> Contact
              {form.companyId && <span className="text-[10px] text-muted-foreground ml-1">(filtered by company)</span>}
            </Label>
            <Select value={form.contactId?.toString() ?? "none"} onValueChange={v => setF("contactId", v === "none" ? null : parseInt(v))} disabled={!form.companyId}>
              <SelectTrigger className="bg-secondary/30">
                <SelectValue placeholder={form.companyId ? "Select contact" : "Select company first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No contact</SelectItem>
                {contacts?.items?.filter((c: any) => c.companyId === form.companyId).map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.firstName} {c.lastName ?? ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Target className="h-3 w-3" /> Deal</Label>
            <Select value={form.dealId?.toString() ?? "none"} onValueChange={v => setF("dealId", v === "none" ? null : parseInt(v))}>
              <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select deal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No deal</SelectItem>
                {dealsData?.items?.map((d: any) => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Layers className="h-3 w-3" /> Pipeline</Label>
            <Select value={form.pipelineId?.toString() ?? "none"} onValueChange={v => setF("pipelineId", v === "none" ? null : parseInt(v))}>
              <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select pipeline" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No pipeline</SelectItem>
                {pipelinesData?.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /> Campaign</Label>
            <Select value={form.campaignId?.toString() ?? "none"} onValueChange={v => setF("campaignId", v === "none" ? null : parseInt(v))}>
              <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select campaign" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No campaign</SelectItem>
                {campaignsData?.items?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Zap className="h-3 w-3" /> Workflow</Label>
            <Select value={form.workflowId?.toString() ?? "none"} onValueChange={v => setF("workflowId", v === "none" ? null : parseInt(v))}>
              <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select workflow" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No workflow</SelectItem>
                {(workflowsData as any[])?.map((w: any) => <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      {/* ── SCHEDULE ── */}
      <TabsContent value="schedule" className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input type="date" value={form.startDate} onChange={e => setF("startDate", e.target.value)} className="bg-secondary/30" />
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input type="date" value={form.dueDate} onChange={e => setF("dueDate", e.target.value)} className="bg-secondary/30" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Due Time</Label>
            <Input type="time" value={form.dueTime} onChange={e => setF("dueTime", e.target.value)} className="bg-secondary/30" />
          </div>
          <div className="space-y-2">
            <Label>Follow-up Date</Label>
            <Input type="date" value={form.followUpDate} onChange={e => setF("followUpDate", e.target.value)} className="bg-secondary/30" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Forecast Close Date</Label>
          <Input type="date" value={form.forecastCloseDate} onChange={e => setF("forecastCloseDate", e.target.value)} className="bg-secondary/30" />
        </div>
        <div className="space-y-2">
          <Label>Forecast Category</Label>
          <Select value={form.forecastCategory || "none"} onValueChange={v => setF("forecastCategory", v === "none" ? "" : v)}>
            <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select forecast" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not set</SelectItem>
              {FORECAST_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Separator />
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20">
          <Switch checked={form.isRecurring} onCheckedChange={v => setF("isRecurring", v)} />
          <div>
            <Label>Recurring Task</Label>
            <p className="text-xs text-muted-foreground">Auto-regenerate on a schedule</p>
          </div>
        </div>
        {form.isRecurring && (
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={form.recurringFrequency || "none"} onValueChange={v => setF("recurringFrequency", v === "none" ? "" : v)}>
              <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select frequency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </TabsContent>

      {/* ── MEETING ── */}
      <TabsContent value="meeting" className="mt-4 space-y-4">
        <p className="text-xs text-muted-foreground">Schedule a meeting, demo, or call. All details are linked to this task and tracked in analytics.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Meeting Date</Label>
            <Input type="date" value={form.meetingDate} onChange={e => setF("meetingDate", e.target.value)} className="bg-secondary/30" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Location / Link</Label>
            <Input value={form.meetingLocation} onChange={e => setF("meetingLocation", e.target.value)} placeholder="Zoom link or address" className="bg-secondary/30" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Attendees</Label>
          <Input value={form.meetingAttendees} onChange={e => setF("meetingAttendees", e.target.value)} placeholder="John Smith, Jane Doe, ..." className="bg-secondary/30" />
        </div>
        <div className="space-y-2">
          <Label>Meeting Agenda / Prep Notes</Label>
          <Textarea value={form.meetingAgenda} onChange={e => setF("meetingAgenda", e.target.value)} placeholder="Topics to cover, questions to ask, objections to handle..." className="bg-secondary/30 min-h-[100px]" />
        </div>
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-medium">Calendar Sync:</span> After saving, use the calendar integration in Settings → Integrations to sync this meeting to Google Calendar or Outlook.
          </p>
        </div>
      </TabsContent>

      {/* ── COMMERCIAL / REVENUE ── */}
      <TabsContent value="commercial" className="mt-4 space-y-4">
        <p className="text-xs text-muted-foreground">Track revenue potential, products, and proposals tied to this task. This feeds directly into your forecasting dashboard.</p>
        <div className="space-y-2">
          <Label className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> Product / Service</Label>
          <Input value={form.productName} onChange={e => setF("productName", e.target.value)} placeholder="e.g. Flatbed Lane Chicago–Dallas, LTL Spot Rate" className="bg-secondary/30" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2 col-span-2">
            <Label className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Revenue Potential</Label>
            <Input type="number" value={form.revenueAmount} onChange={e => setF("revenueAmount", e.target.value)} placeholder="0.00" className="bg-secondary/30" />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={form.revenueCurrency} onValueChange={v => setF("revenueCurrency", v)}>
              <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
                <SelectItem value="MXN">MXN</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1"><Link2 className="h-3 w-3" /> Proposal URL</Label>
          <Input value={form.proposalUrl} onChange={e => setF("proposalUrl", e.target.value)} placeholder="https://docs.google.com/..." className="bg-secondary/30" />
        </div>
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <p className="text-xs text-muted-foreground">
            <span className="text-emerald-400 font-medium">Revenue Tracking:</span> Revenue potential from tasks is aggregated in Analytics → Revenue Forecast. Keep this updated to maintain accurate pipeline visibility.
          </p>
        </div>
      </TabsContent>

      {/* ── INTELLIGENCE ── */}
      <TabsContent value="intel" className="mt-4 space-y-4">
        <p className="text-xs text-muted-foreground">Intelligence layer — visitor tracking, battle cards, and document attachments for this task.</p>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20">
          <Switch checked={form.whatsappNumber !== ""} onCheckedChange={v => { if (!v) setF("whatsappNumber", ""); }} />
          <div>
            <Label>WhatsApp Broadcast</Label>
            <p className="text-xs text-muted-foreground">Enable WhatsApp messaging for this task</p>
          </div>
        </div>
        {(form.taskType === "whatsapp" || form.whatsappNumber) && (
          <div className="space-y-2">
            <Label>WhatsApp Number</Label>
            <Input value={form.whatsappNumber} onChange={e => setF("whatsappNumber", e.target.value)} placeholder="+1 555 000 0000" className="bg-secondary/30" />
          </div>
        )}
        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 space-y-1">
          <p className="text-xs font-medium text-blue-400 flex items-center gap-1"><Eye className="h-3 w-3" /> Visitor Tracking</p>
          <p className="text-xs text-muted-foreground">When the linked company visits your website, this task will be flagged automatically. Configure tracking in Settings → Integrations → Website Visitor Tracking.</p>
        </div>
        <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 space-y-1">
          <p className="text-xs font-medium text-purple-400 flex items-center gap-1"><Shield className="h-3 w-3" /> Battle Card Access</p>
          <p className="text-xs text-muted-foreground">Battle cards for the linked company's competitors are available in the Battle Cards tab. Access them during meeting prep to sharpen your pitch.</p>
        </div>
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 space-y-1">
          <p className="text-xs font-medium text-amber-400 flex items-center gap-1"><Bell className="h-3 w-3" /> Smart Notifications</p>
          <p className="text-xs text-muted-foreground">Smart notifications fire when: the linked contact opens an email, the company visits your site, a deal stage changes, or this task is overdue. Configure in Settings → Notifications.</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/20 space-y-1">
          <p className="text-xs font-medium text-foreground flex items-center gap-1"><FileText className="h-3 w-3" /> Documents</p>
          <p className="text-xs text-muted-foreground">Attach proposals, contracts, or scanned documents to this task. Use the Documents tab in the linked Company or Contact record to upload files, then reference them here.</p>
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="space-y-5">
      <PageGuide {...pageGuides.tasks} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("tasks")}</h1>
          <p className="text-xs text-muted-foreground/70 mt-0.5 mb-1">
            The heart of every client move — link tasks to companies, contacts, deals, campaigns, meetings, proposals, and revenue.
          </p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{pendingCount} pending</span>
            <span>·</span>
            <span>{completedCount} completed</span>
            {overdueCount > 0 && <><span>·</span><span className="text-red-400 font-medium">{overdueCount} overdue</span></>}
            <span>·</span>
            <span>{data?.total ?? 0} total</span>
          </div>
        </div>
        <Button onClick={() => { setForm({ ...EMPTY_FORM }); setShowCreate(true); }} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary/30" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-secondary/30"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36 bg-secondary/30"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="to_do">To-do</SelectItem>
            <SelectItem value="follow_up">Follow-up</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="demo">Demo</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
        <Select value={queueFilter} onValueChange={setQueueFilter}>
          <SelectTrigger className="w-44 bg-secondary/30"><SelectValue placeholder="Queue" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Queues</SelectItem>
            {QUEUES.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk delete bar */}
      {selectedTaskIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm font-semibold text-primary">{selectedTaskIds.size} selected</span>
          <Button variant="destructive" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => { if (confirm(`Delete ${selectedTaskIds.size} tasks? This cannot be undone.`)) bulkDeleteTasks.mutate({ ids: Array.from(selectedTaskIds) }); }} disabled={bulkDeleteTasks.isPending}>
            <Trash2 className="h-3.5 w-3.5" />{bulkDeleteTasks.isPending ? "Deleting..." : "Delete Selected"}
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl text-xs h-8" onClick={() => setSelectedTaskIds(new Set())}>Clear</Button>
        </div>
      )}
      {/* Task List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-4"><div className="h-5 w-full bg-muted rounded animate-pulse" /></CardContent>
            </Card>
          ))
        ) : filteredTasks.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No tasks found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create your first task to start tracking client activity</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map(task => {
            const TypeIcon = TYPE_ICONS[task.taskType ?? "to_do"] || ClipboardList;
            const typeColor = TYPE_COLORS[task.taskType ?? "to_do"] || "text-gray-400 bg-gray-500/10";
            const isOverdue = task.dueDate && task.status !== "completed" && task.dueDate < Date.now();
            const contactName = getContactName(task.contactId ?? null);
            const companyName = getCompanyName(task.companyId ?? null);
            const dealName = getDealName(task.dealId ?? null);
            const pipelineName = getPipelineName(task.pipelineId ?? null);
            const campaignName = getCampaignName(task.campaignId ?? null);

            return (
              <Card key={task.id} onClick={() => setViewingTask(task)} className={`bg-card border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer ${isOverdue ? "border-red-500/30 bg-red-500/3" : ""} ${task.status === "completed" ? "opacity-60" : ""} ${selectedTaskIds.has(task.id) ? 'ring-2 ring-primary/30' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Bulk select checkbox */}
                    <Checkbox
                      checked={selectedTaskIds.has(task.id)}
                      onCheckedChange={() => toggleTaskSelect(task.id)}
                      onClick={e => e.stopPropagation()}
                      className="mt-1 shrink-0 border-muted-foreground/40"
                      title="Select for bulk delete"
                    />
                    <Checkbox
                      checked={task.status === "completed"}
                      onCheckedChange={checked => updateMutation.mutate({
                        id: task.id,
                        status: checked ? "completed" : "not_started",
                        completedAt: checked ? Date.now() : undefined,
                      })}
                      onClick={e => e.stopPropagation()}
                      className="mt-1 shrink-0"
                    />
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${typeColor}`}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {task.title}
                        </p>
                        <Badge variant="secondary" className={`text-[10px] ${PRIORITY_COLORS[task.priority] ?? ""}`}>{task.priority}</Badge>
                        {task.taskType && (
                          <Badge variant="outline" className={`text-[10px] capitalize ${typeColor}`}>
                            {task.taskType.replace("_", " ")}
                          </Badge>
                        )}
                        {task.queue && <Badge variant="outline" className="text-[10px] bg-primary/5">{task.queue}</Badge>}
                        {isOverdue && <Badge variant="destructive" className="text-[10px]"><AlertCircle className="h-2.5 w-2.5 mr-1" />Overdue</Badge>}
                        {task.isRecurring && <Badge variant="outline" className="text-[10px]"><RefreshCw className="h-2.5 w-2.5 mr-1" />Recurring</Badge>}
                        {task.forecastCategory && <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/20">{task.forecastCategory}</Badge>}
                        {task.businessCategory && <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/20">{task.businessCategory}</Badge>}
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                      )}

                      {/* Linked records row */}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {task.dueDate && (
                          <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
                            <Calendar className="h-3 w-3" />
                            <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                            {task.dueTime && <span>at {task.dueTime}</span>}
                          </div>
                        )}
                        {task.followUpDate && (
                          <div className="flex items-center gap-1 text-xs text-amber-400/80">
                            <RefreshCw className="h-3 w-3" />
                            <span>Follow-up {new Date(task.followUpDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {companyName && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3 text-blue-400" />
                            <span>{companyName}</span>
                          </div>
                        )}
                        {contactName && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3 text-purple-400" />
                            <span>{contactName}</span>
                          </div>
                        )}
                        {dealName && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Target className="h-3 w-3 text-green-400" />
                            <span>{dealName}</span>
                          </div>
                        )}
                        {pipelineName && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Layers className="h-3 w-3 text-cyan-400" />
                            <span>{pipelineName}</span>
                          </div>
                        )}
                        {campaignName && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 text-pink-400" />
                            <span>{campaignName}</span>
                          </div>
                        )}
                        {task.revenueAmount && (
                          <div className="flex items-center gap-1 text-xs text-emerald-400">
                            <DollarSign className="h-3 w-3" />
                            <span>{(task.revenueAmount / 100).toLocaleString()} {task.revenueCurrency ?? "USD"}</span>
                          </div>
                        )}
                        {task.meetingDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Video className="h-3 w-3 text-green-400" />
                            <span>Meeting {new Date(task.meetingDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {task.productName && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Briefcase className="h-3 w-3 text-amber-400" />
                            <span>{task.productName}</span>
                          </div>
                        )}
                        {task.whatsappNumber && (
                          <div className="flex items-center gap-1 text-xs text-emerald-400">
                            <MessageSquare className="h-3 w-3" />
                            <span>{task.whatsappNumber}</span>
                          </div>
                        )}
                        {task.touchCount != null && task.touchCount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                            <Zap className="h-3 w-3" />
                            <span>{task.touchCount} touch{task.touchCount !== 1 ? "es" : ""}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(task)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: task.id, status: "completed", completedAt: Date.now() })}>
                          Mark Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateMutation.mutate({ id: task.id, status: "not_started" })}>
                          Mark Not Started
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setReassignTaskId(task.id); }}>
                          <UserCheck className="mr-2 h-4 w-4" /> Reassign
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate({ id: task.id })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Task Templates Picker */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Choose a Template</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-2">
            {TASK_TEMPLATES.map((tpl) => {
              const Icon = TYPE_ICONS[tpl.type] || ClipboardList;
              return (
                <button key={tpl.label} className="flex items-start gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 text-left transition-colors" onClick={() => {
                  setForm(prev => ({ ...prev, title: tpl.title, taskType: tpl.type, priority: tpl.priority, description: tpl.description, isRecurring: tpl.isRecurring, recurringFrequency: tpl.recurringFrequency }));
                  setShowTemplates(false);
                  setShowCreate(true);
                }}>
                  <Icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{tpl.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{tpl.description.slice(0, 40)}…</p>
                    {tpl.isRecurring && <Badge variant="outline" className="text-[9px] mt-1">Recurring</Badge>}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) setTaskTab("details"); }}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Create New Task
              </DialogTitle>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => { setShowCreate(false); setShowTemplates(true); }}>
                <Layers className="h-3.5 w-3.5" /> Use Template
              </Button>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-2">
            <TaskForm />
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={open => { if (!open) { setEditingTask(null); setTaskTab("details"); } }}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              Edit Task
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-2">
            <TaskForm />
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Sheet */}
      <Sheet open={!!viewingTask} onOpenChange={open => { if (!open) setViewingTask(null); }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-card border-border">
          {viewingTask && (() => {
            const t2 = viewingTask;
            const TypeIcon2 = TYPE_ICONS[t2.taskType ?? "to_do"] || ClipboardList;
            const typeColor2 = TYPE_COLORS[t2.taskType ?? "to_do"] || "text-gray-400 bg-gray-500/10";
            const isOverdue2 = t2.dueDate && t2.taskStatus !== "completed" && t2.dueDate < Date.now();
            const contactName2 = getContactName(t2.contactId ?? null);
            const companyName2 = getCompanyName(t2.companyId ?? null);
            const dealName2 = getDealName(t2.dealId ?? null);
            const pipelineName2 = getPipelineName(t2.pipelineId ?? null);
            const campaignName2 = getCampaignName(t2.campaignId ?? null);
            return (
              <>
                <SheetHeader className="pb-4 border-b border-border">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${typeColor2}`}>
                      <TypeIcon2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-base font-semibold leading-snug">{t2.title}</SheetTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className={`text-[10px] ${PRIORITY_COLORS[t2.priority] ?? ""}`}>{t2.priority}</Badge>
                        {t2.taskType && <Badge variant="outline" className={`text-[10px] capitalize ${typeColor2}`}>{t2.taskType.replace("_", " ")}</Badge>}
                        {t2.queue && <Badge variant="outline" className="text-[10px] bg-primary/5">{t2.queue}</Badge>}
                        {isOverdue2 && <Badge variant="destructive" className="text-[10px]"><AlertCircle className="h-2.5 w-2.5 mr-1" />Overdue</Badge>}
                        <Badge variant={t2.taskStatus === "completed" ? "default" : "outline"} className="text-[10px]">
                          {t2.taskStatus === "completed" ? "✓ Completed" : "Not Started"}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0" onClick={() => { setViewingTask(null); handleEdit(t2); }}>
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  </div>
                </SheetHeader>

                <div className="py-4 space-y-5">
                  {/* Description */}
                  {t2.description && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{t2.description}</p>
                    </div>
                  )}

                  {/* Dates */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Dates</p>
                    <div className="grid grid-cols-2 gap-2">
                      {t2.dueDate && (
                        <div className={`flex items-center gap-2 p-2 rounded-lg bg-secondary/30 ${isOverdue2 ? "border border-red-500/20" : ""}`}>
                          <Calendar className={`h-4 w-4 shrink-0 ${isOverdue2 ? "text-red-400" : "text-muted-foreground"}`} />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Due Date</p>
                            <p className={`text-xs font-medium ${isOverdue2 ? "text-red-400" : ""}`}>{new Date(t2.dueDate).toLocaleDateString()}{t2.dueTime ? ` at ${t2.dueTime}` : ""}</p>
                          </div>
                        </div>
                      )}
                      {t2.startDate && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Start Date</p>
                            <p className="text-xs font-medium">{new Date(t2.startDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                      {t2.followUpDate && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                          <RefreshCw className="h-4 w-4 shrink-0 text-amber-400" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Follow-up</p>
                            <p className="text-xs font-medium text-amber-400">{new Date(t2.followUpDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                      {t2.meetingDate && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                          <Video className="h-4 w-4 shrink-0 text-green-400" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">Meeting</p>
                            <p className="text-xs font-medium text-green-400">{new Date(t2.meetingDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Linked Records */}
                  {(companyName2 || contactName2 || dealName2 || pipelineName2 || campaignName2) && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Linked Records</p>
                      <div className="space-y-1.5">
                        {companyName2 && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                            <Building2 className="h-4 w-4 text-blue-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">Company</p>
                              <p className="text-xs font-medium">{companyName2}</p>
                            </div>
                          </div>
                        )}
                        {contactName2 && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                            <User className="h-4 w-4 text-purple-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">Contact</p>
                              <p className="text-xs font-medium">{contactName2}</p>
                            </div>
                          </div>
                        )}
                        {dealName2 && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                            <Target className="h-4 w-4 text-green-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">Deal</p>
                              <p className="text-xs font-medium">{dealName2}</p>
                            </div>
                          </div>
                        )}
                        {pipelineName2 && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                            <Layers className="h-4 w-4 text-cyan-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">Pipeline</p>
                              <p className="text-xs font-medium">{pipelineName2}</p>
                            </div>
                          </div>
                        )}
                        {campaignName2 && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                            <Mail className="h-4 w-4 text-pink-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">Campaign</p>
                              <p className="text-xs font-medium">{campaignName2}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Meeting Details */}
                  {(t2.meetingLocation || t2.meetingAgenda || t2.meetingAttendees) && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Meeting Details</p>
                      <div className="space-y-1.5">
                        {t2.meetingLocation && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <p className="text-xs text-foreground">{t2.meetingLocation}</p>
                          </div>
                        )}
                        {t2.meetingAgenda && (
                          <div className="flex items-start gap-2">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <p className="text-xs text-foreground whitespace-pre-wrap">{t2.meetingAgenda}</p>
                          </div>
                        )}
                        {t2.meetingAttendees && (
                          <div className="flex items-start gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <p className="text-xs text-foreground">{t2.meetingAttendees}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Commercial */}
                  {(t2.revenueAmount || t2.productName || t2.proposalUrl || t2.forecastCategory || t2.businessCategory) && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Commercial</p>
                      <div className="grid grid-cols-2 gap-2">
                        {t2.revenueAmount && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            <DollarSign className="h-4 w-4 text-emerald-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">Revenue Potential</p>
                              <p className="text-xs font-medium text-emerald-400">{(t2.revenueAmount / 100).toLocaleString()} {t2.revenueCurrency ?? "USD"}</p>
                            </div>
                          </div>
                        )}
                        {t2.productName && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                            <Briefcase className="h-4 w-4 text-amber-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">Product</p>
                              <p className="text-xs font-medium">{t2.productName}</p>
                            </div>
                          </div>
                        )}
                        {t2.forecastCategory && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                            <TrendingUp className="h-4 w-4 text-blue-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">Forecast</p>
                              <p className="text-xs font-medium">{t2.forecastCategory}</p>
                            </div>
                          </div>
                        )}
                        {t2.businessCategory && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                            <Tag className="h-4 w-4 text-indigo-400 shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground">Category</p>
                              <p className="text-xs font-medium">{t2.businessCategory}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      {t2.proposalUrl && (
                        <a href={t2.proposalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                          <Link2 className="h-3 w-3" /> View Proposal
                        </a>
                      )}
                    </div>
                  )}

                  {/* WhatsApp */}
                  {t2.whatsappNumber && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <MessageSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">WhatsApp</p>
                        <p className="text-xs font-medium text-emerald-400">{t2.whatsappNumber}</p>
                      </div>
                    </div>
                  )}

                  {/* Completion info */}
                  {t2.taskStatus === "completed" && t2.completedAt && (
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/15">
                      <p className="text-xs font-medium text-green-400 mb-0.5">Completed</p>
                      <p className="text-xs text-muted-foreground">{new Date(t2.completedAt).toLocaleString()}</p>
                      {t2.outcome && <p className="text-xs text-foreground mt-1">{t2.outcome}</p>}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="pt-2 border-t border-border">
                    <p className="text-[10px] text-muted-foreground">Created {new Date(t2.createdAt).toLocaleString()} · ID #{t2.id}</p>
                    {t2.touchCount != null && t2.touchCount > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t2.touchCount} touch{t2.touchCount !== 1 ? "es" : ""} recorded</p>
                    )}
                  </div>

                  {/* Quick actions */}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="flex-1" onClick={() => { setViewingTask(null); handleEdit(t2); }}>
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Task
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      updateMutation.mutate({ id: t2.id, status: t2.taskStatus === "completed" ? "not_started" : "completed", completedAt: t2.taskStatus !== "completed" ? Date.now() : undefined });
                      setViewingTask(null);
                    }}>
                      {t2.taskStatus === "completed" ? "Reopen" : "Mark Done"}
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Reassign Task Dialog */}
      <Dialog open={reassignTaskId !== null} onOpenChange={open => { if (!open) setReassignTaskId(null); }}>
        <DialogContent className="max-w-sm bg-card border-border/50 rounded-2xl">
          <DialogHeader><DialogTitle>Reassign Task</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            {(teamMembersData || []).map((u: any) => (
              <button key={u.id} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 text-left transition-colors" onClick={() => {
                if (reassignTaskId) updateMutation.mutate({ id: reassignTaskId, assignedTo: u.id });
                setReassignTaskId(null);
              }}>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{(u.name || u.email || '?')[0].toUpperCase()}</div>
                <div><p className="text-sm font-medium">{u.name || u.email}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
