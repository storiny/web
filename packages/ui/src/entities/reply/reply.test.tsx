import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_REPLY } from "../../mocks";
import Reply from "./reply";

describe("<Reply />", () => {
  it("renders", () => {
    render_test_with_provider(<Reply enable_ssr reply={TEST_REPLY} />);
  });

  it("renders when logged in", () => {
    render_test_with_provider(<Reply enable_ssr reply={TEST_REPLY} />, {
      logged_in: true
    });
  });

  it("renders static mode", () => {
    render_test_with_provider(
      <Reply enable_ssr is_static reply={TEST_REPLY} />,
      {
        logged_in: true
      }
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Reply enable_ssr reply={TEST_REPLY} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(
      <Reply enable_ssr reply={TEST_REPLY} />,
      {
        logged_in: true
      }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations in static mode", async () => {
    const { container } = render_test_with_provider(
      <Reply enable_ssr is_static reply={TEST_REPLY} />,
      {
        logged_in: true
      }
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
