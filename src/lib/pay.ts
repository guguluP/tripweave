import { brandLabel, cardBrand, cvcValid, digitsOnly, expiryValid, luhnValid } from "@/lib/card";

export type PayMethod = "card" | "upi" | "netbanking";

export const NET_BANKS = [
  { id: "sbi", label: "State Bank of India" },
  { id: "hdfc", label: "HDFC Bank" },
  { id: "icici", label: "ICICI Bank" },
  { id: "axis", label: "Axis Bank" },
  { id: "pnb", label: "Punjab National Bank" },
] as const;

export type BankId = (typeof NET_BANKS)[number]["id"];

export function bankLabel(id: string) {
  return NET_BANKS.find((b) => b.id === id)?.label ?? id;
}

const UPI_RE = /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z]{2,16}$/;

export function upiValid(id: string) {
  return UPI_RE.test(id.trim());
}

export function maskUpi(id: string) {
  const raw = id.trim();
  const at = raw.indexOf("@");
  if (at < 1) return raw;
  const local = raw.slice(0, at);
  const host = raw.slice(at);
  if (local.length <= 2) return `${local[0] ?? "*"}***${host}`;
  return `${local.slice(0, 2)}***${host}`;
}

const CARD_DECLINE: Record<string, string> = {
  "4000000000000002": "The bank declined this card.",
  "4000000000009995": "Insufficient funds.",
  "4000000000000069": "This card is reported expired by the issuer.",
};

export type ChargeInput = {
  method: PayMethod;
  payerName: string;
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
  upiId?: string;
  bankId?: string;
  bankPin?: string;
};

export type ChargeOk = {
  ok: true;
  method: PayMethod;
  brand: string | null;
  last4: string | null;
  upiHandle: string | null;
  bank: string | null;
  ref: string;
};

export type ChargeFail = { ok: false; message: string; field?: string };

function makeRef(prefix: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = prefix;
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/** Sandbox processor. Never stores PAN / UPI secret / PIN. */
export function charge(input: ChargeInput): ChargeOk | ChargeFail {
  const name = input.payerName.trim();
  if (name.length < 2) return { ok: false, message: "Enter the payer name.", field: "payerName" };

  if (input.method === "card") {
    const number = digitsOnly(input.cardNumber ?? "");
    if (!luhnValid(number)) {
      return { ok: false, message: "That card number doesn’t check out.", field: "cardNumber" };
    }
    const brand = cardBrand(number);
    if (!expiryValid(input.expiry ?? "")) {
      return { ok: false, message: "Use a future MM / YY.", field: "expiry" };
    }
    if (!cvcValid(input.cvc ?? "", brand)) {
      return { ok: false, message: "Check the CVC.", field: "cvc" };
    }
    const decline = CARD_DECLINE[number];
    if (decline) return { ok: false, message: decline, field: "cardNumber" };
    return {
      ok: true,
      method: "card",
      brand,
      last4: number.slice(-4),
      upiHandle: null,
      bank: null,
      ref: makeRef("PAY-"),
    };
  }

  if (input.method === "upi") {
    const upi = (input.upiId ?? "").trim().toLowerCase();
    if (!upiValid(upi)) {
      return { ok: false, message: "Use a UPI ID like name@okaxis.", field: "upiId" };
    }
    const handle = upi.split("@")[1] ?? "";
    if (upi.startsWith("fail@") || upi.startsWith("decline@") || handle === "fail") {
      return { ok: false, message: "UPI request was declined.", field: "upiId" };
    }
    return {
      ok: true,
      method: "upi",
      brand: "upi",
      last4: null,
      upiHandle: maskUpi(upi),
      bank: null,
      ref: makeRef("UPI-"),
    };
  }

  const bankId = (input.bankId ?? "") as BankId;
  if (!NET_BANKS.some((b) => b.id === bankId)) {
    return { ok: false, message: "Choose a bank.", field: "bankId" };
  }
  const pin = digitsOnly(input.bankPin ?? "");
  if (pin.length !== 6) {
    return { ok: false, message: "Enter the 6-digit net-banking PIN.", field: "bankPin" };
  }
  if (pin === "000000") {
    return { ok: false, message: "Net banking payment was declined.", field: "bankPin" };
  }
  if (pin !== "123456") {
    return { ok: false, message: "Incorrect net-banking PIN.", field: "bankPin" };
  }
  return {
    ok: true,
    method: "netbanking",
    brand: "netbanking",
    last4: null,
    upiHandle: null,
    bank: bankLabel(bankId),
    ref: makeRef("NB-"),
  };
}

export function methodLabel(method: string) {
  if (method === "upi") return "UPI";
  if (method === "netbanking") return "Net banking";
  return "Card";
}

export function paymentLine(row: {
  paymentMethod: string;
  cardBrand: string | null;
  cardLast4: string | null;
  upiHandle: string | null;
  bankName: string | null;
}) {
  if (row.paymentMethod === "upi") {
    return row.upiHandle ? `UPI · ${row.upiHandle}` : "UPI";
  }
  if (row.paymentMethod === "netbanking") {
    return row.bankName ? `Net banking · ${row.bankName}` : "Net banking";
  }
  if (row.cardLast4) {
    return `${brandLabel(row.cardBrand ?? "card")} · ${row.cardLast4}`;
  }
  return "Card";
}
