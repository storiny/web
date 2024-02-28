import { axe } from "@storiny/test-utils";
import BlogContext from "@storiny/web/src/common/context/blog";
import { screen } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_BLOG } from "../../mocks";
import BlogLeftSidebar from "./blog-left-sidebar";

describe("<BlogLeftSidebar />", () => {
  it("renders", () => {
    render_test_with_provider(
      <BlogContext.Provider value={{ ...TEST_BLOG, role: null }}>
        <BlogLeftSidebar force_mount />
      </BlogContext.Provider>
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <BlogContext.Provider value={{ ...TEST_BLOG, role: null }}>
        <BlogLeftSidebar force_mount />
      </BlogContext.Provider>
    );
    await screen.findByRole("button", { name: /log in/i });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(
      <BlogContext.Provider value={{ ...TEST_BLOG, role: null }}>
        <BlogLeftSidebar force_mount />
      </BlogContext.Provider>,
      {
        logged_in: true
      }
    );

    await screen.findByRole("button", { name: /write/i });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders logged in state", () => {
    render_test_with_provider(
      <BlogContext.Provider value={{ ...TEST_BLOG, role: null }}>
        <BlogLeftSidebar force_mount />
      </BlogContext.Provider>,
      {
        logged_in: true
      }
    );
    expect(screen.getByRole("button", { name: /write/i })).toBeInTheDocument();
  });

  it("does not render persona when logged out", () => {
    render_test_with_provider(
      <BlogContext.Provider value={{ ...TEST_BLOG, role: null }}>
        <BlogLeftSidebar force_mount />
      </BlogContext.Provider>
    );
    expect(screen.queryByTestId("lsb-banner")).not.toBeInTheDocument();
  });

  it("renders persona when logged in", async () => {
    render_test_with_provider(
      <BlogContext.Provider value={{ ...TEST_BLOG, role: null }}>
        <BlogLeftSidebar force_mount />
      </BlogContext.Provider>,
      {
        logged_in: true
      }
    );
    await screen.findByTestId("lsb-banner");
    expect(screen.getByTestId("lsb-banner")).toBeInTheDocument();
  });
});
