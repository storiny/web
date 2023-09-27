import { axe } from "@storiny/test-utils";
import { FriendRequest as TFriendRequest } from "@storiny/types";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import { testUser } from "../../mocks";
import FriendRequest from "./friend-request";

const testFriendRequest: TFriendRequest = {
  user: testUser,
  created_at: "2022-05-18T01:07:02.000Z",
  id: "0"
};

describe("<FriendRequest />", () => {
  it("renders", () => {
    render_test_with_provider(
      <FriendRequest friendRequest={testFriendRequest} />
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <FriendRequest friendRequest={testFriendRequest} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
