import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import { testAccountActivity } from "../../mocks";
import AccountActivity from "./account-activity";

describe("<AccountActivity />", () => {
  it("renders", () => {
    renderTestWithProvider(
      <AccountActivity accountActivity={testAccountActivity} />
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <AccountActivity accountActivity={testAccountActivity} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
