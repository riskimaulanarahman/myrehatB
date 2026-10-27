import { defineRelationsPart, sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { BUY_HOMESTAY_CATEGORIES } from "../listing-categories";
import { user } from "./auth";

// Conforms to the externally provided `listing` table: id/price/category stay text
// and the WhatsApp column is `contact_wa`. Only user_id, updated_at and the checks are added.

const categoryList = sql.raw(
  BUY_HOMESTAY_CATEGORIES.map((category) => `'${category.replaceAll("'", "''")}'`).join(", "),
);

export const listing = pgTable(
  "listing",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    // Validated decimal string such as "250000.50"; never stored as a JS float.
    price: text("price").notNull(),
    location: text("location").notNull(),
    category: text("category", { enum: BUY_HOMESTAY_CATEGORIES }).notNull(),
    whatsapp: text("contact_wa").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("listing_userId_idx").on(table.userId),
    check("listing_category_check", sql`${table.category} in (${categoryList})`),
  ],
);

export const listingRelations = defineRelationsPart({ user, listing }, (r) => ({
  listing: {
    owner: r.one.user({
      from: r.listing.userId,
      to: r.user.id,
    }),
  },
}));
