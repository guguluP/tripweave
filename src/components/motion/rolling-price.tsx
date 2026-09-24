import { formatMoney } from "@/lib/packages";

/** Rupee total whose digits roll to the next value. */
export function RollingPrice({ value }: { value: number }) {
  const text = formatMoney(value);
  return (
    <span className="inline-flex items-baseline tabular-nums" aria-label={text}>
      {text.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={`${i}-d`} className="roll-digit">
            <span className="roll-digit-strip" style={{ transform: `translateY(-${ch}em)` }}>
              {"0123456789".split("").map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={`${i}-${ch}`}>{ch}</span>
        ),
      )}
    </span>
  );
}
