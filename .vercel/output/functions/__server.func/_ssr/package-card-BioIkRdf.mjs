import { S as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as formatMoney, h as variantLabel } from "./packages-eAQZmKLU.mjs";
import { t as DigitPop } from "./shell-ChiWA-mp.mjs";
import { t as Card } from "./card-CEb94xDN.mjs";
import { t as LearnMore } from "./learn-more-D0-t_H9S.mjs";
import { n as TrustMeter, t as LikeButton } from "./trust-meter-DH6J_B2g.mjs";
import { t as Badge } from "./badge-DWv9uPWY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/package-card-BioIkRdf.js
var import_jsx_runtime = require_jsx_runtime();
function PackageCard({ pkg, rank }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "relative h-full overflow-visible transition-transform duration-150 hover:-translate-y-0.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute right-3 top-3 z-10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LikeButton, { id: pkg.id })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/trip/$id",
			params: { id: pkg.id },
			className: "group block",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative overflow-hidden rounded-t-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: pkg.image,
						alt: pkg.name,
						className: "h-48 w-full object-cover"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-fg/70 to-transparent" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute bottom-3 left-3 right-3 flex items-end justify-between pr-12",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							className: "border-0 bg-elevated/95 text-fg",
							children: variantLabel(pkg)
						}), rank ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display text-sm text-primary-fg",
							children: rank
						}) : null]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-lg leading-snug",
						children: pkg.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							pkg.destination,
							" · ",
							pkg.nights,
							" nights"
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold tabular-nums",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DigitPop, { value: formatMoney(pkg.priceFrom) })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: " all-in"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustMeter, {
							score: pkg.trustScore,
							reviews: pkg.reviews,
							compact: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LearnMore, {
						as: "span",
						className: "text-sm text-primary",
						children: "View stay"
					})
				]
			})]
		})]
	});
}
//#endregion
export { PackageCard as t };
