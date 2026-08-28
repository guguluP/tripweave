import { S as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as cn } from "./router-BhdpjCnA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/learn-more-D0-t_H9S.js
var import_jsx_runtime = require_jsx_runtime();
function Chevron() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "t-learn-chevron",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 16 16",
			fill: "none",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				className: "t-learn-arm t-learn-arm-top",
				d: "M6 4L10 8",
				stroke: "currentColor",
				strokeWidth: "1.75",
				strokeLinecap: "round"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				className: "t-learn-arm t-learn-arm-bot",
				d: "M10 8L6 12",
				stroke: "currentColor",
				strokeWidth: "1.75",
				strokeLinecap: "round"
			})]
		})
	});
}
function LearnMore({ children, className, to, href, onClick, as }) {
	const cls = cn("t-learn", className);
	const inner = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chevron, {})] });
	if (to) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to,
		className: cls,
		children: inner
	});
	if (href) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		href,
		className: cls,
		children: inner
	});
	if (as === "span") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cls,
		children: inner
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: cls,
		onClick,
		children: inner
	});
}
//#endregion
export { LearnMore as t };
