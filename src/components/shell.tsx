import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Map, UserRound, WalletCards } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { loadCatalog } from "@/lib/server/catalog";
import { setCatalogOverlays } from "@/lib/catalog-store";
import { BrandLockup } from "@/components/logo";
import { AuthSlot } from "@/components/auth-slot";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/", label: "Discover", icon: Compass },
  { to: "/plan", label: "Plan", icon: Map },
  { to: "/trips", label: "Trips", icon: WalletCards },
  { to: "/account", label: "Account", icon: UserRound },
] as const;

export function Shell({
  children,
  bare = false,
}: {
  children: ReactNode;
  bare?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [, setCatalogTick] = useState(0);
  useEffect(() => {
    loadCatalog()
      .then((rows) => {
        setCatalogOverlays(rows);
        setCatalogTick((n) => n + 1);
      })
      .catch(() => undefined);
  }, []);

  if (bare) {
    return <div className="min-h-dvh bg-bg text-fg">{children}</div>;
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center">
            <BrandLockup markClassName="size-10" />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {LINKS.slice(0, 3).map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "relative text-sm font-medium text-muted transition-colors duration-150 hover:text-fg",
                  pathname === l.to && "text-fg",
                )}
              >
                {l.label}
                <span
                  className={cn(
                    "absolute -bottom-1.5 left-0 h-px w-full origin-left bg-current transition-transform duration-300 ease-out",
                    pathname === l.to ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            ))}
          </nav>
          <AuthSlot />
        </div>
      </header>
      <main key={pathname} className="page-rise min-w-0 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
      <footer className="mt-16 hidden border-t border-border py-10 md:block">
        <div className="mx-auto flex max-w-6xl items-start justify-between px-4">
          <div>
            <BrandLockup markClassName="size-9" />
            <p className="mt-3 max-w-sm text-sm text-muted">
              Twelve Puri hotels, ranked to three. The price is for the room.
            </p>
          </div>
          <p className="text-sm text-subtle">Puri, Odisha</p>
        </div>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid w-full grid-cols-4 border-t border-border bg-elevated/95 pb-safe backdrop-blur-md md:hidden">
        {LINKS.map((l) => {
          const Icon = l.icon;
          const active = pathname === l.to;
          return (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-medium text-muted",
                active && "text-primary",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
