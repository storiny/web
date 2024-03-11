import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import BlogContextProvider from "../../../../../apps/web/src/common/context/blog";
import { TEST_BLOG } from "../../mocks";
import BlogRightSidebar from "./blog-right-sidebar";

describe("<BlogRightSidebar />", () => {
  it("renders", () => {
    render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: null }}>
        <BlogRightSidebar force_mount />
      </BlogContextProvider>
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: null }}>
        <BlogRightSidebar force_mount />
      </BlogContextProvider>
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: null }}>
        <BlogRightSidebar force_mount />
      </BlogContextProvider>,
      {
        logged_in: true
      }
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
