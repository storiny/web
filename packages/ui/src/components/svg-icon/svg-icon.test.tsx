import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import SvgIcon from "./svg-icon";

describe("<SvgIcon />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <SvgIcon>
        <span />
      </SvgIcon>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <SvgIcon>
        <path d={""} />
      </SvgIcon>
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders children", () => {
    const { getByTestId } = render_test_with_provider(
      <SvgIcon>
        <span data-testid={"child"} />
      </SvgIcon>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("renders custom size", () => {
    const { getByTestId } = render_test_with_provider(
      <SvgIcon data-testid={"svg-icon"} size={32}>
        <span />
      </SvgIcon>
    );

    expect(getByTestId("svg-icon")).toHaveStyle({
      "--icon-size": "32px"
    });
  });

  it("rotates the component", () => {
    const { getByTestId } = render_test_with_provider(
      <SvgIcon data-testid={"svg-icon"} rotation={45}>
        <span />
      </SvgIcon>
    );

    expect(getByTestId("svg-icon")).toHaveStyle({
      "--rotation": "45deg"
    });
  });
});
