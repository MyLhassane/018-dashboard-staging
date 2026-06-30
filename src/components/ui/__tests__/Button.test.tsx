import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "../Button";

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>حفظ</Button>);
    expect(screen.getByText("حفظ")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>انقر</Button>);
    await userEvent.click(screen.getByText("انقر"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows loading spinner when loading", () => {
    render(<Button loading>حفظ</Button>);
    const btn = screen.getByText("حفظ").closest("button");
    expect(btn).toBeDisabled();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>حفظ</Button>);
    const btn = screen.getByText("حفظ").closest("button");
    expect(btn).toBeDisabled();
  });

  it("renders icon when provided", () => {
    render(<Button icon={<span data-testid="icon">+</span>}>إضافة</Button>);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    const { container } = render(<Button variant="danger">حذف</Button>);
    const btn = container.querySelector("button");
    expect(btn).toBeTruthy();
  });

  it("applies size classes", () => {
    const { container } = render(<Button size="lg">كبير</Button>);
    const btn = container.querySelector("button");
    expect(btn).toBeTruthy();
  });
});
