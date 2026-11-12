import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Play, X } from "lucide-react";
import { Crossfade } from "@/components/crossfade";
import { LikeButton } from "@/components/motion";
import { youtubeThumb, youtubeUrl } from "@/lib/youtube/types";
import { cn } from "@/lib/utils";

type Video = { videoId: string; title: string };

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
  hideHero = false,
  activeIndex,
  onActiveIndex,
  onPhoto,
  openToken = 0,
  focusRoom = null,
}: {
  id: string;
  name: string;
  images: string[];
  videos: Video[];
  featured?: string;
  arrivalPin?: string;
  roomImages?: string[];
  /** Cover already shows the current photograph. */
  hideHero?: boolean;
  activeIndex?: number;
  onActiveIndex?: (index: number) => void;
  /** Cover photograph: source, 1-based position, and size of the set on screen. */
  onPhoto?: (src: string, position: number, total: number) => void;
  /** Increments when the cover asks to open the photo viewer. */
  openToken?: number;
  /** Desktop: switch the sticky gallery to this room's photos (token retriggers the same room). */
  focusRoom?: { id: string; name: string; images: string[]; token: number } | null;
}) {
  const gallery = useMemo(() => {
    const list = images.filter(Boolean);
    if (featured && !list.includes(featured)) return [featured, ...list];
    return list;
  }, [images, featured]);

  const [localIndex, setLocalIndex] = useState(0);
  const index = activeIndex ?? localIndex;
  const setIndex = (next: number | ((current: number) => number)) => {
    const value = typeof next === "function" ? next(index) : next;
    onActiveIndex?.(value);
    if (activeIndex === undefined) setLocalIndex(value);
  };
  const [open, setOpen] = useState(false);
  const [album, setAlbum] = useState<"property" | "rooms">("property");
  const [roomScope, setRoomScope] = useState<{ id: string; name: string; images: string[] } | null>(null);
  const [viewList, setViewList] = useState<string[] | null>(null);
  const [viewerHold, setViewerHold] = useState(false);
  const [viewerOn, setViewerOn] = useState(false);
  const thumbRail = useRef<HTMLDivElement>(null);
  const thumbRailSplit = useRef<HTMLDivElement>(null);
  const splitPane = useRef<HTMLDivElement>(null);
  const lastFocusToken = useRef(0);
  const swipeX = useRef<number | null>(null);
  const listCount = useRef(1);
  const videoRail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeIndex !== undefined) return;
    if (!featured) {
      setIndex(0);
      return;
    }
    const i = gallery.indexOf(featured);
    setIndex(i >= 0 ? i : 0);
  }, [featured, gallery, activeIndex]);

  useEffect(() => {
    if (!openToken) return;
    setViewList(null);
    setOpen(true);
  }, [openToken]);

  useEffect(() => {
    if (!focusRoom || focusRoom.token === lastFocusToken.current) return;
    lastFocusToken.current = focusRoom.token;
    if (typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }
    if (!focusRoom.images.length) return;
    setViewList(null);
    setRoomScope({ id: focusRoom.id, name: focusRoom.name, images: focusRoom.images });
    setAlbum("rooms");
    setIndex(0);
    requestAnimationFrame(() => {
      splitPane.current?.focus({ preventScroll: true });
    });
  }, [focusRoom]);

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
        setIndex((n) => (n - 1 + listCount.current) % listCount.current);
      }
      if (e.key === "ArrowRight") {
        setIndex((n) => (n + 1) % listCount.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const rails = [thumbRail.current, thumbRailSplit.current].filter(Boolean);
    for (const rail of rails) {
      const active = rail!.querySelector<HTMLElement>("[data-active='true']");
      // Skip hidden rails so a display:none desktop strip does not steal scroll.
      if (rail && rail.offsetParent === null && getComputedStyle(rail).display === "none") continue;
      if (rail && rail.clientWidth === 0) continue;
      active?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [index]);

  const rooms = useMemo(
    () => roomImages.filter((src) => src && !gallery.includes(src)),
    [roomImages, gallery],
  );
  const scopedRoomPhotos = roomScope?.images?.length ? roomScope.images : null;
  const shown =
    album === "rooms"
      ? scopedRoomPhotos && scopedRoomPhotos.length
        ? scopedRoomPhotos
        : rooms.length
          ? rooms
          : gallery
      : gallery;
  const activeList = viewList ?? shown;
  listCount.current = Math.max(1, activeList.length);
  const current = activeList[index] ?? activeList[0];

  useEffect(() => {
    const src = shown[index] ?? shown[0];
    if (!src) return;
    onPhoto?.(src, Math.min(index, shown.length - 1) + 1, shown.length);
  }, [shown, index, onPhoto]);

  if (!current && !hideHero) return null;

  const step = (dir: -1 | 1) => {
    setIndex((n) => (n + dir + activeList.length) % activeList.length);
  };

  const openAt = (list: string[], i: number) => {
    setViewList(list);
    setIndex(i);
    setOpen(true);
  };

  const headerSrc = shown[index] ?? shown[0];

  return (
    <div className={cn("contents", hideHero && "lg:block lg:h-full lg:min-h-0")}>
      {hideHero ? null : (
      <div className="relative">
        <button
          type="button"
          onClick={() => openAt(gallery, index)}
          className="relative block h-[70vh] min-h-[28rem] w-full max-h-[42rem]"
          aria-label={`View photos of ${name}`}
        >
          <Crossfade
            src={headerSrc}
            alt={name}
            className="h-full w-full"
            mediaClassName="object-cover"
          />
          <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-elevated/95 px-3 py-1 text-xs font-medium text-fg">
            {index + 1} / {gallery.length}
            {gallery.length > 0 && gallery.length < 4 ? " · hotel-published, limited set" : ""}
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
      </div>
      )}


      {/* Mobile and tablet filmstrip. Hidden from lg so the split pane can take over. */}
      <div className="lg:hidden">
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="flex gap-2">
          <button
            type="button"
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors duration-200",
              album === "property" ? "border-primary bg-primary text-primary-fg" : "border-border bg-elevated",
            )}
            onClick={() => {
              setViewList(null);
              setAlbum("property");
              setIndex(0);
              if (hideHero) window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Property · {gallery.length}
            {gallery.length > 0 && gallery.length < 4 ? " · limited set" : ""}
          </button>
          {rooms.length > 0 ? (
            <button
              type="button"
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors duration-200",
                album === "rooms" ? "border-primary bg-primary text-primary-fg" : "border-border bg-elevated",
              )}
              onClick={() => {
                setViewList(null);
                setAlbum("rooms");
                setIndex(0);
                if (hideHero) window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Rooms · {rooms.length}
            </button>
          ) : null}
        </div>
        {shown.length > 1 ? (
          <div
            ref={thumbRail}
            className="scrollbar-hide mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain"
            role="listbox"
            aria-label={album === "rooms" ? `${name} room photos` : `${name} property photos`}
          >
            {shown.map((src, i) => (
              <button
                key={`${album}-${src}-${i}`}
                type="button"
                data-active={i === index ? "true" : "false"}
                onClick={() => {
                  setViewList(null);
                  setIndex(i);
                  if (hideHero) window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "h-16 w-24 shrink-0 snap-start overflow-hidden rounded-lg border-2 transition-[border-color,opacity,transform] duration-200 sm:h-20 sm:w-28",
                  i === index ? "border-primary" : "border-transparent opacity-80",
                )}
                aria-label={`Photo ${i + 1} of ${shown.length}`}
                aria-selected={i === index}
                role="option"
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

      </div>

      {/* Desktop split-screen gallery: fills the sticky left pane below the header. */}
      <div
        ref={splitPane}
        className="relative hidden h-full min-h-0 flex-col bg-fg lg:flex"
        role="region"
        aria-label={
          roomScope
            ? `${roomScope.name} photos`
            : `${name} photo gallery`
        }
        tabIndex={0}
        onKeyDown={(event) => {
          if (shown.length < 2) return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          } else if (event.key === "Home") {
            event.preventDefault();
            setIndex(0);
          } else if (event.key === "End") {
            event.preventDefault();
            setIndex(shown.length - 1);
          }
        }}
      >
        <div className="relative min-h-0 flex-1">
          <button
            type="button"
            onClick={() => openAt(shown, index)}
            className="absolute inset-0 block"
            aria-label={
              roomScope
                ? `View photos of ${roomScope.name}. Photo ${index + 1} of ${shown.length}.`
                : `View photos of ${name}. Photo ${index + 1} of ${shown.length}.`
            }
          >
            {headerSrc ? (
              <Crossfade
                src={headerSrc}
                alt={roomScope ? roomScope.name : name}
                className="h-full w-full"
                mediaClassName="object-cover"
              />
            ) : null}
          </button>
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex max-w-[75%] flex-col items-start gap-1">
            <span
              className="rounded-full bg-elevated/95 px-3 py-1 text-xs font-medium text-fg"
              aria-live="polite"
            >
              {roomScope
                ? `${roomScope.name} · ${shown.length ? index + 1 : 0}/${shown.length}`
                : `${index + 1} / ${shown.length}${shown.length > 0 && shown.length < 4 ? " · hotel-published, limited set" : ""}`}
            </span>
            {arrivalPin && !roomScope ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-fg">
                <MapPin className="size-3" />
                {arrivalPin}
              </span>
            ) : null}
          </div>
          <div className="absolute right-3 top-3 z-10">
            <LikeButton id={id} />
          </div>
          {shown.length > 1 ? (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-between px-3">
              <button
                type="button"
                className="pointer-events-auto flex size-11 items-center justify-center rounded-full bg-elevated/95 text-fg"
                aria-label="Previous photo"
                onClick={() => step(-1)}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                className="pointer-events-auto flex size-11 items-center justify-center rounded-full bg-elevated/95 text-fg"
                aria-label="Next photo"
                onClick={() => step(1)}
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          ) : null}
        </div>
        <div className="shrink-0 bg-gradient-to-t from-fg/80 to-transparent px-3 pb-3 pt-8">
          <div className="flex items-end gap-2">
            {shown.length > 1 ? (
              <div
                ref={thumbRailSplit}
                className="scrollbar-hide flex min-w-0 flex-1 snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain"
                role="listbox"
                aria-label={
                  roomScope
                    ? `${roomScope.name} photos`
                    : album === "rooms"
                      ? `${name} room photos`
                      : `${name} property photos`
                }
              >
                {shown.map((src, i) => (
                  <button
                    key={`split-${album}-${src}-${i}`}
                    type="button"
                    data-active={i === index ? "true" : "false"}
                    onClick={() => {
                      setViewList(null);
                      setIndex(i);
                    }}
                    className={cn(
                      "h-12 w-[4.25rem] shrink-0 snap-start overflow-hidden rounded-md border-2",
                      i === index ? "border-bg" : "border-transparent opacity-80",
                    )}
                    aria-label={`Photo ${i + 1} of ${shown.length}`}
                    aria-selected={i === index}
                    role="option"
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex-1" />
            )}
            <div className="flex shrink-0 flex-col items-end gap-1.5 pb-0.5">
              <button
                type="button"
                className="rounded-full bg-elevated px-3 py-1.5 text-xs font-semibold text-fg"
                onClick={() => openAt(shown, index)}
              >
                Show all {shown.length || gallery.length} photos
              </button>
              {videos.length > 0 ? (
                <a
                  href={youtubeUrl(videos[0]!.videoId)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-elevated/90 px-3 py-1.5 text-xs font-semibold text-fg"
                >
                  {videos.length} {videos.length === 1 ? "tour" : "tours"}
                </a>
              ) : null}
            </div>
          </div>
          {rooms.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-medium",
                  album === "property" ? "bg-elevated text-fg" : "bg-fg/40 text-bg/80",
                )}
                onClick={() => {
                  setViewList(null);
                  setRoomScope(null);
                  setAlbum("property");
                  setIndex(0);
                }}
              >
                {roomScope ? "Property photos" : "Property"} · {gallery.length}
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-medium",
                  album === "rooms" ? "bg-elevated text-fg" : "bg-fg/40 text-bg/80",
                )}
                aria-current={album === "rooms" && roomScope ? "true" : undefined}
                onClick={() => {
                  setViewList(null);
                  setRoomScope(null);
                  setAlbum("rooms");
                  setIndex(0);
                }}
              >
                {roomScope ? "All rooms" : "Rooms"} · {rooms.length}
              </button>
              {roomScope ? (
                <button
                  type="button"
                  className="rounded-full bg-elevated px-3 py-1 text-[11px] font-medium text-fg"
                  onClick={() => {
                    setViewList(null);
                    setRoomScope(null);
                    setAlbum("property");
                    setIndex(0);
                    requestAnimationFrame(() => {
                      splitPane.current?.focus({ preventScroll: true });
                    });
                  }}
                >
                  Back to property photos
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

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
          <span
            onClick={(e) => e.stopPropagation()}
            className="block h-[78vh] w-full max-w-5xl touch-pan-y"
            onPointerDown={(e) => {
              swipeX.current = e.clientX;
            }}
            onPointerUp={(e) => {
              if (swipeX.current == null || activeList.length < 2) return;
              const delta = e.clientX - swipeX.current;
              swipeX.current = null;
              if (delta > 48) step(-1);
              else if (delta < -48) step(1);
            }}
          >
            <Crossfade
              src={current}
              alt={`${name} photo ${index + 1}`}
              className="h-full w-full"
              mediaClassName="object-contain"
            />
          </span>
          {activeList.length > 1 ? (
            <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3 pb-safe">
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-full bg-elevated text-fg"
                aria-label="Previous photo"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
              >
                <ChevronLeft className="size-5" />
              </button>
              <span className="rounded-full bg-elevated px-3 py-1 text-xs text-fg">
                {index + 1} / {activeList.length}
              </span>
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-full bg-elevated text-fg"
                aria-label="Next photo"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
