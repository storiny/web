import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_BLOG } from "../../mocks";
import Blog from "./blog";

describe("<Blog />", () => {
  it("renders", () => {
    render_test_with_provider(<Blog blog={TEST_BLOG} />, {
      logged_in: true
    });
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Blog blog={TEST_BLOG} />, {
      logged_in: true
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
