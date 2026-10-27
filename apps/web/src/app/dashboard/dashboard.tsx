"use client";

import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export default function Dashboard({ session }: { session: typeof authClient.$Infer.Session }) {
  const privateData = useQuery(orpc.privateData.queryOptions());

  return (
    <section className="mt-6 rounded-xl border bg-card px-5 py-4">
      <h2 className="text-sm font-medium">Private API</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {privateData.isLoading ? "Loading..." : (privateData.data?.message ?? "Unavailable")}
      </p>
    </section>
  );
}
