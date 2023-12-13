import { axe } from "@storiny/test-utils";
import { FriendRequest as TFriendRequest } from "@storiny/types";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_USER } from "../../mocks";
import FriendRequest from "./friend-request";

const TEST_FRIEND_REQUEST: TFriendRequest = {
  user: TEST_USER,
  created_at: "2022-05-18T01:07:02.000Z",
  id: "0"
};

describe("<FriendRequest />", () => {
  it("renders", () => {
    render_test_with_provider(
      <FriendRequest friend_request={TEST_FRIEND_REQUEST} />
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <FriendRequest friend_request={TEST_FRIEND_REQUEST} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
