import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as cn } from "./router-BhdpjCnA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/toggle-DGMT1fL4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function MotionToggle({ on, onChange, label, className }) {
	const [inited, setInited] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		role: "switch",
		"aria-checked": on,
		"aria-label": label,
		"data-on": on ? "true" : "false",
		className: cn("t-toggle", inited && "is-init", className),
		onClick: () => {
			setInited(true);
			onChange(!on);
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "t-toggle-thumb" })
	});
}
//#endregion
export { MotionToggle as t };
