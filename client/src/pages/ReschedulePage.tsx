import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

function formatDate(ts: number, tz: string) {
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: tz,
  });
}
function formatTime(ts: number, tz: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", timeZone: tz, hour12: true,
  });
}

function generateSlots(durationMinutes: number): number[] {
  const slots: number[] = [];
  const now = Date.now();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  for (let d = 0; d < 14; d++) {
    const day = new Date(tomorrow);
    day.setDate(day.getDate() + d);
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    for (let h = 8; h < 18; h++) {
      for (let m = 0; m < 60; m += durationMinutes) {
        const slotTime = new Date(day);
        slotTime.setHours(h, m, 0, 0);
        slots.push(slotTime.getTime());
      }
    }
  }
  return slots;
}

export default function ReschedulePage() {
  const [, params] = useRoute("/reschedule/:token");
  const token = params?.token ?? "";

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [rescheduled, setRescheduled] = useState(false);
  const [newTime, setNewTime] = useState<number | null>(null);

  const { data, isLoading, error } = trpc.publicBooking.getBookingByRescheduleToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const rescheduleMutation = trpc.publicBooking.rescheduleBooking.useMutation({
    onSuccess: (result) => {
      setRescheduled(true);
      setNewTime(result.newStartTime);
      toast.success("Meeting rescheduled successfully!");
    },
    onError: (err) => {
      if (err.data?.code === "CONFLICT") {
        toast.error("That slot is no longer available. Please choose another time.");
      } else {
        toast.error("Failed to reschedule. Please try again.");
      }
    },
  });

  const booking = data?.booking;
  const meetingType = data?.meetingType;
  const tz = booking?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const duration = meetingType?.durationMinutes ?? 30;

  // Group slots by date
  const allSlots = generateSlots(duration);
  const slotsByDate: Record<string, number[]> = {};
  for (const slot of allSlots) {
    const dateKey = new Date(slot).toLocaleDateString("en-CA", { timeZone: tz }); // YYYY-MM-DD
    if (!slotsByDate[dateKey]) slotsByDate[dateKey] = [];
    slotsByDate[dateKey].push(slot);
  }
  const availableDates = Object.keys(slotsByDate).sort().slice(0, 14);

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates.length]);

  const handleReschedule = () => {
    if (!selectedSlot) return;
    rescheduleMutation.mutate({
      rescheduleToken: token,
      newStartTime: selectedSlot,
      origin: window.location.origin,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your booking...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Link Not Found</h2>
            <p className="text-gray-500 text-sm">
              This reschedule link is invalid or has expired. Please contact the host to get a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (booking.status === "cancelled") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Booking Cancelled</h2>
            <p className="text-gray-500 text-sm">This meeting has already been cancelled and cannot be rescheduled.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (rescheduled && newTime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Meeting Rescheduled!</h2>
            <p className="text-gray-500 mb-6">Your meeting has been moved to the new time below.</p>
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span>{formatDate(newTime, tz)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>{formatTime(newTime, tz)} — {formatTime(newTime + duration * 60 * 1000, tz)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">A confirmation email has been sent to {booking.guestEmail}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm border border-orange-100 mb-4">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-sm font-medium text-gray-700">Reschedule Meeting</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {meetingType?.name ?? "Meeting"}
          </h1>
          <p className="text-gray-500">Hi {booking.guestName}, choose a new time below.</p>
        </div>

        {/* Current booking info */}
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Current Time</p>
            <div className="flex items-center gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-amber-500" />
                <span>{formatDate(booking.startTime, tz)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>{formatTime(booking.startTime, tz)}</span>
              </div>
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-white">
                {duration} min
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Date picker */}
        <Card className="mb-4 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              Select a New Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {availableDates.map(dateKey => {
                const d = new Date(dateKey + "T12:00:00");
                const isSelected = selectedDate === dateKey;
                return (
                  <button
                    key={dateKey}
                    onClick={() => { setSelectedDate(dateKey); setSelectedSlot(null); }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      isSelected
                        ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    <div className="text-xs opacity-80">{d.toLocaleDateString("en-US", { weekday: "short" })}</div>
                    <div>{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Time slots */}
        {selectedDate && (
          <Card className="mb-6 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Available Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {(slotsByDate[selectedDate] ?? []).map(slot => {
                  const isSelected = selectedSlot === slot;
                  const isCurrent = Math.abs(slot - booking.startTime) < 60000;
                  return (
                    <button
                      key={slot}
                      disabled={isCurrent}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                        isCurrent
                          ? "opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400"
                          : isSelected
                          ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      {formatTime(slot, tz)}
                      {isCurrent && <div className="text-xs opacity-70">current</div>}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirm button */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            disabled={!selectedSlot || rescheduleMutation.isPending}
            onClick={handleReschedule}
          >
            {rescheduleMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Rescheduling...</>
            ) : (
              "Confirm New Time"
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          All times shown in {tz.replace(/_/g, " ")}
        </p>
      </div>
    </div>
  );
}
