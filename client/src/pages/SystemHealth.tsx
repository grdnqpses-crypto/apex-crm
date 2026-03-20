import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSkin } from "@/contexts/SkinContext";
import {
  Activity, AlertTriangle, CheckCircle2, XCircle, RefreshCw,
  Zap, Database, Server, HardDrive, Brain, Shield, Clock,
  TrendingUp, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  healthy: "text-emerald-600 bg-emerald-50 border-emerald-200",
  degraded: "text-amber-600 bg-amber-50 border-amber-200",
  critical: "text-red-600 bg-red-50 border-red-200",
  unknown: "text-gray-500 bg-gray-50 border-gray-200",
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  healthy: CheckCircle2,
  degraded: AlertTriangle,
  critical: XCircle,
  unknown: AlertCircle,
};

const SUBSYSTEM_ICONS: Record<string, typeof Server> = {
  database: Database,
  memory: Brain,
  disk: HardDrive,
  email: Activity,
  storage: HardDrive,
  payments: Shield,
  ai: Brain,
  server: Server,
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  critical: "bg-red-100 text-red-800 border-red-300",
};

export default function SystemHealth() {
  const { t } = useSkin();
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [isRunningCheck, setIsRunningCheck] = useState(false);

  const { data: health, refetch: refetchHealth } = trpc.systemHealth.getLatest.useQuery(undefined, {
    refetchInterval: 30000, // auto-refresh every 30s
  });
  const { data: events = [], refetch: refetchEvents } = trpc.systemHealth.getEvents.useQuery({ limit: 50 });
  const { data: errorStats = [] } = trpc.systemHealth.getErrorStats.useQuery({ hours: 24 });
  const { data: prediction } = trpc.systemHealth.getPrediction.useQuery();
  const runCheck = trpc.systemHealth.runCheck.useMutation({
    onMutate: () => setIsRunningCheck(true),
    onSettled: () => {
      setIsRunningCheck(false);
      refetchHealth();
      refetchEvents();
    },
  });
  const acknowledgeEvent = trpc.systemHealth.acknowledgeEvent.useMutation({
    onSuccess: () => refetchEvents(),
  });

  const overallStatus = health?.overall || "unknown";
  const score = health?.score || 0;
  const StatusIcon = STATUS_ICONS[overallStatus] || AlertCircle;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-orange-500" />
            System Health
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Self-healing engine — auto-correcting errors, monitoring 24/7
          </p>
        </div>
        <Button
          onClick={() => runCheck.mutate()}
          disabled={isRunningCheck}
          className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRunningCheck ? "animate-spin" : ""}`} />
          {isRunningCheck ? "Checking..." : "Run Health Check"}
        </Button>
      </div>

      {/* Overall Health Score */}
      <Card className={`border-2 ${STATUS_COLORS[overallStatus]}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <StatusIcon className="w-8 h-8" />
              <div>
                <div className="text-2xl font-black capitalize">{overallStatus}</div>
                <div className="text-sm opacity-70">
                  Last checked: {health ? new Date(health.checkedAt).toLocaleTimeString() : "—"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black">{score}</div>
              <div className="text-sm opacity-70">Health Score</div>
            </div>
          </div>
          <Progress value={score} className="h-3" />
        </CardContent>
      </Card>

      {/* Subsystem Status Grid */}
      {health?.subsystems && health.subsystems.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Subsystems</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {health.subsystems.map((sub: any) => {
              const SubIcon = SUBSYSTEM_ICONS[sub.name.toLowerCase()] || Server;
              const SubStatusIcon = STATUS_ICONS[sub.status] || AlertCircle;
              return (
                <Card key={sub.name} className={`border ${STATUS_COLORS[sub.status]}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <SubIcon className="w-4 h-4" />
                        <span className="font-semibold text-sm">{sub.name}</span>
                      </div>
                      <SubStatusIcon className="w-4 h-4" />
                    </div>
                    {sub.message && (
                      <div className="text-xs opacity-70">{sub.message}</div>
                    )}
                    {sub.latencyMs !== undefined && (
                      <div className="text-xs opacity-70 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {sub.latencyMs}ms
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Prediction */}
      {prediction && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-purple-800 text-sm mb-1">
                  AI Predictive Analysis
                </div>
                <div className="text-purple-700 text-sm">{prediction}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Stats by Subsystem */}
      {errorStats.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            <TrendingUp className="w-5 h-5 inline mr-2 text-orange-500" />
            Error Frequency (Last 24h)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {errorStats.map((stat: any) => (
              <Card key={stat.subsystem} className="border-gray-100">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-black text-gray-900">{stat.count}</div>
                  <div className="text-sm text-gray-500 capitalize">{stat.subsystem}</div>
                  {stat.autoFixed > 0 && (
                    <div className="text-xs text-emerald-600 mt-1">
                      <CheckCircle2 className="w-3 h-3 inline mr-0.5" />
                      {stat.autoFixed} auto-fixed
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events Feed */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3">
          <Activity className="w-5 h-5 inline mr-2 text-orange-500" />
          Recent Events
        </h2>
        {events.length === 0 ? (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <div className="font-semibold text-emerald-800">All clear — no recent events</div>
              <div className="text-sm text-emerald-600 mt-1">The system is running smoothly</div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {events.map((event: any) => (
              <Card key={event.id} className={`border ${SEVERITY_COLORS[event.severity]}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${SEVERITY_COLORS[event.severity]}`}
                        >
                          {event.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-white">
                          {event.subsystem}
                        </Badge>
                        {event.autoCorrectAttempted && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${event.autoCorrectSuccess ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                          >
                            {event.autoCorrectSuccess ? "✅ Auto-fixed" : "⚠️ Fix attempted"}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(event.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm font-medium truncate">{event.message}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {event.details && (
                        <button
                          onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedEvent === event.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2"
                        onClick={() => acknowledgeEvent.mutate({ id: event.id })}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                  {expandedEvent === event.id && event.details && (
                    <pre className="mt-3 text-xs bg-white/60 rounded p-3 overflow-auto max-h-40 text-gray-600">
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
