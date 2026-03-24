/**
 * Migration Fetchers
 * Real live API calls to pull data from competitor CRMs.
 * Each fetcher returns a normalized MigrationData object.
 */

export interface NormalizedContact {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  website?: string;
  notes?: string;
  linkedinUrl?: string;
  sourceId: string;
  customFields?: Record<string, string>;
}

export interface NormalizedCompany {
  name: string;
  domain?: string;
  phone?: string;
  industry?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  website?: string;
  description?: string;
  employeeCount?: number;
  annualRevenue?: number;
  sourceId: string;
  customFields?: Record<string, string>;
}

export interface NormalizedDeal {
  title: string;
  value?: number;
  currency?: string;
  stage: string;
  status?: string;
  closeDate?: number;
  description?: string;
  contactSourceId?: string;
  companySourceId?: string;
  sourceId: string;
  customFields?: Record<string, string>;
}

export interface NormalizedActivity {
  type: string;
  subject?: string;
  body?: string;
  occurredAt: number;
  contactSourceId?: string;
  companySourceId?: string;
  dealSourceId?: string;
  sourceId: string;
}

export interface MigrationData {
  contacts: NormalizedContact[];
  companies: NormalizedCompany[];
  deals: NormalizedDeal[];
  activities: NormalizedActivity[];
}

// ─── Progress callback type ───────────────────────────────────────────────────
export type ProgressCallback = (fetched: {
  contacts?: number;
  companies?: number;
  deals?: number;
  activities?: number;
  total?: number;
}) => Promise<void>;

// ─── Generic paginated fetch helper ──────────────────────────────────────────
async function fetchAllPages<T>(
  fetchPage: (cursor?: string) => Promise<{ items: T[]; nextCursor?: string }>,
  onProgress?: (count: number) => void
): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | undefined;
  do {
    const { items, nextCursor } = await fetchPage(cursor);
    all.push(...items);
    cursor = nextCursor;
    onProgress?.(all.length);
    // Respect rate limits — small delay between pages
    if (cursor) await sleep(200);
  } while (cursor);
  return all;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── HubSpot Live Fetcher ─────────────────────────────────────────────────────
export async function fetchHubSpot(
  apiKey: string,
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const BASE = "https://api.hubapi.com";

  // Helper: fetch all pages from HubSpot CRM v3
  async function hubspotPages<T>(
    path: string,
    params: Record<string, string> = {},
    transform: (item: any) => T
  ): Promise<T[]> {
    return fetchAllPages(async (after) => {
      const query = new URLSearchParams({ limit: "100", ...params, ...(after ? { after } : {}) });
      const res = await fetch(`${BASE}${path}?${query}`, { headers });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`HubSpot API error ${res.status}: ${err}`);
      }
      const json = await res.json();
      return {
        items: (json.results || []).map(transform),
        nextCursor: json.paging?.next?.after,
      };
    });
  }

  // Build sinceDate filter string for HubSpot (ISO 8601)
  const sinceDateStr = sinceDate ? sinceDate.toISOString() : undefined;

  // Contacts
  const contacts = await hubspotPages<NormalizedContact>(
    "/crm/v3/objects/contacts",
    { properties: "firstname,lastname,email,phone,jobtitle,company,address,city,state,zip,country,website,notes,hs_linkedin_url", ...(sinceDateStr ? { filterGroups: JSON.stringify([{ filters: [{ propertyName: "lastmodifieddate", operator: "GTE", value: sinceDateStr }] }]) } : {}) },
    (c) => ({
      firstName: c.properties.firstname || "",
      lastName: c.properties.lastname || "",
      email: c.properties.email || undefined,
      phone: c.properties.phone || undefined,
      jobTitle: c.properties.jobtitle || undefined,
      company: c.properties.company || undefined,
      address: c.properties.address || undefined,
      city: c.properties.city || undefined,
      state: c.properties.state || undefined,
      zip: c.properties.zip || undefined,
      country: c.properties.country || undefined,
      website: c.properties.website || undefined,
      notes: c.properties.notes || undefined,
      linkedinUrl: c.properties.hs_linkedin_url || undefined,
      sourceId: c.id,
    })
  );
  await onProgress?.({ contacts: contacts.length });

  // Companies
  const companies = await hubspotPages<NormalizedCompany>(
    "/crm/v3/objects/companies",
    { properties: "name,domain,phone,industry,address,city,state,zip,country,website,description,numberofemployees,annualrevenue", ...(sinceDateStr ? { filterGroups: JSON.stringify([{ filters: [{ propertyName: "hs_lastmodifieddate", operator: "GTE", value: sinceDateStr }] }]) } : {}) },
    (c) => ({
      name: c.properties.name || "Unknown Company",
      domain: c.properties.domain || undefined,
      phone: c.properties.phone || undefined,
      industry: c.properties.industry || undefined,
      address: c.properties.address || undefined,
      city: c.properties.city || undefined,
      state: c.properties.state || undefined,
      zip: c.properties.zip || undefined,
      country: c.properties.country || undefined,
      website: c.properties.website || undefined,
      description: c.properties.description || undefined,
      employeeCount: c.properties.numberofemployees ? parseInt(c.properties.numberofemployees) : undefined,
      annualRevenue: c.properties.annualrevenue ? parseFloat(c.properties.annualrevenue) : undefined,
      sourceId: c.id,
    })
  );
  await onProgress?.({ companies: companies.length });

  // Deals
  const deals = await hubspotPages<NormalizedDeal>(
    "/crm/v3/objects/deals",
    { properties: "dealname,amount,dealstage,closedate,description,pipeline", ...(sinceDateStr ? { filterGroups: JSON.stringify([{ filters: [{ propertyName: "hs_lastmodifieddate", operator: "GTE", value: sinceDateStr }] }]) } : {}) },
    (d) => ({
      title: d.properties.dealname || "Imported Deal",
      value: d.properties.amount ? parseFloat(d.properties.amount) : undefined,
      stage: d.properties.dealstage || "Lead",
      closeDate: d.properties.closedate ? new Date(d.properties.closedate).getTime() : undefined,
      description: d.properties.description || undefined,
      sourceId: d.id,
    })
  );
  await onProgress?.({ deals: deals.length });

  // Activities (engagements: notes, calls, emails, meetings, tasks)
  const activities: NormalizedActivity[] = [];
  for (const engType of ["notes", "calls", "emails", "meetings", "tasks"]) {
    try {
      const items = await hubspotPages<NormalizedActivity>(
        `/crm/v3/objects/${engType}`,
        { properties: "hs_note_body,hs_call_body,hs_email_subject,hs_meeting_title,hs_task_subject,hs_timestamp,hs_createdate" },
        (e) => ({
          type: engType.slice(0, -1), // notes→note, calls→call, etc.
          subject: e.properties.hs_meeting_title || e.properties.hs_task_subject || e.properties.hs_email_subject || engType,
          body: e.properties.hs_note_body || e.properties.hs_call_body || undefined,
          occurredAt: e.properties.hs_timestamp
            ? new Date(e.properties.hs_timestamp).getTime()
            : e.properties.hs_createdate
              ? new Date(e.properties.hs_createdate).getTime()
              : Date.now(),
          sourceId: e.id,
        })
      );
      activities.push(...items);
    } catch {
      // Some engagement types may not exist — skip silently
    }
  }
  await onProgress?.({ activities: activities.length });

  return { contacts, companies, deals, activities };
}

