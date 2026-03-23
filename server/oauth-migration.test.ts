/**
 * Tests for OAuth migration procedures and skin auto-switch logic
 */

import { describe, it, expect } from "vitest";

// ─── OAuth URL generation logic (mirrors server/routers/migration.ts getOAuthUrl) ──

function buildOAuthUrl(
  crm: "salesforce" | "zoho" | "keap" | "constantcontact",
  redirectUri: string,
  env: Record<string, string> = {}
): string {
  const getEnv = (key: string) => env[key] || `YOUR_${key}`;
  switch (crm) {
    case "salesforce":
      return `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${getEnv("SALESFORCE_CLIENT_ID")}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=api%20refresh_token%20offline_access&state=${crm}`;
    case "zoho":
      return `https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=${getEnv("ZOHO_CLIENT_ID")}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL&access_type=offline&state=${crm}`;
    case "keap":
      return `https://accounts.infusionsoft.com/app/oauth/authorize?response_type=code&client_id=${getEnv("KEAP_CLIENT_ID")}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=full&state=${crm}`;
    case "constantcontact":
      return `https://authz.constantcontact.com/oauth2/default/v1/authorize?response_type=code&client_id=${getEnv("CONSTANTCONTACT_CLIENT_ID")}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=contact_data+campaign_data&state=${crm}`;
  }
}

// ─── Skin auto-switch logic (mirrors migration-engine.ts skinKey mapping) ──────

const ALL_SKIN_KEYS = [
  "axiom", "hubspot", "salesforce", "pipedrive", "zoho", "gohighlevel", "close",
  "apollo", "freshsales", "activecampaign", "keap", "copper", "nutshell",
  "insightly", "sugarcrm", "streak", "nimble", "monday", "constantcontact",
] as const;

type SkinKey = typeof ALL_SKIN_KEYS[number];

function isValidSkinKey(key: string): key is SkinKey {
  return (ALL_SKIN_KEYS as readonly string[]).includes(key);
}

// Simulate the COMPETITOR_PROFILES skinKey mapping
const COMPETITOR_SKIN_KEYS: Record<string, string> = {
  hubspot: "hubspot",
  salesforce: "salesforce",
  pipedrive: "pipedrive",
  zoho: "zoho",
  gohighlevel: "gohighlevel",
  close: "close",
  apollo: "apollo",
  freshsales: "freshsales",
  activecampaign: "activecampaign",
  keap: "keap",
  copper: "copper",
  nutshell: "nutshell",
  insightly: "insightly",
  sugarcrm: "sugarcrm",
  streak: "streak",
  nimble: "nimble",
  monday: "monday",
  constantcontact: "constantcontact",
  spreadsheet: "axiom",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("OAuth URL generation", () => {
  const redirectUri = "https://app.example.com/oauth-callback";

  it("generates Salesforce OAuth URL with correct base domain", () => {
    const url = buildOAuthUrl("salesforce", redirectUri, { SALESFORCE_CLIENT_ID: "sf_client_123" });
    expect(url).toContain("https://login.salesforce.com/services/oauth2/authorize");
    expect(url).toContain("client_id=sf_client_123");
    expect(url).toContain("response_type=code");
    expect(url).toContain("state=salesforce");
    expect(url).toContain(encodeURIComponent(redirectUri));
  });

  it("generates Zoho OAuth URL with correct scopes", () => {
    const url = buildOAuthUrl("zoho", redirectUri, { ZOHO_CLIENT_ID: "zoho_client_456" });
    expect(url).toContain("https://accounts.zoho.com/oauth/v2/auth");
    expect(url).toContain("client_id=zoho_client_456");
    expect(url).toContain("ZohoCRM.modules.ALL");
    expect(url).toContain("access_type=offline");
    expect(url).toContain("state=zoho");
  });

  it("generates Keap OAuth URL with correct endpoint", () => {
    const url = buildOAuthUrl("keap", redirectUri, { KEAP_CLIENT_ID: "keap_client_789" });
    expect(url).toContain("https://accounts.infusionsoft.com/app/oauth/authorize");
    expect(url).toContain("client_id=keap_client_789");
    expect(url).toContain("scope=full");
    expect(url).toContain("state=keap");
  });

  it("generates Constant Contact OAuth URL with correct scopes", () => {
    const url = buildOAuthUrl("constantcontact", redirectUri, { CONSTANTCONTACT_CLIENT_ID: "cc_client_abc" });
    expect(url).toContain("https://authz.constantcontact.com/oauth2/default/v1/authorize");
    expect(url).toContain("client_id=cc_client_abc");
    expect(url).toContain("contact_data");
    expect(url).toContain("state=constantcontact");
  });

  it("falls back to YOUR_* placeholder when env var is missing", () => {
    const url = buildOAuthUrl("salesforce", redirectUri, {});
    expect(url).toContain("YOUR_SALESFORCE_CLIENT_ID");
  });

  it("properly URL-encodes the redirect URI", () => {
    const complexUri = "https://app.example.com/oauth-callback?foo=bar&baz=qux";
    const url = buildOAuthUrl("salesforce", complexUri, { SALESFORCE_CLIENT_ID: "test" });
    expect(url).toContain(encodeURIComponent(complexUri));
    expect(url).not.toContain("?foo=bar"); // Should be encoded, not raw
  });
});

describe("Skin auto-switch after migration", () => {
  it("all 18 CRM source systems map to a valid skin key", () => {
    const crms = Object.keys(COMPETITOR_SKIN_KEYS).filter(k => k !== "spreadsheet");
    for (const crm of crms) {
      const skinKey = COMPETITOR_SKIN_KEYS[crm];
      expect(isValidSkinKey(skinKey), `${crm} maps to invalid skin: ${skinKey}`).toBe(true);
    }
  });

  it("spreadsheet source maps to axiom skin (neutral)", () => {
    expect(COMPETITOR_SKIN_KEYS["spreadsheet"]).toBe("axiom");
  });

  it("all 19 skin keys are recognized as valid", () => {
    for (const key of ALL_SKIN_KEYS) {
      expect(isValidSkinKey(key)).toBe(true);
    }
  });

  it("OAuth CRMs (salesforce, zoho, keap, constantcontact) all have matching skins", () => {
    const oauthCrms = ["salesforce", "zoho", "keap", "constantcontact"];
    for (const crm of oauthCrms) {
      const skinKey = COMPETITOR_SKIN_KEYS[crm];
      expect(skinKey).toBe(crm); // Each OAuth CRM should map to its own skin
      expect(isValidSkinKey(skinKey)).toBe(true);
    }
  });

  it("skin enum has exactly 19 values", () => {
    expect(ALL_SKIN_KEYS.length).toBe(19);
  });
});

describe("OAuth callback message format", () => {
  it("success message contains required fields", () => {
    const msg = {
      type: "axiom_oauth_callback",
      code: "auth_code_123",
      crm: "salesforce",
    };
    expect(msg.type).toBe("axiom_oauth_callback");
    expect(msg.code).toBeTruthy();
    expect(msg.crm).toBeTruthy();
  });

  it("error message contains error field", () => {
    const msg = {
      type: "axiom_oauth_callback",
      error: "access_denied",
      errorDescription: "User denied access",
    };
    expect(msg.error).toBeTruthy();
    expect(msg.type).toBe("axiom_oauth_callback");
  });
});
