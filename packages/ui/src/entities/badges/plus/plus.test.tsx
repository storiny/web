import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import PlusBadge from "./plus";

describe("<PlusBadge />", () => {
  it("renders", () => {
    render_test_with_provider(<PlusBadge />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<PlusBadge />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
