import { createHash, randomBytes } from "node:crypto";

/** 256-bit secret, URL-safe, 43 characters. Given to the uploader, never stored. */
export function newUploadToken(): string {
  return randomBytes(32).toString("base64url");
}

/** What the database stores in place of the token. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Rate-limit keys use a hash so raw IP addresses are not kept in Redis. */
export function hashClientId(value: string): string {
  return createHash("sha256").update(`rl:${value}`).digest("hex").slice(0, 32);
}
