import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as saveBrief, s as loadBrief, t as DEFAULT_BRIEF } from "./packages-eAQZmKLU.mjs";
import { l as cn } from "./router-BhdpjCnA.mjs";
import { i as TextSwap, n as Button, r as Stagger } from "./button-DBLqx4RN.mjs";
import { n as Shell, t as DigitPop } from "./shell-ChiWA-mp.mjs";
import { t as MotionToggle } from "./toggle-DGMT1fL4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/plan-DyvnEFnb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var VIBES = [
	{
		id: "culture",
		label: "Culture & temple",
		hint: "Darshan, Konark, old town"
	},
	{
		id: "beach",
		label: "Beach & coast",
		hint: "Sand, sunrise, slow walks"
	},
	{
		id: "relax",
		label: "Slow & spa",
		hint: "Pool, Ayurveda, quiet"
	},
	{
		id: "adventure",
		label: "Adventure",
		hint: "Day trips, extra miles"
	}
];
var BUDGETS = [
	{
		id: "value",
		label: "Value",
		hint: "Honest 2–3 star"
	},
	{
		id: "mid",
		label: "Mid-range",
		hint: "Reliable 4-star"
	},
	{
		id: "premium",
		label: "Premium",
		hint: "Heritage & 5-star"
	}
];
var STYLES = [
	{
		id: "solo",
		label: "Solo"
	},
	{
		id: "couple",
		label: "Couple"
	},
	{
		id: "family",
		label: "Family"
	},
	{
		id: "friends",
		label: "Friends"
	}
];
function Plan() {
	const nav = useNavigate();
	const [brief, setBrief] = (0, import_react.useState)(() => typeof window === "undefined" ? DEFAULT_BRIEF : loadBrief());
	const [busy, setBusy] = (0, import_react.useState)(false);
	const update = (key, value) => {
		setBrief((b) => ({
			...b,
			[key]: value
		}));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl px-4 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Stagger, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "eyebrow",
					children: "Your brief"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl",
					children: "Tell us what you want"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-muted",
					children: "We use this to rank a short list — not to spam you with 200 results."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
					className: "text-sm font-medium",
					children: "Trip vibe"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid gap-2 sm:grid-cols-2",
					children: VIBES.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						selected: brief.vibe === v.id,
						title: v.label,
						hint: v.hint,
						onClick: () => update("vibe", v.id)
					}, v.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
					className: "text-sm font-medium",
					children: "Budget per person"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid gap-2 sm:grid-cols-3",
					children: BUDGETS.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						selected: brief.budget === v.id,
						title: v.label,
						hint: v.hint,
						onClick: () => update("budget", v.id)
					}, v.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
					className: "text-sm font-medium",
					children: "Travel style"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4",
					children: STYLES.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						selected: brief.style === v.id,
						title: v.label,
						onClick: () => update("style", v.id)
					}, v.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: "Nights"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							size: "icon",
							onClick: () => update("nights", Math.max(2, brief.nights - 1)),
							"aria-label": "Fewer nights",
							children: "−"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "min-w-16 text-center font-display text-2xl tabular-nums",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DigitPop, { value: brief.nights })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							size: "icon",
							onClick: () => update("nights", Math.min(14, brief.nights + 1)),
							"aria-label": "More nights",
							children: "+"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex items-center justify-between gap-4 rounded-lg border border-border bg-elevated px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: "Flexible dates"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Rank stays even if nights don’t match exactly."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MotionToggle, {
					on: brief.flexible,
					onChange: (v) => update("flexible", v),
					label: "Flexible dates"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-10 w-full sm:w-auto",
				size: "lg",
				onClick: () => {
					setBusy(true);
					saveBrief(brief);
					nav({ to: "/matches" });
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextSwap, {
					text: busy ? "Matching stays" : "Show matches",
					shimmer: busy
				})
			})
		]
	}) });
}
function Choice({ selected, title, hint, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: cn("rounded-lg border px-4 py-3 text-left transition-colors duration-150", selected ? "border-primary bg-surface" : "border-border bg-elevated hover:bg-surface"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-medium",
			children: title
		}), hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-0.5 block text-xs text-muted",
			children: hint
		}) : null]
	});
}
//#endregion
export { Plan as component };
