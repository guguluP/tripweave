import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import {
  dismissBanner,
  getBanners,
  subscribeBanners,
  type Banner,
} from "@/lib/banners";
import { cn } from "@/lib/utils";
import { readMs, reflow } from "@/lib/motion";

type Visual = Banner & { enter?: boolean; leaving?: boolean };

const ICONS = {
  ok: CheckCircle2,
  danger: AlertCircle,
  info: Info,
} as const;

export function BannerStack() {
  const items = useSyncExternalStore(subscribeBanners, getBanners, getBanners);
  const [banners, setBanners] = useState<Visual[]>([]);
  const [spread, setSpread] = useState(false);
  const stackRef = useRef<HTMLDivElement>(null);
  const seen = useRef(new Set<string>());
  const auto = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const fresh = items.filter((i) => !seen.current.has(i.id));
    const liveIds = new Set(items.map((i) => i.id));
    const gone = [...seen.current].filter((id) => !liveIds.has(id));
    if (!fresh.length && !gone.length) return;

    fresh.forEach((f) => seen.current.add(f.id));
    setBanners((prev) => {
      let next: Visual[] = [
        ...fresh.map((f) => ({ ...f, enter: true, leaving: false })),
        ...prev.map((b) => ({ ...b, enter: false })),
      ];
      if (gone.length) {
        next = next.map((b) => (gone.includes(b.id) ? { ...b, leaving: true } : b));
      }
      next = next.map((b, i) => (i >= 3 ? { ...b, leaving: true } : b));
      return next;
    });
  }, [items]);

  useLayoutEffect(() => {
    const root = stackRef.current;
    if (!root) return;
    const entering = [...root.querySelectorAll<HTMLElement>(".t-stack-banner.is-enter")];
    if (!entering.length) return;
    entering.forEach((el) => reflow(el));
    setBanners((b) => b.map((x) => (x.enter ? { ...x, enter: false } : x)));
  }, [banners]);

  useEffect(() => {
    const leaving = banners.filter((b) => b.leaving);
    if (!leaving.length) return;
    const ms = readMs("--stack-close", 250);
    const t = window.setTimeout(() => {
      setBanners((s) => s.filter((x) => !x.leaving));
      leaving.forEach((l) => {
        seen.current.delete(l.id);
        dismissBanner(l.id);
        const timer = auto.current.get(l.id);
        if (timer) window.clearTimeout(timer);
        auto.current.delete(l.id);
      });
    }, ms);
    return () => window.clearTimeout(t);
  }, [banners]);

  useEffect(() => {
    for (const b of items) {
      if (b.tone === "danger") continue;
      if (auto.current.has(b.id)) continue;
      auto.current.set(
        b.id,
        window.setTimeout(() => dismissBanner(b.id), 4800),
      );
    }
  }, [items]);

  const visible = banners.slice(0, 4);
  const canSpread = visible.filter((b) => !b.leaving).length > 1;

  return (
    <div
      className="tw-banner-dock"
      style={{ pointerEvents: visible.length ? "auto" : "none" }}
      onPointerEnter={() => {
        if (canSpread) setSpread(true);
      }}
      onPointerLeave={() => setSpread(false)}
    >
      <div
        ref={stackRef}
        className={cn("t-stack", spread && canSpread && "is-spread")}
        style={{ height: visible.length ? (spread && canSpread ? 248 : 80) : 0 }}
      >
        {visible.map((b, i) => {
          const Icon = ICONS[b.tone ?? "info"];
          const depth = b.leaving ? 3 : Math.min(i, 2);
          return (
            <div
              key={b.id}
              className={cn(
                "t-stack-banner",
                b.enter && "is-enter",
                b.leaving && "is-leaving",
              )}
              data-depth={depth}
              role="status"
            >
              <div className="flex items-start gap-3">
                <Icon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    b.tone === "ok" && "text-ok",
                    b.tone === "danger" && "text-danger",
                    (!b.tone || b.tone === "info") && "text-primary",
                  )}
                  strokeWidth={1.75}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{b.title}</p>
                  {b.body ? <p className="mt-0.5 text-xs text-muted">{b.body}</p> : null}
                </div>
                <button
                  type="button"
                  className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface hover:text-fg"
                  aria-label="Dismiss"
                  onClick={() => dismissBanner(b.id)}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
