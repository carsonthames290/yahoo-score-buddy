import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { MATCHUP_URL, parseSharedMatchup, type SharedMatchup } from "./shared-matchup";

type Result = { matchup: SharedMatchup | null; error: string | null };

// Only the owner's explicitly shared public page is fetched. No arbitrary URL input.
export const getSharedMatchup = createServerFn({ method: "GET" }).handler(async (): Promise<Result> => {
  setResponseHeader("Cache-Control", "no-store");
  try {
    const response = await fetch(MATCHUP_URL, {
      headers: { Accept: "text/html" },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!response.ok) return { matchup: null, error: "My Fantasy Scores is unavailable right now." };
    const matchup = parseSharedMatchup(await response.text(), new Date().toISOString());
    if (!matchup) return { matchup: null, error: "The shared page isn't providing readable scores right now." };
    return { matchup, error: null };
  } catch {
    return { matchup: null, error: "Couldn't check My Fantasy Scores. Please try again." };
  }
});