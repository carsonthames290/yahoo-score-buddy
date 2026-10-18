import { describe, test } from "node:test";
import { strictEqual, deepStrictEqual } from "node:assert";
import { readFileSync } from "node:fs";
import { parseLeagueExtras, parseMatchupDetail } from "./yahoo-details";

const players = readFileSync(new URL("./fixtures/yahoo-players.html", import.meta.url), "utf8");
const extras = readFileSync(new URL("./fixtures/yahoo-extras.html", import.meta.url), "utf8");
describe("Yahoo player and league details", () => {
  test("keeps actual player points separate from projections", () => {
    const team = parseMatchupDetail(players, 6, "now")?.teams[0];
    strictEqual(team?.starters.find((p) => p.name === "Jaxon Smith-Njigba")?.points, "19.40");
    strictEqual(team?.starters.find((p) => p.name === "Jaxon Smith-Njigba")?.projected, "18.41");
    strictEqual(team?.starters.find((p) => p.name === "Josh Allen")?.points, "–");
    strictEqual(team?.starters.length, 9);
    strictEqual(team?.bench.length, 6);
    strictEqual(parseMatchupDetail(players, 6, "now")?.teams[1]?.bench.find((p) => p.name === "Jaylen Waddle")?.points, "4.40");
  });
  test("refuses a different week or a page missing lineups", () => {
    strictEqual(parseMatchupDetail(players, 7, "now"), null);
    strictEqual(parseMatchupDetail("<title>Sign in</title>", 6, "now"), null);
  });
  test("reads all standings without changing ranks or totals", () => {
    const rows = parseLeagueExtras(extras).standings;
    strictEqual(rows.length, 6);
    deepStrictEqual(rows[0], ["1", "Water Crew Carson", "4-1-0", "694.72", "531.60", "L-1", "5", "3"]);
  });
  test("preserves waiver additions and drops", () => {
    const moves = parseLeagueExtras(extras).transactions;
    strictEqual(moves.length, 5);
    deepStrictEqual(moves[0]?.moves, [{ player: "Brock Purdy", action: "Waiver", position: "SF - QB" }, { player: "Jared Goff", action: "To Waivers", position: "Det - QB" }]);
  });
});