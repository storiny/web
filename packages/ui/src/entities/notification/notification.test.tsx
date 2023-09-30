import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_NOTIFICATION } from "../../mocks";
import Notification from "./notification";

describe("<Notification />", () => {
  it("renders", () => {
    render_test_with_provider(
      <Notification notification={TEST_NOTIFICATION} />
    );
  });

  it("renders when logged in", () => {
    render_test_with_provider(
      <Notification notification={TEST_NOTIFICATION} />,
      {
        logged_in: true
      }
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Notification notification={TEST_NOTIFICATION} />
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(
      <Notification notification={TEST_NOTIFICATION} />,
      {
        logged_in: true
      }
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
