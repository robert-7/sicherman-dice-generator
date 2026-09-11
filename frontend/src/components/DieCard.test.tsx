import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DieCard } from "./DieCard";
import type { Die } from "../types";

const die: Die = {
  labels: [1, 2, 2, 3, 3, 4],
  max_label: 4,
  polynomial: "x^4 + 2x^3 + 2x^2 + x",
  cyclotomic_exponents: { "2": 1, "3": 1 },
};

describe("DieCard", () => {
  it("renders the die number, max chip, labels, and polynomial", () => {
    render(<DieCard die={die} index={0} />);
    expect(screen.getByText("Die 1")).toBeInTheDocument();
    expect(screen.getByText("max 4")).toBeInTheDocument();
    expect(screen.getByText("x^4 + 2x^3 + 2x^2 + x")).toBeInTheDocument();
    // Six faces, one per label (duplicates included).
    expect(screen.getByLabelText("Labels for die 1").children).toHaveLength(6);
  });

  it("wraps the color palette for indices beyond its length", () => {
    const { container } = render(<DieCard die={die} index={7} />);
    // index 7 % 6 palette entries -> "cyan" (second entry), and the label shows Die 8.
    expect(screen.getByText("Die 8")).toBeInTheDocument();
    expect(container.querySelector(".die-card")).toHaveClass("cyan");
  });
});
