import { axe } from "@storiny/test-utils";
import { screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import BottomNavigation from "./bottom-navigation";

describe("<BottomNavigation />", () => {
  it("renders default state", () => {
    const { getByRole } = render_test_with_provider(
      <BottomNavigation force_mount />,
      {
        logged_in: true
      }
    );

    expect(getByRole("button", { name: /new story/i })).toHaveAttribute(
      "href",
      "/new"
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <BottomNavigation force_mount />,
      { logged_in: true }
    );

    await wait_for(() =>
      expect(
        screen.getByRole("button", { name: /new story/i })
      ).toHaveAttribute("href", "/new")
    );
    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("adds `bottom-navigation` class to the body", () => {
    render_test_with_provider(<BottomNavigation force_mount />, {
      logged_in: true
    });
    expect(document.body).toHaveClass("bottom-navigation");
  });
});
