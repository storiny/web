import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Divider from "./divider";

describe("<Divider />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Divider />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Divider />);
    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Divider as={"aside"} data-testid={"divider"} />
    );

    expect(getByTestId("divider").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders in horizontal orientation by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Divider data-testid={"divider"} />
    );

    expect(getByTestId("divider")).toHaveAttribute(
      "data-orientation",
      "horizontal"
    );
  });

  it("renders in vertical orientation", () => {
    const { getByTestId } = render_test_with_provider(
      <Divider data-testid={"divider"} orientation={"vertical"} />
    );

    expect(getByTestId("divider")).toHaveAttribute(
      "data-orientation",
      "vertical"
    );
  });
});
