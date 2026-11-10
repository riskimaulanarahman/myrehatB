import { describe, expect, it } from "vitest";

import { formatPrice, getWhatsAppLink } from "./listing-format";

describe("getWhatsAppLink (null-guard for /listings)", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an empty string", ""],
    ["text without digits", "n/a"],
  ])("returns null for %s instead of throwing", (_case, value) => {
    expect(() => getWhatsAppLink(value)).not.toThrow();
    expect(getWhatsAppLink(value)).toBeNull();
  });

  it("builds a wa.me link from a formatted number", () => {
    expect(getWhatsAppLink("+60 12-345 6789")).toEqual({
      label: "+60 12-345 6789",
      href: "https://wa.me/60123456789",
    });
  });

  it("survives a row shaped by another API (contactWa instead of whatsapp)", () => {
    // This is the production response that caused the 500: `whatsapp` was missing.
    const row = { title: "Test", contactWa: "+60123456789" } as unknown as { whatsapp: string };

    // The pre-fix expression `item.whatsapp.replace(/\D/g, "")` crashes on this row.
    expect(() => row.whatsapp.replace(/\D/g, "")).toThrow(TypeError);
    expect(getWhatsAppLink(row.whatsapp)).toBeNull();
  });
});

describe("formatPrice", () => {
  it.each([
    [null, "-"],
    [undefined, "-"],
    ["", "-"],
    ["100000", "100,000"],
    ["250000.5", "250,000.50"],
    ["0.5", "0.50"],
  ])("formats %j as %j", (value, expected) => {
    expect(formatPrice(value)).toBe(expected);
  });
});
