import { parse, type HTMLElement } from "node-html-parser";

const text = (node: HTMLElement | null | undefined) => node?.text.replace(/\s+/g, " ").trim() ?? "";
export type LeagueExtras = { standings: string[][]; transactions: { team: string; time: string; moves: { player: string; action: string; position: string }[] }[] };
export type Player = { name: string; position: string; slot: string; points: string; projected: string; game: string; stats: string; status: string };
export type MatchupDetail = { week: number; checkedAt: string; teams: { name: string; points: string; starters: Player[]; bench: Player[] }[] };

export function parseLeagueExtras(html: string): LeagueExtras {
  const root = parse(html);
  const standings = root.querySelectorAll("#standingstable tbody tr").map((row) => row.querySelectorAll("td").map((cell) => text(cell))).filter((cells) => cells.length === 8);
  const transactions = root.querySelectorAll(".Tst-transaction-table tr").map((row) => ({
    team: text(row.querySelector(".Tst-team-name")), time: text(row.querySelector(".F-timestamp")),
    moves: row.querySelectorAll("div.Pbot-xs").map((move) => ({ player: text(move.querySelector("a")), action: text(move.querySelector("h6")), position: text(move.querySelector(".F-position")) })),
  })).filter((item) => item.team && item.moves.length);
  return { standings, transactions };
}

export function parseMatchupDetail(html: string, week: number, checkedAt: string): MatchupDetail | null {
  const root = parse(html);
  const selected = root.querySelector("select option[selected]");
  if (!text(selected).startsWith(`Week ${week}:`)) return null;
  const totals = root.querySelectorAll("table.M-a td.Fz-xxl").map((node) => text(node));
  const names = root.querySelectorAll("div.Fz-xxl.Ell a.F-link").map((node) => text(node));
  if (names.length !== 2 || totals.length !== 2 || totals.some((v) => !/^-?\d+(?:\.\d+)?$/.test(v))) return null;
  const teams = names.map((name, i) => ({ name, points: totals[i] ?? "", starters: [] as Player[], bench: [] as Player[] }));
  for (const [tableId, group] of [["statTable1", "starters"], ["statTable2", "bench"]] as const) {
    const table = root.querySelector(`#${tableId}`);
    if (!table) return null;
    const headers = table.querySelectorAll("thead th").map((h) => text(h));
    if (headers[3] !== "Fan Pts" || headers[7] !== "Fan Pts") return null;
    for (const row of table.querySelectorAll("tbody tr")) {
      const cells = row.querySelectorAll("td");
      if (cells.length !== 11) continue;
      for (const side of [0, 1]) {
        const cell = cells[side === 0 ? 1 : 9];
        const team = teams[side];
        const name = text(cell?.querySelector("a.name"));
        if (!team || !cell || !name) continue;
        const points = text(cells[side === 0 ? 3 : 7]);
        if (!/^(?:-?\d+(?:\.\d+)?|–|—|-)$/u.test(points)) return null;
        team[group].push({ name, points, projected: text(cells[side === 0 ? 2 : 8]), slot: text(cells[side === 0 ? 4 : 6]), position: text(cell.querySelector(".ysf-player-name .D-b")), game: text(cell.querySelector(".ysf-game-status")).replace(/[\uE000-\uF8FF]/g, "").trim(), status: text(cell.querySelector(".ysf-player-status")), stats: text(cells[side === 0 ? 0 : 10]) });
      }
    }
  }
  if (teams.some((team) => !team.starters.length)) return null;
  return { week, checkedAt, teams };
}