// ─── Salesforce Live Fetcher ──────────────────────────────────────────────────
export async function fetchSalesforce(
  accessToken: string,
  instanceUrl: string,
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  async function soqlQuery<T>(soql: string, transform: (row: any) => T): Promise<T[]> {
    const all: T[] = [];
    let url: string | undefined = `${instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent(soql)}`;
    while (url) {
      const sfRes: Response = await fetch(url, { headers });
      if (!sfRes.ok) {
        const err = await sfRes.text();
        throw new Error(`Salesforce API error ${sfRes.status}: ${err}`);
      }
      const sfJson: any = await sfRes.json();
      all.push(...(sfJson.records || []).map(transform));
      url = sfJson.nextRecordsUrl ? `${instanceUrl}${sfJson.nextRecordsUrl}` : undefined;
      if (url) await sleep(200);
    }
    return all;
  }

  const contacts = await soqlQuery<NormalizedContact>(
    "SELECT Id,FirstName,LastName,Email,Phone,Title,AccountId,MailingStreet,MailingCity,MailingState,MailingPostalCode,MailingCountry,Website,Description FROM Contact LIMIT 10000",
    (r) => ({
      firstName: r.FirstName || "",
      lastName: r.LastName || "",
      email: r.Email || undefined,
      phone: r.Phone || undefined,
      jobTitle: r.Title || undefined,
      address: r.MailingStreet || undefined,
      city: r.MailingCity || undefined,
      state: r.MailingState || undefined,
      zip: r.MailingPostalCode || undefined,
      country: r.MailingCountry || undefined,
      website: r.Website || undefined,
      notes: r.Description || undefined,
      sourceId: r.Id,
    })
  );
  await onProgress?.({ contacts: contacts.length });

  const companies = await soqlQuery<NormalizedCompany>(
    "SELECT Id,Name,Website,Phone,Industry,BillingStreet,BillingCity,BillingState,BillingPostalCode,BillingCountry,Description,NumberOfEmployees,AnnualRevenue FROM Account LIMIT 10000",
    (r) => ({
      name: r.Name || "Unknown",
      domain: r.Website || undefined,
      phone: r.Phone || undefined,
      industry: r.Industry || undefined,
      address: r.BillingStreet || undefined,
      city: r.BillingCity || undefined,
      state: r.BillingState || undefined,
      zip: r.BillingPostalCode || undefined,
      country: r.BillingCountry || undefined,
      website: r.Website || undefined,
      description: r.Description || undefined,
      employeeCount: r.NumberOfEmployees || undefined,
      annualRevenue: r.AnnualRevenue || undefined,
      sourceId: r.Id,
    })
  );
  await onProgress?.({ companies: companies.length });

  const deals = await soqlQuery<NormalizedDeal>(
    "SELECT Id,Name,Amount,StageName,CloseDate,Description,AccountId FROM Opportunity LIMIT 10000",
    (r) => ({
      title: r.Name || "Imported Deal",
      value: r.Amount || undefined,
      stage: r.StageName || "Lead",
      closeDate: r.CloseDate ? new Date(r.CloseDate).getTime() : undefined,
      description: r.Description || undefined,
      companySourceId: r.AccountId || undefined,
      sourceId: r.Id,
    })
  );
  await onProgress?.({ deals: deals.length });

  const activities = await soqlQuery<NormalizedActivity>(
    "SELECT Id,Subject,Description,ActivityDate,Type,WhoId,WhatId FROM Activity LIMIT 10000",
    (r) => ({
      type: (r.Type || "task").toLowerCase(),
      subject: r.Subject || undefined,
      body: r.Description || undefined,
      occurredAt: r.ActivityDate ? new Date(r.ActivityDate).getTime() : Date.now(),
      contactSourceId: r.WhoId || undefined,
      companySourceId: r.WhatId || undefined,
      sourceId: r.Id,
    })
  );
  await onProgress?.({ activities: activities.length });

  return { contacts, companies, deals, activities };
}

