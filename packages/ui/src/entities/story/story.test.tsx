import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import { testStory } from "../../mocks";
import Story from "./story";

describe("<Story />", () => {
  it("renders", () => {
    render_test_with_provider(<Story enableSsr story={testStory} />);
  });

  it("renders when logged in", () => {
    render_test_with_provider(<Story enableSsr story={testStory} />, {
      loggedIn: true
    });
  });

  it("renders extended mode", () => {
    render_test_with_provider(
      <Story enableSsr isExtended story={testStory} />,
      {
        loggedIn: true
      }
    );
  });

  it("renders draft mode", () => {
    render_test_with_provider(<Story enableSsr isDraft story={testStory} />, {
      loggedIn: true
    });
  });

  it("renders deleted mode", () => {
    render_test_with_provider(<Story enableSsr isDeleted story={testStory} />, {
      loggedIn: true
    });
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Story enableSsr story={testStory} />
    );
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = render_test_with_provider(
      <Story enableSsr story={testStory} />,
      {
        loggedIn: true
      }
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations in extended mode", async () => {
    const { container } = render_test_with_provider(
      <Story enableSsr isExtended story={testStory} />,
      {
        loggedIn: true
      }
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations in draft mode", async () => {
    const { container } = render_test_with_provider(
      <Story enableSsr isDraft story={testStory} />,
      {
        loggedIn: true
      }
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations in deleted mode", async () => {
    const { container } = render_test_with_provider(
      <Story enableSsr isDeleted story={testStory} />,
      {
        loggedIn: true
      }
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
