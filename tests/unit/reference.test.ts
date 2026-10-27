import { describe, expect, it } from "vitest";
import { generateReference, isValidReference } from "@/lib/domain/reference";

describe("generateReference", () => {
  it("uses the year and the expected format", () => {
    const ref = generateReference(new Date("2026-10-27T10:00:00Z"));
    expect(ref).toMatch(/^APP-2026-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    expect(isValidReference(ref)).toBe(true);
  });

  it("never uses ambiguous letters I, L, O or U", () => {
    for (let i = 0; i < 2000; i++) {
      expect(generateReference().slice(9)).not.toMatch(/[ILOU]/);
    }
  });

  it("is deterministic for a given random source", () => {
    const fixed = (b: Uint8Array) => b.fill(0);
    expect(generateReference(new Date("2026-01-01T00:00:00Z"), fixed)).toBe("APP-2026-0000-0000");
  });

  it("produces unique values across many draws", () => {
    const seen = new Set(Array.from({ length: 10_000 }, () => generateReference()));
    expect(seen.size).toBe(10_000);
  });

  it("rejects malformed references", () => {
    expect(isValidReference("APP-2026-ABCD")).toBe(false);
    expect(isValidReference("APP-2026-ABCI-0000")).toBe(false);
    expect(isValidReference("app-2026-abcd-0000")).toBe(false);
  });
});
