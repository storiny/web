import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import ResponseTextarea from "./ResponseTextarea";
import { ResponseTextareaProps } from "./ResponseTextarea.props";

describe("<ResponseTextarea />", () => {
  it("renders", () => {
    render_test_with_provider(<ResponseTextarea />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <ResponseTextarea placeholder={"Test placeholder"} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("passes props to the post button slot", () => {
    const { getByTestId } = render_test_with_provider(
      <ResponseTextarea
        postButtonProps={
          {
            "data-testid": "post-button"
          } as ResponseTextareaProps["postButtonProps"]
        }
      />
    );

    expect(getByTestId("post-button")).toBeInTheDocument();
  });
});
