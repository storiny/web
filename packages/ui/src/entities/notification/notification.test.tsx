import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import { testNotification } from "../../mocks";
import Notification from "./notification";

describe("<Notification />", () => {
  it("renders", () => {
    renderTestWithProvider(<Notification notification={testNotification} />);
  });

  it("renders when logged in", () => {
    renderTestWithProvider(<Notification notification={testNotification} />, {
      loggedIn: true
    });
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Notification notification={testNotification} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = renderTestWithProvider(
      <Notification notification={testNotification} />,
      {
        loggedIn: true
      }
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
