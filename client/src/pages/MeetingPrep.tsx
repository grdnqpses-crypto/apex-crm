import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
import {
  Briefcase, Sparkles, Clock, User, Building2, Target,
  MessageSquare, AlertTriangle, CheckCircle2, TrendingUp, Calendar
} from "lucide-react";

export default function MeetingPrep() {
  const { t } = useSkin();
  const [contactId, setContactId] = useState<number>(0);
  const [dealId, setDealId] = useState<number>(0);
  const [meetingDate, setMeetingDate] = useState("");

  const preps = trpc.meetingPreps.list.useQuery();
  const generatePrep = trpc.meetingPreps.generate.useMutation({
    onSuccess: () => { preps.refetch(); toast.success("Meeting prep generated"); },
    onError: () => toast.error("Failed to generate meeting prep"),
  });

  const [selectedPrep, setSelectedPrep] = useState<number | null>(null);
  const prepDetail = trpc.meetingPreps.get.useQuery({ id: selectedPrep! }, { enabled: !!selectedPrep });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" />
            AI Meeting Prep
          </h1>
          <p className="text-muted-foreground mt-1">One-click pre-call intelligence summaries with talking points and strategy</p>
        </div>
      </div>

      {/* Generate New Prep */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Generate Meeting Brief
          </CardTitle>
          <CardDescription>Enter contact/deal details and AI will prepare a comprehensive meeting brief</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Contact ID</label>
              <Input type="number" value={contactId || ""} onChange={(e) => setContactId(parseInt(e.target.value) || 0)} placeholder="Contact ID" />
            </div>
            <div>
              <label className="text-sm font-medium">Deal ID (optional)</label>
              <Input type="number" value={dealId || ""} onChange={(e) => setDealId(parseInt(e.target.value) || 0)} placeholder="Deal ID" />
            </div>
            <div>
              <label className="text-sm font-medium">Meeting Date</label>
              <Input type="datetime-local" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={() => generatePrep.mutate({
                contactId: contactId || undefined,
                dealId: dealId || undefined,
                meetingDate: meetingDate ? new Date(meetingDate).getTime() : undefined,
              })} disabled={generatePrep.isPending}>
                <Sparkles className="h-4 w-4 mr-2" /> {generatePrep.isPending ? "Generating..." : "Brief Me"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prep List */}
        <Card className="border-border/50 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Meeting Briefs</CardTitle>
            <CardDescription>{preps.data?.length || 0} briefs generated</CardDescription>
          </CardHeader>
          <CardContent>
            {(preps.data?.length || 0) === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No meeting briefs yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {preps.data?.map((prep: any) => (
                  <div key={prep.id} onClick={() => setSelectedPrep(prep.id)} className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedPrep === prep.id ? 'border-primary bg-primary/5' : 'border-border/50 hover:bg-muted/50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">Contact #{prep.contactId}</span>
                    </div>
                    {prep.dealId && (
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Deal #{prep.dealId}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{new Date(prep.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prep Detail */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Meeting Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prepDetail.data ? (
              <div className="space-y-5">
                {/* Contact Summary */}
                {prepDetail.data.contactSummary && (
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-blue-400" /> Contact Summary
                    </h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{String(prepDetail.data.contactSummary)}</p>
                  </div>
                )}

                {/* Deal Context */}
                {prepDetail.data.dealContext && (
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-emerald-400" /> Deal Context
                    </h4>
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{String(prepDetail.data.dealContext)}</p>
                  </div>
                )}

                {/* Talking Points */}
                {prepDetail.data.talkingPoints && (
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-amber-400" /> Suggested Talking Points
                    </h4>
                    <div className="space-y-2">
                      {(Array.isArray(prepDetail.data.talkingPoints) ? prepDetail.data.talkingPoints : JSON.parse(String(prepDetail.data.talkingPoints) || '[]')).map((point: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/20">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <p className="text-sm">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Potential Objections */}
                {prepDetail.data.potentialObjections && (
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" /> Potential Objections & Responses
                    </h4>
                    <div className="space-y-2">
                      {(Array.isArray(prepDetail.data.potentialObjections) ? prepDetail.data.potentialObjections : JSON.parse(String(prepDetail.data.potentialObjections) || '[]')).map((obj: any, i: number) => (
                        <div key={i} className="p-3 rounded bg-red-500/5 border border-red-500/10">
                          <p className="text-sm font-medium text-red-300 mb-1">Objection: {obj.objection}</p>
                          <p className="text-sm text-emerald-300">Response: {obj.response}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Questions to Ask */}
                {prepDetail.data.questionsToAsk && (
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" /> Questions to Ask
                    </h4>
                    <div className="space-y-1">
                      {(Array.isArray(prepDetail.data.questionsToAsk) ? prepDetail.data.questionsToAsk : JSON.parse(String(prepDetail.data.questionsToAsk) || '[]')).map((q: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded bg-emerald-500/5">
                          <TrendingUp className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                          <p className="text-sm text-emerald-300">{q}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competitor Intel */}
                {prepDetail.data.competitorIntel && (
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" /> Competitor Intelligence
                    </h4>
                    <p className="text-sm text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg p-3">{String(prepDetail.data.competitorIntel)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-semibold mb-1">Select a Meeting Brief</h3>
                <p className="text-sm">Generate a new brief or select an existing one to view the full intelligence report</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
