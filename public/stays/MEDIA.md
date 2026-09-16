# Stay media (property-owned photos)

Catalog galleries and room cards use **vendored property-owned photos** under
`public/stays/{stayId}/` (wired in `src/lib/property-media.ts` via `stay-media.json`).

Images are committed locally because several hotel CDNs (Simplotel and others)
return **403 when the Referer is `tripweave-web.vercel.app`**. Hotlinking is
unreliable; serving from the app origin avoids that.

YouTube thumbnails are **not** used for catalog media. YouTube remains only for
reviewer consensus / property-tour video chips. Do **not** use Unsplash stock.

## Layout

For each stay:

- `gallery-1.jpg` … `gallery-n.jpg` — property gallery
- `rooms/{roomId}.jpg` — one image per room id in packages-data

Paths in `src/lib/stay-media.json` look like `/stays/{stayId}/gallery-1.jpg`.

## Sources (vendored Sep 2026)

| Stay ID | Original source (downloaded, not hotlinked) |
| --- | --- |
| `taj-puri-resort-spa` | IHCL Sanity CDN via tajhotels.com |
| `mayfair-heritage-puri` | Mayfair Simplotel CDN |
| `swosti-premium-beach-resort` | Swosti Simplotel CDN |
| `regenta-central-puri` | Royal Orchid Hotels |
| `empires-hotel-puri` | Empires Hotel WP uploads |
| `mayfair-waves-puri` | Mayfair Waves Simplotel CDN |
| `chariot-resort-puri` | thechariotpuri.com + retrod booking media |
| `chanakya-bnr-puri` | chanakyahotels.com (404 listing thumbs replaced with working assets) |
| `mahodadhi-palace-puri` | Orchid / Mahodadhi brand CDN |
| `holiday-resort-puri` | puriholidayresort.com |
| `hans-coco-palms` | Hans Hotels Simplotel CDN |
| `toshali-sands-puri` | toshaliresort.com official room photos |

`STAYS_NEEDING_USER_FILES` is empty — every catalog stay has local photos.
