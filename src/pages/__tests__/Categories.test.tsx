import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Categories from "../Categories";
import { DataProvider } from "../../contexts/DataContext";
import { AuthProvider } from "../../contexts/AuthContext";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  BrowserRouter: ({ children }: any) => children,
}));

const mockData = vi.hoisted(() => ({
  challenges: {},
  players: {},
  categories: {
    cat_1: { id: "cat_1", name: "World Cup", type: "trophy", media: "", numericIds: [1], description: "WC", sortOrder: 1 },
    cat_2: { id: "cat_2", name: "Premier League", type: "league", media: "", numericIds: [2], description: "EPL", sortOrder: 2 },
    cat_3: { id: "cat_3", name: "La Liga", type: "league", media: "", numericIds: [3], description: "LALIGA", sortOrder: 3 },
  },
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

describe("Categories Page", () => {
  it("renders page title", async () => {
    renderWithProviders(<Categories />);
    await waitFor(() => expect(screen.getByText("الفئات")).toBeInTheDocument());
  });

  it("shows category count", async () => {
    renderWithProviders(<Categories />);
    await waitFor(() => expect(screen.getByText(/3 فئة/)).toBeInTheDocument());
  });

  it("shows category names", async () => {
    renderWithProviders(<Categories />);
    await waitFor(() => {
      expect(screen.getByText("World Cup")).toBeInTheDocument();
      expect(screen.getByText("Premier League")).toBeInTheDocument();
    });
  });

  it("opens editor modal when clicking a category", async () => {
    renderWithProviders(<Categories />);
    await waitFor(() => expect(screen.getByText("World Cup")).toBeInTheDocument());
    await userEvent.click(screen.getByText("World Cup").closest("button")!);
    await waitFor(() => expect(screen.getByText("تعديل الفئة")).toBeInTheDocument());
  });

  it("shows new category modal when clicking جديد", async () => {
    renderWithProviders(<Categories />);
    await waitFor(() => expect(screen.getByText("جديد")).toBeInTheDocument());
    await userEvent.click(screen.getByText("جديد"));
    await waitFor(() => expect(screen.getByText("فئة جديدة")).toBeInTheDocument());
  });
});
