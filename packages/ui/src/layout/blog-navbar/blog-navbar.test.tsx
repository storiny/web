import { axe } from "@storiny/test-utils";
import BlogContext from "@storiny/web/src/common/context/blog";
import { screen } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_BLOG } from "../../mocks";
import BlogNavbar from "./blog-navbar";

describe("<BlogNavbar />", () => {
  it("renders", () => {
    render_test_with_provider(
      <BlogContext.Provider value={{ ...TEST_BLOG, role: null }}>
        <BlogNavbar />
      </BlogContext.Provider>
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <BlogContext.Provider value={{ ...TEST_BLOG, role: null }}>
        <BlogNavbar />
      </BlogContext.Provider>
    );
    await screen.findByRole("button", { name: /log in/i });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(
      <BlogContext.Provider value={{ ...TEST_BLOG, role: null }}>
        <BlogNavbar />
      </BlogContext.Provider>,
      {
        logged_in: true
      }
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
