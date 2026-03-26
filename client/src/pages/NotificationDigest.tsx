import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, Smartphone, Clock, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIMES = ["06:00", "07:00", "08:00", "09:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

export default function NotificationDigest() {
  const { data: prefs, isLoading } = trpc.notificationPrefs.get.useQuery();
  const utils = trpc.useUtils();
  const upsert = trpc.notificationPrefs.upsert.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences saved");
      utils.notificationPrefs.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    digestEnabled: false,
    digestFrequency: "daily" as "daily" | "weekly",
    digestTime: "08:00",
    digestDayOfWeek: 1,
    notifyDealAtRisk: true,
    notifyFollowUpDue: true,
    notifyNewLead: true,
    notifyTaskOverdue: true,
    notifyDealWon: true,
    notifyMeetingReminder: true,
    notifyRevenueAlert: false,
    pushEnabled: false,
    emailEnabled: true,
    inAppEnabled: true,
  });

  useEffect(() => {
    if (prefs) {
      setForm({
        digestEnabled: prefs.digestEnabled ?? false,
        digestFrequency: (prefs.digestFrequency as "daily" | "weekly") ?? "daily",
        digestTime: prefs.digestTime ?? "08:00",
        digestDayOfWeek: prefs.digestDayOfWeek ?? 1,
        notifyDealAtRisk: prefs.notifyDealAtRisk ?? true,
        notifyFollowUpDue: prefs.notifyFollowUpDue ?? true,
        notifyNewLead: prefs.notifyNewLead ?? true,
        notifyTaskOverdue: prefs.notifyTaskOverdue ?? true,
        notifyDealWon: prefs.notifyDealWon ?? true,
        notifyMeetingReminder: prefs.notifyMeetingReminder ?? true,
        notifyRevenueAlert: prefs.notifyRevenueAlert ?? false,
        pushEnabled: prefs.pushEnabled ?? false,
        emailEnabled: prefs.emailEnabled ?? true,
        inAppEnabled: prefs.inAppEnabled ?? true,
      });
    }
  }, [prefs]);

  const toggle = (key: keyof typeof form) => {
    setForm((f) => ({ ...f, [key]: !f[key] }));
  };

  const handleSave = () => {
    upsert.mutate(form);
  };

  const notificationTypes = [
    { key: "notifyDealAtRisk" as const, label: "Deal at Risk", desc: "When a deal hasn't been updated in 7+ days" },
    { key: "notifyFollowUpDue" as const, label: "Follow-up Due", desc: "When a scheduled follow-up is overdue" },
    { key: "notifyNewLead" as const, label: "New Lead Assigned", desc: "When a new lead is assigned to you" },
    { key: "notifyTaskOverdue" as const, label: "Task Overdue", desc: "When a task passes its due date" },
    { key: "notifyDealWon" as const, label: "Deal Won", desc: "When any deal in your pipeline is won" },
    { key: "notifyMeetingReminder" as const, label: "Meeting Reminder", desc: "15 minutes before a scheduled meeting" },
    { key: "notifyRevenueAlert" as const, label: "Revenue Alert", desc: "When monthly revenue drops below target" },
  ];

  return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-500" />
              Notification Preferences
            </h1>
            <p className="text-muted-foreground mt-1">Control how and when AXIOM notifies you</p>
          </div>
          <Button onClick={handleSave} disabled={upsert.isPending} className="bg-blue-600 hover:bg-blue-700">
            {upsert.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>

        {/* Delivery Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery Channels</CardTitle>
            <CardDescription>Choose how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">In-App Notifications</p>
                  <p className="text-xs text-muted-foreground">Bell icon in the top navigation</p>
                </div>
              </div>
              <Switch checked={form.inAppEnabled} onCheckedChange={() => toggle("inAppEnabled")} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Sent to your registered email address</p>
                </div>
              </div>
              <Switch checked={form.emailEnabled} onCheckedChange={() => toggle("emailEnabled")} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Browser push notifications (requires permission)</p>
                </div>
              </div>
              <Switch checked={form.pushEnabled} onCheckedChange={() => toggle("pushEnabled")} />
            </div>
          </CardContent>
        </Card>

        {/* Digest Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Email Digest
                </CardTitle>
                <CardDescription>Receive a summary email instead of individual notifications</CardDescription>
              </div>
              <Switch checked={form.digestEnabled} onCheckedChange={() => toggle("digestEnabled")} />
            </div>
          </CardHeader>
          {form.digestEnabled && (
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Frequency</Label>
                  <Select
                    value={form.digestFrequency}
                    onValueChange={(v) => setForm((f) => ({ ...f, digestFrequency: v as "daily" | "weekly" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Delivery Time</Label>
                  <Select
                    value={form.digestTime}
                    onValueChange={(v) => setForm((f) => ({ ...f, digestTime: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.digestFrequency === "weekly" && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Day of Week</Label>
                  <Select
                    value={String(form.digestDayOfWeek)}
                    onValueChange={(v) => setForm((f) => ({ ...f, digestDayOfWeek: Number(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d, i) => (
                        <SelectItem key={d} value={String(i)}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 flex items-start gap-2">
                <Calendar className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {form.digestFrequency === "daily"
                    ? `You'll receive a daily summary at ${form.digestTime} with all your notifications from the past 24 hours.`
                    : `You'll receive a weekly summary every ${DAYS[form.digestDayOfWeek]} at ${form.digestTime}.`}
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notification Types</CardTitle>
            <CardDescription>Choose which events trigger notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notificationTypes.map((n, i) => (
              <div key={n.key}>
                {i > 0 && <Separator className="mb-3" />}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{n.label}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {form[n.key] && <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3 mr-1" />On</Badge>}
                    <Switch checked={form[n.key]} onCheckedChange={() => toggle(n.key)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
  );
}
