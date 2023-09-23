import { axe } from "@storiny/test-utils";
import { FriendRequest as TFriendRequest } from "@storiny/types";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import { testUser } from "../../mocks";
import FriendRequest from "./friend-request";

const testFriendRequest: TFriendRequest = {
  user: testUser,
  created_at: "2022-05-18T01:07:02.000Z",
  id: "0"
};

describe("<FriendRequest />", () => {
  it("renders", () => {
    renderTestWithProvider(<FriendRequest friendRequest={testFriendRequest} />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <FriendRequest friendRequest={testFriendRequest} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
