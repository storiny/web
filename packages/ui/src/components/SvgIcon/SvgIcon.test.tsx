import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import SvgIcon from "./SvgIcon";

describe("<SvgIcon />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(
      <SvgIcon>
        <span />
      </SvgIcon>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <SvgIcon>
        <path d={""} />
      </SvgIcon>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders children", () => {
    const { getByTestId } = renderTestWithProvider(
      <SvgIcon>
        <span data-testid={"child"} />
      </SvgIcon>
    );

    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("renders custom size", () => {
    const { getByTestId } = renderTestWithProvider(
      <SvgIcon data-testid={"svg-icon"} size={32}>
        <span />
      </SvgIcon>
    );

    expect(getByTestId("svg-icon")).toHaveStyle({
      "--icon-size": "32px"
    });
  });

  it("rotates the component", () => {
    const { getByTestId } = renderTestWithProvider(
      <SvgIcon data-testid={"svg-icon"} rotation={45}>
        <span />
      </SvgIcon>
    );

    expect(getByTestId("svg-icon")).toHaveStyle({
      "--rotation": "45deg"
    });
  });
});
