import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_STORY } from "../../mocks";
import Story from "./story";

describe("<Story />", () => {
  it("renders", () => {
    render_test_with_provider(<Story enable_ssr story={TEST_STORY} />);
  });

  it("renders when logged in", () => {
    render_test_with_provider(<Story enable_ssr story={TEST_STORY} />, {
      logged_in: true
    });
  });

  it("renders extended mode", () => {
    render_test_with_provider(
      <Story enable_ssr is_extended story={TEST_STORY} />,
      {
        logged_in: true
      }
    );
  });

  it("renders draft mode", () => {
    render_test_with_provider(
      <Story enable_ssr is_draft story={TEST_STORY} />,
      {
        logged_in: true
      }
    );
  });

  it("renders deleted mode", () => {
    render_test_with_provider(
      <Story enable_ssr is_deleted story={TEST_STORY} />,
      {
        logged_in: true
      }
    );
  });

  it("renders contributable mode", () => {
    render_test_with_provider(
      <Story enable_ssr is_contributable story={TEST_STORY} />,
      {
        logged_in: true
      }
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Story enable_ssr story={TEST_STORY} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(
      <Story enable_ssr story={TEST_STORY} />,
      {
        logged_in: true
      }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations in extended mode", async () => {
    const { container } = render_test_with_provider(
      <Story enable_ssr is_extended story={TEST_STORY} />,
      {
        logged_in: true
      }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations in draft mode", async () => {
    const { container } = render_test_with_provider(
      <Story enable_ssr is_draft story={TEST_STORY} />,
      {
        logged_in: true
      }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations in deleted mode", async () => {
    const { container } = render_test_with_provider(
      <Story enable_ssr is_deleted story={TEST_STORY} />,
      {
        logged_in: true
      }
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations in contributable mode", async () => {
    const { container } = render_test_with_provider(
      <Story enable_ssr is_contributable story={TEST_STORY} />,
      {
        logged_in: true
      }
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
