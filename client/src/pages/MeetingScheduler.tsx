import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar, Clock, Link, Plus, Copy, Users, Video, Phone, MapPin, Trash2, CheckCircle, Zap, AlertCircle, RefreshCw } from "lucide-react";
import { useSkin } from "@/contexts/SkinContext";

const MEETING_ICONS: Record<string, React.ElementType> = {
  video: Video,
  phone: Phone,
  in_person: MapPin,
};

export default function MeetingScheduler() {
  const { t } = useSkin();
  const [showCreateType, setShowCreateType] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    durationMinutes: "30",
    locationType: "video",
    locationDetails: "",
    bufferMinutes: "10",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const { data: profileData, refetch } = trpc.scheduler.getProfile.useQuery();
  const meetingTypes = profileData?.meetingTypes ?? [];
  const { data: bookings = [] } = trpc.scheduler.getBookings.useQuery({});

  // Google Calendar connection status
  const { data: calendarStatus, refetch: refetchCalendarStatus } = trpc.googleCalendarOAuth.getConnectionStatus.useQuery();

  const { data: googleAuthUrlData } = trpc.googleCalendarOAuth.getAuthUrl.useQuery({ origin: window.location.origin });
  const handleConnectGoogle = () => {
    if (googleAuthUrlData?.configured && googleAuthUrlData?.url) {
      window.location.href = googleAuthUrlData.url;
    } else {
      toast.error("Google Calendar credentials not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Settings → Secrets.");
    }
  };

  const disconnectCalendarMutation = trpc.googleCalendarOAuth.disconnectGoogle.useMutation({
    onSuccess: () => { toast.success("Google Calendar disconnected."); refetchCalendarStatus(); },
    onError: () => toast.error("Failed to disconnect."),
  });

  // Handle OAuth callback query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendarConnected") === "1") {
      toast.success("Google Calendar connected! Your booking page now shows real availability.");
      window.history.replaceState({}, "", window.location.pathname);
      refetchCalendarStatus();
    } else if (params.get("calendarError")) {
      const errMap: Record<string, string> = {
        not_configured: "Google Calendar credentials are not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Settings → Secrets.",
        token_exchange_failed: "Google Calendar connection failed. Please try again.",
        server_error: "An unexpected error occurred. Please try again.",
      };
      const errMsg = errMap[params.get("calendarError")!] ?? "Google Calendar connection failed.";
      toast.error(errMsg);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const createTypeMutation = trpc.scheduler.addMeetingType.useMutation();

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await createTypeMutation.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        durationMinutes: parseInt(form.durationMinutes),
        location: form.locationType || undefined,
      });
      toast.success("Meeting type created");
      setShowCreateType(false);
      setForm({ name: "", description: "", durationMinutes: "30", locationType: "video", locationDetails: "", bufferMinutes: "10", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      refetch();
    } catch { toast.error("Create failed"); }
  };

  const deleteTypeMutation = trpc.scheduler.deleteType.useMutation({
    onSuccess: () => { toast.success("Meeting type deleted"); refetch(); },
    onError: () => toast.error("Delete failed"),
  });

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`Delete meeting type "${name}"?`)) return;
    deleteTypeMutation.mutate({ id });
  };

  const copyBookingLink = (slug: string) => {
    const link = `${window.location.origin}/book/${profileData?.id ?? "me"}/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Booking link copied to clipboard");
  };

  return (
    <>

      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Google Calendar Connection Banner */}
        <Card className={`border ${calendarStatus?.connected ? "border-green-200 bg-green-50/50" : "border-amber-200 bg-amber-50/50"}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {calendarStatus?.connected ? (
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {calendarStatus?.connected ? "Google Calendar Connected" : "Connect Google Calendar"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {calendarStatus?.connected
                      ? `Live availability from ${(calendarStatus as { calendarId?: string }).calendarId ?? "your calendar"} — guests only see real open slots`
                      : "Connect to show real free/busy availability on your booking page instead of static slots"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {calendarStatus?.connected ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5"
                      onClick={() => refetchCalendarStatus()}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => disconnectCalendarMutation.mutate()}
                      disabled={disconnectCalendarMutation.isPending}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                    onClick={handleConnectGoogle}
                  >
                    <Zap className="h-3.5 w-3.5 text-blue-500" />
                    Connect Google Calendar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Meeting Scheduler</h1>
            <p className="text-muted-foreground mt-1">Built-in Calendly — share booking links, let prospects schedule themselves</p>
          </div>
          <Button onClick={() => setShowCreateType(true)}>
            <Plus className="h-4 w-4 mr-2" />New Meeting Type
          </Button>
        </div>

        {/* Booking Page Link */}
        {profileData && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Link className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="font-semibold">Your Booking Page</div>
                  <code className="text-sm text-muted-foreground">{window.location.origin}/book/{profileData.id}</code>
                </div>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/book/${profileData.id}`); toast.success("Copied!"); }}>
                  <Copy className="h-3 w-3 mr-1" />Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="types">
          <TabsList>
            <TabsTrigger value="types">Meeting Types ({meetingTypes.length})</TabsTrigger>
            <TabsTrigger value="bookings">Upcoming Bookings ({bookings.filter(b => b.status === "confirmed").length})</TabsTrigger>
          </TabsList>

          <TabsContent value="types" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetingTypes.map(mt => {
                const Icon = MEETING_ICONS[mt.location ?? ""] ?? Video;
                return (
                  <Card key={mt.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{mt.name}</CardTitle>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                              <Clock className="h-3 w-3" />{mt.durationMinutes} min
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize text-xs">{(mt.location ?? "video").replace("_", " ")}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {mt.description && <p className="text-sm text-muted-foreground mb-3">{mt.description}</p>}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => copyBookingLink(String(mt.id))}>
                          <Copy className="h-3 w-3 mr-1" />Copy Link
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(mt.id, mt.name)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              <Card className="border-dashed cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors" onClick={() => setShowCreateType(true)}>
                <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Plus className="h-8 w-8 mb-2 opacity-40" />
                  <span className="text-sm">Add Meeting Type</span>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="mt-4 space-y-3">
            {bookings.map(booking => (
              <Card key={booking.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{booking.guestName}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(booking.startTime).toLocaleString()} · {Math.round((booking.endTime - booking.startTime) / 60000)} min
                        </div>
                        {booking.guestEmail && <div className="text-xs text-muted-foreground">{booking.guestEmail}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={booking.status === "confirmed" ? "default" : "secondary"} className={booking.status === "confirmed" ? "bg-green-500" : ""}>
                        {booking.status === "confirmed" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {booking.status}
                      </Badge>
                      {booking.calendarEventId && (
                        <Badge variant="outline" className="text-xs">
                          <Video className="h-3 w-3 mr-1" />Synced
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {bookings.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No bookings yet</p>
                <p className="text-sm mt-1">Share your booking links to start receiving meetings</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Meeting Type Dialog */}
      <Dialog open={showCreateType} onOpenChange={setShowCreateType}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Meeting Type</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 30-Minute Discovery Call" className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What will you discuss?" className="mt-1" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duration (minutes)</Label>
                <Select value={form.durationMinutes} onValueChange={v => setForm(f => ({ ...f, durationMinutes: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["15", "20", "30", "45", "60", "90", "120"].map(d => <SelectItem key={d} value={d}>{d} min</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Buffer (minutes)</Label>
                <Select value={form.bufferMinutes} onValueChange={v => setForm(f => ({ ...f, bufferMinutes: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["0", "5", "10", "15", "30"].map(d => <SelectItem key={d} value={d}>{d} min</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Meeting Type</Label>
              <Select value={form.locationType} onValueChange={v => setForm(f => ({ ...f, locationType: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video Call</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="in_person">In Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.locationType !== "phone" && (
              <div>
                <Label>Location / Link</Label>
                <Input value={form.locationDetails} onChange={e => setForm(f => ({ ...f, locationDetails: e.target.value }))} placeholder={form.locationType === "video" ? "Zoom/Meet link" : "Address"} className="mt-1" />
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreateType(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name.trim() || createTypeMutation.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  
    </>);
}
