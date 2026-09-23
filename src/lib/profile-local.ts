export type LocalProfile = {
  displayName: string;
  phone: string;
  email: string;
  /** City the guest travels from. Any name in India or abroad. */
  homeCity?: string;
};

const KEY = "tripweave-profile";

export function loadLocalProfile(): LocalProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalProfile>;
    return {
      displayName: typeof parsed.displayName === "string" ? parsed.displayName : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      homeCity: typeof parsed.homeCity === "string" ? parsed.homeCity.slice(0, 80) : "",
    };
  } catch {
    return null;
  }
}

export function saveLocalProfile(profile: LocalProfile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* quota / private mode */
  }
}
