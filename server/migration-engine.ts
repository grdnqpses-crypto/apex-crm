/**
 * AXIOM CRM Migration Monster — AI-Powered Migration Engine
 *
 * One-button migration from any competitor CRM.
 * The AI handles all field mapping, deduplication, and import silently.
 * Users never see field mapping screens — it just works.
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import {
  contacts, companies, deals,
  customFieldDefs, customFieldValues,
  activityHistory, migrationJobs, skinPreferences,
  fieldMappingTemplates,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ─── Competitor Profiles ──────────────────────────────────────────────────────
// Each profile defines the standard fields the competitor uses, so the AI
// has context when auto-mapping to AXIOM fields.

export const COMPETITOR_PROFILES: Record<string, CompetitorProfile> = {
  hubspot: {
    name: "HubSpot",
    color: "#FF7A59",
    logo: "🟠",
    authMethod: "api_key",
    apiKeyLabel: "HubSpot Private App Token",
    apiKeyHelp: "Settings → Integrations → Private Apps → Create a private app",
    apiKeyPlaceholder: "pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    standardFields: {
      contacts: [
        "firstname", "lastname", "email", "phone", "mobilephone", "company",
        "jobtitle", "website", "address", "city", "state", "zip", "country",
        "hs_lead_status", "lifecyclestage", "hubspot_owner_id", "notes_last_updated",
        "createdate", "lastmodifieddate", "hs_email_domain", "linkedin_bio",
        "twitterhandle", "hs_analytics_source", "num_associated_deals",
      ],
      companies: [
        "name", "domain", "phone", "address", "city", "state", "zip", "country",
        "industry", "numberofemployees", "annualrevenue", "website", "description",
        "hubspot_owner_id", "hs_lead_status", "lifecyclestage", "type",
        "founded_year", "linkedin_company_page", "twitterhandle",
      ],
      deals: [
        "dealname", "amount", "dealstage", "pipeline", "closedate",
        "hubspot_owner_id", "deal_currency_code", "hs_deal_stage_probability",
        "description", "hs_priority", "hs_forecast_category",
        "num_associated_contacts", "createdate",
      ],
    },
    activityTypes: ["EMAIL", "CALL", "MEETING", "NOTE", "TASK"],
    skinKey: "hubspot",
  },

  salesforce: {
    name: "Salesforce",
    color: "#00A1E0",
    logo: "🔵",
    authMethod: "oauth",
    apiKeyLabel: "Salesforce Connected App",
    apiKeyHelp: "Setup → Apps → App Manager → New Connected App",
    apiKeyPlaceholder: "Enter your Salesforce instance URL",
    standardFields: {
      contacts: [
        "FirstName", "LastName", "Email", "Phone", "MobilePhone", "AccountId",
        "Title", "Department", "MailingStreet", "MailingCity", "MailingState",
        "MailingPostalCode", "MailingCountry", "LeadSource", "OwnerId",
        "CreatedDate", "LastModifiedDate", "Description", "LinkedIn_Profile__c",
      ],
      companies: [
        "Name", "Phone", "Website", "Industry", "NumberOfEmployees", "AnnualRevenue",
        "BillingStreet", "BillingCity", "BillingState", "BillingPostalCode",
        "BillingCountry", "Type", "OwnerId", "Description", "Rating",
        "AccountSource", "CreatedDate",
      ],
      deals: [
        "Name", "Amount", "StageName", "CloseDate", "Probability", "OwnerId",
        "AccountId", "Type", "LeadSource", "Description", "ForecastCategory",
        "CurrencyIsoCode", "CreatedDate", "LastModifiedDate",
      ],
    },
    activityTypes: ["Email", "Call", "Event", "Task"],
    skinKey: "salesforce",
  },

  pipedrive: {
    name: "Pipedrive",
    color: "#2ECC71",
    logo: "🟢",
    authMethod: "api_key",
    apiKeyLabel: "Pipedrive API Token",
    apiKeyHelp: "Settings → Personal preferences → API",
    apiKeyPlaceholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    standardFields: {
      contacts: [
        "name", "first_name", "last_name", "email", "phone", "org_id",
        "job_title", "owner_id", "add_time", "update_time", "label",
        "visible_to", "marketing_status",
      ],
      companies: [
        "name", "address", "owner_id", "add_time", "update_time",
        "label", "visible_to", "industry", "website", "phone",
      ],
      deals: [
        "title", "value", "currency", "status", "stage_id", "pipeline_id",
        "close_time", "expected_close_date", "owner_id", "person_id", "org_id",
        "probability", "add_time", "update_time", "lost_reason",
      ],
    },
    activityTypes: ["call", "meeting", "task", "deadline", "email", "lunch"],
    skinKey: "pipedrive",
  },

  zoho: {
    name: "Zoho CRM",
    color: "#E42527",
    logo: "🔴",
    authMethod: "oauth",
    apiKeyLabel: "Zoho OAuth Client",
    apiKeyHelp: "api-console.zoho.com → Add Client",
    apiKeyPlaceholder: "Enter your Zoho Client ID",
    standardFields: {
      contacts: [
        "First_Name", "Last_Name", "Email", "Phone", "Mobile", "Account_Name",
        "Title", "Department", "Mailing_Street", "Mailing_City", "Mailing_State",
        "Mailing_Zip", "Mailing_Country", "Lead_Source", "Owner", "Created_Time",
        "Modified_Time", "Description", "LinkedIn",
      ],
      companies: [
        "Account_Name", "Phone", "Website", "Industry", "Employees", "Annual_Revenue",
        "Billing_Street", "Billing_City", "Billing_State", "Billing_Code",
        "Billing_Country", "Account_Type", "Owner", "Description", "Rating",
      ],
      deals: [
        "Deal_Name", "Amount", "Stage", "Closing_Date", "Probability", "Owner",
        "Account_Name", "Type", "Lead_Source", "Description", "Pipeline",
      ],
    },
    activityTypes: ["Call", "Meeting", "Task", "Email"],
    skinKey: "zoho",
  },

  gohighlevel: {
    name: "GoHighLevel",
    color: "#F59E0B",
    logo: "🟡",
    authMethod: "api_key",
    apiKeyLabel: "GoHighLevel API Key",
    apiKeyHelp: "Settings → Business Profile → API Key",
    apiKeyPlaceholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    standardFields: {
      contacts: [
        "firstName", "lastName", "email", "phone", "address1", "city", "state",
        "postalCode", "country", "companyName", "website", "source", "tags",
        "assignedTo", "dateAdded", "dateUpdated", "customField",
      ],
      companies: [
        "name", "email", "phone", "address", "city", "state", "postalCode",
        "country", "website", "description",
      ],
      deals: [
        "name", "pipelineId", "stageId", "status", "value", "currency",
        "assignedTo", "contactId", "dateAdded",
      ],
    },
    activityTypes: ["call", "sms", "email", "appointment", "note", "task"],
    skinKey: "gohighlevel",
  },

  close: {
    name: "Close CRM",
    color: "#7C3AED",
    logo: "🟣",
    authMethod: "api_key",
    apiKeyLabel: "Close API Key",
    apiKeyHelp: "Settings → Your Profile → API Keys",
    apiKeyPlaceholder: "api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    standardFields: {
      contacts: [
        "name", "title", "emails", "phones", "urls", "lead_id",
        "created_by", "date_created", "date_updated",
      ],
      companies: [
        "name", "url", "description", "status_id", "status_label",
        "addresses", "contacts", "custom", "created_by", "date_created",
        "date_updated", "value_period", "value_currency",
      ],
      deals: [
        "lead_id", "note", "value", "value_period", "value_currency",
        "confidence", "expected_value", "date_won", "date_lost",
        "status_id", "status_label", "user_id", "date_created",
      ],
    },
    activityTypes: ["Call", "Email", "SMS", "Note", "Meeting", "Task"],
    skinKey: "close",
  },

  spreadsheet: {
    name: "Spreadsheet / CSV",
    color: "#10B981",
    logo: "📊",
    authMethod: "csv_upload",
    apiKeyLabel: "",
    apiKeyHelp: "Upload a CSV file exported from your current system",
    apiKeyPlaceholder: "",
    standardFields: { contacts: [], companies: [], deals: [] },
    activityTypes: [],
    skinKey: "axiom",
  },
};

export interface CompetitorProfile {
  name: string;
  color: string;
  logo: string;
  authMethod: "api_key" | "oauth" | "csv_upload" | "json_upload";
  apiKeyLabel: string;
  apiKeyHelp: string;
  apiKeyPlaceholder: string;
  standardFields: { contacts: string[]; companies: string[]; deals: string[] };
  activityTypes: string[];
  skinKey: string;
}

// ─── AXIOM Standard Field Map ──────────────────────────────────────────────────
// What AXIOM calls its own fields — used as the target for AI mapping

export const AXIOM_FIELDS = {
  contacts: [
    { key: "firstName", label: "First Name", type: "text" },
    { key: "lastName", label: "Last Name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "phone" },
    { key: "mobilePhone", label: "Mobile Phone", type: "phone" },
    { key: "jobTitle", label: "Job Title", type: "text" },
    { key: "companyId", label: "Company", type: "company" },
    { key: "leadSource", label: "Lead Source", type: "select" },
    { key: "status", label: "Status", type: "select" },
    { key: "address", label: "Address", type: "text" },
    { key: "city", label: "City", type: "text" },
    { key: "state", label: "State", type: "text" },
    { key: "zip", label: "ZIP Code", type: "text" },
    { key: "country", label: "Country", type: "text" },
    { key: "website", label: "Website", type: "url" },
    { key: "linkedin", label: "LinkedIn", type: "url" },
    { key: "twitter", label: "Twitter", type: "text" },
    { key: "notes", label: "Notes", type: "textarea" },
    { key: "ownerId", label: "Owner", type: "user" },
    { key: "tags", label: "Tags", type: "multiselect" },
  ],
  companies: [
    { key: "name", label: "Company Name", type: "text" },
    { key: "domain", label: "Domain", type: "url" },
    { key: "phone", label: "Phone", type: "phone" },
    { key: "industry", label: "Industry", type: "select" },
    { key: "employeeCount", label: "Employees", type: "number" },
    { key: "annualRevenue", label: "Annual Revenue", type: "currency" },
    { key: "address", label: "Address", type: "text" },
    { key: "city", label: "City", type: "text" },
    { key: "state", label: "State", type: "text" },
    { key: "zip", label: "ZIP Code", type: "text" },
    { key: "country", label: "Country", type: "text" },
    { key: "website", label: "Website", type: "url" },
    { key: "linkedin", label: "LinkedIn", type: "url" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "ownerId", label: "Owner", type: "user" },
    { key: "type", label: "Type", type: "select" },
    { key: "tags", label: "Tags", type: "multiselect" },
  ],
  deals: [
    { key: "title", label: "Deal Name", type: "text" },
    { key: "value", label: "Value", type: "currency" },
    { key: "stage", label: "Stage", type: "select" },
    { key: "pipeline", label: "Pipeline", type: "select" },
    { key: "closeDate", label: "Close Date", type: "date" },
    { key: "probability", label: "Probability %", type: "number" },
    { key: "ownerId", label: "Owner", type: "user" },
    { key: "contactId", label: "Contact", type: "contact" },
    { key: "companyId", label: "Company", type: "company" },
    { key: "leadSource", label: "Lead Source", type: "select" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "priority", label: "Priority", type: "select" },
    { key: "tags", label: "Tags", type: "multiselect" },
  ],
};

// ─── AI Field Mapper ──────────────────────────────────────────────────────────
// Uses LLM to auto-map source fields to AXIOM fields. Returns a mapping object
// plus a list of unmapped fields that need new custom field definitions.

export interface FieldMapping {
  mapped: Record<string, string>;        // sourceField → axiomField
  customFields: CustomFieldToCreate[];   // fields with no AXIOM equivalent
  confidence: Record<string, number>;    // sourceField → 0-100
}

export interface CustomFieldToCreate {
  sourceField: string;
  suggestedLabel: string;
  suggestedType: "text" | "number" | "currency" | "date" | "boolean" | "select" | "textarea" | "url" | "email" | "phone";
  objectType: "contact" | "company" | "deal";
}

export async function aiMapFields(
  sourceSystem: string,
  sourceFields: { contacts: string[]; companies: string[]; deals: string[] },
  tenantCompanyId: number
): Promise<FieldMapping> {
  const axiomFieldsJson = JSON.stringify(AXIOM_FIELDS, null, 2);
  const sourceFieldsJson = JSON.stringify(sourceFields, null, 2);

  const prompt = `You are an expert CRM data migration specialist. Map fields from ${sourceSystem} to AXIOM CRM.

AXIOM CRM FIELDS:
${axiomFieldsJson}

SOURCE SYSTEM (${sourceSystem}) FIELDS:
${sourceFieldsJson}

Return a JSON object with this exact structure:
{
  "mapped": {
    "sourceFieldName": "axiomFieldKey",
    ...
  },
  "customFields": [
    {
      "sourceField": "fieldName",
      "suggestedLabel": "Human Readable Label",
      "suggestedType": "text|number|currency|date|boolean|select|textarea|url|email|phone",
      "objectType": "contact|company|deal"
    }
  ],
  "confidence": {
    "sourceFieldName": 95,
    ...
  }
}

Rules:
1. Map every source field to the closest AXIOM field by semantic meaning, not just name
2. If a source field has no good AXIOM equivalent, add it to customFields instead
3. Confidence: 90-100 = exact match, 70-89 = strong match, 50-69 = possible match, <50 = uncertain
4. For fields like "hubspot_owner_id" → map to "ownerId"
5. For company reference fields → map to "companyId"
6. For custom fields (e.g. hs_custom_*, custom.*) → always add to customFields
7. Return ONLY valid JSON, no explanation`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a CRM migration expert. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "field_mapping",
          strict: true,
          schema: {
            type: "object",
            properties: {
              mapped: { type: "object", additionalProperties: { type: "string" } },
              customFields: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sourceField: { type: "string" },
                    suggestedLabel: { type: "string" },
                    suggestedType: { type: "string" },
                    objectType: { type: "string" },
                  },
                  required: ["sourceField", "suggestedLabel", "suggestedType", "objectType"],
                  additionalProperties: false,
                },
              },
              confidence: { type: "object", additionalProperties: { type: "number" } },
            },
            required: ["mapped", "customFields", "confidence"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from LLM");
    return JSON.parse(content as string) as FieldMapping;
  } catch (err) {
    console.error("[Migration] AI field mapping failed, using fallback:", err);
    return buildFallbackMapping(sourceSystem, sourceFields);
  }
}

// ─── Fallback Field Mapper ────────────────────────────────────────────────────
// Rule-based mapping used if LLM fails. Covers the most common field names.

function buildFallbackMapping(
  sourceSystem: string,
  sourceFields: { contacts: string[]; companies: string[]; deals: string[] }
): FieldMapping {
  const COMMON_MAPS: Record<string, string> = {
    // Names
    firstname: "firstName", first_name: "firstName", FirstName: "firstName",
    lastname: "lastName", last_name: "lastName", LastName: "lastName",
    name: "firstName",
    // Contact info
    email: "email", Email: "email",
    phone: "phone", Phone: "phone",
    mobilephone: "mobilePhone", mobile: "mobilePhone", MobilePhone: "mobilePhone",
    // Job
    jobtitle: "jobTitle", job_title: "jobTitle", Title: "jobTitle",
    // Company
    company: "companyId", company_name: "companyId", AccountId: "companyId",
    Account_Name: "companyId", org_id: "companyId",
    // Address
    address: "address", address1: "address", MailingStreet: "address",
    Billing_Street: "address", BillingStreet: "address",
    city: "city", City: "city", MailingCity: "city", BillingCity: "city",
    state: "state", State: "state", MailingState: "state", BillingState: "state",
    zip: "zip", postalCode: "zip", MailingPostalCode: "zip", BillingCode: "zip",
    country: "country", Country: "country", MailingCountry: "country",
    // Web
    website: "website", Website: "website", domain: "domain", url: "website",
    linkedin: "linkedin", linkedin_bio: "linkedin", LinkedIn: "linkedin",
    twitterhandle: "twitter", Twitter: "twitter",
    // Business
    industry: "industry", Industry: "industry",
    numberofemployees: "employeeCount", NumberOfEmployees: "employeeCount", Employees: "employeeCount",
    annualrevenue: "annualRevenue", AnnualRevenue: "annualRevenue", Annual_Revenue: "annualRevenue",
    // Ownership
    hubspot_owner_id: "ownerId", owner_id: "ownerId", OwnerId: "ownerId",
    Owner: "ownerId", assignedTo: "ownerId", user_id: "ownerId",
    // Lead/status
    hs_lead_status: "status", LeadSource: "leadSource", lead_source: "leadSource",
    source: "leadSource", AccountSource: "leadSource",
    // Deal fields
    dealname: "title", deal_name: "title", Name: "title", title: "title",
    amount: "value", Amount: "value", value: "value",
    dealstage: "stage", StageName: "stage", stage_id: "stage", Stage: "stage",
    pipeline: "pipeline", pipeline_id: "pipeline", Pipeline: "pipeline",
    closedate: "closeDate", CloseDate: "closeDate", close_time: "closeDate",
    expected_close_date: "closeDate", Closing_Date: "closeDate",
    probability: "probability", Probability: "probability",
    description: "description", Description: "description", notes: "notes",
  };

  const mapped: Record<string, string> = {};
  const customFields: CustomFieldToCreate[] = [];
  const confidence: Record<string, number> = {};

  const processFields = (fields: string[], objectType: "contact" | "company" | "deal") => {
    for (const field of fields) {
      const axiomKey = COMMON_MAPS[field] || COMMON_MAPS[field.toLowerCase()];
      if (axiomKey) {
        mapped[field] = axiomKey;
        confidence[field] = 85;
      } else if (!field.startsWith("hs_") && !field.includes("__c") && field.length < 50) {
        // Skip HubSpot internal fields and Salesforce custom fields
        customFields.push({
          sourceField: field,
          suggestedLabel: field.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim(),
          suggestedType: "text",
          objectType,
        });
        confidence[field] = 0;
      }
    }
  };

  processFields(sourceFields.contacts, "contact");
  processFields(sourceFields.companies, "company");
  processFields(sourceFields.deals, "deal");

  return { mapped, customFields, confidence };
}

// ─── AI Cheat Sheet Generator ─────────────────────────────────────────────────
// After import, generates a personalized "Your [CRM] → AXIOM cheat sheet"

export async function generateCheatSheet(
  sourceSystem: string,
  fieldMapping: FieldMapping,
  importStats: { contacts: number; companies: number; deals: number; activities: number }
): Promise<string> {
  const profile = COMPETITOR_PROFILES[sourceSystem];
  if (!profile) return "";

  const prompt = `Create a friendly, concise "migration cheat sheet" for a user who just migrated from ${profile.name} to AXIOM CRM.

Import stats: ${importStats.contacts} contacts, ${importStats.companies} companies, ${importStats.deals} deals, ${importStats.activities} activities.

Key field mappings (${sourceSystem} → AXIOM):
${Object.entries(fieldMapping.mapped).slice(0, 20).map(([src, axiom]) => `  ${src} → ${axiom}`).join("\n")}

Write a short, warm, encouraging guide (max 300 words) that:
1. Congratulates them on the successful migration
2. Shows 5-8 key "where to find things" mappings (e.g. "HubSpot Deals → AXIOM Pipeline")
3. Highlights 2-3 AXIOM features they didn't have in ${profile.name}
4. Ends with an encouraging call to action

Use plain text, no markdown headers. Keep it conversational and exciting.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a friendly CRM onboarding specialist." },
        { role: "user", content: prompt },
      ],
    });
    return (response.choices[0]?.message?.content as string) || "";
  } catch {
    return `Welcome to AXIOM CRM! Your ${profile.name} data has been successfully imported — ${importStats.contacts} contacts, ${importStats.companies} companies, and ${importStats.deals} deals are ready to go. Everything you had before is here, plus a whole lot more.`;
  }
}

// ─── Duplicate Detector ───────────────────────────────────────────────────────
// Checks for duplicate contacts/companies before inserting

export function isDuplicateContact(
  existing: { email?: string | null; firstName?: string | null; lastName?: string | null; phone?: string | null },
  incoming: { email?: string; firstName?: string; lastName?: string; phone?: string }
): boolean {
  if (existing.email && incoming.email &&
    existing.email.toLowerCase() === incoming.email.toLowerCase()) return true;
  if (existing.phone && incoming.phone &&
    existing.phone.replace(/\D/g, "") === incoming.phone.replace(/\D/g, "") &&
    existing.phone.replace(/\D/g, "").length >= 7) return true;
  if (existing.firstName && existing.lastName && incoming.firstName && incoming.lastName &&
    existing.firstName.toLowerCase() === incoming.firstName.toLowerCase() &&
    existing.lastName.toLowerCase() === incoming.lastName.toLowerCase()) return true;
  return false;
}

export function isDuplicateCompany(
  existing: { name?: string | null; domain?: string | null },
  incoming: { name?: string; domain?: string }
): boolean {
  if (existing.domain && incoming.domain &&
    existing.domain.toLowerCase().replace(/^www\./, "") ===
    incoming.domain.toLowerCase().replace(/^www\./, "")) return true;
  if (existing.name && incoming.name &&
    existing.name.toLowerCase().trim() === incoming.name.toLowerCase().trim()) return true;
  return false;
}

// ─── Stage Normalizer ─────────────────────────────────────────────────────────
// Maps competitor deal stages to AXIOM stages

const STAGE_MAPS: Record<string, Record<string, string>> = {
  hubspot: {
    "appointmentscheduled": "Qualified",
    "qualifiedtobuy": "Qualified",
    "presentationscheduled": "Proposal Sent",
    "decisionmakerboughtin": "Negotiation",
    "contractsent": "Contract Sent",
    "closedwon": "Closed Won",
    "closedlost": "Closed Lost",
  },
  salesforce: {
    "Prospecting": "Lead",
    "Qualification": "Qualified",
    "Needs Analysis": "Discovery",
    "Value Proposition": "Proposal Sent",
    "Id. Decision Makers": "Negotiation",
    "Perception Analysis": "Negotiation",
    "Proposal/Price Quote": "Proposal Sent",
    "Negotiation/Review": "Negotiation",
    "Closed Won": "Closed Won",
    "Closed Lost": "Closed Lost",
  },
  pipedrive: {
    "Lead In": "Lead",
    "Contact Made": "Contacted",
    "Qualified": "Qualified",
    "Proposal Made": "Proposal Sent",
    "Negotiations Started": "Negotiation",
    "Won": "Closed Won",
    "Lost": "Closed Lost",
  },
  zoho: {
    "Qualification": "Qualified",
    "Needs Analysis": "Discovery",
    "Value Proposition": "Proposal Sent",
    "Identify Decision Makers": "Negotiation",
    "Proposal/Price Quote": "Proposal Sent",
    "Negotiation/Review": "Negotiation",
    "Closed Won": "Closed Won",
    "Closed Lost": "Closed Lost",
  },
};

export function normalizeStage(sourceSystem: string, sourceStage: string): string {
  const map = STAGE_MAPS[sourceSystem] || {};
  return map[sourceStage] || map[sourceStage?.toLowerCase()] || sourceStage || "Lead";
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────
// Parses CSV upload and returns structured data

export function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  }).filter(row => Object.values(row).some(v => v));

  return { headers, rows };
}

// ─── Progress Tracker ─────────────────────────────────────────────────────────
// Updates migration job progress in the database

export async function updateMigrationProgress(
  jobId: number,
  updates: {
    status?: string;
    importedRecords?: number;
    totalRecords?: number;
    contactsImported?: number;
    companiesImported?: number;
    dealsImported?: number;
    activitiesImported?: number;
    customFieldsCreated?: number;
    duplicatesMerged?: number;
    errors?: { record: string; error: string }[];
  }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(migrationJobs)
    .set({
      ...updates,
      updatedAt: Date.now(),
    } as any)
    .where(eq(migrationJobs.id, jobId));
}
