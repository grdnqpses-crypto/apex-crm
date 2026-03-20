import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Phone, PhoneCall, PhoneOff, Play, Pause, Plus, Trash2, Sparkles,
  BarChart3, Clock, Users, Target, CheckCircle2, AlertTriangle,
  MessageSquare, Calendar, TrendingUp, Mic, Bot, Settings
} from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";
import { useSkin } from "@/contexts/SkinContext";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/20 text-emerald-400",
  paused: "bg-amber-500/20 text-amber-400",
  completed: "bg-blue-500/20 text-blue-400",
  archived: "bg-zinc-500/20 text-zinc-400",
};

const callStatusColors: Record<string, string> = {
  completed: "bg-emerald-500/20 text-emerald-400",
  no_answer: "bg-amber-500/20 text-amber-400",
  busy: "bg-orange-500/20 text-orange-400",
  failed: "bg-red-500/20 text-red-400",
  voicemail: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-cyan-500/20 text-cyan-400",
  queued: "bg-muted text-muted-foreground",
  ringing: "bg-purple-500/20 text-purple-400",
};

const sentimentIcons: Record<string, { icon: typeof TrendingUp; color: string }> = {
  positive: { icon: TrendingUp, color: "text-emerald-400" },
  interested: { icon: Target, color: "text-blue-400" },
  neutral: { icon: MessageSquare, color: "text-muted-foreground" },
  negative: { icon: AlertTriangle, color: "text-red-400" },
  not_interested: { icon: PhoneOff, color: "text-amber-400" },
};

