import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, d as useRouterState, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as signOut, t as authClient } from "./client-B40BzJxt.mjs";
import { f as Compass, i as UserRound, r as WalletCards, s as Map } from "../_libs/lucide-react.mjs";
import { l as cn } from "./router-BhdpjCnA.mjs";
import { a as WeaveMark, i as TextSwap, n as Button, t as BrandWord } from "./button-DBLqx4RN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shell-ChiWA-mp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function DigitPop({ value, className }) {
	const text = String(value);
	const [animating, setAnimating] = (0, import_react.useState)(false);
	const first = (0, import_react.useRef)(true);
	(0, import_react.useLayoutEffect)(() => {
		setAnimating(false);
		const id = requestAnimationFrame(() => {
			setAnimating(true);
			first.current = false;
		});
		return () => cancelAnimationFrame(id);
	}, [text]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("t-digit-group tabular-nums", animating && "is-animating", className),
		children: text.split("").map((ch, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "t-digit",
			"data-stagger": i === 0 ? void 0 : String(Math.min(i, 8)),
			children: ch === " " ? "\xA0" : ch
		}, `${i}-${ch}-${text}`))
	});
}
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("animate-pulse rounded-md bg-border/70", className),
		...props
	});
}
function AuthSlot() {
	const { user, isPending } = useCurrentUserState();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-9 w-24 rounded-md" });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		asChild: true,
		size: "sm",
		variant: "outline",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/login",
			children: "Sign in"
		})
	});
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/account",
			className: "flex min-h-9 items-center gap-2 rounded-md px-1",
			children: [user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "size-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-fg",
				children: label.charAt(0).toUpperCase()
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "hidden max-w-28 truncate text-sm font-medium md:inline",
				children: label
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			type: "button",
			size: "sm",
			variant: "ghost",
			className: "hidden md:inline-flex",
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
	});
}
var LINKS = [
	{
		to: "/",
		label: "Discover",
		icon: Compass
	},
	{
		to: "/plan",
		label: "Plan",
		icon: Map
	},
	{
		to: "/trips",
		label: "Trips",
		icon: WalletCards
	},
	{
		to: "/account",
		label: "Account",
		icon: UserRound
	}
];
function Shell({ children, bare = false }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	if (bare) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-30 border-b border-border/80 bg-bg/90 backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-14 max-w-6xl items-center justify-between px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeaveMark, { className: "size-8" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandWord, {})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "hidden items-center gap-6 md:flex",
							children: LINKS.slice(0, 3).map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: l.to,
								className: cn("text-sm font-medium text-muted transition-colors duration-150 hover:text-fg", pathname === l.to && "text-fg"),
								children: l.label
							}, l.to))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthSlot, {})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "pb-24 md:pb-0",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "mt-16 hidden border-t border-border py-10 md:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl items-start justify-between px-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WeaveMark, { className: "size-7" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandWord, {})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-sm text-sm text-muted",
						children: "Three honest Puri stays. All-in rupee prices. A Trust Score you can read."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-subtle",
						children: "Puri, Odisha"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-elevated/95 pb-safe backdrop-blur-md md:hidden",
				children: LINKS.map((l) => {
					const Icon = l.icon;
					const active = pathname === l.to;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: l.to,
						className: cn("flex min-h-12 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-medium text-muted", active && "text-primary"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							className: "size-4",
							strokeWidth: 1.75
						}), l.label]
					}, l.to);
				})
			})
		]
	});
}
//#endregion
export { useCurrentUserState as i, Shell as n, Skeleton as r, DigitPop as t };
