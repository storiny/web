import { axe } from "@storiny/test-utils";
import { appleStock as apple_stock } from "@visx/mock-data";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import AreaChart from "./area-chart";

const DATA = apple_stock
  .slice(0, 90)
  .map(({ date, close }) => [date, Math.round(close)]) as [string, number][];

describe("<StatBlock />", () => {
  it("renders", () => {
    render_test_with_provider(
      <AreaChart
        accessibility_label={"test area chart"}
        data={DATA}
        label={"test"}
        style={{ width: 640, minHeight: 300 }}
      />
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <AreaChart
        accessibility_label={"test area chart"}
        data={DATA}
        label={"test"}
        style={{ width: 640, minHeight: 300 }}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
