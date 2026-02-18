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
  ArrowLeft, Mail, Phone, MapPin, Building2, Globe, Linkedin,
  Clock, Users, FileText, Save, PhoneCall, Video, Target, Hash, User, Tag, DollarSign, Calendar
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

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

export default function CompanyDetail() {
  const params = useParams<{ id: string }>();
  const companyId = parseInt(params.id ?? "0");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: company, isLoading } = trpc.companies.get.useQuery({ id: companyId });
  const { data: contacts } = trpc.contacts.byCompany.useQuery({ companyId });
  const { data: activities } = trpc.activities.list.useQuery({ companyId });
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

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!company) return <div className="text-center py-12 text-muted-foreground">Company not found.</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => setLocation("/companies")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Companies
      </Button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {company.industry && <span className="text-sm text-muted-foreground">{company.industry}</span>}
            {company.leadStatus && <Badge variant="outline" className="text-xs">{company.leadStatus}</Badge>}
            {company.companyType && <Badge variant="secondary" className="text-xs">{company.companyType}</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Company Info */}
        <Card className="bg-card border-border">
          <CardContent className="p-5 space-y-4">
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

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Firmographics</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {company.numberOfEmployees && <div><span className="text-muted-foreground">Employees</span><p className="font-semibold text-foreground">{company.numberOfEmployees}</p></div>}
                {company.annualRevenue && <div><span className="text-muted-foreground">Revenue</span><p className="font-semibold text-foreground">{company.annualRevenue}</p></div>}
                {company.foundedYear && <div><span className="text-muted-foreground">Founded</span><p className="font-semibold text-foreground">{company.foundedYear}</p></div>}
                {company.businessClassification && <div><span className="text-muted-foreground">Classification</span><p className="font-semibold text-foreground">{company.businessClassification}</p></div>}
              </div>
            </div>

            {(company.creditTerms || company.paymentStatus || company.lanePreferences) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Logistics</p>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {company.creditTerms && <div><span className="text-muted-foreground">Credit Terms</span><p className="font-semibold text-foreground">{company.creditTerms}</p></div>}
                    {company.paymentStatus && <div><span className="text-muted-foreground">Payment Status</span><p className="font-semibold text-foreground">{company.paymentStatus}</p></div>}
                    {company.lanePreferences && <div><span className="text-muted-foreground">Lane Preferences</span><p className="font-semibold text-foreground">{company.lanePreferences}</p></div>}
                    {company.tmsIntegrationStatus && <div><span className="text-muted-foreground">TMS Integration</span><p className="font-semibold text-foreground">{company.tmsIntegrationStatus}</p></div>}
                  </div>
                </div>
              </>
            )}

            <Separator />
            <div className="text-xs text-muted-foreground">
              Created {new Date(company.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="bg-secondary/30">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">Contacts ({contacts?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {company.description && (
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Description</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground">{company.description}</p></CardContent>
                </Card>
              )}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Activity Timeline</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {(!activities || activities.length === 0) && <p className="text-sm text-muted-foreground text-center py-6">No activities yet.</p>}
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

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="mt-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-2">
                  {(!contacts || contacts.length === 0) && <p className="text-sm text-muted-foreground text-center py-6">No contacts associated with this company.</p>}
                  {contacts?.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 cursor-pointer hover:bg-secondary/30" onClick={() => setLocation(`/contacts/${c.id}`)}>
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">{c.firstName?.charAt(0)}{c.lastName?.charAt(0) ?? ""}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{c.firstName} {c.lastName ?? ""}</p>
                        <p className="text-xs text-muted-foreground">{c.jobTitle ?? c.email ?? "—"}</p>
                      </div>
                      {c.leadStatus && <Badge variant="outline" className="text-[10px]">{c.leadStatus}</Badge>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activities Tab */}
            <TabsContent value="activities" className="space-y-4 mt-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-1 flex-wrap">
                    {(["note", "email", "call", "meeting"] as const).map(t => (
                      <Button key={t} variant={activityTab === t ? "default" : "outline"} size="sm" onClick={() => setActivityTab(t)} className="capitalize text-xs">{t}</Button>
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
                      <Input value={callDuration} onChange={(e) => setCallDuration(e.target.value)} placeholder="Duration (min)" type="number" className="bg-secondary/30" />
                      <div />
                      <Textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} placeholder="Call notes..." className="bg-secondary/30 col-span-2 min-h-[60px]" />
                    </div>
                  )}
                  {activityTab === "email" && (
                    <div className="space-y-3">
                      <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="To email" className="bg-secondary/30" />
                      <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Subject" className="bg-secondary/30" />
                      <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Email body..." className="bg-secondary/30 min-h-[80px]" />
                    </div>
                  )}
                  {activityTab === "meeting" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} placeholder="Meeting title" className="bg-secondary/30 col-span-2" />
                      <Input value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} placeholder="Location / Zoom" className="bg-secondary/30" />
                      <Select value={meetingOutcome || "none"} onValueChange={(v) => setMeetingOutcome(v === "none" ? "" : v)}>
                        <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Outcome" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No outcome</SelectItem>
                          <SelectItem value="Scheduled">Scheduled</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="No-show">No-show</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} placeholder="Meeting notes..." className="bg-secondary/30 col-span-2 min-h-[60px]" />
                    </div>
                  )}
                  <Button size="sm" disabled={addActivity.isPending} onClick={handleLogActivity}>
                    {addActivity.isPending ? "Logging..." : `Log ${activityTab}`}
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {(!activities || activities.length === 0) && <p className="text-sm text-muted-foreground text-center py-6">No activities yet.</p>}
                {activities?.map((activity) => {
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

  return (
    <ScrollArea className="max-h-[60vh]">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="bg-secondary/30 w-full flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
          <TabsTrigger value="location" className="text-xs">Location</TabsTrigger>
          <TabsTrigger value="firmographic" className="text-xs">Firmographic</TabsTrigger>
          <TabsTrigger value="lifecycle" className="text-xs">Lifecycle</TabsTrigger>
          <TabsTrigger value="logistics" className="text-xs">Logistics</TabsTrigger>
          <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Company Name</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Domain</Label><Input value={form.domain} onChange={(e) => setForm(p => ({ ...p, domain: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Company Email</Label><Input value={form.companyEmail} onChange={(e) => setForm(p => ({ ...p, companyEmail: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm(p => ({ ...p, website: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2">
              <Label>Company Type</Label>
              <Select value={form.companyType || "none"} onValueChange={(v) => setForm(p => ({ ...p, companyType: v === "none" ? "" : v }))}>
                <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
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
            <div className="space-y-2 col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="bg-secondary/30 min-h-[80px]" /></div>
          </div>
        </TabsContent>

        <TabsContent value="location" className="mt-4">
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

        <TabsContent value="firmographic" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Industry</Label><Input value={form.industry} onChange={(e) => setForm(p => ({ ...p, industry: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Number of Employees</Label><Input value={form.numberOfEmployees} onChange={(e) => setForm(p => ({ ...p, numberOfEmployees: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Annual Revenue</Label><Input value={form.annualRevenue} onChange={(e) => setForm(p => ({ ...p, annualRevenue: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Founded Year</Label><Input value={form.foundedYear} onChange={(e) => setForm(p => ({ ...p, foundedYear: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2">
              <Label>Business Classification</Label>
              <Select value={form.businessClassification || "none"} onValueChange={(v) => setForm(p => ({ ...p, businessClassification: v === "none" ? "" : v }))}>
                <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
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
            <div className="space-y-2"><Label>Lead Source</Label><Input value={form.leadSource} onChange={(e) => setForm(p => ({ ...p, leadSource: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2">
              <Label>Lead Status</Label>
              <Select value={form.leadStatus} onValueChange={(v) => setForm(p => ({ ...p, leadStatus: v }))}>
                <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                <SelectContent>{LEAD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logistics" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Credit Terms</Label><Input value={form.creditTerms} onChange={(e) => setForm(p => ({ ...p, creditTerms: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Payment Status</Label><Input value={form.paymentStatus} onChange={(e) => setForm(p => ({ ...p, paymentStatus: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Lane Preferences</Label><Input value={form.lanePreferences} onChange={(e) => setForm(p => ({ ...p, lanePreferences: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>TMS Integration</Label><Input value={form.tmsIntegrationStatus} onChange={(e) => setForm(p => ({ ...p, tmsIntegrationStatus: e.target.value }))} className="bg-secondary/30" /></div>
          </div>
        </TabsContent>

        <TabsContent value="social" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Facebook Page</Label><Input value={form.facebookPage} onChange={(e) => setForm(p => ({ ...p, facebookPage: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>Twitter/X Handle</Label><Input value={form.twitterHandle} onChange={(e) => setForm(p => ({ ...p, twitterHandle: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>LinkedIn URL</Label><Input value={form.linkedinUrl} onChange={(e) => setForm(p => ({ ...p, linkedinUrl: e.target.value }))} className="bg-secondary/30" /></div>
            <div className="space-y-2"><Label>YouTube URL</Label><Input value={form.youtubeUrl} onChange={(e) => setForm(p => ({ ...p, youtubeUrl: e.target.value }))} className="bg-secondary/30" /></div>
          </div>
        </TabsContent>
      </Tabs>

      <Button onClick={() => onSave(form)} disabled={saving} className="gap-2 mt-4">
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
      </Button>
    </ScrollArea>
  );
}
