/** Plain query strings. TanStack's default serializer JSON-encodes every value, so nights=3 becomes nights=%223%22. */

function unwrapEncoded(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (typeof parsed === "string" || typeof parsed === "number" || typeof parsed === "boolean") {
        return String(parsed);
      }
    } catch {
      /* keep the raw token */
    }
  }
  return trimmed;
}

export function parseSearchParams(searchStr: string): Record<string, string> {
  const raw = searchStr.startsWith("?") ? searchStr.slice(1) : searchStr;
  const out: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(raw)) {
    out[key] = unwrapEncoded(value);
  }
  return out;
}

export function stringifySearchParams(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value == null || value === "") continue;
    params.set(key, typeof value === "string" ? value : String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
