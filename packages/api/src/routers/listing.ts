import { listing } from "@myrehat-task-b/db/schema/listing";
import { ORPCError } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { listingInputSchema } from "../validation/listing";

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
      columns: {
        id: true,
        title: true,
        price: true,
        location: true,
        category: true,
        whatsapp: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),
};
