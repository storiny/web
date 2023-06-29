import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import { screen } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Navbar from "./Navbar";

describe("<Navbar />", () => {
  it("renders", () => {
    renderTestWithProvider(<Navbar />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<Navbar />);
    await screen.findByRole("button", { name: /log in/i });
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = renderTestWithProvider(<Navbar />, {
      loggedIn: true,
    });

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders logged out state", () => {
    renderTestWithProvider(<Navbar />);

    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i })
    ).toBeInTheDocument();
  });

  it("renders logged in state", () => {
    renderTestWithProvider(<Navbar />, { loggedIn: true });

    expect(
      screen.getByRole("button", { name: /site and account options/i })
    ).toBeInTheDocument();
  });

  it("renders `minimal` variant", () => {
    renderTestWithProvider(<Navbar variant={"minimal"} />);

    expect(
      screen.queryByRole("button", { name: /log in/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /sign up/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /site and account options/i })
    ).not.toBeInTheDocument();
  });
});
