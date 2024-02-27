import { axe } from "@storiny/test-utils";
import { BlogRequest as TBlogRequest } from "@storiny/types";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_BLOG } from "../../mocks";
import BlogRequest from "./blog-request";

const TEST_BLOG_REQUEST: TBlogRequest = {
  blog: TEST_BLOG,
  role: "editor",
  created_at: "2022-05-18T01:07:02.000Z",
  id: "0"
};

describe("<BlogRequest />", () => {
  it("renders", () => {
    render_test_with_provider(<BlogRequest blog_request={TEST_BLOG_REQUEST} />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <BlogRequest blog_request={TEST_BLOG_REQUEST} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
