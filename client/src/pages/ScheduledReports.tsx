import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarClock, Plus, Trash2, Mail, BarChart3, FileText, TrendingUp, Play } from "lucide-react";
import { toast } from "sonner";

const REPORT_TYPES = [
  { value: "pipeline_summary", label: "Pipeline Summary", icon: BarChart3 },
  { value: "deal_activity", label: "Deal Activity Report", icon: TrendingUp },
  { value: "team_performance", label: "Team Performance", icon: FileText },
  { value: "revenue_forecast", label: "Revenue Forecast", icon: TrendingUp },
  { value: "lead_conversion", label: "Lead Conversion", icon: BarChart3 },
];

export default function ScheduledReports() {
  const { data: reports, isLoading } = trpc.scheduledReports.list.useQuery();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    reportName: "",
    reportType: "pipeline_summary",
    frequency: "weekly" as "daily" | "weekly" | "monthly",
    recipients: "",
    format: "pdf" as "pdf" | "csv" | "both",
    dayOfWeek: 1,
    dayOfMonth: 1,
  });

  const create = trpc.scheduledReports.create.useMutation({
    onSuccess: () => {
      toast.success("Scheduled report created");
      utils.scheduledReports.list.invalidate();
      setOpen(false);
      setForm({ reportName: "", reportType: "pipeline_summary", frequency: "weekly", recipients: "", format: "pdf", dayOfWeek: 1, dayOfMonth: 1 });
    },
    onError: (e) => toast.error(e.message),
  });

  const toggle = trpc.scheduledReports.update.useMutation({
    onSuccess: () => utils.scheduledReports.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const remove = trpc.scheduledReports.delete.useMutation({
    onSuccess: () => {
      toast.success("Report deleted");
      utils.scheduledReports.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const runNow = trpc.scheduledReports.runNow.useMutation({
    onSuccess: (data) => toast.success(data.message),
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.reportName.trim()) return toast.error("Report name is required");
    if (!form.recipients.trim()) return toast.error("At least one recipient email is required");
    create.mutate({
      reportName: form.reportName,
      reportConfig: { type: form.reportType },
      frequency: form.frequency,
      recipients: form.recipients.split(",").map((e) => e.trim()).filter(Boolean),
      format: form.format,
      dayOfWeek: form.frequency === "weekly" ? form.dayOfWeek : undefined,
      dayOfMonth: form.frequency === "monthly" ? form.dayOfMonth : undefined,
    });
  };

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-blue-500" />
              Scheduled Reports
            </h1>
            <p className="text-muted-foreground mt-1">Automatically deliver reports to your inbox on a schedule</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Scheduled Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Scheduled Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Report Name</Label>
                  <Input
                    placeholder="e.g. Weekly Pipeline Review"
                    value={form.reportName}
                    onChange={(e) => setForm((f) => ({ ...f, reportName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={form.reportType} onValueChange={(v) => setForm((f) => ({ ...f, reportType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={(v) => setForm((f) => ({ ...f, frequency: v as "daily" | "weekly" | "monthly" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.frequency === "weekly" && (
                  <div className="space-y-2">
                    <Label>Day of Week</Label>
                    <Select value={String(form.dayOfWeek)} onValueChange={(v) => setForm((f) => ({ ...f, dayOfWeek: Number(v) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {form.frequency === "monthly" && (
                  <div className="space-y-2">
                    <Label>Day of Month</Label>
                    <Input type="number" min={1} max={28} value={form.dayOfMonth} onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: Number(e.target.value) }))} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Delivery Format</Label>
                  <Select value={form.format} onValueChange={(v) => setForm((f) => ({ ...f, format: v as "pdf" | "csv" | "both" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="csv">CSV Data Export</SelectItem>
                      <SelectItem value="both">Both PDF + CSV</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">PDF is formatted for reading; CSV is for data analysis in Excel.</p>
                </div>
                <div className="space-y-2">
                  <Label>Recipient Emails</Label>
                  <Input
                    placeholder="email1@company.com, email2@company.com"
                    value={form.recipients}
                    onChange={(e) => setForm((f) => ({ ...f, recipients: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
                </div>
                <Button onClick={handleCreate} disabled={create.isPending} className="w-full bg-blue-600 hover:bg-blue-700">
                  {create.isPending ? "Creating..." : "Create Report"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-20 bg-muted/30 rounded-xl" />
              </Card>
            ))}
          </div>
        ) : !reports?.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarClock className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No scheduled reports yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm">Create your first scheduled report to automatically receive CRM insights in your inbox.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => {
              const rt = REPORT_TYPES.find((t) => t.value === (r.reportConfig as { type?: string })?.type);
              const Icon = rt?.icon ?? BarChart3;
              return (
                <Card key={r.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{r.reportName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs capitalize">{r.frequency}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {Array.isArray(r.recipients) ? (r.recipients as string[]).length : 0} recipient{(Array.isArray(r.recipients) ? (r.recipients as string[]).length : 0) !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{r.isActive ? "Active" : "Paused"}</span>
                        <Switch
                          checked={r.isActive ?? false}
                          onCheckedChange={(checked) => toggle.mutate({ id: r.id, isActive: checked })}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-1.5"
                        onClick={() => runNow.mutate({ id: r.id })}
                        disabled={runNow.isPending}
                        title="Send this report immediately"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Run Now
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove.mutate({ id: r.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
  );
}
