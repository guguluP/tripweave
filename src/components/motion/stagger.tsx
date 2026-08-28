import { Children, useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/motion";

export function Stagger({
  children,
  className,
  shown = true,
}: {
  children: ReactNode;
  className?: string;
  shown?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!shown) {
      el.classList.remove("is-shown");
      return;
    }
    const play = () => el.classList.add("is-shown");
    if (prefersReducedMotion()) {
      play();
      return;
    }
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    if (inView) {
      const id = requestAnimationFrame(play);
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          play();
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  const lines = Children.toArray(children);

  return (
    <div ref={ref} className={cn("t-stagger", !shown && "is-hiding", className)}>
      {lines.map((child, i) => (
        <div key={i} className={`t-stagger-line t-stagger-line--${i + 1}`}>
          {child}
        </div>
      ))}
    </div>
  );
}
