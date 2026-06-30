import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { DataProvider, useData } from "../DataContext";

const mockFirebase = vi.hoisted(() => {
  const store: Record<string, any> = { challenges: { 1: { gameNumber: 1, remit: [], players: [], publishedAt: null, updatedAt: "", updatedBy: "admin" } }, players: { 1: { id: 1, f: "Test", g: "", positions: [], categoryLinks: {}, challengeCount: 0 } }, categories: { cat_1: { id: "cat_1", name: "Test", type: "league", media: "", numericIds: [1], description: "", sortOrder: 1 } }, config: { general: { startDate: "", cardSize: 16, cardSizeOptions: [16], totalAttempts: 42, playerTimer: 10, scoring: { correctPoints: 3 } }, roomCategories: {}, theme: { primaryColor: "#fff", surfaceColor: "#000" } }, deployments: {} };
  return {
    ref: vi.fn((_db: any, path: string) => ({ path })),
    get: vi.fn(async (ref: { path: string }) => ({ exists: () => ref.path in store, val: () => store[ref.path] })),
    set: vi.fn(async (ref: { path: string }, data: any) => { store[ref.path] = data; }),
    remove: vi.fn(async (ref: { path: string }) => { delete store[ref.path]; }),
    update: vi.fn(),
  };
});

vi.mock("../../lib/firebase", () => ({
  db: {},
  ref: mockFirebase.ref,
  get: mockFirebase.get,
  set: mockFirebase.set,
  remove: mockFirebase.remove,
  update: mockFirebase.update,
}));

function TestConsumer() {
  const data = useData();
  return (
    <div>
      <span data-testid="challenges">{data.challenges.length}</span>
      <span data-testid="players">{data.players.length}</span>
      <span data-testid="categories">{Object.keys(data.categories).length}</span>
      <span data-testid="loading">{data.loading ? "loading" : "loaded"}</span>
      <span data-testid="saveStatus">{data.saveStatus}</span>
    </div>
  );
}

describe("DataContext", () => {
  beforeEach(() => {
    mockFirebase.get.mockClear();
    mockFirebase.set.mockClear();
  });

  it("loads data on mount", async () => {
    render(
      <DataProvider>
        <TestConsumer />
      </DataProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("challenges").textContent).toBe("1");
      expect(screen.getByTestId("players").textContent).toBe("1");
      expect(screen.getByTestId("categories").textContent).toBe("1");
    });
  });

  it("shows loaded state after data fetch", async () => {
    render(
      <DataProvider>
        <TestConsumer />
      </DataProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("loaded");
    });
  });

  it("starts with idle saveStatus", async () => {
    render(
      <DataProvider>
        <TestConsumer />
      </DataProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("saveStatus").textContent).toBe("idle");
    });
  });
});
