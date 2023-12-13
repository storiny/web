import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_STORY } from "../../mocks";
import StoryCard from "./story-card";

describe("<StoryCard />", () => {
  it("renders", () => {
    render_test_with_provider(<StoryCard story={TEST_STORY} />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <StoryCard story={TEST_STORY} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
