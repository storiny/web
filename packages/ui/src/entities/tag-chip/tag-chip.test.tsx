import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import TagChip from "./tag-chip";

describe("<TagChip />", () => {
  it("renders", () => {
    render_test_with_provider(
      <TagChip follower_count={1} story_count={1} value={"test"} />
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <TagChip follower_count={1} story_count={1} value={"test"} />
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders `HashIcon` decorator", () => {
    const { getByTestId } = render_test_with_provider(
      <TagChip value={"test"} with_decorator />
    );

    expect(getByTestId("hash-icon")).toBeInTheDocument();
  });

  it("renders follower and story count", () => {
    // Renders even when stats are zero
    const { getByLabelText, rerender } = render_test_with_provider(
      <TagChip follower_count={0} story_count={0} value={"test"} />
    );

    // Adds correct child attributes
    expect(getByLabelText("0 stories")).toHaveAttribute(
      "data-first-child",
      "true"
    );
    expect(getByLabelText("0 followers")).toHaveAttribute(
      "data-first-child",
      "false"
    );

    expect(getByLabelText("0 stories")).toBeInTheDocument();
    expect(getByLabelText("0 followers")).toBeInTheDocument();

    // Renders with singular labels
    rerender(<TagChip follower_count={1} story_count={1} value={"test"} />);
    expect(getByLabelText("1 story")).toBeInTheDocument();
    expect(getByLabelText("1 follower")).toBeInTheDocument();

    // Renders with plural labels
    rerender(<TagChip follower_count={2} story_count={2} value={"test"} />);
    expect(getByLabelText("2 stories")).toBeInTheDocument();
    expect(getByLabelText("2 followers")).toBeInTheDocument();
  });

  it("renders only follower count and adds `data-first-child` to it", () => {
    const { getByLabelText } = render_test_with_provider(
      <TagChip follower_count={1} value={"test"} />
    );

    expect(getByLabelText("1 follower")).toHaveAttribute(
      "data-first-child",
      "true"
    );
  });
});
