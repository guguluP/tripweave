import { familyPolicyFor, familyPolicyLines } from "@/lib/family-policy";
import { getPackage, getRoom } from "@/lib/packages";

export function FamilyPolicyNote({
  packageId,
  roomId,
  className,
}: {
  packageId: string;
  roomId?: string;
  className?: string;
}) {
  const pkg = getPackage(packageId);
  if (!pkg) return null;
  const room = roomId ? getRoom(pkg, roomId) : undefined;
  const policy = familyPolicyFor(pkg, room);
  if (!policy.childPolicy && !policy.extraBed) {
    return (
      <p className={className ?? "text-xs text-subtle"}>
        Sleeps {policy.sleeps}. Extra-bed and child policy not published for this stay — ask the desk.
      </p>
    );
  }
  return (
    <div className={className ?? "rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted"}>
      <p className="font-medium text-fg">Family · extra bed</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4">
        {familyPolicyLines(policy).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