// ─── Pipedrive Live Fetcher ───────────────────────────────────────────────────
export async function fetchPipedrive(
  apiKey: string,
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const BASE = "https://api.pipedrive.com/v1";

  async function pipedrivePages<T>(
    path: string,
    transform: (item: any) => T
  ): Promise<T[]> {
    return fetchAllPages(async (start) => {
      const res = await fetch(
        `${BASE}${path}?api_token=${apiKey}&limit=500&start=${start || 0}`
      );
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Pipedrive API error ${res.status}: ${err}`);
      }
      const json = await res.json();
      const items = (json.data || []).map(transform);
      const nextStart = json.additional_data?.pagination?.next_start;
      return {
        items,
        nextCursor: nextStart !== undefined ? String(nextStart) : undefined,
      };
    });
  }

  const contacts = await pipedrivePages<NormalizedContact>(
    "/persons",
    (p) => ({
      firstName: (p.name || "").split(" ")[0] || "",
      lastName: (p.name || "").split(" ").slice(1).join(" ") || "",
      email: p.email?.[0]?.value || undefined,
      phone: p.phone?.[0]?.value || undefined,
      jobTitle: p.job_title || undefined,
      company: p.org_name || undefined,
      address: p.address || undefined,
      city: p.address_locality || undefined,
      state: p.address_admin_area_level_1 || undefined,
      zip: p.address_postal_code || undefined,
      country: p.address_country || undefined,
      linkedinUrl: p.linkedin || undefined,
      sourceId: String(p.id),
    })
  );
  await onProgress?.({ contacts: contacts.length });

  const companies = await pipedrivePages<NormalizedCompany>(
    "/organizations",
    (o) => ({
      name: o.name || "Unknown",
      phone: o.phone?.[0]?.value || undefined,
      address: o.address || undefined,
      city: o.address_locality || undefined,
      state: o.address_admin_area_level_1 || undefined,
      zip: o.address_postal_code || undefined,
      country: o.address_country || undefined,
      website: o.web || undefined,
      sourceId: String(o.id),
    })
  );
  await onProgress?.({ companies: companies.length });

  const deals = await pipedrivePages<NormalizedDeal>(
    "/deals",
    (d) => ({
      title: d.title || "Imported Deal",
      value: d.value || undefined,
      currency: d.currency || undefined,
      stage: d.stage_name || "Lead",
      status: d.status || undefined,
      closeDate: d.close_time ? new Date(d.close_time).getTime() : undefined,
      contactSourceId: d.person_id ? String(d.person_id.value || d.person_id) : undefined,
      companySourceId: d.org_id ? String(d.org_id.value || d.org_id) : undefined,
      sourceId: String(d.id),
    })
  );
  await onProgress?.({ deals: deals.length });

  const activities = await pipedrivePages<NormalizedActivity>(
    "/activities",
    (a) => ({
      type: (a.type || "task").toLowerCase(),
      subject: a.subject || undefined,
      body: a.note || undefined,
      occurredAt: a.due_date ? new Date(a.due_date).getTime() : Date.now(),
      contactSourceId: a.person_id ? String(a.person_id) : undefined,
      companySourceId: a.org_id ? String(a.org_id) : undefined,
      dealSourceId: a.deal_id ? String(a.deal_id) : undefined,
      sourceId: String(a.id),
    })
  );
  await onProgress?.({ activities: activities.length });

  return { contacts, companies, deals, activities };
}

// ─── Zoho CRM Live Fetcher ────────────────────────────────────────────────────
export async function fetchZoho(
  accessToken: string,
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const BASE = "https://www.zohoapis.com/crm/v3";
  const headers = {
    Authorization: `Zoho-oauthtoken ${accessToken}`,
    "Content-Type": "application/json",
  };

  async function zohoPages<T>(
    module: string,
    fields: string,
    transform: (item: any) => T
  ): Promise<T[]> {
    return fetchAllPages(async (page) => {
      const pageNum = page ? parseInt(page) : 1;
      const res = await fetch(
        `${BASE}/${module}?fields=${fields}&per_page=200&page=${pageNum}`,
        { headers }
      );
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Zoho API error ${res.status}: ${err}`);
      }
      const json = await res.json();
      const items = (json.data || []).map(transform);
      const hasMore = json.info?.more_records;
      return {
        items,
        nextCursor: hasMore ? String(pageNum + 1) : undefined,
      };
    });
  }

  const contacts = await zohoPages<NormalizedContact>(
    "Contacts",
    "First_Name,Last_Name,Email,Phone,Title,Account_Name,Mailing_Street,Mailing_City,Mailing_State,Mailing_Zip,Mailing_Country,Website,Description,LinkedIn__c",
    (c) => ({
      firstName: c.First_Name || "",
      lastName: c.Last_Name || "",
      email: c.Email || undefined,
      phone: c.Phone || undefined,
      jobTitle: c.Title || undefined,
      company: c.Account_Name?.name || undefined,
      address: c.Mailing_Street || undefined,
      city: c.Mailing_City || undefined,
      state: c.Mailing_State || undefined,
      zip: c.Mailing_Zip || undefined,
      country: c.Mailing_Country || undefined,
      website: c.Website || undefined,
      notes: c.Description || undefined,
      linkedinUrl: c.LinkedIn__c || undefined,
      sourceId: c.id,
    })
  );
  await onProgress?.({ contacts: contacts.length });

  const companies = await zohoPages<NormalizedCompany>(
    "Accounts",
    "Account_Name,Website,Phone,Industry,Billing_Street,Billing_City,Billing_State,Billing_Code,Billing_Country,Description,Employees,Annual_Revenue",
    (a) => ({
      name: a.Account_Name || "Unknown",
      domain: a.Website || undefined,
      phone: a.Phone || undefined,
      industry: a.Industry || undefined,
      address: a.Billing_Street || undefined,
      city: a.Billing_City || undefined,
      state: a.Billing_State || undefined,
      zip: a.Billing_Code || undefined,
      country: a.Billing_Country || undefined,
      website: a.Website || undefined,
      description: a.Description || undefined,
      employeeCount: a.Employees || undefined,
      annualRevenue: a.Annual_Revenue || undefined,
      sourceId: a.id,
    })
  );
  await onProgress?.({ companies: companies.length });

  const deals = await zohoPages<NormalizedDeal>(
    "Deals",
    "Deal_Name,Amount,Stage,Closing_Date,Description,Account_Name,Contact_Name",
    (d) => ({
      title: d.Deal_Name || "Imported Deal",
      value: d.Amount || undefined,
      stage: d.Stage || "Lead",
      closeDate: d.Closing_Date ? new Date(d.Closing_Date).getTime() : undefined,
      description: d.Description || undefined,
      companySourceId: d.Account_Name?.id || undefined,
      contactSourceId: d.Contact_Name?.id || undefined,
      sourceId: d.id,
    })
  );
  await onProgress?.({ deals: deals.length });

  const activities = await zohoPages<NormalizedActivity>(
    "Activities",
    "Subject,Description,Activity_Type,Due_Date,Who_Id,What_Id",
    (a) => ({
      type: (a.Activity_Type || "task").toLowerCase(),
      subject: a.Subject || undefined,
      body: a.Description || undefined,
      occurredAt: a.Due_Date ? new Date(a.Due_Date).getTime() : Date.now(),
      contactSourceId: a.Who_Id?.id || undefined,
      companySourceId: a.What_Id?.id || undefined,
      sourceId: a.id,
    })
  );
  await onProgress?.({ activities: activities.length });

  return { contacts, companies, deals, activities };
}

