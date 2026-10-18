import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { detailQuery } from "@/lib/league-queries";
import { LeaguePage, CheckTime } from "@/components/league-page";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Player } from "@/lib/yahoo-details";

export const Route = createFileRoute("/matchups/$id")({
  head: ({ params }) => ({ meta: [{ title: `Week ${params.id.split("-")[0]} Matchup ${params.id} — Sideline` }, { name: "description", content: "Yahoo matchup lineups, player fantasy points, projections and bench players." }, { property: "og:title", content: `Yahoo Matchup ${params.id} — Sideline` }, { property: "og:description", content: "Player-by-player points and lineups for this cool kid clan matchup." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(detailQuery(params.id)), component: Matchup,
});
function Players({ players }: { players: Player[] }) {
  return <div className="divide-y divide-border">{players.map((p, i) => <div key={`${p.name}-${i}`} className="px-4 py-4"><div className="flex items-start gap-3"><span className="w-10 shrink-0 pt-1 text-xs font-semibold text-muted-foreground">{p.slot}</span><div className="min-w-0 flex-1"><p className="break-words font-semibold">{p.name} {p.status && <span className="text-xs text-destructive">{p.status}</span>}</p><p className="mt-1 text-xs text-muted-foreground">{p.position}</p><p className="mt-1 text-xs text-muted-foreground">{p.game}</p>{p.stats && <p className="mt-1 text-xs text-foreground">{p.stats}</p>}</div><div className="shrink-0 text-right"><p className="font-mono text-xl font-bold tabular-nums text-accent">{p.points}</p><p className="mt-1 text-xs text-muted-foreground">Proj {p.projected}</p></div></div></div>)}</div>;
}
function Matchup() {
  const { id } = Route.useParams();
  const { data, refetch, isFetching } = useSuspenseQuery(detailQuery(id));
  return <LeaguePage title={data.matchup ? `Week ${data.matchup.week} matchup` : "Matchup"} refresh={() => void refetch()} busy={isFetching}>
    <Button asChild variant="link" className="mb-5 px-0"><Link to="/"><ArrowLeft />All matchups</Link></Button>
    {data.error && <p role="alert" className="mb-6 text-muted-foreground">{data.error}</p>}
    {data.matchup && <><div className="grid gap-6 md:grid-cols-2">{data.matchup.teams.map((team) => <section key={team.name} className="min-w-0"><div className="mb-5 flex items-start justify-between gap-4 border-b border-border pb-5"><h2 className="min-w-0 break-words text-xl font-bold">{team.name}</h2><span className="shrink-0 font-mono text-3xl font-bold text-accent">{team.points}</span></div><h3 className="mb-3 text-sm font-semibold">Starters</h3><div className="rounded-md border border-border bg-card"><Players players={team.starters} /></div><h3 className="mb-3 mt-8 text-sm font-semibold">Bench</h3><div className="rounded-md border border-border bg-card"><Players players={team.bench} /></div></section>)}</div><CheckTime time={data.matchup.checkedAt} /></>}
  </LeaguePage>;
}