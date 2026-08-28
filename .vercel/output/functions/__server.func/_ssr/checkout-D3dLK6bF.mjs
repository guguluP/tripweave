import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as formatMoney, d as priceWithSwaps, i as clearPending, l as loadPending, o as getPackage } from "./packages-eAQZmKLU.mjs";
import { l as Lock } from "../_libs/lucide-react.mjs";
import { l as cn, r as pushBanner } from "./router-BhdpjCnA.mjs";
import { i as TextSwap, n as Button, r as Stagger } from "./button-DBLqx4RN.mjs";
import { i as useCurrentUserState, n as Shell, r as Skeleton, t as DigitPop } from "./shell-ChiWA-mp.mjs";
import { t as Card } from "./card-CEb94xDN.mjs";
import { r as createBooking, t as RedirectToSignIn } from "./bookings-D4zUrSkL.mjs";
import { a as expiryValid, i as digitsOnly, n as cardBrand, o as formatCardNumber, r as cvcValid, s as luhnValid, t as brandLabel } from "./card-mzLHUKsk.mjs";
import { t as ShakeField } from "./shake-field-BV-3rZ57.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/checkout-D3dLK6bF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SuccessCheck({ active = true, className }) {
	const pathRef = (0, import_react.useRef)(null);
	const [state, setState] = (0, import_react.useState)("out");
	(0, import_react.useLayoutEffect)(() => {
		const path = pathRef.current;
		if (path) {
			const len = path.getTotalLength();
			path.style.strokeDasharray = String(len);
			path.style.strokeDashoffset = String(len);
		}
		if (!active) {
			setState("out");
			return;
		}
		const id = requestAnimationFrame(() => setState("in"));
		return () => cancelAnimationFrame(id);
	}, [active]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("t-success-check", className),
		"data-state": state,
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			viewBox: "0 0 48 48",
			fill: "none",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				ref: pathRef,
				d: "M12 24.5L20.5 33L36 15",
				stroke: "currentColor",
				strokeWidth: "3.5",
				strokeLinecap: "round",
				strokeLinejoin: "round"
			})
		})
	});
}
function tomorrowIso() {
	const d = /* @__PURE__ */ new Date();
	d.setDate(d.getDate() + 1);
	return d.toISOString().slice(0, 10);
}
function Checkout() {
	const { user, isPending } = useCurrentUserState();
	const [ready, setReady] = (0, import_react.useState)(false);
	const [packageId, setPackageId] = (0, import_react.useState)(null);
	const [swaps, setSwaps] = (0, import_react.useState)({});
	const [travelers, setTravelers] = (0, import_react.useState)(2);
	const [checkIn, setCheckIn] = (0, import_react.useState)(tomorrowIso);
	const [payerName, setPayerName] = (0, import_react.useState)("");
	const [cardNumber, setCardNumber] = (0, import_react.useState)("");
	const [expiry, setExpiry] = (0, import_react.useState)("");
	const [cvc, setCvc] = (0, import_react.useState)("");
	const [errors, setErrors] = (0, import_react.useState)({});
	const [shakeKey, setShakeKey] = (0, import_react.useState)(0);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [confirmation, setConfirmation] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const pending = loadPending();
		setPackageId(pending?.packageId ?? null);
		setSwaps(pending?.swaps ?? {});
		setReady(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (user?.displayName && !payerName) setPayerName(user.displayName);
	}, [user, payerName]);
	const pkg = packageId ? getPackage(packageId) : void 0;
	const perPerson = pkg ? priceWithSwaps(pkg, swaps) : 0;
	const total = perPerson * travelers;
	const brand = cardBrand(cardNumber);
	if (isPending || !ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl px-4 py-16",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-48" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-8 h-80 w-full rounded-xl" })]
	}) });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (!pkg) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-lg px-4 py-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: "Nothing to check out"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-muted",
				children: "Pick a stay first, then come back to pay."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/plan",
					children: "Find a hotel"
				})
			})
		]
	}) });
	if (confirmation) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuccessCheck, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-6 font-display text-4xl",
				children: "Stay held"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-muted",
				children: [confirmation.name, " is booked. Your confirmation code is"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 font-display text-3xl tabular-nums tracking-wide",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DigitPop, { value: confirmation.code })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted",
				children: [
					"Charged ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DigitPop, { value: formatMoney(confirmation.amount) }),
					" in the sandbox."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				size: "lg",
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/trips",
					children: "View trips"
				})
			})
		]
	}) });
	const onPay = async (e) => {
		e.preventDefault();
		const next = {};
		if (payerName.trim().length < 2) next.payerName = "Name on the card, please.";
		if (!luhnValid(cardNumber)) next.cardNumber = "That card number doesn’t check out.";
		if (!expiryValid(expiry)) next.expiry = "Use a future MM / YY.";
		if (!cvcValid(cvc, brand)) next.cvc = "Check the CVC.";
		if (Object.keys(next).length) {
			setErrors(next);
			setShakeKey((k) => k + 1);
			return;
		}
		setErrors({});
		setBusy(true);
		try {
			const booking = await createBooking({ data: {
				packageId: pkg.id,
				swaps,
				travelers,
				checkIn,
				payerName: payerName.trim(),
				cardNumber: digitsOnly(cardNumber),
				expiry,
				cvc: digitsOnly(cvc)
			} });
			clearPending();
			pushBanner({
				title: `Booked · ${booking.confirmationCode}`,
				body: pkg.name,
				tone: "ok"
			});
			setConfirmation({
				code: booking.confirmationCode,
				amount: booking.amountInr,
				name: pkg.name
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "Payment failed";
			if (message === "Unauthorized") {
				window.location.assign("/login");
				return;
			}
			setErrors({ cardNumber: message });
			setShakeKey((k) => k + 1);
			pushBanner({
				title: "Payment didn’t go through",
				body: message,
				tone: "danger"
			});
			setBusy(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Stagger, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "eyebrow",
				children: "Checkout"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl",
				children: "Pay and hold this stay"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 flex items-center gap-2 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-3.5" }), "Sandbox checkout — no live charge. Try 4242 4242 4242 4242."]
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-8 grid gap-4",
			noValidate: true,
			onSubmit: onPay,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShakeField, {
						label: "Check-in",
						type: "date",
						value: checkIn,
						min: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
						onChange: (e) => setCheckIn(e.target.value)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShakeField, {
						label: "Travelers",
						type: "number",
						min: 1,
						max: 8,
						value: travelers,
						onChange: (e) => setTravelers(Math.min(8, Math.max(1, Number(e.target.value) || 1)))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShakeField, {
					label: "Name on card",
					value: payerName,
					error: errors.payerName,
					shakeKey,
					autoComplete: "cc-name",
					onChange: (e) => {
						setPayerName(e.target.value);
						setErrors((er) => ({
							...er,
							payerName: ""
						}));
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShakeField, {
					label: "Card number",
					inputMode: "numeric",
					autoComplete: "cc-number",
					placeholder: "4242 4242 4242 4242",
					value: cardNumber,
					error: errors.cardNumber,
					shakeKey,
					onChange: (e) => {
						setCardNumber(formatCardNumber(e.target.value));
						setErrors((er) => ({
							...er,
							cardNumber: ""
						}));
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShakeField, {
						label: "Expiry",
						placeholder: "MM / YY",
						autoComplete: "cc-exp",
						value: expiry,
						error: errors.expiry,
						shakeKey,
						onChange: (e) => {
							const d = digitsOnly(e.target.value).slice(0, 4);
							setExpiry(d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d);
							setErrors((er) => ({
								...er,
								expiry: ""
							}));
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShakeField, {
						label: "CVC",
						inputMode: "numeric",
						autoComplete: "cc-csc",
						value: cvc,
						error: errors.cvc,
						shakeKey,
						onChange: (e) => {
							setCvc(digitsOnly(e.target.value).slice(0, 4));
							setErrors((er) => ({
								...er,
								cvc: ""
							}));
						}
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					size: "lg",
					disabled: busy,
					className: "mt-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextSwap, {
						shimmer: busy,
						text: busy ? "Processing" : `Pay ${formatMoney(total)}`
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-subtle",
					children: "We store only the last four digits and brand. The full number is never saved."
				})
			]
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "h-fit overflow-hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: pkg.image,
				alt: "",
				className: "h-40 w-full object-cover"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-xl",
						children: pkg.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							pkg.nights,
							" nights · ",
							pkg.neighborhood
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-5 grid gap-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "Per person"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "tabular-nums",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DigitPop, { value: formatMoney(perPerson) })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "Travelers"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "tabular-nums",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DigitPop, { value: travelers })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between border-t border-border pt-2 font-medium",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "tabular-nums",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DigitPop, { value: formatMoney(total) })
								})]
							})
						]
					}),
					digitsOnly(cardNumber).length >= 4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 text-xs text-muted",
						children: [
							brandLabel(brand),
							" · ",
							digitsOnly(cardNumber).slice(-4)
						]
					}) : null
				]
			})]
		})]
	}) });
}
//#endregion
export { Checkout as component };
