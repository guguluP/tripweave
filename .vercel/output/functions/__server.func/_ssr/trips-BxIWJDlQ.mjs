import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as formatMoney, o as getPackage } from "./packages-eAQZmKLU.mjs";
import { r as pushBanner } from "./router-BhdpjCnA.mjs";
import { i as TextSwap, n as Button, r as Stagger } from "./button-DBLqx4RN.mjs";
import { i as useCurrentUserState, n as Shell, r as Skeleton, t as DigitPop } from "./shell-ChiWA-mp.mjs";
import { t as Card } from "./card-CEb94xDN.mjs";
import { i as listBookings, n as cancelBooking, t as RedirectToSignIn } from "./bookings-D4zUrSkL.mjs";
import { t as brandLabel } from "./card-mzLHUKsk.mjs";
import { t as LearnMore } from "./learn-more-D0-t_H9S.mjs";
import { t as Badge } from "./badge-DWv9uPWY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/trips-BxIWJDlQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Trips() {
	const { user, isPending } = useCurrentUserState();
	const [bookings, setBookings] = (0, import_react.useState)(null);
	const [cancelling, setCancelling] = (0, import_react.useState)(null);
	const refresh = () => {
		listBookings().then(setBookings).catch((err) => {
			if ((err instanceof Error ? err.message : "") === "Unauthorized") setBookings([]);
			else setBookings([]);
		});
	};
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		if (!user) {
			setBookings([]);
			return;
		}
		refresh();
	}, [user, isPending]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl px-4 py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-6 h-32 w-full rounded-xl" })]
	}) });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl px-4 py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Stagger, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "eyebrow",
			children: "My trips"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-2 font-display text-4xl",
			children: "Bookings"
		})] }), bookings === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-8 h-32 w-full rounded-xl" }) : bookings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 rounded-xl border border-border bg-elevated p-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted",
				children: "No bookings yet. Find a Puri hotel and pay to hold it."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LearnMore, {
				to: "/plan",
				className: "mt-5 text-sm font-medium text-primary",
				children: "Find my hotel"
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-8 grid gap-4",
			children: bookings.map((b) => {
				const pkg = getPackage(b.packageId);
				const cancelled = b.status === "cancelled";
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "overflow-hidden shadow-none",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid sm:grid-cols-[9rem_1fr]",
						children: [pkg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: pkg.image,
							alt: "",
							className: "h-36 w-full object-cover sm:h-full"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bg-surface" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3 p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-display text-xl",
										children: b.packageName
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-sm text-muted",
										children: [
											"Check-in ",
											b.checkIn,
											" · ",
											b.travelers,
											" traveler",
											b.travelers === 1 ? "" : "s"
										]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										className: cancelled ? "text-danger" : "text-ok",
										children: cancelled ? "Cancelled" : "Paid"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium tabular-nums",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DigitPop, { value: formatMoney(b.amountInr) })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted",
										children: [
											" ",
											"· ",
											b.confirmationCode,
											b.cardLast4 ? ` · ${brandLabel(b.cardBrand ?? "card")} ${b.cardLast4}` : ""
										]
									})]
								}),
								!cancelled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									disabled: cancelling === b.id,
									onClick: async () => {
										setCancelling(b.id);
										try {
											await cancelBooking({ data: b.id });
											pushBanner({
												title: "Stay cancelled",
												body: b.packageName,
												tone: "info"
											});
											refresh();
										} catch {
											pushBanner({
												title: "Could not cancel",
												tone: "danger"
											});
										} finally {
											setCancelling(null);
										}
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextSwap, {
										text: cancelling === b.id ? "Cancelling" : "Cancel stay",
										shimmer: cancelling === b.id
									})
								}) }) : null
							]
						})]
					})
				}, b.id);
			})
		})]
	}) });
}
//#endregion
export { Trips as component };
