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
| `mahodadhi-palace-puri` | mahodadhipalace.com (Simplotel) |
| `holiday-resort-puri` | puriholidayresort.com |
| `hans-coco-palms` | Hans Simplotel |
| `toshali-sands-puri` | toshaliresort.com |

## Sources (Nov 2026)

Property galleries only. Catalog rooms stay unlabeled. Frames are the hotel or chain file, saved as JPEG without resizing. Landmark and beach slides that are not the building were left out. Sterling Puri was not copied.

| Stay ID | Source |
| --- | --- |
| `fortune-beachfront-puri` | itchotels.com Fortune Beachfront gallery |
| `niladri-premium-puri` | hotelniladripremium.com gallery (normal frames, not the 360 set) |
| `nrs-royal-palace-puri` | nrsroyalpalace.com |
| `lotus-eco-resort` | orchidhotel.com Lotus Eco Beach Resort gallery |
| `camellia-puri` | hotelcamelliapuri.com |
| `blue-lily-puri` | bluelilybeachresort.com |
| `hotel-vijoya-international` | vijoyainternational.com gallery |
| `treebo-siddharth-puri` | treebo.com Sidhartha International, Baliapanda |
| `the-bay-suites-puri` | thebaysuites.in |
| `om-leisure-satapada` | omleisureholidays.com Chilika resort page |
| `golden-tree-puri` | hotelgoldentree.in |
| `shakti-horizon-puri` | shaktihorizon.in |
| `white-sands-puri` | hotelwhitesands.co.in |
| `dreamland-puri` | hoteldreamlandgroup.com Hotel Dreamland Puri |
| `hotel-pulin-puri` | hotelpulinpuri.com |
| `samudra-hotel-puri` | thegallerygroups.com Hotel Samudra, Puri |
| `z-hotel-puri` | zhotelpuri.com |
| `hotel-golden-palace-puri` | hotelgoldenpalacepuri.in |
| `rivera-puri` | hotelriverapuri.com |
| `hotel-sukadev-homes` | hotelsdhomes.com |
| `panthanivas-konark` | bookodisha.com Panthanivas Konark |
| `yatrinivas-konark` | otdc.odisha.gov.in Yatrinivas Konark |
| `nuanai-nature-camp` | ecotourodisha.com Nuanai Nature Camp |
| `hotel-bishnu-bhaban` | bishnubhaban.com |
| `hotel-konark-puri` | hotelkonark.co.in |
| `hotel-new-sea-hawk` | hotelnewseahawk.com |
| `hotel-prabhupada-puri` | hotelprabhupada.com |
| `hotel-shreehari-puri` | hotelshreehari.com |
| `hotel-sonar-bangla-puri` | hotelsonarbangla.com (Simplotel folder hotel-sonar-bangla-puri) |
| `jeevan-sandhya-puri` | hoteljeevansandhya.com |
| `lucky-india-puri` | luckyindiahotels.com Puri page |
| `new-shankar-international` | hotelnewshankarinternational.com |
| `santana-puri` | indiasantana.net hotel page |

## Sources (Nov 2026 — gap batch)

Property galleries only. Catalog rooms stay unlabeled. Frames are the hotel's
own listing photos, saved as JPEG without resizing beyond a 1600px cap.
Where a stay has no official website, the source is the trusted listing the
hotel itself supplies photos to, named per stay.

| Stay ID | Source |
| --- | --- |
| `divine-beach-homestay-puri` | directhotels.com Divine Beach Homestay, Penthakata (no exterior photo is published; property-1 is the sea view from the homestay) |
| `golden-dust-puri` | agoda.com Hotel Golden Dust Royal, Marine Drive |
| `hotel-krishna-resorts-puri` | agoda.com / Klook / weddingz.in Krishna Resorts, Chakratirtha Road (same building cross-checked across all three) |
| `hotel-shakuntala-palace` | expedia.co.in Shakuntala Palace, Sea Beach (official site is suspended) |
| `hotel-sweet-home-puri` | hotelspuri.net Sweet Home Lodge, C.T. Road |
| `panthanivas-satapada` | MouthShut photo of the OTDC Yatrinivas, Satapada entrance (OTDC's Satapada property trades as Yatrinivas; single verified frame) |
| `shree-vishnu-darshan` | makemytrip.com Shree Vishnu Darshan Holiday Home, Grand Road (rooms via yatradham.org) |
| `sidharth-inn-puri` | hotelspuri.net Siddharth Inn, Chakratirtha Road |
| `sterling-puri` | trip.com Sterling Puri gallery (sterlingholidays.com publishes only 1–2 usable frames) |
| `the-eastern-dham` | homestayindia.in Hotel Eastern Dhaam, New Marine Drive (the hotel's booking partner; frames carry its corner logo) |
| `yashasvi-inn-puri` | hotels.com / trivago Hotel Yashasvi Inn (Larina Building), Marine Drive |

Still without photos: the six Konark lodges (`konark-hotel-konark`,
`hotel-sun-village-konark`, `hotel-deluxe-konark`, `santi-hotel-konark`,
`santoshi-hotel-konark`, `new-santi-hotel-konark`). No official website or
trusted listing with clean, verifiable photos of those exact properties
could be found; the only candidates were a different namesake hotel, a
permanently closed listing, or watermarked collages.

`STAYS_NEEDING_USER_FILES` is empty.
