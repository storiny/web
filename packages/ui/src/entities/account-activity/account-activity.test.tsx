import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import { testAccountActivity } from "../../mocks";
import AccountActivity from "./account-activity";

describe("<AccountActivity />", () => {
  it("renders", () => {
    render_test_with_provider(
      <AccountActivity accountActivity={testAccountActivity} />
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <AccountActivity accountActivity={testAccountActivity} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
