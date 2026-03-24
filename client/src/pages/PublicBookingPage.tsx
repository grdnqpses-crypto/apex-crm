import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar, Clock, CheckCircle2, User, ChevronLeft, ChevronRight,
  Shield, Wifi, WifiOff,
} from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

type Slot = {
  startTime: number;
  endTime: number;
  available: boolean;
  calendarConnected?: boolean;
};

export default function PublicBookingPage() {
  const [, params] = useRoute("/book/:profileId");
  const profileId = params?.profileId ? parseInt(params.profileId) : 0;

  const [step, setStep] = useState<"pick-type" | "pick-date" | "pick-time" | "details" | "confirmed">("pick-type");
  const [selectedType, setSelectedType] = useState<any>(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [gdprConsent, setGdprConsent] = useState(false);
  const [booked, setBooked] = useState<any>(null);

  const { data: profile, isLoading: profileLoading } = trpc.publicBooking.getProfile.useQuery(
    { profileId },
    { enabled: profileId > 0 },
  );

  const { data: slots, isLoading: slotsLoading } = trpc.publicBooking.getAvailableSlots.useQuery(
    {
      profileId,
      date: selectedDate ?? "",
      meetingTypeId: selectedType?.id ?? 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    { enabled: !!selectedDate && !!selectedType?.id },
  );

  const bookMeeting = trpc.publicBooking.bookMeeting.useMutation({
    onSuccess: (data) => {
      setBooked(data);
      setStep("confirmed");
    },
    onError: (e) => toast.error(e.message || "Booking failed. Please try again."),
  });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);

  // Whether any slot on the current date uses live Google Calendar data
  const calendarConnected = slots?.some((s: Slot) => s.calendarConnected) ?? false;

  const handleDateClick = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (dateStr < todayStr) return;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setStep("pick-time");
  };

  const handleBook = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (!gdprConsent) {
      toast.error("Please accept the privacy policy to continue");
      return;
    }
    if (!selectedSlot) return;
    bookMeeting.mutate({
      profileId,
      meetingTypeId: selectedType.id,
      startTime: selectedSlot.startTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      guestName: form.name,
      guestEmail: form.email,
      guestPhone: form.phone || undefined,
      guestNotes: form.notes || undefined,
    });
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading booking page…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Booking Page Not Found</h2>
            <p className="text-muted-foreground">This booking link is invalid or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Confirmed ────────────────────────────────────────────────────────────────
  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're booked!</h2>
            <p className="text-muted-foreground mb-6">
              A confirmation will be sent to <strong>{form.email}</strong>
            </p>
            <div className="bg-muted/30 rounded-lg p-4 text-left space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{selectedDate}</span>
              </div>
              {selectedSlot && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>
                    {new Date(selectedSlot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" "}· {selectedType?.durationMinutes}min
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-primary" />
                <span>{profile.displayName}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your data is handled in accordance with our privacy policy. You may request deletion at any time.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main booking UI ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Host info */}
        <div className="text-center mb-8">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-primary">
              {profile.displayName?.charAt(0) ?? "?"}
            </div>
          )}
          <h1 className="text-2xl font-bold">{profile.displayName}</h1>
          {profile.bio && (
            <p className="text-muted-foreground mt-1 max-w-md mx-auto text-sm">{profile.bio}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Column 1: Meeting types ─────────────────────────────────────── */}
          <div className="space-y-3">
            <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
              Select Meeting Type
            </h2>
            {(profile.meetingTypes ?? []).map((mt: any) => (
              <Card
                key={mt.id}
                className={`cursor-pointer transition-all border-2 ${
                  selectedType?.id === mt.id
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-primary/50"
                }`}
                onClick={() => {
                  setSelectedType(mt);
                  setStep("pick-date");
                  setSelectedDate(null);
                  setSelectedSlot(null);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{mt.name}</p>
                      {mt.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{mt.description}</p>
                      )}
                    </div>
                    <Badge className="bg-primary/10 text-primary text-xs ml-2 shrink-0">
                      {mt.durationMinutes}m
                    </Badge>
                  </div>
                  {mt.location && (
                    <p className="text-xs text-muted-foreground mt-2">📍 {mt.location}</p>
                  )}
                </CardContent>
              </Card>
            ))}
            {(!profile.meetingTypes || profile.meetingTypes.length === 0) && (
              <p className="text-sm text-muted-foreground">No meeting types available.</p>
            )}
          </div>

          {/* ── Column 2: Calendar ─────────────────────────────────────────── */}
          {selectedType && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                      else setCalMonth(m => m - 1);
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <CardTitle className="text-sm">{MONTHS[calMonth]} {calYear}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                      else setCalMonth(m => m + 1);
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {DAYS.map(d => (
                    <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isPast = dateStr < todayStr;
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === todayStr;
                    return (
                      <button
                        key={day}
                        disabled={isPast}
                        onClick={() => handleDateClick(day)}
                        className={[
                          "h-8 w-full rounded text-sm transition-colors",
                          isPast ? "text-muted-foreground/30 cursor-not-allowed" : "hover:bg-primary/20 cursor-pointer",
                          isSelected ? "bg-primary text-primary-foreground font-bold" : "",
                          isToday && !isSelected ? "border border-primary/50 font-medium" : "",
                        ].join(" ")}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Column 3: Time slots or details form ───────────────────────── */}
          {selectedDate && (
            <div className="space-y-3">

              {step === "pick-time" && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                      Available Times
                    </h2>
                    {/* Live availability badge */}
                    {!slotsLoading && (
                      <Badge
                        variant="outline"
                        className={`text-xs flex items-center gap-1 ${
                          calendarConnected
                            ? "border-green-500/50 text-green-400"
                            : "border-muted text-muted-foreground"
                        }`}
                      >
                        {calendarConnected ? (
                          <><Wifi className="w-3 h-3" /> Live</>
                        ) : (
                          <><WifiOff className="w-3 h-3" /> Static</>
                        )}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "long", month: "short", day: "numeric",
                    })}
                  </p>

                  {slotsLoading ? (
                    <div className="text-sm text-muted-foreground animate-pulse">Loading slots…</div>
                  ) : !slots?.length ? (
                    <p className="text-sm text-muted-foreground">
                      No availability on this date. Please pick another day.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {(slots as Slot[]).filter(s => s.available).map((slot) => (
                        <Button
                          key={slot.startTime}
                          variant={selectedSlot?.startTime === slot.startTime ? "default" : "outline"}
                          className="w-full justify-center"
                          onClick={() => { setSelectedSlot(slot); setStep("details"); }}
                        >
                          {new Date(slot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Button>
                      ))}
                      {(slots as Slot[]).filter(s => s.available).length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          All slots are taken on this date. Please pick another day.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {step === "details" && selectedSlot && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Your Details</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedSlot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" "}· {selectedType?.durationMinutes}min
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Full Name *</Label>
                      <Input
                        placeholder="Jane Smith"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email *</Label>
                      <Input
                        type="email"
                        placeholder="jane@company.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone</Label>
                      <Input
                        placeholder="+1 555 000 0000"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Notes (optional)</Label>
                      <Textarea
                        placeholder="Anything you'd like to discuss…"
                        value={form.notes}
                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        rows={2}
                      />
                    </div>

                    {/* ── GDPR Consent Banner ─────────────────────────────── */}
                    <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          By booking this meeting, your name, email address, and any notes you provide
                          will be stored to confirm your appointment and create a contact record.
                          Your data is processed in accordance with applicable privacy laws (including
                          GDPR where applicable). You may request deletion of your data at any time by
                          contacting the host.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="gdpr-consent"
                          checked={gdprConsent}
                          onCheckedChange={(v) => setGdprConsent(!!v)}
                        />
                        <label
                          htmlFor="gdpr-consent"
                          className="text-xs cursor-pointer select-none"
                        >
                          I agree to the processing of my personal data for this booking.
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStep("pick-time")}
                      >
                        Back
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleBook}
                        disabled={bookMeeting.isPending || !gdprConsent}
                      >
                        {bookMeeting.isPending ? "Booking…" : "Confirm Booking"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-muted-foreground/50">
          Powered by AXIOM CRM · Your data is handled securely and never sold to third parties.
        </div>
      </div>
    </div>
  );
}
