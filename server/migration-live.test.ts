/**
 * Migration Live API Tests
 * Tests for the live API migration fetchers.
 * Uses mocked fetch to avoid real API calls in CI.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock fetch globally ────────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ── Import after mock setup ────────────────────────────────────────────────────
import {
  fetchHubSpot,
  fetchSalesforce,
  fetchPipedrive,
  fetchZoho,
  fetchGoHighLevel,
  fetchClose,
  type MigrationData,
} from "./migration-fetchers";

// ── Helper ─────────────────────────────────────────────────────────────────────
function mockResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

const emptyPage = { results: [], paging: null };

// ── HubSpot Tests ──────────────────────────────────────────────────────────────
describe("fetchHubSpot", () => {
  beforeEach(() => mockFetch.mockReset());

  it("fetches contacts, companies, deals, and activities", async () => {
    // HubSpot fetcher calls: contacts, companies, deals, then notes/calls/emails/meetings/tasks (5 activity types)
    mockFetch
      // Contacts page 1
      .mockResolvedValueOnce(mockResponse({
        results: [{
          id: "c1",
          properties: {
            firstname: "Alice", lastname: "Smith", email: "alice@example.com",
            phone: "+1-555-0100", jobtitle: "CEO", company: "Acme Corp",
            address: "123 Main St", city: "Austin", state: "TX",
            zip: "78701", country: "US", website: "acme.com",
          },
        }],
        paging: null,
      }))
      // Companies page 1
      .mockResolvedValueOnce(mockResponse({
        results: [{
          id: "co1",
          properties: {
            name: "Acme Corp", domain: "acme.com", phone: "+1-555-0200",
            industry: "Technology", address: "123 Main St", city: "Austin",
            state: "TX", zip: "78701", country: "US", website: "acme.com",
            description: "A great company", numberofemployees: "50",
            annualrevenue: "5000000",
          },
        }],
        paging: null,
      }))
      // Deals page 1
      .mockResolvedValueOnce(mockResponse({
        results: [{
          id: "d1",
          properties: {
            dealname: "Big Deal", amount: "50000", dealstage: "contractsent",
            closedate: "2026-06-01", description: "A big deal",
          },
        }],
        paging: null,
      }))
      // Activity type: notes
      .mockResolvedValueOnce(mockResponse({
        results: [{
          id: "a1",
          properties: {
            hs_note_body: "Called Alice, she is interested.",
            hs_timestamp: "1700000000000",
          },
        }],
        paging: null,
      }))
      // Activity type: calls (empty)
      .mockResolvedValueOnce(mockResponse({ results: [], paging: null }))
      // Activity type: emails (empty)
      .mockResolvedValueOnce(mockResponse({ results: [], paging: null }))
      // Activity type: meetings (empty)
      .mockResolvedValueOnce(mockResponse({ results: [], paging: null }))
      // Activity type: tasks (empty)
      .mockResolvedValueOnce(mockResponse({ results: [], paging: null }));

    const data: MigrationData = await fetchHubSpot("test-api-key", vi.fn());

    expect(data.contacts).toHaveLength(1);
    expect(data.contacts[0].firstName).toBe("Alice");
    expect(data.contacts[0].email).toBe("alice@example.com");
    expect(data.contacts[0].sourceId).toBe("c1");

    expect(data.companies).toHaveLength(1);
    expect(data.companies[0].name).toBe("Acme Corp");
    expect(data.companies[0].employeeCount).toBe(50);

    expect(data.deals).toHaveLength(1);
    expect(data.deals[0].title).toBe("Big Deal");
    expect(data.deals[0].value).toBe(50000);

    expect(data.activities).toHaveLength(1);
    expect(data.activities[0].type).toBe("note");
    expect(data.activities[0].body).toBe("Called Alice, she is interested.");
  });

  it("handles pagination — fetches all pages", async () => {
    mockFetch
      // Contacts page 1 with next cursor
      .mockResolvedValueOnce(mockResponse({
        results: [{ id: "c1", properties: { firstname: "Alice", lastname: "A", email: "a@a.com" } }],
        paging: { next: { after: "cursor123" } },
      }))
      // Contacts page 2 — no more pages
      .mockResolvedValueOnce(mockResponse({
        results: [{ id: "c2", properties: { firstname: "Bob", lastname: "B", email: "b@b.com" } }],
        paging: null,
      }))
      // Companies (empty)
      .mockResolvedValueOnce(mockResponse({ results: [], paging: null }))
      // Deals (empty)
      .mockResolvedValueOnce(mockResponse({ results: [], paging: null }))
      // 5 activity types (all empty)
      .mockResolvedValue(mockResponse({ results: [], paging: null }));

    const data = await fetchHubSpot("test-key", vi.fn());
    expect(data.contacts).toHaveLength(2);
    expect(data.contacts[0].firstName).toBe("Alice");
    expect(data.contacts[1].firstName).toBe("Bob");
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ message: "Unauthorized" }, false, 401));
    await expect(fetchHubSpot("bad-key", vi.fn())).rejects.toThrow("HubSpot API error 401");
  });
});

// ── Salesforce Tests ───────────────────────────────────────────────────────────
describe("fetchSalesforce", () => {
  beforeEach(() => mockFetch.mockReset());

  it("fetches contacts, accounts, opportunities, and tasks", async () => {
    mockFetch
      // Contacts SOQL
      .mockResolvedValueOnce(mockResponse({
        records: [{
          Id: "sf_c1", FirstName: "Carol", LastName: "Jones",
          Email: "carol@sf.com", Phone: "+1-555-0300", Title: "VP Sales",
          AccountId: "sf_a1", MailingStreet: "456 Oak Ave", MailingCity: "Dallas",
          MailingState: "TX", MailingPostalCode: "75201", MailingCountry: "US",
          Website: null, Description: null,
        }],
        nextRecordsUrl: null,
      }))
      // Accounts SOQL
      .mockResolvedValueOnce(mockResponse({
        records: [{
          Id: "sf_a1", Name: "SalesForce Corp", Website: "sfcorp.com",
          Phone: "+1-555-0400", Industry: "Finance", BillingStreet: "789 Elm St",
          BillingCity: "Houston", BillingState: "TX", BillingPostalCode: "77001",
          BillingCountry: "US", Description: "A finance company",
          NumberOfEmployees: 200, AnnualRevenue: 10000000,
        }],
        nextRecordsUrl: null,
      }))
      // Opportunities SOQL
      .mockResolvedValueOnce(mockResponse({
        records: [{
          Id: "sf_d1", Name: "Enterprise Deal", Amount: 100000,
          StageName: "Closed Won", CloseDate: "2026-03-15", Description: "Big win",
        }],
        nextRecordsUrl: null,
      }))
      // Tasks SOQL
      .mockResolvedValueOnce(mockResponse({
        records: [{
          Id: "sf_t1", Subject: "Follow-up call", Description: "Called Carol",
          ActivityDate: "2026-03-10", Type: "Call",
        }],
        nextRecordsUrl: null,
      }));

    const data = await fetchSalesforce("sf-token", "https://myorg.salesforce.com", vi.fn());

    expect(data.contacts).toHaveLength(1);
    expect(data.contacts[0].firstName).toBe("Carol");
    expect(data.contacts[0].sourceId).toBe("sf_c1");

    expect(data.companies).toHaveLength(1);
    expect(data.companies[0].name).toBe("SalesForce Corp");
    expect(data.companies[0].annualRevenue).toBe(10000000);

    expect(data.deals).toHaveLength(1);
    expect(data.deals[0].title).toBe("Enterprise Deal");
    expect(data.deals[0].value).toBe(100000);

    expect(data.activities).toHaveLength(1);
    expect(data.activities[0].type).toBe("call");
  });

  it("throws on Salesforce API error", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ errorCode: "INVALID_SESSION_ID" }, false, 401));
    await expect(fetchSalesforce("bad-token", "https://myorg.salesforce.com", vi.fn()))
      .rejects.toThrow("Salesforce API error 401");
  });
});

// ── Pipedrive Tests ────────────────────────────────────────────────────────────
describe("fetchPipedrive", () => {
  beforeEach(() => mockFetch.mockReset());

  it("fetches persons, organizations, deals, and activities", async () => {
    // Pipedrive returns a single `name` field (not split), and uses address_locality for city
    mockFetch
      // Persons
      .mockResolvedValueOnce(mockResponse({
        success: true,
        data: [{
          id: 1,
          name: "Dave Brown",
          email: [{ value: "dave@pd.com", primary: true }],
          phone: [{ value: "+1-555-0500", primary: true }],
          job_title: "Manager",
          org_id: { value: 10, name: "PD Corp" },
          address_locality: "Chicago",
          address_admin_area_level_1: "IL",
          address_postal_code: "60601",
          address_country: "US",
        }],
        additional_data: { pagination: { more_items_in_collection: false } },
      }))
      // Organizations
      .mockResolvedValueOnce(mockResponse({
        success: true,
        data: [{
          id: 10, name: "PD Corp",
          address_locality: "Chicago",
          address_admin_area_level_1: "IL",
          address_postal_code: "60601",
          address_country: "US",
          web: "pdcorp.com",
        }],
        additional_data: { pagination: { more_items_in_collection: false } },
      }))
      // Deals
      .mockResolvedValueOnce(mockResponse({
        success: true,
        data: [{
          id: 100, title: "PD Deal", value: 25000, currency: "USD",
          stage_name: "Qualified", status: "open", close_time: null,
        }],
        additional_data: { pagination: { more_items_in_collection: false } },
      }))
      // Activities
      .mockResolvedValueOnce(mockResponse({
        success: true,
        data: [{
          id: 200, type: "call", subject: "Discovery call",
          note: "Went well", due_date: "2026-03-01", done: true,
        }],
        additional_data: { pagination: { more_items_in_collection: false } },
      }));

    const data = await fetchPipedrive("pd-api-key", vi.fn());

    expect(data.contacts).toHaveLength(1);
    expect(data.contacts[0].firstName).toBe("Dave");
    expect(data.contacts[0].lastName).toBe("Brown");
    expect(data.contacts[0].email).toBe("dave@pd.com");

    expect(data.companies).toHaveLength(1);
    expect(data.companies[0].name).toBe("PD Corp");

    expect(data.deals).toHaveLength(1);
    expect(data.deals[0].title).toBe("PD Deal");
    expect(data.deals[0].value).toBe(25000);

    expect(data.activities).toHaveLength(1);
    expect(data.activities[0].type).toBe("call");
  });

  it("throws on Pipedrive API error", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ success: false, error: "Unauthorized" }, false, 401));
    await expect(fetchPipedrive("bad-key", vi.fn())).rejects.toThrow("Pipedrive API error 401");
  });
});

// ── Zoho Tests ─────────────────────────────────────────────────────────────────
describe("fetchZoho", () => {
  beforeEach(() => mockFetch.mockReset());

  it("fetches contacts, accounts, deals, and activities", async () => {
    mockFetch
      // Contacts
      .mockResolvedValueOnce(mockResponse({
        data: [{
          id: "z_c1", First_Name: "Eve", Last_Name: "White",
          Email: "eve@zoho.com", Phone: "+1-555-0600", Title: "Director",
          Account_Name: { name: "Zoho Corp" }, Mailing_Street: "200 Zoho Blvd",
          Mailing_City: "San Jose", Mailing_State: "CA", Mailing_Zip: "95101",
          Mailing_Country: "US", Website: "zoho.com", Description: null,
        }],
        info: { more_records: false },
      }))
      // Accounts
      .mockResolvedValueOnce(mockResponse({
        data: [{
          id: "z_a1", Account_Name: "Zoho Corp", Website: "zoho.com",
          Phone: "+1-555-0700", Industry: "Software", Billing_Street: "200 Zoho Blvd",
          Billing_City: "San Jose", Billing_State: "CA", Billing_Code: "95101",
          Billing_Country: "US", Description: "Zoho HQ", Employees: 5000,
          Annual_Revenue: 500000000,
        }],
        info: { more_records: false },
      }))
      // Deals
      .mockResolvedValueOnce(mockResponse({
        data: [{
          id: "z_d1", Deal_Name: "Zoho Deal", Amount: 75000,
          Stage: "Proposal/Price Quote", Closing_Date: "2026-04-01",
          Description: "A Zoho deal",
        }],
        info: { more_records: false },
      }))
      // Activities
      .mockResolvedValueOnce(mockResponse({
        data: [{
          id: "z_t1", Subject: "Zoho call", Activity_Type: "Call",
          Description: "Discussed pricing", Due_Date: "2026-03-05",
        }],
        info: { more_records: false },
      }));

    const data = await fetchZoho("zoho-token", vi.fn());

    expect(data.contacts).toHaveLength(1);
    expect(data.contacts[0].firstName).toBe("Eve");

    expect(data.companies).toHaveLength(1);
    expect(data.companies[0].name).toBe("Zoho Corp");

    expect(data.deals).toHaveLength(1);
    expect(data.deals[0].value).toBe(75000);

    expect(data.activities).toHaveLength(1);
    expect(data.activities[0].type).toBe("call");
  });
});

// ── GoHighLevel Tests ──────────────────────────────────────────────────────────
describe("fetchGoHighLevel", () => {
  beforeEach(() => mockFetch.mockReset());

  it("fetches contacts and opportunities", async () => {
    // GHL fetcher first calls /locations/search to get locationId, then contacts, then opportunities
    mockFetch
      // Location search
      .mockResolvedValueOnce(mockResponse({
        locations: [{ id: "loc123", name: "My Location" }],
      }))
      // Contacts page 1 (< 100 items = last page)
      .mockResolvedValueOnce(mockResponse({
        contacts: [{
          id: "ghl_c1", firstName: "Frank", lastName: "Green",
          email: "frank@ghl.com", phone: "+1-555-0800",
          address1: "300 GHL Way", city: "Miami", state: "FL",
          postalCode: "33101", country: "US",
        }],
        meta: { total: 1, currentPage: 1, nextPage: null },
      }))
      // Opportunities page 1 (< 100 items = last page)
      .mockResolvedValueOnce(mockResponse({
        opportunities: [{
          id: "ghl_o1", name: "GHL Opportunity", monetaryValue: 30000,
          pipelineStageId: "stage1", status: "open",
          estimatedClosingDate: "2026-05-01",
        }],
        meta: { total: 1, currentPage: 1, nextPage: null },
      }));

    const data = await fetchGoHighLevel("ghl-api-key", vi.fn());

    expect(data.contacts).toHaveLength(1);
    expect(data.contacts[0].firstName).toBe("Frank");
    expect(data.contacts[0].email).toBe("frank@ghl.com");

    expect(data.deals).toHaveLength(1);
    expect(data.deals[0].title).toBe("GHL Opportunity");
    expect(data.deals[0].value).toBe(30000);
  });

  it("throws on GoHighLevel auth error", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Unauthorized" }, false, 401));
    await expect(fetchGoHighLevel("bad-key", vi.fn())).rejects.toThrow("GoHighLevel auth error");
  });
});

// ── Close CRM Tests ────────────────────────────────────────────────────────────
describe("fetchClose", () => {
  beforeEach(() => mockFetch.mockReset());

  it("fetches leads (companies), contacts, opportunities, and activities", async () => {
    // Close fetcher calls: /lead (companies), /contact, /opportunity, /activity
    mockFetch
      // Leads (companies)
      .mockResolvedValueOnce(mockResponse({
        data: [{
          id: "cl_l1", display_name: "Close Corp",
          phones: [{ phone: "+1-555-0900" }],
          addresses: [{ address_1: "400 Close Ave", city: "NYC", state: "NY", zipcode: "10001", country: "US" }],
          url: "closecrm.com",
        }],
        has_more: false,
      }))
      // Contacts
      .mockResolvedValueOnce(mockResponse({
        data: [{
          id: "cl_c1", name: "Grace Hall",
          emails: [{ email: "grace@close.com", type: "office" }],
          phones: [{ phone: "+1-555-0950", type: "office" }],
          title: "Sales Rep",
          lead_id: "cl_l1",
        }],
        has_more: false,
      }))
      // Opportunities (value in cents: 45000 * 100 = 4500000)
      .mockResolvedValueOnce(mockResponse({
        data: [{
          id: "cl_o1", note: "Close Deal", value: 4500000, value_currency: "USD",
          status_label: "Active", date_won: null, lead_id: "cl_l1",
        }],
        has_more: false,
      }))
      // Activities
      .mockResolvedValueOnce(mockResponse({
        data: [{
          id: "cl_a1", type: "Call", note: "Great call with Grace",
          date_created: "2026-03-08T10:00:00Z",
        }],
        has_more: false,
      }));

    const data = await fetchClose("close-api-key", vi.fn());

    expect(data.contacts).toHaveLength(1);
    expect(data.contacts[0].firstName).toBe("Grace");
    expect(data.contacts[0].email).toBe("grace@close.com");

    expect(data.companies).toHaveLength(1);
    expect(data.companies[0].name).toBe("Close Corp");

    expect(data.deals).toHaveLength(1);
    expect(data.deals[0].value).toBe(45000); // 4500000 cents / 100

    expect(data.activities).toHaveLength(1);
    // Close activity type "Call" → lowercased to "call" then .replace("activity.", "") → "call"
    expect(data.activities[0].type).toBe("call");
  });

  it("throws on Close API error", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: "Unauthorized" }, false, 401));
    await expect(fetchClose("bad-key", vi.fn())).rejects.toThrow("Close CRM API error 401");
  });
});

// ── Normalized data shape tests ────────────────────────────────────────────────
describe("NormalizedContact shape", () => {
  it("HubSpot contact has all required fields", async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse({
        results: [{ id: "c1", properties: { firstname: "Test", lastname: "User", email: "t@t.com" } }],
        paging: null,
      }))
      .mockResolvedValueOnce(mockResponse({ results: [], paging: null }))
      .mockResolvedValueOnce(mockResponse({ results: [], paging: null }))
      .mockResolvedValue(mockResponse({ results: [], paging: null })); // 5 activity types

    const data = await fetchHubSpot("key", vi.fn());
    const ct = data.contacts[0];
    expect(ct).toHaveProperty("firstName");
    expect(ct).toHaveProperty("lastName");
    expect(ct).toHaveProperty("sourceId");
    expect(typeof ct.sourceId).toBe("string");
  });
});
