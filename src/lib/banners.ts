export type BannerTone = "ok" | "danger" | "info";

export type Banner = {
  id: string;
  title: string;
  body?: string;
  tone?: BannerTone;
};

type Listener = () => void;

let items: Banner[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function getBanners() {
  return items;
}

export function subscribeBanners(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function pushBanner(input: Omit<Banner, "id"> & { id?: string }) {
  const banner: Banner = {
    id: input.id ?? `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: input.title,
    body: input.body,
    tone: input.tone ?? "info",
  };
  items = [banner, ...items].slice(0, 6);
  emit();
  return banner.id;
}

export function dismissBanner(id: string) {
  items = items.filter((b) => b.id !== id);
  emit();
}
