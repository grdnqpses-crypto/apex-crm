/**
 * Tests for DealDetail 360° view backend + Bulk Actions for Companies and Contacts
 */
import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { AuthenticatedUser } from "./_core/auth";

function createAuthContext() {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-deal-detail",
    email: "test@axiomcrm.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
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

/** Helper: get or create a pipeline with at least one stage */
async function getOrCreatePipeline(caller: ReturnType<typeof appRouter.createCaller>) {
  const existing = await caller.pipelines.list();
  if (existing.length > 0) {
    const stages = await caller.pipelines.stages({ pipelineId: existing[0].id });
    if (stages.length > 0) return { pipeline: existing[0], stages };
  }
  const pipeline = await caller.pipelines.create({
    name: "Test Pipeline",
    stages: [
      { name: "Prospecting", probability: 10, color: "#6366f1" },
      { name: "Proposal", probability: 50, color: "#f59e0b" },
      { name: "Closing", probability: 80, color: "#10b981" },
    ],
  });
  const stages = await caller.pipelines.stages({ pipelineId: pipeline.id });
  return { pipeline, stages };
}

describe("Deal Detail 360° View", () => {
  it("can get a deal by id with all fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create company first
    const company = await caller.companies.create({ name: "Deal Test Corp" });
    expect(company.id).toBeDefined();

    // Get or create pipeline
    const { pipeline, stages } = await getOrCreatePipeline(caller);
    expect(stages.length).toBeGreaterThan(0);

    // Create deal linked to company
    const deal = await caller.deals.create({
      name: "Test Deal 360",
      pipelineId: pipeline.id,
      stageId: stages[0].id,
      companyId: company.id,
      value: 50000,
      priority: "high",
    });
    expect(deal.id).toBeDefined();

    // Get deal by id
    const fetched = await caller.deals.get({ id: deal.id });
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe("Test Deal 360");
    expect(fetched?.companyId).toBe(company.id);
    expect(fetched?.value).toBe(50000);
    expect(fetched?.priority).toBe("high");
    expect(fetched?.status).toBe("open");
  });

  it("can update a deal inline (name, value, status, priority)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const company = await caller.companies.create({ name: "Update Deal Corp" });
    const { pipeline, stages } = await getOrCreatePipeline(caller);

    const deal = await caller.deals.create({
      name: "Original Name",
      pipelineId: pipeline.id,
      stageId: stages[0].id,
      companyId: company.id,
      value: 10000,
    });

    // Update deal inline
    const result = await caller.deals.update({
      id: deal.id,
      name: "Updated Name",
      value: 25000,
      priority: "urgent",
      notes: "Updated notes",
    });
    expect(result.success).toBe(true);

    // Verify changes
    const updated = await caller.deals.get({ id: deal.id });
    expect(updated?.name).toBe("Updated Name");
    expect(updated?.value).toBe(25000);
    expect(updated?.priority).toBe("urgent");
    expect(updated?.notes).toBe("Updated notes");
  });

  it("can mark a deal as won", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const company = await caller.companies.create({ name: "Won Lost Corp" });
    const { pipeline, stages } = await getOrCreatePipeline(caller);

    const deal = await caller.deals.create({
      name: "Win This Deal",
      pipelineId: pipeline.id,
      stageId: stages[0].id,
      companyId: company.id,
    });

    // Mark as won
    await caller.deals.update({ id: deal.id, status: "won", closedAt: Date.now() });
    const won = await caller.deals.get({ id: deal.id });
    expect(won?.status).toBe("won");
  });

  it("can list activities for a deal", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const company = await caller.companies.create({ name: "Activity Deal Corp" });
    const { pipeline, stages } = await getOrCreatePipeline(caller);

    const deal = await caller.deals.create({
      name: "Activity Deal",
      pipelineId: pipeline.id,
      stageId: stages[0].id,
      companyId: company.id,
    });

    // Log an activity
    await caller.activities.create({
      dealId: deal.id,
      type: "note",
      subject: "Test note on deal",
      body: "This is a test note",
    });

    // List activities for this deal
    const activities = await caller.activities.list({ dealId: deal.id, limit: 10 });
    expect(activities.length).toBeGreaterThanOrEqual(1);
    const note = activities.find((a: any) => a.subject === "Test note on deal");
    expect(note).toBeDefined();
  });

  it("can list tasks for a deal via crossFeature.tasksByDeal", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const company = await caller.companies.create({ name: "Task Deal Corp" });
    const { pipeline, stages } = await getOrCreatePipeline(caller);

    const deal = await caller.deals.create({
      name: "Task Deal",
      pipelineId: pipeline.id,
      stageId: stages[0].id,
      companyId: company.id,
    });

    // Create a task linked to the deal
    await caller.tasks.create({
      title: "Follow up on Task Deal",
      dealId: deal.id,
      companyId: company.id,
      type: "call",
      priority: "high",
    });

    // List tasks for this deal
    const tasks = await caller.crossFeature.tasksByDeal({ dealId: deal.id });
    expect(tasks.length).toBeGreaterThanOrEqual(1);
    const task = tasks.find((t: any) => t.title === "Follow up on Task Deal");
    expect(task).toBeDefined();
  });
});

describe("Bulk Actions - Companies", () => {
  it("bulk updates multiple companies (assign leadStatus)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const c1 = await caller.companies.create({ name: "Bulk Update Corp 1" });
    const c2 = await caller.companies.create({ name: "Bulk Update Corp 2" });

    // Bulk update via bulkActions.updateCompanies
    const result = await caller.bulkActions.updateCompanies({
      ids: [c1.id, c2.id],
      updates: { leadStatus: "Customer" },
    });
    expect(result.updated).toBe(2);
  });

  it("bulk deletes companies via individual delete calls", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const c1 = await caller.companies.create({ name: "Bulk Del Corp A" });
    const c2 = await caller.companies.create({ name: "Bulk Del Corp B" });

    // Companies bulk delete uses individual delete calls (one per company)
    const r1 = await caller.companies.delete({ id: c1.id });
    const r2 = await caller.companies.delete({ id: c2.id });
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });
});

describe("Bulk Actions - Contacts", () => {
  it("bulk deletes multiple contacts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const company = await caller.companies.create({ name: "Bulk Contact Corp" });
    const contact1 = await caller.contacts.create({
      firstName: "BulkDel1",
      companyId: company.id,
      email: "bulkdel1@test.com",
      mobilePhone: "555-1001",
    });
    const contact2 = await caller.contacts.create({
      firstName: "BulkDel2",
      companyId: company.id,
      email: "bulkdel2@test.com",
      mobilePhone: "555-1002",
    });

    const result = await caller.bulkActions.deleteContacts({ ids: [contact1.id, contact2.id] });
    expect(result.success).toBe(true);
    expect(result.deleted).toBe(2);
  });

  it("bulk updates multiple contacts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const company = await caller.companies.create({ name: "Bulk Update Contact Corp" });
    const contact1 = await caller.contacts.create({
      firstName: "BulkUpd1",
      companyId: company.id,
      email: "bulkupd1@test.com",
      mobilePhone: "555-2001",
    });
    const contact2 = await caller.contacts.create({
      firstName: "BulkUpd2",
      companyId: company.id,
      email: "bulkupd2@test.com",
      mobilePhone: "555-2002",
    });

    const result = await caller.bulkActions.updateContacts({
      ids: [contact1.id, contact2.id],
      updates: { leadStatus: "Qualified" },
    });
    expect(result.success).toBe(true);
    expect(result.updated).toBe(2);
  });
});
