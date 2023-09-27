import { axe } from "@storiny/test-utils";
import { screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Footer from "./Footer";

describe("<Footer />", () => {
  it("renders", () => {
    render_test_with_provider(<Footer />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Footer />);

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
    const { getByRole } = render_test_with_provider(<Footer />);

    expect(getByRole("button", { name: /write/i })).toHaveAttribute(
      "href",
      `/login?to=${encodeURIComponent("/new")}`
    );
  });

  it("renders logged in state", () => {
    const { getByRole } = render_test_with_provider(<Footer />, {
      loggedIn: true
    });

    expect(getByRole("button", { name: /write/i })).toHaveAttribute(
      "href",
      "/new"
    );
  });
});
