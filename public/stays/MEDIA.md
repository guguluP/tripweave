# Stay media (property-owned photos)

Catalog galleries and room cards use **property-owned** media from official hotel/brand CDNs
(wired in `src/lib/property-media.ts`). YouTube thumbnails are **not** used for catalog media.
YouTube remains only for reviewer consensus / property-tour video chips.

Optional: drop files into `public/stays/{stayId}/` as `hero.jpg`, `gallery-1.jpg`… and
`rooms/{roomId}.jpg` if you want to stop hotlinking and serve from the app origin.

## Sources (verified Sep 2026)

| Stay ID | Source |
| --- | --- |
| `taj-puri-resort-spa` | IHCL Sanity CDN (`cdn.sanity.io/.../ihcl_prod`) via tajhotels.com |
| `mayfair-heritage-puri` | Mayfair official Simplotel CDN (`mayfair-heritage-puri/*`) |
| `swosti-premium-beach-resort` | Swosti official Simplotel CDN (`swosti-premium-beach-resorts-puri/*`) |
| `regenta-central-puri` | Royal Orchid Hotels (`royalorchidhotels.com/images/...`) |
| `empires-hotel-puri` | Empires official WP uploads (`empireshotel.com/wp-content/uploads/...`) |
| `mayfair-waves-puri` | Mayfair Waves Simplotel CDN (`mayfair-waves-puri/*` only — never Heritage) |
| `chariot-resort-puri` | Official booking media (`login.retrod.app/proimg/chariot-puri/`) |
| `chanakya-bnr-puri` | Chanakya Hotels (`chanakyahotels.com/wp-content/uploads/...`) |
| `mahodadhi-palace-puri` | Mahodadhi / Orchid Simplotel brand CDN |
| `holiday-resort-puri` | Puri Holiday Resort (`puriholidayresort.com/uploads/images/...`) |

## Needs user-supplied files

Official sites blocked automated download after a reasonable search. Drop real property photos into:

1. **`hans-coco-palms/`** — `hero.jpg`, `gallery-1..3.jpg`, `rooms/garden.jpg`, `rooms/pool.jpg`, `rooms/sea.jpg`
2. **`toshali-sands-puri/`** — `hero.jpg`, `gallery-1..3.jpg`, `rooms/cottage.jpg`, `rooms/sea-cottage.jpg`, `rooms/family.jpg`

Prefer official hotel/brand photography. Do **not** use Unsplash stock or YouTube thumbs for named hotels.
