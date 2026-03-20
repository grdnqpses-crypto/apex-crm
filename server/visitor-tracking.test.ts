import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock db helpers ─────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    addTrackedWebsite: vi.fn().mockResolvedValue({ id: 42 }),
    listTrackedWebsites: vi.fn().mockResolvedValue([]),
    removeTrackedWebsite: vi.fn().mockResolvedValue(undefined),
    listVisitorSessions: vi.fn().mockResolvedValue([]),
  };
});

// ─── Mock global fetch so we don't hit real networks ─────────────────────────
const mockFetch = vi.fn();
global.fetch = mockFetch;

function createCtx(): TrpcContext {
  return {
    user: {
      id: 99,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("visitorTracking.setupTracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects WordPress and returns mailto fallback when no credentials provided", async () => {
    // Simulate a WordPress homepage
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        '<html><head></head><body><link rel="stylesheet" href="/wp-content/themes/test/style.css"></body></html>',
    } as Response);

    const caller = appRouter.createCaller(createCtx());
    const result = await caller.visitorTracking.setupTracking({ url: "https://myblog.com" });

    expect(result.platform).toBe("wordpress");
    expect(result.platformTitle).toBe("WordPress");
    expect(result.installMethod).toBe("mailto");
    expect(result.mailtoLink).toContain("mailto:");
    expect(result.mailtoLink).toContain("myblog.com");
    expect(result.trackingScript).toContain("axiomTrack");
    expect(result.trackingId).toMatch(/^axiom-/);
    expect(result.manualSteps.length).toBeGreaterThan(0);
  });

  it("detects Shopify and returns mailto fallback when no token provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        '<html><head><script src="https://cdn.shopify.com/s/files/1/0001/shop.js"></script></head></html>',
    } as Response);

    const caller = appRouter.createCaller(createCtx());
    const result = await caller.visitorTracking.setupTracking({ url: "mystore.myshopify.com" });

    expect(result.platform).toBe("shopify");
    expect(result.installMethod).toBe("mailto");
    expect(result.manualSteps.length).toBeGreaterThan(0);
  });

  it("detects Webflow and returns mailto fallback when no token provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        '<html><head></head><body data-wf-site="abc123" class="wf-form"></body></html>',
    } as Response);

    const caller = appRouter.createCaller(createCtx());
    const result = await caller.visitorTracking.setupTracking({ url: "https://mysite.webflow.io" });

    expect(result.platform).toBe("webflow");
    expect(result.installMethod).toBe("mailto");
  });

  it("returns mailto fallback for unknown platform", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => "<html><head></head><body>Hello world</body></html>",
    } as Response);

    const caller = appRouter.createCaller(createCtx());
    const result = await caller.visitorTracking.setupTracking({ url: "https://example.com" });

    expect(result.platform).toBe("custom");
    expect(result.installMethod).toBe("mailto");
    expect(result.trackingScript).toContain("axiomTrack");
  });

  it("handles unreachable website gracefully (network error)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const caller = appRouter.createCaller(createCtx());
    const result = await caller.visitorTracking.setupTracking({ url: "https://unreachable-site-xyz.com" });

    // Should still return a result with unknown platform and mailto fallback
    expect(result.platform).toBe("unknown");
    expect(result.installMethod).toBe("mailto");
    expect(result.trackingId).toMatch(/^axiom-/);
  });

  it("strips protocol and trailing slash from URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => "<html><head></head><body></body></html>",
    } as Response);

    const caller = appRouter.createCaller(createCtx());
    const result = await caller.visitorTracking.setupTracking({ url: "https://www.mysite.com/" });

    expect(result.siteName).toBe("mysite.com");
  });

  it("generates a unique trackingId per call", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "<html></html>",
    } as Response);

    const caller = appRouter.createCaller(createCtx());
    const [r1, r2] = await Promise.all([
      caller.visitorTracking.setupTracking({ url: "https://site1.com" }),
      caller.visitorTracking.setupTracking({ url: "https://site2.com" }),
    ]);

    expect(r1.trackingId).not.toBe(r2.trackingId);
  });

  it("includes the trackingId inside the generated tracking script", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => "<html></html>",
    } as Response);

    const caller = appRouter.createCaller(createCtx());
    const result = await caller.visitorTracking.setupTracking({ url: "https://mysite.com" });

    expect(result.trackingScript).toContain(result.trackingId);
  });

  it("encodes the mailto link body with the tracking script", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => "<html></html>",
    } as Response);

    const caller = appRouter.createCaller(createCtx());
    const result = await caller.visitorTracking.setupTracking({ url: "https://mysite.com" });

    expect(result.mailtoLink).not.toBeNull();
    // The mailto link body should contain the tracking ID (URL-encoded)
    expect(result.mailtoLink).toContain(encodeURIComponent(result.trackingId).slice(0, 10));
  });
});

describe("visitorTracking.listWebsites", () => {
  it("returns websites for the authenticated user", async () => {
    const { listTrackedWebsites } = await import("./db");
    vi.mocked(listTrackedWebsites).mockResolvedValueOnce([
      { id: 1, twName: "My Site", twDomain: "mysite.com", twTrackingId: "axiom-abc123-99", twIsActive: true } as any,
    ]);

    const caller = appRouter.createCaller(createCtx());
    const result = await caller.visitorTracking.listWebsites();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ twName: "My Site" });
  });
});

describe("visitorTracking.removeWebsite", () => {
  it("calls removeTrackedWebsite with the correct id and userId", async () => {
    const { removeTrackedWebsite } = await import("./db");
    vi.mocked(removeTrackedWebsite).mockResolvedValueOnce(undefined);

    const caller = appRouter.createCaller(createCtx());
    const result = await caller.visitorTracking.removeWebsite({ id: 5 });

    expect(result).toEqual({ success: true });
    expect(removeTrackedWebsite).toHaveBeenCalledWith(5, 99);
  });
});
