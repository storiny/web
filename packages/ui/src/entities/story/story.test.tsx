import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import { testStory } from "../../mocks";
import Story from "./story";

describe("<Story />", () => {
  it("renders", () => {
    renderTestWithProvider(<Story enableSsr story={testStory} />);
  });

  it("renders when logged in", () => {
    renderTestWithProvider(<Story enableSsr story={testStory} />, {
      loggedIn: true
    });
  });

  it("renders extended mode", () => {
    renderTestWithProvider(<Story enableSsr isExtended story={testStory} />, {
      loggedIn: true
    });
  });

  it("renders draft mode", () => {
    renderTestWithProvider(<Story enableSsr isDraft story={testStory} />, {
      loggedIn: true
    });
  });

  it("renders deleted mode", () => {
    renderTestWithProvider(<Story enableSsr isDeleted story={testStory} />, {
      loggedIn: true
    });
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Story enableSsr story={testStory} />
    );
    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations when logged in", async () => {
    const { container } = renderTestWithProvider(
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
    const { container } = renderTestWithProvider(
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
    const { container } = renderTestWithProvider(
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
    const { container } = renderTestWithProvider(
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
