import { axe } from "@storiny/test-utils";
import React from "react";

import HomeIcon from "~/icons/home";
import { render_test_with_provider } from "~/redux/test-utils";

import StatBars from "./stat-bars";

const DATA = [
  ["Internal", 3002],
  ["google.com", 1023],
  ["bing.com", 393],
  ["example.com", 232],
  ["twitter.com", 192]
] as [string, number][];

describe("<StatBlock />", () => {
  it("renders", () => {
    render_test_with_provider(
      <StatBars
        data={DATA}
        icon_map={{
          Internal: <HomeIcon />
        }}
        max_value={500}
      />
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <StatBars
        data={DATA}
        icon_map={{
          Internal: <HomeIcon />
        }}
        max_value={500}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
