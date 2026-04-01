import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, Sparkles, Brain, Zap, Target, TrendingUp } from "lucide-react";
import { invokeLLM } from "@/server/_core/llm";

export default function AxiomAI() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: "assistant",
      content: "Hello! I'm AXIOM AI, your intelligent sales copilot. I can help you with insights, recommendations, and automations. What would you like to know?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: insights } = trpc.einstein.getInsights.useQuery();

  const handleSendMessage = async () => {
    if (!query.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setQuery("");
    setIsLoading(true);

    try {
      // Call Einstein AI API
      const response = await trpc.einstein.chat.query({
        message: query,
        context: "sales",
      });

      setMessages((prev) => [...prev, { role: "assistant", content: response.answer }]);
      toast.success("Response received");
    } catch (error) {
      toast.error("Failed to get response from Einstein AI");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">AXIOM AI</h1>
              <p className="text-sm text-muted-foreground">Your intelligent sales copilot powered by advanced AI</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-96 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                Chat with AXIOM AI
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground px-4 py-2 rounded-lg">
                      <p className="text-sm">Thinking...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Ask AXIOM AI anything..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !query.trim()}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-yellow-500" />
                Quick Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">Top Opportunities</p>
                <p className="text-xs text-blue-700 mt-1">5 deals ready to close</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-green-900">Win Probability</p>
                <p className="text-xs text-green-700 mt-1">78% average across pipeline</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-semibold text-purple-900">Next Best Action</p>
                <p className="text-xs text-purple-700 mt-1">Follow up with 12 contacts</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-red-500" />
                Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="outline" className="w-full justify-start">
                <TrendingUp className="w-3 h-3 mr-2" />
                Sales Insights
              </Badge>
              <Badge variant="outline" className="w-full justify-start">
                <Brain className="w-3 h-3 mr-2" />
                Lead Scoring
              </Badge>
              <Badge variant="outline" className="w-full justify-start">
                <Sparkles className="w-3 h-3 mr-2" />
                Recommendations
              </Badge>
              <Badge variant="outline" className="w-full justify-start">
                <Zap className="w-3 h-3 mr-2" />
                Automations
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
