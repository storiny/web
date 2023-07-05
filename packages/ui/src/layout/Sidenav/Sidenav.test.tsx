import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Sidenav from "./Static";

describe("<Sidenav />", () => {
  it("renders", () => {
    renderTestWithProvider(<Sidenav />);
  });

  it("renders logged out state", () => {
    const { queryByRole, getByRole } = renderTestWithProvider(<Sidenav />);

    expect(
      queryByRole("button", { name: /more menu options/i })
    ).not.toBeInTheDocument();
    expect(getByRole("button", { name: /write a new story/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  it("renders logged in state", () => {
    const { getByRole } = renderTestWithProvider(<Sidenav />, {
      loggedIn: true
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
