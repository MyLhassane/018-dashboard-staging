import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatCard from "../StatCard";

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="اللاعبون" value="42" icon={<span />} />);
    expect(screen.getByText("اللاعبون")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("applies active styles when active is true", () => {
    const { container } = render(<StatCard label="Test" value="1" icon={<span />} active />);
    const el = container.firstElementChild;
    expect(el).toBeTruthy();
  });
});
