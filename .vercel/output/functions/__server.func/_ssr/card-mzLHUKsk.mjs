//#region node_modules/.nitro/vite/services/ssr/assets/card-mzLHUKsk.js
function digitsOnly(value) {
	return value.replace(/\D/g, "");
}
function luhnValid(num) {
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
function cardBrand(num) {
	const d = digitsOnly(num);
	if (d.startsWith("4")) return "visa";
	if (/^3[47]/.test(d)) return "amex";
	if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "mastercard";
	if (d.startsWith("6")) return "rupay";
	return "card";
}
function formatCardNumber(value) {
	return digitsOnly(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}
function expiryValid(expiry) {
	const m = expiry.trim().match(/^(\d{2})\s*\/\s*(\d{2})$/);
	if (!m) return false;
	const month = Number(m[1]);
	const year = 2e3 + Number(m[2]);
	if (month < 1 || month > 12) return false;
	const now = /* @__PURE__ */ new Date();
	return new Date(year, month, 0, 23, 59, 59) >= now;
}
function cvcValid(cvc, brand) {
	const d = digitsOnly(cvc);
	return brand === "amex" ? d.length === 4 : d.length === 3;
}
function brandLabel(brand) {
	if (brand === "visa") return "Visa";
	if (brand === "mastercard") return "Mastercard";
	if (brand === "amex") return "Amex";
	if (brand === "rupay") return "RuPay";
	return "Card";
}
//#endregion
export { expiryValid as a, digitsOnly as i, cardBrand as n, formatCardNumber as o, cvcValid as r, luhnValid as s, brandLabel as t };
