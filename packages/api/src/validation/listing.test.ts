import { describe, expect, it } from "vitest";

import { BUY_HOMESTAY_CATEGORIES, listingCategorySchema, listingInputSchema } from "./listing";

const validListing = {
  title: "Beachfront homestay",
  price: "250000.50",
  location: "Kuantan, Pahang",
  category: "Buy Property",
  whatsapp: "+60123456789",
};

describe("listing categories", () => {
  it("defines exactly the four BuyHomestay categories", () => {
    expect(BUY_HOMESTAY_CATEGORIES).toEqual([
      "Buy Property",
      "Buy land to build homestay",
      "Buy Airbnb Profile",
      "Buy Airbnb Business",
    ]);
  });

  it.each([
    "Buy Property",
    "Buy land to build homestay",
    "Buy Airbnb Profile",
    "Buy Airbnb Business",
  ])("accepts %s", (category) => {
    expect(listingCategorySchema.safeParse(category).success).toBe(true);
    expect(listingInputSchema.safeParse({ ...validListing, category }).success).toBe(true);
  });

  it.each(["Rent Property", "buy property", "Buy Property ", ""])("rejects %j", (category) => {
    expect(listingInputSchema.safeParse({ ...validListing, category }).success).toBe(false);
  });
});

describe("listing input validation", () => {
  it.each(["title", "location", "whatsapp", "price"] as const)("rejects an empty %s", (field) => {
    expect(listingInputSchema.safeParse({ ...validListing, [field]: "  " }).success).toBe(false);
  });

  it.each(["100000", "250000.50", "0.5"])("accepts price %s", (price) => {
    expect(listingInputSchema.safeParse({ ...validListing, price }).success).toBe(true);
  });

  it.each(["0", "0.00", "-5", "abc", "1.005", "1e5"])("rejects price %s", (price) => {
    expect(listingInputSchema.safeParse({ ...validListing, price }).success).toBe(false);
  });

  it("strips a client-supplied userId", () => {
    const result = listingInputSchema.parse({ ...validListing, userId: "attacker" });
    expect(result).not.toHaveProperty("userId");
  });
});
