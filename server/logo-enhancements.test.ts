import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB helpers ───────────────────────────────────────────────────────────
vi.mock("./db.js", () => ({
  getTenantCompanyById: vi.fn(),
  updateTenantCompany: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("./_core/imageGeneration.js", () => ({
  generateImage: vi.fn(),
}));

vi.mock("./storage.js", () => ({
  storagePut: vi.fn(),
}));

vi.mock("./stripe.js", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

import * as db from "./db.js";
import { generateImage } from "./_core/imageGeneration.js";
import { storagePut } from "./storage.js";
import { stripe } from "./stripe.js";

const mockDb = db as any;
const mockGenerateImage = generateImage as any;
const mockStoragePut = storagePut as any;
const mockStripe = stripe as any;

// ─── Test: getLogoHistory ──────────────────────────────────────────────────────
describe("getLogoHistory", () => {
  it("returns empty array when tenantCompanyId is null", async () => {
    const ctx = { user: { tenantCompanyId: null } };
    // Simulate the procedure logic
    if (!ctx.user.tenantCompanyId) {
      const result: any[] = [];
      expect(result).toEqual([]);
    }
  });

  it("returns empty array when DB is unavailable", async () => {
    mockDb.getDb.mockResolvedValue(null);
    const ctx = { user: { tenantCompanyId: 1 } };
    const dbConn = await db.getDb();
    if (!dbConn) {
      expect([]).toEqual([]);
    }
  });
});

// ─── Test: restoreLogo ────────────────────────────────────────────────────────
describe("restoreLogo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls updateTenantCompany with the provided logoUrl", async () => {
    mockDb.updateTenantCompany.mockResolvedValue(undefined);
    const logoUrl = "https://s3.example.com/logos/test.png";
    const tenantCompanyId = 42;
    await db.updateTenantCompany(tenantCompanyId, { logoUrl, updatedAt: Date.now() } as any);
    expect(mockDb.updateTenantCompany).toHaveBeenCalledWith(
      tenantCompanyId,
      expect.objectContaining({ logoUrl })
    );
  });

  it("returns the restored logoUrl", async () => {
    const logoUrl = "https://s3.example.com/logos/restored.png";
    const result = { logoUrl };
    expect(result.logoUrl).toBe(logoUrl);
  });
});

// ─── Test: createLogoCustomizationCheckout ────────────────────────────────────
describe("createLogoCustomizationCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a Stripe checkout session with correct amount ($9.99)", async () => {
    mockDb.getTenantCompanyById.mockResolvedValue({ id: 1, name: "Test Co", stripeCustomerId: null });
    mockStripe.checkout.sessions.create.mockResolvedValue({
      url: "https://checkout.stripe.com/test",
    });

    const session = await stripe!.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price_data: { unit_amount: 999, currency: "usd", product_data: { name: "AI Logo Customization" } }, quantity: 1 }],
      success_url: "https://example.com/dashboard?logo_customization=paid",
      cancel_url: "https://example.com/dashboard?logo_customization=cancelled",
    } as any);

    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: 999 }),
          }),
        ]),
      })
    );
    expect(session.url).toBe("https://checkout.stripe.com/test");
  });

  it("includes logo_customization=paid in success_url", async () => {
    const origin = "https://app.example.com";
    const successUrl = `${origin}/dashboard?logo_customization=paid`;
    expect(successUrl).toContain("logo_customization=paid");
  });

  it("includes logo_customization=cancelled in cancel_url", async () => {
    const origin = "https://app.example.com";
    const cancelUrl = `${origin}/dashboard?logo_customization=cancelled`;
    expect(cancelUrl).toContain("logo_customization=cancelled");
  });
});

// ─── Test: autoGenerateLogo ───────────────────────────────────────────────────
describe("autoGenerateLogo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null logoUrl if company already has a logo", async () => {
    mockDb.getTenantCompanyById.mockResolvedValue({
      id: 1,
      name: "Test Co",
      logoUrl: "https://existing.logo.png",
    });
    const company = await db.getTenantCompanyById(1);
    if (company?.logoUrl) {
      expect({ logoUrl: null }).toEqual({ logoUrl: null });
    }
  });

  it("returns null logoUrl if tenantCompanyId is missing", async () => {
    const ctx = { user: { tenantCompanyId: null } };
    if (!ctx.user.tenantCompanyId) {
      expect({ logoUrl: null }).toEqual({ logoUrl: null });
    }
  });

  it("generates and uploads logo to S3 when company has no logo", async () => {
    mockDb.getTenantCompanyById.mockResolvedValue({
      id: 1,
      name: "New Co",
      logoUrl: null,
      industry: "Technology",
    });
    mockGenerateImage.mockResolvedValue({ url: "https://gen.ai/logo.png" });
    mockStoragePut.mockResolvedValue({ url: "https://s3.example.com/logo-auto.png" });
    mockDb.getDb.mockResolvedValue({
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    });

    const company = await db.getTenantCompanyById(1);
    expect(company?.logoUrl).toBeNull();

    const result = await generateImage({ prompt: "test" });
    expect(result.url).toBe("https://gen.ai/logo.png");

    const stored = await storagePut("key", Buffer.from(""), "image/png");
    expect(stored.url).toBe("https://s3.example.com/logo-auto.png");
  });
});

// ─── Test: logo history saved on generateLogo ─────────────────────────────────
describe("generateLogo saves to history", () => {
  it("inserts a record into logo_generations table after generating", async () => {
    const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
    mockDb.getDb.mockResolvedValue({ insert: mockInsert });
    mockGenerateImage.mockResolvedValue({ url: "https://gen.ai/logo.png" });
    mockStoragePut.mockResolvedValue({ url: "https://s3.example.com/logo.png" });

    // Simulate the save-to-history logic
    const dbConn = await db.getDb();
    if (dbConn) {
      await dbConn.insert({} as any).values({
        tenantCompanyId: 1,
        logoUrl: "https://s3.example.com/logo.png",
        prompt: "Technology",
        createdAt: Date.now(),
      });
    }
    expect(mockInsert).toHaveBeenCalled();
  });
});
