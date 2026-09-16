import type { RoomType } from "./packages.ts";
import catalog from "./stay-media.json" with { type: "json" };

/**
 * Catalog media is property-owned (official hotel/brand CDNs or local /stays files).
 * YouTube remains only for reviewer-consensus videos — never gallery/card photos.
 * See `public/stays/MEDIA.md` for sources.
 */

export const STAYS_NEEDING_USER_FILES = catalog.STAYS_NEEDING_USER_FILES;

type StayMedia = {
  images: string[];
  rooms: Record<string, string>;
};

export const STAY_MEDIA: Record<string, StayMedia> = catalog.STAY_MEDIA;

type RoomInput = Omit<RoomType, "image"> & { image?: string };

export function stayNeedsUserFiles(stayId: string) {
  return (STAYS_NEEDING_USER_FILES as readonly string[]).includes(stayId);
}

/** Attach property-owned gallery + room images (never YouTube thumbs / Unsplash). */
export function attachPropertyMedia(p: { id: string; rooms: RoomInput[] }) {
  const spec = STAY_MEDIA[p.id];
  if (!spec) {
    throw new Error(`Missing property media for stay ${p.id}`);
  }
  const images = [...spec.images];
  while (images.length < 4) {
    images.push(images[images.length % Math.max(images.length, 1)] ?? spec.images[0]!);
  }
  const rooms: RoomType[] = p.rooms.map((room) => ({
    ...room,
    image: spec.rooms[room.id] ?? images[0]!,
  }));
  return {
    images,
    rooms,
    image: images[0]!,
  };
}
