import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Divider from "./Divider";

describe("<Divider />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Divider />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Divider />);
    await waitFor(async () =>
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
