export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function reflow(el: HTMLElement) {
  void el.offsetWidth;
}

export function readMs(name: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return fallback;
  if (raw.endsWith("ms")) return parseFloat(raw) || fallback;
  if (raw.endsWith("s")) return (parseFloat(raw) || 0) * 1000 || fallback;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function readCssNumber(name: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

/** Unit-bezier solver for CSS cubic-bezier(x1, y1, x2, y2). */
export function bezierEasing(x1: number, y1: number, x2: number, y2: number) {
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let x = t;
    for (let i = 0; i < 8; i++) {
      const cx = 3 * x1;
      const bx = 3 * (x2 - x1) - cx;
      const ax = 1 - cx - bx;
      const current = ((ax * x + bx) * x + cx) * x;
      const dx = current - t;
      if (Math.abs(dx) < 1e-6) break;
      const d = (3 * ax * x + 2 * bx) * x + cx;
      if (Math.abs(d) < 1e-6) break;
      x -= dx / d;
      x = Math.max(0, Math.min(1, x));
    }
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    return ((ay * x + by) * x + cy) * x;
  };
}
