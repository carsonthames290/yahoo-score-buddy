import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, RefreshCw, Trophy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getYahooLeague } from "@/lib/yahoo-league.functions";
import { LEAGUE_URL } from "@/lib/yahoo-league";
import { LeagueNav } from "@/components/league-nav";

const matchupQuery = queryOptions({
  queryKey: ["yahoo-league", "1285342"],
  queryFn: () => getYahooLeague(),
  staleTime: 60_000,
  refetchInterval: 60_000,
  retry: 1,
});

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Sideline — cool kid clan Yahoo Matchups" },
    { name: "description", content: "All matchups for Yahoo Fantasy Football league cool kid clan, with scores and the latest check time." },
    { property: "og:title", content: "Sideline — cool kid clan Yahoo Matchups" },
    { property: "og:description", content: "Follow every matchup in cool kid clan using the Yahoo league page." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(matchupQuery),
  component: Home,
  pendingComponent: () => <main className="min-h-screen bg-background px-6 py-20 text-foreground"><p className="text-center text-muted-foreground">Checking Yahoo scores…</p></main>,
});

function Home() {
  const { data, refetch, isFetching, isError } = useSuspenseQuery(matchupQuery);
  const scoreboard = data.scoreboard;
  const unavailable = isError || !!data.error;
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3"><Trophy className="size-5 text-accent" /><span className="text-xl font-bold">Sideline</span></div>
          <span className="text-xs text-muted-foreground">Yahoo Fantasy Football</span>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        <LeagueNav />
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="mb-2 text-sm text-accent">{scoreboard?.league ?? "cool kid clan"}</p><h1 className="text-3xl font-bold sm:text-4xl">League matchups</h1></div>
          <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin motion-reduce:animate-none" : ""} />{isFetching ? "Checking…" : "Refresh scores"}
          </Button>
        </div>
        {unavailable && <div role="alert" className="mt-7 flex items-start gap-3 border border-border p-5"><AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" /><p className="text-sm text-muted-foreground">{data.error ?? "Couldn't check for updated scores."}</p></div>}
        {scoreboard && <section aria-label="Yahoo league scores" className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold">Week {scoreboard.week}</h2><span className="text-xs text-muted-foreground">{scoreboard.matchups.length} matchups · Yahoo scores</span></div>
          <div className="grid gap-5 lg:grid-cols-2">
            {scoreboard.matchups.map((matchup, i) => <article key={matchup.id} className="overflow-hidden rounded-md border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-3"><h3 className="text-xs text-muted-foreground">Matchup {i + 1}</h3><Button asChild variant="link" size="sm" className="h-auto p-0"><Link to="/matchups/$id" params={{ id: matchup.id }} aria-label={`View matchup ${i + 1} players`}>View players <ExternalLink className="size-3" /></Link></Button></div>
              <div className="divide-y divide-border px-5">
                {matchup.teams.map((team) => <div key={team.name} className="flex min-h-28 items-center justify-between gap-4 py-6">
                  <h4 className="min-w-0 break-words text-lg font-semibold">{team.name}</h4>
                  <p className="shrink-0 font-mono text-3xl font-bold tabular-nums text-accent">{team.points}</p>
                </div>)}
              </div>
            </article>)}
          </div>
        </section>}
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <p className="text-xs leading-relaxed text-muted-foreground">{scoreboard ? "Scores checked" : "Last attempted"} {new Date(scoreboard?.checkedAt ?? data.checkedAt).toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} Chicago time</p>
          <Button asChild variant="link" className="h-auto p-0"><a href={LEAGUE_URL} target="_blank" rel="noopener noreferrer">Open Yahoo league <ExternalLink /></a></Button>
        </div>
      </div>
    </main>
  );
}
