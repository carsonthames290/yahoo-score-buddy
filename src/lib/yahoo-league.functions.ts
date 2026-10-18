import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { LEAGUE_URL, parseYahooLeague, type LeagueScoreboard } from "./yahoo-league";
import { parseLeagueExtras, parseMatchupDetail, type LeagueExtras } from "./yahoo-details";
import { z } from "zod";

type Result = { scoreboard: LeagueScoreboard | null; checkedAt: string; error: string | null; extras?: LeagueExtras };

export const getYahooLeague = createServerFn({ method: "GET" }).handler(async (): Promise<Result> => {
  setResponseHeader("Cache-Control", "no-store");
  const checkedAt = new Date().toISOString();
  try {
    // Fixed owner-supplied league only; no visitor credentials or arbitrary URLs.
    const response = await fetch(LEAGUE_URL, {
      headers: { Accept: "text/html" },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) return { scoreboard: null, checkedAt, error: "Yahoo isn't providing the league scores right now. Please try again." };
    const html = await response.text();
    const scoreboard = parseYahooLeague(html, checkedAt);
    if (!scoreboard) return { scoreboard: null, checkedAt, error: "Yahoo's league page isn't providing readable matchups right now." };
    return { scoreboard, checkedAt, error: null, extras: parseLeagueExtras(html) };
  } catch {
    return { scoreboard: null, checkedAt, error: "Couldn't reach your Yahoo league. Please try again." };
  }
});

export const getYahooMatchup = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().regex(/^\d{1,2}-[1-6]-[1-6]$/) }).parse(input))
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const checkedAt = new Date().toISOString();
    const [week, home, away] = data.id.split("-");
    const url = `${LEAGUE_URL}/matchup?week=${week}&mid1=${home}&mid2=${away}`;
    try {
      const response = await fetch(url, { headers: { Accept: "text/html" }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12_000) });
      const matchup = response.ok ? parseMatchupDetail(await response.text(), Number(week), checkedAt) : null;
      return { matchup, url, error: matchup ? null : "Yahoo isn't providing this matchup's player scores right now." };
    } catch {
      return { matchup: null, url, error: "Couldn't reach Yahoo's player scores. Please try again." };
    }
  });