import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as signOut } from "./client-B40BzJxt.mjs";
import { a as formatMoney } from "./packages-eAQZmKLU.mjs";
import { i as TextSwap, n as Button, r as Stagger } from "./button-DBLqx4RN.mjs";
import { i as useCurrentUserState, n as Shell, r as Skeleton, t as DigitPop } from "./shell-ChiWA-mp.mjs";
import { t as MotionToggle } from "./toggle-DGMT1fL4.mjs";
import { t as Card } from "./card-CEb94xDN.mjs";
import { i as listBookings, t as RedirectToSignIn } from "./bookings-D4zUrSkL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/account-Cz_vJWE_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Account() {
	const { user, isPending } = useCurrentUserState();
	const [bookings, setBookings] = (0, import_react.useState)(null);
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const [showCancelled, setShowCancelled] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (isPending || !user) return;
		listBookings().then(setBookings).catch(() => setBookings([]));
	}, [user, isPending]);
	const paid = (0, import_react.useMemo)(() => (bookings ?? []).filter((b) => b.status === "paid"), [bookings]);
	const cancelled = (0, import_react.useMemo)(() => (bookings ?? []).filter((b) => b.status === "cancelled"), [bookings]);
	const spent = paid.reduce((sum, b) => sum + b.amountInr, 0);
	const visible = showCancelled ? cancelled : paid;
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto max-w-lg px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full rounded-xl" })
	}) });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	const label = user.displayName ?? user.primaryEmail ?? "Guest";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-lg px-4 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stagger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "eyebrow",
				children: "Account"
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-center gap-4",
				children: [user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: user.profileImageUrl,
					alt: "",
					className: "size-16 rounded-full object-cover"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-16 place-items-center rounded-full bg-primary font-display text-2xl text-primary-fg",
					children: label.charAt(0).toUpperCase()
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl",
					children: label
				}), user.primaryEmail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: user.primaryEmail
				}) : null] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "p-4 shadow-none",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Paid stays"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-display text-2xl tabular-nums",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DigitPop, { value: paid.length })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "p-4 shadow-none",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Spent"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-display text-2xl tabular-nums",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DigitPop, { value: formatMoney(spent) })
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex items-center justify-between gap-4 rounded-lg border border-border bg-elevated px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: "Show cancelled"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "List stays you released instead of paid ones."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MotionToggle, {
					on: showCancelled,
					onChange: setShowCancelled,
					label: "Show cancelled stays"
				})]
			}),
			visible.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 grid gap-2",
				children: visible.slice(0, 4).map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate",
						children: b.packageName
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums text-muted",
						children: formatMoney(b.amountInr)
					})]
				}, b.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-sm text-muted",
				children: showCancelled ? "No cancelled stays." : "No paid stays yet."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-wrap gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/trips",
						children: "View bookings"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "outline",
					disabled: signingOut,
					onClick: () => {
						setSigningOut(true);
						signOut().catch(() => setSigningOut(false));
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextSwap, {
						text: signingOut ? "Signing out" : "Sign out",
						shimmer: signingOut
					})
				})]
			})
		]
	}) });
}
//#endregion
export { Account as component };
