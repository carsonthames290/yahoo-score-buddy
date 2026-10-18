import { parse } from "node-html-parser";

export const LEAGUE_URL = "https://football.fantasysports.yahoo.com/f1/1285342";
export type LeagueScoreboard = {
  league: string;
  week: number;
  checkedAt: string;
  matchups: { id: string; url: string; teams: { name: string; points: string }[] }[];
};

export function parseYahooLeague(html: string, checkedAt: string): LeagueScoreboard | null {
  const root = parse(html);
  const league = root.querySelector("title")?.text.split(" | ")[0]?.trim();
  if (!league || league.includes("not found") || league === "Yahoo") return null;
  for (const section of root.querySelectorAll("section")) {
    const week = section.text.match(/Week\s+(\d+)\s+Matchups/)?.[1];
    if (!week) continue;
    const rows = section.querySelectorAll("li[data-target]");
    if (!rows.length) continue;
    const matchups: LeagueScoreboard["matchups"] = [];
    for (const row of rows) {
      const target = row.getAttribute("data-target");
      if (!target) return null;
      const url = new URL(target, LEAGUE_URL);
      if (url.origin !== new URL(LEAGUE_URL).origin || url.pathname !== "/f1/1285342/matchup" || url.searchParams.get("week") !== week) return null;
      const names = row.querySelectorAll("a.F-link").map((a) => a.text.trim());
      // Fz-lg are the actual totals. The adjacent italic values are projections.
      const points = row.querySelectorAll("div.Fz-lg").map((div) => div.text.trim());
      if (names.length !== 2 || points.length !== 2 || names.some((name) => !name) || points.some((value) => !/^-?\d+(?:\.\d+)?$/.test(value))) return null;
      const teams = names.map((name, i) => ({ name, points: points[i] ?? "" }));
      matchups.push({ id: `${week}-${url.searchParams.get("mid1")}-${url.searchParams.get("mid2")}`, url: url.href, teams });
    }
    if (new Set(matchups.map((m) => m.id)).size !== matchups.length) return null;
    return { league, week: Number(week), checkedAt, matchups };
  }
  return null;
}