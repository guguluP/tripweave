import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, _ as createRootRoute, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, x as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn, s as __exportAll } from "./ssr.mjs";
import { L as string, N as number, P as object, R as union, j as literal } from "../_libs/@better-auth/core+[...].mjs";
import { n as auth } from "./server-xsh0Ao4J.mjs";
import { a as TriangleAlert, d as Info, m as CircleAlert, p as CircleCheck, t as X } from "../_libs/lucide-react.mjs";
import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BhdpjCnA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: error.message || "An unexpected error occurred. Try reloading the page."
			})
		]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function prefersReducedMotion() {
	return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function reflow(el) {
	el.offsetWidth;
}
function readMs(name, fallback) {
	if (typeof window === "undefined") return fallback;
	const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	if (!raw) return fallback;
	if (raw.endsWith("ms")) return parseFloat(raw) || fallback;
	if (raw.endsWith("s")) return (parseFloat(raw) || 0) * 1e3 || fallback;
	const n = parseFloat(raw);
	return Number.isFinite(n) ? n : fallback;
}
function readCssNumber(name, fallback) {
	if (typeof window === "undefined") return fallback;
	const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	const n = parseFloat(raw);
	return Number.isFinite(n) ? n : fallback;
}
/** Unit-bezier solver for CSS cubic-bezier(x1, y1, x2, y2). */
function bezierEasing(x1, y1, x2, y2) {
	return (t) => {
		if (t <= 0) return 0;
		if (t >= 1) return 1;
		let x = t;
		for (let i = 0; i < 8; i++) {
			const cx = 3 * x1;
			const bx = 3 * (x2 - x1) - cx;
			const ax = 1 - cx - bx;
			const dx = ((ax * x + bx) * x + cx) * x - t;
			if (Math.abs(dx) < 1e-6) break;
			const d = (3 * ax * x + 2 * bx) * x + cx;
			if (Math.abs(d) < 1e-6) break;
			x -= dx / d;
			x = Math.max(0, Math.min(1, x));
		}
		const cy = 3 * y1;
		const by = 3 * (y2 - y1) - cy;
		return (((1 - cy - by) * x + by) * x + cy) * x;
	};
}
var items = [];
var listeners = /* @__PURE__ */ new Set();
function emit() {
	listeners.forEach((l) => l());
}
function getBanners() {
	return items;
}
function subscribeBanners(fn) {
	listeners.add(fn);
	return () => {
		listeners.delete(fn);
	};
}
function pushBanner(input) {
	const banner = {
		id: input.id ?? `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		title: input.title,
		body: input.body,
		tone: input.tone ?? "info"
	};
	items = [banner, ...items].slice(0, 6);
	emit();
	return banner.id;
}
function dismissBanner(id) {
	items = items.filter((b) => b.id !== id);
	emit();
}
var ICONS = {
	ok: CircleCheck,
	danger: CircleAlert,
	info: Info
};
function BannerStack() {
	const items = (0, import_react.useSyncExternalStore)(subscribeBanners, getBanners, getBanners);
	const [banners, setBanners] = (0, import_react.useState)([]);
	const [spread, setSpread] = (0, import_react.useState)(false);
	const stackRef = (0, import_react.useRef)(null);
	const seen = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const auto = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	(0, import_react.useLayoutEffect)(() => {
		const fresh = items.filter((i) => !seen.current.has(i.id));
		const liveIds = new Set(items.map((i) => i.id));
		const gone = [...seen.current].filter((id) => !liveIds.has(id));
		if (!fresh.length && !gone.length) return;
		fresh.forEach((f) => seen.current.add(f.id));
		setBanners((prev) => {
			let next = [...fresh.map((f) => ({
				...f,
				enter: true,
				leaving: false
			})), ...prev.map((b) => ({
				...b,
				enter: false
			}))];
			if (gone.length) next = next.map((b) => gone.includes(b.id) ? {
				...b,
				leaving: true
			} : b);
			next = next.map((b, i) => i >= 3 ? {
				...b,
				leaving: true
			} : b);
			return next;
		});
	}, [items]);
	(0, import_react.useLayoutEffect)(() => {
		const root = stackRef.current;
		if (!root) return;
		const entering = [...root.querySelectorAll(".t-stack-banner.is-enter")];
		if (!entering.length) return;
		entering.forEach((el) => reflow(el));
		setBanners((b) => b.map((x) => x.enter ? {
			...x,
			enter: false
		} : x));
	}, [banners]);
	(0, import_react.useEffect)(() => {
		const leaving = banners.filter((b) => b.leaving);
		if (!leaving.length) return;
		const ms = readMs("--stack-close", 250);
		const t = window.setTimeout(() => {
			setBanners((s) => s.filter((x) => !x.leaving));
			leaving.forEach((l) => {
				seen.current.delete(l.id);
				dismissBanner(l.id);
				const timer = auto.current.get(l.id);
				if (timer) window.clearTimeout(timer);
				auto.current.delete(l.id);
			});
		}, ms);
		return () => window.clearTimeout(t);
	}, [banners]);
	(0, import_react.useEffect)(() => {
		for (const b of items) {
			if (b.tone === "danger") continue;
			if (auto.current.has(b.id)) continue;
			auto.current.set(b.id, window.setTimeout(() => dismissBanner(b.id), 4800));
		}
	}, [items]);
	const visible = banners.slice(0, 4);
	const canSpread = visible.filter((b) => !b.leaving).length > 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "tw-banner-dock",
		style: { pointerEvents: visible.length ? "auto" : "none" },
		onPointerEnter: () => {
			if (canSpread) setSpread(true);
		},
		onPointerLeave: () => setSpread(false),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: stackRef,
			className: cn("t-stack", spread && canSpread && "is-spread"),
			style: { height: visible.length ? spread && canSpread ? 248 : 80 : 0 },
			children: visible.map((b, i) => {
				const Icon = ICONS[b.tone ?? "info"];
				const depth = b.leaving ? 3 : Math.min(i, 2);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("t-stack-banner", b.enter && "is-enter", b.leaving && "is-leaving"),
					"data-depth": depth,
					role: "status",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: cn("mt-0.5 size-4 shrink-0", b.tone === "ok" && "text-ok", b.tone === "danger" && "text-danger", (!b.tone || b.tone === "info") && "text-primary"),
								strokeWidth: 1.75
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium leading-snug",
									children: b.title
								}), b.body ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-0.5 text-xs text-muted",
									children: b.body
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface hover:text-fg",
								"aria-label": "Dismiss",
								onClick: () => dismissBanner(b.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
							})
						]
					})
				}, b.id);
			})
		})
	});
}
var styles_default = "/assets/styles-C-kfPk83.css";
var APP_NAME = "TripWeave";
var fetchSessionUser = createServerFn({ method: "GET" }).handler(createSsrRpc("2c4985e96c199268f7f639534cb5e8e31d6b19d43286bf77416413db60ffde26"));
var Route$9 = createRootRoute({
	beforeLoad: async () => ({ sessionUser: await fetchSessionUser() }),
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "TripWeave — three honest Puri hotels with all-in rupee prices and a Trust Score."
			},
			{
				name: "theme-color",
				content: "#1e5853"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-bg text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BannerStack, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	})
});
var $$splitComponentImporter$7 = () => import("./routes-BFSKBO5P.mjs");
var Route$8 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./account-Cz_vJWE_.mjs");
var Route$7 = createFileRoute("/account")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./checkout-D3dLK6bF.mjs");
var Route$6 = createFileRoute("/checkout")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./login-DLxPg3kO.mjs");
var Route$5 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./matches-B6ot5axZ.mjs");
var Route$4 = createFileRoute("/matches")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./plan-DyvnEFnb.mjs");
var Route$3 = createFileRoute("/plan")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./trips-BxIWJDlQ.mjs");
var Route$2 = createFileRoute("/trips")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./trip._id-BfXpAkWZ.mjs");
var Route$1 = createFileRoute("/trip/$id")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var Route = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth.handler(request),
	POST: ({ request }) => auth.handler(request)
} } });
var rootRouteChildren = {
	IndexRoute: Route$8.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$9
	}),
	AccountRoute: Route$7.update({
		id: "/account",
		path: "/account",
		getParentRoute: () => Route$9
	}),
	CheckoutRoute: Route$6.update({
		id: "/checkout",
		path: "/checkout",
		getParentRoute: () => Route$9
	}),
	LoginRoute: Route$5.update({
		id: "/login",
		path: "/login",
		getParentRoute: () => Route$9
	}),
	MatchesRoute: Route$4.update({
		id: "/matches",
		path: "/matches",
		getParentRoute: () => Route$9
	}),
	PlanRoute: Route$3.update({
		id: "/plan",
		path: "/plan",
		getParentRoute: () => Route$9
	}),
	TripsRoute: Route$2.update({
		id: "/trips",
		path: "/trips",
		getParentRoute: () => Route$9
	}),
	TripIdRoute: Route$1.update({
		id: "/trip/$id",
		path: "/trip/$id",
		getParentRoute: () => Route$9
	}),
	ApiAuthSplatRoute: Route.update({
		id: "/api/auth/$",
		path: "/api/auth/$",
		getParentRoute: () => Route$9
	})
};
var routeTree = Route$9._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { prefersReducedMotion as a, reflow as c, bezierEasing as i, cn as l, Route$1 as n, readCssNumber as o, pushBanner as r, readMs as s, router_exports as t, createSsrRpc as u };
