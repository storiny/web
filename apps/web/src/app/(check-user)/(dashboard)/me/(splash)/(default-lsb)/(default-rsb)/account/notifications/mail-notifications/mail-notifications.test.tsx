import { user_event } from "@storiny/test-utils";
import { screen, waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import MailNotifications from "./mail-notifications";

describe("<MailNotifications />", () => {
  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <MailNotifications
        mail_digest
        mail_features_and_updates
        mail_login_activity
        mail_newsletters
        on_submit={mock_submit}
      />,
      {
        logged_in: true
      }
    );

    await user.click(screen.getByLabelText(/new features & updates/i));

    await wait_for(() => {
      expect(mock_submit).toHaveBeenCalledWith({
        features_and_updates: false,
        login_activity: true,
        digest: true,
        newsletters: true
      });
    });
  });
});
