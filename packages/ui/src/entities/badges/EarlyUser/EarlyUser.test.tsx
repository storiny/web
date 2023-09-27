import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import EarlyUserBadge from "./EarlyUser";

describe("<EarlyUserBadge />", () => {
  it("renders", () => {
    render_test_with_provider(<EarlyUserBadge />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<EarlyUserBadge />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
