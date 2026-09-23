import { createServerFn } from "@tanstack/react-start";
import { appleWalletConfigured } from "@/lib/apple-wallet";

export const walletSigningReady = createServerFn({ method: "GET" }).handler(async () => {
  return appleWalletConfigured();
});
