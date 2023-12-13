import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_ACCOUNT_ACTIVITY } from "../../mocks";
import AccountActivity from "./account-activity";

describe("<AccountActivity />", () => {
  it("renders", () => {
    render_test_with_provider(
      <AccountActivity account_activity={TEST_ACCOUNT_ACTIVITY} />
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <AccountActivity account_activity={TEST_ACCOUNT_ACTIVITY} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
