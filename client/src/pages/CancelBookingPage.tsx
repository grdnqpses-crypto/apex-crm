import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function CancelBookingPage() {
  const [, params] = useRoute("/cancel/:cancelToken");
  const cancelToken = params?.cancelToken ?? "";
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelBooking = trpc.publicBooking.cancelBooking.useMutation({
    onSuccess: () => setCancelled(true),
    onError: (e) => setError(e.message || "Failed to cancel booking. The link may have already been used."),
  });

  if (!cancelToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Cancel Link</h2>
            <p className="text-muted-foreground">This cancellation link is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Meeting Cancelled</h2>
            <p className="text-muted-foreground">
              Your meeting has been cancelled. You'll receive a confirmation email shortly.
            </p>
            <p className="text-xs text-muted-foreground mt-6">
              Changed your mind? Contact the host directly to rebook.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Cancellation Failed</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Cancel Meeting?</h2>
          <p className="text-muted-foreground mb-8">
            Are you sure you want to cancel this meeting? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              Keep Meeting
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelBooking.mutate({ cancelToken })}
              disabled={cancelBooking.isPending}
            >
              {cancelBooking.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling…
                </>
              ) : (
                "Yes, Cancel Meeting"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
