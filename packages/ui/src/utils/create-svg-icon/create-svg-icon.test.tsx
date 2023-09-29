import React from "react";

import { SvgIconProps } from "src/components/svg-icon";
import { render_test_with_provider } from "src/redux/test-utils";

import { create_svg_icon } from "./create-svg-icon";

describe("create_svg_icon", () => {
  it("renders children", () => {
    const Icon = create_svg_icon(<span data-testid={"child"} />, "test", {
      "data-test": ""
    } as SvgIconProps);

    const { getByTestId } = render_test_with_provider(<Icon />);
    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes props to the component", () => {
    const Icon = create_svg_icon(<span />, "test", {
      "data-test": ""
    } as SvgIconProps);

    const { container } = render_test_with_provider(<Icon />);
    expect(container.querySelector("[data-test]")).toBeInTheDocument();
  });
});
