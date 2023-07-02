import React from "react";

import { SvgIconProps } from "~/components/SvgIcon";
import { renderTestWithProvider } from "~/redux/testUtils";

import { createSvgIcon } from "./createSvgIcon";

describe("createSvgIcon", () => {
  it("renders children", () => {
    const Icon = createSvgIcon(<span data-testid={"child"} />, "test", {
      "data-test": ""
    } as SvgIconProps);

    const { getByTestId } = renderTestWithProvider(<Icon />);
    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes props to the component", () => {
    const Icon = createSvgIcon(<span />, "test", {
      "data-test": ""
    } as SvgIconProps);

    const { container } = renderTestWithProvider(<Icon />);
    expect(container.querySelector("[data-test]")).toBeInTheDocument();
  });
});
