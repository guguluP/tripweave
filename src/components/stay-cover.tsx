import type { ReactNode } from "react";

/** Full-viewport photograph. Where the browser supports it, scroll lifts the photo off the page without a script. */
export function StayCover({
  image,
  name,
  detail,
  children,
}: {
  image: string;
  name: string;
  detail: string;
  children?: ReactNode;
}) {
  return (
    <>
      <div className="stay-cover-sheet">
        <img src={image} alt={name} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fg/85 via-fg/25 to-transparent px-6 pb-28 pt-28 md:pb-16">
          <p className="max-w-3xl font-display text-4xl leading-tight text-bg md:text-6xl">{name}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-bg/85">{detail}</p>
          <p className="stay-cover-hint mt-6 text-xs tracking-wide text-bg/70">Scroll for rooms and the rate</p>
        </div>
        {children}
      </div>
    </>
  );
}
