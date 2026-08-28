import { S as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as PACKAGES } from "./packages-eAQZmKLU.mjs";
import { g as ArrowRight, n as Wallet, o as ShieldCheck, u as Landmark } from "../_libs/lucide-react.mjs";
import { n as Button, r as Stagger } from "./button-DBLqx4RN.mjs";
import { n as Shell } from "./shell-ChiWA-mp.mjs";
import { t as LearnMore } from "./learn-more-D0-t_H9S.mjs";
import { t as PackageCard } from "./package-card-BioIkRdf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BFSKBO5P.js
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const featured = [...PACKAGES].sort((a, b) => b.trustScore - a.trustScore).slice(0, 3);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "relative isolate min-h-[32rem] overflow-hidden",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80",
					alt: "Puri beach at dusk",
					className: "absolute inset-0 h-full w-full object-cover"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-fg/55" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative mx-auto flex min-h-[32rem] max-w-6xl flex-col justify-end px-4 py-16",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Stagger, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "eyebrow text-primary-fg/80",
							children: "Puri stays without the tab overload"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-3 max-w-xl font-display text-4xl text-primary-fg md:text-5xl",
							children: "Three honest Puri hotels. One confident booking."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 max-w-md text-base text-primary-fg/80",
							children: "Answer a short brief. We return three verified stays with all-in rupee prices — not another endless list."
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex flex-wrap items-center gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "lg",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/plan",
								children: ["Find my hotel", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LearnMore, {
							className: "text-sm font-medium text-primary-fg",
							onClick: () => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" }),
							children: "See how it works"
						})]
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3",
			children: [
				{
					icon: ShieldCheck,
					title: "Trust Score",
					body: "Cancellation, operator history, and verified reviews in one number."
				},
				{
					icon: Wallet,
					title: "All-in rupees",
					body: "The price you see is the price you pay — extras are optional swaps."
				},
				{
					icon: Landmark,
					title: "Three, not two hundred",
					body: "A short list ranked to your brief. Temple, beach, or slow."
				}
			].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-xl border border-border bg-elevated p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, {
						className: "size-5 text-primary",
						strokeWidth: 1.75
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-3 font-display text-xl",
						children: item.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: item.body
					})
				]
			}, item.title))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mx-auto max-w-6xl px-4 pb-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Stagger, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "eyebrow",
					children: "Top-rated"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 font-display text-3xl",
					children: "Puri hotels we stand behind"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LearnMore, {
					to: "/plan",
					className: "hidden text-sm font-medium text-primary md:inline-flex",
					children: "Match me"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 grid gap-5 md:grid-cols-3",
				children: featured.map((pkg) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackageCard, { pkg }, pkg.id))
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			id: "how",
			className: "mx-auto max-w-6xl px-4 py-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Stagger, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "eyebrow",
					children: "How it works"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 font-display text-3xl",
					children: "Brief, three stays, pay."
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-8 grid gap-5 md:grid-cols-3",
					children: [
						{
							n: "01",
							t: "Share a brief",
							d: "Vibe, budget, who you travel with, nights."
						},
						{
							n: "02",
							t: "Pick from three",
							d: "Ranked by fit. Swap extras; the rupee total updates live."
						},
						{
							n: "03",
							t: "Pay and hold",
							d: "Sign in, pay with a card, get a confirmation code."
						}
					].map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-xl border border-border bg-surface p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-2xl text-primary",
								children: step.n
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-2 font-display text-xl",
								children: step.t
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: step.d
							})
						]
					}, step.n))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LearnMore, {
					to: "/plan",
					className: "mt-8 text-sm font-medium text-primary",
					children: "Start a brief"
				})
			]
		})
	] });
}
//#endregion
export { Home as component };
