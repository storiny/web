import { axe } from "@storiny/test-utils";
import { screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Footer from "./Footer";

describe("<Footer />", () => {
  it("renders", () => {
    renderTestWithProvider(<Footer />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<Footer />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /write/i })).toHaveAttribute(
        "href",
        `/login?to=${encodeURIComponent("/new")}`
      )
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders logged out state", () => {
    const { getByRole } = renderTestWithProvider(<Footer />);

    expect(getByRole("button", { name: /write/i })).toHaveAttribute(
      "href",
      `/login?to=${encodeURIComponent("/new")}`
    );
  });

  it("renders logged in state", () => {
    const { getByRole } = renderTestWithProvider(<Footer />, {
      loggedIn: true,
    });

    expect(getByRole("button", { name: /write/i })).toHaveAttribute(
      "href",
      "/new"
    );
  });
});
