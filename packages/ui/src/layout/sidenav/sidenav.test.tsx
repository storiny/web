import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Sidenav from "./static";

describe("<Sidenav />", () => {
  it("renders", () => {
    render_test_with_provider(<Sidenav />);
  });

  it("renders logged out state", () => {
    const { queryByRole, getByRole } = render_test_with_provider(<Sidenav />);

    expect(
      queryByRole("button", { name: /more menu options/i })
    ).not.toBeInTheDocument();
    expect(getByRole("button", { name: /write a new story/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  it("renders logged in state", () => {
    const { getByRole } = render_test_with_provider(<Sidenav />, {
      logged_in: true
    });

    expect(
      getByRole("button", { name: /more menu options/i })
    ).toBeInTheDocument();
    expect(getByRole("button", { name: /write a new story/i })).toHaveAttribute(
      "href",
      "/new"
    );
  });
});
