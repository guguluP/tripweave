import { travelersFitRoom } from "./inventory.ts";
import type { RoomType, TravelStyle } from "./packages.ts";

const SEA_RE = /\b(sea|ocean|marine|beach\s*view|front\s*sea|side\s*sea)\b/i;
const FAMILY_RE = /\bfamily\b/i;

function blob(room: RoomType) {
  return `${room.name} ${room.summary} ${room.id}`;
}

export function isSeaViewRoom(room: RoomType): boolean {
  return SEA_RE.test(blob(room));
}

export function isFamilyRoom(room: RoomType): boolean {
  return FAMILY_RE.test(blob(room)) || room.occupancy >= 4;
}

export function isBaseRoom(room: RoomType): boolean {
  return room.deltaPerNight === 0;
}

function diversePicks(rooms: RoomType[], style?: TravelStyle): RoomType[] {
  if (rooms.length === 0) return [];
  if (rooms.length <= 3) return [...rooms];

  const base = rooms.find(isBaseRoom) ?? rooms[0]!;
  const sea = rooms.find((r) => r.id !== base.id && isSeaViewRoom(r));
  const family = rooms.find(
    (r) => r.id !== base.id && r.id !== sea?.id && isFamilyRoom(r),
  );

  const picks: RoomType[] = [base];
  if (style === "family") {
    if (family) picks.push(family);
    if (sea && picks.length < 3) picks.push(sea);
  } else {
    if (sea) picks.push(sea);
    if (family && picks.length < 3) picks.push(family);
  }

  for (const room of rooms) {
    if (picks.length >= 3) break;
    if (!picks.some((p) => p.id === room.id)) picks.push(room);
  }

  return picks.slice(0, Math.min(3, rooms.length));
}

/**
 * Pick 2–3 rooms that cover base / sea-view / family heuristics from official
 * room metadata. Does not invent rooms — only selects from the given list.
 * When guestCount is set, rooms that cannot sleep the party are dropped and
 * the smallest room that fits is listed first.
 */
export function recommendRooms(rooms: RoomType[], style?: TravelStyle, guestCount?: number): RoomType[] {
  if (rooms.length === 0) return [];
  if (guestCount == null || !(guestCount > 0)) return diversePicks(rooms, style);
  const fitting = rooms.filter((r) => travelersFitRoom(r.occupancy, guestCount));
  if (fitting.length === 0) return [];
  const sorted = [...fitting].sort(
    (a, b) => a.occupancy - b.occupancy || a.deltaPerNight - b.deltaPerNight,
  );
  const smallest = sorted[0]!;
  const rest = diversePicks(sorted.slice(1), style).filter((r) => r.id !== smallest.id);
  return [smallest, ...rest].slice(0, Math.min(3, fitting.length));
}

export function recommendRoomIds(rooms: RoomType[], style?: TravelStyle, guestCount?: number): string[] {
  return recommendRooms(rooms, style, guestCount).map((r) => r.id);
}
