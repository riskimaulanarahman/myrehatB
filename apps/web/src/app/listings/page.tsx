import { Button } from "@myrehat-task-b/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@myrehat-task-b/ui/components/empty";
import { House, MapPin, MessageCircle, Plus } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";

import { client } from "@/utils/orpc";

// Formats the stored decimal string (e.g. "250000.5") without converting it to a float.
// Rows created before the current schema may lack a value, so never assume one is present.
function formatPrice(price: string | null | undefined) {
  if (!price) {
    return "-";
  }
  const [whole = "0", fraction] = price.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped}${fraction ? `.${fraction.padEnd(2, "0")}` : ""}`;
}

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
          {listings.map((item) => {
            // Older rows may have no WhatsApp number; show a fallback instead of crashing.
            const wa = item.whatsapp ?? "";
            const waDigits = wa.replace(/\D/g, "");

            return (
              <li
                key={item.id}
                className="flex flex-col rounded-xl border bg-card p-5 text-card-foreground transition-shadow hover:shadow-md"
              >
                <span className="w-fit rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                  {item.category}
                </span>
                <h2 className="mt-3 font-semibold wrap-break-word">{item.title}</h2>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground wrap-break-word">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  {item.location}
                </p>
                <p className="mt-4 text-lg font-bold text-highlight">Price: {formatPrice(item.price)}</p>
                {waDigits ? (
                  <a
                    href={`https://wa.me/${waDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-success px-3 py-2 text-sm font-medium text-success-foreground transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
                    <span className="break-all">WhatsApp: {wa}</span>
                  </a>
                ) : (
                  <p className="mt-4 rounded-md border border-dashed px-3 py-2 text-center text-sm text-muted-foreground">
                    WhatsApp contact not available
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