// ─── GoHighLevel Live Fetcher ─────────────────────────────────────────────────
export async function fetchGoHighLevel(
  apiKey: string,
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const BASE = "https://rest.gohighlevel.com/v1";
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // First get the location ID
  const locRes = await fetch(`${BASE}/locations/search`, { headers });
  if (!locRes.ok) throw new Error(`GoHighLevel auth error: ${locRes.status}`);
  const locJson = await locRes.json();
  const locationId = locJson.locations?.[0]?.id;
  if (!locationId) throw new Error("No GoHighLevel location found for this API key");

  // Contacts
  const contacts: NormalizedContact[] = [];
  let contactPage = 1;
  while (true) {
    const res = await fetch(
      `${BASE}/contacts/?locationId=${locationId}&limit=100&page=${contactPage}`,
      { headers }
    );
    if (!res.ok) break;
    const json = await res.json();
    const items = json.contacts || [];
    if (items.length === 0) break;
    for (const c of items) {
      contacts.push({
        firstName: c.firstName || "",
        lastName: c.lastName || "",
        email: c.email || undefined,
        phone: c.phone || undefined,
        address: c.address1 || undefined,
        city: c.city || undefined,
        state: c.state || undefined,
        zip: c.postalCode || undefined,
        country: c.country || undefined,
        website: c.website || undefined,
        notes: c.notes || undefined,
        sourceId: c.id,
      });
    }
    if (items.length < 100) break;
    contactPage++;
    await sleep(200);
  }
  await onProgress?.({ contacts: contacts.length });

  // Opportunities (deals)
  const deals: NormalizedDeal[] = [];
  let oppPage = 1;
  while (true) {
    const res = await fetch(
      `${BASE}/opportunities/search?location_id=${locationId}&limit=100&page=${oppPage}`,
      { headers }
    );
    if (!res.ok) break;
    const json = await res.json();
    const items = json.opportunities || [];
    if (items.length === 0) break;
    for (const o of items) {
      deals.push({
        title: o.name || "Imported Deal",
        value: o.monetaryValue || undefined,
        stage: o.pipelineStageId || "Lead",
        status: o.status || undefined,
        contactSourceId: o.contactId || undefined,
        sourceId: o.id,
      });
    }
    if (items.length < 100) break;
    oppPage++;
    await sleep(200);
  }
  await onProgress?.({ deals: deals.length });

  return { contacts, companies: [], deals, activities: [] };
}

// ─── Close CRM Live Fetcher ───────────────────────────────────────────────────
export async function fetchClose(
  apiKey: string,
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const BASE = "https://api.close.com/api/v1";
  const auth = Buffer.from(`${apiKey}:`).toString("base64");
  const headers = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };

  // Close uses cursor-based pagination with _skip
  async function closePages<T>(
    path: string,
    transform: (item: any) => T
  ): Promise<T[]> {
    const all: T[] = [];
    let skip = 0;
    while (true) {
      const res = await fetch(`${BASE}${path}?_limit=100&_skip=${skip}`, { headers });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Close CRM API error ${res.status}: ${err}`);
      }
      const json = await res.json();
      const items = json.data || [];
      all.push(...items.map(transform));
      if (!json.has_more) break;
      skip += 100;
      await sleep(200);
    }
    return all;
  }

  // Close uses Leads (companies) + Contacts
  const companies = await closePages<NormalizedCompany>(
    "/lead",
    (l) => ({
      name: l.display_name || l.name || "Unknown",
      phone: l.phones?.[0]?.phone || undefined,
      address: l.addresses?.[0]?.address_1 || undefined,
      city: l.addresses?.[0]?.city || undefined,
      state: l.addresses?.[0]?.state || undefined,
      zip: l.addresses?.[0]?.zipcode || undefined,
      country: l.addresses?.[0]?.country || undefined,
      website: l.url || undefined,
      description: l.description || undefined,
      sourceId: l.id,
    })
  );
  await onProgress?.({ companies: companies.length });

  const contacts = await closePages<NormalizedContact>(
    "/contact",
    (c) => ({
      firstName: (c.name || "").split(" ")[0] || "",
      lastName: (c.name || "").split(" ").slice(1).join(" ") || "",
      email: c.emails?.[0]?.email || undefined,
      phone: c.phones?.[0]?.phone || undefined,
      jobTitle: c.title || undefined,
      company: c.lead_name || undefined,
      companySourceId: c.lead_id || undefined,
      sourceId: c.id,
    } as NormalizedContact)
  );
  await onProgress?.({ contacts: contacts.length });

  // Opportunities
  const deals = await closePages<NormalizedDeal>(
    "/opportunity",
    (o) => ({
      title: o.note || o.lead_name || "Imported Deal",
      value: o.value ? o.value / 100 : undefined, // Close stores in cents
      currency: o.value_currency || undefined,
      stage: o.status_label || "Lead",
      status: o.status_type || undefined,
      closeDate: o.date_won ? new Date(o.date_won).getTime() : undefined,
      companySourceId: o.lead_id || undefined,
      contactSourceId: o.contact_id || undefined,
      sourceId: o.id,
    })
  );
  await onProgress?.({ deals: deals.length });

  // Activities
  const activities = await closePages<NormalizedActivity>(
    "/activity",
    (a) => ({
      type: (a.type || "note").replace("activity.", "").toLowerCase(),
      subject: a.subject || undefined,
      body: a.body || a.note || undefined,
      occurredAt: a.date_created ? new Date(a.date_created).getTime() : Date.now(),
      contactSourceId: a.contact_id || undefined,
      companySourceId: a.lead_id || undefined,
      sourceId: a.id,
    })
  );
  await onProgress?.({ activities: activities.length });

  return { contacts, companies, deals, activities };
}


// ─── Apollo.io ────────────────────────────────────────────────────────────────
export async function fetchApollo(
  credentials: { apiKey: string },
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-cache", "X-Api-Key": credentials.apiKey };
  const base = "https://api.apollo.io/v1";

  // Contacts (people)
  const contacts: NormalizedContact[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${base}/mixed_people/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ page, per_page: 200, sort_by_field: "contact_updated_at", sort_ascending: false })
    });
    const json: any = await res.json();
    const people = json.people || [];
    if (!people.length) break;
    for (const p of people) {
      contacts.push({
        firstName: p.first_name || "",
        lastName: p.last_name || "",
        email: p.email || undefined,
        phone: p.phone_numbers?.[0]?.raw_number || undefined,
        jobTitle: p.title || undefined,
        company: p.organization?.name || undefined,
        city: p.city || undefined,
        state: p.state || undefined,
        country: p.country || undefined,
        linkedinUrl: p.linkedin_url || undefined,
        sourceId: p.id,
      });
    }
    await onProgress?.({ contacts: contacts.length });
    if (people.length < 200) break;
    page++;
  }

  // Companies (accounts)
  const companies: NormalizedCompany[] = [];
  page = 1;
  while (true) {
    const res = await fetch(`${base}/mixed_companies/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ page, per_page: 200 })
    });
    const json: any = await res.json();
    const accts = json.accounts || [];
    if (!accts.length) break;
    for (const a of accts) {
      companies.push({
        name: a.name,
        domain: a.domain || undefined,
        phone: a.phone || undefined,
        industry: a.industry || undefined,
        city: a.city || undefined,
        state: a.state || undefined,
        country: a.country || undefined,
        website: a.website_url || undefined,
        employeeCount: a.estimated_num_employees || undefined,
        annualRevenue: a.annual_revenue || undefined,
        sourceId: a.id,
      });
    }
    await onProgress?.({ companies: companies.length });
    if (accts.length < 200) break;
    page++;
  }

  return { contacts, companies, deals: [], activities: [] };
}

