import { useEffect, useSyncExternalStore } from "react";

/** Guest-facing labels only. Desk screens stay English. Official rule sentences stay English. */
export type GuestLocale = "en" | "hi";

const KEY = "tw-guest-locale";

const EN = {
  langEnglish: "English",
  langHindi: "Hindi",
  intro:
    "Names must match the passport or government ID you will show at the desk. After you pay, we keep only the last 4 characters of the ID number until 14 days after checkout, then delete guest details.",
  nationality: "Nationality (as on passport)",
  mobile: "Mobile (with country code)",
  mobileHelp: "Used only for this stay. The hotel may call you on arrival day.",
  visiting: "Visiting from abroad? You will need your passport at check-in. See the arrival checklist.",
  passportHint: "Most visitors use their passport.",
  copyLead: "Copy from guest 1",
  checklistTitle: "Arriving from abroad",
  checklistPrompt: "Flying in from abroad? Pick each guest's nationality to see what India requires.",
  unofficial: "Unofficial translation",
  emailChecklist: "Email me this checklist",
  emailSent: "Checklist sent to your sign-in email.",
  emailFailed: "Could not send the checklist.",
  savedPeople: "Saved people",
  savedUse: "Use these details",
  savedSave: "Save this guest",
  savedSaved: "Saved for next time.",
  savedDelete: "Delete",
  savedConfirm: "Check the name, then fill the card. Nothing is saved as a passport number.",
  scanPassport: "Scan passport",
  scanReading: "Reading the passport…",
  scanFail: "Could not read that photo. Type the details instead.",
  checkDigitsOk: "Check digits OK",
  expiryWarn: "Passport expires within 6 months of arrival",
  discard: "Discard",
  oci: "I hold an OCI card",
  priorVisa: "I have previously held an Indian visa or e-Visa",
  arrivalTitle: "Arrival details (optional)",
  arrivedFrom: "Arrived from",
  arrivalTime: "Expected arrival time",
  purpose: "Purpose of visit",
  previousStay: "Previous place of stay",
  nextDestination: "Next destination",
  purposeChoose: "Choose",
  purposeTourism: "Tourism",
  purposeBusiness: "Business",
  purposeEmployment: "Employment",
  purposeMedical: "Medical",
  purposeStudent: "Student",
  purposeConference: "Conference",
  purposeOthers: "Others",
  fullName: "Full name (as on ID)",
  idType: "ID type",
  idNumber: "ID number",
  dob: "Date of birth",
  email: "Email",
  emergencyShow: "Add an emergency contact (optional)",
  emergencyHide: "Hide emergency contact",
  contactName: "Contact name",
  guest: "Guest",
  lead: "lead",
  phoneCountry: "Country code",
  nationalNumber: "National number",
  askTitle: "Ask TripWeave",
  askPlaceholder: "Ask about the checklist. Do not paste a passport or visa number.",
  askSend: "Ask",
  askOff: "Ask TripWeave is off on this server.",
  askFailed: "Could not answer that.",
  askLimited: "Try again in an hour.",
  askNoDocuments: "Leave out passport and visa numbers.",
} as const;

const HI: Record<keyof typeof EN, string> = {
  langEnglish: "English",
  langHindi: "हिन्दी",
  intro:
    "नाम उसी पासपोर्ट या सरकारी पहचान पत्र से मेल खाने चाहिए जो आप डेस्क पर दिखाएँगे। भुगतान के बाद हम पहचान संख्या के केवल अंतिम 4 अक्षर चेकआउट के 14 दिन बाद तक रखते हैं, फिर अतिथि विवरण हटा देते हैं।",
  nationality: "राष्ट्रीयता (पासपोर्ट के अनुसार)",
  mobile: "मोबाइल (देश कोड के साथ)",
  mobileHelp: "केवल इस ठहराव के लिए। होटल आगमन के दिन आपको कॉल कर सकता है।",
  visiting: "विदेश से आ रहे हैं? चेक-इन पर पासपोर्ट चाहिए। आगमन सूची देखें।",
  passportHint: "अधिकतर आगंतुक अपना पासपोर्ट इस्तेमाल करते हैं।",
  copyLead: "अतिथि 1 से कॉपी करें",
  checklistTitle: "विदेश से आगमन",
  checklistPrompt: "विदेश से उड़ान भर रहे हैं? भारत की शर्तें देखने के लिए हर अतिथि की राष्ट्रीयता चुनें।",
  unofficial: "अनौपचारिक अनुवाद",
  emailChecklist: "यह सूची मुझे ईमेल करें",
  emailSent: "सूची आपके साइन-इन ईमेल पर भेज दी गई है।",
  emailFailed: "सूची नहीं भेजी जा सकी।",
  savedPeople: "सहेजे गए लोग",
  savedUse: "ये विवरण उपयोग करें",
  savedSave: "इस अतिथि को सहेजें",
  savedSaved: "अगली बार के लिए सहेजा गया।",
  savedDelete: "हटाएँ",
  savedConfirm: "नाम जाँचें, फिर कार्ड भरें। पासपोर्ट संख्या सहेजी नहीं जाती।",
  scanPassport: "पासपोर्ट स्कैन करें",
  scanReading: "पासपोर्ट पढ़ा जा रहा है…",
  scanFail: "यह फ़ोटो नहीं पढ़ी जा सकी। विवरण टाइप करें।",
  checkDigitsOk: "जाँच अंक सही हैं",
  expiryWarn: "पासपोर्ट आगमन के 6 महीने के भीतर समाप्त हो रहा है",
  discard: "छोड़ें",
  oci: "मेरे पास OCI कार्ड है",
  priorVisa: "मेरे पास पहले भारत का वीज़ा या ई-वीज़ा रहा है",
  arrivalTitle: "आगमन विवरण (वैकल्पिक)",
  arrivedFrom: "कहाँ से आए",
  arrivalTime: "संभावित आगमन समय",
  purpose: "यात्रा का उद्देश्य",
  previousStay: "पिछला ठहराव",
  nextDestination: "अगला गंतव्य",
  purposeChoose: "चुनें",
  purposeTourism: "पर्यटन",
  purposeBusiness: "व्यापार",
  purposeEmployment: "रोज़गार",
  purposeMedical: "चिकित्सा",
  purposeStudent: "अध्ययन",
  purposeConference: "सम्मेलन",
  purposeOthers: "अन्य",
  fullName: "पूरा नाम (पहचान पत्र के अनुसार)",
  idType: "पहचान का प्रकार",
  idNumber: "पहचान संख्या",
  dob: "जन्म तिथि",
  email: "ईमेल",
  emergencyShow: "आपातकालीन संपर्क जोड़ें (वैकल्पिक)",
  emergencyHide: "आपातकालीन संपर्क छिपाएँ",
  contactName: "संपर्क का नाम",
  guest: "अतिथि",
  lead: "मुख्य",
  phoneCountry: "देश कोड",
  nationalNumber: "राष्ट्रीय संख्या",
  askTitle: "ट्रिपवीव से पूछें",
  askPlaceholder: "सूची के बारे में पूछें। पासपोर्ट या वीज़ा नंबर न लिखें।",
  askSend: "पूछें",
  askOff: "इस सर्वर पर ट्रिपवीव से पूछना बंद है।",
  askFailed: "इसका उत्तर नहीं दे सके।",
  askLimited: "एक घंटे बाद फिर कोशिश करें।",
  askNoDocuments: "पासपोर्ट और वीज़ा नंबर न लिखें।",
};

