import { BUY_HOMESTAY_CATEGORIES } from "@myrehat-task-b/db/listing-categories";
import { z } from "zod";

// Positive decimal with up to 12 integer digits and at most 2 decimal places,
// e.g. "100000" or "250000.50". Kept as a string so it is stored without float rounding.
const PRICE_PATTERN = /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/;

export const listingCategorySchema = z.enum(BUY_HOMESTAY_CATEGORIES);

export const listingPriceSchema = z
  .string()
  .trim()
  .min(1, "Price is required")
  .regex(PRICE_PATTERN, "Price must be a number with at most 2 decimal places")
  .refine((value) => /[1-9]/.test(value), "Price must be greater than 0");

export const listingInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  price: listingPriceSchema,
  location: z.string().trim().min(1, "Location is required"),
  category: listingCategorySchema,
  whatsapp: z.string().trim().min(1, "WhatsApp number is required"),
});

export type ListingInput = z.infer<typeof listingInputSchema>;
