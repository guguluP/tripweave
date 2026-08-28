import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as prefersReducedMotion, l as cn, o as readCssNumber, s as readMs } from "./router-BhdpjCnA.mjs";
import { t as DigitPop } from "./shell-ChiWA-mp.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/trust-meter-DH6J_B2g.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KEY = "tripweave-saved";
var EMPTY = [];
function read() {
	if (typeof window === "undefined") return EMPTY;
	try {
		const raw = window.localStorage.getItem(KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
	} catch {
		return [];
	}
}
var snapshot = typeof window === "undefined" ? EMPTY : read();
var listeners = /* @__PURE__ */ new Set();
function emit() {
	snapshot = read();
	listeners.forEach((l) => l());
}
if (typeof window !== "undefined") window.addEventListener("storage", (e) => {
	if (e.key === KEY) emit();
});
function toggleSaved(id) {
	const cur = new Set(read());
	const on = !cur.has(id);
	if (on) cur.add(id);
	else cur.delete(id);
	window.localStorage.setItem(KEY, JSON.stringify([...cur]));
	emit();
	return on;
}
function useSavedIds() {
	return (0, import_react.useSyncExternalStore)((cb) => {
		listeners.add(cb);
		return () => {
			listeners.delete(cb);
		};
	}, () => snapshot, () => EMPTY);
}
function useIsSaved(id) {
	return useSavedIds().includes(id);
}
function spray() {
	const dist = readCssNumber("--like-particle-dist", 20);
	return Array.from({ length: 8 }, (_, i) => {
		const angle = Math.PI * 2 * i / 8 + (Math.random() - .5) * .55;
		const d = dist * (.75 + Math.random() * .5);
		return {
			px: `${Math.cos(angle) * d}px`,
			py: `${Math.sin(angle) * d}px`,
			pdur: `${500 + Math.random() * 180}ms`,
			pdelay: `${Math.random() * 50}ms`,
			pEndScale: .4 + Math.random() * .35,
			psize: .7 + Math.random() * .7
		};
	});
}
function LikeButton({ id, className }) {
	const liked = useIsSaved(id);
	const [bursting, setBursting] = (0, import_react.useState)(false);
	const [particles, setParticles] = (0, import_react.useState)(() => Array.from({ length: 8 }, () => ({
		px: "0px",
		py: "0px",
		pdur: "600ms",
		pdelay: "0ms",
		pEndScale: .6,
		psize: 1
	})));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: cn("t-like", bursting && "is-bursting", className),
		"data-liked": liked ? "true" : "false",
		"aria-pressed": liked,
		"aria-label": liked ? "Remove from saved" : "Save stay",
		onPointerDown: (e) => e.stopPropagation(),
		onClick: (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (toggleSaved(id) && !prefersReducedMotion()) {
				setParticles(spray());
				setBursting(true);
				window.setTimeout(() => setBursting(false), readMs("--like-particle-dur", 600) + 80);
			}
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "t-like-icon",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
				className: "t-like-heart",
				viewBox: "0 0 24 24",
				"aria-hidden": true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M12 20s-7-4.4-9.2-8.2C1.2 9.2 2.4 6 5.6 6c1.9 0 3.1 1.1 3.9 2.2C10.3 7.1 11.5 6 13.4 6c3.2 0 4.4 3.2 2.8 5.8C14 15.6 12 20 12 20z",
					strokeWidth: "1.7",
					strokeLinejoin: "round"
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "t-like-particles",
			"aria-hidden": true,
			children: particles.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { style: {
				"--px": p.px,
				"--py": p.py,
				"--pdur": p.pdur,
				"--pdelay": p.pdelay,
				"--p-end-scale": p.pEndScale,
				"--psize": p.psize
			} }, i))
		})]
	});
}
function TrustMeter({ score, reviews, compact = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex items-center gap-3", compact && "gap-2"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid size-9 place-items-center rounded-full",
			style: { background: `conic-gradient(var(--color-primary) ${score}%, var(--color-border) 0)` },
			"aria-label": `Trust score ${score}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-7 place-items-center rounded-full bg-elevated text-xs font-semibold tabular-nums text-fg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DigitPop, { value: score })
			})
		}), !compact && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-semibold text-fg",
			children: "Trust Score"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-xs text-muted",
			children: [reviews.toLocaleString("en-IN"), " verified"]
		})] })]
	});
}
//#endregion
export { TrustMeter as n, useSavedIds as r, LikeButton as t };
