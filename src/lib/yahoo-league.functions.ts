import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { LEAGUE_URL, parseYahooLeague, type LeagueScoreboard } from "./yahoo-league";

type Result = { scoreboard: LeagueScoreboard | null; checkedAt: string; error: string | null };

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
    const scoreboard = parseYahooLeague(await response.text(), checkedAt);
    if (!scoreboard) return { scoreboard: null, checkedAt, error: "Yahoo's league page isn't providing readable matchups right now." };
    return { scoreboard, checkedAt, error: null };
  } catch {
    return { scoreboard: null, checkedAt, error: "Couldn't reach your Yahoo league. Please try again." };
  }
});