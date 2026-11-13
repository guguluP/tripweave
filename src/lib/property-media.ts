import type { RoomType } from "./packages.ts";
import catalog from "./stay-media.json" with { type: "json" };
import roomMeta from "./room-photo-meta.json" with { type: "json" };

/**
 * Catalog media is property-owned and vendored under public/stays (CDN hotlinks 403 with TripWeave Referer).
 * YouTube remains only for reviewer-consensus videos — never gallery/card photos.
 * See `public/stays/MEDIA.md` for sources.
 */

export const STAYS_NEEDING_USER_FILES = catalog.STAYS_NEEDING_USER_FILES;

type StayMedia = {
  images: string[];
  rooms: Record<string, string | string[]>;
};

export const STAY_MEDIA: Record<string, StayMedia> = catalog.STAY_MEDIA;

/** Per-room facts recorded with their source (see `data/stay-photo-sources/{stayId}.json`). */
type RoomMeta = {
  /** Category name shown at the photo source, when the catalog room uses a generic name. */
  sourceName?: string;
  /** Floor(s) for this room type, only when the source states it. */
  floors?: string;
  floorSource?: string;
};

export const ROOM_PHOTO_META: Record<string, Record<string, RoomMeta>> = roomMeta.ROOMS;

function roomFacts(stayId: string, roomId: string) {
  const meta = ROOM_PHOTO_META[stayId]?.[roomId];
  if (!meta) return {};
  return {
    ...(meta.sourceName ? { photoLabel: meta.sourceName } : {}),
    ...(meta.floors ? { floors: meta.floors } : {}),
  };
}

type RoomInput = Omit<RoomType, "image"> & { image?: string };

export function stayNeedsUserFiles(stayId: string) {
  return (STAYS_NEEDING_USER_FILES as readonly string[]).includes(stayId);
}

/** Attach property-owned gallery + room images (never YouTube thumbs / Unsplash).
 *  `images[0]` is always a property/grounds shot (`property-1.jpg`), not a room. */
export function attachPropertyMedia(p: { id: string; rooms: RoomInput[] }) {
  const spec = STAY_MEDIA[p.id];
  if (!spec) {
    return {
      images: [] as string[],
      image: "",
      rooms: p.rooms.map((room) => ({ ...room, ...roomFacts(p.id, room.id), image: "", images: [] as string[] })),
    };
  }
  const images = [...new Set(spec.images)];
  const rooms: RoomType[] = p.rooms.map((room) => {
    const listed = spec.rooms[room.id];
    const frames = (Array.isArray(listed) ? listed : listed ? [listed] : []).filter(Boolean);
    // A property gallery does not stand in for a room the hotel did not photograph.
    return {
      ...room,
      ...roomFacts(p.id, room.id),
      image: frames[0] ?? "",
      images: frames,
    };
  });
  return {
    images,
    rooms,
    image: images[0] ?? "",
  };
}
