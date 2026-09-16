# Stay media (property-owned photos)

Catalog galleries and room cards use **local** paths under `public/stays/{stayId}/`
(wired via `src/lib/stay-media.json`). Serving from the app origin avoids CDN
**403 hotlink blocks** when Referer is `tripweave-web.vercel.app` (Simplotel etc.).

## Populating `public/stays`

`npm run materialize:stays` (also `predev` / `prebuild`):

1. Keeps existing JPEGs if the catalog is already complete
2. Else decodes optional `data/vendored-stays-chunks/*.tar.b64` when present
3. Else downloads from official hotel URLs in `data/stay-photo-sources/`
   (hotel-domain Referer; `wsrv.nl` proxy as a fallback if a host 403s/TLS-resets)

JPEGs are committed so Vercel does not depend on hotel CDNs at build time.
`prebuild` still runs materialize as a safety net (no-op when the catalog is complete).

Do **not** use YouTube thumbs or Unsplash for named hotels.

## Layout

- `property-N.jpg` — hotel exterior, grounds, pool, lobby (card + hero)
- `gallery-N.jpg` — extra property/room interiors
- `rooms/{roomId}.jpg` — one image per packages-data room id

## Sources (Sep 2026)

| Stay ID | Source |
| --- | --- |
| `taj-puri-resort-spa` | IHCL Sanity |
| `mayfair-heritage-puri` | Mayfair Simplotel |
| `swosti-premium-beach-resort` | Swosti Simplotel |
| `regenta-central-puri` | Royal Orchid |
| `empires-hotel-puri` | Empires WP |
| `mayfair-waves-puri` | Mayfair Waves Simplotel (suite is `mayfair-waves-puri/`, not Heritage) |
| `chariot-resort-puri` | thechariotpuri.com + retrod |
| `chanakya-bnr-puri` | chanakyahotels.com |
| `mahodadhi-palace-puri` | Orchid / Mahodadhi |
| `holiday-resort-puri` | puriholidayresort.com |
| `hans-coco-palms` | Hans Simplotel |
| `toshali-sands-puri` | toshaliresort.com |

`STAYS_NEEDING_USER_FILES` is empty.
