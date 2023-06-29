import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import StaffBadge from "./Staff";

describe("<StaffBadge />", () => {
  it("renders", async () => {
    renderTestWithProvider(<StaffBadge />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<StaffBadge />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
