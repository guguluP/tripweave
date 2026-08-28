import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as cn } from "./router-BhdpjCnA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tabs-C65B7Yfw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SlidingTabs({ tabs, value, onChange, fullWidth = false, className }) {
	const barRef = (0, import_react.useRef)(null);
	const pillRef = (0, import_react.useRef)(null);
	const btnRefs = (0, import_react.useRef)({});
	const skipAnim = (0, import_react.useRef)(true);
	const valueRef = (0, import_react.useRef)(value);
	valueRef.current = value;
	const snap = (animate) => {
		const pill = pillRef.current;
		const tab = btnRefs.current[valueRef.current];
		if (!pill || !tab) return;
		if (!animate) pill.style.transition = "none";
		pill.style.transform = `translateX(${tab.offsetLeft}px)`;
		pill.style.width = `${tab.offsetWidth}px`;
		if (!animate) {
			pill.offsetWidth;
			pill.style.transition = "";
		}
	};
	(0, import_react.useLayoutEffect)(() => {
		snap(skipAnim.current ? false : true);
		skipAnim.current = false;
	}, [
		value,
		tabs.length,
		fullWidth
	]);
	(0, import_react.useLayoutEffect)(() => {
		const bar = barRef.current;
		const onResize = () => snap(false);
		onResize();
		const ro = typeof ResizeObserver !== "undefined" && bar ? new ResizeObserver(onResize) : null;
		if (bar && ro) ro.observe(bar);
		window.addEventListener("resize", onResize);
		return () => {
			ro?.disconnect();
			window.removeEventListener("resize", onResize);
		};
	}, [tabs.length, fullWidth]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: barRef,
		className: cn("t-tabs", fullWidth && "tw-full", className),
		role: "tablist",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			ref: pillRef,
			className: "t-tabs-pill",
			"aria-hidden": "true"
		}), tabs.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			ref: (el) => {
				btnRefs.current[tab.id] = el;
			},
			type: "button",
			role: "tab",
			className: "t-tab",
			"aria-selected": value === tab.id,
			onClick: () => onChange(tab.id),
			children: tab.label
		}, tab.id))]
	});
}
//#endregion
export { SlidingTabs as t };
