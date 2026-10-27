/**
 * Application reference numbers, e.g. APP-2026-7K4Q-9XMD.
 *
 * - Crockford base32 alphabet (no I, L, O, U) so references are easy to read aloud.
 * - 8 random characters = 40 bits; uniqueness is still enforced by the database
 *   unique constraint, and the submit service retries on the rare collision.
 * - Not secret and not sequential: it reveals neither volume nor order.
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // 32 chars -> unbiased with & 31
const RANDOM_LENGTH = 8;

export type RandomSource = (bytes: Uint8Array) => Uint8Array;

const defaultRandom: RandomSource = (bytes) => globalThis.crypto.getRandomValues(bytes);

export function generateReference(now: Date = new Date(), random: RandomSource = defaultRandom): string {
  const bytes = random(new Uint8Array(RANDOM_LENGTH));
  let body = "";
  for (const byte of bytes) body += ALPHABET[byte & 31];
  return `APP-${now.getUTCFullYear()}-${body.slice(0, 4)}-${body.slice(4)}`;
}

const REFERENCE_PATTERN = /^APP-\d{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

export function isValidReference(value: string): boolean {
  return REFERENCE_PATTERN.test(value);
}
