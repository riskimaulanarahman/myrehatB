import { Button } from "@myrehat-task-b/ui/components/button";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import Dashboard from "./dashboard";

export default async function DashboardPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <div className="rounded-2xl border bg-linear-to-br from-accent via-card to-secondary p-6 sm:p-8">
        <p className="text-sm font-medium text-primary">Dashboard</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Welcome {session.user.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{session.user.email}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/listings/new">
            <Button size="lg" className="px-4">
              New listing
            </Button>
          </Link>
          <Link href="/listings">
            <Button size="lg" variant="outline" className="px-4">
              View all listings
            </Button>
          </Link>
        </div>
      </div>
      <Dashboard session={session} />
    </div>
  );
}