export type GuestLabel = keyof typeof EN;

/** Unofficial Hindi glosses. The English sentence on the checklist is the official one. */
export const CHECKLIST_HI: Record<string, string> = {
  "evisa-apply": "आगमन से कम से कम 4 दिन पहले ई-वीज़ा के लिए आवेदन करें। शुल्क यहाँ नहीं दिए गए हैं।",
  "evisa-not-for": "राजनयिक पासपोर्ट, माता-पिता या पति-पत्नी के पासपोर्ट पर नाम, और कुछ सेवा पृष्ठभूमि पर ई-वीज़ा नहीं मिलता।",
  voa: "वीज़ा ऑन अराइवल केवल सूची वाले हवाई अड्डों पर है, 60 दिन तक।",
  "voa-bbi": "भुवनेश्वर (BBI) पर वीज़ा ऑन अराइवल नहीं है। उड़ान से पहले ई-वीज़ा या नियमित वीज़ा लें।",
  visafree: "इस राष्ट्रीयता के लिए वीज़ा की ज़रूरत नहीं, या शर्तों के साथ वीज़ा-मुक्त प्रवेश है।",
  earrival: "1 अक्टूबर 2025 से ई-अराइवल कार्ड अनिवार्य है। आगमन से 72 घंटे पहले भरें। यह मुफ़्त है और वीज़ा नहीं है।",
  "earrival-check": "नेपाल और भूटान के लिए ई-अराइवल लागू है या नहीं, यह पुष्टि नहीं हुई। लागू हो तो 72 घंटे पहले भरें।",
  airsuvidha: "25 जून 2026 से अंतरराष्ट्रीय आगमन पर एयर सुविधा स्वास्थ्य घोषणा मांगी गई है। उड़ान से पहले पोर्टल जाँचें।",
  passport: "पासपोर्ट आगमन से कम से कम 6 महीने तक वैध हो और कम से कम 2 खाली पृष्ठ हों।",
  ticket: "वापसी या आगे की टिकट साथ रखें।",
  formiii: "चेक-इन पर पासपोर्ट रखें। होटल को आगमन के 24 घंटे के भीतर फ़ॉर्म III जमा करना होता है।",
  "india-address": "ई-अराइवल पर भारत का पता इस ठहराव के लिए पुरी, ओडिशा है। सड़क का पता होटल से लिखें।",
  "yellow-fever": "यदि आप पीत ज्वर वाले देश से 6 दिन के भीतर आ रहे हैं, तो टीकाकरण प्रमाणपत्र रखें। देश-सूची आधिकारिक साइट पर देखें।",
  "pk-visa": "ई-वीज़ा नहीं मिलता। भारतीय मिशन से नियमित वीज़ा लें।",
  "not-listed": "19 अक्टूबर 2026 को जाँची गई ई-वीज़ा सूची में यह राष्ट्रीयता नहीं है।",
};

let current: GuestLocale = "en";
const listeners = new Set<() => void>();

function readStored(): GuestLocale {
  if (typeof window === "undefined") return "en";
  try {
    return window.localStorage.getItem(KEY) === "hi" ? "hi" : "en";
  } catch {
    return "en";
  }
}

export function getGuestLocale(): GuestLocale {
  return current;
}

export function setGuestLocale(next: GuestLocale) {
  current = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((fn) => fn());
}

export function subscribeGuestLocale(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function guestLabel(locale: GuestLocale, key: GuestLabel): string {
  return locale === "hi" ? HI[key] : EN[key];
}

export function useGuestLocale(): GuestLocale {
  const locale = useSyncExternalStore(subscribeGuestLocale, getGuestLocale, () => "en" as GuestLocale);
  useEffect(() => {
    const stored = readStored();
    if (stored !== current) setGuestLocale(stored);
  }, []);
  return locale;
}
