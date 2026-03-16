import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// ─── Role hierarchy (highest to lowest) ───
// developer > apex_owner > company_admin > manager > user
// super_admin is legacy alias for company_admin

const ROLE_LEVELS: Record<string, number> = {
  developer: 5,
  apex_owner: 4,
  super_admin: 3, // legacy alias for company_admin
  company_admin: 3,
  manager: 2,
  user: 1,
};

export function getRoleLevel(role: string): number {
  return ROLE_LEVELS[role] ?? 0;
}

// ─── Base: require authenticated user ───
const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(requireUser);

// ─── Role: admin (legacy role field) ───
export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

// ─── Role: Manager or above (manager, company_admin, apex_owner, developer) ───
export const managerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (getRoleLevel(ctx.user.systemRole) < ROLE_LEVELS.manager) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Manager access or above required." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

// ─── Role: Company Admin or above (company_admin, apex_owner, developer) ───
export const companyAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (getRoleLevel(ctx.user.systemRole) < ROLE_LEVELS.company_admin) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Company Admin access or above required." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

// ─── Role: Apex Owner or above (apex_owner, developer) ───
export const apexOwnerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (getRoleLevel(ctx.user.systemRole) < ROLE_LEVELS.apex_owner) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Apex Owner access or above required." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

// ─── Role: Developer only ───
export const developerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (ctx.user.systemRole !== "developer") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Developer access required." });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
