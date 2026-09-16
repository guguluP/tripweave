# Stay media (property-owned photos)

Catalog galleries and room cards use **local** paths under `public/stays/{stayId}/`
(wired via `src/lib/stay-media.json`). Serving from the app origin avoids CDN
**403 hotlink blocks** when Referer is `tripweave-web.vercel.app` (Simplotel etc.).

## Populating `public/stays`

`npm run materialize:stays` (also `predev` / `prebuild`):

1. Keeps existing JPEGs if the catalog is already complete
2. Else decodes optional `data/vendored-stays-chunks/*.tar.b64` when present
3. Else downloads from official hotel URLs in `data/stay-photo-sources.json`
   (hotel-domain Referer; `wsrv.nl` proxy for hosts that reset TLS, e.g. Toshali)

Prefer committing the materialized JPEGs when `git push` of binaries is available.
This PR ships the source map + materialize script so CI/Vercel can vendor at build time.

Do **not** use YouTube thumbs or Unsplash for named hotels.

## Layout

- `gallery-1.jpg` … — property gallery
- `rooms/{roomId}.jpg` — one image per packages-data room id

## Sources (Sep 2026)

| Stay ID | Source |
| --- | --- |
| `taj-puri-resort-spa` | IHCL Sanity |
| `mayfair-heritage-puri` | Mayfair Simplotel |
| `swosti-premium-beach-resort` | Swosti Simplotel |
| `regenta-central-puri` | Royal Orchid |
| `empires-hotel-puri` | Empires WP |
| `mayfair-waves-puri` | Mayfair Waves Simplotel |
| `chariot-resort-puri` | thechariotpuri.com + retrod |
| `chanakya-bnr-puri` | chanakyahotels.com (404 thumbs replaced) |
| `mahodadhi-palace-puri` | Orchid / Mahodadhi |
| `holiday-resort-puri` | puriholidayresort.com |
| `hans-coco-palms` | Hans Simplotel |
| `toshali-sands-puri` | toshaliresort.com |

`STAYS_NEEDING_USER_FILES` is empty.
