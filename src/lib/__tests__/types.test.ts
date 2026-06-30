import { describe, it, expect } from "vitest";
import type { Challenge, Player, Category, RemitItem, ChallengePlayer } from "../types";

describe("Types", () => {
  it("Challenge type has required fields", () => {
    const challenge: Challenge = {
      gameNumber: 1,
      remit: [],
      players: [],
      publishedAt: null,
      updatedAt: "2026-01-01T00:00:00.000Z",
      updatedBy: "admin",
    };
    expect(challenge.gameNumber).toBe(1);
    expect(challenge.remit).toEqual([]);
    expect(challenge.players).toEqual([]);
    expect(challenge.publishedAt).toBeNull();
  });

  it("Challenge ensures players and remit default to empty arrays", () => {
    const raw = { gameNumber: 5, publishedAt: null, updatedAt: "", updatedBy: "admin" };
    const challenge: Challenge = { ...raw, players: raw.players ?? [], remit: raw.remit ?? [] };
    expect(challenge.players).toEqual([]);
    expect(challenge.remit).toEqual([]);
  });

  it("Player type has all required fields", () => {
    const player: Player = {
      id: 10,
      f: "Test",
      g: "Player",
      positions: ["GK"],
      categoryLinks: {},
      challengeCount: 3,
    };
    expect(player.id).toBe(10);
    expect(player.positions).toContain("GK");
    expect(player.challengeCount).toBe(3);
  });

  it("ChallengePlayer stores category links in v array", () => {
    const cp: ChallengePlayer = { id: 1, f: "Player", v: [1, 2, 3], p: "CM" };
    expect(cp.v).toHaveLength(3);
    expect(cp.v).toContain(2);
  });

  it("RemitItem supports optional fields", () => {
    const item: RemitItem = { id: 1, name: "Test", type: 3, displayName: "TST", suffix: "s", prefix: "p", helperText: "help" };
    expect(item.suffix).toBe("s");
    expect(item.prefix).toBe("p");
    expect(item.helperText).toBe("help");
  });

  it("Category handles empty numericIds", () => {
    const cat: Category = { id: "cat_0", name: "Empty", type: "achievement", media: "", numericIds: [], description: "", sortOrder: 0 };
    expect(cat.numericIds).toHaveLength(0);
  });
});
