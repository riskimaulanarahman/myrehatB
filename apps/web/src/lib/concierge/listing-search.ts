import type { AppRouterClient } from "@myrehat-task-b/api/routers/index";
import { BUY_HOMESTAY_CATEGORIES } from "@myrehat-task-b/api/validation/listing";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { tool } from "ai";
import z from "zod";

// Keeps the data sent to the model (and its cost) small.
export const MAX_SEARCH_RESULTS = 10;

export type SearchableListing = {
  title: string;
  price: string;
  location: string;
  category: string;
  whatsapp: string;
};

export const listingSearchSchema = z.object({
  keyword: z.string().max(100).optional().describe("Word or phrase to find in the listing title"),
  category: z.enum(BUY_HOMESTAY_CATEGORIES).optional(),
  location: z.string().max(100).optional().describe("Place name, for example a city or state"),
  minPrice: z.number().nonnegative().optional().describe("Lowest price, as a plain number"),
  maxPrice: z.number().nonnegative().optional().describe("Highest price, as a plain number"),
});

export type ListingSearchFilters = z.infer<typeof listingSearchSchema>;

// `price` is stored as text, and older rows may not hold a plain number.
function parsePrice(price: unknown): number | null {
  return typeof price === "string" && /^\d+(\.\d+)?$/.test(price.trim()) ? Number(price) : null;
}

function includesText(value: unknown, search: string): boolean {
  return typeof value === "string" && value.toLowerCase().includes(search.trim().toLowerCase());
}

/** Filters listings. A price filter only matches rows whose price is a plain number. */
export function searchListings(listings: SearchableListing[], filters: ListingSearchFilters) {
  const { keyword, category, location, minPrice, maxPrice } = filters;
  const hasPriceFilter = minPrice !== undefined || maxPrice !== undefined;

  const matches = listings.filter((item) => {
    if (keyword?.trim() && !includesText(item.title, keyword)) return false;
    if (category && item.category !== category) return false;
    if (location?.trim() && !includesText(item.location, location)) return false;
    if (!hasPriceFilter) return true;

    const price = parsePrice(item.price);
    if (price === null) return false;
    return (minPrice === undefined || price >= minPrice) && (maxPrice === undefined || price <= maxPrice);
  });

  return {
    total: matches.length,
    results: matches.slice(0, MAX_SEARCH_RESULTS).map(({ title, price, location, category, whatsapp }) => ({
      title,
      price,
      location,
      category,
      whatsapp,
    })),
  };
}

/**
 * Reads the public listings from the API. The shared client in utils/orpc forwards the incoming
 * request headers (including content-length), which is wrong for a request made from this POST route.
 */
async function fetchPublicListings(): Promise<SearchableListing[]> {
  const serverUrl = (process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || "").replace(/\/$/, "");
  const client: AppRouterClient = createORPCClient(new RPCLink({ url: `${serverUrl}/rpc` }));
  return client.listing.list(undefined, { signal: AbortSignal.timeout(10_000) });
}

/** Read-only tool that lets the chat model answer from the real listings. */
export function createSearchListingsTool(fetchListings = fetchPublicListings) {
  return tool({
    description:
      "Search the MyRehat homestay listings. Use it for any question about what is available, prices, price ranges, locations or categories. Leave out every filter to list everything.",
    inputSchema: listingSearchSchema,
    execute: async (filters) => {
      try {
        return searchListings(await fetchListings(), filters);
      } catch (error) {
        console.error("Listing search failed:", error instanceof Error ? error.message : "unknown error");
        return { error: "Listings are unavailable right now" };
      }
    },
  });
}
