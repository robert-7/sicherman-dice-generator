import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NumberField } from "./NumberField";

function setup(value: number, overrides: Partial<Parameters<typeof NumberField>[0]> = {}) {
  const onChange = vi.fn();
  render(
    <NumberField
      label="Number of dice"
      value={value}
      min={1}
      max={4}
      onChange={onChange}
      hint="1-4 dice"
      {...overrides}
    />,
  );
  return { onChange };
}

describe("NumberField", () => {
  it("renders the label and hint", () => {
    setup(2);
    expect(screen.getByText("Number of dice")).toBeInTheDocument();
    expect(screen.getByText("1-4 dice")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toHaveValue(2);
  });

  it("decrements and increments within bounds", () => {
    const { onChange } = setup(2);
    fireEvent.click(screen.getByRole("button", { name: "Decrease Number of dice" }));
    expect(onChange).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Increase Number of dice" }));
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("clamps to the min and disables the decrement button at the lower bound", () => {
    const { onChange } = setup(1);
    const decrease = screen.getByRole("button", { name: "Decrease Number of dice" });
    expect(decrease).toBeDisabled();
    // update() still clamps if invoked below min (defensive against rounding).
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "0" } });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("clamps to the max and disables the increment button at the upper bound", () => {
    const { onChange } = setup(4);
    const increase = screen.getByRole("button", { name: "Increase Number of dice" });
    expect(increase).toBeDisabled();
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "9" } });
    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it("falls back to the min when the input is not a number", () => {
    const { onChange } = setup(2);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("accepts a valid typed number", () => {
    const { onChange } = setup(2);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "3" } });
    expect(onChange).toHaveBeenLastCalledWith(3);
  });
});
