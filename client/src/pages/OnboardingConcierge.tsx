import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, Circle, ChevronRight, Sparkles, MessageSquare, Send, Loader2, Trophy, BookOpen, Video, HelpCircle } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

const CHECKLIST_STEPS = [
  { key: "import_contacts", title: "Import your contacts", description: "Migrate from your old CRM or upload a CSV", actionUrl: "/migration" },
  { key: "connect_email", title: "Connect your email", description: "Sync Gmail or Outlook to log conversations", actionUrl: "/email-sync" },
  { key: "setup_pipeline", title: "Set up your pipeline", description: "Customize your deal stages", actionUrl: "/deals" },
  { key: "invite_team", title: "Invite your team", description: "Add your colleagues to AXIOM CRM", actionUrl: "/settings" },
  { key: "create_sequence", title: "Create your first sequence", description: "Set up an automated email sequence", actionUrl: "/workflows" },
  { key: "connect_calendar", title: "Connect your calendar", description: "Sync meetings with Google or Outlook", actionUrl: "/calendar-sync" },
  { key: "setup_dialer", title: "Set up click-to-call", description: "Enable the built-in dialer", actionUrl: "/voice-agent" },
  { key: "explore_ai", title: "Explore AI features", description: "Try AI lead scoring and prospect enrichment", actionUrl: "/ai-engine" },
];

const HELP_SUGGESTIONS = [
  "How do I import my contacts?",
  "How do I set up email sequences?",
  "How do I create a deal pipeline?",
  "How do I use the AI lead scoring?",
  "How do I invite my team?",
  "How do I connect my email?",
];

export default function OnboardingConcierge() {
  const { t } = useSkin();
  const [aiQuestion, setAiQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isAsking, setIsAsking] = useState(false);

  const { data: progress, refetch } = trpc.onboarding.getProgress.useQuery();
  const completeMutation = trpc.onboarding.completeStep.useMutation();
  const askMutation = trpc.onboarding.getAIHelp.useMutation();

  // Derive step list with completion status from the backend's completedSteps array
  const completedStepsArr: string[] = (progress?.completedSteps as string[]) ?? [];
  const steps = CHECKLIST_STEPS.map(s => ({ ...s, completed: completedStepsArr.includes(s.key) }));
  const completedCount = steps.filter(s => s.completed).length;
  const totalCount = steps.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleCompleteStep = async (stepKey: string) => {
    try {
      await completeMutation.mutateAsync({ stepId: stepKey });
      toast.success("Step completed!");
      refetch();
    } catch { toast.error("Failed to update"); }
  };

  const handleAskAI = async (question?: string) => {
    const q = question ?? aiQuestion;
    if (!q.trim()) return;
    setChatHistory(h => [...h, { role: "user", content: q }]);
    setAiQuestion("");
    setIsAsking(true);
    try {
      const result = await askMutation.mutateAsync({ question: q });
      setChatHistory(h => [...h, { role: "assistant", content: result.answer }]);
    } catch {
      setChatHistory(h => [...h, { role: "assistant", content: "Sorry, I couldn't answer that right now. Please try again." }]);
    } finally { setIsAsking(false); }
  };

  return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Onboarding Concierge</h1>
          <p className="text-muted-foreground mt-1">Your personal guide to getting the most out of AXIOM CRM</p>
        </div>

        {/* Progress */}
        <Card className={completionPct === 100 ? "border-green-300 bg-green-50 dark:bg-green-950/20" : "border-primary/30 bg-primary/5"}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {completionPct === 100 ? (
                  <Trophy className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Sparkles className="h-5 w-5 text-primary" />
                )}
                <span className="font-semibold">
                  {completionPct === 100 ? "Setup Complete! 🎉" : `Setup Progress — ${completionPct}%`}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{completedCount} of {totalCount} steps</span>
            </div>
            <Progress value={completionPct} className="h-2" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Checklist */}
          <div className="space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Setup Checklist</h2>
            {steps.map(step => (
              <Card key={step.key} className={`transition-all ${step.completed ? "opacity-60" : "hover:shadow-md"}`}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => !step.completed && handleCompleteStep(step.key)}
                      className={`flex-shrink-0 ${step.completed ? "text-green-500" : "text-muted-foreground hover:text-primary"}`}
                    >
                      {step.completed ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${step.completed ? "line-through text-muted-foreground" : ""}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{step.description}</div>
                    </div>
                    {!step.completed && (
                      <Button variant="ghost" size="sm" className="flex-shrink-0" asChild>
                        <a href={step.actionUrl}><ChevronRight className="h-4 w-4" /></a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Help Chat */}
          <div className="space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">AI Help Assistant</h2>
            <Card className="flex flex-col h-[480px]">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Ask anything about AXIOM CRM
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatHistory.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Common questions:</p>
                    {HELP_SUGGESTIONS.map(q => (
                      <button key={q} onClick={() => handleAskAI(q)}
                        className="w-full text-left text-sm p-2 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="p-1.5 bg-primary/10 rounded-full h-7 w-7 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isAsking && (
                  <div className="flex gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-full h-7 w-7 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                    </div>
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">Thinking...</div>
                  </div>
                )}
              </CardContent>
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    value={aiQuestion}
                    onChange={e => setAiQuestion(e.target.value)}
                    placeholder="Ask anything..."
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAskAI()}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={() => handleAskAI()} disabled={!aiQuestion.trim() || isAsking}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Resources */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: BookOpen, label: "Documentation", href: "/help", color: "text-blue-600" },
                { icon: Video, label: "Video Tutorials", href: "/help", color: "text-red-600" },
                { icon: MessageSquare, label: "Live Chat Support", href: "/help", color: "text-green-600" },
                { icon: HelpCircle, label: "Help Center", href: "/help", color: "text-orange-600" },
              ].map(r => {
                const Icon = r.icon;
                return (
                  <a key={r.label} href={r.href}
                    className="flex items-center gap-2 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors">
                    <Icon className={`h-4 w-4 ${r.color}`} />
                    <span className="text-sm font-medium">{r.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
  );
}
