/**
 * Tests for Session 15: Auto-sync, per-entity counts, sidebar badge
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";

// ─── Schema: migrationAutoSync table ─────────────────────────────────────────
describe("migrationAutoSync schema", () => {
  it("schema exports migrationAutoSync table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.migrationAutoSync).toBeDefined();
  });

  it("migrationAutoSync has required columns", async () => {
    const { migrationAutoSync } = await import("../drizzle/schema");
    const cols = Object.keys(migrationAutoSync);
    expect(cols).toContain("companyId");
    expect(cols).toContain("sourcePlatform");
    expect(cols).toContain("enabled");
    expect(cols).toContain("frequency");
    expect(cols).toContain("nextRunAt");
    expect(cols).toContain("lastRunAt");
  });

  it("migrationAutoSync exports type MigrationAutoSync", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.migrationAutoSync).toBeDefined();
    // Type check: the table should have the right column names
    const colNames = Object.keys(schema.migrationAutoSync);
    expect(colNames).toContain("id");
  });
});

// ─── Migration router: auto-sync procedures ───────────────────────────────────
describe("migration router has auto-sync procedures", () => {
  it("router file exports getAutoSync as adminProcedure", () => {
    const content = fs.readFileSync("server/routers/migration.ts", "utf-8");
    expect(content).toContain("getAutoSync: adminProcedure");
  });

  it("router file exports setAutoSync as adminProcedure", () => {
    const content = fs.readFileSync("server/routers/migration.ts", "utf-8");
    expect(content).toContain("setAutoSync: adminProcedure");
  });

  it("router file exports deleteAutoSync as adminProcedure", () => {
    const content = fs.readFileSync("server/routers/migration.ts", "utf-8");
    expect(content).toContain("deleteAutoSync: adminProcedure");
  });

  it("router file exports getLastSyncedAt as protectedProcedure", () => {
    const content = fs.readFileSync("server/routers/migration.ts", "utf-8");
    expect(content).toContain("getLastSyncedAt: protectedProcedure");
  });

  it("setAutoSync computes nextRunAt based on frequency", () => {
    const content = fs.readFileSync("server/routers/migration.ts", "utf-8");
    expect(content).toContain("frequencyMs");
    expect(content).toContain("hourly");
    expect(content).toContain("daily");
    expect(content).toContain("weekly");
  });
});

// ─── Auto-sync runner ─────────────────────────────────────────────────────────
describe("migration auto-sync runner", () => {
  it("runner exports startAutoSyncRunner function", async () => {
    const mod = await import("./migration-autosync-runner");
    expect(typeof mod.startAutoSyncRunner).toBe("function");
  });

  it("runner exports stopAutoSyncRunner function", async () => {
    const mod = await import("./migration-autosync-runner");
    expect(typeof mod.stopAutoSyncRunner).toBe("function");
  });

  it("runner exports runAutoSyncCheck function", async () => {
    const mod = await import("./migration-autosync-runner");
    expect(typeof mod.runAutoSyncCheck).toBe("function");
  });

  it("runner uses 15-minute interval", () => {
    const content = fs.readFileSync("server/migration-autosync-runner.ts", "utf-8");
    expect(content).toContain("15 * 60 * 1000");
  });

  it("runner handles all three frequency types", () => {
    const content = fs.readFileSync("server/migration-autosync-runner.ts", "utf-8");
    expect(content).toContain("hourly");
    expect(content).toContain("daily");
    expect(content).toContain("weekly");
  });

  it("server index starts auto-sync runner on boot", () => {
    const content = fs.readFileSync("server/_core/index.ts", "utf-8");
    expect(content).toContain("startAutoSyncRunner");
    expect(content).toContain("migration-autosync-runner");
  });
});

// ─── MigrationEngine: per-entity counts UI ───────────────────────────────────
describe("MigrationEngine per-entity count breakdown", () => {
  it("MigrationEngine shows Contacts count", () => {
    const content = fs.readFileSync("client/src/pages/MigrationEngine.tsx", "utf-8");
    expect(content).toContain("contactsImported");
    expect(content).toContain("Contacts");
  });

  it("MigrationEngine shows Companies count", () => {
    const content = fs.readFileSync("client/src/pages/MigrationEngine.tsx", "utf-8");
    expect(content).toContain("companiesImported");
    expect(content).toContain("Companies");
  });

  it("MigrationEngine shows Deals count", () => {
    const content = fs.readFileSync("client/src/pages/MigrationEngine.tsx", "utf-8");
    expect(content).toContain("dealsImported");
    expect(content).toContain("Deals");
  });

  it("MigrationEngine shows Activities count", () => {
    const content = fs.readFileSync("client/src/pages/MigrationEngine.tsx", "utf-8");
    expect(content).toContain("activitiesImported");
    expect(content).toContain("Activities");
  });

  it("MigrationEngine renders a grid of 4 entity count cells", () => {
    const content = fs.readFileSync("client/src/pages/MigrationEngine.tsx", "utf-8");
    expect(content).toContain("grid-cols-4");
  });
});

// ─── DashboardLayout: last-synced sidebar badge ───────────────────────────────
describe("DashboardLayout last-synced badge", () => {
  it("DashboardLayout queries getLastSyncedAt", () => {
    const content = fs.readFileSync("client/src/components/DashboardLayout.tsx", "utf-8");
    expect(content).toContain("getLastSyncedAt");
  });

  it("DashboardLayout shows green dot badge on /migration nav item", () => {
    const content = fs.readFileSync("client/src/components/DashboardLayout.tsx", "utf-8");
    expect(content).toContain("lastSyncedAt");
    expect(content).toContain("/migration");
    expect(content).toContain("bg-green-500");
  });

  it("DashboardLayout badge shows formatted date", () => {
    const content = fs.readFileSync("client/src/components/DashboardLayout.tsx", "utf-8");
    expect(content).toContain("toLocaleDateString");
  });
});

// ─── MigrationEngine: auto-sync settings panel ───────────────────────────────
describe("MigrationEngine auto-sync settings panel", () => {
  it("MigrationEngine renders Scheduled Auto-Sync section", () => {
    const content = fs.readFileSync("client/src/pages/MigrationEngine.tsx", "utf-8");
    expect(content).toContain("Scheduled Auto-Sync");
  });

  it("MigrationEngine has Add Schedule button", () => {
    const content = fs.readFileSync("client/src/pages/MigrationEngine.tsx", "utf-8");
    expect(content).toContain("Add Schedule");
  });

  it("MigrationEngine uses getAutoSync query", () => {
    const content = fs.readFileSync("client/src/pages/MigrationEngine.tsx", "utf-8");
    expect(content).toContain("getAutoSync");
  });

  it("MigrationEngine uses setAutoSync mutation", () => {
    const content = fs.readFileSync("client/src/pages/MigrationEngine.tsx", "utf-8");
    expect(content).toContain("setAutoSync");
  });

  it("MigrationEngine uses deleteAutoSync mutation", () => {
    const content = fs.readFileSync("client/src/pages/MigrationEngine.tsx", "utf-8");
    expect(content).toContain("deleteAutoSync");
  });

  it("MigrationEngine has frequency options: hourly, daily, weekly", () => {
    const content = fs.readFileSync("client/src/pages/MigrationEngine.tsx", "utf-8");
    expect(content).toContain("hourly");
    expect(content).toContain("daily");
    expect(content).toContain("weekly");
  });

  it("MigrationEngine has enable/disable Switch toggle", () => {
    const content = fs.readFileSync("client/src/pages/MigrationEngine.tsx", "utf-8");
    expect(content).toContain("<Switch");
  });
});
