import { listing } from "@myrehat-task-b/db/schema/listing";
import { ORPCError } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { listingInputSchema } from "../validation/listing";

// Public listing fields; user_id and updated_at are never exposed.
const listingColumns = {
  id: true,
  title: true,
  price: true,
  location: true,
  category: true,
  whatsapp: true,
  createdAt: true,
} as const;

export const listingRouter = {
  create: protectedProcedure.input(listingInputSchema).handler(async ({ context, input }) => {
    const [created] = await context.db
      .insert(listing)
      .values({
        title: input.title,
        price: input.price,
        location: input.location,
        category: input.category,
        whatsapp: input.whatsapp,
        // Ownership always comes from the server-side session, never from client input.
        userId: context.session.user.id,
      })
      .returning({ id: listing.id, title: listing.title, createdAt: listing.createdAt });

    if (!created) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create listing" });
    }
    return created;
  }),
  list: publicProcedure.handler(({ context }) => {
    return context.db.query.listing.findMany({
      columns: listingColumns,
      orderBy: { createdAt: "desc" },
    });
  }),
  // Listings owned by the signed-in user; the owner always comes from the session.
  mine: protectedProcedure.handler(({ context }) => {
    return context.db.query.listing.findMany({
      columns: listingColumns,
      where: { userId: context.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),
};
