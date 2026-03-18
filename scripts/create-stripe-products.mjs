/**
 * Creates all 5 Apex CRM subscription products and prices in Stripe.
 * Annual plans are 10% off monthly and are NON-REFUNDABLE.
 * Run: node scripts/create-stripe-products.mjs
 */

import Stripe from "stripe";
import { config } from "dotenv";
config({ path: ".env" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});

// Annual = monthly * 12 * 0.90 (10% off), rounded to nearest dollar
const annual = (monthly) => Math.round(monthly * 12 * 0.90 / 100) * 100;

const PLANS = [
  {
    key: "success_starter",
    name: "Success Starter",
    description: "The perfect launchpad for solo brokers. 1 user included, add up to 4 more at $30/user/mo.",
    monthlyPrice: 9900,           // $99.00/mo
    annualPrice: annual(9900),    // $1,069.20 → $1,069/yr  (~$89.08/mo, 10% off)
  },
  {
    key: "growth_foundation",
    name: "Growth Foundation",
    description: "Built for small brokerages ready to scale. 5 users included, add up to 10 more at $30/user/mo.",
    monthlyPrice: 19700,
    annualPrice: annual(19700),   // $2,127.60 → $2,128/yr
  },
  {
    key: "fortune_foundation",
    name: "Fortune Foundation",
    description: "Advanced automation for mid-size freight ops. 15 users included, add up to 10 more at $30/user/mo.",
    monthlyPrice: 49700,
    annualPrice: annual(49700),   // $5,367.60 → $5,368/yr
  },
  {
    key: "fortune",
    name: "Fortune",
    description: "The complete platform for high-performance teams. 25 users included, add up to 15 more at $30/user/mo.",
    monthlyPrice: 69700,
    annualPrice: annual(69700),   // $7,527.60 → $7,528/yr
  },
  {
    key: "fortune_plus",
    name: "Fortune Plus",
    description: "Enterprise-grade scale with white-glove support. 50 users included (max).",
    monthlyPrice: 149700,
    annualPrice: annual(149700),  // $16,167.60 → $16,168/yr
  },
];

const USER_ADDON = {
  name: "Apex CRM — Additional User",
  description: "Add one extra user seat at $30/month. Non-refundable when billed annually.",
  price: 3000, // $30.00/mo
};

async function main() {
  console.log("Creating Apex CRM Stripe products (10% annual discount, non-refundable)...\n");
  const results = {};

  for (const plan of PLANS) {
    console.log(`Creating product: ${plan.name}`);

    const product = await stripe.products.create({
      name: `Apex CRM — ${plan.name}`,
      description: plan.description,
      metadata: { tier: plan.key, platform: "apex-crm" },
    });

    const monthly = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthlyPrice,
      currency: "usd",
      recurring: { interval: "month" },
      nickname: `${plan.name} Monthly`,
      metadata: { tier: plan.key, billing: "monthly", refundable: "yes" },
    });

    // Annual prices are NON-REFUNDABLE — enforced via policy and checkout description
    const annualPriceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.annualPrice,
      currency: "usd",
      recurring: { interval: "year" },
      nickname: `${plan.name} Annual (10% off, non-refundable)`,
      metadata: { tier: plan.key, billing: "annual", refundable: "no", policy: "non_refundable" },
    });

    results[plan.key] = {
      productId: product.id,
      monthlyPriceId: monthly.id,
      annualPriceId: annualPriceObj.id,
      monthlyAmount: plan.monthlyPrice,
      annualAmount: plan.annualPrice,
    };

    console.log(`  ✓ Product: ${product.id}`);
    console.log(`  ✓ Monthly: ${monthly.id}  ($${(plan.monthlyPrice/100).toFixed(2)}/mo)`);
    console.log(`  ✓ Annual:  ${annualPriceObj.id}  ($${(plan.annualPrice/100).toFixed(2)}/yr — non-refundable)\n`);
  }

  // User add-on
  console.log("Creating user add-on product...");
  const addonProduct = await stripe.products.create({
    name: USER_ADDON.name,
    description: USER_ADDON.description,
    metadata: { type: "user_addon", platform: "apex-crm" },
  });
  const addonPrice = await stripe.prices.create({
    product: addonProduct.id,
    unit_amount: USER_ADDON.price,
    currency: "usd",
    recurring: { interval: "month" },
    nickname: "Per User Add-On ($30/user/mo)",
    metadata: { type: "user_addon" },
  });
  results["user_addon"] = {
    productId: addonProduct.id,
    priceId: addonPrice.id,
  };
  console.log(`  ✓ Add-on Product: ${addonProduct.id}`);
  console.log(`  ✓ Add-on Price:   ${addonPrice.id}  ($30/user/mo)\n`);

  console.log("=".repeat(70));
  console.log("PRICE IDs — Store as environment secrets:\n");
  for (const [key, val] of Object.entries(results)) {
    if (key === "user_addon") {
      console.log(`STRIPE_PRICE_USER_ADDON=${val.priceId}`);
    } else {
      console.log(`STRIPE_PRICE_${key.toUpperCase()}_MONTHLY=${val.monthlyPriceId}`);
      console.log(`STRIPE_PRICE_${key.toUpperCase()}_ANNUAL=${val.annualPriceId}`);
    }
  }
  console.log("\nFull results:");
  console.log(JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
