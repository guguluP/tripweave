import "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, y as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as createServerFn } from "./ssr.mjs";
import { I as record, L as string, N as number, P as object } from "../_libs/@better-auth/core+[...].mjs";
import { u as createSsrRpc } from "./router-BhdpjCnA.mjs";
import { t as authMiddleware } from "./middleware-BcauzdWh.mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
var listBookings = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("a884b014a3ee092e4f0fe9bdf1808981d1d1cc6b0c69d0c40acadcf6acaf3bb6"));
var createInput = object({
	packageId: string().min(1),
	swaps: record(string(), string()),
	travelers: number().int().min(1).max(8),
	checkIn: string().regex(/^\d{4}-\d{2}-\d{2}$/),
	payerName: string().trim().min(2).max(80),
	cardNumber: string(),
	expiry: string(),
	cvc: string()
});
var createBooking = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => createInput.parse(input)).handler(createSsrRpc("d2017fb40500149d6ef5a5d13ff9979d85dc47c87b63e8860c7777c112319b6e"));
var cancelBooking = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("498fe86bbffb7f04dea2bf9fbe8305cc75b23455f34b910929983d511e4bf9aa"));
//#endregion
export { listBookings as i, cancelBooking as n, createBooking as r, RedirectToSignIn as t };
