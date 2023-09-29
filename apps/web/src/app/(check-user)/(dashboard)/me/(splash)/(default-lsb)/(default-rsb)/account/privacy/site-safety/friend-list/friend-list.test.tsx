import { RelationVisibility } from "@storiny/shared";
import { user_event } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../../../../../../../packages/ui/src/redux/test-utils";

import FriendList from "./friend-list";

describe("<FriendList />", () => {
  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <FriendList
        friend_list_visibility={RelationVisibility.EVERYONE}
        on_submit={mockSubmit}
      />,
      {
        logged_in: true
      }
    );

    await act(async () => {
      await user.click(screen.getByLabelText(/no one/i));
    });

    await wait_for(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        "friend-list": `${RelationVisibility.NONE}`
      });
    });
  });
});
