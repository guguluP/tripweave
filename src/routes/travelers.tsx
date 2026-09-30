import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { RequireAuth } from "@/components/require-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { TravelersInner } from "./travelers-inner";
import { pageHead } from "@/lib/page-title";

export const Route = createFileRoute("/travelers")({ component: TravelersPage, head: () => pageHead("Travelers") });

function TravelersPage() {
  return (
    <RequireAuth next="/travelers" fallback={<Shell><Skeleton className="m-10 h-40" /></Shell>}>
      <TravelersInner />
    </RequireAuth>
  );
}
