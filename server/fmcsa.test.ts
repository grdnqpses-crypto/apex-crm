import { describe, it, expect } from "vitest";
import { NEW_BROKER_TEMPLATE_HTML, RENEWING_BROKER_TEMPLATE_HTML } from "./fmcsa-templates";

describe("FMCSA Broker Filing Feature", () => {
  describe("Email Templates", () => {
    it("new broker template contains congratulations messaging", () => {
      expect(NEW_BROKER_TEMPLATE_HTML).toContain("Congratulations");
      expect(NEW_BROKER_TEMPLATE_HTML).toContain("New Brokerage Authority");
    });

    it("new broker template offers 2-month free trial", () => {
      expect(NEW_BROKER_TEMPLATE_HTML).toContain("2 MONTHS FREE");
      expect(NEW_BROKER_TEMPLATE_HTML).toContain("No Credit Card Required");
    });

    it("new broker template explains CRM benefits", () => {
      expect(NEW_BROKER_TEMPLATE_HTML).toContain("Paradigm Intelligence Engine");
      expect(NEW_BROKER_TEMPLATE_HTML).toContain("Automated Email Campaigns");
      expect(NEW_BROKER_TEMPLATE_HTML).toContain("Ghost Sequence Automation");
      expect(NEW_BROKER_TEMPLATE_HTML).toContain("Deal Pipeline Management");
    });

    it("new broker template has proper HTML structure", () => {
      expect(NEW_BROKER_TEMPLATE_HTML).toContain("<!DOCTYPE html>");
      expect(NEW_BROKER_TEMPLATE_HTML).toContain("</html>");
      expect(NEW_BROKER_TEMPLATE_HTML).toContain("Start Your Free Trial");
    });

    it("new broker template includes unsubscribe link", () => {
      expect(NEW_BROKER_TEMPLATE_HTML).toContain("Unsubscribe");
    });

    it("renewing broker template thanks for continued support", () => {
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("Thank You for Your Dedication");
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("continued commitment");
    });

    it("renewing broker template empathizes with industry struggles", () => {
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("We know it hasn't been easy");
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("Rising fuel costs");
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("Tightening margins");
    });

    it("renewing broker template shows competitor pricing", () => {
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("HubSpot");
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("Salesforce");
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("Outreach.io");
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("$450/mo");
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("$300/mo");
    });

    it("renewing broker template shows savings amount", () => {
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("Save $3,000 - $12,000/year");
    });

    it("renewing broker template offers 2-month free trial", () => {
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("2 MONTHS FREE");
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("Zero Risk");
    });

    it("renewing broker template includes one-click import", () => {
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("One-Click Import");
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("Switch in 60 Seconds");
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("single click");
    });

    it("renewing broker template explains easy onboarding", () => {
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("Sign Up (30 seconds)");
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("Import Your Data (60 seconds)");
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("Start Working (Immediately)");
    });

    it("renewing broker template has join and demo CTAs", () => {
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("Join AXIOM CRM Free");
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("Schedule a Quick Demo Instead");
    });

    it("renewing broker template includes unsubscribe link", () => {
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("Unsubscribe");
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("Privacy Policy");
    });

    it("renewing broker template has proper HTML structure", () => {
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("<!DOCTYPE html>");
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("</html>");
    });
  });

  describe("Router Structure", () => {
    it("brokerFilings router module exists", async () => {
      const mod = await import("./routers");
      expect(mod.appRouter).toBeDefined();
    });

    it("fmcsa-templates module exports both templates", async () => {
      const mod = await import("./fmcsa-templates");
      expect(mod.NEW_BROKER_TEMPLATE_HTML).toBeDefined();
      expect(mod.RENEWING_BROKER_TEMPLATE_HTML).toBeDefined();
      expect(typeof mod.NEW_BROKER_TEMPLATE_HTML).toBe("string");
      expect(typeof mod.RENEWING_BROKER_TEMPLATE_HTML).toBe("string");
      expect(mod.NEW_BROKER_TEMPLATE_HTML.length).toBeGreaterThan(1000);
      expect(mod.RENEWING_BROKER_TEMPLATE_HTML.length).toBeGreaterThan(1000);
    });
  });

  describe("Template Content Quality", () => {
    it("new broker template does not contain placeholder text", () => {
      expect(NEW_BROKER_TEMPLATE_HTML).not.toContain("Lorem ipsum");
      expect(NEW_BROKER_TEMPLATE_HTML).not.toContain("[INSERT");
      expect(NEW_BROKER_TEMPLATE_HTML).not.toContain("TODO");
    });

    it("renewing broker template does not contain placeholder text", () => {
      expect(RENEWING_BROKER_TEMPLATE_HTML).not.toContain("Lorem ipsum");
      expect(RENEWING_BROKER_TEMPLATE_HTML).not.toContain("[INSERT");
      expect(RENEWING_BROKER_TEMPLATE_HTML).not.toContain("TODO");
    });

    it("new broker template mentions DOT/FMCSA", () => {
      expect(NEW_BROKER_TEMPLATE_HTML).toContain("FMCSA");
    });

    it("renewing broker template mentions FMCSA", () => {
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain("FMCSA");
    });

    it("templates are responsive (contain viewport meta)", () => {
      expect(NEW_BROKER_TEMPLATE_HTML).toContain('name="viewport"');
      expect(RENEWING_BROKER_TEMPLATE_HTML).toContain('name="viewport"');
    });
  });
});
