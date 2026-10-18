import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLink, RefreshCw, Trophy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSharedMatchup } from "@/lib/shared-matchup.functions";
import { MATCHUP_URL } from "@/lib/shared-matchup";

const matchupQuery = queryOptions({
  queryKey: ["shared-matchup"],
  queryFn: () => getSharedMatchup(),
  staleTime: 60_000,
  refetchInterval: 60_000,
  retry: 1,
});

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Sideline — Carson’s Fantasy Matchup" },
    { name: "description", content: "Carson’s shared Yahoo Fantasy matchup, with scores from My Fantasy Scores." },
    { property: "og:title", content: "Sideline — Carson’s Fantasy Matchup" },
    { property: "og:description", content: "Follow Carson’s shared fantasy matchup from My Fantasy Scores." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(matchupQuery),
  component: Home,
  pendingComponent: () => <main className="min-h-screen bg-background px-6 py-20 text-foreground"><p className="text-center text-muted-foreground">Checking your matchup…</p></main>,
});

function Home() {
  const { data, refetch, isFetching, isError } = useSuspenseQuery(matchupQuery);
  const matchup = data.matchup;
  const unavailable = isError || !!data.error;
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3"><Trophy className="size-5 text-accent" /><span className="text-xl font-bold">Sideline</span></div>
          <span className="text-xs text-muted-foreground">Yahoo Fantasy · My Fantasy Scores</span>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="mb-2 text-sm text-accent">{matchup?.league ?? "Carson’s league"}</p><h1 className="text-3xl font-bold sm:text-4xl">My matchup</h1></div>
          <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin motion-reduce:animate-none" : ""} />{isFetching ? "Checking…" : "Refresh scores"}
          </Button>
        </div>
        {unavailable && <div role="alert" className="mt-7 flex items-start gap-3 rounded-lg border border-border bg-card p-5"><AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" /><p className="text-sm text-muted-foreground">{data.error ?? "Couldn't check for updated scores."}{matchup ? " Last checked scores are shown below." : " Your shared matchup is still available using the link below."}</p></div>}
        {matchup && <section aria-label="Shared matchup scores" className="mt-8 overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4"><h2 className="text-sm font-semibold">Week {matchup.week}</h2><span className="text-xs text-muted-foreground">{unavailable ? "Last checked scores" : "Shared page scores"}</span></div>
          <div className="divide-y divide-border px-6 sm:px-8">
            {matchup.teams.map((team, index) => <div key={index} className="flex items-center justify-between gap-5 py-8 sm:py-10">
              <div className="min-w-0"><p className="mb-2 text-xs text-muted-foreground">{index === 0 ? "Your team" : "Opponent"}</p><h3 className="break-words text-xl font-semibold sm:text-2xl">{team.name}</h3></div>
              <p className={`shrink-0 font-mono text-3xl font-bold tabular-nums sm:text-5xl ${index === 0 ? "text-accent" : "text-foreground"}`}>{team.points}</p>
            </div>)}
          </div>
          <div className="border-t border-border px-6 py-4 text-xs text-muted-foreground">Checked {new Date(matchup.checkedAt).toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} Chicago time</div>
        </section>}
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">This share link is for Week {matchup?.week ?? "6"}. Scores depend on My Fantasy Scores; live updates and automatic week changes aren’t guaranteed.</p>
          <Button asChild variant="link" className="h-auto p-0"><a href={MATCHUP_URL} target="_blank" rel="noopener noreferrer">View shared matchup <ExternalLink /></a></Button>
        </div>
        <section className="mt-12 border-t border-border pt-7">
          <h2 className="text-lg font-semibold">Other matchups</h2><p className="mt-2 text-sm text-muted-foreground">Not connected yet.</p>
        </section>
      </div>
    </main>
  );
}
