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
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fg/80 via-fg/20 to-transparent px-4 pb-3 pt-10 md:px-6">
          <p className="max-w-3xl font-display text-2xl leading-tight text-bg md:text-4xl">{name}</p>
          <p className="mt-1 max-w-xl text-xs leading-snug text-bg/85 md:text-sm">{detail}</p>
          <p className="stay-cover-hint mt-6 text-xs tracking-wide text-bg/70">Scroll for rooms and the rate</p>
        </div>
        {children}
      </div>
    </>
  );
}
