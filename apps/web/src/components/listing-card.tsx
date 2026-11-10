import { MapPin, MessageCircle } from "lucide-react";

import { formatPrice, getWhatsAppLink } from "@/lib/listing-format";

export type ListingCardData = {
  id: string;
  title: string;
  price: string | null;
  location: string;
  category: string;
  whatsapp: string | null;
};

export function ListingCard({ item }: { item: ListingCardData }) {
  // The number may be missing at runtime; show a fallback instead of crashing.
  const waLink = getWhatsAppLink(item.whatsapp);

  return (
    <li className="flex flex-col rounded-xl border bg-card p-5 text-card-foreground transition-shadow hover:shadow-md">
      <span className="w-fit rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
        {item.category}
      </span>
      <h2 className="mt-3 font-semibold wrap-break-word">{item.title}</h2>
      <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground wrap-break-word">
        <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {item.location}
      </p>
      <p className="mt-4 text-lg font-bold text-highlight">Price: {formatPrice(item.price)}</p>
      {waLink ? (
        <a
          href={waLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-success px-3 py-2 text-sm font-medium text-success-foreground transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
          <span className="break-all">WhatsApp: {waLink.label}</span>
        </a>
      ) : (
        <p className="mt-4 rounded-md border border-dashed px-3 py-2 text-center text-sm text-muted-foreground">
          WhatsApp contact not available
        </p>
      )}
    </li>
  );
}
