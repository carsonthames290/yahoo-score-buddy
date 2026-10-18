import { describe, test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { readFileSync } from "node:fs";
import { LEAGUE_URL, parseYahooLeague } from "./yahoo-league";

const html = readFileSync(new URL("./fixtures/yahoo-league.html", import.meta.url), "utf8");
describe("Yahoo league scoreboard", () => {
  test("uses the supplied Yahoo league", () => {
    strictEqual(LEAGUE_URL, "https://football.fantasysports.yahoo.com/f1/1285342");
  });
  test("reads all three Week 6 matchups and actual totals, not projections", () => {
    const board = parseYahooLeague(html, "2026-10-18T03:42:00Z");
    strictEqual(board?.league, "cool kid clan");
    strictEqual(board?.week, 6);
    strictEqual(board?.checkedAt, "2026-10-18T03:42:00Z");
    deepStrictEqual(board?.matchups.map((m) => m.teams), [
      [{ name: "Water Crew Carson", points: "27.40" }, { name: "Pick 6 James Henry", points: "0.00" }],
      [{ name: "Shehzaad Island", points: "12.00" }, { name: "D'glester Hardunkichud", points: "0.00" }],
      [{ name: "Sunday Best Brayden", points: "3.00" }, { name: "LeBron lovers", points: "0.00" }],
    ]);
  });
  test("never invents scores from a blocked or incomplete page", () => {
    strictEqual(parseYahooLeague("<title>Sign in to Yahoo</title>", "now"), null);
    strictEqual(parseYahooLeague(html.replace('<div class="Fz-lg">27.40</div>', ''), "now"), null);
  });
  test("preserves escaped names and negative scores", () => {
    const changed = html.replace("Water Crew Carson", "Carson &amp; Crew").replace('<div class="Fz-lg">27.40</div>', '<div class="Fz-lg">-2.50</div>');
    deepStrictEqual(parseYahooLeague(changed, "now")?.matchups[0]?.teams[0], { name: "Carson & Crew", points: "-2.50" });
  });
});