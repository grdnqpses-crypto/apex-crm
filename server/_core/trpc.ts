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
// developer > realm_owner > company_admin > sales_manager / office_manager > account_manager / coordinator
// super_admin and manager are legacy aliases; user is legacy alias for account_manager

const ROLE_LEVELS: Record<string, number> = {
  developer: 5,
  realm_owner: 4,
  super_admin: 3, // legacy alias for company_admin
  company_admin: 3,
  sales_manager: 2,
  office_manager: 2,
  manager: 2,         // legacy alias for sales_manager
  account_manager: 1,
  coordinator: 1,
  user: 1,            // legacy alias for account_manager
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

// ─── Role: Manager or above (manager, company_admin, realm_owner, developer) ───
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

// ─── Role: Company Admin or above (company_admin, realm_owner, developer) ───
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

// ─── Role: REALM Owner or above (realm_owner, developer) ───
export const realmOwnerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (getRoleLevel(ctx.user.systemRole) < ROLE_LEVELS.realm_owner) {
      throw new TRPCError({ code: "FORBIDDEN", message: "REALM Owner access or above required." });
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
