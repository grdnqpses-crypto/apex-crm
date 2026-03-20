import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, CheckCircle, XCircle, Plug, Trash2, RefreshCw, Plus, Clock } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSkin } from "@/contexts/SkinContext";

const PROVIDERS = [
  { key: "google", label: "Google Calendar", logo: "🗓️", description: "Sync meetings and events from Google Calendar" },
  { key: "outlook", label: "Outlook / Microsoft 365", logo: "📅", description: "Sync with Outlook Calendar and Teams meetings" },
  { key: "apple", label: "Apple Calendar", logo: "🍎", description: "Sync with iCloud Calendar via CalDAV" },
  { key: "caldav", label: "CalDAV", logo: "📆", description: "Connect any CalDAV-compatible calendar" },
];

export default function CalendarSync() {
  const { t } = useSkin();
  const [showConnect, setShowConnect] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("google");
  const [calendarUrl, setCalendarUrl] = useState("");
  const [syncDirection, setSyncDirection] = useState<"two_way" | "apex_to_calendar" | "calendar_to_apex">("two_way");

  const { data: connections = [], refetch } = trpc.calendar.listConnections.useQuery();
  const { data: events = [] } = trpc.calendar.listEvents.useQuery({ limit: 20 });
  const connectMutation = trpc.calendar.connect.useMutation();
  const disconnectMutation = trpc.calendar.disconnect.useMutation({ onSuccess: () => refetch() });
  const syncMutation = trpc.calendar.sync.useMutation();

  const handleConnect = async () => {
    try {
      await connectMutation.mutateAsync({ provider: selectedProvider as any, calendarUrl: calendarUrl || undefined, syncDirection });
      toast.success(`${PROVIDERS.find(p => p.key === selectedProvider)?.label} connected`);
      setShowConnect(false);
      setCalendarUrl("");
      refetch();
    } catch { toast.error("Connection failed"); }
  };

  const handleDisconnect = async (id: number, label: string) => {
    try {
      await disconnectMutation.mutateAsync({ id });
      toast.success(`${label} disconnected`);
    } catch { toast.error("Disconnect failed"); }
  };

  const handleSync = async (id: number) => {
    try {
      const result = await syncMutation.mutateAsync({ connectionId: id });
      toast.success(`Synced ${result.synced} events`);
      refetch();
    } catch { toast.error("Sync failed"); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Calendar Sync</h1>
            <p className="text-muted-foreground mt-1">Two-way sync with Google Calendar, Outlook, and more</p>
          </div>
          <Button onClick={() => setShowConnect(true)}>
            <Plus className="h-4 w-4 mr-2" />Connect Calendar
          </Button>
        </div>

        {/* Connected Calendars */}
        {connections.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Connected Calendars</h2>
            {connections.map(conn => {
              const provider = PROVIDERS.find(p => p.key === conn.provider);
              return (
                <Card key={conn.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{provider?.logo ?? "📅"}</span>
                        <div>
                          <div className="font-semibold">{provider?.label ?? conn.provider}</div>
                          <div className="text-sm text-muted-foreground">
                            {conn.syncEnabled ? "Sync enabled" : "Sync paused"}
                            {conn.lastSyncAt && ` · Last synced ${new Date(conn.lastSyncAt).toLocaleString()}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className={conn.syncEnabled ? "bg-green-500" : "bg-yellow-500"}>
                          {conn.syncEnabled ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                          {conn.syncEnabled ? "connected" : "paused"}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleSync(conn.id)} disabled={syncMutation.isPending}>
                          <RefreshCw className="h-3 w-3 mr-1" />Sync Now
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDisconnect(conn.id, provider?.label ?? conn.provider)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Available Providers */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Available Calendars</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PROVIDERS.map(p => {
              const isConnected = connections.some(c => c.provider === p.key);
              return (
                <Card key={p.key} className={isConnected ? "border-green-300 dark:border-green-700" : ""}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.logo}</span>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          {p.label}
                          {isConnected && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                        <div className="text-sm text-muted-foreground">{p.description}</div>
                      </div>
                      {!isConnected && (
                        <Button size="sm" variant="outline" onClick={() => { setSelectedProvider(p.key); setShowConnect(true); }}>
                          <Plug className="h-3 w-3 mr-1" />Connect
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        {events.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Upcoming Synced Events</h2>
            <div className="space-y-2">
              {events.map((event: any) => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{event.subject || "Meeting"}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(event.occurredAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {connections.length === 0 && events.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium text-lg">No calendars connected</p>
            <p className="text-sm mt-2">Connect your calendar to sync meetings and events with your CRM contacts</p>
            <Button className="mt-4" onClick={() => setShowConnect(true)}>
              <Plus className="h-4 w-4 mr-2" />Connect Your First Calendar
            </Button>
          </div>
        )}
      </div>

      {/* Connect Dialog */}
      <Dialog open={showConnect} onOpenChange={setShowConnect}>
        <DialogContent>
          <DialogHeader><DialogTitle>Connect Calendar</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Calendar Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map(p => <SelectItem key={p.key} value={p.key}>{p.logo} {p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {(selectedProvider === "caldav" || selectedProvider === "apple") && (
              <div>
                <Label>CalDAV URL</Label>
                <Input value={calendarUrl} onChange={e => setCalendarUrl(e.target.value)} placeholder="https://caldav.example.com/..." className="mt-1" />
              </div>
            )}
            <div>
              <Label>Sync Direction</Label>
              <Select value={syncDirection} onValueChange={v => setSyncDirection(v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="two_way">Two-way (recommended)</SelectItem>
                  <SelectItem value="apex_to_calendar">Apex → Calendar only</SelectItem>
                  <SelectItem value="calendar_to_apex">Calendar → Apex only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowConnect(false)}>Cancel</Button>
            <Button onClick={handleConnect} disabled={connectMutation.isPending}>
              <Plug className="h-4 w-4 mr-1" />Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
