const APP_NAME = "TripWeave";

export function pageTitle(page: string): string {
  return `${page} · ${APP_NAME}`;
}

export function pageHead(page: string) {
  return { meta: [{ title: pageTitle(page) }] };
}
