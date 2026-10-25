/**
 * Who represents each covered city, from the city up to the nation, plus the issues on the table at each level.
 * Hand-checked for Oct 2026 (current officeholders; congressional districts are the 2022 map, which stays in force
 * until the new Prop 50 districts take effect for the Nov 2026 election). Update when offices change hands.
 */

export type Official = { role: string; name: string; party?: string };

export type Level = "nation" | "state" | "district" | "city";

export type City = {
  id: string; // matches the Actor's jurisdiction ids
  name: string;
  lonlat: [number, number];
  countyFips: string;
  county: string;
  district: string;
  rep: Official;
  local: Official[];
  issues: string[];
};

export const NATION = {
  name: "United States",
  officials: [
    { role: "President", name: "Donald Trump", party: "R" },
    { role: "Vice President", name: "JD Vance", party: "R" },
  ] as Official[],
  issues: ["Federal budget & spending", "Health care costs", "Immigration", "Tariffs & cost of living"],
  callout: "Midterm Election Day is Tue, Nov 3, 2026. Every House seat and a third of the Senate are on the ballot.",
};

export const CALIFORNIA = {
  fips: "06",
  name: "California",
  officials: [
    { role: "Governor", name: "Gavin Newsom", party: "D" },
    { role: "U.S. Senator", name: "Alex Padilla", party: "D" },
    { role: "U.S. Senator", name: "Adam Schiff", party: "D" },
  ] as Official[],
  issues: ["Housing near transit", "Wildfire & home insurance", "State budget", "New congressional maps (Prop 50)"],
  callout: "California elects a new governor on Nov 3, 2026. Check your registration at registertovote.ca.gov.",
};

export const COUNTY_ISSUES: Record<string, string[]> = {
  "06001": ["Homelessness & housing funds", "BART & AC Transit service", "County health services"],
  "06085": ["Housing & homelessness", "VTA transit & BART to San José", "Valley Medical Center funding"],
};

export const CITIES: City[] = [
  {
    id: "berkeley",
    name: "Berkeley",
    lonlat: [-122.2727, 37.8716],
    countyFips: "06001",
    county: "Alameda County",
    district: "CA-12",
    rep: { role: "U.S. Representative (CA-12)", name: "Lateefah Simon", party: "D" },
    local: [{ role: "Mayor", name: "Adena Ishii" }],
    issues: ["Ashby & North Berkeley BART housing", "Student rents", "Street safety"],
  },
  {
    id: "oakland",
    name: "Oakland",
    lonlat: [-122.2712, 37.8044],
    countyFips: "06001",
    county: "Alameda County",
    district: "CA-12",
    rep: { role: "U.S. Representative (CA-12)", name: "Lateefah Simon", party: "D" },
    local: [{ role: "Mayor", name: "Barbara Lee" }],
    issues: ["City budget gap", "Public safety staffing", "Homelessness"],
  },
  {
    id: "alameda",
    name: "Alameda",
    lonlat: [-122.2416, 37.7652],
    countyFips: "06001",
    county: "Alameda County",
    district: "CA-12",
    rep: { role: "U.S. Representative (CA-12)", name: "Lateefah Simon", party: "D" },
    local: [{ role: "Mayor", name: "Marilyn Ezzy Ashcraft" }],
    issues: ["Housing element", "Ferry & bus service", "Shoreline & sea-level rise"],
  },
  {
    id: "sanjose",
    name: "San José",
    lonlat: [-121.8863, 37.3382],
    countyFips: "06085",
    county: "Santa Clara County",
    district: "CA-18",
    rep: { role: "U.S. Representative (CA-18)", name: "Zoe Lofgren", party: "D" },
    local: [{ role: "Mayor", name: "Matt Mahan" }],
    issues: ["Homeless encampments & shelter", "Downtown & BART extension", "Police staffing"],
  },
  {
    id: "mountainview",
    name: "Mountain View",
    lonlat: [-122.0838, 37.3861],
    countyFips: "06085",
    county: "Santa Clara County",
    district: "CA-16",
    rep: { role: "U.S. Representative (CA-16)", name: "Sam Liccardo", party: "D" },
    local: [{ role: "Mayor", name: "Chosen yearly by the council" }],
    issues: ["Rent stabilization", "Housing near Google & North Bayshore", "Bike & pedestrian safety"],
  },
  {
    id: "sunnyvaleca",
    name: "Sunnyvale",
    lonlat: [-122.0363, 37.3688],
    countyFips: "06085",
    county: "Santa Clara County",
    district: "CA-17",
    rep: { role: "U.S. Representative (CA-17)", name: "Ro Khanna", party: "D" },
    local: [{ role: "Mayor", name: "Larry Klein" }],
    issues: ["Downtown redevelopment", "Housing near Caltrain", "Moffett Park plan"],
  },
];
