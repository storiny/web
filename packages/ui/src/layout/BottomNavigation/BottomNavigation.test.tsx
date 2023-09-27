import { axe } from "@storiny/test-utils";
import { screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import BottomNavigation from "./BottomNavigation";

describe("<BottomNavigation />", () => {
  it("renders default state", () => {
    const { getByRole } = render_test_with_provider(
      <BottomNavigation forceMount />,
      {
        loggedIn: true
      }
    );

    expect(getByRole("button", { name: /new story/i })).toHaveAttribute(
      "href",
      "/new"
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <BottomNavigation forceMount />,
      { loggedIn: true }
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /new story/i })
      ).toHaveAttribute("href", "/new")
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("adds `bottom-navigation` class to the body", () => {
    render_test_with_provider(<BottomNavigation forceMount />, {
      loggedIn: true
    });
    expect(document.body).toHaveClass("bottom-navigation");
  });
});
