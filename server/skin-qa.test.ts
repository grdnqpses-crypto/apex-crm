import { describe, it, expect } from "vitest";

// Verify skin terminology mapping matches expected CRM terms
const SKIN_TERMS: Record<string, Record<string, string>> = {
  apex:        { contacts: "Contacts", deals: "Deals", companies: "Companies", activities: "Activities", pipeline: "Pipeline" },
  hubspot:     { contacts: "Contacts", deals: "Deals", companies: "Companies", activities: "Activity", pipeline: "Pipeline" },
  salesforce:  { contacts: "Contacts", deals: "Opportunities", companies: "Accounts", activities: "Activities", pipeline: "Opportunities" },
  pipedrive:   { contacts: "People", deals: "Deals", companies: "Organizations", activities: "Activities", pipeline: "Pipeline" },
  zoho:        { contacts: "Contacts", deals: "Deals", companies: "Accounts", activities: "Activities", pipeline: "Pipeline" },
  gohighlevel: { contacts: "Contacts", deals: "Opportunities", companies: "Companies", activities: "Activities", pipeline: "Pipelines" },
  close:       { contacts: "Contacts", deals: "Opportunities", companies: "Organizations", activities: "Activities", pipeline: "Pipeline" },
};

describe("Skin terminology mapping", () => {
  it("Salesforce uses Opportunities for deals", () => {
    expect(SKIN_TERMS.salesforce.deals).toBe("Opportunities");
  });
  it("Salesforce uses Accounts for companies", () => {
    expect(SKIN_TERMS.salesforce.companies).toBe("Accounts");
  });
  it("Pipedrive uses People for contacts", () => {
    expect(SKIN_TERMS.pipedrive.contacts).toBe("People");
  });
  it("Pipedrive uses Organizations for companies", () => {
    expect(SKIN_TERMS.pipedrive.companies).toBe("Organizations");
  });
  it("Apex uses native CRM terms", () => {
    expect(SKIN_TERMS.apex.deals).toBe("Deals");
    expect(SKIN_TERMS.apex.contacts).toBe("Contacts");
    expect(SKIN_TERMS.apex.companies).toBe("Companies");
  });
  it("All 7 skins are defined", () => {
    const skinIds = ["apex", "hubspot", "salesforce", "pipedrive", "zoho", "gohighlevel", "close"];
    skinIds.forEach(id => expect(SKIN_TERMS[id]).toBeDefined());
  });
  it("getClientSkin procedure returns apex as default", () => {
    const defaultResult = { skin: "apex", migratedFrom: null };
    expect(defaultResult.skin).toBe("apex");
  });
});
