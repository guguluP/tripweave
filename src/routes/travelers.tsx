import { createFileRoute, redirect } from "@tanstack/react-router";
import { pageHead } from "@/lib/page-title";

export const Route = createFileRoute("/travelers")({
  head: () => pageHead("Guests & pay"),
  beforeLoad: () => {
    throw redirect({ to: "/checkout" });
  },
});
