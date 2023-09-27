import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import { testStory } from "../../mocks";
import StoryCard from "./StoryCard";

describe("<StoryCard />", () => {
  it("renders", () => {
    render_test_with_provider(<StoryCard story={testStory} />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <StoryCard story={testStory} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });
});
