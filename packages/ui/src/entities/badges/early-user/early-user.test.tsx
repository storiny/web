import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import EarlyUserBadge from "./early-user";

describe("<EarlyUserBadge />", () => {
  it("renders", () => {
    render_test_with_provider(<EarlyUserBadge />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<EarlyUserBadge />);
    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
