import "@/lib/apply-catalog-trust-scores";
import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { parseSearchParams, stringifySearchParams } from "@/lib/search-codec";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    parseSearch: parseSearchParams,
    stringifySearch: stringifySearchParams,
  });
}
