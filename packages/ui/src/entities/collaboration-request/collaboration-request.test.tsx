import { axe } from "@storiny/test-utils";
import { CollaborationRequest as TCollaborationRequest } from "@storiny/types";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_STORY, TEST_USER } from "../../mocks";
import CollaborationRequest from "./collaboration-request";

const TEST_COLLABORATION_REQUEST: TCollaborationRequest = {
  user: TEST_USER,
  story: TEST_STORY,
  role: "editor",
  created_at: "2022-05-18T01:07:02.000Z",
  id: "0"
};

describe("<CollaborationRequest />", () => {
  it("renders", () => {
    render_test_with_provider(
      <CollaborationRequest
        collaboration_request={TEST_COLLABORATION_REQUEST}
      />
    );
  });

  it("renders without user", () => {
    render_test_with_provider(
      <CollaborationRequest
        collaboration_request={{ ...TEST_COLLABORATION_REQUEST, user: null }}
      />
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <CollaborationRequest
        collaboration_request={TEST_COLLABORATION_REQUEST}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
