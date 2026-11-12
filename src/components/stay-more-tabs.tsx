import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Desktop (lg+) tablist for long stay-page sections.
 * Below lg the tab list is hidden and every panel stays visible in document order,
 * so the mobile/tablet stay page is unchanged.
 */
export function StayMoreTabs({
  reviews,
  gettingThere,
  buses,
  digiYatra,
  arrival,
}: {
  reviews: ReactNode;
  gettingThere: ReactNode;
  buses?: ReactNode;
  digiYatra?: ReactNode;
  arrival?: ReactNode;
}) {
  const tabs = [
    { id: "reviews", label: "Reviews" },
    { id: "there", label: "Getting there" },
    ...(buses ? [{ id: "buses", label: "Buses" }] : []),
    ...(digiYatra ? [{ id: "digi", label: "DigiYatra" }] : []),
  ];
  const [active, setActive] = useState("reviews");
  const baseId = useId();

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
      return;
    }
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : event.key === "ArrowRight"
            ? (index + 1) % tabs.length
            : (index - 1 + tabs.length) % tabs.length;
    const id = tabs[next]!.id;
    setActive(id);
    document.getElementById(`${baseId}-tab-${id}`)?.focus();
  };

  return (
    <>
      <div
        className="mt-10 hidden border-b border-border lg:flex"
        role="tablist"
        aria-label="More about this stay"
      >
        {tabs.map((tab, index) => {
          const on = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={on}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={on ? 0 : -1}
              className={cn(
                "border-b-2 px-4 py-2.5 text-sm",
                on ? "border-primary font-medium text-fg" : "border-transparent text-muted hover:text-fg",
              )}
              onClick={() => setActive(tab.id)}
              onKeyDown={(event) => onTabKey(event, index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-reviews`}
        aria-labelledby={`${baseId}-tab-reviews`}
        className={cn(active !== "reviews" && "lg:hidden")}
      >
        {reviews}
      </div>

      <div className="mt-10 grid gap-4 lg:mt-4">
        <div
          role="tabpanel"
          id={`${baseId}-panel-there`}
          aria-labelledby={`${baseId}-tab-there`}
          className={cn(active !== "there" && "lg:hidden")}
        >
          {gettingThere}
        </div>
        {buses ? (
          <div
            role="tabpanel"
            id={`${baseId}-panel-buses`}
            aria-labelledby={`${baseId}-tab-buses`}
            className={cn(active !== "buses" && "lg:hidden")}
          >
            {buses}
          </div>
        ) : null}
        {digiYatra ? (
          <div
            role="tabpanel"
            id={`${baseId}-panel-digi`}
            aria-labelledby={`${baseId}-tab-digi`}
            className={cn(active !== "digi" && "lg:hidden")}
          >
            {digiYatra}
          </div>
        ) : null}
        {arrival ? (
          <div className={cn("empty:hidden", active !== "there" && "lg:hidden")}>{arrival}</div>
        ) : null}
      </div>
    </>
  );
}
