import { cn } from "@myrehat-task-b/ui/lib/utils";
import { House } from "lucide-react";

export default function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <House className="size-4" aria-hidden="true" />
      </span>
      <span className="text-base">MyRehat</span>
    </span>
  );
}
