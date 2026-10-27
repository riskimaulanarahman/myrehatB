"use client";
import { cn } from "@myrehat-task-b/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

import BrandMark from "./brand-mark";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const pathname = usePathname();
  const links = [
    { to: "/", label: "Home" },
    { to: "/listings", label: "Listings" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/ai", label: "AI Chat" },
  ] as const;

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" aria-label="MyRehat home" className="rounded-lg">
          <BrandMark />
        </Link>
        {/* On small screens the nav drops to its own scrollable row below the brand. */}
        <nav className="order-last -mx-1 flex w-full gap-1 overflow-x-auto text-sm sm:order-none sm:w-auto">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              href={to}
              aria-current={isActive(to) ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive(to) ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
