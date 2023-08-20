import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import ResponseTextarea from "./ResponseTextarea";
import { ResponseTextareaProps } from "./ResponseTextarea.props";

describe("<ResponseTextarea />", () => {
  it("renders", () => {
    renderTestWithProvider(<ResponseTextarea />);
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
      <ResponseTextarea placeholder={"Test placeholder"} />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("passes props to the post button slot", () => {
    const { getByTestId } = renderTestWithProvider(
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
