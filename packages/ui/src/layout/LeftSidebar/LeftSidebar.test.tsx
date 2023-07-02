import { axe } from "@storiny/test-utils";
import { screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import LeftSidebar from "./LeftSidebar";
import { LeftSidebarProps } from "./LeftSidebar.props";

describe("<LeftSidebar />", () => {
  it("renders", () => {
    renderTestWithProvider(<LeftSidebar forceMount />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<LeftSidebar forceMount />);
    await screen.findByRole("button", { name: /log in/i });
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = renderTestWithProvider(<LeftSidebar forceMount />, {
      loggedIn: true
    });

    await screen.findByRole("button", { name: /write/i });
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders logged out state with default content", () => {
    renderTestWithProvider(<LeftSidebar forceMount />);

    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i })
    ).toBeInTheDocument();
  });

  it("renders logged in state", () => {
    renderTestWithProvider(<LeftSidebar forceMount />, { loggedIn: true });
    expect(screen.getByRole("button", { name: /write/i })).toBeInTheDocument();
  });

  it("does not render persona when logged out", () => {
    renderTestWithProvider(<LeftSidebar forceMount />);
    expect(screen.queryByTestId("lsb-banner")).not.toBeInTheDocument();
  });

  it("renders persona when logged in", async () => {
    renderTestWithProvider(<LeftSidebar forceMount />, { loggedIn: true });
    await screen.findByTestId("lsb-banner");
    expect(screen.getByTestId("lsb-banner")).toBeInTheDocument();
  });

  it("renders with custom children", () => {
    const { getByTestId } = renderTestWithProvider(
      <LeftSidebar forceMount>
        <span data-testid={"child"} />
      </LeftSidebar>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes props to the component slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <LeftSidebar
        componentProps={
          {
            wrapper: { "data-testid": "wrapper" }
          } as LeftSidebarProps["componentProps"]
        }
        forceMount
      />
    );

    expect(getByTestId("wrapper")).toBeInTheDocument();
  });
});
