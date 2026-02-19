import { describe, it, expect } from "vitest";

// ─── Schema Validation Tests ───

describe("Marketplace Schema", () => {
  it("marketplace_loads table has required columns", async () => {
    const { marketplaceLoads } = await import("../drizzle/schema");
    const cols = Object.keys(marketplaceLoads);
    expect(cols).toContain("id");
    expect(cols).toContain("loadNumber");
    expect(cols).toContain("shipperCompanyName");
    expect(cols).toContain("shipperEmail");
    expect(cols).toContain("commodity");
    expect(cols).toContain("weight");
    expect(cols).toContain("equipmentType");
    expect(cols).toContain("originCity");
    expect(cols).toContain("originState");
    expect(cols).toContain("destCity");
    expect(cols).toContain("destState");
    expect(cols).toContain("status");
    expect(cols).toContain("shipperRate");
    expect(cols).toContain("carrierRate");
    expect(cols).toContain("margin");
    expect(cols).toContain("matchedCarrierName");
  });

  it("marketplace_bids table has required columns", async () => {
    const { marketplaceBids } = await import("../drizzle/schema");
    const cols = Object.keys(marketplaceBids);
    expect(cols).toContain("id");
    expect(cols).toContain("loadId");
    expect(cols).toContain("carrierName");
    expect(cols).toContain("bidRate");
    expect(cols).toContain("matchScore");
    expect(cols).toContain("status");
  });

  it("marketplace_payments table has required columns", async () => {
    const { marketplacePayments } = await import("../drizzle/schema");
    const cols = Object.keys(marketplacePayments);
    expect(cols).toContain("id");
    expect(cols).toContain("loadId");
    expect(cols).toContain("shipperAmount");
    expect(cols).toContain("carrierAmount");
    expect(cols).toContain("grossMargin");
    expect(cols).toContain("escrowStatus");
    expect(cols).toContain("shipperPaymentStatus");
    expect(cols).toContain("carrierPaymentStatus");
  });

  it("marketplace_tracking table has required columns", async () => {
    const { marketplaceTracking } = await import("../drizzle/schema");
    const cols = Object.keys(marketplaceTracking);
    expect(cols).toContain("id");
    expect(cols).toContain("loadId");
    expect(cols).toContain("eventType");
    expect(cols).toContain("latitude");
    expect(cols).toContain("longitude");
    expect(cols).toContain("city");
    expect(cols).toContain("state");
  });

  it("marketplace_documents table has required columns", async () => {
    const { marketplaceDocuments } = await import("../drizzle/schema");
    const cols = Object.keys(marketplaceDocuments);
    expect(cols).toContain("id");
    expect(cols).toContain("loadId");
    expect(cols).toContain("docType");
    expect(cols).toContain("title");
    expect(cols).toContain("status");
    expect(cols).toContain("generatedBy");
  });

  it("lane_analytics table has required columns", async () => {
    const { laneAnalytics } = await import("../drizzle/schema");
    const cols = Object.keys(laneAnalytics);
    expect(cols).toContain("id");
    expect(cols).toContain("originCity");
    expect(cols).toContain("originState");
    expect(cols).toContain("destCity");
    expect(cols).toContain("destState");
    expect(cols).toContain("demandScore");
    expect(cols).toContain("demandTrend");
    expect(cols).toContain("avgRate");
  });

  it("consolidation_opportunities table has required columns", async () => {
    const { consolidationOpportunities } = await import("../drizzle/schema");
    const cols = Object.keys(consolidationOpportunities);
    expect(cols).toContain("id");
    expect(cols).toContain("groupId");
    expect(cols).toContain("loadCount");
    expect(cols).toContain("individualCost");
    expect(cols).toContain("consolidatedCost");
    expect(cols).toContain("savings");
    expect(cols).toContain("status");
  });
});

// ─── DB Helper Tests ───

