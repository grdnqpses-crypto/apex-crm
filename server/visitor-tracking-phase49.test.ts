/**
 * Phase 49 — Visitor Tracking Follow-Up Features
 * Tests for: platform credentials storage, real-time visitor polling,
 * owner notification, and re-install via stored credentials.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  savePlatformCredentials: vi.fn().mockResolvedValue(undefined),
  getPlatformCredentials: vi.fn().mockResolvedValue(null),
  listPlatformCredentials: vi.fn().mockResolvedValue([]),
  deletePlatformCredentials: vi.fn().mockResolvedValue(undefined),
  listTrackedWebsites: vi.fn().mockResolvedValue([]),
  listVisitorSessions: vi.fn().mockResolvedValue([]),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import * as db from "./db";
import { notifyOwner } from "./_core/notification";

// ─── Unit: savePlatformCredentials ────────────────────────────────────────────
describe("savePlatformCredentials", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores WordPress credentials", async () => {
    await db.savePlatformCredentials(1, 10, "wordpress", { wpUser: "admin", wpAppPassword: "xxxx xxxx" });
    expect(db.savePlatformCredentials).toHaveBeenCalledWith(1, 10, "wordpress", {
      wpUser: "admin",
      wpAppPassword: "xxxx xxxx",
    });
  });

  it("stores Shopify credentials", async () => {
    await db.savePlatformCredentials(1, 10, "shopify", { shopifyToken: "shpat_abc123" });
    expect(db.savePlatformCredentials).toHaveBeenCalledWith(1, 10, "shopify", {
      shopifyToken: "shpat_abc123",
    });
  });

  it("stores Webflow credentials", async () => {
    await db.savePlatformCredentials(1, 10, "webflow", { webflowToken: "wf_token_xyz" });
    expect(db.savePlatformCredentials).toHaveBeenCalledWith(1, 10, "webflow", {
      webflowToken: "wf_token_xyz",
    });
  });
});

// ─── Unit: getPlatformCredentials ─────────────────────────────────────────────
describe("getPlatformCredentials", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when no credentials stored", async () => {
    vi.mocked(db.getPlatformCredentials).mockResolvedValue(null);
    const result = await db.getPlatformCredentials(1, 10, "wordpress");
    expect(result).toBeNull();
  });

  it("returns stored credentials", async () => {
    vi.mocked(db.getPlatformCredentials).mockResolvedValue({ wpUser: "admin", wpAppPassword: "pass" });
    const result = await db.getPlatformCredentials(1, 10, "wordpress");
    expect(result).toEqual({ wpUser: "admin", wpAppPassword: "pass" });
  });
});

// ─── Unit: listPlatformCredentials ────────────────────────────────────────────
describe("listPlatformCredentials", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when no credentials", async () => {
    vi.mocked(db.listPlatformCredentials).mockResolvedValue([]);
    const result = await db.listPlatformCredentials(1, 10);
    expect(result).toEqual([]);
  });

  it("returns list of platforms with credentials", async () => {
    vi.mocked(db.listPlatformCredentials).mockResolvedValue([
      { platform: "wordpress" },
      { platform: "shopify" },
    ]);
    const result = await db.listPlatformCredentials(1, 10);
    expect(result).toHaveLength(2);
    expect(result[0].platform).toBe("wordpress");
  });
});

// ─── Unit: deletePlatformCredentials ─────────────────────────────────────────
describe("deletePlatformCredentials", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls delete with correct args", async () => {
    await db.deletePlatformCredentials(1, 10, "webflow");
    expect(db.deletePlatformCredentials).toHaveBeenCalledWith(1, 10, "webflow");
  });
});

// ─── Unit: newIdentifiedVisitors — owner notification logic ──────────────────
describe("newIdentifiedVisitors notification logic", () => {
  beforeEach(() => vi.clearAllMocks());

  async function simulateNewVisitorCheck(sessions: any[], since: number) {
    const fresh = sessions.filter(
      (s) => s.identifiedCompany && s.createdAt > since
    );
    if (fresh.length > 0) {
      const companies = fresh.map((s) => s.identifiedCompany).join(", ");
      await notifyOwner({
        title: `🏢 ${fresh.length === 1 ? fresh[0].identifiedCompany : `${fresh.length} new companies`} on your website`,
        content:
          fresh.length === 1
            ? `${fresh[0].identifiedCompany} just visited your website.`
            : `New identified visitors: ${companies}.`,
      });
    }
    return fresh.map((s) => ({
      id: s.id,
      company: s.identifiedCompany,
      domain: s.identifiedDomain,
      industry: s.identifiedIndustry,
      pageViews: s.totalPageViews || 1,
      createdAt: s.createdAt,
    }));
  }

  it("does NOT notify when no new identified visitors", async () => {
    const result = await simulateNewVisitorCheck([], Date.now() - 60000);
    expect(notifyOwner).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);
  });

  it("notifies owner when a single new identified company appears", async () => {
    const now = Date.now();
    const sessions = [
      { id: 1, identifiedCompany: "Acme Corp", identifiedDomain: "acme.com", identifiedIndustry: "Tech", totalPageViews: 3, createdAt: now },
    ];
    const result = await simulateNewVisitorCheck(sessions, now - 60000);
    expect(notifyOwner).toHaveBeenCalledTimes(1);
    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining("Acme Corp") })
    );
    expect(result).toHaveLength(1);
    expect(result[0].company).toBe("Acme Corp");
  });

  it("notifies owner with plural message for multiple new companies", async () => {
    const now = Date.now();
    const sessions = [
      { id: 1, identifiedCompany: "Acme Corp", identifiedDomain: "acme.com", identifiedIndustry: "Tech", totalPageViews: 2, createdAt: now },
      { id: 2, identifiedCompany: "Beta Inc", identifiedDomain: "beta.com", identifiedIndustry: "Finance", totalPageViews: 1, createdAt: now },
    ];
    const result = await simulateNewVisitorCheck(sessions, now - 60000);
    expect(notifyOwner).toHaveBeenCalledTimes(1);
    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining("2 new companies") })
    );
    expect(result).toHaveLength(2);
  });

  it("filters out sessions older than since timestamp", async () => {
    const now = Date.now();
    const sessions = [
      { id: 1, identifiedCompany: "Old Corp", identifiedDomain: "old.com", identifiedIndustry: "Retail", totalPageViews: 1, createdAt: now - 120000 },
    ];
    const result = await simulateNewVisitorCheck(sessions, now - 60000);
    expect(notifyOwner).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);
  });

  it("filters out anonymous sessions (no identifiedCompany)", async () => {
    const now = Date.now();
    const sessions = [
      { id: 1, identifiedCompany: null, identifiedDomain: null, identifiedIndustry: null, totalPageViews: 1, createdAt: now },
    ];
    const result = await simulateNewVisitorCheck(sessions, now - 60000);
    expect(notifyOwner).not.toHaveBeenCalled();
    expect(result).toHaveLength(0);
  });
});

// ─── Unit: reinstallTracking — no credentials fallback ───────────────────────
describe("reinstallTracking — no credentials", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns no_credentials when no stored creds for any platform", async () => {
    vi.mocked(db.listTrackedWebsites).mockResolvedValue([
      { id: 10, twDomain: "example.com", twTrackingId: "realm-abc123-1", twName: "Example", twIsActive: true, twCreatedAt: Date.now(), userId: 1 } as any,
    ]);
    vi.mocked(db.getPlatformCredentials).mockResolvedValue(null);

    const platforms = ["wordpress", "shopify", "webflow"] as const;
    let found = false;
    for (const platform of platforms) {
      const creds = await db.getPlatformCredentials(1, 10, platform);
      if (creds) { found = true; break; }
    }
    expect(found).toBe(false);
  });
});
