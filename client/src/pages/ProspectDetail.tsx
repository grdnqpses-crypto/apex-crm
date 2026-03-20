import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Brain, Shield, Ghost, Mail, Flame, Target, ArrowLeft,
  Loader2, UserPlus, ExternalLink, Building, MapPin,
  Briefcase, Globe, Phone, Linkedin, Sparkles, Zap,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";
import { useSkin } from "@/contexts/SkinContext";

export default function ProspectDetail() {
  const { t } = useSkin();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, navigate] = useLocation();
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string; spamScore: number; personalizationNotes: string } | null>(null);
  const [emailContext, setEmailContext] = useState("initial outreach");
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [selectedSequenceId, setSelectedSequenceId] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: prospect, isLoading } = trpc.prospects.get.useQuery({ id });
  const { data: outreach } = trpc.outreach.list.useQuery({ prospectId: id, limit: 20 });
  const { data: battleCards } = trpc.battleCards.list.useQuery({ limit: 50 });
  const { data: sequences } = trpc.ghostSequences.list.useQuery();

  const verifyMut = trpc.prospects.verify.useMutation({
    onSuccess: (r) => { utils.prospects.get.invalidate({ id }); toast.success(`Email: ${r.status}`); },
    onError: () => toast.error("Verification failed"),
  });
  const profileMut = trpc.prospects.buildProfile.useMutation({
    onSuccess: () => { utils.prospects.get.invalidate({ id }); toast.success("Profile built!"); },
    onError: () => toast.error("Profile failed"),
  });
  const battleCardMut = trpc.prospects.generateBattleCard.useMutation({
    onSuccess: () => { utils.prospects.get.invalidate({ id }); utils.battleCards.list.invalidate(); toast.success("Battle card generated!"); },
    onError: () => toast.error("Battle card failed"),
  });
  const draftMut = trpc.prospects.draftEmail.useMutation({
    onSuccess: (r) => { if (r.subject) setEmailDraft(r as any); toast.success("Email drafted!"); },
    onError: () => toast.error("Draft failed"),
  });
  const promoteMut = trpc.prospects.promoteToContact.useMutation({
    onSuccess: (r) => {
      utils.prospects.get.invalidate({ id });
      if ("contactId" in r) {
        const msg = r.companyId ? "Promoted to CRM contact with company linked!" : "Promoted to CRM contact!";
        toast.success(msg);
        navigate(`/contacts/${r.contactId}`);
      }
    },
  });
  const enrollMut = trpc.prospects.enrollInSequence.useMutation({
    onSuccess: () => {
      utils.prospects.get.invalidate({ id });
      setShowEnrollDialog(false);
      setSelectedSequenceId("");
      toast.success("Enrolled in Ghost Sequence!");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Target className="h-12 w-12 mb-3 opacity-50" />
        <p>Prospect not found</p>
        <Button variant="outline" className="mt-3" onClick={() => navigate("/paradigm/prospects")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Pipeline
        </Button>
      </div>
    );
  }

  const p = prospect;
  const profile = p.psychographicProfile as any;
  const myBattleCard = battleCards?.find((bc) => bc.prospectId === p.id);
  const enrolledSequence = sequences?.find((s) => s.id === p.ghostSequenceId);

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.prospectDetail} />
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/paradigm/prospects")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{p.firstName} {p.lastName}</h1>
          <p className="text-sm text-muted-foreground">{p.jobTitle}{p.companyName ? ` @ ${p.companyName}` : ""}</p>
        </div>
        <div className="flex gap-2">
          {p.engagementStage !== "converted" && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowEnrollDialog(true)}>
                <Ghost className="h-4 w-4 mr-2 text-violet-400" />
                Enroll in Sequence
              </Button>
              <Button variant="outline" onClick={() => promoteMut.mutate({ id })} disabled={promoteMut.isPending}>
                {promoteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Promote to Contact
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Stage</div>
            <Badge className="text-xs">{p.engagementStage.replace("_", " ")}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Verification</div>
            <Badge variant="outline" className="text-xs">{p.verificationStatus}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Intent Score</div>
            <div className={`text-lg font-bold ${(p.intentScore ?? 0) >= 70 ? "text-red-400" : (p.intentScore ?? 0) >= 40 ? "text-amber-400" : "text-zinc-400"}`}>
              {p.intentScore ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Bounce Risk</div>
            <Badge variant="outline" className="text-xs">{p.bounceRisk ?? "unknown"}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Sequence</div>
            {enrolledSequence ? (
              <Badge className="text-xs bg-violet-600">{enrolledSequence.name}</Badge>
            ) : (
              <span className="text-xs text-muted-foreground">None</span>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Digital Twin</TabsTrigger>
          <TabsTrigger value="battlecard">Battle Card</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Contact Info</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {p.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {p.email}</div>}
                {p.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {p.phone}</div>}
                {p.linkedinUrl && <div className="flex items-center gap-2"><Linkedin className="h-3.5 w-3.5 text-muted-foreground" /> <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{p.linkedinUrl}</a></div>}
                {p.location && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {p.location}</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Company Info</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {p.companyName && <div className="flex items-center gap-2"><Building className="h-3.5 w-3.5 text-muted-foreground" /> {p.companyName}</div>}
                {p.companyDomain && <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-muted-foreground" /> {p.companyDomain}</div>}
                {p.industry && <div className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 text-muted-foreground" /> {p.industry}</div>}
                <div className="flex items-center gap-2"><Target className="h-3.5 w-3.5 text-muted-foreground" /> Source: {p.sourceType}</div>
              </CardContent>
            </Card>
          </div>

          {/* AI Actions */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">AI Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => verifyMut.mutate({ id })} disabled={verifyMut.isPending}>
                  {verifyMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Shield className="h-3.5 w-3.5 mr-2 text-blue-400" />}
                  Verify Email
                </Button>
                <Button variant="outline" size="sm" onClick={() => profileMut.mutate({ id })} disabled={profileMut.isPending}>
                  {profileMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Brain className="h-3.5 w-3.5 mr-2 text-violet-400" />}
                  Build Profile
                </Button>
                <Button variant="outline" size="sm" onClick={() => battleCardMut.mutate({ id })} disabled={battleCardMut.isPending}>
                  {battleCardMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Flame className="h-3.5 w-3.5 mr-2 text-red-400" />}
                  Generate Battle Card
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Path Info */}
          {p.contactId && (
            <Card className="border-green-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <Zap className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-400">Converted to CRM Contact</p>
                  <Button variant="link" className="text-xs p-0 h-auto" onClick={() => navigate(`/contacts/${p.contactId}`)}>
                    View Contact Record &rarr;
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {p.notes && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{t("notes")}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.notes}</p></CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Digital Twin Tab */}
        <TabsContent value="profile" className="space-y-4">
          {!profile ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Brain className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-lg font-medium">No psychographic profile yet</p>
                <p className="text-sm mb-4">Build a Digital Twin to understand this prospect's personality and motivators</p>
                <Button onClick={() => profileMut.mutate({ id })} disabled={profileMut.isPending}>
                  {profileMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                  Build Digital Twin
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Personality</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">Type:</span> {profile.personalityType}</div>
                  <div><span className="text-muted-foreground">Communication:</span> {profile.communicationStyle}</div>
                  <div><span className="text-muted-foreground">Decision Style:</span> {profile.decisionStyle}</div>
                  <div><span className="text-muted-foreground">Social Activity:</span> {profile.socialActivity}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{profile.summary}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Motivators</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.motivators ?? []).map((m: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Pain Points</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.painPoints ?? []).map((pp: string, i: number) => (
                      <Badge key={i} variant="destructive" className="text-xs">{pp}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Interests</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.interests ?? []).map((interest: string, idx: number) => (
                      <Badge key={idx} className="text-xs bg-primary/20 text-primary">{interest}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Battle Card Tab */}
        <TabsContent value="battlecard" className="space-y-4">
          {!myBattleCard ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Flame className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-lg font-medium">No battle card yet</p>
                <p className="text-sm mb-4">Generate tactical intelligence for engaging this prospect</p>
                <Button onClick={() => battleCardMut.mutate({ id })} disabled={battleCardMut.isPending}>
                  {battleCardMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Flame className="h-4 w-4 mr-2" />}
                  Generate Battle Card
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Company Overview</CardTitle></CardHeader>
                <CardContent><p className="text-sm">{myBattleCard.companyOverview}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Person Insights</CardTitle></CardHeader>
                <CardContent><p className="text-sm">{myBattleCard.personInsights}</p></CardContent>
              </Card>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Pain Points</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {(myBattleCard.painPoints as string[] ?? []).map((pp, i) => (
                        <li key={i} className="flex items-start gap-2"><span className="text-red-400 mt-0.5">&bull;</span> {pp}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Talking Points</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {(myBattleCard.talkingPoints as string[] ?? []).map((tp, i) => (
                        <li key={i} className="flex items-start gap-2"><span className="text-green-400 mt-0.5">&bull;</span> {tp}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Recommended Approach</CardTitle></CardHeader>
                <CardContent><p className="text-sm">{myBattleCard.recommendedApproach}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Objection Handlers</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(myBattleCard.objectionHandlers as any[] ?? []).map((oh, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-muted/50">
                        <p className="text-sm font-medium text-red-400">"{oh.objection}"</p>
                        <p className="text-sm text-muted-foreground mt-1">{oh.response}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Outreach Tab */}
        <TabsContent value="outreach" className="space-y-4">
          {/* Draft Email */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" /> AI Email Composer
              </CardTitle>
              <CardDescription>Generate a personalized outreach email using the Digital Twin profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Context / Purpose</label>
                <Textarea value={emailContext} onChange={(e) => setEmailContext(e.target.value)} rows={2} className="mt-1" placeholder="e.g., initial outreach, follow-up after no reply, meeting request..." />
              </div>
              <Button onClick={() => draftMut.mutate({ id, context: emailContext })} disabled={draftMut.isPending}>
                {draftMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                Draft Email
              </Button>
              {emailDraft && (
                <div className="mt-3 p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Subject: {emailDraft.subject}</p>
                    <Badge variant="outline" className={`text-xs ${emailDraft.spamScore <= 20 ? "text-green-400" : emailDraft.spamScore <= 50 ? "text-amber-400" : "text-red-400"}`}>
                      Spam Score: {emailDraft.spamScore}
                    </Badge>
                  </div>
                  <Separator />
                  <p className="text-sm whitespace-pre-wrap">{emailDraft.body}</p>
                  <Separator />
                  <p className="text-xs text-muted-foreground">{emailDraft.personalizationNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outreach History */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Outreach History</CardTitle></CardHeader>
            <CardContent>
              {(!outreach || outreach.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-6">No outreach recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {outreach.map((o) => (
                    <div key={o.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{o.subject}</p>
                        <Badge variant="outline" className="text-xs">{o.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        To: {o.toEmail} {o.sentAt ? `\u2022 Sent: ${new Date(Number(o.sentAt)).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enroll in Sequence Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ghost className="h-5 w-5 text-violet-400" />
              Enroll in Ghost Sequence
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Select a sequence to enroll <strong>{p.firstName} {p.lastName}</strong> into automated follow-up outreach.
            </p>
            {enrolledSequence && (
              <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <p className="text-xs text-muted-foreground">Currently enrolled in:</p>
                <p className="text-sm font-medium text-violet-400">{enrolledSequence.name}</p>
              </div>
            )}
            <Select value={selectedSequenceId} onValueChange={setSelectedSequenceId}>
              <SelectTrigger><SelectValue placeholder="Select a sequence..." /></SelectTrigger>
              <SelectContent>
                {(sequences ?? []).filter(s => s.status === "active" || s.status === "draft").map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} ({s.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sequences && sequences.filter(s => s.status === "active" || s.status === "draft").length === 0 && (
              <p className="text-xs text-muted-foreground">No active sequences available. Create one in Ghost Sequences first.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnrollDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!selectedSequenceId) { toast.error("Select a sequence"); return; }
                enrollMut.mutate({ id, sequenceId: Number(selectedSequenceId) });
              }}
              disabled={!selectedSequenceId || enrollMut.isPending}
              className="gap-2"
            >
              {enrollMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ghost className="h-4 w-4" />}
              Enroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
