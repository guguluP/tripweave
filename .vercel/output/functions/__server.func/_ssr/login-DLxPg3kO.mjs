import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, b as useNavigate, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as signIn, t as authClient } from "./client-B40BzJxt.mjs";
import { c as loadNext } from "./packages-eAQZmKLU.mjs";
import { t as GROK_PROVIDERS } from "./server-xsh0Ao4J.mjs";
import { a as WeaveMark, i as TextSwap, n as Button, r as Stagger, t as BrandWord } from "./button-DBLqx4RN.mjs";
import { t as ShakeField } from "./shake-field-BV-3rZ57.mjs";
import { t as SlidingTabs } from "./tabs-C65B7Yfw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-DLxPg3kO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const nav = useNavigate();
	const [mode, setMode] = (0, import_react.useState)("in");
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [errors, setErrors] = (0, import_react.useState)({});
	const [shakeKey, setShakeKey] = (0, import_react.useState)(0);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const destination = () => loadNext();
	const finish = async () => {
		try {
			await authClient.getSession();
		} catch {}
		const next = destination();
		if (next.startsWith("/")) {
			window.location.assign(next);
			return;
		}
		nav({ to: "/" });
	};
	const onEmail = async (e) => {
		e.preventDefault();
		const next = {};
		if (mode === "up" && !name.trim()) next.name = "Please enter your name.";
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Please enter a valid email.";
		if (password.length < 8) next.password = "Use at least 8 characters.";
		if (Object.keys(next).length) {
			setErrors(next);
			setShakeKey((k) => k + 1);
			return;
		}
		setErrors({});
		setBusy(true);
		try {
			if (mode === "up") {
				const { error: err } = await authClient.signUp.email({
					email,
					password,
					name: name.trim() || email.split("@")[0] || "Guest"
				});
				if (err) throw new Error(err.message ?? "Could not create account");
			} else {
				const { error: err } = await authClient.signIn.email({
					email,
					password
				});
				if (err) throw new Error(err.message ?? "Could not sign in");
			}
			await finish();
		} catch (err) {
			setErrors({ password: err instanceof Error ? err.message : "Something went wrong" });
			setShakeKey((k) => k + 1);
			setBusy(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid min-h-dvh bg-bg lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative hidden overflow-hidden lg:block",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=80",
					alt: "Konark stone carving",
					className: "h-full w-full object-cover"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-fg/50" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-x-0 bottom-0 p-10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Stagger, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-3xl text-primary-fg",
						children: "Hold a Puri stay without the noise."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-sm text-sm text-primary-fg/80",
						children: "Sign in to pay, keep bookings, and pick up a brief on any device."
					})] })
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center justify-center px-4 py-12",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeaveMark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandWord, {})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-8 font-display text-3xl",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextSwap, { text: mode === "in" ? "Welcome back" : "Create your account" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextSwap, { text: mode === "in" ? "Sign in to book and see your trips." : "A TripWeave account keeps your paid stays." })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidingTabs, {
							fullWidth: true,
							tabs: [{
								id: "in",
								label: "Sign in"
							}, {
								id: "up",
								label: "Sign up"
							}],
							value: mode,
							onChange: (id) => {
								setMode(id);
								setErrors({});
							}
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "mt-6 grid gap-3",
							noValidate: true,
							onSubmit: onEmail,
							children: [
								mode === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShakeField, {
									label: "Name",
									value: name,
									error: errors.name,
									shakeKey,
									onChange: (e) => {
										setName(e.target.value);
										setErrors((er) => ({
											...er,
											name: void 0
										}));
									},
									autoComplete: "name"
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShakeField, {
									label: "Email",
									type: "email",
									value: email,
									error: errors.email,
									shakeKey,
									onChange: (e) => {
										setEmail(e.target.value);
										setErrors((er) => ({
											...er,
											email: void 0
										}));
									},
									autoComplete: "email"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShakeField, {
									label: "Password",
									type: "password",
									value: password,
									error: errors.password,
									shakeKey,
									onChange: (e) => {
										setPassword(e.target.value);
										setErrors((er) => ({
											...er,
											password: void 0
										}));
									},
									autoComplete: mode === "up" ? "new-password" : "current-password",
									minLength: 8
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									disabled: busy,
									className: "mt-1 w-full",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextSwap, {
										shimmer: busy,
										text: busy ? "Please wait" : mode === "in" ? "Sign in" : "Create account"
									})
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative my-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px bg-border" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "absolute inset-x-0 -top-2.5 text-center text-xs text-subtle",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "bg-bg px-2",
									children: "or continue with"
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid gap-2",
							children: GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "outline",
								className: "w-full",
								onClick: () => signIn(p.providerId, { callbackURL: destination() }),
								children: ["Continue with ", p.label]
							}, p.providerId))
						})
					] })
				]
			})
		})]
	});
}
//#endregion
export { Login as component };
