import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(): { ctx: TrpcContext } {
  return {
    ctx: {
      user: {
        id: 1,
        openId: "test-fmcsa-portal",
        email: "test@axiomcrm.com",
        name: "Test User",
        loginMethod: "manus",
        role: "admin" as const,
        systemRole: "developer" as const,
        tenantCompanyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      } as any,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
    },
  };
}

// ─── FMCSA Carrier Verification Tests ────────────────────────────────────────

describe("FMCSA Carrier Verification", () => {
  it("getCached returns company with null fmcsaVerifiedAt for a new company", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const company = await caller.companies.create({
      name: "FMCSA Test Carrier " + Date.now(),
    });

    const cached = await caller.fmcsa.getCached({ companyId: company.id });
    expect(cached).not.toBeNull();
    expect(cached?.fmcsaVerifiedAt).toBeNull();
    expect(cached?.fmcsaSafetyRating).toBeNull();
    expect(cached?.fmcsaAuthorityStatus).toBeNull();
    expect(cached?.mcNumber).toBeNull();
  });

  it("lookup throws when company has no MC# or DOT#", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const company = await caller.companies.create({
      name: "No Numbers Carrier " + Date.now(),
    });

    await expect(
      caller.fmcsa.lookup({ companyId: company.id })
    ).rejects.toThrow();
  });

  it("clearCache succeeds even when no data is cached", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const company = await caller.companies.create({
      name: "Cache Clear Test " + Date.now(),
    });

    const result = await caller.fmcsa.clearCache({ companyId: company.id });
    expect(result.success).toBe(true);

    // Verify cache is still null after clear
    const cached = await caller.fmcsa.getCached({ companyId: company.id });
    expect(cached?.fmcsaVerifiedAt).toBeNull();
  });

  it("lookup returns null data with error for invalid MC# (not found in FMCSA)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const company = await caller.companies.create({
      name: "Invalid MC Test " + Date.now(),
    });

    // Use a clearly invalid MC# that won't be in FMCSA
    const result = await caller.fmcsa.lookup({
      companyId: company.id,
      mcNumber: "0000000",
    });

    // Should return null data with an error message (not throw)
    expect(result.cached).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe("string");
  });

  it("getCached returns null for a non-existent company", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const cached = await caller.fmcsa.getCached({ companyId: 999999999 });
    expect(cached).toBeNull();
  });
});

// ─── Customer Portal Token Tests ──────────────────────────────────────────────

describe("Customer Portal Tokens", () => {
  let tokenId: number;
  let tokenValue: string;

  it("creates a portal token with a label", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.portalTokens.createToken({
      label: "Test Portal - Acme Corp Q1",
      expiresInDays: 30,
    });

    expect(result.token).toBeTruthy();
    expect(result.token.length).toBe(64);
    expect(result.expiresAt).toBeGreaterThan(Date.now());
    expect(result.id).toBeGreaterThan(0);

    tokenId = result.id;
    tokenValue = result.token;
  });

  it("lists portal tokens and finds the created one", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const tokens = await caller.portalTokens.listTokens();
    expect(Array.isArray(tokens)).toBe(true);

    const found = tokens.find((t: any) => t.id === tokenId);
    expect(found).toBeDefined();
    expect(found?.label).toBe("Test Portal - Acme Corp Q1");
    expect(found?.isActive).toBe(1);
  });

  it("retrieves portal data by token (public endpoint)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const data = await caller.portalTokens.getByToken({ token: tokenValue });

    expect(data.tokenId).toBe(tokenId);
    expect(data.label).toBe("Test Portal - Acme Corp Q1");
    expect(data.contact).toBeNull();
    expect(data.deal).toBeNull();
    expect(Array.isArray(data.documents)).toBe(true);
    expect(Array.isArray(data.comments)).toBe(true);
  });

  it("increments access count on getByToken call", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Access the token again
    await caller.portalTokens.getByToken({ token: tokenValue });

    const tokens = await caller.portalTokens.listTokens();
    const found = tokens.find((t: any) => t.id === tokenId);
    expect(found?.accessCount).toBeGreaterThan(0);
  });

  it("adds an owner (rep) comment to a portal token", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.portalTokens.addOwnerComment({
      tokenId,
      content: "Hello! Your proposal is ready for review.",
    });
    expect(result.success).toBe(true);

    const comments = await caller.portalTokens.listComments({ tokenId });
    expect(comments.length).toBeGreaterThan(0);

    const repComment = comments.find((c: any) => c.authorType === "rep");
    expect(repComment).toBeDefined();
    expect(repComment?.body).toBe("Hello! Your proposal is ready for review.");
    expect(repComment?.authorName).toBe("Test User");
  });

  it("adds a customer comment via public endpoint", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.portalTokens.addContactComment({
      token: tokenValue,
      content: "Thanks! I have a question about pricing.",
      authorName: "Jane Customer",
    });
    expect(result.success).toBe(true);

    const comments = await caller.portalTokens.listComments({ tokenId });
    const customerComment = comments.find((c: any) => c.authorType === "customer");
    expect(customerComment).toBeDefined();
    expect(customerComment?.authorName).toBe("Jane Customer");
    expect(customerComment?.body).toBe("Thanks! I have a question about pricing.");
  });

  it("revokes a portal token", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.portalTokens.revokeToken({ tokenId });
    expect(result.success).toBe(true);

    const tokens = await caller.portalTokens.listTokens();
    const found = tokens.find((t: any) => t.id === tokenId);
    expect(found?.isActive).toBe(0);
  });

  it("rejects access to a revoked token", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portalTokens.getByToken({ token: tokenValue })
    ).rejects.toThrow();
  });

  it("rejects access to a non-existent token", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portalTokens.getByToken({ token: "a".repeat(64) })
    ).rejects.toThrow();
  });

  it("creates a portal token linked to a contact", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a contact
    const contact = await caller.contacts.create({
      firstName: "Portal",
      lastName: "Customer",
      email: `portal.customer.${Date.now()}@example.com`,
    });

    const result = await caller.portalTokens.createToken({
      contactId: contact.id,
      label: "Portal with Contact",
      expiresInDays: 14,
    });
    expect(result.token).toBeTruthy();

    // Verify portal data includes contact
    const data = await caller.portalTokens.getByToken({ token: result.token });
    expect(data.contact?.id).toBe(contact.id);
    expect(data.contact?.firstName).toBe("Portal");
    expect(data.deal).toBeNull();
  });
});
