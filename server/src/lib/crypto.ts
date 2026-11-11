import crypto from "crypto";

// AES-256-GCM for secrets at rest (Gmail refresh tokens). The key comes from
// TOKEN_ENCRYPTION_KEY: 32 bytes as 64 hex chars or 44 base64 chars.
// Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

const ENV = "TOKEN_ENCRYPTION_KEY";

function getKey(): Buffer {
  const raw = process.env[ENV];
  if (!raw) throw new Error(`${ENV} env var is required`);
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error(`${ENV} must be 32 bytes (64 hex or 44 base64 characters)`);
  return key;
}

export function isEncryptionConfigured(): boolean {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

export function decrypt(payload: string): string {
  const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
