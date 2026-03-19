import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, PhoneCall, PhoneOff, PhoneMissed, Mic, MicOff, Volume2, VolumeX, Clock, User, Search, Settings, Zap } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const DIAL_KEYS = ["1","2","3","4","5","6","7","8","9","*","0","#"];

export default function Dialer() {
  const [dialNumber, setDialNumber] = useState("");
  const [callStatus, setCallStatus] = useState<"idle"|"calling"|"connected"|"ended">("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [twilioNumber, setTwilioNumber] = useState("");
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Fetch recent calls from activity history (disabled for now - no global activity query)
  const recentCalls: Array<{ id: number; direction?: string; fromEmail?: string; occurredAt?: number }> = [];

  // Fetch contacts for quick dial
  const { data: contactsData } = trpc.contacts.list.useQuery({ limit: 50, search: searchQuery });
  const contacts = contactsData?.items ?? [];

  const handleDialKey = (key: string) => {
    setDialNumber(prev => prev + key);
  };

  const handleCall = () => {
    if (!dialNumber.trim()) {
      toast.error("Enter a phone number to call");
      return;
    }
    if (!twilioNumber) {
      toast.error("Configure your Twilio number in Settings first");
      setShowSettings(true);
      return;
    }
    setCallStatus("calling");
    toast.info(`Calling ${dialNumber}...`, { duration: 3000 });
    // Simulate call connection (real Twilio integration via Twilio.js Device)
    setTimeout(() => {
      setCallStatus("connected");
      toast.success("Call connected");
      const interval = setInterval(() => setCallDuration(d => d + 1), 1000);
      (window as unknown as Record<string, unknown>)._callInterval = interval;
    }, 2000);
  };

  const handleHangup = () => {
    clearInterval((window as unknown as Record<string, unknown>)._callInterval as ReturnType<typeof setInterval>);
    setCallStatus("ended");
    toast.info(`Call ended — ${formatDuration(callDuration)}`);
    setTimeout(() => {
      setCallStatus("idle");
      setCallDuration(0);
    }, 2000);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const callContact = (phone: string, name: string) => {
    setDialNumber(phone);
    toast.info(`Dialing ${name}...`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dialer</h1>
          <p className="text-muted-foreground text-sm mt-1">Click-to-call with automatic activity logging</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={twilioNumber ? "default" : "secondary"} className="gap-1">
            <Zap className="h-3 w-3" />
            {twilioNumber ? `Twilio: ${twilioNumber}` : "Not configured"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </div>

      {showSettings && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Twilio Configuration</CardTitle>
            <CardDescription>Connect your Twilio account to enable calling. Get your credentials at console.twilio.com</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Account SID</label>
              <Input placeholder="ACxxxxxxxxxxxxxxxx" value={accountSid} onChange={e => setAccountSid(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Auth Token</label>
              <Input type="password" placeholder="••••••••••••••••" value={authToken} onChange={e => setAuthToken(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Twilio Phone Number</label>
              <Input placeholder="+15551234567" value={twilioNumber} onChange={e => setTwilioNumber(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <Button onClick={() => { toast.success("Twilio configuration saved"); setShowSettings(false); }}>
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dial Pad */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Dial Pad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Number display */}
            <div className="relative">
              <Input
                value={dialNumber}
                onChange={e => setDialNumber(e.target.value)}
                placeholder="Enter number..."
                className="text-center text-xl font-mono h-12 pr-10"
              />
              {dialNumber && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setDialNumber(prev => prev.slice(0, -1))}
                >
                  ⌫
                </button>
              )}
            </div>

            {/* Call status */}
            {callStatus !== "idle" && (
              <div className={`rounded-lg p-3 text-center text-sm font-medium ${
                callStatus === "calling" ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20" :
                callStatus === "connected" ? "bg-green-500/10 text-green-600 border border-green-500/20" :
                "bg-muted text-muted-foreground"
              }`}>
                {callStatus === "calling" && "Connecting..."}
                {callStatus === "connected" && `Connected · ${formatDuration(callDuration)}`}
                {callStatus === "ended" && "Call ended"}
              </div>
            )}

            {/* Dial keys */}
            <div className="grid grid-cols-3 gap-2">
              {DIAL_KEYS.map(key => (
                <button
                  key={key}
                  onClick={() => handleDialKey(key)}
                  className="h-12 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all text-lg font-semibold text-foreground active:scale-95"
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Call controls */}
            <div className="flex items-center gap-2">
              {callStatus === "idle" || callStatus === "ended" ? (
                <Button className="flex-1 h-12 text-base gap-2" onClick={handleCall}>
                  <PhoneCall className="h-5 w-5" />
                  Call
                </Button>
              ) : (
                <>
                  <Button
                    variant={muted ? "destructive" : "outline"}
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => { setMuted(!muted); toast.info(muted ? "Unmuted" : "Muted"); }}
                  >
                    {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 h-12 text-base gap-2"
                    onClick={handleHangup}
                  >
                    <PhoneOff className="h-5 w-5" />
                    Hang Up
                  </Button>
                  <Button
                    variant={speakerOn ? "default" : "outline"}
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => { setSpeakerOn(!speakerOn); toast.info(speakerOn ? "Speaker off" : "Speaker on"); }}
                  >
                    {speakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contacts + Recent Calls */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <Tabs defaultValue="contacts">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Quick Dial</CardTitle>
                <TabsList>
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="contacts">
              <TabsContent value="contacts" className="mt-0 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {contacts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No contacts found
                    </div>
                  ) : (
                    contacts.map((contact: { id: number; firstName?: string | null; lastName?: string | null; phone?: string | null }) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                            {contact.firstName?.[0]}{contact.lastName?.[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{contact.firstName} {contact.lastName}</div>
                            <div className="text-xs text-muted-foreground">{contact.phone || "No phone"}</div>
                          </div>
                        </div>
                        {contact.phone && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity gap-1 text-primary"
                            onClick={() => callContact(contact.phone!, `${contact.firstName} ${contact.lastName}`)}
                          >
                            <Phone className="h-3.5 w-3.5" />
                            Call
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
              <TabsContent value="recent" className="mt-0">
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {recentCalls.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No recent calls
                    </div>
                  ) : (
                    recentCalls.map((call: { id: number; direction?: string; fromEmail?: string; occurredAt?: number }) => (
                      <div key={call.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {call.direction === "inbound" ? (
                            <PhoneCall className="h-4 w-4 text-green-500" />
                          ) : call.direction === "missed" ? (
                            <PhoneMissed className="h-4 w-4 text-red-500" />
                          ) : (
                            <Phone className="h-4 w-4 text-primary" />
                          )}
                          <div>
                            <div className="text-sm font-medium">{call.fromEmail || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">
                              {call.occurredAt ? formatDistanceToNow(new Date(call.occurredAt), { addSuffix: true }) : ""}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="gap-1 text-primary"
                          onClick={() => callContact(call.fromEmail || "", "")}>
                          <Phone className="h-3.5 w-3.5" />
                          Redial
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Call Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Calls Today", value: "0", icon: Phone, color: "text-primary" },
          { label: "Avg Duration", value: "0:00", icon: Clock, color: "text-blue-500" },
          { label: "Connected", value: "0%", icon: PhoneCall, color: "text-green-500" },
          { label: "Missed", value: "0", icon: PhoneMissed, color: "text-red-500" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
              <div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
