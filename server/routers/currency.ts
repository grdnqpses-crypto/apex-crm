/**
 * Multi-Currency Settings Router
 * Manage base currency, enabled currencies, and exchange rates per tenant
 */
import { z } from "zod";
import { router, protectedProcedure, companyAdminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { currencySettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
];

// Static fallback exchange rates relative to USD (updated periodically)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.36, AUD: 1.53,
  JPY: 149.5, CHF: 0.89, CNY: 7.24, INR: 83.1, MXN: 17.2,
  BRL: 4.97, SGD: 1.34, HKD: 7.82, NOK: 10.6, SEK: 10.4,
  DKK: 6.88, NZD: 1.63, ZAR: 18.6, AED: 3.67, SAR: 3.75,
};

export const currencyRouter = router({
  // Get supported currencies list
  getSupportedCurrencies: protectedProcedure.query(() => SUPPORTED_CURRENCIES),

  // Get tenant currency settings
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.tenantCompanyId) return {
      baseCurrency: "USD",
      enabledCurrencies: ["USD"],
      exchangeRates: FALLBACK_RATES,
    };
    const db = await getDb();
    if (!db) return { baseCurrency: "USD", enabledCurrencies: ["USD"], exchangeRates: FALLBACK_RATES };
    const [settings] = await db.select().from(currencySettings)
      .where(eq(currencySettings.tenantId, ctx.user.tenantCompanyId))
      .limit(1);
    return settings ?? { baseCurrency: "USD", enabledCurrencies: ["USD"], exchangeRates: FALLBACK_RATES };
  }),

  // Update tenant currency settings
  updateSettings: companyAdminProcedure
    .input(z.object({
      baseCurrency: z.string().length(3),
      enabledCurrencies: z.array(z.string().length(3)).min(1),
      exchangeRates: z.record(z.string(), z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !ctx.user.tenantCompanyId) throw new Error("No company context");
      const tenantId = ctx.user.tenantCompanyId;
      const now = Date.now();
      // Merge provided rates with fallback
      const rates = { ...FALLBACK_RATES, ...(input.exchangeRates ?? {}) };
      const existing = await db.select({ id: currencySettings.id })
        .from(currencySettings).where(eq(currencySettings.tenantId, tenantId)).limit(1);
      if (existing.length > 0) {
        await db.update(currencySettings).set({
          baseCurrency: input.baseCurrency,
          enabledCurrencies: input.enabledCurrencies,
          exchangeRates: rates,
          lastUpdated: now,
          updatedAt: now,
        }).where(eq(currencySettings.tenantId, tenantId));
      } else {
        await db.insert(currencySettings).values({
          tenantId,
          baseCurrency: input.baseCurrency,
          enabledCurrencies: input.enabledCurrencies,
          exchangeRates: rates,
          lastUpdated: now,
          updatedAt: now,
        });
      }
      return { success: true };
    }),

  // Convert an amount between currencies
  convert: protectedProcedure
    .input(z.object({
      amount: z.number(),
      from: z.string().length(3),
      to: z.string().length(3),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      let rates = FALLBACK_RATES;
      if (db && ctx.user.tenantCompanyId) {
        const [settings] = await db.select({ exchangeRates: currencySettings.exchangeRates })
          .from(currencySettings).where(eq(currencySettings.tenantId, ctx.user.tenantCompanyId)).limit(1);
        if (settings?.exchangeRates) rates = settings.exchangeRates as Record<string, number>;
      }
      const fromRate = rates[input.from] ?? 1;
      const toRate = rates[input.to] ?? 1;
      const converted = (input.amount / fromRate) * toRate;
      return { amount: Math.round(converted * 100) / 100, from: input.from, to: input.to };
    }),
});
