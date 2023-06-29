import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import { testStory } from "../../mocks";
import Story from "./Story";

describe("<Story />", () => {
  it("renders", () => {
    renderTestWithProvider(<Story enableSsr story={testStory} />);
  });

  it("renders when logged in", () => {
    renderTestWithProvider(<Story enableSsr story={testStory} />, {
      loggedIn: true,
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
        loggedIn: true,
      }
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
