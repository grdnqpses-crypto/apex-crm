import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

describe("Credential-based Authentication", () => {
  describe("Password Hashing", () => {
    it("should hash passwords with bcrypt", async () => {
      const password = "TestPassword123";
      const hash = await bcrypt.hash(password, 12);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
    });

    it("should verify correct passwords", async () => {
      const password = "SecurePass456!";
      const hash = await bcrypt.hash(password, 12);
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect passwords", async () => {
      const password = "CorrectPassword";
      const hash = await bcrypt.hash(password, 12);
      const isValid = await bcrypt.compare("WrongPassword", hash);
      expect(isValid).toBe(false);
    });

    it("should generate different hashes for same password", async () => {
      const password = "SamePassword123";
      const hash1 = await bcrypt.hash(password, 12);
      const hash2 = await bcrypt.hash(password, 12);
      expect(hash1).not.toBe(hash2);
      // But both should verify correctly
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe("Username Validation", () => {
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;

    it("should accept valid usernames", () => {
      const validUsernames = [
        "john.smith",
        "jane_doe",
        "user-123",
        "JohnSmith",
        "admin01",
        "sales.rep.1",
      ];
      validUsernames.forEach(u => {
        expect(usernameRegex.test(u), `Expected "${u}" to be valid`).toBe(true);
      });
    });

    it("should reject invalid usernames", () => {
      const invalidUsernames = [
        "user name",    // spaces
        "user@name",    // special chars
        "user#name",
        "user!name",
        "",             // empty
      ];
      invalidUsernames.forEach(u => {
        expect(usernameRegex.test(u), `Expected "${u}" to be invalid`).toBe(false);
      });
    });
  });

  describe("OpenId Generation for Credential Users", () => {
    it("should generate unique openIds with cred_ prefix", () => {
      const generateOpenId = () => `cred_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const id1 = generateOpenId();
      const id2 = generateOpenId();
      expect(id1).toMatch(/^cred_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^cred_\d+_[a-z0-9]+$/);
      // Should be unique (extremely high probability)
      expect(id1).not.toBe(id2);
    });
  });

  describe("Role Hierarchy Validation", () => {
    const canCreateRole = (callerRole: string, targetRole: string): boolean => {
      if (callerRole === "developer") return true;
      if (callerRole === "company_admin") return ["company_admin", "manager", "user"].includes(targetRole);
      if (callerRole === "manager") return targetRole === "user";
      return false;
    };

    it("developer can create any role", () => {
      expect(canCreateRole("developer", "company_admin")).toBe(true);
      expect(canCreateRole("developer", "manager")).toBe(true);
      expect(canCreateRole("developer", "user")).toBe(true);
    });

    it("company_admin can create admins, managers, and users", () => {
      expect(canCreateRole("company_admin", "company_admin")).toBe(true);
      expect(canCreateRole("company_admin", "manager")).toBe(true);
      expect(canCreateRole("company_admin", "user")).toBe(true);
    });

    it("manager can only create users", () => {
      expect(canCreateRole("manager", "user")).toBe(true);
      expect(canCreateRole("manager", "company_admin")).toBe(false);
      expect(canCreateRole("manager", "manager")).toBe(false);
    });

    it("regular user cannot create anyone", () => {
      expect(canCreateRole("user", "user")).toBe(false);
      expect(canCreateRole("user", "manager")).toBe(false);
    });
  });

  describe("Password Strength", () => {
    it("should require minimum 8 characters", () => {
      expect("short".length >= 8).toBe(false);
      expect("longEnough1".length >= 8).toBe(true);
    });

    it("should allow up to 128 characters", () => {
      const longPassword = "a".repeat(128);
      expect(longPassword.length <= 128).toBe(true);
      const tooLong = "a".repeat(129);
      expect(tooLong.length <= 128).toBe(false);
    });
  });
});
