import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { LEAGUE_URL, parseYahooLeague, type LeagueScoreboard } from "./yahoo-league";
import { parseLeagueExtras, parseMatchupDetail, type LeagueExtras } from "./yahoo-details";
import { z } from "zod";

type Result = { scoreboard: LeagueScoreboard | null; checkedAt: string; error: string | null; extras?: LeagueExtras };

// Yahoo serves the public league page to browsers; a bare server fetch can be
// redirected or blocked, so send a browser-like header set and follow redirects.
const YAHOO_FETCH_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

export const getYahooLeague = createServerFn({ method: "GET" }).handler(async (): Promise<Result> => {
  setResponseHeader("Cache-Control", "no-store");
  const checkedAt = new Date().toISOString();
  try {
    // Fixed owner-supplied league only; no visitor credentials or arbitrary URLs.
    const response = await fetch(LEAGUE_URL, {
      headers: YAHOO_FETCH_HEADERS,
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
      redirect: "follow",
    });
    if (!response.ok) {
      console.error(`Yahoo league fetch failed: HTTP ${response.status} from ${response.url}`);
      return { scoreboard: null, checkedAt, error: "Yahoo isn't providing the league scores right now. Please try again." };
    }
    const html = await response.text();
    const scoreboard = parseYahooLeague(html, checkedAt);
    if (!scoreboard) return { scoreboard: null, checkedAt, error: "Yahoo's league page isn't providing readable matchups right now." };
    return { scoreboard, checkedAt, error: null, extras: parseLeagueExtras(html) };
  } catch (cause) {
    console.error("Yahoo league fetch threw:", cause);
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
      const response = await fetch(url, { headers: YAHOO_FETCH_HEADERS, cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(12_000) });
      const matchup = response.ok ? parseMatchupDetail(await response.text(), Number(week), checkedAt) : null;
      return { matchup, url, error: matchup ? null : "Yahoo isn't providing this matchup's player scores right now." };
    } catch (cause) {
      console.error("Yahoo matchup fetch threw:", cause);
      return { matchup: null, url, error: "Couldn't reach Yahoo's player scores. Please try again." };
    }
  });