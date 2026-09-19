import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// Accepts either a 32-byte hex secret or any other sufficiently long secret string,
// which is stretched into a 32-byte key. This keeps a correctly provisioned secret
// byte-identical while tolerating non-hex secret formats.
function encryptionKey() {
  const value = process.env["LICENSE_ENCRYPTION_KEY"];
  if (!value || value.trim().length < 32) {
    throw new Error("License encryption is not configured");
  }
  const secret = value.trim();
  if (/^[a-fA-F0-9]{64}$/.test(secret)) return Buffer.from(secret, "hex");
  return createHash("sha256").update(secret, "utf8").digest();
}

export function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function generateLicenseKey() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(20);
  const value = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `LXC-${value.slice(0, 5)}-${value.slice(5, 10)}-${value.slice(10, 15)}-${value.slice(15)}`;
}

export function encryptLicenseKey(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptLicenseKey(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) throw new Error("Invalid encrypted license key");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
}