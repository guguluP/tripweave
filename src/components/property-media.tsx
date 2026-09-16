import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { LikeButton } from "@/components/motion";
import { youtubeThumb, youtubeUrl } from "@/lib/youtube/types";
import { cn } from "@/lib/utils";

type Video = { videoId: string; title: string };

function thumbSrc(src: string, w = 240) {
  // YouTube thumbs are already small; keep as-is. Shrink Unsplash only if present (e.g. login hero reuse).
  if (src.includes("images.unsplash.com")) {
    const base = src.split("?")[0] ?? src;
    return `${base}?auto=format&fit=crop&w=${w}&q=60`;
  }
  // Prefer mqdefault for carousel chips when the gallery uses hqdefault.
  if (src.includes("i.ytimg.com") && src.includes("/hqdefault.jpg")) {
    return src.replace("/hqdefault.jpg", "/mqdefault.jpg");
  }
  return src;
}

/** Gallery/room img with YouTube thumb fallbacks when hqdefault 404s. */
function PropertyImg({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [current, setCurrent] = useState(src);
  useEffect(() => {
    setCurrent(src);
  }, [src]);
  return (
    <img
      src={current}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        const m = current.match(/i\.ytimg\.com\/vi\/([^/]+)\/([^/?]+)/);
        if (!m) return;
        const [, videoId, name] = m;
        if (name === "hqdefault.jpg") {
          setCurrent(`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`);
        } else if (name === "mqdefault.jpg") {
          setCurrent(`https://i.ytimg.com/vi/${videoId}/0.jpg`);
        }
      }}
    />
  );
}

function YoutubeThumb({ videoId, title }: { videoId: string; title: string }) {
  const [src, setSrc] = useState(youtubeThumb(videoId));
  return (
    <img
      src={src}
      alt=""
      className="h-24 w-full object-cover"
      loading="lazy"
      decoding="async"
      onError={() => {
        // hqdefault can 404 for some IDs; fall back to mqdefault then 0.jpg
        if (src.includes("hqdefault")) {
          setSrc(`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`);
        } else if (src.includes("mqdefault")) {
          setSrc(`https://i.ytimg.com/vi/${videoId}/0.jpg`);
        }
      }}
      data-title={title}
    />
  );
}

export function PropertyMedia({
  id,
  name,
  images,
  videos,
  featured,
}: {
  id: string;
  name: string;
  images: string[];
  videos: Video[];
  featured?: string;
}) {
  const gallery = useMemo(() => {
    const list = images.filter(Boolean);
    if (featured && !list.includes(featured)) return [featured, ...list];
    return list;
  }, [images, featured]);

  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const thumbRail = useRef<HTMLDivElement>(null);
  const videoRail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!featured) {
      setIndex(0);
      return;
    }
    const i = gallery.indexOf(featured);
    setIndex(i >= 0 ? i : 0);
  }, [featured, gallery]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") {
        setIndex((n) => (n - 1 + gallery.length) % gallery.length);
      }
      if (e.key === "ArrowRight") {
        setIndex((n) => (n + 1) % gallery.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, gallery.length]);

  useEffect(() => {
    const rail = thumbRail.current;
    if (!rail) return;
    const active = rail.querySelector<HTMLElement>("[data-active='true']");
    active?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [index]);

  const current = gallery[index] ?? gallery[0];
  if (!current) return null;

  const step = (dir: -1 | 1) => {
    setIndex((n) => (n + dir + gallery.length) % gallery.length);
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative block h-64 w-full md:h-80"
          aria-label={`View photos of ${name}`}
        >
          <PropertyImg src={current} alt={name} className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
        </button>
        <div className="absolute right-4 top-4 z-10">
          <LikeButton id={id} />
        </div>
        {gallery.length > 1 ? (
          <div className="absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-fg/50 to-transparent px-3 pb-3 pt-8">
            <div
              ref={thumbRail}
              className="scrollbar-hide flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain"
              role="listbox"
              aria-label={`${name} photo thumbnails`}
            >
              {gallery.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  data-active={i === index ? "true" : "false"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(i);
                  }}
                  className={cn(
                    "size-12 shrink-0 snap-start overflow-hidden rounded-md border-2 sm:size-14",
                    i === index ? "border-primary-fg" : "border-transparent opacity-85",
                  )}
                  aria-label={`Photo ${i + 1} of ${gallery.length}`}
                  aria-selected={i === index}
                  role="option"
                >
                  <img
                    src={thumbSrc(src)}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {videos.length > 0 ? (
        <div className="mx-auto mt-5 max-w-3xl px-4">
          <p className="eyebrow">Property tours</p>
          <div
            ref={videoRail}
            className="scrollbar-hide mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1"
          >
            {videos.map((v) => (
              <a
                key={v.videoId}
                href={youtubeUrl(v.videoId)}
                target="_blank"
                rel="noreferrer"
                className="group w-40 shrink-0 snap-start"
              >
                <span className="relative block overflow-hidden rounded-lg bg-border">
                  <YoutubeThumb videoId={v.videoId} title={v.title} />
                  <span className="absolute inset-0 flex items-center justify-center bg-fg/35">
                    <Play className="ml-0.5 size-7 text-primary-fg" fill="currentColor" />
                  </span>
                </span>
                <span className="mt-2 line-clamp-2 text-xs leading-snug text-muted group-hover:text-fg">
                  {v.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-fg/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photos`}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-elevated text-fg"
            aria-label="Close photos"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </button>
          {gallery.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-3 flex size-11 items-center justify-center rounded-full bg-elevated text-fg sm:left-6"
                aria-label="Previous photo"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                className="absolute right-3 flex size-11 items-center justify-center rounded-full bg-elevated text-fg sm:right-6"
                aria-label="Next photo"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          ) : null}
          <span onClick={(e) => e.stopPropagation()}>
            <PropertyImg
              src={current}
              alt={`${name} photo ${index + 1}`}
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
            />
          </span>
        </div>
      ) : null}
    </>
  );
}
