import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Save, Building2, Mail, Gauge, Shield, Loader2 } from "lucide-react";
import PageGuide from "@/components/PageGuide";
import { pageGuides } from "@/lib/pageGuides";
import { useSkin } from "@/contexts/SkinContext";


export default function SenderSettings() {
  const { t } = useSkin();
  const settings = trpc.senderSettings.get.useQuery();
  const upsert = trpc.senderSettings.upsert.useMutation({ onSuccess: () => toast.success("Sender settings saved") });

  const [form, setForm] = useState({
    companyName: "", physicalAddress: "", city: "", state: "", zipCode: "", country: "United States",
    defaultFromName: "", defaultReplyTo: "", unsubscribeUrl: "", privacyPolicyUrl: "",
    outlookThrottlePerMinute: 10, gmailThrottlePerMinute: 20, yahooThrottlePerMinute: 15, defaultThrottlePerMinute: 30,
    maxBounceRatePercent: 2, maxComplaintRatePercent: 1,
  });

  useEffect(() => {
    if (settings.data) {
      setForm({
        companyName: settings.data.companyName || "",
        physicalAddress: settings.data.physicalAddress || "",
        city: settings.data.city || "",
        state: settings.data.state || "",
        zipCode: settings.data.zipCode || "",
        country: settings.data.country || "United States",
        defaultFromName: settings.data.defaultFromName || "",
        defaultReplyTo: settings.data.defaultReplyTo || "",
        unsubscribeUrl: settings.data.unsubscribeUrl || "",
        privacyPolicyUrl: settings.data.privacyPolicyUrl || "",
        outlookThrottlePerMinute: settings.data.outlookThrottlePerMinute ?? 10,
        gmailThrottlePerMinute: settings.data.gmailThrottlePerMinute ?? 20,
        yahooThrottlePerMinute: settings.data.yahooThrottlePerMinute ?? 15,
        defaultThrottlePerMinute: settings.data.defaultThrottlePerMinute ?? 30,
        maxBounceRatePercent: settings.data.maxBounceRatePercent ?? 2,
        maxComplaintRatePercent: settings.data.maxComplaintRatePercent ?? 1,
      });
    }
  }, [settings.data]);

  const handleSave = () => upsert.mutate(form);

  return (
    <div className="space-y-6">
      <PageGuide {...pageGuides.senderSettings} />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6" /> Sender Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your sending identity, CAN-SPAM compliance details, and provider-specific throttling</p>
      </div>

      {/* Company Info - CAN-SPAM Required */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Company Information</CardTitle>
          <CardDescription>Required by CAN-SPAM Act §7704 — this physical address appears in every email footer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Company Name *</Label>
            <Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Your Company, LLC" />
          </div>
          <div>
            <Label>Physical Mailing Address *</Label>
            <Input value={form.physicalAddress} onChange={e => setForm(f => ({ ...f, physicalAddress: e.target.value }))} placeholder="123 Main Street, Suite 100" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="State" />
            </div>
            <div>
              <Label>ZIP Code</Label>
              <Input value={form.zipCode} onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))} placeholder="12345" />
            </div>
            <div>
              <Label>Country</Label>
              <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="United States" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Email Defaults</CardTitle>
          <CardDescription>Default sender identity and compliance URLs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Default From Name</Label>
              <Input value={form.defaultFromName} onChange={e => setForm(f => ({ ...f, defaultFromName: e.target.value }))} placeholder="John from REALM" />
            </div>
            <div>
              <Label>Default Reply-To</Label>
              <Input value={form.defaultReplyTo} onChange={e => setForm(f => ({ ...f, defaultReplyTo: e.target.value }))} placeholder="reply@yourdomain.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Unsubscribe URL *</Label>
              <Input value={form.unsubscribeUrl} onChange={e => setForm(f => ({ ...f, unsubscribeUrl: e.target.value }))} placeholder="https://yourdomain.com/unsubscribe" />
              <p className="text-xs text-muted-foreground mt-1">Required by CAN-SPAM. Must be a working URL.</p>
            </div>
            <div>
              <Label>Privacy Policy URL</Label>
              <Input value={form.privacyPolicyUrl} onChange={e => setForm(f => ({ ...f, privacyPolicyUrl: e.target.value }))} placeholder="https://yourdomain.com/privacy" />
              <p className="text-xs text-muted-foreground mt-1">Required by GDPR/CCPA for EU/CA recipients.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Throttling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5" /> Provider-Specific Throttling</CardTitle>
          <CardDescription>Control sending speed per email provider to avoid triggering rate limits. Outlook is the most restrictive.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Outlook (emails/min)</Label>
              <Input type="number" value={form.outlookThrottlePerMinute} onChange={e => setForm(f => ({ ...f, outlookThrottlePerMinute: parseInt(e.target.value) || 0 }))} />
              <p className="text-xs text-muted-foreground mt-1">Recommended: 5-10</p>
            </div>
            <div>
              <Label>Gmail (emails/min)</Label>
              <Input type="number" value={form.gmailThrottlePerMinute} onChange={e => setForm(f => ({ ...f, gmailThrottlePerMinute: parseInt(e.target.value) || 0 }))} />
              <p className="text-xs text-muted-foreground mt-1">Recommended: 15-20</p>
            </div>
            <div>
              <Label>Yahoo (emails/min)</Label>
              <Input type="number" value={form.yahooThrottlePerMinute} onChange={e => setForm(f => ({ ...f, yahooThrottlePerMinute: parseInt(e.target.value) || 0 }))} />
              <p className="text-xs text-muted-foreground mt-1">Recommended: 10-15</p>
            </div>
            <div>
              <Label>Other (emails/min)</Label>
              <Input type="number" value={form.defaultThrottlePerMinute} onChange={e => setForm(f => ({ ...f, defaultThrottlePerMinute: parseInt(e.target.value) || 0 }))} />
              <p className="text-xs text-muted-foreground mt-1">Recommended: 20-30</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Safety Thresholds</CardTitle>
          <CardDescription>Sending is automatically paused when these thresholds are exceeded to protect your domain reputation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Max Bounce Rate (%)</Label>
              <Input type="number" value={form.maxBounceRatePercent} onChange={e => setForm(f => ({ ...f, maxBounceRatePercent: parseInt(e.target.value) || 0 }))} />
              <p className="text-xs text-muted-foreground mt-1">Sending pauses if bounce rate exceeds this. Gmail requires &lt;2%.</p>
            </div>
            <div>
              <Label>Max Complaint Rate (per 1000)</Label>
              <Input type="number" value={form.maxComplaintRatePercent} onChange={e => setForm(f => ({ ...f, maxComplaintRatePercent: parseInt(e.target.value) || 0 }))} />
              <p className="text-xs text-muted-foreground mt-1">Gmail requires &lt;0.10%. Value of 1 = 0.1%.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" onClick={handleSave} disabled={upsert.isPending} className="w-full">
        {upsert.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Sender Settings</>}
      </Button>
    </div>
  );
}