// ─── Freshsales ───────────────────────────────────────────────────────────────
export async function fetchFreshsales(
  credentials: { apiKey: string; subdomain: string },
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const base = `https://${credentials.subdomain}.freshsales.io/api`;
  const headers = { Authorization: `Token token=${credentials.apiKey}`, "Content-Type": "application/json" };

  const contacts: NormalizedContact[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${base}/contacts?page=${page}&per_page=100`, { headers });
    const json: any = await res.json();
    const items = json.contacts || [];
    if (!items.length) break;
    for (const c of items) {
      contacts.push({
        firstName: c.first_name || "",
        lastName: c.last_name || "",
        email: c.email || undefined,
        phone: c.work_number || c.mobile_number || undefined,
        jobTitle: c.job_title || undefined,
        company: c.company?.name || undefined,
        city: c.city || undefined,
        state: c.state || undefined,
        country: c.country || undefined,
        linkedinUrl: c.linkedin || undefined,
        sourceId: String(c.id),
      });
    }
    await onProgress?.({ contacts: contacts.length });
    if (items.length < 100) break;
    page++;
  }

  const companies: NormalizedCompany[] = [];
  page = 1;
  while (true) {
    const res = await fetch(`${base}/accounts?page=${page}&per_page=100`, { headers });
    const json: any = await res.json();
    const items = json.accounts || [];
    if (!items.length) break;
    for (const a of items) {
      companies.push({
        name: a.name,
        phone: a.phone || undefined,
        industry: a.industry_type?.name || undefined,
        city: a.city || undefined,
        state: a.state || undefined,
        country: a.country || undefined,
        website: a.website || undefined,
        employeeCount: a.number_of_employees || undefined,
        annualRevenue: a.annual_revenue || undefined,
        sourceId: String(a.id),
      });
    }
    await onProgress?.({ companies: companies.length });
    if (items.length < 100) break;
    page++;
  }

  const deals: NormalizedDeal[] = [];
  page = 1;
  while (true) {
    const res = await fetch(`${base}/deals?page=${page}&per_page=100`, { headers });
    const json: any = await res.json();
    const items = json.deals || [];
    if (!items.length) break;
    for (const d of items) {
      deals.push({
        title: d.name,
        value: d.amount || undefined,
        stage: d.deal_stage?.name || "Prospecting",
        closeDate: d.expected_close ? new Date(d.expected_close).getTime() : undefined,
        sourceId: String(d.id),
      });
    }
    await onProgress?.({ deals: deals.length });
    if (items.length < 100) break;
    page++;
  }

  return { contacts, companies, deals, activities: [] };
}

// ─── ActiveCampaign ───────────────────────────────────────────────────────────
export async function fetchActiveCampaign(
  credentials: { apiKey: string; accountUrl: string },
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const base = credentials.accountUrl.replace(/\/$/, "");
  const headers = { "Api-Token": credentials.apiKey, "Content-Type": "application/json" };

  const contacts: NormalizedContact[] = [];
  let offset = 0;
  while (true) {
    const res = await fetch(`${base}/api/3/contacts?limit=100&offset=${offset}`, { headers });
    const json: any = await res.json();
    const items = json.contacts || [];
    if (!items.length) break;
    for (const c of items) {
      contacts.push({
        firstName: c.firstName || "",
        lastName: c.lastName || "",
        email: c.email || undefined,
        phone: c.phone || undefined,
        company: c.orgname || undefined,
        city: c.city || undefined,
        state: c.state || undefined,
        country: c.country || undefined,
        sourceId: String(c.id),
      });
    }
    await onProgress?.({ contacts: contacts.length });
    if (items.length < 100) break;
    offset += 100;
  }

  const companies: NormalizedCompany[] = [];
  offset = 0;
  while (true) {
    const res = await fetch(`${base}/api/3/accounts?limit=100&offset=${offset}`, { headers });
    const json: any = await res.json();
    const items = json.accounts || [];
    if (!items.length) break;
    for (const a of items) {
      companies.push({
        name: a.name,
        phone: a.phone || undefined,
        website: a.website || undefined,
        sourceId: String(a.id),
      });
    }
    await onProgress?.({ companies: companies.length });
    if (items.length < 100) break;
    offset += 100;
  }

  const deals: NormalizedDeal[] = [];
  offset = 0;
  while (true) {
    const res = await fetch(`${base}/api/3/deals?limit=100&offset=${offset}`, { headers });
    const json: any = await res.json();
    const items = json.deals || [];
    if (!items.length) break;
    for (const d of items) {
      deals.push({
        title: d.title,
        value: d.value ? d.value / 100 : undefined,
        stage: d.stage || "Prospecting",
        closeDate: d.edate ? new Date(d.edate).getTime() : undefined,
        sourceId: String(d.id),
      });
    }
    await onProgress?.({ deals: deals.length });
    if (items.length < 100) break;
    offset += 100;
  }

  return { contacts, companies, deals, activities: [] };
}

// ─── Keap / Infusionsoft ──────────────────────────────────────────────────────
export async function fetchKeap(
  credentials: { apiKey: string },
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const base = "https://api.infusionsoft.com/crm/rest/v1";
  const headers = { "X-Keap-API-Key": credentials.apiKey, "Content-Type": "application/json" };

  const contacts: NormalizedContact[] = [];
  let offset = 0;
  while (true) {
    const res = await fetch(`${base}/contacts?limit=1000&offset=${offset}&optional_properties=email_addresses,phone_numbers,addresses,job_title,company`, { headers });
    const json: any = await res.json();
    const items = json.contacts || [];
    if (!items.length) break;
    for (const c of items) {
      contacts.push({
        firstName: c.given_name || "",
        lastName: c.family_name || "",
        email: c.email_addresses?.[0]?.email || undefined,
        phone: c.phone_numbers?.[0]?.number || undefined,
        jobTitle: c.job_title || undefined,
        company: c.company?.company_name || undefined,
        city: c.addresses?.[0]?.locality || undefined,
        state: c.addresses?.[0]?.region || undefined,
        country: c.addresses?.[0]?.country_code || undefined,
        sourceId: String(c.id),
      });
    }
    await onProgress?.({ contacts: contacts.length });
    if (items.length < 1000) break;
    offset += 1000;
  }

  const companies: NormalizedCompany[] = [];
  offset = 0;
  while (true) {
    const res = await fetch(`${base}/companies?limit=1000&offset=${offset}`, { headers });
    const json: any = await res.json();
    const items = json.companies || [];
    if (!items.length) break;
    for (const a of items) {
      companies.push({
        name: a.company_name,
        phone: a.phone_number?.number || undefined,
        website: a.website || undefined,
        city: a.address?.locality || undefined,
        state: a.address?.region || undefined,
        country: a.address?.country_code || undefined,
        sourceId: String(a.id),
      });
    }
    await onProgress?.({ companies: companies.length });
    if (items.length < 1000) break;
    offset += 1000;
  }

  return { contacts, companies, deals: [], activities: [] };
}

// ─── Copper CRM ───────────────────────────────────────────────────────────────
export async function fetchCopper(
  credentials: { apiKey: string; userEmail: string },
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const base = "https://api.copper.com/developer_api/v1";
  const headers = {
    "X-PW-AccessToken": credentials.apiKey,
    "X-PW-Application": "developer_api",
    "X-PW-UserEmail": credentials.userEmail,
    "Content-Type": "application/json"
  };

  const contacts: NormalizedContact[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${base}/people/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ page_size: 200, page_number: page })
    });
    const items: any[] = await res.json();
    if (!items.length) break;
    for (const c of items) {
      contacts.push({
        firstName: (c.name || "").split(" ")[0] || "",
        lastName: (c.name || "").split(" ").slice(1).join(" ") || "",
        email: c.emails?.[0]?.email || undefined,
        phone: c.phone_numbers?.[0]?.number || undefined,
        jobTitle: c.title || undefined,
        company: c.company_name || undefined,
        city: c.address?.city || undefined,
        state: c.address?.state || undefined,
        country: c.address?.country || undefined,
        website: c.websites?.[0]?.url || undefined,
        sourceId: String(c.id),
      });
    }
    await onProgress?.({ contacts: contacts.length });
    if (items.length < 200) break;
    page++;
  }

  const companies: NormalizedCompany[] = [];
  page = 1;
  while (true) {
    const res = await fetch(`${base}/companies/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ page_size: 200, page_number: page })
    });
    const items: any[] = await res.json();
    if (!items.length) break;
    for (const a of items) {
      companies.push({
        name: a.name,
        phone: a.phone_numbers?.[0]?.number || undefined,
        website: a.websites?.[0]?.url || undefined,
        city: a.address?.city || undefined,
        state: a.address?.state || undefined,
        country: a.address?.country || undefined,
        employeeCount: a.details?.num_employees || undefined,
        annualRevenue: a.details?.annual_revenue || undefined,
        sourceId: String(a.id),
      });
    }
    await onProgress?.({ companies: companies.length });
    if (items.length < 200) break;
    page++;
  }

  const deals: NormalizedDeal[] = [];
  page = 1;
  while (true) {
    const res = await fetch(`${base}/opportunities/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ page_size: 200, page_number: page })
    });
    const items: any[] = await res.json();
    if (!items.length) break;
    for (const d of items) {
      deals.push({
        title: d.name,
        value: d.monetary_value || undefined,
        stage: d.pipeline_stage?.name || "Prospecting",
        closeDate: d.close_date ? d.close_date * 1000 : undefined,
        sourceId: String(d.id),
      });
    }
    await onProgress?.({ deals: deals.length });
    if (items.length < 200) break;
    page++;
  }

  return { contacts, companies, deals, activities: [] };
}

// ─── Nutshell CRM ─────────────────────────────────────────────────────────────
export async function fetchNutshell(
  credentials: { username: string; apiKey: string },
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const base = "https://app.nutshell.com/api/v1/json";
  const auth = Buffer.from(`${credentials.username}:${credentials.apiKey}`).toString("base64");
  const headers = { Authorization: `Basic ${auth}`, "Content-Type": "application/json" };

  const rpc = async (method: string, params: Record<string, unknown>) => {
    const res = await fetch(base, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", method, params, id: Date.now() })
    });
    const json: any = await res.json();
    return json.result;
  };

  const contacts: NormalizedContact[] = [];
  let page = 1;
  while (true) {
    const result = await rpc("findContacts", { query: {}, page, perPage: 200, orderBy: "name", orderDirection: "ASC" });
    const items = result || [];
    if (!items.length) break;
    for (const c of items) {
      contacts.push({
        firstName: c.name?.givenName || "",
        lastName: c.name?.familyName || "",
        email: c.email?.[0]?.value || undefined,
        phone: c.phone?.[0]?.value || undefined,
        jobTitle: c.jobTitle || undefined,
        city: c.address?.city || undefined,
        state: c.address?.state || undefined,
        country: c.address?.country || undefined,
        sourceId: String(c.id),
      });
    }
    await onProgress?.({ contacts: contacts.length });
    if (items.length < 200) break;
    page++;
  }

  const companies: NormalizedCompany[] = [];
  page = 1;
  while (true) {
    const result = await rpc("findAccounts", { query: {}, page, perPage: 200, orderBy: "name", orderDirection: "ASC" });
    const items = result || [];
    if (!items.length) break;
    for (const a of items) {
      companies.push({
        name: a.name,
        phone: a.phone?.[0]?.value || undefined,
        website: a.url?.[0]?.value || undefined,
        city: a.address?.city || undefined,
        state: a.address?.state || undefined,
        country: a.address?.country || undefined,
        sourceId: String(a.id),
      });
    }
    await onProgress?.({ companies: companies.length });
    if (items.length < 200) break;
    page++;
  }

  const deals: NormalizedDeal[] = [];
  page = 1;
  while (true) {
    const result = await rpc("findLeads", { query: {}, page, perPage: 200, orderBy: "name", orderDirection: "ASC" });
    const items = result || [];
    if (!items.length) break;
    for (const d of items) {
      deals.push({
        title: d.name || `Lead #${d.id}`,
        value: d.value?.amount || undefined,
        stage: d.stage?.name || "Prospecting",
        closeDate: d.estimatedClose ? new Date(d.estimatedClose).getTime() : undefined,
        sourceId: String(d.id),
      });
    }
    await onProgress?.({ deals: deals.length });
    if (items.length < 200) break;
    page++;
  }

  return { contacts, companies, deals, activities: [] };
}

