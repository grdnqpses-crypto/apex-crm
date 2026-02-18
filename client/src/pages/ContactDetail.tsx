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
  ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, MessageSquare,
  PhoneCall, Video, FileText, Save, Globe, Linkedin, Clock, User, Tag,
  Truck, CreditCard, Target, Smartphone, Hash, Kanban, ListChecks, DollarSign
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";


const STAGES = ["subscriber", "lead", "mql", "sql", "opportunity", "customer", "evangelist"] as const;
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

const ACTIVITY_ICONS: Record<string, any> = {
  note: FileText, email: Mail, call: PhoneCall, meeting: Video, task: FileText,
  deal_created: Target, deal_stage_changed: Hash, deal_won: Target, deal_lost: Target,
  contact_created: User, lifecycle_changed: Tag,
};

const ACTIVITY_FILTERS = ["all", "note", "email", "call", "meeting", "task"] as const;

export default function ContactDetail() {
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

  // Activity form states
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

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!contact) return <div className="text-center py-12 text-muted-foreground">Contact not found.</div>;

  const associatedCompany = companies?.items?.find((c: any) => c.id === contact.companyId);

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.contactDetail} />
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/contacts")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Contacts
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-primary">{contact.firstName.charAt(0)}{contact.lastName?.charAt(0) ?? ""}</span>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{contact.firstName} {contact.lastName ?? ""}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {contact.jobTitle && <span className="text-sm text-muted-foreground">{contact.jobTitle}</span>}
            <Badge variant="secondary" className="text-xs font-semibold uppercase">{contact.lifecycleStage}</Badge>
            <Badge variant="outline" className="text-xs">{contact.leadStatus}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact Info Card */}
        <Card className="bg-card border-border">
          <CardContent className="p-5 space-y-4">
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

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Engagement</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Lead Score</span><p className="font-semibold text-foreground">{contact.leadScore}</p></div>
                <div><span className="text-muted-foreground">Times Contacted</span><p className="font-semibold text-foreground">{contact.timesContacted ?? 0}</p></div>
                <div><span className="text-muted-foreground">Lead Source</span><p className="font-semibold text-foreground">{contact.leadSource ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Created</span><p className="font-semibold text-foreground">{new Date(contact.createdAt).toLocaleDateString()}</p></div>
              </div>
            </div>

            {(contact.decisionMakerRole || contact.freightVolume || contact.customerType) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Logistics</p>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {contact.decisionMakerRole && <div><span className="text-muted-foreground">Decision Maker</span><p className="font-semibold text-foreground">{contact.decisionMakerRole}</p></div>}
                    {contact.freightVolume && <div><span className="text-muted-foreground">Freight Volume</span><p className="font-semibold text-foreground">{contact.freightVolume}</p></div>}
                    {contact.customerType && <div><span className="text-muted-foreground">Customer Type</span><p className="font-semibold text-foreground">{contact.customerType}</p></div>}
                    {contact.paymentResponsibility && <div><span className="text-muted-foreground">Payment</span><p className="font-semibold text-foreground">{contact.paymentResponsibility}</p></div>}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="bg-secondary/30">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="deals">Deals{contactDeals && contactDeals.length > 0 ? ` (${contactDeals.length})` : ''}</TabsTrigger>
              <TabsTrigger value="tasks">Tasks{contactTasks && contactTasks.length > 0 ? ` (${contactTasks.length})` : ''}</TabsTrigger>
              <TabsTrigger value="companies">Companies</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
            </TabsList>

            {/* Overview Tab - Timeline */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Activity Timeline</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {activities?.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No activities yet.</p>}
                  {activities?.slice(0, 20).map((activity) => {
                    const Icon = ACTIVITY_ICONS[activity.type] || FileText;
                    return (
                      <div key={activity.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">{activity.subject || activity.type}</p>
                            <span className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</span>
                          </div>
                          {activity.body && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{activity.body}</p>}
                          <Badge variant="outline" className="text-[10px] mt-1 capitalize">{activity.type}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Deals Tab */}
            <TabsContent value="deals" className="mt-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Associated Deals</CardTitle></CardHeader>
                <CardContent>
                  {!contactDeals || contactDeals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No deals associated with this contact. Create one from the Deals page.</p>
                  ) : (
                    <div className="space-y-2">
                      {contactDeals.map((deal: any) => (
                        <div key={deal.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 cursor-pointer" onClick={() => setLocation(`/deals`)}>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-chart-3/10 flex items-center justify-center">
                              <Kanban className="h-4 w-4 text-chart-3" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{deal.name}</p>
                              <p className="text-xs text-muted-foreground">{deal.stage}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">${(deal.value ?? 0).toLocaleString()}</p>
                            <Badge variant="outline" className="text-[10px]">{deal.status}</Badge>
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
              <Card className="bg-card border-border">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Associated Tasks</CardTitle></CardHeader>
                <CardContent>
                  {!contactTasks || contactTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No tasks associated with this contact.</p>
                  ) : (
                    <div className="space-y-2">
                      {contactTasks.map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${task.status === 'completed' ? 'bg-success/10' : 'bg-warning/10'}`}>
                              <ListChecks className={`h-4 w-4 ${task.status === 'completed' ? 'text-success' : 'text-warning'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{task.title}</p>
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

            {/* Companies Tab */}
            <TabsContent value="companies" className="mt-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Associated Companies</CardTitle></CardHeader>
                <CardContent>
                  {associatedCompany ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 cursor-pointer hover:bg-secondary/30" onClick={() => setLocation(`/companies/${associatedCompany.id}`)}>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{associatedCompany.name}</p>
                        {associatedCompany.industry && <p className="text-xs text-muted-foreground">{associatedCompany.industry}</p>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">No associated company. Link one via the Edit tab.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activities Tab - Full Activity Logging */}
            <TabsContent value="activities" className="space-y-4 mt-4">
              {/* Activity Creation */}
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-1 flex-wrap">
                    {(["note", "email", "call", "meeting", "task"] as const).map(t => (
                      <Button key={t} variant={activityTab === t ? "default" : "outline"} size="sm" onClick={() => setActivityTab(t)} className="capitalize text-xs">
                        {t}
                      </Button>
                    ))}
                  </div>

                  {activityTab === "note" && (
                    <Textarea value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Write a note..." className="bg-secondary/30 min-h-[80px]" />
                  )}

                  {activityTab === "call" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={callOutcome} onValueChange={setCallOutcome}>
                        <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Connected">Connected</SelectItem>
                          <SelectItem value="Left voicemail">Left voicemail</SelectItem>
                          <SelectItem value="No answer">No answer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={callType} onValueChange={setCallType}>
                        <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inbound">Inbound</SelectItem>
                          <SelectItem value="Outbound">Outbound</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input value={callDuration} onChange={(e) => setCallDuration(e.target.value)} placeholder="Duration (minutes)" type="number" className="bg-secondary/30" />
                      <div />
                      <Textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} placeholder="Call notes..." className="bg-secondary/30 col-span-2 min-h-[60px]" />
                    </div>
                  )}

                  {activityTab === "email" && (
                    <div className="space-y-3">
                      <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="To email address" className="bg-secondary/30" />
                      <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Subject line" className="bg-secondary/30" />
                      <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Email body..." className="bg-secondary/30 min-h-[80px]" />
                    </div>
                  )}

                  {activityTab === "meeting" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="Meeting title" className="bg-secondary/30 col-span-2" />
                      <Input value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} placeholder="Location / Zoom link" className="bg-secondary/30" />
                      <Select value={meetingOutcome || "none"} onValueChange={(v) => setMeetingOutcome(v === "none" ? "" : v)}>
                        <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Outcome" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No outcome yet</SelectItem>
                          <SelectItem value="Scheduled">Scheduled</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="No-show">No-show</SelectItem>
                          <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} placeholder="Meeting notes..." className="bg-secondary/30 col-span-2 min-h-[60px]" />
                    </div>
                  )}

                  {activityTab === "task" && (
                    <div className="space-y-3">
                      <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title" className="bg-secondary/30" />
                      <Textarea value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} placeholder="Task notes..." className="bg-secondary/30 min-h-[60px]" />
                    </div>
                  )}

                  <Button size="sm" disabled={addActivity.isPending} onClick={handleLogActivity}>
                    {addActivity.isPending ? "Logging..." : `Log ${activityTab}`}
                  </Button>
                </CardContent>
              </Card>

              {/* Activity Filter */}
              <div className="flex gap-1 flex-wrap">
                {ACTIVITY_FILTERS.map(f => (
                  <Button key={f} variant={activityFilter === f ? "default" : "outline"} size="sm" onClick={() => setActivityFilter(f)} className="capitalize text-xs">
                    {f === "all" ? "All Activities" : f + "s"}
                  </Button>
                ))}
              </div>

              {/* Activity List */}
              <div className="space-y-2">
                {filteredActivities.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No activities found.</p>}
                {filteredActivities.map((activity) => {
                  const Icon = ACTIVITY_ICONS[activity.type] || FileText;
                  return (
                    <Card key={activity.id} className="bg-card border-border">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-foreground">{activity.subject || activity.type}</p>
                              <span className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</span>
                            </div>
                            {activity.body && <p className="text-sm text-muted-foreground mt-0.5">{activity.body}</p>}
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] capitalize">{activity.type}</Badge>
                              {activity.callOutcome && <Badge variant="secondary" className="text-[10px]">{activity.callOutcome}</Badge>}
                              {activity.callType && <Badge variant="secondary" className="text-[10px]">{activity.callType}</Badge>}
                              {activity.meetingOutcome && <Badge variant="secondary" className="text-[10px]">{activity.meetingOutcome}</Badge>}
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
              <Card className="bg-card border-border">
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
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {isLink ? (
          <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{value}</a>
        ) : (
          <p className="text-foreground break-all">{value}</p>
        )}
      </div>
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
  });

  return (
    <ScrollArea className="max-h-[60vh]">
      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="bg-secondary/30 w-full flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="identity" className="text-xs">Identity</TabsTrigger>
          <TabsTrigger value="communication" className="text-xs">Communication</TabsTrigger>
          <TabsTrigger value="address" className="text-xs">Address</TabsTrigger>
          <TabsTrigger value="lifecycle" className="text-xs">Lifecycle</TabsTrigger>
          <TabsTrigger value="logistics" className="text-xs">Logistics</TabsTrigger>
          <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
          <TabsTrigger value="email_prefs" className="text-xs">Email Prefs</TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>First Name</Label><Input value={form.firstName} onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Last Name</Label><Input value={form.lastName} onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Job Title</Label><Input value={form.jobTitle} onChange={(e) => setForm(p => ({ ...p, jobTitle: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={(e) => setForm(p => ({ ...p, department: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2 col-span-2">
              <Label>Associated Company</Label>
              <Select value={form.companyId?.toString() ?? "none"} onValueChange={(v) => setForm(p => ({ ...p, companyId: v === "none" ? null : parseInt(v) }))}>
                <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No company</SelectItem>
                  {companies.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="communication" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Direct Phone</Label><Input value={form.directPhone} onChange={(e) => setForm(p => ({ ...p, directPhone: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Mobile Phone</Label><Input value={form.mobilePhone} onChange={(e) => setForm(p => ({ ...p, mobilePhone: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Company Phone</Label><Input value={form.companyPhone} onChange={(e) => setForm(p => ({ ...p, companyPhone: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>LinkedIn URL</Label><Input value={form.linkedinUrl} onChange={(e) => setForm(p => ({ ...p, linkedinUrl: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Website URL</Label><Input value={form.websiteUrl} onChange={(e) => setForm(p => ({ ...p, websiteUrl: e.target.value }))} className="bg-secondary/30" /></div>
          </div>
        </TabsContent>

        <TabsContent value="address" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2"><Label>Street Address</Label><Input value={form.streetAddress} onChange={(e) => setForm(p => ({ ...p, streetAddress: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2 col-span-2"><Label>Address Line 2</Label><Input value={form.addressLine2} onChange={(e) => setForm(p => ({ ...p, addressLine2: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>State/Region</Label><Input value={form.stateRegion} onChange={(e) => setForm(p => ({ ...p, stateRegion: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Postal Code</Label><Input value={form.postalCode} onChange={(e) => setForm(p => ({ ...p, postalCode: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Country</Label><Input value={form.country} onChange={(e) => setForm(p => ({ ...p, country: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Timezone</Label><Input value={form.timezone} onChange={(e) => setForm(p => ({ ...p, timezone: e.target.value }))} className="bg-secondary/30" /></div>
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
            <div className="space-y-2"><Label>Lead Source</Label><Input value={form.leadSource} onChange={(e) => setForm(p => ({ ...p, leadSource: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Lead Score</Label><Input type="number" value={form.leadScore} onChange={(e) => setForm(p => ({ ...p, leadScore: parseInt(e.target.value) || 0 }))} className="bg-secondary/30" /></div>
          </div>
        </TabsContent>

        <TabsContent value="logistics" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Decision Maker Role</Label><Input value={form.decisionMakerRole} onChange={(e) => setForm(p => ({ ...p, decisionMakerRole: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Freight Volume</Label><Input value={form.freightVolume} onChange={(e) => setForm(p => ({ ...p, freightVolume: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Customer Type</Label><Input value={form.customerType} onChange={(e) => setForm(p => ({ ...p, customerType: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Payment Responsibility</Label><Input value={form.paymentResponsibility} onChange={(e) => setForm(p => ({ ...p, paymentResponsibility: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Preferred Contact Method</Label><Input value={form.preferredContactMethod} onChange={(e) => setForm(p => ({ ...p, preferredContactMethod: e.target.value }))} className="bg-secondary/30" /></div>
          </div>
        </TabsContent>

        <TabsContent value="social" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Twitter/X Handle</Label><Input value={form.twitterHandle} onChange={(e) => setForm(p => ({ ...p, twitterHandle: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Facebook Profile</Label><Input value={form.facebookProfile} onChange={(e) => setForm(p => ({ ...p, facebookProfile: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Instagram Profile</Label><Input value={form.instagramProfile} onChange={(e) => setForm(p => ({ ...p, instagramProfile: e.target.value }))} className="bg-secondary/30" /></div>
          </div>
        </TabsContent>

        <TabsContent value="email_prefs" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email Subscription</Label>
              <Select value={form.emailSubscriptionStatus} onValueChange={(v) => setForm(p => ({ ...p, emailSubscriptionStatus: v }))}>
                <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscribed">Subscribed</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4 space-y-2">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes..." className="bg-secondary/30 min-h-[80px]" />
      </div>

      <Button onClick={() => onSave(form)} disabled={saving} className="gap-2 mt-4">
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
      </Button>
    </ScrollArea>
  );
}
