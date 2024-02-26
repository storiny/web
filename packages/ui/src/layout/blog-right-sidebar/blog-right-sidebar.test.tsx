import { axe } from "@storiny/test-utils";
import BlogContext from "@storiny/web/src/app/blog/[slug]/context";
import { screen } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_BLOG } from "../../mocks";
import BlogRightSidebar from "./blog-right-sidebar";

describe("<BlogRightSidebar />", () => {
  it("renders", () => {
    render_test_with_provider(
      <BlogContext.Provider value={{ ...TEST_BLOG, role: null }}>
        <BlogRightSidebar force_mount />
      </BlogContext.Provider>
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <BlogContext.Provider value={{ ...TEST_BLOG, role: null }}>
        <BlogRightSidebar force_mount />
      </BlogContext.Provider>
    );
    await screen.findByRole("button", { name: /log in/i });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(
      <BlogContext.Provider value={{ ...TEST_BLOG, role: null }}>
        <BlogRightSidebar force_mount />
      </BlogContext.Provider>,
      {
        logged_in: true
      }
    );

    await screen.findByRole("button", { name: /write/i });
    expect(await axe(container)).toHaveNoViolations();
  });
});
