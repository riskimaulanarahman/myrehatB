import { Button } from "@myrehat-task-b/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@myrehat-task-b/ui/components/empty";
import { House, Plus } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";

import { ListingCard } from "@/components/listing-card";
import { client } from "@/utils/orpc";

export default async function ListingsPage() {
  // Listings change per request; never prerender them at build time.
  await connection();

  const listings = await client.listing.list().catch(() => null);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">BuyHomestay Listings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {listings && listings.length > 0
              ? `${listings.length} ${listings.length === 1 ? "listing" : "listings"} available`
              : "Homestay properties, land and Airbnb businesses for sale."}
          </p>
        </div>
        <Link href="/listings/new">
          <Button size="lg" className="px-4">
            <Plus data-icon="inline-start" aria-hidden="true" />
            Create listing
          </Button>
        </Link>
      </div>

      {listings === null ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load listings. Please try again later.
        </p>
      ) : listings.length === 0 ? (
        <Empty className="rounded-xl border border-dashed py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <House />
            </EmptyMedia>
            <EmptyTitle>No listings yet.</EmptyTitle>
            <EmptyDescription>Be the first to post a homestay for sale.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((item) => (
            <ListingCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
