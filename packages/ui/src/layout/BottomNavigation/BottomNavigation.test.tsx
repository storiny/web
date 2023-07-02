import { axe } from "@storiny/test-utils";
import { screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import BottomNavigation from "./BottomNavigation";

describe("<BottomNavigation />", () => {
  it("renders default state", () => {
    const { getByRole } = renderTestWithProvider(
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
    const { container } = renderTestWithProvider(
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
    renderTestWithProvider(<BottomNavigation forceMount />, { loggedIn: true });
    expect(document.body).toHaveClass("bottom-navigation");
  });
});
