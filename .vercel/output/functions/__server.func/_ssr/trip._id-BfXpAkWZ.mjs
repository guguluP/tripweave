import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as formatMoney, d as priceWithSwaps, h as variantLabel, m as savePending, o as getPackage, p as saveNext } from "./packages-eAQZmKLU.mjs";
import { c as MapPin, h as Check } from "../_libs/lucide-react.mjs";
import { l as cn, n as Route$1 } from "./router-BhdpjCnA.mjs";
import { i as TextSwap, n as Button, r as Stagger } from "./button-DBLqx4RN.mjs";
import { i as useCurrentUserState, n as Shell, t as DigitPop } from "./shell-ChiWA-mp.mjs";
import { t as Card } from "./card-CEb94xDN.mjs";
import { n as TrustMeter, t as LikeButton } from "./trust-meter-DH6J_B2g.mjs";
import { t as Badge } from "./badge-DWv9uPWY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/trip._id-BfXpAkWZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function TripDetail() {
	const { id } = Route$1.useParams();
	const pkg = getPackage(id);
	const nav = useNavigate();
	const { user, isPending } = useCurrentUserState();
	const [swaps, setSwaps] = (0, import_react.useState)({});
	const [booking, setBooking] = (0, import_react.useState)(false);
	if (!pkg) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl px-4 py-16",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl",
			children: "Stay not found"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: "Back to Discover"
			})
		})]
	}) });
	const price = priceWithSwaps(pkg, swaps);
	const toggleSwap = (dayIdx, optionId) => {
		setSwaps((s) => {
			const key = String(dayIdx);
			const next = { ...s };
			if (next[key] === optionId) delete next[key];
			else next[key] = optionId;
			return next;
		});
	};
	const goBook = () => {
		savePending({
			packageId: pkg.id,
			swaps
		});
		if (isPending) return;
		setBooking(true);
		if (!user) {
			saveNext("/checkout");
			nav({ to: "/login" });
			return;
		}
		nav({ to: "/checkout" });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative h-64 md:h-80",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: pkg.image,
					alt: pkg.name,
					className: "h-full w-full object-cover"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute right-4 top-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LikeButton, { id: pkg.id })
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-3xl px-4 pb-28",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "-mt-16 relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Stagger, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "eyebrow",
							children: pkg.destination
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-1 font-display text-4xl",
							children: pkg.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 flex items-center gap-1.5 text-sm text-muted",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3.5" }),
								pkg.neighborhood,
								" · ",
								pkg.nights,
								" nights · ",
								variantLabel(pkg)
							]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustMeter, {
						score: pkg.trustScore,
						reviews: pkg.reviews
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 max-w-xl text-muted",
					children: pkg.summary
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 flex flex-wrap gap-2",
					children: pkg.includes.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						className: "gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" }), item]
					}, item))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-10 font-display text-2xl",
					children: "Stay plan"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Swap activities — the all-in rupee price updates live."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 grid gap-3",
					children: pkg.days.map((day, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "p-4 shadow-none",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "eyebrow",
								children: ["Day ", i + 1]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-1 font-display text-lg",
								children: day.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-muted",
								children: day.base
							}),
							day.options.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 flex flex-wrap gap-2",
								children: day.options.map((o) => {
									const on = swaps[String(i)] === o.id;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => toggleSwap(i, o.id),
										className: cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150", on ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-muted hover:text-fg"),
										children: [
											o.label,
											" (",
											o.delta >= 0 ? "+" : "",
											formatMoney(o.delta),
											")"
										]
									}, o.id);
								})
							}) : null
						]
					}, day.title))
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-x-0 bottom-14 z-20 border-t border-border bg-elevated/95 px-4 py-3 backdrop-blur-md md:bottom-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-3xl items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xl tabular-nums",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DigitPop, { value: formatMoney(price) })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "all-in · per person"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "lg",
					onClick: goBook,
					disabled: isPending,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextSwap, {
						text: booking ? "Taking you to pay" : "Book this stay",
						shimmer: booking
					})
				})]
			})
		})
	] });
}
//#endregion
export { TripDetail as component };
