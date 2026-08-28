import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { a as prefersReducedMotion, l as cn, s as readMs } from "./router-BhdpjCnA.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/button-DBLqx4RN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Stagger({ children, className, shown = true }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		if (!shown) {
			el.classList.remove("is-shown");
			return;
		}
		const play = () => el.classList.add("is-shown");
		if (prefersReducedMotion()) {
			play();
			return;
		}
		const rect = el.getBoundingClientRect();
		if (rect.top < window.innerHeight * .92 && rect.bottom > 0) {
			const id = requestAnimationFrame(play);
			return () => cancelAnimationFrame(id);
		}
		const io = new IntersectionObserver(([entry]) => {
			if (entry?.isIntersecting) {
				play();
				io.disconnect();
			}
		}, { threshold: .12 });
		io.observe(el);
		return () => io.disconnect();
	}, [shown]);
	const lines = import_react.Children.toArray(children);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: cn("t-stagger", !shown && "is-hiding", className),
		children: lines.map((child, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `t-stagger-line t-stagger-line--${i + 1}`,
			children: child
		}, i))
	});
}
function TextSwap({ text, className, shimmer = false }) {
	const ref = (0, import_react.useRef)(null);
	const [display, setDisplay] = (0, import_react.useState)(text);
	const [phase, setPhase] = (0, import_react.useState)("idle");
	(0, import_react.useEffect)(() => {
		if (text === display) return;
		if (prefersReducedMotion()) {
			setDisplay(text);
			setPhase("idle");
			return;
		}
		setPhase("exit");
		const dur = readMs("--text-swap-dur", 150);
		const id = window.setTimeout(() => {
			setDisplay(text);
			setPhase("preenter");
		}, dur);
		return () => window.clearTimeout(id);
	}, [text, display]);
	(0, import_react.useLayoutEffect)(() => {
		if (phase !== "preenter") return;
		const el = ref.current;
		if (el) el.offsetWidth;
		setPhase("idle");
	}, [phase]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		ref,
		className: cn("t-text-swap", shimmer && "t-shimmer", phase === "exit" && "is-exit", phase === "preenter" && "is-enter-start", className),
		"data-text": shimmer ? display : void 0,
		children: display
	});
}
function WeaveMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		className: cn("size-8", className),
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "32",
				height: "32",
				rx: "8",
				className: "fill-primary"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 22V10h4.2c2.6 0 4.2 1.4 4.2 3.5 0 1.2-.6 2.2-1.6 2.8 1.3.5 2.1 1.7 2.1 3.2 0 2.3-1.7 3.5-4.5 3.5H8zm3.1-7.2h1.2c1.1 0 1.7-.5 1.7-1.4s-.6-1.4-1.7-1.4h-1.2v2.8zm0 5.2h1.5c1.2 0 1.9-.5 1.9-1.5s-.7-1.5-1.9-1.5h-1.5v3z",
				className: "fill-primary-fg"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M18.2 10h2.8l3.9 12h-3.1l-.6-2H19l-.6 2h-3.1l3.9-12zm.9 7.4h2.7l-1.3-4.4-1.4 4.4z",
				className: "fill-primary-fg"
			})
		]
	});
}
function BrandWord({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("font-display text-lg font-semibold tracking-tight", className),
		children: "TripWeave"
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-[color,background-color,border-color,transform,box-shadow] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40", {
	variants: {
		variant: {
			default: "bg-primary text-primary-fg hover:bg-primary/90",
			outline: "border border-border bg-elevated text-fg hover:bg-surface",
			ghost: "text-fg hover:bg-surface",
			danger: "bg-danger text-primary-fg hover:bg-danger/90"
		},
		size: {
			default: "min-h-11 px-4",
			sm: "min-h-9 px-3 text-sm",
			lg: "min-h-12 px-5",
			icon: "size-11 p-0"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
//#endregion
export { WeaveMark as a, TextSwap as i, Button as n, Stagger as r, BrandWord as t };
