/**
 * Credential Vault
 * AES-256-GCM encryption/decryption for stored migration API keys.
 * The encryption key is derived from JWT_SECRET so no additional secret is needed.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/** Derive a 32-byte key from JWT_SECRET */
function getDerivedKey(): Buffer {
  const secret = process.env.JWT_SECRET || "fallback-dev-secret-do-not-use-in-prod";
  return createHash("sha256").update(secret).digest();
}

/**
 * Encrypt a credentials object to a base64 string.
 * Format: iv(16 bytes) + authTag(16 bytes) + ciphertext — all base64-encoded together.
 */
export function encryptCredentials(credentials: Record<string, string>): string {
  const key = getDerivedKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(credentials);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Pack: iv | authTag | ciphertext
  const packed = Buffer.concat([iv, authTag, encrypted]);
  return packed.toString("base64");
}

/**
 * Decrypt a base64-encoded credential string back to the original object.
 * Returns null if decryption fails (tampered data, wrong key, etc.)
 */
export function decryptCredentials(encoded: string): Record<string, string> | null {
  try {
    const key = getDerivedKey();
    const packed = Buffer.from(encoded, "base64");

    if (packed.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) return null;

    const iv = packed.subarray(0, IV_LENGTH);
    const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8"));
  } catch {
    return null;
  }
}
