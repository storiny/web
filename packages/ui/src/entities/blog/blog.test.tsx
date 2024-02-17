import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_USER } from "../../mocks";
import User from "./blog";

describe("<User />", () => {
  it("renders", () => {
    render_test_with_provider(<User user={TEST_USER} />);
  });

  it("renders when logged in", () => {
    render_test_with_provider(<User user={TEST_USER} />, {
      logged_in: true
    });
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<User user={TEST_USER} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(<User user={TEST_USER} />, {
      logged_in: true
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
