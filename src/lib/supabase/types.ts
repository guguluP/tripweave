/** Row shapes matching supabase/schema.sql */

export type SbBooking = {
  id: number;
  user_id: string;
  package_id: string;
  package_name: string;
  nights: number;
  travelers: number;
  check_in: string;
  amount_inr: number;
  swaps: Record<string, string> | string;
  status: string;
  card_last4: string | null;
  card_brand: string | null;
  payer_name: string;
  confirmation_code: string;
  payment_method: string | null;
  payment_ref: string | null;
  upi_handle: string | null;
  bank_name: string | null;
  created_at: string;
};

export type SbTraveler = {
  id: number;
  user_id: string;
  booking_id: number | null;
  full_name: string;
  phone: string;
  email: string;
  nationality: string | null;
  id_type: string | null;
  id_last4: string | null;
  id_number: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  digiyatra_status: string | null;
  expires_at: string | null;
  created_at: string;
};

export type SbReviewerConsensus = {
  package_id: string;
  overall_sentiment: "positive" | "mixed" | "negative";
  key_positives: string[];
  key_negatives: string[];
  caveats: string[];
  consensus_summary: string;
  sources: unknown;
  origin: "seed" | "live" | "empty";
  video_hash: string | null;
  updated_at: string;
};
