import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@myrehat-task-b/ui/components/empty";
import { House } from "lucide-react";

import { ListingCard } from "@/components/listing-card";
import { client } from "@/utils/orpc";

// The signed-in user's own listings. The server client forwards the request cookies,
// so `listing.mine` resolves the owner from the session.
export default async function Dashboard() {
  const listings = await client.listing.mine().catch(() => null);

  return (
    <section className="mt-8" aria-labelledby="my-listings-heading">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 id="my-listings-heading" className="text-lg font-semibold tracking-tight">
          My listings
        </h2>
        {listings && listings.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {listings.length} {listings.length === 1 ? "listing" : "listings"}
          </p>
        ) : null}
      </div>

      {listings === null ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load your listings. Please try again later.
        </p>
      ) : listings.length === 0 ? (
        <Empty className="rounded-xl border border-dashed py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <House />
            </EmptyMedia>
            <EmptyTitle>You have not created any listings yet.</EmptyTitle>
            <EmptyDescription>Listings you create will appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((item) => (
            <ListingCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}
