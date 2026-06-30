import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Challenges from "../Challenges";
import { DataProvider } from "../../contexts/DataContext";
import { AuthProvider } from "../../contexts/AuthContext";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  BrowserRouter: ({ children }: any) => children,
}));

const mockData = vi.hoisted(() => ({
  challenges: {
    1: { gameNumber: 1, remit: [[{ id: 1, name: "WC", type: 6, displayName: "WC" }]], players: [{ id: 1, f: "Messi", g: "Lionel", v: [1], p: "RW" }], publishedAt: null, updatedAt: "2026-01-01", updatedBy: "admin" },
    2: { gameNumber: 2, remit: [], players: [], publishedAt: null, updatedAt: "2026-01-01", updatedBy: "admin" },
    3: { gameNumber: 3, remit: [], players: [{ id: 1, f: "Ronaldo", g: "Cristiano", v: [], p: "ST" }], publishedAt: null, updatedAt: "2026-01-01", updatedBy: "admin" },
  },
  players: {},
  categories: { cat_1: { id: "cat_1", name: "World Cup", type: "trophy", media: "", numericIds: [1], description: "WC", sortOrder: 1 } },
  config: null,
  deployments: {},
}));

const mockAuth = vi.hoisted(() => ({
  auth: {},
  onAuthStateChanged: vi.fn((_auth: any, cb: any) => { cb({ uid: "admin" }); return () => {}; }),
  signOut: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  getAuth: vi.fn(() => ({})),
  connectAuthEmulator: vi.fn(),
}));

vi.mock("firebase/auth", () => mockAuth);

vi.mock("../../lib/firebase", () => ({
  db: {},
  auth: mockAuth.auth,
  ref: vi.fn((_db: any, path: string) => ({ path })),
  get: vi.fn(async (ref: { path: string }) => {
    const parts = ref.path.split("/");
    let val = (mockData as any)[parts[0]];
    if (parts.length > 1) val = val?.[parts[1]];
    return { exists: () => val !== undefined, val: () => val };
  }),
  set: vi.fn(),
  remove: vi.fn(),
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <DataProvider>
        {ui}
      </DataProvider>
    </AuthProvider>
  );
}

describe("Challenges Page", () => {
  it("renders page title", async () => {
    renderWithProviders(<Challenges />);
    await waitFor(() => expect(screen.getByText("التحديات")).toBeInTheDocument());
  });

  it("shows challenge count", async () => {
    renderWithProviders(<Challenges />);
    await waitFor(() => expect(screen.getByText(/3 تحدي/)).toBeInTheDocument());
  });

  it("shows challenge numbers", async () => {
    renderWithProviders(<Challenges />);
    await waitFor(() => {
      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText("#2")).toBeInTheDocument();
    });
  });

  it("opens editor modal when clicking a challenge", async () => {
    renderWithProviders(<Challenges />);
    await waitFor(() => expect(screen.getByText("#1")).toBeInTheDocument());
    await userEvent.click(screen.getByText("#1"));
    await waitFor(() => expect(screen.getByText(/تحدي #1/)).toBeInTheDocument());
  });

  it("shows new challenge modal when clicking جديد", async () => {
    renderWithProviders(<Challenges />);
    await waitFor(() => expect(screen.getByText("جديد")).toBeInTheDocument());
    await userEvent.click(screen.getByText("جديد"));
    await waitFor(() => expect(screen.getByText("تحدي جديد")).toBeInTheDocument());
  });
});
