import { describe, it, expect, vi, afterEach } from "vitest";
import { clampStaleDays, getStaleDays, DEFAULT_STALE_DAYS } from "./settings";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("clampStaleDays", () => {
  it("rounds and clamps to 1-365", () => {
    expect(clampStaleDays(14.6)).toBe(15);
    expect(clampStaleDays(0)).toBe(1);
    expect(clampStaleDays(9999)).toBe(365);
  });

  it("falls back to the default for non-numbers", () => {
    expect(clampStaleDays(Number.NaN)).toBe(DEFAULT_STALE_DAYS);
  });
});

describe("getStaleDays", () => {
  it("reads and clamps the stored value", () => {
    vi.stubGlobal("localStorage", { getItem: () => "14" });
    expect(getStaleDays()).toBe(14);
    vi.stubGlobal("localStorage", { getItem: () => "0" });
    expect(getStaleDays()).toBe(1);
  });

  it("returns the default when nothing is stored", () => {
    vi.stubGlobal("localStorage", { getItem: () => null });
    expect(getStaleDays()).toBe(DEFAULT_STALE_DAYS);
  });

  it("returns the default when storage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
    });
    expect(getStaleDays()).toBe(DEFAULT_STALE_DAYS);
  });
});
