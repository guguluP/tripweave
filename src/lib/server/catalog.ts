import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import type { CatalogOverlay, ExtraOverride } from "@/lib/catalog-store";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SUPABASE_WRITE_GATE } from "@/lib/supabase/write-gate";
type ReviewAgg = { packageId?: string; rating?: number; count?: number };
type OverrideRow = {
  package_id?: string;
  price_per_night?: number | null;
  image_url?: string | null;
  extras?: ExtraOverride[];
};

function asOverlays(payload: { overrides?: OverrideRow[]; reviews?: ReviewAgg[] }): CatalogOverlay[] {
  const reviews = new Map((payload.reviews ?? []).map((row) => [row.packageId, row]));
  const ids = new Set<string>([
    ...(payload.overrides ?? []).map((row) => row.package_id).filter((id): id is string => Boolean(id)),
    ...reviews.keys(),
  ].filter((id): id is string => Boolean(id)));
  return [...ids].map((packageId) => {
    const row = (payload.overrides ?? []).find((item) => item.package_id === packageId);
    const review = reviews.get(packageId);
    return {
      packageId,
      pricePerNight: row?.price_per_night ?? null,
      image: row?.image_url ?? null,
      extras: Array.isArray(row?.extras) ? row.extras : [],
      guestRating: review?.rating ?? null,
      guestCount: review?.count ?? 0,
    };
  });
}

export const loadCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<CatalogOverlay[]> => {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb.rpc("tw_catalog", { p_gate: SUPABASE_WRITE_GATE });
  if (error || !data || typeof data !== "object") return [];
  return asOverlays(data as { overrides?: OverrideRow[]; reviews?: ReviewAgg[] });
});

const saveSchema = z.object({
  packageId: z.string().min(1).max(80),
  pricePerNight: z.number().int().min(500).max(200000),
  image: z.string().max(500).optional(),
  extras: z.array(z.object({ optionId: z.string().max(40), delta: z.number().int().min(0).max(100000), label: z.string().max(80).optional() })).max(20),
});

export const saveCatalogOverride = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ context, data }) => {
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: false as const, message: "Catalog storage is not connected." };
    const { error } = await sb.rpc("tw_save_override", {
      p_gate: SUPABASE_WRITE_GATE,
      p_payload: {
        package_id: data.packageId,
        price_per_night: data.pricePerNight,
        image_url: data.image ?? "",
        extras: data.extras,
        updated_by: context.userId,
      },
    });
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const };
  });

const reviewSchema = z.object({
  packageId: z.string().min(1).max(80),
  bookingId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(8).max(800),
});

export const saveStayReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => reviewSchema.parse(data))
  .handler(async ({ context, data }) => {
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: false as const, message: "Reviews need the TripWeave database." };
    const { error } = await sb.rpc("tw_save_review", {
      p_gate: SUPABASE_WRITE_GATE,
      p_payload: {
        user_id: context.userId,
        package_id: data.packageId,
        booking_id: data.bookingId,
        rating: data.rating,
        body: data.body,
      },
    });
    if (error) {
      const message = error.message.includes("review_not_allowed")
        ? "You can review a stay after check-in, on a booking in your name."
        : error.message;
      return { ok: false as const, message };
    }
    return { ok: true as const };
  });

export type DeskBooking = {
  id: number;
  packageId: string;
  packageName: string;
  checkIn: string;
  nights: number;
  travelers: number;
  payerName: string;
  status: string;
  confirmationCode: string;
  amountInr: number;
  guestEmail?: string | null;
};

export const listDeskBookings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((packageId: string) => z.string().min(1).max(80).parse(packageId))
  .handler(async ({ data }): Promise<DeskBooking[]> => {
    const sb = getSupabaseAdmin();
    if (!sb) return [];
    const { data: rows, error } = await sb.rpc("tw_desk_bookings", {
      p_gate: SUPABASE_WRITE_GATE,
      p_package: data,
    });
    if (error || !Array.isArray(rows)) return [];
    return rows as DeskBooking[];
  });

export const confirmDeskBooking = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.number().int(), packageId: z.string(), note: z.string().max(400) }).parse(data))
  .handler(async ({ data }) => {
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: false as const, message: "Desk confirm needs the database." };
    const { error } = await sb.rpc("tw_confirm_booking", {
      p_gate: SUPABASE_WRITE_GATE,
      p_payload: { id: data.id, package_id: data.packageId, note: data.note },
    });
    if (error) return { ok: false as const, message: error.message.includes("not_open") ? "That stay is not waiting for the desk." : error.message };
    return { ok: true as const };
  });

export const sendStayReminder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ email: z.string().email(), hotel: z.string(), checkIn: z.string(), code: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const key = process.env.RESEND_API_KEY?.trim();
    const from = process.env.RESEND_FROM?.trim();
    if (!key || !from) {
      return { ok: false as const, message: "Reminder email needs RESEND_API_KEY and RESEND_FROM. The guest still sees the reminder in My trips." };
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [data.email],
        subject: `Tomorrow: ${data.hotel}`,
        text: `Your TripWeave stay at ${data.hotel} checks in on ${data.checkIn}. Confirmation ${data.code}. Show the desk voucher when you arrive.`,
      }),
    });
    if (!res.ok) return { ok: false as const, message: "Could not send the reminder email." };
    return { ok: true as const };
  });
