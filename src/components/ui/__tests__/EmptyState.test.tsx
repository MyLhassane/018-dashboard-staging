import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EmptyState from "../EmptyState";
import Button from "../Button";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState icon="📦" title="لا توجد بيانات" description="أضف بيانات جديدة" />);
    expect(screen.getByText("لا توجد بيانات")).toBeInTheDocument();
    expect(screen.getByText("أضف بيانات جديدة")).toBeInTheDocument();
  });

  it("renders action button when provided", () => {
    render(<EmptyState icon="📦" title="فارغ" description="أضف الآن" action={<Button>إضافة</Button>} />);
    expect(screen.getByText("إضافة")).toBeInTheDocument();
  });

  it("renders icon emoji", () => {
    render(<EmptyState icon="🎯" title="Test" description="Test" />);
    expect(screen.getByText("🎯")).toBeInTheDocument();
  });
});
