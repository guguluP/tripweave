import type { WalletPassPayload } from "@/lib/apple-wallet";

const KEY = "tripweave-wallet-passes";

export function listWalletPasses(): WalletPassPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isWalletPass);
  } catch {
    return [];
  }
}

export function saveWalletPass(payload: WalletPassPayload) {
  if (typeof window === "undefined") return;
  try {
    const next = [
      payload,
      ...listWalletPasses().filter((p) => p.confirmationCode !== payload.confirmationCode),
    ].slice(0, 20);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function removeWalletPass(confirmationCode: string) {
  if (typeof window === "undefined") return;
  try {
    const next = listWalletPasses().filter((p) => p.confirmationCode !== confirmationCode);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function isWalletPass(value: unknown): value is WalletPassPayload {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<WalletPassPayload>;
  return (
    typeof p.confirmationCode === "string" &&
    typeof p.packageName === "string" &&
    typeof p.checkIn === "string"
  );
}
