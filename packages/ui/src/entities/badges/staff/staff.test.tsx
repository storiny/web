import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import StaffBadge from "./staff";

describe("<StaffBadge />", () => {
  it("renders", () => {
    render_test_with_provider(<StaffBadge />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<StaffBadge />);
    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
