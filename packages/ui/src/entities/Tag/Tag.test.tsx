import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import Tag from "./Tag";

describe("<Tag />", () => {
  it("renders", () => {
    renderTestWithProvider(
      <Tag followerCount={1} storyCount={1} value={"test"} />
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <Tag followerCount={1} storyCount={1} value={"test"} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders `HashIcon` decorator", () => {
    const { getByTestId } = renderTestWithProvider(
      <Tag value={"test"} withDecorator />
    );

    expect(getByTestId("hash-icon")).toBeInTheDocument();
  });

  it("renders follower and story count", () => {
    // Renders even when stats are zero
    const { getByLabelText, rerender } = renderTestWithProvider(
      <Tag followerCount={0} storyCount={0} value={"test"} />
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
    rerender(<Tag followerCount={1} storyCount={1} value={"test"} />);
    expect(getByLabelText("1 story")).toBeInTheDocument();
    expect(getByLabelText("1 follower")).toBeInTheDocument();

    // Renders with plural labels
    rerender(<Tag followerCount={2} storyCount={2} value={"test"} />);
    expect(getByLabelText("2 stories")).toBeInTheDocument();
    expect(getByLabelText("2 followers")).toBeInTheDocument();
  });

  it("renders only follower count and adds `data-first-child` to it", () => {
    const { getByLabelText } = renderTestWithProvider(
      <Tag followerCount={1} value={"test"} />
    );

    expect(getByLabelText("1 follower")).toHaveAttribute(
      "data-first-child",
      "true"
    );
  });
});
