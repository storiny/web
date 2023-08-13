import { RelationVisibility } from "@storiny/shared";
import { userEvent } from "@storiny/test-utils";
import { act, screen, waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import FollowingList from "./following-list";

describe("<FollowingList />", () => {
  it("submits correct form data", async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();
    renderTestWithProvider(
      <FollowingList
        following_list_visibility={RelationVisibility.EVERYONE}
        onSubmit={mockSubmit}
      />,
      {
        loggedIn: true
      }
    );

    await act(async () => {
      await user.click(screen.getByLabelText(/no one/i));
    });

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        "following-list": `${RelationVisibility.NONE}`
      });
    });
  });
});
