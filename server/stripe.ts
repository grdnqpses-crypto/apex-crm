import Stripe from "stripe";
import { getDb } from "./db";
import { tenantCompanies } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { Express, Request, Response } from "express";
import express from "express";

// ─── Stripe Client ───
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2026-02-25.clover" })
  : null;

// ─── Register Stripe Webhook Route ───
// MUST be registered before express.json() to allow raw body access
export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

      let event: Stripe.Event;
      try {
        if (!stripe) {
          return res.status(400).json({ error: "Stripe not configured" });
        }
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      // ─── Handle test events ───
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const tenantCompanyId = session.metadata?.tenant_company_id
              ? parseInt(session.metadata.tenant_company_id)
              : null;
            const tier = session.metadata?.plan_tier as "success_starter" | "growth_foundation" | "fortune_foundation" | "fortune" | "fortune_plus" | null;
            const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
            const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

            if (tenantCompanyId && tier) {
              const drizzleDb = await getDb();
              if (drizzleDb) {
                await drizzleDb.update(tenantCompanies)
                  .set({
                    subscriptionTier: tier,
                    subscriptionStatus: "active",
                    stripeCustomerId: customerId || undefined,
                    stripeSubscriptionId: subscriptionId || undefined,
                    updatedAt: Date.now(),
                  })
                  .where(eq(tenantCompanies.id, tenantCompanyId));
                console.log(`[Stripe] Company ${tenantCompanyId} upgraded to ${tier}`);
              }
            }
            break;
          }

          case "customer.subscription.updated": {
            const sub = event.data.object as Stripe.Subscription;
            const drizzleDb = await getDb();
            if (drizzleDb && sub.id) {
              const status = sub.status === "active" ? "active"
                : sub.status === "canceled" ? "cancelled"
                : sub.status === "past_due" ? "suspended"
                : "expired";
              await drizzleDb.update(tenantCompanies)
                .set({ subscriptionStatus: status as any, updatedAt: Date.now() })
                .where(eq(tenantCompanies.stripeSubscriptionId, sub.id));
            }
            break;
          }

          case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            const drizzleDb = await getDb();
            if (drizzleDb && sub.id) {
              await drizzleDb.update(tenantCompanies)
                .set({
                  subscriptionStatus: "cancelled",
                  subscriptionTier: "trial",
                  stripeSubscriptionId: null,
                  updatedAt: Date.now(),
                })
                .where(eq(tenantCompanies.stripeSubscriptionId, sub.id));
            }
            break;
          }

          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
            const drizzleDb = await getDb();
            if (drizzleDb && customerId) {
              await drizzleDb.update(tenantCompanies)
                .set({ subscriptionStatus: "suspended", updatedAt: Date.now() })
                .where(eq(tenantCompanies.stripeCustomerId, customerId));
            }
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error("[Stripe Webhook] Error processing event:", err);
        return res.status(500).json({ error: "Webhook processing failed" });
      }

      res.json({ received: true });
    }
  );
}
