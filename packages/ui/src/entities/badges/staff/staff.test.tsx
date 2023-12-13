import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import StaffBadge from "./staff";

describe("<StaffBadge />", () => {
  it("renders", () => {
    render_test_with_provider(<StaffBadge />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<StaffBadge />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