// ─── Insightly ────────────────────────────────────────────────────────────────
export async function fetchInsightly(
  credentials: { apiKey: string },
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const base = "https://api.insightly.com/v3.1";
  const auth = Buffer.from(`${credentials.apiKey}:`).toString("base64");
  const headers = { Authorization: `Basic ${auth}`, "Content-Type": "application/json" };

  const contacts: NormalizedContact[] = [];
  let skip = 0;
  while (true) {
    const res = await fetch(`${base}/Contacts?top=500&skip=${skip}&brief=false`, { headers });
    const items: any[] = await res.json();
    if (!items.length) break;
    for (const c of items) {
      contacts.push({
        firstName: c.FIRST_NAME || "",
        lastName: c.LAST_NAME || "",
        email: c.EMAIL_ADDRESS || undefined,
        phone: c.PHONE || undefined,
        jobTitle: c.TITLE || undefined,
        company: c.ORGANISATION_NAME || undefined,
        city: c.CITY || undefined,
        state: c.STATE || undefined,
        country: c.COUNTRY || undefined,
        website: c.WEBSITE || undefined,
        sourceId: String(c.CONTACT_ID),
      });
    }
    await onProgress?.({ contacts: contacts.length });
    if (items.length < 500) break;
    skip += 500;
  }

  const companies: NormalizedCompany[] = [];
  skip = 0;
  while (true) {
    const res = await fetch(`${base}/Organisations?top=500&skip=${skip}&brief=false`, { headers });
    const items: any[] = await res.json();
    if (!items.length) break;
    for (const a of items) {
      companies.push({
        name: a.ORGANISATION_NAME,
        phone: a.PHONE || undefined,
        website: a.WEBSITE || undefined,
        city: a.CITY || undefined,
        state: a.STATE || undefined,
        country: a.COUNTRY || undefined,
        industry: a.INDUSTRY || undefined,
        employeeCount: a.NUMBER_OF_EMPLOYEES || undefined,
        annualRevenue: a.ANNUAL_REVENUE || undefined,
        sourceId: String(a.ORGANISATION_ID),
      });
    }
    await onProgress?.({ companies: companies.length });
    if (items.length < 500) break;
    skip += 500;
  }

  const deals: NormalizedDeal[] = [];
  skip = 0;
  while (true) {
    const res = await fetch(`${base}/Opportunities?top=500&skip=${skip}&brief=false`, { headers });
    const items: any[] = await res.json();
    if (!items.length) break;
    for (const d of items) {
      deals.push({
        title: d.OPPORTUNITY_NAME,
        value: d.BID_AMOUNT || undefined,
        stage: d.STAGE_ID ? String(d.STAGE_ID) : "Prospecting",
        closeDate: d.CLOSE_DATE ? new Date(d.CLOSE_DATE).getTime() : undefined,
        sourceId: String(d.OPPORTUNITY_ID),
      });
    }
    await onProgress?.({ deals: deals.length });
    if (items.length < 500) break;
    skip += 500;
  }

  return { contacts, companies, deals, activities: [] };
}

