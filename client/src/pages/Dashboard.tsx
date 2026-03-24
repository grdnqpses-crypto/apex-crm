import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import OnboardingWizard from "@/components/OnboardingWizard";
import {
  Users, Building2, Kanban, DollarSign, Mail, ListChecks,
  TrendingUp, Trophy, Target, Radar, Ghost, Shield,
  FileText, Workflow, LayoutGrid, AlertCircle, Truck,
  Package, Brain, Phone, ArrowRight, Sparkles,
  StickyNote, PhoneCall, MailOpen, Calendar, Clock, User, ImagePlus,
  Upload, Wand2, RefreshCw, ArrowRightLeft, CheckCircle, Activity,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useSkin } from "@/contexts/SkinContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CheckCircle2, Circle, ChevronRight as ChevronRightIcon, Zap, Video, MessageSquare, ClipboardList, RefreshCw as RefreshCwIcon, Building2 as Building2Icon, User as UserIcon, Target as TargetIcon } from "lucide-react";

// ─── Migration Health Widget ─────────────────────────────────────────────────
function MigrationHealthWidget() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: lastSyncData } = trpc.migration.getLastSyncedAt.useQuery(undefined, { enabled: !!user });
  const { data: jobs } = trpc.migration.listJobs.useQuery(undefined, { enabled: isAdmin });

  if (!jobs || jobs.length === 0) return null;

  const completedJobs = jobs.filter((j: any) => j.status === "completed");
  if (completedJobs.length === 0) return null;

  const latestJob = completedJobs[0];
  const totalImported = (latestJob.contactsImported || 0) + (latestJob.companiesImported || 0) +
    (latestJob.dealsImported || 0) + (latestJob.activitiesImported || 0);
  const allTimeTotal = completedJobs.reduce((sum: number, j: any) =>
    sum + (j.contactsImported || 0) + (j.companiesImported || 0) + (j.dealsImported || 0) + (j.activitiesImported || 0), 0);
  const lastSyncedAt = lastSyncData?.lastSyncedAt;

  return (
    <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0">
              <ArrowRightLeft className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Migration Health</p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                Source: {latestJob.sourcePlatform}
              </p>
              {lastSyncedAt && (
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-[10px] text-green-600 font-medium">
                    Last synced {new Date(Number(lastSyncedAt)).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-foreground">{allTimeTotal.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">records imported</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Link href={`/migration/wizard?sync=${latestJob.sourcePlatform}&sinceDate=${lastSyncedAt || ""}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full rounded-xl text-xs font-medium">
              <RefreshCw className="w-3 h-3 mr-1.5" /> Sync Now
            </Button>
          </Link>
          <Link href="/migration">
            <Button size="sm" variant="ghost" className="rounded-xl text-xs">
              <Activity className="w-3 h-3 mr-1.5" /> History
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

/*
 * Enterprise CRM Color System:
 *   Blue   (crm-blue)   = Standard pipeline activity / normal workflow
 *   Green  (crm-green)  = Booked loads / closed-won / completed / success
 *   Amber  (crm-amber)  = Quote pending / follow-up due / needs attention
 *   Red    (crm-red)    = Credit hold / overdue / churn risk / critical
 *   Purple (crm-purple) = Insights / premium / AI-powered features
 *   Gray   (crm-gray)   = Inactive accounts / archived / disabled
 */

function StatCard({ title, value, icon: Icon, subtitle, gradient, iconBg, href }: {
  title: string;
  value: string | number;
  icon: any;
  subtitle?: string;
  gradient: string;
  iconBg: string;
  href?: string;
}) {
  const content = (
    <div className={`group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.03] hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">{title}</span>
          <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {/* Subtle gradient accent at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${gradient} opacity-60`} />
    </div>
  );
  if (href) return <Link href={href} className="block">{content}</Link>;
  return content;
}

function QuickAction({ label, href, icon: Icon, color }: { label: string; href: string; icon: any; color: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-card hover:bg-accent/40 transition-all duration-200 hover:shadow-sm"
    >
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color} transition-transform duration-200 group-hover:scale-105`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

const ACTIVITY_CONFIG: Record<string, { icon: any; bg: string; text: string; label: string }> = {
  note: { icon: StickyNote, bg: "bg-amber-50", text: "text-amber-600", label: "Note" },
  call: { icon: PhoneCall, bg: "bg-blue-50", text: "text-blue-600", label: "Call" },
  email: { icon: MailOpen, bg: "bg-emerald-50", text: "text-emerald-600", label: "Email" },
  meeting: { icon: Calendar, bg: "bg-purple-50", text: "text-purple-600", label: "Meeting" },
};

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function RecentActivityFeed() {
  const { data: activities, isLoading } = trpc.dashboard.recentActivities.useQuery({ limit: 12 });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-[0.12em]">Recent Activity</h2>
        </div>
        <span className="text-[11px] text-muted-foreground/50">{activities?.length ?? 0} latest</span>
      </div>

      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-48 bg-muted rounded-full" />
                    <div className="h-2.5 w-32 bg-muted/60 rounded-full" />
                  </div>
                  <div className="h-3 w-12 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          ) : !activities || activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                <Clock className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">Activities will appear here as you log notes, calls, emails, and meetings.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {activities.map((activity: any) => {
                const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.note;
                const Icon = config.icon;
                const contactName = [activity.contactFirstName, activity.contactLastName].filter(Boolean).join(" ") || null;
                return (
                  <div key={activity.id} className="flex items-start gap-3.5 p-4 hover:bg-accent/20 transition-colors group">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg} ${config.text} transition-transform duration-200 group-hover:scale-105`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`text-[9px] font-bold uppercase rounded-md px-1.5 py-0 ${config.bg} ${config.text} border-0`}>
                          {config.label}
                        </Badge>
                        {contactName && (
                          <Link href={activity.contactId ? `/contacts/${activity.contactId}` : "#"} className="text-xs font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground/50" />
                            {contactName}
                          </Link>
                        )}
                        {activity.companyName && (
                          <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {activity.companyName}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-0.5 truncate">
                        {activity.subject || <span className="text-muted-foreground/50 italic">No subject</span>}
                      </p>
                      {activity.type === "call" && activity.callOutcome && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Outcome: {activity.callOutcome}{activity.callDuration ? ` · ${activity.callDuration} min` : ""}
                        </p>
                      )}
                      {activity.type === "email" && activity.emailTo && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          To: {activity.emailTo}
                        </p>
                      )}
                      {activity.type === "meeting" && activity.meetingLocation && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {activity.meetingLocation}{activity.meetingOutcome ? ` · ${activity.meetingOutcome}` : ""}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground/50 whitespace-nowrap shrink-0 pt-0.5">
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const TASK_TYPE_ICONS: Record<string, any> = {
  call: Phone,
  email: MailOpen,
  to_do: ClipboardList,
  follow_up: RefreshCwIcon,
  meeting: Video,
  demo: Zap,
  proposal: FileText,
  whatsapp: MessageSquare,
  sms: MessageSquare,
};

const TASK_TYPE_COLORS: Record<string, string> = {
  call: "text-blue-400 bg-blue-500/10",
  email: "text-purple-400 bg-purple-500/10",
  to_do: "text-gray-400 bg-gray-500/10",
  follow_up: "text-amber-400 bg-amber-500/10",
  meeting: "text-green-400 bg-green-500/10",
  demo: "text-cyan-400 bg-cyan-500/10",
  proposal: "text-pink-400 bg-pink-500/10",
  whatsapp: "text-emerald-400 bg-emerald-500/10",
  sms: "text-indigo-400 bg-indigo-500/10",
};

function TaskCommandCenter() {
  const now = Date.now();
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const todayEndTs = todayEnd.getTime();
  const tomorrowEnd = todayEndTs + 86400000 * 7; // next 7 days

  const { data: allTasks, isLoading } = trpc.tasks.list.useQuery({ status: "not_started", limit: 100 });
  const utils = trpc.useUtils();
  const completeMutation = trpc.tasks.update.useMutation({
    onSuccess: () => utils.tasks.list.invalidate(),
  });

  const [viewingTask, setViewingTask] = useState<any>(null);

  const tasks = allTasks?.items ?? [];

  const overdue = tasks.filter(t => t.dueDate && t.dueDate < now);
  const today = tasks.filter(t => t.dueDate && t.dueDate >= now && t.dueDate <= todayEndTs);
  const upcoming = tasks.filter(t => t.dueDate && t.dueDate > todayEndTs && t.dueDate <= tomorrowEnd);
  const undated = tasks.filter(t => !t.dueDate).slice(0, 5);

  const TaskRow = ({ task, accent }: { task: any; accent?: string }) => {
    const TypeIcon = TASK_TYPE_ICONS[task.taskType ?? "to_do"] || ClipboardList;
    const typeColor = TASK_TYPE_COLORS[task.taskType ?? "to_do"] || "text-gray-400 bg-gray-500/10";
    return (
      <div
        onClick={() => setViewingTask(task)}
        className="group flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30 transition-all cursor-pointer"
      >
        <div onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={false}
            onCheckedChange={() => completeMutation.mutate({ id: task.id, status: "completed", completedAt: Date.now() })}
            className="shrink-0"
          />
        </div>
        <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${typeColor}`}>
          <TypeIcon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {task.dueDate && (
              <span className={`text-[11px] flex items-center gap-0.5 ${accent ?? "text-muted-foreground"}`}>
                <Calendar className="h-3 w-3" />{new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}{task.dueTime ? ` ${task.dueTime}` : ""}
              </span>
            )}
            {task.companyName && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                <Building2Icon className="h-3 w-3 text-blue-400" />{task.companyName}
              </span>
            )}
            {task.contactFirstName && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                <UserIcon className="h-3 w-3 text-purple-400" />{task.contactFirstName} {task.contactLastName ?? ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {task.priority === "high" && <span className="h-2 w-2 rounded-full bg-red-400" title="High priority" />}
          {task.priority === "medium" && <span className="h-2 w-2 rounded-full bg-amber-400" title="Medium priority" />}
          <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  };

  const Section = ({ label, items, accent, emptyText, color }: { label: string; items: any[]; accent?: string; emptyText: string; color: string }) => (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-1.5 w-1.5 rounded-full ${color}`} />
        <span className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-[0.1em]">{label}</span>
        <Badge variant="outline" className="text-[10px] h-4 px-1.5">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground/50 px-3 py-2 italic">{emptyText}</p>
      ) : (
        <div className="space-y-0.5">
          {items.slice(0, 5).map(t => <TaskRow key={t.id} task={t} accent={accent} />)}
          {items.length > 5 && (
            <Link href="/tasks" className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary px-3 py-1.5 transition-colors">
              +{items.length - 5} more <ChevronRightIcon className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Card className="rounded-2xl border-border/40 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-amber-500" />
              Task Command Center
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {overdue.length > 0 && <span className="text-red-400 font-medium">{overdue.length} overdue</span>}
                <span>{today.length} today</span>
                <span>{upcoming.length} upcoming</span>
              </div>
              <Link href="/tasks">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                  View All <ChevronRightIcon className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted/40 rounded-xl animate-pulse" />
            ))}</div>
          ) : (
            <Tabs defaultValue="overdue" className="w-full">
              <TabsList className="bg-secondary/30 mb-4">
                <TabsTrigger value="overdue" className="text-xs gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  Overdue {overdue.length > 0 && <Badge variant="destructive" className="text-[9px] h-4 px-1 ml-0.5">{overdue.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="today" className="text-xs gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Today {today.length > 0 && <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-0.5">{today.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="text-xs gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Next 7 Days
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs">All Open</TabsTrigger>
              </TabsList>
              <TabsContent value="overdue">
                <Section label="Overdue" items={overdue} accent="text-red-400" emptyText="No overdue tasks — great job!" color="bg-red-400" />
              </TabsContent>
              <TabsContent value="today">
                <Section label="Due Today" items={today} accent="text-amber-400" emptyText="Nothing due today" color="bg-amber-400" />
              </TabsContent>
              <TabsContent value="upcoming">
                <Section label="Next 7 Days" items={upcoming} accent="text-blue-400" emptyText="Nothing scheduled in the next 7 days" color="bg-blue-400" />
              </TabsContent>
              <TabsContent value="all">
                <div className="space-y-4">
                  {overdue.length > 0 && <Section label="Overdue" items={overdue} accent="text-red-400" emptyText="" color="bg-red-400" />}
                  {today.length > 0 && <Section label="Due Today" items={today} accent="text-amber-400" emptyText="" color="bg-amber-400" />}
                  {upcoming.length > 0 && <Section label="Next 7 Days" items={upcoming} accent="text-blue-400" emptyText="" color="bg-blue-400" />}
                  {undated.length > 0 && <Section label="No Due Date" items={undated} emptyText="" color="bg-muted-foreground" />}
                  {tasks.length === 0 && <p className="text-xs text-muted-foreground/50 px-3 py-4 text-center italic">No open tasks — you're all caught up!</p>}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Task Quick-View Sheet */}
      <Sheet open={!!viewingTask} onOpenChange={open => { if (!open) setViewingTask(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card border-border">
          {viewingTask && (() => {
            const t2 = viewingTask;
            const TypeIcon2 = TASK_TYPE_ICONS[t2.taskType ?? "to_do"] || ClipboardList;
            const typeColor2 = TASK_TYPE_COLORS[t2.taskType ?? "to_do"] || "text-gray-400 bg-gray-500/10";
            const isOverdue2 = t2.dueDate && t2.dueDate < now;
            return (
              <>
                <SheetHeader className="pb-4 border-b border-border">
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${typeColor2}`}>
                      <TypeIcon2 className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-sm font-semibold leading-snug">{t2.title}</SheetTitle>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {t2.priority === "high" && <Badge variant="destructive" className="text-[10px]">High</Badge>}
                        {t2.priority === "medium" && <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-400">Medium</Badge>}
                        {t2.taskType && <Badge variant="outline" className={`text-[10px] capitalize ${typeColor2}`}>{t2.taskType.replace("_", " ")}</Badge>}
                        {isOverdue2 && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                      </div>
                    </div>
                  </div>
                </SheetHeader>
                <div className="py-4 space-y-4">
                  {t2.description && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{t2.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {t2.dueDate && (
                      <div className={`flex items-center gap-2 p-2 rounded-lg bg-secondary/30 ${isOverdue2 ? "border border-red-500/20" : ""}`}>
                        <Calendar className={`h-3.5 w-3.5 shrink-0 ${isOverdue2 ? "text-red-400" : "text-muted-foreground"}`} />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Due</p>
                          <p className={`text-xs font-medium ${isOverdue2 ? "text-red-400" : ""}`}>{new Date(t2.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    {t2.companyName && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                        <Building2Icon className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Company</p>
                          <p className="text-xs font-medium truncate">{t2.companyName}</p>
                        </div>
                      </div>
                    )}
                    {t2.contactFirstName && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                        <UserIcon className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Contact</p>
                          <p className="text-xs font-medium truncate">{t2.contactFirstName} {t2.contactLastName ?? ""}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link href="/tasks" className="flex-1">
                      <Button size="sm" className="w-full" onClick={() => setViewingTask(null)}>Open in Tasks</Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => {
                      completeMutation.mutate({ id: t2.id, status: "completed", completedAt: Date.now() });
                      setViewingTask(null);
                    }}>Mark Done</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function Dashboard() {
  const { t } = useSkin();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: company, refetch: refetchCompany } = trpc.tenants.myCompany.useQuery();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLogoDialog, setShowLogoDialog] = useState(false);
  const [logoPrompt, setLogoPrompt] = useState("");
  const [logoGenerating, setLogoGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  // Auto-trigger onboarding for new users (first login, no data yet)
  useEffect(() => {
    if (!stats || isLoading) return;
    const key = `onboarding_shown_${user?.id}`;
    const alreadyShown = localStorage.getItem(key);
    if (!alreadyShown && (stats.totalContacts ?? 0) === 0 && (stats.totalCompanies ?? 0) === 0) {
      localStorage.setItem(key, "1");
      setShowOnboarding(true);
    }
  }, [stats?.totalContacts, stats?.totalCompanies, isLoading, user?.id]);

  // Multi-step logo generation flow
  // Steps: 'idle' | 'generating' | 'preview' | 'customize-offer' | 'customize-input' | 'applying'
  type LogoStep = 'idle' | 'generating' | 'preview' | 'customize-offer' | 'customize-input' | 'applying';
  const [logoStep, setLogoStep] = useState<LogoStep>('idle');
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | null>(null);
  const [customizeIdeas, setCustomizeIdeas] = useState("");
  const [logoIndustry, setLogoIndustry] = useState("");
  const [autoBannerLogoUrl, setAutoBannerLogoUrl] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Read URL params for Stripe return
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const logoCustomizationPaid = searchParams.get('logo_customization') === 'paid';
  const [stripeReturnHandled, setStripeReturnHandled] = useState(false);

  // Logo history query
  const { data: logoHistory, refetch: refetchLogoHistory } = trpc.tenants.getLogoHistory.useQuery(
    undefined, { enabled: showLogoDialog }
  );

  const generateLogoMutation = trpc.tenants.generateLogo.useMutation({
    onSuccess: (data) => {
      // Show preview step instead of applying immediately
      setPreviewLogoUrl(data.logoUrl);
      setLogoStep('preview');
    },
    onError: (e) => { toast.error(e.message); setLogoStep('idle'); },
  });

  const applyLogoMutation = trpc.tenants.generateLogo.useMutation({
    onSuccess: (data) => {
      utils.tenants.myCompany.setData(undefined, (old) =>
        old ? { ...old, logoUrl: data.logoUrl } : old
      );
      setLogoStep('idle');
      setPreviewLogoUrl(null);
      setCustomizeIdeas("");
      setShowLogoDialog(false);
      toast.success("Logo applied!");
      refetchCompany();
    },
    onError: (e) => { toast.error(e.message); setLogoStep('preview'); },
  });
  const uploadLogoMutation = trpc.tenants.uploadLogo.useMutation({
    onSuccess: (data) => {
      utils.tenants.myCompany.setData(undefined, (old) =>
        old ? { ...old, logoUrl: data.logoUrl } : old
      );
      setShowLogoDialog(false);
      toast.success("Logo uploaded!");
      refetchCompany();
    },
    onError: (e) => toast.error(e.message),
  });

  const restoreLogoMutation = trpc.tenants.restoreLogo.useMutation({
    onSuccess: (data) => {
      utils.tenants.myCompany.setData(undefined, (old) =>
        old ? { ...old, logoUrl: data.logoUrl } : old
      );
      toast.success("Logo restored!");
      refetchCompany();
    },
    onError: (e) => toast.error(e.message),
  });

  const checkoutMutation = trpc.tenants.createLogoCustomizationCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) window.open(data.checkoutUrl, '_blank');
      toast.info("Redirecting to checkout...");
    },
    onError: (e) => toast.error(e.message),
  });

  const autoGenerateMutation = trpc.tenants.autoGenerateLogo.useMutation({
    onSuccess: (data) => {
      if (data.logoUrl) setAutoBannerLogoUrl(data.logoUrl);
    },
  });

  const deleteLogoHistoryMutation = trpc.tenants.deleteLogoHistoryEntry.useMutation({
    onSuccess: () => {
      refetchLogoHistory();
      toast.success('Removed from history.');
    },
    onError: (e) => toast.error(e.message),
  });

  const setFaviconMutation = trpc.tenants.setFavicon.useMutation({
    onSuccess: (data) => {
      // Inject favicon link tag dynamically
      const existingLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (existingLink) {
        existingLink.href = data.faviconUrl;
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = data.faviconUrl;
        document.head.appendChild(link);
      }
      toast.success('Favicon updated! The browser tab icon now shows your logo.');
    },
    onError: (e) => toast.error(e.message),
  });

  const regenerateWithSameStyleMutation = trpc.tenants.regenerateWithSameStyle.useMutation({
    onSuccess: (data) => {
      setPreviewLogoUrl(data.logoUrl);
      setLogoStep('preview');
      setShowLogoDialog(true);
      refetchLogoHistory();
      toast.success('New variation generated!');
    },
    onError: (e) => toast.error(e.message),
  });

  // Auto-generate logo on first load if company has no logo
  useEffect(() => {
    if (company && !company.logoUrl && !autoBannerLogoUrl && !bannerDismissed) {
      autoGenerateMutation.mutate();
    }
  }, [company?.id]);

  // Handle Stripe return: open customize-input step automatically
  useEffect(() => {
    if (logoCustomizationPaid && !stripeReturnHandled) {
      setStripeReturnHandled(true);
      setShowLogoDialog(true);
      setLogoStep('customize-input');
      toast.success("Payment confirmed! Describe your logo vision below.");
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [logoCustomizationPaid, stripeReturnHandled]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      uploadLogoMutation.mutate({ dataUrl, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${val}`;
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8">
      {/* ─── Auto-Generate Logo Banner ─── */}
      {autoBannerLogoUrl && !bannerDismissed && !company?.logoUrl && (
        <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="h-12 w-12 rounded-xl overflow-hidden border border-border/30 bg-white/80 shrink-0">
            <img src={autoBannerLogoUrl} alt="AI-generated logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">We made you a logo!</p>
            <p className="text-xs text-muted-foreground">Our AI generated a logo for {company?.name}. Want to use it?</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                restoreLogoMutation.mutate({ logoUrl: autoBannerLogoUrl });
                setBannerDismissed(true);
              }}
            >
              <Sparkles className="h-3.5 w-3.5" /> Use It
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setBannerDismissed(true)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* ─── Welcome Header ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-primary/10 p-7">
          <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Company logo or upload prompt */}
              {company?.logoUrl ? (
                <button
                  onClick={() => setShowLogoDialog(true)}
                  className="h-14 w-14 rounded-2xl overflow-hidden bg-white/80 border border-border/30 shadow-sm shrink-0 hover:opacity-80 transition-opacity group relative"
                  title="Change company logo"
                >
                  <img src={company.logoUrl} alt={company.name || "Company logo"} className="h-full w-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImagePlus className="h-5 w-5 text-white" />
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setShowLogoDialog(true)}
                  className="h-14 w-14 rounded-2xl bg-white/60 border-2 border-dashed border-primary/30 flex flex-col items-center justify-center shrink-0 hover:border-primary/60 hover:bg-white/80 transition-all group"
                  title="Upload or generate your company logo"
                >
                  <ImagePlus className="h-5 w-5 text-primary/50 group-hover:text-primary transition-colors" />
                  <span className="text-[9px] text-primary/50 group-hover:text-primary font-semibold mt-0.5 transition-colors">Logo</span>
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {greeting()}, {user?.name?.split(" ")[0] || "there"}
                </h1>
                {company?.name && (
                  <p className="text-xs font-semibold text-primary/70 mt-0.5">{company.name}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                  Your dashboard is your daily command center. Every metric below is live — track your pipeline, monitor team performance, and spot opportunities at a glance.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => { if ((window as any).__startOnboarding) (window as any).__startOnboarding(); else setShowOnboarding(true); }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" /> Getting Started
              </button>
              <button
                onClick={() => setShowLogoDialog(true)}
                className="px-4 py-2 rounded-xl bg-white/60 border border-border/40 hover:bg-white/80 text-foreground text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <ImagePlus className="h-3.5 w-3.5 text-primary" /> {company?.logoUrl ? "Change Logo" : "Upload Logo"}
              </button>
              <Link
                href="/migration"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Migrate from CRM
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/5" />
        <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-primary/3" />
      </div>

      {/* ─── Quick Actions ─── */}
      <Card className="rounded-2xl border-border/40 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <QuickAction label="Add Company" href="/companies" icon={Building2} color="bg-blue-50 text-blue-600" />
          <QuickAction label="Create Deal" href="/deals" icon={Kanban} color="bg-amber-50 text-amber-600" />
          <QuickAction label="New Campaign" href="/campaigns" icon={Mail} color="bg-blue-50 text-blue-600" />
          <QuickAction label="Add Task" href="/tasks" icon={ListChecks} color="bg-amber-50 text-amber-600" />
          <QuickAction label="Post Load" href="/freight-marketplace" icon={Truck} color="bg-emerald-50 text-emerald-600" />
          <QuickAction label="Signal Feed" href="/paradigm/signals" icon={Radar} color="bg-purple-50 text-purple-600" />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/40 bg-card p-5">
              <div className="animate-pulse space-y-3">
                <div className="h-3 w-20 bg-muted rounded-full" />
                <div className="h-8 w-16 bg-muted rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ─── CRM Core ─── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-[0.12em]">CRM Core</h2>
              <span className="text-[10px] text-muted-foreground/50 ml-1">Your companies, contacts, deals & pipeline</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title={t("companies")} value={stats?.totalCompanies ?? 0} icon={Building2} gradient="bg-gradient-to-r from-blue-500 to-blue-400" iconBg="bg-blue-50 text-blue-600" href="/companies" />
              <StatCard title={t("contacts")} value={stats?.totalContacts ?? 0} icon={Users} gradient="bg-gradient-to-r from-blue-500 to-blue-400" iconBg="bg-blue-50 text-blue-600" href="/contacts" />
              <StatCard title="Open Deals" value={stats?.openDeals ?? 0} icon={Kanban} subtitle={`${stats?.totalDeals ?? 0} total`} gradient="bg-gradient-to-r from-amber-500 to-amber-400" iconBg="bg-amber-50 text-amber-600" href="/deals" />
              <StatCard title="Pipeline Value" value={formatCurrency(stats?.totalValue ?? 0)} icon={DollarSign} gradient="bg-gradient-to-r from-emerald-500 to-emerald-400" iconBg="bg-emerald-50 text-emerald-600" href="/deals" />
            </div>
          </div>

          {/* ─── Performance ─── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-[0.12em]">Performance</h2>
              <span className="text-[10px] text-muted-foreground/50 ml-1">Win rates, task progress & segment health</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Won Deals" value={stats?.wonDeals ?? 0} icon={Trophy} subtitle={formatCurrency(stats?.wonValue ?? 0)} gradient="bg-gradient-to-r from-emerald-500 to-emerald-400" iconBg="bg-emerald-50 text-emerald-600" href="/deals" />
              <StatCard title="Lost Deals" value={stats?.lostDeals ?? 0} icon={TrendingUp} gradient="bg-gradient-to-r from-red-500 to-red-400" iconBg="bg-red-50 text-red-500" href="/deals" />
              <StatCard title="Pending Tasks" value={stats?.pendingTasks ?? 0} icon={ListChecks} subtitle={`${stats?.totalTasks ?? 0} total`} gradient="bg-gradient-to-r from-amber-500 to-amber-400" iconBg="bg-amber-50 text-amber-600" href="/tasks" />
              <StatCard title="Segments" value={(stats as any)?.totalSegments ?? 0} icon={LayoutGrid} gradient="bg-gradient-to-r from-blue-500 to-blue-400" iconBg="bg-blue-50 text-blue-600" href="/segments" />
            </div>
          </div>

          {/* ─── Email & Paradigm ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-[0.12em]">Email Operations</h2>
                <span className="text-[10px] text-muted-foreground/50 ml-1">Campaigns, templates & deliverability</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StatCard title="Campaigns" value={stats?.totalCampaigns ?? 0} icon={Mail} gradient="bg-gradient-to-r from-blue-500 to-blue-400" iconBg="bg-blue-50 text-blue-600" href="/campaigns" />
                <StatCard title="Templates" value={(stats as any)?.totalTemplates ?? 0} icon={FileText} gradient="bg-gradient-to-r from-blue-500 to-blue-400" iconBg="bg-blue-50 text-blue-600" href="/templates" />
                <StatCard title="Workflows" value={(stats as any)?.totalWorkflows ?? 0} icon={Workflow} gradient="bg-gradient-to-r from-amber-500 to-amber-400" iconBg="bg-amber-50 text-amber-600" href="/workflows" />
                <StatCard title="Suppressed" value={(stats as any)?.suppressedEmails ?? 0} icon={Shield} gradient="bg-gradient-to-r from-red-500 to-red-400" iconBg="bg-red-50 text-red-500" href="/suppression" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-[0.12em]">Paradigm Engine</h2>
                <span className="text-[10px] text-muted-foreground/50 ml-1">AI-powered sales intelligence</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StatCard title="Prospects" value={(stats as any)?.totalProspects ?? 0} icon={Target} gradient="bg-gradient-to-r from-blue-500 to-blue-400" iconBg="bg-blue-50 text-blue-600" href="/paradigm/prospects" />
                <StatCard title="Hot Leads" value={(stats as any)?.hotLeads ?? 0} icon={AlertCircle} gradient="bg-gradient-to-r from-red-500 to-red-400" iconBg="bg-red-50 text-red-500" href="/paradigm/prospects" />
                <StatCard title="Sequences" value={(stats as any)?.activeSequences ?? 0} icon={Ghost} gradient="bg-gradient-to-r from-purple-500 to-purple-400" iconBg="bg-purple-50 text-purple-600" href="/paradigm/sequences" />
                <StatCard title="Signals" value={(stats as any)?.newSignals ?? 0} icon={Radar} subtitle="Unreviewed" gradient="bg-gradient-to-r from-amber-500 to-amber-400" iconBg="bg-amber-50 text-amber-600" href="/paradigm/signals" />
              </div>
            </div>
          </div>

          {/* ─── Freight Operations ─── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-[0.12em]">Freight Operations</h2>
              <span className="text-[10px] text-muted-foreground/50 ml-1">Loads, marketplace & logistics</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Active Loads" value={0} icon={Truck} gradient="bg-gradient-to-r from-blue-500 to-blue-400" iconBg="bg-blue-50 text-blue-600" href="/loads" />
              <StatCard title="Marketplace" value={0} icon={Package} subtitle="Posted loads" gradient="bg-gradient-to-r from-emerald-500 to-emerald-400" iconBg="bg-emerald-50 text-emerald-600" href="/freight-marketplace" />
              <StatCard title="Autopilot" value="Active" icon={Brain} gradient="bg-gradient-to-r from-purple-500 to-purple-400" iconBg="bg-purple-50 text-purple-600" href="/axiom-autopilot" />
              <StatCard title="Voice Agent" value={0} icon={Phone} subtitle="Campaigns" gradient="bg-gradient-to-r from-purple-500 to-purple-400" iconBg="bg-purple-50 text-purple-600" href="/voice-agent" />
            </div>
          </div>
        </>
      )}

      {/* ─── Recent Activity Feed ─── */}
      <RecentActivityFeed />

      {/* ─── Task Command Center ─── */}
      <TaskCommandCenter />

      {/* ─── Migration Health Widget (admin only, only shown when migrations exist) ─── */}
      <MigrationHealthWidget />

      {/* ─── System Status ─── */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="rounded-2xl border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { module: "CRM Core", status: "active", desc: "Companies, Contacts, Deals, Tasks" },
              { module: "Email Pipeline", status: "active", desc: "Campaigns, Templates, SMTP, Compliance" },
              { module: "Paradigm Engine", status: "active", desc: "Prospects, Signals, Sequences, Battle Cards" },
              { module: "Freight Marketplace", status: "active", desc: "Load Posting, Carrier Match, Tracking, Payment" },
              { module: "AXIOM Autopilot", status: "active", desc: "Consolidation, Lane Prediction, Optimization" },
            ].map((item) => (
              <div key={item.module} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/30 transition-colors">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground">{item.module}</span>
                  <span className="text-xs text-muted-foreground ml-2">{item.desc}</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200 shrink-0">
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ─── Onboarding Wizard ─── */}
      {showOnboarding && (
        <OnboardingWizard
          onClose={() => setShowOnboarding(false)}
          onComplete={() => utils.dashboard.stats.invalidate()}
        />
      )}

      {/* ─── Logo Dialog ─── */}
      <Dialog open={showLogoDialog} onOpenChange={(open) => {
        if (!open) { setLogoStep('idle'); setPreviewLogoUrl(null); setCustomizeIdeas(""); setLogoIndustry(""); }
        setShowLogoDialog(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-primary" />
              {logoStep === 'preview' ? 'Your AI Logo' :
               logoStep === 'customize-offer' ? 'Customize Your Logo' :
               logoStep === 'customize-input' ? 'Describe Your Vision' :
               'Company Logo'}
            </DialogTitle>
          </DialogHeader>

          {/* ── Step: Preview ── */}
          {logoStep === 'preview' && previewLogoUrl && (
            <div className="space-y-5 pt-2">
              <div className="flex flex-col items-center gap-4">
                <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-lg bg-gradient-to-br from-muted/60 to-muted/20 p-6">
                  <img src={previewLogoUrl} alt="Generated logo preview" className="h-40 w-40 object-contain" />
                </div>
                <p className="text-sm text-muted-foreground text-center">Here's your AI-generated logo for <span className="font-semibold text-foreground">{company?.name}</span>. Do you want to use it?</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    // Apply the previewed logo directly
                    utils.tenants.myCompany.setData(undefined, (old) =>
                      old ? { ...old, logoUrl: previewLogoUrl } : old
                    );
                    setShowLogoDialog(false);
                    setLogoStep('idle');
                    setPreviewLogoUrl(null);
                    toast.success("Logo applied!");
                    refetchCompany();
                  }}
                >
                  <Sparkles className="h-4 w-4" /> Yes, Use This Logo
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setLogoStep('customize-offer')}
                >
                  <Wand2 className="h-4 w-4" /> Customize It
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={async () => {
                    if (!previewLogoUrl) return;
                    try {
                      const response = await fetch(previewLogoUrl);
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${company?.name?.replace(/\s+/g, '-').toLowerCase() || 'logo'}-axiom.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast.success('Logo downloaded!');
                    } catch {
                      toast.error('Download failed. Try right-clicking the image to save.');
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download Logo
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    if (!previewLogoUrl) return;
                    navigator.clipboard.writeText(previewLogoUrl)
                      .then(() => toast.success('Logo URL copied to clipboard!'))
                      .catch(() => toast.error('Could not copy to clipboard.'));
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  Share Logo (Copy Link)
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    if (!previewLogoUrl) return;
                    setFaviconMutation.mutate({ faviconUrl: previewLogoUrl });
                  }}
                  disabled={setFaviconMutation.isPending}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/><path d="M2 12h20"/></svg>
                  {setFaviconMutation.isPending ? 'Setting Favicon...' : 'Set as Favicon'}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => {
                    setLogoStep('idle');
                    setPreviewLogoUrl(null);
                  }}
                >
                  Regenerate
                </Button>
              </div>
            </div>
          )}

          {/* ── Step: Customize Offer ── */}
          {logoStep === 'customize-offer' && (
            <div className="space-y-5 pt-2">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground text-sm">AI Logo Customization</span>
                  <Badge className="ml-auto text-xs bg-primary/10 text-primary border-primary/20">$9.99</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Tell us exactly what you want — colors, style, symbols, mood — and our AI will regenerate your logo to match your vision.</p>
                <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                  <li className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Unlimited revisions in this session</li>
                  <li className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> High-resolution PNG saved automatically</li>
                  <li className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> One-time fee, no subscription</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full gap-2"
                  disabled={checkoutMutation.isPending}
                  onClick={() => checkoutMutation.mutate({ origin: window.location.origin })}
                >
                  {checkoutMutation.isPending ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Opening checkout...</>
                  ) : (
                    <><Wand2 className="h-4 w-4" /> Yes, Customize for $9.99</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLogoStep('preview')}
                >
                  No thanks, use current logo
                </Button>
              </div>
            </div>
          )}

          {/* ── Step: Customize Input ── */}
          {logoStep === 'customize-input' && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Describe your vision</label>
                <Textarea
                  placeholder="e.g. Use deep blue and gold colors. Include a small truck icon. Make it bold and modern. Avoid circles."
                  value={customizeIdeas}
                  onChange={e => setCustomizeIdeas(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">Be as specific as you like — colors, shapes, style, symbols, mood.</p>
              </div>
              {previewLogoUrl && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                  <img src={previewLogoUrl} alt="Current logo" className="h-12 w-12 object-contain rounded-lg" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">Current logo</p>
                    <p className="text-xs text-muted-foreground">Will be replaced with your customized version</p>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full gap-2"
                  disabled={!customizeIdeas.trim() || applyLogoMutation.isPending}
                  onClick={() => {
                    setLogoStep('generating');
                    applyLogoMutation.mutate({
                      companyName: company!.name!,
                      industry: customizeIdeas.trim(),
                    });
                  }}
                >
                  {applyLogoMutation.isPending ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Generating your custom logo...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate My Custom Logo</>
                  )}
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setLogoStep('customize-offer')}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* ── Step: Generating ── */}
          {logoStep === 'generating' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Wand2 className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Creating your logo...</p>
                <p className="text-sm text-muted-foreground mt-1">This takes 10–20 seconds. Please wait.</p>
              </div>
            </div>
          )}

          {/* ── Step: Idle (initial) ── */}
          {logoStep === 'idle' && (
            <Tabs defaultValue="upload" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="upload" className="flex-1 flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> Upload
                </TabsTrigger>
                <TabsTrigger value="generate" className="flex-1 flex items-center gap-1.5">
                  <Wand2 className="h-3.5 w-3.5" /> AI Generate
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1 flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> History
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">Upload a PNG, JPG, or SVG file. Recommended size: 256×256px or larger.</p>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-accent/30 transition-all"
                >
                  {uploadLogoMutation.isPending ? (
                    <><RefreshCw className="h-8 w-8 text-primary animate-spin" /><p className="text-sm text-muted-foreground">Uploading...</p></>
                  ) : (
                    <><Upload className="h-8 w-8 text-muted-foreground/40" /><p className="text-sm font-medium text-foreground">Click to choose a file</p><p className="text-xs text-muted-foreground">PNG, JPG, SVG up to 5MB</p></>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </TabsContent>
              <TabsContent value="generate" className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">Our AI will create a professional logo based on your company name and industry.</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Company Name</label>
                    <Input value={company?.name || ""} disabled className="bg-muted/50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Industry (optional)</label>
                    <Input
                      placeholder="e.g. Technology, Healthcare, Logistics..."
                      value={logoIndustry}
                      onChange={e => setLogoIndustry(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={generateLogoMutation.isPending || !company?.name}
                  onClick={() => {
                    setLogoStep('generating');
                    generateLogoMutation.mutate({ companyName: company!.name!, industry: logoIndustry || undefined });
                  }}
                >
                  {generateLogoMutation.isPending ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Wand2 className="h-4 w-4 mr-2" /> Generate Logo with AI</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">Generation takes 10–20 seconds. Free with your plan.</p>
              </TabsContent>
              <TabsContent value="history" className="pt-4">
                {!logoHistory || logoHistory.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <RefreshCw className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No logo history yet. Generate your first logo to see it here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Click any logo to restore it as your current logo.</p>
                    <div className="grid grid-cols-3 gap-3">
                      {logoHistory.map((entry, idx) => {
                        const isActive = company?.logoUrl === entry.logoUrl;
                        const isMostRecent = idx === 0;
                        return (
                          <button
                            key={entry.id}
                            onClick={() => {
                              restoreLogoMutation.mutate({ logoUrl: entry.logoUrl });
                              setShowLogoDialog(false);
                            }}
                            title={isActive ? 'Currently active logo' : entry.prompt ? `Prompt: ${entry.prompt}` : 'Click to restore'}
                            className={`group relative rounded-xl border p-3 transition-all aspect-square flex items-center justify-center ${
                              isActive
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                                : 'border-border/40 bg-muted/30 hover:border-primary/40 hover:bg-accent/30'
                            }`}
                          >
                            <img src={entry.logoUrl} alt="Logo history" className="h-full w-full object-contain" />
                            {/* Active badge */}
                            {isActive && (
                              <span className="absolute top-1 right-1 text-[9px] font-bold bg-primary text-primary-foreground rounded px-1 py-0.5 leading-none">Active</span>
                            )}
                            {/* Most Recent badge (only if not active) */}
                            {isMostRecent && !isActive && (
                              <span className="absolute top-1 right-1 text-[9px] font-bold bg-emerald-500 text-white rounded px-1 py-0.5 leading-none">New</span>
                            )}
                            {/* Delete button on hover */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLogoHistoryMutation.mutate({ id: entry.id });
                              }}
                              className="absolute top-1 left-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:scale-110"
                              title="Remove from history"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                            {/* Hover overlay */}
                            {!isActive && (
                              <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-semibold">Restore</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {/* Regenerate with Same Style — shown when hovering a history entry */}
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-2">Want a variation of a past logo?</p>
                      <div className="flex flex-col gap-1.5">
                        {logoHistory.slice(0, 3).map((entry, idx) => (
                          <Button
                            key={entry.id}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start gap-2 text-xs"
                            disabled={regenerateWithSameStyleMutation.isPending}
                            onClick={() => regenerateWithSameStyleMutation.mutate({ historyId: entry.id })}
                          >
                            <img src={entry.logoUrl} alt="" className="h-5 w-5 rounded object-contain shrink-0" />
                            {regenerateWithSameStyleMutation.isPending ? 'Generating...' : `Regenerate style ${idx + 1}`}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
