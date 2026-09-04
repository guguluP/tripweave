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
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  id_type: string | null;
  id_number: string | null;
  special_requests: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  identity_source: string | null;
  created_at: string;
};
