import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import AreaChart from "./area-chart";
import { AreaChartProps } from "./area-chart.props";

describe("<StatBlock />", () => {
  it("renders", () => {
    render_test_with_provider(<AreaChart label={"test"} value={"0"} />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <AreaChart
        caption={"test"}
        caption_icon={"increment"}
        label={"test"}
        value={"0"}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders custom caption icon", () => {
    const { getByTestId } = render_test_with_provider(
      <AreaChart
        caption={"test"}
        caption_icon={<span data-testid={"icon"} />}
        label={"test"}
        value={"0"}
      />
    );

    expect(getByTestId("icon")).toBeInTheDocument();
  });

  it("passes props to the component slots", () => {
    const { getByTestId } = render_test_with_provider(
      <AreaChart
        caption={"test"}
        component_props={
          {
            label: { "data-testid": "label" },
            value: { "data-testid": "value" },
            caption: { "data-testid": "caption" }
          } as AreaChartProps["component_props"]
        }
        label={"test"}
        value={"0"}
      />
    );

    ["label", "value", "caption"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