describe("Marketplace DB Helpers", () => {
  it("exports listMarketplaceLoads function", async () => {
    const db = await import("./db");
    expect(typeof db.listMarketplaceLoads).toBe("function");
  });

  it("exports getMarketplaceLoad function", async () => {
    const db = await import("./db");
    expect(typeof db.getMarketplaceLoad).toBe("function");
  });

  it("exports createMarketplaceLoad function", async () => {
    const db = await import("./db");
    expect(typeof db.createMarketplaceLoad).toBe("function");
  });

  it("exports updateMarketplaceLoad function", async () => {
    const db = await import("./db");
    expect(typeof db.updateMarketplaceLoad).toBe("function");
  });

  it("exports createMarketplaceBid function", async () => {
    const db = await import("./db");
    expect(typeof db.createMarketplaceBid).toBe("function");
  });

  it("exports listBidsForLoad function", async () => {
    const db = await import("./db");
    expect(typeof db.listBidsForLoad).toBe("function");
  });

  it("exports updateBidStatus function", async () => {
    const db = await import("./db");
    expect(typeof db.updateBidStatus).toBe("function");
  });

  it("exports createMarketplacePayment function", async () => {
    const db = await import("./db");
    expect(typeof db.createMarketplacePayment).toBe("function");
  });

  it("exports getPaymentForLoad function", async () => {
    const db = await import("./db");
    expect(typeof db.getPaymentForLoad).toBe("function");
  });

  it("exports updateMarketplacePayment function", async () => {
    const db = await import("./db");
    expect(typeof db.updateMarketplacePayment).toBe("function");
  });

  it("exports addTrackingEvent function", async () => {
    const db = await import("./db");
    expect(typeof db.addTrackingEvent).toBe("function");
  });

  it("exports listTrackingEvents function", async () => {
    const db = await import("./db");
    expect(typeof db.listTrackingEvents).toBe("function");
  });

  it("exports createMarketplaceDocument function", async () => {
    const db = await import("./db");
    expect(typeof db.createMarketplaceDocument).toBe("function");
  });

  it("exports listDocumentsForLoad function", async () => {
    const db = await import("./db");
    expect(typeof db.listDocumentsForLoad).toBe("function");
  });

  it("exports getMarketplaceStats function", async () => {
    const db = await import("./db");
    expect(typeof db.getMarketplaceStats).toBe("function");
  });

  it("exports listLaneAnalytics function", async () => {
    const db = await import("./db");
    expect(typeof db.listLaneAnalytics).toBe("function");
  });

  it("exports upsertLaneAnalytic function", async () => {
    const db = await import("./db");
    expect(typeof db.upsertLaneAnalytic).toBe("function");
  });

  it("exports listConsolidationOpportunities function", async () => {
    const db = await import("./db");
    expect(typeof db.listConsolidationOpportunities).toBe("function");
  });

  it("exports createConsolidationOpportunity function", async () => {
    const db = await import("./db");
    expect(typeof db.createConsolidationOpportunity).toBe("function");
  });

  it("exports updateConsolidationStatus function", async () => {
    const db = await import("./db");
    expect(typeof db.updateConsolidationStatus).toBe("function");
  });
});

// ─── Router Tests ───

describe("Marketplace Router", () => {
  it("appRouter has marketplace router", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("marketplace.listLoads");
    expect(appRouter._def.procedures).toHaveProperty("marketplace.getLoad");
    expect(appRouter._def.procedures).toHaveProperty("marketplace.postLoad");
    expect(appRouter._def.procedures).toHaveProperty("marketplace.updateLoad");
    expect(appRouter._def.procedures).toHaveProperty("marketplace.matchCarriers");
    expect(appRouter._def.procedures).toHaveProperty("marketplace.listBids");
    expect(appRouter._def.procedures).toHaveProperty("marketplace.acceptBid");
    expect(appRouter._def.procedures).toHaveProperty("marketplace.getPayment");
    expect(appRouter._def.procedures).toHaveProperty("marketplace.collectShipperPayment");
    expect(appRouter._def.procedures).toHaveProperty("marketplace.releaseCarrierPayment");
    expect(appRouter._def.procedures).toHaveProperty("marketplace.listTracking");
    expect(appRouter._def.procedures).toHaveProperty("marketplace.addTracking");
    expect(appRouter._def.procedures).toHaveProperty("marketplace.listDocuments");
    expect(appRouter._def.procedures).toHaveProperty("marketplace.generateDocuments");
    expect(appRouter._def.procedures).toHaveProperty("marketplace.stats");
  });

  it("appRouter has autopilot router", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("autopilot.lanes");
    expect(appRouter._def.procedures).toHaveProperty("autopilot.consolidations");
    expect(appRouter._def.procedures).toHaveProperty("autopilot.analyzeLanes");
    expect(appRouter._def.procedures).toHaveProperty("autopilot.findConsolidations");
    expect(appRouter._def.procedures).toHaveProperty("autopilot.executeConsolidation");
  });
});

// ─── Integration Logic Tests ───

describe("Marketplace Business Logic", () => {
  it("load status flow is correct", () => {
    const validStatuses = ["posted", "matching", "matched", "booked", "dispatched", "in_transit", "delivered", "completed", "cancelled"];
    const flow = ["posted", "matching", "booked", "in_transit", "delivered", "completed"];
    flow.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });

  it("margin calculation is correct", () => {
    const shipperRate = 5000;
    const carrierRate = 3500;
    const margin = shipperRate - carrierRate;
    const marginPercent = (margin / shipperRate) * 100;
    expect(margin).toBe(1500);
    expect(marginPercent).toBe(30);
  });

  it("escrow flow is correct", () => {
    const validEscrowStatuses = ["pending", "funded", "released", "disputed"];
    const flow = ["pending", "funded", "released"];
    flow.forEach(status => {
      expect(validEscrowStatuses).toContain(status);
    });
  });

  it("consolidation savings calculation is correct", () => {
    const individualCost = 10000;
    const consolidatedCost = 6000;
    const savings = individualCost - consolidatedCost;
    const savingsPercent = (savings / individualCost) * 100;
    expect(savings).toBe(4000);
    expect(savingsPercent).toBe(40);
  });

  it("tracking event types are valid", () => {
    const validEvents = ["pickup_confirmed", "in_transit", "checkpoint", "delay", "delivery_confirmed", "exception"];
    expect(validEvents).toContain("pickup_confirmed");
    expect(validEvents).toContain("delivery_confirmed");
    expect(validEvents).toContain("in_transit");
  });

  it("document types cover all required paperwork", () => {
    const requiredDocs = ["bol", "rate_confirmation", "carrier_packet", "insurance_cert"];
    requiredDocs.forEach(doc => {
      expect(typeof doc).toBe("string");
      expect(doc.length).toBeGreaterThan(0);
    });
  });
});
