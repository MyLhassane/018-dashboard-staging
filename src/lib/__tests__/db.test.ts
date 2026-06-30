import { describe, it, expect, beforeEach } from "vitest";
import { createMockFirebase } from "../../test/mock-firebase";

const mockFirebase = createMockFirebase();

vi.mock("../firebase", () => ({
  db: mockFirebase.db,
  ref: mockFirebase.ref,
  get: mockFirebase.get,
  set: mockFirebase.set,
  update: mockFirebase.update,
  remove: mockFirebase.remove,
  onValue: mockFirebase.onValue,
}));

const {
  getChallenge, getChallengeList, getFullChallengeList, setChallenge, deleteChallenge,
  getPlayer, getPlayerList, getFullPlayerList, setPlayer, deletePlayer, searchPlayers,
  getCategories, setCategory, deleteCategory,
  getConfig, setConfig,
  getDeployments, recordDeployment,
  getDashboardStats,
} = await import("../db");

const mockPlayers = [
  { id: 1, f: "Messi", g: "Lionel", positions: ["RW", "CF"], categoryLinks: {}, challengeCount: 5 },
  { id: 2, f: "Ronaldo", g: "Cristiano", positions: ["ST", "LW"], categoryLinks: {}, challengeCount: 4 },
  { id: 3, f: "Mbappe", g: "Kylian", positions: ["LW", "ST"], categoryLinks: {}, challengeCount: 3 },
  { id: 4, f: "Neymar", g: "Jr", positions: ["LW", "CAM"], categoryLinks: {}, challengeCount: 2 },
];

const mockChallenges = [
  { gameNumber: 1, remit: [[{ id: 1, name: "WC", type: 6, displayName: "WC" }]], players: [], publishedAt: null, updatedAt: "", updatedBy: "admin" },
  { gameNumber: 2, remit: [], players: [], publishedAt: null, updatedAt: "", updatedBy: "admin" },
];

const mockCategories = {
  cat_1: { id: "cat_1", name: "World Cup", type: "trophy" as const, media: "", numericIds: [1], description: "WC", sortOrder: 1 },
};

const mockDefaultConfig = {
  general: { startDate: "", cardSize: 16, cardSizeOptions: [16], totalAttempts: 42, playerTimer: 10, scoring: { correctPoints: 3 } },
  roomCategories: {},
  theme: { primaryColor: "#fff", surfaceColor: "#000" },
};

describe("db.ts", () => {
  beforeEach(() => {
    Object.keys(mockFirebase.store).forEach((k) => delete mockFirebase.store[k]);
  });

  describe("Challenges", () => {
    it("getChallengeList returns empty when no data", async () => {
      expect(await getChallengeList()).toEqual([]);
    });

    it("getChallengeList returns game numbers", async () => {
      mockFirebase.store.challenges = { 1: { gameNumber: 1 }, 2: { gameNumber: 2 } };
      const list = await getChallengeList();
      expect(list).toHaveLength(2);
    });

    it("getChallenge returns null for missing", async () => {
      expect(await getChallenge(999)).toBeNull();
    });

    it("setChallenge writes and getChallenge reads", async () => {
      await setChallenge(1, mockChallenges[0]);
      const read = await getChallenge(1);
      expect(read).not.toBeNull();
      expect(read!.gameNumber).toBe(1);
    });

    it("getFullChallengeList returns all challenges", async () => {
      mockFirebase.store.challenges = { 1: mockChallenges[0], 2: mockChallenges[1] };
      expect(await getFullChallengeList()).toHaveLength(2);
    });

    it("deleteChallenge removes challenge", async () => {
      await setChallenge(1, mockChallenges[0]);
      await deleteChallenge(1);
      expect(await getChallenge(1)).toBeNull();
    });
  });

  describe("Players", () => {
    it("getPlayerList returns empty when no data", async () => {
      expect(await getPlayerList()).toEqual([]);
    });

    it("setPlayer writes and getPlayer reads", async () => {
      await setPlayer(1, mockPlayers[0]);
      const p = await getPlayer(1);
      expect(p).not.toBeNull();
      expect(p!.f).toBe("Messi");
    });

    it("getFullPlayerList returns all players", async () => {
      mockFirebase.store.players = { 1: mockPlayers[0], 2: mockPlayers[1] };
      expect(await getFullPlayerList()).toHaveLength(2);
    });

    it("deletePlayer removes player", async () => {
      await setPlayer(1, mockPlayers[0]);
      await deletePlayer(1);
      expect(await getPlayer(1)).toBeNull();
    });

    it("searchPlayers filters by name", async () => {
      mockFirebase.store.players = Object.fromEntries(mockPlayers.map((p) => [p.id, p]));
      const results = await searchPlayers("messi");
      expect(results).toHaveLength(1);
      expect(results[0].f).toBe("Messi");
    });

    it("searchPlayers returns all when no query", async () => {
      mockFirebase.store.players = Object.fromEntries(mockPlayers.map((p) => [p.id, p]));
      expect(await searchPlayers("")).toHaveLength(4);
    });
  });

  describe("Categories", () => {
    it("getCategories returns {} when empty", async () => {
      expect(await getCategories()).toEqual({});
    });

    it("setCategory and getCategories roundtrip", async () => {
      mockFirebase.store.categories = {};
      await setCategory("cat_1", mockCategories.cat_1);
      const cats = await getCategories();
      expect(cats.cat_1.name).toBe("World Cup");
    });

    it("deleteCategory removes category", async () => {
      await setCategory("cat_1", mockCategories.cat_1);
      await deleteCategory("cat_1");
      const cats = await getCategories();
      expect(cats.cat_1).toBeUndefined();
    });
  });

  describe("Config", () => {
    it("getConfig returns null when empty", async () => {
      expect(await getConfig()).toBeNull();
    });

    it("setConfig and getConfig roundtrip", async () => {
      await setConfig(mockDefaultConfig);
      const cfg = await getConfig();
      expect(cfg).not.toBeNull();
      expect(cfg!.general.cardSize).toBe(16);
    });
  });

  describe("Deployments", () => {
    it("getDeployments returns empty when none", async () => {
      expect(await getDeployments()).toEqual([]);
    });

    it("recordDeployment and getDeployments roundtrip", async () => {
      const dep = { deployedAt: "2026-01-01T00:00:00.000Z", deployedBy: "test", status: "success" as const, vercelUrl: "https://test.vercel.app", summary: { challenges: 5, players: 10 } };
      await recordDeployment(dep);
      const deploys = await getDeployments();
      expect(deploys).toHaveLength(1);
      expect(deploys[0].summary.challenges).toBe(5);
    });
  });

  describe("getDashboardStats", () => {
    it("returns zeroes when empty", async () => {
      const stats = await getDashboardStats();
      expect(stats.totalPlayers).toBe(0);
      expect(stats.totalChallenges).toBe(0);
      expect(stats.totalCategories).toBe(0);
      expect(stats.lastDeployment).toBeNull();
    });

    it("returns correct counts", async () => {
      mockFirebase.store.players = Object.fromEntries(mockPlayers.map((p) => [p.id, p]));
      mockFirebase.store.challenges = Object.fromEntries(mockChallenges.map((c) => [c.gameNumber, c]));
      mockFirebase.store.categories = mockCategories;
      const stats = await getDashboardStats();
      expect(stats.totalPlayers).toBe(4);
      expect(stats.totalChallenges).toBe(2);
      expect(stats.totalCategories).toBe(1);
    });
  });
});
