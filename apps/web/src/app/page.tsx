"use client";
import { Button } from "@myrehat-task-b/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { orpc } from "@/utils/orpc";

export default function Home() {
  const healthCheck = useQuery(orpc.healthCheck.queryOptions());

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <section className="py-10 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
          Book homestays directly with hosts
        </h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
          Browse BuyHomestay listings and contact owners on WhatsApp, or sign in to post your own.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/listings">
            <Button>Browse listings</Button>
          </Link>
          <Link href="/listings/new">
            <Button variant="outline">Create listing</Button>
          </Link>
        </div>
      </section>
      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">API Status</h2>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-sm text-muted-foreground">
              {healthCheck.isLoading
                ? "Checking..."
                : healthCheck.data
                  ? "Connected"
                  : "Disconnected"}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
