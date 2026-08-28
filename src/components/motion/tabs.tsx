import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type TabItem<T extends string> = {
  id: T;
  label: string;
};

export function SlidingTabs<T extends string>({
  tabs,
  value,
  onChange,
  fullWidth = false,
  className,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  fullWidth?: boolean;
  className?: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const skipAnim = useRef(true);
  const valueRef = useRef(value);
  valueRef.current = value;

  const snap = (animate: boolean) => {
    const pill = pillRef.current;
    const tab = btnRefs.current[valueRef.current];
    if (!pill || !tab) return;
    if (!animate) pill.style.transition = "none";
    pill.style.transform = `translateX(${tab.offsetLeft}px)`;
    pill.style.width = `${tab.offsetWidth}px`;
    if (!animate) {
      void pill.offsetWidth;
      pill.style.transition = "";
    }
  };

  useLayoutEffect(() => {
    snap(skipAnim.current ? false : true);
    skipAnim.current = false;
  }, [value, tabs.length, fullWidth]);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const onResize = () => snap(false);
    onResize();
    const ro = typeof ResizeObserver !== "undefined" && bar ? new ResizeObserver(onResize) : null;
    if (bar && ro) ro.observe(bar);
    window.addEventListener("resize", onResize);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [tabs.length, fullWidth]);

  return (
    <div
      ref={barRef}
      className={cn("t-tabs", fullWidth && "tw-full", className)}
      role="tablist"
    >
      <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => {
            btnRefs.current[tab.id] = el;
          }}
          type="button"
          role="tab"
          className="t-tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
