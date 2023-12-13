import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_TAG } from "../../mocks";
import Tag from "./tag";

describe("<Tag />", () => {
  it("renders", () => {
    render_test_with_provider(<Tag tag={TEST_TAG} />);
  });

  it("renders when logged in", () => {
    render_test_with_provider(<Tag tag={TEST_TAG} />, {
      logged_in: true
    });
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(<Tag tag={TEST_TAG} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(<Tag tag={TEST_TAG} />, {
      logged_in: true
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
