import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, RefreshCw, Linkedin, Twitter, Instagram, Facebook } from "lucide-react";
import { toast } from "sonner";

const PLATFORMS = [
  { value: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
  { value: "twitter", label: "X / Twitter", icon: Twitter, color: "text-sky-500" },
  { value: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { value: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-600" },
];

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual & Friendly" },
  { value: "bold", label: "Bold & Confident" },
  { value: "inspirational", label: "Inspirational" },
  { value: "educational", label: "Educational" },
  { value: "promotional", label: "Promotional" },
];

const TOPICS = [
  "Product announcement", "Customer success story", "Industry insight",
  "Company culture", "Thought leadership", "Event promotion", "Sales offer",
];

export default function AIPostWriter() {
  const [platform, setPlatform] = useState<"linkedin" | "twitter" | "facebook" | "instagram">("linkedin");
  const [tone, setTone] = useState<"professional" | "casual" | "inspiring" | "educational" | "promotional">("professional");
  const [topic, setTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [generatedPosts, setGeneratedPosts] = useState<string[]>([]);

  const generate = trpc.aiPostWriter.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedPosts([data.post]);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleGenerate = () => {
    const finalTopic = customTopic.trim() || topic;
    if (!finalTopic) return toast.error("Please select or enter a topic");
    generate.mutate({ platform, tone, topic: finalTopic, includeHashtags: true, includeEmoji: false });
  };

  const copyPost = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const selectedPlatform = PLATFORMS.find((p) => p.value === platform);
  const PlatformIcon = selectedPlatform?.icon ?? Linkedin;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            AI Post Writer
          </h1>
          <p className="text-muted-foreground mt-1">Generate high-converting social media posts with AI in seconds</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Config panel */}
          <div className="col-span-1 space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setPlatform(p.value as typeof platform)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                          platform === p.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <p.icon className={`w-5 h-5 ${p.color}`} />
                        <span className="text-xs font-medium">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Topic</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {TOPICS.map((t) => (
                      <button
                        key={t}
                        onClick={() => { setTopic(t); setCustomTopic(""); }}
                        className={`text-xs px-2 py-1 rounded-full border transition-all ${
                          topic === t && !customTopic
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="Or type a custom topic..."
                    value={customTopic}
                    onChange={(e) => { setCustomTopic(e.target.value); setTopic(""); }}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generate.isPending}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {generate.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate 3 Variations
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Generated posts */}
          <div className="col-span-2 space-y-4">
            {generate.isPending ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="h-32 bg-muted/30 rounded-xl" />
                  </Card>
                ))}
              </div>
            ) : generatedPosts.length === 0 ? (
              <Card className="border-dashed h-full min-h-[400px]">
                <CardContent className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                    <PlatformIcon className={`w-8 h-8 ${selectedPlatform?.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Ready to write</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Select your platform, tone, and topic — then click Generate to create 3 post variations instantly.
                  </p>
                </CardContent>
              </Card>
            ) : (
              generatedPosts.map((post, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <PlatformIcon className={`w-4 h-4 ${selectedPlatform?.color}`} />
                        <Badge variant="secondary" className="text-xs">Variation {i + 1}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{tone}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyPost(post)}
                          className="text-xs"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{post}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-xs text-muted-foreground">{post.length} characters</span>
                      {platform === "twitter" && post.length > 280 && (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                          Over 280 chars
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
