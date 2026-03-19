/**
 * AI Engine Router
 * Developer-only tRPC procedures for controlling the AI Autonomous Engine.
 * All procedures require developer role.
 */

import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getEngineStatus,
  triggerTask,
  pauseTask,
  resumeTask,
  startAIEngine,
  stopAIEngine,
} from "../ai-engine";

// Developer-only middleware
const developerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.systemRole !== "developer") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Developer access required" });
  }
  return next({ ctx });
});

export const aiEngineRouter = router({
  // Get full engine status and all task states
  getStatus: developerProcedure.query(async () => {
    return getEngineStatus();
  }),

  // Get the full task registry (all registered tasks) — derived from engine status
  getTasks: developerProcedure.query(async () => {
    const status = getEngineStatus();
    return status.tasks.map(task => ({
      key: task.key,
      name: task.name,
      description: task.description,
      category: task.category,
      priority: task.priority,
      intervalMinutes: task.intervalMinutes,
    }));
  }),

  // Get logs for a specific task (reads from engine status)
  getTaskLogs: developerProcedure
    .input(z.object({ taskKey: z.string(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const status = getEngineStatus();
      const taskState = status.tasks.find((t: { key: string }) => t.key === input.taskKey);
      // Return last result as a single-item log if available
      return taskState?.lastResult ? [taskState.lastResult] : [];
    }),

  // Manually trigger a specific task
  triggerTask: developerProcedure
    .input(z.object({ taskKey: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await triggerTask(input.taskKey, ctx.user.id);
      return result;
    }),

  // Pause a task
  pauseTask: developerProcedure
    .input(z.object({ taskKey: z.string() }))
    .mutation(async ({ input }) => {
      pauseTask(input.taskKey);
      return { success: true };
    }),

  // Resume a paused task
  resumeTask: developerProcedure
    .input(z.object({ taskKey: z.string() }))
    .mutation(async ({ input }) => {
      resumeTask(input.taskKey);
      return { success: true };
    }),

  // Start the entire AI engine
  startEngine: developerProcedure.mutation(async () => {
    await startAIEngine();
    return { success: true, message: "AI Engine started" };
  }),

  // Stop the entire AI engine
  stopEngine: developerProcedure.mutation(async () => {
    stopAIEngine();
    return { success: true, message: "AI Engine stopped" };
  }),
});
