import React from "react";

import { SvgIconProps } from "~/components/SvgIcon";
import { render_test_with_provider } from "src/redux/test-utils";

import { createSvgIcon } from "./createSvgIcon";

describe("createSvgIcon", () => {
  it("renders children", () => {
    const Icon = createSvgIcon(<span data-testid={"child"} />, "test", {
      "data-test": ""
    } as SvgIconProps);

    const { getByTestId } = render_test_with_provider(<Icon />);
    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("passes props to the component", () => {
    const Icon = createSvgIcon(<span />, "test", {
      "data-test": ""
    } as SvgIconProps);

    const { container } = render_test_with_provider(<Icon />);
    expect(container.querySelector("[data-test]")).toBeInTheDocument();
  });
});
