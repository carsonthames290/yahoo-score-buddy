export const MATCHUP_URL = "https://www.myfantasyscores.com/brag/eyJsIjoiZmVmZGRhZWItYzZlZS00NTQ2LThkZWEtYTIwOWM0NTE3NWUxIiwidSI6InVzZXJfM0txbklndmZ4YUtSOXN3NGcyZDJRV0pUUkFkIiwidyI6Nn0.qLE6f372AKRUMQ-rcHISvCjE6a1p-toqKdf7mXpN7jk";

export type SharedMatchup = {
  league: string;
  week: number;
  teams: { name: string; points: string }[];
  checkedAt: string;
};

function decode(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
}

function meta(html: string, key: string) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs: Record<string, string> = {};
    for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)) {
      const key = match[1];
      const value = match[3];
      if (key !== undefined && value !== undefined) attrs[key.toLowerCase()] = decode(value);
    }
    if (attrs['property'] === key || attrs['name'] === key) return attrs['content'] ?? "";
  }
  return "";
}

export function parseSharedMatchup(html: string, checkedAt: string): SharedMatchup | null {
  const title = meta(html, "og:title");
  const match = title.match(/^(.+?)\s+(-?\d+(?:\.\d+)?)\s+[–—-]\s+(.+?)\s+(-?\d+(?:\.\d+)?)\s+·\s+Week\s+(\d+)\s*\|\s*My Fantasy Scores$/);
  if (!match) return null;
  const [, homeName, homePoints, awayName, awayPoints, week] = match;
  if (homeName === undefined || homePoints === undefined || awayName === undefined || awayPoints === undefined || week === undefined) return null;
  const description = meta(html, "og:description");
  const league = description.match(/^[^·]+·\s*(.+?)\.\s*See the matchup/)?.[1] ?? "Shared league";
  return {
    league,
    week: Number(week),
    teams: [{ name: homeName, points: homePoints }, { name: awayName, points: awayPoints }],
    checkedAt,
  };
}