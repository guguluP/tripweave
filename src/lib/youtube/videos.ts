import type { CuratedVideo } from "./types.ts";

/**
 * Manually curated review videos per stay. Highest-signal vlogs first —
 * no Shorts, no ads, no hotel promo reels when a real stay-review exists.
 *
 * Adding a package later: append an entry here and a matching seed in
 * `seed.ts`. The seed sources and the saved-row cache key both read this map.
 */
export const PACKAGE_VIDEOS: Record<string, CuratedVideo[]> = {
  "taj-puri-resort-spa": [
    {
      videoId: "QRg6kAKT4TY",
      title: "My Luxury Stay at New Taj Puri Resort & Spa",
      channel: "MOinsideHIT",
    },
    {
      videoId: "02dHekawNDk",
      title: "Taj Puri Resort & Spa — honest hotel tour & food review",
      channel: "Bong Passionate Traveller",
    },
    {
      videoId: "809rJTgHVgI",
      title: "Room and property tour of Taj Puri Resort and Spa",
      channel: "Priyassha Bose",
    }
  ],
  "mayfair-heritage-puri": [
    {
      videoId: "kHI7YcZr-uw",
      title: "Mayfair Heritage Puri — room tour, best resort in Puri",
      channel: "Ridhima's Diary",
    },
    {
      videoId: "vqgxX0CC_Us",
      title: "Mayfair Heritage Puri + Mayfair Waves food",
      channel: "AviLini Diaries",
    },
    {
      videoId: "uquuV9tAlo0",
      title: "Mayfair Heritage Puri 2024 — real staying experience",
      channel: "SEN'S NEST",
    }
  ],
  "swosti-premium-beach-resort": [
    {
      videoId: "R8_m_xkYSzQ",
      title: "Is Swosti Premium Puri REALLY Worth New Year 2026? Shocking Truth!",
      channel: "Sanky & Swee Vlogs",
    },
    {
      videoId: "5Gmwnc6B71E",
      title: "Vacation with family at this Luxury Resort In Puri | Swosti Premium Beach Resort",
      channel: "Dipfreeze",
    },
    {
      videoId: "G6R5FNirOcY",
      title: "পুরীর সেরা রিসোর্ট। Swosti Premium Beach Resort Puri. best sea facing hotel in puri.",
      channel: "Katus Lifestyle",
    }
  ],
  "regenta-central-puri": [
    {
      videoId: "SVbg3HhQLes",
      title: "Regenta Central Puri — beach-facing hotel walkthrough",
      channel: "Bristikatha",
    },
    {
      videoId: "nMCyrW5PFWM",
      title: "Hotel Regenta Central, Puri — stay review",
      channel: "Koeli Vlogs 2.0",
    },
    {
      videoId: "I5yaD4NyfTo",
      title: "Regenta Central Puri Odisha — rooms and amenities",
      channel: "Travel With Priya",
    }
  ],
  "hans-coco-palms": [
    {
      videoId: "CeqSkW6Nj5s",
      title: "Best budget luxury hotel in Puri — Hans Coco Palms",
      channel: "Manoj Hela Vlogs",
    },
    {
      videoId: "lRelrKmJ2ME",
      title: "The Hans Coco Palms Beach Resort Puri — sea-facing stay",
      channel: "New Beginnings Pallavi",
    },
    {
      videoId: "C_hvR4UIcDQ",
      title: "Last day at Puri — Hans Coco Palms resort and beach",
      channel: "Mr and Mrs Purohit",
    }
  ],
  "empires-hotel-puri": [
    {
      videoId: "mTgPxwJLB_c",
      title: "first day in Puri Empires Hotel Puri Review",
      channel: "richa kishu vlogs",
    },
    {
      videoId: "6SvH9Hv32DU",
      title: "Experience LUXURY at Affordable Prices in Puri's Empires Hotel",
      channel: "Manoj Hela Vlogs",
    },
    {
      videoId: "k8rcWt78lJc",
      title: "Hotel Empires Puri My Full review",
      channel: "Journeys with Dwivid",
    }
  ],
  "mayfair-waves-puri": [
    {
      videoId: "ix-8HWQ8heg",
      title: "MAYFAIR Waves | Sea facing Luxury 5-Star Hotels in Puri",
      channel: "Review Wala",
    },
    {
      videoId: "ov0TpiWVKGg",
      title: "Mayfair waves resort, Puri, Odisha : Room tour",
      channel: "Monica Explains",
    }
  ],
  "toshali-sands-puri": [
    {
      videoId: "6Hl1vtib7GE",
      title: "TOSHALI SANDS PURI | Hotel Tour | PURI HOTELS | Odisha | Mustaq Sharif",
      channel: "MUSTAQ SHARIF",
    },
    {
      videoId: "RahjVg0t6nk",
      title: "Toshali Sands Puri private beach | Short visit to Puri | Day 4",
      channel: "Travel With TAGS",
    },
    {
      videoId: "ZOCBaU2Ignk",
      title: "TOSHALI SANDS RESORT// Cottage tour// Resort tour//puri resort",
      channel: "Create world vlogs",
    }
  ],
  "chariot-resort-puri": [
    {
      videoId: "pjy6OOe03wk",
      title: "A day in a Luxurious Hotel Near Sea Beach || The Chariot Resort & Spa",
      channel: "MOinsideHIT",
    },
    {
      videoId: "6pPT0cJmWuM",
      title: "A day in a Luxurious Hotel Near Sea Beach || The Chariot Resort & Spa Puri",
      channel: "Model Soumya Odia Vlogs",
    }
  ],
  "chanakya-bnr-puri": [
    {
      videoId: "puMmF_hN0Ic",
      title: "The Chanakya BNR Hotel Puri: India’s Most Iconic Heritage Luxury Stay!",
      channel: "Bong Passionate Traveller",
    },
    {
      videoId: "BZYN7wUZe8w",
      title: "Relaxing stay in Chanakya BNR Hotel Puri — Best Railway Heritage Hotel",
      channel: "Aalsee Riders",
    },
    {
      videoId: "zDBoax8k2qU",
      title: "Chanakya BNR Hotel Puri 2024 | The only Railway Theme Hotel in India",
      channel: "Embrace D'ordinaire",
    }
  ],
  "mahodadhi-palace-puri": [
    {
      videoId: "PZW2ibNBPv8",
      title: "Mahodadhi Palace Tour | Best Heritage Hotel In Puri",
      channel: "Backpacking With My Lens",
    },
    {
      videoId: "cYaF0LtwZ4k",
      title: "Stay at Mahodadhi Palace and Patrapada Chingudi",
      channel: "Food Drifter",
    }
  ],
  "holiday-resort-puri": [
    {
      videoId: "Wfvplc69Yio",
      title: "Budget Friendly Luxury Staycation in Puri | Hotel Holiday Resort Full Tour + Room Review",
      channel: "Food Travel Camp",
    },
    {
      videoId: "_GCIo7ETCp8",
      title: "Holiday Resorts, Puri - Room Tour & Review | Beachside Stay in Odisha!",
      channel: "Monica Explains",
    }
  ],
  "new-shankar-international": [
    {
      videoId: "i8an5CM6pFY",
      title: "Hotel New Sankar International PURI, Odisha India. Hotel Review.",
      channel: "TourFlyer",
    },
    {
      videoId: "li8xU2aZy6E",
      title: "Hotel New Shankar International | Puri , Odisha | Honeymoon ❤️ | DeTo Vlogs |",
      channel: "DeTo Vlogs",
    },
    {
      videoId: "mb_CbblYs6o",
      title: "Hotel New Shankar International, Puri, Odisha , India. #puri #nearseabeach #hotelnearseabeach",
      channel: "Babita Mishra",
    },
  ],
  "niladri-premium-puri": [
    {
      videoId: "K9fnbagwvtU",
      title: "Puri's Best Sea view hotel Niladri Premium honest review 2026",
      channel: "AB from Kutch",
    },
    {
      videoId: "yHdbPDHo6F8",
      title: "Expert Traveler Reveals BEST Budget Hotel In Puri | Hotel NILADRI PREMIUM Puri",
      channel: "Manoj Hela Vlogs",
    },
    {
      videoId: "VN5k5TuWatI",
      title: "Budget hotel in Puri || Hotel Niladri Premium Price || Room tour || Food",
      channel: "Sudipta's World",
    }
  ],
  "blue-lily-puri": [
    {
      videoId: "0ehsdcqVN84",
      title: "Best Budget Luxury Hotel In Puri | Puri Budget Hotel Near Sea Beach | Blue Lily Beach Resort l Ep- 2",
      channel: "Manoj Hela Vlogs",
    },
    {
      videoId: "i4WJ7o5qjMY",
      title: "Blue Lily Beach Resort Puri/Best Sea Facing Hotel In Puri/Puri Hotel Near Sea Beach/Puri Hotel Price",
      channel: "The BoNg LifeStyle",
    },
    {
      videoId: "5L8C7oeOtjY",
      title: "Hotel Blue Lily Beach Resort Puri🌊🏖️ // Puri Hotel // Luxurious Hotel near Sea beach Puri 🏝️",
      channel: "Sreya Bagchi",
    },
    {
      videoId: "v-AzymELTS8",
      title: "Puri Hotel Blue Lily Resort ⛵",
      channel: "Vivek_travel_vlog",
    }
  ],
  "camellia-puri": [
    {
      videoId: "VJRUHjfJ2HQ",
      title: "Hotel Camellia Puri/Best Sea Facing Hotels In Puri/Puri Sea Facing hotels/Puri Hotel Near Sea Beach.",
      channel: "The BoNg LifeStyle",
    },
    {
      videoId: "ttaumKf9wzY",
      title: "#puri //Camellia Hotel & Resort’s-near Puri sea beach//sea facing hotels in Puri/hotel review",
      channel: "WanderLust Weaver",
    },
    {
      videoId: "7wqn_0p_APU",
      title: "পুরীতে সমুদ্রের একদম সামনে LUXURY Hotel সুইমিংপুল সহ | CAMELLIA HOTEL & RESORT #puri #purihotel",
      channel: "THE VLOG FLASKET",
    },
    {
      videoId: "P73hovLdAYI",
      title: "Camellia Hotel & Resort Puri 🏨 | Puri Hotel with Swimming Pool | Sea Facing Hotel Near Swargadwar",
      channel: "ROADWAYS VLOG",
    }
  ],
  "dreamland-puri": [
    {
      videoId: "tFmRjkQbui0",
      title: "Hotel Dreamland Puri Review | Budget Sea Facing Hotel Near Puri Beach I Puri Vlog",
      channel: "Beeing MB",
    },
    {
      videoId: "HCRh1ZKCfOI",
      title: "Hotel Dreamland Puri || Sea Facing Hotels || New Marine Drive || Hotel for unmarried couple & family",
      channel: "Beyond Check-in",
    },
    {
      videoId: "fGg42VGrp1Q",
      title: "Hotel Dreamland Puri/Best Sea Facing Hotel In Puri/Puri Hotels Near Sea Beach/Puri Sea Facing Hotels",
      channel: "The BoNg LifeStyle",
    },
    {
      videoId: "NPmRiUHiG4Y",
      title: "Best Sea Facing Hotel in Puri || Hotel Dreamland Puri || Puri Low Budget Hotel near Sea || Puri Tour",
      channel: "Terrific Twos",
    }
  ],
  "fortune-beachfront-puri": [
    {
      videoId: "l2RM3KkH4Sw",
      title: "ITC Fortune Beachfront Hotel Puri| Hotel review|Good hotel in Puri| Puri good hotel",
      channel: "Travel Food and Life",
    },
    {
      videoId: "WgWpVZ9CedI",
      title: "ITC Fortune Beachfront Puri II Sea facing hotel #seafacinghotel #Monsoon2025",
      channel: "Travelisbae",
    },
    {
      videoId: "3HFyFng_VxE",
      title: "Fortune Beachfront, Puri - Member ITC's hotel group | Luxury 5 Star Hotel at Golden Beach in Puri",
      channel: "Prachi Gupta Diaries",
    }
  ],
  "golden-dust-puri": [
    {
      videoId: "qY99v29Yzvw",
      title: "Best Hotel Near Puri Beach | Puri Tour 2023 | Hotel Golden Dust Royal Puri | Puri Bengali Vlog",
      channel: "Sayel's Stories",
    },
    {
      videoId: "B7nnI-SroQM",
      title: "Hotel Golden Dust Royal Puri | Sea facing hotel | Best budget hotel | Marine drive Puri",
      channel: "Priyanshi Creativity",
    }
  ],
  "golden-tree-puri": [
    {
      videoId: "ccLx-AePqPY",
      title: "Hotel Golden Tree Puri | Best Sea Facing Hotel | Puri Hotel Near Sea Beach | Nimantran | Saptapadi",
      channel: "Wander with DebRitu",
    },
    {
      videoId: "DnED3eBpPHo",
      title: "Hotel Golden Tree Puri | Puri Sea Facing Hotel | Puri Sea Beach | Petuk Bhoboghure",
      channel: "Petuk Bhoboghure(পেটুক ভবঘুরে)",
    },
    {
      videoId: "81T4s6N3B_c",
      title: "Hotel Golden Tree Puri/Best Sea Facing Hotel In Puri/Puri Sea Facing Hotel/Puri Hotel Near Sea Beach",
      channel: "Aliza Review & Vlogs",
    }
  ],
  "hotel-bishnu-bhaban": [
    {
      videoId: "GzyMWLpukVE",
      title: "Jagannath Puri Bishnu Bhawan hotel || जगन्नाथ पुरी में कहा रुके || Jagannath Puri series || Ep :- 2",
      channel: "Mizaaj-e-Awadh",
    },
    {
      videoId: "kRU3GieZ9-4",
      title: "Puri Bishnu Bhawan Lodge || Puri Hotel Near Jagannath Temple || Puri Hotels 2025 ||",
      channel: "Explore with Ishita",
    }
  ],
  "hotel-deluxe-konark": [
    {
      videoId: "7MrrxLTpYVs",
      title: "How Costly is Konark | Hotel Hunt Near Konark Sun Temple |",
      channel: "Lone Ranger Traveler",
    },
  ],
  "hotel-golden-palace-puri": [
    {
      videoId: "X028p3x6Res",
      title: "Hotel Golden Palace Puri Stay Review | Day 2 travel Vlog",
      channel: "Ananya The Super Woman",
    },
    {
      videoId: "u80hpWXlWqs",
      title: "Hotel Golden Palace Puri || Luxurioys Hotel In Puri With Private Beach And Pool || Hotel Review",
      channel: "Mita's Diary",
    },
    {
      videoId: "2encoB1ToYc",
      title: "Hotel Golden Palace Puri Sea View Rooms 🌅 Don't Book before watching this! বারান্দা থেকেই সমুদ্র!",
      channel: "Bong Passionate Traveller",
    }
  ],
  "hotel-konark-puri": [
    {
      videoId: "nW6U0pxT-Ro",
      title: "Puri Hotel near Swargadwar,Temple Hotel Konark।পুরির স্বর্গদ্বার ও মন্দিরের কাছাকাছি হোটেল কোনার্ক",
      channel: "Mapple",
    },
    {
      videoId: "HrX2mPN81D0",
      title: "Hotel Konark Puri| Low budget hotel near puri swargadwar sea beach| Budget hotel in puri | Vlog-43",
      channel: "a2z Vlogs",
    },
    {
      videoId: "Wi_S2_M6Nr8",
      title: "PURI HOTEL KONARK || BESIDE KAKATUA || BEST BUDGET FRIENDLY HOTEL ROOMS #puri #vlog",
      channel: "Hrit Explorer",
    }
  ],
  "hotel-new-sea-hawk": [
    {
      videoId: "0EDhoMqCI50",
      title: "পুরীতে হোটেল নিউ সি হক | Hotel New Sea Hawk | Puri",
      channel: "Sayantan Gupta",
    },
    {
      videoId: "dFq0_9B51XE",
      title: "Hotel Sea Hawk Puri/Best Sea Facing Hotel In Puri/Puri Hotels Near Sea Beach/Puri Sea Facing Hotels.",
      channel: "Travel With Priyanka",
    },
    {
      videoId: "JnZ53IC9BbQ",
      title: "একদম সত্যি বিস্ময়কর 😱রিভিউ হোটেল নিউ সি হক পুরী।genuine review of hotel new sea hawk puri June 2023",
      channel: "Probasi Dipika",
    }
  ],
  "hotel-prabhupada-puri": [
    {
      videoId: "Ede4RjKffjA",
      title: "Puri Tour 2026 | Hotel Prabhupada Review | Puri Sea Facing Hotels | Puri Jagannath Mandir Darshan",
      channel: "Wanderer Writam",
    },
    {
      videoId: "-2hW3eAAjaQ",
      title: "Puri Sea facing Hotels||Puri Tour 2026||Hotel Prabhupada Puri Review||Puri Jaganath Mandir Darshan",
      channel: "Roy's Journey",
    },
    {
      videoId: "peShjA_FycY",
      title: "Best hotel in Odisha | Hotel Prabhupada | Hotel review | Laid back hotel in New Marine Drive Puri",
      channel: "Vagabond - Travel with a Purpose",
    }
  ],
  "hotel-pulin-puri": [
    {
      videoId: "J9MnCrFSVzk",
      title: "Room থেকে সমুদ্র দেখা | Hotel Pulin Puri | Puri Tour 2024 | #puri #viral #trending| @passionofJoy",
      channel: "Passion Of Joy",
    },
    {
      videoId: "4rmsVNl2Fpg",
      title: "Don't Ruin Your Puri Trip: Hotel Pulin Puri Honest Review || The Black Beauty||ShirshaGuha|| #puri",
      channel: "The Black Beauty",
    },
    {
      videoId: "jUnGRb0RkFk",
      title: "Hotel Pulin Puri/Puri Best Hotel Near Sea Beach/Puri Sea Facing Hotel Near Beach/Puri Hotel Booking.",
      channel: "The BoNg LifeStyle",
    },
    {
      videoId: "q81YVzs2Jls",
      title: "Puri 2025 / Pulin Puri Hotel / Puri sightseeing / পুরী ভ্রমণ ২০২৫/ পুলিন পুরী হোটেল",
      channel: "Ipshita",
    }
  ],
  "hotel-shakuntala-palace": [
    {
      videoId: "_pqkl7Sk_og",
      title: "Hotel Shakuntala Palace Puri l Room Review Of Shakuntala Palace l Sea Beach Hotel l #puri",
      channel: "Avika's Vlog💞",
    }
  ],
  "hotel-shreehari-puri": [
    {
      videoId: "QJsQhk8fdVg",
      title: "পুরীর নিউ মেরিন ড্রাইভে প্রিমিয়াম হোটেল | puri hotel | hotel shreehari | রুম ট্যুর ট্যারিফ মেনু",
      channel: "enjoy life with PINKY",
    },
    {
      videoId: "CuPKtMwszDs",
      title: "Puri Trip 2025 || Kolkata To Puri By Vande Bharat || Vande Bharat Meal || Hotel Shree Hari Room Tour",
      channel: "Smile With Shrabs",
    },
    {
      videoId: "Oh2NxISYJig",
      title: "Puri Sea Facing Hotels | Hotel Shree Hari Review | Puri Tour 2026 | Puri Hotel near Swargadwar Beach",
      channel: "Petuk Bhoboghure(পেটুক ভবঘুরে)",
    }
  ],
  "hotel-sonar-bangla-puri": [
    {
      videoId: "skQ1XDp1Lzc",
      title: "Hotel Sonar Bangla Puri Review 2026 | Room, Food & Price",
      channel: "Between Stops",
    },
    {
      videoId: "pQHcqcxIsug",
      title: "🌊 Best Sea-Facing Budget Hotel in Puri? | Sonar Bangla Puri Review | Room, Food & Price! Puri EP 2",
      channel: "Arjun’s Eye",
    },
    {
      videoId: "T19IEMcssxg",
      title: "Hotel Sonar Bangla Puri Full Tour 2025 🏖 | Honest Review + Room Tour | The Sunny Days",
      channel: "The Sunny Days",
    },
    {
      videoId: "qu1Z5DsVS5A",
      title: "Hotel sonar bangla puri | puri sea facing hotel | Best sea view hotel in puri",
      channel: "Priyanka Modak Vlog",
    }
  ],
  "hotel-vijoya-international": [
    {
      videoId: "16kf8uS-XHM",
      title: "Vlog-78 | Day-1 | Puri vlog | hotel vijoya international | golden beach | light house | swargadwar |",
      channel: "It’s I Charlie “Sayan”",
    },
    {
      videoId: "h6FFilODPdY",
      title: "🌊 Puri Beach Vlog | Vijoya International Hotel Stay | Fun Day in Puri Odisha",
      channel: "Trupti's Dreamy Diary🪷",
    },
    {
      videoId: "T1EmR6jNN18",
      title: "Budget Freindly Luxurious Hotel At Puri | Niladri Garden and Beach | Hotel Vijaya International Puri",
      channel: "Simply Tour and Travels",
    },
    {
      videoId: "wA7RQZiRI4o",
      title: "Hotel Vijoya international |Puri beach -Sun rise",
      channel: "Explore with PariDS",
    }
  ],
  "jeevan-sandhya-puri": [
    {
      videoId: "Re4CZMllJVY",
      title: "আবার পুরী চললুম😃Hotel Jeevan Sandhya Room tour। হাওড়া - পুরী superfast express review #BanglaVlog",
      channel: "Mamma & More",
    },
    {
      videoId: "bb2HLHG1cNI",
      title: "পুরী বিচের শেষপ্রান্তে থাকার অভিজ্ঞতা | Puri Hotel | Beach side Hotel | Hotel Jeevan Sandhya",
      channel: "AQube Vlog",
    },
    {
      videoId: "nZGLETP3a00",
      title: "Puri Hotel Near Sea Beach||Hotel Jeevan Sandhya Inn Puri P-2||Best Hotel In Puri||Puri Budget Hotel",
      channel: "Roy's Journey",
    }
  ],
  "lotus-eco-resort": [
    {
      videoId: "wcorwGb22h4",
      title: "WE STAYED IN A BEACH COTTAGE IN KONARK || BEST BEACH VIEW RESORT IN KONARK || LOTUS ECO RESORT",
      channel: "Tipsy Bong Travellers",
    },
    {
      videoId: "6E62ZEEGcwY",
      title: "🌊 Konark Beach Resort Tour 2026 | Lotus Eco Beach Resort | Puri Budget Stay | Bengali Vlog",
      channel: "Gublusdiary2502",
    },
    {
      videoId: "qZhXCgbJEo8",
      title: "Lotus ECO Resort Konark : Ultimate Beach Side Cottage Lifestyle",
      channel: "Jayesh Mahato",
    },
    {
      videoId: "ai_6xbewxRo",
      title: "Lotus Eco Resort Konark || Beach view Resort in Odisha || The Best Place to stay in Konark & Puri ||",
      channel: "Shiningvlogs",
    }
  ],
  "lucky-india-puri": [
    {
      videoId: "wBmAu-K6Oik",
      title: "Exploring Puri (Golden beach puri,  Baliapada beach, Hotel Lucky India)",
      channel: "Journeywithrio",
    },
    {
      videoId: "7lB-ZLIspqE",
      title: "PURI HOTEL LUCKY INDIA | PURI SEA FACING HOTEL |পুরী হোটেল বুকিং | BEST LUXURY HOTEL IN PURI",
      channel: "Travelsri",
    },
    {
      videoId: "UYhD4Yyv23o",
      title: "Lucky India Hotel Puri | Puri Hotel near Swargadwar Sea beach | Sea view Rooms | Puri Tour | Luxury",
      channel: "The Bong Content Factory",
    }
  ],
  "nrs-royal-palace-puri": [
    {
      videoId: "xAojoSvffTA",
      title: "Weekend Trip to Puri ll Best Sea Facing Hotel in Puri ll NRS Royal Palace ll Blue Flag Beach 🌊🏖️",
      channel: "Joy's Food & Travel Vlog",
    },
    {
      videoId: "RttZp0Zbrno",
      title: "NRS Royal Palace Hotel Puri Orissa #puri #puribeach #purifood #purihotel #puridham#hotelreview#hotel",
      channel: "Travel Adda Wid Shree",
    },
    {
      videoId: "RnVr4tnYKjg",
      title: "PURI VLOG🎉🎊 NRS ROYAL PALACE Hotel Review// New Rules of VANDE BHARAT😳 🚄😳।। অসাধারণ অভিজ্ঞতা ।।🥳🎊🚄",
      channel: "SUDESHNA  SANTANU'S VLOG",
    },
    {
      videoId: "GTVkclSH9Tw",
      title: "NRS Royal Palace Puri Hotel Review 🏨 | Room Tour, Stay Experience & More | #chiniminiblog #puri",
      channel: "Chini Mini Blog",
    }
  ],
  "nuanai-nature-camp": [
    {
      videoId: "9CojuWXNljM",
      title: "HIDDEN GEM near Puri 😍 Nuanai Nature Camp | Offbeat Odisha | Kolkata Weekend Trip Kolkata to Puri",
      channel: "Souradip Adventures",
    },
    {
      videoId: "gx1sypAkD5o",
      title: "Nuanai Nature Camp Part-1......... Look into the Description box for more details.",
      channel: "The Silent Vlogger",
    },
    {
      videoId: "juiW4dae_bE",
      title: "পুরীর এক জনমানবহীন স্বপ্ন সৈকত.Nuanai Nature Camp near Puri,Virgin Sea Beach of Puri.",
      channel: "Hariye Jawar Golpo",
    },
    {
      videoId: "iJNNAuTan1M",
      title: "BALUKHADA KONARK SANCTUARY //NATURE CAMP NUANAI//ODISHA",
      channel: "Biswaranjan Das Odia Vlog",
    }
  ],
  "om-leisure-satapada": [
    {
      videoId: "unMtoR2-gJM",
      title: "Om leisure Resort (Chilika), satapada hotel Room tour. #odiavlog #youtuvlogs #youtube",
      channel: "Debasmita vlogs",
    },
  ],
  "panthanivas-konark": [
    {
      videoId: "J2r8iqn1pwA",
      title: "One of the Luxurious Hotel of Konark | Budget Hotel in Konark | OTDC Yatrinivas, Konark, Odisha",
      channel: "TimeTravelExpress",
    },
    {
      videoId: "smjqwxLsy-4",
      title: "My Stay in Indian Govt. Hotel  भारत के सरकारी होटल ऐसे होते हैं",
      channel: "Aayansh Aryaman",
    },
    {
      videoId: "727LRMcVVdI",
      title: "Road Trip to Konark By Car // Konark OTDC Panthanivas // Konark Sun Temple // Chandrabhaga Beach",
      channel: "𝙀𝙭𝙥𝙡𝙤𝙧𝙚𝙧𝙆𝙪𝙢𝙖𝙧𝙟𝙞𝙩",
    },
  ],
  "panthanivas-satapada": [
    {
      videoId: "1Io9LYGHKgY",
      title: "Yatri Nivas Satapada Room Tour : OTDC : Perfect Destination For Nature Lover",
      channel: "Off Route Traveller",
    },
    {
      videoId: "nfNSLSoYlvM",
      title: "Kolkata to Satapada Drive | Yatri Nivas Satapada | OTDC",
      channel: "Travel With TAGS",
    },
    {
      videoId: "ss8OnRQcr8c",
      title: "Chilika Lake Odisha | OTDC Panthanivas Satapada | Kolkata to Puri bike ride Day 2 @explorerpals",
      channel: "Explorer Pals",
    },
    {
      videoId: "e9xHsmXYuQ0",
      title: "Yatri Nivas Satpada, Puri, Odisha (OTDC) | Dream Destination Tour | Satya Bhanja",
      channel: "Satya Bhanja",
    },
  ],
  "rivera-puri": [
    {
      videoId: "yKIxELdrjzQ",
      title: "হোটেলে পৌঁছে অনেক কষ্টে পেলাম একটা রুম😒|Hotel Rivera room tour|সন্ধেবেলা চলে গেলাম shopping করতে|",
      channel: "Srabonti Basu",
    },
    {
      videoId: "CJrXHEU9JqU",
      title: "Puri Sea Facing Hotel | Hotel Rivera | Puri Hotel Near Lighthouse Beach Budget Hotel",
      channel: "Rubi Saju Daily Life",
    },
    {
      videoId: "QrRG9ykYQWk",
      title: "Reviewing Hotel Room | Direct Booking Hotel Deal | Hotel Rivera | Hotel Rivera Puri | Puri Hotel",
      channel: "Food.Travel.Review With Smita↑",
    }
  ],
  "samudra-hotel-puri": [
    {
      videoId: "3QV84wcExPQ",
      title: "Puri Hotel | Hotel Samudra | Puri Sea Beach Hotel | Best Sea Facing Hotel In Puri",
      channel: "The SunshineBox",
    },
    {
      videoId: "-4XKA5WO7DM",
      title: "Stay in💖 Hotel Samudra  in Puri Vlog02 #dailyvlog #LifestyleVlog#IndianVlogger#TravelVlog",
      channel: "Mast Mast Masti",
    }
  ],
  "santana-puri": [
    {
      videoId: "g3FgSNwW9X8",
      title: "Hotel New Santana Puri - A Detailed Vlog. AC rooms starting at only 1500 INR. Very reasonable.",
      channel: "The Explorite",
    },
    {
      videoId: "AomXZuRlcAM",
      title: "Puri Hotel Review 2024 || Explore Room || All Details || Best Hotel In Puri || Hotel SANTANA ||",
      channel: "Pran's Vlog (Mon_Pran)",
    },
    {
      videoId: "rLv52L4nj2s",
      title: "Best with cheapest hotel in puri// hotel santana/ct road/ puri/inside parking available",
      channel: "BLOG WITH MITHUN 905",
    },
    {
      videoId: "tMUQfCR3FVQ",
      title: "এটা হোটেল না প্রাসাদ চলুন একটু ঘুরে দেখি।।পুরীর হোটেল Santana review ..",
      channel: "Champa Halder",
    }
  ],
  "shakti-horizon-puri": [
    {
      videoId: "yLHW-FlJ1ZI",
      title: "Family Vacation from Kolkata to Puri by Road | Hyundai Venue | Shakti Horizon",
      channel: "Debarshi Video Diary",
    },
    {
      videoId: "d4RA4ok6i2k",
      title: "Hotel Shakti Horizon, Hotel New Horizon | Puri sea facing hotel | Puri hotel near beach | Puri hotel",
      channel: "Explorer Bhowmik",
    }
  ],
  "sidharth-inn-puri": [
    {
      videoId: "SpLm5pnmNKA",
      title: "Treebo Trend Sidhartha Inn Baliapanda, Puri, Odisha",
      channel: "Mayukh Sen",
    },
  ],
  "sterling-puri": [
    {
      videoId: "KvcTdIi_xSw",
      title: "Sterling Puri | 17000 INR WORTH IT OR NOT  | Orrisa Vlogs",
      channel: "Stuti Gogia",
    },
    {
      videoId: "XMPQA9rXTcI",
      title: "REVIEW OF STERLING PURI | PET FRIENDLY RESORT IN PURI | PET POLICY & ROOM TOUR",
      channel: "Mady the golden",
    },
    {
      videoId: "jqaxVg_YjE8",
      title: "This is The REAL Trurth behind SO CALLED Sterling Puri !! 5 Star or 1 Star?? Honest Experience",
      channel: "Sayel's Stories",
    }
  ],
  "the-bay-suites-puri": [
    {
      videoId: "ytIrKwATgls",
      title: "The Bay Suites puri | Jagannath puri budget staycation vlog | exploring Jagannath puri 😇",
      channel: "Rashmi Singh",
    },
    {
      videoId: "1Kz7LxyeXjg",
      title: "The Bay Suites | Puri Hotel | Near Lighthouse | Sea facing & Swimming Pool.",
      channel: "Travel with Appy { Avik & Aparna }",
    }
  ],
  "the-eastern-dham": [
    {
      videoId: "S_Divjhn7N0",
      title: "Puri Hotel With Sea View | Budget Hotel In Puri | Puri Sea View Room | Couple Room In Puri Sea View",
      channel: "Asansol Vibes",
    },
  ],
  "treebo-siddharth-puri": [
    {
      videoId: "BHLEQ77u5CI",
      title: "Hotel in puri with breakfast!! Hotel review! baliapanda! puri hotel! room tour! hotel vlog! Treebo",
      channel: "The crazy camper",
    },
    {
      videoId: "azcZLhaqR8U",
      title: "#siddharth international hotel puri#travalingvlog #bengalivlogs #banglavlogs#thadeboshree'sworld",
      channel: "Debashree world",
    }
  ],
  "white-sands-puri": [
    {
      videoId: "Ot08eoGB2pc",
      title: "Hotel White Sands Puri || Hotel Review || Bangla Vlog || Payel Bhattacharjee ||",
      channel: "A drop of HAPPY-ness",
    },
  ],
  "yashasvi-inn-puri": [
    {
      videoId: "ERIQo_J6YbE",
      title: "Hotel Yashasvi Inn, Puri | Puri Hotel | Puri Hotel Near Beach | Puri Hotel in Bengali | Hotel Price",
      channel: "ভ্রমন স্বর্ণদীপ | Bhraman Swarnadeep",
    }
  ],
  "yatrinivas-konark": [
    {
      videoId: "nyquZNOPZiM",
      title: "Konark Sun Temple // Konark OTDC Yatrinivas // Chandrabhaja sea Beach // Konark Sun Temple history",
      channel: "𝙀𝙭𝙥𝙡𝙤𝙧𝙚𝙧𝙆𝙪𝙢𝙖𝙧𝙟𝙞𝙩",
    },
    {
      videoId: "fftDwKsgMIU",
      title: "Konark Yatri Niwas , Konark , Odisha , India",
      channel: "পথে পথে ভ্রমণ",
    },
    {
      videoId: "CMR04tHeyao",
      title: "OTDC Yatrinivas , Konark , Odisha , India , 2022",
      channel: "rajasree sanjoy",
    },
    {
      videoId: "PKoQ41-IqeQ",
      title: "OTDC Yatrinivas Konark | Premium & Executive Room | Big Area Big Room",
      channel: "Inland Trotter",
    }
  ],
};

export function videosForPackage(packageId: string): CuratedVideo[] {
  return PACKAGE_VIDEOS[packageId] ?? [];
}

export function videoHash(packageId: string): string {
  const ids = videosForPackage(packageId)
    .map((v) => v.videoId)
    .join(",");
  return `${packageId}:${ids}`;
}
