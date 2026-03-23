/**
 * Tests for two-stage soft-delete + admin purge authorization flow
 * Verifies: softDeleteAll creates batch, listPendingBatches works,
 * hardPurgeBatch and restoreBatch handle non-existent batches,
 * reason is required (min 10 chars)
 */
import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(tenantCompanyId: number | null = 9901): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 9901,
    openId: "test-soft-delete-user",
    name: "Test Admin",
    email: "softdelete@test.com",
    role: "admin",
    systemRole: "company_admin",
    tenantCompanyId,
    isActive: true,
    loginMethod: "password",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    ctx: {
      user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
    },
  };
}

describe("Soft-Delete + Admin Purge Flow", () => {
  it("softDeleteAll rejects reason shorter than 10 characters", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.adminData.softDeleteAll({ scope: "contacts", reason: "Too short" })
    ).rejects.toThrow();
  });

  it("softDeleteAll requires a tenant company", async () => {
    const { ctx } = createAdminContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.adminData.softDeleteAll({
        scope: "contacts",
        reason: "Testing soft delete without tenant company association",
      })
    ).rejects.toThrow("No tenant company");
  });

  it("listPendingBatches returns an array", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const batches = await caller.adminData.listPendingBatches();
    expect(Array.isArray(batches)).toBe(true);
  });

  it("hardPurgeBatch throws for non-existent batch", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.adminData.hardPurgeBatch({ batchId: "non-existent-batch-id-12345" })
    ).rejects.toThrow();
  });

  it("restoreBatch throws for non-existent batch", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.adminData.restoreBatch({ batchId: "non-existent-batch-id-12345" })
    ).rejects.toThrow();
  });

  it("softDeleteAll with valid reason returns success and batchId", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a company first so there's something to soft-delete
    const company = await caller.companies.create({
      name: `SoftDelCo-${Date.now()}`,
      industry: "Technology",
    });
    expect(company.id).toBeGreaterThan(0);

    // Soft-delete contacts scope
    const result = await caller.adminData.softDeleteAll({
      scope: "contacts",
      reason: "Integration test: verifying soft-delete creates a batch record correctly",
    });

    expect(result.success).toBe(true);
    expect(typeof result.batchId).toBe("string");
    expect(result.batchId.length).toBeGreaterThan(0);

    // Verify batch appears in pending list
    const batches = await caller.adminData.listPendingBatches();
    const ourBatch = batches.find((b: any) => b.id === result.batchId);
    expect(ourBatch).toBeDefined();
    expect(ourBatch?.status).toBe("pending");
    expect(ourBatch?.scope).toBe("contacts");
    expect(ourBatch?.reason).toContain("Integration test");

    // Restore to clean up
    const restoreResult = await caller.adminData.restoreBatch({
      batchId: result.batchId,
      adminNote: "Restored by test cleanup",
    });
    expect(restoreResult.success).toBe(true);

    // Verify status changed to restored
    const batchesAfter = await caller.adminData.listPendingBatches();
    const restoredBatch = batchesAfter.find((b: any) => b.id === result.batchId);
    expect(restoredBatch?.status).toBe("restored");

    // Clean up company
    await caller.companies.delete({ id: company.id });
  });

  it("hardPurgeBatch permanently removes soft-deleted records", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create company + contact
    const company = await caller.companies.create({
      name: `PurgeCo-${Date.now()}`,
      industry: "Logistics",
    });
    await caller.contacts.create({
      firstName: "PurgeTest",
      lastName: "Contact",
      email: `purge-${Date.now()}@test.com`,
      companyId: company.id,
      directPhone: "555-9999",
    });

    // Soft-delete all
    const result = await caller.adminData.softDeleteAll({
      scope: "all",
      reason: "Integration test: verifying hard purge permanently deletes all records",
    });
    expect(result.success).toBe(true);

    // Hard purge
    const purgeResult = await caller.adminData.hardPurgeBatch({
      batchId: result.batchId,
      adminNote: "Purged by automated test",
    });
    expect(purgeResult.success).toBe(true);
    expect(typeof purgeResult.deleted).toBe("number");

    // Verify batch status is purged
    const batches = await caller.adminData.listPendingBatches();
    const purgedBatch = batches.find((b: any) => b.id === result.batchId);
    expect(purgedBatch?.status).toBe("purged");
  });
});
