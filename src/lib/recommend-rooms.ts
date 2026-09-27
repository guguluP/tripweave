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

/**
 * Pick 2–3 rooms that cover base / sea-view / family heuristics from official
 * room metadata. Does not invent rooms — only selects from the given list.
 */
export function recommendRooms(rooms: RoomType[], style?: TravelStyle): RoomType[] {
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

  // Prefer at least 2 when the catalog has more than one room.
  return picks.slice(0, Math.min(3, rooms.length));
}

export function recommendRoomIds(rooms: RoomType[], style?: TravelStyle): string[] {
  return recommendRooms(rooms, style).map((r) => r.id);
}
