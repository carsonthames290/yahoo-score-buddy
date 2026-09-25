import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getLeagues,
  getRosters,
  getScoreboard,
  getSession,
  getStandings,
} from "@/lib/yahoo.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sideline — Yahoo Fantasy Scores" },
      {
        name: "description",
        content:
          "Sign in with Yahoo to follow live fantasy matchup scores, league standings and team rosters in one clean dashboard.",
      },
      { property: "og:title", content: "Sideline — Yahoo Fantasy Scores" },
      {
        property: "og:description",
        content:
          "Live Yahoo Fantasy matchups, standings and rosters in one clean dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type Tab = "scores" | "standings" | "rosters";

function Home() {
  const session = useQuery({ queryKey: ["yf-session"], queryFn: () => getSession() });

  if (session.isLoading) return <Shell><Loading label="Loading" /></Shell>;
  if (!session.data?.signedIn) return <SignedOut configured={session.data?.configured ?? false} />;
  return <Dashboard />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-background text-foreground">{children}</main>;
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="animate-pulse text-sm tracking-widest text-muted-foreground uppercase">
        {label}…
      </p>
    </div>
  );
}

function SignedOut({ configured }: { configured: boolean }) {
  return (
    <Shell>
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
        <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase">Sideline</p>
        <h1 className="mt-4 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
          Your Yahoo Fantasy scores, without the clutter.
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Connect your Yahoo account to see live matchup scores, standings and every roster in
          your leagues.
        </p>
        {configured ? (
          <a
            href="/api/public/yahoo/login"
            className="mt-8 inline-flex w-fit items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-transform hover:scale-[1.02]"
          >
            Sign in with Yahoo
          </a>
        ) : (
          <div className="mt-8 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            Yahoo sign-in isn’t switched on yet — the Yahoo app keys still need to be added.
          </div>
        )}
      </div>
    </Shell>
  );
}

function Dashboard() {
  const leagues = useQuery({ queryKey: ["yf-leagues"], queryFn: () => getLeagues() });
  const [leagueKey, setLeagueKey] = useState<string>("");
  const [tab, setTab] = useState<Tab>("scores");

  useEffect(() => {
    if (!leagueKey && leagues.data?.length) setLeagueKey(leagues.data[0]!.key);
  }, [leagues.data, leagueKey]);

  return (
    <Shell>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase">Sideline</p>
          <a
            href="/api/public/yahoo/logout"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign out
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-6">
        {leagues.isLoading && <Loading label="Loading leagues" />}
        {leagues.isError && <ErrorBox />}
        {leagues.data && leagues.data.length === 0 && (
          <p className="text-sm text-muted-foreground">No fantasy leagues found on this account.</p>
        )}

        {!!leagues.data?.length && (
          <>
            <div className="-mx-1 flex gap-2 overflow-x-auto pb-2">
              {leagues.data.map((l) => (
                <button
                  key={l.key}
                  onClick={() => setLeagueKey(l.key)}
                  className={`mx-1 shrink-0 rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                    leagueKey === l.key
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.name}
                  <span className="ml-2 text-[10px] opacity-70">
                    {l.sport} {l.season}
                  </span>
                </button>
              ))}
            </div>

            <nav className="mt-6 flex gap-6 border-b border-border">
              {(["scores", "standings", "rosters"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 pb-3 text-sm font-medium capitalize transition-colors ${
                    tab === t
                      ? "border-accent text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </nav>

            {leagueKey && tab === "scores" && <Scores leagueKey={leagueKey} />}
            {leagueKey && tab === "standings" && <Standings leagueKey={leagueKey} />}
            {leagueKey && tab === "rosters" && <Rosters leagueKey={leagueKey} />}
          </>
        )}
      </div>
    </Shell>
  );
}

function ErrorBox() {
  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
      Couldn’t reach Yahoo just now. Try refreshing, or{" "}
      <a href="/api/public/yahoo/login" className="text-accent underline">
        sign in again
      </a>
      .
    </div>
  );
}

function Scores({ leagueKey }: { leagueKey: string }) {
  const q = useQuery({
    queryKey: ["yf-scores", leagueKey],
    queryFn: () => getScoreboard({ data: { leagueKey } }),
    refetchInterval: 60_000,
  });
  if (q.isLoading) return <Loading label="Loading scores" />;
  if (q.isError) return <ErrorBox />;

  return (
    <div className="mt-6 space-y-3">
      {q.data?.map((m, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            Week {m.week}
          </p>
          <div className="mt-3 space-y-3">
            {m.teams.map((t, j) => (
              <div key={j} className="flex items-center gap-3">
                {t.logo && (
                  <img src={t.logo} alt="" className="h-8 w-8 rounded-full object-cover" />
                )}
                <span className="flex-1 truncate text-sm font-medium">{t.name}</span>
                {t.projected && (
                  <span className="text-xs text-muted-foreground">proj {t.projected}</span>
                )}
                <span className="font-mono text-lg font-bold tabular-nums">{t.points}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Standings({ leagueKey }: { leagueKey: string }) {
  const q = useQuery({
    queryKey: ["yf-standings", leagueKey],
    queryFn: () => getStandings({ data: { leagueKey } }),
  });
  if (q.isLoading) return <Loading label="Loading standings" />;
  if (q.isError) return <ErrorBox />;

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
      {q.data?.map((r) => (
        <div
          key={r.rank + r.name}
          className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
        >
          <span className="w-6 font-mono text-sm text-muted-foreground">{r.rank}</span>
          {r.logo && <img src={r.logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
          <span className="flex-1 truncate text-sm font-medium">{r.name}</span>
          <span className="text-sm text-muted-foreground">{r.record}</span>
          <span className="w-20 text-right font-mono text-sm tabular-nums">{r.pointsFor}</span>
        </div>
      ))}
    </div>
  );
}

function Rosters({ leagueKey }: { leagueKey: string }) {
  const q = useQuery({
    queryKey: ["yf-rosters", leagueKey],
    queryFn: () => getRosters({ data: { leagueKey } }),
  });
  const [open, setOpen] = useState<string | null>(null);
  if (q.isLoading) return <Loading label="Loading rosters" />;
  if (q.isError) return <ErrorBox />;

  return (
    <div className="mt-6 space-y-3">
      {q.data?.map((t) => (
        <div key={t.name} className="overflow-hidden rounded-xl border border-border bg-card">
          <button
            onClick={() => setOpen(open === t.name ? null : t.name)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-medium">{t.name}</span>
            <span className="text-xs text-muted-foreground">
              {open === t.name ? "Hide" : `${t.players.length} players`}
            </span>
          </button>
          {open === t.name && (
            <div className="border-t border-border">
              {t.players.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <span className="w-10 font-mono text-xs text-accent">{p.slot}</span>
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.team} · {p.position}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
