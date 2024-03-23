import { RelationVisibility } from "@storiny/shared";
import { user_event } from "@storiny/test-utils";
import { screen } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import FriendList from "./friend-list";

describe("<FriendList />", () => {
  it("submits correct form data", async () => {
    const mock_submit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <FriendList
        friend_list_visibility={RelationVisibility.EVERYONE}
        on_submit={mock_submit}
      />,
      {
        logged_in: true
      }
    );

    await user.click(screen.getByLabelText(/no one/i));

    expect(mock_submit).toHaveBeenCalledWith({
      friend_list: `${RelationVisibility.NONE}`
    });
  });
});
