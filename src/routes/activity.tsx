import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { leagueQuery } from "@/lib/league-queries";
import { LeaguePage, CheckTime } from "@/components/league-page";
import { ArrowDown, ArrowUp } from "lucide-react";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "cool kid clan Activity — Sideline" }, { name: "description", content: "Recent player additions, drops and waiver activity from the Yahoo league page." }, { property: "og:title", content: "cool kid clan Activity — Sideline" }, { property: "og:description", content: "Recent Yahoo league transactions." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(leagueQuery), component: Activity,
});
function Activity() {
  const { data, refetch, isFetching } = useSuspenseQuery(leagueQuery);
  const items = data.extras?.transactions ?? [];
  return <LeaguePage title="Recent activity" refresh={() => void refetch()} busy={isFetching}>
    {!items.length ? <p role="alert" className="text-muted-foreground">{data.error ?? "No recent transactions returned by Yahoo."}</p> : <div className="divide-y divide-border">{items.map((item, i) => <article key={i} className="py-6"><div className="mb-4 flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{item.team}</h2><span className="text-xs text-muted-foreground">{item.time}</span></div><div className="space-y-3">{item.moves.map((move, j) => <div key={j} className="flex items-center gap-3">{move.action.includes("To") ? <ArrowDown className="size-4 shrink-0 text-destructive" /> : <ArrowUp className="size-4 shrink-0 text-accent" />}<div className="min-w-0 flex-1"><p className="font-medium">{move.player}</p><p className="text-xs text-muted-foreground">{move.position}</p></div><span className="text-xs text-muted-foreground">{move.action}</span></div>)}</div></article>)}</div>}
    <CheckTime time={data.checkedAt} />
  </LeaguePage>;
}