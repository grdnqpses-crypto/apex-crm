import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Share2, Plus, Sparkles, Trash2, Send, Calendar, BarChart2, Link, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";

const PLATFORMS = ["linkedin", "twitter", "facebook", "instagram"] as const;
type Platform = "linkedin" | "facebook" | "instagram";
const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "bg-blue-600/20 text-blue-400",
  twitter: "bg-sky-500/20 text-sky-400",
  facebook: "bg-blue-500/20 text-blue-400",
  instagram: "bg-pink-500/20 text-pink-400",
};

export default function SocialScheduler() {
  const { t } = useSkin();
  const utils = trpc.useUtils();
  const { data: posts, isLoading } = trpc.socialScheduler.getPosts.useQuery({ status: 'all', limit: 50 });
  const { data: accounts } = trpc.socialScheduler.getAccounts.useQuery();
  const { data: stats } = trpc.socialScheduler.getStats.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ content: "", platforms: [] as Platform[], scheduledAt: "" });
  const [aiPrompt, setAiPrompt] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const createMutation = trpc.socialScheduler.createPost.useMutation({
    onSuccess: () => { utils.socialScheduler.getPosts.invalidate(); utils.socialScheduler.getStats.invalidate(); setShowCreate(false); setForm({ content: "", platforms: [], scheduledAt: "" }); toast.success("Post scheduled"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.socialScheduler.deletePost.useMutation({
    onSuccess: () => { utils.socialScheduler.getPosts.invalidate(); utils.socialScheduler.getStats.invalidate(); toast.success("Post deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const publishNowMutation = trpc.socialScheduler.publishNow.useMutation({
    onSuccess: () => { utils.socialScheduler.getPosts.invalidate(); toast.success("Published!"); },
    onError: (e) => toast.error(e.message),
  });
  const generateAIMutation = trpc.socialScheduler.generateContentWithAI.useMutation({
    onSuccess: (data) => { setForm(prev => ({ ...prev, content: data.content || prev.content })); toast.success("AI content generated"); },
    onError: (e) => toast.error(e.message),
  });
  const connectMutation = trpc.socialScheduler.connectAccount.useMutation({
    onSuccess: () => { utils.socialScheduler.getAccounts.invalidate(); toast.success("Account connected"); },
    onError: (e) => toast.error(e.message),
  });

  const postList = posts as any[] || [];
  const accountList = accounts as any[] || [];
  const statsData = stats as any;

  const filteredPosts = filter === "all" ? postList : postList.filter((p: any) => p.status === filter);

  const togglePlatform = (platform: string) => {
    if (platform === 'twitter') return; // twitter not supported by API
    const p = platform as Platform;
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...prev.platforms, p],
    }));
  };

  const statusColor: Record<string, string> = {
    draft: "bg-gray-500/20 text-gray-400",
    scheduled: "bg-blue-500/20 text-blue-400",
    published: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
  };

  return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Share2 className="w-6 h-6 text-primary" /> Social Media Scheduler</h1>
            <p className="text-muted-foreground mt-1">Schedule and publish content across LinkedIn, Twitter, Facebook, and Instagram with AI assistance</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> Create Post</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Posts", value: statsData?.totalPosts ?? postList.length, icon: Share2, color: "text-blue-400" },
            { label: "Scheduled", value: statsData?.scheduled ?? postList.filter((p: any) => p.status === "scheduled").length, icon: Calendar, color: "text-yellow-400" },
            { label: "Published", value: statsData?.published ?? postList.filter((p: any) => p.status === "published").length, icon: CheckCircle2, color: "text-green-400" },
            { label: "Connected Accounts", value: accountList.length, icon: Link, color: "text-purple-400" },
          ].map(stat => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p><p className="text-2xl font-bold mt-1">{stat.value}</p></div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-60`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Connected Accounts */}
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Connected Accounts</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 flex-wrap">
              {PLATFORMS.map(platform => {
                const connected = accountList.find((a: any) => a.platform === platform);
                return (
                  <div key={platform} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${connected ? "border-green-400/30 bg-green-400/5" : "border-border/50"}`}>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${PLATFORM_COLORS[platform]}`}>{platform}</span>
                    {connected ? (
                      <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Connected</span>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { if (platform !== 'twitter') connectMutation.mutate({ platform: platform as Platform, accountName: `My ${platform}` }); }}>Connect</Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {["all", "draft", "scheduled", "published", "failed"].map(s => (
            <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)} className="capitalize">{s}</Button>
          ))}
        </div>

        {/* Posts List */}
        <div className="space-y-3">
          {isLoading && <div className="text-center py-8 text-muted-foreground">Loading posts...</div>}
          {!isLoading && filteredPosts.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Share2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">No posts yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Schedule content across all your social media platforms from one place</p>
                <Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> Create First Post</Button>
              </CardContent>
            </Card>
          )}
          {filteredPosts.map((post: any) => (
            <Card key={post.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge className={statusColor[post.status] || "bg-gray-500/20 text-gray-400"}>{post.status}</Badge>
                      {(post.platforms as string[] || []).map((p: string) => (
                        <span key={p} className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${PLATFORM_COLORS[p] || "bg-gray-500/20 text-gray-400"}`}>{p}</span>
                      ))}
                      {post.scheduledAt && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.scheduledAt).toLocaleString()}</span>
                      )}
                    </div>
                    <p className="text-sm line-clamp-3">{post.content}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {post.status === "draft" || post.status === "scheduled" ? (
                      <Button size="sm" variant="outline" className="gap-1 text-green-400 border-green-400/30 hover:bg-green-400/10" onClick={() => publishNowMutation.mutate({ id: post.id })}><Send className="w-3 h-3" /> Publish</Button>
                    ) : null}
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate({ id: post.id })}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Post Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Create Social Post</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Platforms *</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => togglePlatform(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize border transition-colors ${(form.platforms as string[]).includes(p) ? "border-primary bg-primary/10 text-primary" : "border-border/50 hover:border-border"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Content *</Label>
                <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your post content..." rows={5} />
                <p className="text-xs text-muted-foreground mt-1">{form.content.length} characters</p>
              </div>
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                <Input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Describe what you want to post about..." className="border-0 bg-transparent p-0 focus-visible:ring-0 text-sm" />
                <Button size="sm" variant="outline" disabled={!aiPrompt || generateAIMutation.isPending} onClick={() => generateAIMutation.mutate({ topic: aiPrompt, platform: (form.platforms[0] || 'linkedin') as Platform })}>
                  <Sparkles className="w-3 h-3 mr-1" /> Generate
                </Button>
              </div>
              <div>
                <Label>Schedule For (optional)</Label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate({
                content: form.content,
                platforms: form.platforms.filter((p): p is Platform => p === 'linkedin' || p === 'facebook' || p === 'instagram'),
                scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).getTime() : undefined,
              })} disabled={!form.content || form.platforms.length === 0 || createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : form.scheduledAt ? "Schedule Post" : "Save as Draft"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
