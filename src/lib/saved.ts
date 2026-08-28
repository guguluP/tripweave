import { useSyncExternalStore } from "react";

const KEY = "tripweave-saved";
const EMPTY: string[] = [];

function read(): string[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

let snapshot: string[] = typeof window === "undefined" ? EMPTY : read();
const listeners = new Set<() => void>();

function emit() {
  snapshot = read();
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) emit();
  });
}

export function toggleSaved(id: string): boolean {
  const cur = new Set(read());
  const on = !cur.has(id);
  if (on) cur.add(id);
  else cur.delete(id);
  window.localStorage.setItem(KEY, JSON.stringify([...cur]));
  emit();
  return on;
}

export function useSavedIds(): string[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => snapshot,
    () => EMPTY,
  );
}

export function useIsSaved(id: string) {
  return useSavedIds().includes(id);
}
