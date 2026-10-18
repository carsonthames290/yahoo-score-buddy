import { queryOptions } from "@tanstack/react-query";
import { getYahooLeague, getYahooMatchup } from "./yahoo-league.functions";

export const leagueQuery = queryOptions({ queryKey: ["yahoo-league", "1285342"], queryFn: () => getYahooLeague(), staleTime: 60_000, refetchInterval: 60_000, retry: 1 });
export const detailQuery = (id: string) => queryOptions({ queryKey: ["yahoo-matchup", id], queryFn: () => getYahooMatchup({ data: { id } }), staleTime: 60_000, refetchInterval: 60_000, retry: 1 });