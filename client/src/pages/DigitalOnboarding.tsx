import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, CheckCircle, Clock, FileSignature, ChevronRight } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

const ONBOARDING_STEPS = [
  { id: "profile_setup", label: "Profile Setup", description: "Complete your company profile and branding" },
  { id: "import_contacts", label: "Import Contacts", description: "Migrate your existing contacts and companies" },
  { id: "email_config", label: "Email Configuration", description: "Connect your email and configure sending domains" },
  { id: "pipeline_setup", label: "Pipeline Setup", description: "Configure your sales pipeline stages and workflows" },
  { id: "team_invite", label: "Invite Team", description: "Add your team members and set their permissions" },
  { id: "first_sequence", label: "First Sequence", description: "Create your first outreach sequence" },
  { id: "integrations", label: "Integrations", description: "Connect your calendar, phone, and other tools" },
];

export default function DigitalOnboarding() {
  const { t } = useSkin();
  const [askQuestion, setAskQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: progress, refetch } = trpc.onboarding.getProgress.useQuery();
  const initMutation = trpc.onboarding.initProgress.useMutation({ onSuccess: () => { refetch(); toast.success("Onboarding started!"); } });
  const completeMutation = trpc.onboarding.completeStep.useMutation({ onSuccess: () => { refetch(); toast.success("Step marked complete!"); } });
  const dismissMutation = trpc.onboarding.dismiss.useMutation({ onSuccess: () => { refetch(); toast.success("Onboarding dismissed"); } });
  const aiHelpMutation = trpc.onboarding.getAIHelp.useMutation({
    onSuccess: (data) => { setAiAnswer(data.answer); setAiLoading(false); },
    onError: () => setAiLoading(false),
  });

  const completedSteps: string[] = (progress?.completedSteps as string[] | null) ?? [];
  const completedCount = completedSteps.length;
  const totalCount = ONBOARDING_STEPS.length;
  const pct = Math.round((completedCount / totalCount) * 100);

  const handleAskAI = async () => {
    if (!askQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);
    aiHelpMutation.mutate({ question: askQuestion });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Digital Onboarding</h1>
          <p className="text-muted-foreground">Guided setup to get your team fully operational in Apex CRM</p>
        </div>
        {!progress && (
          <Button onClick={() => initMutation.mutate()} disabled={initMutation.isPending}>
            <UserPlus className="w-4 h-4 mr-2" />
            {initMutation.isPending ? "Starting..." : "Start Onboarding"}
          </Button>
        )}
        {progress && !progress.dismissedAt && (
          <Button variant="outline" onClick={() => dismissMutation.mutate()} disabled={dismissMutation.isPending}>
            Dismiss Checklist
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Steps", value: totalCount, icon: FileSignature, color: "text-blue-400" },
          { label: "Completed", value: completedCount, icon: CheckCircle, color: "text-green-400" },
          { label: "Remaining", value: totalCount - completedCount, icon: Clock, color: "text-yellow-400" },
          { label: "Progress", value: `${pct}%`, icon: ChevronRight, color: "text-primary" },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground uppercase">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
              <s.icon className={`w-8 h-8 ${s.color} opacity-50`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress bar */}
      {progress && (
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}

      {/* Steps checklist */}
      {progress ? (
        <div className="space-y-3">
          {ONBOARDING_STEPS.map((step) => {
            const done = completedSteps.includes(step.id);
            return (
              <Card key={step.id} className={`border-border/50 transition-colors ${done ? "opacity-60" : "hover:border-primary/30"}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${done ? "bg-green-500/20" : "bg-primary/10"}`}>
                      {done ? <CheckCircle className="w-5 h-5 text-green-400" /> : <ChevronRight className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{step.label}</span>
                        {done && <Badge className="bg-green-500/20 text-green-400">Done</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {!done && (
                    <Button size="sm" variant="outline" onClick={() => completeMutation.mutate({ stepId: step.id })} disabled={completeMutation.isPending}>
                      Mark Done
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <UserPlus className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">Start your onboarding</h3>
            <p className="text-sm text-muted-foreground mt-1">Click "Start Onboarding" to begin your guided setup checklist</p>
          </CardContent>
        </Card>
      )}

      {/* AI Help */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Ask the Onboarding AI</h3>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm"
              placeholder="How do I import contacts from HubSpot?"
              value={askQuestion}
              onChange={e => setAskQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAskAI()}
            />
            <Button onClick={handleAskAI} disabled={aiLoading}>{aiLoading ? "Thinking..." : "Ask"}</Button>
          </div>
          {aiAnswer && (
            <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap">{aiAnswer}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
