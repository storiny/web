import { user_event } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../../../../../../packages/ui/src/redux/test-utils";

import MailNotifications from "./mail-notifications";

describe("<MailNotifications />", () => {
  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <MailNotifications
        mail_digest
        mail_features_and_updates
        mail_login_activity
        mail_newsletters
        on_submit={mockSubmit}
      />,
      {
        logged_in: true
      }
    );

    await act(async () => {
      await user.click(screen.getByLabelText(/new features & updates/i));
    });

    await wait_for(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        "features-and-updates": false,
        "login-activity": true,
        digest: true,
        newsletters: true
      });
    });
  });
});
