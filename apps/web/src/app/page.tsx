"use client";
import { BUY_HOMESTAY_CATEGORIES } from "@myrehat-task-b/api/validation/listing";
import { Button } from "@myrehat-task-b/ui/components/button";
import { cn } from "@myrehat-task-b/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Search, Sparkles, Upload } from "lucide-react";
import Link from "next/link";

import { orpc } from "@/utils/orpc";

const features = [
  {
    icon: Search,
    title: "Find the right property",
    description: "Homestay houses, land and Airbnb businesses in one place.",
  },
  {
    icon: MessageCircle,
    title: "Talk to owners directly",
    description: "Every listing has a WhatsApp contact — no middleman.",
  },
  {
    icon: Upload,
    title: "Post in a minute",
    description: "Sign in, fill in five fields and your listing is live.",
  },
];

export default function Home() {
  const healthCheck = useQuery(orpc.healthCheck.queryOptions());

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <section className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-accent via-card to-secondary px-6 py-12 sm:px-10 sm:py-16">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" aria-hidden="true" />
          BuyHomestay marketplace
        </span>
        <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-5xl">
          Book homestays directly with hosts
        </h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
          Browse BuyHomestay listings and contact owners on WhatsApp, or sign in to post your own.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/listings">
            <Button size="lg" className="px-4">
              Browse listings
            </Button>
          </Link>
          <Link href="/listings/new">
            <Button size="lg" variant="outline" className="px-4">
              Create listing
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-xl border bg-card p-5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-sm font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold">Categories</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {BUY_HOMESTAY_CATEGORIES.map((category) => (
            <li
              key={category}
              className="rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
            >
              {category}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 flex items-center justify-between gap-3 rounded-xl border bg-card px-5 py-4">
        <h2 className="text-sm font-medium">API Status</h2>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              healthCheck.isLoading ? "bg-muted-foreground" : healthCheck.data ? "bg-success" : "bg-destructive",
            )}
          />
          <span className="text-sm text-muted-foreground">
            {healthCheck.isLoading ? "Checking..." : healthCheck.data ? "Connected" : "Disconnected"}
          </span>
        </div>
      </section>
    </div>
  );
}
