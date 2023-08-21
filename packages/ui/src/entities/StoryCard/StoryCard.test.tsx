import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import { testStory } from "../../mocks";
import StoryCard from "./StoryCard";

describe("<StoryCard />", () => {
  it("renders", () => {
    renderTestWithProvider(<StoryCard story={testStory} />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <StoryCard story={testStory} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
