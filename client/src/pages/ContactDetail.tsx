import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, MessageSquare, PhoneCall, Video, FileText, Save } from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

const STAGES = ["subscriber", "lead", "mql", "sql", "opportunity", "customer", "evangelist"] as const;
const ACTIVITY_ICONS: Record<string, any> = {
  note: FileText, email: Mail, call: PhoneCall, meeting: Video, task: FileText,
  deal_created: FileText, deal_stage_changed: FileText, deal_won: FileText, deal_lost: FileText,
  contact_created: FileText, lifecycle_changed: FileText,
};

export default function ContactDetail() {
  const params = useParams<{ id: string }>();
  const contactId = parseInt(params.id ?? "0");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: contact, isLoading } = trpc.contacts.get.useQuery({ id: contactId });
  const { data: activities } = trpc.activities.list.useQuery({ contactId });
  const updateMutation = trpc.contacts.update.useMutation({
    onSuccess: () => { utils.contacts.get.invalidate({ id: contactId }); toast.success("Contact updated"); },
    onError: (e) => toast.error(e.message),
  });
  const addActivity = trpc.activities.create.useMutation({
    onSuccess: () => { utils.activities.list.invalidate(); toast.success("Activity added"); setNoteBody(""); },
  });

  const [noteBody, setNoteBody] = useState("");
  const [noteType, setNoteType] = useState<"note" | "email" | "call" | "meeting">("note");

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!contact) return <div className="text-center py-12 text-muted-foreground">Contact not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/contacts")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">{contact.firstName.charAt(0)}{contact.lastName?.charAt(0) ?? ""}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{contact.firstName} {contact.lastName ?? ""}</h2>
                {contact.title && <p className="text-sm text-muted-foreground">{contact.title}</p>}
              </div>
              <Badge variant="secondary" className="text-xs font-semibold uppercase">{contact.lifecycleStage}</Badge>
              <div className="w-full space-y-3 text-left">
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" /> {contact.email}
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" /> {contact.phone}
                  </div>
                )}
                {(contact.city || contact.country) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" /> {[contact.city, contact.state, contact.country].filter(Boolean).join(", ")}
                  </div>
                )}
                {contact.source && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4 shrink-0" /> Source: {contact.source}
                  </div>
                )}
              </div>
              <div className="w-full pt-3 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lead Score</span>
                  <span className="font-semibold text-foreground">{contact.leadScore}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-foreground">{new Date(contact.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity & Edit Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="timeline">
            <TabsList className="bg-secondary/30">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="edit">Edit Details</TabsTrigger>
              <TabsTrigger value="tags">Tags & Fields</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-4 mt-4">
              {/* Add Activity */}
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-2">
                    {(["note", "email", "call", "meeting"] as const).map(t => (
                      <Button key={t} variant={noteType === t ? "default" : "outline"} size="sm" onClick={() => setNoteType(t)} className="capitalize text-xs">
                        {t}
                      </Button>
                    ))}
                  </div>
                  <Textarea value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder={`Add a ${noteType}...`} className="bg-secondary/30 min-h-[80px]" />
                  <Button size="sm" disabled={!noteBody.trim() || addActivity.isPending} onClick={() => addActivity.mutate({ contactId, type: noteType, subject: `${noteType} logged`, body: noteBody })}>
                    Log {noteType}
                  </Button>
                </CardContent>
              </Card>

              {/* Timeline */}
              <div className="space-y-3">
                {activities?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No activities yet. Log your first interaction above.</p>
                )}
                {activities?.map((activity) => {
                  const Icon = ACTIVITY_ICONS[activity.type] || FileText;
                  return (
                    <Card key={activity.id} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-foreground">{activity.subject || activity.type}</p>
                              <span className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</span>
                            </div>
                            {activity.body && <p className="text-sm text-muted-foreground mt-1">{activity.body}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="edit" className="mt-4">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <EditContactForm contact={contact} onSave={(data) => updateMutation.mutate({ id: contactId, ...data })} saving={updateMutation.isPending} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tags" className="mt-4">
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(contact.tags as string[] || []).map((tag, i) => (
                        <Badge key={i} variant="secondary">{tag}</Badge>
                      ))}
                      {(!contact.tags || (contact.tags as string[]).length === 0) && <span className="text-sm text-muted-foreground">No tags added yet.</span>}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Custom Fields</Label>
                    <div className="mt-2 space-y-2">
                      {Object.entries((contact.customFields as Record<string, string>) || {}).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{key}</span>
                          <span className="text-foreground">{val}</span>
                        </div>
                      ))}
                      {(!contact.customFields || Object.keys(contact.customFields as Record<string, string>).length === 0) && <span className="text-sm text-muted-foreground">No custom fields.</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function EditContactForm({ contact, onSave, saving }: { contact: any; onSave: (data: any) => void; saving: boolean }) {
  const [form, setForm] = useState({
    firstName: contact.firstName,
    lastName: contact.lastName ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    title: contact.title ?? "",
    lifecycleStage: contact.lifecycleStage,
    leadScore: contact.leadScore,
    source: contact.source ?? "",
    address: contact.address ?? "",
    city: contact.city ?? "",
    state: contact.state ?? "",
    country: contact.country ?? "",
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>First Name</Label><Input value={form.firstName} onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} className="bg-secondary/30" /></div>
        <div className="space-y-2"><Label>Last Name</Label><Input value={form.lastName} onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} className="bg-secondary/30" /></div>
        <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="bg-secondary/30" /></div>
        <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} className="bg-secondary/30" /></div>
        <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="bg-secondary/30" /></div>
        <div className="space-y-2">
          <Label>Lifecycle Stage</Label>
          <Select value={form.lifecycleStage} onValueChange={(v) => setForm(p => ({ ...p, lifecycleStage: v }))}>
            <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
            <SelectContent>{STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.toUpperCase()}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Lead Score</Label><Input type="number" value={form.leadScore} onChange={(e) => setForm(p => ({ ...p, leadScore: parseInt(e.target.value) || 0 }))} className="bg-secondary/30" /></div>
        <div className="space-y-2"><Label>Source</Label><Input value={form.source} onChange={(e) => setForm(p => ({ ...p, source: e.target.value }))} className="bg-secondary/30" /></div>
        <div className="space-y-2 col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} className="bg-secondary/30" /></div>
        <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))} className="bg-secondary/30" /></div>
        <div className="space-y-2"><Label>State</Label><Input value={form.state} onChange={(e) => setForm(p => ({ ...p, state: e.target.value }))} className="bg-secondary/30" /></div>
        <div className="space-y-2"><Label>Country</Label><Input value={form.country} onChange={(e) => setForm(p => ({ ...p, country: e.target.value }))} className="bg-secondary/30" /></div>
      </div>
      <Button onClick={() => onSave(form)} disabled={saving} className="gap-2">
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