// ─── SugarCRM ─────────────────────────────────────────────────────────────────
export async function fetchSugarCRM(
  credentials: { username: string; password: string; instanceUrl: string },
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const base = credentials.instanceUrl.replace(/\/$/, "");

  // Authenticate
  const authRes = await fetch(`${base}/rest/v11_1/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "password",
      client_id: "sugar",
      client_secret: "",
      username: credentials.username,
      password: credentials.password,
      platform: "base"
    })
  });
  const authJson: any = await authRes.json();
  const token = authJson.access_token;
  if (!token) throw new Error("SugarCRM authentication failed. Check your credentials.");

  const headers = { "OAuth-Token": token, "Content-Type": "application/json" };

  const contacts: NormalizedContact[] = [];
  let offset = 0;
  while (true) {
    const res = await fetch(`${base}/rest/v11_1/Contacts?max_num=200&offset=${offset}`, { headers });
    const json: any = await res.json();
    const items = json.records || [];
    if (!items.length) break;
    for (const c of items) {
      contacts.push({
        firstName: c.first_name || "",
        lastName: c.last_name || "",
        email: c.email?.[0]?.email_address || undefined,
        phone: c.phone_work || c.phone_mobile || undefined,
        jobTitle: c.title || undefined,
        company: c.account_name || undefined,
        city: c.primary_address_city || undefined,
        state: c.primary_address_state || undefined,
        country: c.primary_address_country || undefined,
        website: c.website || undefined,
        sourceId: c.id,
      });
    }
    await onProgress?.({ contacts: contacts.length });
    if (items.length < 200) break;
    offset += 200;
  }

  const companies: NormalizedCompany[] = [];
  offset = 0;
  while (true) {
    const res = await fetch(`${base}/rest/v11_1/Accounts?max_num=200&offset=${offset}`, { headers });
    const json: any = await res.json();
    const items = json.records || [];
    if (!items.length) break;
    for (const a of items) {
      companies.push({
        name: a.name,
        phone: a.phone_office || undefined,
        website: a.website || undefined,
        industry: a.industry || undefined,
        city: a.billing_address_city || undefined,
        state: a.billing_address_state || undefined,
        country: a.billing_address_country || undefined,
        employeeCount: a.employees || undefined,
        annualRevenue: a.annual_revenue ? parseFloat(a.annual_revenue) : undefined,
        sourceId: a.id,
      });
    }
    await onProgress?.({ companies: companies.length });
    if (items.length < 200) break;
    offset += 200;
  }

  const deals: NormalizedDeal[] = [];
  offset = 0;
  while (true) {
    const res = await fetch(`${base}/rest/v11_1/Opportunities?max_num=200&offset=${offset}`, { headers });
    const json: any = await res.json();
    const items = json.records || [];
    if (!items.length) break;
    for (const d of items) {
      deals.push({
        title: d.name,
        value: d.amount ? parseFloat(d.amount) : undefined,
        stage: d.sales_stage || "Prospecting",
        closeDate: d.date_closed ? new Date(d.date_closed).getTime() : undefined,
        sourceId: d.id,
      });
    }
    await onProgress?.({ deals: deals.length });
    if (items.length < 200) break;
    offset += 200;
  }

  return { contacts, companies, deals, activities: [] };
}

// ─── Streak (Gmail CRM) ───────────────────────────────────────────────────────
export async function fetchStreak(
  credentials: { apiKey: string },
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const base = "https://www.streak.com/api/v2";
  const auth = Buffer.from(`${credentials.apiKey}:`).toString("base64");
  const headers = { Authorization: `Basic ${auth}`, "Content-Type": "application/json" };

  const contacts: NormalizedContact[] = [];
  const companies: NormalizedCompany[] = [];
  const deals: NormalizedDeal[] = [];

  // Get all pipelines
  const pipelinesRes = await fetch(`${base}/pipelines`, { headers });
  const pipelinesJson: any = await pipelinesRes.json();
  const pipelines: any[] = pipelinesJson.results || [];

  for (const pipeline of pipelines) {
    // Get boxes (deals) in this pipeline
    const boxesRes = await fetch(`${base}/pipelines/${pipeline.key}/boxes`, { headers });
    const boxesJson: any = await boxesRes.json();
    const boxes: any[] = boxesJson.results || [];

    for (const box of boxes) {
      deals.push({
        title: box.name || `Box #${box.key}`,
        stage: box.stageKey || "Prospecting",
        sourceId: box.key,
      });

      // Get contacts for this box
      if (box.contacts?.length) {
        for (const c of box.contacts) {
          contacts.push({
            firstName: (c.name || "").split(" ")[0] || "",
            lastName: (c.name || "").split(" ").slice(1).join(" ") || "",
            email: c.emailAddresses?.[0] || undefined,
            phone: c.phoneNumbers?.[0] || undefined,
            company: c.companies?.[0]?.name || undefined,
            sourceId: c.key || String(Math.random()),
          });
        }
      }
    }
    await onProgress?.({ deals: deals.length, contacts: contacts.length });
  }

  return { contacts, companies, deals, activities: [] };
}

