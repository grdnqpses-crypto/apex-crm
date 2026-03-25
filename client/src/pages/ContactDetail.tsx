import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, MessageSquare,
  PhoneCall, Video, FileText, Save, Globe, Linkedin, Clock, User, Tag,
  Smartphone, Kanban, ListChecks, DollarSign, Sparkles, Activity
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
import CustomFieldsPanel from "@/components/CustomFieldsPanel";

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

const ACTIVITY_ICONS: Record<string, any> = {
  note: FileText, email: Mail, call: PhoneCall, meeting: Video, task: ListChecks,
  deal_created: DollarSign, deal_stage_changed: Kanban, deal_won: DollarSign, deal_lost: DollarSign,
  contact_created: User, lifecycle_changed: Tag,
};

const ACTIVITY_FILTERS = ["all", "note", "email", "call", "meeting", "task"] as const;

export default function ContactDetail() {
  const { t, skinId } = useSkin();
  const params = useParams<{ id: string }>();
  const contactId = parseInt(params.id ?? "0");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: contact, isLoading } = trpc.contacts.get.useQuery({ id: contactId });
  const { data: activities } = trpc.activities.list.useQuery({ contactId });
  const { data: companies } = trpc.companies.list.useQuery({});
  const { data: contactDeals } = trpc.crossFeature.dealsByContact.useQuery({ contactId });
  const { data: contactTasks } = trpc.crossFeature.tasksByContact.useQuery({ contactId });
  const updateMutation = trpc.contacts.update.useMutation({
    onSuccess: () => { utils.contacts.get.invalidate({ id: contactId }); toast.success("Contact updated"); },
    onError: (e: any) => toast.error(e.message),
  });
  const addActivity = trpc.activities.create.useMutation({
    onSuccess: () => { utils.activities.list.invalidate(); toast.success("Activity added"); resetActivityForm(); },
  });

  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [activityTab, setActivityTab] = useState<"note" | "email" | "call" | "meeting" | "task">("note");

  const [noteBody, setNoteBody] = useState("");
  const [callOutcome, setCallOutcome] = useState("Connected");
  const [callType, setCallType] = useState("Outbound");
  const [callNotes, setCallNotes] = useState("");
  const [callDuration, setCallDuration] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingOutcome, setMeetingOutcome] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskNotes, setTaskNotes] = useState("");

  const resetActivityForm = () => {
    setNoteBody(""); setCallNotes(""); setCallDuration(""); setEmailTo(""); setEmailSubject("");
    setEmailBody(""); setMeetingTitle(""); setMeetingLocation(""); setMeetingNotes("");
    setMeetingOutcome(""); setTaskTitle(""); setTaskNotes("");
  };

  const handleLogActivity = () => {
    const base = { contactId };
    if (activityTab === "note") {
      if (!noteBody.trim()) return toast.error("Note body is required");
      addActivity.mutate({ ...base, type: "note", subject: "Note added", body: noteBody });
    } else if (activityTab === "call") {
      addActivity.mutate({ ...base, type: "call", subject: `${callType} call - ${callOutcome}`, body: callNotes, callOutcome, callType, callDuration: callDuration ? parseInt(callDuration) : undefined });
    } else if (activityTab === "email") {
      if (!emailSubject.trim()) return toast.error("Subject is required");
      addActivity.mutate({ ...base, type: "email", subject: emailSubject, body: emailBody, emailTo, emailFrom: contact?.email ?? "" });
    } else if (activityTab === "meeting") {
      if (!meetingTitle.trim()) return toast.error("Meeting title is required");
      addActivity.mutate({ ...base, type: "meeting", subject: meetingTitle, body: meetingNotes, meetingLocation, meetingOutcome });
    } else if (activityTab === "task") {
      if (!taskTitle.trim()) return toast.error("Task title is required");
      addActivity.mutate({ ...base, type: "task", subject: taskTitle, body: taskNotes });
    }
  };

  const filteredActivities = activities?.filter(a => activityFilter === "all" || a.type === activityFilter) ?? [];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Loading contact...</span>
      </div>
    </div>
  );
  if (!contact) return (
    <div className="text-center py-16">
      <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
        <User className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-medium text-foreground">Contact not found</p>
      <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={() => setLocation("/contacts")}>Back to {t("contacts")}</Button>
    </div>
  );

  const associatedCompany = companies?.items?.find((c: any) => c.id === contact.companyId);

  return (
    <div className="space-y-6">
      {/* ─── Back Button ─── */}
      <Button variant="ghost" size="sm" onClick={() => setLocation("/contacts")} className="gap-2 rounded-xl text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Contacts
      </Button>

      {/* ─── Header Card ─── */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-card to-card border border-border/40 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-xl font-bold text-primary">{contact.firstName.charAt(0)}{contact.lastName?.charAt(0) ?? ""}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{contact.firstName} {contact.lastName ?? ""}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {contact.jobTitle && <span className="text-sm text-muted-foreground">{contact.jobTitle}</span>}
              {contact.jobTitle && <span className="text-muted-foreground/30">&bull;</span>}
              {associatedCompany && (
                <button onClick={() => setLocation(`/companies/${associatedCompany.id}`)} className="flex items-center gap-1 text-sm text-primary hover:underline">
                  <Building2 className="h-3.5 w-3.5" />{associatedCompany.name}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className={`text-[10px] font-semibold uppercase rounded-lg ${STAGE_COLORS[contact.lifecycleStage as string] ?? ""}`}>
                {contact.lifecycleStage}
              </Badge>
              <Badge variant="secondary" className={`text-[10px] font-semibold rounded-lg ${STATUS_COLORS[contact.leadStatus as string] ?? "bg-muted/60 text-muted-foreground"}`}>
                {contact.leadStatus}
              </Badge>
              {(contact.leadScore ?? 0) > 0 && (
                <Badge variant="secondary" className="text-[10px] font-semibold rounded-lg bg-amber-50 text-amber-600">
                  <Sparkles className="h-3 w-3 mr-0.5" /> Score: {contact.leadScore}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skin-aware layout: HubSpot = 1/4 + 3/4 (narrow properties, wide timeline), Salesforce = full-width stacked, default = 1/3 + 2/3 */}
      <div className={`grid gap-6 ${
        skinId === 'hubspot' ? 'grid-cols-1 lg:grid-cols-4' :
        skinId === 'salesforce' ? 'grid-cols-1' :
        'grid-cols-1 lg:grid-cols-3'
      }`}>
        {/* ─── Left: Contact Info ─── */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-border/40 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Contact Information</p>
              <div className="space-y-3">
                {contact.email && <InfoRow icon={Mail} label="Email" value={contact.email} />}
                {contact.directPhone && <InfoRow icon={Phone} label="Direct Phone" value={contact.directPhone} />}
                {contact.mobilePhone && <InfoRow icon={Smartphone} label="Mobile" value={contact.mobilePhone} />}
                {contact.companyPhone && <InfoRow icon={Phone} label="Company Phone" value={contact.companyPhone} />}
                {contact.linkedinUrl && <InfoRow icon={Linkedin} label="LinkedIn" value={contact.linkedinUrl} isLink />}
                {contact.websiteUrl && <InfoRow icon={Globe} label="Website" value={contact.websiteUrl} isLink />}
                {(contact.city || contact.country) && (
                  <InfoRow icon={MapPin} label="Location" value={[contact.streetAddress, contact.city, contact.stateRegion, contact.country].filter(Boolean).join(", ")} />
                )}
                {contact.timezone && <InfoRow icon={Clock} label="Timezone" value={contact.timezone} />}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/40 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Engagement</p>
              <div className="grid grid-cols-2 gap-3">
                <StatMini label="Lead Score" value={String(contact.leadScore)} color="text-amber-600" />
                <StatMini label="Times Contacted" value={String(contact.timesContacted ?? 0)} color="text-blue-600" />
                <StatMini label="Lead Source" value={contact.leadSource ?? "—"} color="text-foreground" />
                <StatMini label="Created" value={new Date(contact.createdAt).toLocaleDateString()} color="text-foreground" />
              </div>
            </CardContent>
          </Card>

          <CustomFieldsPanel objectType="contact" recordId={contactId} />
          {(contact.decisionMakerRole || contact.freightVolume || contact.customerType) && (
            <Card className="rounded-2xl border-border/40 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Logistics Details</p>
                <div className="space-y-2 text-sm">
                  {contact.decisionMakerRole && <div><span className="text-muted-foreground text-xs">Decision Maker</span><p className="font-semibold text-foreground">{contact.decisionMakerRole}</p></div>}
                  {contact.freightVolume && <div><span className="text-muted-foreground text-xs">Freight Volume</span><p className="font-semibold text-foreground">{contact.freightVolume}</p></div>}
                  {contact.customerType && <div><span className="text-muted-foreground text-xs">Customer Type</span><p className="font-semibold text-foreground">{contact.customerType}</p></div>}
                  {contact.paymentResponsibility && <div><span className="text-muted-foreground text-xs">Payment</span><p className="font-semibold text-foreground">{contact.paymentResponsibility}</p></div>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ─── Right: Tabs ─── */}
        <div className={skinId === 'hubspot' ? 'lg:col-span-3' : 'lg:col-span-2'}>
          <Tabs defaultValue="overview">
            <TabsList className="bg-muted/40 rounded-xl p-1">
              <TabsTrigger value="overview" className="rounded-lg text-xs">Overview</TabsTrigger>
              <TabsTrigger value="deals" className="rounded-lg text-xs">Deals{contactDeals && contactDeals.length > 0 ? ` (${contactDeals.length})` : ''}</TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-lg text-xs">Tasks{contactTasks && contactTasks.length > 0 ? ` (${contactTasks.length})` : ''}</TabsTrigger>
              <TabsTrigger value="activities" className="rounded-lg text-xs">{t("activities")}</TabsTrigger>
              <TabsTrigger value="edit" className="rounded-lg text-xs">Edit</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card className="rounded-2xl border-border/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {activities?.length === 0 && (
                    <div className="text-center py-10">
                      <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                        <Activity className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm text-muted-foreground">No activities yet. Log your first interaction below.</p>
                    </div>
                  )}
                  {activities?.slice(0, 20).map((activity) => {
                    const Icon = ACTIVITY_ICONS[activity.type] || FileText;
                    return (
                      <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0 hover:bg-accent/20 rounded-lg px-2 -mx-2 transition-colors">
                        <div className="h-8 w-8 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">{activity.subject || activity.type}</p>
                            <span className="text-[11px] text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</span>
                          </div>
                          {activity.body && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{activity.body}</p>}
                          <Badge variant="secondary" className="text-[10px] mt-1.5 capitalize rounded-md bg-muted/50">{activity.type}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Deals Tab */}
            <TabsContent value="deals" className="mt-4">
              <Card className="rounded-2xl border-border/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" /> Associated Deals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!contactDeals || contactDeals.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                        <DollarSign className="h-6 w-6 text-emerald-400" />
                      </div>
                      <p className="text-sm text-muted-foreground">No deals associated yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {contactDeals.map((deal: any) => (
                        <div key={deal.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setLocation(`/deals`)}>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                              <Kanban className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{deal.name}</p>
                              <p className="text-xs text-muted-foreground">{deal.stage}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">${(deal.value ?? 0).toLocaleString()}</p>
                            <Badge variant="secondary" className="text-[10px] rounded-md">{deal.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="mt-4">
              <Card className="rounded-2xl border-border/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-amber-600" /> Associated Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!contactTasks || contactTasks.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                        <ListChecks className="h-6 w-6 text-amber-400" />
                      </div>
                      <p className="text-sm text-muted-foreground">No tasks associated yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {contactTasks.map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${task.status === 'completed' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                              <ListChecks className={`h-4 w-4 ${task.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{task.title}</p>
                              <p className="text-xs text-muted-foreground">{task.priority} priority &middot; {task.status}</p>
                            </div>
                          </div>
                          {task.dueDate && <span className="text-xs text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activities Tab */}
            <TabsContent value="activities" className="space-y-4 mt-4">
              <Card className="rounded-2xl border-border/40 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Log Activity</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(["note", "email", "call", "meeting", "task"] as const).map(t => (
                      <Button key={t} variant={activityTab === t ? "default" : "outline"} size="sm" onClick={() => setActivityTab(t)} className="capitalize text-xs rounded-lg">
                        {t}
                      </Button>
                    ))}
                  </div>

                  {activityTab === "note" && (
                    <Textarea value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Write a note..." className="rounded-xl bg-muted/30 border-border/50 min-h-[80px]" />
                  )}
                  {activityTab === "call" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={callOutcome} onValueChange={setCallOutcome}>
                        <SelectTrigger className="rounded-xl bg-muted/30 border-border/50"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Connected">Connected</SelectItem>
                          <SelectItem value="Left voicemail">Left voicemail</SelectItem>
                          <SelectItem value="No answer">No answer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={callType} onValueChange={setCallType}>
                        <SelectTrigger className="rounded-xl bg-muted/30 border-border/50"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Inbound">Inbound</SelectItem>
                          <SelectItem value="Outbound">Outbound</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input value={callDuration} onChange={(e) => setCallDuration(e.target.value)} placeholder="Duration (min)" type="number" className="rounded-xl bg-muted/30 border-border/50" />
                      <div />
                      <Textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} placeholder="Call notes..." className="rounded-xl bg-muted/30 border-border/50 col-span-2 min-h-[60px]" />
                    </div>
                  )}
                  {activityTab === "email" && (
                    <div className="space-y-3">
                      <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="To email address" className="rounded-xl bg-muted/30 border-border/50" />
                      <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Subject line" className="rounded-xl bg-muted/30 border-border/50" />
                      <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Email body..." className="rounded-xl bg-muted/30 border-border/50 min-h-[80px]" />
                    </div>
                  )}
                  {activityTab === "meeting" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="Meeting title" className="rounded-xl bg-muted/30 border-border/50 col-span-2" />
                      <Input value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} placeholder="Location / Zoom link" className="rounded-xl bg-muted/30 border-border/50" />
                      <Select value={meetingOutcome || "none"} onValueChange={(v) => setMeetingOutcome(v === "none" ? "" : v)}>
                        <SelectTrigger className="rounded-xl bg-muted/30 border-border/50"><SelectValue placeholder="Outcome" /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="none">No outcome yet</SelectItem>
                          <SelectItem value="Scheduled">Scheduled</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="No-show">No-show</SelectItem>
                          <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} placeholder="Meeting notes..." className="rounded-xl bg-muted/30 border-border/50 col-span-2 min-h-[60px]" />
                    </div>
                  )}
                  {activityTab === "task" && (
                    <div className="space-y-3">
                      <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title" className="rounded-xl bg-muted/30 border-border/50" />
                      <Textarea value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} placeholder="Task notes..." className="rounded-xl bg-muted/30 border-border/50 min-h-[60px]" />
                    </div>
                  )}

                  <Button size="sm" disabled={addActivity.isPending} onClick={handleLogActivity} className="rounded-xl shadow-sm">
                    {addActivity.isPending ? "Logging..." : `Log ${activityTab}`}
                  </Button>
                </CardContent>
              </Card>

              <div className="flex gap-1.5 flex-wrap">
                {ACTIVITY_FILTERS.map(f => (
                  <Button key={f} variant={activityFilter === f ? "default" : "outline"} size="sm" onClick={() => setActivityFilter(f)} className="capitalize text-xs rounded-lg">
                    {f === "all" ? "All Activities" : f + "s"}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredActivities.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">No activities found.</p>
                  </div>
                )}
                {filteredActivities.map((activity) => {
                  const Icon = ACTIVITY_ICONS[activity.type] || FileText;
                  return (
                    <Card key={activity.id} className="rounded-xl border-border/30 shadow-sm">
                      <CardContent className="p-3.5">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-foreground">{activity.subject || activity.type}</p>
                              <span className="text-[11px] text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</span>
                            </div>
                            {activity.body && <p className="text-sm text-muted-foreground mt-0.5">{activity.body}</p>}
                            <div className="flex gap-1.5 mt-1.5">
                              <Badge variant="secondary" className="text-[10px] capitalize rounded-md bg-muted/50">{activity.type}</Badge>
                              {activity.callOutcome && <Badge variant="secondary" className="text-[10px] rounded-md bg-blue-50 text-blue-600">{activity.callOutcome}</Badge>}
                              {activity.callType && <Badge variant="secondary" className="text-[10px] rounded-md bg-blue-50 text-blue-600">{activity.callType}</Badge>}
                              {activity.meetingOutcome && <Badge variant="secondary" className="text-[10px] rounded-md bg-purple-50 text-purple-600">{activity.meetingOutcome}</Badge>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Edit Tab */}
            <TabsContent value="edit" className="mt-4">
              <Card className="rounded-2xl border-border/40 shadow-sm">
                <CardContent className="p-6">
                  <EditContactForm contact={contact} companies={companies?.items ?? []} onSave={(data: any) => updateMutation.mutate({ id: contactId, ...data })} saving={updateMutation.isPending} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, isLink }: { icon: any; label: string; value: string; isLink?: boolean }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        {isLink ? (
          <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all text-sm">{value}</a>
        ) : (
          <p className="text-foreground break-all font-medium">{value}</p>
        )}
      </div>
    </div>
  );
}

function StatMini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-muted/30">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold ${color} mt-0.5`}>{value}</p>
    </div>
  );
}

function EditContactForm({ contact, companies, onSave, saving }: { contact: any; companies: any[]; onSave: (data: any) => void; saving: boolean }) {
  const [form, setForm] = useState({
    firstName: contact.firstName ?? "",
    lastName: contact.lastName ?? "",
    email: contact.email ?? "",
    directPhone: contact.directPhone ?? "",
    mobilePhone: contact.mobilePhone ?? "",
    companyPhone: contact.companyPhone ?? "",
    jobTitle: contact.jobTitle ?? "",
    companyId: contact.companyId ?? null,
    linkedinUrl: contact.linkedinUrl ?? "",
    websiteUrl: contact.websiteUrl ?? "",
    streetAddress: contact.streetAddress ?? "",
    addressLine2: contact.addressLine2 ?? "",
    city: contact.city ?? "",
    stateRegion: contact.stateRegion ?? "",
    postalCode: contact.postalCode ?? "",
    country: contact.country ?? "",
    timezone: contact.timezone ?? "",
    lifecycleStage: contact.lifecycleStage ?? "lead",
    leadStatus: contact.leadStatus ?? "Cold",
    leadSource: contact.leadSource ?? "CRM",
    leadScore: contact.leadScore ?? 0,
    decisionMakerRole: contact.decisionMakerRole ?? "",
    department: contact.department ?? "",
    freightVolume: contact.freightVolume ?? "",
    customerType: contact.customerType ?? "",
    paymentResponsibility: contact.paymentResponsibility ?? "",
    preferredContactMethod: contact.preferredContactMethod ?? "",
    twitterHandle: contact.twitterHandle ?? "",
    facebookProfile: contact.facebookProfile ?? "",
    instagramProfile: contact.instagramProfile ?? "",
    emailSubscriptionStatus: contact.emailSubscriptionStatus ?? "subscribed",
    notes: contact.notes ?? "",
    // Activity dates
    lastLoggedOutgoingEmailDate: (contact as any).lastLoggedOutgoingEmailDate ?? null,
    lastModifiedDate: (contact as any).lastModifiedDate ?? null,
    closeDate: (contact as any).closeDate ?? null,
    firstContactCreateDate: (contact as any).firstContactCreateDate ?? null,
    firstDealCreatedDate: (contact as any).firstDealCreatedDate ?? null,
    lastActivityDate: (contact as any).lastActivityDate ?? null,
    lastBookedMeetingDate: (contact as any).lastBookedMeetingDate ?? null,
    nextActivityDate: (contact as any).nextActivityDate ?? null,
    ownerAssignedDate: (contact as any).ownerAssignedDate ?? null,
    firstConversionDate: (contact as any).firstConversionDate ?? null,
    recentConversionDate: (contact as any).recentConversionDate ?? null,
    dateOfLastLeadStatusChange: (contact as any).dateOfLastLeadStatusChange ?? null,
  });

  const inputCls = "rounded-xl bg-muted/30 border-border/50";

  return (
    <ScrollArea className="max-h-[60vh]">
      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="bg-muted/40 w-full flex-wrap h-auto gap-1 p-1 rounded-xl">
          <TabsTrigger value="identity" className="text-xs rounded-lg">Identity</TabsTrigger>
          <TabsTrigger value="communication" className="text-xs rounded-lg">Communication</TabsTrigger>
          <TabsTrigger value="address" className="text-xs rounded-lg">Address</TabsTrigger>
          <TabsTrigger value="lifecycle" className="text-xs rounded-lg">Lifecycle</TabsTrigger>
          <TabsTrigger value="logistics" className="text-xs rounded-lg">Logistics</TabsTrigger>
          <TabsTrigger value="social" className="text-xs rounded-lg">Social</TabsTrigger>
          <TabsTrigger value="email_prefs" className="text-xs rounded-lg">Email Prefs</TabsTrigger>
          <TabsTrigger value="activity_dates" className="text-xs rounded-lg">Activity Dates</TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-xs font-semibold">First Name</Label><Input value={form.firstName} onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Last Name</Label><Input value={form.lastName} onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Job Title</Label><Input value={form.jobTitle} onChange={(e) => setForm(p => ({ ...p, jobTitle: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Department</Label><Input value={form.department} onChange={(e) => setForm(p => ({ ...p, department: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2 col-span-2">
              <Label className="text-xs font-semibold">Associated Company *</Label>
              <Select value={form.companyId?.toString() ?? "none"} onValueChange={(v) => setForm(p => ({ ...p, companyId: v === "none" ? null : parseInt(v) }))}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">No company</SelectItem>
                  {companies.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="communication" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-xs font-semibold">Email *</Label><Input value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Direct Phone *</Label><Input value={form.directPhone} onChange={(e) => setForm(p => ({ ...p, directPhone: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Mobile Phone *</Label><Input value={form.mobilePhone} onChange={(e) => setForm(p => ({ ...p, mobilePhone: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Company Phone</Label><Input value={form.companyPhone} onChange={(e) => setForm(p => ({ ...p, companyPhone: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">LinkedIn URL</Label><Input value={form.linkedinUrl} onChange={(e) => setForm(p => ({ ...p, linkedinUrl: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Website URL</Label><Input value={form.websiteUrl} onChange={(e) => setForm(p => ({ ...p, websiteUrl: e.target.value }))} className={inputCls} /></div>
          </div>
        </TabsContent>

        <TabsContent value="address" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2"><Label className="text-xs font-semibold">Street Address</Label><Input value={form.streetAddress} onChange={(e) => setForm(p => ({ ...p, streetAddress: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2 col-span-2"><Label className="text-xs font-semibold">Address Line 2</Label><Input value={form.addressLine2} onChange={(e) => setForm(p => ({ ...p, addressLine2: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">City</Label><Input value={form.city} onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">State/Region</Label><Input value={form.stateRegion} onChange={(e) => setForm(p => ({ ...p, stateRegion: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Postal Code</Label><Input value={form.postalCode} onChange={(e) => setForm(p => ({ ...p, postalCode: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Country</Label><Input value={form.country} onChange={(e) => setForm(p => ({ ...p, country: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Timezone</Label><Input value={form.timezone} onChange={(e) => setForm(p => ({ ...p, timezone: e.target.value }))} className={inputCls} /></div>
          </div>
        </TabsContent>

        <TabsContent value="lifecycle" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Lifecycle Stage</Label>
              <Select value={form.lifecycleStage} onValueChange={(v) => setForm(p => ({ ...p, lifecycleStage: v }))}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">{STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.toUpperCase()}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Lead Status</Label>
              <Select value={form.leadStatus} onValueChange={(v) => setForm(p => ({ ...p, leadStatus: v }))}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">{LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Lead Source</Label><Input value={form.leadSource} onChange={(e) => setForm(p => ({ ...p, leadSource: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Lead Score</Label><Input type="number" value={form.leadScore} onChange={(e) => setForm(p => ({ ...p, leadScore: parseInt(e.target.value) || 0 }))} className={inputCls} /></div>
          </div>
        </TabsContent>

        <TabsContent value="logistics" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-xs font-semibold">Decision Maker Role</Label><Input value={form.decisionMakerRole} onChange={(e) => setForm(p => ({ ...p, decisionMakerRole: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Freight Volume</Label><Input value={form.freightVolume} onChange={(e) => setForm(p => ({ ...p, freightVolume: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Customer Type</Label><Input value={form.customerType} onChange={(e) => setForm(p => ({ ...p, customerType: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Payment Responsibility</Label><Input value={form.paymentResponsibility} onChange={(e) => setForm(p => ({ ...p, paymentResponsibility: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Preferred Contact Method</Label><Input value={form.preferredContactMethod} onChange={(e) => setForm(p => ({ ...p, preferredContactMethod: e.target.value }))} className={inputCls} /></div>
          </div>
        </TabsContent>

        <TabsContent value="social" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-xs font-semibold">Twitter/X Handle</Label><Input value={form.twitterHandle} onChange={(e) => setForm(p => ({ ...p, twitterHandle: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Facebook Profile</Label><Input value={form.facebookProfile} onChange={(e) => setForm(p => ({ ...p, facebookProfile: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Instagram Profile</Label><Input value={form.instagramProfile} onChange={(e) => setForm(p => ({ ...p, instagramProfile: e.target.value }))} className={inputCls} /></div>
          </div>
        </TabsContent>

        <TabsContent value="email_prefs" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Email Subscription</Label>
              <Select value={form.emailSubscriptionStatus} onValueChange={(v) => setForm(p => ({ ...p, emailSubscriptionStatus: v }))}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="subscribed">Subscribed</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="activity_dates" className="mt-4">
          <p className="text-xs text-muted-foreground mb-3">These dates are automatically updated by the system. You can also set them manually.</p>
          <div className="grid grid-cols-2 gap-4">
            {([
              { key: "lastLoggedOutgoingEmailDate", label: "Last Logged Outgoing Email" },
              { key: "lastModifiedDate", label: "Last Modified Date" },
              { key: "closeDate", label: "Close Date" },
              { key: "firstContactCreateDate", label: "First Contact Create Date" },
              { key: "firstDealCreatedDate", label: "First Deal Created Date" },
              { key: "lastActivityDate", label: "Last Activity Date" },
              { key: "lastBookedMeetingDate", label: "Last Booked Meeting Date" },
              { key: "nextActivityDate", label: "Next Activity Date" },
              { key: "ownerAssignedDate", label: "Owner Assigned Date" },
              { key: "firstConversionDate", label: "First Conversion Date" },
              { key: "recentConversionDate", label: "Recent Conversion Date" },
              { key: "dateOfLastLeadStatusChange", label: "Date of Last Lead Status Change" },
            ] as { key: string; label: string }[]).map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label className="text-xs font-semibold">{label}</Label>
                <Input
                  type="datetime-local"
                  value={(form as any)[key] ? new Date((form as any)[key]).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setForm(p => ({ ...p, [key]: e.target.value ? new Date(e.target.value).getTime() : null }))}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4 space-y-2">
        <Label className="text-xs font-semibold">Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes..." className="rounded-xl bg-muted/30 border-border/50 min-h-[80px]" />
      </div>

      <Button onClick={() => {
        if (!form.email.trim()) { alert("Email is required — every contact must have a valid email address."); return; }
        const phoneVal = (form.directPhone || "").trim() || (form.mobilePhone || "").trim();
        if (!phoneVal) { alert("Phone number is required — enter a Direct Phone or Mobile Phone."); return; }
        onSave(form);
      }} disabled={saving} className="gap-2 mt-4 rounded-xl shadow-sm">
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
      </Button>
    </ScrollArea>
  );
}
