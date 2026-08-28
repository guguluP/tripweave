import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("grid gap-1.5 text-sm font-medium text-fg", className)}
      {...props}
    />
  );
}
