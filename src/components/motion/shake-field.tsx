import { useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { reflow } from "@/lib/motion";

export function ShakeField({
  label,
  error,
  shakeKey = 0,
  className,
  id,
  ...inputProps
}: {
  label?: string;
  error?: string | null;
  shakeKey?: number;
} & ComponentProps<"input">) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [shaking, setShaking] = useState(false);
  const isError = Boolean(error);

  useLayoutEffect(() => {
    if (!isError) {
      setShaking(false);
      return;
    }
    setShaking(false);
    const el = boxRef.current;
    if (el) reflow(el);
    setShaking(true);
  }, [isError, error, shakeKey]);

  return (
    <label className={cn("grid gap-1.5 text-sm font-medium text-fg", className)}>
      {label ? <span>{label}</span> : null}
      <div className={cn("t-input-wrap", isError && "is-error")}>
        <div
          ref={boxRef}
          className={cn("t-input", isError && "is-error", shaking && "is-shaking")}
        >
          <input id={id} aria-invalid={isError} {...inputProps} />
        </div>
        <p className="t-error-msg">{error || "Please check this field."}</p>
      </div>
    </label>
  );
}
