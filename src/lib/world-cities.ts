/** Cities the plan search can offer beyond the hand-written arrival cards. */

export type WorldCity = { name: string; place: string };

const INDIA = [
  "Agra", "Ahmedabad", "Aizawl", "Ajmer", "Alappuzha", "Amritsar", "Aurangabad",
  "Bengaluru", "Bhopal", "Bhubaneswar", "Bikaner", "Chandigarh", "Chennai",
  "Coimbatore", "Cuttack", "Dehradun", "Delhi", "Dharamshala", "Gangtok", "Goa",
  "Guwahati", "Gwalior", "Haridwar", "Hyderabad", "Imphal", "Indore", "Itanagar",
  "Jaipur", "Jaisalmer", "Jammu", "Jodhpur", "Kanpur", "Kochi", "Kohima", "Kolkata",
  "Kota", "Kozhikode", "Leh", "Lucknow", "Ludhiana", "Madurai", "Mangaluru",
  "Mumbai", "Mysuru", "Nagpur", "Nashik", "Panaji", "Patna", "Port Blair", "Puducherry",
  "Pune", "Puri", "Raipur", "Ranchi", "Rishikesh", "Rourkela", "Sambalpur", "Shillong",
  "Shimla", "Srinagar", "Surat", "Thiruvananthapuram", "Udaipur", "Vadodara",
  "Varanasi", "Vijayawada", "Visakhapatnam",
];

const ABROAD = [
  ["Bangkok", "Thailand"],
  ["Colombo", "Sri Lanka"],
  ["Dhaka", "Bangladesh"],
  ["Dubai", "United Arab Emirates"],
  ["Hong Kong", "China"],
  ["Kathmandu", "Nepal"],
  ["Kuala Lumpur", "Malaysia"],
  ["London", "United Kingdom"],
  ["New York", "United States"],
  ["Paris", "France"],
  ["Singapore", "Singapore"],
  ["Sydney", "Australia"],
  ["Tokyo", "Japan"],
  ["Toronto", "Canada"],
] as const;

export const WORLD_CITIES: WorldCity[] = [
  ...INDIA.map((name) => ({ name, place: "India" })),
  ...ABROAD.map(([name, place]) => ({ name, place })),
];

export function searchWorldCities(query: string, limit = 12): WorldCity[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  return WORLD_CITIES.filter(
    (city) => city.name.toLowerCase().includes(q) || city.place.toLowerCase().includes(q),
  ).slice(0, limit);
}
