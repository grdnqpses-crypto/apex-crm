import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { X, Send, Bot, Sparkles, Loader2, User } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  { label: "Add a company", prompt: "Create a company called Acme Corp in the logistics industry" },
  { label: "Add a contact", prompt: "Add a contact named Jane Smith at Acme Corp as VP of Operations" },
  { label: "Create a deal", prompt: "Create a $50,000 deal called 'Q1 Freight Contract' for Acme Corp" },
  { label: "Show my pipeline", prompt: "Give me a summary of my deal pipeline" },
  { label: "Create a campaign", prompt: "Create an email campaign called 'Spring Outreach 2026'" },
  { label: "Recent activities", prompt: "What are my recent activities?" },
];

export default function AIAssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMutation = trpc.ai.chat.useMutation();
  const { data: myCompany } = trpc.tenants.myCompany.useQuery();

  // White-label: use company name/logo if available, fall back to generic "AI Assistant"
  const assistantName = myCompany?.name ? `${myCompany.name} AI` : "AI Assistant";
  const assistantGreeting = myCompany?.name ? `Hi! I'm ${myCompany.name} AI` : "Hi! I'm your AI Assistant";

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const result = await chatMutation.mutateAsync({
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      });
      setMessages(prev => [...prev, { role: "assistant", content: result.response }]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-16 right-4 z-50 w-[420px] max-h-[600px] flex flex-col bg-white rounded-2xl shadow-2xl border border-amber-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
        {myCompany?.logoUrl ? (
          <img
            src={myCompany.logoUrl}
            alt={myCompany.name}
            className="w-9 h-9 rounded-xl object-contain bg-white border border-amber-100 shadow-sm shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-stone-800 text-sm">{assistantName}</h3>
          <p className="text-xs text-stone-500">Ask anything or give me a command</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-amber-100">
          <X className="w-4 h-4 text-stone-500" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px] bg-gradient-to-b from-amber-50/30 to-white">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-6">
            {myCompany?.logoUrl ? (
              <img
                src={myCompany.logoUrl}
                alt={myCompany.name}
                className="w-14 h-14 rounded-2xl object-contain bg-amber-50 border border-amber-100 mx-auto mb-4 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-7 h-7 text-amber-600" />
              </div>
            )}
            <h4 className="font-semibold text-stone-700 mb-1">{assistantGreeting}</h4>
            <p className="text-sm text-stone-500 mb-5">I can answer questions and take actions in your CRM. Try one of these:</p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.prompt)}
                  className="text-left text-xs px-3 py-2.5 rounded-xl bg-white border border-amber-100 hover:border-amber-300 hover:bg-amber-50 text-stone-600 transition-all shadow-sm"
                >
                  <span className="font-medium text-amber-700">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              myCompany?.logoUrl ? (
                <img
                  src={myCompany.logoUrl}
                  alt={myCompany.name}
                  className="w-7 h-7 rounded-lg object-contain bg-white border border-amber-100 flex-shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )
            )}
            <div
              className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-md"
                  : "bg-white border border-stone-100 text-stone-700 rounded-bl-md shadow-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-stone max-w-none [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:my-1 [&_li]:my-0.5 [&_table]:text-xs [&_th]:px-2 [&_td]:px-2 [&_code]:text-xs [&_code]:bg-stone-100 [&_code]:px-1 [&_code]:rounded" dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-stone-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-stone-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5">
            {myCompany?.logoUrl ? (
              <img
                src={myCompany.logoUrl}
                alt={myCompany.name}
                className="w-7 h-7 rounded-lg object-contain bg-white border border-amber-100 flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className="bg-white border border-stone-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-stone-100 bg-white">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything or give a command..."
            disabled={isLoading}
            className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 placeholder:text-stone-400 disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-10 w-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm disabled:opacity-40"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      </form>
    </div>
  );
}

/** Simple markdown to HTML converter for assistant messages */
function formatMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^# (.+)$/gm, "<h2>$1</h2>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
    .replace(/<\/ul>\s*<ul>/g, "")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^([\s\S]+)$/, "<p>$1</p>")
    .replace(/<p><\/p>/g, "");
}
