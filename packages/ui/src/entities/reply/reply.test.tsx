import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

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

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(
      <Reply enable_ssr reply={TEST_REPLY} />,
      {
        logged_in: true
      }
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations in static mode", async () => {
    const { container } = render_test_with_provider(
      <Reply enable_ssr is_static reply={TEST_REPLY} />,
      {
        logged_in: true
      }
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
