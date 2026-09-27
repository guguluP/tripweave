import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Minus, Plus, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/shell";
import { RequireAuth } from "@/components/require-auth";
import { DigilockerFlow } from "@/components/digilocker-flow";
import { DigiYatraPanel, TransportPanel } from "@/components/transport-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShakeField, ShakeSelect, Stagger } from "@/components/motion";
import { RollingPrice } from "@/components/motion/rolling-price";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { pushBanner } from "@/lib/banners";
import { DIGILOCKER_STATUS } from "@/lib/digilocker";
import { getJourney } from "@/lib/transport";
import { defaultTravelPlan, quoteTravel } from "@/lib/travel-plan";
import {
  DIGIYATRA_LABELS,
  GENDER_LABELS,
  ID_LABELS,
  emptyTraveler,
  loadTravelers,
  maskAadhaar,
  saveTravelers,
  travelerInitials,
  validateTravelers,
  type DigiYatraStatus,
  type Gender,
  type IdType,
  type Traveler,
  type TravelerErrors,
} from "@/lib/travelers";
import { formatMoney, getPackage, getRoom, loadBrief, loadPending, nightsPhrase, stayTotal } from "@/lib/packages";
import { quoteStay } from "@/lib/inventory";
import { usePaidHolds } from "@/lib/use-occupancy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/travelers")({ component: TravelersPage });

function TravelersPage() {
  return (
    <RequireAuth next="/travelers" fallback={<Shell><Skeleton className="m-10 h-40" /></Shell>}>
      <TravelersInner />
    </RequireAuth>
  );
}

function Stepper() {
  return (
    <ol className="flex items-center gap-2 text-xs font-medium text-subtle">
      <li className="text-muted">Stay</li>
      <li aria-hidden className="h-px w-6 bg-border" />
      <li className="text-primary">Travellers</li>
      <li aria-hidden className="h-px w-6 bg-border" />
      <li>Pay</li>
    </ol>
  );
}

function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="mt-5 min-w-0">
      <legend className="text-xs font-medium uppercase tracking-[0.14em] text-subtle">{title}</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

// NOTE: truncated mid-file - WILL FAIL - aborting this approach
