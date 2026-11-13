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
| `hotel-deluxe-konark` | justdial.com Deluxe Hotel, Konark HO, Ring Road, Junei (listing gallery; no official website exists. Building signage cross-checked in every frame) |
| `santi-hotel-konark` | wanderlog.com Santi A/C Restaurant, Konark (the property's Google-listing photos served clean; signage reads "Shanti Hotel / Santi Hotel A/C Family Restaurant". Trades mainly as a family restaurant; no room photos exist) |
| `new-santi-hotel-konark` | Google listing photos, New Santi Hotel, Shop No 81, Arabana Park Front, Konark (signage "New Santi Hotel / Your's First Choice" verified; clean originals of the photos Restaurant Guru serves only as mascot collages) |

Still without photos: three Konark lodges (`konark-hotel-konark`,
`hotel-sun-village-konark`, `santoshi-hotel-konark`). A second, deeper pass
(archived pages, regional directories, the properties' own social pages)
confirmed there is nothing honest to add: Hotel Konark, Konark is a real
place but has no photo gallery anywhere (its supposed official site,
hotelkonark.in, is the Hotel Konark in Puri); no business named Sun Village
can be found in Konark at all (every result is the Puri hotel); and Santoshi
Hotel is permanently closed with no photos in any listing or archive.

`STAYS_NEEDING_USER_FILES` is empty.

## Room types and room photos (Nov 2026)

Official room names were adopted for 17 stays that previously used the
generic Standard/Larger pair, following the `official-rooms` pattern: names
are the hotel's own published categories, in published price order; a photo
is attached only where the source attributes one to that exact category.
Stays whose hotels publish no categories keep the generic labels.

Room photos (`rooms/{roomId}.jpg`), one per category:

| Stay ID | Room-photo source |
| --- | --- |
| `dreamland-puri` | dreamlandhotelpuri.com room pages (the hotel's Suites page shows an "Executive Suite" at the same tariff with the same photo as the Luxury Room — apparently one unit under two labels — so only the four distinct categories are listed) |
| `lucky-india-puri` | easemytrip.com hotel-supplied room sections, corroborated by Cleartrip |
| `shree-vishnu-darshan` | yatradham.org per-category galleries |
| `panthanivas-konark` | bookodisha.com (OTDC booking portal) per-type images |
| `om-leisure-satapada` | omleisureholidays.com "Room Types & Tariff" ("Family Suit" is the site's own spelling) |
| `z-hotel-puri` | zhotelpuri.com "Our Rooms" (the hotel publishes only 200x100 thumbnails) |

Names only: Sterling Puri (sterlingholidays.com publishes per-category
images for only 3 of its 7 categories, and this repo wires room photos
all-or-nothing per stay) and Hotel Konark, Puri (hotelkonark.in archived
official site: the Three Bed, Four Bed and "A.C Suit" [sic] frames survive,
the Double Bed frame does not). For the rest, no photo is honestly
attributable to a category: Golden Dust
(trivago/Via hotel-supplied ladder), Hotel Shakuntala Palace, New Shankar
International and Hotel Sweet Home's directory (hotelspuri.net), Hotel
Sukadev Homes (hotelsdhomes.com), The Eastern Dham (homestayindia.in),
Yashasvi Inn (Booking/Expedia category lists; Expedia shows placeholder
tiles, no per-room photos), Hotel Golden Palace (hotelgoldenpalacepuri.in —
its rendered site lists four categories with photo strips, but the image
host refuses direct downloads; the "Family Room" a mirror site adds is not
on the hotel's own site), Yatrinivas Konark and Panthanivas Satapada (OTDC
tariff cards). Note: OTDC's current portal lists a single Konark unit whose
contact details match the old Yatrinivas page — the two catalog entries may
be the same physical unit.

No categories published anywhere, generic labels kept: Divine Beach
Homestay, Hotel Krishna Resorts (the one formal tariff online is a Diu
namesake's), Hotel Sweet Home (a single generic "Deluxe Room"), Sidharth
Inn, Santana Puri, Nuanai Nature Camp (a single "AC Cottage"), Hotel
Deluxe Konark, and the two Konark eateries Santi Hotel and New Santi Hotel,
which sell no rooms at all.
