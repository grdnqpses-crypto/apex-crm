import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import * as db from "../db";

const ENRICHMENT_FIELDS_COMPANY = [
  "industry", "numberOfEmployees", "annualRevenue", "website", "description",
  "businessClassification", "foundedYear", "city", "stateRegion", "country",
  "companyType", "linkedinUrl", "twitterHandle", "facebookPage",
];

const ENRICHMENT_FIELDS_CONTACT = [
  "jobTitle", "department", "linkedinUrl", "twitterHandle", "city",
  "stateRegion", "country", "timezone", "decisionMakerRole",
];

export const enrichmentRouter = router({
  // Enrich a single company using AI
  enrichCompany: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const all = await db.listCompaniesByRole(ctx.user, { limit: 10000 });
      const company = all.items.find((c: any) => c.id === input.companyId);
      if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });

      const missingFields = ENRICHMENT_FIELDS_COMPANY.filter(f => !(company as any)[f]);
      if (missingFields.length === 0) return { enriched: 0, message: "Company already fully enriched" };

      const prompt = `You are a B2B data enrichment AI. Given the following company information, infer and fill in the missing fields as accurately as possible. Return ONLY a valid JSON object with the fields you can confidently infer. Do not include fields you cannot determine.

Company Name: ${company.name}
Domain/Website: ${(company as any).domain || (company as any).website || "unknown"}
Known Info: ${JSON.stringify({
  industry: (company as any).industry,
  city: (company as any).city,
  country: (company as any).country,
  description: (company as any).description,
  companyType: (company as any).companyType,
})}

Missing fields to fill: ${missingFields.join(", ")}

Return a JSON object with only the fields you can confidently infer. Example: {"industry": "Transportation", "numberOfEmployees": "50-200", "country": "United States"}`;

      let enrichedData: Record<string, string> = {};
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a B2B data enrichment specialist. Return only valid JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        });
        const content = response.choices?.[0]?.message?.content ?? "{}";
        enrichedData = JSON.parse(typeof content === 'string' ? content : '{}');
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI enrichment failed" });
      }

      // Only update fields that were missing and now have values
      const updates: Record<string, any> = {};
      for (const [key, value] of Object.entries(enrichedData)) {
        if (ENRICHMENT_FIELDS_COMPANY.includes(key) && value && !(company as any)[key]) {
          updates[key] = String(value);
        }
      }

      if (Object.keys(updates).length > 0) {
        await db.updateCompany(input.companyId, ctx.user.id, updates);
      }

      return {
        enriched: Object.keys(updates).length,
        fields: Object.keys(updates),
        message: Object.keys(updates).length > 0
          ? `Enriched ${Object.keys(updates).length} fields: ${Object.keys(updates).join(", ")}`
          : "No new data could be inferred",
      };
    }),

  // Enrich a single contact using AI
  enrichContact: protectedProcedure
    .input(z.object({ contactId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const allContacts = await db.listContactsByRole(ctx.user, { limit: 10000 });
      const contact = allContacts.items.find((c: any) => c.id === input.contactId);
      if (!contact) throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });

      const missingFields = ENRICHMENT_FIELDS_CONTACT.filter(f => !(contact as any)[f]);
      if (missingFields.length === 0) return { enriched: 0, message: "Contact already fully enriched" };

      const prompt = `You are a B2B data enrichment AI. Given the following contact information, infer and fill in the missing fields as accurately as possible. Return ONLY a valid JSON object.

Contact: ${(contact as any).firstName} ${(contact as any).lastName}
Email: ${(contact as any).email || "unknown"}
Company: ${(contact as any).companyName || "unknown"}
Known Info: ${JSON.stringify({
  jobTitle: (contact as any).jobTitle,
  department: (contact as any).department,
  city: (contact as any).city,
  country: (contact as any).country,
})}

Missing fields to fill: ${missingFields.join(", ")}

Return a JSON object with only the fields you can confidently infer.`;

      let enrichedData: Record<string, string> = {};
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a B2B data enrichment specialist. Return only valid JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        });
        const content = response.choices?.[0]?.message?.content ?? "{}";
        enrichedData = JSON.parse(typeof content === 'string' ? content : '{}');
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI enrichment failed" });
      }

      const updates: Record<string, any> = {};
      for (const [key, value] of Object.entries(enrichedData)) {
        if (ENRICHMENT_FIELDS_CONTACT.includes(key) && value && !(contact as any)[key]) {
          updates[key] = String(value);
        }
      }

      if (Object.keys(updates).length > 0) {
        await db.updateContact(input.contactId, ctx.user.id, updates);
      }

      return {
        enriched: Object.keys(updates).length,
        fields: Object.keys(updates),
        message: Object.keys(updates).length > 0
          ? `Enriched ${Object.keys(updates).length} fields: ${Object.keys(updates).join(", ")}`
          : "No new data could be inferred",
      };
    }),

  // Bulk enrich multiple companies
  bulkEnrichCompanies: protectedProcedure
    .input(z.object({ ids: z.array(z.number()).max(50) }))
    .mutation(async ({ ctx, input }) => {
      let totalEnriched = 0;
      let processed = 0;
      const errors: string[] = [];

      for (const companyId of input.ids) {
        try {
          const all = await db.listCompaniesByRole(ctx.user, { limit: 10000 });
          const company = all.items.find((c: any) => c.id === companyId);
          if (!company) continue;

          const missingFields = ENRICHMENT_FIELDS_COMPANY.filter(f => !(company as any)[f]);
          if (missingFields.length === 0) { processed++; continue; }

          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a B2B data enrichment specialist. Return only valid JSON." },
              { role: "user", content: `Enrich this company. Name: ${company.name}, Domain: ${(company as any).domain || "unknown"}. Missing: ${missingFields.join(", ")}. Return JSON with inferred values only.` },
            ],
            response_format: { type: "json_object" },
          });

          const content = response.choices?.[0]?.message?.content ?? "{}";
          const enrichedData = JSON.parse(typeof content === 'string' ? content : '{}');
          const updates: Record<string, any> = {};
          for (const [key, value] of Object.entries(enrichedData)) {
            if (ENRICHMENT_FIELDS_COMPANY.includes(key) && value && !(company as any)[key]) {
              updates[key] = String(value);
            }
          }
          if (Object.keys(updates).length > 0) {
            await db.updateCompany(companyId, ctx.user.id, updates);
            totalEnriched += Object.keys(updates).length;
          }
          processed++;
        } catch (e) {
          errors.push(`Company ${companyId}: enrichment failed`);
        }
      }

      return { processed, totalEnriched, errors };
    }),

  // Bulk enrich multiple contacts
  bulkEnrichContacts: protectedProcedure
    .input(z.object({ ids: z.array(z.number()).max(50) }))
    .mutation(async ({ ctx, input }) => {
      let totalEnriched = 0;
      let processed = 0;
      const errors: string[] = [];

      for (const contactId of input.ids) {
        try {
          const allContacts = await db.listContactsByRole(ctx.user, { limit: 10000 });
          const contact = allContacts.items.find((c: any) => c.id === contactId);
          if (!contact) continue;

          const missingFields = ENRICHMENT_FIELDS_CONTACT.filter(f => !(contact as any)[f]);
          if (missingFields.length === 0) { processed++; continue; }

          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a B2B data enrichment specialist. Return only valid JSON." },
              { role: "user", content: `Enrich this contact. Name: ${(contact as any).firstName} ${(contact as any).lastName}, Email: ${(contact as any).email || "unknown"}, Company: ${(contact as any).companyName || "unknown"}. Missing: ${missingFields.join(", ")}. Return JSON with inferred values only.` },
            ],
            response_format: { type: "json_object" },
          });

          const content = response.choices?.[0]?.message?.content ?? "{}";
          const enrichedData = JSON.parse(typeof content === 'string' ? content : '{}');
          const updates: Record<string, any> = {};
          for (const [key, value] of Object.entries(enrichedData)) {
            if (ENRICHMENT_FIELDS_CONTACT.includes(key) && value && !(contact as any)[key]) {
              updates[key] = String(value);
            }
          }
          if (Object.keys(updates).length > 0) {
            await db.updateContact(contactId, ctx.user.id, updates);
            totalEnriched += Object.keys(updates).length;
          }
          processed++;
        } catch (e) {
          errors.push(`Contact ${contactId}: enrichment failed`);
        }
      }

      return { processed, totalEnriched, errors };
    }),

  // Check enrichment coverage for a set of companies
  checkCoverage: protectedProcedure
    .input(z.object({ ids: z.array(z.number()), entityType: z.enum(["companies", "contacts"]) }))
    .query(async ({ ctx, input }) => {
      const fields = input.entityType === "companies" ? ENRICHMENT_FIELDS_COMPANY : ENRICHMENT_FIELDS_CONTACT;
      let totalFields = 0;
      let filledFields = 0;

      if (input.entityType === "companies") {
        const all = await db.listCompaniesByRole(ctx.user, { limit: 10000 });
        const items = all.items.filter((c: any) => input.ids.includes(c.id));
        for (const item of items) {
          totalFields += fields.length;
          filledFields += fields.filter(f => !!(item as any)[f]).length;
        }
      } else {
        const all = await db.listContactsByRole(ctx.user, { limit: 10000 });
        const items = all.items.filter((c: any) => input.ids.includes(c.id));
        for (const item of items) {
          totalFields += fields.length;
          filledFields += fields.filter(f => !!(item as any)[f]).length;
        }
      }

      const coverage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
      return { coverage, filledFields, totalFields, missing: totalFields - filledFields };
    }),
});
