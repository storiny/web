import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import EarlyUserBadge from "./EarlyUser";

describe("<EarlyUserBadge />", () => {
  it("renders", async () => {
    renderTestWithProvider(<EarlyUserBadge />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(<EarlyUserBadge />);
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
