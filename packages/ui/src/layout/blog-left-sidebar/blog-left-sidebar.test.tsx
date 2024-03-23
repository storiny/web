import { axe } from "@storiny/test-utils";
import { screen } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import BlogContextProvider from "../../../../../apps/web/src/common/context/blog";
import { TEST_BLOG } from "../../mocks";
import BlogLeftSidebar from "./blog-left-sidebar";

describe("<BlogLeftSidebar />", () => {
  it("renders", () => {
    render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: null }}>
        <BlogLeftSidebar force_mount />
      </BlogContextProvider>
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: null }}>
        <BlogLeftSidebar force_mount />
      </BlogContextProvider>
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: null }}>
        <BlogLeftSidebar force_mount />
      </BlogContextProvider>,
      {
        logged_in: true
      }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not render persona when logged out", () => {
    render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: null }}>
        <BlogLeftSidebar force_mount />
      </BlogContextProvider>
    );

    expect(screen.queryByTestId("lsb-banner")).not.toBeInTheDocument();
  });

  it("renders persona when logged in", async () => {
    render_test_with_provider(
      <BlogContextProvider value={{ ...TEST_BLOG, role: null }}>
        <BlogLeftSidebar force_mount />
      </BlogContextProvider>,
      {
        logged_in: true
      }
    );

    await screen.findByTestId("lsb-banner");
    expect(screen.getByTestId("lsb-banner")).toBeInTheDocument();
  });
});
