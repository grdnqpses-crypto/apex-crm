import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { companies } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// FMCSA SAFER Web API base URL (public, no key required)
const FMCSA_API_BASE = "https://mobile.fmcsa.dot.gov/qc/services";

interface FMCSACarrierData {
  dotNumber?: string;
  mcNumber?: string;
  legalName?: string;
  dbaName?: string;
  entityType?: string;
  operatingStatus?: string;
  authorityStatus?: string;
  safetyRating?: string;
  safetyRatingDate?: string;
  insuranceOnFile?: boolean;
  bipdInsuranceOnFile?: string;
  cargoInsuranceOnFile?: string;
  outOfServiceDate?: string;
  outOfServicePct?: number;
  driverInspections?: number;
  vehicleInspections?: number;
  crashTotal?: number;
  fatalCrash?: number;
  injCrash?: number;
  towCrash?: number;
  phoneNumber?: string;
  mailingAddress?: string;
  physicalAddress?: string;
  powerUnits?: number;
  drivers?: number;
  mcsipDate?: string;
}

async function lookupByMC(mcNumber: string): Promise<FMCSACarrierData | null> {
  try {
    const cleanMC = mcNumber.replace(/[^0-9]/g, "");
    const response = await fetch(
      `${FMCSA_API_BASE}/carriers/docket-number/${cleanMC}`,
      {
        headers: {
          "Accept": "application/json",
          "User-Agent": "AxiomCRM/1.0",
        },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data?.content?.carrier) return null;
    const c = data.content.carrier;
    return {
      dotNumber: c.dotNumber?.toString(),
      mcNumber: cleanMC,
      legalName: c.legalName,
      dbaName: c.dbaName,
      entityType: c.carrierOperation?.carrierOperationDesc,
      operatingStatus: c.statusCode,
      authorityStatus: c.allowedToOperate === "Y" ? "AUTHORIZED" : "NOT AUTHORIZED",
      safetyRating: c.safetyRating,
      safetyRatingDate: c.safetyRatingDate,
      insuranceOnFile: c.bipdInsuranceOnFile === "Y" || c.cargoInsuranceOnFile === "Y",
      bipdInsuranceOnFile: c.bipdInsuranceOnFile,
      cargoInsuranceOnFile: c.cargoInsuranceOnFile,
      outOfServicePct: parseFloat(c.oosPercent || "0"),
      driverInspections: c.driverInsp,
      vehicleInspections: c.vehicleInsp,
      crashTotal: c.crashTotal,
      fatalCrash: c.fatalCrash,
      injCrash: c.injCrash,
      towCrash: c.towCrash,
      phoneNumber: c.telephone,
      powerUnits: c.totalPowerUnits,
      drivers: c.totalDrivers,
    };
  } catch {
    return null;
  }
}

async function lookupByDOT(dotNumber: string): Promise<FMCSACarrierData | null> {
  try {
    const cleanDOT = dotNumber.replace(/[^0-9]/g, "");
    const response = await fetch(
      `${FMCSA_API_BASE}/carriers/${cleanDOT}`,
      {
        headers: {
          "Accept": "application/json",
          "User-Agent": "AxiomCRM/1.0",
        },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data?.content?.carrier) return null;
    const c = data.content.carrier;
    return {
      dotNumber: cleanDOT,
      mcNumber: c.docketNumber?.toString(),
      legalName: c.legalName,
      dbaName: c.dbaName,
      entityType: c.carrierOperation?.carrierOperationDesc,
      operatingStatus: c.statusCode,
      authorityStatus: c.allowedToOperate === "Y" ? "AUTHORIZED" : "NOT AUTHORIZED",
      safetyRating: c.safetyRating,
      safetyRatingDate: c.safetyRatingDate,
      insuranceOnFile: c.bipdInsuranceOnFile === "Y" || c.cargoInsuranceOnFile === "Y",
      bipdInsuranceOnFile: c.bipdInsuranceOnFile,
      cargoInsuranceOnFile: c.cargoInsuranceOnFile,
      outOfServicePct: parseFloat(c.oosPercent || "0"),
      driverInspections: c.driverInsp,
      vehicleInspections: c.vehicleInsp,
      crashTotal: c.crashTotal,
      fatalCrash: c.fatalCrash,
      injCrash: c.injCrash,
      towCrash: c.towCrash,
      phoneNumber: c.telephone,
      powerUnits: c.totalPowerUnits,
      drivers: c.totalDrivers,
    };
  } catch {
    return null;
  }
}

export const fmcsaRouter = router({
  // Look up a carrier by MC# or DOT# and cache results on the company record
  lookup: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      mcNumber: z.string().optional(),
      dotNumber: z.string().optional(),
      forceRefresh: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const drizzle = await getDb();
      const [company] = await drizzle.select({
        id: companies.id,
        fmcsaVerifiedAt: companies.fmcsaVerifiedAt,
        fmcsaRawData: companies.fmcsaRawData,
        mcNumber: companies.mcNumber,
        dotNumber: companies.dotNumber,
      }).from(companies).where(eq(companies.id, input.companyId)).limit(1);

      if (!company) throw new Error("Company not found");

      const cacheAge = company.fmcsaVerifiedAt ? Date.now() - company.fmcsaVerifiedAt : Infinity;
      const cacheValid = cacheAge < 24 * 60 * 60 * 1000;

      if (!input.forceRefresh && cacheValid && company.fmcsaRawData) {
        return { cached: true, data: company.fmcsaRawData as FMCSACarrierData };
      }

      const mc = input.mcNumber || company.mcNumber;
      const dot = input.dotNumber || company.dotNumber;

      if (!mc && !dot) {
        throw new Error("No MC# or DOT# available for this company. Please add one first.");
      }

      let carrierData: FMCSACarrierData | null = null;
      if (mc) carrierData = await lookupByMC(mc);
      if (!carrierData && dot) carrierData = await lookupByDOT(dot);

      if (!carrierData) {
        return {
          cached: false,
          data: null,
          error: "Carrier not found in FMCSA database. Verify the MC# or DOT# is correct.",
        };
      }

      await drizzle.update(companies).set({
        fmcsaVerifiedAt: Date.now(),
        fmcsaSafetyRating: carrierData.safetyRating || "Not Rated",
        fmcsaAuthorityStatus: carrierData.authorityStatus || "Unknown",
        fmcsaInsuranceOnFile: carrierData.insuranceOnFile ? 1 : 0,
        fmcsaOutOfServicePct: carrierData.outOfServicePct?.toString() as any,
        fmcsaOperatingStatus: carrierData.operatingStatus || "Unknown",
        fmcsaEntityType: carrierData.entityType || "Unknown",
        fmcsaRawData: carrierData as any,
        ...(carrierData.mcNumber && !company.mcNumber ? { mcNumber: carrierData.mcNumber } : {}),
        ...(carrierData.dotNumber && !company.dotNumber ? { dotNumber: carrierData.dotNumber } : {}),
        updatedAt: Date.now(),
      }).where(eq(companies.id, input.companyId));

      return { cached: false, data: carrierData };
    }),

  // Get cached FMCSA data for a company
  getCached: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const drizzle = await getDb();
      const [company] = await drizzle.select({
        fmcsaVerifiedAt: companies.fmcsaVerifiedAt,
        fmcsaSafetyRating: companies.fmcsaSafetyRating,
        fmcsaAuthorityStatus: companies.fmcsaAuthorityStatus,
        fmcsaInsuranceOnFile: companies.fmcsaInsuranceOnFile,
        fmcsaOutOfServicePct: companies.fmcsaOutOfServicePct,
        fmcsaOperatingStatus: companies.fmcsaOperatingStatus,
        fmcsaEntityType: companies.fmcsaEntityType,
        fmcsaRawData: companies.fmcsaRawData,
        mcNumber: companies.mcNumber,
        dotNumber: companies.dotNumber,
      }).from(companies).where(eq(companies.id, input.companyId)).limit(1);

      if (!company) return null;
      return company;
    }),

  // Clear cached FMCSA data
  clearCache: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .mutation(async ({ input }) => {
      const drizzle = await getDb();
      await drizzle.update(companies).set({
        fmcsaVerifiedAt: null,
        fmcsaSafetyRating: null,
        fmcsaAuthorityStatus: null,
        fmcsaInsuranceOnFile: 0,
        fmcsaOutOfServicePct: null,
        fmcsaOperatingStatus: null,
        fmcsaEntityType: null,
        fmcsaRawData: null,
        updatedAt: Date.now(),
      }).where(eq(companies.id, input.companyId));
      return { success: true };
    }),
});
