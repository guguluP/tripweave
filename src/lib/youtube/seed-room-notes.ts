import type { RoomReviewNotes } from "./types.ts";
import { TAJ_PURI_ROOM_NOTES } from "./taj-puri-room-notes.ts";

/** Room-level reviewer notes keyed by official catalog room ids. */
export const SEED_ROOM_NOTES: Record<string, Record<string, RoomReviewNotes>> = {
  "taj-puri-resort-spa": TAJ_PURI_ROOM_NOTES,
  "mayfair-heritage-puri": {
      deluxe: {
        summary: "42 sqm heritage deluxe — solid base room.",
        positives: ["42 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "heritage-premium": {
        summary: "49 sqm heritage premium category.",
        positives: ["49 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "deluxe-cottage": {
        summary: "42 sqm garden cottage.",
        positives: ["42 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "sea-view-cottage": {
        summary: "49 sqm cottage with sea outlook.",
        positives: ["49 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "deluxe-suite": {
        summary: "53 sqm suite — more space than deluxe.",
        positives: ["53 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "family-suite": {
        summary: "76 sqm suite with two king beds.",
        positives: ["76 sqm", "two king-size beds", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "swosti-premium-beach-resort": {
      premium: {
        summary: "31.96 sqm premium room — up to 3 guests.",
        positives: ["31.96 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "sea-view-side": {
        summary: "31.96 sqm side sea view — up to 4.",
        positives: ["31.96 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "sea-view-front": {
        summary: "31.96 sqm front sea view — king bed.",
        positives: ["31.96 sqm", "king-size bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      interconnecting: {
        summary: "Connecting rooms for families and groups.",
        positives: ["Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "oasis-suite": {
        summary: "86.4 sqm suite — up to 3 guests.",
        positives: ["86.4 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "intimate-escape-suite": {
        summary: "86.4 sqm suite — up to 4 guests.",
        positives: ["86.4 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "imperial-suite": {
        summary: "110.55 sqm imperial suite — up to 4.",
        positives: ["110.55 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "royal-ambassador-suite": {
        summary: "179.4 sqm flagship suite — king bed.",
        positives: ["179.4 sqm", "king-size bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "regenta-central-puri": {
      "deluxe-double-sea": {
        summary: "22 sqm double — balcony sea view.",
        positives: ["22 sqm", "double bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "deluxe-twin-sea": {
        summary: "22 sqm twin beds — balcony sea view.",
        positives: ["22 sqm", "twin beds", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "executive-double-sea": {
        summary: "26 sqm executive double — balcony sea view.",
        positives: ["26 sqm", "double bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "executive-twin-sea": {
        summary: "26 sqm executive twin — balcony sea view.",
        positives: ["26 sqm", "twin beds", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "premium-sea": {
        summary: "38 sqm premium — balcony sea view.",
        positives: ["38 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "hans-coco-palms": {
      "pool-garden": {
        summary: "28 sqm twin — pool or garden outlook.",
        positives: ["28 sqm", "twin beds", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "partial-ocean": {
        summary: "25 sqm king — balcony with partial ocean view.",
        positives: ["25 sqm", "king bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "ocean-suite": {
        summary: "66 sqm king suite with ocean view.",
        positives: ["66 sqm", "king bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "empires-hotel-puri": {
      executive: {
        summary: "21.83 sqm — twin or king bed.",
        positives: ["21.83 sqm", "twin / king-size bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      deluxe: {
        summary: "51.1 sqm deluxe with king bed.",
        positives: ["51.1 sqm", "king-size bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      corporate: {
        summary: "144.33 sqm corporate room — king bed.",
        positives: ["144.33 sqm", "king-size bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      premium: {
        summary: "146.2 sqm premium room — king bed.",
        positives: ["146.2 sqm", "king-size bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "mayfair-waves-puri": {
      premium: {
        summary: "49 sqm premium room — up to 2 adults and 1 child.",
        positives: ["49 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "premium-sea-view": {
        summary: "49 sqm sea-view premium room.",
        positives: ["49 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "premium-suite": {
        summary: "114 sqm suite — up to 2 adults and 2 children.",
        positives: ["114 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "toshali-sands-puri": {
      "standard-deluxe": {
        summary: "12.17 sqm standard deluxe with garden view.",
        positives: ["12.17 sqm", "Garden view", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "deluxe-balcony": {
        summary: "Deluxe with balcony and garden view.",
        positives: ["Balcony", "Garden view", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "premium-balcony": {
        summary: "Premium with balcony and garden view.",
        positives: ["Balcony", "Garden view", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "executive-suite": {
        summary: "Two-bedroom executive suite with garden view.",
        positives: ["Two bedrooms", "Garden view", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      cottage: {
        summary: "17.09 sqm cottage — king/twin with sofa cum bed.",
        positives: ["17.09 sqm", "Sofa cum bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      villa: {
        summary: "29.17 sqm villa — king/twin with sofa cum bed.",
        positives: ["29.17 sqm", "Sofa cum bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "chariot-resort-puri": {
      deluxe: {
        summary: "Deluxe category at The Chariot.",
        positives: ["Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      executive: {
        summary: "Two queen-size beds — executive category.",
        positives: ["two queen-size beds", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      premium: {
        summary: "King-size bed — premium category.",
        positives: ["king-size bed", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "platinum-suite": {
        summary: "Platinum suite — top Chariot category.",
        positives: ["Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "chanakya-bnr-puri": {
      deluxe: {
        summary: "Heritage hotel deluxe category.",
        positives: ["Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      superior: {
        summary: "King or twin beds — superior wing.",
        positives: ["king-size / twin beds", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "heritage-suite": {
        summary: "Heritage suite in the railway hotel.",
        positives: ["Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "mahodadhi-palace-puri": {
      "heritage-deluxe-sea": {
        summary: "Heritage deluxe sea room in the palace wing.",
        positives: ["Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "day-use": {
        summary: "Short-stay / day-use category from the hotel site.",
        positives: ["Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "holiday-resort-puri": {
      "standard-double": {
        summary: "14.86 sqm standard double with sofa option.",
        positives: ["14.86 sqm", "one king-size bed plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "deluxe-double": {
        summary: "14.86 sqm deluxe double with sofa option.",
        positives: ["14.86 sqm", "one king-size bed plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "deluxe-pool-view": {
        summary: "14.86 sqm deluxe with pool outlook.",
        positives: ["14.86 sqm", "one king-size bed plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      family: {
        summary: "19.51 sqm — two queen beds plus sofa.",
        positives: ["19.51 sqm", "two queen-size beds plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "standard-family": {
        summary: "19.51 sqm standard family layout.",
        positives: ["19.51 sqm", "two queen-size beds plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      cottage: {
        summary: "23.23 sqm cottage with king bed and sofa.",
        positives: ["23.23 sqm", "one king-size bed plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "standard-cottage": {
        summary: "23.23 sqm standard cottage category.",
        positives: ["23.23 sqm", "one king-size bed plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "royal-suite": {
        summary: "27.87 sqm royal suite with king bed and sofa.",
        positives: ["27.87 sqm", "one king-size bed plus additional sofa", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
      "presidential-suite": {
        summary: "37.16 sqm presidential suite.",
        positives: ["37.16 sqm", "Listed on the official hotel site"],
        watchouts: ["Confirm view and rate inclusions when you book"],
      },
    },
  "niladri-premium-puri": {
      deluxe: {
        summary: "Official Deluxe Room — breakfast for two at ₹6,000 (was ₹6,500) on the hotel site.",
        positives: ["Listed on the official hotel site", "Breakfast for two included in the official tariff"],
        watchouts: ["Official-site guest notes say some rooms run small", "Confirm sea view and GST when you book"],
      },
      premium: {
        summary: "Official Premium Room — breakfast for two at ₹7,000 (was ₹7,500) on the hotel site.",
        positives: ["Listed on the official hotel site", "Breakfast for two included in the official tariff"],
        watchouts: ["Confirm sea view and GST when you book"],
      },
    },
  "blue-lily-puri": {
      standard: {
        summary: "Courtyard-facing standard room.",
        positives: [
          "Large, clean rooms; many have kitchenettes with a sink, fridge and kettle",
        ],
        watchouts: [
          "Balconies face the courtyard; no sea-view rooms were shown",
        ],
      },
      larger: {
        summary: "Suites and two-bedroom family suites with a kitchen partition.",
        positives: [
          "Varied suite options, including a two-bedroom family suite, many with kitchenettes",
        ],
        watchouts: [
          "One family-suite window looks onto an electrical transformer",
        ],
      },
    },
  "dreamland-puri": {
      standard: {
        summary: "Double room with a side or back view.",
        positives: [],
        watchouts: [
          "Back view faces a construction site, and upkeep of back and some side rooms is weaker than the front rooms'",
        ],
      },
      larger: {
        summary: "Front sea-view double or deluxe, or 4-bed family rooms with a side sea view or back view.",
        positives: [
          "Front rooms have an unobstructed sea view from the balcony",
        ],
        watchouts: [
          "4-bed family rooms may have a side sea view or a back view",
        ],
      },
    },
  "fortune-beachfront-puri": {
      "sea-front": {
        summary: "Sea-front room with a balcony facing the sea across the road.",
        positives: [
          "Unobstructed sea view from the balcony",
          "Glass shower, hair dryer and dispensers",
          "New, clean white-and-blue finish",
        ],
        watchouts: [
          "About ₹11,000+ plus GST with breakfast",
          "Bathroom is compact",
        ],
      },
    },
  "golden-dust-puri": {
      standard: {
        summary: "1st-floor AC double with a wall or side view.",
        positives: [],
        watchouts: [
          "The cheaper room's balcony faces a wall, or at best a partial side sea view",
          "Room A-2 had visible damp and peeling paint by the bed",
        ],
      },
    },
  "golden-tree-puri": {
      standard: {
        summary: "Super deluxe with a side sea view; compact.",
        positives: [
          "Side sea-view balcony",
        ],
        watchouts: [
          "Small for over ₹5,000",
          "One guest found the bathroom dirty at check-in with a broken exhaust fan",
        ],
      },
      larger: {
        summary: "Premium or luxury room with a sea view and more space.",
        positives: [
          "Front sea view in premium rooms",
          "More space than super deluxe",
        ],
        watchouts: [],
      },
    },
  "hotel-golden-palace-puri": {
      standard: {
        summary: "Pool-view room.",
        positives: [],
        watchouts: [
          "The pool was poorly maintained or closed in the reviews",
        ],
      },
      larger: {
        summary: "Sea-facing room or suite, with a big balcony and an unobstructed sea view on the 3rd floor.",
        positives: [
          "Big balconies and an unobstructed sea view on the 3rd-floor sea-facing rooms",
        ],
        watchouts: [
          "One family's room (2016) flooded through the balcony windows in a storm",
          "Bathrooms feel cramped",
        ],
      },
    },
  "hotel-konark-puri": {
      standard: {
        summary: "Non-AC or AC double room.",
        positives: [
          "Spacious, clean and airy, with TV, fridge, mosquito nets and jet-spray WCs",
        ],
        watchouts: [
          "No sea view — balconies face the street or neighbours and are grilled against monkeys",
          "Non-AC rooms have no geyser; hot water comes in buckets on request",
        ],
      },
      larger: {
        summary: "3-bed or 4-bed room, or AC suite.",
        positives: [
          "Spacious, clean and airy, with TV, fridge, mosquito nets and jet-spray WCs",
        ],
        watchouts: [
          "No sea view",
        ],
      },
    },
  "hotel-pulin-puri": {
      standard: {
        summary: "Backside or side double; small.",
        positives: [],
        watchouts: [
          "Small, and backside rooms and bathrooms are cramped with no view",
        ],
      },
      larger: {
        summary: "Sea-facing double or 4-bed sea-facing room.",
        positives: [
          "Sea-facing balconies on front rooms",
        ],
        watchouts: [
          "Rooms overall are small",
        ],
      },
    },
  "hotel-shakuntala-palace": {
      standard: {
        summary: "Double-bed AC room.",
        positives: [
          "Spacious and well-kept, with TV, wardrobe, sofa and intercom",
          "Clean bathroom with a 24-hour geyser",
        ],
        watchouts: [
          "No sea view — balconies face neighbouring buildings",
        ],
      },
      larger: {
        summary: "4-bed AC room.",
        positives: [
          "Spacious and well-kept, with TV, wardrobe, sofa and intercom",
          "Clean bathroom with a 24-hour geyser",
        ],
        watchouts: [
          "No sea view — balconies face neighbouring buildings",
        ],
      },
    },
  "hotel-shreehari-puri": {
      standard: {
        summary: "Deluxe with a side sea-view balcony.",
        positives: [
          "Clean, well-decorated, with AC, fridge, kettle, complimentary snacks and a dehumidifier",
          "Clean bathroom",
          "Side sea-view balcony",
        ],
        watchouts: [],
      },
      larger: {
        summary: "Super Deluxe with a front sea-view balcony.",
        positives: [
          "Clean, well-decorated, with AC, fridge, kettle, complimentary snacks and a dehumidifier",
          "Clean bathroom",
          "Front sea-view balcony",
        ],
        watchouts: [],
      },
    },
  "hotel-sonar-bangla-puri": {
      "platinum-double": {
        summary: "Sea-facing Platinum double with a balcony; aesthetic, with a tiny bathroom.",
        positives: [
          "Well-decorated and clean, with a sea-facing balcony, clothes rack, safe, fridge and tea station",
        ],
        watchouts: [
          "Bathroom is very small, like a flight bathroom",
        ],
      },
      "platinum-twin": {
        summary: "Same Platinum block as the double, with the same caveats.",
        positives: [
          "Well-decorated and clean sea-facing Platinum rooms with balconies",
        ],
        watchouts: [
          "Bathroom is very small, like a flight bathroom",
        ],
      },
      "premium-4-bed": {
        summary: "Premium 4-bed with two double beds and a sea-view balcony.",
        positives: [
          "Spacious enough for families, with a sea-view balcony",
        ],
        watchouts: [
          "A bit tight to walk around",
        ],
      },
    },
  "hotel-vijoya-international": {
      standard: {
        summary: "Deluxe double with a semi-circular sea or garden balcony.",
        positives: [
          "Clean and spacious, with a semi-circular balcony over the garden and pool",
        ],
        watchouts: [
          "The AC outdoor unit sits on the balcony and is a bit noisy",
        ],
      },
      larger: {
        summary: "Executive room, or connecting rooms.",
        positives: [],
        watchouts: [],
      },
    },
  "jeevan-sandhya-puri": {
      standard: {
        summary: "AC deluxe with a side view or no sea view.",
        positives: [],
        watchouts: [
          "Deluxe room 215 had dim lighting, a too-low table, flies and mosquitoes, and a balcony facing a neighbouring hotel's kitchen with cooking smells",
        ],
      },
      larger: {
        summary: "Sea-facing 1 BHK with a balcony, as in room 310.",
        positives: [
          "Clean, with a balcony and geyser",
          "Bathrooms clean and spacious",
        ],
        watchouts: [],
      },
    },
  "lotus-eco-resort": {
      standard: {
        summary: "Forest or tree cottage — small, dim and clean, not sea-facing.",
        positives: [
          "Clean wooden AC cottage with hairdryer, geyser and toiletries",
        ],
        watchouts: [
          "Small and dimly lit, and not sea-facing",
        ],
      },
      larger: {
        summary: "Sea-view rooms and 2-storey villas — exteriors only, not reviewed inside.",
        positives: [],
        watchouts: [
          "Interiors were not reviewed; only exteriors were seen",
        ],
      },
    },
  "lucky-india-puri": {
      standard: {
        summary: "Standard double with no sea view.",
        positives: [
          "Clean, modern rooms with glass-shower bathrooms",
        ],
        watchouts: [
          "No sea view",
        ],
      },
      larger: {
        summary: "Sea-view room or suite, with a direct sea view.",
        positives: [
          "Direct sea views",
          "Clean, modern rooms with glass-shower bathrooms",
        ],
        watchouts: [
          "No mini-fridge in a sea-view room despite the price",
        ],
      },
    },
  "nrs-royal-palace-puri": {
      standard: {
        summary: "Non-sea-view room with a partial side sea view.",
        positives: [
          "Very clean, spacious wooden-panelled rooms with king beds, sofa, fridge and tea kit",
          "Large clean bathrooms with geyser and toiletries",
          "A partial side sea view",
        ],
        watchouts: [
          "Only a side view, not a direct sea view",
        ],
      },
      larger: {
        summary: "Premium sea-view room with a large balcony and a direct sea view.",
        positives: [
          "Big balcony with a direct sea view",
          "Very clean and spacious, with a large clean bathroom",
        ],
        watchouts: [],
      },
    },
  "nuanai-nature-camp": {
      standard: {
        summary: "AC Swiss-tent cottage with a fenced veranda and an attached bathroom.",
        positives: [
          "Clean AC Swiss-tent cottage, with a clean attached bathroom (geyser, glass shower)",
        ],
        watchouts: [
          "Cottage doors had no locks",
          "No toothbrush or paste was provided",
        ],
      },
      larger: {
        summary: "Concrete cottage room with a balcony view of the river meeting the sea.",
        positives: [
          "Balcony view of the river meeting the sea",
        ],
        watchouts: [
          "Cottage doors had no locks",
        ],
      },
    },
  "rivera-puri": {
      "deluxe-side-sea": {
        summary: "Room 303 type: spacious and clean, but the side sea view looks over a vacant lot and a construction site, and the bathroom is small.",
        positives: [
          "Spacious and clean, with a king bed, safe and TV",
        ],
        watchouts: [
          "The 'side sea view' looks over a vacant lot and a big construction site next door — guests called it terrible",
          "Bathroom is quite small",
        ],
      },
    },
  "samudra-hotel-puri": {
      "ac-standard": {
        summary: "Basic double AC room seen inside, with a courtyard view or a partial sea view.",
        positives: [
          "Basic but tidy, with a kettle and toiletries",
        ],
        watchouts: [
          "Rooms and bathrooms are basic (plastic chairs, moderately clean bath)",
          "Lower rooms get only a partial sea view between wings, and courtyard rooms have none",
        ],
      },
    },
  "santana-puri": {
      standard: {
        summary: "Non-AC or standard AC room on the ground floor, with no view.",
        positives: [],
        watchouts: [
          "Ground-floor non-AC rooms have no TV, no AC and no view",
        ],
      },
      larger: {
        summary: "AC deluxe with a bathtub, 4-bed AC, or a suite with a sea view.",
        positives: [
          "Very clean and well-decorated",
          "AC deluxe rooms and suites have bathtubs",
          "Suites have a sea view from the bed",
        ],
        watchouts: [],
      },
    },
  "shakti-horizon-puri": {
      standard: {
        summary: "Back-view standard room, with no sea view.",
        positives: [
          "Very clean, modern rooms with balconies",
          "Clean tiled bathrooms with geysers",
        ],
        watchouts: [
          "No sea view",
          "One guest family room looked over buildings, not the sea",
        ],
      },
      larger: {
        summary: "Front sea-facing Super Deluxe, or side sea-view Deluxe.",
        positives: [
          "Very clean, modern rooms with balconies",
          "Front sea-facing or side sea-view",
          "Clean tiled bathrooms with geysers",
        ],
        watchouts: [],
      },
    },
  "sterling-puri": {
      standard: {
        summary: "Basic room with a garden or pool view, and a distant sea view at best.",
        positives: [
          "Clean and modern, with a king bed, kitchenette counter, fridge and kettle",
          "Clean bathroom with a glass shower and hairdryer",
        ],
        watchouts: [
          "Garden or pool view, with only a distant sea view at best",
          "One balcony was left uncleaned",
        ],
      },
      larger: {
        summary: "Premium duplex with two floors and a dining area — not shown inside.",
        positives: [],
        watchouts: [
          "Not shown inside",
        ],
      },
    },
  "the-bay-suites-puri": {
      standard: {
        summary: "Deluxe or Super Deluxe side sea view, with construction next door and some wear and tear.",
        positives: [
          "Rooms have a safe, fridge, kettle and sofa",
          "Spacious, clean bathrooms with glass showers and hairdryers",
        ],
        watchouts: [
          "A big building going up next door will block the side sea view",
          "Damp, peeling paint, wallpaper taped up, dull towels, and a broken bathroom door lock were reported",
        ],
      },
      larger: {
        summary: "Premium front sea-facing room.",
        positives: [
          "Front sea-facing",
        ],
        watchouts: [
          "Maintenance issues were reported in rooms generally (damp, peeling paint, wear and tear)",
        ],
      },
    },
  "yatrinivas-konark": {
      standard: {
        summary: "Deluxe or Executive AC double — basic and clean.",
        positives: [
          "Simple, clean and tidy, with a TV and a geyser",
        ],
        watchouts: [
          "One family said the Executive rooms weren't cozy, the AC didn't cool properly and the bathrooms weren't very clean",
        ],
      },
      larger: {
        summary: "Premium Cottage — spacious and quiet, with a large clean bathroom.",
        positives: [
          "Spacious and quiet, with a kettle, a dining table and a large clean bathroom",
        ],
        watchouts: [],
      },
    },
};
