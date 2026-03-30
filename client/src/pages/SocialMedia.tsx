import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useSkin } from "@/contexts/SkinContext";
import { Share2, Calendar, BarChart3, Plus, Send, Sparkles, CheckCircle2, Clock, Users } from "lucide-react";

export default function SocialMedia() {
  const { t } = useSkin();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("compose");
  const [showCompose, setShowCompose] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>(["twitter", "linkedin"]);
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState<number>(Date.now() + 86400000);

  const { data: accounts } = trpc.socialMedia.getConnectedAccounts.useQuery();
  const { data: analytics } = trpc.socialMedia.getSocialAnalytics.useQuery({ platform: undefined, days: 30 });
  const { data: calendar } = trpc.socialMedia.getContentCalendar.useQuery({ startDate: Date.now(), endDate: Date.now() + 2592000000 });

  const bulkPostMutation = trpc.socialMedia.bulkPost.useMutation({
    onSuccess: () => {
      utils.socialMedia.getSocialAnalytics.invalidate();
      setContent("");
      setPlatforms(["twitter", "linkedin"]);
      setShowCompose(false);
      toast.success("Posted to all platforms!");
    },
    onError: (e) => toast.error(e.message),
  });

  const schedulePostMutation = trpc.socialMedia.schedulePost.useMutation({
    onSuccess: () => {
      utils.socialMedia.getContentCalendar.invalidate();
      setContent("");
      setPlatforms(["twitter", "linkedin"]);
      setShowSchedule(false);
      toast.success("Post scheduled successfully!");
    },
    onError: (e) => toast.error(e.message),
  });

  const generateContentMutation = trpc.socialMedia.generateSocialContent.useMutation({
    onSuccess: (data) => {
      setContent(data.content);
      toast.success("Content generated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleBulkPost = () => {
    if (!content.trim()) {
      toast.error("Please enter content");
      return;
    }
    bulkPostMutation.mutate({
      platforms: platforms as any,
      content,
      immediate: true,
    });
  };

  const handleSchedulePost = () => {
    if (!content.trim()) {
      toast.error("Please enter content");
      return;
    }
    schedulePostMutation.mutate({
      platforms: platforms as any,
      content,
      scheduledAt,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Media</h1>
          <p className="text-muted-foreground">Schedule posts, track engagement, and manage your social presence.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCompose(true)}>
            <Send className="h-4 w-4 mr-2" />
            Post Now
          </Button>
          <Button variant="outline" onClick={() => setShowSchedule(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Platforms</Label>
                <div className="flex gap-2 flex-wrap">
                  {["twitter", "linkedin", "facebook", "instagram"].map(p => (
                    <Badge
                      key={p}
                      variant={platforms.includes(p) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground">{content.length} characters</p>
              </div>

              <Button
                variant="outline"
                onClick={() => generateContentMutation.mutate({
                  topic: "Recent company updates",
                  tone: "professional",
                  platform: "linkedin",
                  includeHashtags: true,
                })}
                disabled={generateContentMutation.isPending}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generateContentMutation.isPending ? "Generating..." : "Generate with AI"}
              </Button>

              <div className="flex gap-2">
                <Button onClick={handleBulkPost} disabled={bulkPostMutation.isPending || !content.trim()}>
                  {bulkPostMutation.isPending ? "Posting..." : "Post Now"}
                </Button>
                <Button variant="outline" onClick={() => setShowSchedule(true)}>
                  Schedule Instead
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {calendar?.slice(0, 10).map(post => (
                  <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{new Date(post.scheduledTime).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">{post.platform}</p>
                    </div>
                    <Badge variant={post.status === "published" ? "default" : "secondary"}>
                      {post.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalPosts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalEngagement}</div>
                <p className="text-xs text-green-600 mt-1">+{(analytics?.averageEngagementRate ?? 0 * 100).toFixed(1)}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Post</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.topPost.engagement}</div>
                <p className="text-xs text-muted-foreground mt-1">interactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Platforms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.platformBreakdown.length}</div>
                <p className="text-xs text-muted-foreground mt-1">active</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.platformBreakdown.map(platform => (
                  <div key={platform.platform} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{platform.platform}</span>
                      <span className="text-sm text-muted-foreground">{platform.followers.toLocaleString()} followers</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>{platform.posts} posts</span>
                      <span className="text-green-600">{platform.engagement} engagement</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accounts?.map(account => (
                  <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium capitalize">{account.platform}</p>
                      <p className="text-sm text-muted-foreground">{account.handle}</p>
                      <p className="text-xs text-muted-foreground">{account.followers.toLocaleString()} followers</p>
                    </div>
                    {account.connected ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Connected
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline">Connect</Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Compose Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Now</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="flex gap-2 flex-wrap">
                {["twitter", "linkedin", "facebook", "instagram"].map(p => (
                  <Badge
                    key={p}
                    variant={platforms.includes(p) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
            <Button onClick={handleBulkPost} disabled={bulkPostMutation.isPending}>
              {bulkPostMutation.isPending ? "Posting..." : "Post Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="flex gap-2 flex-wrap">
                {["twitter", "linkedin", "facebook", "instagram"].map(p => (
                  <Badge
                    key={p}
                    variant={platforms.includes(p) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[150px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Schedule For</Label>
              <Input
                type="datetime-local"
                value={new Date(scheduledAt).toISOString().slice(0, 16)}
                onChange={(e) => setScheduledAt(new Date(e.target.value).getTime())}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSchedule(false)}>Cancel</Button>
            <Button onClick={handleSchedulePost} disabled={schedulePostMutation.isPending}>
              {schedulePostMutation.isPending ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
