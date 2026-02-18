import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Shield, Eye, Archive, Loader2, Target, ChevronDown, ChevronUp,
  Building, User, AlertTriangle, MessageSquare, Flame,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";


export default function BattleCards() {
  const [, navigate] = useLocation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const utils = trpc.useUtils();
  const { data: cards, isLoading } = trpc.battleCards.list.useQuery({ limit: 100 });
  const markReadMut = trpc.battleCards.markRead.useMutation({
    onSuccess: () => { utils.battleCards.list.invalidate(); },
  });
  const archiveMut = trpc.battleCards.archive.useMutation({
    onSuccess: () => { utils.battleCards.list.invalidate(); toast.success("Card archived"); },
  });

  const allCards = cards ?? [];
  const visibleCards = showArchived ? allCards : allCards.filter(c => !c.isArchived);
  const unreadCount = allCards.filter(c => !c.isRead).length;

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.battleCards} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-400" />
            Battle Cards
          </h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"} &middot; {allCards.length} total
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowArchived(!showArchived)}>
          <Archive className="h-4 w-4 mr-2" />
          {showArchived ? "Hide Archived" : "Show Archived"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : visibleCards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Shield className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">No battle cards yet</p>
            <p className="text-sm">Generate battle cards from the Prospect Detail page</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleCards.map((card) => {
            const isExpanded = expandedId === card.id;
            return (
              <Card key={card.id} className={`transition-colors ${!card.isRead ? "border-red-500/30 bg-red-500/5" : ""} ${isExpanded ? "border-primary/30" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${!card.isRead ? "bg-red-500/20" : "bg-muted"}`}>
                      <Shield className={`h-5 w-5 ${!card.isRead ? "text-red-400" : "text-muted-foreground"}`} />
                    </div>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        setExpandedId(isExpanded ? null : card.id);
                        if (!card.isRead) markReadMut.mutate({ id: card.id });
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{card.title}</p>
                        {!card.isRead && <Badge variant="destructive" className="text-[10px]">New</Badge>}
                        {card.isArchived && <Badge variant="outline" className="text-[10px]">Archived</Badge>}
                        {card.urgencyLevel && (
                          <Badge className={`text-[10px] ${card.urgencyLevel === "high" ? "bg-red-600" : card.urgencyLevel === "medium" ? "bg-amber-600" : "bg-zinc-600"}`}>
                            {card.urgencyLevel}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Generated {card.generatedAt ? new Date(Number(card.generatedAt)).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {card.prospectId && (
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/paradigm/prospects/${card.prospectId}`)} title="View Prospect">
                          <Target className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!card.isArchived && (
                        <Button variant="ghost" size="sm" onClick={() => archiveMut.mutate({ id: card.id })} title="Archive">
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => {
                        setExpandedId(isExpanded ? null : card.id);
                        if (!card.isRead) markReadMut.mutate({ id: card.id });
                      }}>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      <Separator />

                      {card.companyOverview && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Building className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Company Overview</p>
                          </div>
                          <p className="text-sm">{card.companyOverview}</p>
                        </div>
                      )}

                      {card.personInsights && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Person Insights</p>
                          </div>
                          <p className="text-sm">{card.personInsights}</p>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
                        {card.painPoints && (card.painPoints as string[]).length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                              <p className="text-xs font-semibold uppercase text-muted-foreground">Pain Points</p>
                            </div>
                            <ul className="space-y-1">
                              {(card.painPoints as string[]).map((pp, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <span className="text-red-400 mt-0.5">&bull;</span> {pp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {card.talkingPoints && (card.talkingPoints as string[]).length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="h-3.5 w-3.5 text-green-400" />
                              <p className="text-xs font-semibold uppercase text-muted-foreground">Talking Points</p>
                            </div>
                            <ul className="space-y-1">
                              {(card.talkingPoints as string[]).map((tp, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                  <span className="text-green-400 mt-0.5">&bull;</span> {tp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {card.recommendedApproach && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Flame className="h-3.5 w-3.5 text-amber-400" />
                            <p className="text-xs font-semibold uppercase text-muted-foreground">Recommended Approach</p>
                          </div>
                          <p className="text-sm">{card.recommendedApproach}</p>
                        </div>
                      )}

                      {card.competitorIntel && (
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Competitor Intel</p>
                          <p className="text-sm">{card.competitorIntel}</p>
                        </div>
                      )}

                      {card.objectionHandlers && (card.objectionHandlers as any[]).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Objection Handlers</p>
                          <div className="space-y-2">
                            {(card.objectionHandlers as any[]).map((oh, i) => (
                              <div key={i} className="p-2.5 rounded-lg bg-muted/50">
                                <p className="text-sm font-medium text-red-400">&ldquo;{oh.objection}&rdquo;</p>
                                <p className="text-sm text-muted-foreground mt-1">{oh.response}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
