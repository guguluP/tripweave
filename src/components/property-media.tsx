import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Play, X } from "lucide-react";
import { Crossfade } from "@/components/crossfade";
import { LikeButton } from "@/components/motion";
import { youtubeThumb, youtubeUrl } from "@/lib/youtube/types";
import { cn } from "@/lib/utils";

type Video = { videoId: string; title: string };

function thumbSrc(src: string, w = 240) {
  // Shrink Unsplash only if present (e.g. login / discover heroes — not named hotels).
  if (src.includes("images.unsplash.com")) {
    const base = src.split("?")[0] ?? src;
    return `${base}?auto=format&fit=crop&w=${w}&q=60`;
  }
  // Local /stays assets and official CDNs need no YouTube mqdefault rewrite.
  return src;
}

/** Gallery img — local /stays assets (or stable official URLs). */
function PropertyImg({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
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
  arrivalPin,
  roomImages = [],
}: {
  id: string;
  name: string;
  images: string[];
  videos: Video[];
  featured?: string;
  arrivalPin?: string;
  roomImages?: string[];
}) {
  const gallery = useMemo(() => {
    const list = images.filter(Boolean);
    if (featured && !list.includes(featured)) return [featured, ...list];
    return list;
  }, [images, featured]);

  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [album, setAlbum] = useState<"property" | "rooms">("property");
  const [viewList, setViewList] = useState<string[] | null>(null);
  const [viewerHold, setViewerHold] = useState(false);
  const [viewerOn, setViewerOn] = useState(false);
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
    if (open) {
      setViewerHold(true);
      const frame = requestAnimationFrame(() => setViewerOn(true));
      return () => cancelAnimationFrame(frame);
    }
    setViewerOn(false);
    const hide = window.setTimeout(() => setViewerHold(false), 300);
    return () => window.clearTimeout(hide);
  }, [open]);

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

  const rooms = roomImages.filter((src) => src && !gallery.includes(src));
  const activeList = viewList ?? gallery;
  const current = activeList[index] ?? activeList[0];
  if (!current) return null;

  const step = (dir: -1 | 1) => {
    setIndex((n) => (n + dir + activeList.length) % activeList.length);
  };

  const openAt = (list: string[], i: number) => {
    setViewList(list);
    setIndex(i);
    setOpen(true);
  };

  const albumPhotos = album === "rooms" && rooms.length ? rooms : gallery;
  const preview = albumPhotos.slice(0, 6);
  const extra = Math.max(0, albumPhotos.length - 6);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => openAt(gallery, index)}
          className="relative block h-64 w-full md:h-80"
          style={{ viewTransitionName: `stay-${id}` }}
          aria-label={`View photos of ${name}`}
        >
          <Crossfade
            src={current}
            alt={name}
            className="h-full w-full"
            mediaClassName="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
          <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-elevated/95 px-3 py-1 text-xs font-medium text-fg">
            Property · {index + 1}/{gallery.length}
          </span>
          {arrivalPin ? (
            <span className="pointer-events-none absolute left-4 top-14 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-fg">
              <MapPin className="size-3" />
              {arrivalPin}
            </span>
          ) : null}
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
                    "size-12 shrink-0 snap-start overflow-hidden rounded-md border-2 transition-[border-color,opacity] duration-300 sm:size-14",
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

      <div className="mx-auto mt-6 max-w-3xl px-4">
        <div className="flex gap-2">
          <button
            type="button"
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              album === "property" ? "border-primary bg-primary text-primary-fg" : "border-border bg-elevated",
            )}
            onClick={() => setAlbum("property")}
          >
            Property
          </button>
          {rooms.length > 0 ? (
            <button
              type="button"
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                album === "rooms" ? "border-primary bg-primary text-primary-fg" : "border-border bg-elevated",
              )}
              onClick={() => setAlbum("rooms")}
            >
              Rooms
            </button>
          ) : null}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {preview.map((src, i) => {
            const last = i === preview.length - 1 && extra > 0;
            return (
              <button
                key={`${src}-${i}`}
                type="button"
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-border"
                onClick={() => openAt(albumPhotos, i)}
                aria-label={last ? `View all ${albumPhotos.length} photos` : `Photo ${i + 1}`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
                {last ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-fg/55 font-display text-2xl text-primary-fg">
                    +{extra} photos
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
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

      {viewerHold ? (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-fg/80 p-4 transition-opacity duration-300",
            viewerOn ? "opacity-100" : "opacity-0",
          )}
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
          {activeList.length > 1 ? (
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
          <span onClick={(e) => e.stopPropagation()} className="block h-[85vh] w-full max-w-5xl">
            <Crossfade
              src={current}
              alt={`${name} photo ${index + 1}`}
              className="h-full w-full"
              mediaClassName="object-contain"
            />
          </span>
        </div>
      ) : null}
    </>
  );
}
