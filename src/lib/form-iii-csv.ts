/** Form III worksheet. The hotel files the form. TripWeave does not. */

export type FormIiiRow = {
  fullName: string;
  nationality: string;
  phone: string;
  email: string;
  idType?: string;
  idLast4?: string;
  checkIn: string;
  nights: number;
  arrivedFrom?: string;
  arrivalTime?: string;
  purpose?: string;
  previousStay?: string;
  nextDestination?: string;
  confirmationCode: string;
};

export type FormIiiPremise = {
  name: string;
  phone?: string;
  /** District and state. The hotel street is not stored. */
  address?: string;
};

export const FORM_III_COLUMNS = [
  "Name of the premise",
  "Address of the premise",
  "Phone of the place of stay",
  "Full name",
  "Nationality",
  "Passport number (from passport)",
  "Visa/OCI number",
  "Visa type",
  "Contact phone in India",
  "Email",
  "Arrived from",
  "Date and time of arrival",
  "Purpose",
  "Previous place of stay",
  "Next destination",
  "Check-in",
  "Nights",
  "Confirmation code",
  "ID type",
  "ID last 4",
] as const;

function guardFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function quoteCell(value: string): string {
  const guarded = guardFormula(value ?? "");
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function formIiiFilename(packageId: string, date = new Date()): string {
  const day = date.toISOString().slice(0, 10);
  const slug = packageId.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || "stay";
  return `form-iii-worksheet-${slug}-${day}.csv`;
}

export function formIiiCsv(rows: FormIiiRow[], premise: FormIiiPremise): string {
  const body = rows.map((row) => {
    const cells = [
      premise.name,
      premise.address ?? "Puri, Odisha",
      premise.phone ?? "",
      row.fullName,
      row.nationality,
      "",
      "",
      "",
      row.phone,
      row.email,
      row.arrivedFrom ?? "",
      [row.checkIn, row.arrivalTime].filter(Boolean).join(" "),
      row.purpose ?? "",
      row.previousStay ?? "",
      row.nextDestination ?? "",
      row.checkIn,
      String(row.nights),
      row.confirmationCode,
      row.idType ?? "",
      row.idLast4 ?? "",
    ];
    return cells.map((cell) => quoteCell(cell)).join(",");
  });
  return `\uFEFF${[FORM_III_COLUMNS.map((cell) => quoteCell(cell)).join(","), ...body].join("\r\n")}\r\n`;
}
