import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ListOrdered, Activity, Swords } from "lucide-react";

export function LeagueNav() {
  return <nav aria-label="League views" className="mb-8 flex flex-wrap gap-2 border-b border-border pb-4">
    <Button asChild variant="ghost"><Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "bg-secondary text-accent" }}><Swords />Matchups</Link></Button>
    <Button asChild variant="ghost"><Link to="/standings" activeProps={{ className: "bg-secondary text-accent" }}><ListOrdered />Standings</Link></Button>
    <Button asChild variant="ghost"><Link to="/activity" activeProps={{ className: "bg-secondary text-accent" }}><Activity />Activity</Link></Button>
  </nav>;
}