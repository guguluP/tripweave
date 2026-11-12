/** Stay-include glyphs. The chip still reads the catalog label. */
export const INCLUDE_ICON = {
  Pool: { icon: "waves", motion: "waves" },
  Breakfast: { icon: "coffee", motion: "steam" },
  "Beach chairs": { icon: "chair", motion: "rock" },
  "Wi-Fi": { icon: "wifi", motion: "wifi" },
  "Private beach access": { icon: "umbrella", motion: "sway" },
  "Airport transfer": { icon: "car", motion: "drive" },
  "Spa credit": { icon: "spark", motion: "bloom" },
  "Garden rooms": { icon: "flower", motion: "bloom" },
  "Ayurveda consult": { icon: "leaf", motion: "sway" },
  "Temple transfer": { icon: "car", motion: "drive" },
  "AC rooms": { icon: "snow", motion: "spin" },
  "Temple walk map": { icon: "map", motion: "lift" },
  "Late checkout on request": { icon: "clock", motion: "tick" },
  "Palm garden": { icon: "palm", motion: "palm" },
  "Beach access": { icon: "umbrella", motion: "sway" },
  Parking: { icon: "parking", motion: "lift" },
  "24h desk": { icon: "bell", motion: "ring" },
  "Beach club access": { icon: "umbrella", motion: "sway" },
  "Cottage stay": { icon: "house", motion: "lift" },
  "Walk to station": { icon: "train", motion: "drive" },
  "Heritage lobby": { icon: "landmark", motion: "lift" },
  "Palace lawns": { icon: "trees", motion: "palm" },
  "Heritage rooms": { icon: "bed", motion: "lift" },
  Lawn: { icon: "trees", motion: "palm" },
} as const;

export type IncludeLabel = keyof typeof INCLUDE_ICON;
