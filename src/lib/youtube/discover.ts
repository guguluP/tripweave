import { getPackage } from "@/lib/packages";
import type { CuratedVideo } from "./types.ts";
import { videosForPackage } from "./videos.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

type Cache = { at: number; videos: CuratedVideo[] };
const g = globalThis as typeof globalThis & { __twYtDiscover__?: Map<string, Cache> };
if (!g.__twYtDiscover__) g.__twYtDiscover__ = new Map();

function youtubeKey() {
  return process.env.YOUTUBE_API_KEY?.trim() || process.env.YOUTUBE_DATA_API_KEY?.trim() || "";
}

function merge(curated: CuratedVideo[], extra: CuratedVideo[]) {
  const seen = new Set(curated.map((v) => v.videoId));
  const add = extra.filter((v) => {
    if (seen.has(v.videoId)) return false;
    if (/shorts|#ad|\bpromo\b|\bsponsored\b/i.test(v.title)) return false;
    seen.add(v.videoId);
    return true;
  });
  return [...curated, ...add].slice(0, 6);
}

async function searchStayReviews(hotelName: string, key: string): Promise<CuratedVideo[]> {
  const q = `${hotelName} Puri hotel stay review`;
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", "8");
  searchUrl.searchParams.set("q", q);
  searchUrl.searchParams.set("videoDuration", "medium");
  searchUrl.searchParams.set("relevanceLanguage", "en");
  searchUrl.searchParams.set("key", key);
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    console.warn("[reviewer-consensus] youtube search", searchRes.status);
    return [];
  }
  const searchJson = (await searchRes.json()) as {
    items?: { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string } }[];
  };
  const ids = (searchJson.items ?? [])
    .map((item) => item.id?.videoId)
    .filter((id): id is string => Boolean(id));
  if (ids.length === 0) return [];

  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("part", "contentDetails,snippet,statistics");
  videosUrl.searchParams.set("id", ids.join(","));
  videosUrl.searchParams.set("key", key);
  const videosRes = await fetch(videosUrl);
  if (!videosRes.ok) return [];
  const videosJson = (await videosRes.json()) as {
    items?: {
      id?: string;
      snippet?: { title?: string; channelTitle?: string };
      contentDetails?: { duration?: string };
      statistics?: { viewCount?: string };
    }[];
  };
  const out: CuratedVideo[] = [];
  for (const item of videosJson.items ?? []) {
    if (!item.id || !item.snippet?.title) continue;
    const duration = item.contentDetails?.duration ?? "";
    const short = /^PT[0-5]?[0-9]S$/.test(duration) || duration === "PT1M" || /shorts/i.test(item.snippet.title);
    if (short) continue;
    const views = Number(item.statistics?.viewCount ?? "0");
    if (views > 0 && views < 500) continue;
    out.push({
      videoId: item.id,
      title: item.snippet.title,
      channel: item.snippet.channelTitle ?? "",
    });
  }
  return out.slice(0, 4);
}

/** Curated list, plus YouTube Data API results when YOUTUBE_API_KEY is set. */
export async function resolveVideos(packageId: string): Promise<CuratedVideo[]> {
  const curated = videosForPackage(packageId);
  const key = youtubeKey();
  if (!key) return curated;
  const hit = g.__twYtDiscover__!.get(packageId);
  if (hit && Date.now() - hit.at < DAY_MS) return merge(curated, hit.videos);
  const name = getPackage(packageId)?.name ?? packageId;
  try {
    const extra = await searchStayReviews(name, key);
    g.__twYtDiscover__!.set(packageId, { at: Date.now(), videos: extra });
    return merge(curated, extra);
  } catch (err) {
    console.warn("[reviewer-consensus] discover failed", packageId, err);
    return curated;
  }
}

export function hashVideos(packageId: string, videos: CuratedVideo[]) {
  return `${packageId}:${videos.map((v) => v.videoId).join(",")}`;
}
