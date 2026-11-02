import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "@/src/app/page";

describe("Home page", () => {
  it('muestra el wordmark "Ki<i"', () => {
    render(<Home />);
    expect(screen.getByRole("main")).toBeDefined();
    expect(screen.getByText("<")).toBeDefined();
  });
});
