import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import EarlyUserBadge from "./early-user";

describe("<EarlyUserBadge />", () => {
  it("renders", () => {
    render_test_with_provider(<EarlyUserBadge />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<EarlyUserBadge />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
