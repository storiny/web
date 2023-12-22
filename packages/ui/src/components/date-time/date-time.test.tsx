import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import DateTime from "./date-time";

describe("<DateTime />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <DateTime date={"2023-12-22T12:52:18.475Z"} />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <DateTime date={"2023-12-22T12:52:18.475Z"} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
