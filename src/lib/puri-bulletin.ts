import type { LocalBulletin } from "./ask-model.ts";

function cells(row: string): string[] {
  return [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
    .map((match) =>
      match[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/&deg;/g, "°")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((cell) => cell.length > 0);
}

/** Read the dated observation, today's sky line, and today's warning. Anything else is a failed read. */
export function parsePuriBulletin(html: string): LocalBulletin {
  const dated = html.match(/Dated\s*:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i)?.[1]?.trim();
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) => cells(match[1]));
  const observed = rows.find((row) => row.some((cell) => /°C/i.test(cell)) && !/^\d{2}-[A-Za-z]{3}$/.test(row[0] ?? ""));
  const today = rows.find((row) => /^\d{2}-[A-Za-z]{3}$/.test(row[0] ?? ""));
  if (!dated || !observed || !today) return { ok: false };
  const max = observed.find((cell) => /°C/i.test(cell));
  const min = observed.filter((cell) => /°C/i.test(cell))[1];
  const prose = today.filter((cell) => /[A-Za-z]{8,}/.test(cell));
  const warning = prose.find((cell) => /kmph|no warning/i.test(cell)) ?? prose.at(-1);
  const sky = prose.find((cell) => cell !== warning);
  const minTemp = today[1];
  const maxTemp = today[2];
  if (!max || !min || !sky || !warning || !minTemp || !maxTemp) return { ok: false };
  return {
    ok: true,
    observed: `Observed on ${dated}: max ${max}, min ${min}.`,
    today: `${today[0]}, ${minTemp} to ${maxTemp}°C, ${sky}.`,
    warning,
  };
}
