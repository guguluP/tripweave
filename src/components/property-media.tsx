import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { LikeButton } from "@/components/motion";
import { youtubeThumb, youtubeUrl } from "@/lib/youtube/types";
import { cn } from "@/lib/utils";

type Video = { videoId: string; title: string };

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
          <img src={current} alt={name} className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
        </button>
        <div className="absolute right-4 top-4 z-10">
          <LikeButton id={id} />
        </div>
        {gallery.length > 1 ? (
          <div className="absolute bottom-3 left-3 right-16 flex gap-2 overflow-x-auto pb-1">
            {gallery.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "size-12 shrink-0 overflow-hidden rounded-md border-2 sm:size-14",
                  i === index ? "border-primary-fg" : "border-transparent opacity-80",
                )}
                aria-label={`Photo ${i + 1} of ${gallery.length}`}
                aria-current={i === index}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {videos.length > 0 ? (
        <div className="mx-auto mt-5 max-w-3xl px-4">
          <p className="eyebrow">Property tours</p>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {videos.map((v) => (
              <a
                key={v.videoId}
                href={youtubeUrl(v.videoId)}
                target="_blank"
                rel="noreferrer"
                className="group w-40 shrink-0"
              >
                <span className="relative block overflow-hidden rounded-lg">
                  <img
                    src={youtubeThumb(v.videoId)}
                    alt=""
                    className="h-24 w-full object-cover"
                  />
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
          <img
            src={current}
            alt={`${name} photo ${index + 1}`}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
