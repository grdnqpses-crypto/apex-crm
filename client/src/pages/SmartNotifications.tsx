import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Bell, BellRing, Check, Clock, AlertTriangle, DollarSign,
  Calendar, Users, Target, Sparkles, Trash2, CheckCircle2,
  Filter, MailOpen, Archive
} from "lucide-react";

const priorityColors: Record<string, string> = {
  critical: "border-l-red-500 bg-red-500/5",
  high: "border-l-amber-500 bg-amber-500/5",
  medium: "border-l-blue-500 bg-blue-500/5",
  low: "border-l-muted bg-muted/20",
};

const typeIcons: Record<string, typeof Bell> = {
  deal_at_risk: AlertTriangle,
  follow_up_due: Clock,
  deal_won: CheckCircle2,
  deal_lost: AlertTriangle,
  meeting_reminder: Calendar,
  revenue_alert: DollarSign,
  carrier_expiry: AlertTriangle,
  task_overdue: Clock,
  new_lead: Users,
  win_probability_change: Target,
};

export default function SmartNotifications() {
  const [filter, setFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const notifications = trpc.smartNotifications.list.useQuery(
    filter === "unread" ? { unreadOnly: true } : undefined
  );
  const markRead = trpc.smartNotifications.markRead.useMutation({ onSuccess: () => notifications.refetch() });
  // Mark all read by iterating
  const dismissNotification = trpc.smartNotifications.dismiss.useMutation({ onSuccess: () => notifications.refetch() });

  const unreadCount = notifications.data?.filter((n: any) => !n.isRead).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BellRing className="h-7 w-7 text-primary" />
            Smart Notifications
            {unreadCount > 0 && <Badge className="bg-primary text-primary-foreground">{unreadCount}</Badge>}
          </h1>
          <p className="text-muted-foreground mt-1">AI-prioritized alerts and actionable insights for your pipeline</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={() => { const unread = notifications.data?.filter((n: any) => !n.isRead) || []; unread.forEach((n: any) => markRead.mutate({ id: n.id })); toast.success('All marked as read'); }}>
            <Check className="h-4 w-4 mr-2" /> Mark All Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notification List */}
      {(notifications.data?.length || 0) === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
            <p className="text-muted-foreground">Smart notifications will appear here as AI detects important events in your pipeline</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.data?.map((notif: any) => {
            const Icon = typeIcons[notif.type] || Bell;
            return (
              <Card key={notif.id} className={`border-l-4 transition-all ${priorityColors[notif.priority] || priorityColors.medium} ${!notif.isRead ? 'ring-1 ring-primary/10' : 'opacity-75'}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-primary/10' : 'bg-muted/50'}`}>
                      <Icon className={`h-4 w-4 ${!notif.isRead ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className={`text-sm font-medium ${!notif.isRead ? '' : 'text-muted-foreground'}`}>{notif.title}</h4>
                        <Badge variant="outline" className="text-xs capitalize">{notif.type?.replace(/_/g, ' ')}</Badge>
                        {!notif.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{notif.message}</p>
                      {notif.actionUrl && (
                        <p className="text-xs text-primary mt-1 cursor-pointer hover:underline">{notif.actionLabel || 'View Details'}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!notif.isRead && (
                        <Button size="sm" variant="ghost" onClick={() => markRead.mutate({ id: notif.id })} title="Mark as read">
                          <MailOpen className="h-3 w-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => dismissNotification.mutate({ id: notif.id })} title="Delete">
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
    </div>
  );
}
