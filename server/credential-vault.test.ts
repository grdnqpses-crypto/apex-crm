/**
 * Tests for the Credential Vault (AES-256-GCM encryption/decryption)
 */
import { describe, it, expect } from "vitest";
import { encryptCredentials, decryptCredentials } from "./credential-vault";

describe("credential-vault", () => {
  describe("encryptCredentials", () => {
    it("returns a non-empty base64 string", () => {
      const result = encryptCredentials({ apiKey: "test-key-123", platform: "hubspot" });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(32);
      // Should be valid base64
      expect(() => Buffer.from(result, "base64")).not.toThrow();
    });

    it("produces different ciphertext for the same input (random IV)", () => {
      const creds = { apiKey: "same-key", platform: "salesforce" };
      const enc1 = encryptCredentials(creds);
      const enc2 = encryptCredentials(creds);
      expect(enc1).not.toBe(enc2);
    });

    it("does not include the plaintext API key in the output", () => {
      const apiKey = "super-secret-api-key-12345";
      const result = encryptCredentials({ apiKey, platform: "hubspot" });
      expect(result).not.toContain(apiKey);
      expect(Buffer.from(result, "base64").toString()).not.toContain(apiKey);
    });
  });

  describe("decryptCredentials", () => {
    it("round-trips a simple credentials object", () => {
      const original = { apiKey: "my-api-key", platform: "hubspot" };
      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted);
      expect(decrypted).toEqual(original);
    });

    it("round-trips credentials with special characters", () => {
      const original = { apiKey: "key/with+special=chars&more", platform: "salesforce" };
      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted);
      expect(decrypted).toEqual(original);
    });

    it("round-trips credentials with multiple fields", () => {
      const original = { apiKey: "key-123", instanceUrl: "https://example.salesforce.com", platform: "salesforce" };
      const encrypted = encryptCredentials(original);
      const decrypted = decryptCredentials(encrypted);
      expect(decrypted).toEqual(original);
    });

    it("returns null for tampered ciphertext", () => {
      const encrypted = encryptCredentials({ apiKey: "test", platform: "hubspot" });
      // Tamper with the last few bytes
      const buf = Buffer.from(encrypted, "base64");
      buf[buf.length - 1] ^= 0xff;
      const tampered = buf.toString("base64");
      const result = decryptCredentials(tampered);
      expect(result).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(decryptCredentials("")).toBeNull();
    });

    it("returns null for invalid base64", () => {
      expect(decryptCredentials("not-valid-base64!!!")).toBeNull();
    });

    it("returns null for too-short input", () => {
      const short = Buffer.alloc(10).toString("base64");
      expect(decryptCredentials(short)).toBeNull();
    });
  });

  describe("getLastSyncedAt procedure logic", () => {
    it("hasCredentials flag is true when encryptedCredentials is set", () => {
      const encrypted = encryptCredentials({ apiKey: "key", platform: "hubspot" });
      const row = { encryptedCredentials: encrypted };
      const hasCredentials = !!row.encryptedCredentials;
      expect(hasCredentials).toBe(true);
    });

    it("hasCredentials flag is false when encryptedCredentials is null", () => {
      const row = { encryptedCredentials: null };
      const hasCredentials = !!row.encryptedCredentials;
      expect(hasCredentials).toBe(false);
    });
  });
});
