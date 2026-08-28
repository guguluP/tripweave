import { cn } from "@/lib/utils";
import { useState } from "react";

export function MotionToggle({
  on,
  onChange,
  label,
  className,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  className?: string;
}) {
  const [inited, setInited] = useState(false);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      data-on={on ? "true" : "false"}
      className={cn("t-toggle", inited && "is-init", className)}
      onClick={() => {
        setInited(true);
        onChange(!on);
      }}
    >
      <span className="t-toggle-thumb" />
    </button>
  );
}
