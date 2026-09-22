import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Landmark, ShieldCheck, Wallet } from "lucide-react";
import { Shell } from "@/components/shell";
import { PackageCard } from "@/components/package-card";
import { Button } from "@/components/ui/button";
import { LearnMore, Stagger } from "@/components/motion";
import { DEFAULT_BRIEF, PACKAGES } from "@/lib/packages";

const COVER_CLIPS = ["/cover/shore.mp4", "/cover/coast.mp4", "/cover/waves.mp4"] as const;

export const Route = createFileRoute("/")({ component: Home });

function Cover() {
  const [clip, setClip] = useState(0);
  const [showStill, setShowStill] = useState(true);

  useEffect(() => {
    if (!showStill) return;
    const id = window.setTimeout(() => setShowStill(false), 5000);
    return () => window.clearTimeout(id);
  }, [showStill]);

  return (
    <>
      <img
        src="/cover/puri.jpg"
        alt="Puri beach"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {showStill ? null : (
        <video
          key={COVER_CLIPS[clip]}
          src={COVER_CLIPS[clip]}
          poster="/cover/puri.jpg"
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          onEnded={() => setClip((n) => (n + 1) % COVER_CLIPS.length)}
        />
      )}
    </>
  );
}

function Home() {
  const featured = [...PACKAGES].sort((a, b) => b.trustScore - a.trustScore).slice(0, 3);

  return (
    <Shell>
      <section className="relative isolate min-h-[32rem] overflow-hidden">
        <Cover />
        <div className="absolute inset-0 bg-fg/55" />
        <div className="relative mx-auto flex min-h-[32rem] max-w-6xl flex-col justify-end px-4 py-16">
          <Stagger>
            <p className="eyebrow text-primary-fg/80">Puri stays without the tab overload</p>
            <h1 className="mt-3 max-w-xl font-display text-4xl text-primary-fg md:text-5xl">
              Twelve honest Puri hotels. Ranked to three.
            </h1>
            <p className="mt-4 max-w-md text-base text-primary-fg/80">
              Answer a short brief — including how you get here. We return three curated stays with
              all-in rupee prices, from a single night to a slow week.
            </p>
          </Stagger>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <Link to="/plan">
                Find my hotel
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <LearnMore
              className="text-sm font-medium text-primary-fg"
              onClick={() =>
                document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              See how it works
            </LearnMore>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: "Trust Score",
            body: "Property completeness + curated YouTube stay reviews — not a star average.",
          },
          {
            icon: Wallet,
            title: "All-in rupees",
            body: "The price you see is the price you pay — extras are optional swaps.",
          },
          {
            icon: Landmark,
            title: "Three, not two hundred",
            body: "A short list ranked to your brief. Temple, beach, or slow.",
          },
        ].map((item) => (
          <article key={item.title} className="rounded-xl border border-border bg-elevated p-5">
            <item.icon className="size-5 text-primary" strokeWidth={1.75} />
            <h2 className="mt-3 font-display text-xl">{item.title}</h2>
            <p className="mt-2 text-sm text-muted">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="flex items-end justify-between gap-4">
          <Stagger>
            <p className="eyebrow">Top-rated</p>
            <h2 className="mt-2 font-display text-3xl">Puri hotels we stand behind</h2>
          </Stagger>
          <LearnMore to="/plan" className="hidden text-sm font-medium text-primary md:inline-flex">
            Match me
          </LearnMore>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {featured.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} nights={DEFAULT_BRIEF.nights} />
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-12">
        <Stagger>
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 font-display text-3xl">Brief, three stays, pay.</h2>
        </Stagger>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            { n: "01", t: "Share a brief", d: "Vibe, budget, who you travel with, nights — including one-night temple trips." },
            {
              n: "02",
              t: "Pick from three",
              d: "Ranked by fit. Read the YouTube reviewer consensus, then swap extras — the rupee total updates live.",
            },
            { n: "03", t: "Pay and confirm", d: "Sign in, pay with Razorpay, get a confirmation code." },
          ].map((step) => (
            <li key={step.n} className="rounded-xl border border-border bg-surface p-5">
              <p className="font-display text-2xl text-primary">{step.n}</p>
              <h3 className="mt-2 font-display text-xl">{step.t}</h3>
              <p className="mt-2 text-sm text-muted">{step.d}</p>
            </li>
          ))}
        </ol>
        <LearnMore to="/plan" className="mt-8 text-sm font-medium text-primary">
          Start a brief
        </LearnMore>
      </section>
    </Shell>
  );
}