export default function VoiceAgent() {
  const { t } = useSkin();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [newCampaign, setNewCampaign] = useState({ name: "", description: "", objective: "qualify_lead", voicePersona: "professional" });
  const [generatedScript, setGeneratedScript] = useState("");
  const [showCallDetail, setShowCallDetail] = useState<number | null>(null);

  const campaigns = trpc.voiceCampaigns.list.useQuery();
  const callStats = trpc.callLogs.stats.useQuery(selectedCampaign ? { campaignId: selectedCampaign } : undefined);
  const callLogs = trpc.callLogs.list.useQuery(selectedCampaign ? { campaignId: selectedCampaign } : undefined);
  const callDetail = trpc.callLogs.get.useQuery({ id: showCallDetail! }, { enabled: !!showCallDetail });

  const createCampaign = trpc.voiceCampaigns.create.useMutation({
    onSuccess: () => { campaigns.refetch(); setShowCreate(false); setNewCampaign({ name: "", description: "", objective: "qualify_lead", voicePersona: "professional" }); toast.success("Campaign created"); },
  });
  const updateCampaign = trpc.voiceCampaigns.update.useMutation({ onSuccess: () => campaigns.refetch() });
  const deleteCampaign = trpc.voiceCampaigns.delete.useMutation({ onSuccess: () => { campaigns.refetch(); setSelectedCampaign(null); toast.success("Campaign deleted"); } });
  const generateScript = trpc.voiceCampaigns.generateScript.useMutation({
    onSuccess: (data) => { setGeneratedScript(String(data.script || '')); toast.success("Script generated"); },
  });
  const simulateCall = trpc.callLogs.simulateCall.useMutation({
    onSuccess: () => { callLogs.refetch(); callStats.refetch(); toast.success("Call simulation completed"); },
  });

  const activeCampaign = campaigns.data?.find((c: any) => c.id === selectedCampaign);

  return (
      <FeatureGate
        featureKey="voice_agent_limited"
        featureName="AI Voice Agent"
        description="AI-powered outbound voice calls with transcription and CRM sync. Fortune Foundation (200/mo) · Fortune (unlimited)."
        freemium={true}
      >

    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            REALM Caller — AI Voice Agent
          </h1>
          <p className="text-muted-foreground mt-1">Autonomous AI-powered calling that qualifies leads, books appointments, and gathers intelligence</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Campaign</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Voice Campaign</DialogTitle>
              <DialogDescription>Set up a new AI calling campaign to reach your prospects</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Campaign Name</label>
                <Input value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="e.g., Q1 Carrier Outreach" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea value={newCampaign.description} onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })} placeholder="Campaign goals and target audience..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Objective</label>
                  <Select value={newCampaign.objective} onValueChange={(v) => setNewCampaign({ ...newCampaign, objective: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qualify_lead">Qualify Lead</SelectItem>
                      <SelectItem value="book_appointment">Book Appointment</SelectItem>
                      <SelectItem value="gather_info">Gather Info</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Voice Persona</label>
                  <Select value={newCampaign.voicePersona} onValueChange={(v) => setNewCampaign({ ...newCampaign, voicePersona: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                      <SelectItem value="consultative">Consultative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={() => createCampaign.mutate(newCampaign)} disabled={!newCampaign.name || createCampaign.isPending}>
                {createCampaign.isPending ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Calls", value: callStats.data?.total || 0, icon: Phone, color: "text-blue-400" },
          { label: "Connected", value: callStats.data?.connected || 0, icon: PhoneCall, color: "text-emerald-400" },
          { label: "Qualified", value: callStats.data?.qualified || 0, icon: Target, color: "text-purple-400" },
          { label: "Appointments", value: callStats.data?.appointments || 0, icon: Calendar, color: "text-amber-400" },
          { label: "Avg Duration", value: `${Math.floor((callStats.data?.avgDuration || 0) / 60)}m ${(callStats.data?.avgDuration || 0) % 60}s`, icon: Clock, color: "text-cyan-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">{t("campaigns")}</TabsTrigger>
          <TabsTrigger value="calls">Call Log</TabsTrigger>
          <TabsTrigger value="scripts">Script Builder</TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          {campaigns.data?.length === 0 ? (
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="py-12 text-center">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Voice Campaigns Yet</h3>
                <p className="text-muted-foreground mb-4">Create your first AI calling campaign to start qualifying leads automatically</p>
                <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Create Campaign</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {campaigns.data?.map((campaign: any) => (
                <Card key={campaign.id} className={`cursor-pointer transition-all hover:border-primary/50 ${selectedCampaign === campaign.id ? 'border-primary ring-1 ring-primary/20' : 'border-border/50'}`} onClick={() => setSelectedCampaign(campaign.id)}>
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <p className="text-sm text-muted-foreground">{campaign.description || `${campaign.objective?.replace(/_/g, ' ')} campaign`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">{campaign.totalCalls || 0} calls</span>
                            <span className="text-emerald-400">{campaign.totalQualified || 0} qualified</span>
                            <span className="text-amber-400">{campaign.totalAppointments || 0} appts</span>
                          </div>
                        </div>
                        <Badge className={statusColors[campaign.status] || ""}>{campaign.status}</Badge>
                        <div className="flex gap-1">
                          {campaign.status === 'draft' && (
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateCampaign.mutate({ id: campaign.id, status: 'active' }); }}>
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                          {campaign.status === 'active' && (
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateCampaign.mutate({ id: campaign.id, status: 'paused' }); }}>
                              <Pause className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteCampaign.mutate({ id: campaign.id }); }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {selectedCampaign === campaign.id && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div><span className="text-muted-foreground">Objective:</span> <span className="capitalize">{campaign.objective?.replace(/_/g, ' ')}</span></div>
                          <div><span className="text-muted-foreground">Persona:</span> <span className="capitalize">{campaign.voicePersona}</span></div>
                          <div><span className="text-muted-foreground">Window:</span> {campaign.callWindowStart} - {campaign.callWindowEnd}</div>
                          <div><span className="text-muted-foreground">Max/Day:</span> {campaign.maxCallsPerDay}</div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline" onClick={(e) => {
                            e.stopPropagation();
                            simulateCall.mutate({
                              phoneNumber: `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`,
                              scriptTemplate: campaign.scriptTemplate || 'Default qualification script',
                              voiceCampaignId: campaign.id,
                            });
                          }} disabled={simulateCall.isPending}>
                            <Mic className="h-3 w-3 mr-1" /> {simulateCall.isPending ? "Simulating..." : "Simulate Call"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Call Log Tab */}
        <TabsContent value="calls" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Calls</CardTitle>
              <CardDescription>AI-powered call results with transcriptions and qualification data</CardDescription>
            </CardHeader>
            <CardContent>
              {(callLogs.data?.items?.length || 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No calls yet. Create a campaign and simulate a call to get started.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sentiment</TableHead>
                      <TableHead>Qualification</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callLogs.data?.items?.map((call: any) => {
                      const SentimentIcon = sentimentIcons[call.aiSentiment]?.icon || MessageSquare;
                      const sentimentColor = sentimentIcons[call.aiSentiment]?.color || "text-muted-foreground";
                      return (
                        <TableRow key={call.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setShowCallDetail(call.id)}>
                          <TableCell className="font-mono text-sm">{call.phoneNumber}</TableCell>
                          <TableCell><Badge className={callStatusColors[call.status] || ""}>{call.status?.replace(/_/g, ' ')}</Badge></TableCell>
                          <TableCell><SentimentIcon className={`h-4 w-4 ${sentimentColor}`} /></TableCell>
                          <TableCell><Badge variant="outline" className={call.qualificationResult === 'qualified' ? 'border-emerald-500/50 text-emerald-400' : call.qualificationResult === 'needs_followup' ? 'border-amber-500/50 text-amber-400' : ''}>{call.qualificationResult?.replace(/_/g, ' ') || 'pending'}</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={call.qualificationScore || 0} className="w-16 h-1.5" />
                              <span className="text-xs">{call.qualificationScore || 0}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{call.durationSeconds ? `${Math.floor(call.durationSeconds / 60)}:${String(call.durationSeconds % 60).padStart(2, '0')}` : '-'}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{call.createdAt ? new Date(call.createdAt).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Call Detail Dialog */}
          <Dialog open={!!showCallDetail} onOpenChange={() => setShowCallDetail(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Call Details</DialogTitle>
              </DialogHeader>
              {callDetail.data && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Phone</span>
                      <p className="font-mono">{callDetail.data.phoneNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Duration</span>
                      <p>{callDetail.data.durationSeconds ? `${Math.floor(callDetail.data.durationSeconds / 60)}m ${callDetail.data.durationSeconds % 60}s` : 'N/A'}</p>
                    </div>
                  </div>
                  {callDetail.data.conversationSummary && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Conversation Summary</h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{callDetail.data.conversationSummary}</p>
                    </div>
                  )}
                  {callDetail.data.qualificationDetails && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Qualification Details</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {Object.entries(callDetail.data.qualificationDetails as Record<string, unknown>).map(([key, value]) => (
                          <div key={key} className="bg-muted/30 rounded-lg p-2">
                            <span className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <p className="font-medium">{Array.isArray(value) ? (value as string[]).join(', ') : String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {callDetail.data.transcription && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Transcription</h4>
                      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap">{callDetail.data.transcription}</div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Script Builder Tab */}
        <TabsContent value="scripts" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Script Generator
              </CardTitle>
              <CardDescription>Generate professional cold-calling scripts tailored to your campaign objectives</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Objective</label>
                  <Select defaultValue="qualify_lead" onValueChange={(v) => setNewCampaign({ ...newCampaign, objective: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qualify_lead">Qualify Lead</SelectItem>
                      <SelectItem value="book_appointment">Book Appointment</SelectItem>
                      <SelectItem value="gather_info">Gather Information</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Voice Persona</label>
                  <Select defaultValue="professional" onValueChange={(v) => setNewCampaign({ ...newCampaign, voicePersona: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                      <SelectItem value="consultative">Consultative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => generateScript.mutate({ objective: newCampaign.objective, voicePersona: newCampaign.voicePersona })} disabled={generateScript.isPending}>
                <Sparkles className="h-4 w-4 mr-2" /> {generateScript.isPending ? "Generating..." : "Generate Script"}
              </Button>
              {generatedScript && (
                <div className="mt-4">
                  <label className="text-sm font-medium">Generated Script</label>
                  <Textarea value={generatedScript} onChange={(e) => setGeneratedScript(e.target.value)} rows={16} className="mt-1 font-mono text-sm" />
                  <p className="text-xs text-muted-foreground mt-1">Edit the script as needed. Use {"{{contactName}}"}, {"{{companyName}}"}, {"{{callerName}}"} as placeholders.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  
      </FeatureGate>);
}
