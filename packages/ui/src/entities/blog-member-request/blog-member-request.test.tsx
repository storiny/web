import { axe } from "@storiny/test-utils";
import { FriendRequest as TFriendRequest } from "@storiny/types";
import BlogContextProvider from "@storiny/web/src/common/context/blog";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_BLOG, TEST_USER } from "../../mocks";
import BlogMemberRequest from "./blog-member-request";

const TEST_MEMBER_REQUEST: TFriendRequest = {
  user: TEST_USER,
  created_at: "2022-05-18T01:07:02.000Z",
  id: "0"
};

describe("<BlogMemberRequest />", () => {
  it("renders", () => {
    render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: "editor" }}>
        <BlogMemberRequest
          blog_member_request={TEST_MEMBER_REQUEST}
          role={"editor"}
        />
      </BlogContextProvider>
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: "editor" }}>
        <BlogMemberRequest
          blog_member_request={TEST_MEMBER_REQUEST}
          role={"editor"}
        />
      </BlogContextProvider>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
