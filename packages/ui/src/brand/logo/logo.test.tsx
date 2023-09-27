import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Logo from "./logo";

describe("<Logo />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Logo />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Logo />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders size `64` by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Logo data-testid={"logo"} />
    );

    expect(getByTestId("logo")).toHaveStyle({
      "--size": "64px"
    });
  });

  it("renders custom size", () => {
    const { getByTestId } = render_test_with_provider(
      <Logo data-testid={"logo"} size={48} />
    );

    expect(getByTestId("logo")).toHaveStyle({
      "--size": "48px"
    });
  });
});
