import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as PACKAGES, r as RANK_LABELS, s as loadBrief, t as DEFAULT_BRIEF, u as matchPackages } from "./packages-eAQZmKLU.mjs";
import { t as X } from "../_libs/lucide-react.mjs";
import { a as prefersReducedMotion, i as bezierEasing, l as cn, o as readCssNumber, s as readMs } from "./router-BhdpjCnA.mjs";
import { r as Stagger } from "./button-DBLqx4RN.mjs";
import { n as Shell, r as Skeleton } from "./shell-ChiWA-mp.mjs";
import { t as SlidingTabs } from "./tabs-C65B7Yfw.mjs";
import { t as LearnMore } from "./learn-more-D0-t_H9S.mjs";
import { r as useSavedIds } from "./trust-meter-DH6J_B2g.mjs";
import { t as PackageCard } from "./package-card-BioIkRdf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/matches-B6ot5axZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Shimmer({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("t-shimmer", className),
		"data-text": children,
		children
	});
}
function measureWords(text, font, originX) {
	const ctx = document.createElement("canvas").getContext("2d");
	if (!ctx) return [];
	ctx.font = font;
	const parts = text.split(/(\s+)/);
	let x = originX;
	const out = [];
	for (const part of parts) {
		const w = ctx.measureText(part).width;
		if (part.trim()) out.push({
			center: x + w / 2,
			width: w
		});
		x += w;
	}
	return out;
}
function ClearInput({ value, onValueChange, placeholder = "Search", className, ...inputProps }) {
	const wrapRef = (0, import_react.useRef)(null);
	const mirrorRef = (0, import_react.useRef)(null);
	const phRef = (0, import_react.useRef)(null);
	const glowRef = (0, import_react.useRef)(null);
	const [clearing, setClearing] = (0, import_react.useState)(false);
	const [mirror, setMirror] = (0, import_react.useState)(value);
	(0, import_react.useEffect)(() => {
		if (!clearing) setMirror(value);
	}, [value, clearing]);
	const runClear = () => {
		if (!value || clearing) return;
		setMirror(value);
		if (prefersReducedMotion()) {
			onValueChange("");
			return;
		}
		const wrap = wrapRef.current;
		const mirrorEl = mirrorRef.current;
		const ph = phRef.current;
		const glow = glowRef.current;
		if (!wrap || !mirrorEl || !ph || !glow) {
			onValueChange("");
			return;
		}
		const dur = readMs("--clear-dur", 1e3);
		const outDur = readMs("--clear-out-dur", 400);
		const inDur = readMs("--clear-in-dur", 400);
		const outFly = readCssNumber("--clear-out-fly", 12);
		const inFly = readCssNumber("--clear-in-fly", 12);
		const blur = readCssNumber("--clear-blur", 2);
		const glowDelay = readMs("--glow-delay", 50);
		const glowPeakAt = readCssNumber("--glow-peak-at", .15);
		const glowOpacity = readCssNumber("--glow-opacity", .85);
		const glowSpread = readCssNumber("--glow-spread", 1.5);
		const ease = bezierEasing(.22, 1, .36, 1);
		const font = getComputedStyle(mirrorEl).font;
		const words = measureWords(value, font, 12);
		setClearing(true);
		onValueChange("");
		ph.style.opacity = "0";
		ph.style.transform = `translateY(${inFly}px)`;
		ph.style.filter = `blur(${blur}px)`;
		const start = performance.now();
		const tick = (now) => {
			const elapsed = now - start;
			const t = Math.min(1, elapsed / dur);
			const outT = ease(Math.min(1, elapsed / outDur));
			const inT = ease(Math.min(1, Math.max(0, (elapsed - 70) / inDur)));
			mirrorEl.style.transform = `translateY(${-outFly * outT}px)`;
			mirrorEl.style.opacity = String(1 - outT);
			mirrorEl.style.filter = `blur(${blur * outT}px)`;
			ph.style.transform = `translateY(${inFly * (1 - inT)}px)`;
			ph.style.opacity = String(inT);
			ph.style.filter = `blur(${blur * (1 - inT)}px)`;
			const gT = (elapsed - glowDelay) / Math.max(1, dur - glowDelay);
			let gAlpha = 0;
			if (gT > 0 && gT < 1) gAlpha = gT < glowPeakAt ? gT / glowPeakAt * glowOpacity : (1 - (gT - glowPeakAt) / (1 - glowPeakAt)) * glowOpacity;
			glow.style.opacity = String(Math.max(0, gAlpha));
			glow.style.background = words.map((w) => {
				const r = Math.max(14, w.width * glowSpread);
				return `radial-gradient(${r}px ${r * .55}px at ${w.center}px 50%, rgba(26,23,20,0.55) 0%, transparent 72%)`;
			}).join(",");
			if (t < 1) {
				requestAnimationFrame(tick);
				return;
			}
			mirrorEl.style.transform = "";
			mirrorEl.style.opacity = "";
			mirrorEl.style.filter = "";
			ph.style.transform = "";
			ph.style.opacity = "";
			ph.style.filter = "";
			glow.style.opacity = "0";
			glow.style.background = "";
			setClearing(false);
		};
		requestAnimationFrame(tick);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: wrapRef,
		className: cn("t-clear", Boolean(value) && !clearing && "has-value", clearing && "is-clearing", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				...inputProps,
				value,
				placeholder: "",
				"aria-label": inputProps["aria-label"] ?? placeholder,
				onChange: (e) => {
					if (clearing) return;
					onValueChange(e.target.value);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: mirrorRef,
				className: "t-clear-mirror",
				"aria-hidden": true,
				children: clearing ? mirror : value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: phRef,
				className: "t-clear-placeholder",
				"aria-hidden": true,
				children: placeholder
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: glowRef,
				className: "t-clear-glow",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "t-clear-btn",
				"aria-label": "Clear",
				onClick: runClear,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
			})
		]
	});
}
function Matches() {
	const [ready, setReady] = (0, import_react.useState)(false);
	const [brief, setBrief] = (0, import_react.useState)(DEFAULT_BRIEF);
	const [matches, setMatches] = (0, import_react.useState)([]);
	const [tab, setTab] = (0, import_react.useState)("matches");
	const [query, setQuery] = (0, import_react.useState)("");
	const savedIds = useSavedIds();
	(0, import_react.useEffect)(() => {
		const b = loadBrief();
		setBrief(b);
		setMatches(matchPackages(b));
		setReady(true);
	}, []);
	const list = (0, import_react.useMemo)(() => {
		let src = tab === "all" ? PACKAGES : tab === "saved" ? PACKAGES.filter((p) => savedIds.includes(p.id)) : matches;
		const q = query.trim().toLowerCase();
		if (q) src = src.filter((p) => p.name.toLowerCase().includes(q) || p.neighborhood.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q));
		return src;
	}, [
		tab,
		query,
		matches,
		savedIds
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-6xl px-4 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Stagger, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "eyebrow",
					children: "Matches"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-4xl",
					children: "Your three in Puri"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 max-w-xl text-muted",
					children: [
						"Ranked to a ",
						brief.nights,
						"-night ",
						brief.style,
						" trip, ",
						brief.budget,
						" budget, ",
						brief.vibe,
						" ",
						"vibe",
						brief.flexible ? ", with flexible dates" : "",
						". All-in prices in rupees."
					]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidingTabs, {
					tabs: [
						{
							id: "matches",
							label: "Matches"
						},
						{
							id: "saved",
							label: "Saved"
						},
						{
							id: "all",
							label: "All stays"
						}
					],
					value: tab,
					onChange: setTab
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-full sm:max-w-xs",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClearInput, {
						value: query,
						onValueChange: setQuery,
						placeholder: "Search hotels"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid gap-5 md:grid-cols-3",
				children: !ready ? [
					0,
					1,
					2
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-80 rounded-xl" }, i)) : list.map((pkg, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackageCard, {
					pkg,
					rank: tab === "matches" && !query ? RANK_LABELS[i] : void 0
				}, pkg.id))
			}),
			ready && list.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-muted",
				children: tab === "saved" ? "No saved stays yet — tap the heart on a hotel." : query ? "Nothing matches that search." : "No strong matches — try adjusting your brief."
			}) : null,
			!ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shimmer, { children: "Matching your brief" })
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LearnMore, {
				to: "/plan",
				className: "mt-8 text-sm font-medium text-primary",
				children: "Edit brief"
			})
		]
	}) });
}
//#endregion
export { Matches as component };
