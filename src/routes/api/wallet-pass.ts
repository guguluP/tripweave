import { createFileRoute } from "@tanstack/react-router";
import {
  appleWalletConfigured,
  buildPassJson,
  type WalletPassPayload,
} from "@/lib/apple-wallet";
import { getPackage } from "@/lib/packages";

/**
 * POST /api/wallet-pass
 * Without Apple certs → 503; client falls back to offline HTML/.ics.
 * With certs: wire passkit-generator to return application/vnd.apple.pkpass.
 */
export const Route = createFileRoute("/api/wallet-pass")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Partial<WalletPassPayload>;
        try {
          body = (await request.json()) as Partial<WalletPassPayload>;
        } catch {
          return Response.json({ message: "Invalid JSON body" }, { status: 400 });
        }

        if (!body.confirmationCode || !body.packageName || !body.checkIn) {
          return Response.json(
            { message: "confirmationCode, packageName, and checkIn are required" },
            { status: 400 },
          );
        }

        const pkg = body.packageId ? getPackage(body.packageId) : undefined;
        const payload: WalletPassPayload = {
          confirmationCode: body.confirmationCode,
          packageName: body.packageName,
          packageId: body.packageId || "",
          neighborhood: pkg?.neighborhood ?? "Puri",
          destination: pkg?.destination ?? "Puri",
          checkIn: body.checkIn,
          nights: Number(body.nights) || 1,
          travelers: Number(body.travelers) || 1,
          payerName: body.payerName || "Guest",
          amountInr: Number(body.amountInr) || 0,
          paymentRef: body.paymentRef ?? null,
          status: body.status || "confirmed",
        };

        const passJson = buildPassJson(payload);

        if (!appleWalletConfigured()) {
          return Response.json(
            {
              ok: false,
              message:
                "Apple Wallet signing certs not set. Download the offline pass card instead. To enable .pkpass: Apple Developer Program + Pass Type ID certs in APPLE_PASS_* env vars.",
              passPreview: passJson,
            },
            { status: 503 },
          );
        }

        return Response.json(
          {
            ok: false,
            message:
              "Certificates detected. Install passkit-generator and wire PKPass signing in /api/wallet-pass to emit application/vnd.apple.pkpass.",
            passPreview: passJson,
            configured: true,
          },
          { status: 501 },
        );
      },
    },
  },
});
