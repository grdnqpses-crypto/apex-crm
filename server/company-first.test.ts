import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-company-first",
    email: "test@apexcrm.com",
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
      res: {
        clearCookie: () => {},
      } as unknown as TrpcContext["res"],
    },
  };
}

describe("Company-First Architecture", () => {
  it("allows creating a contact without companyId (optional field)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Creating a contact without companyId is now allowed (companyId is optional)
    const contact = await caller.contacts.create({
      firstName: "NoCompany",
      lastName: "Test",
    } as any);
    expect(contact).toBeDefined();
    expect(contact.id).toBeDefined();
  });

  it("creates a contact with required companyId", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a company
    const company = await caller.companies.create({
      name: "Test Company for Contact",
      domain: "testcontact.com",
    });
    expect(company.id).toBeDefined();

    // Create a contact with companyId
    const contact = await caller.contacts.create({
      firstName: "WithCompany",
      lastName: "Test",
      companyId: company.id,
      email: "withcompany@test.com",
      mobilePhone: "555-0001",
    });
    expect(contact.id).toBeDefined();

    // Verify the contact is associated with the company
    const fetched = await caller.contacts.get({ id: contact.id });
    expect(fetched?.companyId).toBe(company.id);
  });

  it("cascade deletes contacts when company is deleted", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a company
    const company = await caller.companies.create({
      name: "Cascade Delete Corp",
      domain: "cascadedelete.com",
    });

    // Create multiple contacts under this company
    const contact1 = await caller.contacts.create({
      firstName: "Alice",
      lastName: "Cascade",
      companyId: company.id,
      email: "alice@cascade.com",
      mobilePhone: "555-0002",
    });
    const contact2 = await caller.contacts.create({
      firstName: "Bob",
      lastName: "Cascade",
      companyId: company.id,
      email: "bob@cascade.com",
      mobilePhone: "555-0003",
    });

    // Verify contacts exist
    const contactsBefore = await caller.contacts.byCompany({ companyId: company.id });
    expect(contactsBefore.length).toBeGreaterThanOrEqual(2);

    // Delete the company (should cascade delete contacts)
    const result = await caller.companies.delete({ id: company.id });
    expect(result.success).toBe(true);

    // Verify contacts are gone
    const contact1After = await caller.contacts.get({ id: contact1.id });
    expect(contact1After).toBeNull();
    const contact2After = await caller.contacts.get({ id: contact2.id });
    expect(contact2After).toBeNull();
  });

  it("returns contact count for a company", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a company
    const company = await caller.companies.create({
      name: "Count Contacts Corp",
      domain: "countcontacts.com",
    });

    // Initially should have 0 contacts
    const countBefore = await caller.companies.contactCount({ companyId: company.id });
    expect(countBefore).toBe(0);

    // Add contacts
    await caller.contacts.create({ firstName: "One", companyId: company.id, email: "one@count.com", mobilePhone: "555-0010" });
    await caller.contacts.create({ firstName: "Two", companyId: company.id, email: "two@count.com", mobilePhone: "555-0011" });
    await caller.contacts.create({ firstName: "Three", companyId: company.id, email: "three@count.com", mobilePhone: "555-0012" });

    // Should now have 3 contacts
    const countAfter = await caller.companies.contactCount({ companyId: company.id });
    expect(countAfter).toBe(3);
  });

  it("lists contacts scoped by company", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create two companies
    const companyA = await caller.companies.create({ name: "Company A" });
    const companyB = await caller.companies.create({ name: "Company B" });

    // Add contacts to each
    await caller.contacts.create({ firstName: "AliceA", companyId: companyA.id, email: "alicea@compa.com", mobilePhone: "555-0020" });
    await caller.contacts.create({ firstName: "BobA", companyId: companyA.id, email: "boba@compa.com", mobilePhone: "555-0021" });
    await caller.contacts.create({ firstName: "CharlieB", companyId: companyB.id, email: "charlieb@compb.com", mobilePhone: "555-0022" });

    // byCompany should return only contacts for that company
    const contactsA = await caller.contacts.byCompany({ companyId: companyA.id });
    const contactsB = await caller.contacts.byCompany({ companyId: companyB.id });

    expect(contactsA.length).toBeGreaterThanOrEqual(2);
    expect(contactsB.length).toBeGreaterThanOrEqual(1);

    // Verify names
    const namesA = contactsA.map((c: any) => c.firstName);
    expect(namesA).toContain("AliceA");
    expect(namesA).toContain("BobA");
    expect(namesA).not.toContain("CharlieB");
  });
});
