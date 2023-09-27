import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import Tabs from "./Tabs";
import { TabsOrientation } from "./Tabs.props";

describe("<Tabs />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(<Tabs />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <Tabs as={"aside"} data-testid={"tabs"} />
    );
    expect(getByTestId("tabs").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with horizontal orientation by default", () => {
    const { getByTestId } = render_test_with_provider(
      <Tabs data-testid={"tabs"} />
    );
    expect(getByTestId("tabs")).toHaveAttribute(
      "data-orientation",
      "horizontal"
    );
  });

  (["horizontal", "vertical"] as TabsOrientation[]).forEach((orientation) => {
    it(`renders \`${orientation}\` orientation`, () => {
      const { getByTestId } = render_test_with_provider(
        <Tabs data-testid={"tabs"} orientation={orientation} />
      );

      expect(getByTestId("tabs")).toHaveAttribute(
        "data-orientation",
        orientation
      );
    });
  });
});
