import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_COMMENT } from "../../mocks";
import Comment from "./comment";

describe("<Comment />", () => {
  it("renders", () => {
    render_test_with_provider(<Comment comment={TEST_COMMENT} enable_ssr />);
  });

  it("renders when logged in", () => {
    render_test_with_provider(<Comment comment={TEST_COMMENT} enable_ssr />, {
      logged_in: true
    });
  });

  it("renders extended mode", () => {
    render_test_with_provider(
      <Comment comment={TEST_COMMENT} enable_ssr is_extended />,
      {
        logged_in: true
      }
    );
  });

  it("renders static mode", () => {
    render_test_with_provider(
      <Comment comment={TEST_COMMENT} enable_ssr is_static />,
      {
        logged_in: true
      }
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Comment comment={TEST_COMMENT} enable_ssr />
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(
      <Comment comment={TEST_COMMENT} enable_ssr />,
      {
        logged_in: true
      }
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations in extended mode", async () => {
    const { container } = render_test_with_provider(
      <Comment comment={TEST_COMMENT} enable_ssr is_extended />,
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
      <Comment comment={TEST_COMMENT} enable_ssr is_static />,
      {
        logged_in: true
      }
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