// ─── Nimble ───────────────────────────────────────────────────────────────────
export async function fetchNimble(
  credentials: { apiKey: string },
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const base = "https://api.nimble.com/api/v1";
  const headers = { Authorization: `Bearer ${credentials.apiKey}`, "Content-Type": "application/json" };

  const contacts: NormalizedContact[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${base}/contacts?per_page=300&page=${page}&record_type=person`, { headers });
    const json: any = await res.json();
    const items = json.resources || [];
    if (!items.length) break;
    for (const c of items) {
      const fields = c.fields || {};
      contacts.push({
        firstName: fields["first name"]?.[0]?.value || "",
        lastName: fields["last name"]?.[0]?.value || "",
        email: fields.email?.[0]?.value || undefined,
        phone: fields.phone?.[0]?.value || undefined,
        jobTitle: fields["job title"]?.[0]?.value || undefined,
        company: fields["company name"]?.[0]?.value || undefined,
        city: fields.city?.[0]?.value || undefined,
        state: fields.state?.[0]?.value || undefined,
        country: fields.country?.[0]?.value || undefined,
        website: fields.URL?.[0]?.value || undefined,
        sourceId: c.id,
      });
    }
    await onProgress?.({ contacts: contacts.length });
    if (items.length < 300) break;
    page++;
  }

  const companies: NormalizedCompany[] = [];
  page = 1;
  while (true) {
    const res = await fetch(`${base}/contacts?per_page=300&page=${page}&record_type=company`, { headers });
    const json: any = await res.json();
    const items = json.resources || [];
    if (!items.length) break;
    for (const a of items) {
      const fields = a.fields || {};
      companies.push({
        name: fields["company name"]?.[0]?.value || a.id,
        phone: fields.phone?.[0]?.value || undefined,
        website: fields.URL?.[0]?.value || undefined,
        city: fields.city?.[0]?.value || undefined,
        state: fields.state?.[0]?.value || undefined,
        country: fields.country?.[0]?.value || undefined,
        sourceId: a.id,
      });
    }
    await onProgress?.({ companies: companies.length });
    if (items.length < 300) break;
    page++;
  }

  return { contacts, companies, deals: [], activities: [] };
}

// ─── Monday.com ───────────────────────────────────────────────────────────────
export async function fetchMonday(
  credentials: { apiToken: string },
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const base = "https://api.monday.com/v2";
  const headers = { Authorization: credentials.apiToken, "Content-Type": "application/json" };

  const contacts: NormalizedContact[] = [];
  const companies: NormalizedCompany[] = [];
  const deals: NormalizedDeal[] = [];

  // Get all boards
  const boardsQuery = `{ boards(limit: 50) { id name board_kind columns { id title type } } }`;
  const boardsRes = await fetch(base, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: boardsQuery })
  });
  const boardsJson: any = await boardsRes.json();
  const boards: any[] = boardsJson.data?.boards || [];

  for (const board of boards) {
    const itemsQuery = `{ boards(ids: [${board.id}]) { items_page(limit: 500) { items { id name column_values { id text value } } } } }`;
    const itemsRes = await fetch(base, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: itemsQuery })
    });
    const itemsJson: any = await itemsRes.json();
    const items: any[] = itemsJson.data?.boards?.[0]?.items_page?.items || [];

    const boardNameLower = board.name.toLowerCase();
    const isContacts = boardNameLower.includes("contact") || boardNameLower.includes("lead") || boardNameLower.includes("people");
    const isCompanies = boardNameLower.includes("compan") || boardNameLower.includes("account") || boardNameLower.includes("client");
    const isDeals = boardNameLower.includes("deal") || boardNameLower.includes("opportunit") || boardNameLower.includes("pipeline") || boardNameLower.includes("sale");

    for (const item of items) {
      const colMap: Record<string, string> = {};
      for (const col of item.column_values || []) {
        if (col.text) colMap[col.id] = col.text;
      }

      if (isDeals) {
        deals.push({ title: item.name, stage: "Prospecting", sourceId: item.id });
      } else if (isCompanies) {
        companies.push({ name: item.name, sourceId: item.id });
      } else if (isContacts) {
        const nameParts = item.name.split(" ");
        contacts.push({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: Object.values(colMap).find(v => v.includes("@")) || undefined,
          sourceId: item.id,
        });
      }
    }
    await onProgress?.({ contacts: contacts.length, companies: companies.length, deals: deals.length });
  }

  return { contacts, companies, deals, activities: [] };
}

// ─── Constant Contact ─────────────────────────────────────────────────────────
export async function fetchConstantContact(
  credentials: { accessToken: string },
  onProgress?: ProgressCallback,
  sinceDate?: Date
): Promise<MigrationData> {
  const base = "https://api.cc.email/v3";
  const headers = { Authorization: `Bearer ${credentials.accessToken}`, "Content-Type": "application/json" };

  const contacts: NormalizedContact[] = [];
  let cursor: string | null = null;

  while (true) {
    const url = cursor
      ? `${base}/contacts?limit=500&cursor=${cursor}&status=all&include=custom_fields,phone_numbers,street_addresses`
      : `${base}/contacts?limit=500&status=all&include=custom_fields,phone_numbers,street_addresses`;
    const res = await fetch(url, { headers });
    const json: any = await res.json();
    const items = json.contacts || [];

    for (const c of items) {
      const addr = c.street_addresses?.[0] || {};
      contacts.push({
        firstName: c.first_name || "",
        lastName: c.last_name || "",
        email: c.email_address?.address || undefined,
        phone: c.phone_numbers?.[0]?.phone_number || undefined,
        jobTitle: c.job_title || undefined,
        company: c.company_name || undefined,
        city: addr.city || undefined,
        state: addr.state || undefined,
        country: addr.country || undefined,
        sourceId: c.contact_id,
      });
    }
    await onProgress?.({ contacts: contacts.length });

    cursor = json._links?.next?.href ? new URL(json._links.next.href).searchParams.get("cursor") : null;
    if (!cursor || !items.length) break;
  }

  return { contacts, companies: [], deals: [], activities: [] };
}
