/**
 * AI Engine Control Panel
 * Developer-only dashboard for monitoring and controlling the AI Autonomous Engine.
 * Shows all registered tasks, their status, health scores, and allows manual triggers.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Brain,
  Play,
  Pause,
  RefreshCw,
  Activity,
  Zap,
  Shield,
  Database,
  Mail,
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Square,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  healing: <Shield className="w-4 h-4" />,
  migration: <Database className="w-4 h-4" />,
  enrichment: <Search className="w-4 h-4" />,
  optimization: <TrendingUp className="w-4 h-4" />,
  monitoring: <Activity className="w-4 h-4" />,
  intelligence: <Brain className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  healing: "bg-red-100 text-red-700 border-red-200",
  migration: "bg-blue-100 text-blue-700 border-blue-200",
  enrichment: "bg-purple-100 text-purple-700 border-purple-200",
  optimization: "bg-green-100 text-green-700 border-green-200",
  monitoring: "bg-orange-100 text-orange-700 border-orange-200",
  intelligence: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-gray-400 text-white",
};

const STATUS_COLORS: Record<string, string> = {
  running: "bg-green-500",
  idle: "bg-gray-300",
  error: "bg-red-500",
  paused: "bg-yellow-400",
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

function formatTimestamp(ts: number | null): string {
  if (!ts) return "Never";
  const diff = Date.now() - ts;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function formatNextRun(ts: number | null): string {
  if (!ts) return "—";
  const diff = ts - Date.now();
  if (diff < 0) return "Overdue";
  if (diff < 60000) return "< 1m";
  if (diff < 3600000) return `in ${Math.round(diff / 60000)}m`;
  return `in ${Math.round(diff / 3600000)}h`;
}

export default function AIEnginePanel() {
  const [triggeringTask, setTriggeringTask] = useState<string | null>(null);

  const { data: status, refetch, isLoading } = trpc.aiEngine.getStatus.useQuery(undefined, {
    refetchInterval: 10000, // refresh every 10s
  });

  const triggerMutation = trpc.aiEngine.triggerTask.useMutation({
    onMutate: ({ taskKey }) => setTriggeringTask(taskKey),
    onSuccess: (result, { taskKey }) => {
      setTriggeringTask(null);
      if (result.success) {
        toast.success(`Task completed: ${result.summary}`);
      } else {
        toast.error(`Task failed: ${result.error || "Unknown error"}`);
      }
      refetch();
    },
    onError: (err, { taskKey }) => {
      setTriggeringTask(null);
      toast.error(`Failed to trigger task: ${err.message}`);
    },
  });

  const pauseMutation = trpc.aiEngine.pauseTask.useMutation({
    onSuccess: () => { toast.success("Task paused"); refetch(); },
  });

  const resumeMutation = trpc.aiEngine.resumeTask.useMutation({
    onSuccess: () => { toast.success("Task resumed"); refetch(); },
  });

  const startMutation = trpc.aiEngine.startEngine.useMutation({
    onSuccess: () => { toast.success("AI Engine started"); refetch(); },
  });

  const stopMutation = trpc.aiEngine.stopEngine.useMutation({
    onSuccess: () => { toast.warning("AI Engine stopped"); refetch(); },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Brain className="w-6 h-6 animate-pulse" />
          <span>Loading AI Engine status...</span>
        </div>
      </div>
    );
  }

  const tasks = status?.tasks ?? [];
  const healthScore = status?.healthScore ?? 0;
  const isRunning = status?.isRunning ?? false;

  const tasksByCategory = tasks.reduce((acc: Record<string, typeof tasks>, task) => {
    const cat = task.category ?? "monitoring";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(task);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Brain className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Autonomous Engine</h1>
            <p className="text-sm text-muted-foreground">
              Developer-only · {tasks.length} tasks registered · Runs continuously in background
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          {isRunning ? (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
            >
              <Square className="w-4 h-4 mr-1" />
              Stop Engine
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
            >
              <Play className="w-4 h-4 mr-1" />
              Start Engine
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Engine Status</span>
              <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            </div>
            <div className="text-2xl font-bold">{isRunning ? "Running" : "Stopped"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Health Score</span>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-green-600">{healthScore}%</div>
            <Progress value={healthScore} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Active Tasks</span>
              <Zap className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === "running").length}
              <span className="text-sm font-normal text-muted-foreground"> / {tasks.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Paused Tasks</span>
              <Pause className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {tasks.filter(t => t.isPaused).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks by Category */}
      {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-700"}`}>
              {CATEGORY_ICONS[category]}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
            <span className="text-sm text-muted-foreground">{categoryTasks.length} task{categoryTasks.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
            {categoryTasks.map(task => (
              <Card key={task.key} className={`border ${task.isPaused ? "opacity-60" : ""} ${task.consecutiveFailures > 0 ? "border-red-200" : ""}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[task.isPaused ? "paused" : task.status] ?? "bg-gray-300"}`} />
                        <span className="font-medium text-sm truncate">{task.name}</span>
                        <Badge className={`text-xs px-1.5 py-0 ${PRIORITY_COLORS[task.priority] ?? "bg-gray-400 text-white"}`}>
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>

                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div>
                          <div className="font-medium text-foreground">{formatTimestamp(task.lastRunAt)}</div>
                          <div>Last run</div>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{formatNextRun(task.nextRunAt)}</div>
                          <div>Next run</div>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{formatDuration(task.intervalMinutes)}</div>
                          <div>Interval</div>
                        </div>
                      </div>

                      {task.consecutiveFailures > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          {task.consecutiveFailures} consecutive failure{task.consecutiveFailures !== 1 ? "s" : ""}
                        </div>
                      )}

                      {task.lastResult && (
                        <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2 line-clamp-2">
                          {task.lastResult.success ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                              {task.lastResult.summary}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                              {task.lastResult.error || task.lastResult.summary}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => triggerMutation.mutate({ taskKey: task.key })}
                        disabled={triggeringTask === task.key || task.status === "running"}
                      >
                        {triggeringTask === task.key ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </Button>
                      {task.isPaused ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-green-600 border-green-200"
                          onClick={() => resumeMutation.mutate({ taskKey: task.key })}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-yellow-600 border-yellow-200"
                          onClick={() => pauseMutation.mutate({ taskKey: task.key })}
                        >
                          <Pause className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {tasks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No tasks registered. Start the engine to initialize tasks.</p>
            <Button className="mt-4" onClick={() => startMutation.mutate()}>
              <Play className="w-4 h-4 mr-2" />
              Start AI Engine
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
