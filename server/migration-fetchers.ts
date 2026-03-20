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
  onProgress?: ProgressCallback
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

  // Contacts
  const contacts = await hubspotPages<NormalizedContact>(
    "/crm/v3/objects/contacts",
    { properties: "firstname,lastname,email,phone,jobtitle,company,address,city,state,zip,country,website,notes,hs_linkedin_url" },
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
    { properties: "name,domain,phone,industry,address,city,state,zip,country,website,description,numberofemployees,annualrevenue" },
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
    { properties: "dealname,amount,dealstage,closedate,description,pipeline" },
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
  onProgress?: ProgressCallback
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
  onProgress?: ProgressCallback
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
  onProgress?: ProgressCallback
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
  onProgress?: ProgressCallback
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
  onProgress?: ProgressCallback
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
