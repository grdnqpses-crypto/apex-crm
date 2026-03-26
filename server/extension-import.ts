import { Router, Request, Response } from "express";
import * as db from "./db";
import { contacts, companies, deals } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";

export const extensionImportRouter = Router();

// POST /api/extension/import
// Receives data from the Axiom CRM Importer Chrome extension
extensionImportRouter.post("/api/extension/import", async (req: Request, res: Response) => {
  try {
    const drizzle = await db.getDb();
    if (!drizzle) return res.status(500).json({ error: "Database not available" });

    const { crm, data, timestamp } = req.body as {
      crm: string;
      data: {
        contacts: ExtContact[];
        companies: ExtCompany[];
        deals: ExtDeal[];
        activities: unknown[];
      };
      timestamp: string;
    };

    if (!crm || !data) {
      return res.status(400).json({ error: "Missing crm or data" });
    }

    // Get user from session cookie (same as tRPC context)
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated. Please log into Axiom first." });
    }

    const tenantId = (req as any).user?.tenantId || userId;

    const results = {
      contacts: 0,
      companies: 0,
      deals: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Import companies first (contacts may reference them)
    const companyNameToId = new Map<string, number>();
    for (const c of data.companies || []) {
      if (!c.name) continue;
      try {
        const now = Date.now();
        const [inserted] = await drizzle.insert(companies).values({
          name: c.name,
          domain: c.domain || null,
          phone: c.phone || null,
          city: c.city || null,
          stateRegion: c.state || null,
          country: c.country || null,
          industry: c.industry || null,
          numberOfEmployees: c.employees ? String(c.employees) : null,
          annualRevenue: c.revenue ? String(c.revenue) : null,
          userId,
          tenantId,
          recordSource: crm,
          lastModifiedDate: c.lastModifiedDate ? new Date(c.lastModifiedDate).getTime() : now,
          createdAt: c.createDate ? new Date(c.createDate).getTime() : now,
          updatedAt: now,
        }).onDuplicateKeyUpdate({ set: { name: c.name } });
        companyNameToId.set(c.name, (inserted as any).insertId || 0);
        results.companies++;
      } catch (e: any) {
        results.errors.push(`Company "${c.name}": ${e.message}`);
      }
    }

    // Import contacts
    for (const c of data.contacts || []) {
      if (!c.email && !c.firstName && !c.lastName) continue;
      try {
        const companyId = c.company ? (companyNameToId.get(c.company) ?? 0) : 0;
        const now = Date.now();
        await drizzle.insert(contacts).values({
          firstName: c.firstName || "",
          lastName: c.lastName || "",
          email: c.email || null,
          companyId,
          userId,
          tenantId,
          recordSource: crm,
          lastModifiedDate: c.lastModifiedDate ? new Date(c.lastModifiedDate).getTime() : now,
          lastActivityDate: c.lastActivityDate ? new Date(c.lastActivityDate).getTime() : null,
          lastBookedMeetingDate: c.lastBookedMeetingDate ? new Date(c.lastBookedMeetingDate).getTime() : null,
          lastLoggedOutgoingEmailDate: c.lastLoggedOutgoingEmailDate ? new Date(c.lastLoggedOutgoingEmailDate).getTime() : null,
          firstConversionDate: c.firstConversionDate ? new Date(c.firstConversionDate).getTime() : null,
          mostRecentConversionDate: c.recentConversionDate ? new Date(c.recentConversionDate).getTime() : null,
          firstDealCreatedDate: c.firstDealCreatedDate ? new Date(c.firstDealCreatedDate).getTime() : null,
          createdAt: c.createDate ? new Date(c.createDate).getTime() : now,
          updatedAt: now,
        }).onDuplicateKeyUpdate({ set: { email: c.email || null } });
        results.contacts++;
      } catch (e: any) {
        results.errors.push(`Contact "${c.firstName} ${c.lastName}": ${e.message}`);
      }
    }

    // Import deals - need a default pipeline
    if (data.deals && data.deals.length > 0) {
      const userPipelines = await db.listPipelines(userId, tenantId);
      const defaultPipeline = userPipelines[0];
      if (defaultPipeline) {
        const stages = await db.getPipelineStages(defaultPipeline.id);
        const defaultStage = stages[0];
        if (defaultStage) {
          for (const d of data.deals) {
            if (!d.title) continue;
            try {
              const now = Date.now();
              await drizzle.insert(deals).values({
                name: d.title,
                value: d.value ? Math.round(parseFloat(String(d.value))) : 0,
                status: "open",
                pipelineId: defaultPipeline.id,
                stageId: defaultStage.id,
                notes: d.notes || null,
                userId,
                tenantId,
                createdAt: d.createDate ? new Date(d.createDate).getTime() : now,
                updatedAt: now,
              }).onDuplicateKeyUpdate({ set: { name: d.title } });
              results.deals++;
            } catch (e: any) {
              results.errors.push(`Deal "${d.title}": ${e.message}`);
            }
          }
        }
      }
    }

    console.log(`[Extension Import] ${crm}: ${results.contacts} contacts, ${results.companies} companies, ${results.deals} deals imported for user ${userId}`);

    return res.json({
      success: true,
      jobId: `ext-${Date.now()}`,
      counts: results,
      contacts: results.contacts,
      companies: results.companies,
      deals: results.deals,
    });

  } catch (err: any) {
    console.error("[Extension Import] Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/extension/csv-map
// AI-powered CSV field mapping
extensionImportRouter.post("/api/extension/csv-map", async (req: Request, res: Response) => {
  try {
    const { headers, sampleRows } = req.body as {
      headers: string[];
      sampleRows: Record<string, string>[];
    };

    if (!headers?.length) {
      return res.status(400).json({ error: "No headers provided" });
    }

    const axiomFields = [
      "firstName", "lastName", "email", "phone", "jobTitle", "company",
      "website", "city", "state", "country", "notes",
      "companyName", "companyDomain", "companyPhone", "companyIndustry",
      "companyEmployees", "companyRevenue",
      "dealTitle", "dealValue", "dealStage", "dealCloseDate",
      "lastActivityDate", "lastBookedMeetingDate", "lastLoggedOutgoingEmailDate",
      "firstConversionDate", "recentConversionDate", "createDate", "skip"
    ];

    const prompt = `You are a CRM data migration expert. Map these CSV column headers to Axiom CRM fields.

CSV Headers: ${JSON.stringify(headers)}

Sample data (first 3 rows):
${JSON.stringify(sampleRows.slice(0, 3), null, 2)}

Available Axiom fields: ${axiomFields.join(", ")}

Return a JSON object where each key is a CSV header and each value is the best matching Axiom field name.
Use "skip" for columns that don't map to any CRM field.
Be smart about variations: "First Name", "firstname", "first_name" all map to "firstName".`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a CRM data migration expert. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "field_mapping",
          strict: true,
          schema: {
            type: "object",
            properties: Object.fromEntries(headers.map(h => [h, { type: "string" }])),
            required: headers,
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices?.[0]?.message?.content;
    const mapping = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

    return res.json({ mapping });

  } catch (err: any) {
    console.error("[CSV Map] Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/extension/csv-import
// Import CSV data after field mapping is confirmed
extensionImportRouter.post("/api/extension/csv-import", async (req: Request, res: Response) => {
  try {
    const drizzle = await db.getDb();
    if (!drizzle) return res.status(500).json({ error: "Database not available" });

    const { rows, mapping, crm } = req.body as {
      rows: Record<string, string>[];
      mapping: Record<string, string>;
      crm: string;
    };

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const tenantId = (req as any).user?.tenantId || userId;
    const results = { contacts: 0, companies: 0, deals: 0, errors: [] as string[] };

    // Group rows by record type based on mapping
    const contactRows: ExtContact[] = [];
    const companyRows: ExtCompany[] = [];
    const dealRows: ExtDeal[] = [];

    for (const row of rows) {
      const mapped: Record<string, string> = {};
      for (const [csvCol, axiomField] of Object.entries(mapping)) {
        if (axiomField !== "skip" && row[csvCol]) {
          mapped[axiomField] = row[csvCol];
        }
      }

      // Determine record type
      const isContact = mapped.email || mapped.firstName || mapped.lastName;
      const isCompany = mapped.companyName && !isContact;
      const isDeal = mapped.dealTitle;

      if (isDeal) {
        dealRows.push({ title: mapped.dealTitle, value: parseFloat(mapped.dealValue || "0") || undefined, stage: mapped.dealStage, closeDate: mapped.dealCloseDate, sourceId: String(Math.random()) });
      } else if (isCompany) {
        companyRows.push({ name: mapped.companyName, domain: mapped.companyDomain, phone: mapped.companyPhone, industry: mapped.companyIndustry, employees: mapped.companyEmployees, revenue: mapped.companyRevenue, sourceId: String(Math.random()) });
      } else if (isContact) {
        contactRows.push({ firstName: mapped.firstName, lastName: mapped.lastName, email: mapped.email, phone: mapped.phone, title: mapped.title, company: mapped.company || mapped.companyName, website: mapped.website, city: mapped.city, state: mapped.state, country: mapped.country, notes: mapped.notes, createDate: mapped.createDate, lastActivityDate: mapped.lastActivityDate, sourceId: String(Math.random()) });
      }
    }

    // Import companies
    const companyNameToId = new Map<string, number>();
    for (const c of companyRows) {
      if (!c.name) continue;
      try {
        const now = Date.now();
        const [inserted] = await drizzle.insert(companies).values({
          name: c.name, domain: c.domain || null, phone: c.phone || null,
          industry: c.industry || null, userId, tenantId,
          recordSource: crm || "csv",
          createdAt: now, updatedAt: now,
        }).onDuplicateKeyUpdate({ set: { name: c.name } });
        companyNameToId.set(c.name, (inserted as any).insertId || 0);
        results.companies++;
      } catch (e: any) { results.errors.push(e.message); }
    }

    // Import contacts
    for (const c of contactRows) {
      if (!c.email && !c.firstName) continue;
      try {
        const companyId = c.company ? (companyNameToId.get(c.company) ?? 0) : 0;
        const now = Date.now();
        await drizzle.insert(contacts).values({
          firstName: c.firstName || "", lastName: c.lastName || "",
          email: c.email || null, companyId,
          userId, tenantId,
          recordSource: crm || "csv",
          createdAt: c.createDate ? new Date(c.createDate).getTime() : now,
          updatedAt: now,
        }).onDuplicateKeyUpdate({ set: { email: c.email || null } });
        results.contacts++;
      } catch (e: any) { results.errors.push(e.message); }
    }

    // Import deals
    if (dealRows.length > 0) {
      const userPipelines = await db.listPipelines(userId, tenantId);
      const defaultPipeline = userPipelines[0];
      if (defaultPipeline) {
        const stages = await db.getPipelineStages(defaultPipeline.id);
        const defaultStage = stages[0];
        if (defaultStage) {
          for (const d of dealRows) {
            if (!d.title) continue;
            try {
              const now = Date.now();
              await drizzle.insert(deals).values({
                name: d.title,
                value: d.value ? Math.round(parseFloat(String(d.value))) : 0,
                status: "open",
                pipelineId: defaultPipeline.id,
                stageId: defaultStage.id,
                userId, tenantId,
                createdAt: now, updatedAt: now,
              }).onDuplicateKeyUpdate({ set: { name: d.title } });
              results.deals++;
            } catch (e: any) { results.errors.push(e.message); }
          }
        }
      }
    }

    return res.json({ success: true, counts: results, ...results });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Types
interface ExtContact {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  notes?: string;
  sourceId?: string;
  createDate?: string;
  lastModifiedDate?: string;
  lastActivityDate?: string;
  lastBookedMeetingDate?: string;
  lastLoggedOutgoingEmailDate?: string;
  firstConversionDate?: string;
  recentConversionDate?: string;
  firstDealCreatedDate?: string;
}

interface ExtCompany {
  name?: string;
  domain?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  industry?: string;
  employees?: string | number;
  revenue?: string | number;
  notes?: string;
  sourceId?: string;
  createDate?: string;
  lastModifiedDate?: string;
}

interface ExtDeal {
  title?: string;
  value?: number;
  stage?: string;
  closeDate?: string;
  contactName?: string;
  companyName?: string;
  notes?: string;
  sourceId?: string;
  createDate?: string;
}
