import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { pageHead } from "@/lib/page-title";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
  head: () => pageHead("Privacy"),
});

function Privacy() {
  return (
    <Shell>
      <article className="mx-auto max-w-2xl px-4 py-10">
        <p className="eyebrow">Privacy</p>
        <h1 className="mt-2 font-display text-4xl">Your data</h1>
        <div className="mt-6 grid gap-4 text-sm text-muted">
          <p>
            TripWeave keeps the name, email, and mobile number you give us so we can book a Puri stay, send a voucher, and coordinate a group trip.
          </p>
          <p>
            Group join codes go to your email. A phone number on a group trip is deleted 14 days after the trip ends, or sooner if you are removed before you pay.
          </p>
          <p>
            You can download a copy of your account data, or delete the profile, saved people, and saved hotels, from{" "}
            <Link to="/account" className="font-medium text-fg underline">
              Account
            </Link>
            . A paid stay is not erased by deleting the account. Cancel it from Trips first if you want the booking closed.
          </p>
          <p>Children on a group trip are a count only. We do not ask for their names.</p>
        </div>
      </article>
    </Shell>
  );
}
