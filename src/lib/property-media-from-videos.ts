import type { PropertyVideo, RoomType } from "./packages.ts";

/** Stay/room gallery media is YouTube/property-sourced — not generic Unsplash stock. */
export function youtubeThumbUrl(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Build a gallery from this stay's curated videos only (never cross-hotel stock). */
export function propertyGallery(videos: PropertyVideo[], minCount = 4): string[] {
  if (videos.length === 0) return [];
  // hqdefault is the reliable YouTube thumb; pad by cycling this stay's videos only.
  const primary = videos.map((v) => youtubeThumbUrl(v.videoId));
  const images = [...primary];
  let i = 0;
  while (images.length < minCount) {
    images.push(primary[i % primary.length]!);
    i += 1;
  }
  return images;
}

type RoomInput = Omit<RoomType, "image"> & { image?: string };

/**
 * Override catalog Unsplash placeholders with this property's YouTube thumbs.
 * Room images map in order from the stay's curated videos (reuse when fewer videos).
 */
export function attachPropertyMedia(p: {
  videos: PropertyVideo[];
  rooms: RoomInput[];
}) {
  const images = propertyGallery(p.videos, Math.max(4, p.rooms.length));
  const rooms: RoomType[] = p.rooms.map((room, i) => ({
    ...room,
    image: youtubeThumbUrl(p.videos[i % p.videos.length]!.videoId),
  }));
  return {
    images,
    rooms,
    image: images[0]!,
  };
}
