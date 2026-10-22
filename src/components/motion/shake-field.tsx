import { useId, useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { reflow } from "@/lib/motion";

function useShake(isError: boolean, error: string | null | undefined, shakeKey: number) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [shaking, setShaking] = useState(false);

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

  return { boxRef, shaking };
}

export function ShakeField({
  label,
  error,
  shakeKey = 0,
  className,
  id,
  fieldId,
  ...inputProps
}: {
  label?: string;
  error?: string | null;
  shakeKey?: number;
  fieldId?: string;
} & ComponentProps<"input">) {
  const isError = Boolean(error);
  const { boxRef, shaking } = useShake(isError, error, shakeKey);
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("grid gap-1.5 text-sm font-medium text-fg", className)}>
      {label ? (
        <label htmlFor={inputId}>{label}</label>
      ) : null}
      <div className={cn("t-input-wrap", isError && "is-error")}>
        <div
          ref={boxRef}
          className={cn("t-input", isError && "is-error", shaking && "is-shaking")}
        >
          <input
            {...inputProps}
            id={inputId}
            data-field-id={fieldId}
            aria-invalid={isError || undefined}
            aria-describedby={isError ? errorId : undefined}
          />
        </div>
        <p id={errorId} className="t-error-msg" role={isError ? "alert" : undefined}>
          {error || "Please check this field."}
        </p>
      </div>
    </div>
  );
}

export function ShakeSelect({
  label,
  error,
  shakeKey = 0,
  className,
  id,
  fieldId,
  children,
  ...selectProps
}: {
  label?: string;
  error?: string | null;
  shakeKey?: number;
  fieldId?: string;
} & ComponentProps<"select">) {
  const isError = Boolean(error);
  const { boxRef, shaking } = useShake(isError, error, shakeKey);
  const autoId = useId();
  const selectId = id ?? autoId;
  const errorId = `${selectId}-error`;

  return (
    <div className={cn("grid gap-1.5 text-sm font-medium text-fg", className)}>
      {label ? (
        <label htmlFor={selectId}>{label}</label>
      ) : null}
      <div className={cn("t-input-wrap", isError && "is-error")}>
        <div
          ref={boxRef}
          className={cn("t-input t-select", isError && "is-error", shaking && "is-shaking")}
        >
          <select
            {...selectProps}
            id={selectId}
            data-field-id={fieldId}
            aria-invalid={isError || undefined}
            aria-describedby={isError ? errorId : undefined}
          >
            {children}
          </select>
        </div>
        <p id={errorId} className="t-error-msg" role={isError ? "alert" : undefined}>
          {error || "Please check this field."}
        </p>
      </div>
    </div>
  );
}
