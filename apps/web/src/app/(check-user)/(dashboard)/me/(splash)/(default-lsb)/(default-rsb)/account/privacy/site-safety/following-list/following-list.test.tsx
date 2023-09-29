import { RelationVisibility } from "@storiny/shared";
import { user_event } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "../../../../../../../../../../../../../../packages/ui/src/redux/test-utils";

import FollowingList from "./following-list";

describe("<FollowingList />", () => {
  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = user_event.setup();
    render_test_with_provider(
      <FollowingList
        following_list_visibility={RelationVisibility.EVERYONE}
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
        "following-list": `${RelationVisibility.NONE}`
      });
    });
  });
});
