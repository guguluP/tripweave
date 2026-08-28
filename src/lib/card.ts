export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function luhnValid(num: string) {
  const digits = digitsOnly(num);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function cardBrand(num: string) {
  const d = digitsOnly(num);
  if (d.startsWith("4")) return "visa";
  if (/^3[47]/.test(d)) return "amex";
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "mastercard";
  if (d.startsWith("6")) return "rupay";
  return "card";
}

export function formatCardNumber(value: string) {
  const d = digitsOnly(value).slice(0, 19);
  return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function expiryValid(expiry: string) {
  const m = expiry.trim().match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const exp = new Date(year, month, 0, 23, 59, 59);
  return exp >= now;
}

export function cvcValid(cvc: string, brand: string) {
  const d = digitsOnly(cvc);
  return brand === "amex" ? d.length === 4 : d.length === 3;
}

export function brandLabel(brand: string) {
  if (brand === "visa") return "Visa";
  if (brand === "mastercard") return "Mastercard";
  if (brand === "amex") return "Amex";
  if (brand === "rupay") return "RuPay";
  return "Card";
}
