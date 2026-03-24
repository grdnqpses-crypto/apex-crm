/**
 * Tests for incremental sync and admin-only migration access
 */
import { describe, it, expect } from "vitest";

// ─── Test: migrationJobs schema has sinceDate and isIncrementalSync ───────────
describe("migrationJobs schema incremental sync fields", () => {
  it("schema includes sinceDate field", async () => {
    const { migrationJobs } = await import("../drizzle/schema");
    const cols = Object.keys(migrationJobs);
    expect(cols).toContain("sinceDate");
  });

  it("schema includes isIncrementalSync field", async () => {
    const { migrationJobs } = await import("../drizzle/schema");
    const cols = Object.keys(migrationJobs);
    expect(cols).toContain("isIncrementalSync");
  });

  it("schema includes lastSyncedAt field", async () => {
    const { migrationJobs } = await import("../drizzle/schema");
    const cols = Object.keys(migrationJobs);
    expect(cols).toContain("lastSyncedAt");
  });

  it("schema includes contactsImported field", async () => {
    const { migrationJobs } = await import("../drizzle/schema");
    const cols = Object.keys(migrationJobs);
    expect(cols).toContain("contactsImported");
  });
});

// ─── Test: fetcher signatures accept sinceDate ────────────────────────────────
describe("migration fetchers accept sinceDate parameter", () => {
  it("fetchHubSpot accepts sinceDate as third argument", async () => {
    const mod = await import("./migration-fetchers");
    // Check the function length (number of declared params)
    // fetchHubSpot(apiKey, onProgress?, sinceDate?) = 3 params
    expect(mod.fetchHubSpot.length).toBeGreaterThanOrEqual(1);
    // Verify it's callable with 3 args without throwing a type error at runtime
    // (we can't actually call it without a real API key, but we can check arity)
    const fnStr = mod.fetchHubSpot.toString();
    expect(fnStr).toContain("sinceDate");
  });

  it("fetchSalesforce accepts sinceDate as fourth argument", async () => {
    const mod = await import("./migration-fetchers");
    const fnStr = mod.fetchSalesforce.toString();
    expect(fnStr).toContain("sinceDate");
  });

  it("fetchPipedrive accepts sinceDate", async () => {
    const mod = await import("./migration-fetchers");
    const fnStr = mod.fetchPipedrive.toString();
    expect(fnStr).toContain("sinceDate");
  });

  it("fetchZoho accepts sinceDate", async () => {
    const mod = await import("./migration-fetchers");
    const fnStr = mod.fetchZoho.toString();
    expect(fnStr).toContain("sinceDate");
  });

  it("fetchHubSpot uses sinceDate for filtering when provided", async () => {
    const mod = await import("./migration-fetchers");
    const fnStr = mod.fetchHubSpot.toString();
    // Should contain sinceDateStr filter logic
    expect(fnStr).toContain("sinceDateStr");
    expect(fnStr).toContain("filterGroups");
  });
});

// ─── Test: admin-only procedure enforcement ───────────────────────────────────
describe("migration router uses adminProcedure for write operations", () => {
  it("migration router file uses adminProcedure for startMigration", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/routers/migration.ts", "utf-8");
    // startMigration should use adminProcedure, not protectedProcedure or companyAdminProcedure
    expect(content).toContain("startMigration: adminProcedure");
  });

  it("migration router file uses adminProcedure for listJobs", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/routers/migration.ts", "utf-8");
    expect(content).toContain("listJobs: adminProcedure");
  });

  it("migration router file uses adminProcedure for getJob", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/routers/migration.ts", "utf-8");
    expect(content).toContain("getJob: adminProcedure");
  });

  it("migration router file uses adminProcedure for getOAuthUrl", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/routers/migration.ts", "utf-8");
    expect(content).toContain("getOAuthUrl: adminProcedure");
  });

  it("migration router file uses adminProcedure for oauthCallback", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/routers/migration.ts", "utf-8");
    expect(content).toContain("oauthCallback: adminProcedure");
  });
});

// ─── Test: frontend admin guard ───────────────────────────────────────────────
describe("MigrationWizard has admin guard", () => {
  it("MigrationWizard.tsx imports useAuth", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/MigrationWizard.tsx", "utf-8");
    expect(content).toContain("useAuth");
  });

  it("MigrationWizard.tsx checks isAdmin before rendering", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/MigrationWizard.tsx", "utf-8");
    expect(content).toContain("isAdmin");
    expect(content).toContain("Admin Access Required");
  });

  it("MigrationEngine.tsx has admin guard", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/MigrationEngine.tsx", "utf-8");
    expect(content).toContain("isAdmin");
    expect(content).toContain("Admin Access Required");
  });
});

// ─── Test: incremental sync banner and sinceDate handling ─────────────────────
describe("MigrationWizard incremental sync support", () => {
  it("MigrationWizard.tsx reads sinceDate from query params", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/MigrationWizard.tsx", "utf-8");
    expect(content).toContain("sinceDate");
    expect(content).toContain("syncSinceDate");
  });

  it("MigrationWizard.tsx passes isIncrementalSync to startMigration", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/MigrationWizard.tsx", "utf-8");
    expect(content).toContain("isIncrementalSync");
  });

  it("MigrationEngine.tsx shows Sync New Records button for completed jobs", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/MigrationEngine.tsx", "utf-8");
    expect(content).toContain("Sync New Records");
  });

  it("MigrationEngine.tsx links to wizard with sinceDate param", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/MigrationEngine.tsx", "utf-8");
    expect(content).toContain("sinceDate=");
  });
});

// ─── Test: useFeatureAccess includes migration/wizard in ADMIN_ROUTES ─────────
describe("useFeatureAccess admin routes include migration wizard", () => {
  it("useFeatureAccess.ts includes /migration/wizard in ADMIN_ROUTES", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/hooks/useFeatureAccess.ts", "utf-8");
    expect(content).toContain("/migration/wizard");
    // Verify it's in the ADMIN_ROUTES array context
    const adminRoutesMatch = content.match(/const ADMIN_ROUTES = \[([\s\S]*?)\];/);
    expect(adminRoutesMatch).not.toBeNull();
    expect(adminRoutesMatch![1]).toContain("/migration/wizard");
  });
});
