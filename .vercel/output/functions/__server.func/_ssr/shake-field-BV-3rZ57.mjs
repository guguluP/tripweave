import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as reflow, l as cn } from "./router-BhdpjCnA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shake-field-BV-3rZ57.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ShakeField({ label, error, shakeKey = 0, className, id, ...inputProps }) {
	const boxRef = (0, import_react.useRef)(null);
	const [shaking, setShaking] = (0, import_react.useState)(false);
	const isError = Boolean(error);
	(0, import_react.useLayoutEffect)(() => {
		if (!isError) {
			setShaking(false);
			return;
		}
		setShaking(false);
		const el = boxRef.current;
		if (el) reflow(el);
		setShaking(true);
	}, [
		isError,
		error,
		shakeKey
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: cn("grid gap-1.5 text-sm font-medium text-fg", className),
		children: [label ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("t-input-wrap", isError && "is-error"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: boxRef,
				className: cn("t-input", isError && "is-error", shaking && "is-shaking"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id,
					"aria-invalid": isError,
					...inputProps
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "t-error-msg",
				children: error || "Please check this field."
			})]
		})]
	});
}
//#endregion
export { ShakeField as t };
