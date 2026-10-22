import { deskFor } from "@/lib/hotel-desk";
import { formIiiCsv, formIiiFilename, type FormIiiRow } from "@/lib/form-iii-csv";
import { getPackage } from "@/lib/packages";
import type { ForeignGuestRow } from "@/lib/server/guest-arrivals";
import { Button } from "@/components/ui/button";

export function foreignCodes(rows: ForeignGuestRow[]): Set<string> {
  return new Set(rows.map((row) => row.confirmationCode));
}

export function ForeignGuestRegister({ packageId, rows }: { packageId: string; rows: ForeignGuestRow[] }) {
  const pkg = getPackage(packageId);
  const desk = deskFor(packageId);
  const download = () => {
    const csvRows: FormIiiRow[] = rows.map((row) => ({
      fullName: row.fullName,
      nationality: row.nationality,
      phone: row.phone,
      email: row.email,
      idType: row.idType,
      idLast4: row.idLast4,
      checkIn: row.checkIn,
      nights: row.nights,
      arrivedFrom: row.arrivedFrom,
      arrivalTime: row.arrivalTime,
      purpose: row.purpose,
      previousStay: row.previousStay,
      nextDestination: row.nextDestination,
      confirmationCode: row.confirmationCode,
    }));
    const csv = formIiiCsv(csvRows, { name: pkg?.name ?? packageId, phone: desk.phone ?? "" });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = formIiiFilename(packageId);
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mt-8">
      <h2 className="font-medium">Foreign guests: Form III due within 24 h of arrival</h2>
      <p className="mt-1 text-xs text-muted">
        The hotel files Form III. TripWeave does not. This worksheet is not the statutory record. Copy the passport
        and visa numbers from the passport at check-in. The street address is left blank.
      </p>
      <p className="mt-2 text-xs">
        <a className="underline" href="https://indianfrro.gov.in/frro/FormC">
          indianfrro.gov.in/frro/FormC
        </a>
      </p>
      <Button type="button" variant="outline" className="mt-3" disabled={rows.length === 0} onClick={download}>
        Download CSV
      </Button>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No foreign guests in the open stays.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-2 pr-3 font-medium">Guest</th>
                <th className="py-2 pr-3 font-medium">Nationality</th>
                <th className="py-2 pr-3 font-medium">ID last 4</th>
                <th className="py-2 pr-3 font-medium">Phone</th>
                <th className="py-2 pr-3 font-medium">Check-in</th>
                <th className="py-2 pr-3 font-medium">Code</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.confirmationCode}-${row.fullName}-${row.idLast4}`} className="border-b border-border">
                  <td className="py-2 pr-3">{row.fullName}</td>
                  <td className="py-2 pr-3">{row.nationality}</td>
                  <td className="py-2 pr-3">{row.idLast4}</td>
                  <td className="py-2 pr-3">{row.phone}</td>
                  <td className="py-2 pr-3">
                    {row.checkIn} · {row.nights} nights
                  </td>
                  <td className="py-2 pr-3">{row.confirmationCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
