// Single source of truth for BuyHomestay listing categories.
// Kept dependency-free so both server and web code can import it.
export const BUY_HOMESTAY_CATEGORIES = [
  "Buy Property",
  "Buy land to build homestay",
  "Buy Airbnb Profile",
  "Buy Airbnb Business",
] as const;

export type BuyHomestayCategory = (typeof BUY_HOMESTAY_CATEGORIES)[number];
