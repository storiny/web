import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import ResponseTextarea from "./response-textarea";
import { ResponseTextareaProps } from "./response-textarea.props";

describe("<ResponseTextarea />", () => {
  it("renders", () => {
    render_test_with_provider(<ResponseTextarea />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <ResponseTextarea placeholder={"Test placeholder"} />
    );

    await wait_for(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("passes props to the post button slot", () => {
    const { getByTestId } = render_test_with_provider(
      <ResponseTextarea
        post_button_props={
          {
            "data-testid": "post-button"
          } as ResponseTextareaProps["post_button_props"]
        }
      />
    );

    expect(getByTestId("post-button")).toBeInTheDocument();
  });
});
