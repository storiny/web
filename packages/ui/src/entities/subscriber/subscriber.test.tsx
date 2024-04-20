import { axe } from "@storiny/test-utils";
import { Subscriber as TSubscriber } from "@storiny/types";
import BlogContextProvider from "@storiny/web/src/common/context/blog";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_BLOG, TEST_USER } from "../../mocks";
import Subscriber from "./subscriber";

const TEST_SUBSCRIBER: TSubscriber = {
  email: TEST_USER.email!,
  created_at: "2022-05-18T01:07:02.000Z",
  blog_id: "0",
  id: "0"
};

describe("<Subscriber />", () => {
  it("renders", () => {
    render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: "owner" }}>
        <Subscriber subscriber={TEST_SUBSCRIBER} />
      </BlogContextProvider>
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: "owner" }}>
        <Subscriber subscriber={TEST_SUBSCRIBER} />
      </BlogContextProvider>
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
