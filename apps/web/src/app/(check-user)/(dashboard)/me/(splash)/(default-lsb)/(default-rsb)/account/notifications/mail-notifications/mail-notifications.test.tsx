import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import MailNotifications from "./mail-notifications";

describe("<MailNotifications />", () => {
  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(
      <MailNotifications
        mail_digest
        mail_features_and_updates
        mail_login_activity
        mail_newsletters
        onSubmit={mockSubmit}
      />,
      {
        loggedIn: true
      }
    );

    await act(async () => {
      await user.click(screen.getByLabelText(/new features & updates/i));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        "features-and-updates": false,
        "login-activity": true,
        digest: true,
        newsletters: true
      });
    });
  });
});
