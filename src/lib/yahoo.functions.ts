import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";

export type League = {
  key: string;
  name: string;
  sport: string;
  season: string;
  logo?: string;
};

export type Matchup = {
  week: string;
  teams: { name: string; logo?: string; points: string; projected?: string }[];
};

export type StandingsRow = {
  name: string;
  logo?: string;
  rank: string;
  record: string;
  pointsFor: string;
};

export type RosterTeam = {
  name: string;
  players: { name: string; position: string; team: string; slot: string }[];
};

export type SessionInfo = { signedIn: boolean; configured: boolean };

async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const {
    parseCookies,
    refreshTokens,
    cookieStrings,
    redirectUri,
    COOKIE_AT,
    COOKIE_RT,
    COOKIE_EXP,
  } = await import("@/lib/yahoo.server");
  const request = getRequest();
  const cookies = parseCookies(request.headers.get("cookie"));
  const access = cookies[COOKIE_AT];
  const refresh = cookies[COOKIE_RT];
  const exp = Number(cookies[COOKIE_EXP] ?? 0);
  if (!access && !refresh) throw new Error("NOT_SIGNED_IN");

  if (access && Date.now() < exp) {
    try {
      return await fn(access);
    } catch (e) {
      if ((e as Error).message !== "UNAUTHORIZED") throw e;
    }
  }
  if (!refresh) throw new Error("NOT_SIGNED_IN");
  const tokens = await refreshTokens(refresh, redirectUri(request.url));
  setResponseHeader("Set-Cookie", cookieStrings(tokens));
  return fn(tokens.access_token);
}

export const getSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionInfo> => {
    const { parseCookies, yahooConfig, COOKIE_RT } = await import("@/lib/yahoo.server");
    const cookies = parseCookies(getRequest().headers.get("cookie"));
    const { clientId, clientSecret } = yahooConfig();
    return {
      signedIn: Boolean(cookies[COOKIE_RT]),
      configured: Boolean(clientId && clientSecret),
    };
  },
);

export const getLeagues = createServerFn({ method: "GET" }).handler(async (): Promise<League[]> => {
  const { yahooGet, items, flat } = await import("@/lib/yahoo.server");
  return withToken(async (token) => {
    const json = await yahooGet(
      "users;use_login=1/games;game_keys=nfl,nba,nhl,mlb/leagues",
      token,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fc = (json as any).fantasy_content;
    const out: League[] = [];
    for (const u of items(fc.users)) {
      const games = (u.user ?? []).find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (x: any) => x && typeof x === "object" && "games" in x,
      )?.games;
      for (const g of items(games)) {
        const gameArr = g.game ?? [];
        const meta = flat(gameArr[0]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const leagues = (Array.isArray(gameArr) ? gameArr : []).find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (x: any) => x && typeof x === "object" && "leagues" in x,
        )?.leagues;
        for (const l of items(leagues)) {
          const lg = flat(l.league);
          if (!lg["league_key"]) continue;
          out.push({
            key: String(lg["league_key"]),
            name: String(lg["name"] ?? "League"),
            sport: String(meta["code"] ?? "").toUpperCase(),
            season: String(lg["season"] ?? meta["season"] ?? ""),
            logo: lg["logo_url"] ?? undefined,
          });
        }
      }
    }
    return out;
  });
});

const leagueInput = (input: { leagueKey: string }) => {
  if (!input?.leagueKey || !/^[\w.-]+$/.test(input.leagueKey)) throw new Error("Invalid league");
  return input;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTeam(teamArr: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (x: any) => {
    if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object") {
      for (const [k, v] of Object.entries(x)) {
        if (/^\d+$/.test(k)) walk(v);
        else if (t[k] === undefined) t[k] = v;
      }
    }
  };
  walk(teamArr);
  return t;
}

export const getScoreboard = createServerFn({ method: "POST" })
  .inputValidator(leagueInput)
  .handler(async ({ data }): Promise<Matchup[]> => {
    const { yahooGet, items } = await import("@/lib/yahoo.server");
    return withToken(async (token) => {
      const json = await yahooGet(`league/${data.leagueKey}/scoreboard`, token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const league = (json as any).fantasy_content?.league ?? [];
      const sbHolder = league[1]?.scoreboard ?? {};
      const week = String(sbHolder.week ?? sbHolder["0"]?.week ?? "");
      const matchupsObj = sbHolder["0"]?.matchups ?? sbHolder.matchups;
      return items(matchupsObj).map((m) => {
        const mu = m.matchup ?? {};
        const teamsObj = mu["0"]?.teams ?? mu.teams;
        const teams = items(teamsObj).map((t) => {
          const f = parseTeam(t.team);
          return {
            name: String(f["name"] ?? "Team"),
            logo: f["team_logos"]?.[0]?.team_logo?.url,
            points: String(f["team_points"]?.total ?? "0"),
            projected: f["team_projected_points"]?.total
              ? String(f["team_projected_points"].total)
              : undefined,
          };
        });
        return { week: String(mu.week ?? week), teams };
      });
    });
  });

export const getStandings = createServerFn({ method: "POST" })
  .inputValidator(leagueInput)
  .handler(async ({ data }): Promise<StandingsRow[]> => {
    const { yahooGet, items } = await import("@/lib/yahoo.server");
    return withToken(async (token) => {
      const json = await yahooGet(`league/${data.leagueKey}/standings`, token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const league = (json as any).fantasy_content?.league ?? [];
      const st = league[1]?.standings;
      const teamsObj = Array.isArray(st)
        ? (st[0]?.teams ?? st["0"]?.teams)
        : (st?.["0"]?.teams ?? st?.teams);
      return items(teamsObj)
        .map((t) => {
          const f = parseTeam(t.team);
          const s = f["team_standings"] ?? {};
          const o = s.outcome_totals ?? {};
          return {
            name: String(f["name"] ?? "Team"),
            logo: f["team_logos"]?.[0]?.team_logo?.url,
            rank: String(s.rank ?? "-"),
            record: `${o.wins ?? 0}-${o.losses ?? 0}${o.ties ? `-${o.ties}` : ""}`,
            pointsFor: String(s.points_for ?? "0"),
          };
        })
        .sort((a, b) => Number(a.rank) - Number(b.rank));
    });
  });

export const getRosters = createServerFn({ method: "POST" })
  .inputValidator(leagueInput)
  .handler(async ({ data }): Promise<RosterTeam[]> => {
    const { yahooGet, items } = await import("@/lib/yahoo.server");
    return withToken(async (token) => {
      const json = await yahooGet(`league/${data.leagueKey}/teams;out=roster`, token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const league = (json as any).fantasy_content?.league ?? [];
      const teamsObj = league[1]?.teams;
      return items(teamsObj).map((t) => {
        const f = parseTeam(t.team);
        const rosterObj = f["roster"] ?? {};
        const playersObj = rosterObj["0"]?.players ?? rosterObj.players;
        const players = items(playersObj).map((p) => {
          const pf = parseTeam(p.player);
          return {
            name: String(pf["name"]?.full ?? "Player"),
            position: String(pf["display_position"] ?? ""),
            team: String(pf["editorial_team_abbr"] ?? ""),
            slot: String(pf["selected_position"]?.position ?? ""),
          };
        });
        return { name: String(f["name"] ?? "Team"), players };
      });
    });
  });
