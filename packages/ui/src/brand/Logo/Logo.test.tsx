import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Logo from "./Logo";

describe("<Logo />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Logo />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<Logo />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders size `64` by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <Logo data-testid={"logo"} />
    );

    expect(getByTestId("logo")).toHaveStyle({
      "--size": "64px",
    });
  });

  it("renders custom size", () => {
    const { getByTestId } = renderTestWithProvider(
      <Logo data-testid={"logo"} size={48} />
    );

    expect(getByTestId("logo")).toHaveStyle({
      "--size": "48px",
    });
  });
});
