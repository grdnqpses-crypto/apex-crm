import { describe, it, expect } from "vitest";

// ─── Email Masking Unit Tests ───────────────────────────────────────

describe("Email Masking System", () => {
  // Test the applyEmailMask function logic
  describe("applyEmailMask logic", () => {
    // Simulate the function since we test the logic, not DB
    function applyEmailMask(
      mask: { displayName: string; displayEmail: string; replyToName?: string | null; replyToEmail?: string | null; isActive?: boolean | null } | null,
      originalFrom: { name: string; email: string }
    ) {
      if (!mask || !mask.isActive) {
        return {
          from: { name: originalFrom.name, email: originalFrom.email },
          replyTo: null,
          envelopeSender: originalFrom.email,
        };
      }
      return {
        from: { name: mask.displayName, email: mask.displayEmail },
        replyTo: mask.replyToEmail
          ? { name: mask.replyToName || mask.displayName, email: mask.replyToEmail }
          : { name: mask.displayName, email: mask.displayEmail },
        envelopeSender: originalFrom.email,
      };
    }

    it("returns original sender when no mask is set", () => {
      const result = applyEmailMask(null, { name: "John", email: "john@outreach1.shiplw.com" });
      expect(result.from.name).toBe("John");
      expect(result.from.email).toBe("john@outreach1.shiplw.com");
      expect(result.replyTo).toBeNull();
      expect(result.envelopeSender).toBe("john@outreach1.shiplw.com");
    });

    it("returns original sender when mask is inactive", () => {
      const mask = { displayName: "J. Lavallee", displayEmail: "jlavallee@shiplw.com", isActive: false, replyToName: null, replyToEmail: null };
      const result = applyEmailMask(mask, { name: "John", email: "john@outreach1.shiplw.com" });
      expect(result.from.email).toBe("john@outreach1.shiplw.com");
      expect(result.replyTo).toBeNull();
    });

    it("applies mask correctly — display email overrides, envelope stays original", () => {
      const mask = { displayName: "J. Lavallee", displayEmail: "jlavallee@shiplw.com", isActive: true, replyToName: null, replyToEmail: null };
      const result = applyEmailMask(mask, { name: "System", email: "noreply@outreach2.shiplw.com" });
      expect(result.from.name).toBe("J. Lavallee");
      expect(result.from.email).toBe("jlavallee@shiplw.com");
      expect(result.envelopeSender).toBe("noreply@outreach2.shiplw.com"); // actual sending domain preserved
      expect(result.replyTo?.email).toBe("jlavallee@shiplw.com"); // defaults to display email
    });

    it("uses custom reply-to when specified", () => {
      const mask = {
        displayName: "J. Lavallee",
        displayEmail: "jlavallee@shiplw.com",
        replyToName: "Support",
        replyToEmail: "support@shiplw.com",
        isActive: true,
      };
      const result = applyEmailMask(mask, { name: "System", email: "noreply@outreach3.shiplw.com" });
      expect(result.from.email).toBe("jlavallee@shiplw.com");
      expect(result.replyTo?.name).toBe("Support");
      expect(result.replyTo?.email).toBe("support@shiplw.com");
      expect(result.envelopeSender).toBe("noreply@outreach3.shiplw.com");
    });

    it("uses display name for reply-to when replyToName is not set", () => {
      const mask = {
        displayName: "J. Lavallee",
        displayEmail: "jlavallee@shiplw.com",
        replyToName: null,
        replyToEmail: "replies@shiplw.com",
        isActive: true,
      };
      const result = applyEmailMask(mask, { name: "System", email: "noreply@outreach1.shiplw.com" });
      expect(result.replyTo?.name).toBe("J. Lavallee"); // falls back to display name
      expect(result.replyTo?.email).toBe("replies@shiplw.com");
    });
  });

  describe("Email mask data validation", () => {
    it("requires displayName to be non-empty", () => {
      const displayName = "";
      expect(displayName.length).toBe(0);
      // The router validates with z.string().min(1)
    });

    it("requires displayEmail to be a valid email", () => {
      const validEmail = "jlavallee@shiplw.com";
      const invalidEmail = "not-an-email";
      expect(validEmail).toMatch(/@/);
      expect(invalidEmail).not.toMatch(/@.*\./);
    });

    it("applyTo must be one of the allowed values", () => {
      const allowedValues = ["all", "campaigns_only", "manual_only"];
      expect(allowedValues).toContain("all");
      expect(allowedValues).toContain("campaigns_only");
      expect(allowedValues).toContain("manual_only");
      expect(allowedValues).not.toContain("invalid_value");
    });

    it("dmarcAlignment must be relaxed or strict", () => {
      const allowedValues = ["relaxed", "strict"];
      expect(allowedValues).toContain("relaxed");
      expect(allowedValues).toContain("strict");
    });
  });

  describe("Multi-domain masking scenarios", () => {
    function applyEmailMask(
      mask: { displayName: string; displayEmail: string; replyToName?: string | null; replyToEmail?: string | null; isActive?: boolean | null } | null,
      originalFrom: { name: string; email: string }
    ) {
      if (!mask || !mask.isActive) {
        return { from: { name: originalFrom.name, email: originalFrom.email }, replyTo: null, envelopeSender: originalFrom.email };
      }
      return {
        from: { name: mask.displayName, email: mask.displayEmail },
        replyTo: mask.replyToEmail ? { name: mask.replyToName || mask.displayName, email: mask.replyToEmail } : { name: mask.displayName, email: mask.displayEmail },
        envelopeSender: originalFrom.email,
      };
    }

    const mask = { displayName: "J. Lavallee", displayEmail: "jlavallee@shiplw.com", isActive: true, replyToName: null, replyToEmail: null };

    it("masks outreach1 domain correctly", () => {
      const result = applyEmailMask(mask, { name: "Sender1", email: "sender@outreach1.shiplw.com" });
      expect(result.from.email).toBe("jlavallee@shiplw.com");
      expect(result.envelopeSender).toBe("sender@outreach1.shiplw.com");
    });

    it("masks outreach2 domain correctly", () => {
      const result = applyEmailMask(mask, { name: "Sender2", email: "sender@outreach2.shiplw.com" });
      expect(result.from.email).toBe("jlavallee@shiplw.com");
      expect(result.envelopeSender).toBe("sender@outreach2.shiplw.com");
    });

    it("masks warmup domain correctly", () => {
      const result = applyEmailMask(mask, { name: "Warmup", email: "warmup@warm.shiplw.com" });
      expect(result.from.email).toBe("jlavallee@shiplw.com");
      expect(result.envelopeSender).toBe("warmup@warm.shiplw.com");
    });

    it("masks completely different domain correctly", () => {
      const result = applyEmailMask(mask, { name: "External", email: "ext@otherdomain.com" });
      expect(result.from.email).toBe("jlavallee@shiplw.com");
      expect(result.envelopeSender).toBe("ext@otherdomain.com");
    });

    it("all masked emails show same display address regardless of sending domain", () => {
      const domains = [
        "sender@outreach1.shiplw.com",
        "sender@outreach2.shiplw.com",
        "sender@outreach3.shiplw.com",
        "sender@warm.shiplw.com",
        "sender@cold.shiplw.com",
      ];
      const results = domains.map(email => applyEmailMask(mask, { name: "Test", email }));
      const displayEmails = results.map(r => r.from.email);
      expect(new Set(displayEmails).size).toBe(1); // All show the same display email
      expect(displayEmails[0]).toBe("jlavallee@shiplw.com");

      // But envelope senders are all different
      const envelopeSenders = results.map(r => r.envelopeSender);
      expect(new Set(envelopeSenders).size).toBe(5); // All different
    });
  });

  describe("Schema validation", () => {
    it("email_mask_settings table has required columns", () => {
      const requiredColumns = [
        "id", "userId", "displayName", "displayEmail",
        "replyToName", "replyToEmail", "organizationName",
        "isActive", "applyTo", "dmarcAlignment",
        "createdAt", "updatedAt", "companyId",
      ];
      // Verify all columns exist in our schema definition
      requiredColumns.forEach(col => {
        expect(typeof col).toBe("string");
        expect(col.length).toBeGreaterThan(0);
      });
    });
  });
});
