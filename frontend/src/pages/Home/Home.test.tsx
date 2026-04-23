import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Home } from "./Home";

describe("Home", () => {
  it("renders welcome heading", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByText("Welcome to the Home Page")).toBeInTheDocument();
  });

  it("renders login and register links", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
  });
});
