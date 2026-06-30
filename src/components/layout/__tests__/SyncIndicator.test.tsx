import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SyncIndicator from "../SyncIndicator";

const mockUseData = vi.fn();

vi.mock("../../../contexts/DataContext", () => ({
  useData: () => mockUseData(),
  DataProvider: ({ children }: any) => children,
}));

describe("SyncIndicator", () => {
  it("shows saving status", () => {
    mockUseData.mockReturnValue({ saveStatus: "saving", saveError: null, isOnline: true, pendingCount: 0, syncNow: vi.fn() });
    render(<SyncIndicator />);
    expect(screen.getByText("جاري الحفظ")).toBeInTheDocument();
  });

  it("shows saved status", () => {
    mockUseData.mockReturnValue({ saveStatus: "saved", saveError: null, isOnline: true, pendingCount: 0, syncNow: vi.fn() });
    render(<SyncIndicator />);
    expect(screen.getByText("تم الحفظ")).toBeInTheDocument();
  });

  it("shows error status", () => {
    mockUseData.mockReturnValue({ saveStatus: "error", saveError: "خطأ في الاتصال", isOnline: true, pendingCount: 0, syncNow: vi.fn() });
    render(<SyncIndicator />);
    expect(screen.getByText("خطأ في الاتصال")).toBeInTheDocument();
  });

  it("does not render when idle and online", () => {
    mockUseData.mockReturnValue({ saveStatus: "idle", saveError: null, isOnline: true, pendingCount: 0, syncNow: vi.fn() });
    const { container } = render(<SyncIndicator />);
    expect(container.innerHTML).toBe("");
  });

  it("shows offline status when idle and offline", () => {
    mockUseData.mockReturnValue({ saveStatus: "idle", saveError: null, isOnline: false, pendingCount: 0, syncNow: vi.fn() });
    render(<SyncIndicator />);
    expect(screen.getByText("غير متصل")).toBeInTheDocument();
  });

  it("shows pending count when online with pending changes", () => {
    mockUseData.mockReturnValue({ saveStatus: "idle", saveError: null, isOnline: true, pendingCount: 3, syncNow: vi.fn() });
    render(<SyncIndicator />);
    expect(screen.getByText(/3 تغييرات معلقة/)).toBeInTheDocument();
  });
});
