import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Tabs from "./Tabs";
import { TabsOrientation } from "./Tabs.props";

describe("<Tabs />", () => {
  it("matches snapshot", () => {
    const { container } = renderTestWithProvider(<Tabs />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <Tabs as={"aside"} data-testid={"tabs"} />
    );
    expect(getByTestId("tabs").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders with horizontal orientation by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <Tabs data-testid={"tabs"} />
    );
    expect(getByTestId("tabs")).toHaveAttribute(
      "data-orientation",
      "horizontal"
    );
  });

  (["horizontal", "vertical"] as TabsOrientation[]).forEach((orientation) => {
    it(`renders \`${orientation}\` orientation`, () => {
      const { getByTestId } = renderTestWithProvider(
        <Tabs data-testid={"tabs"} orientation={orientation} />
      );

      expect(getByTestId("tabs")).toHaveAttribute(
        "data-orientation",
        orientation
      );
    });
  });
});
