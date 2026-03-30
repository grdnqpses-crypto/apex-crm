import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Calendar, Mail, Clock, CheckCircle, Loader2, Plane, Plus } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

export default function OOODetection() {
  const { t } = useSkin();
  const [showGuide, setShowGuide] = useState(false);
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.oooDetection.list.useQuery({});

  const detectMutation = trpc.oooDetection.detectFromEmail.useMutation({
    onSuccess: (result) => {
      if (result.isOOO) {
        utils.oooDetection.list.invalidate();
        toast.success("Out-of-office detected!", { description: `Return date: ${result.returnDate && result.returnDate !== "null" ? result.returnDate : "Unknown"}` });
      } else {
        toast.success("Not an OOO email", { description: "This email does not appear to be an out-of-office reply." });
      }
      setDetectOpen(false);
      setEmailBody("");
      setSenderEmail("");
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  const scheduleFollowUpMutation = trpc.oooDetection.scheduleFollowUp.useMutation({
    onSuccess: () => {
      utils.oooDetection.list.invalidate();
      toast.success("Follow-up scheduled");
      setFollowUpOpen(false);
    },
  });

  const deleteMutation = trpc.oooDetection.delete.useMutation({
    onSuccess: () => {
      utils.oooDetection.list.invalidate();
      toast.success("Record removed");
    },
  });

  const [detectOpen, setDetectOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [emailBody, setEmailBody] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const detections = data?.items ?? [];
  const pendingFollowUps = detections.filter(d => !d.followUpScheduled).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Out-of-Office Detection</h1>
          <p className="text-muted-foreground">Automatically detect OOO replies and schedule smart follow-ups for when contacts return.</p>
        </div>
        <Button onClick={() => setDetectOpen(true)}>
          <Search className="h-4 w-4 mr-2" />
          Analyze Email
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Plane className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Detected</span>
            </div>
            <div className="text-3xl font-bold">{data?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Pending Follow-up</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">{pendingFollowUps}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Follow-ups Scheduled</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{detections.filter(d => d.followUpScheduled).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detections list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading detections...</div>
      ) : detections.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Plane className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No OOO detections yet</h3>
            <p className="text-muted-foreground mb-4">Paste an email to check if it's an out-of-office reply.</p>
            <Button onClick={() => setDetectOpen(true)}>
              <Search className="h-4 w-4 mr-2" />
              Analyze Email
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {detections.map(d => (
            <Card key={d.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5 p-2 bg-blue-50 dark:bg-blue-950 rounded-full shrink-0">
                      <Plane className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{d.email}</span>
                        {(d.contactFirstName || d.contactLastName) && (
                          <span className="text-xs text-muted-foreground">
                            ({d.contactFirstName} {d.contactLastName})
                          </span>
                        )}
                        {d.followUpScheduled ? (
                          <Badge variant="default" className="text-xs flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Follow-up scheduled
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Awaiting follow-up</Badge>
                        )}
                      </div>
                      {d.oooMessage && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{d.oooMessage}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Detected {new Date(d.detectedAt).toLocaleDateString()}
                        </span>
                        {d.returnDate && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Calendar className="h-3 w-3" />
                            Returns {new Date(d.returnDate).toLocaleDateString()}
                          </span>
                        )}
                        {d.followUpDate && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Clock className="h-3 w-3" />
                            Follow-up {new Date(d.followUpDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!d.followUpScheduled && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedId(d.id);
                          // Pre-fill with return date if available
                          if (d.returnDate) {
                            const dt = new Date(d.returnDate);
                            setFollowUpDate(dt.toISOString().split("T")[0]);
                          } else {
                            setFollowUpDate("");
                          }
                          setFollowUpOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate({ id: d.id })}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Analyze Email Dialog */}
      <Dialog open={detectOpen} onOpenChange={setDetectOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Analyze Email for OOO</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Paste an email reply below. The AI will determine if it's an out-of-office message and extract the return date.
            </p>
            <div>
              <Label>Sender Email</Label>
              <Input
                type="email"
                value={senderEmail}
                onChange={e => setSenderEmail(e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <Label>Email Body</Label>
              <Textarea
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                placeholder="Paste the email content here..."
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetectOpen(false)}>Cancel</Button>
            <Button
              onClick={() => detectMutation.mutate({ emailBody, senderEmail })}
              disabled={!emailBody.trim() || !senderEmail.trim() || detectMutation.isPending}
            >
              {detectMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Search className="h-4 w-4 mr-2" />Analyze</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Follow-up Dialog */}
      <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule Follow-up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set a date to follow up with this contact after they return from their OOO.
            </p>
            <div>
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowUpOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (selectedId && followUpDate) {
                  scheduleFollowUpMutation.mutate({
                    id: selectedId,
                    followUpDate: new Date(followUpDate).getTime(),
                  });
                }
              }}
              disabled={!followUpDate || scheduleFollowUpMutation.isPending}
            >
              {scheduleFollowUpMutation.isPending ? "Saving..." : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
