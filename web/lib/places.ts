/**
 * Who represents each covered city, from the city up to the nation, plus the issues on the table at each level.
 * Hand-checked for Oct 2026 (current officeholders; congressional districts are the 2022 map, which stays in force
 * until the new Prop 50 districts take effect for the Nov 2026 election). Update when offices change hands.
 */

export type Official = { role: string; name: string; party?: string };

export type Level = "nation" | "state" | "district" | "city";

export type City = {
  id: string; // the Actor's jurisdiction id, or any Legistar client slug
  name: string;
  state: string;
  lonlat: [number, number];
  countyFips?: string;
  county?: string;
  district?: string;
  rep?: Official;
  local?: Official[];
  issues?: string[];
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
    state: "California",
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
    state: "California",
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
    state: "California",
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
    state: "California",
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
    state: "California",
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
    state: "California",
    lonlat: [-122.0363, 37.3688],
    countyFips: "06085",
    county: "Santa Clara County",
    district: "CA-17",
    rep: { role: "U.S. Representative (CA-17)", name: "Ro Khanna", party: "D" },
    local: [{ role: "Mayor", name: "Larry Klein" }],
    issues: ["Downtown redevelopment", "Housing near Caltrain", "Moffett Park plan"],
  },
  // Cities across the country whose council and commission calendars are on Legistar, so live
  // meetings and agenda scans work there too (verified Oct 2026).
  ...(
    [
      ["sacramento", "Sacramento", "California", -121.4944, 38.5816],
      ["fresno", "Fresno", "California", -119.7871, 36.7378],
      ["seattle", "Seattle", "Washington", -122.3321, 47.6062],
      ["phoenix", "Phoenix", "Arizona", -112.074, 33.4484],
      ["denver", "Denver", "Colorado", -104.9903, 39.7392],
      ["austintexas", "Austin", "Texas", -97.7431, 30.2672],
      ["kansascity", "Kansas City", "Missouri", -94.5786, 39.0997],
      ["madison", "Madison", "Wisconsin", -89.4012, 43.0731],
      ["milwaukee", "Milwaukee", "Wisconsin", -87.9065, 43.0389],
      ["columbus", "Columbus", "Ohio", -82.9988, 39.9612],
      ["pittsburgh", "Pittsburgh", "Pennsylvania", -79.9959, 40.4406],
      ["baltimore", "Baltimore", "Maryland", -76.6122, 39.2904],
      ["boston", "Boston", "Massachusetts", -71.0589, 42.3601],
    ] as const
  ).map(([id, name, state, lon, lat]) => ({ id, name, state, lonlat: [lon, lat] as [number, number] })),
];
