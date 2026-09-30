import { useEffect, useRef, useState } from "react";

/** Full-viewport photograph. Scroll lifts it off so the stay page underneath is unchanged. */
export function StayCover({
  image,
  name,
  detail,
}: {
  image: string;
  name: string;
  detail: string;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMotionOk(!mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!motionOk) return;
    const el = sheet.current;
    if (!el) return;
    let frame = 0;
    const tick = () => {
      frame = 0;
      const height = window.innerHeight || 1;
      const progress = Math.min(1, Math.max(0, window.scrollY / (height * 0.85)));
      el.style.transform = `translate3d(0, ${(-progress * 110).toFixed(2)}%, 0)`;
      el.style.pointerEvents = progress > 0.92 ? "none" : "auto";
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [motionOk]);

  const frame = (
    <>
      <img src={image} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fg/85 via-fg/25 to-transparent px-6 pb-28 pt-28 md:pb-16">
        <p className="max-w-3xl font-display text-4xl leading-tight text-bg md:text-6xl">{name}</p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-bg/85">{detail}</p>
        {motionOk ? (
          <p className="mt-6 text-xs tracking-wide text-bg/70">Scroll for rooms and the rate</p>
        ) : null}
      </div>
    </>
  );

  if (!motionOk) {
    return <section className="relative h-[70vh] min-h-96 overflow-hidden">{frame}</section>;
  }

  return (
    <>
      <div className="h-[100svh]" aria-hidden />
      <div
        ref={sheet}
        className="fixed inset-x-0 top-0 z-20 h-[100svh] overflow-hidden will-change-transform"
      >
        {frame}
      </div>
    </>
  );
}
