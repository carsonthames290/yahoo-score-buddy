import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { leagueQuery } from "@/lib/league-queries";
import { LeaguePage, CheckTime } from "@/components/league-page";

export const Route = createFileRoute("/standings")({
  head: () => ({ meta: [{ title: "cool kid clan Standings — Sideline" }, { name: "description", content: "Yahoo league rankings, records, points for and against, streaks and waiver order." }, { property: "og:title", content: "cool kid clan Standings — Sideline" }, { property: "og:description", content: "Current Yahoo league standings and team records." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(leagueQuery), component: Standings,
});
function Standings() {
  const { data, refetch, isFetching } = useSuspenseQuery(leagueQuery);
  const rows = data.extras?.standings ?? [];
  return <LeaguePage title="Standings" refresh={() => void refetch()} busy={isFetching}>
    {!rows.length ? <p role="alert" className="text-muted-foreground">{data.error ?? "Yahoo isn't providing standings right now."}</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr>{["Rank", "Team", "W–L–T", "PF", "PA", "Streak", "Waiver", "Moves"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-4 font-medium">{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row[1]} className="border-b border-border hover:bg-secondary">{row.map((v, i) => <td key={i} className={`px-3 py-5 ${i === 1 ? "min-w-44 font-semibold" : "whitespace-nowrap font-mono tabular-nums"}`}>{v}</td>)}</tr>)}</tbody></table></div>}
    <CheckTime time={data.checkedAt} />
  </LeaguePage>;
}