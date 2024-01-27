import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import Mercator from "./mercator";

const DATA = [
  ["JP", 245],
  ["IN", 128],
  ["CA", 366],
  ["DK", 17],
  ["HU", 199],
  ["MX", 16]
] as [string, number][];

describe("<Mercator />", () => {
  it("renders", () => {
    render_test_with_provider(
      <Mercator
        accessibility_label={"test mercator"}
        data={DATA}
        label={{
          plural: "visitors",
          singular: "visitor"
        }}
        style={{ width: 640 }}
      />
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Mercator
        accessibility_label={"test mercator"}
        data={DATA}
        label={{
          plural: "visitors",
          singular: "visitor"
        }}
        style={{ width: 640 }}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
