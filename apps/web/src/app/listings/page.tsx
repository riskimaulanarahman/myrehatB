import { Button } from "@myrehat-task-b/ui/components/button";
import Link from "next/link";
import { connection } from "next/server";

import { client } from "@/utils/orpc";

// Formats the stored decimal string (e.g. "250000.5") without converting it to a float.
function formatPrice(price: string) {
  const [whole = "0", fraction] = price.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped}${fraction ? `.${fraction.padEnd(2, "0")}` : ""}`;
}

export default async function ListingsPage() {
  // Listings change per request; never prerender them at build time.
  await connection();

  const listings = await client.listing.list().catch(() => null);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">BuyHomestay Listings</h1>
        <Link href="/listings/new">
          <Button>Create listing</Button>
        </Link>
      </div>

      {listings === null ? (
        <p className="text-sm text-red-500">Could not load listings. Please try again later.</p>
      ) : listings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No listings yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {listings.map((item) => (
            <li key={item.id} className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">{item.category}</p>
              <h2 className="mt-1 font-medium wrap-break-word">{item.title}</h2>
              <p className="mt-2 text-lg font-semibold">Price: {formatPrice(item.price)}</p>
              <p className="mt-1 text-sm wrap-break-word">{item.location}</p>
              <a
                href={`https://wa.me/${item.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-green-600 underline break-all"
              >
                WhatsApp: {item.whatsapp}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
