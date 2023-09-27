import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import { screen } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Navbar from "./Navbar";

describe("<Navbar />", () => {
  it("renders", () => {
    render_test_with_provider(<Navbar />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Navbar />);
    await screen.findByRole("button", { name: /log in/i });
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(<Navbar />, {
      loggedIn: true
    });

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders logged out state", () => {
    render_test_with_provider(<Navbar />);

    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i })
    ).toBeInTheDocument();
  });

  it("renders logged in state", () => {
    render_test_with_provider(<Navbar />, { loggedIn: true });

    expect(
      screen.getByRole("button", { name: /site and account options/i })
    ).toBeInTheDocument();
  });

  it("renders `minimal` variant", () => {
    render_test_with_provider(<Navbar variant={"minimal"} />);

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
