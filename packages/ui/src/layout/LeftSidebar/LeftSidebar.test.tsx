import { axe } from "@storiny/test-utils";
import { screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import LeftSidebar from "./LeftSidebar";
import { LeftSidebarProps } from "./LeftSidebar.props";

describe("<LeftSidebar />", () => {
  it("renders", () => {
    render_test_with_provider(<LeftSidebar forceMount />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<LeftSidebar forceMount />);
    await screen.findByRole("button", { name: /log in/i });
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(
      <LeftSidebar forceMount />,
      {
        loggedIn: true
      }
    );

    await screen.findByRole("button", { name: /write/i });
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders logged out state with default content", () => {
    render_test_with_provider(<LeftSidebar forceMount />);

    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i })
    ).toBeInTheDocument();
  });

  it("renders logged in state", () => {
    render_test_with_provider(<LeftSidebar forceMount />, { loggedIn: true });
    expect(screen.getByRole("button", { name: /write/i })).toBeInTheDocument();
  });

  it("does not render persona when logged out", () => {
    render_test_with_provider(<LeftSidebar forceMount />);
    expect(screen.queryByTestId("lsb-banner")).not.toBeInTheDocument();
  });

  it("renders persona when logged in", async () => {
    render_test_with_provider(<LeftSidebar forceMount />, { loggedIn: true });
    await screen.findByTestId("lsb-banner");
    expect(screen.getByTestId("lsb-banner")).toBeInTheDocument();
  });

  it("renders with custom children", () => {
    const { getByTestId } = render_test_with_provider(
      <LeftSidebar forceMount>
        <span data-testid={"child"} />
      </LeftSidebar>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes props to the component slots", () => {
    const { getByTestId } = render_test_with_provider(
      <LeftSidebar
        component_props={
          {
            wrapper: { "data-testid": "wrapper" }
          } as LeftSidebarProps["component_props"]
        }
        forceMount
      />
    );

    expect(getByTestId("wrapper")).toBeInTheDocument();
  });
});
