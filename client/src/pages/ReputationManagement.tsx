import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Star, MessageSquare, TrendingUp, Wand2, Loader2, CheckCircle, AlertCircle, Minus, BarChart3, Send, Sparkles } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PLATFORMS = ["Google", "Yelp", "Trustpilot", "G2", "Capterra", "Facebook", "Apple App Store", "Google Play", "Other"];

const SENTIMENT_CONFIG = {
  positive: { label: "Positive", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950", icon: <TrendingUp className="h-4 w-4" /> },
  neutral: { label: "Neutral", color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950", icon: <Minus className="h-4 w-4" /> },
  negative: { label: "Negative", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950", icon: <AlertCircle className="h-4 w-4" /> },
};

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-muted-foreground text-sm">No rating</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );
}

export default function ReputationManagement() {
  const { t } = useSkin();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("reviews");
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [selectedMention, setSelectedMention] = useState<any>(null);
  const [responseTextNew, setResponseTextNew] = useState("");
  const [autoSend, setAutoSend] = useState(false);

  // Existing reputation router (for reviews)
  const { data, isLoading } = trpc.reputation.list.useQuery({});
  
  // New reputation management router (for brand mentions)
  const { data: metrics } = trpc.reputationManagement.getReputationMetrics.useQuery();
  const { data: mentions } = trpc.reputationManagement.getMentions.useQuery({ sentiment: "all", limit: 50 });
  const { data: alerts } = trpc.reputationManagement.getCrisisAlerts.useQuery();
  const { data: templates } = trpc.reputationManagement.getResponseTemplates.useQuery();

  // Mutations for new reputation management router
  const generateResponseMutation = trpc.reputationManagement.generateResponse.useMutation({
    onSuccess: (data) => {
      setResponseTextNew(data.response);
      toast.success("Response generated");
    },
    onError: (e) => toast.error(e.message),
  });
  const createResponseMutation = trpc.reputationManagement.createResponse.useMutation({
    onSuccess: () => {
      setShowResponseDialog(false);
      setResponseTextNew("");
      setSelectedMention(null);
      toast.success("Response saved successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  // Existing mutations
  const addReviewMutation = trpc.reputation.addReview.useMutation({
    onSuccess: () => {
      utils.reputation.list.invalidate();
      setAddOpen(false);
      resetForm();
      toast.success("Review added", { description: "Sentiment analyzed automatically." });
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  const aiResponseMutation = trpc.reputation.aiGenerateResponse.useMutation({
    onSuccess: (data) => {
      setResponseText(data.responseText);
    },
    onError: (e) => toast.error("AI Error", { description: e.message }),
  });

  const respondMutation = trpc.reputation.respondToReview.useMutation({
    onSuccess: () => {
      utils.reputation.list.invalidate();
      setRespondOpen(false);
      setSelectedReview(null);
      setResponseText("");
      toast.success("Response saved");
    },
  });

  const deleteMutation = trpc.reputation.delete.useMutation({
    onSuccess: () => {
      utils.reputation.list.invalidate();
      toast.success("Review removed");
    },
  });

  const [addOpen, setAddOpen] = useState(false);
  const [respondOpen, setRespondOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<{ id: number; platform: string; rating: number | null; reviewText: string | null } | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responseTone, setResponseTone] = useState<"professional" | "friendly" | "apologetic" | "grateful">("professional");

  const handleGenerateResponse = async () => {
    if (!selectedMention) return;
    generateResponseMutation.mutate({
      mentionId: selectedMention.id,
      mentionText: selectedMention.mentionText,
      sentiment: selectedMention.sentiment,
      authorName: selectedMention.authorName,
      platform: selectedMention.source.toLowerCase() as any,
    });
  };

  const handleSendResponse = () => {
    if (!responseTextNew.trim()) {
      toast.error("Response cannot be empty");
      return;
    }
    createResponseMutation.mutate({
      mentionId: selectedMention.id,
      responseText: responseTextNew,
      autoSend,
    });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "bg-green-50 text-green-700 border-green-200";
      case "negative": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "negative": return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  // Form state
  const [platform, setPlatform] = useState("Google");
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewTextState] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");

  const resetForm = () => {
    setPlatform("Google");
    setReviewerName("");
    setRating(5);
    setReviewTextState("");
    setReviewUrl("");
  };

  const reviews = data?.items ?? [];
  const avgRating = data?.avgRating ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reputation Management</h1>
          <p className="text-muted-foreground">Monitor reviews, respond with AI, and track your brand sentiment across platforms.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Review
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="mentions">Brand Mentions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Reviews Tab (existing) */}
        <TabsContent value="reviews" className="space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-muted-foreground">Avg Rating</span>
            </div>
            <div className="text-3xl font-bold">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Positive</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{data?.positiveCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Minus className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Neutral</span>
            </div>
            <div className="text-3xl font-bold text-yellow-600">{data?.neutralCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Negative</span>
            </div>
            <div className="text-3xl font-bold text-red-600">{data?.negativeCount ?? 0}</div>
          </CardContent>
          </Card>
        </div>

          {/* Reviews list */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                <p className="text-muted-foreground mb-4">Add your first review to start tracking your reputation.</p>
                <Button onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Review
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => {
                const sentCfg = SENTIMENT_CONFIG[review.sentiment as keyof typeof SENTIMENT_CONFIG] ?? SENTIMENT_CONFIG.neutral;
                return (
                  <Card key={review.id} className={`${sentCfg.bg} border-0`}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">{review.platform}</Badge>
                            <StarRating rating={review.rating} />
                            <span className={`flex items-center gap-1 text-xs font-medium ${sentCfg.color}`}>
                              {sentCfg.icon}
                              {sentCfg.label}
                            </span>
                            {review.responded && (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                Responded
                              </span>
                            )}
                          </div>
                          {review.reviewerName && (
                            <div className="text-sm font-medium">{review.reviewerName}</div>
                          )}
                          {review.reviewText && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{review.reviewText}</p>
                          )}
                          {review.responseText && (
                            <div className="mt-2 pl-3 border-l-2 border-primary/30">
                              <div className="text-xs text-muted-foreground mb-1">Your response:</div>
                              <p className="text-sm">{review.responseText}</p>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-2">
                            {new Date(review.reviewDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {!review.responded && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReview({ id: review.id, platform: review.platform, rating: review.rating, reviewText: review.reviewText });
                                setRespondOpen(true);
                              }}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Respond
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate({ id: review.id })}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Brand Mentions Tab */}
        <TabsContent value="mentions" className="space-y-4">
          {/* Crisis Alerts */}
          {alerts && alerts.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  Crisis Alert
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((alert: any) => (
                  <div key={alert.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-red-900">{alert.title}</p>
                        <p className="text-sm text-red-700">{alert.description}</p>
                      </div>
                      <Badge variant="destructive">{alert.severity}</Badge>
                    </div>
                    <p className="text-xs text-red-600 font-semibold">Suggested Action: {alert.suggestedAction}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Mentions List */}
          <div className="space-y-3">
            {mentions?.map((mention: any) => (
              <Card key={mention.id} className={`border ${getSentimentColor(mention.sentiment)}`}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getSentimentIcon(mention.sentiment)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{mention.authorName}</p>
                          <p className="text-xs text-muted-foreground">@{mention.authorHandle} · {mention.source}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{(mention.score * 100).toFixed(0)}%</Badge>
                    </div>

                    <p className="text-sm">{mention.mentionText}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <a href={mention.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        View on {mention.source}
                      </a>
                      <span>{new Date(mention.createdAt).toLocaleDateString()}</span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMention(mention);
                        setShowResponseDialog(true);
                      }}
                      className="w-full"
                    >
                      <Send className="h-3.5 w-3.5 mr-2" />
                      Respond
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Overall Sentiment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{((metrics?.overallSentiment ?? 0) * 100).toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Positive mentions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Mentions Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.mentionsTrend?.today ?? 0}</div>
                <p className="text-xs text-green-600 mt-1">↑ {((metrics?.mentionsTrend?.today ?? 0) - (metrics?.mentionsTrend?.yesterday ?? 0))} from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Response Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{((metrics?.responseRate ?? 0) * 100).toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Avg response time: {metrics?.avgResponseTime ?? 0}m</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Crisis Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.crisisAlerts ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active alerts</p>
              </CardContent>
            </Card>
          </div>

          {/* Sentiment Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Positive</span>
                    <span className="text-green-600 font-semibold">{metrics?.sentimentBreakdown?.positive ?? 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${metrics?.sentimentBreakdown?.positive ?? 0}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Neutral</span>
                    <span className="text-gray-600 font-semibold">{metrics?.sentimentBreakdown?.neutral ?? 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${metrics?.sentimentBreakdown?.neutral ?? 0}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Negative</span>
                    <span className="text-red-600 font-semibold">{metrics?.sentimentBreakdown?.negative ?? 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${metrics?.sentimentBreakdown?.negative ?? 0}%` }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Mentioned Topics */}
          <Card>
            <CardHeader>
              <CardTitle>Top Mentioned Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.topMentionedTopics?.map((topic: any) => (
                  <div key={topic.topic} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{topic.topic}</p>
                      <p className="text-xs text-muted-foreground">{topic.mentions} mentions</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={topic.sentiment > 0.5 ? "default" : topic.sentiment < -0.5 ? "destructive" : "secondary"}>
                        {(topic.sentiment * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Mention</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm italic">{selectedMention?.mentionText}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Your Response</Label>
              <textarea
                value={responseTextNew}
                onChange={(e) => setResponseTextNew(e.target.value)}
                placeholder="Type your response..."
                className="w-full min-h-[120px] rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">{responseTextNew.length} characters</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoSend"
                checked={autoSend}
                onChange={(e) => setAutoSend(e.target.checked)}
                className="rounded border-border"
              />
              <Label htmlFor="autoSend" className="text-sm cursor-pointer">
                Send immediately (requires platform API connection)
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateResponse}
                disabled={generateResponseMutation.isPending}
              >
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                {generateResponseMutation.isPending ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendResponse}
              disabled={!responseTextNew.trim() || createResponseMutation.isPending}
            >
              {createResponseMutation.isPending ? "Saving..." : "Save Response"}
            </Button>
          </div>
        </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Review Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Reviewer Name</Label>
                <Input value={reviewerName} onChange={e => setReviewerName(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <Label>Rating (1-5)</Label>
                <Select value={String(rating)} onValueChange={v => setRating(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map(r => (
                      <SelectItem key={r} value={String(r)}>
                        {"★".repeat(r)}{"☆".repeat(5 - r)} ({r})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Review Text</Label>
              <Textarea
                value={reviewText}
                onChange={e => setReviewTextState(e.target.value)}
                placeholder="Paste the review text here for AI sentiment analysis..."
                rows={4}
              />
            </div>
            <div>
              <Label>Review URL (optional)</Label>
              <Input value={reviewUrl} onChange={e => setReviewUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); resetForm(); }}>Cancel</Button>
            <Button 
              onClick={() => addReviewMutation.mutate({ platform, reviewerName: reviewerName || undefined, rating, reviewText: reviewText || undefined, reviewUrl: reviewUrl || undefined })} 
              disabled={addReviewMutation.isPending}
            >
              {addReviewMutation.isPending ? "Analyzing..." : "Add Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Respond Dialog */}
      <Dialog open={respondOpen} onOpenChange={setRespondOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{selectedReview.platform}</Badge>
                  <StarRating rating={selectedReview.rating} />
                </div>
                <p className="text-muted-foreground">{selectedReview.reviewText ?? "No text"}</p>
              </div>
              <div>
                <Label>Response Tone</Label>
                <Select value={responseTone} onValueChange={v => setResponseTone(v as typeof responseTone)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="apologetic">Apologetic</SelectItem>
                    <SelectItem value="grateful">Grateful</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => aiResponseMutation.mutate({ reviewId: selectedReview.id, tone: responseTone })}
                disabled={aiResponseMutation.isPending}
              >
                {aiResponseMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><Wand2 className="h-4 w-4 mr-2" />Generate AI Response</>
                )}
              </Button>
              <div>
                <Label>Your Response</Label>
                <Textarea
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  placeholder="Write your response here..."
                  rows={5}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRespondOpen(false); setResponseText(""); }}>Cancel</Button>
            <Button
              onClick={() => selectedReview && respondMutation.mutate({ id: selectedReview.id, responseText })}
              disabled={!responseText.trim() || respondMutation.isPending}
            >
              {respondMutation.isPending ? "Saving..." : "Save Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
