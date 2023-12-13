import { axe } from "@storiny/test-utils";
import { screen } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Footer from "./footer";

describe("<Footer />", () => {
  it("renders", () => {
    render_test_with_provider(<Footer />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Footer />);

    expect(screen.getByRole("button", { name: /write/i })).toHaveAttribute(
      "href",
      `/login?to=${encodeURIComponent("/new")}`
    );

    expect(await axe(container)).toHaveNoViolations();
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
      logged_in: true
    });

    expect(getByRole("button", { name: /write/i })).toHaveAttribute(
      "href",
      "/new"
    );
  });
});
