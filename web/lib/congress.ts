import data from "./congress.json";

/**
 * Current members of Congress with their Integrity Index financial-integrity score (0-100), snapshotted from
 * integrityindex.us (run by the Political Integrity PAC). Scores reflect that group's methodology.
 */
export type Member = {
  name: string;
  party: string;
  state: string;
  district: string | null;
  chamber: "House" | "Senate";
  score: number;
};

const MEMBERS = data as Record<string, Member>;

export function slugOf(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function integrity(name: string): { score: number; url: string } | null {
  const slug = slugOf(name);
  const m = MEMBERS[slug];
  return m ? { score: m.score, url: `https://integrityindex.us/candidate/${slug}` } : null;
}

export function senators(state: string) {
  return Object.values(MEMBERS).filter((m) => m.chamber === "Senate" && m.state === state);
}

export function house(state: string) {
  return Object.values(MEMBERS)
    .filter((m) => m.chamber === "House" && m.state === state)
    .sort((a, b) => Number(a.district) - Number(b.district));
}

export function grade(score: number) {
  return score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
}
