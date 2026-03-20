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
import { Plus, Star, MessageSquare, TrendingUp, Wand2, Loader2, CheckCircle, AlertCircle, Minus } from "lucide-react";

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
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.batch3.reputation.list.useQuery({});

  const addReviewMutation = trpc.batch3.reputation.addReview.useMutation({
    onSuccess: () => {
      utils.batch3.reputation.list.invalidate();
      setAddOpen(false);
      resetForm();
      toast.success("Review added", { description: "Sentiment analyzed automatically." });
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  const aiResponseMutation = trpc.batch3.reputation.aiGenerateResponse.useMutation({
    onSuccess: (data) => {
      setResponseText(data.responseText);
    },
    onError: (e) => toast.error("AI Error", { description: e.message }),
  });

  const respondMutation = trpc.batch3.reputation.respondToReview.useMutation({
    onSuccess: () => {
      utils.batch3.reputation.list.invalidate();
      setRespondOpen(false);
      setSelectedReview(null);
      setResponseText("");
      toast.success("Response saved");
    },
  });

  const deleteMutation = trpc.batch3.reputation.delete.useMutation({
    onSuccess: () => {
      utils.batch3.reputation.list.invalidate();
      toast.success("Review removed");
    },
  });

  const [addOpen, setAddOpen] = useState(false);
  const [respondOpen, setRespondOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<{ id: number; platform: string; rating: number | null; reviewText: string | null } | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responseTone, setResponseTone] = useState<"professional" | "friendly" | "apologetic" | "grateful">("professional");

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
            <Button onClick={() => addReviewMutation.mutate({ platform, reviewerName: reviewerName || undefined, rating, reviewText: reviewText || undefined, reviewUrl: reviewUrl || undefined })} disabled={addReviewMutation.isPending}>
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
