/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { parseSharedMatchup } from "./shared-matchup";

const page = `<meta property="og:title" content="Water Crew Carson 27.40 – Pick 6 James Henry 0.00 · Week 6 | My Fantasy Scores"><meta content="Live · cool kid clan. See the matchup and track all your fantasy leagues in one place." property="og:description">`;

describe("public shared matchup", () => {
  test("reads the supplied Week 6 matchup without altering scores", () => {
    expect(parseSharedMatchup(page, "2026-10-18T03:36:00Z")).toEqual({ league: "cool kid clan", week: 6, teams: [{ name: "Water Crew Carson", points: "27.40" }, { name: "Pick 6 James Henry", points: "0.00" }], checkedAt: "2026-10-18T03:36:00Z" });
  });
  test("does not invent scores when the source returns a protection page", () => {
    expect(parseSharedMatchup("<title>Security Checkpoint</title>", "now")).toBeNull();
  });
  test("preserves negative fantasy points and escaped team names", () => {
    const html = page.replace("Water Crew Carson 27.40", "Carson &amp; Crew -2.50");
    expect(parseSharedMatchup(html, "now")?.teams[0]).toEqual({ name: "Carson & Crew", points: "-2.50" });
  });
});