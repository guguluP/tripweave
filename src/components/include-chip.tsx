import type { LucideIcon } from "lucide-react";
import {
  BedDouble,
  CarFront,
  CircleParking,
  Clock,
  Coffee,
  ConciergeBell,
  Flower2,
  Footprints,
  House,
  Landmark,
  Leaf,
  Map,
  Snowflake,
  Sparkles,
  TrainFront,
  TreePalm,
  Trees,
  Umbrella,
  Waves,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { INCLUDE_ICON, type IncludeLabel } from "@/lib/include-icons";

const GLYPH: Record<string, LucideIcon> = {
  waves: Waves,
  coffee: Coffee,
  wifi: Wifi,
  umbrella: Umbrella,
  car: CarFront,
  spark: Sparkles,
  flower: Flower2,
  leaf: Leaf,
  snow: Snowflake,
  map: Map,
  clock: Clock,
  palm: TreePalm,
  parking: CircleParking,
  feet: Footprints,
  bell: ConciergeBell,
  house: House,
  train: TrainFront,
  landmark: Landmark,
  trees: Trees,
  bed: BedDouble,
};

function DeckChair() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 20 9 13.5" />
      <path d="M19 20 15 13.5" />
      <path d="M7.5 14 19 10.5" />
      <path d="M8.2 13.6 3.5 7" />
    </svg>
  );
}

export function IncludeChip({ label }: { label: string }) {
  const spec = INCLUDE_ICON[label as IncludeLabel];
  const motion = spec?.motion ?? "lift";
  const Glyph = spec && spec.icon !== "chair" ? (GLYPH[spec.icon] ?? Sparkles) : Sparkles;

  return (
    <Badge className="include-chip gap-1.5 transition-colors hover:text-fg">
      <span className={`include-ico include-ico-${motion}`} aria-hidden>
        {spec?.icon === "chair" ? <DeckChair /> : <Glyph className="size-3.5" strokeWidth={2} />}
      </span>
      {label}
    </Badge>
  );
}
