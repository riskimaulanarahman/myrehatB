import { describe, expect, it, vi } from "vitest";

import { createSearchListingsTool, MAX_SEARCH_RESULTS, searchListings } from "./listing-search";

const listing = (title: string, price: string, location = "Pahang", category = "Buy Property") => ({
  title,
  price,
  location,
  category,
  whatsapp: "+60123456789",
});

const listings = [
  listing("Vila Elite", "10000"),
  listing("Beach land", "250000.50", "Kuantan, Pahang", "Buy land to build homestay"),
  listing("City Airbnb", "900000", "Johor", "Buy Airbnb Business"),
  listing("Old row", "RM 500", "Serang"),
];

const titles = (filters: Parameters<typeof searchListings>[1]) =>
  searchListings(listings, filters).results.map((item) => item.title);

describe("searchListings", () => {
  it("returns everything without filters, including a non-numeric price", () => {
    expect(searchListings(listings, {}).total).toBe(4);
  });

  it("compares prices as numbers, not as text", () => {
    expect(titles({ minPrice: 9000, maxPrice: 300000 })).toEqual(["Vila Elite", "Beach land"]);
    expect(titles({ maxPrice: 10000 })).toEqual(["Vila Elite"]);
    expect(titles({ minPrice: 900000 })).toEqual(["City Airbnb"]);
  });

  it("includes the exact range boundaries", () => {
    expect(titles({ minPrice: 250000.5, maxPrice: 250000.5 })).toEqual(["Beach land"]);
  });

  it("leaves non-numeric prices out of a price filter", () => {
    expect(titles({ maxPrice: 1000 })).toEqual([]);
  });

  it("matches keyword and location case-insensitively", () => {
    expect(titles({ keyword: "beach" })).toEqual(["Beach land"]);
    expect(titles({ location: "PAHANG" })).toEqual(["Vila Elite", "Beach land"]);
  });

  it("combines filters", () => {
    expect(titles({ location: "pahang", category: "Buy Property" })).toEqual(["Vila Elite"]);
    expect(titles({ location: "johor", maxPrice: 100 })).toEqual([]);
  });

  it("ignores blank text filters", () => {
    expect(searchListings(listings, { keyword: "  ", location: "" }).total).toBe(4);
  });

  it("limits the results but reports the full total", () => {
    const many = Array.from({ length: MAX_SEARCH_RESULTS + 5 }, (_, index) =>
      listing(`Home ${index}`, "100"),
    );

    const found = searchListings(many, {});

    expect(found.total).toBe(MAX_SEARCH_RESULTS + 5);
    expect(found.results).toHaveLength(MAX_SEARCH_RESULTS);
  });

  it("only exposes the public listing fields", () => {
    const row = { ...listing("Vila Elite", "10000"), id: "secret-id", userId: "secret-user" };

    expect(Object.keys(searchListings([row], {}).results[0] ?? {}).sort()).toEqual([
      "category",
      "location",
      "price",
      "title",
      "whatsapp",
    ]);
  });
});

describe("createSearchListingsTool", () => {
  const run = (fetchListings: () => Promise<typeof listings>, filters = {}) =>
    createSearchListingsTool(fetchListings).execute?.(filters, { toolCallId: "1", messages: [] } as never);

  it("searches the fetched listings", async () => {
    const result = await run(async () => listings, { maxPrice: 10000 });
    expect(result).toMatchObject({ total: 1, results: [{ title: "Vila Elite" }] });
  });

  it("returns a generic error when the API fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await run(async () => {
      throw new Error("upstream secret detail");
    });

    expect(result).toStrictEqual({ error: "Listings are unavailable right now" });
  });
});
