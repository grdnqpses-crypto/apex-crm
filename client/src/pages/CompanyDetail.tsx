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
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, Globe, Linkedin,
  Clock, Users, FileText, Save, PhoneCall, Video, Target, Hash, User, Tag, DollarSign,
  Kanban, ListChecks, Activity, TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
import CustomFieldsPanel from "@/components/CustomFieldsPanel";

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
  deal_created: Target, deal_stage_changed: Hash, deal_won: Target, deal_lost: Target,
  contact_created: User, lifecycle_changed: Tag,
};

export default function CompanyDetail() {
  const { t, skinId } = useSkin();
  const params = useParams<{ id: string }>();
  const companyId = parseInt(params.id ?? "0");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: company, isLoading } = trpc.companies.get.useQuery({ id: companyId });
  const { data: contacts } = trpc.contacts.byCompany.useQuery({ companyId });
  const { data: activities } = trpc.activities.list.useQuery({ companyId });
  const { data: companyDeals } = trpc.crossFeature.dealsByCompany.useQuery({ companyId });
  const { data: companyTasks } = trpc.crossFeature.tasksByCompany.useQuery({ companyId });
  const updateMutation = trpc.companies.update.useMutation({
    onSuccess: () => { utils.companies.get.invalidate({ id: companyId }); toast.success("Company updated"); },
    onError: (e: any) => toast.error(e.message),
  });
  const addActivity = trpc.activities.create.useMutation({
    onSuccess: () => { utils.activities.list.invalidate(); toast.success("Activity added"); resetForm(); },
  });

  const [activityTab, setActivityTab] = useState<"note" | "email" | "call" | "meeting">("note");
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

  const resetForm = () => {
    setNoteBody(""); setCallNotes(""); setCallDuration(""); setEmailTo("");
    setEmailSubject(""); setEmailBody(""); setMeetingTitle(""); setMeetingLocation("");
    setMeetingNotes(""); setMeetingOutcome("");
  };

  const handleLogActivity = () => {
    const base = { companyId };
    if (activityTab === "note") {
      if (!noteBody.trim()) return toast.error("Note body is required");
      addActivity.mutate({ ...base, type: "note", subject: "Note added", body: noteBody });
    } else if (activityTab === "call") {
      addActivity.mutate({ ...base, type: "call", subject: `${callType} call - ${callOutcome}`, body: callNotes, callOutcome, callType, callDuration: callDuration ? parseInt(callDuration) : undefined });
    } else if (activityTab === "email") {
      if (!emailSubject.trim()) return toast.error("Subject is required");
      addActivity.mutate({ ...base, type: "email", subject: emailSubject, body: emailBody, emailTo });
    } else if (activityTab === "meeting") {
      if (!meetingTitle.trim()) return toast.error("Meeting title is required");
      addActivity.mutate({ ...base, type: "meeting", subject: meetingTitle, body: meetingNotes, meetingLocation, meetingOutcome });
    }
  };

  // Aggregate metrics
  const totalContacts = contacts?.length ?? 0;
  const openDeals = companyDeals?.filter((d: any) => d.status === "open").length ?? 0;
  const pipelineValue = companyDeals?.reduce((sum: number, d: any) => sum + (d.value ?? 0), 0) ?? 0;
  const pendingTasks = companyTasks?.filter((t: any) => t.status !== "completed").length ?? 0;

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Loading company...</span>
      </div>
    </div>
  );
  if (!company) return (
    <div className="text-center py-16">
      <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
        <Building2 className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-medium text-foreground">Company not found</p>
      <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={() => setLocation("/companies")}>Back to {t("companies")}</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => setLocation("/companies")} className="gap-2 rounded-xl text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Companies
      </Button>

      {/* ─── Header Card ─── */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-card to-card border border-border/40 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {company.industry && <span className="text-sm text-muted-foreground">{company.industry}</span>}
              {company.industry && company.companyType && <span className="text-muted-foreground/30">&bull;</span>}
              {company.companyType && <Badge variant="secondary" className="text-[10px] font-semibold rounded-lg bg-muted/60">{company.companyType}</Badge>}
              {company.leadStatus && (
                <Badge variant="secondary" className={`text-[10px] font-semibold rounded-lg ${STATUS_COLORS[company.leadStatus as string] ?? "bg-muted/60 text-muted-foreground"}`}>
                  {company.leadStatus}
                </Badge>
              )}
            </div>
            {company.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{company.description}</p>}
          </div>
        </div>
      </div>

      {/* ─── Aggregate Metrics ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Users} label="Contacts" value={String(totalContacts)} color="text-blue-600" bg="bg-blue-50" />
        <MetricCard icon={Kanban} label="Open Deals" value={String(openDeals)} color="text-emerald-600" bg="bg-emerald-50" />
        <MetricCard icon={DollarSign} label="Pipeline Value" value={`$${pipelineValue.toLocaleString()}`} color="text-amber-600" bg="bg-amber-50" />
        <MetricCard icon={ListChecks} label="Pending Tasks" value={String(pendingTasks)} color="text-purple-600" bg="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left: Company Info ─── */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-border/40 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Company Information</p>
              <div className="space-y-3">
                {company.companyEmail && <InfoRow icon={Mail} label="Email" value={company.companyEmail} />}
                {company.phone && <InfoRow icon={Phone} label="Phone" value={company.phone} />}
                {company.website && <InfoRow icon={Globe} label="Website" value={company.website} isLink />}
                {company.domain && <InfoRow icon={Globe} label="Domain" value={company.domain} />}
                {company.linkedinUrl && <InfoRow icon={Linkedin} label="LinkedIn" value={company.linkedinUrl} isLink />}
                {(company.city || company.country) && (
                  <InfoRow icon={MapPin} label="Location" value={[company.streetAddress, company.city, company.stateRegion, company.country].filter(Boolean).join(", ")} />
                )}
                {company.timezone && <InfoRow icon={Clock} label="Timezone" value={company.timezone} />}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/40 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Firmographics</p>
              <div className="grid grid-cols-2 gap-3">
                {company.numberOfEmployees && <StatMini label="Employees" value={company.numberOfEmployees} color="text-foreground" />}
                {company.annualRevenue && <StatMini label="Revenue" value={company.annualRevenue} color="text-emerald-600" />}
                {company.foundedYear && <StatMini label="Founded" value={company.foundedYear} color="text-foreground" />}
                {company.businessClassification && <StatMini label="Classification" value={company.businessClassification} color="text-foreground" />}
              </div>
            </CardContent>
          </Card>

          {(company.creditTerms || company.paymentStatus || company.lanePreferences) && (
            <Card className="rounded-2xl border-border/40 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Logistics</p>
                <div className="space-y-2 text-sm">
                  {company.creditTerms && <div><span className="text-muted-foreground text-xs">Credit Terms</span><p className="font-semibold text-foreground">{company.creditTerms}</p></div>}
                  {company.paymentStatus && <div><span className="text-muted-foreground text-xs">Payment Status</span><p className="font-semibold text-foreground">{company.paymentStatus}</p></div>}
                  {company.lanePreferences && <div><span className="text-muted-foreground text-xs">Lane Preferences</span><p className="font-semibold text-foreground">{company.lanePreferences}</p></div>}
                  {company.tmsIntegrationStatus && <div><span className="text-muted-foreground text-xs">TMS Integration</span><p className="font-semibold text-foreground">{company.tmsIntegrationStatus}</p></div>}
                </div>
              </CardContent>
            </Card>
          )}

          <CustomFieldsPanel objectType="company" recordId={companyId} />
          <div className="text-xs text-muted-foreground px-1">
            Created {new Date(company.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* ─── Right: Tabs ─── */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="bg-muted/40 rounded-xl p-1">
              <TabsTrigger value="overview" className="rounded-lg text-xs">Overview</TabsTrigger>
              <TabsTrigger value="contacts" className="rounded-lg text-xs">Contacts ({totalContacts})</TabsTrigger>
              <TabsTrigger value="deals" className="rounded-lg text-xs">Deals{companyDeals && companyDeals.length > 0 ? ` (${companyDeals.length})` : ''}</TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-lg text-xs">Tasks{companyTasks && companyTasks.length > 0 ? ` (${companyTasks.length})` : ''}</TabsTrigger>
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
                  {(!activities || activities.length === 0) && (
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

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="mt-4">
              <Card className="rounded-2xl border-border/40 shadow-sm">
                <CardContent className="p-4 space-y-2">
                  {(!contacts || contacts.length === 0) && (
                    <div className="text-center py-10">
                      <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                        <Users className="h-6 w-6 text-blue-400" />
                      </div>
                      <p className="text-sm text-muted-foreground">No contacts at this company yet.</p>
                    </div>
                  )}
                  {contacts?.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setLocation(`/contacts/${c.id}`)}>
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{c.firstName?.charAt(0)}{c.lastName?.charAt(0) ?? ""}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{c.firstName} {c.lastName ?? ""}</p>
                        <p className="text-xs text-muted-foreground">{c.jobTitle ?? c.email ?? "—"}</p>
                      </div>
                      {c.leadStatus && (
                        <Badge variant="secondary" className={`text-[10px] rounded-md ${STATUS_COLORS[c.leadStatus as string] ?? "bg-muted/60 text-muted-foreground"}`}>
                          {c.leadStatus}
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Deals Tab */}
            <TabsContent value="deals" className="mt-4">
              <Card className="rounded-2xl border-border/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" /> Company Deals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!companyDeals || companyDeals.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                        <DollarSign className="h-6 w-6 text-emerald-400" />
                      </div>
                      <p className="text-sm text-muted-foreground">No deals associated yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {companyDeals.map((deal: any) => (
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
                    <ListChecks className="h-4 w-4 text-amber-600" /> Company Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!companyTasks || companyTasks.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                        <ListChecks className="h-6 w-6 text-amber-400" />
                      </div>
                      <p className="text-sm text-muted-foreground">No tasks associated yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {companyTasks.map((task: any) => (
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
                    {(["note", "email", "call", "meeting"] as const).map(t => (
                      <Button key={t} variant={activityTab === t ? "default" : "outline"} size="sm" onClick={() => setActivityTab(t)} className="capitalize text-xs rounded-lg">{t}</Button>
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
                      <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="To email" className="rounded-xl bg-muted/30 border-border/50" />
                      <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Subject" className="rounded-xl bg-muted/30 border-border/50" />
                      <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Email body..." className="rounded-xl bg-muted/30 border-border/50 min-h-[80px]" />
                    </div>
                  )}
                  {activityTab === "meeting" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="Meeting title" className="rounded-xl bg-muted/30 border-border/50 col-span-2" />
                      <Input value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} placeholder="Location / Zoom" className="rounded-xl bg-muted/30 border-border/50" />
                      <Select value={meetingOutcome || "none"} onValueChange={(v) => setMeetingOutcome(v === "none" ? "" : v)}>
                        <SelectTrigger className="rounded-xl bg-muted/30 border-border/50"><SelectValue placeholder="Outcome" /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="none">No outcome</SelectItem>
                          <SelectItem value="Scheduled">Scheduled</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="No-show">No-show</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} placeholder="Meeting notes..." className="rounded-xl bg-muted/30 border-border/50 col-span-2 min-h-[60px]" />
                    </div>
                  )}
                  <Button size="sm" disabled={addActivity.isPending} onClick={handleLogActivity} className="rounded-xl shadow-sm">
                    {addActivity.isPending ? "Logging..." : `Log ${activityTab}`}
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {(!activities || activities.length === 0) && (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">No activities yet.</p>
                  </div>
                )}
                {activities?.map((activity) => {
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
                  <EditCompanyForm company={company} onSave={(data: any) => updateMutation.mutate({ id: companyId, ...data })} saving={updateMutation.isPending} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string; color: string; bg: string }) {
  return (
    <Card className="rounded-2xl border-border/40 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{label}</p>
          <p className={`text-lg font-bold ${color}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
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

function EditCompanyForm({ company, onSave, saving }: { company: any; onSave: (data: any) => void; saving: boolean }) {
  const [form, setForm] = useState({
    name: company.name ?? "",
    domain: company.domain ?? "",
    companyType: company.companyType ?? "",
    companyEmail: company.companyEmail ?? "",
    phone: company.phone ?? "",
    website: company.website ?? "",
    streetAddress: company.streetAddress ?? "",
    addressLine2: company.addressLine2 ?? "",
    city: company.city ?? "",
    stateRegion: company.stateRegion ?? "",
    postalCode: company.postalCode ?? "",
    country: company.country ?? "",
    timezone: company.timezone ?? "",
    industry: company.industry ?? "",
    numberOfEmployees: company.numberOfEmployees ?? "",
    annualRevenue: company.annualRevenue ?? "",
    description: company.description ?? "",
    businessClassification: company.businessClassification ?? "",
    foundedYear: company.foundedYear ?? "",
    leadSource: company.leadSource ?? "",
    leadStatus: company.leadStatus ?? "Cold",
    creditTerms: company.creditTerms ?? "",
    paymentStatus: company.paymentStatus ?? "",
    lanePreferences: company.lanePreferences ?? "",
    tmsIntegrationStatus: company.tmsIntegrationStatus ?? "",
    facebookPage: company.facebookPage ?? "",
    twitterHandle: company.twitterHandle ?? "",
    linkedinUrl: company.linkedinUrl ?? "",
    youtubeUrl: company.youtubeUrl ?? "",
  });

  const inputCls = "rounded-xl bg-muted/30 border-border/50";

  return (
    <ScrollArea className="max-h-[60vh]">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="bg-muted/40 w-full flex-wrap h-auto gap-1 p-1 rounded-xl">
          <TabsTrigger value="basic" className="text-xs rounded-lg">Basic</TabsTrigger>
          <TabsTrigger value="location" className="text-xs rounded-lg">Location</TabsTrigger>
          <TabsTrigger value="firmographic" className="text-xs rounded-lg">Firmographic</TabsTrigger>
          <TabsTrigger value="lifecycle" className="text-xs rounded-lg">Lifecycle</TabsTrigger>
          <TabsTrigger value="logistics" className="text-xs rounded-lg">Logistics</TabsTrigger>
          <TabsTrigger value="social" className="text-xs rounded-lg">Social</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-xs font-semibold">Company Name</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Domain</Label><Input value={form.domain} onChange={(e) => setForm(p => ({ ...p, domain: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Company Email</Label><Input value={form.companyEmail} onChange={(e) => setForm(p => ({ ...p, companyEmail: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Phone</Label><Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Website</Label><Input value={form.website} onChange={(e) => setForm(p => ({ ...p, website: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Company Type</Label>
              <Select value={form.companyType || "none"} onValueChange={(v) => setForm(p => ({ ...p, companyType: v === "none" ? "" : v }))}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">Not specified</SelectItem>
                  <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="Distributor">Distributor</SelectItem>
                  <SelectItem value="Supplier">Supplier</SelectItem>
                  <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                  <SelectItem value="Retailer">Retailer</SelectItem>
                  <SelectItem value="Carrier">Carrier</SelectItem>
                  <SelectItem value="Broker">Broker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2"><Label className="text-xs font-semibold">Description</Label><Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className={`${inputCls} min-h-[80px]`} /></div>
          </div>
        </TabsContent>

        <TabsContent value="location" className="mt-4">
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

        <TabsContent value="firmographic" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-xs font-semibold">Industry</Label><Input value={form.industry} onChange={(e) => setForm(p => ({ ...p, industry: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Number of Employees</Label><Input value={form.numberOfEmployees} onChange={(e) => setForm(p => ({ ...p, numberOfEmployees: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Annual Revenue</Label><Input value={form.annualRevenue} onChange={(e) => setForm(p => ({ ...p, annualRevenue: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Founded Year</Label><Input value={form.foundedYear} onChange={(e) => setForm(p => ({ ...p, foundedYear: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Business Classification</Label>
              <Select value={form.businessClassification || "none"} onValueChange={(v) => setForm(p => ({ ...p, businessClassification: v === "none" ? "" : v }))}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">Not specified</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="Public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="lifecycle" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-xs font-semibold">Lead Source</Label><Input value={form.leadSource} onChange={(e) => setForm(p => ({ ...p, leadSource: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Lead Status</Label>
              <Select value={form.leadStatus} onValueChange={(v) => setForm(p => ({ ...p, leadStatus: v }))}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">{LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logistics" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-xs font-semibold">Credit Terms</Label><Input value={form.creditTerms} onChange={(e) => setForm(p => ({ ...p, creditTerms: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Payment Status</Label><Input value={form.paymentStatus} onChange={(e) => setForm(p => ({ ...p, paymentStatus: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Lane Preferences</Label><Input value={form.lanePreferences} onChange={(e) => setForm(p => ({ ...p, lanePreferences: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">TMS Integration</Label><Input value={form.tmsIntegrationStatus} onChange={(e) => setForm(p => ({ ...p, tmsIntegrationStatus: e.target.value }))} className={inputCls} /></div>
          </div>
        </TabsContent>

        <TabsContent value="social" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-xs font-semibold">Facebook Page</Label><Input value={form.facebookPage} onChange={(e) => setForm(p => ({ ...p, facebookPage: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">Twitter/X Handle</Label><Input value={form.twitterHandle} onChange={(e) => setForm(p => ({ ...p, twitterHandle: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">LinkedIn URL</Label><Input value={form.linkedinUrl} onChange={(e) => setForm(p => ({ ...p, linkedinUrl: e.target.value }))} className={inputCls} /></div>
            <div className="space-y-2"><Label className="text-xs font-semibold">YouTube URL</Label><Input value={form.youtubeUrl} onChange={(e) => setForm(p => ({ ...p, youtubeUrl: e.target.value }))} className={inputCls} /></div>
          </div>
        </TabsContent>
      </Tabs>

      <Button onClick={() => onSave(form)} disabled={saving} className="gap-2 mt-4 rounded-xl shadow-sm">
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
      </Button>
    </ScrollArea>
  );
}
