import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Trophy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeagueNav } from "./league-nav";

export function LeaguePage({ title, children, refresh, busy }: { title: string; children: ReactNode; refresh: () => void; busy: boolean }) {
  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5"><Link to="/" className="flex items-center gap-3 text-xl font-bold"><Trophy className="size-5 text-accent" />Sideline</Link><span className="text-xs text-muted-foreground">Yahoo Fantasy Football</span></div></header>
    <div className="mx-auto max-w-5xl px-5 py-10"><LeagueNav /><div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 text-sm text-accent">cool kid clan</p><h1 className="text-3xl font-bold">{title}</h1></div><Button variant="outline" onClick={refresh} disabled={busy}><RefreshCw className={busy ? "animate-spin motion-reduce:animate-none" : ""} />{busy ? "Checking…" : "Refresh"}</Button></div>{children}</div>
  </main>;
}

export function CheckTime({ time }: { time: string }) {
  return <p className="mt-5 text-xs text-muted-foreground">Checked {new Date(time).toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} Chicago time</p>;
}