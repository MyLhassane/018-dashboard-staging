import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Players from "../Players";
import { DataProvider } from "../../contexts/DataContext";
import { AuthProvider } from "../../contexts/AuthContext";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  BrowserRouter: ({ children }: any) => children,
}));

const mockData = vi.hoisted(() => {
  const players: Record<number, any> = {};
  for (let i = 1; i <= 120; i++) {
    players[i] = {
      id: i,
      f: `Player${i}`,
      g: `First${i}`,
      positions: ["ST"],
      categoryLinks: {},
      challengeCount: i % 5,
      difficulty: i % 3 === 0 ? "Elite" : i % 3 === 1 ? "Medium" : "Beginner",
    };
  }
  return {
    challenges: {},
    players,
    categories: {},
    config: null,
    deployments: {},
  };
});

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

describe("Players Page", () => {
  it("renders page title", async () => {
    renderWithProviders(<Players />);
    await waitFor(() => expect(screen.getByText("اللاعبون")).toBeInTheDocument());
  });

  it("shows total player count", async () => {
    renderWithProviders(<Players />);
    await waitFor(() => expect(screen.getByText(/120 لاعب/)).toBeInTheDocument());
  });

  it("shows first page of players (25 per page)", async () => {
    renderWithProviders(<Players />);
    await waitFor(() => {
      expect(screen.getAllByText("Player120").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Player96").length).toBeGreaterThan(0);
    });
    expect(screen.queryAllByText("Player95")).toHaveLength(0);
  });

  it("navigates to page 2", async () => {
    renderWithProviders(<Players />);
    await waitFor(() => expect(screen.getAllByText("Player120").length).toBeGreaterThan(0));

    const page2Button = screen.getAllByText("2").find(
      (el) => el.tagName === "BUTTON" && el.closest("[class*='flex items-center gap-1']")
    );
    await userEvent.click(page2Button!);

    await waitFor(() => {
      expect(screen.getAllByText("Player95").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Player71").length).toBeGreaterThan(0);
    });
  });

  it("shows pagination info", async () => {
    renderWithProviders(<Players />);
    await waitFor(() => {
      expect(screen.getAllByText(/1–25 من 120/).length).toBeGreaterThan(0);
    });
  });

  it("opens editor modal when clicking a player", async () => {
    renderWithProviders(<Players />);
    await waitFor(() => expect(screen.getAllByText("Player120").length).toBeGreaterThan(0));
    await userEvent.click(screen.getAllByText("Player120")[0]);
    await waitFor(() => expect(screen.getByText("تعديل اللاعب")).toBeInTheDocument());
  });

  it("shows new player modal when clicking جديد", async () => {
    renderWithProviders(<Players />);
    await waitFor(() => expect(screen.getByText("جديد")).toBeInTheDocument());
    await userEvent.click(screen.getByText("جديد"));
    await waitFor(() => expect(screen.getByText("لاعب جديد")).toBeInTheDocument());
  });

  it("resets to page 1 when search changes", async () => {
    renderWithProviders(<Players />);
    await waitFor(() => expect(screen.getAllByText("Player120").length).toBeGreaterThan(0));

    const page2Btns = screen.getAllByText("2").filter(
      (el) => el.tagName === "BUTTON" && el.closest("[class*='flex items-center gap-1']")
    );
    await userEvent.click(page2Btns[0]);
    await waitFor(() => expect(screen.getAllByText("Player71").length).toBeGreaterThan(0));

    const searchInput = screen.getByPlaceholderText("بحث عن لاعب...");
    await userEvent.type(searchInput, "Messi");

    await waitFor(() => {
      expect(screen.queryByText("لم يتم العثور على لاعبين")).toBeInTheDocument();
    });
  });
});
