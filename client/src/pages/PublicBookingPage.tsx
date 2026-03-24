import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2, User, Mail, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function PublicBookingPage() {
  const [, params] = useRoute("/book/:profileId");
  const profileId = params?.profileId ? parseInt(params.profileId) : 0;

  const [step, setStep] = useState<"pick-type" | "pick-date" | "pick-time" | "details" | "confirmed">("pick-type");
  const [selectedType, setSelectedType] = useState<any>(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [booked, setBooked] = useState<any>(null);

  const { data: profile, isLoading: profileLoading } = trpc.publicBooking.getProfile.useQuery(
    { profileId },
    { enabled: profileId > 0 }
  );
  const { data: slots, isLoading: slotsLoading } = trpc.publicBooking.getAvailableSlots.useQuery(
    { profileId, date: selectedDate ?? "", meetingTypeId: selectedType?.id },
    { enabled: !!selectedDate && !!selectedType }
  );

  const bookMeeting = trpc.publicBooking.bookSlot.useMutation({
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

  const handleDateClick = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (dateStr < todayStr) return;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setStep("pick-time");
  };

  const handleBook = () => {
    if (!form.name || !form.email) { toast.error("Name and email are required"); return; }
    bookMeeting.mutate({
      profileId,
      meetingTypeId: selectedType.id,
      startTime: selectedSlot!,
      guestName: form.name,
      guestEmail: form.email,
      guestPhone: form.phone,
      notes: form.notes,
    });
  };

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

  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're booked!</h2>
            <p className="text-muted-foreground mb-6">A confirmation has been sent to {form.email}</p>
            <div className="bg-muted/30 rounded-lg p-4 text-left space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{selectedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span>{selectedSlot ? new Date(selectedSlot).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-primary" />
                <span>{profile.name}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Add to your calendar using the link in your confirmation email.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Host info */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-primary">
            {profile.name?.charAt(0) ?? "?"}
          </div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          {profile.bio && <p className="text-muted-foreground mt-1 max-w-md mx-auto">{profile.bio}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: meeting types */}
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Select Meeting Type</h2>
            {(profile.meetingTypes ?? []).map((mt: any) => (
              <Card
                key={mt.id}
                className={`cursor-pointer transition-all border-2 ${selectedType?.id === mt.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"}`}
                onClick={() => { setSelectedType(mt); setStep("pick-date"); setSelectedDate(null); setSelectedSlot(null); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{mt.name}</p>
                      {mt.description && <p className="text-xs text-muted-foreground mt-0.5">{mt.description}</p>}
                    </div>
                    <Badge className="bg-primary/10 text-primary text-xs ml-2 shrink-0">{mt.duration}m</Badge>
                  </div>
                  {mt.location && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">📍 {mt.location}</p>}
                </CardContent>
              </Card>
            ))}
            {(!profile.meetingTypes || profile.meetingTypes.length === 0) && (
              <p className="text-sm text-muted-foreground">No meeting types available.</p>
            )}
          </div>

          {/* Middle: calendar */}
          {selectedType && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                    else setCalMonth(m => m - 1);
                  }}><ChevronLeft className="w-4 h-4" /></Button>
                  <CardTitle className="text-sm">{MONTHS[calMonth]} {calYear}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                    else setCalMonth(m => m + 1);
                  }}><ChevronRight className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {DAYS.map(d => <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>)}
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
                        className={`
                          h-8 w-full rounded text-sm transition-colors
                          ${isPast ? "text-muted-foreground/30 cursor-not-allowed" : "hover:bg-primary/20 cursor-pointer"}
                          ${isSelected ? "bg-primary text-primary-foreground font-bold" : ""}
                          ${isToday && !isSelected ? "border border-primary/50 font-medium" : ""}
                        `}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Right: time slots or form */}
          {selectedDate && (
            <div className="space-y-3">
              {step === "pick-time" && (
                <>
                  <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Available Times — {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </h2>
                  {slotsLoading ? (
                    <div className="text-sm text-muted-foreground animate-pulse">Loading slots…</div>
                  ) : !slots?.length ? (
                    <p className="text-sm text-muted-foreground">No availability on this date. Please pick another day.</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {slots.map((slot: string) => (
                        <Button
                          key={slot}
                          variant={selectedSlot === slot ? "default" : "outline"}
                          className="w-full justify-center"
                          onClick={() => { setSelectedSlot(slot); setStep("details"); }}
                        >
                          {new Date(slot).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {step === "details" && selectedSlot && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Your Details</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} at{" "}
                      {new Date(selectedSlot).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" "}· {selectedType.duration}min
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Full Name *</Label>
                      <Input placeholder="Jane Smith" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email *</Label>
                      <Input type="email" placeholder="jane@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Phone</Label>
                      <Input placeholder="+1 555 000 0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Notes (optional)</Label>
                      <Textarea placeholder="Anything you'd like to discuss…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => setStep("pick-time")}>Back</Button>
                      <Button className="flex-1" onClick={handleBook} disabled={bookMeeting.isPending}>
                        {bookMeeting.isPending ? "Booking…" : "Confirm Booking"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
