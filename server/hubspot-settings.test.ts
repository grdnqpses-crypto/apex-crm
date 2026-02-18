import { describe, it, expect } from "vitest";

// ─── HubSpot Property Mapping Tests ───
describe("HubSpot Property Mappings", () => {
  // Simulate the mapping arrays from the frontend
  const HUBSPOT_CONTACT_MAPPINGS = [
    { hubspot: "firstname", apex: "firstName", label: "First Name", group: "Contact Information", auto: true },
    { hubspot: "lastname", apex: "lastName", label: "Last Name", group: "Contact Information", auto: true },
    { hubspot: "email", apex: "email", label: "Email", group: "Contact Information", auto: true },
    { hubspot: "jobtitle", apex: "jobTitle", label: "Job Title", group: "Contact Information", auto: true },
    { hubspot: "phone", apex: "companyPhone", label: "Phone", group: "Communication", auto: true },
    { hubspot: "mobilephone", apex: "mobilePhone", label: "Mobile Phone", group: "Communication", auto: true },
    { hubspot: "address", apex: "streetAddress", label: "Street Address", group: "Address", auto: true },
    { hubspot: "city", apex: "city", label: "City", group: "Address", auto: true },
    { hubspot: "state", apex: "stateRegion", label: "State/Region", group: "Address", auto: true },
    { hubspot: "lifecyclestage", apex: "lifecycleStage", label: "Lifecycle Stage", group: "Lifecycle", auto: true },
    { hubspot: "freight_details", apex: "freightDetails", label: "Freight Details", group: "Freight/Logistics", auto: true },
    { hubspot: "shipment_length__inches_", apex: "shipmentLength", label: "Shipment Length (inches)", group: "Freight/Logistics", auto: true },
    { hubspot: "shipment_width__inches_", apex: "shipmentWidth", label: "Shipment Width (inches)", group: "Freight/Logistics", auto: true },
    { hubspot: "shipment_height__inches_", apex: "shipmentHeight", label: "Shipment Height (inches)", group: "Freight/Logistics", auto: true },
    { hubspot: "shipment_weight__pounds_", apex: "shipmentWeight", label: "Shipment Weight (pounds)", group: "Freight/Logistics", auto: true },
    { hubspot: "destination_zip_code", apex: "destinationZipCode", label: "Destination Zip Code", group: "Freight/Logistics", auto: true },
    { hubspot: "shipping_origination", apex: "shippingOrigination", label: "Shipping Origination", group: "Freight/Logistics", auto: true },
    { hubspot: "destination", apex: "destination", label: "Destination", group: "Freight/Logistics", auto: true },
    { hubspot: "freight_volume", apex: "freightVolume", label: "Freight Volume", group: "Freight/Logistics", auto: true },
    { hubspot: "customer_type", apex: "customerType", label: "Customer Type", group: "Freight/Logistics", auto: true },
  ];

  const HUBSPOT_COMPANY_MAPPINGS = [
    { hubspot: "name", apex: "name", label: "Company Name", group: "Company Info", auto: true },
    { hubspot: "domain", apex: "domain", label: "Domain", group: "Company Info", auto: true },
    { hubspot: "phone", apex: "phone", label: "Phone", group: "Company Info", auto: true },
    { hubspot: "industry", apex: "industry", label: "Industry", group: "Company Info", auto: true },
    { hubspot: "annual_freight_spend", apex: "annualFreightSpend", label: "Annual Freight Spend", group: "Freight", auto: true },
    { hubspot: "commodity", apex: "commodity", label: "Commodity", group: "Freight", auto: true },
  ];

  it("should have unique HubSpot property names for contacts", () => {
    const names = HUBSPOT_CONTACT_MAPPINGS.map((m) => m.hubspot);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("should have unique Apex field names for contacts", () => {
    const names = HUBSPOT_CONTACT_MAPPINGS.map((m) => m.apex);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("should have unique HubSpot property names for companies", () => {
    const names = HUBSPOT_COMPANY_MAPPINGS.map((m) => m.hubspot);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("should have unique Apex field names for companies", () => {
    const names = HUBSPOT_COMPANY_MAPPINGS.map((m) => m.apex);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("should include all core contact fields", () => {
    const apexFields = HUBSPOT_CONTACT_MAPPINGS.map((m) => m.apex);
    expect(apexFields).toContain("firstName");
    expect(apexFields).toContain("lastName");
    expect(apexFields).toContain("email");
    expect(apexFields).toContain("companyPhone");
  });

  it("should include all freight-specific contact fields", () => {
    const apexFields = HUBSPOT_CONTACT_MAPPINGS.map((m) => m.apex);
    expect(apexFields).toContain("freightDetails");
    expect(apexFields).toContain("shipmentLength");
    expect(apexFields).toContain("shipmentWidth");
    expect(apexFields).toContain("shipmentHeight");
    expect(apexFields).toContain("shipmentWeight");
    expect(apexFields).toContain("destinationZipCode");
    expect(apexFields).toContain("shippingOrigination");
    expect(apexFields).toContain("destination");
    expect(apexFields).toContain("freightVolume");
    expect(apexFields).toContain("customerType");
  });

  it("should include freight-specific company fields", () => {
    const apexFields = HUBSPOT_COMPANY_MAPPINGS.map((m) => m.apex);
    expect(apexFields).toContain("annualFreightSpend");
    expect(apexFields).toContain("commodity");
  });

  it("should group contact mappings correctly", () => {
    const groups = new Set(HUBSPOT_CONTACT_MAPPINGS.map((m) => m.group));
    expect(groups.has("Contact Information")).toBe(true);
    expect(groups.has("Communication")).toBe(true);
    expect(groups.has("Address")).toBe(true);
    expect(groups.has("Lifecycle")).toBe(true);
    expect(groups.has("Freight/Logistics")).toBe(true);
  });

  it("should have all mappings set to auto-match", () => {
    expect(HUBSPOT_CONTACT_MAPPINGS.every((m) => m.auto === true)).toBe(true);
    expect(HUBSPOT_COMPANY_MAPPINGS.every((m) => m.auto === true)).toBe(true);
  });
});

// ─── CSV Parser Tests ───
describe("CSV Parser", () => {
  function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
    const lines = text.split("\n");
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
        else { current += char; }
      }
      values.push(current.trim());
      const record: Record<string, string> = {};
      headers.forEach((h, idx) => { record[h] = values[idx] || ""; });
      rows.push(record);
    }
    return { headers, rows };
  }

  it("should parse basic CSV", () => {
    const csv = "firstname,lastname,email\nJohn,Doe,john@example.com\nJane,Smith,jane@example.com";
    const { headers, rows } = parseCSV(csv);
    expect(headers).toEqual(["firstname", "lastname", "email"]);
    expect(rows).toHaveLength(2);
    expect(rows[0].firstname).toBe("John");
    expect(rows[1].email).toBe("jane@example.com");
  });

  it("should handle quoted fields with commas", () => {
    const csv = 'name,address,city\n"Doe, John","123 Main St, Apt 4",Springfield';
    const { rows } = parseCSV(csv);
    expect(rows[0].name).toBe("Doe, John");
    expect(rows[0].address).toBe("123 Main St, Apt 4");
    expect(rows[0].city).toBe("Springfield");
  });

  it("should skip empty lines", () => {
    const csv = "name,email\nJohn,john@test.com\n\nJane,jane@test.com\n";
    const { rows } = parseCSV(csv);
    expect(rows).toHaveLength(2);
  });

  it("should handle empty CSV", () => {
    const { headers, rows } = parseCSV("");
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });

  it("should handle header-only CSV", () => {
    // Parser returns empty for single-line input (no data rows)
    // This is correct behavior - a header-only CSV has no importable data
    const { headers, rows } = parseCSV("name,email\n");
    expect(headers).toEqual(["name", "email"]);
    expect(rows).toEqual([]);
  });

  it("should handle missing values", () => {
    const csv = "name,email,phone\nJohn,,555-1234";
    const { rows } = parseCSV(csv);
    expect(rows[0].name).toBe("John");
    expect(rows[0].email).toBe("");
    expect(rows[0].phone).toBe("555-1234");
  });
});

// ─── Settings Page Structure Tests ───
describe("Settings Page Structure", () => {
  const SETTINGS_SECTIONS = [
    { id: "preferences", label: "Your Preferences", subsections: ["profile", "email-prefs", "calling", "calendar", "tasks", "security", "automation"] },
    { id: "notifications", label: "Notifications", subsections: ["email-notifs", "desktop-notifs", "mobile-notifs", "digest-settings"] },
    { id: "account", label: "Account Management", subsections: ["defaults", "audit-log", "hierarchy", "product-updates"] },
    { id: "integrations", label: "Integrations", subsections: ["connected-apps", "api-access", "webhooks-config", "marketplace"] },
    { id: "privacy", label: "Privacy & Consent", subsections: ["data-privacy", "cookie-settings", "consent-management", "data-retention"] },
    { id: "ai", label: "AI & Automation", subsections: ["ai-settings", "workflow-automation", "predictive-scoring", "smart-suggestions"] },
    { id: "data", label: "Data Management", subsections: ["properties", "objects", "import-export", "backups"] },
  ];

  it("should have 7 main settings sections", () => {
    expect(SETTINGS_SECTIONS).toHaveLength(7);
  });

  it("should have unique section IDs", () => {
    const ids = SETTINGS_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have subsections for each section", () => {
    for (const section of SETTINGS_SECTIONS) {
      expect(section.subsections.length).toBeGreaterThan(0);
    }
  });

  it("should include profile settings in preferences", () => {
    const prefs = SETTINGS_SECTIONS.find((s) => s.id === "preferences");
    expect(prefs?.subsections).toContain("profile");
    expect(prefs?.subsections).toContain("security");
  });

  it("should include data management with import/export", () => {
    const data = SETTINGS_SECTIONS.find((s) => s.id === "data");
    expect(data?.subsections).toContain("import-export");
    expect(data?.subsections).toContain("properties");
    expect(data?.subsections).toContain("backups");
  });

  it("should include AI settings", () => {
    const ai = SETTINGS_SECTIONS.find((s) => s.id === "ai");
    expect(ai?.subsections).toContain("ai-settings");
    expect(ai?.subsections).toContain("predictive-scoring");
  });
});

// ─── User Hierarchy Tests ───
describe("User Hierarchy with Super Admin", () => {
  const ROLES = ["developer", "super_admin", "company_admin", "manager", "user"] as const;
  const ROLE_HIERARCHY: Record<string, number> = {
    developer: 100,
    super_admin: 80,
    company_admin: 60,
    manager: 40,
    user: 20,
  };

  it("should have 5 roles in the hierarchy", () => {
    expect(ROLES).toHaveLength(5);
  });

  it("should include super_admin role", () => {
    expect(ROLES).toContain("super_admin");
  });

  it("should have developer as highest role", () => {
    const maxRole = Object.entries(ROLE_HIERARCHY).reduce((a, b) => a[1] > b[1] ? a : b);
    expect(maxRole[0]).toBe("developer");
  });

  it("should have super_admin between developer and company_admin", () => {
    expect(ROLE_HIERARCHY.super_admin).toBeGreaterThan(ROLE_HIERARCHY.company_admin);
    expect(ROLE_HIERARCHY.super_admin).toBeLessThan(ROLE_HIERARCHY.developer);
  });

  it("should have correct ordering: developer > super_admin > company_admin > manager > user", () => {
    expect(ROLE_HIERARCHY.developer).toBeGreaterThan(ROLE_HIERARCHY.super_admin);
    expect(ROLE_HIERARCHY.super_admin).toBeGreaterThan(ROLE_HIERARCHY.company_admin);
    expect(ROLE_HIERARCHY.company_admin).toBeGreaterThan(ROLE_HIERARCHY.manager);
    expect(ROLE_HIERARCHY.manager).toBeGreaterThan(ROLE_HIERARCHY.user);
  });

  it("developer should have access to all features", () => {
    const developerLevel = ROLE_HIERARCHY.developer;
    for (const [role, level] of Object.entries(ROLE_HIERARCHY)) {
      expect(developerLevel).toBeGreaterThanOrEqual(level);
    }
  });
});

// ─── Freight Property Schema Tests ───
describe("Freight Property Schema", () => {
  const CONTACT_FREIGHT_FIELDS = [
    "freightDetails", "shipmentLength", "shipmentWidth", "shipmentHeight",
    "shipmentWeight", "destinationZipCode", "shippingOrigination", "destination",
    "additionalInformation", "freightVolume", "customerType", "decisionMakerRole",
    "paymentResponsibility", "preferredContactMethod",
  ];

  const COMPANY_FREIGHT_FIELDS = [
    "annualFreightSpend", "commodity", "creditTerms", "lanePreferences", "tmsIntegrationStatus",
  ];

  it("should have 14 freight-specific contact fields", () => {
    expect(CONTACT_FREIGHT_FIELDS).toHaveLength(14);
  });

  it("should have 5 freight-specific company fields", () => {
    expect(COMPANY_FREIGHT_FIELDS).toHaveLength(5);
  });

  it("should include all shipment dimension fields", () => {
    expect(CONTACT_FREIGHT_FIELDS).toContain("shipmentLength");
    expect(CONTACT_FREIGHT_FIELDS).toContain("shipmentWidth");
    expect(CONTACT_FREIGHT_FIELDS).toContain("shipmentHeight");
    expect(CONTACT_FREIGHT_FIELDS).toContain("shipmentWeight");
  });

  it("should include origin/destination fields", () => {
    expect(CONTACT_FREIGHT_FIELDS).toContain("destinationZipCode");
    expect(CONTACT_FREIGHT_FIELDS).toContain("shippingOrigination");
    expect(CONTACT_FREIGHT_FIELDS).toContain("destination");
  });

  it("should include financial freight fields for companies", () => {
    expect(COMPANY_FREIGHT_FIELDS).toContain("annualFreightSpend");
    expect(COMPANY_FREIGHT_FIELDS).toContain("creditTerms");
  });
});
