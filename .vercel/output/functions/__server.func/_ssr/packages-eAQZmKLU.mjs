//#region node_modules/.nitro/vite/services/ssr/assets/packages-eAQZmKLU.js
var DEFAULT_BRIEF = {
	vibe: "beach",
	budget: "mid",
	style: "couple",
	nights: 3,
	flexible: false
};
var BRIEF_KEY = "tripweave-brief";
var PENDING_KEY = "tripweave-pending";
var NEXT_KEY = "tripweave-next";
function formatMoney(amount, currency = "INR") {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency,
		maximumFractionDigits: 0
	}).format(amount);
}
var PACKAGES = [
	{
		id: "taj-puri-resort-spa",
		name: "Taj Puri Resort & Spa",
		destination: "Puri",
		country: "India",
		nights: 3,
		pricePerPerson: 18500,
		trust: 96,
		reviews: 3120,
		budget: "premium",
		vibe: "relax",
		style: [
			"couple",
			"family",
			"friends"
		],
		summary: "Puri's flagship 5-star: private beach, real spa, Odia thalis.",
		image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1600&q=80",
		neighborhood: "Balukhand beachfront",
		includes: [
			"Private beach access",
			"Breakfast",
			"Airport transfer",
			"Spa credit"
		],
		days: [
			{
				title: "Arrive & settle",
				base: "Check-in, welcome drink, pool or beach.",
				options: [{
					id: "spa",
					label: "Spa session",
					delta: 2500
				}]
			},
			{
				title: "Temple & town",
				base: "Jagannath Temple; evening Odia thali.",
				options: [{
					id: "konark",
					label: "Konark half-day",
					delta: 1800
				}]
			},
			{
				title: "Depart",
				base: "Beach breakfast, checkout, transfer.",
				options: []
			}
		]
	},
	{
		id: "mayfair-heritage-puri",
		name: "Mayfair Heritage, Puri",
		destination: "Puri",
		country: "India",
		nights: 4,
		pricePerPerson: 15200,
		trust: 94,
		reviews: 2680,
		budget: "premium",
		vibe: "culture",
		style: [
			"family",
			"couple",
			"friends"
		],
		summary: "Heritage beachfront resort with gardens and Ayurveda spa.",
		image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
		neighborhood: "Chakratirtha Road",
		includes: [
			"Garden rooms",
			"Breakfast",
			"Ayurveda consult",
			"Temple transfer"
		],
		days: [
			{
				title: "Arrival",
				base: "Check-in, garden walk, beachfront dinner.",
				options: []
			},
			{
				title: "Puri classics",
				base: "Jagannath Temple, Gundicha, market.",
				options: [{
					id: "guide",
					label: "Private guide",
					delta: 1200
				}]
			},
			{
				title: "Konark day",
				base: "Sun Temple + Chandrabhaga Beach.",
				options: [{
					id: "ayur",
					label: "Extra Ayurveda",
					delta: 1500
				}]
			},
			{
				title: "Departure",
				base: "Leisure breakfast and checkout.",
				options: []
			}
		]
	},
	{
		id: "swosti-premium-beach-resort",
		name: "Swosti Premium Beach Resort",
		destination: "Puri",
		country: "India",
		nights: 3,
		pricePerPerson: 9800,
		trust: 90,
		reviews: 1940,
		budget: "mid",
		vibe: "beach",
		style: [
			"couple",
			"family",
			"friends"
		],
		summary: "Solid 4-star on the beach road — pool, multi-cuisine, temple access.",
		image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80",
		neighborhood: "Marine Drive",
		includes: [
			"Pool",
			"Breakfast",
			"Beach chairs",
			"Wi-Fi"
		],
		days: [
			{
				title: "Check-in & beach",
				base: "Arrive, pool, evening beach walk.",
				options: [{
					id: "dinner",
					label: "Seafood dinner",
					delta: 900
				}]
			},
			{
				title: "Temple morning",
				base: "Early darshan, market, rest.",
				options: []
			},
			{
				title: "Depart",
				base: "Breakfast and checkout.",
				options: []
			}
		]
	},
	{
		id: "regenta-central-puri",
		name: "Regenta Central Puri Odisha",
		destination: "Puri",
		country: "India",
		nights: 3,
		pricePerPerson: 7200,
		trust: 88,
		reviews: 1560,
		budget: "mid",
		vibe: "culture",
		style: [
			"couple",
			"solo",
			"friends"
		],
		summary: "Central 4-star near the temple — clean, reliable, honest mid-range.",
		image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1600&q=80",
		neighborhood: "Near Jagannath Temple",
		includes: [
			"Breakfast",
			"AC rooms",
			"Temple walk map",
			"Late checkout on request"
		],
		days: [
			{
				title: "Arrive central",
				base: "Check-in, short walk to beach.",
				options: []
			},
			{
				title: "Temple & town",
				base: "Jagannath darshan, local sweets.",
				options: [{
					id: "konark",
					label: "Konark trip",
					delta: 1600
				}]
			},
			{
				title: "Depart",
				base: "Checkout.",
				options: []
			}
		]
	},
	{
		id: "hans-coco-palms",
		name: "Hans Coco Palms",
		destination: "Puri",
		country: "India",
		nights: 3,
		pricePerPerson: 6500,
		trust: 85,
		reviews: 1320,
		budget: "value",
		vibe: "beach",
		style: [
			"couple",
			"friends",
			"solo"
		],
		summary: "Beach-side 3-star with coconut palms — honest value near the water.",
		image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
		neighborhood: "Sea Beach Road",
		includes: [
			"Palm garden",
			"Breakfast",
			"Beach access",
			"Parking"
		],
		days: [
			{
				title: "Beach check-in",
				base: "Settle, evening walk.",
				options: []
			},
			{
				title: "Temple morning",
				base: "Darshan and local food.",
				options: [{
					id: "konark",
					label: "Konark shared",
					delta: 900
				}]
			},
			{
				title: "Depart",
				base: "Checkout.",
				options: []
			}
		]
	},
	{
		id: "empires-hotel-puri",
		name: "Hotel Empires Puri",
		destination: "Puri",
		country: "India",
		nights: 2,
		pricePerPerson: 4200,
		trust: 84,
		reviews: 980,
		budget: "value",
		vibe: "culture",
		style: [
			"solo",
			"couple",
			"friends"
		],
		summary: "Compact city hotel near the temple — clean, budget-friendly, walkable.",
		image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1600&q=80",
		neighborhood: "Grand Road",
		includes: [
			"Walk to temple",
			"Breakfast",
			"AC rooms",
			"24h desk"
		],
		days: [{
			title: "Arrive & temple",
			base: "Check-in, evening darshan.",
			options: []
		}, {
			title: "Town & depart",
			base: "Market, checkout.",
			options: [{
				id: "beach",
				label: "Beach half-day",
				delta: 400
			}]
		}]
	}
].map((p) => ({
	...p,
	priceFrom: p.pricePerPerson,
	trustScore: p.trust
}));
function getPackage(id) {
	return PACKAGES.find((p) => p.id === id);
}
function matchPackages(brief) {
	return PACKAGES.map((p) => {
		let score = 0;
		if (p.vibe === brief.vibe) score += 3;
		if (p.budget === brief.budget) score += 2;
		if (p.style.includes(brief.style)) score += 2;
		if (brief.flexible) score += 1.5;
		else {
			const nightDiff = Math.abs(p.nights - (brief.nights || 3));
			score += Math.max(0, 2 - nightDiff / 2);
		}
		return {
			...p,
			matchScore: score
		};
	}).sort((a, b) => b.matchScore - a.matchScore || b.trustScore - a.trustScore).slice(0, 3);
}
function priceWithSwaps(pkg, swaps = {}) {
	let total = pkg.priceFrom;
	pkg.days.forEach((day, i) => {
		const optId = swaps[String(i)] ?? swaps[i];
		if (!optId) return;
		const opt = day.options.find((o) => o.id === optId);
		if (opt) total += opt.delta;
	});
	return total;
}
function variantLabel(pkg) {
	if (pkg.budget === "value") return "Value";
	if (pkg.budget === "premium") return "Premium";
	return "Mid-range";
}
var RANK_LABELS = [
	"Best match",
	"Also strong",
	"Worth a look"
];
function loadBrief() {
	if (typeof window === "undefined") return DEFAULT_BRIEF;
	try {
		const raw = window.localStorage.getItem(BRIEF_KEY);
		if (!raw) return DEFAULT_BRIEF;
		const parsed = JSON.parse(raw);
		return {
			vibe: parsed.vibe ?? DEFAULT_BRIEF.vibe,
			budget: parsed.budget ?? DEFAULT_BRIEF.budget,
			style: parsed.style ?? DEFAULT_BRIEF.style,
			nights: Number(parsed.nights) || DEFAULT_BRIEF.nights,
			flexible: Boolean(parsed.flexible)
		};
	} catch {
		return DEFAULT_BRIEF;
	}
}
function saveBrief(brief) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(BRIEF_KEY, JSON.stringify(brief));
}
function savePending(pending) {
	if (typeof window === "undefined") return;
	window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}
function loadPending() {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.sessionStorage.getItem(PENDING_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}
function clearPending() {
	if (typeof window === "undefined") return;
	window.sessionStorage.removeItem(PENDING_KEY);
}
function saveNext(path) {
	if (typeof window === "undefined") return;
	window.sessionStorage.setItem(NEXT_KEY, path);
}
function loadNext() {
	if (typeof window === "undefined") return "/";
	try {
		const next = window.sessionStorage.getItem(NEXT_KEY);
		if (next && next.startsWith("/") && !next.startsWith("//")) return next;
		return "/";
	} catch {
		return "/";
	}
}
//#endregion
export { formatMoney as a, loadNext as c, priceWithSwaps as d, saveBrief as f, variantLabel as h, clearPending as i, loadPending as l, savePending as m, PACKAGES as n, getPackage as o, saveNext as p, RANK_LABELS as r, loadBrief as s, DEFAULT_BRIEF as t, matchPackages as u };
