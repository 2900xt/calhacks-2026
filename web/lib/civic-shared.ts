export const JURISDICTIONS = [
  { id: "berkeley", name: "Berkeley" },
  { id: "oakland", name: "Oakland" },
  { id: "sanjose", name: "San José" },
  { id: "alameda", name: "Alameda" },
  { id: "mountainview", name: "Mountain View" },
  { id: "sunnyvaleca", name: "Sunnyvale" },
];

/** Where each city takes written public comment for council meetings (from each city's agenda notice). */
export const COMMENT_EMAIL: Record<string, string> = {
  berkeley: "council@berkeleyca.gov",
  oakland: "cityclerk@oaklandca.gov",
  sanjose: "city.clerk@sanjoseca.gov",
  alameda: "clerk@alamedaca.gov",
  mountainview: "city.clerk@mountainview.gov",
  sunnyvaleca: "council@sunnyvale.ca.gov",
};

/** Plain-language topics; the Actor matches agenda items against these phrases. */
export const TOPICS = [
  { label: "Housing & rent", interest: "Housing affordability, rent and new apartments" },
  { label: "Bike lanes & streets", interest: "Bike lanes, traffic safety and street design" },
  { label: "Public safety", interest: "Police and public safety budget" },
  { label: "Parks & environment", interest: "Parks, trees, climate and the environment" },
  { label: "Homelessness", interest: "Homeless services and shelters" },
  { label: "Transit", interest: "Public transit, BART and buses" },
  { label: "Schools & youth", interest: "Schools, youth programs and libraries" },
  { label: "Small business", interest: "Small businesses, permits and local jobs" },
];
